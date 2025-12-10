package com.lila_shop.backend.mapper;

import com.lila_shop.backend.dto.request.ProductCreationRequest;
import com.lila_shop.backend.dto.request.ProductUpdateRequest;
import com.lila_shop.backend.dto.response.ProductResponse;
import com.lila_shop.backend.dto.response.ProductVariantResponse;
import com.lila_shop.backend.entity.Product;
import com.lila_shop.backend.entity.ProductMedia;
import com.lila_shop.backend.entity.Promotion;
import com.lila_shop.backend.entity.Review;
import com.lila_shop.backend.entity.ProductVariant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper {

    // Entity to Response
    @Mapping(target = "submittedBy", source = "submittedBy.id")
    @Mapping(target = "submittedByName", source = "submittedBy.fullName")
    @Mapping(target = "approvedBy", source = "approvedBy.id")
    @Mapping(target = "approvedByName", source = "approvedBy.fullName")
    @Mapping(target = "categoryId", source = "category.id")
    @Mapping(target = "categoryName", source = "category.name")
    @Mapping(target = "promotionId", source = "promotion", qualifiedByName = "mapPromotionId")
    @Mapping(target = "promotionName", source = "promotion", qualifiedByName = "mapPromotionName")
    @Mapping(target = "promotionStartDate", source = "promotion", qualifiedByName = "mapPromotionStartDate")
    @Mapping(target = "promotionExpiryDate", source = "promotion", qualifiedByName = "mapPromotionExpiryDate")
    @Mapping(target = "mediaUrls", source = "mediaList", qualifiedByName = "mapMediaUrls")
    @Mapping(target = "defaultMediaUrl", source = "defaultMedia", qualifiedByName = "mapDefaultMediaUrl")
    @Mapping(target = "reviewCount", source = "reviews", qualifiedByName = "mapReviewCount")
    @Mapping(target = "averageRating", source = "reviews", qualifiedByName = "mapAverageRating")
    @Mapping(target = "stockQuantity", source = "inventory.stockQuantity")
    @Mapping(target = "variants", source = "variants", qualifiedByName = "mapVariants")
    @Mapping(target = "defaultVariantId", source = "variants", qualifiedByName = "mapDefaultVariantId")
    ProductResponse toResponse(Product product);

    // Request to Entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "submittedBy", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "promotion", ignore = true)
    @Mapping(target = "mediaList", ignore = true)
    @Mapping(target = "defaultMedia", ignore = true)
    @Mapping(target = "reviews", ignore = true)
    @Mapping(target = "inventory", ignore = true)
    @Mapping(target = "banners", ignore = true)
    @Mapping(target = "quantitySold", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedAt", ignore = true)
    @Mapping(target = "rejectionReason", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "vouchers", ignore = true)
    @Mapping(target = "status", ignore = true)
    Product toProduct(ProductCreationRequest request);

    // Update Entity
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "submittedBy", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "promotion", ignore = true)
    @Mapping(target = "mediaList", ignore = true)
    @Mapping(target = "defaultMedia", ignore = true)
    @Mapping(target = "reviews", ignore = true)
    @Mapping(target = "inventory", ignore = true)
    @Mapping(target = "banners", ignore = true)
    @Mapping(target = "quantitySold", ignore = true)
    @Mapping(target = "price", ignore = true)
    @Mapping(target = "unitPrice", ignore = true)
    @Mapping(target = "tax", ignore = true)
    @Mapping(target = "discountValue", ignore = true)
    @Mapping(target = "purchasePrice", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedAt", ignore = true)
    @Mapping(target = "rejectionReason", ignore = true)
    @Mapping(target = "variants", ignore = true)
    @Mapping(target = "vouchers", ignore = true)
    void updateProduct(@MappingTarget Product product, ProductUpdateRequest request);

    @Named("mapMediaUrls")
    default List<String> mapMediaUrls(List<ProductMedia> mediaList) {
        if (mediaList == null)
            return null;
        // All URLs are now Cloudinary URLs (absolute URLs), return as-is
        return mediaList.stream()
                .map(ProductMedia::getMediaUrl)
                .filter(url -> url != null && !url.isBlank())
                .toList();
    }

    @Named("mapReviewCount")
    default Integer mapReviewCount(List<Review> reviews) {
        return reviews != null ? reviews.size() : 0;
    }

    @Named("mapAverageRating")
    default Double mapAverageRating(List<Review> reviews) {
        if (reviews == null || reviews.isEmpty())
            return 0.0;
        return reviews.stream().mapToDouble(Review::getRating).average().orElse(0.0);
    }

    @Named("mapVariants")
    default List<ProductVariantResponse> mapVariants(
            List<ProductVariant> variants) {
        if (variants == null)
            return List.of();
        return variants.stream()
                .map(v -> ProductVariantResponse.builder()
                        .id(v.getId())
                        .name(v.getName())
                        .shadeName(v.getShadeName())
                        .shadeHex(v.getShadeHex())
                        .price(v.getPrice())
                        .unitPrice(v.getUnitPrice())
                        .tax(v.getTax())
                        .purchasePrice(v.getPurchasePrice())
                        .stockQuantity(v.getStockQuantity())
                        .isDefault(v.getIsDefault())
                        .createdAt(v.getCreatedAt())
                        .updatedAt(v.getUpdatedAt())
                        .build())
                .toList();
    }

    @Named("mapDefaultVariantId")
    default String mapDefaultVariantId(List<ProductVariant> variants) {
        if (variants == null || variants.isEmpty())
            return null;
        return variants.stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsDefault()))
                .map(ProductVariant::getId)
                .findFirst()
                .orElse(null);
    }

    @Named("mapDefaultMediaUrl")
    default String mapDefaultMediaUrl(ProductMedia defaultMedia) {
        if (defaultMedia == null || defaultMedia.getMediaUrl() == null || defaultMedia.getMediaUrl().isBlank())
            return null;
        // All URLs are now Cloudinary URLs (absolute URLs), return as-is
        return defaultMedia.getMediaUrl();
    }

    @Named("mapPromotionId")
    default String mapPromotionId(Promotion promotion) {
        return promotion != null ? promotion.getId() : null;
    }

    @Named("mapPromotionName")
    default String mapPromotionName(Promotion promotion) {
        return promotion != null ? promotion.getName() : null;
    }

    @Named("mapPromotionStartDate")
    default java.time.LocalDate mapPromotionStartDate(Promotion promotion) {
        return promotion != null ? promotion.getStartDate() : null;
    }

    @Named("mapPromotionExpiryDate")
    default java.time.LocalDate mapPromotionExpiryDate(Promotion promotion) {
        return promotion != null ? promotion.getExpiryDate() : null;
    }
}
