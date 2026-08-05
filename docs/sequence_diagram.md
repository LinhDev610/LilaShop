# Sơ đồ Tuần tự (Sequence Diagrams)

Tài liệu này chứa các sơ đồ tuần tự mô tả chi tiết các luồng nghiệp vụ quan trọng trong hệ thống LilaShop, minh họa sự tương tác giữa trình duyệt client, backend Spring Boot, cơ sở dữ liệu MySQL và các API dịch vụ bên thứ ba.

---

## 1. Luồng Đăng ký Tài khoản & Xác thực OTP

Sơ đồ này mô tả chi tiết cách người dùng đăng ký tài khoản mới và xác minh email bằng mã OTP được gửi qua dịch vụ Brevo SMTP.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng / Trình duyệt
    participant API as Backend Spring Boot
    participant DB as Cơ sở dữ liệu MySQL
    participant Brevo as API Brevo SMTP

    Customer->>API: POST /auth/send-otp (email)
    API->>API: Tạo mã OTP ngẫu nhiên gồm 6 chữ số
    API->>DB: INSERT vào bảng otp (code, expires_at, is_used)
    API->>Brevo: POST /v3/smtp/email (Gửi email chứa mã OTP)
    Brevo-->>API: 200 OK (Đã gửi email)
    API-->>Customer: 200 OK (Đã gửi OTP thành công)
    
    Customer->>API: POST /users (fullName, email, password, otpCode)
    API->>DB: SELECT * FROM otp WHERE email = ? AND is_used = false
    DB-->>API: Trả về bản ghi OTP
    
    alt OTP không hợp lệ hoặc hết hạn
        API-->>Customer: 400 Bad Request (Mã OTP không đúng/Hết hạn)
    else OTP hợp lệ
        API->>DB: UPDATE otp SET is_used = true WHERE id = ?
        API->>API: Mã hóa mật khẩu bằng BCrypt
        API->>DB: INSERT vào bảng users (id, email, password, role_id)
        DB-->>API: Tạo tài khoản thành công
        API-->>Customer: 201 Created (Đăng ký tài khoản thành công)
    end
```

---

## 2. Luồng Đặt hàng & Thanh toán qua MoMo & Vận chuyển GHN

Sơ đồ này mô tả toàn bộ quá trình mua hàng, bắt đầu từ tính toán phí vận chuyển, tạo đơn hàng, thanh toán qua cổng MoMo cho đến khi nhận được callback (IPN) để kích hoạt tạo vận đơn trên Giao Hàng Nhanh.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng / Trình duyệt
    participant API as Backend Spring Boot
    participant GHN as API Giao Hàng Nhanh
    participant MoMo as API Cổng MoMo
    participant DB as Cơ sở dữ liệu MySQL

    %% Tính phí vận chuyển
    Customer->>API: POST /shipments/calculate-fee (thông tin địa chỉ)
    API->>GHN: POST /v2/shipping-order/fee (Yêu cầu tính phí ship)
    GHN-->>API: Trả về phí vận chuyển & ngày giao dự kiến
    API-->>Customer: Trả về kết quả phí giao hàng
    
    %% Đặt hàng & Khởi tạo thanh toán
    Customer->>API: POST /orders (items, address, shippingFee, paymentMethod="MOMO")
    API->>DB: SELECT stock FROM inventories WHERE variant_id = ?
    DB-->>API: Xác nhận đủ hàng trong kho
    API->>DB: INSERT vào bảng orders (status="PENDING", total_amount)
    API->>DB: INSERT vào bảng order_items
    API->>DB: UPDATE bảng inventories (trừ số lượng tồn kho)
    
    API->>MoMo: POST /v2/gateway/api (Yêu cầu tạo liên kết thanh toán)
    MoMo-->>API: Trả về link thanh toán (payUrl)
    API-->>Customer: 200 OK (Trả về link thanh toán payUrl cho trình duyệt)
    
    %% Chuyển hướng thanh toán
    Customer->>MoMo: Chuyển hướng tới trang thanh toán MoMo
    Customer->>MoMo: Xác nhận thanh toán trên ứng dụng MoMo
    MoMo-->>Customer: Redirect trở lại trang return-url (Trang đơn hàng thành công)
    
    %% Thông báo trạng thái thanh toán bất đồng bộ (IPN)
    MoMo->>API: POST /momo/ipn-handler (callback thông tin giao dịch + chữ ký signature)
    API->>API: Kiểm tra và xác thực chữ ký signature
    
    alt Thanh toán thành công
        API->>DB: UPDATE bảng orders SET status = "PROCESSING"
        API->>DB: INSERT vào bảng payments (status="COMPLETED", transaction_no)
        API->>GHN: POST /v2/shipping-order/create (Yêu cầu tạo đơn vận chuyển)
        GHN-->>API: Trả về mã vận đơn (tracking_number)
        API->>DB: INSERT vào bảng shipments (tracking_number, status="READY_TO_SHIP")
    else Thanh toán thất bại
        API->>DB: UPDATE bảng orders SET status = "CANCELLED"
        API->>DB: UPDATE bảng inventories (cộng trả lại số lượng tồn kho)
    end
    
    API-->>MoMo: 204 No Content / Phản hồi xác nhận thành công
```

---

## 3. Luồng Tương tác Trợ lý Chatbot (Google Gemini AI)

Sơ đồ mô tả quy trình trò chuyện trực tiếp của người dùng với trợ lý AI hỗ trợ được tích hợp trên hệ thống.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng / Trình duyệt
    participant API as Backend Spring Boot
    participant Gemini as API Google Gemini
    participant DB as Cơ sở dữ liệu MySQL

    Customer->>API: POST /chatbot/ask (nội dung câu hỏi)
    API->>DB: SELECT lịch sử chat FROM chat_messages WHERE session_id = ?
    DB-->>API: Trả về lịch sử trò chuyện
    API->>Gemini: POST /v1beta/models/gemini-2.5-flash:generateContent (prompt + lịch sử)
    Gemini-->>API: Trả về nội dung phản hồi do AI tạo ra
    API->>DB: INSERT vào bảng chat_messages (sender="BOT", message)
    API-->>Customer: 200 OK (Nội dung câu trả lời của AI)
```
