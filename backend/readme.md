# Backend Service - LilaShop Cosmetics Website

## Yêu cầu hệ thống

### Java Development Kit (JDK)
- **Khuyến nghị**: JDK 17 hoặc JDK 21
- **Tối thiểu**: JDK 17
- **Kiểm tra version**: `java -version`

### Maven
- **Version**: 3.6 trở lên
- **Kiểm tra version**: `mvn -version`

### MySQL
- **Version**: 8.0 trở lên
- **Port**: 3307 
- **Database**: lila_shop

## Cài đặt và chạy

### 1. Clone repository
```bash
git clone <repository-url>
cd LilaShop
```

### 2. Cấu hình database
Tạo database MySQL:
```sql
CREATE DATABASE lila_shop;
CREATE USER 'root'@'localhost' IDENTIFIED BY 'root';
GRANT ALL PRIVILEGES ON lila_shop.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Cấu hình application
Cập nhật file `src/main/resources/application.yaml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3307/lila_shop
    username: root
    password: root
```

### 4. Chạy ứng dụng
```bash
# Với JDK 17
mvn spring-boot:run

# Hoặc build và chạy JAR
mvn clean package
java -jar target/lila-shop-0.0.1-SNAPSHOT.jar
```

## Tương thích JDK

### JDK 17 (Khuyến nghị)
```bash
# Kiểm tra version
java -version
# Output: openjdk version "17.0.x"

# Chạy ứng dụng
mvn spring-boot:run
```

### JDK 21 (Tương thích)
```bash
# Kiểm tra version
java -version
# Output: openjdk version "21.0.x"

# Chạy ứng dụng (tự động compile với target 17)
mvn spring-boot:run
```

### JDK 24 (Tương thích)
```bash
# Kiểm tra version
java -version
# Output: openjdk version "24.0.x"

# Chạy ứng dụng (tự động compile với target 17)
mvn spring-boot:run
```

## API Endpoints

### Authentication
- `POST /auth/token` - Đăng nhập
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Đăng xuất
- `POST /auth/introspect` - Kiểm tra token
- `POST /auth/send-otp` - Gửi mã OTP
- `POST /auth/verify-otp` - Xác định mã OTP
- `POST /auth/reset-password` - Quên mật khẩu
- `POST /auth/change-password` - Đổi mật khẩu

### User Management
- `POST /users` - Tạo user mới
- `GET /users` - Lấy danh sách users
- `GET /users/my-info` - Lấy thông tin user hiện tại

## Troubleshooting

### Lỗi JDK version
Nếu gặp lỗi về JDK version:
```bash
# Kiểm tra JAVA_HOME
echo $JAVA_HOME

# Set JAVA_HOME cho JDK 17
export JAVA_HOME=/path/to/jdk17
```

### Lỗi database connection
Kiểm tra:
1. MySQL service đang chạy
2. Database và user đã được tạo
3. Connection string trong application.yml đúng

## Development

### Chạy tests
```bash
mvn test
```

### Build production
```bash
mvn clean package -Pprod
```

## License
MIT License


## Docker guideline
`docker build -t <account>/lila-shop:0.9.0 .`
`docker build -t linhdev610/lila-shop:0.9.0 .`
### Push docker image to Docker Hub
`docker image push <account>/lila-shop:0.9.0`
`docker image push linhdev610/lila-shop:0.9.0`

### Create network:
`docker network create devteria-network`
### Show network list:
`docker network ls`
### Start MySQL in devteria-network
`docker run --network devteria-network --name mysql -p 3307:3306 -e MYSQL_ROOT_PASSWORD=root -d mysql:8.0.43-debian`
### Run your application in devteria-network
`docker run --name lila-shop --network devteria-network -p 8080:8080 -e DBMS_CONNECTION=jdbc:mysql://mysql:3306/lila_shop lila-shop:0.9.0`