package com.lila_shop.backend.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "cosmetic_products")
public class CosmeticProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    // Basic info
    @Column(name = "name", nullable = false, length = 255)
    String name;

    @Column(name = "brand", nullable = false, length = 255)
    String brand;

    @Column(name = "category", nullable = false, length = 255)
    String category;

    @Column(name = "sub_category", length = 255)
    String subCategory;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    // Cosmetic-specific attributes
    @Column(name = "shade_color", length = 100)
    String shadeColor;

    @Column(name = "finish", length = 50)
    String finish;

    @Column(name = "skin_type", length = 255)
    String skinType;

    @Column(name = "skin_concern", length = 255)
    String skinConcern;

    @Column(name = "volume", length = 50)
    String volume;

    @Column(name = "origin", length = 100)
    String origin;

    @Column(name = "expiry_date")
    LocalDate expiryDate;

    @Column(name = "ingredients", columnDefinition = "TEXT")
    String ingredients;

    @Column(name = "usage_instructions", columnDefinition = "TEXT")
    String usageInstructions;

    @Column(name = "safety_note", columnDefinition = "TEXT")
    String safetyNote;

    // Selling attributes
    @Column(name = "price", nullable = false)
    Double price;

    @Column(name = "original_price")
    Double originalPrice;

    @Column(name = "discount_percent")
    Double discountPercent;

    @Column(name = "discount_amount")
    Double discountAmount;

    @Column(name = "stock", nullable = false)
    Integer stock;

    // Media & tags
    @ElementCollection
    @CollectionTable(name = "cosmetic_product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url")
    List<String> images;

    @ElementCollection
    @CollectionTable(name = "cosmetic_product_tags", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "tag")
    List<String> tags;

    @Column(name = "is_best_seller")
    Boolean isBestSeller;

    @Column(name = "is_new")
    Boolean isNew;

    @Column(name = "is_on_flash_sale")
    Boolean isOnFlashSale;

    // Rating summary
    @Column(name = "rating")
    Double rating;

    @Column(name = "review_count")
    Integer reviewCount;

    // System metadata
    @Column(name = "status", nullable = false)
    Boolean status;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;
}



