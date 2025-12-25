import React from 'react';
import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './BeautyCorner.module.scss';
import { motion } from 'framer-motion';

const cx = classNames.bind(styles);

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// Hàm trợ giúp để loại bỏ các thẻ HTML và lấy văn bản đơn giản
const stripHtmlTags = (html) => {
    if (!html || typeof html !== 'string') return '';
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

function BeautyCorner({ tips = [] }) {
    const displayTips = (tips || []).map(t => ({
        id: t.id,
        title: t.title,
        category: "Blog Làm Đẹp", // Tên hiển thị cho category
        image: t.image,
        excerpt: t.description ? stripHtmlTags(t.description).substring(0, 100) + '...' : '',
        date: "Mới nhất",
        originalLink: t.linkUrl // Store original link
    }));

    return (
        <div className={cx('wrapper')}>
            <div className={cx('header')}>
                <div className={cx('title-group')}>
                    <h2 className={cx('title')}>Góc Làm Đẹp & Bí Quyết</h2>
                    <p className={cx('subtitle')}>Cập nhật xu hướng và kiến thức chăm sóc sắc đẹp mới nhất</p>
                </div>
                <Link to="/blog" className={cx('view-all-btn')}>
                    Xem tất cả &rarr;
                </Link>
            </div>

            {displayTips.length > 0 ? (
                <div className={cx('grid')}>
                    {displayTips.map((tip, index) => (
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
                                    <Link to={tip.originalLink || `/blog/${tip.id}`}>{tip.title}</Link>
                                </h3>
                                <p className={cx('excerpt')}>{tip.excerpt}</p>
                                <Link to={tip.originalLink || `/blog/${tip.id}`} className={cx('readMore')}>
                                    Xem chi tiết &rarr;
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666', fontSize: '16px' }}>
                    Đang cập nhật các bài viết mới nhất...
                </div>
            )}
        </div>
    );
}

export default BeautyCorner;
