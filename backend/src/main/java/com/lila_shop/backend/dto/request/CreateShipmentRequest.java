package com.lila_shop.backend.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateShipmentRequest {
    /**
     * Danh sách ID của các ca lấy hàng (pick shifts).
     * Nếu null, hệ thống sẽ tự động chọn ca phù hợp.
     */
    List<Integer> pickShiftIds;
}

