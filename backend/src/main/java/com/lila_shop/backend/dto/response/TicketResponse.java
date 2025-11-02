package com.lila_shop.backend.dto.response;

import java.time.LocalDateTime;

import com.lila_shop.backend.enums.TicketAssignee;
import com.lila_shop.backend.enums.TicketStatus;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketResponse {
    String id;
    String orderCode;
    String customerName;
    String email;
    String phone;
    String content;
    String handlerNote;
    TicketStatus status;
    TicketAssignee assignedTo;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
