# Sơ đồ CI/CD & Quy trình Pipeline

Tài liệu này mô tả chi tiết quy trình Tích hợp liên tục (CI) và Triển khai liên tục (CD) tự động của ứng dụng LilaShop.

---

## Sơ đồ luồng hoạt động của CI/CD Pipeline

```mermaid
flowchart TD
    Developer([Lập trình viên]) -->|Git Push / PR| GitHub[(Kho chứa GitHub)]

    subgraph GitHubActions [GitHub Actions Runner]
        direction TB

        subgraph CI_Stage [Tích hợp liên tục (CI)]
            direction LR
            LintCode["Kiểm tra định dạng & chất lượng code\n(Spotless / ESLint)"]
            CompileCode["Biên dịch mã nguồn\n(Maven Compile / Webpack)"]
            RunTests["Chạy bộ kiểm thử\n(JUnit 5 / Testcontainers / Jest)"]
            
            LintCode --> CompileCode
            CompileCode --> RunTests
        end

        subgraph CD_Stage [Giao hàng liên tục (CD)]
            direction TB
            BuildDocker["Build Docker Image Production\n(Multi-stage Dockerfiles)"]
            PushRegistry["Đẩy Docker Image lên Registry\n(Docker Hub / ECR)"]
            
            BuildDocker --> PushRegistry
        end
    end

    GitHub -->|Kích hoạt Workflow| LintCode
    RunTests -->|Thành công| BuildDocker

    subgraph ProductionEnv [Môi trường Máy chủ Production]
        direction LR
        ComposeService["Docker Compose / Swarm"]
        WebProxy["Nginx Reverse Proxy"]
        MySQLDb[("Cơ sở dữ liệu MySQL Production")]
        
        ComposeService --> WebProxy
        ComposeService --> MySQLDb
    end

    PushRegistry -->|Webhook / SSH Trigger| DeployAction["Kịch bản Deploy (docker compose pull & up)"]
    DeployAction --> ComposeService
```

---

## Chi tiết các Giai đoạn trong Pipeline

### 1. Giai đoạn Kích hoạt (Trigger)
- **Sự kiện**: Quy trình được tự động kích hoạt bất cứ khi nào có thay đổi được đẩy (push) lên nhánh `main`, `develop` hoặc khi có một Pull Request (PR) được mở ra.

### 2. Tích hợp liên tục (CI)
- **Kiểm tra định dạng code (Linting & Formatting)**:
  - **Backend**: Chạy công cụ Maven Spotless (`mvn spotless:check`) để đảm bảo toàn bộ mã nguồn Java tuân thủ đúng chuẩn định dạng Palantir Java Format.
  - **Frontend**: Chạy ESLint và Prettier để phát hiện lỗi cú pháp và căn chỉnh code React.
- **Biên dịch mã nguồn (Compilation)**:
  - **Backend**: Đảm bảo toàn bộ các class Java có thể biên dịch thành công mà không có lỗi (`mvn compile`).
  - **Frontend**: Thực hiện build thử để phát hiện các lỗi import hoặc lỗi webpack tĩnh.
- **Chạy kiểm thử (Testing)**:
  - Khởi chạy các unit test và integration test.
  - **Testcontainers**: Cơ chế chạy thử nghiệm tích hợp tự động khởi tạo các container MySQL tạm thời trên máy ảo chạy CI để kiểm tra độ chính xác của các truy vấn và kết nối DB.

### 3. Giao hàng liên tục (CD) - Đóng gói Docker
- **Đóng gói (Build)**:
  - Biên dịch mã nguồn Spring Boot bên trong môi trường máy ảo Java builder, sau đó chuyển file JAR sang một container JRE gọn nhẹ để chạy.
  - Đóng gói các tài nguyên tĩnh đã tối ưu của React và cấu hình chạy trên web server Nginx Alpine.
- **Phát hành (Push)**:
  - Đóng nhãn (tag) các Docker image theo mã commit SHA và tag `:latest`, sau đó đăng nhập và đẩy các image này lên kho chứa Docker Hub công khai/riêng tư (ví dụ: `linhdev610/lila-shop`).

### 4. Triển khai liên tục (CD)
- **Cập nhật server**:
  - Máy chủ CI thiết lập kết nối bảo mật SSH trực tiếp tới máy chủ Cloud hoặc gọi Webhook kích hoạt.
  - Chạy lệnh cập nhật các biến môi trường cấu hình, tải các bản cập nhật Docker image mới nhất về máy chủ (`docker compose pull`), và khởi động lại các container một cách mượt mà (`docker compose up -d`).
- **Sau triển khai**:
  - Flyway trên backend tự động kiểm tra xem có thay đổi nào về cấu hình bảng hay không (ví dụ: file `V1__Init_Database.sql`) và chạy các cập nhật DB tự động mà không làm gián đoạn dịch vụ.
```
