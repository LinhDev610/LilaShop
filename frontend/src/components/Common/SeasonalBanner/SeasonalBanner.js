import React from 'react';
import classNames from 'classnames/bind';
import styles from './SeasonalBanner.module.scss';
import ProductList from '../ProductList/ProductList';

const cx = classNames.bind(styles);

function SeasonalBanner({ title, subtitle, imageUrl, products = [] }) {
    const hasProducts = products && products.length > 0;
    const hasImage = !!imageUrl;

    console.log('[SeasonalBanner] Rendering:', {
        title,
        hasImage,
        productsCount: products.length,
        hasProducts
    });

    return (
        <div className={cx('seasonal-banner-container')}>
            {/* Banner Header */}
            <div className={cx('seasonal-banner')}>
                <div
                    className={cx('banner-background')}
                    style={hasImage ? { backgroundImage: `url(${imageUrl})` } : {}}
                >
                    {hasImage && <div className={cx('banner-overlay')} />}
                    <div className={cx('banner-content')}>
                        <div className={cx('banner-text')}>
                            <h2 className={cx('banner-title', { 'no-image': !hasImage })}>{title}</h2>
                            {subtitle && <p className={cx('banner-subtitle', { 'no-image': !hasImage })}>{subtitle}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            {hasProducts && (
                <div className={cx('products-section')}>
                    <ProductList
                        products={products}
                        title=""
                        showNavigation={true}
                        showHeader={false}
                        minimal={true}
                    />
                </div>
            )}
        </div>
    );
}

export default SeasonalBanner;

