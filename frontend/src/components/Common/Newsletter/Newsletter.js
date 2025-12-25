import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from './Newsletter.module.scss';
import { motion } from 'framer-motion';

const cx = classNames.bind(styles);

function Newsletter() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');
        // Simulate API call
        setTimeout(() => {
            setStatus('success');
            setEmail('');
        }, 1500);
    };

    return (
        <div className={cx('wrapper')}>
            <motion.div
                className={cx('container')}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
            >
                <div className={cx('content')}>
                    <h2 className={cx('title')}>Để lại email, nhận quà ngay</h2>
                    <p className={cx('description')}>
                        Nhận ngay voucher <strong>10%</strong> cho đơn đầu tiên và là người đầu tiên biết về các bộ sưu tập mới nhất.
                    </p>

                    {status === 'success' ? (
                        <motion.div
                            className={cx('successMessage')}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <span className={cx('icon')}>✨</span>
                            Xong rồi! Check mail để nhận mã giảm giá từ Lila nhé.
                        </motion.div>
                    ) : (
                        <form onSubmit={handleSubmit} className={cx('form')}>
                            <input
                                type="email"
                                placeholder="Email của bạn là..."
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={cx('input')}
                                disabled={status === 'loading'}
                                required
                            />
                            <button
                                type="submit"
                                className={cx('button', { loading: status === 'loading' })}
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? 'Chờ xíu...' : 'Gửi mình nhé'}
                            </button>
                        </form>
                    )}

                    <p className={cx('disclaimer')}>
                        Chúng tôi cam kết bảo mật thông tin và không gửi spam.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default Newsletter;
