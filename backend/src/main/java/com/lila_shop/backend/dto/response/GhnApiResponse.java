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
public class GhnApiResponse<T> {
    @JsonProperty("code")
    Integer code;

    @JsonProperty("message")
    String message;

    @JsonProperty("data")
    T data;
}

