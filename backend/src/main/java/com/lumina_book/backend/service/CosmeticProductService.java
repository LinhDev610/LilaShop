package com.lila_shop.backend.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lila_shop.backend.entity.CosmeticProduct;
import com.lila_shop.backend.exception.AppException;
import com.lila_shop.backend.exception.ErrorCode;
import com.lila_shop.backend.repository.CosmeticProductRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CosmeticProductService {

    CosmeticProductRepository cosmeticProductRepository;

    public Page<CosmeticProduct> getCosmetics(
            String brand,
            String category,
            String subCategory,
            String skinType,
            String skinConcern,
            String shadeColor,
            Double priceMin,
            Double priceMax,
            Boolean isBestSeller,
            Boolean isNew,
            Boolean isOnFlashSale,
            int page,
            int size) {

        Specification<CosmeticProduct> spec = Specification.where(null);

        if (brand != null && !brand.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("brand"), brand));
        }
        if (category != null && !category.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), category));
        }
        if (subCategory != null && !subCategory.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("subCategory"), subCategory));
        }
        if (skinType != null && !skinType.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("skinType"), skinType));
        }
        if (skinConcern != null && !skinConcern.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("skinConcern"), skinConcern));
        }
        if (shadeColor != null && !shadeColor.isBlank()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("shadeColor"), shadeColor));
        }
        if (priceMin != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("price"), priceMin));
        }
        if (priceMax != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), priceMax));
        }
        if (isBestSeller != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("isBestSeller"), isBestSeller));
        }
        if (isNew != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("isNew"), isNew));
        }
        if (isOnFlashSale != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("isOnFlashSale"), isOnFlashSale));
        }

        Pageable pageable = PageRequest.of(page, size);
        return cosmeticProductRepository.findAll(spec, pageable);
    }

    public CosmeticProduct getCosmeticById(String id) {
        return cosmeticProductRepository
                .findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
    }

    @Transactional
    public CosmeticProduct createCosmetic(CosmeticProduct request) {
        request.setId(null);
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        if (request.getStatus() == null) {
            request.setStatus(true);
        }
        CosmeticProduct saved = cosmeticProductRepository.save(request);
        log.info("Cosmetic product created with ID: {}", saved.getId());
        return saved;
    }

    @Transactional
    public CosmeticProduct updateCosmetic(String id, CosmeticProduct request) {
        CosmeticProduct existing = cosmeticProductRepository
                .findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        // Basic info
        existing.setName(request.getName());
        existing.setBrand(request.getBrand());
        existing.setCategory(request.getCategory());
        existing.setSubCategory(request.getSubCategory());
        existing.setDescription(request.getDescription());

        // Cosmetic-specific
        existing.setShadeColor(request.getShadeColor());
        existing.setFinish(request.getFinish());
        existing.setSkinType(request.getSkinType());
        existing.setSkinConcern(request.getSkinConcern());
        existing.setVolume(request.getVolume());
        existing.setOrigin(request.getOrigin());
        existing.setExpiryDate(request.getExpiryDate());
        existing.setIngredients(request.getIngredients());
        existing.setUsageInstructions(request.getUsageInstructions());
        existing.setSafetyNote(request.getSafetyNote());

        // Selling attributes
        existing.setPrice(request.getPrice());
        existing.setOriginalPrice(request.getOriginalPrice());
        existing.setDiscountPercent(request.getDiscountPercent());
        existing.setDiscountAmount(request.getDiscountAmount());
        existing.setStock(request.getStock());

        // Media & tags
        existing.setImages(request.getImages());
        existing.setTags(request.getTags());

        // Flags & rating summary
        existing.setIsBestSeller(request.getIsBestSeller());
        existing.setIsNew(request.getIsNew());
        existing.setIsOnFlashSale(request.getIsOnFlashSale());
        existing.setRating(request.getRating());
        existing.setReviewCount(request.getReviewCount());

        // Status & timestamps
        if (request.getStatus() != null) {
            existing.setStatus(request.getStatus());
        }
        existing.setUpdatedAt(LocalDateTime.now());

        CosmeticProduct saved = cosmeticProductRepository.save(existing);
        log.info("Cosmetic product updated: {}", id);
        return saved;
    }

    @Transactional
    public void deleteCosmetic(String id) {
        CosmeticProduct existing = cosmeticProductRepository
                .findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
        cosmeticProductRepository.delete(existing);
        log.info("Cosmetic product deleted: {}", id);
    }
}


