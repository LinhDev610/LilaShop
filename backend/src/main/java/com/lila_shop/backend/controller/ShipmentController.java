package com.lila_shop.backend.controller;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.lila_shop.backend.dto.request.ApiResponse;
import com.lila_shop.backend.dto.request.CreateGhnShipmentRequest;
import com.lila_shop.backend.entity.Shipment;
import com.lila_shop.backend.service.ShipmentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/shipments")
@RequiredArgsConstructor
public class ShipmentController {
    private final ShipmentService shipmentService;

    @PostMapping("/ghn")
    public ApiResponse<Shipment> createGhnShipment(@RequestBody @Validated CreateGhnShipmentRequest request) {
        Shipment shipment = shipmentService.createGhnOrder(request);
        return ApiResponse.<Shipment>builder().result(shipment).build();
    }
}
