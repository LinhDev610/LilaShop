package com.lila_shop.backend.controller;

import com.lila_shop.backend.dto.request.ApiResponse;
import com.lila_shop.backend.dto.request.SendMessageRequest;
import com.lila_shop.backend.dto.response.ChatConversationResponse;
import com.lila_shop.backend.dto.response.ChatMessageResponse;
import com.lila_shop.backend.service.ChatService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ChatController {

    ChatService chatService;

    @PostMapping("/send")
    public ApiResponse<ChatMessageResponse> sendMessage(@RequestBody SendMessageRequest request) {
        log.info("Sending chat message from user to {}", request.getReceiverId());
        ChatMessageResponse response = chatService.sendMessage(request);
        return ApiResponse.<ChatMessageResponse>builder()
                .result(response)
                .build();
    }

    @GetMapping("/conversations")
    public ApiResponse<List<ChatConversationResponse>> getConversations() {
        log.info("Getting all conversations for current user");
        List<ChatConversationResponse> conversations = chatService.getConversations();
        return ApiResponse.<List<ChatConversationResponse>>builder()
                .result(conversations)
                .build();
    }

    @GetMapping("/conversation/{partnerId}")
    public ApiResponse<List<ChatMessageResponse>> getConversation(@PathVariable String partnerId) {
        log.info("Getting conversation with partner: {}", partnerId);
        List<ChatMessageResponse> messages = chatService.getConversation(partnerId);
        return ApiResponse.<List<ChatMessageResponse>>builder()
                .result(messages)
                .build();
    }

    @PostMapping("/conversation/{partnerId}/read")
    public ApiResponse<String> markAsRead(@PathVariable String partnerId) {
        log.info("Marking conversation as read with partner: {}", partnerId);
        chatService.markAsRead(partnerId);
        return ApiResponse.<String>builder()
                .result("Đã đánh dấu đã đọc")
                .build();
    }

    @GetMapping("/unread-count")
    public ApiResponse<Long> getUnreadCount() {
        Long count = chatService.getUnreadCount();
        return ApiResponse.<Long>builder()
                .result(count)
                .build();
    }

    @GetMapping("/customer-support")
    public ApiResponse<com.lila_shop.backend.dto.response.UserResponse> getFirstCustomerSupport() {
        log.info("Getting first customer support for customer");
        com.lila_shop.backend.dto.response.UserResponse cs = chatService.getFirstCustomerSupport();
        return ApiResponse.<com.lila_shop.backend.dto.response.UserResponse>builder()
                .result(cs)
                .build();
    }
}

