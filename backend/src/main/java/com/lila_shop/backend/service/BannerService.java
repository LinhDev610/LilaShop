package com.lila_shop.backend.service;

import com.lila_shop.backend.dto.request.BannerCreationRequest;
import com.lila_shop.backend.dto.request.BannerUpdateRequest;
import com.lila_shop.backend.dto.response.BannerResponse;
import com.lila_shop.backend.entity.Banner;
import com.lila_shop.backend.entity.Product;
import com.lila_shop.backend.entity.User;
import com.lila_shop.backend.exception.AppException;
import com.lila_shop.backend.exception.ErrorCode;
import com.lila_shop.backend.mapper.BannerMapper;
import com.lila_shop.backend.repository.BannerRepository;
import com.lila_shop.backend.repository.ProductRepository;
import com.lila_shop.backend.repository.UserRepository;
import com.lila_shop.backend.util.SecurityUtil;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BannerService {

    BannerRepository bannerRepository;
    UserRepository userRepository;
    ProductRepository productRepository;
    BannerMapper bannerMapper;

    @Transactional
    @PreAuthorize("hasRole('STAFF')")
    public BannerResponse createBanner(BannerCreationRequest request) {
        // Get current user from security context
        String userEmail = SecurityUtil.getCurrentUserEmail();

        // Get user by email (getName() returns email, not ID)
        User user = userRepository.findByEmail(userEmail).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Create banner entity using mapper
        Banner banner = bannerMapper.toBanner(request);
        banner.setCreatedBy(user);
        banner.setCreatedAt(LocalDateTime.now());
        banner.setUpdatedAt(LocalDateTime.now());
        banner.setStatus(Boolean.FALSE);
        banner.setPendingReview(Boolean.TRUE);

        // Set order index if not provided
        if (banner.getOrderIndex() == null) {
            Integer maxOrderIndex = bannerRepository.findMaxOrderIndex();
            banner.setOrderIndex(maxOrderIndex != null ? maxOrderIndex + 1 : 0);
        }

        // Set products if provided
        if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
            List<Product> products = request.getProductIds().stream()
                    .map(productId -> productRepository
                            .findById(productId)
                            .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED)))
                    .collect(Collectors.toList());
            banner.setProducts(products);
        }

        Banner savedBanner = bannerRepository.save(banner);
        log.info("Banner created with ID: {} by user: {}", savedBanner.getId(), userEmail);

        return bannerMapper.toResponse(savedBanner);
    }

    public BannerResponse getBannerById(String bannerId) {
        Banner banner =
                bannerRepository.findById(bannerId).orElseThrow(() -> new AppException(ErrorCode.BANNER_NOT_EXISTED));

        return bannerMapper.toResponse(banner);
    }

    public List<BannerResponse> getAllBanners() {
        List<Banner> banners = bannerRepository.findAllByOrderByOrderIndexAsc();

        return banners.stream().map(bannerMapper::toResponse).toList();
    }

    public List<BannerResponse> getActiveBanners() {
        List<Banner> banners = bannerRepository.findByStatusOrderByOrderIndexAsc(true);

        return banners.stream().map(bannerMapper::toResponse).toList();
    }

    @Transactional
    public BannerResponse updateBanner(String bannerId, BannerUpdateRequest request) {
        Authentication authentication = SecurityUtil.getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Banner banner =
                bannerRepository.findById(bannerId).orElseThrow(() -> new AppException(ErrorCode.BANNER_NOT_EXISTED));

        // Kiểm tra quyền: Admin hoặc chủ sở hữu banner
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && (banner.getCreatedBy() == null || !banner.getCreatedBy().getId().equals(user.getId()))) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Update only non-null fields to preserve existing values
        if (request.getTitle() != null) {
            banner.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            banner.setDescription(request.getDescription());
        }
        if (request.getImageUrl() != null) {
            banner.setImageUrl(request.getImageUrl());
        }
        if (request.getLinkUrl() != null) {
            banner.setLinkUrl(request.getLinkUrl());
        }
        // Nếu là staff (không phải admin), luôn set status về false (chờ duyệt) khi gửi lại
        // và giữ nguyên rejectionReason
        if (!isAdmin) {
            // Staff gửi lại banner -> luôn set về chờ duyệt
            banner.setStatus(false);
            banner.setPendingReview(true);
            // Giữ nguyên rejectionReason (không xóa)
        } else {
            // Admin có thể thay đổi status
            if (request.getStatus() != null) {
                banner.setStatus(request.getStatus());
                banner.setPendingReview(Boolean.FALSE);
            }
        }
        // Staff không được phép thay đổi rejectionReason, chỉ ADMIN mới có quyền này
        if (request.getRejectionReason() != null && isAdmin) {
            banner.setRejectionReason(request.getRejectionReason());
            banner.setPendingReview(Boolean.FALSE);
        }
        // Staff không được phép thay đổi orderIndex, chỉ ADMIN mới có quyền này
        if (request.getOrderIndex() != null && isAdmin) {
            banner.setOrderIndex(request.getOrderIndex());
        }
        if (request.getStartDate() != null) {
            banner.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            banner.setEndDate(request.getEndDate());
        }

        banner.setUpdatedAt(LocalDateTime.now());

        // Update products if provided
        if (request.getProductIds() != null) {
            if (request.getProductIds().isEmpty()) {
                banner.setProducts(null);
            } else {
                List<Product> products = request.getProductIds().stream()
                        .map(productId -> productRepository
                                .findById(productId)
                                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED)))
                        .collect(Collectors.toList());
                banner.setProducts(products);
            }
        }

        Banner savedBanner = bannerRepository.save(banner);
        log.info(
                "Banner updated: {} by user: {}",
                bannerId,
                userEmail);

        return bannerMapper.toResponse(savedBanner);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteBanner(String bannerId) {
        Banner banner =
                bannerRepository.findById(bannerId).orElseThrow(() -> new AppException(ErrorCode.BANNER_NOT_EXISTED));

        bannerRepository.delete(banner);
        log.info(
                "Banner deleted: {} by user: {}",
                bannerId,
                SecurityUtil.getCurrentUserEmail());
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public BannerResponse updateBannerOrder(String bannerId, Integer newOrderIndex) {
        Banner banner =
                bannerRepository.findById(bannerId).orElseThrow(() -> new AppException(ErrorCode.BANNER_NOT_EXISTED));

        banner.setOrderIndex(newOrderIndex);
        banner.setUpdatedAt(LocalDateTime.now());

        Banner savedBanner = bannerRepository.save(banner);
        log.info("Banner order updated: {} to order: {}", bannerId, newOrderIndex);

        return bannerMapper.toResponse(savedBanner);
    }
}
