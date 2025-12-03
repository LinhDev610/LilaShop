package com.lila_shop.backend.controller;

import com.lila_shop.backend.dto.request.ApiResponse;
import com.lila_shop.backend.dto.request.BannerCreationRequest;
import com.lila_shop.backend.dto.request.BannerUpdateRequest;
import com.lila_shop.backend.dto.response.BannerResponse;
import com.lila_shop.backend.service.BannerService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/banners")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BannerController {

    BannerService bannerService;

    @PostMapping
    ApiResponse<BannerResponse> createBanner(@RequestBody @Valid BannerCreationRequest request) {
        log.info("Controller: create Banner");
        return ApiResponse.<BannerResponse>builder()
                .result(bannerService.createBanner(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<BannerResponse>> getAllBanners() {
        return ApiResponse.<List<BannerResponse>>builder()
                .result(bannerService.getAllBanners())
                .build();
    }

    @GetMapping("/active")
    ApiResponse<List<BannerResponse>> getActiveBanners() {
        return ApiResponse.<List<BannerResponse>>builder()
                .result(bannerService.getActiveBanners())
                .build();
    }

    @GetMapping("/{bannerId}")
    ApiResponse<BannerResponse> getBannerById(@PathVariable String bannerId) {
        return ApiResponse.<BannerResponse>builder()
                .result(bannerService.getBannerById(bannerId))
                .build();
    }

    @PutMapping("/{bannerId}")
    ApiResponse<BannerResponse> updateBanner(
            @PathVariable String bannerId, @RequestBody @Valid BannerUpdateRequest request) {
        return ApiResponse.<BannerResponse>builder()
                .result(bannerService.updateBanner(bannerId, request))
                .build();
    }

    @PutMapping("/{bannerId}/order")
    ApiResponse<BannerResponse> updateBannerOrder(@PathVariable String bannerId, @RequestParam Integer orderIndex) {
        return ApiResponse.<BannerResponse>builder()
                .result(bannerService.updateBannerOrder(bannerId, orderIndex))
                .build();
    }

    @DeleteMapping("/{bannerId}")
    ApiResponse<String> deleteBanner(@PathVariable String bannerId) {
        bannerService.deleteBanner(bannerId);
        return ApiResponse.<String>builder().result("Banner has been deleted").build();
    }
}
