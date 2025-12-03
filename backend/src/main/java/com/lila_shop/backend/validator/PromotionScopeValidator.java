package com.lila_shop.backend.validator;

import com.lila_shop.backend.dto.request.PromotionCreationRequest;
import com.lila_shop.backend.enums.DiscountApplyScope;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class PromotionScopeValidator implements ConstraintValidator<PromotionScopeConstraint, PromotionCreationRequest> {

    @Override
    public boolean isValid(PromotionCreationRequest request, ConstraintValidatorContext context) {
        if (request == null) {
            return true;
        }

        DiscountApplyScope scope = request.getApplyScope();
        Set<String> categoryIds = request.getCategoryIds();
        Set<String> productIds = request.getProductIds();

        if (scope == null) {
            return true;
        }

        context.disableDefaultConstraintViolation();

        switch (scope) {
            case ORDER:
                boolean orderValid = (categoryIds == null || categoryIds.isEmpty())
                        && (productIds == null || productIds.isEmpty());
                if (!orderValid) {
                    context.buildConstraintViolationWithTemplate(
                                    "Khuyến mãi áp dụng toàn bộ đơn hàng không được chọn danh mục hoặc sản phẩm cụ thể")
                            .addConstraintViolation();
                }
                return orderValid;
            case CATEGORY:
                boolean categoryValid = categoryIds != null && !categoryIds.isEmpty();
                if (!categoryValid) {
                    context.buildConstraintViolationWithTemplate(
                                    "Vui lòng chọn ít nhất một danh mục khi áp dụng theo danh mục")
                            .addConstraintViolation();
                    return false;
                }
                if (productIds != null && !productIds.isEmpty()) {
                    context.buildConstraintViolationWithTemplate(
                                    "Không được chọn sản phẩm cụ thể khi khuyến mãi áp dụng theo danh mục")
                            .addConstraintViolation();
                    return false;
                }
                return true;
            case PRODUCT:
                boolean productValid = productIds != null && !productIds.isEmpty();
                if (!productValid) {
                    context.buildConstraintViolationWithTemplate(
                                    "Vui lòng chọn ít nhất một sản phẩm khi áp dụng theo sản phẩm")
                            .addConstraintViolation();
                    return false;
                }
                if (categoryIds != null && !categoryIds.isEmpty()) {
                    context.buildConstraintViolationWithTemplate(
                                    "Không được chọn danh mục khi khuyến mãi áp dụng theo sản phẩm cụ thể")
                            .addConstraintViolation();
                    return false;
                }
                return true;
            default:
                return true;
        }
    }
}


