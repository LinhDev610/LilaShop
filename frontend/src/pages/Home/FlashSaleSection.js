import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { formatCurrency } from '../../services/utils';
import styles from './FlashSaleSection.module.scss';

// Asset fallback (can be replaced with icons if available)
const ChevronLeft = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
);
const ChevronRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
);

const cx = classNames.bind(styles);

// --- Sub-component: Countdown Timer ---
const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        // Set target date to end of today or some future date
        const targetDate = new Date();
        targetDate.setHours(24, 0, 0, 0); // End of today

        const calculateTimeLeft = () => {
            const difference = +targetDate - +new Date();
            let timeLeft = {};

            if (difference > 0) {
                timeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            }
            return timeLeft;
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (time) => String(time || 0).padStart(2, '0');

    return (
        <div className={cx('countdown-timer')}>
            <span>Thời gian còn lại</span>
            <div className={cx('timer-box')}>{formatTime(timeLeft.hours)}</div>
            <span>:</span>
            <div className={cx('timer-box')}>{formatTime(timeLeft.minutes)}</div>
            <span>:</span>
            <div className={cx('timer-box')}>{formatTime(timeLeft.seconds)}</div>
        </div>
    );
};

// --- Sub-component: Flash Sale Card ---
const FlashSaleCard = ({ product }) => {
    const {
        id,
        title,
        image,
        currentPrice,
        originalPrice,
        discount
    } = product;

    return (
        <Link to={`/product/${id}`} className={cx('flash-card')}>
            <div className={cx('card-image-wrapper')}>
                <img src={image} alt={title} className={cx('card-image')} />
                {discount > 0 && (
                    <div className={cx('discount-badge')}>-{discount}%</div>
                )}
            </div>
            <div className={cx('card-content')}>
                <div className={cx('card-title')} title={title}>{title}</div>
                <div className={cx('price-section')}>
                    <span className={cx('current-price')}>{formatCurrency(currentPrice)}</span>
                    {originalPrice > currentPrice && (
                        <span className={cx('original-price')}>{formatCurrency(originalPrice)}</span>
                    )}
                </div>
                <div className={cx('sale-progress')}>
                    <span>ĐANG BÁN CHẠY</span>
                </div>
            </div>
        </Link>
    );
};

// --- Main Component ---
const FlashSaleSection = ({ products = [] }) => {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 300; // Approximate scroll amount
            if (direction === 'left') {
                current.scrollLeft -= scrollAmount;
            } else {
                current.scrollLeft += scrollAmount;
            }
        }
    };

    if (!products || products.length === 0) return null;

    return (
        <section className={cx('flash-sale-section')}>
            <div className={cx('flash-sale-container')}>
                {/* Header */}
                <div className={cx('flash-sale-header')}>
                    <div className={cx('header-left')}>
                        <h2 className={cx('flash-sale-title')}>
                            ⚡ FLASH SALE ⚡
                        </h2>
                        <CountdownTimer />
                    </div>
                    <div className={cx('header-right')}>
                        <button className={cx('tab-btn', 'active')}>Đang diễn ra</button>
                        <button className={cx('tab-btn')}>Sắp diễn ra</button>
                    </div>
                </div>

                {/* Body with Carousel */}
                <div className={cx('flash-sale-body')}>
                    <div className={cx('product-list-wrapper')}>
                        <button
                            className={cx('nav-button', 'prev')}
                            onClick={() => scroll('left')}
                            aria-label="Scroll left"
                        >
                            <ChevronLeft />
                        </button>

                        <div className={cx('product-list')} ref={scrollRef}>
                            {products.map(product => (
                                <FlashSaleCard key={product.id} product={product} />
                            ))}
                        </div>

                        <button
                            className={cx('nav-button', 'next')}
                            onClick={() => scroll('right')}
                            aria-label="Scroll right"
                        >
                            <ChevronRight />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FlashSaleSection;
