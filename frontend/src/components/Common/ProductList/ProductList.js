import { useRef, useState, useEffect, useCallback, memo } from 'react';
import classNames from 'classnames/bind';
import ProductCard from '../ProductCard/ProductCard';
import styles from './ProductList.module.scss';

// Import navigation icons
import iconLeftArrow from '../../../assets/icons/icon_leftarrow.png';
import iconRightArrow from '../../../assets/icons/icon_rightarrow.png';

const cx = classNames.bind(styles);

// Throttle function for scroll events
const throttle = (func, limit) => {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// ProductList Component - Memoized for performance
const ProductList = memo(function ProductList({
    products = [],
    title = "SẢN PHẨM",
    showNavigation = true,
    showHeader = true,
    minimal = false,
    isGrid = false,
    gridColumns = 4
}) {
    const productsRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollPosition = useCallback(() => {
        if (productsRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = productsRef.current;

            // Nút trái: hiện khi scrollLeft > 10 (có thể scroll)
            setCanScrollLeft(scrollLeft > 10);

            // Nút phải: ẩn khi đã scroll gần hết (còn ít nhất 50px)
            const maxScrollLeft = scrollWidth - clientWidth;
            setCanScrollRight(scrollLeft < maxScrollLeft - 50);
        }
    }, []);

    // Throttled scroll handler for better performance
    const throttledCheckScroll = useCallback(
        throttle(checkScrollPosition, 100),
        [checkScrollPosition]
    );

    const scrollLeft = useCallback(() => {
        if (productsRef.current) {
            const container = productsRef.current;
            const cardWidth = container.querySelector('.product-card')?.offsetWidth || 280;
            const gap = 65; // gap giữa các card
            const scrollAmount = cardWidth + gap;

            container.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        }
    }, []);

    const scrollRight = useCallback(() => {
        if (productsRef.current) {
            const container = productsRef.current;
            const cardWidth = container.querySelector('.product-card')?.offsetWidth || 280;
            const gap = 65; // gap giữa các card
            const scrollAmount = cardWidth + gap;

            container.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    }, []);

    useEffect(() => {
        const container = productsRef.current;
        if (container) {
            // Kiểm tra vị trí ban đầu sau khi render
            const timeout = setTimeout(() => {
                checkScrollPosition();
            }, 100);

            // Lắng nghe sự kiện scroll với throttle
            container.addEventListener('scroll', throttledCheckScroll, { passive: true });

            // Lắng nghe resize với throttle
            const handleResize = throttle(() => {
                checkScrollPosition();
            }, 200);
            window.addEventListener('resize', handleResize, { passive: true });

            // Cleanup
            return () => {
                clearTimeout(timeout);
                container.removeEventListener('scroll', throttledCheckScroll);
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [products, checkScrollPosition, throttledCheckScroll]);

    if (!products || products.length === 0) {
        return (
            <section className={cx('hot-promotions', { minimal })}>
                {showHeader && (
                    <div className={cx('hot-header')}>
                        <h2 className={cx('hot-title')}>{title}</h2>
                    </div>
                )}
                <div className={cx('hot-products-container')}>
                    <div className={cx('hot-products')} />
                </div>
            </section>
        );
    }

    return (
        <section className={cx('hot-promotions', { minimal })}>
            {showHeader && (
                <div className={cx('hot-header')}>
                    <h2 className={cx('hot-title')}>{title}</h2>
                </div>
            )}
            <div className={cx('hot-products-container')}>
                {showNavigation && !isGrid && (
                    <>
                        <button
                            className={cx('nav-button', 'nav-left', { disabled: !canScrollLeft })}
                            onClick={scrollLeft}
                            disabled={!canScrollLeft}
                            aria-hidden={!canScrollLeft}
                            aria-label="Scroll left"
                        >
                            <img src={iconLeftArrow} alt="Previous" className={cx('nav-icon')} loading="lazy" />
                        </button>
                        <button
                            className={cx('nav-button', 'nav-right', { disabled: !canScrollRight })}
                            onClick={scrollRight}
                            disabled={!canScrollRight}
                            aria-hidden={!canScrollRight}
                            aria-label="Scroll right"
                        >
                            <img src={iconRightArrow} alt="Next" className={cx('nav-icon')} loading="lazy" />
                        </button>
                    </>
                )}
                <div
                    className={cx(isGrid ? 'grid-products' : 'hot-products')}
                    ref={isGrid ? undefined : productsRef}
                    style={isGrid ? { display: 'grid', gridTemplateColumns: `repeat(${gridColumns}, 1fr)` } : undefined}
                >
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
});

ProductList.displayName = 'ProductList';

export default ProductList;
