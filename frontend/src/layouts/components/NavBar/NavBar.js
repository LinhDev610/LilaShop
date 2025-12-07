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
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    closed: {
        opacity: 0,
        y: -10,
        transition: {
            staggerChildren: 0.03,
            staggerDirection: -1,
            duration: 0.2,
            ease: 'easeIn',
        },
    },
};

const categoryItemVariants = {
    open: {
        y: 0,
        opacity: 1,
        transition: {
            y: { stiffness: 1000, velocity: -100 },
        },
    },
    closed: {
        y: 20,
        opacity: 0,
        transition: {
            y: { stiffness: 1000 },
        },
    },
};

const submenuItemVariants = {
    open: {
        x: 0,
        opacity: 1,
        transition: {
            x: { stiffness: 1000, velocity: -100, duration: 0.1 },
            opacity: { duration: 0.1 },
        },
    },
    closed: {
        x: -20,
        opacity: 0,
        transition: {
            x: { stiffness: 1000, duration: 0.08 },
            opacity: { duration: 0.08 },
        },
    },
};

const mobileMenuVariants = {
    open: {
        opacity: 1,
        x: 0,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    closed: {
        opacity: 0,
        x: '-100%',
        transition: {
            staggerChildren: 0.03,
            staggerDirection: -1,
            duration: 0.2,
            ease: 'easeIn',
        },
    },
};

const mobileItemVariants = {
    open: {
        x: 0,
        opacity: 1,
        transition: {
            x: { stiffness: 1000, velocity: -100 },
        },
    },
    closed: {
        x: -30,
        opacity: 0,
        transition: {
            x: { stiffness: 1000 },
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
        const categoryName = category?.name;

        if (categoryId) {
            navigate(`/products?categoryId=${categoryId}`);
        } else if (categoryName) {
            navigate(`/products?categoryName=${encodeURIComponent(categoryName)}`);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeMenus();
    };

    // Render category items
    const renderCategoryItems = (variant = 'desktop') => {
        if (categoriesLoading) {
            const statusClass = variant === 'mobile' ? 'mobile-dropdown-status' : 'dropdown-status';
            return <div className={cx(statusClass)}>Đang tải...</div>;
        }

        if (categoriesError) {
            const statusClass = variant === 'mobile' ? 'mobile-dropdown-status' : 'dropdown-status';
            return <div className={cx(statusClass)}>Lỗi tải danh mục</div>;
        }

        if (categories.length === 0) {
            const statusClass = variant === 'mobile' ? 'mobile-dropdown-status' : 'dropdown-status';
            return <div className={cx(statusClass)}>Không có danh mục</div>;
        }

        // Mobile: hiển thị tất cả categories trong một danh sách
        if (variant === 'mobile') {
            return categories.slice(0, 12).map((category) => (
                <motion.button
                    key={category.id || category.name}
                    type="button"
                    className={cx('mobile-dropdown-item')}
                    variants={mobileItemVariants}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategorySelect(category)}
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
                transition: { staggerChildren: 0.05, delayChildren: 0.1 },
            },
            closed: {
                transition: { staggerChildren: 0.03, staggerDirection: -1 },
            },
        };

        const submenuPanelVariants = {
            open: {
                opacity: 1,
                x: 0,
                transition: { 
                    staggerChildren: 0.01, 
                    delayChildren: 0,
                    opacity: { duration: 0.08, ease: 'easeOut' },
                    x: { duration: 0.08, ease: 'easeOut' },
                },
            },
            closed: {
                opacity: 0,
                x: -10,
                transition: { 
                    staggerChildren: 0.005, 
                    staggerDirection: -1,
                    opacity: { duration: 0.06, ease: 'easeIn' },
                    x: { duration: 0.06, ease: 'easeIn' },
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
                                whileHover={{ scale: 1.02, x: 5 }}
                                whileTap={{ scale: 0.98 }}
                                onMouseEnter={() => {
                                    // Set ngay lập tức khi hover
                                    setActiveParentId(category.id);
                                }}
                                onClick={() => handleCategorySelect(category)}
                            >
                                {category.name}
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
                                    transition: { staggerChildren: 0.01, delayChildren: 0 },
                                },
                                closed: {
                                    transition: { staggerChildren: 0.005, staggerDirection: -1 },
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
                                    whileHover={{ scale: 1.05, x: 5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleCategorySelect(child)}
                                >
                                    {child.name}
                                </motion.button>
                            ))}
                        </motion.div>
                    ) : (
                        <div className={cx('submenu-empty')}>Chọn danh mục để xem</div>
                    )}
                </motion.div>
            </div>
        );
    };

    return (
        <nav className={cx('navbar')}>
            <div className={cx('navbar-content')}>
                <div 
                    className={cx('dropdown-container')}
                    onMouseEnter={openDropdown}
                    onMouseLeave={closeDropdown}
                >
                    <button
                        className={cx('nav-trigger', { active: isHome || isDropdownOpen })}
                    >
                        TẤT CẢ DANH MỤC
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                className={cx('dropdown-menu')}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderCategoryItems()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <Link to={routes.promotion} className={cx('nav-link', { active: isPromotion })}>
                    KHUYẾN MÃI
                </Link>
                <Link to={routes.newproduct} className={cx('nav-link', { active: isNewProduct })}>
                    SẢN PHẨM MỚI
                </Link>
                <Link
                    to={routes.customerSupport}
                    className={cx('nav-link', { active: isCustomerSupport })}
                >
                    HỖ TRỢ KHÁCH HÀNG
                </Link>
            </div>

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
        </nav>
    );
}

export default NavBar;
