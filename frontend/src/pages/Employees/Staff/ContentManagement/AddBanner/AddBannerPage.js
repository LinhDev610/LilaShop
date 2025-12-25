import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './AddBannerPage.module.scss';
import { getApiBaseUrl, getStoredToken, getUserRole } from '../../../../../services/utils';
import { normalizeMediaUrl, filterByKeyword } from '../../../../../services/productUtils';
import { uploadBannerMedia } from '../../../../../services/CloudinaryService';
import { useNotification } from '../../../../../components/Common/Notification';
import useDebounce from '../../../../../hooks/useDebounce';
import RichTextEditor from '../../../../../components/Common/RichTextEditor';

const cx = classNames.bind(styles);

export default function AddBannerPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const API_BASE_URL = useMemo(() => getApiBaseUrl(), []);
    const fileInputRef = useRef(null);
    const { success: notifySuccess, error: notifyError } = useNotification();
    const [contentType, setContentType] = useState('banner'); // 'banner', 'seasonal', 'trending'
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageFile: null,
        imageUrl: '',
        productIds: [],
        linkUrl: '', // For seasonal collection link
        createdDate: new Date().toISOString().split('T')[0], // Ngày tạo (mặc định là hôm nay)
        startDate: '', // Ngày bắt đầu
        endDate: '', // Ngày kết thúc
    });
    const [selectedProducts, setSelectedProducts] = useState([]); // Array of {id, name}
    const [availableProducts, setAvailableProducts] = useState([]); // All products for selection
    const [showProductModal, setShowProductModal] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState(''); // Search term for products in modal
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [bannerLoaded, setBannerLoaded] = useState(false); // Track if banner data has been loaded

    // Debounce search term for better performance
    const debouncedSearchTerm = useDebounce(productSearchTerm, 300);

    // Reset form fields when contentType changes (only in create mode)
    useEffect(() => {
        if (!isEditMode) {
            setFormData(prev => ({
                ...prev,
                description: '', // Reset description
                linkUrl: '', // Reset linkUrl
                productIds: [], // Reset productIds
                selectedProducts: [], // Reset selected products
            }));
            setSelectedProducts([]); // Clear selected products
        }
    }, [contentType, isEditMode]);

    // Fetch user role to check if admin
    useEffect(() => {
        const checkUserRole = async () => {
            try {
                // Lấy token từ sessionStorage hoặc localStorage
                let token = sessionStorage.getItem('token');
                if (!token) {
                    token = getStoredToken();
                }

                if (!token) {
                    setIsAdmin(false);
                    return;
                }

                // Đảm bảo token là string
                let tokenToUse = token;
                if (typeof tokenToUse !== 'string') {
                    tokenToUse = String(tokenToUse);
                }

                // Gọi API trực tiếp để có error handling tốt hơn
                const resp = await fetch(`${API_BASE_URL}/users/my-info`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${tokenToUse}`,
                    },
                });

                if (!resp.ok) {
                    // Nếu không phải lỗi 401/403, có thể là lỗi khác
                    const errorData = await resp.json().catch(() => ({}));
                    console.warn('Error fetching user info:', errorData?.message || resp.status);
                    setIsAdmin(false);
                    return;
                }

                const data = await resp.json().catch(() => ({}));
                const role =
                    data?.result?.role?.name ||
                    data?.role?.name ||
                    data?.result?.role ||
                    data?.role ||
                    null;

                setIsAdmin(role === 'ADMIN');
            } catch (err) {
                console.error('Error fetching user role:', err);
                setIsAdmin(false);
            }
        };

        checkUserRole();
    }, [API_BASE_URL]);

    // Fetch available products first
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const token = getStoredToken();
                if (!token) return;

                const response = await fetch(`${API_BASE_URL}/products`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (response.ok && data?.result) {
                    const products = data.result.map((p) => ({
                        id: p.id,
                        name: p.name,
                    }));
                    setAvailableProducts(products);
                }
            } catch (err) {
                console.error('Error fetching products:', err);
            }
        };

        fetchProducts();
    }, [API_BASE_URL]);

    // Fetch banner data if in edit mode (only once)
    useEffect(() => {
        if (!isEditMode || !id || bannerLoaded) return;

        const fetchBanner = async () => {
            try {
                const token = getStoredToken();
                if (!token) return;

                const response = await fetch(`${API_BASE_URL}/banners/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (response.ok && data?.result) {
                    const banner = data.result;

                    // Format dates
                    const formatLocalDate = (value) => {
                        if (!value) return '';
                        if (Array.isArray(value) && value.length >= 3) {
                            const y = String(value[0]).padStart(4, '0');
                            const m = String(value[1]).padStart(2, '0');
                            const d = String(value[2]).padStart(2, '0');
                            return `${y}-${m}-${d}`;
                        }
                        if (typeof value === 'string') {
                            const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
                            if (isoMatch) return isoMatch[1];
                            if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
                        }
                        try {
                            const d = new Date(value);
                            if (!isNaN(d.getTime())) {
                                const yyyy = d.getFullYear();
                                const mm = String(d.getMonth() + 1).padStart(2, '0');
                                const dd = String(d.getDate()).padStart(2, '0');
                                return `${yyyy}-${mm}-${dd}`;
                            }
                        } catch (e) {
                            // ignore
                        }
                        return '';
                    };

                    // Set content type if available
                    if (banner.contentType) {
                        setContentType(banner.contentType);
                    }

                    setFormData({
                        title: banner.title || '',
                        description: banner.description || '',
                        imageFile: null,
                        imageUrl: banner.imageUrl || '',
                        productIds: banner.productIds || [],
                        linkUrl: banner.linkUrl || '',
                        createdDate: banner.createdAt
                            ? new Date(banner.createdAt).toISOString().split('T')[0]
                            : new Date().toISOString().split('T')[0],
                        startDate: formatLocalDate(banner.startDate),
                        endDate: formatLocalDate(banner.endDate),
                    });

                    // Set selected products with IDs first, names will be updated when products load
                    const selected = (banner.productIds || []).map((pid) => ({
                        id: pid,
                        name: 'Đang tải...',
                    }));
                    setSelectedProducts(selected);
                    setBannerLoaded(true);
                }
            } catch (err) {
                console.error('Error fetching banner:', err);
                notifyError('Không thể tải thông tin banner');
            }
        };

        fetchBanner();
    }, [isEditMode, id, API_BASE_URL, notifyError, bannerLoaded]);

    // Update selected products names when availableProducts are loaded
    useEffect(() => {
        if (!isEditMode || availableProducts.length === 0 || selectedProducts.length === 0) return;

        // Check if any product has "Đang tải..." name
        const needsUpdate = selectedProducts.some((p) => p.name === 'Đang tải...');
        if (needsUpdate) {
            const updated = selectedProducts.map((sp) => {
                const product = availableProducts.find((p) => p.id === sp.id);
                return product ? { id: product.id, name: product.name } : sp;
            });
            setSelectedProducts(updated);
        }
    }, [availableProducts, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({
                ...prev,
                imageFile: file,
            }));
        }
    };

    const handleRemoveImage = () => {
        setFormData((prev) => ({
            ...prev,
            imageFile: null,
        }));
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };


    const handleAddProduct = () => {
        setProductSearchTerm('');
        setShowProductModal(true);
    };

    // Filter products based on search term
    const filteredAvailableProducts = useMemo(() => {
        const unselectedProducts = availableProducts.filter(
            (p) => !selectedProducts.find((sp) => sp.id === p.id),
        );
        return filterByKeyword(unselectedProducts, debouncedSearchTerm);
    }, [availableProducts, selectedProducts, debouncedSearchTerm]);

    const handleSelectProduct = (product) => {
        if (!selectedProducts.find((p) => p.id === product.id)) {
            setSelectedProducts((prev) => [...prev, product]);
            setFormData((prev) => ({
                ...prev,
                productIds: [...prev.productIds, product.id],
            }));
            // Keep modal open for multiple selection
        }
    };

    const handleRemoveProduct = (productId) => {
        setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
        setFormData((prev) => ({
            ...prev,
            productIds: prev.productIds.filter((id) => id !== productId),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.title || !formData.title.trim()) {
            const contentTypeLabel = contentType === 'banner' ? 'banner/slider' : contentType === 'seasonal' ? 'bộ sưu tập' : 'blog làm đẹp';
            notifyError(`Vui lòng nhập tiêu đề cho ${contentTypeLabel}`);
            return;
        }
        if (!isEditMode && !formData.imageFile) {
            const contentTypeLabel = contentType === 'banner' ? 'banner/slider' : contentType === 'seasonal' ? 'bộ sưu tập' : 'blog làm đẹp';
            notifyError(`Vui lòng chọn ảnh cho ${contentTypeLabel}`);
            return;
        }
        if (isEditMode && !formData.imageFile && !formData.imageUrl) {
            const contentTypeLabel = contentType === 'banner' ? 'banner/slider' : contentType === 'seasonal' ? 'bộ sưu tập' : 'blog làm đẹp';
            notifyError(`Vui lòng chọn ảnh cho ${contentTypeLabel}`);
            return;
        }

        if (contentType === 'seasonal' && (!formData.productIds || formData.productIds.length === 0)) {
            notifyError('Bộ sưu tập cần có ít nhất 1 sản phẩm. Vui lòng thêm sản phẩm.');
            return;
        }

        // Validation ngày tháng (chỉ bắt buộc với Banner và Seasonal)
        if (contentType !== 'trending') {
            if (!formData.startDate) {
                notifyError('Vui lòng chọn ngày bắt đầu');
                return;
            }

            if (!formData.endDate) {
                notifyError('Vui lòng chọn ngày kết thúc');
                return;
            }

            if (new Date(formData.endDate) <= new Date(formData.startDate)) {
                notifyError('Ngày kết thúc phải sau ngày bắt đầu');
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const token = getStoredToken();
            if (!token) {
                notifyError('Vui lòng đăng nhập');
                setIsSubmitting(false);
                return;
            }

            let imageUrl = formData.imageUrl;

            // Step 1: Upload image if new file is selected
            if (formData.imageFile) {
                try {
                    const urls = await uploadBannerMedia([formData.imageFile]);
                    if (urls && urls.length > 0) {
                        imageUrl = urls[0];
                    } else {
                        throw new Error('Không thể upload ảnh, vui lòng thử lại');
                    }
                } catch (uploadErr) {
                    console.error('Upload failed:', uploadErr);
                    throw new Error('Không thể upload ảnh: ' + (uploadErr.message || 'Lỗi không xác định'));
                }
            }

            // Step 2: Create or Update banner
            // Normalize dates: empty string becomes null, so banner shows immediately
            const normalizeDate = (dateStr) => {
                if (!dateStr || dateStr.trim() === '') return null;
                return dateStr.trim();
            };

            const bannerPayload = {
                title: formData.title.trim(),
                description: formData.description.trim() || '',
                imageUrl: imageUrl,
                linkUrl: contentType === 'banner' ? (formData.linkUrl || '') : '', // Only include linkUrl for 'banner' type
                status: true, // Staff tạo content mặc định đã duyệt (không cần admin duyệt)
                productIds: contentType === 'seasonal' ? formData.productIds : [], // Only include productIds for 'seasonal' type
                contentType: contentType, // Store content type
                startDate: normalizeDate(formData.startDate), // null if empty = hiển thị ngay
                endDate: normalizeDate(formData.endDate), // null if empty = không giới hạn
            };

            // Don't send rejectionReason - keep the old one
            // When status is set to false, it will be "Chờ duyệt" but rejectionReason remains

            if (isEditMode) {
                // Update banner
                const updateResponse = await fetch(`${API_BASE_URL}/banners/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(bannerPayload),
                });

                const updateData = await updateResponse.json();

                if (!updateResponse.ok) {
                    throw new Error(updateData?.message || 'Không thể cập nhật banner');
                }

                notifySuccess('Banner đã được cập nhật thành công!');
            } else {
                // Create banner
                bannerPayload.createdDate = formData.createdDate || new Date().toISOString().split('T')[0];

                const createResponse = await fetch(`${API_BASE_URL}/banners`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(bannerPayload),
                });

                const createData = await createResponse.json();

                if (!createResponse.ok) {
                    throw new Error(createData?.message || 'Không thể tạo banner');
                }

                notifySuccess('Banner đã được tạo thành công!');
            }

            setTimeout(() => {
                navigate('/staff/content');
            }, 2000);
        } catch (err) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} banner:`, err);
            notifyError(err.message || `Đã xảy ra lỗi khi ${isEditMode ? 'cập nhật' : 'tạo'} banner`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/staff/content');
    };

    return (
        <div className={cx('add-banner-page')}>
            <div className={cx('page-header')}>
                <div className={cx('header-left')}>
                    <button className={cx('back-btn')} onClick={() => navigate('/staff/content')}>
                        ←
                    </button>
                    <h1 className={cx('page-title')}>Quản lý nội dung</h1>
                </div>
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

            <div className={cx('form-container')}>
                <h2 className={cx('form-title')}>
                    {isEditMode
                        ? `Sửa ${contentType === 'banner' ? 'banner/slider' : contentType === 'seasonal' ? 'bộ sưu tập' : 'blog làm đẹp'}`
                        : 'Thêm nội dung mới'}
                </h2>

                {/* Content Type Selector */}
                {!isEditMode && (
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>Loại nội dung</label>
                        <div className={cx('content-type-selector')}>
                            <button
                                type="button"
                                className={cx('content-type-btn', { active: contentType === 'banner' })}
                                onClick={() => setContentType('banner')}
                            >
                                Banner/Slider
                            </button>
                            <button
                                type="button"
                                className={cx('content-type-btn', { active: contentType === 'seasonal' })}
                                onClick={() => setContentType('seasonal')}
                            >
                                Bộ Sưu Tập
                            </button>
                            <button
                                type="button"
                                className={cx('content-type-btn', { active: contentType === 'trending' })}
                                onClick={() => setContentType('trending')}
                            >
                                Blog Làm Đẹp
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>
                            {contentType === 'banner' ? 'Ảnh banner/slider' : contentType === 'seasonal' ? 'Ảnh bộ sưu tập' : 'Ảnh blog làm đẹp'}
                            <span className={cx('required-label')}> *</span>
                        </label>
                        <div className={cx('file-upload-section')}>
                            <label className={cx('file-upload-btn')}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className={cx('file-input')}
                                />
                                Chọn tệp
                            </label>
                            <span className={cx('file-name')}>
                                {formData.imageFile
                                    ? formData.imageFile.name
                                    : isEditMode && formData.imageUrl
                                        ? 'Ảnh hiện tại (có thể thay đổi)'
                                        : 'Chưa có tệp nào được chọn'}
                            </span>
                        </div>
                        {(formData.imageFile || (isEditMode && formData.imageUrl)) && (
                            <div className={cx('image-preview-wrapper')}>
                                <div className={cx('image-preview')}>
                                    <img
                                        src={
                                            formData.imageFile
                                                ? URL.createObjectURL(formData.imageFile)
                                                : normalizeMediaUrl(formData.imageUrl, API_BASE_URL)
                                        }
                                        alt="Preview"
                                    />
                                    <div className={cx('image-actions')}>
                                        <button
                                            type="button"
                                            className={cx('btn', 'muted')}
                                            onClick={handleRemoveImage}
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={cx('form-group')}>
                        <label className={cx('form-label')}>
                            Tiêu đề
                            <span className={cx('required-label')}> *</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder={
                                contentType === 'banner'
                                    ? "Nhập tiêu đề banner/slider..."
                                    : contentType === 'seasonal'
                                        ? "Nhập tên bộ sưu tập..."
                                        : "Nhập tiêu đề blog làm đẹp..."
                            }
                            className={cx('form-input')}
                        />
                    </div>

                    {/* Mô tả - Hiển thị cho Bộ sưu tập và Xu hướng làm đẹp */}
                    {contentType === 'seasonal' && (
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>
                                Mô tả (Giới thiệu về bộ sưu tập)
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Nhập mô tả về bộ sưu tập, các sản phẩm nổi bật, chủ đề..."
                                className={cx('form-textarea')}
                                rows={4}
                            />
                        </div>
                    )}

                    {/* Rich Text Editor cho Xu hướng làm đẹp */}
                    {contentType === 'trending' && (
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>
                                Nội dung bài viết (Mô tả về blog làm đẹp)
                                <span className={cx('required-label')}> *</span>
                            </label>
                            <RichTextEditor
                                value={formData.description}
                                onChange={(html) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        description: html
                                    }));
                                }}
                                placeholder="Nhập nội dung bài viết về blog làm đẹp, tips, hướng dẫn... Bạn có thể sử dụng các công cụ định dạng ở trên để làm đẹp bài viết."
                            />
                        </div>
                    )}

                    {/* Link URL - Chỉ hiển thị cho Banner/Slider */}
                    {contentType === 'banner' && (
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>
                                Link URL (Link khi click vào banner)
                                <span className={cx('optional-label')}> (Tùy chọn)</span>
                            </label>
                            <input
                                type="url"
                                name="linkUrl"
                                value={formData.linkUrl}
                                onChange={handleInputChange}
                                placeholder="https://example.com/page"
                                className={cx('form-input')}
                            />
                        </div>
                    )}


                    <div className={cx('form-group', 'date-group')}>
                        <label className={cx('form-label')}>Ngày tạo</label>
                        <input
                            type="date"
                            name="createdDate"
                            value={formData.createdDate}
                            readOnly
                            className={cx('form-input', 'readonly-input')}
                        />
                    </div>

                    {contentType !== 'trending' && (
                        <>
                            <div className={cx('form-group', 'date-group')}>
                                <label className={cx('form-label')}>Ngày bắt đầu</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    className={cx('form-input')}
                                />
                            </div>

                            <div className={cx('form-group', 'date-group')}>
                                <label className={cx('form-label')}>Ngày kết thúc</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    className={cx('form-input')}
                                />
                            </div>
                        </>
                    )}

                    {/* Danh sách sản phẩm - Chỉ hiển thị cho Bộ sưu tập */}
                    {contentType === 'seasonal' && (
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>
                                Danh sách sản phẩm trong bộ sưu tập
                                <span className={cx('required-label')}> *</span>
                            </label>
                            {selectedProducts.length > 0 && (
                                <div className={cx('product-list')}>
                                    {selectedProducts.map((product) => (
                                        <div key={product.id} className={cx('product-item')}>
                                            <span className={cx('product-name')}>{product.name}</span>
                                            <button
                                                type="button"
                                                className={cx('btn', 'muted')}
                                                onClick={() => handleRemoveProduct(product.id)}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {selectedProducts.length === 0 && (
                                <p className={cx('form-hint', 'warning')}>
                                    ⚠️ Vui lòng thêm ít nhất 1 sản phẩm vào bộ sưu tập
                                </p>
                            )}
                            <button
                                type="button"
                                className={cx('add-product-btn')}
                                onClick={handleAddProduct}
                            >
                                <span className={cx('plus-icon')}>+</span>
                                Thêm sản phẩm
                            </button>
                            <p className={cx('form-hint')}>
                                Chọn các sản phẩm sẽ được hiển thị trong bộ sưu tập này
                            </p>
                        </div>
                    )}

                    <div className={cx('form-actions')}>
                        <button
                            type="button"
                            className={cx('btn', 'btn-cancel')}
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={cx('btn', 'btn-submit')}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang gửi...' : 'Xác nhận'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Product Selection Modal */}
            {showProductModal && (
                <div className={cx('modal-overlay')} onClick={() => setShowProductModal(false)}>
                    <div className={cx('modal')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modal-header')}>
                            <h3 className={cx('modal-title')}>Chọn sản phẩm</h3>
                            <button
                                className={cx('modal-close')}
                                onClick={() => setShowProductModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={cx('modal-content')}>
                            <div className={cx('search-container')}>
                                <input
                                    type="text"
                                    className={cx('search-input')}
                                    placeholder="Tìm kiếm sản phẩm theo tên..."
                                    value={productSearchTerm}
                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className={cx('product-list-container')}>
                                {filteredAvailableProducts.length > 0 ? (
                                    filteredAvailableProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className={cx('product-option')}
                                            onClick={() => handleSelectProduct(product)}
                                        >
                                            {product.name}
                                        </div>
                                    ))
                                ) : (
                                    <p className={cx('no-products')}>
                                        {productSearchTerm.trim()
                                            ? 'Không tìm thấy sản phẩm nào phù hợp'
                                            : 'Không còn sản phẩm nào để thêm'}
                                    </p>
                                )}
                            </div>
                            <div className={cx('modal-footer')} style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                                <button
                                    className={cx('btn', 'btn-submit')}
                                    onClick={() => setShowProductModal(false)}
                                    style={{ padding: '8px 20px' }}
                                >
                                    Hoàn tất
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

