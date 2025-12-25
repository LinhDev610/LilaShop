import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './BlogDetail';
import { getApiBaseUrl } from '../../services/utils';
import { normalizeMediaUrl } from '../../services/productUtils';
import ScrollToTop from '../../components/ScrollToTop';

const cx = classNames.bind(styles);

function BlogDetail() {
    const { id } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);

    useEffect(() => {
        const fetchBlogDetail = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/banners/${id}`);
                const data = await response.json();

                if (response.ok && data?.result) {
                    setBlog(data.result);
                } else {
                    setError("Không tìm thấy bài viết");
                }
            } catch (err) {
                console.error("Error fetching blog detail:", err);
                setError("Đã xảy ra lỗi khi tải bài viết");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBlogDetail();
        }
    }, [id, API_BASE_URL]);

    if (loading) {
        return (
            <div className={cx('blog-container')}>
                <div className={cx('loading')}>Đang tải bài viết...</div>
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className={cx('blog-container')}>
                <div className={cx('error-message')}>
                    {error || "Bài viết không tồn tại"}
                    <br />
                    <Link to="/blog" className={cx('back-link')}>← Quay lại danh sách tin tức</Link>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('blog-detail-wrapper')}>
            <ScrollToTop />

            <div className={cx('blog-detail-content')}>
                <div className={cx('breadcrumb')}>
                    <Link to="/" className={cx('breadcrumb-item')}>Trang chủ</Link>
                    <span className={cx('separator')}>/</span>
                    <Link to="/blog" className={cx('breadcrumb-item')}>Blog làm đẹp</Link>
                    <span className={cx('separator')}>/</span>
                    <a href={window.location.pathname} className={cx('breadcrumb-item', 'active')}>
                        {blog.title}
                    </a>
                </div>

                <div className={cx('blog-header')}>
                    <span className={cx('blog-category')}>Blog Làm Đẹp</span>
                    <h1 className={cx('blog-title')}>{blog.title}</h1>
                    <div className={cx('blog-meta')}>
                        <span>Ngày tạo: {new Date(blog.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>

                <div className={cx('blog-featured-image')}>
                    <img src={normalizeMediaUrl(blog.imageUrl, API_BASE_URL)} alt={blog.title} />
                </div>

                <div className={cx('blog-body')} dangerouslySetInnerHTML={{ __html: blog.description }} />

                <div className={cx('blog-actions')}>
                    <Link to="/blog" className={cx('btn-back')}>
                        ← Xem tất cả bài viết
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default BlogDetail;
