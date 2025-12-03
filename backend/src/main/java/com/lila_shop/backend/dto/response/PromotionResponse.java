package com.lila_shop.backend.dto.response;

import com.lila_shop.backend.enums.DiscountApplyScope;
import com.lila_shop.backend.enums.DiscountValueType;
import com.lila_shop.backend.enums.PromotionStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PromotionResponse {

    String id;
    String code;
    String name;
    String imageUrl;
    String description;
    Double discountValue;
    Double minOrderValue;
    Double maxDiscountValue;
    DiscountValueType discountValueType;
    DiscountApplyScope applyScope;
    LocalDate startDate;
    LocalDate expiryDate;
    Integer usageCount;
    Integer usageLimit;
    Boolean isActive;
    PromotionStatus status;

    // Approval workflow info
    String submittedBy;
    String submittedByName; 
    String approvedBy;
    String approvedByName;
    LocalDateTime submittedAt;
    LocalDateTime approvedAt;
    String rejectionReason;

    // Application scope
    Set<String> categoryIds;
    List<String> categoryNames;
    Set<String> productIds;
    List<String> productNames;
}
