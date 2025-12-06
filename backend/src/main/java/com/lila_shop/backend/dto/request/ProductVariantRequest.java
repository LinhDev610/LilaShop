package com.lila_shop.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductVariantRequest {

    String name;
    String shadeName;
    String shadeHex;

    @NotNull(message = "Giá biến thể không được để trống")
    @DecimalMin(value = "0.0", message = "Giá phải >= 0")
    Double price; 

    @DecimalMin(value = "0.0", message = "Giá niêm yết phải >= 0")
    Double unitPrice;

    @DecimalMin(value = "0.0", message = "Thuế phải >= 0")
    Double tax;

    @DecimalMin(value = "0.0", message = "Giá nhập phải >= 0")
    Double purchasePrice;

    @Min(value = 0, message = "Tồn kho phải >= 0")
    Integer stockQuantity;

    Boolean isDefault;
}
