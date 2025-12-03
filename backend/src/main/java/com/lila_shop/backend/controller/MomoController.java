package com.lila_shop.backend.controller;

import com.lila_shop.backend.dto.request.ApiResponse;
import com.lila_shop.backend.dto.request.MomoIpnRequest;
import com.lila_shop.backend.dto.response.CreateMomoResponse;
import com.lila_shop.backend.service.MomoService;
import com.lila_shop.backend.service.OrderService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/momo")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class MomoController {

    MomoService momoService;
    OrderService orderService;

    /**
     * API cho frontend tạo giao dịch MoMo.
     * Frontend truyền số tiền (VND) và optional orderId (mã đơn nội bộ).
     */
    @PostMapping("/create")
    public ApiResponse<CreateMomoResponse> createPayment(
            @RequestParam("amount") long amount,
            @RequestParam(value = "orderId", required = false) String orderId) {
        CreateMomoResponse response = momoService.createMomoPayment(amount, orderId);
        return ApiResponse.<CreateMomoResponse>builder()
                .result(response)
                .build();
    }

    /**
     * IPN handler nhận kết quả thanh toán từ MoMo.
     * Hiện tại chỉ log lại, bạn có thể bổ sung xử lý cập nhật trạng thái đơn hàng sau.
     */
    @PostMapping("/ipn-handler")
    public ResponseEntity<Void> handleIpn(@RequestBody MomoIpnRequest request) {
        if (!momoService.validateIpnSignature(request)) {
            return ResponseEntity.badRequest().build();
        }
        orderService.handleMomoIpn(request);
        return ResponseEntity.noContent().build();
    }
}


