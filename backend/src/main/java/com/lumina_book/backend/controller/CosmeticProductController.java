package com.lila_shop.backend.controller;

import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lila_shop.backend.dto.request.ApiResponse;
import com.lila_shop.backend.entity.CosmeticProduct;
import com.lila_shop.backend.service.CosmeticProductService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/cosmetics")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CosmeticProductController {

    CosmeticProductService cosmeticProductService;

    @GetMapping
    ApiResponse<Page<CosmeticProduct>> getCosmetics(
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String subCategory,
            @RequestParam(required = false) String skinType,
            @RequestParam(required = false) String skinConcern,
            @RequestParam(required = false) String shadeColor,
            @RequestParam(required = false) Double priceMin,
            @RequestParam(required = false) Double priceMax,
            @RequestParam(required = false) Boolean isBestSeller,
            @RequestParam(required = false) Boolean isNew,
            @RequestParam(required = false) Boolean isOnFlashSale,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("Get cosmetics with filters - brand: {}, category: {}, subCategory: {}", brand, category, subCategory);
        Page<CosmeticProduct> result = cosmeticProductService.getCosmetics(
                brand,
                category,
                subCategory,
                skinType,
                skinConcern,
                shadeColor,
                priceMin,
                priceMax,
                isBestSeller,
                isNew,
                isOnFlashSale,
                page,
                size);

        return ApiResponse.<Page<CosmeticProduct>>builder().result(result).build();
    }

    @GetMapping("/{id}")
    ApiResponse<CosmeticProduct> getCosmeticById(@PathVariable String id) {
        return ApiResponse.<CosmeticProduct>builder()
                .result(cosmeticProductService.getCosmeticById(id))
                .build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<CosmeticProduct> createCosmetic(@RequestBody CosmeticProduct request) {
        return ApiResponse.<CosmeticProduct>builder()
                .result(cosmeticProductService.createCosmetic(request))
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<CosmeticProduct> updateCosmetic(
            @PathVariable String id, @RequestBody CosmeticProduct request) {
        return ApiResponse.<CosmeticProduct>builder()
                .result(cosmeticProductService.updateCosmetic(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    ApiResponse<String> deleteCosmetic(@PathVariable String id) {
        cosmeticProductService.deleteCosmetic(id);
        return ApiResponse.<String>builder().result("Cosmetic product has been deleted").build();
    }
}


