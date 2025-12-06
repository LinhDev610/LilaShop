package com.lila_shop.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "product_variants")
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    Product product;

    @Column(name = "name")
    String name; // Nhãn hiển thị: dung tích (nước hoa) hoặc tên màu (makeup)

    @Column(name = "shade_name")
    String shadeName; // Tên màu (makeup)

    @Column(name = "shade_hex")
    String shadeHex; // Mã màu (makeup)

    @Column(name = "price", nullable = false)
    Double price;

    @Column(name = "unit_price")
    Double unitPrice;

    @Column(name = "tax")
    Double tax;

    @Column(name = "purchase_price")
    Double purchasePrice;

    @Column(name = "stock_quantity")
    Integer stockQuantity;

    @Column(name = "is_default")
    Boolean isDefault;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;
}
