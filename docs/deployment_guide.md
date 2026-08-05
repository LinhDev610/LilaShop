# Hướng dẫn Triển khai

Tài liệu này hướng dẫn cách build, chạy và triển khai nền tảng LilaShop ở môi trường local (máy cá nhân) và sử dụng Docker.

---

## Yêu cầu Hệ thống tối thiểu

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt các công cụ sau:
- **Java Development Kit (JDK)**: Phiên bản 17 hoặc 21 (Khuyến nghị dùng JDK 17)
- **Maven**: Phiên bản 3.6 trở lên
- **Node.js**: Phiên bản 16.x trở lên (đi kèm với `npm` hoặc `yarn`)
- **MySQL**: Phiên bản 8.0 trở lên (hoặc chạy MySQL qua Docker)
- **Docker & Docker Compose**: (Bắt buộc nếu triển khai bằng Docker)

---

## 1. Thiết lập Môi trường Local (Chạy thủ công)

Để chạy các dịch vụ frontend và backend thủ công trên máy tính của bạn:

### Bước 1: Cấu hình Biến môi trường

1. Sao chép file mẫu `.env.example` ở thư mục gốc thành file `.env` mới:
   ```bash
   cp .env.example .env
   ```
2. Mở file `.env` và điền các thông tin bảo mật và API key thực tế của bạn:
   - `JWT_SIGNERKEY`: Chuỗi Hex dùng để ký và xác thực JWT token.
   - `BREVO_API_KEY`: API Key của Brevo để gửi email/OTP.
   - `BREVO_EMAIL`: Email người gửi đã được xác minh trong hệ thống Brevo.
   - `GHN_TOKEN` & `GHN_SHOP_ID`: Thông tin kết nối lấy từ trang quản trị API Giao Hàng Nhanh.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Thông tin tài khoản Cloudinary để lưu trữ ảnh.
   - `GEMINI_API_KEY`: Google Gemini API Key để kích hoạt chatbot AI.

### Bước 2: Khởi tạo Cơ sở dữ liệu

1. Khởi động MySQL server trên máy của bạn (chạy ở cổng `3307` hoặc chỉnh sửa cấu hình cổng tương ứng trong `backend/src/main/resources/application.yaml`).
2. Tạo cơ sở dữ liệu trống:
   ```sql
   CREATE DATABASE IF NOT EXISTS lila_shop;
   ```
3. Bộ di cư cơ sở dữ liệu Flyway sẽ tự động chạy các script khởi tạo bảng từ file `backend/src/main/resources/db/migration/V1__Init_Database.sql` khi bạn chạy backend lần đầu tiên.

### Bước 3: Khởi chạy Spring Boot Backend

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Build và chạy dự án:
   ```bash
   mvn spring-boot:run
   ```
   Hoặc bạn có thể đóng gói thành file JAR rồi chạy:
   ```bash
   mvn clean package -DskipTests
   java -jar target/backend-0.0.1-SNAPSHOT.jar
   ```
3. Đảm bảo backend đã khởi chạy thành công tại địa chỉ: `http://localhost:8080/lila_shop`.

### Bước 4: Khởi chạy React Frontend

1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   yarn install
   # hoặc
   npm install
   ```
3. Chạy server phát triển (development server) của React:
   ```bash
   yarn start
   # hoặc
   npm start
   ```
4. Truy cập giao diện web tại địa chỉ: `http://localhost:3000`.

---

## 2. Triển khai nhanh bằng Docker Compose

Chúng tôi cung cấp sẵn cấu hình Docker Compose để khởi chạy toàn bộ hệ thống (MySQL, backend, frontend) chỉ với một câu lệnh.

### Bước 1: Chuẩn bị file `.env`
Đảm bảo file `.env` ở thư mục gốc đã được cấu hình đầy đủ các biến môi trường cần thiết (Docker Compose sẽ tự động đọc các giá trị này).

### Bước 2: Chạy Docker Compose
Chạy câu lệnh sau tại thư mục gốc của dự án:
```bash
docker compose up --build -d
```

Lệnh này sẽ tự động:
1. Tạo và khởi động container **MySQL** chạy ở cổng host `3307`.
2. Biên dịch mã nguồn Java, build Docker image cho backend và khởi động container **backend** ở cổng `8080`.
3. Biên dịch bản build production của React, cấu hình Nginx làm web server tĩnh và khởi động container **frontend** ở cổng `3000`.

### Bước 3: Dừng hệ thống
Để dừng và gỡ bỏ các container đang chạy:
```bash
docker compose down
```

---

## 3. Hướng dẫn Triển khai trên Production (Môi trường Cloud)

Khi đưa dự án LilaShop lên các dịch vụ đám mây (như AWS, GCP, DigitalOcean):

1. **Cơ sở dữ liệu Production**:
   - Sử dụng các dịch vụ cơ sở dữ liệu được quản lý (như AWS RDS, GCP Cloud SQL) thay vì chạy trực tiếp MySQL trên container để đảm bảo an toàn dữ liệu và khả năng sao lưu tự động.
   - Bật kết nối bảo mật TLS/SSL giữa Backend và Database.

2. **Nginx Reverse Proxy & SSL**:
   - Đặt một máy chủ Nginx hoặc hệ thống cân bằng tải (Load Balancer) phía trước frontend (cổng 3000) và backend (cổng 8080/lila_shop) để điều hướng các request.
   - Cài đặt chứng chỉ SSL miễn phí (Let's Encrypt) để bắt buộc truy cập qua giao thức HTTPS bảo mật.

3. **Tự động hóa CI/CD**:
   - Thiết lập pipeline tự động chạy kiểm thử trước khi build Docker image.
   - Đẩy Docker image lên các kho chứa bảo mật (như Docker Hub private, AWS ECR) và sử dụng script để cập nhật container trên server production một cách nhanh chóng.
