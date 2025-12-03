package com.lila_shop.backend.util;

import com.lila_shop.backend.exception.AppException;
import com.lila_shop.backend.exception.ErrorCode;

public final class ParseUtil {
    private ParseUtil() {
    }

    public static Integer parseInteger(String value, String fieldName) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            throw new AppException(ErrorCode.INVALID_KEY);
        }
    }
}
