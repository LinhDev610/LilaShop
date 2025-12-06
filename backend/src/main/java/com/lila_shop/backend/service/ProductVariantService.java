package com.lila_shop.backend.service;

import com.lila_shop.backend.dto.request.ProductVariantRequest;
import com.lila_shop.backend.dto.response.ProductVariantResponse;
import com.lila_shop.backend.entity.Product;
import com.lila_shop.backend.entity.ProductVariant;
import com.lila_shop.backend.exception.AppException;
import com.lila_shop.backend.exception.ErrorCode;
import com.lila_shop.backend.repository.ProductRepository;
import com.lila_shop.backend.repository.ProductVariantRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ProductVariantService {

    ProductVariantRepository productVariantRepository;
    ProductRepository productRepository;

    private Product findProduct(String productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
    }

    private ProductVariantResponse map(ProductVariant v) {
        return ProductVariantResponse.builder()
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
                .build();
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ProductVariantResponse createVariant(String productId, ProductVariantRequest req) {
        Product product = findProduct(productId);

        // Kiểm tra xem đã có variant mặc định chưa
        List<ProductVariant> existingVariants = productVariantRepository.findByProductId(productId);
        boolean hasDefault = existingVariants.stream()
                .anyMatch(v -> Boolean.TRUE.equals(v.getIsDefault()));

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .name(req.getName())
                .shadeName(req.getShadeName())
                .shadeHex(req.getShadeHex())
                .price(req.getPrice())
                .unitPrice(req.getUnitPrice())
                .tax(req.getTax())
                .purchasePrice(req.getPurchasePrice())
                .stockQuantity(req.getStockQuantity())
                .isDefault(req.getIsDefault() != null ? req.getIsDefault() : !hasDefault)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ProductVariant saved = productVariantRepository.save(variant);

        if (saved.getIsDefault()) {
            // Unset other variants as default
            existingVariants.forEach(v -> {
                if (!v.getId().equals(saved.getId()) && Boolean.TRUE.equals(v.getIsDefault())) {
                    v.setIsDefault(false);
                    productVariantRepository.save(v);
                }
            });

            try {
                // Refresh product entity để đảm bảo có dữ liệu mới nhất
                product = productRepository.findById(productId)
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

                // Cập nhật giá sản phẩm từ variant mặc định
                product.setPrice(saved.getPrice());
                product.setUnitPrice(saved.getUnitPrice());
                product.setTax(saved.getTax());
                product.setPurchasePrice(saved.getPurchasePrice());
                product.setUpdatedAt(LocalDateTime.now());
                productRepository.save(product);
            } catch (Exception e) {
                log.error("Error updating product price from variant: {}", e.getMessage(), e);
                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
            }
        }

        return map(saved);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ProductVariantResponse updateVariant(String productId, String variantId, ProductVariantRequest req) {
        findProduct(productId); // ensure product exists
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED)); // reuse code; or define new code

        variant.setName(req.getName());
        variant.setShadeName(req.getShadeName());
        variant.setShadeHex(req.getShadeHex());
        variant.setPrice(req.getPrice());
        variant.setUnitPrice(req.getUnitPrice());
        variant.setTax(req.getTax());
        variant.setPurchasePrice(req.getPurchasePrice());
        variant.setStockQuantity(req.getStockQuantity());
        variant.setIsDefault(req.getIsDefault() != null ? req.getIsDefault() : variant.getIsDefault());
        variant.setUpdatedAt(LocalDateTime.now());

        ProductVariant saved = productVariantRepository.save(variant);
        Product product = findProduct(productId);

        if (saved.getIsDefault()) {
            productVariantRepository.findByProductId(productId).forEach(v -> {
                if (!v.getId().equals(saved.getId()) && Boolean.TRUE.equals(v.getIsDefault())) {
                    v.setIsDefault(false);
                    productVariantRepository.save(v);
                }
            });

            // Cập nhật giá sản phẩm từ variant mặc định
            product.setPrice(saved.getPrice());
            product.setUnitPrice(saved.getUnitPrice());
            product.setTax(saved.getTax());
            product.setPurchasePrice(saved.getPurchasePrice());
            product.setUpdatedAt(LocalDateTime.now());
            productRepository.save(product);
        }
        return map(saved);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public void deleteVariant(String productId, String variantId) {
        findProduct(productId); // ensure product exists
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
        productVariantRepository.delete(variant);
        log.info("Deleted variant {} for product {}", variantId, productId);
    }

    public List<ProductVariantResponse> getVariants(String productId) {
        findProduct(productId);
        return productVariantRepository.findByProductId(productId).stream().map(this::map).toList();
    }
}
