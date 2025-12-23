const routes = {
    home: '/',
    cart: '/cart',
    search: '/search',
    contact: '/contact',
    customerSupport: '/support',
    login: '/login',
    register: '/register',
    forgotPassword: './forgot-password',
    verifyCode: './verify-code',
    resetPassword: './reset-password',
    customerAccount: '/customer-account',
    customerAccountOrders: '/customer-account/orders',
    customerAccountVouchers: '/customer-account/vouchers',
    customerAccountPassword: '/customer-account/password',
    promotion: '/promotion',
    newproduct: '/new-product',
    products: '/products',
    article: (id) => `/article/${id}`,

    // Customer Support routes
    customerSupportHome: '/customer-support',
    customerSupportComplaints: '/customer-support/complaints',
    customerSupportReviews: '/customer-support/reviews',
    customerSupportRefund: '/customer-support/refund-management',
    customerSupportChat: '/customer-support/chat',
    customerSupportProfile: '/customer-support/profile',

    // Staff routes
    staff: '/staff',
    staffProducts: '/staff/products',
    staffContent: '/staff/content',
    staffVouchersPromotions: '/staff/vouchers-promotions',
    staffOrders: '/staff/orders',
    staffProfile: '/staff/profile',

    // Admin routes
    admin: '/admin',
    adminCustomerAccounts: '/admin/customer-accounts',
    adminProducts: '/admin/products',
    adminCategories: '/admin/categories',
    adminOrders: '/admin/orders',
    adminVouchers: '/admin/vouchers',
    adminComplaints: '/admin/complaints',
    adminContent: '/admin/content',
    adminReports: '/admin/reports',
    adminProfile: '/admin/profile',
};

export default routes;
