import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ManageContentPage.module.scss';
import { getApiBaseUrl, getStoredToken, formatDateTime } from '../../../services/utils';
import SearchAndSort from '../../../layouts/components/SearchAndSort';
import ReviewAndCommentPage from './ReviewAndComment';

const cx = classNames.bind(styles);

/**
 * Helper function to determine banner display status based on dates
 * @param {string} startDate - Banner start date
 * @param {string} endDate - Banner end date
 * @returns {Object} { statusDisplay: string, statusClass: string }
 */
const getBannerTimeStatus = (startDate, endDate) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (!start && !end) {
        return { statusDisplay: 'Đang hiển thị', statusClass: 'active' };
    }

    if (start && start > now) {
        return { statusDisplay: 'Sắp hiển thị', statusClass: 'future' };
    }

    if (end && end < now) {
        return { statusDisplay: 'Đã kết thúc', statusClass: 'expired' };
    }

    return { statusDisplay: 'Đang hiển thị', statusClass: 'active' };
};

export default function ManageContentPage() {
    const navigate = useNavigate();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [activeTab, setActiveTab] = useState('banner');
    const [banners, setBanners] = useState([]);
    const [filteredBanners, setFilteredBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Fetch banners from API
    useEffect(() => {
        const fetchBanners = async () => {
            setLoading(true);
            setError('');
            try {
                const token = getStoredToken();
                if (!token) {
                    setError('Vui lòng đăng nhập để xem danh sách banner');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/banners`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || 'Không thể tải danh sách banner');
                }

                // Map backend data with time-based status
                const mappedBanners = (data?.result || []).map((banner) => {
                    const dateStr = banner.createdAt
                        ? formatDateTime(banner.createdAt).split(' ')[0]
                        : '';

                    // Get time-based status
                    const { statusDisplay, statusClass } = getBannerTimeStatus(
                        banner.startDate,
                        banner.endDate
                    );

                    // Format date range
                    const startDateStr = banner.startDate
                        ? new Date(banner.startDate).toLocaleDateString('vi-VN')
                        : null;
                    const endDateStr = banner.endDate
                        ? new Date(banner.endDate).toLocaleDateString('vi-VN')
                        : null;

                    let dateRange = 'Không giới hạn';
                    if (startDateStr && endDateStr) {
                        dateRange = `${startDateStr} - ${endDateStr}`;
                    } else if (startDateStr) {
                        dateRange = `Từ ${startDateStr}`;
                    } else if (endDateStr) {
                        dateRange = `Đến ${endDateStr}`;
                    }

                    return {
                        id: banner.id,
                        title: banner.title,
                        linkUrl: banner.linkUrl || '',
                        creator: banner.createdByName || banner.createdBy || '',
                        statusDisplay,
                        statusClass,
                        dateRange,
                        date: dateStr,
                        createdAt: banner.createdAt,
                        startDate: banner.startDate,
                        endDate: banner.endDate,
                        productIds: banner.productIds || [],
                        productNames: banner.productNames || [],
                    };
                });

                // Sort: Active first, then Future, then Expired
                const statusOrder = { active: 0, future: 1, expired: 2 };
                mappedBanners.sort((a, b) => {
                    const orderA = statusOrder[a.statusClass] ?? 3;
                    const orderB = statusOrder[b.statusClass] ?? 3;
                    if (orderA !== orderB) return orderA - orderB;
                    return new Date(b.startDate || 0) - new Date(a.startDate || 0);
                });

                setBanners(mappedBanners);
                setFilteredBanners(mappedBanners);
            } catch (err) {
                console.error('Error fetching banners:', err);
                setError(err.message || 'Đã xảy ra lỗi khi tải danh sách banner');
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'banner') {
            fetchBanners();
        }
    }, [API_BASE_URL, activeTab]);

    // Filter banners
    useEffect(() => {
        if (activeTab !== 'banner') return;

        let filtered = [...banners];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (b) =>
                    b.title?.toLowerCase().includes(term) ||
                    b.creator?.toLowerCase().includes(term),
            );
        }

        // Date filter
        if (dateFilter) {
            filtered = filtered.filter((b) => {
                if (!b.createdAt) return false;
                const filterDate = new Date(dateFilter);
                const complaintDate = new Date(b.createdAt);
                return (
                    filterDate.getFullYear() === complaintDate.getFullYear() &&
                    filterDate.getMonth() === complaintDate.getMonth() &&
                    filterDate.getDate() === complaintDate.getDate()
                );
            });
        }

        // Time-based status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter((b) => b.statusClass === statusFilter);
        }

        setFilteredBanners(filtered);
    }, [banners, searchTerm, dateFilter, statusFilter, activeTab]);

    const handleSearch = () => {
        // Filter is handled by useEffect
    };

    const handleViewDetail = (bannerId) => {
        navigate(`/admin/content/${bannerId}`);
    };

    if (loading) {
        return (
            <div className={cx('admin-page')}>
                <h1 className={cx('page-title')}>Quản lý nội dung</h1>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Đang tải danh sách...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('admin-page')}>
                <h1 className={cx('page-title')}>Quản lý nội dung</h1>
                <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cx('admin-page')}>
            <h1 className={cx('page-title')}>Quản lý nội dung</h1>

            {/* Tabs */}
            <div className={cx('tabs')}>
                <button
                    className={cx('tab', { active: activeTab === 'banner' })}
                    onClick={() => setActiveTab('banner')}
                >
                    Banner/ Slider
                </button>
                <button
                    className={cx('tab', { active: activeTab === 'reviews' })}
                    onClick={() => setActiveTab('reviews')}
                >
                    Đánh giá và bình luận
                </button>
            </div>

            {activeTab === 'banner' && (
                <>
                    {/* Search and Filter */}
                    <SearchAndSort
                        searchPlaceholder="Tìm kiếm theo tiêu đề"
                        searchValue={searchTerm}
                        onSearchChange={(e) => setSearchTerm(e.target.value)}
                        onSearchClick={handleSearch}
                        dateFilter={dateFilter}
                        onDateChange={setDateFilter}
                        dateLabel="Ngày"
                        sortLabel="Trạng thái:"
                        sortOptions={[
                            { value: 'all', label: 'Tất cả' },
                            { value: 'active', label: 'Đang hiển thị' },
                            { value: 'future', label: 'Sắp hiển thị' },
                            { value: 'expired', label: 'Đã kết thúc' },
                        ]}
                        sortValue={statusFilter}
                        onSortChange={(e) => setStatusFilter(e.target.value)}
                    />

                    {/* Banner List Table */}
                    <div className={cx('table-container')}>
                        <h2 className={cx('table-title')}>Danh sách Banner/ Slider</h2>
                        {filteredBanners.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <p>Không tìm thấy banner nào</p>
                            </div>
                        ) : (
                            <table className={cx('content-table')}>
                                <thead>
                                    <tr>
                                        <th>Tiêu đề</th>
                                        <th>Thời gian hiển thị</th>
                                        <th>Người tạo</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBanners.map((banner, index) => (
                                        <tr key={banner.id} className={index % 2 === 1 ? cx('odd-row') : ''}>
                                            <td className={cx('title-cell')}>{banner.title}</td>
                                            <td className={cx('date-cell')}>{banner.dateRange}</td>
                                            <td>{banner.creator}</td>
                                            <td>
                                                <span
                                                    className={cx(
                                                        'status-tag',
                                                        `status-${banner.statusClass}`,
                                                    )}
                                                >
                                                    {banner.statusDisplay}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className={cx('view-btn')}
                                                    onClick={() => handleViewDetail(banner.id)}
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'reviews' && <ReviewAndCommentPage />}
        </div>
    );
}
