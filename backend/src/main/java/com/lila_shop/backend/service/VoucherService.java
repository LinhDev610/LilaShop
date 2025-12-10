package com.lila_shop.backend.service;

import com.lila_shop.backend.dto.request.ApproveVoucherRequest;
import com.lila_shop.backend.dto.request.VoucherCreationRequest;
import com.lila_shop.backend.dto.request.VoucherUpdateRequest;
import com.lila_shop.backend.dto.response.VoucherResponse;
import com.lila_shop.backend.entity.Category;
import com.lila_shop.backend.entity.Product;
import com.lila_shop.backend.entity.User;
import com.lila_shop.backend.entity.Voucher;
import com.lila_shop.backend.enums.DiscountApplyScope;
import com.lila_shop.backend.enums.VoucherStatus;
import com.lila_shop.backend.exception.AppException;
import com.lila_shop.backend.exception.ErrorCode;
import com.lila_shop.backend.mapper.VoucherMapper;
import com.lila_shop.backend.repository.CategoryRepository;
import com.lila_shop.backend.repository.ProductRepository;
import com.lila_shop.backend.repository.UserRepository;
import com.lila_shop.backend.repository.VoucherRepository;
import com.lila_shop.backend.util.SecurityUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class VoucherService {

    VoucherRepository voucherRepository;
    UserRepository userRepository;
    CategoryRepository categoryRepository;
    ProductRepository productRepository;
    VoucherMapper voucherMapper;
    FileStorageService fileStorageService;

    @Transactional
    public VoucherResponse createVoucher(VoucherCreationRequest request) {
        User staff = getCurrentUser();

        if (voucherRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.VOUCHER_CODE_ALREADY_EXISTS);
        }

        Voucher voucher = voucherMapper.toVoucher(request);
        voucher.setSubmittedBy(staff);
        voucher.setSubmittedAt(LocalDateTime.now());
        voucher.setUsageCount(0);
        voucher.setIsActive(false);
        voucher.setStatus(VoucherStatus.PENDING_APPROVAL);

        applyScopeTargets(request.getApplyScope(), request.getCategoryIds(), request.getProductIds(), voucher);

        Voucher savedVoucher = voucherRepository.save(voucher);

        return voucherMapper.toResponse(savedVoucher);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public VoucherResponse approveVoucher(ApproveVoucherRequest request) {
        User admin = getCurrentUser();

        Voucher voucher = voucherRepository
                .findById(request.getVoucherId())
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_EXISTED));

        if (voucher.getStatus() != VoucherStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.VOUCHER_NOT_PENDING);
        }

        if ("APPROVE".equals(request.getAction())) {
            voucher.setStatus(VoucherStatus.APPROVED);
            voucher.setIsActive(true);
            voucher.setApprovedBy(admin);
            voucher.setApprovedAt(LocalDateTime.now());
            voucher.setRejectionReason(null);
            // log.info("Voucher approved: {} by admin: {}", voucher.getId(),
            // admin.getId());
        } else if ("REJECT".equals(request.getAction())) {
            voucher.setStatus(VoucherStatus.REJECTED);
            voucher.setIsActive(false);
            voucher.setApprovedBy(admin);
            voucher.setApprovedAt(LocalDateTime.now());
            voucher.setRejectionReason(request.getReason());
            // log.info("Voucher rejected: {} by admin: {}", voucher.getId(),
            // admin.getId());
        }

        Voucher savedVoucher = voucherRepository.save(voucher);
        return voucherMapper.toResponse(savedVoucher);
    }

    public VoucherResponse getVoucherById(String voucherId) {
        Voucher voucher = voucherRepository
                .findById(voucherId)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_EXISTED));
        return voucherMapper.toResponse(voucher);
    }

    public List<VoucherResponse> getMyVouchers() {
        User staff = getCurrentUser();

        return voucherRepository.findBySubmittedBy(staff).stream()
                .map(voucherMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<VoucherResponse> getPendingVouchers() {
        return voucherRepository.findByStatus(VoucherStatus.PENDING_APPROVAL).stream()
                .map(voucherMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<VoucherResponse> getVouchersByStatus(VoucherStatus status) {
        return voucherRepository.findByStatus(status).stream()
                .map(voucherMapper::toResponse)
                .collect(Collectors.toList());
    }

    public List<VoucherResponse> getActiveVouchers() {
        List<Voucher> activeVouchers = voucherRepository.findActiveVouchers(LocalDate.now());
        User currentUser = tryGetCurrentUser();

        if (currentUser != null) {
            User managedUser = userRepository.findById(currentUser.getId()).orElse(currentUser);
            Set<Voucher> used = managedUser.getUsedVouchers();
            if (used != null && !used.isEmpty()) {
                Set<String> usedIds = used.stream()
                        .map(Voucher::getId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());

                if (!usedIds.isEmpty()) {
                    activeVouchers = activeVouchers.stream()
                            .filter(voucher -> voucher.getId() != null && !usedIds.contains(voucher.getId()))
                            .collect(Collectors.toList());
                }
            }
        }

        return activeVouchers.stream()
                .map(voucherMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public VoucherResponse updateVoucher(String voucherId, VoucherUpdateRequest request) {
        User currentUser = getCurrentUser();
        String currentUserId = currentUser.getId();

        Voucher voucher = voucherRepository
                .findById(voucherId)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_EXISTED));

        boolean isAdmin = SecurityUtil.getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> "ROLE_ADMIN".equals(auth.getAuthority()));

        if (!isAdmin && voucher.getSubmittedBy() != null && !voucher.getSubmittedBy().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (request.getCode() != null && !request.getCode().equals(voucher.getCode())
                && voucherRepository.existsByCode(request.getCode())) {
            throw new AppException(ErrorCode.VOUCHER_CODE_ALREADY_EXISTS);
        }

        voucherMapper.updateVoucher(voucher, request);

        if (request.getApplyScope() != null || request.getCategoryIds() != null || request.getProductIds() != null) {
            DiscountApplyScope scope = request.getApplyScope() != null ? request.getApplyScope()
                    : voucher.getApplyScope();
            applyScopeTargets(scope, request.getCategoryIds(), request.getProductIds(), voucher);
            voucher.setApplyScope(scope);
        }

        // Nếu staff cập nhật voucher bị từ chối, tự động chuyển về chờ duyệt
        if (!isAdmin && voucher.getStatus() == VoucherStatus.REJECTED) {
            voucher.setStatus(VoucherStatus.PENDING_APPROVAL);
            voucher.setRejectionReason(null); // Xóa lý do từ chối khi gửi lại
        }

        Voucher savedVoucher = voucherRepository.save(voucher);
        log.info("Voucher updated: {} by user: {}", voucherId, currentUserId);

        return voucherMapper.toResponse(savedVoucher);
    }

    @Transactional
    public void deleteVoucher(String voucherId) {
        User currentUser = getCurrentUser();
        String currentUserId = currentUser.getId();

        Voucher voucher = voucherRepository
                .findById(voucherId)
                .orElseThrow(() -> new AppException(ErrorCode.VOUCHER_NOT_EXISTED));

        boolean isAdmin = SecurityUtil.getAuthentication().getAuthorities().stream()
                .anyMatch(auth -> "ROLE_ADMIN".equals(auth.getAuthority()));

        if (!isAdmin && voucher.getSubmittedBy() != null && !voucher.getSubmittedBy().getId().equals(currentUserId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // 1. Xóa product khỏi voucher.productApply (bảng voucher_products)
        // Clear quan hệ Many-to-Many trước khi xóa voucher
        voucher.getProductApply().clear();
        voucher.getCategoryApply().clear();
        voucherRepository.save(voucher);

        // 2. Xóa file media vật lý trong thư mục vouchers (nếu có)
        deleteMediaFileIfExists(voucher);

        // 3. Xóa voucher
        voucherRepository.delete(voucher);
        // log.info("Voucher deleted: {} by user: {}", voucherId, currentUserId);
    }

    private User getCurrentUser() {
        String email = SecurityUtil.getCurrentUserEmail();
        return userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private void applyScopeTargets(
            DiscountApplyScope scope, Set<String> categoryIds, Set<String> productIds, Voucher voucher) {
        if (scope == null) {
            return;
        }

        voucher.getCategoryApply().clear();
        voucher.getProductApply().clear();

        switch (scope) {
            case CATEGORY -> {
                validateScopeInputs(categoryIds, productIds, true);
                voucher.getCategoryApply().addAll(resolveCategories(categoryIds));
            }
            case PRODUCT -> {
                validateScopeInputs(categoryIds, productIds, false);
                voucher.getProductApply().addAll(resolveProducts(productIds));
            }
            case ORDER -> {
                if ((categoryIds != null && !categoryIds.isEmpty()) || (productIds != null && !productIds.isEmpty())) {
                    throw new AppException(ErrorCode.INVALID_VOUCHER_SCOPE);
                }
            }
            default -> throw new AppException(ErrorCode.INVALID_VOUCHER_SCOPE);
        }
        voucher.setApplyScope(scope);
    }

    private void validateScopeInputs(Set<String> categoryIds, Set<String> productIds, boolean isCategory) {
        if (isCategory) {
            if (productIds != null && !productIds.isEmpty()) {
                throw new AppException(ErrorCode.INVALID_VOUCHER_SCOPE);
            }
        } else {
            if (categoryIds != null && !categoryIds.isEmpty()) {
                throw new AppException(ErrorCode.INVALID_VOUCHER_SCOPE);
            }
        }
    }

    private Set<Category> resolveCategories(Set<String> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_VOUCHER_SCOPE);
        }
        return resolveEntities(categoryIds, categoryRepository::findById, ErrorCode.CATEGORY_NOT_EXISTED);
    }

    private Set<Product> resolveProducts(Set<String> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_VOUCHER_SCOPE);
        }
        return resolveEntities(productIds, productRepository::findById, ErrorCode.PRODUCT_NOT_EXISTED);
    }

    private <T, ID> Set<T> resolveEntities(Set<ID> ids, Function<ID, Optional<T>> finder, ErrorCode notFoundError) {
        return ids.stream()
                .map(id -> finder.apply(id).orElseThrow(() -> new AppException(notFoundError)))
                .collect(Collectors.toSet());
    }

    private void deleteMediaFileIfExists(Voucher voucher) {
        try {
            if (voucher.getImageUrl() != null && !voucher.getImageUrl().isBlank()) {
                long totalUsages = voucherRepository.countByImageUrl(voucher.getImageUrl());
                if (totalUsages > 1) {
                    log.debug("Skip deleting voucher media {} because it is still referenced by {} records",
                            voucher.getImageUrl(), totalUsages - 1);
                    return;
                }
                deletePhysicalFileByUrl(voucher.getImageUrl());
            }
        } catch (Exception e) {
            log.warn("Failed to delete media file for voucher {}: {}", voucher.getId(), e.getMessage());
        }
    }

    private void deletePhysicalFileByUrl(String url) {
        // Xóa file từ Cloudinary thay vì local storage
        fileStorageService.deleteFileFromCloudinary(url);
    }

    private User tryGetCurrentUser() {
        try {
            return getCurrentUser();
        } catch (AppException ex) {
            if (ex.getErrorCode() == ErrorCode.UNAUTHENTICATED) {
                return null;
            }
            throw ex;
        }
    }
}
