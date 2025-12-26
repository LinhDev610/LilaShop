import classNames from 'classnames/bind';
import styles from './ProductManagementPage.scss';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import { useProducts } from '../../../../hooks/useProducts';
import { useActiveCategories } from '../../../../hooks/useActiveCategories';
import {
    filterByActiveCategories,
    filterByKeyword,
    filterByStatus,
    filterByDate,
    sortByDate,
    STATUS_MAP, FALLBACK_THUMB,
    restockProduct,
    getProductVariants,
    updateProductVariant,
} from '../../../../services';
import SearchAndSort from '../../../../layouts/components/SearchAndSort';
import StatusBadge from '../../../../components/Common/StatusBadge';
import RestockProductDialog from '../../../../components/Common/RestockProductDialog';
import Notification from '../../../../components/Common/Notification';

const cx = classNames.bind(styles);

// Quản lý sản phẩm của staff (chỉ sản phẩm do staff này tạo)
export default function ProductManagementPage() {
    const navigate = useNavigate();
    const [token] = useLocalStorage('token', null);
    const [keyword, setKeyword] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [tab, setTab] = useState('all');
    const [productsData, setProductsData] = useState([]);

    // Restock state
    const [restockOpen, setRestockOpen] = useState(false);
    const [restockTarget, setRestockTarget] = useState(null);
    const [restockVariants, setRestockVariants] = useState([]);
    const [restockLoading, setRestockLoading] = useState(false);
    const [notifyOpen, setNotifyOpen] = useState(false);
    const [notifyType, setNotifyType] = useState('success');
    const [notifyMsg, setNotifyMsg] = useState('');

    // Fetch data using custom hooks (API endpoint (backend)
    const { products: allProducts, loading, error } = useProducts({
        endpoint: '/products',
        token,
    });
    const { activeCategoryIdSet, activeCategoryNameSet, loaded: activeLoaded } = useActiveCategories(token);

    useEffect(() => {
        setProductsData(allProducts);
    }, [allProducts]);

    // ========== Filter Logic ==========
    const filtered = useMemo(() => {
        let result = productsData;
        if (activeLoaded) {
            result = filterByActiveCategories(result, activeCategoryIdSet, activeCategoryNameSet);
        }
        result = filterByStatus(result, tab, STATUS_MAP);
        result = filterByKeyword(result, keyword);
        result = filterByDate(result, dateFilter);
        return sortByDate(result);
    }, [productsData, tab, keyword, dateFilter, activeCategoryIdSet, activeCategoryNameSet, activeLoaded]);

    // ========== Restock Logic ==========
    const handleOpenRestock = useCallback(async (product) => {
        setRestockTarget(product);
        setRestockVariants([]);
        setRestockOpen(true);

        // Fetch variants if product might have them
        if (product?.id && token) {
            try {
                const variants = await getProductVariants(product.id, token);
                if (variants && Array.isArray(variants) && variants.length > 0) {
                    const processed = variants.map((v) => {
                        let taxPercent = '0';
                        if (v.tax !== undefined && v.tax !== null) {
                            if (v.tax < 1) {
                                taxPercent = String(Number((v.tax * 100).toFixed(2)).toString());
                            } else {
                                taxPercent = String(Math.round(v.tax));
                            }
                        }
                        return { ...v, taxPercent };
                    });
                    setRestockVariants(processed);
                }
            } catch (err) {
                console.warn('Could not fetch variants:', err);
            }
        }
    }, [token]);

    const handleRestockSubmit = useCallback(async (quantity, selectedVariant) => {
        if (!restockTarget || !quantity) return;

        try {
            setRestockLoading(true);

            if (selectedVariant) {
                // Restock variant
                const currentStock = Number(selectedVariant.stockQuantity) || 0;
                const newStock = currentStock + quantity;

                const variantData = {
                    name: selectedVariant.name || null,
                    shadeName: selectedVariant.shadeName || null,
                    shadeHex: selectedVariant.shadeHex || null,
                    price: selectedVariant.price || 0,
                    unitPrice: selectedVariant.unitPrice || selectedVariant.price || 0,
                    tax: selectedVariant.taxPercent ? Number(selectedVariant.taxPercent) / 100 : selectedVariant.tax || null,
                    purchasePrice: selectedVariant.purchasePrice || null,
                    stockQuantity: newStock,
                    isDefault: Boolean(selectedVariant.isDefault),
                };

                const response = await updateProductVariant(
                    restockTarget.id,
                    selectedVariant.id,
                    variantData,
                    token
                );

                if (!response?.ok) {
                    throw new Error(response?.data?.message || 'Không thể cập nhật tồn kho variant.');
                }

                setNotifyType('success');
                setNotifyMsg(`Đã bổ sung ${quantity} sản phẩm cho "${selectedVariant.name || selectedVariant.shadeName || 'variant'}".`);
            } else {
                // Restock product
                const response = await restockProduct(restockTarget.id, quantity, token);

                if (!response?.ok) {
                    throw new Error(response?.data?.message || 'Không thể cập nhật tồn kho.');
                }

                const updatedStock = response?.data?.stockQuantity ??
                    ((restockTarget.stockQuantity ?? 0) + quantity);

                setProductsData((prev) =>
                    prev.map((p) => p.id === restockTarget.id ? { ...p, stockQuantity: updatedStock } : p)
                );

                setNotifyType('success');
                setNotifyMsg(`Đã bổ sung ${quantity} sản phẩm cho "${restockTarget.name}".`);
            }

            setNotifyOpen(true);
            setRestockOpen(false);
            setRestockTarget(null);
            setRestockVariants([]);
        } catch (err) {
            setNotifyType('error');
            setNotifyMsg(err.message || 'Không thể bổ sung tồn kho. Vui lòng thử lại.');
            setNotifyOpen(true);
        } finally {
            setRestockLoading(false);
        }
    }, [restockTarget, token]);

    const handleRestockCancel = useCallback(() => {
        if (restockLoading) return;
        setRestockOpen(false);
        setRestockTarget(null);
        setRestockVariants([]);
    }, [restockLoading]);

    // ========== Render States ==========

    if (loading) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('header')}>
                    <h2 className={cx('title')}>Quản lý sản phẩm</h2>
                </div>
                <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('header')}>
                    <h2 className={cx('title')}>Quản lý sản phẩm</h2>
                </div>
                <div style={{ padding: '20px', color: '#EF4444' }}>Lỗi: {error}</div>
            </div>
        );
    }

    // ========== Main Render ==========

    return (
        <div className={cx('wrap')}>
            {/* Header */}
            <div className={cx('header')}>
                <h1 className={cx('title')}>Quản lý sản phẩm</h1>
                <button className={cx('dashboard-btn')} onClick={() => navigate('/staff')}>
                    <span className={cx('icon-left')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    Dashboard
                </button>
            </div>

            {/* Search Controls */}
            <SearchAndSort
                searchPlaceholder="Tìm kiếm theo mã, tên sản phẩm,..."
                searchValue={keyword}
                onSearchChange={(e) => setKeyword(e.target.value)}
                onSearchClick={() => { }}
                dateFilter={dateFilter}
                onDateChange={(value) => setDateFilter(value)}
                dateLabel="Ngày"
            />

            {/* Action Buttons */}
            <div className={cx('bottom-actions')}>
                <button
                    className={cx('btn', 'primary')}
                    onClick={() => navigate('/staff/products/new')}
                >
                    Thêm sản phẩm
                </button>
            </div>

            {/* Status Tabs */}
            <div className={cx('controls')}>
                <div className={cx('tabs')}>
                    <button
                        className={cx('tab', { active: tab === 'all' })}
                        onClick={() => setTab('all')}
                    >
                        Tất cả
                    </button>
                    <button
                        className={cx('tab', { active: tab === 'pending' })}
                        onClick={() => setTab('pending')}
                    >
                        Chờ duyệt
                    </button>
                    <button
                        className={cx('tab', { active: tab === 'approved' })}
                        onClick={() => setTab('approved')}
                    >
                        Đã duyệt
                    </button>
                    <button
                        className={cx('tab', { active: tab === 'rejected' })}
                        onClick={() => setTab('rejected')}
                    >
                        Từ chối
                    </button>
                </div>
            </div>

            {/* Products Table */}
            <div className={cx('card')}>
                <div className={cx('card-header')}>Danh sách sản phẩm</div>
                <table className={cx('table')}>
                    <thead>
                        <tr>
                            <th>Ảnh</th>
                            <th>Tên sản phẩm</th>
                            <th>Danh mục</th>
                            <th>Giá</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p) => (
                            <tr key={p.id}>
                                <td className={cx('thumb-cell')}>
                                    {p.imageUrl ? (
                                        <img
                                            src={p.imageUrl}
                                            alt=""
                                            title={p.imageUrl}
                                            className={cx('thumb')}
                                            onError={(e) => {
                                                const img = e.currentTarget;
                                                if (img.dataset.fallbackApplied === '1')
                                                    return;
                                                img.dataset.fallbackApplied = '1';
                                                img.src = FALLBACK_THUMB;
                                            }}
                                        />
                                    ) : null}
                                </td>
                                <td className={cx('product-cell')}>
                                    <div className={cx('prod-name')}>{p.name}</div>
                                </td>
                                <td>{p.category}</td>
                                <td>{p.price.toLocaleString('vi-VN')}₫</td>
                                <td>
                                    <StatusBadge status={p.status} />
                                </td>
                                <td>
                                    <div className={cx('action-group')}>
                                        <button
                                            className={cx('btn', 'view-btn')}
                                            onClick={() =>
                                                navigate(`/staff/products/${p.id}`)
                                            }
                                        >
                                            Xem chi tiết
                                        </button>
                                        <button
                                            type="button"
                                            className={cx('btn', 'restock-btn')}
                                            onClick={() => handleOpenRestock(p)}
                                        >
                                            Bổ sung kho
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className={cx('empty')}>
                                    {productsData.length === 0
                                        ? 'Bạn chưa tạo sản phẩm nào.'
                                        : 'Không có sản phẩm phù hợp.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Restock Dialog */}
            <RestockProductDialog
                open={restockOpen}
                product={restockTarget}
                variants={restockVariants}
                loading={restockLoading}
                onSubmit={handleRestockSubmit}
                onCancel={handleRestockCancel}
            />

            {/* Notification */}
            <Notification
                open={notifyOpen}
                type={notifyType}
                message={notifyMsg}
                onClose={() => setNotifyOpen(false)}
            />
        </div>
    );
}
