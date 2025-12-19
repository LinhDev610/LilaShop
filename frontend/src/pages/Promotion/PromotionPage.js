import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames/bind';
import homeStyles from '../Home/Home.module.scss';
import promoStyles from './Promotion.module.scss';
import categoryStyles from '../Category/CategoryPage.module.scss';
import ProductList from '../../components/Common/ProductList/ProductList';
import Pagination from '../../components/Common/Pagination/Pagination';
import { getActiveProducts, getApiBaseUrl, formatCurrency } from '../../services';
import { normalizeMediaUrl } from '../../services/productUtils';
import iconFire from '../../assets/icons/icon_fire.png';

const cxHome = classNames.bind(homeStyles);
const cxPromo = classNames.bind(promoStyles);
const cxCategory = classNames.bind(categoryStyles);

const API_BASE_URL = getApiBaseUrl();
const ITEMS_PER_PAGE = 25;

const mapProductToCard = (product, apiBaseUrl) => {
    if (!product) return null;
    const rawMedia =
        product.defaultMediaUrl ||
        (Array.isArray(product.mediaUrls) && product.mediaUrls.length > 0
            ? product.mediaUrls[0]
            : '');
    const imageUrl = normalizeMediaUrl(rawMedia, apiBaseUrl) || '';

    const unitPrice = typeof product.unitPrice === 'number' ? product.unitPrice : 0;
    const tax = typeof product.tax === 'number' ? product.tax : 0;
    const priceFromBackend = typeof product.price === 'number' ? product.price : null;

    // Tính original price (before any promotion)
    const originalPrice = unitPrice * (1 + tax);

    const currentPrice = priceFromBackend ?? originalPrice;

    // Tính % discount
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
};

// Tính discount nếu chưa có
const calculateDiscount = (product) => {
    const originalPrice = product.originalPrice || product.price || product.unitPrice || 0;
    const promoPrice = product.currentPrice || product.promotionPrice || 0;
    if (originalPrice > 0 && promoPrice > 0 && promoPrice < originalPrice) {
        return Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
    }
    return 0;
};

export default function PromotionPage() {
    const location = useLocation();
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'price-high', 'price-low', 'bestseller', 'discount-high'
    const [currentPage, setCurrentPage] = useState(1);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy]);

    // Map và lọc sản phẩm có khuyến mãi
    const productsWithPromotion = useMemo(() => {
        if (!allProducts.length) return [];

        const mappedProducts = allProducts
            .map((product) => mapProductToCard(product, API_BASE_URL))
            .filter(Boolean);

        // Lọc sản phẩm có discount > 0
        return mappedProducts.filter((product) => {
            return product.discount && product.discount > 0;
        });
    }, [allProducts]);

    // Sắp xếp sản phẩm dựa trên sortBy
    const sortedProducts = useMemo(() => {
        if (!productsWithPromotion.length) return [];

        const sorted = [...productsWithPromotion];

        switch (sortBy) {
            case 'price-high':
                sorted.sort((a, b) => {
                    const priceA = a.currentPrice || 0;
                    const priceB = b.currentPrice || 0;
                    return priceB - priceA;
                });
                break;
            case 'price-low':
                sorted.sort((a, b) => {
                    const priceA = a.currentPrice || 0;
                    const priceB = b.currentPrice || 0;
                    return priceA - priceB;
                });
                break;
            case 'discount-high':
                sorted.sort((a, b) => {
                    const discountA = a.discount || calculateDiscount(a) || 0;
                    const discountB = b.discount || calculateDiscount(b) || 0;
                    return discountB - discountA;
                });
                break;
            case 'bestseller':
                sorted.sort((a, b) => {
                    const soldA = a.quantitySold || 0;
                    const soldB = b.quantitySold || 0;
                    return soldB - soldA;
                });
                break;
            case 'oldest':
                sorted.sort((a, b) => {
                    const dateA = new Date(a.updatedAt || 0);
                    const dateB = new Date(b.updatedAt || 0);
                    return dateA - dateB;
                });
                break;
            case 'newest':
            default:
                sorted.sort((a, b) => {
                    const dateA = new Date(a.updatedAt || 0);
                    const dateB = new Date(b.updatedAt || 0);
                    return dateB - dateA;
                });
                break;
        }

        return sorted;
    }, [productsWithPromotion, sortBy]);

    // Pagination logic
    const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return sortedProducts.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedProducts, currentPage]);

    // Fetch products từ API
    useEffect(() => {
        let ignore = false;
        const fetchProducts = async () => {
            try {
                setLoading(true);
                setError('');

                const products = await getActiveProducts();

                if (!ignore) {
                    setAllProducts(Array.isArray(products) ? products : []);
                }
            } catch (err) {
                if (!ignore) {
                    setError('Không thể tải dữ liệu khuyến mãi. Vui lòng thử lại sau.');
                    setAllProducts([]);
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchProducts();
        return () => {
            ignore = true;
        };
    }, []);

    const renderStateCard = (content, isError = false) => (
        <div className={cxCategory('state-card', { error: isError })}>
            <p>{content}</p>
        </div>
    );

    const renderSection = (title, icon, colorClass, productList, options = {}) => {
        if (!productList || productList.length === 0) return null;
        const { minimal = true, isGrid = false, gridColumns = 4 } = options;
        return (
            <section className={cxHome('trending-section', cxPromo('promo-container'))}>
                <div className={cxPromo('promo-header', cxPromo(colorClass || ''))}>
                    <img src={icon} alt={title} className={cxPromo('promo-icon')} />
                    <h3 className={cxPromo('promo-title')}>{title}</h3>
                </div>
                <ProductList
                    products={productList}
                    title={title}
                    showNavigation={!isGrid}
                    showHeader={false}
                    minimal={minimal}
                    isGrid={isGrid}
                    gridColumns={gridColumns}
                />
            </section>
        );
    };

    return (
        <div className={cxHome('home-wrapper')}>
            <main className={cxHome('home-content')}>
                {/* Products Section */}
                {loading && renderStateCard('Đang tải dữ liệu khuyến mãi...')}

                {!loading && error && renderStateCard(error, true)}

                {!loading && !error && productsWithPromotion.length === 0 && (
                    renderStateCard('Hiện tại không có sản phẩm khuyến mãi nào.')
                )}

                {!loading && !error && productsWithPromotion.length > 0 && (
                    <>
                        {/* Sort Bar */}
                        <div className={cxCategory('filter-bar')}>
                            <div className={cxCategory('filter-group')}>
                                <div className={cxCategory('filter-label')}>
                                    <span>Sắp xếp theo:</span>
                                </div>
                                <select
                                    className={cxCategory('filter-select')}
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                    <option value="price-high">Giá cao nhất</option>
                                    <option value="price-low">Giá thấp nhất</option>
                                    <option value="discount-high">Giảm giá nhiều nhất</option>
                                    <option value="bestseller">Bán chạy</option>
                                </select>
                            </div>
                        </div>

                        {/* Hiển thị tất cả sản phẩm khuyến mãi */}
                        {renderSection(
                            'SẢN PHẨM KHUYẾN MÃI',
                            iconFire,
                            null,
                            paginatedProducts,
                            { minimal: false, isGrid: true, gridColumns: 5 }
                        )}

                        {/* Pagination */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </main>
        </div>
    );
}
