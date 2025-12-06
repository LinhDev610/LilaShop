package com.lila_shop.backend.entity;

import com.lila_shop.backend.enums.ProductStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "products")
public class Product {
    @Id
    String id;

    @Column(name = "name", nullable = false)
    String name;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "size")
    String size;

    @Column(name = "brand")
    String brand;

    @Column(name = "shade_color")
    String shadeColor;

    @Column(name = "skin_type")
    String skinType;

    @Column(name = "skin_concern")
    String skinConcern;

    @Column(name = "volume")
    String volume;

    @Column(name = "origin")
    String origin;

    @Column(name = "expiry_date")
    LocalDate expiryDate;

    @Column(name = "ingredients", columnDefinition = "TEXT")
    String ingredients;

    @Column(name = "usage_instructions", columnDefinition = "TEXT")
    String usageInstructions;

    @Column(name = "safety_note", columnDefinition = "TEXT")
    String safetyNote;

    @Column(name = "weight")
    Double weight;

    @Column(name = "length")
    Double length;

    @Column(name = "width")
    Double width;

    @Column(name = "height")
    Double height;

    @Column(name = "tax")
    Double tax;

    @Column(name = "unit_price", nullable = false)
    Double unitPrice;

    @Column(name = "purchase_price")
    Double purchasePrice;

    @Column(name = "discount_value")
    Double discountValue;

    @Column(name = "price", nullable = false)
    Double price;

    @Column(name = "quantity_sold")
    Integer quantitySold;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    ProductStatus status;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    // Submitted by user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    User submittedBy;

    // Approval info
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    User approvedBy;

    @Column(name = "approved_at")
    LocalDateTime approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    String rejectionReason;

    // Category relationship
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    Category category;

    // Product media
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    List<ProductMedia> mediaList;

    // Variants
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    List<ProductVariant> variants;

    // Default media
    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "default_media_id")
    ProductMedia defaultMedia;

    // Reviews
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    List<Review> reviews;

    // Inventory
    @OneToOne(mappedBy = "product", cascade = CascadeType.ALL)
    Inventory inventory;

    // Banners
    @ManyToMany(mappedBy = "products")
    List<Banner> banners;

    // Promotions
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id")
    Promotion promotion;

    // Vouchers
    @ManyToMany(mappedBy = "productApply", fetch = FetchType.LAZY)
    @Builder.Default
    Set<Voucher> vouchers = new HashSet<>();
}
