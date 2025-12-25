package com.lila_shop.backend.controller;

import com.lila_shop.backend.dto.request.ApiResponse;
import com.lila_shop.backend.dto.request.ChatRequest;
import com.lila_shop.backend.dto.response.ChatResponse;
import com.lila_shop.backend.service.ChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@Slf4j
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/ask")
    public ApiResponse<ChatResponse> ask(@Valid @RequestBody ChatRequest request) {
        log.info("Chatbot request received: {}", request.getMessage());
        ChatResponse response = chatbotService.ask(request);
        return ApiResponse.<ChatResponse>builder()
                .result(response)
                .build();
    }
}
