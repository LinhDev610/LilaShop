package com.lila_shop.backend.entity;

import com.lila_shop.backend.enums.DiscountApplyScope;
import com.lila_shop.backend.enums.DiscountValueType;
import com.lila_shop.backend.enums.VoucherStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "vouchers")
public class Voucher {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(unique = true, nullable = false)
    String code;

    String name;
    @Enumerated(EnumType.STRING)
    @Column(name = "discount_value_type", nullable = false)
    DiscountValueType discountValueType;

    @Enumerated(EnumType.STRING)
    @Column(name = "apply_scope", nullable = false)
    DiscountApplyScope applyScope;

    Double minOrderValue;
    Double maxOrderValue;
    Double discountValue;
    Double maxDiscountValue;

    LocalDate startDate;
    LocalDate expiryDate;

    String imageUrl;

    @Column(name = "comment", columnDefinition = "TEXT")
    String description;
    Integer usageLimit;

    @Builder.Default
    Integer usageCount = 0;

    @Column(name = "usage_per_user")
    Integer usagePerUser; // Số lần mỗi user được dùng voucher này

    Boolean isActive;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    VoucherStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by")
    User submittedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    User approvedBy;

    @Column(name = "submitted_at")
    LocalDateTime submittedAt;

    @Column(name = "approved_at")
    LocalDateTime approvedAt;

    @Column(name = "rejection_reason")
    String rejectionReason;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "voucher_categories", 
        joinColumns = @JoinColumn(name = "voucher_id"), 
        inverseJoinColumns = @JoinColumn(name = "category_id"))
    @Builder.Default
    Set<Category> categoryApply = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "voucher_products", 
        joinColumns = @JoinColumn(name = "voucher_id"), 
        inverseJoinColumns = @JoinColumn(name = "product_id"))
    @Builder.Default
    Set<Product> productApply = new HashSet<>();

    @Builder.Default
    @ManyToMany(mappedBy = "usedVouchers")
    Set<User> usedByUsers = new HashSet<>();

    // Loss tracking fields
    @Column(name = "total_loss")
    @Builder.Default
    Double totalLoss = 0.0;

    @Column(name = "loss_threshold")
    Double lossThreshold; // null = no limit
}
