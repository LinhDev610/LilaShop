package com.lila_shop.backend.service;

import com.lila_shop.backend.dto.chatbot.*;
import com.lila_shop.backend.dto.request.ChatRequest;
import com.lila_shop.backend.dto.response.ChatResponse;
import com.lila_shop.backend.exception.AppException;
import com.lila_shop.backend.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class ChatbotService {

    private final WebClient.Builder webClientBuilder;

    @Value("${gemini.apiKey:}")
    private String apiKey;

    public ChatResponse ask(ChatRequest request) {
        String sessionId = request.getSessionId();
        if (sessionId == null || sessionId.isBlank()) {
            sessionId = UUID.randomUUID().toString();
        }

        return ChatResponse.builder()
                .reply("Chào bạn! Tôi là Lila AI. Rất vui được hỗ trợ bạn.")
                .sessionId(sessionId)
                .build();
    }
}
