package com.lila_shop.backend.validator;

import com.lila_shop.backend.repository.VoucherRepository;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class VoucherCodeValidator implements ConstraintValidator<VoucherCodeConstraint, String> {

    private final VoucherRepository voucherRepository;

    @Override
    public boolean isValid(String code, ConstraintValidatorContext context) {
        if (code == null || code.trim().isEmpty()) {
            return true;
        }

        // check exists
        if (voucherRepository.findByCode(code).isPresent()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate("Mã voucher đã tồn tại")
                    .addConstraintViolation();
            return false;
        }

        return true;
    }
}
