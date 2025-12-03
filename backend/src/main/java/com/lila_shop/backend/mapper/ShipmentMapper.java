package com.lila_shop.backend.mapper;

import com.lila_shop.backend.dto.response.ShipmentResponse;
import com.lila_shop.backend.entity.Shipment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ShipmentMapper {

    @Mapping(target = "orderId", source = "order.id")
    ShipmentResponse toResponse(Shipment shipment);
}

