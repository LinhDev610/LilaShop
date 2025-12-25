import classNames from 'classnames/bind';
import styles from './AddProductPage.module.scss';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import backIcon from '../../../../../assets/icons/icon_back.png';
import { useNotification } from '../../../../../components/Common/Notification';
import {
    getStoredToken as getStoredTokenUtil,
    refreshToken as refreshTokenAPI,
    getActiveCategories,
    createProduct,
    createProductVariant,
    INITIAL_FORM_STATE_PRODUCT,
    CATEGORY_FIELD_CONFIG,
    CLOUDINARY_FOLDERS,
} from '../../../../../services';
import { uploadToCloudinary } from '../../../../../services/CloudinaryService';
import imageCompression from 'browser-image-compression';
import LoadingBar from '../../../../../components/Common/LoadingBar';

const cx = classNames.bind(styles);
const MAX_TOTAL_MEDIA_SIZE = 100 * 1024 * 1024; // 100MB tổng dung lượng ảnh/video

/**
 * Lấy danh sách fields cần hiển thị dựa trên category đã chọn
 * @param {string} categoryId - ID của category
 * @param {Array} categories - Danh sách tất cả categories
 * @returns {Object} Config object với fields và label
 */
const keywordMatch = (text = '', keywords = []) => {
    const lower = text.toLowerCase();
    return keywords.some((k) => lower.includes(k));
};

const findRootCategory = (category, categories) => {
    if (!category) return null;
    let current = category;
    const visited = new Set();
    while (current && (current.parentId || current.parentCategory?.id)) {
        const parentId = current.parentId || current.parentCategory?.id;
        if (!parentId || visited.has(parentId)) break;
        visited.add(parentId);
        const parent = categories.find((c) => (c.id || c.categoryId) === parentId);
        if (!parent) break;
        current = parent;
    }
    return current;
};

// Xác định mode lựa chọn theo danh mục (fragrance, makeup hoặc default)
const getVariantMode = (categoryId, categories) => {
    const selectedCategory = categories.find((c) => (c.id || c.categoryId) === categoryId);
    const root = findRootCategory(selectedCategory, categories) || selectedCategory;
    const name = (root?.name || selectedCategory?.name || '').toLowerCase();
    if (!name) return 'default';
    if (name.includes('nước hoa') || name.includes('fragrance') || name.includes('perfume')) {
        return 'fragrance';
    }
    if (name.includes('trang điểm') || name.includes('makeup') || name.includes('son') || name.includes('phấn')) {
        return 'makeup';
    }
    return 'default';
};

const getFieldsForCategory = (categoryId, categories) => {
    if (!categoryId) {
        return { fields: [], label: '' }; // Chưa chọn category
    }

    if (!categories.length) {
        return { fields: [], label: '' };
    }

    // Tìm category object từ danh sách
    const selectedCategory = categories.find(
        (c) => (c.id || c.categoryId) === categoryId,
    );
    if (!selectedCategory) {
        return { fields: [], label: '' };
    }

    const rootCategory = findRootCategory(selectedCategory, categories) || selectedCategory;
    const rootName = (rootCategory.name || selectedCategory.name || '').toLowerCase();

    // Map theo danh mục cha
    if (rootName.includes('chăm sóc da') || rootName.includes('skincare')) {
        return CATEGORY_FIELD_CONFIG.skincare;
    }
    if (rootName.includes('trang điểm') || rootName.includes('makeup')) {
        return CATEGORY_FIELD_CONFIG.makeup;
    }
    if (rootName.includes('chăm sóc tóc') || rootName.includes('haircare')) {
        return CATEGORY_FIELD_CONFIG.haircare;
    }
    if (rootName.includes('chăm sóc cơ thể') || rootName.includes('bodycare')) {
        return CATEGORY_FIELD_CONFIG.bodycare;
    }
    if (rootName.includes('nước hoa') || rootName.includes('fragrance') || rootName.includes('perfume')) {
        return CATEGORY_FIELD_CONFIG.fragrance;
    }

    // Fallback nhận diện theo từ khóa của danh mục con
    const categoryName = (selectedCategory.name || '').toLowerCase();
    if (keywordMatch(categoryName, ['son', 'lip', 'lipstick', 'lip gloss', 'lip balm'])) {
        return { ...CATEGORY_FIELD_CONFIG.makeup, label: 'Son môi' };
    }
    if (keywordMatch(categoryName, ['phấn', 'foundation', 'cushion', 'bb', 'cc'])) {
        return { ...CATEGORY_FIELD_CONFIG.makeup, label: 'Nền/Phấn' };
    }
    if (keywordMatch(categoryName, ['má hồng', 'blush'])) {
        return { ...CATEGORY_FIELD_CONFIG.makeup, label: 'Má hồng' };
    }
    if (keywordMatch(categoryName, ['serum', 'essence', 'ampoule'])) {
        return { ...CATEGORY_FIELD_CONFIG.skincare, label: 'Serum' };
    }
    if (keywordMatch(categoryName, ['kem chống nắng', 'sunscreen', 'spf'])) {
        return { ...CATEGORY_FIELD_CONFIG.skincare, label: 'Chống nắng' };
    }
    if (keywordMatch(categoryName, ['nước hoa', 'perfume', 'eau'])) {
        return CATEGORY_FIELD_CONFIG.fragrance;
    }

    // Mặc định: không hiển thị fields đặc biệt (chỉ hiển thị fields cơ bản)
    return { fields: [], label: '' };
};

/**
 * Kiểm tra xem một field có nên hiển thị không
 * @param {string} fieldName - Tên field cần kiểm tra
 * @param {string} categoryId - ID category đã chọn
 * @param {Array} categories - Danh sách categories
 * @returns {boolean}
 */
const shouldShowField = (fieldName, categoryId, categories) => {
    const config = getFieldsForCategory(categoryId, categories);

    // Kiểm tra field có trong danh sách không
    return config.fields.includes(fieldName);
};

const emptyVariant = () => ({
    id: crypto.randomUUID(),
    name: '',
    shadeName: '',
    shadeHex: '',
    price: '',
    unitPrice: '',
    taxPercent: '',
    purchasePrice: '',
    finalPrice: '',
    stockQuantity: '',
    isDefault: false,
});

export default function AddProductPage() {
    const navigate = useNavigate();
    const formRef = useRef(null);
    const { success, error: notifyError } = useNotification();
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // State form
    const [productId, setProductId] = useState(INITIAL_FORM_STATE_PRODUCT.productId);
    const [name, setName] = useState(INITIAL_FORM_STATE_PRODUCT.name);
    const [description, setDescription] = useState(
        INITIAL_FORM_STATE_PRODUCT.description,
    );
    const [brand, setBrand] = useState(INITIAL_FORM_STATE_PRODUCT.brand);
    const [shadeColor, setShadeColor] = useState(INITIAL_FORM_STATE_PRODUCT.shadeColor);
    const [skinType, setSkinType] = useState(INITIAL_FORM_STATE_PRODUCT.skinType);
    const [skinConcern, setSkinConcern] = useState(
        INITIAL_FORM_STATE_PRODUCT.skinConcern,
    );
    const [volume, setVolume] = useState(INITIAL_FORM_STATE_PRODUCT.volume);
    const [origin, setOrigin] = useState(INITIAL_FORM_STATE_PRODUCT.origin);
    const [expiryDate, setExpiryDate] = useState(INITIAL_FORM_STATE_PRODUCT.expiryDate);
    const [ingredients, setIngredients] = useState(
        INITIAL_FORM_STATE_PRODUCT.ingredients,
    );
    const [usageInstructions, setUsageInstructions] = useState(
        INITIAL_FORM_STATE_PRODUCT.usageInstructions,
    );
    const [safetyNote, setSafetyNote] = useState(INITIAL_FORM_STATE_PRODUCT.safetyNote);
    const [weight, setWeight] = useState(INITIAL_FORM_STATE_PRODUCT.weight);
    const [length, setLength] = useState(INITIAL_FORM_STATE_PRODUCT.length);
    const [width, setWidth] = useState(INITIAL_FORM_STATE_PRODUCT.width);
    const [height, setHeight] = useState(INITIAL_FORM_STATE_PRODUCT.height);
    const [price, setPrice] = useState(INITIAL_FORM_STATE_PRODUCT.price);
    const [taxPercent, setTaxPercent] = useState(INITIAL_FORM_STATE_PRODUCT.taxPercent);
    const [discountValue, setDiscountValue] = useState(
        INITIAL_FORM_STATE_PRODUCT.discountValue,
    );
    const [purchasePrice, setPurchasePrice] = useState(
        INITIAL_FORM_STATE_PRODUCT.purchasePrice,
    );
    const [categoryId, setCategoryId] = useState(INITIAL_FORM_STATE_PRODUCT.categoryId);
    const [stockQuantity, setStockQuantity] = useState(
        INITIAL_FORM_STATE_PRODUCT.stockQuantity,
    );
    const [mediaFiles, setMediaFiles] = useState(INITIAL_FORM_STATE_PRODUCT.mediaFiles);
    const [errors, setErrors] = useState(INITIAL_FORM_STATE_PRODUCT.errors);
    const [variants, setVariants] = useState([]);
    const [categories, setCategories] = useState([]);
    const [existingProductsMap, setExistingProductsMap] = useState({});
    const variantMode = useMemo(
        () => getVariantMode(categoryId, categories),
        [categoryId, categories],
    );

    // State cho tìm kiếm danh mục
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const categoryDropdownRef = useRef(null);

    const normalizedProductId = useMemo(
        () => (productId || '').trim().toUpperCase(),
        [productId],
    );

    // Filter categories: chỉ hiển thị danh mục con và danh mục gốc không có con
    const displayCategories = useMemo(() => {
        if (!categories.length) return [];

        return categories.filter((category) => {
            // Kiểm tra có parent không
            const hasParent = Boolean(
                category.parentId ||
                category.parentCategory?.id ||
                category.parentCategory,
            );

            // Kiểm tra có subCategories không
            const subCategories = category.subCategories;
            const hasSubCategories = Boolean(
                subCategories && Array.isArray(subCategories) && subCategories.length > 0,
            );

            // Chỉ hiển thị:
            // 1. Danh mục con (có parentId) - luôn hiển thị
            // 2. Danh mục gốc không có con (không có parentId VÀ không có subCategories)
            if (hasParent) {
                return true;
            }

            return !hasSubCategories;
        });
    }, [categories]);

    // Filter categories dựa trên search term (sử dụng displayCategories đã filter)
    const filteredCategories = useMemo(() => {
        if (!categorySearchTerm.trim()) {
            return displayCategories;
        }
        const searchLower = categorySearchTerm.toLowerCase().trim();
        return displayCategories.filter((c) => {
            const name = (c.name || '').toLowerCase();
            return name.includes(searchLower);
        });
    }, [displayCategories, categorySearchTerm]);

    // Đóng dropdown khi click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                categoryDropdownRef.current &&
                !categoryDropdownRef.current.contains(event.target)
            ) {
                setIsCategoryDropdownOpen(false);
                setCategorySearchTerm(''); // Reset search khi đóng
            }
        };

        if (isCategoryDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCategoryDropdownOpen]);

    // ========== Helper Functions ==========
    const getStoredToken = useCallback((key) => getStoredTokenUtil(key), []);

    // Hàm xử lý số thập phân (cho length, width, height, weight)
    const handleDecimalInput = useCallback((value, setter) => {
        const raw = (value || '').replace(',', '.');
        const cleaned = raw.replace(/[^0-9.]/g, '');
        if (cleaned === '') {
            setter('');
            return;
        }
        const n = Number(cleaned);
        setter(Number.isNaN(n) ? 0 : n);
    }, []);

    // Kiểm tra xem mã sản phẩm đã tồn tại chưa
    const hasDuplicateProductId = useCallback(
        (id) => Boolean(id && existingProductsMap[id]),
        [existingProductsMap],
    );

    // Thông báo lỗi khi mã sản phẩm đã tồn tại
    const notifyDuplicateProductId = useCallback(
        (id) => {
            if (!id) return;
            const message = `Mã sản phẩm ${id} đã tồn tại. Vui lòng chọn mã khác.`;
            notifyError(message);
            setErrors((prev) => ({
                ...prev,
                id: 'Mã sản phẩm đã tồn tại. Vui lòng chọn mã khác.',
            }));
        },
        [notifyError],
    );

    // Lưu mã sản phẩm đã tồn tại vào state
    const rememberProductId = useCallback((id, productName) => {
        if (!id) return;
        setExistingProductsMap((prev) => {
            if (prev[id]) return prev;
            return {
                ...prev,
                [id]: productName || id,
            };
        });
    }, []);

    // Kiểm tra xem token có hợp lệ không
    const ensureAuthToken = useCallback(() => {
        const tokenValue = getStoredToken('token');
        if (!tokenValue) {
            notifyError('Thiếu token xác thực. Vui lòng đăng nhập lại.');
        }
        return tokenValue;
    }, [getStoredToken, notifyError]);

    // Refresh token nếu cần (khi token hết hạn)
    const refreshTokenIfNeeded = useCallback(async () => {
        const refreshToken = getStoredToken('refreshToken');
        if (!refreshToken) return null;
        try {
            const { ok, data: responseData } = await refreshTokenAPI(refreshToken);
            if (ok && responseData?.token) {
                localStorage.setItem('token', responseData.token);
                localStorage.setItem('refreshToken', responseData.token);
                return responseData.token;
            }
        } catch (_) { }
        return null;
    }, [getStoredToken]);

    // Gửi sản phẩm với retry nếu token hết hạn
    const submitProductWithRetry = useCallback(
        async (payload, token) => {
            let currentToken = token;
            let response = await createProduct(payload, currentToken);

            if (!response.ok && response.status === 401) {
                const refreshed = await refreshTokenIfNeeded();
                if (!refreshed) {
                    return response;
                }
                currentToken = refreshed;
                response = await createProduct(payload, currentToken);
            }

            return { ...response, token: currentToken };
        },
        [refreshTokenIfNeeded],
    );

    const submitVariants = useCallback(
        async (productId, token) => {
            if (!variants.length) return true;
            const results = await Promise.all(
                variants.map((v) =>
                    createProductVariant(productId, {
                        name: v.name?.trim() || null,
                        shadeName: v.shadeName?.trim() || null,
                        shadeHex: v.shadeHex?.trim() || null,
                        price: v.finalPrice ? Number(v.finalPrice) : 0, // Giá cuối cùng (đã gồm thuế)
                        unitPrice: v.unitPrice ? Number(v.unitPrice) : null,
                        tax: v.taxPercent ? Number(v.taxPercent) : null,
                        purchasePrice: v.purchasePrice ? Number(v.purchasePrice) : null,
                        stockQuantity: v.stockQuantity === '' ? 0 : Number(v.stockQuantity),
                        isDefault: Boolean(v.isDefault),
                    }, token),
                ),
            );
            const failed = results.find((r) => !r.ok);
            return !failed;
        },
        [variants],
    );

    const handleProductIdInput = useCallback((value) => {
        const cleaned = (value || '')
            .toString()
            .replace(/[^0-9a-zA-Z]/g, '')
            .toUpperCase();
        setProductId(cleaned);
        setErrors((prev) => {
            if (!prev?.id) return prev;
            const next = { ...prev };
            delete next.id;
            return next;
        });
    }, []);

    // Hàm xử lý nhập thuế (chỉ cho phép số nguyên từ 0-99)
    const handleTaxInput = useCallback((value) => {
        // Chỉ lấy số nguyên, loại bỏ tất cả ký tự không phải số
        const cleaned = (value || '').replace(/[^0-9]/g, '');

        if (cleaned === '') {
            setTaxPercent('');
            return;
        }

        // Chuyển thành số nguyên
        const num = parseInt(cleaned, 10);

        // Nếu không phải số hợp lệ, không cập nhật
        if (isNaN(num)) {
            return;
        }

        // Giới hạn trong khoảng 0-99
        if (num < 0) {
            setTaxPercent('0');
        } else if (num > 99) {
            setTaxPercent('99');
        } else {
            setTaxPercent(num.toString());
        }
    }, []);

    // Reset form về trạng thái ban đầu
    const resetForm = useCallback(() => {
        try {
            formRef.current?.reset();
        } catch (_) { }
        // Reset tất cả fields về giá trị ban đầu từ constants
        setProductId(INITIAL_FORM_STATE_PRODUCT.productId);
        setName(INITIAL_FORM_STATE_PRODUCT.name);
        setDescription(INITIAL_FORM_STATE_PRODUCT.description);
        setBrand(INITIAL_FORM_STATE_PRODUCT.brand);
        setShadeColor(INITIAL_FORM_STATE_PRODUCT.shadeColor);
        setSkinType(INITIAL_FORM_STATE_PRODUCT.skinType);
        setSkinConcern(INITIAL_FORM_STATE_PRODUCT.skinConcern);
        setVolume(INITIAL_FORM_STATE_PRODUCT.volume);
        setOrigin(INITIAL_FORM_STATE_PRODUCT.origin);
        setExpiryDate(INITIAL_FORM_STATE_PRODUCT.expiryDate);
        setIngredients(INITIAL_FORM_STATE_PRODUCT.ingredients);
        setUsageInstructions(INITIAL_FORM_STATE_PRODUCT.usageInstructions);
        setSafetyNote(INITIAL_FORM_STATE_PRODUCT.safetyNote);
        setWeight(INITIAL_FORM_STATE_PRODUCT.weight);
        setLength(INITIAL_FORM_STATE_PRODUCT.length);
        setWidth(INITIAL_FORM_STATE_PRODUCT.width);
        setHeight(INITIAL_FORM_STATE_PRODUCT.height);
        setPrice(INITIAL_FORM_STATE_PRODUCT.price);
        setTaxPercent(INITIAL_FORM_STATE_PRODUCT.taxPercent);
        setDiscountValue(INITIAL_FORM_STATE_PRODUCT.discountValue);
        setPurchasePrice(INITIAL_FORM_STATE_PRODUCT.purchasePrice);
        setCategoryId(INITIAL_FORM_STATE_PRODUCT.categoryId);
        setStockQuantity(INITIAL_FORM_STATE_PRODUCT.stockQuantity);
        setMediaFiles(INITIAL_FORM_STATE_PRODUCT.mediaFiles);
        setErrors(INITIAL_FORM_STATE_PRODUCT.errors);
    }, []);

    // ========== Data Fetching ==========

    // Fetch danh sách danh mục từ API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const list = await getActiveCategories();
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
        if (!productId.trim()) {
            newErrors.id = 'Vui lòng nhập mã sản phẩm.';
        } else if (!/^[A-Z0-9]+$/.test(productId.trim())) {
            newErrors.id = 'Mã sản phẩm chỉ chứa chữ và số (A-Z, 0-9).';
        }
        if (!name.trim()) newErrors.name = 'Vui lòng nhập tên sản phẩm.';
        if (!brand.trim()) newErrors.brand = 'Vui lòng nhập thương hiệu.';
        // Validation category
        if (!categoryId) {
            newErrors.categoryId = 'Vui lòng chọn danh mục từ danh sách.';
        }

        // Chỉ validate Giá & Thuế khi không có variants
        if (variants.length === 0) {
            // Validate price - must be a valid number and >= 0
            const priceNum = Number(price);
            if (isNaN(priceNum) || priceNum < 0) {
                newErrors.price = 'Giá không hợp lệ. Vui lòng nhập số lớn hơn hoặc bằng 0.';
            }

            // Validate purchasePrice - must be < unitPrice (giá niêm yết)
            if (
                purchasePrice !== undefined &&
                purchasePrice !== null &&
                purchasePrice !== ''
            ) {
                const purchaseNum = Number(purchasePrice);
                if (Number.isNaN(purchaseNum) || purchaseNum < 0) {
                    newErrors.purchasePrice = 'Giá nhập phải lớn hơn hoặc bằng 0.';
                } else if (priceNum > 0 && purchaseNum >= priceNum) {
                    newErrors.purchasePrice = 'Giá nhập phải nhỏ hơn giá niêm yết.';
                }
            }
        } else {
            // Khi có variants, xóa lỗi price, purchasePrice nếu có (vì trường đã bị ẩn)
            if (newErrors.price) delete newErrors.price;
            if (newErrors.purchasePrice) delete newErrors.purchasePrice;
        }

        // Validate mediaFiles - must have at least 1 image/video
        if (!mediaFiles || mediaFiles.length === 0) {
            newErrors.mediaFiles =
                'Vui lòng chọn ít nhất một ảnh hoặc video cho sản phẩm.';
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
        // Chỉ validate stockQuantity khi không có variants và trường được hiển thị
        if (variants.length === 0) {
            if (
                stockQuantity === undefined ||
                stockQuantity === null ||
                stockQuantity === ''
            ) {
                newErrors.stockQuantity = 'Vui lòng nhập số lượng tồn kho.';
            } else {
                const stockNum = Number(stockQuantity);
                if (Number.isNaN(stockNum) || stockNum < 0) {
                    newErrors.stockQuantity = 'Số lượng tồn kho tối thiểu là 0.';
                }
            }
        } else {
            // Khi có variants, xóa lỗi stockQuantity nếu có 
            if (newErrors.stockQuantity) {
                delete newErrors.stockQuantity;
            }
        }

        // Chỉ validate Giá & Thuế khi không có variants
        if (variants.length === 0) {
            // Validate phần trăm thuế
            if (taxPercent === undefined || taxPercent === null || taxPercent === '') {
                newErrors.taxPercent = 'Vui lòng nhập thuế (từ 0 đến 99%).';
            } else {
                const taxNum = parseInt(taxPercent, 10);
                if (isNaN(taxNum) || taxNum < 0 || taxNum > 99) {
                    newErrors.taxPercent = 'Thuế phải là số nguyên từ 0 đến 99.';
                }
            }
        } else {
            // Khi có variants, xóa lỗi price, taxPercent, purchasePrice nếu có (vì trường đã bị ẩn)
            if (newErrors.price) delete newErrors.price;
            if (newErrors.taxPercent) delete newErrors.taxPercent;
            if (newErrors.purchasePrice) delete newErrors.purchasePrice;
        }

        // Validate expiryDate - must be after today if provided
        if (expiryDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiry = new Date(expiryDate);
            expiry.setHours(0, 0, 0, 0);
            if (expiry <= today) {
                newErrors.expiryDate = 'Hạn sử dụng phải sau ngày hôm nay.';
            }
        }

        // Validate variants (optional)
        if (variants.length > 0) {
            variants.forEach((v) => {
                if (!v.name?.trim()) {
                    newErrors[`variant_name_${v.id}`] = 'Vui lòng nhập tên/nhãn lựa chọn.';
                }
                const unitPriceNum = Number(v.unitPrice);
                if (Number.isNaN(unitPriceNum) || unitPriceNum < 0) {
                    newErrors[`variant_unitPrice_${v.id}`] = 'Giá niêm yết phải >= 0.';
                }
                const taxNum = Number(v.taxPercent);
                if (Number.isNaN(taxNum) || taxNum < 0 || taxNum > 99) {
                    newErrors[`variant_taxPercent_${v.id}`] = 'Thuế phải là số từ 0 đến 99.';
                }
                const purchasePriceNum = Number(v.purchasePrice);
                if (v.purchasePrice !== '' && (Number.isNaN(purchasePriceNum) || purchasePriceNum < 0)) {
                    newErrors[`variant_purchasePrice_${v.id}`] = 'Giá nhập phải >= 0.';
                }
                const finalPriceNum = Number(v.finalPrice);
                if (Number.isNaN(finalPriceNum) || finalPriceNum < 0) {
                    newErrors[`variant_finalPrice_${v.id}`] = 'Giá cuối cùng phải >= 0.';
                }
                const stockNum = v.stockQuantity === '' ? 0 : Number(v.stockQuantity);
                if (Number.isNaN(stockNum) || stockNum < 0) {
                    newErrors[`variant_stock_${v.id}`] = 'Tồn kho lựa chọn phải >= 0.';
                }
            });
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
        // Giới hạn trong khoảng 0-99
        const clamped = Math.max(0, Math.min(99, n));
        return clamped / 100;
    }, [taxPercent]);

    // Tính giá cuối cùng sau thuế
    const finalPrice = useMemo(() => {
        const p = Number(price) || 0;
        return Math.round(p * (1 + taxDecimal));
    }, [price, taxDecimal]);

    // ========== API Helpers ==========
    // Compress image before upload
    const compressImage = useCallback(async (file) => {
        // Skip compression for small files (< 1MB)
        if (file.size < 1024 * 1024) {
            return file;
        }

        // Skip compression for non-images
        if (!file.type.startsWith('image/')) {
            return file;
        }

        const options = {
            maxSizeMB: 1.0,
            maxWidthOrHeight: 1920,
            quality: 0.88,
            initialQuality: 0.9,
            useWebWorker: true,
        };

        try {
            const compressedFile = await imageCompression(file, options);

            // If compression doesn't help much (> 90% of original), keep original
            if (compressedFile.size > file.size * 0.9) {
                return file;
            }

            return compressedFile;
        } catch (error) {
            console.error('Image compression failed:', error);
            return file; // Fallback to original
        }
    }, []);

    // Upload media files with compression and parallel processing
    const uploadMediaFiles = useCallback(async (files, token) => {
        if (!files || files.length === 0) {
            return { imageUrls: [], videoUrls: [], defaultUrl: '' };
        }

        try {
            setUploadProgress(0);
            let completedCount = 0;
            const totalFiles = files.length;

            // Compress images first
            const compressedFiles = await Promise.all(
                files.map(async (m) => {
                    if (m.type === 'IMAGE' && m.file.type.startsWith('image/')) {
                        const compressed = await compressImage(m.file);
                        return { ...m, file: compressed };
                    }
                    return m;
                })
            );

            // Upload in parallel with batching (3 files at a time to avoid overload)
            const batchSize = 3;
            const allResults = [];

            for (let i = 0; i < compressedFiles.length; i += batchSize) {
                const batch = compressedFiles.slice(i, i + batchSize);

                const batchPromises = batch.map(async (m) => {
                    const folderPath = [
                        CLOUDINARY_FOLDERS.PRODUCT,
                        categoryId,
                        productId
                    ].filter(Boolean).join('/');
                    const url = await uploadToCloudinary(m.file, folderPath);

                    completedCount++;
                    setUploadProgress(Math.round((completedCount / totalFiles) * 100));

                    return { ...m, uploadedUrl: url };
                });

                const batchResults = await Promise.all(batchPromises);
                allResults.push(...batchResults);
            }

            const imageUrls = allResults
                .filter((m) => m.type === 'IMAGE')
                .map((m) => m.uploadedUrl)
                .filter(Boolean);

            const videoUrls = allResults
                .filter((m) => m.type === 'VIDEO')
                .map((m) => m.uploadedUrl)
                .filter(Boolean);

            const defaultItem = allResults.find((m) => m.isDefault) || allResults[0];
            const defaultUrl = defaultItem?.uploadedUrl || '';

            return { imageUrls, videoUrls, defaultUrl };
        } catch (error) {
            console.error('Error uploading media:', error);
            throw error;
        }
    }, [compressImage, categoryId, productId]);

    // Build product payload
    const buildProductPayload = useCallback(
        (imageUrls, videoUrls, defaultUrl) => ({
            id: (productId || '').trim(),
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
            weight: weight && Number(weight) > 0 ? Number(weight) : null,
            length: length && Number(length) >= 1 ? Number(length) : null,
            width: width && Number(width) >= 1 ? Number(width) : null,
            height: height && Number(height) >= 1 ? Number(height) : null,
            // Chỉ gửi price, unitPrice, tax, purchasePrice khi không có variants
            ...(variants.length === 0 && {
                price: Number.isFinite(finalPrice) ? finalPrice : 0,
                unitPrice: Number(price) || 0,
                tax: taxDecimal || 0,
                purchasePrice:
                    purchasePrice !== undefined &&
                        purchasePrice !== null &&
                        purchasePrice !== ''
                        ? Number(purchasePrice)
                        : null,
            }),
            discountValue:
                discountValue && Number(discountValue) > 0 ? Number(discountValue) : null,
            categoryId: (categoryId || '').trim(),
            imageUrls: imageUrls.length ? imageUrls : undefined,
            videoUrls: videoUrls.length ? videoUrls : undefined,
            defaultMediaUrl: defaultUrl || undefined,
            // Chỉ gửi stockQuantity khi không có variants
            ...(variants.length === 0 && { stockQuantity: Number(stockQuantity) }),
        }),
        [
            productId,
            name,
            description,
            brand,
            shadeColor,
            skinType,
            skinConcern,
            volume,
            origin,
            expiryDate,
            ingredients,
            usageInstructions,
            safetyNote,
            weight,
            length,
            width,
            height,
            price,
            taxDecimal,
            discountValue,
            purchasePrice,
            categoryId,
            stockQuantity,
            finalPrice,
            variants,
        ],
    );

    // ========== Event Handlers ==========
    const handleReset = resetForm;

    const handleMediaSelection = useCallback(
        (event) => {
            const selectedFiles = Array.from(event.target.files || []);
            if (selectedFiles.length === 0) {
                return;
            }

            const currentTotalSize = mediaFiles.reduce(
                (sum, item) => sum + (item?.file?.size || 0),
                0,
            );
            const selectedSize = selectedFiles.reduce(
                (sum, file) => sum + (file?.size || 0),
                0,
            );

            if (currentTotalSize + selectedSize > MAX_TOTAL_MEDIA_SIZE) {
                notifyError('Tổng dung lượng ảnh/video không được vượt quá 100MB.');
                event.target.value = '';
                return;
            }

            const mapped = selectedFiles.map((f) => ({
                file: f,
                type: f.type.startsWith('image') ? 'IMAGE' : 'VIDEO',
                preview: URL.createObjectURL(f),
                isDefault: false,
            }));

            setMediaFiles((prev) => {
                const next = [...prev, ...mapped];
                if (next.length > 0 && !next.some((m) => m.isDefault)) {
                    next[0].isDefault = true;
                }
                return next;
            });

            // Xóa lỗi mediaFiles khi đã chọn file
            setErrors((prev) => {
                if (!prev?.mediaFiles) return prev;
                const next = { ...prev };
                delete next.mediaFiles;
                return next;
            });
        },
        [mediaFiles, notifyError],
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true);
        if (!validate()) {
            setIsLoading(false);
            notifyError('Vui lòng điền đầy đủ thông tin bắt buộc.');
            return;
        }

        try {
            const token = ensureAuthToken();
            if (!token) {
                setIsLoading(false);
                return;
            }

            // Upload ảnh/video mặc định
            const { imageUrls, videoUrls, defaultUrl } = await uploadMediaFiles(
                mediaFiles,
                token,
            );

            // Build payload
            const payload = buildProductPayload(imageUrls, videoUrls, defaultUrl);

            // Create product (tự retry nếu token hết hạn)
            const response = await submitProductWithRetry(payload, token);
            const { ok, data, status } = response;

            if (ok) {
                const productIdCreated = data?.id || payload.id;
                if (productIdCreated) {
                    const variantsOk = await submitVariants(productIdCreated, token);
                    if (!variantsOk) {
                        notifyError('Tạo lựa chọn thất bại. Vui lòng kiểm tra lại.');
                        setIsLoading(false);
                        return;
                    }
                }
                setIsLoading(false);
                success('Thêm sản phẩm thành công.');
                rememberProductId(normalizedProductId, payload.name);
                setVariants([]);
                resetForm();
            } else {
                if (status === 401) {
                    notifyError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    return;
                }

                const errorData = data || response?.data || {};
                const errorCode = errorData?.code;
                const errorMessage = (errorData?.message || '').toString();

                // Debug: Log để kiểm tra
                console.log('Create product error:', {
                    status,
                    errorCode,
                    errorMessage,
                    fullData: errorData,
                    response: response
                });

                // Kiểm tra duplicate product ID - kiểm tra error code hoặc message
                const isDuplicateError =
                    errorCode === 6003 || // PRODUCT_ALREADY_EXISTS
                    errorMessage.toLowerCase().includes('đã tồn tại') ||
                    errorMessage.toLowerCase().includes('mã sản phẩm đã tồn tại') ||
                    errorMessage.toLowerCase().includes('duplicate') ||
                    errorMessage.toLowerCase().includes('already exists');

                if (isDuplicateError && normalizedProductId) {
                    notifyDuplicateProductId(normalizedProductId);
                    return;
                }

                // Hiển thị thông báo lỗi chung
                const finalErrorMessage = errorMessage || 'Không thể thêm sản phẩm. Vui lòng thử lại.';
                notifyError(finalErrorMessage);
            }
        } catch (err) {
            console.error('Lỗi thêm sản phẩm:', err);
            const errorMsg =
                err.message || 'Không thể kết nối máy chủ. Vui lòng thử lại.';
            notifyError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cx('wrap')}>
            {/* Upload Progress */}
            <LoadingBar
                show={isLoading && uploadProgress > 0 && uploadProgress < 100}
                progress={uploadProgress}
                message="Đang tải lên ảnh/video..."
            />

            <div className={cx('topbar')}>
                <button
                    className={cx('backBtn')}
                    onClick={() => navigate('/staff/products', { replace: true })}
                >
                    <img src={backIcon} alt="Quay lại" className={cx('backIcon')} />
                </button>
            </div>
            <div className={cx('card')}>
                <div className={cx('card-header')}>Thêm sản phẩm mới</div>
                <form ref={formRef} className={cx('form')} onSubmit={handleSubmit}>
                    <div className={cx('section')}>
                        <div className={cx('sectionHeader')}>
                            <div className={cx('sectionTitle')}>Thông tin sản phẩm</div>
                            <div className={cx('sectionHint')}>
                                Các trường hiển thị chính cho khách hàng
                            </div>
                        </div>
                        <div className={cx('grid2')}>
                            <div className={cx('row')}>
                                <label>Mã sản phẩm</label>
                                <input
                                    placeholder="VD: SP001"
                                    value={productId}
                                    onChange={(e) => handleProductIdInput(e.target.value)}
                                />
                                {errors.id && (
                                    <div className={cx('errorText')}>{errors.id}</div>
                                )}
                            </div>
                            <div className={cx('row')}>
                                <label>Danh mục sản phẩm</label>
                                <div
                                    className={cx('categoryDropdown')}
                                    ref={categoryDropdownRef}
                                >
                                    {/* Input hiển thị category đã chọn hoặc placeholder */}
                                    <div
                                        className={cx('categorySelect', {
                                            open: isCategoryDropdownOpen,
                                            error: errors.categoryId,
                                        })}
                                        onClick={() =>
                                            setIsCategoryDropdownOpen(
                                                !isCategoryDropdownOpen,
                                            )
                                        }
                                    >
                                        <span
                                            className={cx('categorySelectValue', {
                                                placeholder: !categoryId,
                                            })}
                                        >
                                            {categoryId
                                                ? (
                                                    displayCategories.find(
                                                        (c) =>
                                                            (c.id || c.categoryId) ===
                                                            categoryId,
                                                    ) ||
                                                    categories.find(
                                                        (c) =>
                                                            (c.id || c.categoryId) ===
                                                            categoryId,
                                                    )
                                                )?.name || '--Chọn danh mục--'
                                                : '--Chọn danh mục--'}
                                        </span>
                                        <span className={cx('categorySelectArrow')}>
                                            {isCategoryDropdownOpen ? '▲' : '▼'}
                                        </span>
                                    </div>

                                    {/* Dropdown với tìm kiếm */}
                                    {isCategoryDropdownOpen && (
                                        <div className={cx('categoryDropdownMenu')}>
                                            {/* Input tìm kiếm */}
                                            <div className={cx('categorySearch')}>
                                                <input
                                                    type="text"
                                                    placeholder="Tìm kiếm danh mục..."
                                                    value={categorySearchTerm}
                                                    onChange={(e) =>
                                                        setCategorySearchTerm(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                                {categorySearchTerm && (
                                                    <button
                                                        type="button"
                                                        className={cx(
                                                            'categorySearchClear',
                                                        )}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCategorySearchTerm('');
                                                        }}
                                                        title="Xóa tìm kiếm"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                            {/* Danh sách categories */}
                                            <div className={cx('categoryList')}>
                                                {filteredCategories.length === 0 ? (
                                                    <div className={cx('categoryEmpty')}>
                                                        <div
                                                            style={{
                                                                fontSize: '32px',
                                                                marginBottom: '8px',
                                                            }}
                                                        >
                                                            🔍
                                                        </div>
                                                        <div>
                                                            Không tìm thấy danh mục nào
                                                        </div>
                                                        {categorySearchTerm && (
                                                            <div
                                                                style={{
                                                                    fontSize: '12px',
                                                                    marginTop: '4px',
                                                                    color: '#94a3b8',
                                                                }}
                                                            >
                                                                Thử tìm kiếm với từ khóa
                                                                khác
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <>
                                                        {filteredCategories.map((c) => {
                                                            const catId =
                                                                c.id || c.categoryId;
                                                            const isSelected =
                                                                categoryId === catId;
                                                            return (
                                                                <div
                                                                    key={catId}
                                                                    className={cx(
                                                                        'categoryItem',
                                                                        {
                                                                            selected:
                                                                                isSelected,
                                                                        },
                                                                    )}
                                                                    onClick={() => {
                                                                        setCategoryId(
                                                                            catId,
                                                                        );
                                                                        setIsCategoryDropdownOpen(
                                                                            false,
                                                                        );
                                                                        setCategorySearchTerm(
                                                                            '',
                                                                        );
                                                                        // Xóa lỗi category khi chọn
                                                                        setErrors(
                                                                            (prev) => {
                                                                                if (
                                                                                    !prev?.categoryId
                                                                                )
                                                                                    return prev;
                                                                                const next =
                                                                                {
                                                                                    ...prev,
                                                                                };
                                                                                delete next.categoryId;
                                                                                return next;
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    {c.name}
                                                                    {isSelected && (
                                                                        <span
                                                                            className={cx(
                                                                                'categoryCheck',
                                                                            )}
                                                                        >
                                                                            ✓
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {errors.categoryId && (
                                    <div className={cx('errorText')}>
                                        {errors.categoryId}
                                    </div>
                                )}
                            </div>
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
                            <label>
                                Thương hiệu <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                placeholder="VD: L'Oreal, Maybelline, Innisfree"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                            />
                            {errors.brand && (
                                <div className={cx('errorText')}>{errors.brand}</div>
                            )}
                        </div>
                        {/* ========== CÁC TRƯỜNG ĐẶC BIỆT ========== */}
                        {/* Các trường này chỉ hiển thị khi chọn category phù hợp */}

                        {shouldShowField('shadeColor', categoryId, categories) && (
                            <div className={cx('row')}>
                                <label>Màu sắc</label>
                                <input
                                    placeholder="VD: #Nude, #Coral, #Rose"
                                    value={shadeColor}
                                    onChange={(e) => setShadeColor(e.target.value)}
                                />
                            </div>
                        )}

                        {shouldShowField('skinType', categoryId, categories) ||
                            shouldShowField('skinConcern', categoryId, categories) ? (
                            <div className={cx('grid2')}>
                                {shouldShowField('skinType', categoryId, categories) && (
                                    <div className={cx('row')}>
                                        <label>Loại da</label>
                                        <input
                                            placeholder="VD: Da khô, Da dầu, Da hỗn hợp"
                                            value={skinType}
                                            onChange={(e) => setSkinType(e.target.value)}
                                        />
                                    </div>
                                )}
                                {shouldShowField(
                                    'skinConcern',
                                    categoryId,
                                    categories,
                                ) && (
                                        <div className={cx('row')}>
                                            <label>Vấn đề da</label>
                                            <input
                                                placeholder="VD: Mụn, Lão hóa, Nhạy cảm"
                                                value={skinConcern}
                                                onChange={(e) =>
                                                    setSkinConcern(e.target.value)
                                                }
                                            />
                                        </div>
                                    )}
                            </div>
                        ) : null}

                        {shouldShowField('volume', categoryId, categories) ||
                            shouldShowField('origin', categoryId, categories) ? (
                            <div className={cx('grid2')}>
                                {shouldShowField('volume', categoryId, categories) && (
                                    <div className={cx('row')}>
                                        <label>Dung tích</label>
                                        <input
                                            placeholder="VD: 30ml, 50g, 100ml"
                                            value={volume}
                                            onChange={(e) => setVolume(e.target.value)}
                                        />
                                    </div>
                                )}
                                {shouldShowField('origin', categoryId, categories) && (
                                    <div className={cx('row')}>
                                        <label>Xuất xứ</label>
                                        <input
                                            placeholder="VD: Hàn Quốc, Pháp, Mỹ"
                                            value={origin}
                                            onChange={(e) => setOrigin(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {shouldShowField('expiryDate', categoryId, categories) && (
                            <div className={cx('row')}>
                                <label>Hạn sử dụng</label>
                                <input
                                    type="date"
                                    value={expiryDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                />
                                {errors.expiryDate && (
                                    <div className={cx('errorText')}>{errors.expiryDate}</div>
                                )}
                            </div>
                        )}

                        {shouldShowField('ingredients', categoryId, categories) && (
                            <div className={cx('row')}>
                                <label>Thành phần</label>
                                <textarea
                                    rows={3}
                                    placeholder="Liệt kê các thành phần chính (VD: Hyaluronic Acid, Vitamin C, Retinol...)"
                                    value={ingredients}
                                    onChange={(e) => setIngredients(e.target.value)}
                                />
                            </div>
                        )}

                        {shouldShowField('usageInstructions', categoryId, categories) && (
                            <div className={cx('row')}>
                                <label>Hướng dẫn sử dụng</label>
                                <textarea
                                    rows={3}
                                    placeholder="Hướng dẫn cách sử dụng sản phẩm"
                                    value={usageInstructions}
                                    onChange={(e) => setUsageInstructions(e.target.value)}
                                />
                            </div>
                        )}

                        {shouldShowField('safetyNote', categoryId, categories) && (
                            <div className={cx('row')}>
                                <label>Lưu ý an toàn</label>
                                <textarea
                                    rows={2}
                                    placeholder="Các lưu ý về an toàn khi sử dụng sản phẩm"
                                    value={safetyNote}
                                    onChange={(e) => setSafetyNote(e.target.value)}
                                />
                            </div>
                        )}
                        <div className={cx('row')}>
                            <label>Mô tả sản phẩm</label>
                            <textarea
                                rows={4}
                                placeholder="Mô tả ngắn về sản phẩm"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={cx('section')}>
                        <div className={cx('sectionHeader')}>
                            <div className={cx('sectionTitle')}>Lựa chọn (tùy danh mục)</div>
                            <div className={cx('sectionHint')}>
                                Nước hoa: tên = dung tích (ml). Trang điểm: tên = tên màu, kèm mã màu (hex). Các danh mục khác: dùng tên/nhãn tùy ý.
                            </div>
                        </div>

                        <div className={cx('variantList')}>
                            {variants.map((v, idx) => {
                                // Helper để update variant field
                                const updateVariant = (field, value) => {
                                    setVariants((prev) =>
                                        prev.map((x) => (x.id === v.id ? { ...x, [field]: value } : x))
                                    );
                                };

                                // Helper để tính giá cuối cùng
                                const calculateFinalPrice = (unitPrice, taxPercent) => {
                                    if (!unitPrice) return '';
                                    const taxDecimal = (Number(taxPercent) || 0) / 100;
                                    return Math.round(unitPrice * (1 + taxDecimal));
                                };

                                // Helper xử lý số nguyên
                                const handleNumericInput = (value, max = null) => {
                                    const cleaned = (value || '').replace(/[^0-9]/g, '');
                                    if (cleaned === '') return '';
                                    const num = parseInt(cleaned, 10);
                                    if (isNaN(num)) return '';
                                    if (max !== null && num > max) return max.toString();
                                    return num < 0 ? '0' : num.toString();
                                };

                                // Helper xử lý giá tiền
                                const handlePriceInput = (value) => {
                                    const cleaned = (value || '').replace(/[^0-9]/g, '');
                                    return cleaned === '' ? '' : Number(cleaned);
                                };

                                // Labels và placeholders theo mode
                                const nameLabel = variantMode === 'fragrance' ? 'Dung tích (ml)' : variantMode === 'makeup' ? 'Tên màu' : 'Tên/nhãn';
                                const namePlaceholder = variantMode === 'fragrance' ? 'VD: 30ml, 50ml' : variantMode === 'makeup' ? 'VD: Coral, Nude, #01' : 'Tên lựa chọn';

                                return (
                                    <div key={v.id} className={cx('variantCard')}>
                                        <div className={cx('variantHeader')}>
                                            <span className={cx('variantNumber')}>Lựa chọn #{idx + 1}</span>
                                            <div className={cx('variantActions')}>
                                                <label className={cx('defaultCheckbox')}>
                                                    <input
                                                        type="radio"
                                                        name="defaultVariant"
                                                        checked={v.isDefault}
                                                        onChange={() =>
                                                            setVariants((prev) =>
                                                                prev.map((x) => ({ ...x, isDefault: x.id === v.id }))
                                                            )
                                                        }
                                                    />
                                                    <span>Mặc định</span>
                                                </label>
                                                <button
                                                    type="button"
                                                    className={cx('btn', 'btnDelete')}
                                                    onClick={() => setVariants((prev) => prev.filter((x) => x.id !== v.id))}
                                                >
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>

                                        <div className={cx('variantBody')}>
                                            {/* Thông tin cơ bản */}
                                            <div className={cx('variantGroup')}>
                                                <div className={cx('row')}>
                                                    <label>{nameLabel}</label>
                                                    <input
                                                        placeholder={namePlaceholder}
                                                        value={v.name}
                                                        onChange={(e) => updateVariant('name', e.target.value)}
                                                    />
                                                    {errors[`variant_name_${v.id}`] && (
                                                        <div className={cx('errorText')}>{errors[`variant_name_${v.id}`]}</div>
                                                    )}
                                                </div>
                                                <div className={cx('row')}>
                                                    <label>Tồn kho</label>
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        placeholder="0"
                                                        value={v.stockQuantity}
                                                        onChange={(e) => updateVariant('stockQuantity', e.target.value)}
                                                    />
                                                    {errors[`variant_stock_${v.id}`] && (
                                                        <div className={cx('errorText')}>{errors[`variant_stock_${v.id}`]}</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Giá và thuế */}
                                            <div className={cx('variantGroup', 'grid2')}>
                                                <div className={cx('row')}>
                                                    <label>Giá niêm yết (VND)</label>
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        placeholder="150000"
                                                        value={v.unitPrice}
                                                        onChange={(e) => {
                                                            const unitPriceValue = handlePriceInput(e.target.value);
                                                            updateVariant('unitPrice', unitPriceValue);
                                                            updateVariant('finalPrice', calculateFinalPrice(unitPriceValue, v.taxPercent));
                                                        }}
                                                    />
                                                    {errors[`variant_unitPrice_${v.id}`] && (
                                                        <div className={cx('errorText')}>{errors[`variant_unitPrice_${v.id}`]}</div>
                                                    )}
                                                </div>
                                                <div className={cx('row')}>
                                                    <label>Thuế (%)</label>
                                                    <div className={cx('inputSuffix')}>
                                                        <input
                                                            type="number"
                                                            inputMode="numeric"
                                                            placeholder="10"
                                                            value={v.taxPercent}
                                                            onChange={(e) => {
                                                                const taxValue = handleNumericInput(e.target.value, 99);
                                                                updateVariant('taxPercent', taxValue);
                                                                updateVariant('finalPrice', calculateFinalPrice(v.unitPrice, taxValue));
                                                            }}
                                                        />
                                                        <span className={cx('suffix')}>%</span>
                                                    </div>
                                                    {errors[`variant_taxPercent_${v.id}`] && (
                                                        <div className={cx('errorText')}>{errors[`variant_taxPercent_${v.id}`]}</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Giá nhập và giá cuối */}
                                            <div className={cx('variantGroup', 'grid2')}>
                                                <div className={cx('row')}>
                                                    <label>Giá nhập (VND)</label>
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        placeholder="90000"
                                                        value={v.purchasePrice}
                                                        onChange={(e) => updateVariant('purchasePrice', handlePriceInput(e.target.value))}
                                                    />
                                                    {errors[`variant_purchasePrice_${v.id}`] && (
                                                        <div className={cx('errorText')}>{errors[`variant_purchasePrice_${v.id}`]}</div>
                                                    )}
                                                </div>
                                                <div className={cx('row')}>
                                                    <label>Giá cuối cùng (đã gồm thuế)</label>
                                                    <input
                                                        placeholder="Tự động tính"
                                                        value={v.finalPrice || ''}
                                                        readOnly
                                                        className={cx('readonly')}
                                                    />
                                                </div>
                                            </div>

                                            {/* Màu sắc (chỉ cho makeup) */}
                                            {variantMode === 'makeup' && (
                                                <div className={cx('variantGroup', 'grid2')}>
                                                    <div className={cx('row')}>
                                                        <label>Shade/Màu (hiển thị)</label>
                                                        <input
                                                            placeholder="VD: Coral"
                                                            value={v.shadeName}
                                                            onChange={(e) => updateVariant('shadeName', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className={cx('row')}>
                                                        <label>Mã màu (Hex)</label>
                                                        <input
                                                            placeholder="#FF8899"
                                                            value={v.shadeHex}
                                                            onChange={(e) => updateVariant('shadeHex', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            <button
                                type="button"
                                className={cx('btn', 'btnAdd')}
                                onClick={() => {
                                    setVariants((prev) => {
                                        const newVariant = emptyVariant();
                                        // Tự động set isDefault = true cho variant đầu tiên
                                        if (prev.length === 0) {
                                            newVariant.isDefault = true;
                                        }
                                        return [...prev, newVariant];
                                    });
                                }}
                            >
                                + Thêm lựa chọn
                            </button>
                        </div>
                    </div>

                    {variants.length === 0 && (
                        <div className={cx('section')}>
                            <div className={cx('sectionHeader')}>
                                <div className={cx('sectionTitle')}>Giá & Thuế</div>
                                <div className={cx('sectionHint')}>
                                    Các trường liên quan đến giá bán và thuế
                                </div>
                            </div>
                            <div className={cx('grid2')}>
                                <div className={cx('row')}>
                                    <label>Giá niêm yết (VND)</label>
                                    <input
                                        placeholder="VD: 150000"
                                        inputMode="numeric"
                                        value={price}
                                        onChange={(e) => {
                                            setPrice(
                                                Number(
                                                    e.target.value.replace(/[^0-9]/g, ''),
                                                ) || 0,
                                            );
                                            // Xóa lỗi purchasePrice khi thay đổi giá niêm yết
                                            setErrors((prev) => {
                                                if (!prev?.purchasePrice) return prev;
                                                const next = { ...prev };
                                                delete next.purchasePrice;
                                                return next;
                                            });
                                        }}
                                    />
                                    {errors.price && (
                                        <div className={cx('errorText')}>{errors.price}</div>
                                    )}
                                </div>
                                <div className={cx('row')}>
                                    <label>Thuế (%)</label>
                                    <div className={cx('inputSuffix')}>
                                        <input
                                            placeholder="Ví dụ: 5 hoặc 10"
                                            inputMode="numeric"
                                            value={taxPercent}
                                            onChange={(e) => handleTaxInput(e.target.value)}
                                        />
                                        <span className={cx('suffix')}>%</span>
                                    </div>
                                    {errors.taxPercent && (
                                        <div className={cx('errorText')}>
                                            {errors.taxPercent}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={cx('grid2')}>
                                <div className={cx('row')}>
                                    <label>Giá nhập (VND)</label>
                                    <input
                                        placeholder="VD: 90000"
                                        inputMode="numeric"
                                        value={purchasePrice}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/[^0-9]/g, '');
                                            setPurchasePrice(raw === '' ? '' : Number(raw));
                                            // Xóa lỗi purchasePrice khi thay đổi giá nhập
                                            setErrors((prev) => {
                                                if (!prev?.purchasePrice) return prev;
                                                const next = { ...prev };
                                                delete next.purchasePrice;
                                                return next;
                                            });
                                        }}
                                    />
                                    {errors.purchasePrice && (
                                        <div className={cx('errorText')}>
                                            {errors.purchasePrice}
                                        </div>
                                    )}
                                </div>
                                <div className={cx('row')}>
                                    <label>Giá cuối cùng (đã gồm thuế)</label>
                                    <input
                                        placeholder="Tự động tính"
                                        value={finalPrice}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {variants.length === 0 && (
                        <div className={cx('section')}>
                            <div className={cx('sectionHeader')}>
                                <div className={cx('sectionTitle')}>Tồn kho & trạng thái</div>
                                <div className={cx('sectionHint')}>
                                    Theo dõi số lượng và tình trạng sản phẩm
                                </div>
                            </div>
                            <div className={cx('grid2')}>
                                <div className={cx('row')}>
                                    <label>Số lượng tồn kho</label>
                                    <input
                                        inputMode="numeric"
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
                                    <select>
                                        <option>Còn hàng</option>
                                        <option>Hết hàng</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className={cx('section')}>
                        <div className={cx('sectionHeader')}>
                            <div className={cx('sectionTitle')}>
                                Kích thước & trọng lượng
                            </div>
                            <div className={cx('sectionHint')}>
                                Giúp hệ thống tự tính phí vận chuyển
                            </div>
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
                                    onChange={(e) =>
                                        handleDecimalInput(e.target.value, setLength)
                                    }
                                />
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    placeholder="Rộng (cm)"
                                    value={width}
                                    onChange={(e) =>
                                        handleDecimalInput(e.target.value, setWidth)
                                    }
                                />
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    placeholder="Cao (cm)"
                                    value={height}
                                    onChange={(e) =>
                                        handleDecimalInput(e.target.value, setHeight)
                                    }
                                />
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    placeholder="Trọng lượng (g)"
                                    value={weight}
                                    onChange={(e) =>
                                        handleDecimalInput(e.target.value, setWeight)
                                    }
                                />
                            </div>
                            <div className={cx('grid4')}>
                                <div>
                                    {errors.length && (
                                        <div className={cx('errorText')}>
                                            {errors.length}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    {errors.width && (
                                        <div className={cx('errorText')}>
                                            {errors.width}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    {errors.height && (
                                        <div className={cx('errorText')}>
                                            {errors.height}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    {errors.weight && (
                                        <div className={cx('errorText')}>
                                            {errors.weight}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={cx('example')}>
                                Ví dụ kích thước: <strong>19.8 × 12.9 × 1.5 cm</strong>
                            </div>
                        </div>
                    </div>

                    <div className={cx('section')}>
                        <div className={cx('sectionHeader')}>
                            <div className={cx('sectionTitle')}>Hình ảnh & video</div>
                            <div className={cx('sectionHint')}>
                                Tối đa 50MB cho toàn bộ tư liệu
                            </div>
                        </div>
                        <div className={cx('row')}>
                            <label>Chọn ảnh/video (tổng tối đa 50MB)</label>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleMediaSelection}
                            />
                            {errors.mediaFiles && (
                                <div className={cx('errorText')}>{errors.mediaFiles}</div>
                            )}
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
                                                                !next.some(
                                                                    (n) => n.isDefault,
                                                                )
                                                            ) {
                                                                next[0].isDefault = true;
                                                            }
                                                            return next;
                                                        });
                                                        // Xóa lỗi mediaFiles khi đã có file
                                                        setErrors((prev) => {
                                                            if (!prev?.mediaFiles)
                                                                return prev;
                                                            const next = { ...prev };
                                                            delete next.mediaFiles;
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
                    </div>
                    <div className={cx('actions')}>
                        <button
                            type="button"
                            className={cx('btn', 'muted')}
                            onClick={handleReset}
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            className={cx('btn', 'primary')}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang tạo...' : 'Tạo sản phẩm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
