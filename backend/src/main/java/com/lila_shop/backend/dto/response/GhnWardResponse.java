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
public class GhnWardResponse {
    @JsonProperty("WardCode")
    String wardCode;

    @JsonProperty("DistrictID")
    Integer districtID;

    @JsonProperty("WardName")
    String wardName;
}

