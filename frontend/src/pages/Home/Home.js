import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import useLocalStorage from '../../hooks/useLocalStorage';
import AdminRedirectHandler from '../../components/AdminRedirectHandler';
import { SERVICE_ITEMS } from '../../services/constants';
import { getApiBaseUrl, formatCurrency } from '../../services/utils';
import { normalizeMediaUrl } from '../../services/productUtils';
import { normalizePromotionImageUrl } from '../../services/voucherPromotionUtils';
import { useVouchers } from '../../hooks/useVouchersPromotions';
import styles from './Home.module.scss';

import heroImage from '../../assets/images/img_qc.png';
import bgChristmas from '../../assets/images/img_christmas.png';

import ProductList from '../../components/Common/ProductList/ProductList';
import Banner1 from '../../components/Common/Banner/Banner1';
import { VoucherCard } from '../../components/Common/VoucherPromotionCard';

const cx = classNames.bind(styles);

const PRODUCT_IMAGE_FALLBACK = heroImage;

// Map product data to card format
const mapProductToCard = (product, apiBaseUrl) => {
    if (!product) return null;
    const rawMedia =
        product.defaultMediaUrl ||
        (Array.isArray(product.mediaUrls) && product.mediaUrls.length > 0
            ? product.mediaUrls[0]
            : '');
    const imageUrl = normalizeMediaUrl(rawMedia, apiBaseUrl) || PRODUCT_IMAGE_FALLBACK;

    const unitPrice = typeof product.unitPrice === 'number' ? product.unitPrice : 0;
    const tax = typeof product.tax === 'number' ? product.tax : 0; // tax is a percentage (e.g., 0.1 for 10%)
    const priceFromBackend = typeof product.price === 'number' ? product.price : null; // This is the price AFTER promotion

    // Calculate original price (before any promotion)
    const originalPrice = unitPrice * (1 + tax);

    // Current price is the price from backend (which already includes promotion)
    const currentPrice = priceFromBackend ?? originalPrice;

    // Calculate discount percentage
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

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const sectionVariants = {
    hidden: {
        opacity: 0,
        y: 50,
        scale: 0.95,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1],
        },
    },
};

const cardVariants = {
    hidden: {
        opacity: 0,
        y: 30,
        scale: 0.9,
    },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            delay: i * 0.1,
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
        },
    }),
};

const serviceItemVariants = {
    hidden: {
        opacity: 0,
        y: 30,
        scale: 0.9,
    },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            delay: i * 0.1,
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
        },
    }),
};

const statusVariants = {
    hidden: {
        opacity: 0,
        scale: 0.8,
        y: -20,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 25,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        y: -20,
        transition: {
            duration: 0.2,
        },
    },
};

function Home() {
    const [token] = useLocalStorage('token', null);
    const sessionToken = sessionStorage.getItem('token');
    const hasToken = token || sessionToken;

    const API_BASE_URL = getApiBaseUrl();

    // State for banners
    const [activeBannerImages, setActiveBannerImages] = useState([]);

    // State for products
    const [homeProducts, setHomeProducts] = useState([]);
    const [productLoading, setProductLoading] = useState(true);
    const [productError, setProductError] = useState('');

    // Fetch vouchers
    const { vouchers, loading: vouchersLoading } = useVouchers();

    // Fetch banners - direct fetch like LuminaBook
    useEffect(() => {
        let canceled = false;
        const fetchActiveBanners = async () => {
            try {
                const resp = await fetch(`${API_BASE_URL}/banners/active`);
                if (!resp.ok || canceled) return;
                const data = await resp.json().catch(() => ({}));
                const images = (data?.result || [])
                    .filter((b) => b?.imageUrl)
                    .map((b) => normalizeMediaUrl(b.imageUrl, API_BASE_URL))
                    .filter(Boolean);
                if (!canceled) setActiveBannerImages(images);
            } catch (e) {
                // silent fail for public home
                if (!canceled) setActiveBannerImages([]);
            }
        };
        fetchActiveBanners();
        return () => {
            canceled = true;
        };
    }, [API_BASE_URL]);

    // Fetch products - direct fetch like LuminaBook
    useEffect(() => {
        let canceled = false;
        const fetchActiveProducts = async () => {
            setProductLoading(true);
            setProductError('');
            try {
                const resp = await fetch(`${API_BASE_URL}/products/active`);
                const data = await resp.json().catch(() => ({}));
                if (canceled) return;

                if (!resp.ok) {
                    throw new Error(data?.message || 'Không thể tải sản phẩm');
                }

                const rawProducts = Array.isArray(data?.result)
                    ? data.result
                    : Array.isArray(data)
                        ? data
                        : [];

                const normalizedProducts = rawProducts
                    .map((product) => mapProductToCard(product, API_BASE_URL))
                    .filter(Boolean);

                if (!canceled) {
                    setHomeProducts(normalizedProducts);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                if (!canceled) {
                    setHomeProducts([]);
                    setProductError(error?.message || 'Không thể tải sản phẩm');
                }
            } finally {
                if (!canceled) {
                    setProductLoading(false);
                }
            }
        };

        fetchActiveProducts();

        return () => {
            canceled = true;
        };
    }, [API_BASE_URL]);

    // Sort and slice function (similar to LuminaBook)
    const sortAndSlice = (products, accessor, limit = 10) => {
        if (!Array.isArray(products) || !products.length) return [];
        return [...products]
            .sort((a, b) => {
                const aVal = accessor(a) ?? 0;
                const bVal = accessor(b) ?? 0;
                return bVal - aVal;
            })
            .slice(0, Math.min(limit, products.length));
    };

    const allProducts = Array.isArray(homeProducts) ? homeProducts : [];

    // Sản phẩm khuyến mãi: chỉ lấy những sản phẩm có discount > 0
    const promotionalProducts = sortAndSlice(
        allProducts.filter((p) => p && (p.discount ?? 0) > 0),
        (p) => p.discount || 0,
        10,
    );

    // Sản phẩm yêu thích: chỉ lấy những sản phẩm có đánh giá trung bình >= 4.9
    const favoriteProducts = sortAndSlice(
        allProducts.filter((p) => p && (p.averageRating ?? 0) >= 4.9),
        (p) => p.quantitySold || 0,
        10,
    );

    const bestSellerProducts = sortAndSlice(
        allProducts.filter((p) => p),
        (p) => p.quantitySold || 0,
        10,
    );

    // Sản phẩm mới: 10 sản phẩm mới nhất dựa trên updatedAt / createdAt
    const newestProducts = sortAndSlice(
        allProducts.filter((p) => p),
        (p) => (p.updatedAt ? new Date(p.updatedAt).getTime() : 0),
        10,
    );

    // Memoize banner images with fallback
    const heroImages = useMemo(() => {
        if (Array.isArray(activeBannerImages) && activeBannerImages.length > 0) {
            return activeBannerImages;
        }
        return [heroImage];
    }, [activeBannerImages]);

    // Format discount value
    const formatDiscountValue = (item) => {
        if (!item) return '';
        if (item.discountValueType === 'PERCENTAGE') {
            return `${item.discountValue || 0}%`;
        }
        const value = item.discountValue ?? 0;
        if (!value) return '0đ';
        return formatCurrency(value);
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return '';
        try {
            const d = new Date(date);
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        } catch {
            return '';
        }
    };


    return (
        <motion.div
            className={cx('home-wrapper')}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <AdminRedirectHandler />
            <motion.main
                className={cx('home-content')}
                variants={containerVariants}
            >
                {/* Hero Banner - Full Width */}
                <motion.section
                    className={cx('hero-section')}
                    variants={sectionVariants}
                >
                    <div className={cx('hero-container')}>
                        <Banner1
                            heroImages={heroImages}
                            promos={[]}
                            fullWidth={true}
                        />
                    </div>
                </motion.section>

                {/* Horizontal Voucher Carousel */}
                {!vouchersLoading && vouchers.length > 0 && (
                    <motion.section
                        className={cx('voucher-carousel-section')}
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className={cx('voucher-carousel-header')}>
                            <h3 className={cx('voucher-carousel-title')}>
                                <span className={cx('title-icon')}>🎫</span>
                                MÃ GIẢM GIÁ
                            </h3>
                        </div>
                        <div className={cx('voucher-carousel-wrapper')}>
                            <div className={cx('voucher-carousel-track')}>
                                {vouchers.map((voucher) => (
                                    <VoucherCard
                                        key={voucher.id}
                                        voucher={voucher}
                                        formatDiscountValue={formatDiscountValue}
                                        formatCurrency={formatCurrency}
                                        formatDate={formatDate}
                                        normalizeImageUrl={normalizePromotionImageUrl}
                                        apiBaseUrl={API_BASE_URL}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.section>
                )}

                {/* Loading & Error States */}
                {productLoading && (
                    <div className={cx('status-message')}>
                        <span>Đang tải sản phẩm...</span>
                    </div>
                )}
                {!productLoading && productError && (
                    <div className={cx('status-message', 'error')}>
                        {productError}
                    </div>
                )}

                {/* Product Sections - Always render, even if empty */}
                <motion.div variants={sectionVariants}>
                    <ProductList
                        products={promotionalProducts}
                        title="KHUYẾN MÃI HOT"
                        showNavigation={true}
                    />
                </motion.div>

                <motion.section
                    className={cx('featured-section')}
                    style={{ backgroundImage: `url(${bgChristmas})` }}
                    variants={sectionVariants}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className={cx('featured-overlay')}
                        animate={{
                            background: [
                                'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                                'radial-gradient(circle at 70% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)',
                                'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                            ],
                        }}
                        transition={{ duration: 8, repeat: Infinity }}
                    />
                    <div className={cx('featured-content')}>
                        <ProductList
                            products={allProducts}
                            title="Tết ông trăng"
                            showNavigation={true}
                            showHeader={false}
                            minimal={true}
                        />
                    </div>
                </motion.section>

                <ProductSection title="MỸ PHẨM YÊU THÍCH" products={favoriteProducts} />
                <ProductSection title="MỸ PHẨM BÁN CHẠY" products={bestSellerProducts} />
                <ProductSection title="MỸ PHẨM MỚI" products={newestProducts} />

                {/* Service Highlights */}
                <motion.section
                    className={cx('services')}
                    variants={sectionVariants}
                >
                    <motion.div
                        className={cx('services-grid')}
                        variants={containerVariants}
                    >
                        {SERVICE_ITEMS.map((service, idx) => (
                            <ServiceItem key={idx} service={service} index={idx} />
                        ))}
                    </motion.div>
                </motion.section>

                <motion.div
                    className={cx('bottom-bar')}
                    variants={sectionVariants}
                    initial={{ height: 0 }}
                    animate={{ height: 80 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                />
            </motion.main>
        </motion.div>
    );
}

// Memoized Service Item Component
const ServiceItem = memo(({ service, index }) => {
    return (
        <motion.div
            className={cx('service-item')}
            custom={index}
            variants={serviceItemVariants}
            whileHover={{
                scale: 1.05,
                y: -8,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
        >
            <motion.img
                className={cx('service-icon')}
                src={service.icon}
                alt={service.title}
                loading="lazy"
                whileHover={{
                    rotate: [0, -10, 10, -10, 0],
                    scale: 1.1,
                }}
                transition={{ duration: 0.5 }}
            />
            <div className={cx('service-text')}>
                <motion.div
                    className={cx('service-title')}
                    whileHover={{ color: '#667eea' }}
                >
                    {service.title}
                </motion.div>
                <div className={cx('service-desc')}>{service.desc}</div>
            </div>
        </motion.div>
    );
});

ServiceItem.displayName = 'ServiceItem';

// Memoized Product Section Component with Intersection Observer
const ProductSection = memo(({ title, products }) => {
    const sectionRef = useRef(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '50px'
            }
        );

        const currentRef = sectionRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.disconnect();
            }
        };
    }, []);

    // Safety check for products
    const safeProducts = Array.isArray(products) ? products : [];

    return (
        <motion.section
            ref={sectionRef}
            className={cx('product-section')}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={sectionVariants}
            whileHover={{
                y: -4,
                transition: { duration: 0.3 }
            }}
        >
            <motion.div
                className={cx('section-header')}
                initial={{ x: -50, opacity: 0 }}
                animate={isInView ? { x: 0, opacity: 1 } : { x: -50, opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <motion.h3
                    className={cx('section-title')}
                    whileHover={{
                        scale: 1.02,
                        x: 10,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                    {title}
                </motion.h3>
            </motion.div>
            {isInView && (
                <ProductList
                    products={safeProducts}
                    title={title}
                    showNavigation={true}
                    showHeader={false}
                    minimal={true}
                />
            )}
        </motion.section>
    );
});

ProductSection.displayName = 'ProductSection';

export default Home;
