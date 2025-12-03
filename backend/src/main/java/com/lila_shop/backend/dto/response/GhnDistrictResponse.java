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
public class GhnDistrictResponse {
    @JsonProperty("DistrictID")
    Integer districtID;

    @JsonProperty("ProvinceID")
    Integer provinceID;

    @JsonProperty("DistrictName")
    String districtName;

    @JsonProperty("Code")
    String code;

    @JsonProperty("Type")
    Integer type;

    @JsonProperty("SupportType")
    Integer supportType;
}

