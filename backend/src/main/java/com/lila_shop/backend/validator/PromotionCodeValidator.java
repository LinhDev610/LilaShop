package com.lila_shop.backend.validator;

import com.lila_shop.backend.repository.PromotionRepository;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PromotionCodeValidator implements ConstraintValidator<PromotionCodeConstraint, String> {

    private final PromotionRepository promotionRepository;

    @Override
    public boolean isValid(String code, ConstraintValidatorContext context) {
        if (code == null || code.trim().isEmpty()) {
            return true;
        }

        // check exists
        if (promotionRepository.findByCode(code).isPresent()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Mã khuyến mãi đã tồn tại")
                    .addConstraintViolation();
            return false;
        }

        return true;
    }
}

