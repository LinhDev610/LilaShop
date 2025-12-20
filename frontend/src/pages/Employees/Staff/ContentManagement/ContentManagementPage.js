import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ContentManagementPage.module.scss';
import { SearchFilterBar } from '../../../../components/Common';
import { getApiBaseUrl, getStoredToken, formatDateTime } from '../../../../services/utils';

const cx = classNames.bind(styles);

/**
 * Helper function to determine banner display status based on dates
 * @param {string} startDate - Banner start date
 * @param {string} endDate - Banner end date
 * @returns {Object} { status: string, statusKey: string }
 */
const getBannerTimeStatus = (startDate, endDate) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for fair comparison

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // If no dates set, assume always active
    if (!start && !end) {
        return { status: 'Đang hiển thị', statusKey: 'active' };
    }

    // Future: start date is in the future
    if (start && start > now) {
        return { status: 'Sắp hiển thị', statusKey: 'future' };
    }

    // Expired: end date is in the past
    if (end && end < now) {
        return { status: 'Đã kết thúc', statusKey: 'expired' };
    }

    // Active: we're between start and end date (or no restrictions)
    return { status: 'Đang hiển thị', statusKey: 'active' };
};

export default function ContentManagementPage() {
    const navigate = useNavigate();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortFilter, setSortFilter] = useState('all');
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

                // Map backend data to display format with time-based status
                const mappedBanners = (data?.result || []).map((banner) => {
                    const dateStr = banner.createdAt
                        ? formatDateTime(banner.createdAt).split(' ')[0]
                        : '';

                    // Get time-based status
                    const { status, statusKey } = getBannerTimeStatus(
                        banner.startDate,
                        banner.endDate
                    );

                    // Format date range for display
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
                        createDate: dateStr,
                        dateRange: dateRange,
                        status: status,
                        statusKey: statusKey,
                        creator: banner.createdByName || banner.createdBy || 'N/A',
                        createdAt: banner.createdAt,
                        startDate: banner.startDate,
                        endDate: banner.endDate,
                    };
                });

                setContents(mappedBanners);
            } catch (err) {
                console.error('Error fetching banners:', err);
                setError(err.message || 'Đã xảy ra lỗi khi tải danh sách banner');
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, [API_BASE_URL]);

    // Custom filter logic for time-based status
    const filtered = useMemo(() => {
        let result = [...contents];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(item =>
                item.title?.toLowerCase().includes(query)
            );
        }

        // Time-based status filter
        if (sortFilter && sortFilter !== 'all') {
            result = result.filter(item => item.statusKey === sortFilter);
        }

        // Date filter (by creation date)
        if (dateFilter) {
            result = result.filter(item => {
                if (!item.createdAt) return false;
                const createdDate = new Date(item.createdAt).toISOString().split('T')[0];
                return createdDate === dateFilter;
            });
        }

        // Sort: Active first, then Future, then Expired
        const statusOrder = { active: 0, future: 1, expired: 2 };
        result.sort((a, b) => {
            const orderA = statusOrder[a.statusKey] ?? 3;
            const orderB = statusOrder[b.statusKey] ?? 3;
            if (orderA !== orderB) return orderA - orderB;
            // Within same status, sort by start date (newest first)
            return new Date(b.startDate || 0) - new Date(a.startDate || 0);
        });

        return result;
    }, [contents, searchQuery, sortFilter, dateFilter]);

    const handleViewDetail = (id) => {
        navigate(`/staff/content/${id}`);
    };

    const handleAddBanner = () => {
        navigate('/staff/content/add-banner');
    };

    const handleSearch = () => {
        // Filter đã được tính toán real-time trong filtered
    };

    return (
        <div className={cx('wrap')}>
            <div className={cx('header')}>
                <h1 className={cx('title')}>Quản lý nội dung</h1>
                <button className={cx('dashboard-btn')} onClick={() => navigate('/staff')}>
                    <span className={cx('icon-left')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M15 18L9 12L15 6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    Dashboard
                </button>
            </div>

            <SearchFilterBar
                searchQuery={searchQuery}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                searchPlaceholder="Tìm kiếm theo tiêu đề"
                dateFilter={dateFilter}
                onDateChange={(e) => setDateFilter(e.target.value)}
                onSearchClick={handleSearch}
                sortFilter={sortFilter}
                onSortChange={(e) => setSortFilter(e.target.value)}
                sortOptions={[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'active', label: 'Đang hiển thị' },
                    { value: 'future', label: 'Sắp hiển thị' },
                    { value: 'expired', label: 'Đã kết thúc' },
                ]}
                actionButtons={[
                    { label: 'Thêm Banner/ Slider', onClick: handleAddBanner },
                ]}
            />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Đang tải danh sách banner...</p>
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                    <p>{error}</p>
                </div>
            ) : (
                <div className={cx('table-container')}>
                    <table className={cx('content-table')}>
                        <thead>
                            <tr>
                                <th>Tiêu đề</th>
                                <th>Thời gian hiển thị</th>
                                <th>Trạng thái</th>
                                <th>Người tạo</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className={cx('empty-cell')}>
                                        Không có nội dung phù hợp.
                                    </td>
                                </tr>
                            )}
                            {filtered.map((content) => (
                                <tr key={content.id}>
                                    <td className={cx('title-cell')}>{content.title}</td>
                                    <td className={cx('date-cell')}>{content.dateRange}</td>
                                    <td className={cx('status-cell')}>
                                        <span
                                            className={cx('status-badge', {
                                                active: content.statusKey === 'active',
                                                future: content.statusKey === 'future',
                                                expired: content.statusKey === 'expired',
                                            })}
                                        >
                                            {content.status}
                                        </span>
                                    </td>
                                    <td className={cx('creator-cell')}>{content.creator}</td>
                                    <td className={cx('action-cell')}>
                                        <button
                                            className={cx('btn', 'btn-detail')}
                                            onClick={() => handleViewDetail(content.id)}
                                        >
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
