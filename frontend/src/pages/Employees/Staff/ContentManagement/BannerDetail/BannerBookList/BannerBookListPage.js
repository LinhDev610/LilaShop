import classNames from 'classnames/bind';
import styles from './BannerBookListPage.module.scss';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getApiBaseUrl, getStoredToken } from '../../../../../../services/utils';
import { useNotification } from '../../../../../../components/Common/Notification';

const cx = classNames.bind(styles);

export default function BannerBookListPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const { error: notifyError } = useNotification();

    const [banner, setBanner] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = getStoredToken();
                if (!token) {
                    notifyError('Vui lòng đăng nhập');
                    setLoading(false);
                    return;
                }

                // 1) Fetch banner detail to get productIds
                const bannerResp = await fetch(`${API_BASE_URL}/banners/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });
                const bannerJson = await bannerResp.json();
                if (!bannerResp.ok) {
                    throw new Error(bannerJson?.message || 'Không thể tải chi tiết banner');
                }
                const bannerDetail = bannerJson?.result || null;
                setBanner(bannerDetail);

                const ids = Array.isArray(bannerDetail?.productIds) ? bannerDetail.productIds : [];
                if (ids.length === 0) {
                    setProducts([]);
                    return;
                }

                // 2) Fetch all products then filter by IDs (backend chưa có endpoint by-ids)
                const productsResp = await fetch(`${API_BASE_URL}/products`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });
                const productsJson = await productsResp.json().catch(() => ({}));
                if (!productsResp.ok) {
                    throw new Error(productsJson?.message || 'Không thể tải danh sách sản phẩm');
                }
                const allProducts = productsJson?.result || productsJson?.content || [];
                const idSet = new Set(ids.map((s) => String(s)));
                const filtered = (Array.isArray(allProducts) ? allProducts : []).filter((p) =>
                    idSet.has(String(p.id)),
                );
                setProducts(filtered);
            } catch (e) {
                console.error('Load banner products error:', e);
                notifyError(e?.message || 'Đã xảy ra lỗi');
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [API_BASE_URL, id, notifyError]);

    const handleBack = () => {
        const isAdmin = location.pathname.startsWith('/admin');
        navigate(`${isAdmin ? '/admin' : '/staff'}/content/${id}`);
    };

    const handleGoDashboard = () => {
        const isAdmin = location.pathname.startsWith('/admin');
        navigate(isAdmin ? '/admin' : '/staff');
    };

    return (
        <div className={cx('wrap')}>
            <div className={cx('header')}>
                <div className={cx('header-left')}>
                    <button className={cx('back-icon-btn')} onClick={handleBack} aria-label="Quay lại">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                    <h1 className={cx('title')}>Quản lý nội dung</h1>
                </div>
                <button className={cx('dashboard-btn')} onClick={handleGoDashboard}>
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

            <div className={cx('content')}>
                <div className={cx('card')}>
                    <h2 className={cx('card-title')}>Danh sách sản phẩm thuộc banner</h2>

                    {loading ? (
                        <div className={cx('loading')}>Đang tải danh sách...</div>
                    ) : products.length === 0 ? (
                        <div className={cx('empty')}>Không có sản phẩm nào</div>
                    ) : (
                        <ol className={cx('book-list')}>
                            {products.map((p, idx) => (
                                <li key={String(p.id || idx)} className={cx('book-item')}>
                                    <span className={cx('index')}>{idx + 1}.</span>
                                    <span className={cx('name')}>{p.name || p.title || 'Sản phẩm'}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </div>
        </div>
    );
}


