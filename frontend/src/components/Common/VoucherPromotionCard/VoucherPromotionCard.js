import React from 'react';
import ReactDOM from 'react-dom';
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
 * VoucherCard Component - Ticket Style Design
 * Displays a voucher with left discount badge and right info section
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

    // Validate and clean voucher name
    const voucherName = voucher.name && voucher.name.trim() && voucher.name !== '0'
        ? voucher.name
        : null;

    // Build description text
    const buildDescription = () => {
        const parts = [];
        if (hasMinOrder) {
            parts.push(`cho đơn hàng từ ${formatCurrency(voucher.minOrderValue)}`);
        }
        if (hasMaxDiscount) {
            parts.push(`giảm tối đa ${formatCurrency(voucher.maxDiscountValue)}`);
        }
        const scopeInfo = getScopeDisplay(voucher.applyScope, voucher.categoryNames, voucher.productNames);
        if (scopeInfo.text && scopeInfo.text !== 'Áp dụng cho toàn bộ đơn hàng') {
            parts.push(scopeInfo.text.toLowerCase() + (scopeInfo.detail ? `: ${scopeInfo.detail}` : ''));
        }
        return parts.length > 0 ? parts.join(', ') + '.' : 'Áp dụng cho mọi đơn hàng.';
    };

    const handleCopyCode = (e) => {
        e.stopPropagation();
        if (voucher.code) {
            navigator.clipboard.writeText(voucher.code);
            // Could add toast notification here
        }
    };

    const [showConditions, setShowConditions] = React.useState(false);
    const [popupPosition, setPopupPosition] = React.useState({ top: 0, left: 0, width: 0 });
    const cardRef = React.useRef(null);
    const popupRef = React.useRef(null);
    const closeTimerRef = React.useRef(null);
    const buttonRef = React.useRef(null);

    const handleMouseEnterButton = (e) => {
        e.stopPropagation();
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }

        if (!showConditions && cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            setPopupPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            });
            setShowConditions(true);
        }
    };

    // Update Popup usage to pass onClose as null or specific handler if needed, 
    // but for hover, we mainly rely on mouse leave. 
    // We can keep handleShowConditions for the close button if we want to keep it?
    // User said "chỉ cần hover... không cần click". 
    // The popup has a close button 'X'. It should prob still work.

    const handleClose = (e) => {
        e?.stopPropagation();
        setShowConditions(false);
    };

    // Handle closing when clicking outside or scrolling (backup for hover)
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (showConditions &&
                popupRef.current && !popupRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                setShowConditions(false);
            }
        };

        const handleScroll = () => {
            // Optional: close on scroll if desired, or let it stick. 
            // Previous implementation closed on scroll. Let's keep it for now.
            if (showConditions) setShowConditions(false);
        };

        if (showConditions) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [showConditions]);

    const handleMouseLeave = () => {
        closeTimerRef.current = setTimeout(() => {
            setShowConditions(false);
        }, 150);
    };

    const handleMouseEnter = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    };

    return (
        <motion.div
            ref={cardRef}
            className={cx('voucher-ticket')}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
        >
            {/* Left - Discount Badge */}
            <div className={cx('voucher-ticket-left')}>
                <div className={cx('voucher-ticket-discount')}>
                    <span className={cx('discount-label')}>MÃ GIẢM</span>
                    <span className={cx('discount-value')}>{discountText}</span>
                </div>
            </div>

            {/* Ticket Cut Decoration */}
            <div className={cx('voucher-ticket-cut')}>
                <div className={cx('cut-circle', 'top')} />
                <div className={cx('cut-line')} />
                <div className={cx('cut-circle', 'bottom')} />
            </div>

            {/* Right - Info Section */}
            <div className={cx('voucher-ticket-right')}>
                <div className={cx('voucher-ticket-header')}>
                    <span className={cx('voucher-ticket-title')}>
                        NHẬP MÃ: {voucherName || voucher.code || 'VOUCHER'}
                    </span>
                </div>

                <p className={cx('voucher-ticket-desc')}>
                    Mã giảm {discountText} {buildDescription()}
                </p>

                <div className={cx('voucher-ticket-actions')}>
                    <button
                        className={cx('voucher-btn', 'copy-btn')}
                        onClick={handleCopyCode}
                    >
                        Sao chép mã
                    </button>
                    <button
                        ref={buttonRef}
                        className={cx('voucher-btn', 'condition-btn')}
                        onMouseEnter={handleMouseEnterButton}
                        onMouseLeave={handleMouseLeave}
                        onClick={(e) => e.stopPropagation()}
                    >
                        Điều kiện
                    </button>
                </div>

                {/* Conditions Popup using Portal */}
                {showConditions && (
                    // Logic to check if ReactDOM is defined or we need to dynamic import?
                    // I will add the import in a previous step to be safe, but for now assuming standard React setup
                    // I'll assume valid JSX.
                    // Note: I will need to ensure `import ReactDOM from 'react-dom'` exists.
                    <PortalPopup
                        show={showConditions}
                        position={popupPosition}
                        onClose={handleClose}
                        popupRef={popupRef}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        voucher={voucher}
                        hasMinOrder={hasMinOrder}
                        hasMaxDiscount={hasMaxDiscount}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        getScopeDisplay={getScopeDisplay}
                    />
                )}
            </div>
        </motion.div>
    );
};

// Helper component to keep clean and use Portal
const PortalPopup = ({
    show, position, onClose, popupRef, onMouseEnter, onMouseLeave,
    voucher, hasMinOrder, hasMaxDiscount, formatCurrency, formatDate, getScopeDisplay
}) => {
    if (typeof document === 'undefined') return null;

    return ReactDOM.createPortal(
        <div
            ref={popupRef}
            className={cx('voucher-conditions-popup')}
            style={{
                position: 'absolute',
                top: position.top,
                left: position.left,
                width: position.width,
                zIndex: 9999
            }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className={cx('popup-header')}>
                <span className={cx('popup-title')}>Điều kiện áp dụng</span>
                <button
                    className={cx('popup-close')}
                    onClick={onClose}
                >
                    ✕
                </button>
            </div>
            <div className={cx('popup-content')}>
                <div className={cx('popup-item', 'code-item')}>
                    <span className={cx('item-label')}>Mã voucher:</span>
                    <span className={cx('item-value')}>{voucher.code || 'VOUCHER'}</span>
                </div>
                {hasMinOrder && (
                    <div className={cx('popup-item')}>
                        <span className={cx('item-icon')}>🛒</span>
                        <span>Đơn hàng tối thiểu: <strong>{formatCurrency(voucher.minOrderValue)}</strong></span>
                    </div>
                )}
                {hasMaxDiscount && (
                    <div className={cx('popup-item')}>
                        <span className={cx('item-icon')}>💎</span>
                        <span>Giảm tối đa: <strong>{formatCurrency(voucher.maxDiscountValue)}</strong></span>
                    </div>
                )}
                {voucher.expiryDate && (
                    <div className={cx('popup-item')}>
                        <span className={cx('item-icon')}>⏰</span>
                        <span>Hết hạn: <strong>{formatDate(voucher.expiryDate)}</strong></span>
                    </div>
                )}
                {(() => {
                    const scopeInfo = getScopeDisplay(
                        voucher.applyScope,
                        voucher.categoryNames,
                        voucher.productNames
                    );
                    return (
                        <div className={cx('popup-item')}>
                            <span className={cx('item-icon')}>{scopeInfo.icon}</span>
                            <span>{scopeInfo.text}{scopeInfo.detail && <>: <strong>{scopeInfo.detail}</strong></>}</span>
                        </div>
                    );
                })()}
                {!hasMinOrder && !hasMaxDiscount && (
                    <div className={cx('popup-item', 'highlight')}>
                        <span className={cx('item-icon')}>✨</span>
                        <span>Không có điều kiện - Áp dụng ngay!</span>
                    </div>
                )}
            </div>
        </div>,
        document.body
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
