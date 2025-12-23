import { Link } from 'react-router-dom';
import { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './ProductCard.module.scss';
// Fallback image for products - TODO: Replace with cosmetic product placeholder image
import defaultProductImage from '../../../assets/images/img_qc.png';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../Notification';
import { addCartItem, getStoredToken } from '../../../services';

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

    // Đánh giá
    const rating = typeof product?.averageRating === 'number' ? product.averageRating : 0;
    const renderStars = () => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        return Array.from({ length: 5 }, (_, index) => {
            if (index < fullStars) {
                return (
                    <svg key={index} width="14" height="14" viewBox="0 0 24 24" fill="#C9A959" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                );
            } else if (index === fullStars && hasHalfStar) {
                return (
                    <svg key={index} width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id={`half-${id}-${index}`}>
                                <stop offset="50%" stopColor="#C9A959" />
                                <stop offset="50%" stopColor="#E5E5E5" />
                            </linearGradient>
                        </defs>
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={`url(#half-${id}-${index})`} />
                    </svg>
                );
            } else {
                return (
                    <svg key={index} width="14" height="14" viewBox="0 0 24 24" fill="#E5E5E5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                );
            }
        });
    };

    const { openLoginModal } = useAuth();
    const { success, error: showError } = useNotification();
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Kiểm tra đăng nhập
        const token = getStoredToken('token');
        if (!token) {
            showError('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
            openLoginModal();
            return;
        }

        // Kiểm tra productId
        if (!id) {
            showError('Không tìm thấy thông tin sản phẩm');
            return;
        }

        if (isAddingToCart) return;

        try {
            setIsAddingToCart(true);
            const { ok, status, data } = await addCartItem(id, 1, token);

            if (!ok) {
                if (status === 401) {
                    showError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                    openLoginModal();
                } else if (status === 403) {
                    showError('Bạn không có quyền thêm sản phẩm vào giỏ hàng. Vui lòng đăng nhập với tài khoản khách hàng.');
                } else {
                    const errorMessage = data?.message || 'Không thể thêm sản phẩm vào giỏ hàng';
                    showError(errorMessage);
                }
            } else {
                success('Đã thêm sản phẩm vào giỏ hàng');
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            showError('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng');
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <div className={cx('hot-product', { fluid })}>
            {showDiscount && <span className={cx('discount-badge')}>-{resolvedDiscount}%</span>}
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
                    <div className={cx('rating-row')}>
                        <span className={cx('stars')}>{renderStars()}</span>
                    </div>
                    <div className={cx('price-block')}>
                        <span className={cx('current-price')}>
                            {formatPrice(resolvedCurrentPrice)}
                        </span>
                        {showOriginal && (
                            <span className={cx('original-price')}>
                                {formatPrice(resolvedOriginalPrice)}
                            </span>
                        )}
                    </div>
                    <button
                        className={cx('add-to-cart-btn', { loading: isAddingToCart })}
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                    >
                        {isAddingToCart ? 'Đang thêm...' : 'Thêm vào giỏ'}
                    </button>
                </div>
            </Link>
        </div>
    );
}
