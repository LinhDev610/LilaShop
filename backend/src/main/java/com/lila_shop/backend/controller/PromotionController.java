package com.lila_shop.backend.controller;

import com.lila_shop.backend.dto.request.ApiResponse;
import com.lila_shop.backend.dto.request.ApprovePromotionRequest;
import com.lila_shop.backend.dto.request.PromotionCreationRequest;
import com.lila_shop.backend.dto.request.PromotionUpdateRequest;
import com.lila_shop.backend.dto.response.PromotionResponse;
import com.lila_shop.backend.enums.PromotionStatus;
import com.lila_shop.backend.service.PromotionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/promotions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PromotionController {

    PromotionService promotionService;

    // Staff endpoints
    @PostMapping
    ApiResponse<PromotionResponse> createPromotion(@RequestBody @Valid PromotionCreationRequest request) {
        return ApiResponse.<PromotionResponse>builder()
                .result(promotionService.createPromotion(request))
                .build();
    }

    @GetMapping("/my-promotions")
    ApiResponse<List<PromotionResponse>> getMyPromotions() {
        return ApiResponse.<List<PromotionResponse>>builder()
                .result(promotionService.getMyPromotions())
                .build();
    }

    @GetMapping("/{promotionId}")
    ApiResponse<PromotionResponse> getPromotionById(@PathVariable String promotionId) {
        return ApiResponse.<PromotionResponse>builder()
                .result(promotionService.getPromotionById(promotionId))
                .build();
    }

    @PutMapping("/{promotionId}")
    ApiResponse<PromotionResponse> updatePromotion(
            @PathVariable String promotionId, @RequestBody @Valid PromotionUpdateRequest request) {
        return ApiResponse.<PromotionResponse>builder()
                .result(promotionService.updatePromotion(promotionId, request))
                .build();
    }

    @DeleteMapping("/{promotionId}")
    ApiResponse<String> deletePromotion(@PathVariable String promotionId) {
        promotionService.deletePromotion(promotionId);
        return ApiResponse.<String>builder()
                .result("Promotion has been deleted")
                .build();
    }

    // Admin endpoints
    @GetMapping("/pending")
    ApiResponse<List<PromotionResponse>> getPendingPromotions() {
        return ApiResponse.<List<PromotionResponse>>builder()
                .result(promotionService.getPendingPromotions())
                .build();
    }

    @PostMapping("/approve")
    ApiResponse<PromotionResponse> approvePromotion(@RequestBody @Valid ApprovePromotionRequest request) {
        return ApiResponse.<PromotionResponse>builder()
                .result(promotionService.approvePromotion(request))
                .build();
    }

    @GetMapping("/status/{status}")
    ApiResponse<List<PromotionResponse>> getPromotionsByStatus(@PathVariable PromotionStatus status) {
        return ApiResponse.<List<PromotionResponse>>builder()
                .result(promotionService.getPromotionsByStatus(status))
                .build();
    }

    // Public endpoints
    @GetMapping("/active")
    ApiResponse<List<PromotionResponse>> getActivePromotions() {
        return ApiResponse.<List<PromotionResponse>>builder()
                .result(promotionService.getActivePromotions())
                .build();
    }
}
