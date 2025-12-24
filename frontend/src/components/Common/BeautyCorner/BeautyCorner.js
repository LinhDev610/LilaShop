import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './BeautyCorner.module.scss';
import { motion } from 'framer-motion';

const cx = classNames.bind(styles);

// Mock Data for Beauty Tips
const TIPS = [
    {
        id: 1,
        title: "Quy trình dưỡng da 7 bước chuẩn Hàn cho làn da căng bóng",
        category: "Skincare",
        image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600",
        excerpt: "Khám phá bí mật đằng sau làn da thủy tinh (glass skin) đang làm mưa làm gió...",
        date: "20 Tháng 12, 2024"
    },
    {
        id: 2,
        title: "Top 5 màu son trendy nhất mùa lễ hội năm này",
        category: "Makeup",
        image: "https://images.unsplash.com/photo-1596462502278-27bfdd403348?auto=format&fit=crop&q=80&w=600",
        excerpt: "Biến hóa phong cách với những sắc son thời thượng, từ đỏ rượu vang đến cam đất...",
        date: "18 Tháng 12, 2024"
    },
    {
        id: 3,
        title: "Retinol là gì? Hướng dẫn người mới bắt đầu sử dụng an toàn",
        category: "Kiến thức",
        image: "https://images.unsplash.com/photo-1556228552-523cd13b8610?auto=format&fit=crop&q=80&w=600",
        excerpt: "Mọi thứ bạn cần biết về 'thần dược' chống lão hóa: cách dùng, nồng độ và lưu ý...",
        date: "15 Tháng 12, 2024"
    }
];

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

function BeautyCorner() {
    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <h2 className={cx('title')}>Góc Làm Đẹp & Bí Quyết</h2>
                <p className={cx('subtitle')}>Cập nhật xu hướng và kiến thức chăm sóc sắc đẹp mới nhất</p>
            </div>

            <div className={cx('grid')}>
                {TIPS.map((tip, index) => (
                    <motion.div
                        key={tip.id}
                        className={cx('card')}
                        variants={itemVariants}
                        whileHover={{ y: -5 }}
                    >
                        <div className={cx('imageContainer')}>
                            <img src={tip.image} alt={tip.title} className={cx('image')} loading="lazy" />
                            <span className={cx('category')}>{tip.category}</span>
                        </div>
                        <div className={cx('content')}>
                            <span className={cx('date')}>{tip.date}</span>
                            <h3 className={cx('cardTitle')}>
                                <Link to={`/blog/${tip.id}`}>{tip.title}</Link>
                            </h3>
                            <p className={cx('excerpt')}>{tip.excerpt}</p>
                            <Link to={`/blog/${tip.id}`} className={cx('readMore')}>
                                Xem chi tiết &rarr;
                            </Link>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default BeautyCorner;
