package com.lila_shop.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CheckoutInitResponse {
    OrderResponse order; // null nếu là MoMo (chưa tạo đơn hàng)
    String payUrl;
    String orderCode; // For MoMo: order code sẽ được tạo sau khi thanh toán thành công
}
