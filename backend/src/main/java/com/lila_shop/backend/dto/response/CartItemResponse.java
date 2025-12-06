package com.lila_shop.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartItemResponse {
    String id;
    String productId;
    String productName;
    String variantId;
    String variantName;
    String shadeName;
    String shadeHex;
    Double unitPrice;
    Integer quantity;
    Double finalPrice;
}
