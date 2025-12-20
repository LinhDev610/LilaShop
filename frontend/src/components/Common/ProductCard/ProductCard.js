import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ProductCard.module.scss';
// Fallback image for products - TODO: Replace with cosmetic product placeholder image
import defaultProductImage from '../../../assets/images/img_qc.png';

const cx = classNames.bind(styles);

// ProductCard Component
// Card hiển thị sản phẩm với hình ảnh, tên, giá, rating
export default function ProductCard({ product = {}, fluid = false }) {
    const {
        id,
        title,
        name,
        image,
        imageUrl,
        thumbnailUrl,
        currentPrice,
        price,
        originalPrice,
        unitPrice,
        discount,
        discountValue,
    } = product || {};

    const parsePrice = (value) =>
        typeof value === 'number' && Number.isFinite(value) ? value : null;

    // Get tax from product (default 0)
    const tax = typeof product?.tax === 'number' ? product.tax : 0;

    // Calculate originalPrice (giá gốc đã có tax nhưng chưa có promotion discount)
    let resolvedOriginalPrice = 0;
    const parsedUnitPrice = parsePrice(unitPrice);
    const parsedPrice = parsePrice(price);
    const parsedCurrentPrice = parsePrice(currentPrice);
    const parsedOriginalPrice = parsePrice(originalPrice);

    if (parsedOriginalPrice != null && parsedOriginalPrice > 0) {
        resolvedOriginalPrice = parsedOriginalPrice;
    } else if (parsedUnitPrice != null && parsedUnitPrice > 0) {
        resolvedOriginalPrice = parsedUnitPrice * (1 + tax);
    } else if (parsedPrice != null && parsePrice(discountValue) > 0) {
        // Nếu không có unitPrice, tính ngược lại từ price và discountValue
        resolvedOriginalPrice = parsedPrice + parsePrice(discountValue);
    } else if (parsedPrice != null) {
        resolvedOriginalPrice = parsedPrice;
    }

    // currentPrice là giá cuối cùng (đã có promotion discount)
    let resolvedCurrentPrice = 0;
    if (parsedCurrentPrice != null && parsedCurrentPrice > 0) {
        resolvedCurrentPrice = parsedCurrentPrice;
    } else if (parsedPrice != null && parsedPrice > 0) {
        // Backend đã tính: price = unitPrice * (1 + tax) - discountValue
        resolvedCurrentPrice = parsedPrice;
    } else if (parsedUnitPrice != null && parsedUnitPrice > 0) {
        // Tính từ unitPrice, tax và discountValue
        const parsedDiscountValue = parsePrice(discountValue) || 0;
        resolvedCurrentPrice = Math.max(0, parsedUnitPrice * (1 + tax) - parsedDiscountValue);
    } else {
        resolvedCurrentPrice = resolvedOriginalPrice;
    }

    // Ensure originalPrice >= currentPrice
    if (resolvedOriginalPrice < resolvedCurrentPrice) {
        resolvedOriginalPrice = resolvedCurrentPrice;
    }

    // Calculate discount percentage
    const parsedDiscountValue = parsePrice(discountValue) || 0;
    let resolvedDiscount = Number.isFinite(discount) ? Math.max(0, discount) : null;
    if (resolvedDiscount === null) {
        if (parsedDiscountValue > 0 && resolvedOriginalPrice > 0) {
            resolvedDiscount = Math.min(99, Math.round((parsedDiscountValue / resolvedOriginalPrice) * 100));
        } else if (resolvedOriginalPrice > resolvedCurrentPrice && resolvedOriginalPrice > 0) {
            resolvedDiscount = Math.min(99, Math.round(((resolvedOriginalPrice - resolvedCurrentPrice) / resolvedOriginalPrice) * 100));
        } else {
            resolvedDiscount = 0;
        }
    }

    const resolvedTitle = title || name || 'Sản phẩm';
    const resolvedImage =
        image ||
        imageUrl ||
        thumbnailUrl ||
        product.defaultMediaUrl ||
        product.mediaUrl ||
        defaultProductImage;
    const productLink = id ? `/product/${id}` : '/';

    const formatPrice = (value) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(value || 0);

    const showOriginal = resolvedOriginalPrice > resolvedCurrentPrice;
    const showDiscount = resolvedDiscount > 0 && showOriginal;

    return (
        <div className={cx('hot-product', { fluid })}>
            <Link to={productLink} className={cx('product-link')}>
                <div className={cx('image-wrapper')}>
                    <img
                        src={resolvedImage}
                        alt={resolvedTitle}
                        className={cx('product-image')}
                        onError={(e) => {
                            if (e.target.src !== defaultProductImage) {
                                e.target.src = defaultProductImage;
                            }
                        }}
                    />
                </div>
                <div className={cx('product-info')}>
                    <h3 className={cx('product-title')}>{resolvedTitle}</h3>
                    <div className={cx('price-block')}>
                        <span className={cx('current-price')}>
                            {formatPrice(resolvedCurrentPrice)}
                        </span>
                        <div className={cx('sub-prices')}>
                            {showOriginal && (
                                <span className={cx('original-price')}>
                                    {formatPrice(resolvedOriginalPrice)}
                                </span>
                            )}
                            {showDiscount && <span className={cx('discount-pill')}>-{resolvedDiscount}%</span>}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
