import {
    getApiBaseUrl,
    getStoredToken as getStoredTokenUtil,
} from '../../../../../services/utils';
import { normalizeMediaUrl } from '../../../../../services/productUtils';
import { uploadProductMedia } from '../../../../../services';
import { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import styles from './UpdateProductPage.module.scss';
import backIcon from '../../../../../assets/icons/icon_back.png';
import Notification from '../../../../../components/Common/Notification';

const cx = classNames.bind(styles);

// ========== Constants ==========
const API_BASE_URL = getApiBaseUrl();

function UpdateProductPage() {
    // ========== State Management ==========
    const navigate = useNavigate();
    const { id } = useParams();
    const formRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProduct, setLoadingProduct] = useState(true);

    // Notification state
    const [notifyOpen, setNotifyOpen] = useState(false);
    const [notifyType, setNotifyType] = useState('info');
    const [notifyMsg, setNotifyMsg] = useState('');

    // Form fields state
    const [productId, setProductId] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [brand, setBrand] = useState('');
    const [shadeColor, setShadeColor] = useState('');
    const [skinType, setSkinType] = useState('');
    const [skinConcern, setSkinConcern] = useState('');
    const [volume, setVolume] = useState('');
    const [origin, setOrigin] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [usageInstructions, setUsageInstructions] = useState('');
    const [safetyNote, setSafetyNote] = useState('');
    const [weight, setWeight] = useState(0.0);
    const [length, setLength] = useState(1);
    const [width, setWidth] = useState(1);
    const [height, setHeight] = useState(1);
    const [price, setPrice] = useState(0.0);
    const [purchasePrice, setPurchasePrice] = useState('');
    const [taxPercent, setTaxPercent] = useState('0');
    const [discountValue, setDiscountValue] = useState(0.0);
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [stockQuantity, setStockQuantity] = useState('');
    const [status, setStatus] = useState('PENDING');
    const [errors, setErrors] = useState({});

    // Track original values để so sánh thay đổi
    const [originalValues, setOriginalValues] = useState({});

    // Media state (local files + existing media)
    const [mediaFiles, setMediaFiles] = useState([]); // [{file, type, preview, isDefault, uploadedUrl?}]
    const [defaultMediaUrl, setDefaultMediaUrl] = useState('');
    const [existingMediaUrls, setExistingMediaUrls] = useState([]); // Existing media URLs from product
    const [removedExistingMediaUrls, setRemovedExistingMediaUrls] = useState([]); // URLs đã bị xóa bởi user

    // ========== Helper Functions ==========
    const getStoredToken = (key) => getStoredTokenUtil(key);

    // ========== Data Fetching ==========

    // Fetch product data
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                setLoadingProduct(true);
                const tokenToUse = getStoredToken('token');
                const resp = await fetch(`${API_BASE_URL}/products/${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
                    },
                });

                if (!resp.ok) {
                    throw new Error('Không thể tải thông tin sản phẩm');
                }

                const data = await resp.json().catch(() => ({}));
                const product = data?.result || data;

                // Fill form with product data
                setProductId(product.id || id || '');
                setName(product.name || '');
                setDescription(product.description || '');
                setBrand(product.brand || '');
                setShadeColor(product.shadeColor || '');
                setSkinType(product.skinType || '');
                setSkinConcern(product.skinConcern || '');
                setVolume(product.volume || '');
                setOrigin(product.origin || '');
                setExpiryDate(
                    product.expiryDate ? product.expiryDate.split('T')[0] : '',
                );
                setIngredients(product.ingredients || '');
                setUsageInstructions(product.usageInstructions || '');
                setSafetyNote(product.safetyNote || '');
                setWeight(product.weight || 0.0);
                setLength(product.length || 1);
                setWidth(product.width || 1);
                setHeight(product.height || 1);
                const basePrice =
                    product.unitPrice !== undefined && product.unitPrice !== null
                        ? product.unitPrice
                        : product.price || 0.0;
                setPrice(basePrice);
                setPurchasePrice(
                    product.purchasePrice !== undefined && product.purchasePrice !== null
                        ? product.purchasePrice
                        : '',
                );
                setTaxPercent(product.tax ? String(Math.round(product.tax * 100)) : '0');
                setDiscountValue(product.discountValue || 0.0);
                setCategoryId(product.categoryId || '');
                const inventoryQuantity = product.stockQuantity ?? null;
                setStockQuantity(
                    inventoryQuantity !== undefined && inventoryQuantity !== null
                        ? String(inventoryQuantity)
                        : '',
                );
                setStatus(product.status || 'PENDING');

                // Lưu giá trị ban đầu để so sánh
                setOriginalValues({
                    unitPrice: basePrice,
                    price: product.price || 0.0,
                    tax: product.tax || 0,
                    discountValue: product.discountValue || 0.0,
                    categoryId: product.categoryId || '',
                    promotionId: product.promotionId || null,
                    stockQuantity: inventoryQuantity !== undefined && inventoryQuantity !== null ? inventoryQuantity : 0,
                });

                // Set existing media
                if (product.mediaUrls && Array.isArray(product.mediaUrls)) {
                    setExistingMediaUrls(product.mediaUrls);
                    if (product.defaultMediaUrl) {
                        setDefaultMediaUrl(product.defaultMediaUrl);
                    } else if (product.mediaUrls.length > 0) {
                        setDefaultMediaUrl(product.mediaUrls[0]);
                    }
                }
            } catch (err) {
                console.error('Error fetching product:', err);
                setNotifyType('error');
                setNotifyMsg('Không thể tải thông tin sản phẩm. Vui lòng thử lại.');
                setNotifyOpen(true);
            } finally {
                setLoadingProduct(false);
            }
        };

        fetchProduct();
    }, [id]);

    // Fetch danh sách danh mục từ API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const tokenToUse = getStoredToken('token');
                const resp = await fetch(`${API_BASE_URL}/categories/active`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}),
                    },
                });
                const data = await resp.json().catch(() => ({}));
                const list = data?.result || data || [];
                setCategories(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setCategories([]);
            }
        };
        fetchCategories();
    }, []);

    // ========== Validation ==========
    const validate = () => {
        const newErrors = {};
        if (!productId.trim()) newErrors.productId = 'Vui lòng nhập mã sản phẩm.';
        if (!name.trim()) newErrors.name = 'Vui lòng nhập tên sản phẩm.';
        if (!brand.trim()) newErrors.brand = 'Vui lòng nhập thương hiệu.';
        if (!categoryId) newErrors.categoryId = 'Vui lòng chọn danh mục.';

        // Validate price - must be a valid number and >= 0
        const priceNum = Number(price);
        if (isNaN(priceNum) || priceNum < 0) {
            newErrors.price = 'Giá không hợp lệ. Vui lòng nhập số lớn hơn hoặc bằng 0.';
        }

        if (
            purchasePrice !== undefined &&
            purchasePrice !== null &&
            purchasePrice !== ''
        ) {
            const purchaseNum = Number(purchasePrice);
            if (Number.isNaN(purchaseNum) || purchaseNum < 0) {
                newErrors.purchasePrice = 'Giá nhập phải lớn hơn hoặc bằng 0.';
            }
        }

        // Validate dimensions - only if provided, must be >= 1
        if (length !== undefined && length !== null && length !== '') {
            const lengthNum = Number(length);
            if (isNaN(lengthNum) || lengthNum < 1) {
                newErrors.length = 'Chiều dài tối thiểu là 1.';
            }
        }
        if (width !== undefined && width !== null && width !== '') {
            const widthNum = Number(width);
            if (isNaN(widthNum) || widthNum < 1) {
                newErrors.width = 'Chiều rộng tối thiểu là 1.';
            }
        }
        if (height !== undefined && height !== null && height !== '') {
            const heightNum = Number(height);
            if (isNaN(heightNum) || heightNum < 1) {
                newErrors.height = 'Chiều cao tối thiểu là 1.';
            }
        }
        if (weight !== undefined && weight !== null && weight !== '') {
            const weightNum = Number(weight);
            if (isNaN(weightNum) || weightNum < 0) {
                newErrors.weight = 'Trọng lượng tối thiểu là 0.';
            }
        }
        if (stockQuantity !== undefined && stockQuantity !== null && stockQuantity !== '') {
            const quantityNum = Number(stockQuantity);
            if (Number.isNaN(quantityNum) || quantityNum < 0) {
                newErrors.stockQuantity = 'Số lượng tồn kho tối thiểu là 0.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ========== Computed Values ==========

    // Tính thuế dưới dạng decimal (0.05 = 5%)
    const taxDecimal = useMemo(() => {
        const n = Number.parseInt(
            (taxPercent || '0').toString().replace(/[^0-9]/g, ''),
            10,
        );
        if (Number.isNaN(n)) return 0;
        const clamped = Math.max(0, Math.min(100, n));
        return clamped / 100;
    }, [taxPercent]);

    // Tính giá cuối cùng sau thuế
    const finalPrice = useMemo(() => {
        const p = Number(price) || 0;
        return Math.round(p * (1 + taxDecimal));
    }, [price, taxDecimal]);

    // ========== API Helpers ==========

    // Refresh token nếu cần (khi token hết hạn)
    const refreshTokenIfNeeded = async () => {
        const refreshToken = getStoredToken('refreshToken');
        if (!refreshToken) return null;
        try {
            const resp = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: refreshToken }),
            });
            const data = await resp.json().catch(() => ({}));
            if (resp.ok && data?.result?.token) {
                localStorage.setItem('token', data.result.token);
                localStorage.setItem('refreshToken', data.result.token);
                return data.result.token;
            }
        } catch (_) { }
        return null;
    };

    // ========== Event Handlers ==========

    /**
     * Kiểm tra xem có thay đổi trường cần duyệt 
     * Trường cần duyệt: giá cả, danh mục, khuyến mãi, tồn kho (nếu thay đổi lớn)
     */
    const checkIfRequiresApproval = () => {
        const currentPrice = Number(price) || 0;
        const currentTax = Number(taxPercent) / 100 || 0;
        const currentDiscount = Number(discountValue) || 0;
        const currentStock = Number(stockQuantity) || 0;

        // Kiểm tra thay đổi giá cả
        if (originalValues.unitPrice !== currentPrice) return true;
        if (originalValues.tax !== currentTax) return true;
        if (originalValues.discountValue !== currentDiscount) return true;

        // Kiểm tra thay đổi danh mục
        if (originalValues.categoryId !== categoryId) return true;

        // Kiểm tra thay đổi tồn kho (> 50% hoặc từ 0 sang > 0 hoặc ngược lại)
        const originalStock = originalValues.stockQuantity || 0;
        if (originalStock !== currentStock) {
            if (originalStock === 0 && currentStock > 0) return true;
            if (originalStock > 0 && currentStock === 0) return true;
            if (originalStock > 0) {
                const changePercent = Math.abs((currentStock - originalStock) / originalStock) * 100;
                if (changePercent > 50) return true;
            }
        }

        return false;
    };

    /**
     * Xử lý submit form
     * 1. Validate form
     * 2. Upload media files (nếu có file mới)
     * 3. Update sản phẩm (có thể cần duyệt nếu thay đổi trường quan trọng)
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true);
        if (!validate()) {
            setIsLoading(false);
            setNotifyType('error');
            setNotifyMsg('Vui lòng điền đầy đủ thông tin bắt buộc.');
            setNotifyOpen(true);
            return;
        }
        try {
            let token = getStoredToken('token');
            if (!token) {
                setIsLoading(false);
                setNotifyType('error');
                setNotifyMsg('Thiếu token xác thực. Vui lòng đăng nhập lại.');
                setNotifyOpen(true);
                return;
            }

            // Upload new media files if any
            let imageUrls = [];
            let videoUrls = [];
            let finalDefaultMediaUrl = defaultMediaUrl;

            if (mediaFiles.length > 0) {
                const filesToUpload = mediaFiles.filter((m) => m.file && !m.uploadedUrl);
                if (filesToUpload.length > 0) {
                    const fileArray = filesToUpload.map((m) => m.file);
                    let uploadResult = await uploadProductMedia(fileArray, token);

                    // Retry with refreshed token if 401
                    if (!uploadResult.ok && uploadResult.status === 401) {
                        const newToken = await refreshTokenIfNeeded();
                        if (newToken) {
                            token = newToken;
                            uploadResult = await uploadProductMedia(fileArray, token);
                        }
                    }

                    if (!uploadResult.ok || !uploadResult.urls || uploadResult.urls.length === 0) {
                        setIsLoading(false);
                        setNotifyType('error');
                        setNotifyMsg(uploadResult.message || 'Upload media thất bại. Vui lòng thử lại.');
                        setNotifyOpen(true);
                        return;
                    }

                    // Map uploaded URLs and add to arrays immediately
                    let urlIndex = 0;
                    const updatedMediaFiles = mediaFiles.map((m) => {
                        if (m.file && !m.uploadedUrl) {
                            const uploadedUrl = uploadResult.urls[urlIndex++];
                            if (m.type === 'IMAGE') {
                                imageUrls.push(uploadedUrl);
                            } else {
                                videoUrls.push(uploadedUrl);
                            }
                            return { ...m, uploadedUrl };
                        }
                        // If already has uploadedUrl, add to arrays
                        if (m.uploadedUrl) {
                            if (m.type === 'IMAGE') {
                                imageUrls.push(m.uploadedUrl);
                            } else {
                                videoUrls.push(m.uploadedUrl);
                            }
                        }
                        return m;
                    });
                    setMediaFiles(updatedMediaFiles);
                } else {
                    // No new files to upload, but add existing uploaded URLs from mediaFiles
                    mediaFiles.forEach((m) => {
                        if (m.uploadedUrl) {
                            if (m.type === 'IMAGE') {
                                imageUrls.push(m.uploadedUrl);
                            } else {
                                videoUrls.push(m.uploadedUrl);
                            }
                        }
                    });
                }

                // Add existing media URLs from product (chỉ những URL chưa bị xóa)
                existingMediaUrls
                    .filter((url) => !removedExistingMediaUrls.includes(url))
                    .forEach((url) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                        if (isImage) {
                            imageUrls.push(url);
                        } else {
                            videoUrls.push(url);
                        }
                    });

                // Set default media URL - prioritize new default, then existing default, then first available
                const defaultMedia = mediaFiles.find((m) => m.isDefault);
                const remainingExistingUrls = existingMediaUrls.filter(
                    (url) => !removedExistingMediaUrls.includes(url)
                );
                if (defaultMedia && defaultMedia.uploadedUrl) {
                    // New media file marked as default and already uploaded
                    finalDefaultMediaUrl = defaultMedia.uploadedUrl;
                } else if (defaultMediaUrl && remainingExistingUrls.includes(defaultMediaUrl)) {
                    // Giữ nguyên default media URL nếu nó vẫn còn trong danh sách và không bị xóa
                    finalDefaultMediaUrl = defaultMediaUrl;
                } else if (imageUrls.length > 0) {
                    // Lấy ảnh đầu tiên làm default
                    finalDefaultMediaUrl = imageUrls[0];
                } else if (videoUrls.length > 0) {
                    // Lấy video đầu tiên làm default
                    finalDefaultMediaUrl = videoUrls[0];
                }
            } else {
                // Keep existing media (chỉ những URL chưa bị xóa)
                existingMediaUrls
                    .filter((url) => !removedExistingMediaUrls.includes(url))
                    .forEach((url) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                        if (isImage) {
                            imageUrls.push(url);
                        } else {
                            videoUrls.push(url);
                        }
                    });
                // Keep existing default if no new media
                const remainingExistingUrls = existingMediaUrls.filter(
                    (url) => !removedExistingMediaUrls.includes(url)
                );
                if (defaultMediaUrl && remainingExistingUrls.includes(defaultMediaUrl)) {
                    finalDefaultMediaUrl = defaultMediaUrl;
                } else if (imageUrls.length > 0) {
                    finalDefaultMediaUrl = imageUrls[0];
                } else if (videoUrls.length > 0) {
                    finalDefaultMediaUrl = videoUrls[0];
                }
            }

            const payload = {
                name: (name || '').trim(),
                description: (description || '').trim() || null,
                brand: (brand || '').trim(),
                shadeColor: (shadeColor || '').trim() || null,
                skinType: (skinType || '').trim() || null,
                skinConcern: (skinConcern || '').trim() || null,
                volume: (volume || '').trim() || null,
                origin: (origin || '').trim() || null,
                expiryDate: expiryDate || null,
                ingredients: (ingredients || '').trim() || null,
                usageInstructions: (usageInstructions || '').trim() || null,
                safetyNote: (safetyNote || '').trim() || null,
                unitPrice: Number(price) || 0,
                price: Number.isFinite(finalPrice) ? finalPrice : 0,
                tax: taxDecimal || 0,
                categoryId: (categoryId || '').trim(),
            };

            // Chỉ thêm các field optional nếu có giá trị hợp lệ
            if (weight && Number(weight) > 0) {
                payload.weight = Number(weight);
            }
            if (length && Number(length) >= 1) {
                payload.length = Number(length);
            }
            if (width && Number(width) >= 1) {
                payload.width = Number(width);
            }
            if (height && Number(height) >= 1) {
                payload.height = Number(height);
            }
            if (
                purchasePrice !== undefined &&
                purchasePrice !== null &&
                purchasePrice !== ''
            ) {
                const purchaseNum = Number(purchasePrice);
                if (!isNaN(purchaseNum) && purchaseNum >= 0) {
                    payload.purchasePrice = purchaseNum;
                }
            }
            if (discountValue && Number(discountValue) > 0) {
                payload.discountValue = Number(discountValue);
            }
            if (
                stockQuantity !== undefined &&
                stockQuantity !== null &&
                stockQuantity !== ''
            ) {
                const quantityNum = Number(stockQuantity);
                if (!isNaN(quantityNum) && quantityNum >= 0) {
                    payload.stockQuantity = quantityNum;
                }
            }

            // Only include media if we have URLs
            if (imageUrls.length > 0) payload.imageUrls = imageUrls;
            if (videoUrls.length > 0) payload.videoUrls = videoUrls;
            if (finalDefaultMediaUrl) payload.defaultMediaUrl = finalDefaultMediaUrl;

            console.log('Update request data:', JSON.stringify(payload, null, 2));

            let response = await fetch(`${API_BASE_URL}/products/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            let data = {};
            try {
                const responseText = await response.text();
                if (responseText) {
                    data = JSON.parse(responseText);
                    console.log('Response data:', JSON.stringify(data, null, 2));
                }
            } catch (err) {
                console.error('Error parsing response:', err);
                const text = await response.text().catch(() => '');
                console.log('Response text:', text);
            }

            // Nếu hết hạn -> thử refresh và gọi lại 1 lần
            if (response.status === 401) {
                const newToken = await refreshTokenIfNeeded();
                if (newToken) {
                    token = newToken;
                    response = await fetch(`${API_BASE_URL}/products/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(payload),
                    });
                    try {
                        const responseText = await response.text();
                        if (responseText) {
                            data = JSON.parse(responseText);
                            console.log('Retry response data:', JSON.stringify(data, null, 2));
                        }
                    } catch (err) {
                        console.error('Error parsing retry response:', err);
                        const text = await response.text().catch(() => '');
                        console.log('Retry response text:', text);
                    }
                } else {
                    setIsLoading(false);
                    setNotifyType('error');
                    setNotifyMsg('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    setNotifyOpen(true);
                    return;
                }
            }

            // Kiểm tra response sau khi retry
            if (response.ok) {
                const result = data?.result || data;
                const requiresApproval = checkIfRequiresApproval();

                setNotifyType('success');
                if (requiresApproval) {
                    setNotifyMsg('Cập nhật sản phẩm thành công. Sản phẩm đã được gửi lại để duyệt do có thay đổi về giá cả, danh mục hoặc tồn kho.');
                } else {
                    setNotifyMsg('Cập nhật sản phẩm thành công.');
                }
                setNotifyOpen(true);
                // Navigate back to product detail after delay (thêm thời gian để đọc thông báo nếu cần duyệt)
                setTimeout(() => {
                    navigate(`/staff/products/${id}`, { replace: true });
                }, requiresApproval ? 2500 : 1500);
            } else {
                // Extract error message from response
                const serverMsg = data?.message || data?.error || data?.result || '';
                console.error('Update failed:', {
                    status: response.status,
                    statusText: response.statusText,
                    data: data,
                    serverMsg: serverMsg
                });

                let errorMessage =
                    serverMsg || 'Cập nhật sản phẩm thất bại. Vui lòng thử lại.';

                if (response.status === 403) {
                    errorMessage = 'Bạn không có quyền thực hiện hành động này.';
                } else if (response.status === 401) {
                    errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                } else if (response.status === 400) {
                    if (serverMsg) {
                        errorMessage = `Dữ liệu không hợp lệ: ${serverMsg}`;
                    } else {
                        errorMessage =
                            'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
                    }
                } else if (response.status >= 500) {
                    errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
                }

                setNotifyType('error');
                setNotifyMsg(errorMessage);
                setNotifyOpen(true);
            }
        } catch (err) {
            console.error('Error updating product:', err);
            const msg = 'Không thể kết nối máy chủ. Vui lòng thử lại.';
            setNotifyType('error');
            setNotifyMsg(msg);
            setNotifyOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Loading state
    if (loadingProduct) {
        return (
            <div className={cx('wrap')}>
                <div className={cx('loading')}>Đang tải thông tin sản phẩm...</div>
            </div>
        );
    }

    return (
        <div className={cx('wrap')}>
            <div className={cx('topbar')}>
                <button
                    className={cx('backBtn')}
                    onClick={() => navigate(`/staff/products/${id}`, { replace: true })}
                >
                    <img src={backIcon} alt="Quay lại" className={cx('backIcon')} />
                </button>
            </div>
            <div className={cx('card')}>
                <h3>Chỉnh sửa sản phẩm</h3>
                <form ref={formRef} className={cx('form')} onSubmit={handleSubmit}>
                    <div className={cx('row')}>
                        <label>Mã sản phẩm</label>
                        <input
                            placeholder="VD: BK001"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                        />
                        {errors.productId && (
                            <div className={cx('errorText')}>{errors.productId}</div>
                        )}
                    </div>
                    <div className={cx('row')}>
                        <label>Tên sản phẩm</label>
                        <input
                            placeholder="VD: Kem dưỡng ẩm cho da khô"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        {errors.name && (
                            <div className={cx('errorText')}>{errors.name}</div>
                        )}
                    </div>
                    <div className={cx('row')}>
                        <label>Thương hiệu <span style={{ color: 'red' }}>*</span></label>
                        <input
                            placeholder="VD: L'Oreal, Maybelline, Innisfree"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                        />
                        {errors.brand && (
                            <div className={cx('errorText')}>{errors.brand}</div>
                        )}
                    </div>
                    <div className={cx('grid2')}>
                        <div className={cx('row')}>
                            <label>Màu sắc</label>
                            <input
                                placeholder="VD: #Nude, #Coral, #Rose"
                                value={shadeColor}
                                onChange={(e) => setShadeColor(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className={cx('grid2')}>
                        <div className={cx('row')}>
                            <label>Loại da</label>
                            <input
                                placeholder="VD: Da khô, Da dầu, Da hỗn hợp"
                                value={skinType}
                                onChange={(e) => setSkinType(e.target.value)}
                            />
                        </div>
                        <div className={cx('row')}>
                            <label>Vấn đề da</label>
                            <input
                                placeholder="VD: Mụn, Lão hóa, Nhạy cảm"
                                value={skinConcern}
                                onChange={(e) => setSkinConcern(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className={cx('grid2')}>
                        <div className={cx('row')}>
                            <label>Dung tích</label>
                            <input
                                placeholder="VD: 30ml, 50g, 100ml"
                                value={volume}
                                onChange={(e) => setVolume(e.target.value)}
                            />
                        </div>
                        <div className={cx('row')}>
                            <label>Xuất xứ</label>
                            <input
                                placeholder="VD: Hàn Quốc, Pháp, Mỹ"
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className={cx('row')}>
                        <label>Hạn sử dụng</label>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                        />
                    </div>
                    <div className={cx('row')}>
                        <label>Thành phần</label>
                        <textarea
                            rows={3}
                            placeholder="Liệt kê các thành phần chính (VD: Hyaluronic Acid, Vitamin C, Retinol...)"
                            value={ingredients}
                            onChange={(e) => setIngredients(e.target.value)}
                        />
                    </div>
                    <div className={cx('row')}>
                        <label>Hướng dẫn sử dụng</label>
                        <textarea
                            rows={3}
                            placeholder="Hướng dẫn cách sử dụng sản phẩm"
                            value={usageInstructions}
                            onChange={(e) => setUsageInstructions(e.target.value)}
                        />
                    </div>
                    <div className={cx('row')}>
                        <label>Lưu ý an toàn</label>
                        <textarea
                            rows={2}
                            placeholder="Các lưu ý về an toàn khi sử dụng sản phẩm"
                            value={safetyNote}
                            onChange={(e) => setSafetyNote(e.target.value)}
                        />
                    </div>
                    <div className={cx('row')}>
                        <label>Giá niêm yết (VND)</label>
                        <input
                            placeholder="VD: 150000"
                            inputMode="numeric"
                            value={price}
                            onChange={(e) =>
                                setPrice(
                                    Number(e.target.value.replace(/[^0-9]/g, '')) || 0,
                                )
                            }
                        />
                        {errors.price && (
                            <div className={cx('errorText')}>{errors.price}</div>
                        )}
                    </div>
                    <div className={cx('row')}>
                        <label>Giá nhập (VND)</label>
                        <input
                            placeholder="VD: 90000"
                            inputMode="numeric"
                            value={purchasePrice}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                setPurchasePrice(raw === '' ? '' : Number(raw));
                            }}
                        />
                        {errors.purchasePrice && (
                            <div className={cx('errorText')}>{errors.purchasePrice}</div>
                        )}
                    </div>
                    <div className={cx('grid3')}>
                        <div className={cx('row')}>
                            <label>Danh mục mỹ phẩm</label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                <option value="">--Chọn danh mục--</option>
                                {categories.map((c) => (
                                    <option
                                        key={c.id || c.categoryId}
                                        value={c.id || c.categoryId}
                                    >
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            {errors.categoryId && (
                                <div className={cx('errorText')}>{errors.categoryId}</div>
                            )}
                        </div>
                        <div className={cx('row')}>
                            <label>Thuế (%)</label>
                            <div className={cx('inputSuffix')}>
                                <input
                                    placeholder="Ví dụ: 5 hoặc 10"
                                    inputMode="numeric"
                                    value={taxPercent}
                                    onChange={(e) => setTaxPercent(e.target.value)}
                                />
                                <span className={cx('suffix')}>%</span>
                            </div>
                        </div>
                    </div>
                    <div className={cx('row')}>
                        <label>Giá cuối cùng (đã gồm thuế)</label>
                        <input placeholder="Tự động tính" value={finalPrice} readOnly />
                    </div>

                    <div className={cx('row', 'dimension')}>
                        <label>Kích thước (cm) & Trọng lượng</label>
                        <div className={cx('grid4')}>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="Dài (cm)"
                                value={length}
                                onChange={(e) => {
                                    const raw = (e.target.value || '').replace(',', '.');
                                    const cleaned = raw.replace(/[^0-9.]/g, '');
                                    if (cleaned === '') {
                                        setLength('');
                                        return;
                                    }
                                    const n = Number(cleaned);
                                    setLength(Number.isNaN(n) ? 0 : n);
                                }}
                            />
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="Rộng (cm)"
                                value={width}
                                onChange={(e) => {
                                    const raw = (e.target.value || '').replace(',', '.');
                                    const cleaned = raw.replace(/[^0-9.]/g, '');
                                    if (cleaned === '') {
                                        setWidth('');
                                        return;
                                    }
                                    const n = Number(cleaned);
                                    setWidth(Number.isNaN(n) ? 0 : n);
                                }}
                            />
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="Cao (cm)"
                                value={height}
                                onChange={(e) => {
                                    const raw = (e.target.value || '').replace(',', '.');
                                    const cleaned = raw.replace(/[^0-9.]/g, '');
                                    if (cleaned === '') {
                                        setHeight('');
                                        return;
                                    }
                                    const n = Number(cleaned);
                                    setHeight(Number.isNaN(n) ? 0 : n);
                                }}
                            />
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                placeholder="Trọng lượng (g)"
                                value={weight}
                                onChange={(e) => {
                                    const raw = (e.target.value || '').replace(',', '.');
                                    const cleaned = raw.replace(/[^0-9.]/g, '');
                                    if (cleaned === '') {
                                        setWeight('');
                                        return;
                                    }
                                    const n = Number(cleaned);
                                    setWeight(Number.isNaN(n) ? 0 : n);
                                }}
                            />
                        </div>
                        <div className={cx('grid4')}>
                            <div>
                                {errors.length && (
                                    <div className={cx('errorText')}>{errors.length}</div>
                                )}
                            </div>
                            <div>
                                {errors.width && (
                                    <div className={cx('errorText')}>{errors.width}</div>
                                )}
                            </div>
                            <div>
                                {errors.height && (
                                    <div className={cx('errorText')}>{errors.height}</div>
                                )}
                            </div>
                            <div>
                                {errors.weight && (
                                    <div className={cx('errorText')}>{errors.weight}</div>
                                )}
                            </div>
                        </div>
                        <div className={cx('example')}>
                            Ví dụ kích thước: <strong>19.8 × 12.9 × 1.5 cm</strong>
                        </div>
                    </div>
                    <div className={cx('row')}>
                        <label>Chọn ảnh/video (thêm mới)</label>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                const mapped = files.map((f) => ({
                                    file: f,
                                    type: f.type.startsWith('image') ? 'IMAGE' : 'VIDEO',
                                    preview: URL.createObjectURL(f),
                                    isDefault: false,
                                }));
                                setMediaFiles((prev) => {
                                    const next = [...prev, ...mapped];
                                    if (
                                        next.length > 0 &&
                                        !next.some((m) => m.isDefault)
                                    ) {
                                        next[0].isDefault = true;
                                    }
                                    return next;
                                });
                            }}
                        />
                        {/* Show existing media */}
                        {existingMediaUrls.filter((url) => !removedExistingMediaUrls.includes(url)).length > 0 && (
                            <div className={cx('existingMedia')}>
                                <div className={cx('existingMediaLabel')}>
                                    Ảnh/video hiện tại:
                                </div>
                                <div className={cx('mediaList')}>
                                    {existingMediaUrls
                                        .filter((url) => !removedExistingMediaUrls.includes(url))
                                        .map((url, idx) => {
                                            const normalizedUrl = normalizeMediaUrl(
                                                url,
                                                API_BASE_URL,
                                            );
                                            const isImage =
                                                /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                                            return (
                                                <div key={idx} className={cx('mediaItem')}>
                                                    {isImage ? (
                                                        <img
                                                            src={normalizedUrl}
                                                            alt="existing"
                                                            className={cx('mediaPreview')}
                                                        />
                                                    ) : (
                                                        <video
                                                            src={normalizedUrl}
                                                            className={cx('mediaPreview')}
                                                            controls
                                                        />
                                                    )}
                                                    <div className={cx('mediaActions')}>
                                                        <label
                                                            className={cx('defaultToggle')}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="defaultMedia"
                                                                checked={
                                                                    defaultMediaUrl === url
                                                                }
                                                                onChange={async () => {
                                                                    try {
                                                                        setDefaultMediaUrl(
                                                                            url,
                                                                        );
                                                                        const token =
                                                                            getStoredToken(
                                                                                'token',
                                                                            );
                                                                        await fetch(
                                                                            `${API_BASE_URL}/products/${id}/default-media?mediaUrl=${encodeURIComponent(
                                                                                url,
                                                                            )}`,
                                                                            {
                                                                                method: 'POST',
                                                                                headers: {
                                                                                    ...(token
                                                                                        ? {
                                                                                            Authorization: `Bearer ${token}`,
                                                                                        }
                                                                                        : {}),
                                                                                },
                                                                            },
                                                                        );
                                                                    } catch (_) { }
                                                                }}
                                                            />
                                                            Mặc định
                                                        </label>
                                                        <button
                                                            type="button"
                                                            className={cx('btn', 'muted')}
                                                            onClick={() => {
                                                                // Thêm vào danh sách đã xóa
                                                                setRemovedExistingMediaUrls((prev) => [...prev, url]);
                                                                // Nếu đây là default media, set default về media đầu tiên còn lại
                                                                if (defaultMediaUrl === url) {
                                                                    const remaining = existingMediaUrls.filter(
                                                                        (u) => u !== url && !removedExistingMediaUrls.includes(u)
                                                                    );
                                                                    if (remaining.length > 0) {
                                                                        setDefaultMediaUrl(remaining[0]);
                                                                    } else if (mediaFiles.length > 0) {
                                                                        // Nếu không còn existing media, dùng media file đầu tiên
                                                                        const firstMedia = mediaFiles.find((m) => m.isDefault) || mediaFiles[0];
                                                                        if (firstMedia) {
                                                                            setDefaultMediaUrl(firstMedia.uploadedUrl || firstMedia.preview || '');
                                                                        }
                                                                    } else {
                                                                        setDefaultMediaUrl('');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                        {/* Show new media files */}
                        {mediaFiles.length > 0 && (
                            <div className={cx('mediaList')}>
                                {mediaFiles.map((m, idx) => (
                                    <div key={idx} className={cx('mediaItem')}>
                                        {m.type === 'IMAGE' ? (
                                            <img
                                                src={m.preview}
                                                alt="preview"
                                                className={cx('mediaPreview')}
                                            />
                                        ) : (
                                            <video
                                                src={m.preview}
                                                className={cx('mediaPreview')}
                                                controls
                                            />
                                        )}
                                        <div className={cx('mediaActions')}>
                                            <label className={cx('defaultToggle')}>
                                                <input
                                                    type="radio"
                                                    name="defaultMedia"
                                                    checked={m.isDefault}
                                                    onChange={() => {
                                                        setMediaFiles((prev) =>
                                                            prev.map((x, i) => ({
                                                                ...x,
                                                                isDefault: i === idx,
                                                            })),
                                                        );
                                                    }}
                                                />
                                                Mặc định
                                            </label>
                                            <button
                                                type="button"
                                                className={cx('btn', 'muted')}
                                                onClick={() => {
                                                    setMediaFiles((prev) => {
                                                        const next = prev.filter(
                                                            (_, i) => i !== idx,
                                                        );
                                                        if (
                                                            next.length > 0 &&
                                                            !next.some((n) => n.isDefault)
                                                        ) {
                                                            next[0].isDefault = true;
                                                        }
                                                        return next;
                                                    });
                                                }}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={cx('row')}>
                        <label>Mô tả sản phẩm</label>
                        <textarea
                            rows={4}
                            placeholder="Mô tả ngắn về sản phẩm"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className={cx('grid2')}>
                        <div className={cx('row')}>
                            <label>Số lượng tồn kho</label>
                            <input
                                inputMode="numeric"
                                placeholder="VD: 100"
                                value={stockQuantity}
                                onChange={(e) => {
                                    const cleaned = (e.target.value || '').replace(
                                        /[^0-9]/g,
                                        '',
                                    );
                                    setStockQuantity(cleaned);
                                }}
                            />
                            {errors.stockQuantity && (
                                <div className={cx('errorText')}>
                                    {errors.stockQuantity}
                                </div>
                            )}
                        </div>
                        <div className={cx('row')}>
                            <label>Trạng thái</label>
                            <input
                                type="text"
                                value={status === 'PENDING' ? 'Chờ duyệt' : status === 'APPROVED' ? 'Đã duyệt' : status === 'REJECTED' ? 'Từ chối' : status === 'DISABLED' ? 'Vô hiệu hóa' : status}
                                readOnly
                                className={cx('readonly')}
                            />
                        </div>
                    </div>

                    {/* Cảnh báo khi thay đổi trường cần duyệt */}
                    {checkIfRequiresApproval() && (
                        <div className={cx('approvalWarning')}>
                            <div className={cx('warningIcon')}>⚠️</div>
                            <div className={cx('warningContent')}>
                                <strong>Lưu ý:</strong> Bạn đã thay đổi các trường quan trọng (giá cả, danh mục hoặc tồn kho).
                                Sản phẩm sẽ được gửi lại để admin duyệt sau khi cập nhật.
                            </div>
                        </div>
                    )}

                    <div className={cx('actions')}>
                        <button
                            type="button"
                            className={cx('btn', 'muted')}
                            onClick={() => navigate(`/staff/products/${id}`)}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className={cx('btn', 'primary')}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang cập nhật...' : 'Cập nhật sản phẩm'}
                        </button>
                    </div>
                </form>
            </div>
            <Notification
                open={notifyOpen}
                type={notifyType}
                title={
                    notifyType === 'success'
                        ? 'Thành công'
                        : notifyType === 'error'
                            ? 'Lỗi'
                            : 'Thông báo'
                }
                message={notifyMsg}
                onClose={() => setNotifyOpen(false)}
            />
        </div>
    );
}

export default UpdateProductPage;

