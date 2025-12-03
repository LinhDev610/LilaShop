package com.lila_shop.backend.dto.response;

import com.lila_shop.backend.enums.TicketAssignee;
import com.lila_shop.backend.enums.TicketStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

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
    String handlerId;
    String handlerName;
    TicketStatus status;
    TicketAssignee assignedTo;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
