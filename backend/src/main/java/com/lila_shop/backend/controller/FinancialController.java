package com.lila_shop.backend.controller;

import com.lila_shop.backend.dto.request.ApiResponse;
import com.lila_shop.backend.dto.response.*;
import com.lila_shop.backend.service.FinancialService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/financial")
@RequiredArgsConstructor
public class FinancialController {

    private final FinancialService financialService;

    @GetMapping("/revenue/day")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<RevenuePoint>> revenueByDay(
            @RequestParam LocalDate start, 
            @RequestParam LocalDate end,
            @RequestParam(required = false, defaultValue = "day") String timeMode) {
        return ApiResponse.<List<RevenuePoint>>builder()
                .result(financialService.revenueByDay(start, end, timeMode))
                .build();
    }

    @GetMapping("/revenue/payment")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<PaymentRevenue>> revenueByPayment(
            @RequestParam LocalDate start, @RequestParam LocalDate end) {
        return ApiResponse.<List<PaymentRevenue>>builder()
                .result(financialService.revenueByPayment(start, end))
                .build();
    }

    @GetMapping("/revenue/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<RevenueSummary> revenueSummary(
            @RequestParam LocalDate start, @RequestParam LocalDate end) {
        return ApiResponse.<RevenueSummary>builder()
                .result(financialService.revenueSummary(start, end))
                .build();
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<FinancialSummary> summary(@RequestParam LocalDate start, @RequestParam LocalDate end) {
        return ApiResponse.<FinancialSummary>builder()
                .result(financialService.summary(start, end))
                .build();
    }

    @GetMapping("/top-products")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<ProductRevenue>> topProductsByRevenue(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end,
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.<List<ProductRevenue>>builder()
                .result(financialService.topProductsByRevenue(start, end, limit))
                .build();
    }
}
