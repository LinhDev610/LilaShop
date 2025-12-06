package com.lila_shop.backend.controller;

import com.lila_shop.backend.dto.request.ApiResponse;
import com.lila_shop.backend.dto.request.ProductVariantRequest;
import com.lila_shop.backend.dto.response.ProductVariantResponse;
import com.lila_shop.backend.service.ProductVariantService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products/{productId}/variants")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ProductVariantController {

        ProductVariantService productVariantService;

        @GetMapping
        ApiResponse<List<ProductVariantResponse>> getVariants(@PathVariable String productId) {
                return ApiResponse.<List<ProductVariantResponse>>builder()
                                .result(productVariantService.getVariants(productId))
                                .build();
        }

        @PostMapping
        ApiResponse<ProductVariantResponse> createVariant(
                        @PathVariable String productId,
                        @RequestBody @Valid ProductVariantRequest request) {
                return ApiResponse.<ProductVariantResponse>builder()
                                .result(productVariantService.createVariant(productId, request))
                                .build();
        }

        @PutMapping("/{variantId}")
        ApiResponse<ProductVariantResponse> updateVariant(
                        @PathVariable String productId,
                        @PathVariable String variantId,
                        @RequestBody @Valid ProductVariantRequest request) {
                return ApiResponse.<ProductVariantResponse>builder()
                                .result(productVariantService.updateVariant(productId, variantId, request))
                                .build();
        }

        @DeleteMapping("/{variantId}")
        ApiResponse<String> deleteVariant(
                        @PathVariable String productId,
                        @PathVariable String variantId) {
                productVariantService.deleteVariant(productId, variantId);
                return ApiResponse.<String>builder()
                                .result("Variant has been deleted")
                                .build();
        }
}

