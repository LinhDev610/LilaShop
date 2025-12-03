package com.lila_shop.backend.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GhnShipmentResponse {
    Integer code;
    String message;
    GhnShipmentDataResponse data;
}
