/**
 * Error codes mapping từ backend ErrorCode enum
 * Sử dụng để xử lý lỗi một cách nhất quán giữa frontend và backend
 */
export const ErrorCode = {
    // General errors
    UNCATEGORIZED_EXCEPTION: 9999,
    INVALID_KEY: 1001,
    USER_EXISTED: 1002,
    INVALID_PASSWORD: 1003,
    USER_NOT_EXISTED: 1004,
    UNAUTHENTICATED: 1005,
    ACCOUNT_LOCKED: 1006,
    UNAUTHORIZED: 1007,
    INVALID_DOB: 1008,
    EMAIL_SEND_FAILED: 1009,
    INVALID_OTP: 1010,
    TICKET_NOT_EXISTED: 1011,

    // Promotion
    PROMOTION_NOT_EXISTED: 2001,
    PROMOTION_NOT_PENDING: 2002,
    INVALID_PROMOTION_SCOPE: 2003,
    PROMOTION_PRODUCT_CONFLICT: 2004,
    PROMOTION_CODE_ALREADY_EXISTS: 2005,
    PROMOTION_OVERLAP_CONFLICT: 2006,

    // Voucher
    VOUCHER_NOT_EXISTED: 3001,
    VOUCHER_CODE_ALREADY_EXISTS: 3002,
    VOUCHER_NOT_PENDING: 3003,
    VOUCHER_EXPIRED: 3004,
    VOUCHER_SOLD_OUT: 3005,
    INVALID_VOUCHER_MINIUM: 3006,
    INVALID_VOUCHER_SCOPE: 3007,
    VOUCHER_USAGE_LIMIT_EXCEEDED: 3008,
    VOUCHER_ALREADY_USED: 3009,

    // Banner
    BANNER_NOT_EXISTED: 4001,

    // Review
    REVIEW_NOT_EXISTED: 5001,

    // Product & Category
    PRODUCT_NOT_EXISTED: 6001,
    OUT_OF_STOCK: 6002,
    PRODUCT_ALREADY_EXISTS: 6003,
    CATEGORY_NOT_EXISTED: 6004,
    CATEGORY_ALREADY_EXISTS: 6005,
    CATEGORY_HAS_PRODUCTS: 6006,
    CATEGORY_HAS_SUBCATEGORIES: 6007,

    // Order - Shipment - Cart - Address
    CART_ITEM_NOT_EXISTED: 7001,
    ORDER_NOT_EXISTED: 7002,
    EXTERNAL_SERVICE_ERROR: 7003,
    ADDRESS_NOT_EXISTED: 7004,
    SHIPMENT_NOT_EXISTED: 7005,
    BAD_REQUEST: 7006,

    // File Upload
    FILE_UPLOAD_FAILED: 8001,

    // Notification
    NOTIFICATION_NOT_EXISTED: 9001,
};

// Kiểm tra xem error code có phải là lỗi authentication/authorization không
export const isAuthError = (errorCode) => {
    return (
        errorCode === ErrorCode.UNAUTHENTICATED ||
        errorCode === ErrorCode.UNAUTHORIZED ||
        errorCode === ErrorCode.ACCOUNT_LOCKED
    );
};

// Kiểm tra xem error code có phải là lỗi validation/bad request không
export const isValidationError = (errorCode) => {
    return (
        errorCode === ErrorCode.CATEGORY_ALREADY_EXISTS ||
        errorCode === ErrorCode.PRODUCT_ALREADY_EXISTS ||
        errorCode === ErrorCode.VOUCHER_CODE_ALREADY_EXISTS ||
        errorCode === ErrorCode.PROMOTION_CODE_ALREADY_EXISTS ||
        errorCode === ErrorCode.INVALID_PASSWORD ||
        errorCode === ErrorCode.INVALID_OTP ||
        errorCode === ErrorCode.BAD_REQUEST
    );
};

