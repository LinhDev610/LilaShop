import { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames/bind';
import homeStyles from '../Home/Home.module.scss';
import newProductStyles from './NewProductPage.module.scss';
import categoryStyles from '../Category/CategoryPage.module.scss';
import ProductList from '../../components/Common/ProductList/ProductList';
import Pagination from '../../components/Common/Pagination/Pagination';
import { getActiveProducts } from '../../services';
import iconFire from '../../assets/icons/icon_fire.png';

const cxHome = classNames.bind(homeStyles);
const cxNewProduct = classNames.bind(newProductStyles);
const cxCategory = classNames.bind(categoryStyles);

const ITEMS_PER_PAGE = 25;

export default function NewProductPage() {
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'price-high', 'price-low', 'bestseller'
    const [currentPage, setCurrentPage] = useState(1);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy]);

    // Lọc sách mới phát hành (trong 30 ngày gần đây)
    const newBooks = useMemo(() => {
        if (!allProducts.length) return [];

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 ngày trước

        return allProducts.filter((product) => {
            const createdAt = product.createdAt || product.created_at;
            if (createdAt) {
                const createdDate = new Date(createdAt);
                return createdDate >= thirtyDaysAgo && createdDate <= now;
            }
            return false;
        });
    }, [allProducts]);

    // Sắp xếp sản phẩm dựa trên sortBy
    const sortedProducts = useMemo(() => {
        if (!newBooks.length) return [];

        const sorted = [...newBooks];

        switch (sortBy) {
            case 'price-high':
                sorted.sort((a, b) => {
                    const priceA = a.promotionPrice || a.price || a.unitPrice || 0;
                    const priceB = b.promotionPrice || b.price || b.unitPrice || 0;
                    return priceB - priceA;
                });
                break;
            case 'price-low':
                sorted.sort((a, b) => {
                    const priceA = a.promotionPrice || a.price || a.unitPrice || 0;
                    const priceB = b.promotionPrice || b.price || b.unitPrice || 0;
                    return priceA - priceB;
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
                    const dateA = new Date(a.createdAt || a.created_at || 0);
                    const dateB = new Date(b.createdAt || b.created_at || 0);
                    return dateA - dateB;
                });
                break;
            case 'newest':
            default:
                sorted.sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.created_at || 0);
                    const dateB = new Date(b.createdAt || b.created_at || 0);
                    return dateB - dateA;
                });
                break;
        }

        return sorted;
    }, [newBooks, sortBy]);

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
                    setError('Không thể tải dữ liệu sách. Vui lòng thử lại sau.');
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
            <section className={cxHome('trending-section', cxNewProduct('newproduct-container'))}>
                <div className={cxNewProduct('newproduct-header', cxNewProduct(colorClass || ''))}>
                    <img src={icon} alt={title} className={cxNewProduct('newproduct-icon')} />
                    <h3 className={cxNewProduct('newproduct-title')}>{title}</h3>
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
                {loading && renderStateCard('Đang tải dữ liệu sách...')}

                {!loading && error && renderStateCard(error, true)}

                {!loading && !error && newBooks.length === 0 && (
                    renderStateCard('Hiện tại không có sách mới phát hành nào.')
                )}

                {!loading && !error && newBooks.length > 0 && (
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
                                    <option value="bestseller">Bán chạy</option>
                                </select>
                            </div>
                        </div>

                        {/* Hiển thị sách mới phát hành */}
                        {renderSection(
                            'SÁCH MỚI PHÁT HÀNH',
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
