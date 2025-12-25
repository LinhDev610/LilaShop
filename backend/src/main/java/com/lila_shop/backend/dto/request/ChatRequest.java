package com.lila_shop.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatRequest {
    @NotBlank(message = "MESSAGE_NOT_BLANK")
    String message;
    String sessionId;
}
