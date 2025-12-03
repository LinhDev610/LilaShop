package com.lila_shop.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GhnProvinceResponse {
    @JsonProperty("ProvinceID")
    Integer provinceID;

    @JsonProperty("ProvinceName")
    String provinceName;

    @JsonProperty("Code")
    String code;
}

