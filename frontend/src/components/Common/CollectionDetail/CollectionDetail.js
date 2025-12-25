import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './CollectionDetail.module.scss';
import ProductList from '../ProductList/ProductList';
import { getApiBaseUrl, getStoredToken } from '../../../services/utils';
import { normalizeMediaUrl } from '../../../services/productUtils';

const cx = classNames.bind(styles);

function CollectionDetail() {
    const { id } = useParams();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [collection, setCollection] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCollection = async () => {
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

                const response = await fetch(`${API_BASE_URL}/banners/${id}`, { headers });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || 'Không thể tải thông tin bộ sưu tập');
                }

                const bannerData = data?.result;
                setCollection({
                    id: bannerData.id,
                    title: bannerData.title,
                    description: bannerData.description,
                    imageUrl: normalizeMediaUrl(bannerData.imageUrl, API_BASE_URL),
                    linkUrl: bannerData.linkUrl,
                    productIds: bannerData.productIds || [],
                });

                // Fetch products nếu productIds tồn tại
                if (bannerData.productIds && bannerData.productIds.length > 0) {
                    const productPromises = bannerData.productIds.map(async (productId) => {
                        try {
                            const productResponse = await fetch(`${API_BASE_URL}/products/${productId}`, { headers });
                            const productData = await productResponse.json();
                            return productData?.result;
                        } catch (err) {
                            console.error(`Error fetching product ${productId}:`, err);
                            return null;
                        }
                    });

                    const productResults = await Promise.all(productPromises);
                    const validProducts = productResults.filter(p => p !== null);
                    setProducts(validProducts);
                }
            } catch (err) {
                console.error('Lỗi khi tải thông tin bộ sưu tập:', err);
                setError(err.message || 'Đã xảy ra lỗi khi tải thông tin bộ sưu tập');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCollection();
        }
    }, [id, API_BASE_URL]);

    if (loading) {
        return (
            <div className={cx('collection-detail')}>
                <div className={cx('loading')}>Đang tải...</div>
            </div>
        );
    }

    if (error || !collection) {
        return (
            <div className={cx('collection-detail')}>
                <div className={cx('error')}>{error || 'Không tìm thấy bộ sưu tập'}</div>
            </div>
        );
    }

    return (
        <div className={cx('collection-detail')}>
            <div className={cx('collection-header')}>
                {collection.imageUrl && (
                    <div className={cx('collection-image')}>
                        <img src={collection.imageUrl} alt={collection.title} />
                    </div>
                )}
                <div className={cx('collection-info')}>
                    <h1 className={cx('collection-title')}>{collection.title}</h1>
                    {collection.description && (
                        <p className={cx('collection-description')}>{collection.description}</p>
                    )}
                    {collection.linkUrl && (
                        <Link to={collection.linkUrl} className={cx('collection-link')}>
                            Xem tất cả sản phẩm →
                        </Link>
                    )}
                </div>
            </div>

            {products.length > 0 ? (
                <div className={cx('collection-products')}>
                    <h2 className={cx('products-title')}>Sản phẩm trong bộ sưu tập</h2>
                    <ProductList products={products} showNavigation={true} />
                </div>
            ) : (
                <div className={cx('no-products')}>
                    <p>Bộ sưu tập này chưa có sản phẩm nào.</p>
                </div>
            )}
        </div>
    );
}

export default CollectionDetail;

