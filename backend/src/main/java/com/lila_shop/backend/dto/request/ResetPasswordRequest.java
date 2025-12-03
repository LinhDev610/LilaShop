package com.lila_shop.backend.dto.request;

import com.lila_shop.backend.validator.PasswordConstraint;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResetPasswordRequest {
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email sai định dạng")
    String email;

    @NotBlank
    String otp;

    @NotBlank(message = "INVALID_PASSWORD")
    @PasswordConstraint
    String newPassword;
}
