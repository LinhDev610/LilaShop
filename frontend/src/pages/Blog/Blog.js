import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BiSearch, BiSort } from 'react-icons/bi';
import classNames from 'classnames/bind';
import styles from './Blog.module.scss';
import { getApiBaseUrl } from '../../services/utils';
import { normalizeMediaUrl } from '../../services/productUtils';
import ScrollToTop from '../../components/ScrollToTop';

const cx = classNames.bind(styles);

// Helper to strip HTML
const stripHtmlTags = (html) => {
    if (!html || typeof html !== 'string') return '';
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
};

function Blog() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);

    useEffect(() => {
        const fetchBlogs = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/banners/active`);
                const data = await response.json();

                if (response.ok && data?.result) {
                    const allBanners = data.result || [];
                    const blogPosts = allBanners.filter(b => b.contentType === 'trending');
                    setBlogs(blogPosts);
                } else {
                    setBlogs([]);
                }
            } catch (err) {
                console.error("Error fetching blogs:", err);
                setError("Có lỗi khi tải danh sách bài viết.");
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, [API_BASE_URL]);

    // Filter and Sort
    const filteredBlogs = useMemo(() => {
        let result = [...blogs];

        // Search by title
        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(blog =>
                blog.title && blog.title.toLowerCase().includes(lowerTerm)
            );
        }

        // Sort by date (createdAt)
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [blogs, searchTerm, sortOrder]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSortChange = (e) => {
        setSortOrder(e.target.value);
    };

    return (
        <div className={cx('blog-page-wrapper')}>
            <ScrollToTop />
            <div className={cx('page-header')}>
                <div className={cx('container')}>
                    <h1 className={cx('page-title')}>Blog Làm Đẹp</h1>
                    <p className={cx('page-subtitle')}>Khám phá những bí quyết và xu hướng mới nhất</p>
                </div>
            </div>

            <div className={cx('container', 'content-container')}>
                {/* Toolbar: Search & Sort */}
                <div className={cx('toolbar')}>
                    <div className={cx('search-box')}>
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài viết..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className={cx('search-input')}
                        />
                        <BiSearch className={cx('search-icon')} />
                    </div>

                    <div className={cx('sort-box')}>
                        <BiSort className={cx('sort-icon')} />
                        <span className={cx('sort-label')}>Sắp xếp:</span>
                        <select value={sortOrder} onChange={handleSortChange} className={cx('sort-select')}>
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                        </select>
                    </div>
                </div>

                {/* Blog Grid */}
                {loading ? (
                    <div className={cx('loading')}>Đang tải...</div>
                ) : filteredBlogs.length > 0 ? (
                    <div className={cx('blog-grid')}>
                        {filteredBlogs.map(blog => (
                            <Link to={`/blog/${blog.id}`} key={blog.id} className={cx('blog-card')}>
                                <div className={cx('card-image')}>
                                    <img
                                        src={normalizeMediaUrl(blog.imageUrl, API_BASE_URL)}
                                        alt={blog.title}
                                        loading="lazy"
                                    />
                                    <div className={cx('overlay')}>Đọc tiếp</div>
                                </div>
                                <div className={cx('card-content')}>
                                    <span className={cx('blog-date')}>
                                        {new Date(blog.createdAt).toLocaleDateString('vi-VN')}
                                    </span>
                                    <h3 className={cx('blog-title')}>{blog.title}</h3>
                                    <p className={cx('blog-excerpt')}>
                                        {blog.description ? stripHtmlTags(blog.description).substring(0, 100) + '...' : ''}
                                    </p>
                                    <span className={cx('read-more')}>Xem chi tiết &rarr;</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className={cx('empty-state')}>
                        <p>Không tìm thấy bài viết nào phù hợp.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Blog;
