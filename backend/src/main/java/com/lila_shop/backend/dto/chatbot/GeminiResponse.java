package com.lila_shop.backend.dto.chatbot;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GeminiResponse {
    List<GeminiCandidate> candidates;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GeminiCandidate {
        GeminiContent content;
        String finishReason;
    }
}
