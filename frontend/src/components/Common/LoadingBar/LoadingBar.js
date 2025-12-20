import classNames from 'classnames/bind';
import styles from './LoadingBar.module.scss';

const cx = classNames.bind(styles);

/**
 * LoadingBar component - Hiển thị thanh tiến trình với overlay
 * @param {Object} props
 * @param {number} props.progress - Tiến trình từ 0-100
 * @param {string} props.message - Thông điệp hiển thị (mặc định: "Đang xử lý...")
 * @param {boolean} props.show - Hiển thị hay ẩn loading bar
 */
export default function LoadingBar({ progress = 0, message = 'Đang xử lý...', show = false }) {
    if (!show) return null;

    return (
        <div className={cx('overlay')}>
            <div className={cx('box')}>
                <div className={cx('text')}>
                    {message} {progress}%
                </div>
                <div className={cx('bar')}>
                    <div
                        className={cx('fill')}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
