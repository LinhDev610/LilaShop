import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Products.module.scss';
import ProductList from '../../components/Common/ProductList/ProductList';
import { getApiBaseUrl, getStoredToken } from '../../services/utils';
import { normalizeMediaUrl } from '../../services/productUtils';

const cx = classNames.bind(styles);

function Products() {
    const [searchParams] = useSearchParams();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 20;

    // Get filter params from URL
    const categoryId = searchParams.get('category');
    const searchQuery = searchParams.get('q') || '';

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError('');
            try {
                const token = getStoredToken();
                const headers = {
                    'Content-Type': 'application/json',
                };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                let url = `${API_BASE_URL}/products/active`;
                if (categoryId) {
                    url = `${API_BASE_URL}/categories/${categoryId}/products`;
                }

                const response = await fetch(url, { headers });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || 'Không thể tải danh sách sản phẩm');
                }

                let allProducts = data?.result || [];

                // Filter by search query if provided
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    allProducts = allProducts.filter((p) =>
                        p.name?.toLowerCase().includes(query) ||
                        p.brand?.toLowerCase().includes(query) ||
                        p.description?.toLowerCase().includes(query)
                    );
                }

                // Map products to card format (same as Home.js)
                const mappedProducts = allProducts.map((product) => {
                    if (!product) return null;
                    const rawMedia =
                        product.defaultMediaUrl ||
                        (Array.isArray(product.mediaUrls) && product.mediaUrls.length > 0
                            ? product.mediaUrls[0]
                            : '');
                    const imageUrl = normalizeMediaUrl(rawMedia, API_BASE_URL);

                    const unitPrice = typeof product.unitPrice === 'number' ? product.unitPrice : 0;
                    const tax = typeof product.tax === 'number' ? product.tax : 0;
                    const priceFromBackend = typeof product.price === 'number' ? product.price : null;

                    const originalPrice = unitPrice * (1 + tax);
                    const currentPrice = priceFromBackend ?? originalPrice;

                    let discount = 0;
                    if (originalPrice > 0 && currentPrice < originalPrice) {
                        discount = Math.min(99, Math.round(((originalPrice - currentPrice) / originalPrice) * 100));
                    }

                    return {
                        id: product.id,
                        title: product.name || 'Sản phẩm',
                        image: imageUrl,
                        currentPrice: currentPrice,
                        originalPrice: originalPrice,
                        discount: discount,
                        averageRating: typeof product.averageRating === 'number' ? product.averageRating : 0,
                        quantitySold: typeof product.quantitySold === 'number' ? product.quantitySold : 0,
                        updatedAt: product.updatedAt || product.createdAt || null,
                    };
                }).filter(Boolean);
                setProducts(mappedProducts);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError(err.message || 'Đã xảy ra lỗi khi tải danh sách sản phẩm');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [API_BASE_URL, categoryId, searchQuery]);

    // Sort products
    const sortedProducts = useMemo(() => {
        const sorted = [...products];
        switch (sortBy) {
            case 'newest':
                return sorted.sort((a, b) => {
                    const dateA = new Date(a.updatedAt || a.createdAt || 0);
                    const dateB = new Date(b.updatedAt || b.createdAt || 0);
                    return dateB - dateA;
                });
            case 'oldest':
                return sorted.sort((a, b) => {
                    const dateA = new Date(a.updatedAt || a.createdAt || 0);
                    const dateB = new Date(b.updatedAt || b.createdAt || 0);
                    return dateA - dateB;
                });
            case 'price-high':
                return sorted.sort((a, b) => {
                    const priceA = a.currentPrice || a.price || 0;
                    const priceB = b.currentPrice || b.price || 0;
                    return priceB - priceA;
                });
            case 'price-low':
                return sorted.sort((a, b) => {
                    const priceA = a.currentPrice || a.price || 0;
                    const priceB = b.currentPrice || b.price || 0;
                    return priceA - priceB;
                });
            case 'bestseller':
                return sorted.sort((a, b) => {
                    const soldA = a.quantitySold || 0;
                    const soldB = b.quantitySold || 0;
                    return soldB - soldA;
                });
            default:
                return sorted;
        }
    }, [products, sortBy]);

    // Pagination
    const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
    const paginatedProducts = sortedProducts.slice(
        (currentPage - 1) * productsPerPage,
        currentPage * productsPerPage
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className={cx('products-page')}>
                <div className={cx('loading')}>Đang tải sản phẩm...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('products-page')}>
                <div className={cx('error')}>{error}</div>
            </div>
        );
    }

    return (
        <div className={cx('products-page')}>
            <div className={cx('products-header')}>
                <h1 className={cx('page-title')}>
                    {searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : 'Tất cả sản phẩm'}
                </h1>
                <div className={cx('filter-bar')}>
                    <label className={cx('filter-label')}>Sắp xếp theo:</label>
                    <select
                        className={cx('filter-select')}
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="price-high">Giá cao nhất</option>
                        <option value="price-low">Giá thấp nhất</option>
                        <option value="bestseller">Bán chạy</option>
                    </select>
                </div>
            </div>

            {sortedProducts.length === 0 ? (
                <div className={cx('no-products')}>
                    <p>Không tìm thấy sản phẩm nào.</p>
                </div>
            ) : (
                <>
                    <div className={cx('products-info')}>
                        <p>
                            Hiển thị {paginatedProducts.length} / {sortedProducts.length} sản phẩm
                        </p>
                    </div>
                    <ProductList
                        products={paginatedProducts}
                        showNavigation={false}
                        isGrid={true}
                        gridColumns={5}
                    />
                    {totalPages > 1 && (
                        <div className={cx('pagination')}>
                            <button
                                className={cx('pagination-btn', { disabled: currentPage === 1 })}
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                ← Trước
                            </button>
                            <div className={cx('pagination-pages')}>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        className={cx('pagination-page', { active: currentPage === page })}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                className={cx('pagination-btn', { disabled: currentPage === totalPages })}
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Sau →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Products;

