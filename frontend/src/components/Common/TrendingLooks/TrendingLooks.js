import { Link } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './TrendingLooks.module.scss';

const cx = classNames.bind(styles);

// Helper function to strip HTML tags and get plain text preview
const stripHtmlTags = (html) => {
    if (!html || typeof html !== 'string') return '';
    
    try {
        // Remove HTML tags using regex
        let text = html.replace(/<[^>]*>/g, '');
        
        // Decode common HTML entities
        const entityMap = {
            '&nbsp;': ' ',
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&apos;': "'"
        };
        
        text = text.replace(/&[#\w]+;/g, (entity) => {
            return entityMap[entity] || entity;
        });
        
        // Clean up whitespace (multiple spaces, newlines, tabs)
        text = text.replace(/\s+/g, ' ').trim();
        
        return text;
    } catch (error) {
        // Fallback: simple regex replacement
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
};

// Helper function to get preview text (first 100 characters)
const getPreviewText = (html, maxLength = 100) => {
    if (!html) return '';
    
    try {
        const text = stripHtmlTags(html);
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    } catch (error) {
        // Fallback: just return first 100 chars if parsing fails
        const fallback = html.replace(/<[^>]*>/g, '').substring(0, maxLength);
        return fallback + (fallback.length >= maxLength ? '...' : '');
    }
};

function TrendingLooks({ looks = [] }) {
    // Chỉ hiển thị nếu có looks
    if (!looks || looks.length === 0) {
        return null;
    }

    // Chỉ lấy tối đa 4 hình ảnh
    const displayLooks = looks.slice(0, 4).filter(look => look && look.image);

    if (displayLooks.length === 0) {
        return null;
    }

    console.log('[TrendingLooks] Rendering:', {
        looksCount: displayLooks.length
    });

    return (
        <section className={cx('trending-looks')}>
            <div className={cx('looks-container')}>
                <h2 className={cx('looks-title')}>Xu hướng làm đẹp</h2>
                <div className={cx('looks-grid')}>
                    {displayLooks.map((look) => {
                        // Nếu có linkUrl thì dùng linkUrl, nếu không thì link đến article page với banner ID
                        const articleLink = look.linkUrl || `/article/${look.id}`;
                        const LookWrapper = Link;
                        const wrapperProps = { 
                            to: articleLink, 
                            className: cx('look-link') 
                        };

                        return (
                            <div key={look.id} className={cx('look-item')}>
                                <LookWrapper {...wrapperProps}>
                                    <img 
                                        src={look.image} 
                                        alt={look.title || look.caption || 'Xu hướng làm đẹp'}
                                        className={cx('look-image')}
                                        loading="lazy"
                                    />
                                    {(look.title || look.description) && (
                                        <div className={cx('look-content')}>
                                            {look.title && (
                                                <h3 className={cx('look-title')}>{look.title}</h3>
                                            )}
                                            {look.description && (
                                                <p className={cx('look-description')}>
                                                    {getPreviewText(look.description, 100)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </LookWrapper>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default TrendingLooks;

