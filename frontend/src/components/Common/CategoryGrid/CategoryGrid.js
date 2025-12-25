import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { getRootCategories } from '../../../services/api';
import styles from './CategoryGrid.module.scss';

const cx = classNames.bind(styles);

// Fallback icons for categories (TODO: Replace with actual icons from category data or use icon component)
const categoryIcons = {
    'Chăm sóc da': '💆‍♀️',
    'Skincare': '💆‍♀️',
    'Trang điểm': '💄',
    'Makeup': '💄',
    'Chăm sóc cơ thể': '🧴',
    'Body Care': '🧴',
    'Chăm sóc tóc': '💇‍♀️',
    'Hair Care': '💇‍♀️',
    'Nước hoa': '🌸',
    'Fragrance': '🌸',
    'Phụ kiện trang điểm': '🖌️',
    'Accessories': '🖌️',
    'Quà tặng': '🎁',
    'Gift Sets': '🎁',
};

function CategoryGrid() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchCategories = async () => {
            setLoading(true);
            try {
                const data = await getRootCategories();
                if (!cancelled && data && Array.isArray(data)) {
                    // Lấy tối đa 6 categories đầu tiên (parent categories)
                    const rootCategories = data.filter(c => !c.parentId).slice(0, 6);
                    setCategories(rootCategories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
                if (!cancelled) {
                    setCategories([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchCategories();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <section className={cx('categoryGrid')}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={cx('categoryCard', 'loading')}>
                        <div className={cx('categoryIcon')}></div>
                        <div className={cx('categoryName')}></div>
                    </div>
                ))}
            </section>
        );
    }

    if (categories.length === 0) {
        return null;
    }

    return (
        <section className={cx('categoryGrid')}>
            {categories.map((category) => {
                const icon = categoryIcons[category.name] || categoryIcons[category.nameEn] || '📦';
                return (
                    <Link
                        key={category.id}
                        to={`/category/${category.id}`}
                        className={cx('categoryCard')}
                    >
                        <div className={cx('categoryIcon')}>
                            <span>{icon}</span>
                        </div>
                        <div className={cx('categoryName')}>{category.name}</div>
                    </Link>
                );
            })}
        </section>
    );
}

export default CategoryGrid;

