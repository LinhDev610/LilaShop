# 💄 LilaShop - Nền tảng Thương mại Điện tử Mỹ phẩm

<div align="center">

![Java](https://img.shields.io/badge/Java-17-orange?style=for-the-badge&logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.2-brightgreen?style=for-the-badge&logo=spring)
![React](https://img.shields.io/badge/React-19.2.0-blue?style=for-the-badge&logo=react)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge&logo=mysql)

**Hệ thống quản lý và bán hàng mỹ phẩm trực tuyến đầy đủ tính năng**

[Giới thiệu](#-giới-thiệu) • [Tính năng](#-tính-năng-chính) • [Công nghệ](#-công-nghệ-sử-dụng) • [Cài đặt](#-cài-đặt-và-chạy-dự-án) • [Kiến trúc](#-kiến-trúc-hệ-thống)

</div>

---

## 📖 Giới thiệu

**LilaShop** là một nền tảng thương mại điện tử (E-commerce) hoàn chỉnh được phát triển để quản lý và bán mỹ phẩm trực tuyến. Dự án bao gồm đầy đủ các tính năng từ quản lý sản phẩm, đơn hàng, thanh toán, vận chuyển đến hệ thống hỗ trợ khách hàng và phân quyền người dùng.

Dự án được xây dựng với kiến trúc **full-stack** sử dụng **Spring Boot** cho backend và **React** cho frontend, tuân thủ các best practices trong phát triển phần mềm hiện đại.

### 🎯 Mục tiêu dự án

- Xây dựng hệ thống E-commerce hoàn chỉnh với đầy đủ tính năng
- Áp dụng kiến trúc phân tầng (layered architecture) chuẩn
- Tích hợp các dịch vụ bên thứ 3 (payment, shipping, email)
- Xây dựng giao diện responsive, user-friendly
- Đảm bảo tính bảo mật và hiệu năng cao

---

## ✨ Tính năng chính

### 🔐 Xác thực và Phân quyền
- ✅ Đăng nhập/Đăng ký tài khoản
- ✅ Xác thực OTP qua email (sử dụng Brevo)
- ✅ Quên/Đặt lại mật khẩu
- ✅ JWT Authentication với refresh token
- ✅ Phân quyền theo vai trò (Admin, Staff, Customer, Support)
- ✅ Quản lý permissions chi tiết

### 🛍️ Quản lý Sản phẩm
- ✅ CRUD sản phẩm với variants (màu sắc, kích thước)
- ✅ Quản lý danh mục (Categories) đa cấp
- ✅ Upload và quản lý hình ảnh (tích hợp Cloudinary)
- ✅ Quản lý tồn kho (Inventory)
- ✅ Workflow phê duyệt sản phẩm
- ✅ Tìm kiếm và lọc sản phẩm nâng cao
- ✅ Đánh giá và nhận xét sản phẩm

### 🛒 Giỏ hàng và Thanh toán
- ✅ Quản lý giỏ hàng (Cart) với nhiều sản phẩm
- ✅ Checkout multi-step (Địa chỉ → Vận chuyển → Thanh toán)
- ✅ Tích hợp thanh toán MoMo Payment Gateway
- ✅ Tính toán phí vận chuyển tự động (GHN API)
- ✅ Áp dụng voucher và khuyến mãi
- ✅ Quản lý địa chỉ giao hàng

### 📦 Quản lý Đơn hàng
- ✅ Tạo và xử lý đơn hàng
- ✅ Theo dõi trạng thái đơn hàng (pending, processing, shipped, delivered, cancelled)
- ✅ Hỗ trợ đổi trả hàng
- ✅ Quản lý thanh toán và hoàn tiền
- ✅ Thông báo trạng thái đơn hàng

### 🎁 Khuyến mãi và Voucher
- ✅ Tạo và quản lý voucher
- ✅ Tạo và quản lý chương trình khuyến mãi
- ✅ Áp dụng giảm giá theo phần trăm hoặc số tiền cố định
- ✅ Giới hạn số lượng sử dụng và thời gian hiệu lực
- ✅ Tự động hóa việc kích hoạt/hủy khuyến mãi

### 📊 Quản lý và Báo cáo
- ✅ Dashboard quản trị với thống kê doanh thu
- ✅ Báo cáo tài chính chi tiết
- ✅ Quản lý người dùng và nhân viên
- ✅ Phân tích doanh số bán hàng
- ✅ Export dữ liệu báo cáo

### 🎫 Hỗ trợ Khách hàng
- ✅ Hệ thống ticket/quản lý khiếu nại
- ✅ Chat hỗ trợ trực tuyến
- ✅ Điều phối ticket cho nhân viên hỗ trợ
- ✅ Quản lý phản hồi và đánh giá

### 🎨 Giao diện Người dùng
- ✅ Responsive design (mobile-first)
- ✅ Trang chủ với banner và sản phẩm nổi bật
- ✅ Trang chi tiết sản phẩm
- ✅ Trang tài khoản cá nhân
- ✅ Admin panel với đầy đủ chức năng
- ✅ Staff panel cho nhân viên
- ✅ Giao diện hiện đại, dễ sử dụng

---

## 🛠️ Công nghệ sử dụng

### Backend
| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| **Java** | 17 | Ngôn ngữ lập trình |
| **Spring Boot** | 3.2.2 | Framework backend |
| **Spring Data JPA** | - | ORM và quản lý database |
| **Spring Security** | - | Bảo mật và xác thực |
| **Spring Cloud OpenFeign** | - | HTTP client cho API calls |
| **MapStruct** | 1.5.5 | Code generation cho DTO mapping |
| **Lombok** | 1.18.30 | Giảm boilerplate code |
| **MySQL** | 8.0+ | Database chính |
| **JWT** | - | Xác thực token |
| **Maven** | 3.6+ | Build tool và dependency management |
| **Docker** | - | Containerization |

### Frontend
| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| **React** | 19.2.0 | UI framework |
| **React Router DOM** | 7.9.3 | Client-side routing |
| **SCSS/CSS Modules** | - | Styling với scope isolation |
| **React Context API** | - | State management |
| **Framer Motion** | 12.23.25 | Animation |
| **Chart.js** | 4.5.1 | Data visualization |
| **React Icons** | 5.5.0 | Icon library |
| **Axios** | - | HTTP client |

### Tích hợp Bên thứ 3
- **MoMo Payment Gateway**: Thanh toán trực tuyến
- **GHN API**: Tính toán và tạo đơn vận chuyển
- **Brevo (Sendinblue)**: Gửi email và OTP
- **Cloudinary**: Lưu trữ và quản lý hình ảnh

### Công cụ và Best Practices
- **Spotless**: Code formatting (Palantir Java Format)
- **JaCoCo**: Code coverage reporting
- **Testcontainers**: Integration testing với containers
- **Docker**: Containerization cho deployment

---

## 🏗️ Kiến trúc Hệ thống

### Backend Architecture (Layered Architecture)

```
backend/
├── controller/       # REST API endpoints
├── service/          # Business logic layer
├── repository/       # Data access layer (JPA)
├── entity/           # Database entities (JPA)
├── dto/              # Data Transfer Objects (request/response)
├── mapper/           # MapStruct mappers (Entity ↔ DTO)
├── configuration/    # Spring configuration (Security, JWT, etc.)
├── exception/        # Global exception handling
├── validator/        # Custom validators
└── util/             # Utility classes
```

**Nguyên tắc thiết kế:**
- **Separation of Concerns**: Tách biệt rõ ràng các layer
- **Dependency Injection**: Sử dụng Spring DI
- **DTO Pattern**: Tách biệt entity và API response
- **MapStruct**: Tự động generate mapping code
- **Global Exception Handling**: Xử lý lỗi tập trung

### Frontend Architecture (Component-based)

```
frontend/
├── src/
│   ├── pages/        # Route-level components
│   ├── components/   # Reusable components
│   ├── layouts/      # Layout wrappers
│   ├── contexts/     # React Context (Auth, Cart)
│   ├── hooks/        # Custom React hooks
│   ├── services/     # API calls và business logic
│   ├── routes/       # Route configuration
│   └── utils/        # Utility functions
```

**Patterns sử dụng:**
- **Component Composition**: Tái sử dụng component
- **CSS Modules**: Scoped styling
- **Context API**: Global state management
- **Custom Hooks**: Logic reuse
- **Service Layer**: Tách biệt API calls

### Database Schema

Hệ thống sử dụng MySQL với các bảng chính:
- `users`, `roles`, `permissions` - Quản lý người dùng và phân quyền
- `categories`, `products`, `product_variants` - Quản lý sản phẩm
- `cart`, `cart_items` - Giỏ hàng
- `orders`, `order_items` - Đơn hàng
- `payments`, `shipments` - Thanh toán và vận chuyển
- `vouchers`, `promotions` - Khuyến mãi
- `support_tickets`, `chat_messages` - Hỗ trợ khách hàng
- `financial_records` - Báo cáo tài chính

---

## 🚀 Cài đặt và Chạy Dự án

### Yêu cầu hệ thống

- **JDK**: 17 hoặc 21 (khuyến nghị JDK 17)
- **Maven**: 3.6 trở lên
- **Node.js**: 16.x trở lên
- **MySQL**: 8.0 trở lên
- **Docker** (tùy chọn): Để chạy MySQL

### Backend Setup

1. **Clone repository**
```bash
git clone <repository-url>
cd LilaShop/backend
```

2. **Tạo database MySQL**
```sql
CREATE DATABASE lila_shop;
CREATE USER 'root'@'localhost' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON lila_shop.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

3. **Cấu hình application.yaml**
Cập nhật file `src/main/resources/application.yaml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3307/lila_shop
    username: root
    password: root
```

4. **Cấu hình biến môi trường**
Tạo file `.env` hoặc set các biến môi trường:
- `BREVO_API_KEY`: API key cho Brevo (email)
- `BREVO_EMAIL`: Email sender đã verify
- `GHN_TOKEN`: Token từ GHN API
- `GHN_SHOP_ID`: Shop ID từ GHN
- `CLOUDINARY_CLOUD_NAME`: Cloud name từ Cloudinary
- `CLOUDINARY_API_KEY`: API key từ Cloudinary
- `CLOUDINARY_API_SECRET`: API secret từ Cloudinary

5. **Chạy ứng dụng**
```bash
# Với Maven wrapper
./mvnw spring-boot:run

# Hoặc với Maven đã cài đặt
mvn spring-boot:run

# Build JAR file
mvn clean package
java -jar target/backend-0.0.1.jar
```

Backend sẽ chạy tại: `http://localhost:8080/lila_shop`

### Frontend Setup

1. **Vào thư mục frontend**
```bash
cd LilaShop/frontend
```

2. **Cài đặt dependencies**
```bash
# Sử dụng yarn (khuyến nghị)
yarn install

# Hoặc npm
npm install
```

3. **Cấu hình API endpoint**
Cập nhật file `src/config/index.js` với URL backend:
```javascript
export const API_BASE_URL = 'http://localhost:8080/lila_shop';
```

4. **Chạy development server**
```bash
yarn start
# hoặc
npm start
```

Frontend sẽ chạy tại: `http://localhost:3000`

5. **Build production**
```bash
yarn build
# hoặc
npm run build
```

### Docker Setup (Tùy chọn)

#### Chạy MySQL với Docker
```bash
# Tạo network
docker network create devteria-network

# Chạy MySQL container
docker run --network devteria-network \
  --name mysql \
  -p 3307:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -d mysql:8.0.43-debian
```

#### Build và chạy Backend Docker image
```bash
# Build image
cd backend
docker build -t lila-shop:0.9.0 .

# Chạy container
docker run --name lila-shop \
  --network devteria-network \
  -p 8080:8080 \
  -e DBMS_CONNECTION=jdbc:mysql://mysql:3306/lila_shop \
  lila-shop:0.9.0
```

---

## 📁 Cấu trúc Dự án

```
LilaShop/
├── backend/                 # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/lila_shop/backend/
│   │   │   │   ├── controller/     # REST Controllers
│   │   │   │   ├── service/        # Business Logic
│   │   │   │   ├── repository/     # Data Access Layer
│   │   │   │   ├── entity/         # JPA Entities
│   │   │   │   ├── dto/            # Data Transfer Objects
│   │   │   │   ├── mapper/         # MapStruct Mappers
│   │   │   │   ├── configuration/  # Spring Config
│   │   │   │   └── exception/      # Exception Handling
│   │   │   └── resources/
│   │   │       └── application.yaml
│   │   └── test/           # Unit & Integration Tests
│   ├── pom.xml             # Maven dependencies
│   └── Dockerfile          # Docker configuration
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── layouts/       # Layout components
│   │   ├── contexts/      # Context API
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   └── routes/        # Route config
│   ├── package.json
│   └── public/
│
└── README.md              # File này
```

---

## 🔑 Tính năng Nổi bật và Kỹ thuật

### 1. Security & Authentication
- ✅ JWT-based authentication với refresh token mechanism
- ✅ Spring Security với OAuth2 Resource Server
- ✅ Role-based access control (RBAC)
- ✅ Permission-based authorization
- ✅ Password encryption với BCrypt
- ✅ Token blacklist cho logout

### 2. API Design
- ✅ RESTful API design
- ✅ Consistent error handling với GlobalExceptionHandler
- ✅ Request/Response DTOs với validation
- ✅ API versioning support
- ✅ Pagination và sorting

### 3. Code Quality
- ✅ MapStruct cho type-safe DTO mapping
- ✅ Lombok để giảm boilerplate code
- ✅ Spotless cho code formatting (Palantir Java Format)
- ✅ JaCoCo cho code coverage reporting
- ✅ Custom validators cho business rules

### 4. Testing
- ✅ Unit tests với JUnit 5
- ✅ Integration tests với Testcontainers
- ✅ Spring Security Test support
- ✅ H2 in-memory database cho testing

### 5. Frontend Best Practices
- ✅ Component-based architecture
- ✅ CSS Modules cho scoped styling
- ✅ Custom hooks cho logic reuse
- ✅ Context API cho state management
- ✅ React Router cho client-side routing
- ✅ Responsive design với mobile-first approach

### 6. Integration & DevOps
- ✅ Docker containerization
- ✅ Maven profiles cho environments (dev, test, prod)
- ✅ Environment-based configuration
- ✅ CI/CD ready structure

---

## 📊 Một số Số liệu Dự án

- **Backend**: ~277 Java files
- **Frontend**: Component-based với 80+ reusable components
- **API Endpoints**: 20+ REST controllers
- **Database Tables**: 20+ entities với relationships
- **Test Coverage**: Integration tests với Testcontainers

---

## 🔄 API Endpoints Chính

### Authentication
- `POST /lila_shop/api/auth/token` - Đăng nhập
- `POST /lila_shop/api/auth/refresh` - Refresh token
- `POST /lila_shop/api/auth/logout` - Đăng xuất
- `POST /lila_shop/api/auth/send-otp` - Gửi OTP
- `POST /lila_shop/api/auth/verify-otp` - Xác thực OTP

### Products
- `GET /lila_shop/api/products` - Danh sách sản phẩm (với filter, search, pagination)
- `GET /lila_shop/api/products/{id}` - Chi tiết sản phẩm
- `POST /lila_shop/api/products` - Tạo sản phẩm (Admin)
- `PUT /lila_shop/api/products/{id}` - Cập nhật sản phẩm
- `DELETE /lila_shop/api/products/{id}` - Xóa sản phẩm

### Orders
- `POST /lila_shop/api/orders` - Tạo đơn hàng
- `GET /lila_shop/api/orders` - Danh sách đơn hàng
- `GET /lila_shop/api/orders/{id}` - Chi tiết đơn hàng
- `PUT /lila_shop/api/orders/{id}/status` - Cập nhật trạng thái

### Payments
- `POST /lila_shop/api/momo/create-payment` - Tạo payment MoMo
- `POST /lila_shop/api/momo/ipn-handler` - IPN handler từ MoMo

### Shipping
- `POST /lila_shop/api/shipments/calculate-fee` - Tính phí vận chuyển (GHN)
- `POST /lila_shop/api/shipments/create-order` - Tạo đơn vận chuyển

*Và nhiều endpoints khác...*

---

## 📚 Tài liệu Dự án

- **Kiến trúc hệ thống (Architecture Diagram)**: [Architecture Diagram](./docs/architecture_diagram.md)
- **Thiết kế Cơ sở dữ liệu (ERD)**: [ERD Diagram](./docs/erd.md)
- **Hướng dẫn Triển khai (Deployment Guide)**: [Deployment Guide](./docs/deployment_guide.md)
- **Tài liệu API (REST API Spec)**: [API Document](./docs/api_document.md)
- **Sơ đồ tuần tự (Sequence Diagrams)**: [Sequence Diagrams](./docs/sequence_diagram.md)
- **Sơ đồ CI/CD (Pipeline Flow)**: [CI/CD Diagram](./docs/cicd_diagram.md)
- **Backend README**: [backend/readme.md](./backend/readme.md)
- **Frontend README**: [frontend/README.md](./frontend/README.md)
- **Frontend Structure**: [frontend/FOLDER_STRUCTURE.md](./frontend/FOLDER_STRUCTURE.md)
- **Project Responsibilities**: [PROJECT_RESPONSIBILITIES.md](./PROJECT_RESPONSIBILITIES.md)

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

---

## 📝 License

Dự án này được phát hành dưới MIT License.

---

## 👨‍💻 Tác giả

Dự án được phát triển bởi team LilaShop.

---

## 🙏 Lời cảm ơn

Cảm ơn các công nghệ và thư viện open-source đã được sử dụng trong dự án này.

---

<div align="center">

**⭐ Nếu dự án này hữu ích, hãy star repository này! ⭐**

Made with ❤️ by LilaShop Team

</div>
