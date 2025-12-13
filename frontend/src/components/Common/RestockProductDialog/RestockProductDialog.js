import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames/bind';
import styles from './RestockProductDialog.module.scss';

const cx = classNames.bind(styles);

function RestockProductDialog({
    open,
    product,
    variants = [], // List of variants if product has variants
    defaultQuantity = '',
    loading = false,
    onSubmit,
    onCancel,
}) {
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const hasVariants = variants && variants.length > 0;

    const validateQuantity = (raw) => {
        if (raw === '') {
            setError('Vui lòng nhập số lượng từ 1 trở lên.');
            return false;
        }
        const parsed = Number(raw);
        if (Number.isNaN(parsed) || parsed <= 0) {
            setError('Vui lòng nhập số lượng từ 1 trở lên.');
            return false;
        }
        setError('');
        return true;
    };

    useEffect(() => {
        if (open) {
            const normalized = defaultQuantity === '' || defaultQuantity === null || defaultQuantity === undefined
                ? ''
                : String(defaultQuantity);
            setQuantity(normalized);
            setError('');
            setSelectedVariant(null);
            // If has variants, start at step 1 (select variant), else go directly to step 2
            setStep(hasVariants ? 1 : 2);
        }
    }, [open, product?.id, defaultQuantity, hasVariants]);

    if (!open || typeof document === 'undefined') {
        return null;
    }

    // Use selected variant stock if variant is selected, otherwise use product stock
    const currentStock = selectedVariant
        ? Number(selectedVariant?.stockQuantity ?? 0)
        : Number(product?.stockQuantity ?? 0);

    // Display name based on selection
    const displayName = selectedVariant
        ? `${product?.name || 'Sản phẩm'} - ${selectedVariant?.name || selectedVariant?.shadeName || 'Lựa chọn'}`
        : (product?.name || 'Sản phẩm');

    const displayId = selectedVariant?.id || product?.id || 'Không xác định';

    const handleSelectVariant = (variant) => {
        setSelectedVariant(variant);
        setStep(2);
        setError('');
    };

    const handleBackToVariantSelection = () => {
        setStep(1);
        setSelectedVariant(null);
        setQuantity('');
        setError('');
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (loading) return;

        if (!validateQuantity(quantity)) {
            return;
        }

        setError('');
        // Pass both quantity and selected variant
        onSubmit?.(Number(quantity), selectedVariant);
    };

    const handleChange = (event) => {
        if (loading) return;
        const value = event.target.value;
        if (value === '') {
            setQuantity('');
            setError('Vui lòng nhập số lượng > 0.');
            return;
        }
        const numeric = Number(value);
        if (Number.isNaN(numeric)) {
            return;
        }
        const normalized = String(Math.floor(Math.max(0, numeric)));
        setQuantity(normalized);
        validateQuantity(normalized);
    };

    return createPortal(
        <div className={cx('overlay')} onClick={loading ? undefined : onCancel}>
            <div className={cx('dialog')} onClick={(e) => e.stopPropagation()}>
                <div className={cx('header')}>
                    <h3 className={cx('title')}>
                        {hasVariants && step === 1 ? 'Chọn variant bổ sung' : 'Bổ sung tồn kho'}
                    </h3>
                    <button
                        type="button"
                        className={cx('close-btn')}
                        aria-label="Đóng"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        ×
                    </button>
                </div>

                {hasVariants && step === 1 && (
                    <div className={cx('body')}>
                        <div className={cx('product-info')}>
                            <p className={cx('name')}>{product?.name || 'Sản phẩm'}</p>
                            <p className={cx('hint')}>Chọn variant cần bổ sung tồn kho:</p>
                        </div>
                        <div className={cx('variant-list')}>
                            {variants.map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    className={cx('variant-option')}
                                    onClick={() => handleSelectVariant(v)}
                                >
                                    <div className={cx('variant-option-info')}>
                                        <span className={cx('variant-option-name')}>
                                            {v.name || v.shadeName || 'Lựa chọn'}
                                        </span>
                                        {v.shadeHex && (
                                            <span
                                                className={cx('color-dot')}
                                                style={{ backgroundColor: v.shadeHex }}
                                            />
                                        )}
                                    </div>
                                    <span className={cx('variant-option-stock')}>
                                        Tồn: {v.stockQuantity || 0}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className={cx('footer')}>
                            <button
                                type="button"
                                className={cx('btn', 'cancel')}
                                onClick={onCancel}
                                disabled={loading}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Enter Quantity */}
                {step === 2 && (
                    <form onSubmit={handleSubmit}>
                        <div className={cx('body')}>
                            <div className={cx('product-info')}>
                                <p className={cx('name')}>{displayName}</p>
                                <p className={cx('code')}>
                                    Mã: <span>{displayId}</span>
                                </p>
                                {selectedVariant && selectedVariant.shadeName && (
                                    <p className={cx('variant-info')}>
                                        <span>Màu: {selectedVariant.shadeName}</span>
                                        {selectedVariant.shadeHex && (
                                            <span
                                                className={cx('color-dot')}
                                                style={{ backgroundColor: selectedVariant.shadeHex }}
                                            />
                                        )}
                                    </p>
                                )}
                                <p className={cx('stock')}>
                                    Tồn hiện tại:{' '}
                                    <strong>{Number.isNaN(currentStock) ? 0 : currentStock}</strong>
                                    {' '}sản phẩm
                                </p>
                            </div>

                            <label className={cx('label')} htmlFor="restock-quantity">
                                Số lượng bổ sung
                            </label>
                            <input
                                id="restock-quantity"
                                type="number"
                                min="1"
                                step="1"
                                inputMode="numeric"
                                className={cx('input')}
                                value={quantity}
                                onChange={handleChange}
                                placeholder="Nhập số lượng cần bổ sung"
                                autoFocus
                                disabled={loading}
                            />
                            {error && <p className={cx('error')}>{error}</p>}
                            <p className={cx('hint')}>
                                Số lượng sẽ được cộng vào tồn kho hiện tại.
                            </p>
                        </div>

                        <div className={cx('footer')}>
                            {hasVariants && (
                                <button
                                    type="button"
                                    className={cx('btn', 'back')}
                                    onClick={handleBackToVariantSelection}
                                    disabled={loading}
                                >
                                    ← Chọn lại
                                </button>
                            )}
                            <button
                                type="button"
                                className={cx('btn', 'cancel')}
                                onClick={onCancel}
                                disabled={loading}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className={cx('btn', 'confirm')}
                                disabled={loading || !quantity || !!error}
                            >
                                {loading ? 'Đang cập nhật...' : 'Bổ sung'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body,
    );
}

export default RestockProductDialog;
