import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './ContentManagementPage.module.scss';
import { SearchFilterBar } from '../../../../components/Common';
import { getApiBaseUrl, getStoredToken, formatDateTime } from '../../../../services/utils';
import { useNotification } from '../../../../components/Common/Notification';

const cx = classNames.bind(styles);

/**
 * Helper function to determine banner display status based on status and dates
 * @param {boolean} status - Banner status (true = đã duyệt, false = chờ duyệt)
 * @param {string} startDate - Banner start date
 * @param {string} endDate - Banner end date
 * @returns {Object} { status: string, statusKey: string }
 */
const getBannerTimeStatus = (status, startDate, endDate) => {
    // First check status field
    if (status === false || status === null) {
        return { status: 'Chờ duyệt', statusKey: 'pending' };
    }

    // Normalize dates: treat empty string as null
    const normalizedStartDate = startDate && startDate.trim() !== '' ? startDate : null;
    const normalizedEndDate = endDate && endDate.trim() !== '' ? endDate : null;

    // If no dates set, assume always active (status = true) - hiển thị ngay
    if (!normalizedStartDate && !normalizedEndDate) {
        return { status: 'Đang hiển thị', statusKey: 'active' };
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for fair comparison

    let start = null;
    let end = null;

    // Parse start date
    if (normalizedStartDate) {
        try {
            const parsedStart = new Date(normalizedStartDate);
            if (!isNaN(parsedStart.getTime())) {
                parsedStart.setHours(0, 0, 0, 0);
                start = parsedStart;
            }
        } catch (e) {
            console.warn('Invalid startDate:', normalizedStartDate);
        }
    }

    // Parse end date
    if (normalizedEndDate) {
        try {
            const parsedEnd = new Date(normalizedEndDate);
            if (!isNaN(parsedEnd.getTime())) {
                parsedEnd.setHours(0, 0, 0, 0);
                end = parsedEnd;
            }
        } catch (e) {
            console.warn('Invalid endDate:', normalizedEndDate);
        }
    }

    // If start date is in the future, show "Sắp hiển thị"
    if (start && start > now) {
        return { status: 'Sắp hiển thị', statusKey: 'future' };
    }

    // If end date is in the past, show "Đã kết thúc"
    if (end && end < now) {
        return { status: 'Đã kết thúc', statusKey: 'expired' };
    }

    // Active: we're between start and end date, or start date is today/past and no end date
    // If no start date but has end date in future, also active
    return { status: 'Đang hiển thị', statusKey: 'active' };
};

export default function ContentManagementPage() {
    const navigate = useNavigate();
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const { success: notifySuccess, error: notifyError } = useNotification();
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortFilter, setSortFilter] = useState('all');
    const [contentTypeFilter, setContentTypeFilter] = useState('all');
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteModal, setDeleteModal] = useState({ show: false, id: null, title: '' });
    const [isDeleting, setIsDeleting] = useState(false);

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

                    // Normalize dates from backend (can be array [yyyy, mm, dd] or string)
                    const normalizeDate = (dateValue) => {
                        if (!dateValue) return null;
                        // Array form [yyyy, mm, dd]
                        if (Array.isArray(dateValue) && dateValue.length >= 3) {
                            const y = String(dateValue[0]).padStart(4, '0');
                            const m = String(dateValue[1]).padStart(2, '0');
                            const d = String(dateValue[2]).padStart(2, '0');
                            return `${y}-${m}-${d}`;
                        }
                        // String form
                        if (typeof dateValue === 'string') {
                            // Treat empty string as null
                            if (dateValue.trim() === '') return null;
                            // If ISO with time, take date part
                            const isoMatch = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);
                            if (isoMatch) return isoMatch[1];
                            // If plain date already
                            if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
                        }
                        return null;
                    };

                    const normalizedStartDate = normalizeDate(banner.startDate);
                    const normalizedEndDate = normalizeDate(banner.endDate);

                    // Get time-based status (consider both status field and dates)
                    const { status, statusKey } = getBannerTimeStatus(
                        banner.status,
                        normalizedStartDate,
                        normalizedEndDate
                    );

                    // Format date range for display (use normalized dates)
                    const startDateStr = normalizedStartDate
                        ? new Date(normalizedStartDate).toLocaleDateString('vi-VN')
                        : null;
                    const endDateStr = normalizedEndDate
                        ? new Date(normalizedEndDate).toLocaleDateString('vi-VN')
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
                        startDate: normalizedStartDate,
                        endDate: normalizedEndDate,
                        contentType: banner.contentType || 'banner',
                        startDateStr: startDateStr,
                        endDateStr: endDateStr,
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

        // Status filter (only active and future)
        if (sortFilter && sortFilter !== 'all') {
            result = result.filter(item => item.statusKey === sortFilter);
        }

        // Content type filter
        if (contentTypeFilter && contentTypeFilter !== 'all') {
            result = result.filter(item => item.contentType === contentTypeFilter);
        }

        // Date filter (by creation date)
        if (dateFilter) {
            result = result.filter(item => {
                if (!item.createdAt) return false;
                const createdDate = new Date(item.createdAt).toISOString().split('T')[0];
                return createdDate === dateFilter;
            });
        }

        // Sort: Active first, then Future, then Pending, then Expired
        const statusOrder = { active: 0, future: 1, pending: 2, expired: 3 };
        result.sort((a, b) => {
            const orderA = statusOrder[a.statusKey] ?? 4;
            const orderB = statusOrder[b.statusKey] ?? 4;
            if (orderA !== orderB) return orderA - orderB;
            // Within same status, sort by start date (newest first)
            return new Date(b.startDate || 0) - new Date(a.startDate || 0);
        });

        return result;
    }, [contents, searchQuery, sortFilter, dateFilter, contentTypeFilter]);

    const handleViewDetail = (id) => {
        navigate(`/staff/content/${id}`);
    };

    const handleAddBanner = () => {
        navigate('/staff/content/add-banner');
    };

    const handleSearch = () => {
        // Filter đã được tính toán real-time trong filtered
    };

    const handleDelete = (id, title) => {
        setDeleteModal({ show: true, id, title });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.id) return;

        setIsDeleting(true);
        try {
            const token = getStoredToken();
            if (!token) {
                notifyError('Vui lòng đăng nhập');
                setIsDeleting(false);
                return;
            }

            const deleteResponse = await fetch(`${API_BASE_URL}/banners/${deleteModal.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const deleteData = await deleteResponse.json();

            if (!deleteResponse.ok) {
                throw new Error(deleteData?.message || 'Không thể xóa nội dung');
            }

            notifySuccess('Đã xóa nội dung thành công!');

            // Refresh danh sách
            setContents(prev => prev.filter(item => item.id !== deleteModal.id));
            setDeleteModal({ show: false, id: null, title: '' });
        } catch (err) {
            console.error('Error deleting content:', err);
            notifyError(err.message || 'Đã xảy ra lỗi khi xóa nội dung');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ show: false, id: null, title: '' });
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

            <div className={cx('filters-section')}>
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
                        { value: 'active', label: 'Đang diễn ra' },
                        { value: 'future', label: 'Sắp diễn ra' },
                    ]}
                    sortLabel="Sắp xếp theo trạng thái:"
                    actionButtons={[
                        { label: 'Thêm nội dung', onClick: handleAddBanner },
                    ]}
                />
                <div className={cx('content-type-filter')}>
                    <label className={cx('filter-label')}>Sắp xếp theo loại:</label>
                    <select
                        className={cx('filter-select')}
                        value={contentTypeFilter}
                        onChange={(e) => setContentTypeFilter(e.target.value)}
                    >
                        <option value="all">Tất cả</option>
                        <option value="banner">Banner/Slider</option>
                        <option value="seasonal">Bộ sưu tập</option>
                        <option value="trending">Xu hướng làm đẹp</option>
                    </select>
                </div>
            </div>

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
                                <th>Loại nội dung</th>
                                <th>Thời gian hiển thị</th>
                                <th>Trạng thái</th>
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
                            {filtered.map((content) => {
                                const contentTypeLabel =
                                    content.contentType === 'seasonal'
                                        ? 'Bộ sưu tập'
                                        : content.contentType === 'trending'
                                            ? 'Xu hướng làm đẹp'
                                            : 'Banner/Slider';

                                return (
                                    <tr key={content.id}>
                                        <td className={cx('title-cell')}>{content.title}</td>
                                        <td className={cx('content-type-cell')}>{contentTypeLabel}</td>
                                        <td className={cx('date-cell')}>
                                            <div className={cx('date-range')}>
                                                <div className={cx('date-start')}>
                                                    {content.startDateStr ? (
                                                        <>Bắt đầu: {content.startDateStr}</>
                                                    ) : (
                                                        <span className={cx('no-date')}>Không giới hạn</span>
                                                    )}
                                                </div>
                                                <div className={cx('date-end')}>
                                                    {content.endDateStr ? (
                                                        <>Kết thúc: {content.endDateStr}</>
                                                    ) : (
                                                        <span className={cx('no-date')}>Không giới hạn</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
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
                                        <td className={cx('action-cell')}>
                                            <div className={cx('action-buttons')}>
                                                <button
                                                    className={cx('btn', 'btn-detail')}
                                                    onClick={() => handleViewDetail(content.id)}
                                                >
                                                    Xem chi tiết
                                                </button>
                                                <button
                                                    className={cx('btn', 'btn-delete')}
                                                    onClick={() => handleDelete(content.id, content.title)}
                                                    title="Xóa"
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className={cx('modal-overlay')} onClick={handleDeleteCancel}>
                    <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modal-header')}>
                            <h2 className={cx('modal-title')}>Xác nhận xóa</h2>
                            <button className={cx('modal-close')} onClick={handleDeleteCancel} aria-label="Đóng">×</button>
                        </div>
                        <div className={cx('modal-content')}>
                            <p className={cx('modal-message')}>
                                Bạn có chắc chắn muốn xóa nội dung <span className={cx('content-title-highlight')}>"{deleteModal.title}"</span> không?
                            </p>
                            <p className={cx('modal-message')}>
                                Hành động này không thể hoàn tác.
                            </p>
                        </div>
                        <div className={cx('modal-actions')}>
                            <button
                                className={cx('btn', 'btn-cancel')}
                                onClick={handleDeleteCancel}
                                disabled={isDeleting}
                            >
                                Hủy
                            </button>
                            <button
                                className={cx('btn', 'btn-confirm-delete')}
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Đang xử lý...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
