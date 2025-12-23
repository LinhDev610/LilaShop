import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './Articles.module.scss';
import { getApiBaseUrl } from '../../services/utils';
import { normalizeMediaUrl } from '../../services/productUtils';

const cx = classNames.bind(styles);

export default function Articles() {
    const { id } = useParams();
    const navigate = useNavigate();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);

    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchArticle = async () => {
            if (!id) {
                setError('Không tìm thấy bài viết');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`${API_BASE_URL}/banners/${id}`);

                if (!response.ok) {
                    throw new Error('Không thể tải bài viết');
                }

                const data = await response.json();
                const banner = data?.result;

                if (!banner || banner.contentType !== 'trending') {
                    throw new Error('Bài viết không tồn tại');
                }

                setArticle({
                    id: banner.id,
                    title: banner.title,
                    description: banner.description || '',
                    imageUrl: normalizeMediaUrl(banner.imageUrl, API_BASE_URL),
                    createdAt: banner.createdAt
                });
            } catch (err) {
                console.error('Error fetching article:', err);
                setError(err.message || 'Đã xảy ra lỗi khi tải bài viết');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();
    }, [id, API_BASE_URL]);

    if (loading) {
        return (
            <div className={cx('articles-page')}>
                <div className={cx('container')}>
                    <div className={cx('loading')}>Đang tải bài viết...</div>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className={cx('articles-page')}>
                <div className={cx('container')}>
                    <div className={cx('error')}>
                        <h2>Không tìm thấy bài viết</h2>
                        <p>{error || 'Bài viết không tồn tại hoặc đã bị xóa'}</p>
                        <button className={cx('back-btn')} onClick={() => navigate('/')}>
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('articles-page')}>
            <div className={cx('container')}>
                <button className={cx('back-button')} onClick={() => navigate(-1)}>
                    ← Quay lại
                </button>

                <article className={cx('article')}>
                    {article.imageUrl && (
                        <div className={cx('article-image')}>
                            <img src={article.imageUrl} alt={article.title} />
                        </div>
                    )}

                    <div className={cx('article-content')}>
                        <h1 className={cx('article-title')}>{article.title}</h1>

                        {article.createdAt && (
                            <div className={cx('article-meta')}>
                                <span className={cx('article-date')}>
                                    {new Date(article.createdAt).toLocaleDateString('vi-VN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        )}

                        {article.description && (
                            <div
                                className={cx('article-body')}
                                dangerouslySetInnerHTML={{ __html: article.description }}
                            />
                        )}
                    </div>
                </article>
            </div>
        </div>
    );
}

