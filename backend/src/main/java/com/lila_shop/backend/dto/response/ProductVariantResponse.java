package com.lila_shop.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductVariantResponse {
    String id;
    String name;
    String shadeName;
    String shadeHex;
    Double price; 
    Double unitPrice;
    Double tax; 
    Double purchasePrice; 
    Integer stockQuantity;
    Boolean isDefault;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
