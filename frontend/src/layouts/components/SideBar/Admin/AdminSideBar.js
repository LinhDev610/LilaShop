import classNames from 'classnames/bind';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { FiLogOut } from 'react-icons/fi';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import { ADMIN_MENU_ITEMS, SIDEBAR_VARIANTS, ITEM_VARIANTS } from '../../../../services/constants';
import adminHeaderStyles from '../../Header/Admin/AdminHeader.module.scss';
import styles from './AdminSideBar.module.scss';

const cx = classNames.bind(styles);
const cxModal = classNames.bind(adminHeaderStyles);

export default function AdminSideBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [, , removeToken] = useLocalStorage('token', null);
    const [, , removeRefreshToken] = useLocalStorage('refreshToken', null);
    const [, , removeDisplayName] = useLocalStorage('displayName', null);

    const handleLogout = () => {
        setShowLogoutConfirm(false);
        removeToken();
        removeRefreshToken();
        removeDisplayName();
        sessionStorage.removeItem('token');
        navigate('/', { replace: true });
    };

    return (
        <>
            <motion.div
                className={cx('side')}
                initial="hidden"
                animate="visible"
                variants={SIDEBAR_VARIANTS}
            >
                <div className={cx('panel-header')}>
                    <div className={cx('panel-title')}>ADMIN PANEL</div>
                    <div className={cx('panel-subtitle')}>Management System</div>
                </div>

                <ul className={cx('menu')}>
                    {ADMIN_MENU_ITEMS.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <motion.li key={index} variants={ITEM_VARIANTS} className={cx('menu-item')}>
                                <NavLink
                                    to={item.to}
                                    end={item.exact}
                                    className={({ isActive }) => {
                                        const active =
                                            isActive ||
                                            (item.matchStart && location.pathname.startsWith(item.matchStart));
                                        return cx('link', { active });
                                    }}
                                >
                                    {({ isActive }) => {
                                        const active =
                                            isActive ||
                                            (item.matchStart && location.pathname.startsWith(item.matchStart));
                                        return (
                                            <>
                                                <span className={cx('icon-wrapper')}>
                                                    <Icon />
                                                </span>
                                                <span className={cx('label')}>{item.label}</span>
                                                {active && (
                                                    <motion.div
                                                        layoutId="activeIndicator"
                                                        className={cx('active-indicator')}
                                                        transition={{
                                                            type: 'spring',
                                                            stiffness: 300,
                                                            damping: 30,
                                                        }}
                                                    />
                                                )}
                                            </>
                                        );
                                    }}
                                </NavLink>
                            </motion.li>
                        );
                    })}

                    <div className={cx('divider')} />

                    <motion.li variants={ITEM_VARIANTS} className={cx('menu-item')}>
                        <button
                            className={cx('link', 'logout')}
                            onClick={() => setShowLogoutConfirm(true)}
                        >
                            <span className={cx('icon-wrapper')}>
                                <FiLogOut />
                            </span>
                            <span className={cx('label')}>Đăng xuất</span>
                        </button>
                    </motion.li>
                </ul>
            </motion.div>

            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        className={cxModal('modal-overlay')}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className={cxModal('modal')}
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        >
                            <h3 className={cxModal('modal-title')}>Đăng xuất tài khoản?</h3>
                            <p className={cxModal('modal-desc')}>
                                Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
                            </p>
                            <div className={cxModal('modal-actions')}>
                                <button
                                    className={cxModal('btn', 'btn-muted')}
                                    onClick={() => setShowLogoutConfirm(false)}
                                >
                                    Hủy
                                </button>
                                <button
                                    className={cxModal('btn', 'btn-primary')}
                                    onClick={handleLogout}
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
