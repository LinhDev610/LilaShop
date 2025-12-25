import classNames from 'classnames/bind';
import styles from './CustomerReviews.module.scss';

const cx = classNames.bind(styles);

// TODO: Replace with real data from API
const reviews = [
    {
        id: 1,
        name: 'Nguyễn Thị Mai',
        avatar: '/avatars/user1.jpg',
        rating: 5,
        review: 'Sản phẩm chất lượng, giao hàng nhanh. Mình rất hài lòng với dịch vụ!',
        product: 'Serum Vitamin C'
    },
    {
        id: 2,
        name: 'Trần Hương Giang',
        avatar: '/avatars/user2.jpg',
        rating: 5,
        review: 'Đã mua nhiều lần, lần nào cũng ưng ý. Giá cả hợp lý, sản phẩm chính hãng.',
        product: 'Kem dưỡng ẩm'
    },
    {
        id: 3,
        name: 'Lê Thanh Hà',
        avatar: '/avatars/user3.jpg',
        rating: 4,
        review: 'Shop tư vấn nhiệt tình, đóng gói cẩn thận. Sẽ ủng hộ tiếp!',
        product: 'Son môi cao cấp'
    }
];

function CustomerReviews() {
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        return Array.from({ length: 5 }, (_, index) => {
            if (index < fullStars) {
                return (
                    <svg key={index} width="16" height="16" viewBox="0 0 24 24" fill="#C9A959" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                );
            } else {
                return (
                    <svg key={index} width="16" height="16" viewBox="0 0 24 24" fill="#E5E5E5" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                );
            }
        });
    };

    return (
        <section className={cx('reviewsSection')}>
            <h2 className={cx('sectionTitle')}>ĐÁNH GIÁ KHÁCH HÀNG</h2>
            <div className={cx('reviewsGrid')}>
                {reviews.map((review) => (
                    <div key={review.id} className={cx('reviewCard')}>
                        <div className={cx('reviewHeader')}>
                            <img
                                src={review.avatar}
                                alt={review.name}
                                className={cx('avatar')}
                                onError={(e) => {
                                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="28" fill="%23D4A5A5"/><text x="28" y="35" font-size="24" text-anchor="middle" fill="white">' + review.name.charAt(0) + '</text></svg>';
                                }}
                            />
                            <div className={cx('reviewerInfo')}>
                                <div className={cx('reviewerName')}>{review.name}</div>
                                <div className={cx('stars')}>{renderStars(review.rating)}</div>
                            </div>
                        </div>
                        <p className={cx('reviewText')}>{review.review}</p>
                        <div className={cx('productName')}>Sản phẩm: {review.product}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default CustomerReviews;

