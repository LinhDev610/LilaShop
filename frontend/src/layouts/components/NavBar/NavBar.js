import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import classNames from 'classnames/bind';
import routes from '../../../config/routes';
import { getActiveCategories } from '../../../services/api';
import styles from './NavBar.module.scss';

const cx = classNames.bind(styles);

const dropdownVariants = {
    open: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
            staggerChildren: 0.04,
            delayChildren: 0.05,
        },
    },
    closed: {
        opacity: 0,
        y: -15,
        scale: 0.95,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
            staggerChildren: 0.02,
            staggerDirection: -1,
        },
    },
};

const categoryItemVariants = {
    open: {
        y: 0,
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 500,
            damping: 30,
        },
    },
    closed: {
        y: 10,
        opacity: 0,
        x: -10,
        transition: {
            type: 'spring',
            stiffness: 500,
            damping: 30,
        },
    },
};

const submenuItemVariants = {
    open: {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25,
        },
    },
    closed: {
        x: -15,
        opacity: 0,
        scale: 0.95,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25,
        },
    },
};

const mobileMenuVariants = {
    open: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
            staggerChildren: 0.03,
            delayChildren: 0.05,
        },
    },
    closed: {
        opacity: 0,
        x: '-100%',
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
            staggerChildren: 0.02,
            staggerDirection: -1,
        },
    },
};

const mobileItemVariants = {
    open: {
        x: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 500,
            damping: 30,
        },
    },
    closed: {
        x: -20,
        opacity: 0,
        transition: {
            type: 'spring',
            stiffness: 500,
            damping: 30,
        },
    },
};

// Nav link underline animation
const navLinkVariants = {
    hover: {
        scale: 1.05,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 17,
        },
    },
    tap: {
        scale: 0.98,
    },
};

const underlineVariants = {
    hidden: {
        width: 0,
        opacity: 0,
    },
    visible: {
        width: '100%',
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 400,
            damping: 25,
        },
    },
};

function NavBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { pathname } = location;

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoriesError, setCategoriesError] = useState(null);
    const [activeParentId, setActiveParentId] = useState(null);

    const isHome = pathname === routes.home;
    const isPromotion = pathname === routes.promotion;
    const isNewProduct = pathname === routes.newproduct;
    const isCustomerSupport = pathname === routes.customerSupport;
    const isBlog = pathname === routes.blog || pathname.startsWith('/blog/');

    // Fetch categories
    useEffect(() => {
        let cancelled = false;

        const fetchCategories = async () => {
            setCategoriesLoading(true);
            setCategoriesError(null);

            try {
                const data = await getActiveCategories();

                if (cancelled) return;

                if (data && Array.isArray(data)) {
                    setCategories(data);
                }
            } catch (error) {
                if (!cancelled) {
                    setCategoriesError(error);
                }
            } finally {
                if (!cancelled) {
                    setCategoriesLoading(false);
                }
            }
        };

        fetchCategories();

        return () => {
            cancelled = true;
        };
    }, []);

    // Handle resize to close mobile menu
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1400 && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [isMobileMenuOpen]);

    // Dropdown handlers
    const openDropdown = () => {
        setIsDropdownOpen(true);
    };

    const closeDropdown = () => {
        setIsDropdownOpen(false);
        setActiveParentId(null);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen((prev) => !prev);
        setIsDropdownOpen(false);
    };

    const closeMenus = () => {
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
        setActiveParentId(null);
    };

    // Category selection handler
    const handleCategorySelect = (category) => {
        const categoryId = category?.id;

        if (categoryId) {
            navigate(`/category/${categoryId}`);
        } else {
            // Fallback: nếu không có ID, thử tìm bằng name
            const categoryName = category?.name;
            if (categoryName) {
                // Tìm category trong danh sách đã load
                const foundCategory = categories.find(c => c.name === categoryName);
                if (foundCategory?.id) {
                    navigate(`/category/${foundCategory.id}`);
                }
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeMenus();
    };

    // Render category items
    const renderCategoryItems = (variant = 'desktop') => {
        if (categoriesLoading) {
            const statusClass = variant === 'mobile' ? 'mobile-dropdown-status' : 'dropdown-status';
            return (
                <motion.div
                    className={cx(statusClass)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    Đang tải...
                </motion.div>
            );
        }

        if (categoriesError) {
            const statusClass = variant === 'mobile' ? 'mobile-dropdown-status' : 'dropdown-status';
            return (
                <motion.div
                    className={cx(statusClass, 'error')}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    Lỗi tải danh mục
                </motion.div>
            );
        }

        if (categories.length === 0) {
            const statusClass = variant === 'mobile' ? 'mobile-dropdown-status' : 'dropdown-status';
            return (
                <motion.div
                    className={cx(statusClass)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    Không có danh mục
                </motion.div>
            );
        }

        // Mobile: hiển thị tất cả categories trong một danh sách
        if (variant === 'mobile') {
            return categories.slice(0, 12).map((category, index) => (
                <motion.button
                    key={category.id || category.name}
                    type="button"
                    className={cx('mobile-dropdown-item')}
                    variants={mobileItemVariants}
                    whileHover={{
                        scale: 1.02,
                        x: 8,
                        backgroundColor: '#f3f4f6',
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategorySelect(category)}
                    style={{ originX: 0 }}
                >
                    {category.name}
                </motion.button>
            ));
        }

        // Desktop: tách danh mục gốc và danh mục con, hiển thị 2 khung bên cạnh nhau
        const parentCategories = categories.filter((c) => !c.parentId);
        const childCategories = activeParentId
            ? categories.filter((c) => c.parentId === activeParentId)
            : [];

        // Kiểm tra xem category có children không
        const categoryHasChildren = (categoryId) => {
            return categories.some((c) => c.parentId === categoryId);
        };

        const parentColumnVariants = {
            open: {
                transition: {
                    staggerChildren: 0.03,
                    delayChildren: 0.05,
                },
            },
            closed: {
                transition: {
                    staggerChildren: 0.02,
                    staggerDirection: -1,
                },
            },
        };

        const submenuPanelVariants = {
            open: {
                opacity: 1,
                x: 0,
                scale: 1,
                transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    staggerChildren: 0.02,
                    delayChildren: 0.05,
                },
            },
            closed: {
                opacity: 0,
                x: -20,
                scale: 0.95,
                transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                    staggerChildren: 0.01,
                    staggerDirection: -1,
                },
            },
        };

        return (
            <div className={cx('dropdown-main')}>
                <motion.div
                    className={cx('dropdown-parent-column')}
                    variants={parentColumnVariants}
                    initial="closed"
                    animate="open"
                >
                    {parentCategories.map((category) => {
                        const hasChildren = categoryHasChildren(category.id);
                        return (
                            <motion.button
                                key={category.id || category.name}
                                type="button"
                                className={cx('dropdown-item', {
                                    active: activeParentId === category.id,
                                    hasChildren: hasChildren,
                                })}
                                variants={categoryItemVariants}
                                whileHover={{
                                    scale: 1.02,
                                    x: 6,
                                    backgroundColor: '#f3f4f6',
                                }}
                                whileTap={{ scale: 0.98 }}
                                onMouseEnter={() => {
                                    setActiveParentId(category.id);
                                }}
                                onClick={() => handleCategorySelect(category)}
                                style={{ originX: 0 }}
                            >
                                {category.name}
                                {hasChildren && (
                                    <motion.span
                                        className={cx('arrow-icon')}
                                        animate={{
                                            rotate: activeParentId === category.id ? 0 : -90,
                                            opacity: activeParentId === category.id ? 1 : 0.5,
                                        }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    >
                                        →
                                    </motion.span>
                                )}
                            </motion.button>
                        );
                    })}
                </motion.div>
                <motion.div
                    className={cx('submenu-panel')}
                    variants={submenuPanelVariants}
                    initial="closed"
                    animate={activeParentId && childCategories.length > 0 ? "open" : "closed"}
                    key={`submenu-${activeParentId || 'none'}`}
                >
                    {activeParentId && childCategories.length > 0 ? (
                        <motion.div
                            variants={{
                                open: {
                                    transition: {
                                        staggerChildren: 0.02,
                                        delayChildren: 0.05,
                                    },
                                },
                                closed: {
                                    transition: {
                                        staggerChildren: 0.01,
                                        staggerDirection: -1,
                                    },
                                },
                            }}
                            initial="closed"
                            animate="open"
                        >
                            {childCategories.map((child) => (
                                <motion.button
                                    key={child.id || child.name}
                                    type="button"
                                    className={cx('submenu-item')}
                                    variants={submenuItemVariants}
                                    whileHover={{
                                        scale: 1.05,
                                        x: 8,
                                        backgroundColor: '#f3f4f6',
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleCategorySelect(child)}
                                    style={{ originX: 0 }}
                                >
                                    {child.name}
                                </motion.button>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            className={cx('submenu-empty')}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            Chọn danh mục để xem
                        </motion.div>
                    )}
                </motion.div>
            </div>
        );
    };

    return (
        <motion.nav
            className={cx('navbar')}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            <div className={cx('navbar-content')}>
                <motion.div
                    className={cx('dropdown-container')}
                    onMouseEnter={openDropdown}
                    onMouseLeave={closeDropdown}
                >
                    <motion.button
                        className={cx('nav-trigger', { active: isHome || isDropdownOpen })}
                        whileHover={{
                            scale: 1.05,
                            backgroundColor: 'rgba(183, 110, 121, 0.1)',
                        }}
                        whileTap={{ scale: 0.98 }}
                        animate={{
                            backgroundColor: isHome || isDropdownOpen
                                ? '#B76E79'
                                : 'rgba(0, 0, 0, 0)',
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        <motion.span
                            animate={{
                                rotate: isDropdownOpen ? 90 : 0,
                            }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            ☰
                        </motion.span>
                        <span>TẤT CẢ DANH MỤC</span>
                        <motion.span
                            animate={{
                                rotate: isDropdownOpen ? 180 : 0,
                            }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                            ▼
                        </motion.span>
                    </motion.button>

                    <AnimatePresence mode="wait">
                        {isDropdownOpen && (
                            <motion.div
                                className={cx('dropdown-menu')}
                                variants={dropdownVariants}
                                initial="closed"
                                animate="open"
                                exit="closed"
                            >
                                {renderCategoryItems()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.div
                    className={cx('nav-link-wrapper')}
                    whileHover="hover"
                    whileTap="tap"
                >
                    <Link
                        to={routes.promotion}
                        className={cx('nav-link', { active: isPromotion })}
                    >
                        <motion.span variants={navLinkVariants}>
                            KHUYẾN MÃI
                        </motion.span>
                        <AnimatePresence>
                            {isPromotion && (
                                <motion.div
                                    className={cx('nav-link-underline')}
                                    variants={underlineVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                />
                            )}
                        </AnimatePresence>
                    </Link>
                </motion.div>

                <motion.div
                    className={cx('nav-link-wrapper')}
                    whileHover="hover"
                    whileTap="tap"
                >
                    <Link
                        to={routes.newproduct}
                        className={cx('nav-link', { active: isNewProduct })}
                    >
                        <motion.span variants={navLinkVariants}>
                            SẢN PHẨM MỚI
                        </motion.span>
                        <AnimatePresence>
                            {isNewProduct && (
                                <motion.div
                                    className={cx('nav-link-underline')}
                                    variants={underlineVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                />
                            )}
                        </AnimatePresence>
                    </Link>
                </motion.div>

                <motion.div
                    className={cx('nav-link-wrapper')}
                    whileHover="hover"
                    whileTap="tap"
                >
                    <Link
                        to={routes.blog}
                        className={cx('nav-link', { active: isBlog })}
                    >
                        <motion.span variants={navLinkVariants}>
                            BLOG LÀM ĐẸP
                        </motion.span>
                        <AnimatePresence>
                            {isBlog && (
                                <motion.div
                                    className={cx('nav-link-underline')}
                                    variants={underlineVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                />
                            )}
                        </AnimatePresence>
                    </Link>
                </motion.div>

                <motion.div
                    className={cx('nav-link-wrapper')}
                    whileHover="hover"
                    whileTap="tap"
                >
                    <Link
                        to={routes.customerSupport}
                        className={cx('nav-link', { active: isCustomerSupport })}
                    >
                        <motion.span variants={navLinkVariants}>
                            HỖ TRỢ KHÁCH HÀNG
                        </motion.span>
                        <AnimatePresence>
                            {isCustomerSupport && (
                                <motion.div
                                    className={cx('nav-link-underline')}
                                    variants={underlineVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="hidden"
                                />
                            )}
                        </AnimatePresence>
                    </Link>
                </motion.div>
            </div>

            {/* Mobile menu button - only show on mobile */}
            <motion.button
                className={cx('mobile-hamburger', { active: isMobileMenuOpen })}
                onClick={toggleMobileMenu}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={false}
            >
                <motion.span
                    animate={{
                        rotate: isMobileMenuOpen ? 45 : 0,
                        y: isMobileMenuOpen ? 8 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
                <motion.span
                    animate={{
                        opacity: isMobileMenuOpen ? 0 : 1,
                        x: isMobileMenuOpen ? -20 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                />
                <motion.span
                    animate={{
                        rotate: isMobileMenuOpen ? -45 : 0,
                        y: isMobileMenuOpen ? -8 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                />
            </motion.button>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className={cx('mobile-dropdown-menu')}
                        variants={mobileMenuVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                    >
                        {renderCategoryItems('mobile')}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}

export default NavBar;
