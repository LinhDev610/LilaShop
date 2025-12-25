export const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

/**
 * Normalizes date string sang Date object để so sánh
 * @param {string|Date} date - Date string or Date object
 * @returns {Date|null}
 */
const normalizeDate = (date) => {
    if (!date) return null;
    if (date instanceof Date) return date;
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Checks nếu một voucher là active và valid dựa trên status và dates
 * @param {Object} voucher - The voucher object to check
 * @returns {{ isValid: boolean, error: string }}
 */
const checkVoucherActiveStatus = (voucher) => {
    if (!voucher) {
        return { isValid: false, error: 'Mã giảm giá không tồn tại' };
    }

    // Check isActive flag
    if (voucher.isActive === false || voucher.isActive === 0) {
        return { isValid: false, error: `Mã giảm giá "${voucher.code || ''}" không còn hoạt động` };
    }

    // Check status - phải là APPROVED
    if (voucher.status && voucher.status !== 'APPROVED') {
        return { isValid: false, error: `Mã giảm giá "${voucher.code || ''}" chưa được duyệt hoặc đã bị từ chối` };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset sang start of day để so sánh ngày tháng

    // Check startDate
    if (voucher.startDate) {
        const startDate = normalizeDate(voucher.startDate);
        if (startDate) {
            startDate.setHours(0, 0, 0, 0);
            if (now < startDate) {
                return {
                    isValid: false,
                    error: `Mã giảm giá "${voucher.code || ''}" chưa có hiệu lực. Ngày bắt đầu: ${startDate.toLocaleDateString('vi-VN')}`,
                };
            }
        }
    }

    // Check expiryDate
    if (voucher.expiryDate) {
        const expiryDate = normalizeDate(voucher.expiryDate);
        if (expiryDate) {
            expiryDate.setHours(23, 59, 59, 999); // End of day
            if (now > expiryDate) {
                return {
                    isValid: false,
                    error: `Mã giảm giá "${voucher.code || ''}" đã hết hạn sử dụng`,
                };
            }
        }
    }

    // Check usageLimit
    if (voucher.usageLimit != null && typeof voucher.usageLimit === 'number' && voucher.usageLimit > 0) {
        const usageCount = voucher.usageCount || 0;
        if (usageCount >= voucher.usageLimit) {
            return {
                isValid: false,
                error: `Mã giảm giá "${voucher.code || ''}" đã hết lượt sử dụng`,
            };
        }
    }

    return { isValid: true, error: '' };
};

/**
 * Validates nếu một voucher có thể được áp dụng cho đơn hàng hiện tại.
 * Hàm này thực hiện kiểm tra tính hợp lệ bao gồm:
 * - Status active, dates, usage limits
 * - Giá trị đơn hàng constraints (min/max)
 * - Apply scope (ORDER, PRODUCT, CATEGORY)
 * 
 * @param {Object} voucher - The voucher object to validate.
 * @param {number} orderTotal - Giá trị đơn hàng (subtotal của các sản phẩm).
 * @param {Object} context - Context chứa productIds và categoryIds của các sản phẩm trong đơn hàng.
 * @param {Array<string>|Set<string>} context.productIds - Danh sách product IDs trong đơn hàng.
 * @param {Array<string>|Set<string>} context.categoryIds - Danh sách category IDs trong đơn hàng.
 * @returns {{ isValid: boolean, error: string }}
 */
export const validateVoucher = (voucher, orderTotal, { productIds = [], categoryIds = [] } = {}) => {
    // Kiểm tra status active
    const activeCheck = checkVoucherActiveStatus(voucher);
    if (!activeCheck.isValid) {
        return activeCheck;
    }

    // Kiểm tra orderTotal là một giá trị hợp lệ
    const numericOrderTotal = typeof orderTotal === 'number' ? orderTotal : parseFloat(orderTotal) || 0;
    if (numericOrderTotal <= 0) {
        return {
            isValid: false,
            error: 'Giá trị đơn hàng phải lớn hơn 0 để áp dụng mã giảm giá',
        };
    }

    // Chuyển thành Sets để dễ dàng lookup
    const productIdsSet = productIds instanceof Set ? productIds : new Set(productIds || []);
    const categoryIdsSet = categoryIds instanceof Set ? categoryIds : new Set(categoryIds || []);

    // Check Min Order Value
    if (voucher.minOrderValue != null && typeof voucher.minOrderValue === 'number' && voucher.minOrderValue > 0) {
        if (numericOrderTotal < voucher.minOrderValue) {
            return {
                isValid: false,
                error: `Mã giảm giá "${voucher.code}" chỉ áp dụng cho đơn hàng từ ${formatPrice(voucher.minOrderValue)}. Đơn hàng hiện tại: ${formatPrice(numericOrderTotal)}`,
            };
        }
    }

    // Check Max Order Value
    if (voucher.maxOrderValue != null && typeof voucher.maxOrderValue === 'number' && voucher.maxOrderValue > 0) {
        if (numericOrderTotal > voucher.maxOrderValue) {
            return {
                isValid: false,
                error: `Mã giảm giá "${voucher.code}" chỉ áp dụng cho đơn hàng đến ${formatPrice(voucher.maxOrderValue)}. Đơn hàng hiện tại: ${formatPrice(numericOrderTotal)}`,
            };
        }
    }

    // Check Apply Scope
    const applyScope = voucher.applyScope || 'ORDER';

    if (applyScope === 'PRODUCT') {
        // Get product IDs từ voucher - hỗ trợ cả array objects và array IDs
        const productApply = voucher.productApply || voucher.productIds || [];
        if (productApply.length > 0) {
            const allowedProductIds = new Set(
                productApply.map((p) => {
                    if (typeof p === 'string') return p;
                    if (typeof p === 'object' && p.id) return p.id;
                    return String(p);
                })
            );

            // Check nếu có ít nhất một product trong đơn hàng khớp
            const hasMatchingProduct = [...productIdsSet].some((id) => allowedProductIds.has(String(id)));

            if (!hasMatchingProduct) {
                return {
                    isValid: false,
                    error: `Mã giảm giá "${voucher.code}" không áp dụng cho các sản phẩm đã chọn`,
                };
            }
        } else {
            // Nếu scope là PRODUCT nhưng không có sản phẩm được chọn, voucher không hợp lệ
            return {
                isValid: false,
                error: `Mã giảm giá "${voucher.code}" không có sản phẩm được phép áp dụng`,
            };
        }
    } else if (applyScope === 'CATEGORY') {
        // Get category IDs từ voucher - hỗ trợ cả array objects và array IDs
        const categoryApply = voucher.categoryApply || voucher.categoryIds || [];
        if (categoryApply.length > 0) {
            const allowedCategoryIds = new Set(
                categoryApply.map((c) => {
                    if (typeof c === 'string') return c;
                    if (typeof c === 'object' && c.id) return c.id;
                    return String(c);
                })
            );

            // Check nếu có ít nhất một category trong đơn hàng khớp
            const hasMatchingCategory = [...categoryIdsSet].some((id) => allowedCategoryIds.has(String(id)));

            if (!hasMatchingCategory) {
                return {
                    isValid: false,
                    error: `Mã giảm giá "${voucher.code}" không áp dụng cho danh mục của các sản phẩm đã chọn`,
                };
            }
        } else {
            // Nếu scope là CATEGORY nhưng không có category được chọn, voucher không hợp lệ
            return {
                isValid: false,
                error: `Mã giảm giá "${voucher.code}" không có danh mục được phép áp dụng`,
            };
        }
    }

    return { isValid: true, error: '' };
};

/**
 * Lọc các voucher có thể áp dụng cho đơn hàng hiện tại.
 * Hàm này thực hiện tất cả các kiểm tra bao gồm status active, dates, giá trị đơn hàng và scope.
 * 
 * @param {Array<Object>} vouchers - Danh sách các voucher có thể áp dụng.
 * @param {number} orderTotal - Giá trị đơn hàng.
 * @param {Object} context - Context chứa productIds và categoryIds.
 * @param {Array<string>|Set<string>} context.productIds - Danh sách product IDs trong đơn hàng.
 * @param {Array<string>|Set<string>} context.categoryIds - Danh sách category IDs trong đơn hàng.
 * @returns {Array<Object>} - Danh sách các voucher có thể áp dụng.
 */
export const filterApplicableVouchers = (vouchers, orderTotal, { productIds = [], categoryIds = [] } = {}) => {
    if (!Array.isArray(vouchers) || vouchers.length === 0) return [];

    const numericOrderTotal = typeof orderTotal === 'number' ? orderTotal : parseFloat(orderTotal) || 0;
    if (numericOrderTotal <= 0) return [];

    return vouchers.filter((voucher) => {
        // Sử dụng validateVoucher để kiểm tra tính hợp lệ
        const result = validateVoucher(voucher, numericOrderTotal, { productIds, categoryIds });
        return result.isValid;
    });
};

/**
 * Tính toán giá trị giảm giá dựa trên voucher.
 * @param {Object} voucher - Object voucher
 * @param {number} orderTotal - Giá trị đơn hàng
 * @returns {number} - Giá trị giảm giá (làm tròn đến đơn vị đồng)
 */
export const calculateVoucherDiscount = (voucher, orderTotal) => {
    if (!voucher) return 0;

    const numericOrderTotal = typeof orderTotal === 'number' ? orderTotal : parseFloat(orderTotal) || 0;
    if (numericOrderTotal <= 0) return 0;

    let discount = 0;

    if (voucher.discountValueType === 'PERCENTAGE') {
        // Giảm giá theo phần trăm
        const discountValue = voucher.discountValue || 0;
        discount = (numericOrderTotal * discountValue) / 100;

        // Áp dụng maxDiscountValue nếu có
        if (voucher.maxDiscountValue != null && typeof voucher.maxDiscountValue === 'number' && voucher.maxDiscountValue > 0) {
            discount = Math.min(discount, voucher.maxDiscountValue);
        }
    } else {
        // Giảm giá cố định
        discount = voucher.discountValue || 0;
    }

    // Giá trị giảm giá không được vượt quá giá trị đơn hàng
    discount = Math.min(discount, numericOrderTotal);

    // Làm tròn đến đơn vị đồng (VND không có số thập phân)
    return Math.round(discount);
};

/**
 * Validates định dạng mã giảm giá
 * @param {string} code
 * @returns {{ isValid: boolean, error: string }}
 */
export const validateVoucherCodeFormat = (code) => {
    if (!code || typeof code !== 'string') {
        return { isValid: false, error: 'Mã giảm giá không được để trống' };
    }

    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length === 0) {
        return { isValid: false, error: 'Mã giảm giá không được để trống' };
    }

    // Kiểm tra định dạng cơ bản: chữ cái, số, dấu gạch ngang và gạch dưới được phép
    if (!/^[A-Z0-9_-]+$/.test(trimmedCode)) {
        return { isValid: false, error: 'Mã giảm giá chỉ được chứa chữ cái, số, dấu gạch ngang và gạch dưới' };
    }

    return { isValid: true, error: '', normalizedCode: trimmedCode };
};
