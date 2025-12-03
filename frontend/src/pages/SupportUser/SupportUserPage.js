import React from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './SupportUserPage.module.scss';

const cx = classNames.bind(styles);

export default function SupportUserPage() {
    const navigate = useNavigate();

    const supportItems = [
        {
            title: 'Hướng dẫn mua hàng',
            description: 'Hướng dẫn chi tiết cách mua hàng trên website',
            path: '/support/shopping-guide',
            icon: '🛒',
        },
        {
            title: 'Chính sách thanh toán',
            description: 'Thông tin về các phương thức thanh toán và quy trình',
            path: '/support/payment-policy',
            icon: '💳',
        },
        {
            title: 'Chính sách vận chuyển',
            description: 'Thông tin về phí vận chuyển và thời gian giao hàng',
            path: '/support/shipping-policy',
            icon: '🚚',
        },
        {
            title: 'Chính sách đổi trả',
            description: 'Quy định về đổi trả và hoàn tiền sản phẩm',
            path: '/support/return-policy',
            icon: '↩️',
        },
    ];

    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <div className={cx('header')}>
                    <h1 className={cx('title')}>Hỗ trợ khách hàng</h1>
                    <p className={cx('subtitle')}>
                        Chúng tôi luôn sẵn sàng hỗ trợ bạn trong mọi vấn đề
                    </p>
                </div>

                <div className={cx('support-grid')}>
                    {supportItems.map((item, index) => (
                        <div
                            key={index}
                            className={cx('support-card')}
                            onClick={() => navigate(item.path)}
                        >
                            <div className={cx('card-icon')}>{item.icon}</div>
                            <h3 className={cx('card-title')}>{item.title}</h3>
                            <p className={cx('card-description')}>{item.description}</p>
                            <div className={cx('card-arrow')}>→</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

