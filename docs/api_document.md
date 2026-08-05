# Tài liệu API (REST API Specification)

Tài liệu này cung cấp mô tả chi tiết các endpoint REST API được cung cấp bởi dịch vụ backend LilaShop. Tất cả cấu trúc yêu cầu (request) và phản hồi (response) được ánh xạ trực tiếp từ các controller trong mã nguồn backend.

- **Base URL**: `/lila_shop/api` (mặc định chạy ở cổng: `8080`)
- **Định dạng dữ liệu**: Tất cả dữ liệu truyền nhận đều ở định dạng JSON (`application/json`).
- **Xác thực**: Sử dụng mã JWT Bearer gửi trong header HTTP `Authorization`.

---

## 1. Dịch vụ Xác thực & Đăng nhập (`/auth`)

Các endpoint được quản lý bởi `AuthenticationController` và `OtpController` phục vụ cho việc bảo mật, đăng nhập và quản lý thông tin tài khoản.

| Phương thức | Endpoint | Yêu cầu Auth | Mô tả tính năng |
|:---|:---|:---|:---|
| `POST` | `/auth/token` | Công khai | Đăng nhập bằng email và mật khẩu để nhận cặp JWT access token và refresh token. |
| `POST` | `/auth/refresh` | Công khai | Làm mới access token đã hết hạn sử dụng refresh token hợp lệ. |
| `POST` | `/auth/logout` | Người dùng | Đăng xuất khỏi hệ thống và đưa JWT hiện tại vào danh sách đen (blacklist). |
| `POST` | `/auth/introspect`| Công khai | Kiểm tra xem JWT token truyền lên có còn hiệu lực hay không. |
| `POST` | `/auth/send-otp` | Công khai | Tạo và gửi mã OTP 6 số tới email của người dùng (thông qua dịch vụ Brevo). |
| `POST` | `/auth/verify-otp` | Công khai | Xác thực mã OTP đầu vào để phục vụ đăng ký hoặc đổi mật khẩu. |
| `POST` | `/auth/reset-password`| Công khai | Khởi tạo lại mật khẩu mới sau khi đã xác thực OTP thành công. |
| `POST` | `/auth/change-password`| Người dùng | Đổi mật khẩu cho người dùng hiện tại đang đăng nhập. |

---

## 2. Quản lý Người dùng & Địa chỉ (`/users`, `/addresses`)

| Phương thức | Endpoint | Yêu cầu Auth | Mô tả tính năng |
|:---|:---|:---|:---|
| `POST` | `/users` | Công khai | Đăng ký tài khoản khách hàng mới. |
| `GET` | `/users` | Admin | Lấy danh sách toàn bộ người dùng trong hệ thống (có phân trang). |
| `GET` | `/users/my-info` | Người dùng | Lấy thông tin chi tiết của người dùng đang đăng nhập hiện tại. |
| `PUT` | `/users/{id}` | Admin | Chỉnh sửa thông tin chi tiết hoặc bật/tắt trạng thái hoạt động (`is_active`) của tài khoản. |
| `GET` | `/addresses` | Người dùng | Lấy danh sách các địa chỉ giao nhận hàng đã lưu của người dùng. |
| `POST` | `/addresses` | Người dùng | Thêm mới một địa chỉ giao nhận hàng. |
| `DELETE` | `/addresses/{id}` | Người dùng | Xóa một địa chỉ giao nhận hàng đã lưu. |

---

## 3. Danh mục & Sản phẩm (`/products`, `/categories`)

| Phương thức | Endpoint | Yêu cầu Auth | Mô tả tính năng |
|:---|:---|:---|:---|
| `GET` | `/products` | Công khai | Lấy danh sách sản phẩm phân trang (hỗ trợ tìm kiếm, lọc theo danh mục, giá, thương hiệu). |
| `GET` | `/products/{id}` | Công khai | Xem chi tiết thông tin sản phẩm bao gồm danh sách phiên bản, ảnh và mô tả. |
| `POST` | `/products` | Admin/Staff | Tạo mới một sản phẩm (chỉ dành cho Admin/Nhân viên). |
| `PUT` | `/products/{id}` | Admin/Staff | Cập nhật thông tin chi tiết của sản phẩm. |
| `DELETE` | `/products/{id}` | Admin | Xóa sản phẩm khỏi danh mục hệ thống. |
| `GET` | `/categories` | Công khai | Lấy cấu trúc cây danh mục sản phẩm đa cấp. |
| `POST` | `/categories` | Admin | Tạo mới một danh mục sản phẩm. |
| `GET` | `/product-variants/{id}`| Công khai | Lấy thông tin chi tiết của một phiên bản sản phẩm cụ thể (màu sắc, size, tồn kho). |

---

## 4. Quản lý Giỏ hàng (`/cart`)

| Phương thức | Endpoint | Yêu cầu Auth | Mô tả tính năng |
|:---|:---|:---|:---|
| `GET` | `/cart` | Người dùng | Xem danh sách các mặt hàng đang có trong giỏ hàng. |
| `POST` | `/cart/items` | Người dùng | Thêm một phiên bản sản phẩm và số lượng tương ứng vào giỏ hàng. |
| `PUT` | `/cart/items/{itemId}` | Người dùng | Cập nhật số lượng của một mặt hàng trong giỏ hàng. |
| `DELETE` | `/cart/items/{itemId}` | Người dùng | Xóa một mặt hàng khỏi giỏ hàng. |
| `DELETE` | `/cart` | Người dùng | Xóa sạch toàn bộ sản phẩm khỏi giỏ hàng. |

---

## 5. Quản lý Đơn hàng & Đặt hàng (`/orders`)

| Phương thức | Endpoint | Yêu cầu Auth | Mô tả tính năng |
|:---|:---|:---|:---|
| `POST` | `/orders` | Người dùng | Khởi tạo đặt đơn hàng mới. |
| `GET` | `/orders` | Người dùng/Staff | Xem lịch sử đơn hàng cá nhân (Khách hàng) hoặc toàn bộ đơn hàng (Nhân viên/Admin). |
| `GET` | `/orders/{id}` | Người dùng/Staff | Xem chi tiết thông tin đơn hàng, danh sách sản phẩm đã đặt và phí ship. |
| `PUT` | `/orders/{id}/status`| Staff/Admin | Cập nhật trạng thái đơn hàng (Đang xử lý, Đang giao, Đã giao, Đã hủy). |
| `POST` | `/orders/{id}/refund` | Staff/Admin | Kích hoạt quy trình trả hàng và hoàn tiền cho đơn hàng. |

---

## 6. Thanh toán & Vận chuyển (`/momo`, `/shipments`)

| Phương thức | Endpoint | Yêu cầu Auth | Mô tả tính năng |
|:---|:---|:---|:---|
| `POST` | `/momo/create-payment` | Người dùng | Tạo liên kết thanh toán (payUrl) chuyển hướng sang cổng MoMo. |
| `POST` | `/momo/ipn-handler` | Công khai | Endpoint nhận thông báo trạng thái giao dịch (IPN) do MoMo gửi về. |
| `POST` | `/shipments/calculate-fee`| Người dùng | Gọi API Giao Hàng Nhanh (GHN) để tính toán phí ship thực tế. |
| `POST` | `/shipments/create-order` | Staff | Tạo đơn vận chuyển sang hệ thống GHN và xuất mã/in phiếu giao hàng. |

---

## 7. Chăm sóc Khách hàng & Chat (`/tickets`, `/chat`, `/chatbot`)

| Phương thức | Endpoint | Yêu cầu Auth | Mô tả tính năng |
|:---|:---|:---|:---|
| `POST` | `/tickets` | Người dùng | Tạo yêu cầu/khiếu nại cần hỗ trợ. |
| `GET` | `/tickets` | Staff/Admin | Lấy danh sách các ticket hỗ trợ đang mở. |
| `POST` | `/chat/send` | Người dùng/Staff | Gửi tin nhắn trao đổi trong phòng chat của ticket hỗ trợ. |
| `POST` | `/chatbot/ask` | Người dùng | Gửi câu hỏi nhanh cho chatbot AI (kết nối trực tiếp với Google Gemini). |

---

## 8. Banners, Vouchers & Khuyến mãi (`/banners`, `/vouchers`, `/promotions`)

| Phương thức | Endpoint | Yêu cầu Auth | Mô tả tính năng |
|:---|:---|:---|:---|
| `GET` | `/banners/active` | Công khai | Lấy danh sách các banner quảng cáo đang hoạt động trên trang chủ. |
| `POST` | `/banners` | Admin/Staff | Tạo mới một banner quảng cáo tiếp thị. |
| `GET` | `/vouchers` | Công khai | Lấy danh sách mã giảm giá hoạt động áp dụng lúc thanh toán. |
| `POST` | `/vouchers` | Admin | Khởi tạo mã giảm giá mới với các điều kiện đi kèm. |
| `POST` | `/promotions` | Admin | Thiết lập chương trình khuyến mãi tự động giảm giá trực tiếp cho sản phẩm. |

---

## 9. Thống kê & Báo cáo Tài chính (`/financial`)

| Phương thức | Endpoint | Yêu cầu Auth | Mô tả tính năng |
|:---|:---|:---|:---|
| `GET` | `/financial/revenue` | Admin | Thống kê doanh thu theo ngày, tháng, năm. |
| `GET` | `/financial/orders` | Admin | Xuất báo cáo dữ liệu phân tích các đơn hàng. |
