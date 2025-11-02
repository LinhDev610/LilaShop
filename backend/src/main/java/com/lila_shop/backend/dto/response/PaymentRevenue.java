package com.lila_shop.backend.dto.response;

import com.lila_shop.backend.enums.PaymentMethod;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentRevenue {
    PaymentMethod paymentMethod;
    Double total;
}
