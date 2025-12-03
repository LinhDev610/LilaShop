package com.lila_shop.backend.dto.response;

import com.lumina_book.backend.enums.ShipmentProvider;
import com.lumina_book.backend.enums.ShipmentStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShipmentResponse {
    String id;
    String orderCode; // GHN order code
    String orderId; // Internal order ID
    LocalDate shippedDate;
    LocalDate estimatedDelivery;
    ShipmentProvider provider;
    ShipmentStatus status;
    
    Long totalFee; // Tổng phí vận chuyển (VND)
}

