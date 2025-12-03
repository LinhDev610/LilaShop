package com.lila_shop.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TicketCreationRequest {

    @NotBlank
    String orderCode;

    @NotBlank
    String customerName;

    @Email
    @NotBlank
    String email;

    @NotBlank
    String phone;

    @NotBlank
    String content;
}
