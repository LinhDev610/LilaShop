import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import homeStyles from '../Home/Home.module.scss';
import styles from './SupportUserPage.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import { getApiBaseUrl, getStoredToken } from '../../services/utils';
import { getMyInfo } from '../../services';
import { isValidVietnamPhoneNumber } from '../../utils/phoneNumberValidation';

// Import icons
import iconComplaint from '../../assets/icons/icon_complaint.png';

const cxHome = classNames.bind(homeStyles);
const cx = classNames.bind(styles);

export default function SupportUserPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const API_BASE_URL = getApiBaseUrl();
    const [formData, setFormData] = useState({
        orderId: '',
        orderIdOther: '', // For "Khác" option
        customerName: '',
        email: '',
        phone: '',
        issue: '',
        notes: ''
    });
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isOrderIdOther, setIsOrderIdOther] = useState(false);

    // Tự động điền thông tin user và lấy danh sách đơn hàng khi đăng nhập
    useEffect(() => {
        const fetchUserInfo = async () => {
            const token = getStoredToken();
            if (!token) {
                // Nếu chưa đăng nhập, giữ form trống
                return;
            }

            try {
                const userInfo = await getMyInfo(token);
                if (userInfo) {
                    setFormData(prev => ({
                        ...prev,
                        customerName: userInfo.fullName || userInfo.full_name || prev.customerName || '',
                        email: userInfo.email || prev.email || '',
                        phone: userInfo.phoneNumber || userInfo.phone_number || prev.phone || '',
                    }));
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
                // Không hiển thị lỗi, chỉ log để không làm gián đoạn UX
            }
        };

        const fetchOrders = async () => {
            const token = getStoredToken();
            if (!token) {
                return;
            }

            setLoadingOrders(true);
            try {
                const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();
                if (response.ok && data?.result) {
                    // Lấy danh sách đơn hàng và format để hiển thị
                    const ordersList = Array.isArray(data.result) ? data.result : [];
                    setOrders(ordersList);
                }
            } catch (error) {
                console.error('Error fetching orders:', error);
                // Không hiển thị lỗi, chỉ log
            } finally {
                setLoadingOrders(false);
            }
        };

        fetchUserInfo();
        fetchOrders();
    }, [API_BASE_URL]); // Chạy một lần khi component mount

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setSubmitSuccess(false);

        // Check if user is logged in
        const token = getStoredToken();
        if (!token) {
            setSubmitError('Vui lòng đăng nhập để gửi khiếu nại');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            return;
        }

        // Validation
        if (!isOrderIdOther) {
            if (!formData.orderId || !formData.orderId.trim()) {
                setSubmitError('Vui lòng chọn đơn hàng hoặc chọn "Khác"');
                return;
            }
        } else {
            if (!formData.orderIdOther || !formData.orderIdOther.trim()) {
                setSubmitError('Vui lòng nhập thông tin khiếu nại');
                return;
            }
        }
        if (!formData.customerName || !formData.customerName.trim()) {
            setSubmitError('Vui lòng nhập họ và tên');
            return;
        }
        if (!formData.email || !formData.email.trim()) {
            setSubmitError('Vui lòng nhập email');
            return;
        }
        if (!formData.phone || !formData.phone.trim()) {
            setSubmitError('Vui lòng nhập số điện thoại');
            return;
        }
        if (!isValidVietnamPhoneNumber(formData.phone)) {
            setSubmitError('Số điện thoại phải gồm 10 số và bắt đầu bằng 0');
            return;
        }
        if (!formData.issue || !formData.issue.trim()) {
            setSubmitError('Vui lòng mô tả tình trạng bạn đang gặp phải');
            return;
        }

        setIsSubmitting(true);

        try {
            // Combine issue and notes into content
            const orderInfo = isOrderIdOther
                ? `Khiếu nại khác: ${formData.orderIdOther.trim()}`
                : `Mã đơn hàng: ${formData.orderId.trim()}`;

            const content = `${orderInfo}\n\nVấn đề: ${formData.issue}` + (formData.notes ? `\n\nGhi chú thêm: ${formData.notes}` : '');

            const response = await fetch(`${API_BASE_URL}/api/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    orderCode: isOrderIdOther ? 'KHAC' : formData.orderId.trim(),
                    customerName: formData.customerName.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim(),
                    content: content.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || 'Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại sau.');
            }

            // Success
            setSubmitSuccess(true);
            // Reset form nhưng giữ lại thông tin user
            setFormData(prev => ({
                orderId: '',
                orderIdOther: '',
                customerName: prev.customerName,
                email: prev.email,
                phone: prev.phone,
                issue: '',
                notes: ''
            }));
            setIsOrderIdOther(false);

            // Hide success message after 5 seconds
            setTimeout(() => {
                setSubmitSuccess(false);
            }, 5000);
        } catch (error) {
            console.error('Error submitting support request:', error);
            setSubmitError(error.message || 'Đã xảy ra lỗi khi gửi yêu cầu hỗ trợ. Vui lòng thử lại sau.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const supportItems = [
        {
            title: 'Hướng dẫn mua hàng',
            description: 'Hướng dẫn chi tiết cách mua hàng trên website',
            path: '/support/shopping-guide',
            icon: '🛒',
        },
        {
            title: 'Chính sách thanh toán',
            description: 'Thông tin về các phương thức thanh toán và quy trình',
            path: '/support/payment-policy',
            icon: '💳',
        },
        {
            title: 'Chính sách vận chuyển',
            description: 'Thông tin về phí vận chuyển và thời gian giao hàng',
            path: '/support/shipping-policy',
            icon: '🚚',
        },
        {
            title: 'Chính sách đổi trả',
            description: 'Quy định về đổi trả và hoàn tiền sản phẩm',
            path: '/support/return-policy',
            icon: '↩️',
        },
    ];

    return (
        <div className={cxHome('home-wrapper')}>
            <main className={cxHome('home-content')}>
                {/* Support Items Section */}
                <section className={cx('support-section')}>
                    <div className={cx('header')}>
                        <h1 className={cx('title')}>Hỗ trợ khách hàng</h1>
                        <p className={cx('subtitle')}>
                            Chúng tôi luôn sẵn sàng hỗ trợ bạn trong mọi vấn đề
                        </p>
                    </div>

                    <div className={cx('support-grid')}>
                        {supportItems.map((item, index) => (
                            <div
                                key={index}
                                className={cx('support-card')}
                                onClick={() => navigate(item.path)}
                            >
                                <div className={cx('card-icon')}>{item.icon}</div>
                                <h3 className={cx('card-title')}>{item.title}</h3>
                                <p className={cx('card-description')}>{item.description}</p>
                                <div className={cx('card-arrow')}>→</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Support Request Form */}
                <section id="support-form" className={cx('support-form-section')}>
                    <div className={cx('section-header')}>
                        <div className={cx('header-icon')}>
                            <img src={iconComplaint} alt="Complaint Icon" />
                        </div>
                        <div className={cx('header-bar')}></div>
                        <h2 className={cx('section-title')}>Gửi yêu cầu hỗ trợ/ khiếu nại</h2>
                    </div>

                    <form className={cx('support-form')} onSubmit={handleSubmit}>
                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Mã đơn hàng:</label>
                                {loadingOrders ? (
                                    <div style={{ padding: '12px', color: '#666' }}>Đang tải danh sách đơn hàng...</div>
                                ) : orders.length > 0 ? (
                                    <>
                                        <select
                                            name="orderId"
                                            value={isOrderIdOther ? 'OTHER' : formData.orderId}
                                            onChange={(e) => {
                                                if (e.target.value === 'OTHER') {
                                                    setIsOrderIdOther(true);
                                                    setFormData(prev => ({ ...prev, orderId: '' }));
                                                } else {
                                                    setIsOrderIdOther(false);
                                                    handleInputChange(e);
                                                }
                                            }}
                                            className={cx('form-input')}
                                            style={{ padding: '12px', cursor: 'pointer' }}
                                        >
                                            <option value="">-- Chọn đơn hàng --</option>
                                            {orders.map((order) => (
                                                <option key={order.id} value={order.code || order.orderCode || order.id}>
                                                    {order.code || order.orderCode || `Đơn hàng #${order.id.substring(0, 8)}`}
                                                    {order.createdAt && ` - ${new Date(order.createdAt).toLocaleDateString('vi-VN')}`}
                                                </option>
                                            ))}
                                            <option value="OTHER">Khác</option>
                                        </select>
                                        {isOrderIdOther && (
                                            <input
                                                type="text"
                                                name="orderIdOther"
                                                value={formData.orderIdOther}
                                                onChange={handleInputChange}
                                                className={cx('form-input')}
                                                placeholder="Nhập thông tin khiếu nại (ví dụ: Vấn đề về tài khoản, Vấn đề về website...)"
                                                style={{ marginTop: '12px', padding: '12px' }}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <input
                                        type="text"
                                        name="orderId"
                                        value={formData.orderId}
                                        onChange={handleInputChange}
                                        placeholder="Nhập mã đơn hàng"
                                        className={cx('form-input')}
                                    />
                                )}
                            </div>
                        </div>

                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Họ và tên khách hàng:</label>
                                <input
                                    type="text"
                                    name="customerName"
                                    value={formData.customerName}
                                    onChange={handleInputChange}
                                    placeholder="Nhập họ và tên của bạn"
                                    className={cx('form-input')}
                                />
                            </div>
                        </div>

                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Email đăng ký:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Nhập email đã đăng ký tài khoản"
                                    className={cx('form-input')}
                                    readOnly
                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                />
                            </div>
                        </div>

                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Số điện thoại:</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="Nhập số điện thoại liên hệ"
                                    className={cx('form-input')}
                                />
                            </div>
                        </div>

                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Tình trạng khách hàng gặp phải:</label>
                                <textarea
                                    name="issue"
                                    value={formData.issue}
                                    onChange={handleInputChange}
                                    placeholder="Mô tả chi tiết tình trạng bạn đang gặp phải..."
                                    className={cx('form-textarea')}
                                    rows="4"
                                />
                            </div>
                        </div>

                        <div className={cx('form-row')}>
                            <div className={cx('form-group')}>
                                <label className={cx('form-label')}>Ghi chú thêm (nếu có):</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Ghi chú thêm thông tin về đơn hàng hoặc yêu cầu khác..."
                                    className={cx('form-textarea')}
                                    rows="3"
                                />
                            </div>
                        </div>

                        {submitError && (
                            <div className={cx('form-error')} style={{ color: 'red', marginBottom: '16px', padding: '12px', background: '#fee', borderRadius: '8px' }}>
                                {submitError}
                            </div>
                        )}
                        {submitSuccess && (
                            <div className={cx('form-success')} style={{ color: 'green', marginBottom: '16px', padding: '12px', background: '#efe', borderRadius: '8px' }}>
                                Yêu cầu hỗ trợ đã được gửi thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.
                            </div>
                        )}

                        <div className={cx('form-actions')}>
                            <button
                                type="submit"
                                className={cx('submit-button')}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu hỗ trợ'}
                            </button>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
}
