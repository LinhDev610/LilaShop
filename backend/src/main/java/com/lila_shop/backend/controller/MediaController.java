package com.lila_shop.backend.controller;

import com.lila_shop.backend.dto.request.ApiResponse;
import com.lila_shop.backend.service.FileStorageService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MediaController {

    FileStorageService fileStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<String>> uploadProfileMedia(@RequestPart("files") List<MultipartFile> files) {
        List<String> urls = files.parallelStream()
                .map(fileStorageService::storeProfileMedia)
                .collect(Collectors.toList());
        return ApiResponse.<List<String>>builder().result(urls).build();
    }

    @PostMapping(value = "/upload-product", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<String>> uploadProductMedia(@RequestPart("files") List<MultipartFile> files) {
        List<String> urls = files.parallelStream()
                .map(fileStorageService::storeProductMedia)
                .collect(Collectors.toList());
        return ApiResponse.<List<String>>builder().result(urls).build();
    }

    @PostMapping(value = "/upload-voucher", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<String>> uploadVoucherMedia(@RequestPart("files") List<MultipartFile> files) {
        List<String> urls = files.parallelStream()
                .map(fileStorageService::storeVoucherMedia)
                .collect(Collectors.toList());
        return ApiResponse.<List<String>>builder().result(urls).build();
    }

    @PostMapping(value = "/upload-promotion", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<String>> uploadPromotionMedia(@RequestPart("files") List<MultipartFile> files) {
        List<String> urls = files.parallelStream()
                .map(fileStorageService::storePromotionMedia)
                .collect(Collectors.toList());
        return ApiResponse.<List<String>>builder().result(urls).build();
    }

    @PostMapping(value = "/upload-banner", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<String>> uploadBannerMedia(@RequestPart("files") List<MultipartFile> files) {
        List<String> urls = files.parallelStream()
                .map(fileStorageService::storeBannerMedia)
                .collect(Collectors.toList());
        return ApiResponse.<List<String>>builder().result(urls).build();
    }
}
