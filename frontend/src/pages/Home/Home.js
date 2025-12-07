import { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import useLocalStorage from '../../hooks/useLocalStorage';
import AdminRedirectHandler from '../../components/AdminRedirectHandler';
import { useBanners, useCategorizedBanners, useHomeProducts, useCategorizedProducts, useVouchers, usePromotions } from '../../hooks';
import { SERVICE_ITEMS } from '../../services/constants';
import { getApiBaseUrl } from '../../services/utils';
import styles from './Home.module.scss';
// Fallback images - preload critical ones
import heroImage from '../../assets/images/img_qc.png';
import bgChristmas from '../../assets/images/img_christmas.png';

// Lazy load heavy components
const ProductList = lazy(() => import('../../components/Common/ProductList/ProductList'));
const Banner1 = lazy(() => import('../../components/Common/Banner/Banner1'));
const Banner2 = lazy(() => import('../../components/Common/Banner/Banner2'));

const cx = classNames.bind(styles);

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
    const [isChecking, setIsChecking] = useState(() => !!hasToken);

    // Fetch data
    const allBanners = useBanners();
    const { hero: heroBanners } = useCategorizedBanners(allBanners);
    const { products, loading: productLoading, error: productError } = useHomeProducts();
    const { promotional, favorite, bestSeller, newest } = useCategorizedProducts(products);
    const { vouchers, loading: vouchersLoading, error: vouchersError } = useVouchers(4);
    const { promotions, loading: promotionsLoading, error: promotionsError } = usePromotions(4);

    // Memoize banner images with fallback
    const heroImages = useMemo(() =>
        heroBanners.length > 0 ? heroBanners : [heroImage],
        [heroBanners]
    );

    // Admin redirect handling - optimized
    useLayoutEffect(() => {
        if (!hasToken) {
            sessionStorage.removeItem('_checking_role');
            setIsChecking(false);
            return;
        }
        const initialCheck = sessionStorage.getItem('_checking_role') === '1';
        if (initialCheck) setIsChecking(true);
    }, [hasToken]);

    useEffect(() => {
        if (!hasToken) {
            setIsChecking(false);
            sessionStorage.removeItem('_checking_role');
            return;
        }

        let mounted = true;
        const checkInterval = setInterval(() => {
            if (!mounted) return;
            const currentToken = token || sessionStorage.getItem('token');
            if (!currentToken) {
                sessionStorage.removeItem('_checking_role');
                setIsChecking(false);
                clearInterval(checkInterval);
                return;
            }
            const checking = sessionStorage.getItem('_checking_role') === '1';
            if (checking) {
                setIsChecking(true);
            } else {
                setTimeout(() => {
                    if (mounted) {
                        setIsChecking(false);
                        clearInterval(checkInterval);
                    }
                }, 150);
            }
        }, 20);

        const timeout = setTimeout(() => {
            if (mounted) {
                setIsChecking(false);
                clearInterval(checkInterval);
            }
        }, 800);

        return () => {
            mounted = false;
            clearInterval(checkInterval);
            clearTimeout(timeout);
        };
    }, [hasToken, token]);

    return (
        <motion.div
            className={cx('home-wrapper')}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <AdminRedirectHandler />
            {!isChecking && (
                <motion.main
                    className={cx('home-content')}
                    variants={containerVariants}
                >
                    {/* Hero Banner */}
                    <motion.section
                        className={cx('hero-section')}
                        variants={sectionVariants}
                    >
                        <Suspense fallback={<div className={cx('skeleton-banner')} />}>
                            <div className={cx('hero-container')}>
                                <Banner1
                                    heroImages={heroImages}
                                    promos={[]}
                                />
                            </div>
                        </Suspense>
                    </motion.section>

                    {/* Vouchers & Promotions Grid - New Layout */}
                    <motion.section
                        className={cx('voucher-promo-section')}
                        variants={sectionVariants}
                    >
                        <div className={cx('voucher-promo-container')}>
                            {/* Vouchers Column */}
                            <motion.div
                                className={cx('voucher-column')}
                                variants={sectionVariants}
                            >
                                <motion.div
                                    className={cx('section-header')}
                                    initial={{ x: -30, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <h2 className={cx('section-title')}>
                                        <span className={cx('title-icon')}>🎁</span>
                                        Mã giảm giá
                                    </h2>
                                    <Link to="/customer/voucher-promotion" className={cx('view-all-link')}>
                                        Xem tất cả →
                                    </Link>
                                </motion.div>
                                <motion.div
                                    className={cx('voucher-grid')}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {vouchersLoading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className={cx('skeleton-card')} />
                                        ))
                                    ) : vouchersError ? (
                                        <div className={cx('empty-state', 'error')}>
                                            <p>{vouchersError}</p>
                                        </div>
                                    ) : vouchers.length > 0 ? (
                                        vouchers.map((voucher, idx) => (
                                            <VoucherCard key={voucher.id || idx} voucher={voucher} index={idx} />
                                        ))
                                    ) : (
                                        <div className={cx('empty-state')}>
                                            <p>Chưa có mã giảm giá</p>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>

                            {/* Promotions Column */}
                            <motion.div
                                className={cx('promotion-column')}
                                variants={sectionVariants}
                            >
                                <motion.div
                                    className={cx('section-header')}
                                    initial={{ x: 30, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <h2 className={cx('section-title')}>
                                        <span className={cx('title-icon')}>🔥</span>
                                        Khuyến mãi hot
                                    </h2>
                                    <Link to="/promotion" className={cx('view-all-link')}>
                                        Xem tất cả →
                                    </Link>
                                </motion.div>
                                <motion.div
                                    className={cx('promotion-grid')}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {promotionsLoading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className={cx('skeleton-card')} />
                                        ))
                                    ) : promotionsError ? (
                                        <div className={cx('empty-state', 'error')}>
                                            <p>{promotionsError}</p>
                                        </div>
                                    ) : promotions.length > 0 ? (
                                        promotions.map((promotion, idx) => (
                                            <PromotionCard key={promotion.id || idx} promotion={promotion} index={idx} />
                                        ))
                                    ) : (
                                        <div className={cx('empty-state')}>
                                            <p>Chưa có khuyến mãi</p>
                                        </div>
                                    )}
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.section>

                    {/* Loading & Error States */}
                    <AnimatePresence mode="wait">
                        {productLoading && (
                            <motion.div
                                key="loading"
                                className={cx('status-message')}
                                variants={statusVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <motion.span
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    Đang tải sản phẩm...
                                </motion.span>
                            </motion.div>
                        )}
                        {!productLoading && productError && (
                            <motion.div
                                key="error"
                                className={cx('status-message', 'error')}
                                variants={statusVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {productError}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Product Sections */}
                    <motion.div variants={sectionVariants}>
                        <Suspense fallback={<div className={cx('skeleton-product-list')} />}>
                            <ProductList
                                products={promotional}
                                title="KHUYẾN MÃI HOT"
                                showNavigation={true}
                            />
                        </Suspense>
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
                            <Suspense fallback={<div className={cx('skeleton-product-list')} />}>
                                <ProductList
                                    products={products}
                                    title="Tết ông trăng"
                                    showNavigation={true}
                                    showHeader={false}
                                    minimal={true}
                                />
                            </Suspense>
                        </div>
                    </motion.section>

                    <ProductSection title="MỸ PHẨM YÊU THÍCH" products={favorite} />
                    <ProductSection title="MỸ PHẨM BÁN CHẠY" products={bestSeller} />
                    <ProductSection title="MỸ PHẨM MỚI" products={newest} />

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
            )}
        </motion.div>
    );
}

// Voucher Card Component
const VoucherCard = memo(({ voucher, index }) => {
    const API_BASE_URL = getApiBaseUrl();
    const discountValue = voucher.discountValue || 0;
    const discountType = voucher.discountType || 'PERCENTAGE';
    const minOrder = voucher.minOrderValue || 0;

    const formatDiscount = () => {
        if (discountType === 'PERCENTAGE') {
            return `${discountValue}%`;
        }
        return `${discountValue.toLocaleString('vi-VN')}đ`;
    };

    return (
        <motion.div
            className={cx('voucher-card')}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3 }}
        >
            <Link to="/customer/voucher-promotion" className={cx('voucher-link')}>
                <div className={cx('voucher-content')}>
                    <div className={cx('voucher-discount')}>
                        <span className={cx('discount-value')}>{formatDiscount()}</span>
                        <span className={cx('discount-label')}>GIẢM</span>
                    </div>
                    <div className={cx('voucher-info')}>
                        <div className={cx('voucher-code')}>
                            <span className={cx('code-label')}>Mã:</span>
                            <span className={cx('code-value')}>{voucher.code || 'N/A'}</span>
                        </div>
                        {minOrder > 0 && (
                            <div className={cx('voucher-condition')}>
                                Đơn từ {minOrder.toLocaleString('vi-VN')}đ
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
});

VoucherCard.displayName = 'VoucherCard';

// Promotion Card Component
const PromotionCard = memo(({ promotion, index }) => {
    return (
        <motion.div
            className={cx('promotion-card')}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3 }}
        >
            <Link to={`/promotion/${promotion.id}`} className={cx('promotion-link')}>
                {promotion.imageUrl ? (
                    <div className={cx('promotion-image-wrapper')}>
                        <img
                            src={promotion.imageUrl}
                            alt={promotion.name || 'Promotion'}
                            className={cx('promotion-image')}
                            loading="lazy"
                        />
                        <div className={cx('promotion-overlay')}>
                            <h3 className={cx('promotion-title')}>{promotion.name || 'Khuyến mãi'}</h3>
                        </div>
                    </div>
                ) : (
                    <div className={cx('promotion-content')}>
                        <h3 className={cx('promotion-title')}>{promotion.name || 'Khuyến mãi'}</h3>
                        {promotion.description && (
                            <p className={cx('promotion-desc')}>{promotion.description}</p>
                        )}
                    </div>
                )}
            </Link>
        </motion.div>
    );
});

PromotionCard.displayName = 'PromotionCard';

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
                <Suspense fallback={<div className={cx('skeleton-product-list')} />}>
                    <ProductList
                        products={products}
                        title={title}
                        showNavigation={true}
                        showHeader={false}
                        minimal={true}
                    />
                </Suspense>
            )}
        </motion.section>
    );
});

ProductSection.displayName = 'ProductSection';

export default Home;
