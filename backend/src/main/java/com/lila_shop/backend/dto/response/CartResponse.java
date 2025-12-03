package com.lila_shop.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartResponse {
    String id;
    Double subtotal;
    String appliedVoucherCode;
    Double voucherDiscount;
    Double totalAmount;
    List<CartItemResponse> items;
}
