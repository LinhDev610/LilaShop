package com.lila_shop.backend.entity;

import com.lila_shop.backend.enums.ShipmentProvider;
import com.lila_shop.backend.enums.ShipmentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class Shipment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @OneToOne
    @JoinColumn(name = "order_id")
    Order order;

    @Enumerated(EnumType.STRING)
    ShipmentProvider provider;

    @Enumerated(EnumType.STRING)
    ShipmentStatus status;

    String orderCode; // GHN order code để tracking

    LocalDate shippedDate;
    LocalDate estimatedDelivery;

    Long totalFee; // Tổng phí vận chuyển (VND)
}
