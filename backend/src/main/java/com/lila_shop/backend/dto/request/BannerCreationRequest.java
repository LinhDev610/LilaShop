package com.lila_shop.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BannerCreationRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    String title;

    @Size(max = 1000, message = "Mô tả không được vượt quá 1000 ký tự")
    String description;

    @NotBlank(message = "URL hình ảnh không được để trống")
    String imageUrl;

    String linkUrl;

    @Size(max = 50, message = "Content type không được vượt quá 50 ký tự")
    String contentType; // 'banner', 'seasonal', 'trending'

    @Builder.Default
    Boolean status = true;

    @Min(value = 0, message = "Thứ tự sắp xếp phải lớn hơn hoặc bằng 0")
    Integer orderIndex;

    List<String> productIds;

    LocalDate startDate;

    LocalDate endDate;
}
