import classNames from 'classnames/bind';
import SetAvatarDialog from '../../../../components/Common/ConfirmDialog/SetAvatarDialog';
import guestImgIcon from '../../../../assets/icons/icon_img_guest.png';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { FiLogOut } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';
import { useNotification } from '../../../../components/Common/Notification';
import { API_BASE_URL_FALLBACK, getMyInfo, getStoredToken, updateUser } from '../../../../services';
import { CUSTOMER_MENU_ITEMS, ITEM_VARIANTS, SIDEBAR_VARIANTS } from '../../../../services/constants';

import styles from './CustomerSideBar.module.scss';

const cx = classNames.bind(styles);

export default function CustomerSideBar() {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showAvatarDialog, setShowAvatarDialog] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);
    const [, , removeToken] = useLocalStorage('token', null);
    const [displayName, , removeDisplayName] = useLocalStorage('displayName', null);
    const [, , removeEmail] = useLocalStorage('email', '');
    const [userAvatar, setUserAvatar, removeUserAvatar] = useLocalStorage('userAvatar', null);
    const [user, setUser] = useState(null);
    const { success: notifySuccess, error: notifyError } = useNotification();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const tk = getStoredToken();
                if (!tk) return;
                const u = await getMyInfo(tk);
                if (u) {
                    setUser(u);
                    if (u.avatarUrl) {
                        setUserAvatar(u.avatarUrl);
                    }
                }
            } catch (_e) {
                // ignore
            }
        };

        fetchUser();

        const handleProfileUpdated = () => {
            fetchUser();
        };

        window.addEventListener('displayNameUpdated', handleProfileUpdated);

        return () => {
            window.removeEventListener('displayNameUpdated', handleProfileUpdated);
        };
    }, []);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        setAvatarPreview(previewUrl);
        setSelectedFile(file);
        setShowAvatarDialog(true);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCancelAvatar = () => {
        setShowAvatarDialog(false);
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
            setAvatarPreview(null);
        }
        setSelectedFile(null);
    };

    const handleConfirmAvatar = async () => {
        if (!selectedFile || !user?.id) return;

        setUploadingAvatar(true);
        try {
            const tk = getStoredToken();
            if (!tk) {
                handleCancelAvatar();
                return;
            }

            const form = new FormData();
            form.append('files', selectedFile);
            const resp = await fetch(`${API_BASE_URL_FALLBACK}/media/upload`, {
                method: 'POST',
                headers: tk ? { Authorization: `Bearer ${tk}` } : undefined,
                body: form,
            });
            const data = await resp.json().catch(() => ({}));

            if (!resp.ok || !Array.isArray(data?.result) || !data.result[0]) {
                notifyError('Không thể tải ảnh lên máy chủ. Vui lòng thử lại.');
                handleCancelAvatar();
                return;
            }

            const avatarUrl = data.result[0];
            const updateData = await updateUser(user.id, { avatarUrl }, tk);

            if (updateData) {
                setUser((prev) => ({ ...prev, avatarUrl }));
                setUserAvatar(avatarUrl);

                const refreshedUser = await getMyInfo(tk);
                if (refreshedUser) {
                    setUser(refreshedUser);
                }

                if (avatarPreview) {
                    URL.revokeObjectURL(avatarPreview);
                }
                setShowAvatarDialog(false);
                setAvatarPreview(null);
                setSelectedFile(null);
                notifySuccess('Cập nhật ảnh đại diện thành công.');
            } else {
                notifyError('Không thể cập nhật ảnh đại diện. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Error updating avatar:', error);
            notifyError('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleLogout = () => {
        setShowLogoutConfirm(false);
        removeToken();
        removeDisplayName();
        removeEmail();
        sessionStorage.removeItem('token');
        removeUserAvatar();
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
                <div className={cx('side-profile')}>
                    <div
                        className={cx('side-avatar')}
                        onClick={handleAvatarClick}
                        role="button"
                        aria-label="Chọn ảnh đại diện"
                    >
                        <img
                            src={(user && user.avatarUrl) || userAvatar || guestImgIcon}
                            onError={(e) => {
                                e.currentTarget.src = guestImgIcon;
                            }}
                            alt="User Avatar"
                            className={cx('avatar-image')}
                        />
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className={cx('side-name')}>
                        {user?.fullName || displayName || user?.email || 'Khách'}
                    </div>
                </div>

                <ul className={cx('menu')}>
                    {CUSTOMER_MENU_ITEMS.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <motion.li key={index} variants={ITEM_VARIANTS} className={cx('menu-item')}>
                                <NavLink
                                    to={item.to}
                                    end={item.exact}
                                    className={({ isActive }) => cx('link', { active: isActive })}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <span className={cx('icon-wrapper')}>
                                                <Icon />
                                            </span>
                                            <span className={cx('label')}>{item.label}</span>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeIndicatorCustomer"
                                                    className={cx('active-indicator')}
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 300,
                                                        damping: 30,
                                                    }}
                                                />
                                            )}
                                        </>
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

            <SetAvatarDialog
                open={showAvatarDialog}
                previewUrl={avatarPreview}
                loading={uploadingAvatar}
                onConfirm={handleConfirmAvatar}
                onCancel={handleCancelAvatar}
            />
        </>
    );
}
