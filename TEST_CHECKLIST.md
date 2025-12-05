# Test Checklist - LilaShop Migration

## ✅ Checklist Kiểm Tra Sau Migration

### 1. Kiểm Tra API Endpoints

#### Backend Product APIs
- [ ] `POST /lila_shop/products` - Tạo sản phẩm mỹ phẩm mới
  - Test với dữ liệu mỹ phẩm đầy đủ (brand, shadeColor, expiryDate, etc.)
  - Kiểm tra validation cho các trường bắt buộc
  - Kiểm tra không còn trường author/publisher/publicationDate

- [ ] `GET /lila_shop/products` - Lấy danh sách tất cả sản phẩm
  - Kiểm tra response có đầy đủ thông tin mỹ phẩm
  - Kiểm tra không còn trường author/publisher/publicationDate

- [ ] `GET /lila_shop/products/{id}` - Lấy chi tiết sản phẩm
  - Kiểm tra response có brand, shadeColor, expiryDate, ingredients, etc.
  - Kiểm tra không còn trường author/publisher/publicationDate

- [ ] `PUT /lila_shop/products/{id}` - Cập nhật sản phẩm
  - Test cập nhật các trường mỹ phẩm mới
  - Kiểm tra validation

- [ ] `GET /lila_shop/products/search?keyword=...` - Tìm kiếm sản phẩm
  - Test tìm kiếm theo brand, name, ingredients
  - Kiểm tra không tìm theo author/publisher

- [ ] `GET /lila_shop/products/category/{categoryId}` - Lấy sản phẩm theo danh mục
  - Test với các danh mục mỹ phẩm mới (Chăm sóc da, Trang điểm, etc.)

#### Other APIs
- [ ] `GET /lila_shop/categories` - Lấy danh sách danh mục
  - Kiểm tra có 5 danh mục mỹ phẩm chính
  - Kiểm tra không còn danh mục sách cũ

- [ ] `POST /lila_shop/cart` - Thêm vào giỏ hàng
  - Test với sản phẩm mỹ phẩm

- [ ] `POST /lila_shop/orders` - Tạo đơn hàng
  - Test checkout với sản phẩm mỹ phẩm

---

### 2. Test Form Tạo/Sửa Sản Phẩm

#### Staff Add Product Form (`/staff/products/new`)
- [ ] Form hiển thị đầy đủ các trường mỹ phẩm:
  - [ ] brand (bắt buộc)
  - [ ] shadeColor
  - [ ] finish
  - [ ] skinType
  - [ ] skinConcern
  - [ ] volume
  - [ ] origin
  - [ ] expiryDate (date picker)
  - [ ] ingredients (textarea)
  - [ ] usageInstructions (textarea)
  - [ ] safetyNote (textarea)

- [ ] Form KHÔNG hiển thị các trường cũ:
  - [ ] author (không có)
  - [ ] publisher (không có)
  - [ ] publicationDate (không có)

- [ ] Validation hoạt động:
  - [ ] brand là bắt buộc
  - [ ] expiryDate là date hợp lệ
  - [ ] price > 0

- [ ] Submit form thành công với dữ liệu mỹ phẩm

#### Staff Update Product Form (`/staff/products/{id}/update`)
- [ ] Form load đúng dữ liệu sản phẩm hiện có
- [ ] Cập nhật các trường mỹ phẩm thành công
- [ ] Không còn trường author/publisher/publicationDate

#### Admin Product Forms
- [ ] `/admin/products/:id/update` - Tương tự như Staff form

---

### 3. Test Hiển Thị Sản Phẩm

#### Product Detail Page (`/product/:id`)
- [ ] Hiển thị đầy đủ thông tin mỹ phẩm:
  - [ ] brand
  - [ ] shadeColor
  - [ ] finish
  - [ ] skinType
  - [ ] volume
  - [ ] origin
  - [ ] expiryDate
  - [ ] ingredients
  - [ ] usageInstructions
  - [ ] safetyNote

- [ ] KHÔNG hiển thị:
  - [ ] author
  - [ ] publisher
  - [ ] publicationDate

#### Product List/Card
- [ ] ProductCard hiển thị đúng thông tin mỹ phẩm
- [ ] ProductList hiển thị danh sách sản phẩm đúng
- [ ] Không còn text "sách" trong UI

#### Home Page (`/`)
- [ ] Section "MỸ PHẨM YÊU THÍCH" hiển thị đúng
- [ ] Section "MỸ PHẨM BÁN CHẠY" hiển thị đúng
- [ ] Section "MỸ PHẨM MỚI" hiển thị đúng
- [ ] Không còn text "sách" trong banner/tiêu đề

#### New Product Page (`/new-product`)
- [ ] Tiêu đề "SẢN PHẨM MỚI" (không phải "SÁCH MỚI")
- [ ] Hiển thị danh sách sản phẩm mới đúng
- [ ] Không còn text "sách" trong page

#### Category Page (`/category/:id`)
- [ ] Hiển thị sản phẩm theo danh mục mỹ phẩm
- [ ] Filter hoạt động đúng

---

### 4. Test Search và Filter

#### Search Functionality
- [ ] Search theo tên sản phẩm hoạt động
- [ ] Search theo brand hoạt động
- [ ] Search theo ingredients hoạt động
- [ ] Search KHÔNG tìm theo author/publisher (vì đã xóa)

#### Filter Functionality
- [ ] Filter theo category (danh mục mỹ phẩm) hoạt động
- [ ] Filter theo price range hoạt động
- [ ] Filter theo brand (nếu có) hoạt động
- [ ] Sort (mới nhất, giá, bán chạy) hoạt động

---

### 5. Test Cart và Checkout Flow

#### Cart Page (`/cart`)
- [ ] Thêm sản phẩm mỹ phẩm vào cart thành công
- [ ] Hiển thị thông tin sản phẩm trong cart đúng
- [ ] Cập nhật quantity thành công
- [ ] Xóa sản phẩm khỏi cart thành công
- [ ] Apply voucher/promotion thành công

#### Checkout Flow
- [ ] `/checkout` - Nhập thông tin giao hàng
- [ ] `/checkout/confirm` - Xác nhận đơn hàng
  - [ ] Hiển thị đúng sản phẩm mỹ phẩm
  - [ ] Tính toán shipping fee đúng
  - [ ] Apply voucher/promotion đúng
- [ ] `/order-success` - Xác nhận đặt hàng thành công
- [ ] Tạo đơn hàng thành công trong database

#### Order History
- [ ] `/customer-account/orders` - Hiển thị danh sách đơn hàng
- [ ] `/customer-account/orders/:id` - Chi tiết đơn hàng
  - [ ] Hiển thị đúng sản phẩm mỹ phẩm
  - [ ] Không còn text "sách"

---

### 6. Kiểm Tra UI - Không Còn Tham Chiếu "Sách" hoặc "Book"

#### Navigation & Header
- [ ] Header logo hiển thị "LilaShop" (không phải "LuminaBook")
- [ ] NavBar link "SẢN PHẨM MỚI" (không phải "SÁCH MỚI")
- [ ] Search placeholder: "Tìm kiếm theo tên sản phẩm..." (không phải "tên tác phẩm")

#### Footer
- [ ] Footer hiển thị "LilaShop"
- [ ] Footer có "Danh mục mỹ phẩm" (không phải "Danh mục sách")
- [ ] Email: support@lilashop.com

#### Pages
- [ ] HomePage: Không còn text "sách"
- [ ] CategoryPage: Không còn text "sách"
- [ ] SearchResults: Không còn text "sách"
- [ ] ProductDetail: Không còn text "sách"
- [ ] NewProductPage: Không còn text "sách"
- [ ] Support pages: Không còn text "sách"

#### Admin/Staff Pages
- [ ] Product Management: Không còn text "sách"
- [ ] Voucher/Promotion pages: 
  - [ ] "Theo danh mục mỹ phẩm" (không phải "Theo loại sách")
  - [ ] "Theo sản phẩm cụ thể" (không phải "Theo sách cụ thể")
- [ ] Order Management: Không còn text "sách"

#### Sidebar/Menu
- [ ] Sidebar menu: "Mỹ phẩm" (không phải "Sách")
- [ ] Tất cả menu items không còn text "sách"

---

### 7. Kiểm Tra Database

#### Products Table
- [ ] Columns đã xóa: `author`, `publisher`, `publication_date` (KHÔNG còn)
- [ ] Columns mới đã có: `brand`, `shade_color`, `finish`, `skin_type`, `skin_concern`, `volume`, `origin`, `expiry_date`, `ingredients`, `usage_instructions`, `safety_note`
- [ ] `brand` là NOT NULL
- [ ] Test insert sản phẩm mỹ phẩm mới thành công

#### Categories Table
- [ ] Không còn categories sách cũ
- [ ] Có 5 root categories mỹ phẩm:
  - [ ] Chăm sóc da
  - [ ] Trang điểm
  - [ ] Chăm sóc tóc
  - [ ] Nước hoa
  - [ ] Chăm sóc cơ thể
- [ ] Có đầy đủ subcategories

---

### 8. Kiểm Tra Constants và Config

#### Frontend Constants (`frontend/src/services/constants.js`)
- [ ] `API_BASE_URL_FALLBACK` = `'http://localhost:8080/lila_shop'`
- [ ] `PRODUCT_CATEGORIES` có categories mỹ phẩm
- [ ] `GHN_CONTENT` = `'Mỹ phẩm từ LilaShop'`
- [ ] `INITIAL_FORM_STATE_PRODUCT` có các trường mỹ phẩm
- [ ] `APPLY_SCOPE_OPTIONS` có "Theo danh mục mỹ phẩm", "Theo sản phẩm cụ thể"

#### Backend Constants
- [ ] `GhnConstants.CONTENT` = `"Mỹ phẩm từ LilaShop"`

---

### 9. Kiểm Tra Routes

#### Frontend Routes
- [ ] Route `/new-product` hoạt động (không phải `/new-book`)
- [ ] Route `/product/:id` hoạt động
- [ ] Route `/category/:id` hoạt động
- [ ] Tất cả routes không còn `/book` hoặc `/books`

#### Navigation Links
- [ ] Tất cả links trong NavBar/Footer/Sidebar đúng
- [ ] Không còn link đến `/new-book`

---

### 10. Kiểm Tra Assets

#### Images
- [ ] Logo: `logo_luminabook.png` vẫn còn (TODO: cần thay thế)
- [ ] Icon: `icon_book.png` đã xóa hoặc không được sử dụng
- [ ] Các hình ảnh sách cũ đã được xóa hoặc thay thế

#### Manifest
- [ ] `public/manifest.json` có `"short_name": "LilaShop"`
- [ ] `public/manifest.json` có `"name": "LilaShop - Mỹ phẩm chính hãng"`

---

## 🐛 Issues Cần Lưu Ý

### Known Issues (Cần Fix Sau)
1. **Folder `NewBook`** vẫn còn tên cũ (component đã đổi thành `NewProductPage`)
   - Route đã đổi thành `/new-product` ✅
   - Component name đã đổi ✅
   - Folder name vẫn là `NewBook` (có thể giữ nguyên hoặc đổi sau)

2. **Folder `BannerBookList`** vẫn còn tên cũ
   - Route vẫn là `/books` (cần đổi thành `/products`)
   - Component name vẫn là `BannerBookListPage` (có thể đổi sau)

3. **Logo file** `logo_luminabook.png` vẫn còn
   - Đã có TODO comments trong code
   - Cần thay thế bằng logo LilaShop mới

---

## 📝 Test Data Mẫu

### Sản Phẩm Mỹ Phẩm Mẫu
```json
{
  "name": "Kem dưỡng ẩm Hyaluronic Acid",
  "description": "Kem dưỡng ẩm chuyên sâu với Hyaluronic Acid",
  "price": 350000,
  "categoryId": "category-id-cham-soc-da",
  "brand": "LilaCosmetics",
  "shadeColor": "Trong suốt",
  "finish": "Matte",
  "skinType": "Mọi loại da",
  "skinConcern": "Khô, thiếu ẩm",
  "volume": "50ml",
  "origin": "Hàn Quốc",
  "expiryDate": "2026-12-31",
  "ingredients": "Hyaluronic Acid, Glycerin, Ceramides",
  "usageInstructions": "Thoa đều lên mặt vào buổi sáng và tối",
  "safetyNote": "Tránh tiếp xúc với mắt",
  "inventory": {
    "quantity": 100
  }
}
```

---

## ✅ Checklist Hoàn Thành

Sau khi hoàn thành tất cả các test trên, đánh dấu:
- [ ] Tất cả API endpoints hoạt động đúng
- [ ] Form tạo/sửa sản phẩm hoạt động đúng
- [ ] Hiển thị sản phẩm đúng
- [ ] Search và filter hoạt động đúng
- [ ] Cart và checkout flow hoạt động đúng
- [ ] Không còn tham chiếu "sách" hoặc "book" trong UI
- [ ] Database schema đúng
- [ ] Routes và navigation đúng

---

## 📞 Support

Nếu gặp vấn đề trong quá trình test, kiểm tra:
1. Backend đang chạy trên port 8080
2. Frontend đang chạy trên port 3000
3. Database đã được migrate đúng
4. API base URL đúng: `http://localhost:8080/lila_shop`




