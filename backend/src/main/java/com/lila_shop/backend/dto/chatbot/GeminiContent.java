package com.lila_shop.backend.dto.chatbot;

import java.util.List;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GeminiContent {
    String role;
    List<GeminiPart> parts;

    public GeminiContent(String role, String text) {
        this.role = role;
        this.parts = List.of(new GeminiPart(text));
    }
}
