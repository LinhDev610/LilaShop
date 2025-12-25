package com.lila_shop.backend.service;

import com.lila_shop.backend.dto.chatbot.*;
import com.lila_shop.backend.dto.request.ChatRequest;
import com.lila_shop.backend.dto.response.ChatResponse;
import com.lila_shop.backend.dto.response.ProductResponse;
import com.lila_shop.backend.exception.AppException;
import com.lila_shop.backend.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatbotService {

    private static final String GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
    private static final long PRODUCTS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
    private static final int MAX_HISTORY_MESSAGES = 10; // Keep history small for token optimization

    private final WebClient ghnWebClient; // Using the existing bean for simplicity if builder isn't enough, or just use
                                          // Builder
    private final ProductService productService;

    @Value("${gemini.apiKey:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String model;

    // Cache for product information
    private String cachedProductsContext = "";
    private long lastProductsCacheUpdate = 0;

    // In-memory conversation history (SessionID -> List of Messages)
    private final Map<String, List<GeminiContent>> conversationHistory = new ConcurrentHashMap<>();

    // Strict System Prompt for Scope Restriction
    private static final String SYSTEM_PROMPT_BASE = """
            Bạn là trợ lý AI chuyên nghiệp của Lila Shop - cửa hàng mỹ phẩm cao cấp.
            Tên bạn là Lila Assistant.

            VAI TRÒ: Tư vấn làm đẹp, chăm sóc da (skincare), trang điểm (makeup), và thông tin sản phẩm có tại Lila Shop.

            GIỚI HẠN PHẠM VI (CỰC KỲ QUAN TRỌNG):
            1. CHỈ TRẢ LỜI các câu hỏi liên quan đến: LÀM ĐẸP, MỸ PHẨM, CHĂM SÓC DA/TÓC/CƠ THỂ, THÔNG TIN SẢN PHẨM CỦA LILA SHOP.
            2. TUYỆT ĐỐI KHÔNG TRẢ LỜI các câu hỏi về: Toán học, lập trình, chính trị, tôn giáo, thời tiết, tin tức thế giới, kiến thức tổng hợp không liên quan mỹ phẩm, hoặc yêu cầu giải thích code, viết văn, dịch thuật ngoài lề.
            3. PHẢN HỒI KHI SAI PHẠM: Nếu khách hàng hỏi bất kỳ nội dung nào ngoài phạm vi trên, bạn CHỈ ĐƯỢC PHÉP TRẢ LỜI DUY NHẤT câu sau: "Xin lỗi, tôi là trợ lý chuyên về mỹ phẩm của Lila Shop. Tôi chỉ có thể giúp bạn các vấn đề về làm đẹp và sản phẩm của shop. Bạn có muốn tư vấn về sản phẩm nào không?"

            QUY TẮC TRÌNH BÀY:
            - Ngôn ngữ: Tiếng Việt lịch sự, thân thiện.
            - Định dạng: Chỉ văn bản thuần (Plain Text). KHÔNG dùng Markdown (*, **, #, `).
            - Link sản phẩm: Nếu giới thiệu sản phẩm cụ thể, kèm link định dạng: [LINK:/product/{id}]. Ví dụ: [LINK:/product/pro123]
            """;

    private static final List<String> OFF_TOPIC_KEYWORDS = List.of(
            "code", "java", "python", "javascript", "c++", "toán", "giải bài", "lập trình",
            "thời tiết", "chính trị", "tôn giáo", "bitcoin", "crypto");

    public ChatResponse ask(ChatRequest request) {
        String msg = request.getMessage().toLowerCase();

        // Local Pre-filtering (Save Tokens)
        if (isClearlyOffTopic(msg)) {
            return ChatResponse.builder()
                    .reply("Xin lỗi, tôi là trợ lý chuyên về mỹ phẩm của Lila Shop. Tôi chỉ có thể giúp bạn các vấn đề về làm đẹp và sản phẩm của shop. Bạn có muốn tư vấn về sản phẩm nào không?")
                    .sessionId(request.getSessionId() != null ? request.getSessionId() : UUID.randomUUID().toString())
                    .build();
        }

        try {
            String sessionId = request.getSessionId();
            if (sessionId == null || sessionId.isBlank()) {
                sessionId = UUID.randomUUID().toString();
            }

            List<GeminiContent> history = conversationHistory.getOrDefault(sessionId, new ArrayList<>());

            // Re-fetch products context if needed
            refreshProductsContextIfNeeded();

            // Build request with limited history for token optimization
            GeminiRequest geminiRequest = buildGeminiRequest(request.getMessage(), history);

            // Call Gemini
            GeminiResponse response = callGeminiApi(geminiRequest);

            if (response != null && response.getCandidates() != null && !response.getCandidates().isEmpty()) {
                String replyText = response.getCandidates().get(0).getContent().getParts().get(0).getText();

                // Save to history
                history.add(new GeminiContent("user", request.getMessage()));
                history.add(new GeminiContent("model", replyText));

                // Keep history manageable (last N messages)
                if (history.size() > MAX_HISTORY_MESSAGES) {
                    history = new ArrayList<>(history.subList(history.size() - MAX_HISTORY_MESSAGES, history.size()));
                }
                conversationHistory.put(sessionId, history);

                return ChatResponse.builder()
                        .reply(replyText)
                        .sessionId(sessionId)
                        .build();
            }

            return ChatResponse.builder()
                    .reply("Xin lỗi, hiện tại tôi không thể xử lý yêu cầu của bạn. Vui lòng thử lại sau.")
                    .sessionId(sessionId)
                    .build();

        } catch (Exception e) {
            log.error("Error in chatbot service", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    private boolean isClearlyOffTopic(String message) {
        for (String keyword : OFF_TOPIC_KEYWORDS) {
            if (message.contains(keyword))
                return true;
        }
        return false;
    }

    private void refreshProductsContextIfNeeded() {
        if (System.currentTimeMillis() - lastProductsCacheUpdate < PRODUCTS_CACHE_TTL
                && !cachedProductsContext.isEmpty()) {
            return;
        }

        try {
            List<ProductResponse> activeProducts = productService.getActiveProducts();
            StringBuilder sb = new StringBuilder("DANH SÁCH SẢN PHẨM HIỆN CÓ TẠI LILA SHOP:\n");
            for (ProductResponse p : activeProducts) {
                sb.append("- ").append(p.getName())
                        .append(" (ID: ").append(p.getId()).append(")")
                        .append(". Giá: ").append(p.getPrice()).append(" VND")
                        .append(". Danh mục: ").append(p.getCategoryName())
                        .append("\n");
            }
            cachedProductsContext = sb.toString();
            lastProductsCacheUpdate = System.currentTimeMillis();
            log.info("Products context for AI refreshed. Count: {}", activeProducts.size());
        } catch (Exception e) {
            log.error("Failed to refresh products context", e);
        }
    }

    private GeminiRequest buildGeminiRequest(String message, List<GeminiContent> history) {
        List<GeminiContent> contents = new ArrayList<>();

        // Add System Prompt as the first user message (Gemini 1.5 doesn't have system
        // role in beta easily, or use specific config)
        // Combining system prompt with current context
        String fullSystemPrompt = SYSTEM_PROMPT_BASE + "\n\n" + cachedProductsContext;

        // If history is empty, prepend system prompt to the first message
        if (history.isEmpty()) {
            contents.add(new GeminiContent("user", fullSystemPrompt + "\n\nKhách: " + message));
        } else {
            // If they have history, we might want to remind the AI of its role or just send
            // the history
            // For token efficiency, we send the system prompt once at the very beginning of
            // the history or as a prefix
            contents.add(new GeminiContent("user", "ROLE AND CONTEXT:\n" + fullSystemPrompt));
            contents.addAll(history);
            contents.add(new GeminiContent("user", message));
        }

        return GeminiRequest.builder()
                .contents(contents)
                .build();
    }

    private GeminiResponse callGeminiApi(GeminiRequest request) {
        if (apiKey == null || apiKey.isEmpty()) {
            log.error("Gemini API Key is missing!");
            return null;
        }

        String url = String.format("%s/models/%s:generateContent?key=%s", GEMINI_API_BASE_URL, model, apiKey);

        WebClient webClient = WebClient.builder().build(); // Use a local builder for simplicity

        try {
            return webClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(GeminiResponse.class)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("Gemini API error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            log.error("Unexpected error calling Gemini API", e);
            return null;
        }
    }
}
