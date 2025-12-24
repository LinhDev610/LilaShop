import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './UpdateCategoryPage.module.scss';
import { useAuth } from '../../../../contexts/AuthContext';
import { useNotification } from '../../../../components/Common/Notification';
import { getStoredToken } from '../../../../services/utils';
import { getCategoryById, getRootCategories, refreshToken, updateCategory, createCategory, getSubCategories } from '../../../../services';
import { ErrorCode, isAuthError, isValidationError } from '../../../../utils/errorCodes';

const cx = classNames.bind(styles);

function UpdateCategoryPage() {
    // ========== State Management ==========
    const navigate = useNavigate();
    const { id } = useParams();
    const { openLoginModal } = useAuth();
    const { success, error } = useNotification();
    const [isEditMode, setIsEditMode] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        description: '',
        parentId: '',
        status: true
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [rootCategories, setRootCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [hasChildren, setHasChildren] = useState(false);

    // ========== Helper Functions ==========
    const readToken = (key = 'token') => getStoredToken(key);

    // Fetch category data if editing
    useEffect(() => {
        if (id && id !== 'new') {
            setIsEditMode(true);
            setLoadingData(true);
            const fetchCategory = async () => {
                try {
                    const token = readToken();
                    const [cat, subCats] = await Promise.all([
                        getCategoryById(id, token) || {},
                        getSubCategories(id, token) || []
                    ]);

                    setFormData({
                        id: cat.id || '',
                        name: cat.name || '',
                        description: cat.description || '',
                        parentId: cat.parentId || cat.parent?.id || '',
                        status: cat.status === undefined ? true : Boolean(cat.status),
                    });

                    // Check if category has children
                    if (Array.isArray(subCats) && subCats.length > 0) {
                        setHasChildren(true);
                    }
                } catch (err) {
                    console.error('Error fetching category:', err);
                    error('Không thể tải thông tin danh mục');
                } finally {
                    setLoadingData(false);
                }
            };
            fetchCategory();
        }
    }, [id]);

    // Fetch root categories for parent category dropdown
    useEffect(() => {
        const fetchRootCategories = async () => {
            setLoadingCategories(true);
            try {
                let token = readToken('token') || sessionStorage.getItem('token');
                const categories = await getRootCategories(token) || [];
                setRootCategories(Array.isArray(categories) ? categories : []);
            } catch (err) {
                console.error('Error fetching root categories:', err);
                setRootCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        };

        fetchRootCategories();
    }, []);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Xóa error khi người dùng nhập
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.id.trim()) {
            newErrors.id = 'Vui lòng nhập mã danh mục';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Vui lòng nhập tên danh mục';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const refreshTokenIfNeeded = async () => {
        const refreshToken = getStoredToken('refreshToken');
        if (!refreshToken) return null;
        try {
            const { ok, data: responseData } = await refreshToken(refreshToken);
            if (ok && responseData?.token) {
                localStorage.setItem('token', responseData.token);
                localStorage.setItem('refreshToken', responseData.token);
                return responseData.token;
            }
        } catch (_) { }
        return null;
    };

    const handleSave = async () => {
        if (validateForm()) {
            setIsLoading(true);
            try {
                let token = getStoredToken('token') || sessionStorage.getItem('token');
                if (!token) {
                    error('Thiếu token xác thực. Vui lòng đăng nhập lại bằng tài khoản admin.');
                    setIsLoading(false);
                    return;
                }

                // Prepare request data
                const requestData = isEditMode
                    ? {
                        // Khi update, không gửi id vì backend không cho phép update id
                        name: formData.name.trim(),
                        description: formData.description.trim() || null,
                        status: formData.status,
                        parentId: (formData.parentId && formData.parentId.trim()) || null,
                    }
                    : {
                        // Khi create, cần gửi id
                        id: formData.id.trim(),
                        name: formData.name.trim(),
                        description: formData.description.trim() || null,
                        status: formData.status,
                        parentId: (formData.parentId && formData.parentId.trim()) || null,
                    };

                let { ok, status, data: result } = isEditMode
                    ? await updateCategory(id, requestData, token)
                    : await createCategory(requestData, token);
                const errorCode = result?.code;

                // Chỉ refresh token khi là lỗi authentication (401 hoặc error code tương ứng)
                if (!ok && (status === 401 || (errorCode && isAuthError(errorCode)))) {
                    const newToken = await refreshTokenIfNeeded();
                    if (newToken) {
                        token = newToken;
                        const retryResult = isEditMode
                            ? await updateCategory(id, requestData, token)
                            : await createCategory(requestData, token);
                        ok = retryResult.ok;
                        status = retryResult.status;
                        result = retryResult.data;
                    } else {
                        // Không có refreshToken -> buộc đăng nhập lại
                        localStorage.removeItem('token');
                        localStorage.removeItem('refreshToken');
                        sessionStorage.removeItem('token');
                        error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                        navigate('/', { replace: true });
                        try { openLoginModal?.(); } catch (_) { }
                        setIsLoading(false);
                        return;
                    }
                }

                if (ok) {
                    success(isEditMode ? 'Cập nhật danh mục thành công!' : 'Tạo danh mục thành công!');
                    navigate('/admin/categories');
                } else {
                    const serverMsg = result?.message || result?.error || '';
                    const errorMessage = serverMsg || `Không thể ${isEditMode ? 'cập nhật' : 'tạo'} danh mục. Vui lòng thử lại.`;
                    error(errorMessage);

                    if (errorCode === ErrorCode.CATEGORY_ALREADY_EXISTS || (status === 400 && isValidationError(errorCode))) {
                        const newErrors = {};
                        const lowerMsg = serverMsg.toLowerCase();

                        if (isEditMode) {
                            newErrors.name = 'Tên danh mục đã tồn tại';
                        } else {
                            if (lowerMsg.includes('tên danh mục') || lowerMsg.includes('tên')) {
                                newErrors.name = 'Tên danh mục đã tồn tại';
                            } else if (lowerMsg.includes('mã danh mục') || lowerMsg.includes('mã')) {
                                newErrors.id = 'Mã danh mục đã tồn tại';
                            } else {
                                newErrors.name = 'Tên danh mục đã tồn tại';
                            }
                        }

                        if (Object.keys(newErrors).length > 0) {
                            setErrors(prev => ({ ...prev, ...newErrors }));
                        }
                    } else if (status === 500) {
                        error('Lỗi hệ thống. Vui lòng thử lại sau.');
                    }
                }
            } catch (error) {
                console.error('Error creating category:', error);
                error('Không thể kết nối máy chủ. Vui lòng thử lại.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleCancel = () => {
        navigate('/admin/categories');
    };

    if (loadingData) {
        return (
            <div className={cx('add-category-page')}>
                <div className={cx('page-header')}>
                    <button className={cx('back-btn')} onClick={handleCancel}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h1 className={cx('page-title')}>Chỉnh sửa danh mục</h1>
                </div>
                <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải...</div>
            </div>
        );
    }

    return (
        <div className={cx('add-category-page')}>
            <div className={cx('page-header')}>
                <button className={cx('back-btn')} onClick={handleCancel}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1 className={cx('page-title')}>{isEditMode ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}</h1>
            </div>

            <div className={cx('form-container')}>
                <div className={cx('form-card')}>
                    <div className={cx('form-content')}>
                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>
                                Mã danh mục <span className={cx('required')}>*</span>
                            </label>
                            <input
                                type="text"
                                className={cx('form-input', { error: errors.id })}
                                placeholder="VD: DM0001"
                                value={formData.id}
                                onChange={(e) => handleInputChange('id', e.target.value)}
                                readOnly={isEditMode}
                                disabled={isEditMode}
                                title={isEditMode ? 'Mã danh mục không thể thay đổi khi cập nhật' : ''}
                            />
                            {isEditMode && (
                                <span className={cx('field-hint')} style={{ fontSize: '0.85em', color: '#666', marginTop: '4px', display: 'block' }}>
                                    Mã danh mục không thể thay đổi
                                </span>
                            )}
                            {errors.id && <span className={cx('error-message')}>{errors.id}</span>}
                        </div>

                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>
                                Tên danh mục <span className={cx('required')}>*</span>
                            </label>
                            <input
                                type="text"
                                className={cx('form-input', { error: errors.name })}
                                placeholder="VD: Sách Giáo Khoa"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                            />
                            {errors.name && <span className={cx('error-message')}>{errors.name}</span>}
                        </div>

                        <div className={cx('form-group')}>
                            <label className={cx('form-label')}>Mô tả</label>
                            <textarea
                                className={cx('form-textarea', { error: errors.description })}
                                placeholder="VD: Danh mục chứa các sách giáo khoa phổ thông."
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={4}
                            />
                            {errors.description && <span className={cx('error-message')}>{errors.description}</span>}
                        </div>

                        <div className={cx('form-row')}>
                            <div className={cx('form-group', 'half')}>
                                <label className={cx('form-label')}>Danh mục cha</label>
                                <select
                                    className={cx('form-select', { error: errors.parentId })}
                                    value={formData.parentId}
                                    onChange={(e) => handleInputChange('parentId', e.target.value)}
                                    disabled={loadingCategories || (isEditMode && hasChildren)}
                                    title={isEditMode && hasChildren ? 'Danh mục này đang có danh mục con, không thể chuyển thành danh mục con' : ''}
                                >
                                    <option value="">-- Không có (Danh mục gốc) --</option>
                                    {rootCategories
                                        .filter(category => category.id !== formData.id) // Prevent self-selection
                                        .map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                </select>
                                {isEditMode && hasChildren && (
                                    <span style={{ fontSize: '0.85em', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                                        Lưu ý: Danh mục này đang có danh mục con bên trong, không thể chọn làm danh mục con của danh mục khác.
                                    </span>
                                )}
                                {errors.parentId && <span className={cx('error-message')}>{errors.parentId}</span>}
                            </div>

                            <div className={cx('form-group', 'half')}>
                                <label className={cx('form-label')}>Trạng thái hiển thị</label>
                                <div className={cx('toggle-container')}>
                                    <label className={cx('toggle-switch')}>
                                        <input
                                            type="checkbox"
                                            checked={formData.status}
                                            onChange={(e) => handleInputChange('status', e.target.checked)}
                                        />
                                        <span className={cx('toggle-slider')}></span>
                                    </label>
                                    <span className={cx('toggle-label')}>
                                        {formData.status ? 'Hiển thị' : 'Ẩn'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={cx('form-footer')}>
                        <button className={cx('btn', 'cancel-btn')} onClick={handleCancel}>
                            Hủy
                        </button>
                        <button
                            className={cx('btn', 'save-btn')}
                            onClick={handleSave}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Lưu danh mục')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UpdateCategoryPage;
