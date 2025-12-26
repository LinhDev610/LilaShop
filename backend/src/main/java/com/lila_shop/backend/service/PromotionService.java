package com.lila_shop.backend.service;

import com.lila_shop.backend.dto.request.ApprovePromotionRequest;
import com.lila_shop.backend.dto.request.PromotionCreationRequest;
import com.lila_shop.backend.dto.request.PromotionUpdateRequest;
import com.lila_shop.backend.dto.response.PromotionResponse;
import com.lila_shop.backend.entity.*;
import com.lila_shop.backend.enums.DiscountApplyScope;
import com.lila_shop.backend.enums.ProductStatus;
import com.lila_shop.backend.enums.PromotionStatus;
import com.lila_shop.backend.exception.AppException;
import com.lila_shop.backend.exception.ErrorCode;
import com.lila_shop.backend.mapper.PromotionMapper;
import com.lila_shop.backend.repository.CategoryRepository;
import com.lila_shop.backend.repository.ProductRepository;
import com.lila_shop.backend.repository.PromotionRepository;
import com.lila_shop.backend.repository.UserRepository;
import com.lila_shop.backend.util.SecurityUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import com.lila_shop.backend.util.CategoryUtil;
import org.springframework.data.jpa.domain.Specification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PromotionService {

    PromotionRepository promotionRepository;
    UserRepository userRepository;
    CategoryRepository categoryRepository;
    ProductRepository productRepository;
    PromotionMapper promotionMapper;
    FileStorageService fileStorageService;

    @Transactional
    public PromotionResponse createPromotion(PromotionCreationRequest request) {
        // Get user hiện tại từ security context
        User staff = getCurrentUser();

        // Kiểm tra xem mã promotion đã tồn tại chưa
        if (promotionRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.PROMOTION_CODE_ALREADY_EXISTS);
        }

        // Kiểm tra trùng lặp promotion khi tạo mới
        validatePromotionOverlap(request);

        // Tạo promotion entity
        Promotion promotion = promotionMapper.toPromotion(request);

        // Set các trường workflow
        promotion.setUsageCount(0);
        promotion.setStatus(PromotionStatus.APPROVED);
        promotion.setApprovedBy(staff);
        promotion.setApprovedAt(LocalDateTime.now());
        promotion.setSubmittedBy(staff);
        promotion.setSubmittedAt(LocalDateTime.now());

        applyScopeTargets(request.getApplyScope(), request.getCategoryIds(), request.getProductIds(), promotion);

        // Kích hoạt ngay nếu startDate đã đến (hôm nay hoặc quá khứ)
        LocalDate today = LocalDate.now();
        if (promotion.getStartDate() != null && !promotion.getStartDate().isAfter(today)) {
            promotion.setIsActive(true);
            // Chúng ta sẽ apply sau khi save để đảm bảo có ID
        } else {
            promotion.setIsActive(false);
        }

        Promotion savedPromotion = promotionRepository.save(promotion);
        log.info("Promotion created with ID: {} by staff: {}", savedPromotion.getId(), staff.getId());

        // Apply promotion nếu đã active
        if (Boolean.TRUE.equals(savedPromotion.getIsActive())) {
            applyPromotionToTargets(savedPromotion);
        }

        return promotionMapper.toResponse(savedPromotion);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public PromotionResponse approvePromotion(ApprovePromotionRequest request) {
        // Get current admin from security context
        User admin = getCurrentUser();

        // Get promotion
        Promotion promotion = promotionRepository
                .findById(request.getPromotionId())
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_EXISTED));

        if (promotion.getStatus() != PromotionStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.PROMOTION_NOT_PENDING);
        }

        if ("APPROVE".equals(request.getAction())) {
            promotion.setStatus(PromotionStatus.APPROVED);
            promotion.setApprovedBy(admin);
            promotion.setApprovedAt(LocalDateTime.now());

            // Chỉ activate và apply ngay nếu startDate đã đến, nếu chưa thì để scheduled
            // task tự động activate
            LocalDate today = LocalDate.now();
            if (promotion.getStartDate() != null && !promotion.getStartDate().isAfter(today)) {
                // StartDate đã đến hoặc hôm nay - activate và apply ngay
                promotion.setIsActive(true);
                applyPromotionToTargets(promotion);
            } else {
                // StartDate chưa đến - set isActive = false, scheduled task sẽ tự động activate
                // khi đến startDate
                promotion.setIsActive(false);
            }
        } else if ("REJECT".equals(request.getAction())) {
            promotion.setStatus(PromotionStatus.REJECTED);
            promotion.setApprovedBy(admin);
            promotion.setApprovedAt(LocalDateTime.now());
            promotion.setRejectionReason(request.getReason());
            promotion.setIsActive(false);
            // log.info("Promotion rejected: {} by admin: {}", promotion.getId(),
            // admin.getId());
        }

        Promotion savedPromotion = promotionRepository.save(promotion);
        return promotionMapper.toResponse(savedPromotion);
    }

    public PromotionResponse getPromotionById(String promotionId) {
        Promotion promotion = promotionRepository
                .findById(promotionId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_EXISTED));

        return promotionMapper.toResponse(promotion);
    }

    public List<PromotionResponse> getMyPromotions() {
        // Get current user from security context
        User staff = getCurrentUser();

        List<Promotion> promotions = promotionRepository.findBySubmittedBy(staff);

        return promotions.stream().map(promotionMapper::toResponse).collect(Collectors.toList());
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<PromotionResponse> getPendingPromotions() {
        List<Promotion> pendingPromotions = promotionRepository.findByStatus(PromotionStatus.PENDING_APPROVAL);

        return pendingPromotions.stream().map(promotionMapper::toResponse).collect(Collectors.toList());
    }

    // Cho phép cả admin và staff xem promotions theo status
    public List<PromotionResponse> getPromotionsByStatus(PromotionStatus status) {
        List<Promotion> promotions = promotionRepository.findByStatus(status);

        return promotions.stream().map(promotionMapper::toResponse).collect(Collectors.toList());
    }

    public List<PromotionResponse> getActivePromotions() {
        List<Promotion> activePromotions = promotionRepository.findActivePromotions(LocalDate.now());

        return activePromotions.stream().map(promotionMapper::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public PromotionResponse updatePromotion(String promotionId, PromotionUpdateRequest request) {
        // Get current user from security context
        User currentUser = getCurrentUser();
        String currentUserId = currentUser.getId();

        Promotion promotion = promotionRepository
                .findById(promotionId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_EXISTED));

        // Check if user is the submitter or admin
        boolean isAdmin = SecurityUtil.getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !promotion.getSubmittedBy().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Check code uniqueness if code is being updated
        if (request.getCode() != null && !request.getCode().equals(promotion.getCode())) {
            if (promotionRepository.existsByCode(request.getCode())) {
                throw new AppException(ErrorCode.PROMOTION_CODE_ALREADY_EXISTS);
            }
        }

        boolean wasApprovedAndActive = promotion.getStatus() == PromotionStatus.APPROVED
                && Boolean.TRUE.equals(promotion.getIsActive());
        if (wasApprovedAndActive) {
            clearPromotionPricing(promotion);
        }

        // Update promotion using mapper
        promotionMapper.updatePromotion(promotion, request);

        if (request.getApplyScope() != null || request.getCategoryIds() != null || request.getProductIds() != null) {
            DiscountApplyScope scope = request.getApplyScope() != null
                    ? request.getApplyScope()
                    : promotion.getApplyScope();
            applyScopeTargets(scope, request.getCategoryIds(), request.getProductIds(), promotion);
            promotion.setApplyScope(scope);
        }

        // Nếu staff cập nhật promotion bị từ chối, tự động chuyển về chờ duyệt
        if (!isAdmin && promotion.getStatus() == PromotionStatus.REJECTED) {
            promotion.setStatus(PromotionStatus.PENDING_APPROVAL);
            promotion.setRejectionReason(null); // Xóa lý do từ chối khi gửi lại
        }

        Promotion savedPromotion = promotionRepository.save(promotion);
        if (wasApprovedAndActive) {
            applyPromotionToTargets(savedPromotion);
        }
        // log.info("Promotion updated: {} by user: {}", promotionId, currentUserId);

        return promotionMapper.toResponse(savedPromotion);
    }

    @Transactional
    public void deletePromotion(String promotionId) {
        // Get current user from security context
        User currentUser = getCurrentUser();
        String currentUserId = currentUser.getId();

        Promotion promotion = promotionRepository
                .findById(promotionId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_EXISTED));

        // Check if user is the submitter or admin
        boolean isAdmin = SecurityUtil.getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !promotion.getSubmittedBy().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Khôi phục giá các sản phẩm đang áp dụng promotion này (nếu có)
        clearPromotionPricing(promotion);

        // 1. Xóa product khỏi promotion.productApply (bảng promotion_products)
        promotion.getProductApply().clear();
        promotionRepository.save(promotion);

        // 2. Set product.promotion = null cho các products có promotion này trực tiếp
        List<Product> productsWithDirectPromotion = productRepository.findByPromotionId(promotionId);
        for (Product product : productsWithDirectPromotion) {
            if (product.getPromotion() != null && product.getPromotion().getId().equals(promotionId)) {
                product.setPromotion(null);
                productRepository.save(product);
            }
        }

        // 3. Xóa file media vật lý trong thư mục promotions (nếu có)
        deleteMediaFileIfExists(promotion);

        // 4. Xóa promotion
        promotionRepository.delete(promotion);
        // log.info("Promotion deleted: {} by user: {}", promotionId, currentUserId);
    }

    private User getCurrentUser() {
        String email = SecurityUtil.getCurrentUserEmail();
        return userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private void applyScopeTargets(
            DiscountApplyScope scope, Set<String> categoryIds, Set<String> productIds, Promotion promotion) {
        if (scope == null) {
            throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
        }

        promotion.getCategoryApply().clear();
        promotion.getProductApply().clear();

        switch (scope) {
            case CATEGORY -> {
                validateScopeInputs(categoryIds, productIds, true);
                promotion.getCategoryApply().addAll(resolveCategories(categoryIds));
            }
            case PRODUCT -> {
                validateScopeInputs(categoryIds, productIds, false);
                promotion.getProductApply().addAll(resolveProducts(productIds));
            }
            case ORDER -> {
                if ((categoryIds != null && !categoryIds.isEmpty()) || (productIds != null && !productIds.isEmpty())) {
                    throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
                }
            }
            default -> throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
        }
        promotion.setApplyScope(scope);
    }

    private void validateScopeInputs(Set<String> categoryIds, Set<String> productIds, boolean isCategory) {
        if (isCategory) {
            if (productIds != null && !productIds.isEmpty()) {
                throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
            }
        } else {
            if (categoryIds != null && !categoryIds.isEmpty()) {
                throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
            }
        }
    }

    private Set<Category> resolveCategories(Set<String> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
        }
        return resolveEntities(categoryIds, categoryRepository::findById, ErrorCode.CATEGORY_NOT_EXISTED);
    }

    private Set<Product> resolveProducts(Set<String> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_PROMOTION_SCOPE);
        }
        return resolveEntities(productIds, productRepository::findById, ErrorCode.PRODUCT_NOT_EXISTED);
    }

    private <T, ID> Set<T> resolveEntities(Set<ID> ids, Function<ID, Optional<T>> finder,
            ErrorCode notFoundError) {
        return ids.stream()
                .map(id -> finder.apply(id).orElseThrow(() -> new AppException(notFoundError)))
                .collect(Collectors.toSet());
    }

    public void applyPromotionToTargets(Promotion promotion) {
        // Chỉ áp dụng promotion đã được duyệt (APPROVED)
        if (promotion.getStatus() != PromotionStatus.APPROVED) {
            log.warn("Không thể áp dụng promotion {} vì chưa được duyệt. Trạng thái: {}",
                    promotion.getId(), promotion.getStatus());
            return;
        }

        if (promotion.getApplyScope() == DiscountApplyScope.ORDER) {
            return;
        }
        List<Product> targetProducts = resolveTargetProducts(promotion);
        if (targetProducts.isEmpty()) {
            return;
        }

        ensureProductsAvailableForPromotion(targetProducts, promotion);
        applyPricingForProducts(promotion, targetProducts);
    }

    private List<Product> resolveTargetProducts(Promotion promotion) {
        if (promotion.getApplyScope() == DiscountApplyScope.PRODUCT) {
            return new ArrayList<>(promotion.getProductApply());
        } else if (promotion.getApplyScope() == DiscountApplyScope.CATEGORY) {
            Set<String> categoryIds = CategoryUtil.getAllCategoryIds(promotion.getCategoryApply());
            return productRepository
                    .findAll(Specification.where((root, query, cb) -> root.get("category").get("id").in(categoryIds)));
        }
        return Collections.emptyList();
    }

    private void ensureProductsAvailableForPromotion(List<Product> products, Promotion promotion) {
        LocalDate today = LocalDate.now();
        List<String> conflicted = new ArrayList<>();
        List<String> conflictedNames = new ArrayList<>();

        for (Product product : products) {
            // Kiểm tra promotion hiện tại của sản phẩm
            if (product.getPromotion() != null
                    && !promotion.getId().equals(product.getPromotion().getId())) {
                Promotion existingPromo = product.getPromotion();

                // Kiểm tra xem promotion hiện tại còn active không
                boolean isExistingActive = existingPromo.getStatus() == PromotionStatus.APPROVED
                        && Boolean.TRUE.equals(existingPromo.getIsActive())
                        && (existingPromo.getExpiryDate() == null || !existingPromo.getExpiryDate().isBefore(today))
                        && (existingPromo.getStartDate() == null || !existingPromo.getStartDate().isAfter(today));

                if (isExistingActive) {
                    // Kiểm tra date range overlap
                    boolean hasDateOverlap = hasDateRangeOverlap(
                            promotion.getStartDate(), promotion.getExpiryDate(),
                            existingPromo.getStartDate(), existingPromo.getExpiryDate());

                    if (hasDateOverlap) {
                        conflicted.add(product.getId());
                        conflictedNames.add(product.getName());
                    }
                }
            }

            // Kiểm tra các promotion khác có thể áp dụng cho sản phẩm này (theo product
            // hoặc category)
            List<Promotion> otherActivePromotions = new ArrayList<>();

            // Tìm theo product
            if (product.getId() != null) {
                otherActivePromotions.addAll(
                        promotionRepository.findActiveByProductId(product.getId(), today).stream()
                                .filter(p -> !p.getId().equals(promotion.getId()))
                                .toList());
            }

            // Tìm theo category (bao gồm cả các parent categories)
            if (product.getCategory() != null) {
                Set<String> categoryIds = CategoryUtil.getAncestorCategoryIds(product.getCategory());
                otherActivePromotions.addAll(
                        promotionRepository.findActiveByCategoryIds(categoryIds, today).stream()
                                .filter(p -> !p.getId().equals(promotion.getId()))
                                .toList());
            }

            // Kiểm tra date range overlap với các promotion khác
            for (Promotion otherPromo : otherActivePromotions) {
                boolean hasDateOverlap = hasDateRangeOverlap(
                        promotion.getStartDate(), promotion.getExpiryDate(),
                        otherPromo.getStartDate(), otherPromo.getExpiryDate());

                if (hasDateOverlap && !conflicted.contains(product.getId())) {
                    conflicted.add(product.getId());
                    conflictedNames.add(product.getName());
                }
            }
        }

        if (!conflicted.isEmpty()) {
            log.warn("Không thể áp dụng promotion {} vì có date range trùng lặp trên các sản phẩm {}",
                    promotion.getId(),
                    conflicted);
            String errorMessage = String.format(
                    "Không thể áp dụng khuyến mãi. Các sản phẩm sau đã có khuyến mãi đang hoạt động trong khoảng thời gian trùng lặp: %s. "
                            +
                            "Vui lòng chọn: 'Thay đổi chương trình khuyến mãi sang chương trình mới' hoặc 'Giữ nguyên, không áp promotion mới cho sản phẩm này'",
                    String.join(", ", conflictedNames));
            throw new AppException(ErrorCode.PROMOTION_PRODUCT_CONFLICT, errorMessage);
        }
    }

    /**
     * Kiểm tra xem hai khoảng thời gian có trùng lặp không
     * 
     * @param start1 Ngày bắt đầu của promotion 1
     * @param end1   Ngày kết thúc của promotion 1
     * @param start2 Ngày bắt đầu của promotion 2
     * @param end2   Ngày kết thúc của promotion 2
     * @return true nếu có overlap
     */
    private boolean hasDateRangeOverlap(LocalDate start1, LocalDate end1, LocalDate start2, LocalDate end2) {
        if (start1 == null || end1 == null || start2 == null || end2 == null) {
            return false; // Nếu thiếu thông tin, không thể xác định overlap
        }

        // start1 <= end2 && start2 <= end1
        return !start1.isAfter(end2) && !start2.isAfter(end1);
    }

    /**
     * Kiểm tra trùng lặp promotion khi tạo mới
     * Kiểm tra xem có promotion nào (APPROVED hoặc PENDING_APPROVAL) trùng lặp về:
     * - Date range
     * - Apply scope (ORDER, CATEGORY, PRODUCT)
     */
    private void validatePromotionOverlap(PromotionCreationRequest request) {
        LocalDate newStartDate = request.getStartDate();
        LocalDate newExpiryDate = request.getExpiryDate();
        DiscountApplyScope newScope = request.getApplyScope();

        if (newStartDate == null || newExpiryDate == null) {
            return; // Không thể kiểm tra nếu thiếu thông tin
        }

        // Lấy tất cả promotions đã được approve hoặc đang chờ duyệt
        List<Promotion> existingPromotions = new ArrayList<>();
        existingPromotions.addAll(promotionRepository.findByStatus(PromotionStatus.APPROVED));
        existingPromotions.addAll(promotionRepository.findByStatus(PromotionStatus.PENDING_APPROVAL));

        for (Promotion existingPromo : existingPromotions) {
            // Bỏ qua nếu không có date range
            if (existingPromo.getStartDate() == null || existingPromo.getExpiryDate() == null) {
                continue;
            }

            // Kiểm tra date range overlap
            if (!hasDateRangeOverlap(
                    newStartDate, newExpiryDate,
                    existingPromo.getStartDate(), existingPromo.getExpiryDate())) {
                continue; // Không overlap về thời gian, bỏ qua
            }

            // Kiểm tra apply scope overlap
            boolean hasScopeOverlap = false;
            String conflictMessage = "";

            if (newScope == DiscountApplyScope.ORDER) {
                // ORDER overlap với ORDER
                if (existingPromo.getApplyScope() == DiscountApplyScope.ORDER) {
                    hasScopeOverlap = true;
                    conflictMessage = String.format(
                            "Đã có khuyến mãi \"%s\" (mã: %s) áp dụng cho toàn bộ đơn hàng trong khoảng thời gian từ %s đến %s",
                            existingPromo.getName(), existingPromo.getCode(),
                            existingPromo.getStartDate(), existingPromo.getExpiryDate());
                }
            } else if (newScope == DiscountApplyScope.CATEGORY) {
                // CATEGORY overlap với ORDER hoặc CATEGORY (cùng category)
                if (existingPromo.getApplyScope() == DiscountApplyScope.ORDER) {
                    hasScopeOverlap = true;
                    conflictMessage = String.format(
                            "Đã có khuyến mãi \"%s\" (mã: %s) áp dụng cho toàn bộ đơn hàng trong khoảng thời gian từ %s đến %s",
                            existingPromo.getName(), existingPromo.getCode(),
                            existingPromo.getStartDate(), existingPromo.getExpiryDate());
                } else if (existingPromo.getApplyScope() == DiscountApplyScope.CATEGORY) {
                    // Kiểm tra xem có category nào trùng không
                    if (request.getCategoryIds() != null && !request.getCategoryIds().isEmpty()) {
                        Set<String> existingCategoryIds = existingPromo.getCategoryApply().stream()
                                .map(Category::getId)
                                .collect(Collectors.toSet());
                        Set<String> newCategoryIds = request.getCategoryIds();

                        // Kiểm tra xem có category nào trùng không
                        boolean hasCommonCategory = newCategoryIds.stream()
                                .anyMatch(existingCategoryIds::contains);

                        if (hasCommonCategory) {
                            hasScopeOverlap = true;
                            Set<String> commonCategories = newCategoryIds.stream()
                                    .filter(existingCategoryIds::contains)
                                    .collect(Collectors.toSet());
                            List<String> commonCategoryNames = commonCategories.stream()
                                    .map(catId -> categoryRepository.findById(catId)
                                            .map(Category::getName)
                                            .orElse(catId))
                                    .collect(Collectors.toList());
                            conflictMessage = String.format(
                                    "Đã có khuyến mãi \"%s\" (mã: %s) áp dụng cho danh mục %s trong khoảng thời gian từ %s đến %s",
                                    existingPromo.getName(), existingPromo.getCode(),
                                    String.join(", ", commonCategoryNames),
                                    existingPromo.getStartDate(), existingPromo.getExpiryDate());
                        }
                    }
                }
            } else if (newScope == DiscountApplyScope.PRODUCT) {
                // PRODUCT overlap với ORDER, CATEGORY (của category của product), hoặc PRODUCT
                // (cùng product)
                if (existingPromo.getApplyScope() == DiscountApplyScope.ORDER) {
                    hasScopeOverlap = true;
                    conflictMessage = String.format(
                            "Đã có khuyến mãi \"%s\" (mã: %s) áp dụng cho toàn bộ đơn hàng trong khoảng thời gian từ %s đến %s",
                            existingPromo.getName(), existingPromo.getCode(),
                            existingPromo.getStartDate(), existingPromo.getExpiryDate());
                } else if (existingPromo.getApplyScope() == DiscountApplyScope.CATEGORY) {
                    // Kiểm tra xem có product nào thuộc category của existing promotion không
                    if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
                        Set<String> existingCategoryIds = existingPromo.getCategoryApply().stream()
                                .map(Category::getId)
                                .collect(Collectors.toSet());

                        // Kiểm tra xem có product nào thuộc category của existing promotion không
                        List<Product> newProducts = productRepository.findAllById(request.getProductIds());
                        boolean hasProductInCategory = newProducts.stream()
                                .anyMatch(product -> product.getCategory() != null
                                        && product.getCategory().getId() != null
                                        && existingCategoryIds.contains(product.getCategory().getId()));

                        if (hasProductInCategory) {
                            hasScopeOverlap = true;
                            List<String> conflictProductNames = newProducts.stream()
                                    .filter(product -> product.getCategory() != null
                                            && product.getCategory().getId() != null
                                            && existingCategoryIds.contains(product.getCategory().getId()))
                                    .map(Product::getName)
                                    .limit(3) // Chỉ lấy 3 sản phẩm đầu tiên để message không quá dài
                                    .collect(Collectors.toList());
                            conflictMessage = String.format(
                                    "Đã có khuyến mãi \"%s\" (mã: %s) áp dụng cho danh mục chứa các sản phẩm %s trong khoảng thời gian từ %s đến %s",
                                    existingPromo.getName(), existingPromo.getCode(),
                                    String.join(", ", conflictProductNames) + (newProducts.size() > 3 ? "..." : ""),
                                    existingPromo.getStartDate(), existingPromo.getExpiryDate());
                        }
                    }
                } else if (existingPromo.getApplyScope() == DiscountApplyScope.PRODUCT) {
                    // Kiểm tra xem có product nào trùng không
                    if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
                        Set<String> existingProductIds = existingPromo.getProductApply().stream()
                                .map(Product::getId)
                                .collect(Collectors.toSet());
                        Set<String> newProductIds = request.getProductIds();

                        // Kiểm tra xem có product nào trùng không
                        boolean hasCommonProduct = newProductIds.stream()
                                .anyMatch(existingProductIds::contains);

                        if (hasCommonProduct) {
                            hasScopeOverlap = true;
                            Set<String> commonProducts = newProductIds.stream()
                                    .filter(existingProductIds::contains)
                                    .collect(Collectors.toSet());
                            List<String> commonProductNames = commonProducts.stream()
                                    .map(prodId -> productRepository.findById(prodId)
                                            .map(Product::getName)
                                            .orElse(prodId))
                                    .limit(3) // Chỉ lấy 3 sản phẩm đầu tiên để message không quá dài
                                    .collect(Collectors.toList());
                            conflictMessage = String.format(
                                    "Đã có khuyến mãi \"%s\" (mã: %s) áp dụng cho các sản phẩm %s trong khoảng thời gian từ %s đến %s",
                                    existingPromo.getName(), existingPromo.getCode(),
                                    String.join(", ", commonProductNames) + (commonProducts.size() > 3 ? "..." : ""),
                                    existingPromo.getStartDate(), existingPromo.getExpiryDate());
                        }
                    }
                }
            }

            if (hasScopeOverlap) {
                throw new AppException(ErrorCode.PROMOTION_OVERLAP_CONFLICT, conflictMessage);
            }
        }
    }

    public void applyPricingForProducts(Promotion promotion, List<Product> products) {
        if (products.isEmpty())
            return;

        for (Product product : products) {
            double unitPrice = product.getUnitPrice() != null ? product.getUnitPrice() : 0.0;
            double tax = product.getTax() != null ? product.getTax() : 0.0;

            // Tính discountValue cho product chính dựa trên giá đã bao gồm thuế
            double priceWithTax = unitPrice * (1 + tax);
            double discountAmount = calculateDiscountAmount(promotion, priceWithTax);
            double finalPrice = Math.max(0, priceWithTax - discountAmount);

            product.setDiscountValue(discountAmount);
            product.setPrice(finalPrice);
            product.setPromotion(promotion);

            // Cập nhật giá cho tất cả variants
            List<ProductVariant> variants = product.getVariants();
            if (variants != null && !variants.isEmpty()) {
                for (ProductVariant variant : variants) {
                    double vUnitPrice = variant.getUnitPrice() != null ? variant.getUnitPrice() : 0.0;
                    double vTax = variant.getTax() != null ? variant.getTax() : 0.0;

                    // Tính discount cho variant dựa trên giá đã bao gồm thuế của variant
                    double vPriceWithTax = vUnitPrice * (1 + vTax);
                    double vDiscountAmount = calculateDiscountAmount(promotion, vPriceWithTax);
                    double vFinalPrice = Math.max(0, vPriceWithTax - vDiscountAmount);

                    variant.setPrice(vFinalPrice);
                    // ProductVariant entity doesn't have discountValue or promotion field in
                    // current schema
                    // If it did, it should be set here. Based on entity investigation:
                    // ProductVariant has price, unitPrice, tax.
                }
            }
        }

        productRepository.saveAll(products);
    }

    /**
     * Tự động áp dụng promotion theo category cho sản phẩm khi sản phẩm được
     * approve.
     * Tìm promotion active theo category của sản phẩm và áp dụng nếu không có
     * conflict.
     */
    @Transactional
    public void applyCategoryPromotionToProduct(Product product) {
        if (product == null || product.getStatus() != ProductStatus.APPROVED) {
            return;
        }

        if (product.getCategory() == null || product.getCategory().getId() == null) {
            return;
        }

        LocalDate today = LocalDate.now();

        // Tìm các promotion active theo category (bao gồm cả parent categories)
        Set<String> categoryIds = CategoryUtil.getAncestorCategoryIds(product.getCategory());
        List<Promotion> categoryPromotions = promotionRepository.findActiveByCategoryIds(categoryIds, today);

        if (categoryPromotions.isEmpty()) {
            resetPricingForProduct(product);
            return;
        }

        // Lọc các promotion đã được approve và đang active
        List<Promotion> activePromotions = categoryPromotions.stream()
                .filter(p -> p.getStatus() == PromotionStatus.APPROVED
                        && Boolean.TRUE.equals(p.getIsActive())
                        && (p.getStartDate() == null || !p.getStartDate().isAfter(today))
                        && (p.getExpiryDate() == null || !p.getExpiryDate().isBefore(today)))
                .toList();

        if (activePromotions.isEmpty()) {
            resetPricingForProduct(product);
            return;
        }

        // Chọn promotion có startDate sớm nhất
        Promotion bestPromotion = activePromotions.stream()
                .min(Comparator.comparing(Promotion::getStartDate,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);

        if (bestPromotion == null) {
            return;
        }

        // Kiểm tra xem sản phẩm đã có promotion khác chưa
        if (product.getPromotion() != null
                && !product.getPromotion().getId().equals(bestPromotion.getId())) {
            Promotion existingPromo = product.getPromotion();

            // Kiểm tra xem promotion hiện tại còn active không
            boolean isExistingActive = existingPromo.getStatus() == PromotionStatus.APPROVED
                    && Boolean.TRUE.equals(existingPromo.getIsActive())
                    && (existingPromo.getExpiryDate() == null || !existingPromo.getExpiryDate().isBefore(today))
                    && (existingPromo.getStartDate() == null || !existingPromo.getStartDate().isAfter(today));

            if (isExistingActive) {
                // Kiểm tra date range overlap
                boolean hasDateOverlap = hasDateRangeOverlap(
                        bestPromotion.getStartDate(), bestPromotion.getExpiryDate(),
                        existingPromo.getStartDate(), existingPromo.getExpiryDate());

                if (hasDateOverlap) {
                    // Có conflict, không áp dụng promotion mới
                    log.debug("Không thể áp dụng promotion {} cho sản phẩm {} vì có conflict với promotion hiện tại {}",
                            bestPromotion.getId(), product.getId(), existingPromo.getId());
                    return;
                }
            }
        }

        // Áp dụng promotion cho sản phẩm
        try {
            // Refresh product từ database để đảm bảo tất cả collections được load đúng
            Product refreshedProduct = productRepository.findById(product.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

            // Đảm bảo variants collection được khởi tạo để tránh lỗi Hibernate
            if (refreshedProduct.getVariants() == null) {
                refreshedProduct.setVariants(new ArrayList<>());
            }

            double unitPrice = refreshedProduct.getUnitPrice() != null ? refreshedProduct.getUnitPrice() : 0.0;
            double tax = refreshedProduct.getTax() != null ? refreshedProduct.getTax() : 0.0;

            double priceWithTax = unitPrice * (1 + tax);
            double discountAmount = calculateDiscountAmount(bestPromotion, priceWithTax);
            double finalPrice = Math.max(0, priceWithTax - discountAmount);

            refreshedProduct.setDiscountValue(discountAmount);
            refreshedProduct.setPrice(finalPrice);
            refreshedProduct.setPromotion(bestPromotion);

            // Cập nhật giá cho variants
            List<ProductVariant> variants = refreshedProduct.getVariants();
            if (variants != null && !variants.isEmpty()) {
                for (ProductVariant variant : variants) {
                    double vUnitPrice = variant.getUnitPrice() != null ? variant.getUnitPrice() : 0.0;
                    double vTax = variant.getTax() != null ? variant.getTax() : 0.0;
                    double vPriceWithTax = vUnitPrice * (1 + vTax);
                    double vDiscountAmount = calculateDiscountAmount(bestPromotion, vPriceWithTax);
                    double vFinalPrice = Math.max(0, vPriceWithTax - vDiscountAmount);
                    variant.setPrice(vFinalPrice);
                }
            }

            productRepository.save(refreshedProduct);
        } catch (Exception e) {
            log.warn("Failed to apply category promotion {} to product {}: {}",
                    bestPromotion.getId(), product.getId(), e.getMessage());
        }
    }

    private void resetPricingForProduct(Product product) {
        try {
            Product refreshedProduct = productRepository.findById(product.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));

            double unitPrice = refreshedProduct.getUnitPrice() != null ? refreshedProduct.getUnitPrice() : 0.0;
            double tax = refreshedProduct.getTax() != null ? refreshedProduct.getTax() : 0.0;

            refreshedProduct.setDiscountValue(0.0);
            refreshedProduct.setPrice(unitPrice * (1 + tax));
            refreshedProduct.setPromotion(null);

            // Clear variant prices
            List<ProductVariant> variants = refreshedProduct.getVariants();
            if (variants != null && !variants.isEmpty()) {
                for (ProductVariant variant : variants) {
                    double vUnitPrice = variant.getUnitPrice() != null ? variant.getUnitPrice() : 0.0;
                    double vTax = variant.getTax() != null ? variant.getTax() : 0.0;
                    variant.setPrice(vUnitPrice * (1 + vTax));
                }
            }
            productRepository.save(refreshedProduct);
        } catch (Exception e) {
            log.warn("Failed to reset pricing for product {}: {}", product.getId(), e.getMessage());
        }
    }

    private double calculateDiscountAmount(Promotion promotion, double basePrice) {
        if (basePrice <= 0)
            return 0;
        double discountValue = promotion.getDiscountValue() != null ? promotion.getDiscountValue() : 0;
        double discountAmount = 0;

        switch (promotion.getDiscountValueType()) {
            case PERCENTAGE -> {
                discountAmount = basePrice * (discountValue / 100.0);
                Double maxDiscount = promotion.getMaxDiscountValue();
                if (maxDiscount != null && maxDiscount > 0) {
                    discountAmount = Math.min(discountAmount, maxDiscount);
                }
            }
            case AMOUNT -> discountAmount = discountValue;
        }
        return Math.min(discountAmount, basePrice);
    }

    private void clearPromotionPricing(Promotion promotion) {
        List<Product> products = productRepository.findByPromotionId(promotion.getId());
        if (products.isEmpty()) {
            return;
        }

        LocalDate today = LocalDate.now();

        for (Product product : products) {
            double unitPrice = product.getUnitPrice() != null ? product.getUnitPrice() : 0.0;
            double tax = product.getTax() != null ? product.getTax() : 0.0;

            // Kiểm tra xem có promotion kế tiếp nào còn hiệu lực không
            Promotion nextPromotion = findNextActivePromotionForProduct(product, today);

            if (nextPromotion != null) {
                // Áp dụng promotion kế tiếp
                double priceWithTax = unitPrice * (1 + tax);
                double discountAmount = calculateDiscountAmount(nextPromotion, priceWithTax);
                double finalPrice = Math.max(0, priceWithTax - discountAmount);
                product.setDiscountValue(discountAmount);
                product.setPrice(finalPrice);
                product.setPromotion(nextPromotion);

                // Cập nhật giá cho variants
                List<ProductVariant> variants = product.getVariants();
                if (variants != null && !variants.isEmpty()) {
                    for (ProductVariant variant : variants) {
                        double vUnitPrice = variant.getUnitPrice() != null ? variant.getUnitPrice() : 0.0;
                        double vTax = variant.getTax() != null ? variant.getTax() : 0.0;
                        double vPriceWithTax = vUnitPrice * (1 + vTax);
                        double vDiscountAmount = calculateDiscountAmount(nextPromotion, vPriceWithTax);
                        double vFinalPrice = Math.max(0, vPriceWithTax - vDiscountAmount);
                        variant.setPrice(vFinalPrice);
                    }
                }
            } else {
                product.setDiscountValue(0.0);
                product.setPrice(unitPrice * (1 + tax));
                product.setPromotion(null);

                // Clear variant prices
                List<ProductVariant> variants = product.getVariants();
                if (variants != null && !variants.isEmpty()) {
                    for (ProductVariant variant : variants) {
                        double vUnitPrice = variant.getUnitPrice() != null ? variant.getUnitPrice() : 0.0;
                        double vTax = variant.getTax() != null ? variant.getTax() : 0.0;
                        variant.setPrice(vUnitPrice * (1 + vTax));
                    }
                }
            }
        }
        productRepository.saveAll(products);
    }

    /**
     * Tìm promotion kế tiếp còn hiệu lực cho sản phẩm
     * (promotion có date range overlap hoặc tiếp nối với promotion hiện tại)
     */
    private Promotion findNextActivePromotionForProduct(Product product, LocalDate today) {
        // Tìm các promotion active cho sản phẩm này (theo product hoặc category)
        List<Promotion> activePromotions = new ArrayList<>();

        // Tìm theo product
        if (product.getId() != null) {
            activePromotions.addAll(promotionRepository.findActiveByProductId(product.getId(), today));
        }

        // Tìm theo category (bao gồm cả parent categories)
        if (product.getCategory() != null) {
            Set<String> categoryIds = CategoryUtil.getAncestorCategoryIds(product.getCategory());
            activePromotions.addAll(promotionRepository.findActiveByCategoryIds(categoryIds, today));
        }

        // Loại bỏ trùng lặp và sắp xếp theo startDate
        return activePromotions.stream()
                .distinct() // Loại bỏ trùng lặp
                .filter(p -> p.getStatus() == PromotionStatus.APPROVED
                        && Boolean.TRUE.equals(p.getIsActive())
                        && (p.getExpiryDate() == null || !p.getExpiryDate().isBefore(today))
                        && (p.getStartDate() == null || !p.getStartDate().isAfter(today)))
                .min(Comparator.comparing(Promotion::getStartDate)) // Sắp xếp theo startDate
                .orElse(null);
    }

    @Transactional
    public void detachPromotionFromProducts(Promotion promotion) {
        clearPromotionPricing(promotion);
        promotion.setIsActive(false);
        promotionRepository.save(promotion);
    }

    private void deleteMediaFileIfExists(Promotion promotion) {
        try {
            if (promotion.getImageUrl() != null && !promotion.getImageUrl().isBlank()) {
                long totalUsages = promotionRepository.countByImageUrl(promotion.getImageUrl());
                if (totalUsages > 1) {
                    log.debug("Skip deleting promotion media {} because it is still referenced by {} records",
                            promotion.getImageUrl(), totalUsages - 1);
                    return;
                }
                deletePhysicalFileByUrl(promotion.getImageUrl());
            }
        } catch (Exception e) {
            log.warn("Failed to delete media file for promotion {}: {}", promotion.getId(), e.getMessage());
        }
    }

    private void deletePhysicalFileByUrl(String url) {
        // Xóa file từ Cloudinary thay vì local storage
        fileStorageService.deleteFileFromCloudinary(url);
    }
}
