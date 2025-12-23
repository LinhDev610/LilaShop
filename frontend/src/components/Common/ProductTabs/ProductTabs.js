import { useState } from 'react';
import classNames from 'classnames/bind';
import ProductList from '../ProductList/ProductList';
import styles from './ProductTabs.module.scss';

const cx = classNames.bind(styles);

function ProductTabs({ favoriteProducts = [], bestsellerProducts = [], newProducts = [] }) {
    const [activeTab, setActiveTab] = useState('bestseller');

    const tabs = [
        { id: 'bestseller', label: 'Bán chạy', products: bestsellerProducts },
        { id: 'new', label: 'Hàng mới', products: newProducts }
    ];

    const currentTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

    return (
        <section className={cx('productTabsSection')}>
            <div className={cx('tabsContainer')}>
                <div className={cx('tabsHeader')}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={cx('tabButton', { active: activeTab === tab.id })}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className={cx('tabContent')}>
                <ProductList
                    products={currentTab.products}
                    title=""
                    showNavigation={true}
                    showHeader={false}
                    minimal={true}
                />
            </div>
        </section>
    );
}

export default ProductTabs;

