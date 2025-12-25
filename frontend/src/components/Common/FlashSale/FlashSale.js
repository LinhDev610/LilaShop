import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import { formatCurrency } from '../../../services/utils';
import styles from './FlashSale.module.scss';

// Simple Icons
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
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        // Set target date to end of today
        const targetDate = new Date();
        targetDate.setHours(24, 0, 0, 0);

        const calculateTimeLeft = () => {
            const difference = +targetDate - +new Date();
            let timeLeft = { hours: 0, minutes: 0, seconds: 0 };

            if (difference > 0) {
                timeLeft = {
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            }
            return timeLeft;
        };

        // Initial set
        setTimeLeft(calculateTimeLeft());

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

    // Calculate percent sold (random for demo if actual data missing)
    const quantitySold = product.quantitySold || 0;

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

                {/* Updated Sold Bar Style */}
                <div className={cx('sold-bar')}>
                    <span className={cx('sold-text')}>SALE UP {discount > 0 ? discount : 50}%</span>
                </div>
            </div>
        </Link>
    );
};

// --- Main Component ---
const FlashSale = ({ products = [] }) => {
    const [activeTab, setActiveTab] = useState('occurring'); // 'occurring' or 'upcoming'
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 300;
            if (direction === 'left') {
                current.scrollLeft -= scrollAmount;
            } else {
                current.scrollLeft += scrollAmount;
            }
        }
    };

    // Filter products based on tab (Mock logic for now as we don't have 'upcoming' data)
    // In real app, you would filter by date or type
    const displayProducts = activeTab === 'occurring' ? products : [];

    return (
        <section className={cx('flash-sale-section')}>
            <div className={cx('flash-sale-container')}>
                {/* Header */}
                <div className={cx('flash-sale-header')}>
                    <div className={cx('header-left')}>
                        <h2 className={cx('flash-sale-title')}>
                            ⚡ FLASH SALE
                        </h2>
                        <CountdownTimer />
                    </div>
                    <div className={cx('header-right')}>
                        <button
                            className={cx('tab-btn', { active: activeTab === 'occurring' })}
                            onClick={() => setActiveTab('occurring')}
                        >
                            Đang diễn ra
                        </button>
                        <button
                            className={cx('tab-btn', { active: activeTab === 'upcoming' })}
                            onClick={() => setActiveTab('upcoming')}
                        >
                            Sắp diễn ra
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className={cx('flash-sale-body')}>
                    {!displayProducts || displayProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'white' }}>
                            <p style={{ fontSize: '20px', fontWeight: '600' }}>
                                {activeTab === 'search' ? 'Không tìm thấy sản phẩm phù hợp.' : 'Hiện tại không có sản phẩm nào.'}
                            </p>
                            <p style={{ fontSize: '16px', marginTop: '10px', opacity: 0.9 }}>Vui lòng quay lại sau!</p>
                        </div>
                    ) : (
                        <div className={cx('product-list-wrapper')}>
                            <button
                                className={cx('nav-button', 'prev')}
                                onClick={() => scroll('left')}
                                aria-label="Scroll left"
                            >
                                <ChevronLeft />
                            </button>

                            <div className={cx('product-list')} ref={scrollRef}>
                                {displayProducts.map(product => (
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
                    )}
                </div>
            </div>
        </section>
    );
};

export default FlashSale;
