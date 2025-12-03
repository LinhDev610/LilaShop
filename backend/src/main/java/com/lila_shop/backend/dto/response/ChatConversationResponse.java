package com.lila_shop.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatConversationResponse {
    String partnerId;
    String partnerName;
    String partnerEmail;
    String lastMessage;
    LocalDateTime lastMessageTime;
    Long unreadCount;
    List<ChatMessageResponse> messages;
}




