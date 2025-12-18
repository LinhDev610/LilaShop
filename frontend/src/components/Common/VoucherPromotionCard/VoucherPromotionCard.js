import { motion } from 'framer-motion';
import classNames from 'classnames/bind';
import styles from './VoucherPromotionCard.module.scss';

const cx = classNames.bind(styles);

/**
 * Helper function to render scope information
 * @param {string} applyScope - PRODUCT, CATEGORY, or ORDER
 * @param {Array} categoryNames - List of category names from backend
 * @param {Array} productNames - List of product names from backend
 * @returns {Object} scope display data
 */
const getScopeDisplay = (applyScope, categoryNames = [], productNames = []) => {
    if (!applyScope) {
        return { icon: '🌐', text: 'Áp dụng cho toàn bộ đơn hàng', detail: null };
    }

    switch (applyScope) {
        case 'ORDER':
            return { icon: '🌐', text: 'Áp dụng cho toàn bộ đơn hàng', detail: null };
        case 'CATEGORY':
            const catList = Array.isArray(categoryNames) ? categoryNames : [];
            if (catList.length === 0) {
                return { icon: '📁', text: 'Áp dụng cho các danh mục', detail: null };
            }
            // Show all categories
            return {
                icon: '📁',
                text: 'Áp dụng cho danh mục',
                detail: catList.join(', ')
            };
        case 'PRODUCT':
            const prodList = Array.isArray(productNames) ? productNames : [];
            if (prodList.length === 0) {
                return { icon: '🏷️', text: 'Áp dụng cho các sản phẩm cụ thể', detail: null };
            }
            // Show all products
            return {
                icon: '🏷️',
                text: 'Áp dụng cho sản phẩm',
                detail: prodList.join(', ')
            };
        default:
            return { icon: '🌐', text: 'Áp dụng cho toàn bộ đơn hàng', detail: null };
    }
};



/**
 * VoucherCard Component
 * Displays a voucher with all relevant information including discount, conditions, and expiry date
 * 
 * @param {Object} voucher - Voucher data object
 * @param {Function} formatDiscountValue - Function to format discount value
 * @param {Function} formatCurrency - Function to format currency values
 * @param {Function} formatDate - Function to format dates
 * @param {Function} normalizeImageUrl - Function to normalize image URLs
 * @param {string} apiBaseUrl - API base URL for image resolution
 */
export const VoucherCard = ({
    voucher,
    formatDiscountValue,
    formatCurrency,
    formatDate,
    normalizeImageUrl,
    apiBaseUrl
}) => {
    const discountText = formatDiscountValue(voucher);
    const hasMinOrder = voucher.minOrderValue && voucher.minOrderValue > 0;
    const hasMaxDiscount = voucher.maxDiscountValue && voucher.maxDiscountValue > 0;
    const voucherImageUrl = voucher.imageUrl
        ? normalizeImageUrl(voucher.imageUrl, apiBaseUrl)
        : null;

    // Validate and clean voucher name
    const voucherName = voucher.name && voucher.name.trim() && voucher.name !== '0'
        ? voucher.name
        : null;

    return (
        <motion.div
            className={cx('voucher-card-redesign')}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
        >
            {/* Top - Visual Banner with Discount */}
            <div className={cx('voucher-visual')}>
                {voucherImageUrl ? (
                    <>
                        <img
                            src={voucherImageUrl}
                            alt={voucherName || 'Voucher'}
                            className={cx('voucher-bg-image')}
                            loading="lazy"
                        />
                        <div className={cx('voucher-image-overlay')} />
                    </>
                ) : (
                    <div className={cx('voucher-gradient-bg')} />
                )}
                <div className={cx('voucher-discount-overlay')}>
                    <div className={cx('discount-value-large')}>{discountText}</div>
                    <div className={cx('discount-label-small')}>
                        {voucher.discountValueType === 'PERCENTAGE' ? 'GIẢM GIÁ' : 'GIẢM NGAY'}
                    </div>
                </div>
            </div>

            {/* Bottom - Details Section */}
            <div className={cx('voucher-info-section')}>
                {/* Code Badge + Title */}
                <div className={cx('voucher-top-row')}>
                    <div className={cx('voucher-code-badge')}>
                        <span className={cx('code-text')}>{voucher.code || 'VOUCHER'}</span>
                    </div>
                </div>

                {/* Voucher Name - Full display */}
                {voucherName && (
                    <div className={cx('voucher-title-inline')}>{voucherName}</div>
                )}

                {/* Conditions List - Full info */}
                <div className={cx('voucher-conditions-list')}>
                    {hasMinOrder && (
                        <div className={cx('condition-item', 'highlight')}>
                            <span className={cx('condition-icon')}>🛒</span>
                            <span className={cx('condition-text')}>
                                Đơn hàng từ <strong>{formatCurrency(voucher.minOrderValue)}</strong>
                            </span>
                        </div>
                    )}
                    {hasMaxDiscount && (
                        <div className={cx('condition-item')}>
                            <span className={cx('condition-icon')}>💎</span>
                            <span className={cx('condition-text')}>
                                Giảm tối đa <strong>{formatCurrency(voucher.maxDiscountValue)}</strong>
                            </span>
                        </div>
                    )}
                    {!hasMinOrder && !hasMaxDiscount && (
                        <div className={cx('condition-item')}>
                            <span className={cx('condition-icon')}>✨</span>
                            <span className={cx('condition-text')}>Áp dụng cho mọi đơn hàng</span>
                        </div>
                    )}
                    {voucher.expiryDate && (
                        <div className={cx('condition-item', 'expiry-highlight')}>
                            <span className={cx('condition-icon')}>⏰</span>
                            <span className={cx('condition-text')}>
                                Hết hạn: <strong>{formatDate(voucher.expiryDate)}</strong>
                            </span>
                        </div>
                    )}
                    {/* Scope Information */}
                    {(() => {
                        const scopeInfo = getScopeDisplay(
                            voucher.applyScope,
                            voucher.categoryNames,
                            voucher.productNames
                        );
                        return (
                            <div className={cx('condition-item', 'scope-info')}>
                                <span className={cx('condition-icon')}>{scopeInfo.icon}</span>
                                <span className={cx('condition-text')}>
                                    {scopeInfo.text}
                                    {scopeInfo.detail && <strong>: {scopeInfo.detail}</strong>}
                                </span>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </motion.div>
    );
};

/**
 * PromotionCard Component
 * Displays a promotion with all relevant information including discount, description, conditions, and expiry date
 * 
 * @param {Object} promotion - Promotion data object
 * @param {Function} formatDiscountValue - Function to format discount value
 * @param {Function} formatCurrency - Function to format currency values
 * @param {Function} formatDate - Function to format dates
 * @param {Function} normalizeImageUrl - Function to normalize image URLs
 * @param {string} apiBaseUrl - API base URL for image resolution
 */
export const PromotionCard = ({
    promotion,
    formatDiscountValue,
    formatCurrency,
    formatDate,
    normalizeImageUrl,
    apiBaseUrl
}) => {
    const discountText = formatDiscountValue(promotion);
    const hasMinOrder = promotion.minOrderValue && promotion.minOrderValue > 0;
    const hasMaxDiscount = promotion.maxDiscountValue && promotion.maxDiscountValue > 0;
    const promotionImageUrl = promotion.imageUrl
        ? normalizeImageUrl(promotion.imageUrl, apiBaseUrl)
        : null;

    // Validate and clean promotion name
    const promotionName = promotion.name && promotion.name.trim() && promotion.name !== '0'
        ? promotion.name
        : null;

    // Only show code if different from name
    const showCode = promotion.code && promotion.code !== promotionName;

    // Clean description
    const cleanDescription = promotion.description &&
        promotion.description.trim() &&
        promotion.description !== 'fffff' &&
        promotion.description.length > 3
        ? promotion.description
        : null;

    return (
        <motion.div
            className={cx('promotion-card-redesign')}
            whileHover={{ y: -6 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
        >
            {/* Top - Visual Banner with Discount */}
            <div className={cx('promotion-visual')}>
                {promotionImageUrl ? (
                    <>
                        <img
                            src={promotionImageUrl}
                            alt={promotionName || 'Promotion'}
                            className={cx('promotion-bg-image')}
                            loading="lazy"
                        />
                        <div className={cx('promotion-image-overlay')} />
                    </>
                ) : (
                    <div className={cx('promotion-gradient-bg')} />
                )}
                <div className={cx('promotion-discount-badge')}>
                    <div className={cx('discount-value-large')}>{discountText}</div>
                    <div className={cx('discount-label-small')}>
                        {promotion.discountValueType === 'PERCENTAGE' ? 'GIẢM GIÁ' : 'GIẢM NGAY'}
                    </div>
                </div>
            </div>

            {/* Bottom - Details Section */}
            <div className={cx('promotion-info-section')}>
                {/* Code Badge */}
                <div className={cx('promotion-top-row')}>
                    {showCode && (
                        <div className={cx('promotion-code-badge')}>
                            <span className={cx('code-text')}>{promotion.code}</span>
                        </div>
                    )}
                </div>

                {/* Promotion Name - Full display */}
                {promotionName && (
                    <div className={cx('promotion-title-inline')}>{promotionName}</div>
                )}

                {/* Description - Full display */}
                {cleanDescription && (
                    <p className={cx('promotion-desc-text')}>
                        {cleanDescription.length > 120
                            ? `${cleanDescription.substring(0, 120)}...`
                            : cleanDescription}
                    </p>
                )}

                {/* Conditions List - Full info */}
                <div className={cx('promotion-conditions-list')}>
                    {hasMinOrder && (
                        <div className={cx('condition-item', 'highlight')}>
                            <span className={cx('condition-icon')}>🛒</span>
                            <span className={cx('condition-text')}>
                                Đơn hàng từ <strong>{formatCurrency(promotion.minOrderValue)}</strong>
                            </span>
                        </div>
                    )}
                    {hasMaxDiscount && (
                        <div className={cx('condition-item')}>
                            <span className={cx('condition-icon')}>💎</span>
                            <span className={cx('condition-text')}>
                                Giảm tối đa <strong>{formatCurrency(promotion.maxDiscountValue)}</strong>
                            </span>
                        </div>
                    )}
                    {promotion.expiryDate && (
                        <div className={cx('condition-item', 'expiry-highlight')}>
                            <span className={cx('condition-icon')}>⏰</span>
                            <span className={cx('condition-text')}>
                                Hết hạn: <strong>{formatDate(promotion.expiryDate)}</strong>
                            </span>
                        </div>
                    )}
                    {/* Scope Information */}
                    {(() => {
                        const scopeInfo = getScopeDisplay(
                            promotion.applyScope,
                            promotion.categoryNames,
                            promotion.productNames
                        );
                        return (
                            <div className={cx('condition-item', 'scope-info')}>
                                <span className={cx('condition-icon')}>{scopeInfo.icon}</span>
                                <span className={cx('condition-text')}>
                                    {scopeInfo.text}
                                    {scopeInfo.detail && <strong>: {scopeInfo.detail}</strong>}
                                </span>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </motion.div>
    );
};
