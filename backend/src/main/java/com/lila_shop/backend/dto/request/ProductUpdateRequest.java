package com.lila_shop.backend.dto.request;

import com.lila_shop.backend.enums.ProductStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductUpdateRequest {

    @Size(max = 255, message = "Tên sản phẩm không được vượt quá 255 ký tự")
    String name;

    @Size(max = 5000, message = "Mô tả không được vượt quá 5000 ký tự")
    String description;

    @Size(max = 255, message = "Tên thương hiệu không được vượt quá 255 ký tự")
    String brand;

    @Size(max = 100, message = "Màu sắc không được vượt quá 100 ký tự")
    String shadeColor;

    @Size(max = 100, message = "Loại da không được vượt quá 100 ký tự")
    String skinType;

    @Size(max = 200, message = "Vấn đề da không được vượt quá 200 ký tự")
    String skinConcern;

    @Size(max = 100, message = "Dung tích không được vượt quá 100 ký tự")
    String volume;

    @Size(max = 100, message = "Xuất xứ không được vượt quá 100 ký tự")
    String origin;

    LocalDate expiryDate;

    @Size(max = 2000, message = "Thành phần không được vượt quá 2000 ký tự")
    String ingredients;

    @Size(max = 1000, message = "Hướng dẫn sử dụng không được vượt quá 1000 ký tự")
    String usageInstructions;

    @Size(max = 500, message = "Lưu ý an toàn không được vượt quá 500 ký tự")
    String safetyNote;

    @DecimalMin(value = "0.0", message = "Trọng lượng phải lớn hơn hoặc bằng 0")
    Double weight;

    @Min(value = 1, message = "Chiều dài phải lớn hơn hoặc bằng 1")
    Double length;

    @Min(value = 1, message = "Chiều rộng phải lớn hơn hoặc bằng 1")
    Double width;

    @Min(value = 1, message = "Chiều cao phải lớn hơn hoặc bằng 1")
    Double height;

    @DecimalMin(value = "0.0", message = "Giá niêm yết (giá gốc) phải lớn hơn hoặc bằng 0")
    Double unitPrice;

    @DecimalMin(value = "0.0", message = "Giá bán phải lớn hơn hoặc bằng 0")
    Double price;

    @DecimalMin(value = "0.0", message = "Giá nhập phải lớn hơn hoặc bằng 0")
    Double purchasePrice;

    @DecimalMin(value = "0.0", message = "Thuế phải lớn hơn hoặc bằng 0")
    @DecimalMax(value = "1.0", message = "Thuế tối đa là 1.0 (100%)")
    Double tax;

    @DecimalMin(value = "0.0", message = "Giá trị giảm giá phải lớn hơn hoặc bằng 0")
    Double discountValue;

    String categoryId;

    // Promotion (optional)
    String promotionId;

    ProductStatus status;

    @Min(value = 0, message = "Số lượng tồn kho phải >= 0")
    Integer stockQuantity;

    // Media fields
    List<String> imageUrls;
    List<String> videoUrls;
    String defaultMediaUrl;
}
