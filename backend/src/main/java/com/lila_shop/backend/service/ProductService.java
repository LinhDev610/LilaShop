package com.lila_shop.backend.service;

import com.lila_shop.backend.dto.request.ApproveProductRequest;
import com.lila_shop.backend.dto.request.ProductCreationRequest;
import com.lila_shop.backend.dto.request.ProductRestockRequest;
import com.lila_shop.backend.dto.request.ProductUpdateRequest;
import com.lila_shop.backend.dto.response.ProductResponse;
import com.lila_shop.backend.entity.*;
import com.lila_shop.backend.enums.ProductStatus;
import com.lila_shop.backend.enums.PromotionStatus;
import com.lila_shop.backend.exception.AppException;
import com.lila_shop.backend.exception.ErrorCode;
import com.lila_shop.backend.mapper.ProductMapper;
import com.lila_shop.backend.repository.*;
import com.lila_shop.backend.util.SecurityUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ProductService {

    ProductRepository productRepository;
    CategoryRepository categoryRepository;
    UserRepository userRepository;
    ProductMediaRepository productMediaRepository;
    PromotionRepository promotionRepository;
    VoucherRepository voucherRepository;
    BannerRepository bannerRepository;
    FinancialRecordRepository financialRecordRepository;
    ProductMapper productMapper;
    PromotionService promotionService;
    FileStorageService fileStorageService;

    // ========== CREATE OPERATIONS ==========
    @Transactional
    @PreAuthorize("hasRole('STAFF')")
    public ProductResponse createProduct(ProductCreationRequest request) {
        String userEmail = SecurityUtil.getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Validate và lấy category
        Category category = categoryRepository
                .findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

        // Validate và lấy promotion nếu có
        Promotion promotion = null;
        if (request.getPromotionId() != null && !request.getPromotionId().isEmpty()) {
            promotion = promotionRepository
                    .findById(request.getPromotionId())
                    .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
        }

        // Validate các trường mỹ phẩm
        validateCosmeticFields(request.getBrand(), request.getExpiryDate());

        // Tạo product entity từ request
        Product product = productMapper.toProduct(request);
        product.setId(request.getId());
        product.setSubmittedBy(user);
        product.setCategory(category);
        product.setPromotion(promotion);
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());
        product.setQuantitySold(0);

        // Staff tự động approve sản phẩm khi tạo
        product.setStatus(ProductStatus.APPROVED);
        product.setApprovedBy(user);
        product.setApprovedAt(LocalDateTime.now());

        // Tính toán giá sản phẩm - chỉ khi có unitPrice (không có variants)
        if (request.getUnitPrice() != null) {
            if (request.getUnitPrice() < 0) {
                throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
            }
            product.setUnitPrice(request.getUnitPrice());
            Double explicitPrice = request.getPrice();
            double finalPrice = (explicitPrice != null && explicitPrice >= 0)
                    ? explicitPrice
                    : computeFinalPrice(request.getUnitPrice(), request.getTax(), request.getDiscountValue());
            product.setPrice(finalPrice);
        } else {
            product.setPrice(0.0);
            product.setUnitPrice(0.0);
        }

        // Khởi tạo tồn kho nếu có số lượng ban đầu
        if (request.getStockQuantity() != null) {
            Inventory inventory = Inventory.builder()
                    .stockQuantity(request.getStockQuantity())
                    .lastUpdated(LocalDate.now())
                    .product(product)
                    .build();
            product.setInventory(inventory);
        }

        // Gắn media (ảnh/video) từ request
        attachMediaFromRequest(product, request);

        // Lưu sản phẩm
        try {
            // Đảm bảo variants collection được khởi tạo để tránh lỗi Hibernate
            if (product.getVariants() == null) {
                product.setVariants(new ArrayList<>());
            }

            Product savedProduct = productRepository.save(product);

            // Đảm bảo defaultMedia được set đúng sau khi save
            if (savedProduct.getMediaList() != null && !savedProduct.getMediaList().isEmpty()) {
                ProductMedia defaultMedia = savedProduct.getMediaList().stream()
                        .filter(ProductMedia::isDefault)
                        .findFirst()
                        .orElse(savedProduct.getMediaList().get(0));
                if (savedProduct.getDefaultMedia() == null ||
                        !savedProduct.getDefaultMedia().getId().equals(defaultMedia.getId())) {
                    defaultMedia.setDefault(true);
                    savedProduct.setDefaultMedia(defaultMedia);
                    savedProduct = productRepository.save(savedProduct);
                }
            }

            // Refresh entity để đảm bảo tất cả collections được load đúng
            productRepository.flush();
            savedProduct = productRepository.findById(savedProduct.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

            // Đảm bảo variants collection vẫn được reference đúng
            if (savedProduct.getVariants() == null) {
                savedProduct.setVariants(new ArrayList<>());
            }

            // Áp dụng promotion theo category nếu chưa có promotion
            if (savedProduct.getPromotion() == null) {
                promotionService.applyCategoryPromotionToProduct(savedProduct);
            }

            // Refresh lại sau khi apply promotion
            savedProduct = productRepository.findById(savedProduct.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

            return productMapper.toResponse(savedProduct);
        } catch (DataIntegrityViolationException e) {
            log.error("Data integrity violation when creating product", e);

            // Kiểm tra xem có phải duplicate product ID không
            if (e.getCause() instanceof ConstraintViolationException) {
                ConstraintViolationException cve = (ConstraintViolationException) e.getCause();
                String constraintName = cve.getConstraintName();
                String message = e.getMessage();

                // Kiểm tra duplicate entry cho product ID
                if ((constraintName != null && constraintName.contains("product")) ||
                        (message != null && (message.contains("Duplicate entry") ||
                                message.contains("unique constraint") ||
                                message.contains("PRIMARY KEY")))) {
                    log.warn("Duplicate product ID detected: {}", request.getId());
                    throw new AppException(ErrorCode.PRODUCT_ALREADY_EXISTS);
                }
            }

            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    // ========== UPDATE OPERATIONS ==========

    /**
     * Cập nhật thông tin sản phẩm
     * Staff chỉ có thể cập nhật sản phẩm của chính họ
     * Admin có thể cập nhật bất kỳ sản phẩm nào
     */
    @Transactional
    public ProductResponse updateProduct(String productId, ProductUpdateRequest request) {
        Authentication authentication = SecurityUtil.getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        // Validate các trường mỹ phẩm nếu có trong request
        if (request.getBrand() != null || request.getExpiryDate() != null) {
            validateCosmeticFields(request.getBrand(), request.getExpiryDate());
        }

        // Kiểm tra xem có thay đổi trường cần duyệt không (chỉ áp dụng cho staff)
        boolean requiresApproval = false;
        if (!isAdmin) {
            requiresApproval = checkIfRequiresApproval(request, product);
        }

        // Lưu status hiện tại trước khi update (để giữ nguyên nếu không cần duyệt)
        ProductStatus currentStatus = product.getStatus();

        // Cập nhật thông tin sản phẩm
        productMapper.updateProduct(product, request);
        product.setUpdatedAt(LocalDateTime.now());

        // Xử lý status: chỉ thay đổi khi cần duyệt
        if (!isAdmin) {
            if (requiresApproval) {
                product.setStatus(ProductStatus.PENDING);
                product.setRejectionReason(null);
            } else {
                product.setStatus(currentStatus);
            }
        }

        // Cập nhật unitPrice, tax, discountValue nếu có trong request
        boolean unitPriceChanged = request.getUnitPrice() != null;
        boolean taxChanged = request.getTax() != null;
        boolean discountChanged = request.getDiscountValue() != null;
        boolean priceProvided = request.getPrice() != null;

        if (unitPriceChanged) {
            product.setUnitPrice(request.getUnitPrice());
        }

        if (taxChanged) {
            product.setTax(request.getTax());
        }

        if (discountChanged) {
            product.setDiscountValue(request.getDiscountValue());
        }

        // Tính lại price dựa trên unitPrice, tax, discountValue
        if (priceProvided && request.getPrice() != null && request.getPrice() >= 0) {
            product.setPrice(request.getPrice());
        } else if (unitPriceChanged || taxChanged || discountChanged) {
            Double unitPrice = product.getUnitPrice();
            Double tax = product.getTax();
            Double discountValue = product.getDiscountValue();

            if (unitPrice != null && unitPrice >= 0) {
                product.setPrice(computeFinalPrice(unitPrice, tax, discountValue));
            }
        }

        // Cập nhật category nếu có
        if (request.getCategoryId() != null && !request.getCategoryId().isEmpty()) {
            Category category = categoryRepository
                    .findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
            product.setCategory(category);
        }

        // Cập nhật promotion nếu có
        if (request.getPromotionId() != null) {
            if (request.getPromotionId().isEmpty()) {
                product.setPromotion(null);
            } else {
                Promotion promotion = promotionRepository
                        .findById(request.getPromotionId())
                        .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
                product.setPromotion(promotion);
            }
        }

        // Cập nhật inventory nếu có
        if (request.getStockQuantity() != null) {
            if (product.getInventory() == null) {
                Inventory inventory = Inventory.builder()
                        .stockQuantity(request.getStockQuantity())
                        .lastUpdated(LocalDate.now())
                        .product(product)
                        .build();
                product.setInventory(inventory);
            } else {
                product.getInventory().setStockQuantity(request.getStockQuantity());
                product.getInventory().setLastUpdated(LocalDate.now());
            }
        }

        // Cập nhật media nếu có
        if (request.getImageUrls() != null || request.getVideoUrls() != null) {
            // Thu thập tất cả URLs từ request (cả image và video)
            Set<String> newMediaUrls = new HashSet<>();
            if (request.getImageUrls() != null) {
                newMediaUrls.addAll(request.getImageUrls());
            }
            if (request.getVideoUrls() != null) {
                newMediaUrls.addAll(request.getVideoUrls());
            }

            // Xóa media cũ và file vật lý
            // Logic: Nếu existing media bị user xóa trong frontend, URL đó sẽ không có
            // trong request
            // → Backend sẽ xóa file vật lý của những media không có trong request mới
            if (product.getMediaList() != null && !product.getMediaList().isEmpty()) {
                int deletedFileCount = 0;
                // Chỉ xóa file vật lý của những media không có trong request mới
                // (bao gồm cả existing media bị user xóa và media thực sự bị thay thế)
                for (ProductMedia oldMedia : product.getMediaList()) {
                    String oldUrl = oldMedia.getMediaUrl();
                    // Chỉ xóa file nếu URL không có trong request mới
                    if (oldUrl != null && !newMediaUrls.contains(oldUrl)) {
                        deletePhysicalFileByUrl(oldUrl);
                        deletedFileCount++;
                        log.info("Deleted physical file for removed media: {}", oldUrl);
                    }
                }
                if (deletedFileCount > 0) {
                    log.info("Deleted {} physical media files for product {} (removed by user or replaced)",
                            deletedFileCount, productId);
                }
                // Clear collection trước khi xóa để tránh lỗi Hibernate orphan removal
                List<ProductMedia> oldMediaList = new ArrayList<>(product.getMediaList());
                product.getMediaList().clear();
                // Xóa media khỏi database
                productMediaRepository.deleteAll(oldMediaList);
                log.info("Deleted {} ProductMedia records from database for product {}",
                        oldMediaList.size(), productId);
            }
            // Gắn media mới từ request (bao gồm cả media cũ và mới)
            attachMediaFromUpdateRequest(product, request);
        }

        // Cập nhật status nếu có trong request
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }

        Product savedProduct = productRepository.save(product);
        log.info("Product updated: {} by user: {}", productId, user.getEmail());

        // Refresh promotion pricing after update
        if (savedProduct.getStatus() == ProductStatus.APPROVED) {
            // Re-apply category promotion if no direct promotion is set
            // If a direct promotion IS set, we should also re-calculate pricing for it
            if (savedProduct.getPromotion() == null) {
                promotionService.applyCategoryPromotionToProduct(savedProduct);
            } else {
                // Refresh direct promotion pricing
                promotionService.applyPricingForProducts(savedProduct.getPromotion(), List.of(savedProduct));
            }
        }

        // Final refresh to get updated prices
        savedProduct = productRepository.findById(savedProduct.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        return productMapper.toResponse(savedProduct);
    }

    @Transactional
    public ProductResponse restockProduct(String productId, ProductRestockRequest request) {
        Authentication authentication = SecurityUtil.getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        int quantityToAdd = request.getQuantity();
        if (quantityToAdd <= 0) {
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        Inventory inventory = product.getInventory();
        if (inventory == null) {
            inventory = Inventory.builder()
                    .stockQuantity(quantityToAdd)
                    .lastUpdated(LocalDate.now())
                    .product(product)
                    .build();
            product.setInventory(inventory);
        } else {
            int currentStock = inventory.getStockQuantity() != null ? inventory.getStockQuantity() : 0;
            inventory.setStockQuantity(currentStock + quantityToAdd);
            inventory.setLastUpdated(LocalDate.now());
        }

        product.setUpdatedAt(LocalDateTime.now());
        Product savedProduct = productRepository.save(product);
        return productMapper.toResponse(savedProduct);
    }

    // ========== DELETE OPERATIONS ==========
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteProduct(String productId) {
        String userEmail = SecurityUtil.getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Load product với tất cả relations để đảm bảo có thể xóa đúng cách
        Product product = productRepository
                .findByIdWithRelations(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        // 1. Xóa product khỏi tất cả Promotion.productApply (bảng promotion_products)
        List<Promotion> promotionsWithProduct = promotionRepository.findByProductId(productId);
        for (Promotion promotion : promotionsWithProduct) {
            promotion.getProductApply().remove(product);
            promotionRepository.save(promotion);
        }

        // 2. Xóa product khỏi tất cả Voucher.productApply (bảng voucher_products)
        // Tìm tất cả vouchers có product này
        List<Voucher> vouchersWithProduct = voucherRepository.findByProductId(productId);
        for (Voucher voucher : vouchersWithProduct) {
            voucher.getProductApply().remove(product);
            voucherRepository.save(voucher);
        }

        // 3. Xóa product khỏi tất cả Banner.products (bảng banner_products)
        // Force load banners collection nếu chưa được load
        if (product.getBanners() != null) {
            product.getBanners().size(); // Trigger lazy loading
            List<Banner> bannersWithProduct = new ArrayList<>(product.getBanners());
            for (Banner banner : bannersWithProduct) {
                if (banner.getProducts() != null) {
                    banner.getProducts().remove(product);
                    bannerRepository.save(banner);
                }
            }
        }

        // 4. Set product.promotion = null (nếu có promotion trực tiếp)
        if (product.getPromotion() != null) {
            product.setPromotion(null);
            productRepository.save(product);
        }

        // 5. Xóa hoặc set null product trong FinancialRecord (tránh foreign key
        // constraint)
        List<FinancialRecord> financialRecords = financialRecordRepository.findByProductId(productId);
        if (!financialRecords.isEmpty()) {
            for (FinancialRecord record : financialRecords) {
                record.setProduct(null);
            }
            financialRecordRepository.saveAll(financialRecords);
            log.info("Set product to null for {} financial records before deleting product {}",
                    financialRecords.size(), productId);
        }

        // 6. Set default_media_id = null trước khi xóa ProductMedia (tránh foreign key
        // constraint)
        if (product.getDefaultMedia() != null) {
            product.setDefaultMedia(null);
            productRepository.saveAndFlush(product); // Flush ngay để đảm bảo thay đổi được ghi vào DB
            log.info("Set default_media_id to null for product {} before deleting media", productId);
        }

        // 7. Xóa file media vật lý trong thư mục product_media (nếu có)
        deleteMediaFilesIfExists(product);

        // 8. Xóa tất cả ProductMedia records (tránh foreign key constraint)
        // Load mediaList để đảm bảo được fetch
        if (product.getMediaList() != null) {
            product.getMediaList().size(); // Trigger lazy loading nếu cần
        }

        // Xóa từng ProductMedia record thủ công thay vì dùng query để tránh foreign key
        // constraint
        List<ProductMedia> mediaList = productMediaRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        if (!mediaList.isEmpty()) {
            // Clear collection trước khi xóa để tránh lỗi Hibernate orphan removal
            if (product.getMediaList() != null) {
                product.getMediaList().clear();
            }
            // Xóa media khỏi database
            productMediaRepository.deleteAll(mediaList);
            productMediaRepository.flush(); // Flush để đảm bảo xóa được thực hiện ngay
            log.info("Deleted {} ProductMedia records for product {}", mediaList.size(), productId);
        }

        // 9. Xóa product
        productRepository.delete(product);
        log.info("Product deleted: {} by user: {}", productId, user.getEmail());
    }

    // ========== READ OPERATIONS ==========
    public ProductResponse getProductById(String productId) {
        Product product = productRepository
                .findByIdWithRelations(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        // Tìm promotion active cho sản phẩm này
        Promotion activePromotion = findActivePromotionForProduct(product);

        // Nếu có promotion active, set vào product
        if (activePromotion != null) {
            product.setPromotion(activePromotion);
        } else {
            // Nếu không có promotion active, set null
            product.setPromotion(null);
        }

        return productMapper.toResponse(product);
    }

    // Tìm promotion đang active cho sản phẩm (theo product trực tiếp hoặc theo
    // category)
    private Promotion findActivePromotionForProduct(Product product) {
        LocalDate today = LocalDate.now();
        List<Promotion> activePromotions = new ArrayList<>();

        // 1. Kiểm tra promotion trực tiếp của product
        if (product.getPromotion() != null) {
            Promotion directPromo = product.getPromotion();
            if (isPromotionActive(directPromo, today)) {
                activePromotions.add(directPromo);
            }
        }

        // 2. Tìm promotion active theo product ID (từ promotion_products table)
        if (product.getId() != null) {
            List<Promotion> productPromotions = promotionRepository.findActiveByProductId(product.getId(), today);
            activePromotions.addAll(productPromotions);
        }

        // 3. Tìm promotion active theo category
        if (product.getCategory() != null && product.getCategory().getId() != null) {
            List<Promotion> categoryPromotions = promotionRepository
                    .findActiveByCategoryId(product.getCategory().getId(), today);
            activePromotions.addAll(categoryPromotions);
        }

        // Loại bỏ trùng lặp và lấy promotion có startDate sớm nhất (ưu tiên promotion
        // bắt đầu sớm hơn)
        return activePromotions.stream()
                .distinct()
                .filter(p -> isPromotionActive(p, today))
                .min(Comparator.comparing(Promotion::getStartDate,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
    }

    // Kiểm tra promotion có đang active không
    private boolean isPromotionActive(Promotion promotion, LocalDate today) {
        if (promotion == null)
            return false;

        // Phải là APPROVED và isActive = true
        if (promotion.getStatus() != PromotionStatus.APPROVED) {
            return false;
        }
        if (!promotion.getIsActive()) {
            return false;
        }

        // Kiểm tra thời gian: startDate <= today <= expiryDate
        if (promotion.getStartDate() != null && promotion.getStartDate().isAfter(today)) {
            return false; // Chưa đến ngày bắt đầu
        }
        if (promotion.getExpiryDate() != null && promotion.getExpiryDate().isBefore(today)) {
            return false; // Đã hết hạn
        }

        return true;
    }

    public List<ProductResponse> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return products.stream().map(productMapper::toResponse).toList();
    }

    public List<ProductResponse> getActiveProducts() {
        // Chỉ lấy products có status APPROVED (không lấy DISABLED)
        List<Product> products = productRepository.findByStatus(ProductStatus.APPROVED);
        return products.stream().map(productMapper::toResponse).toList();
    }

    public List<ProductResponse> getProductsByCategory(String categoryId) {
        // Lấy tất cả category IDs bao gồm cả danh mục con
        List<String> categoryIds = new ArrayList<>();
        categoryIds.add(categoryId);

        // Lấy tất cả danh mục con (recursive)
        List<Category> subCategories = categoryRepository.findByParentCategoryId(categoryId);
        collectAllSubCategoryIds(subCategories, categoryIds);

        // Lấy tất cả sản phẩm thuộc category và các sub-categories
        List<Product> products = new ArrayList<>();
        for (String id : categoryIds) {
            products.addAll(productRepository.findByCategoryId(id));
        }

        return products.stream()
                .filter(p -> p.getStatus() == ProductStatus.APPROVED)
                .distinct() // Loại bỏ trùng lặp nếu có
                .map(productMapper::toResponse)
                .toList();
    }

    // Thu thập tất cả category IDs từ danh sách categories và các sub-categories
    // của chúng
    private void collectAllSubCategoryIds(List<Category> categories, List<String> categoryIds) {
        for (Category category : categories) {
            if (category.getId() != null && !categoryIds.contains(category.getId())) {
                categoryIds.add(category.getId());
                // Lấy sub-categories của category này
                List<Category> subCategories = categoryRepository.findByParentCategoryId(category.getId());
                if (!subCategories.isEmpty()) {
                    collectAllSubCategoryIds(subCategories, categoryIds);
                }
            }
        }
    }

    public List<ProductResponse> searchProducts(String keyword) {
        List<Product> products = productRepository.findByKeyword(keyword);
        return products.stream()
                .filter(p -> p.getStatus() == ProductStatus.APPROVED)
                .map(productMapper::toResponse)
                .toList();
    }

    public List<ProductResponse> getProductsByPriceRange(Double minPrice, Double maxPrice) {
        List<Product> products = productRepository.findByPriceRange(minPrice, maxPrice);
        return products.stream()
                .filter(p -> p.getStatus() == ProductStatus.APPROVED)
                .map(productMapper::toResponse)
                .toList();
    }

    public List<ProductResponse> getMyProducts() {
        String userEmail = SecurityUtil.getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        List<Product> products = productRepository.findBySubmittedBy(user);
        return products.stream().map(productMapper::toResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<ProductResponse> getPendingProducts() {
        List<Product> products = productRepository.findByStatus(ProductStatus.PENDING);
        return products.stream().map(productMapper::toResponse).toList();
    }

    // ========== APPROVAL OPERATIONS ==========

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public ProductResponse approveProduct(ApproveProductRequest request) {
        String adminEmail = SecurityUtil.getCurrentUserEmail();
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Product product = productRepository
                .findById(request.getProductId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        // Xử lý approve, reject, disable hoặc enable
        if ("APPROVE".equals(request.getAction())) {
            product.setStatus(ProductStatus.APPROVED);
            product.setApprovedBy(admin);
            product.setApprovedAt(LocalDateTime.now());
            product.setRejectionReason(null);
            product.setUpdatedAt(LocalDateTime.now());

            if (product.getPromotion() == null) {
                promotionService.applyCategoryPromotionToProduct(product);
            }
        } else if ("REJECT".equals(request.getAction())) {
            product.setStatus(ProductStatus.REJECTED);
            product.setApprovedBy(null);
            product.setApprovedAt(null);
            product.setRejectionReason(request.getReason());
            product.setUpdatedAt(LocalDateTime.now());
            log.info("Product rejected: {} by admin: {}", product.getId(), adminEmail);
        } else if ("DISABLE".equals(request.getAction())) {
            product.setStatus(ProductStatus.DISABLED);
            product.setUpdatedAt(LocalDateTime.now());
        } else if ("ENABLE".equals(request.getAction())) {
            product.setStatus(ProductStatus.APPROVED);
            product.setUpdatedAt(LocalDateTime.now());

            // Khi enable lại sản phẩm, cũng kiểm tra và áp dụng promotion theo category
            if (product.getPromotion() == null) {
                promotionService.applyCategoryPromotionToProduct(product);
            }
        }

        Product savedProduct = productRepository.save(product);
        return productMapper.toResponse(savedProduct);
    }

    // ========== MEDIA OPERATIONS ==========
    @Transactional
    public ProductResponse setDefaultMedia(String productId, String mediaUrl) {
        Authentication authentication = SecurityUtil.getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Product product = productRepository
                .findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        var mediaOpt = productMediaRepository.findByProductIdAndMediaUrl(productId, mediaUrl);
        if (mediaOpt.isEmpty()) {
            throw new AppException(ErrorCode.PRODUCT_NOT_EXISTED);
        }
        var media = mediaOpt.get();

        // Reorder displayOrder so that selected media is first (0) and others shift
        // down
        List<ProductMedia> medias = productMediaRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        int order = 1; // start from 1 for non-default
        for (ProductMedia m : medias) {
            if (m.getId().equals(media.getId())) {
                m.setDisplayOrder(0);
                m.setDefault(true);
            } else {
                m.setDisplayOrder(order++);
                m.setDefault(false);
            }
            productMediaRepository.save(m);
        }

        // Update product defaultMedia reference
        product.setDefaultMedia(media);
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    // ========== PRIVATE HELPER METHODS ==========

    /**
     * Kiểm tra xem có thay đổi trường cần duyệt không
     * 
     * Trường cần duyệt:
     * - Giá cả (unitPrice, price, tax, discountValue)
     * - Danh mục (categoryId)
     * - Khuyến mãi (promotionId)
     * - Tồn kho (stockQuantity) - nếu giảm, từ 0 sang > 0, hoặc tăng > 100
     * 
     * Trường tự động cập nhật:
     * - name, description, brand, shadeColor, skinType, skinConcern, volume,
     * origin,
     * expiryDate, ingredients, usageInstructions, safetyNote, weight, length,
     * width, height,
     * purchasePrice, mediaUrls
     * 
     * @param request ProductUpdateRequest
     * @param product Product hiện tại
     * @return true nếu cần duyệt, false nếu không
     */
    private boolean checkIfRequiresApproval(ProductUpdateRequest request, Product product) {
        // 1. Kiểm tra thay đổi giá cả
        if (request.getUnitPrice() != null) {
            Double currentUnitPrice = product.getUnitPrice();
            Double newUnitPrice = request.getUnitPrice();
            // So sánh với tolerance, làm tròn để tránh precision issues
            if (currentUnitPrice == null && newUnitPrice != null && newUnitPrice > 0.01) {
                log.debug("Requires approval: unitPrice changed from null to {}", newUnitPrice);
                return true; // Từ null sang có giá trị
            }
            if (currentUnitPrice != null && newUnitPrice != null) {
                // Làm tròn cả hai về 2 chữ số thập phân để so sánh
                double roundedCurrent = Math.round(currentUnitPrice * 100.0) / 100.0;
                double roundedNew = Math.round(newUnitPrice * 100.0) / 100.0;
                if (Math.abs(roundedCurrent - roundedNew) > 0.01) {
                    log.debug("Requires approval: unitPrice changed from {} to {} (rounded: {} vs {})",
                            currentUnitPrice, newUnitPrice, roundedCurrent, roundedNew);
                    return true; // Khác nhau > 0.01
                }
            }
        }

        if (request.getPrice() != null) {
            Double currentPrice = product.getPrice();
            Double newPrice = request.getPrice();
            if (currentPrice == null && newPrice != null && newPrice > 1.0) {
                log.debug("Requires approval: price changed from null to {}", newPrice);
                return true;
            }
            if (currentPrice != null && newPrice != null) {
                long roundedCurrent = Math.round(currentPrice);
                long roundedNew = Math.round(newPrice);
                if (roundedCurrent != roundedNew) {
                    log.debug("Requires approval: price changed from {} to {} (rounded: {} vs {})",
                            currentPrice, newPrice, roundedCurrent, roundedNew);
                    return true;
                }
            }
        }

        if (request.getTax() != null) {
            Double currentTax = product.getTax();
            Double newTax = request.getTax();
            // Làm tròn Tax về 4 chữ số thập phân để so sánh
            if (currentTax == null && newTax != null && newTax > 0.0001) {
                log.info("Requires approval: tax changed from null to {}", newTax);
                return true;
            }
            if (currentTax != null && newTax != null) {
                // Làm tròn cả hai về 4 chữ số thập phân để so sánh
                double roundedCurrent = Math.round(currentTax * 10000.0) / 10000.0;
                double roundedNew = Math.round(newTax * 10000.0) / 10000.0;
                double diff = Math.abs(roundedCurrent - roundedNew);
                log.debug("Tax comparison: current={}, new={}, roundedCurrent={}, roundedNew={}, diff={}",
                        currentTax, newTax, roundedCurrent, roundedNew, diff);
                if (diff > 0.0001) {
                    log.info("Requires approval: tax changed from {} to {} (rounded: {} vs {}, diff={})",
                            currentTax, newTax, roundedCurrent, roundedNew, diff);
                    return true; // Khác nhau > 0.0001
                } else {
                    log.debug("Tax unchanged: {} vs {} (diff={} <= 0.0001)", roundedCurrent, roundedNew, diff);
                }
            }
        }

        if (request.getDiscountValue() != null) {
            Double currentDiscount = product.getDiscountValue();
            Double newDiscount = request.getDiscountValue();
            if (currentDiscount == null && newDiscount != null && newDiscount > 1.0) {
                return true;
            }
            if (currentDiscount != null && newDiscount != null) {
                long roundedCurrent = Math.round(currentDiscount);
                long roundedNew = Math.round(newDiscount);
                if (roundedCurrent != roundedNew) {
                    return true;
                }
            }
        }

        // 2. Kiểm tra thay đổi danh mục
        if (request.getCategoryId() != null && !request.getCategoryId().trim().isEmpty()) {
            String currentCategoryId = product.getCategory() != null ? product.getCategory().getId() : null;
            String newCategoryId = request.getCategoryId().trim();
            if (currentCategoryId == null || currentCategoryId.isEmpty()) {
                if (newCategoryId != null && !newCategoryId.isEmpty()) {
                    log.debug("Requires approval: categoryId changed from null/empty to {}", newCategoryId);
                    return true;
                }
            } else {
                if (!currentCategoryId.equals(newCategoryId)) {
                    log.debug("Requires approval: categoryId changed from {} to {}", currentCategoryId,
                            newCategoryId);
                    return true;
                }
            }
        }

        // 3. Kiểm tra thay đổi khuyến mãi
        if (request.getPromotionId() != null) {
            String currentPromotionId = product.getPromotion() != null ? product.getPromotion().getId() : null;
            String newPromotionId = request.getPromotionId().isEmpty() ? null : request.getPromotionId();

            // So sánh: null != null là false, nhưng null != "something" là true
            boolean promotionChanged = (currentPromotionId == null && newPromotionId != null) ||
                    (currentPromotionId != null && !currentPromotionId.equals(newPromotionId));
            if (promotionChanged) {
                return true;
            }
        }

        // 4. Kiểm tra thay đổi tồn kho
        // Giảm số lượng luôn cần duyệt, từ 0 sang > 0 cần duyệt, tăng > 100 cần duyệt
        if (request.getStockQuantity() != null) {
            int currentStock = product.getInventory() != null && product.getInventory().getStockQuantity() != null
                    ? product.getInventory().getStockQuantity()
                    : 0;
            int newStock = request.getStockQuantity();

            if (currentStock != newStock) {
                // Nếu giảm số lượng (newStock < currentStock): Luôn cần duyệt
                if (newStock < currentStock) {
                    log.debug("Requires approval: stockQuantity decreased from {} to {}", currentStock, newStock);
                    return true;
                }

                // Nếu từ 0 sang > 0: Cần duyệt
                if (currentStock == 0 && newStock > 0) {
                    log.debug("Requires approval: stockQuantity changed from 0 to {}", newStock);
                    return true;
                }

                // Nếu tăng số lượng (newStock > currentStock): Kiểm tra giới hạn 100
                if (newStock > currentStock) {
                    int addedQuantity = newStock - currentStock;
                    // Giới hạn: staff có thể thêm tối đa 100 sản phẩm mà không cần duyệt
                    if (addedQuantity > 100) {
                        log.debug("Requires approval: stockQuantity increased by {} (from {} to {}), exceeds limit",
                                addedQuantity, currentStock, newStock);
                        return true;
                    }
                }
            }
            // Nếu currentStock == newStock, không có thay đổi, không cần duyệt
        }

        log.debug("No approval required - only auto-update fields changed");
        return false;
    }

    /**
     * Validate các trường mỹ phẩm
     * 
     * @param brand      Thương hiệu (required cho create, optional cho update)
     * @param expiryDate Ngày hết hạn (optional)
     */
    private void validateCosmeticFields(String brand, LocalDate expiryDate) {
        // Validate brand: không được để trống hoặc chỉ có khoảng trắng
        if (brand != null && brand.trim().isEmpty()) {
            log.warn("Invalid brand: brand cannot be empty or whitespace only");
            throw new AppException(ErrorCode.BAD_REQUEST);
        }

        // Validate expiryDate: Cho phép ngày trong quá khứ vì có thể nhập sản phẩm đã
        // sản xuất
        if (expiryDate != null) {
            // Không được quá 10 năm trong tương lai
            LocalDate maxFutureDate = LocalDate.now().plusYears(10);
            if (expiryDate.isAfter(maxFutureDate)) {
                log.warn("Invalid expiryDate: {} is more than 10 years in the future", expiryDate);
                throw new AppException(ErrorCode.BAD_REQUEST);
            }
        }
    }

    private Double computeFinalPrice(Double unitPrice, Double taxNullable, Double discountNullable) {
        double tax = (taxNullable != null && taxNullable >= 0) ? taxNullable : 0.0;
        double discount = (discountNullable != null && discountNullable >= 0) ? discountNullable : 0.0;
        double finalPrice = unitPrice * (1 + tax) - discount;
        return Math.max(0, finalPrice); // Đảm bảo giá không âm
    }

    private void attachMediaFromRequest(Product product, ProductCreationRequest request) {
        List<ProductMedia> mediaEntities = new ArrayList<>();
        ProductMedia defaultMedia = null;
        int displayOrder = 0;

        // Xử lý ảnh
        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                if (url == null || url.isBlank())
                    continue;
                ProductMedia media = ProductMedia.builder()
                        .mediaUrl(url)
                        .mediaType("IMAGE")
                        .isDefault(url.equals(request.getDefaultMediaUrl()))
                        .displayOrder(displayOrder++)
                        .product(product)
                        .build();
                if (media.isDefault())
                    defaultMedia = media;
                mediaEntities.add(media);
            }
        }

        // Xử lý video
        if (request.getVideoUrls() != null) {
            for (String url : request.getVideoUrls()) {
                if (url == null || url.isBlank())
                    continue;
                ProductMedia media = ProductMedia.builder()
                        .mediaUrl(url)
                        .mediaType("VIDEO")
                        .isDefault(url.equals(request.getDefaultMediaUrl()))
                        .displayOrder(displayOrder++)
                        .product(product)
                        .build();
                if (media.isDefault())
                    defaultMedia = media;
                mediaEntities.add(media);
            }
        }

        // Gắn media vào product
        if (!mediaEntities.isEmpty()) {
            // Clear collection hiện có trước (nếu có) để tránh lỗi Hibernate
            if (product.getMediaList() == null) {
                product.setMediaList(new ArrayList<>());
            } else {
                product.getMediaList().clear();
            }
            // Add tất cả media mới vào collection hiện có
            product.getMediaList().addAll(mediaEntities);
            // Nếu không có media nào được đánh dấu là default, chọn media đầu tiên
            if (defaultMedia == null) {
                defaultMedia = mediaEntities.get(0);
                defaultMedia.setDefault(true);
            }
            product.setDefaultMedia(defaultMedia);
        }
    }

    private void attachMediaFromUpdateRequest(Product product, ProductUpdateRequest request) {
        List<ProductMedia> mediaEntities = new ArrayList<>();
        ProductMedia defaultMedia = null;
        int displayOrder = 0;

        // Xử lý ảnh
        if (request.getImageUrls() != null) {
            for (String url : request.getImageUrls()) {
                if (url == null || url.isBlank())
                    continue;
                ProductMedia media = ProductMedia.builder()
                        .mediaUrl(url)
                        .mediaType("IMAGE")
                        .isDefault(url.equals(request.getDefaultMediaUrl()))
                        .displayOrder(displayOrder++)
                        .product(product)
                        .build();
                if (media.isDefault())
                    defaultMedia = media;
                mediaEntities.add(media);
            }
        }

        // Xử lý video
        if (request.getVideoUrls() != null) {
            for (String url : request.getVideoUrls()) {
                if (url == null || url.isBlank())
                    continue;
                ProductMedia media = ProductMedia.builder()
                        .mediaUrl(url)
                        .mediaType("VIDEO")
                        .isDefault(url.equals(request.getDefaultMediaUrl()))
                        .displayOrder(displayOrder++)
                        .product(product)
                        .build();
                if (media.isDefault())
                    defaultMedia = media;
                mediaEntities.add(media);
            }
        }

        // Gắn media vào product
        if (!mediaEntities.isEmpty()) {
            // Clear collection hiện có trước (nếu có) để tránh lỗi Hibernate
            if (product.getMediaList() == null) {
                product.setMediaList(new ArrayList<>());
            } else {
                product.getMediaList().clear();
            }
            // Add tất cả media mới vào collection hiện có
            product.getMediaList().addAll(mediaEntities);
            // Nếu không có media nào được đánh dấu là default, chọn media đầu tiên
            if (defaultMedia == null) {
                defaultMedia = mediaEntities.get(0);
                defaultMedia.setDefault(true);
            }
            product.setDefaultMedia(defaultMedia);
        }
    }

    private void deleteMediaFilesIfExists(Product product) {
        try {
            if (product.getMediaList() != null) {
                for (ProductMedia media : product.getMediaList()) {
                    deletePhysicalFileByUrl(media.getMediaUrl());
                }
            }
            if (product.getDefaultMedia() != null) {
                deletePhysicalFileByUrl(product.getDefaultMedia().getMediaUrl());
            }

            if (product.getCategory() != null) {
                fileStorageService.deleteProductFolder(product.getCategory().getId(), product.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to delete media files for product {}: {}", product.getId(), e.getMessage());
        }
    }

    private void deletePhysicalFileByUrl(String url) {
        // Xóa file từ Cloudinary thay vì local storage
        fileStorageService.deleteFileFromCloudinary(url);
    }
}
