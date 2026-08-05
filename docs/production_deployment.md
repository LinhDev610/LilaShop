# Hướng dẫn Cài đặt Hạ tầng Production (Home Server)

Tài liệu này hướng dẫn chi tiết cách thiết lập Ubuntu Server (máy tính ở nhà), cấu hình DuckDNS, Router Port Forwarding và Nginx Proxy Manager (NPM) để hệ thống hoạt động hoàn chỉnh với chứng chỉ SSL HTTPS.

---

## 1. Yêu cầu chuẩn bị
- Một máy tính (hoặc Raspberry Pi, Mini PC) cài đặt Ubuntu Server đang chạy trong nhà.
- Đã cài đặt **Docker** và **Docker Compose V2** trên Ubuntu.
- Tài khoản GitHub đã thiết lập đủ các Secret (`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `SERVER_IP`, `SERVER_USER`, `SSH_KEY`) để chạy CI/CD.

## 2. Cấu hình Tên miền động (DuckDNS)
IP mạng nhà (Public IP) thường bị thay đổi (Dynamic IP) khi modem khởi động lại. DuckDNS giúp gán một tên miền cố định trỏ về IP nhà bạn.

1. Truy cập [DuckDNS.org](https://www.duckdns.org) và đăng nhập (bằng tài khoản Google/GitHub).
2. Tạo một Sub Domain (Ví dụ: `mylilashop.duckdns.org`).
3. Lấy mã **Token** trên trang chủ.
4. Cập nhật `docker-compose.prod.yml` hoặc `.env` trên Ubuntu Server của bạn:
   - `DUCKDNS_SUBDOMAINS=mylilashop`
   - `DUCKDNS_TOKEN=mã-token-của-bạn`
*Container `duckdns` trong Docker Compose sẽ tự động ping lên DuckDNS 5 phút một lần để cập nhật IP nhà bạn vào tên miền.*

## 3. Mở Port (Port Forwarding) trên Router Wifi
Khi người dùng truy cập `mylilashop.duckdns.org`, request sẽ tới Router (Modem Wifi) nhà bạn. Bạn cần trỏ request này vào máy tính Ubuntu.

1. Đăng nhập vào trang quản trị Modem Wifi (thường là `192.168.1.1`).
2. Tìm mục **NAT**, **Port Forwarding**, hoặc **Virtual Server**.
3. Tạo 2 quy tắc trỏ về địa chỉ IP Local của máy Ubuntu (VD: `192.168.1.100`):
   - Quy tắc 1: External Port `80` -> Internal Port `80` (Giao thức TCP)
   - Quy tắc 2: External Port `443` -> Internal Port `443` (Giao thức TCP)
*Lưu ý: Tùy nhà mạng có thể khóa port 80/443, hãy liên hệ nhà mạng (tổng đài) yêu cầu mở nếu không thể truy cập.*

## 4. Cấu hình Nginx Proxy Manager (NPM) và SSL
Container NPM trong Docker Compose giúp quản lý dễ dàng việc định tuyến và lấy chứng chỉ SSL tự động qua Let's Encrypt.

1. Sau khi chạy lệnh `docker compose -f docker-compose.prod.yml up -d` trên Ubuntu, NPM sẽ chạy ở cổng `81`.
2. Mở trình duyệt, vào địa chỉ IP Local của Ubuntu: `http://192.168.1.100:81`
3. Đăng nhập tài khoản mặc định của NPM:
   - Email: `admin@example.com`
   - Password: `changeme`
4. Cấu hình định tuyến (Proxy Hosts):
   - Chọn **Proxy Hosts** -> **Add Proxy Host**
   - **Domain Names**: `mylilashop.duckdns.org`
   - **Scheme**: `http`
   - **Forward Hostname / IP**: Điền tên container frontend (ví dụ: `lila-shop-frontend`)
   - **Forward Port**: `80`
   - Check vào các ô: **Cache Assets**, **Block Common Exploits**, **Websockets Support**.
5. Cấu hình API Backend (Custom Locations):
   - Vẫn trong màn hình Edit Proxy Host, chuyển sang tab **Custom Locations**.
   - **Location**: `/api`
   - **Scheme**: `http`
   - **Forward Hostname / IP**: Điền tên container backend (ví dụ: `lila-shop-backend`)
   - **Forward Port**: `8080`
6. Cấp chứng chỉ SSL HTTPS (Tab SSL):
   - Chọn tab **SSL** trong bảng Edit Proxy Host.
   - Chọn **Request a new SSL Certificate**.
   - Check vào **Force SSL**, **HTTP/2 Support**.
   - Nhập email của bạn (để Let's Encrypt thông báo gia hạn).
   - Bấm **Save**.
   
*Lúc này NPM sẽ tự động gọi Let's Encrypt để xin chứng chỉ. Nếu thành công, trang web của bạn đã chạy 100% qua chuẩn HTTPS an toàn và không bị lỗi CORS do chung 1 domain.*

## 5. Giám sát Hệ thống (ELK Stack)
Docker Compose có bao gồm `elasticsearch`, `kibana`, `filebeat` cho mục đích thu thập và hiển thị log của Spring Boot và hệ thống Docker.
- Giao diện truy cập Kibana (Dashboards): `http://192.168.1.100:5601`
- Yêu cầu cấu hình tối thiểu: ~4GB RAM (đã cấu hình giới hạn RAM của ES là 512MB để không sập máy cá nhân). Nếu máy bị treo, hãy xóa cấu hình block ELK trong `docker-compose.prod.yml`.
