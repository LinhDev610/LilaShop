import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './CartPage.module.scss';
import { getStoredToken, getApiBaseUrl } from '../../services/utils';
import { normalizeMediaUrl } from '../../services/productUtils';
import {
    getCart,
    updateCartItemQuantity,
    removeCartItem,
    applyVoucherToCart,
    clearVoucherFromCart,
    getActiveVouchers,
} from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../components/Common/Notification';
// Fallback image for products - TODO: Replace with cosmetic product placeholder image
import defaultProductImage from '../../assets/images/img_qc.png';
import {
    validateVoucher,
    filterApplicableVouchers,
    formatPrice,
    validateVoucherCodeFormat,
} from '../../utils/voucherValidation';

const cx = classNames.bind(styles);

export default function CartPage() {
    const navigate = useNavigate();
    const { openLoginModal } = useAuth();
    const { success, error: showError } = useNotification();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);

    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [selectedVoucherCode, setSelectedVoucherCode] = useState('');
    const [voucherCodeInput, setVoucherCodeInput] = useState('');
    const [updatingItems, setUpdatingItems] = useState(new Set());
    // Lưu thông tin meta của sản phẩm: ảnh + giá gốc
    const [productMeta, setProductMeta] = useState({});
    const [availableVouchers, setAvailableVouchers] = useState([]);

    const isLoggedIn = !!getStoredToken('token');

    const broadcastCartCount = (cartData) => {
        const items = cartData?.items || cartData?.cartItems;
        let count = 0;
        if (Array.isArray(items)) {
            count = items.reduce((sum, item) => {
                const qty = Number(item?.quantity);
                if (!Number.isNaN(qty) && qty > 0) {
                    return sum + qty;
                }
                return sum + 1;
            }, 0);
        }
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { count } }));
    };

    const setCartWithBroadcast = (updater) => {
        if (typeof updater === 'function') {
            setCart((prevCart) => {
                const nextCart = updater(prevCart);
                broadcastCartCount(nextCart);
                return nextCart;
            });
        } else {
            setCart(updater);
            broadcastCartCount(updater);
        }
    };

    // Fetch cart data
    useEffect(() => {
        if (!isLoggedIn) {
            setLoading(false);
            return;
        }

        const fetchCart = async () => {
            try {
                setLoading(true);
                const token = getStoredToken('token');

                if (!token) {
                    showError('Vui lòng đăng nhập để xem giỏ hàng');
                    openLoginModal();
                    setLoading(false);
                    return;
                }

                const { ok, status, data } = await getCart(token);

                if (!ok) {
                    if (status === 401) {
                        showError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                        openLoginModal();
                    } else if (status === 403) {
                        showError('Bạn không có quyền truy cập giỏ hàng. Vui lòng đăng nhập với tài khoản khách hàng.');
                        openLoginModal();
                    } else {
                        const errorMessage = data?.message || data?.error || `Không thể tải giỏ hàng (Lỗi: ${status})`;
                        console.error('Cart fetch error:', { status, data });
                        showError(errorMessage);
                    }
                    setLoading(false);
                    return;
                }

                setCartWithBroadcast(data);
                if (data?.appliedVoucherCode) {
                    setSelectedVoucherCode(data.appliedVoucherCode);
                }

                // Fetch product images for cart items
                if (data?.items && Array.isArray(data.items)) {
                    const metaMap = {};
                    data.items.forEach((item) => {
                        if (!item.productId) return;

                        // Fetch product để lấy ảnh + thông tin giá giống ProductDetail
                        fetch(`${API_BASE_URL}/products/${item.productId}`, {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' },
                        })
                            .then((res) => res.json())
                            .then((productData) => {
                                const product = productData?.result || productData;

                                const imageUrl =
                                    product?.defaultMediaUrl ||
                                    (product?.mediaUrls && product.mediaUrls.length > 0
                                        ? product.mediaUrls[0]
                                        : '');
                                const normalizedImage = imageUrl
                                    ? normalizeMediaUrl(imageUrl, API_BASE_URL)
                                    : defaultProductImage;

                                // Logic tính giá giống với ProductDetail:
                                // - currentPrice: giá đang bán (đã giảm)
                                // - originalPrice: giá gốc trước giảm
                                const currentPrice =
                                    (typeof product?.price === 'number' && product.price > 0
                                        ? product.price
                                        : typeof product?.unitPrice === 'number' &&
                                            product.unitPrice > 0
                                            ? product.unitPrice
                                            : undefined) ?? item.unitPrice ?? 0;

                                const originalUnitPrice =
                                    (typeof product?.originalPrice === 'number' &&
                                        product.originalPrice > 0
                                        ? product.originalPrice
                                        : typeof product?.unitPrice === 'number' &&
                                            product.unitPrice > 0
                                            ? product.unitPrice
                                            : undefined) ?? currentPrice;

                                metaMap[item.productId] = {
                                    imageUrl: normalizedImage,
                                    currentPrice,
                                    originalUnitPrice,
                                    categoryId: product?.categoryId || product?.category?.id || null,
                                };
                                setProductMeta((prev) => ({ ...prev, ...metaMap }));
                            })
                            .catch(() => {
                                metaMap[item.productId] = {
                                    imageUrl: defaultProductImage,
                                    currentPrice: item.unitPrice || 0,
                                    originalUnitPrice: item.unitPrice || 0,
                                    categoryId: null,
                                };
                                setProductMeta((prev) => ({ ...prev, ...metaMap }));
                            });
                    });
                }
            } catch (err) {
                console.error('Error fetching cart:', err);
                showError('Có lỗi xảy ra khi tải giỏ hàng');
            } finally {
                setLoading(false);
            }
        };

        fetchCart();
    }, [isLoggedIn, API_BASE_URL, openLoginModal, showError]);

    // Fetch available vouchers
    useEffect(() => {
        if (!isLoggedIn) {
            setAvailableVouchers([]);
            return;
        }

        const fetchVouchers = async () => {
            try {
                const token = getStoredToken('token');
                if (!token) {
                    console.log('No token, skipping voucher fetch');
                    return;
                }

                const vouchers = await getActiveVouchers(token);

                // getActiveVouchers đã dùng extractResult(data, true), nên trả về array trực tiếp
                if (Array.isArray(vouchers)) {
                    setAvailableVouchers(vouchers);
                } else {
                    console.warn('Voucher API did not return array:', vouchers);
                    setAvailableVouchers([]);
                }
            } catch (err) {
                console.error('Error fetching vouchers:', err);
                setAvailableVouchers([]);
            }
        };

        fetchVouchers();
    }, [isLoggedIn]);

    // Select all items
    const handleSelectAll = () => {
        const items = cart?.items || [];
        if (items.length === 0) return;
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map((item) => item.id)));
        }
    };

    // Toggle select item
    const handleToggleItem = (itemId) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    // Update quantity
    const handleUpdateQuantity = async (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            handleRemoveItem(itemId);
            return;
        }

        setUpdatingItems((prev) => new Set(prev).add(itemId));
        try {
            const token = getStoredToken('token');
            const { ok, status, data } = await updateCartItemQuantity(itemId, newQuantity, token);

            if (!ok) {
                if (status === 401) {
                    showError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                    openLoginModal();
                } else if (status === 400) {
                    const errorMessage = data?.message || data?.error || '';
                    if (errorMessage.includes('Hết hàng')) {
                        showError('Số lượng vượt quá tồn kho hiện có');
                    } else {
                        showError('Không thể cập nhật số lượng');
                    }
                } else {
                    showError('Không thể cập nhật số lượng');
                }
                return;
            }

            setCartWithBroadcast(data);
        } catch (err) {
            console.error('Error updating quantity:', err);
            showError('Có lỗi xảy ra khi cập nhật số lượng');
        } finally {
            setUpdatingItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
        }
    };

    // Remove item
    const handleRemoveItem = async (itemId) => {
        setUpdatingItems((prev) => new Set(prev).add(itemId));
        try {
            const token = getStoredToken('token');
            const { ok, status } = await removeCartItem(itemId, token);

            if (!ok) {
                if (status === 401) {
                    showError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                    openLoginModal();
                } else {
                    showError('Không thể xóa sản phẩm');
                }
                return;
            }

            // Xóa item khỏi state giỏ hàng trên UI, độc lập với payload backend trả về
            setCartWithBroadcast((prev) => {
                if (!prev) return prev;
                const nextItems = (prev.items || []).filter((item) => item.id !== itemId);
                return { ...prev, items: nextItems };
            });
            setSelectedItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
            success('Đã xóa sản phẩm khỏi giỏ hàng');
        } catch (err) {
            console.error('Error removing item:', err);
            showError('Có lỗi xảy ra khi xóa sản phẩm');
        } finally {
            setUpdatingItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
        }
    };

    // Apply voucher
    const handleApplyVoucher = async (voucherCode) => {
        const items = cart?.items || [];
        if (items.length === 0 || selectedItems.size === 0) {
            showError('Vui lòng chọn ít nhất một sản phẩm trước khi áp dụng mã giảm giá');
            return;
        }

        // Validate voucher code format first
        const codeFormatCheck = validateVoucherCodeFormat(voucherCode);
        if (!codeFormatCheck.isValid) {
            showError(codeFormatCheck.error);
            return;
        }
        const code = codeFormatCheck.normalizedCode;

        // Calculate subtotal for selected items
        const selectedItemsForCheck = items.filter((item) => selectedItems.has(item.id));
        const subtotalForCheck = selectedItemsForCheck.reduce((sum, item) => {
            const meta = productMeta[item.productId] || {};
            const quantity = item.quantity || 1;
            const unitPriceFromMeta = typeof meta.currentPrice === 'number' ? meta.currentPrice : undefined;
            const unitPrice = unitPriceFromMeta ?? item.unitPrice ?? 0;
            return sum + (unitPrice * quantity);
        }, 0);

        if (subtotalForCheck <= 0) {
            showError('Giá trị đơn hàng phải lớn hơn 0 để áp dụng mã giảm giá');
            return;
        }

        // Find voucher in available list and validate comprehensively
        const voucherToApply = availableVouchers.find((v) => v.code === code);
        if (!voucherToApply) {
            showError(`Mã giảm giá "${code}" không tồn tại hoặc không khả dụng`);
            return;
        }

        // Kiểm tra tính hợp lệ của voucher trước khi áp dụng
        const productIds = selectedItemsForCheck.map((item) => item.productId);
        const categoryIds = selectedItemsForCheck
            .map((item) => productMeta[item.productId]?.categoryId)
            .filter(Boolean);

        const { isValid, error } = validateVoucher(voucherToApply, subtotalForCheck, {
            productIds,
            categoryIds,
        });

        if (!isValid) {
            showError(error);
            return;
        }

        try {
            const token = getStoredToken('token');
            // Gửi orderValue để backend biết giá trị đơn hàng thực tế
            const { ok, status, data } = await applyVoucherToCart(code, token, { orderValue: subtotalForCheck });

            if (!ok) {
                if (status === 401) {
                    showError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                    openLoginModal();
                } else {
                    const backendCode = data?.code ?? data?.errorCode ?? data?.statusCode;
                    if (backendCode === 3009) {
                        showError('Bạn đã sử dụng voucher này cho một đơn hàng khác.');
                        setSelectedVoucherCode('');
                    } else {
                        // Parse backend error message và hiển thị thông tin chính xác hơn
                        let errorMessage = data?.message || data?.error || 'Không thể áp dụng mã giảm giá';
                        // Nếu backend trả về message có "0 VND", thay thế bằng giá trị thực
                        if (errorMessage.includes('0 VND') || errorMessage.includes('0VND')) {
                            errorMessage = errorMessage.replace(/0\s*VND/gi, formatPrice(subtotalForCheck));
                        }
                        showError(errorMessage);
                    }
                }
                return;
            }

            setCartWithBroadcast(data);
            setSelectedVoucherCode(code);
            setVoucherCodeInput('');
            success('Đã áp dụng mã giảm giá thành công');
        } catch (err) {
            console.error('Error applying voucher:', err);
            showError('Có lỗi xảy ra khi áp dụng mã giảm giá');
        }
    };

    // Xóa voucher đã áp dụng cả trên server và UI
    const handleClearVoucher = async () => {
        try {
            const token = getStoredToken('token');
            const { ok, status, data } = await clearVoucherFromCart(token);

            if (!ok) {
                if (status === 401) {
                    showError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
                    openLoginModal();
                } else {
                    const errorMessage =
                        data?.message || data?.error || 'Không thể hủy mã giảm giá';
                    showError(errorMessage);
                }
                return;
            }

            setCartWithBroadcast(data);
            setSelectedVoucherCode('');
            success('Đã hủy mã giảm giá');
        } catch (err) {
            console.error('Error clearing voucher:', err);
            showError('Có lỗi xảy ra khi hủy mã giảm giá');
        }
    };

    // Tự động hủy voucher khi không còn chọn sản phẩm nào trong giỏ
    useEffect(() => {
        if (!cart) return;

        const items = cart.items || [];
        const hasVoucher = !!selectedVoucherCode || !!cart.appliedVoucherCode;
        const hasSelectedItems = selectedItems.size > 0;

        // Nếu đang có voucher nhưng không chọn sản phẩm nào thì tự động hủy
        if (items.length >= 0 && hasVoucher && !hasSelectedItems) {
            handleClearVoucher();
        }
    }, [cart, selectedItems, selectedVoucherCode]);

    // Calculate totals: tính lại giống đúng logic hiển thị (giá đang bán * số lượng)
    const selectedItemsData = useMemo(() => {
        const items = cart?.items || [];
        const selected = items.filter((item) => selectedItems.has(item.id));

        const subtotal = selected.reduce((sum, item) => {
            const meta = productMeta[item.productId] || {};
            const quantity = item.quantity || 1;

            // Giá đang bán ưu tiên lấy từ meta (giống ProductDetail), fallback về unitPrice trong cart
            const unitPriceFromMeta =
                typeof meta.currentPrice === 'number' ? meta.currentPrice : undefined;
            const unitPrice = unitPriceFromMeta ?? item.unitPrice ?? 0;

            const lineTotal = unitPrice * quantity;
            return sum + lineTotal;
        }, 0);

        return { subtotal, items: selected };
    }, [cart, selectedItems, productMeta]);

    // Tự động hủy voucher nếu không còn đủ điều kiện
    useEffect(() => {
        if (!cart) return;

        const hasVoucher = !!selectedVoucherCode || !!cart.appliedVoucherCode;
        if (!hasVoucher) return;

        const currentCode = selectedVoucherCode || cart.appliedVoucherCode;
        if (!currentCode) return;

        // Tìm voucher hiện đang áp dụng trong danh sách vouchers đã load
        const currentVoucher = availableVouchers.find((v) => v.code === currentCode);
        if (!currentVoucher) return;

        const subtotal = selectedItemsData.subtotal || 0;
        if (subtotal <= 0) {
            handleClearVoucher();
            return;
        }

        // Validate voucher với điều kiện hiện tại
        const items = cart?.items || [];
        const selectedItemsForCheck = items.filter((item) => selectedItems.has(item.id));
        const productIds = selectedItemsForCheck.map((item) => item.productId);
        const categoryIds = selectedItemsForCheck
            .map((item) => productMeta[item.productId]?.categoryId)
            .filter(Boolean);

        const { isValid, error } = validateVoucher(currentVoucher, subtotal, {
            productIds,
            categoryIds,
        });

        // Nếu voucher không còn hợp lệ, tự động gỡ
        if (!isValid) {
            showError(
                `Mã giảm giá ${currentCode} không còn đủ điều kiện: ${error}. Hệ thống đã tự động gỡ mã giảm giá.`,
            );
            handleClearVoucher();
        }
    }, [cart, selectedItemsData, selectedItems, selectedVoucherCode, availableVouchers, productMeta]);

    const voucherDiscount = cart?.voucherDiscount || 0;
    const totalAmount = selectedItemsData.subtotal - voucherDiscount;

    // Lọc các voucher phù hợp với đơn hàng
    // Sử dụng toàn bộ giỏ hàng nếu chưa chọn sản phẩm nào, hoặc các sản phẩm đã chọn
    const applicableVouchers = useMemo(() => {

        if (!availableVouchers.length) {
            return [];
        }

        // Nếu không có giỏ hàng hoặc giỏ hàng trống, không hiển thị voucher nào
        if (!cart?.items || cart.items.length === 0) {
            return [];
        }

        // Nếu chưa chọn sản phẩm nào, không hiển thị voucher
        if (selectedItemsData.items.length === 0) {
            return [];
        }

        // Chỉ sử dụng các sản phẩm đã chọn (bắt buộc phải chọn sản phẩm)
        const itemsToCheck = selectedItemsData.items;

        // Tính subtotal dựa trên items đang kiểm tra
        const subtotal = itemsToCheck.reduce((sum, item) => {
            const meta = productMeta[item.productId] || {};
            const quantity = item.quantity || 1;
            const unitPriceFromMeta = typeof meta.currentPrice === 'number' ? meta.currentPrice : undefined;
            const unitPrice = unitPriceFromMeta ?? item.unitPrice ?? 0;
            return sum + (unitPrice * quantity);
        }, 0);

        const productIds = itemsToCheck.map((item) => item.productId);
        const categoryIds = itemsToCheck
            .map((item) => productMeta[item.productId]?.categoryId)
            .filter(Boolean);

        const filtered = filterApplicableVouchers(availableVouchers, subtotal, {
            productIds,
            categoryIds,
        });

        return filtered;
    }, [availableVouchers, cart, selectedItemsData, productMeta]);

    // Debug log - can be removed in production


    // Handle buy now
    const handleBuyNow = () => {
        if (selectedItems.size === 0) {
            showError('Vui lòng chọn ít nhất một sản phẩm');
            return;
        }

        const selectedIds = Array.from(selectedItems);
        navigate('/checkout', { state: { selectedItemIds: selectedIds } });
    };

    if (!isLoggedIn) {
        return (
            <div className={cx('cart-page')}>
                <div className={cx('container')}>
                    <div className={cx('empty-state')}>
                        <h2>Vui lòng đăng nhập để xem giỏ hàng</h2>
                        <button className={cx('login-btn')} onClick={openLoginModal}>
                            Đăng nhập
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={cx('cart-page')}>
                <div className={cx('container')}>
                    <div className={cx('loading-state')}>Đang tải giỏ hàng...</div>
                </div>
            </div>
        );
    }

    const items = cart?.items || [];
    const allSelected = items.length > 0 && selectedItems.size === items.length;

    return (
        <div className={cx('cart-page')}>
            <div className={cx('container')}>
                <h1 className={cx('page-title')}>GIỎ HÀNG ({items.length} sản phẩm)</h1>

                <div className={cx('cart-content')}>
                    <div className={cx('cart-items')}>
                        <div className={cx('select-all')}>
                            <label className={cx('checkbox-label')}>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                    className={cx('checkbox')}
                                />
                                <span>Chọn tất cả ({items.length} sản phẩm)</span>
                            </label>
                        </div>

                        <div className={cx('items-list')}>
                            {items.map((item) => {
                                const isSelected = selectedItems.has(item.id);
                                const isUpdating = updatingItems.has(item.id);
                                const meta = productMeta[item.productId] || {};
                                const productImage = meta.imageUrl || defaultProductImage;
                                const quantity = item.quantity || 1;
                                // Giá đang bán ưu tiên lấy từ meta (giống ProductDetail), fallback về unitPrice trong cart
                                const unitPriceFromMeta =
                                    typeof meta.currentPrice === 'number'
                                        ? meta.currentPrice
                                        : undefined;
                                const unitPrice =
                                    unitPriceFromMeta ?? item.unitPrice ?? 0;
                                const originalUnitPrice =
                                    typeof meta.originalUnitPrice === 'number'
                                        ? meta.originalUnitPrice
                                        : unitPrice;

                                const currentPrice = unitPrice;
                                const originalPrice = originalUnitPrice;
                                const showOriginal =
                                    originalPrice > currentPrice && originalPrice > 0;
                                // Thành tiền hiển thị = giá hiện tại * số lượng (giống trang chi tiết)
                                const itemSubtotal = currentPrice * quantity;

                                return (
                                    <div key={item.id} className={cx('cart-item')}>
                                        <div className={cx('item-checkbox')}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => handleToggleItem(item.id)}
                                                className={cx('checkbox')}
                                            />
                                        </div>

                                        <div className={cx('item-image')}>
                                            <img
                                                src={productImage}
                                                alt={item.productName}
                                                onError={(e) => {
                                                    e.target.src = defaultProductImage;
                                                }}
                                            />
                                        </div>

                                        <div className={cx('item-info')}>
                                            <h3 className={cx('item-name')}>{item.productName}</h3>
                                            {item.variantName && (
                                                <div className={cx('item-variant')}>
                                                    {item.variantName}
                                                    {item.shadeColor && ` - ${item.shadeColor}`}
                                                    {item.volumeMl && ` - ${item.volumeMl}ml`}
                                                    {item.weightGr && ` - ${item.weightGr}g`}
                                                </div>
                                            )}
                                            <div className={cx('item-price')}>
                                                <span className={cx('current-price')}>
                                                    {formatPrice(currentPrice)}
                                                </span>
                                                {showOriginal && (
                                                    <span className={cx('original-price')}>
                                                        {formatPrice(originalPrice)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={cx('item-quantity')}>
                                            <span className={cx('quantity-label')}>Số lượng</span>
                                            <div className={cx('quantity-controls')}>
                                                <button
                                                    onClick={() =>
                                                        handleUpdateQuantity(item.id, item.quantity - 1)
                                                    }
                                                    disabled={isUpdating || item.quantity <= 1}
                                                    className={cx('quantity-btn')}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    min="1"
                                                    onChange={(e) => {
                                                        const newQty = parseInt(e.target.value) || 1;
                                                        handleUpdateQuantity(item.id, newQty);
                                                    }}
                                                    disabled={isUpdating}
                                                    className={cx('quantity-input')}
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleUpdateQuantity(item.id, item.quantity + 1)
                                                    }
                                                    disabled={isUpdating}
                                                    className={cx('quantity-btn')}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        <div className={cx('item-subtotal')}>
                                            <span className={cx('subtotal-label')}>Thành tiền</span>
                                            <span className={cx('subtotal-value')}>
                                                {formatPrice(itemSubtotal)}
                                            </span>
                                        </div>

                                        <div className={cx('item-actions')}>
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                disabled={isUpdating}
                                                className={cx('remove-btn')}
                                                aria-label="Xóa sản phẩm"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={cx('cart-sidebar')}>
                        <div className={cx('voucher-section')}>
                            <h3 className={cx('voucher-title')}>MÃ GIẢM GIÁ</h3>
                            <div className={cx('voucher-card')}>
                                <div className={cx('voucher-input-wrapper')}>
                                    <div className={cx('voucher-input-row')}>
                                        <input
                                            type="text"
                                            className={cx('voucher-input')}
                                            placeholder="Mã giảm 20K - Đơn từ 200K"
                                            value={voucherCodeInput}
                                            onChange={(e) =>
                                                setVoucherCodeInput(e.target.value.toUpperCase())
                                            }
                                        />
                                        <button
                                            onClick={() => handleApplyVoucher(voucherCodeInput)}
                                            className={cx('select-voucher-btn')}
                                        >
                                            Chọn mã
                                        </button>
                                    </div>
                                    {selectedVoucherCode && (
                                        <p className={cx('voucher-hint')}>
                                            Đã áp dụng mã: <strong>{selectedVoucherCode}</strong>
                                            {cart?.minOrderValue && cart.minOrderValue > 0
                                                ? ` (đơn từ ${formatPrice(cart.minOrderValue)})`
                                                : ''}
                                            .
                                            <button
                                                type="button"
                                                className={cx('remove-voucher-inline')}
                                                onClick={handleClearVoucher}
                                            >
                                                Hủy mã
                                            </button>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Hiển thị các voucher phù hợp - CHỈ hiển thị voucher phù hợp với đơn hàng */}
                            {selectedItems.size > 0 && applicableVouchers.length > 0 && (
                                <div className={cx('applicable-vouchers')}>
                                    <h4 className={cx('applicable-vouchers-title')}>
                                        Voucher phù hợp với đơn hàng
                                    </h4>
                                    <div className={cx('voucher-list')}>
                                        {applicableVouchers.map((voucher) => {
                                            const isSelected = selectedVoucherCode === voucher.code;
                                            const discountText =
                                                voucher.discountValueType === 'PERCENTAGE'
                                                    ? `Giảm ${voucher.discountValue}%`
                                                    : `Giảm ${formatPrice(voucher.discountValue || 0)}`;

                                            return (
                                                <div
                                                    key={voucher.id}
                                                    className={cx('voucher-item', {
                                                        selected: isSelected,
                                                    })}
                                                >
                                                    <div className={cx('voucher-text')}>
                                                        <div className={cx('voucher-code-row')}>
                                                            <span className={cx('voucher-code')}>
                                                                {voucher.code}
                                                            </span>
                                                            <span className={cx('voucher-name')}>
                                                                {voucher.name || discountText}
                                                            </span>
                                                        </div>
                                                        {voucher.description && (
                                                            <p className={cx('voucher-desc')}>
                                                                {voucher.description}
                                                            </p>
                                                        )}
                                                        {voucher.minOrderValue && (
                                                            <p className={cx('voucher-desc')}>
                                                                Áp dụng cho đơn từ {formatPrice(voucher.minOrderValue)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        className={cx('select-voucher-btn', {
                                                            applied: isSelected,
                                                        })}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                handleClearVoucher();
                                                            } else {
                                                                handleApplyVoucher(voucher.code);
                                                            }
                                                        }}
                                                        disabled={isSelected}
                                                    >
                                                        {isSelected ? 'Đã chọn' : 'Chọn'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={cx('order-summary')}>
                            <div className={cx('summary-row')}>
                                <span>Tạm tính:</span>
                                <span>{formatPrice(selectedItemsData.subtotal)}</span>
                            </div>
                            <div className={cx('summary-row')}>
                                <span>Giảm giá:</span>
                                <span>{formatPrice(voucherDiscount)}</span>
                            </div>
                            <div className={cx('summary-row', 'total-row')}>
                                <span>Tổng cộng (đã gồm VAT):</span>
                                <span className={cx('total-amount')}>{formatPrice(totalAmount)}</span>
                            </div>
                            <button className={cx('buy-btn')} onClick={handleBuyNow}>
                                MUA HÀNG
                            </button>
                            <p className={cx('vat-note')}>(Giá hiển thị đã bao gồm VAT)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
