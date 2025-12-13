import classNames from 'classnames/bind';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { FiLogOut } from 'react-icons/fi';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import avatarFallback from '../../../../assets/icons/icon_defaultAva.png';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import { getMyInfo, getStoredToken } from '../../../../services';
import { SIDEBAR_VARIANTS, ITEM_VARIANTS } from '../../../../services/constants';
import styles from './EmployeesSideBar.module.scss';

const cx = classNames.bind(styles);

export default function EmployeesSideBar({ title, subtitle, homePath, menuItems, roleDisplay }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [displayName, , removeDisplayName] = useLocalStorage('displayName', null);
    const [, , removeToken] = useLocalStorage('token', null);
    const [, , removeRefreshToken] = useLocalStorage('refreshToken', null);
    const [profile, setProfile] = useState({
        name: displayName || 'Người dùng',
        role: '',
    });

    const extractRole = useCallback((userData) => {
        if (!userData) return null;
        return (
            userData?.role?.name ||
            userData?.role ||
            userData?.authorities?.[0]?.authority ||
            null
        );
    }, []);

    const extractName = useCallback((userData, fallbackName) => {
        if (!userData) return fallbackName || 'Người dùng';
        return userData?.fullName || userData?.username || fallbackName || 'Người dùng';
    }, []);

    useEffect(() => {
        let isMounted = true;
        let abortController = new AbortController();

        const fetchProfile = async () => {
            const currentToken = getStoredToken();
            if (!currentToken) return;

            try {
                const userData = await getMyInfo(currentToken);
                if (!isMounted || abortController.signal.aborted) return;

                const rawRole = extractRole(userData);
                const role = roleDisplay ? roleDisplay(rawRole) : '';
                const name = extractName(userData, displayName);

                setProfile({ name, role });
            } catch (error) {
                if (!isMounted || abortController.signal.aborted) return;
                console.error('Failed to fetch user profile:', error);
            }
        };

        fetchProfile();

        const syncDisplayName = () => {
            if (!isMounted) return;
            const updatedName = localStorage.getItem('displayName');
            if (updatedName) {
                setProfile((prev) => ({ ...prev, name: updatedName }));
            }
            fetchProfile();
        };

        window.addEventListener('displayNameUpdated', syncDisplayName);

        return () => {
            isMounted = false;
            abortController.abort();
            window.removeEventListener('displayNameUpdated', syncDisplayName);
        };
    }, [displayName, roleDisplay, extractRole, extractName]);

    const isActive = useCallback(
        (path) => {
            return location.pathname === path || location.pathname.startsWith(`${path}/`);
        },
        [location.pathname],
    );

    const handleProfileClick = useCallback(() => {
        navigate(homePath);
    }, [navigate, homePath]);

    const handleLogout = () => {
        setShowLogoutConfirm(false);
        removeToken();
        removeRefreshToken();
        removeDisplayName();
        sessionStorage.removeItem('token');
        window.location.href = '/';
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
                    <div className={cx('panel-title')}>{title}</div>
                    {subtitle && <div className={cx('panel-subtitle')}>{subtitle}</div>}
                </div>

                <div className={cx('profile')} onClick={handleProfileClick}>
                    <img src={avatarFallback} alt="avatar" className={cx('avatar')} />
                    <div className={cx('info')}>
                        <div className={cx('name')} title={profile.name}>
                            {profile.name}
                        </div>
                        <div className={cx('role')}>{profile.role}</div>
                    </div>
                </div>

                <ul className={cx('menu')}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <motion.li key={item.path} variants={ITEM_VARIANTS} className={cx('menu-item')}>
                                <NavLink
                                    to={item.path}
                                    className={cx('link', { active: isActive(item.path) })}
                                >
                                    {Icon && (
                                        <span className={cx('icon-wrapper')}>
                                            <Icon />
                                        </span>
                                    )}
                                    <span className={cx('label')}>{item.label}</span>
                                    {isActive(item.path) && (
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
                        className={cx('modal-overlay')}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className={cx('modal')}
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        >
                            <h3 className={cx('modal-title')}>Đăng xuất tài khoản?</h3>
                            <p className={cx('modal-desc')}>
                                Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
                            </p>
                            <div className={cx('modal-actions')}>
                                <button
                                    className={cx('btn', 'btn-muted')}
                                    onClick={() => setShowLogoutConfirm(false)}
                                >
                                    Hủy
                                </button>
                                <button
                                    className={cx('btn', 'btn-primary')}
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
