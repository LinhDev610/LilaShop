import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
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

import Banner1 from '../../components/Common/Banner/Banner1';
import {
    FlashSale,
    VoucherCard,
    CategoryGrid,
    FeaturedBrands,
    CustomerReviews,
    ProductTabs,
    SeasonalBanner,
    TrendingLooks
} from '../../components/Common';

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
    const [activeBanners, setActiveBanners] = useState([]); // Store full banner objects

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
                if (!resp.ok || canceled) {
                    return;
                }
                const data = await resp.json().catch(() => ({}));

                // Get full banner objects with normalized URLs
                // Filter bằng khoảng thời gian để đảm bảo chỉ hiển thị banners hoạt động
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Helper để chuẩn hóa ngày từ backend
                const normalizeDate = (dateValue) => {
                    if (!dateValue) return null;
                    // Array dạng [yyyy, mm, dd]
                    if (Array.isArray(dateValue) && dateValue.length >= 3) {
                        const y = String(dateValue[0]).padStart(4, '0');
                        const m = String(dateValue[1]).padStart(2, '0');
                        const d = String(dateValue[2]).padStart(2, '0');
                        return `${y}-${m}-${d}`;
                    }
                    // String form
                    if (typeof dateValue === 'string') {
                        const isoMatch = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
                        if (isoMatch) return isoMatch[1];
                        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
                    }
                    return null;
                };

                const rawBanners = data?.result || [];

                const fullBanners = rawBanners
                    .filter((b) => {
                        if (!b?.imageUrl) {
                            return false;
                        }
                        if (!b.status) {
                            return false;
                        }

                        const normalizedStartDate = normalizeDate(b.startDate);
                        const normalizedEndDate = normalizeDate(b.endDate);

                        // Kiểm tra ngày bắt đầu: nếu được đặt, phải là hôm nay hoặc trong quá khứ
                        if (normalizedStartDate) {
                            try {
                                const startDate = new Date(normalizedStartDate);
                                startDate.setHours(0, 0, 0, 0);
                                if (startDate > today) {
                                    return false;
                                }
                            } catch (e) {
                                console.warn('Invalid startDate:', normalizedStartDate);
                            }
                        }

                        // Kiểm tra ngày kết thúc: nếu được đặt, phải là hôm nay hoặc trong tương lai
                        if (normalizedEndDate) {
                            try {
                                const endDate = new Date(normalizedEndDate);
                                endDate.setHours(0, 0, 0, 0);
                                if (endDate < today) {
                                    return false;
                                }
                            } catch (e) {
                                console.warn('Invalid endDate:', normalizedEndDate);
                            }
                        }

                        return true;
                    })
                    .map((b) => ({
                        ...b,
                        imageUrl: normalizeMediaUrl(b.imageUrl, API_BASE_URL)
                    }))
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                // Extract just images for the top carousel (Banner1)
                // Chỉ hiển thị banners với contentType='banner' hoặc null (không phải seasonal/trending)
                const bannerImages = fullBanners
                    .filter(b => !b.contentType || b.contentType === 'banner')
                    .map(b => b.imageUrl);

                if (!canceled) {
                    // Chỉ cập nhật nếu banners thực sự thay đổi để tránh render không cần thiết
                    setActiveBanners(prev => {
                        // Nếu prev là mảng rỗng (trạng thái ban đầu), luôn cập nhật
                        if (!prev || prev.length === 0) {
                            return fullBanners;
                        }

                        const prevIds = prev.map(b => b?.id).filter(Boolean).sort().join(',');
                        const newIds = fullBanners.map(b => b?.id).filter(Boolean).sort().join(',');

                        if (prevIds !== newIds) {
                            return fullBanners;
                        }
                        return prev;
                    });
                    setActiveBannerImages(bannerImages);
                }
            } catch (e) {
                console.error('[Home] Error fetching banners:', e);
            }
        };
        fetchActiveBanners();
        return () => {
            canceled = true;
        };
    }, [API_BASE_URL]);

    // State for specific event banner (latest one with products)
    const [eventBanner, setEventBanner] = useState(null);
    const [eventProducts, setEventProducts] = useState([]);

    // State cho banners xu hướng làm đẹp
    const [trendingBanners, setTrendingBanners] = useState([]);

    useEffect(() => {
        let canceled = false;

        const findEventBanner = async () => {
            // Không reset existing eventBanner nếu activeBanners là rỗng (có thể là load ban đầu)
            if (activeBanners.length === 0) {
                return;
            }

            const currentSeasonalBanners = activeBanners.filter(b => b.contentType === 'seasonal');
            if (eventBanner && currentSeasonalBanners.some(b => b.id === eventBanner.id)) {
                return;
            }

            try {
                // Filter banners để chỉ kiểm tra banners seasonal
                const seasonalBanners = activeBanners.filter(b => b.contentType === 'seasonal');

                if (seasonalBanners.length === 0) {
                    return;
                }

                const bannersToCheck = seasonalBanners.slice(0, 3); // Check up to 3 seasonal banners

                for (const banner of bannersToCheck) {
                    if (canceled) return;

                    let targetProductIds = banner.productIds || [];
                    let bannerDetail = banner;

                    try {
                        const detailResp = await fetch(`${API_BASE_URL}/banners/${banner.id}`);
                        if (detailResp.ok) {
                            const detailData = await detailResp.json();
                            if (detailData?.result) {
                                bannerDetail = detailData.result;
                                targetProductIds = bannerDetail.productIds || [];
                            }
                        } else {
                            // Nếu fetch thất bại, sử dụng productIds từ activeBanners nếu có
                            if (!targetProductIds.length) {
                                targetProductIds = banner.productIds || [];
                            }
                        }
                    } catch (err) {
                        console.error('[Home] Error fetching banner detail:', err);
                        // Nếu fetch thất bại, sử dụng productIds từ activeBanners nếu có
                        if (!targetProductIds.length) {
                            targetProductIds = banner.productIds || [];
                        }
                    }

                    // Chỉ xử lý banners seasonal có sản phẩm
                    if (bannerDetail.contentType === 'seasonal' && targetProductIds && targetProductIds.length > 0) {
                        // Found a seasonal banner with products!
                        const productIdsStr = targetProductIds.map(String);

                        // Fetch full product details from API for better data
                        const productPromises = productIdsStr.map(async (productId) => {
                            try {
                                const productResp = await fetch(`${API_BASE_URL}/products/${productId}`);
                                if (productResp.ok) {
                                    const productData = await productResp.json();
                                    return productData?.result;
                                }
                            } catch (err) {
                                console.error(`Error fetching product ${productId}:`, err);
                            }
                            return null;
                        });

                        const productDetails = await Promise.all(productPromises);
                        const validProducts = productDetails.filter(p => p !== null);

                        if (validProducts.length > 0) {
                            if (!canceled) {
                                // Use functional updates to prevent race conditions and unnecessary resets
                                setEventBanner(prev => {
                                    if (!prev || prev.id !== banner.id) {
                                        return {
                                            ...banner, // Keep original info
                                            ...bannerDetail, // Overlay detailed info (title, etc)
                                            imageUrl: normalizeMediaUrl(bannerDetail.imageUrl || banner.imageUrl, API_BASE_URL) // Ensure URL is normalized
                                        };
                                    }
                                    return prev;
                                });

                                setEventProducts(prev => {
                                    const prevIds = prev.map(p => p?.id).filter(Boolean).sort().join(',');
                                    const newIds = validProducts.map(p => p?.id).filter(Boolean).sort().join(',');
                                    if (prevIds !== newIds) {
                                        return validProducts;
                                    }
                                    return prev;
                                });
                            }
                            return; // Stop searching once found
                        }
                    }
                }
            } catch (e) {
                console.error('Error finding seasonal banner', e);
            }
        };

        findEventBanner();
        return () => { canceled = true; };
    }, [activeBanners, API_BASE_URL, homeProducts]); // Add homeProducts dependency to ensure products are loaded

    // Fetch trending banners for "Xu hướng làm đẹp" section
    useEffect(() => {
        if (!activeBanners || activeBanners.length === 0) {
            setTrendingBanners([]);
            return;
        }

        const trending = activeBanners
            .filter(b => b.contentType === 'trending')
            .slice(0, 4) // Chỉ lấy tối đa 4
            .map(banner => ({
                id: banner.id,
                image: normalizeMediaUrl(banner.imageUrl, API_BASE_URL),
                title: banner.title,
                description: banner.description,
                linkUrl: banner.linkUrl || null
            }));

        setTrendingBanners(trending);
    }, [activeBanners, API_BASE_URL]);

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
    // Only use banner type images (not seasonal/trending)
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
                {/* 1. Hero Banner */}
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

                {/* 2. Category Grid */}
                <motion.section
                    className={cx('section')}
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <CategoryGrid />
                </motion.section>

                {/* 3. Seasonal Collection */}
                {(() => {
                    const mappedProducts = eventProducts.map(p => {
                        const mapped = mapProductToCard(p, API_BASE_URL);
                        return mapped;
                    }).filter(Boolean);

                    const hasEventBanner = !!eventBanner;
                    const isSeasonal = eventBanner?.contentType === 'seasonal';
                    const hasMappedProducts = mappedProducts.length > 0;
                    const shouldRender = hasEventBanner && isSeasonal && hasMappedProducts;

                    if (!shouldRender) {
                        return null;
                    }

                    console.log('[Home] Rendering Seasonal Collection:', {
                        bannerId: eventBanner.id,
                        bannerTitle: eventBanner.title,
                        productsCount: mappedProducts.length,
                        hasImage: !!eventBanner.imageUrl
                    });

                    return (
                        <motion.section
                            className={cx('section')}
                            variants={sectionVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            onAnimationStart={() => console.log('[Home] Seasonal Collection animation started')}
                            onAnimationComplete={() => console.log('[Home] Seasonal Collection animation completed')}
                        >
                            <SeasonalBanner
                                title={eventBanner.title || "Spring Collection"}
                                subtitle={eventBanner.description || "Discover fresh beauty essentials"}
                                imageUrl={eventBanner.imageUrl}
                                products={mappedProducts}
                            />
                        </motion.section>
                    );
                })()}

                {/* 4. Flash Sale */}
                <motion.section
                    className={cx('section')}
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <FlashSale products={promotionalProducts} />
                </motion.section>

                {/* 5. Featured Brands */}
                <motion.section
                    className={cx('section')}
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <FeaturedBrands products={allProducts} />
                </motion.section>

                {/* 6. Xu hướng làm đẹp */}
                {trendingBanners.length > 0 && (
                    <motion.section
                        className={cx('section')}
                        variants={sectionVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                    >
                        <TrendingLooks looks={trendingBanners} />
                    </motion.section>
                )}

                {/* 7. Product Tabs */}
                <motion.section
                    className={cx('section')}
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <ProductTabs
                        favoriteProducts={favoriteProducts}
                        bestsellerProducts={bestSellerProducts}
                        newProducts={newestProducts}
                    />
                </motion.section>

                {/* 8. Customer Reviews */}
                <motion.section
                    className={cx('section')}
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <CustomerReviews />
                </motion.section>

                {/* 9. Voucher Strip */}
                {!vouchersLoading && vouchers.length > 0 && (
                    <motion.section
                        className={cx('section', 'voucher-section')}
                        variants={sectionVariants}
                        initial="hidden"
                        animate="visible"
                    >
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

                {/* 10. Services */}
                <motion.section
                    className={cx('section', 'services')}
                    variants={sectionVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
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
                >
                    {service.title}
                </motion.div>
                <div className={cx('service-desc')}>{service.desc}</div>
            </div>
        </motion.div>
    );
});

ServiceItem.displayName = 'ServiceItem';

export default Home;
