package com.lila_shop.backend.dto.request;

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
public class BannerUpdateRequest {

    @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
    String title;

    @Size(max = 1000, message = "Mô tả không được vượt quá 1000 ký tự")
    String description;

    String imageUrl;
    String linkUrl;
    Boolean status;
    
    @Size(max = 2000, message = "Lý do từ chối không được vượt quá 2000 ký tự")
    String rejectionReason;

    @Min(value = 0, message = "Thứ tự sắp xếp phải lớn hơn hoặc bằng 0")
    Integer orderIndex;

    List<String> productIds;

    LocalDate startDate;

    LocalDate endDate;
}
