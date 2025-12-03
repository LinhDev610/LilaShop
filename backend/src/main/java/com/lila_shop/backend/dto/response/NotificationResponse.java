package com.lila_shop.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationResponse {

    String id;
    String title;
    String message;
    String type;
    String link;
    Boolean isRead;
    LocalDateTime createdAt;
    LocalDateTime readAt;

    // User info
    Set<String> userIds;
    Set<String> userNames;
}
