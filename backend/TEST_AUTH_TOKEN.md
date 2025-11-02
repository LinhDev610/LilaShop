# Hướng dẫn test endpoint /auth/token

## Endpoint
```
POST http://localhost:8080/lila_shop/auth/token
```

## Request Headers
```
Content-Type: application/json
```

## Request Body (JSON)
```json
{
    "email": "admin@lilashop.com",
    "password": "admin"
}
```

## Cách test bằng cURL
```bash
curl -X POST http://localhost:8080/lila_shop/auth/token \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@lilashop.com\",\"password\":\"admin\"}"
```

## Cách test bằng Postman
1. Method: **POST**
2. URL: `http://localhost:8080/lila_shop/auth/token`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
    "email": "admin@lilashop.com",
    "password": "admin"
}
```

## Response thành công
```json
{
    "code": 200,
    "result": {
        "token": "eyJhbGciOiJIUzUxMiJ9...",
        "authenticated": true
    }
}
```

## Response lỗi "User không tồn tại" (code 1004)
Xảy ra khi:
- Email không tồn tại trong database
- Request không được gửi đúng format (thiếu body, sai method, v.v.)

## Lưu ý
- Default admin user được tạo tự động khi ứng dụng khởi động lần đầu
- Email: `admin@lilashop.com`
- Password: `admin`
- Có thể tạo user mới qua endpoint: `POST /lila_shop/users`

