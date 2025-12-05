# Hướng Dẫn Chuyển Đổi Từ Bán Sách Sang Bán Mỹ Phẩm

## Tổng Quan
Dự án đã được chuyển đổi từ bán sách (LuminaBook) sang bán mỹ phẩm (LilaShop). Hệ thống hiện sử dụng entity `Product` với các trường dành cho mỹ phẩm.

## Các Bước Thực Hiện (Theo Thứ Tự)

### **BƯỚC 1: Cập Nhật Backend - Entity và Repository**
**Prompt:**
```
Tôi muốn cập nhật entity Product để phù hợp với mỹ phẩm thay vì sách. Hãy:
1. Xóa các trường dành cho sách: author, publisher, publicationDate
2. Thêm các trường cho mỹ phẩm: brand, shadeColor, finish, skinType, skinConcern, volume, origin, expiryDate, ingredients, usageInstructions, safetyNote
3. Giữ lại các trường chung: name, description, price, category, media, reviews, inventory, promotions, vouchers
4. Cập nhật ProductRepository nếu cần
```

### **BƯỚC 2: Cập Nhật Backend - DTOs (Request/Response)**
**Prompt:**
```
Cập nhật các DTO cho Product:
1. ProductCreationRequest: xóa author, publisher, publicationDate; thêm brand, shadeColor, finish, skinType, skinConcern, volume, origin, expiryDate, ingredients, usageInstructions, safetyNote
2. ProductUpdateRequest: tương tự như trên
3. ProductResponse: cập nhật để hiển thị thông tin mỹ phẩm thay vì sách
4. ProductMapper: cập nhật mapping logic
```

### **BƯỚC 3: Cập Nhật Backend - Service Layer**
**Prompt:**
```
Cập nhật ProductService để:
1. Xóa logic xử lý author, publisher, publicationDate
2. Thêm validation cho các trường mỹ phẩm mới
3. Cập nhật các method createProduct, updateProduct để xử lý các trường mỹ phẩm
4. Đảm bảo tất cả business logic vẫn hoạt động đúng
```

### **BƯỚC 4: Cập Nhật Backend - Controller**
**Prompt:**
```
Kiểm tra và cập nhật ProductController:
1. Đảm bảo tất cả endpoints vẫn hoạt động
2. Cập nhật documentation/comments nếu có tham chiếu đến "sách"
3. Thêm validation cho các trường mới nếu cần
```

### **BƯỚC 5: Cập Nhật Frontend - Constants và Config**
**Prompt:**
```
Cập nhật file frontend/src/services/constants.js:
1. Đổi API_BASE_URL_FALLBACK từ 'lumina_book' sang 'lila_shop' (đã hoàn thành)
2. Cập nhật PRODUCT_CATEGORIES từ categories sách (novel, business, technology...) sang categories mỹ phẩm (skincare, makeup, haircare, fragrance, bodycare)
3. Cập nhật GHN_CONTENT từ 'Sách từ LuminaBook' sang 'Mỹ phẩm từ LilaShop' (đã hoàn thành)
4. Cập nhật INITIAL_FORM_STATE_PRODUCT: xóa author, publisher, publicationDate; thêm brand, shadeColor, finish, skinType, skinConcern, volume, origin, expiryDate, ingredients, usageInstructions, safetyNote
5. Cập nhật APPLY_SCOPE_OPTIONS: đổi 'Theo danh mục sách' thành 'Theo danh mục mỹ phẩm', 'Theo sách cụ thể' thành 'Theo sản phẩm cụ thể'
```

### **BƯỚC 6: Cập Nhật Frontend - Product Forms (Tạo/Sửa Sản Phẩm)**
**Prompt:**
```
Tìm và cập nhật tất cả form tạo/sửa sản phẩm trong frontend:
1. Xóa các input field: author, publisher, publicationDate
2. Thêm các input field mới cho mỹ phẩm: brand (bắt buộc), shadeColor, finish, skinType, skinConcern, volume, origin, expiryDate (date picker), ingredients (textarea), usageInstructions (textarea), safetyNote (textarea)
3. Cập nhật validation rules
4. Cập nhật labels và placeholders từ "sách" sang "mỹ phẩm"
5. Tìm trong: pages/Employees/Staff/ProductManagement/
```

### **BƯỚC 7: Cập Nhật Frontend - Product Display Components**
**Prompt:**
```
Cập nhật các component hiển thị sản phẩm:
1. ProductDetail component: xóa hiển thị author, publisher, publicationDate; thêm hiển thị brand, shadeColor, finish, skinType, volume, origin, expiryDate, ingredients, usageInstructions, safetyNote
2. ProductList/ProductCard: cập nhật để hiển thị thông tin mỹ phẩm
3. Cập nhật tất cả text từ "sách" sang "mỹ phẩm" hoặc "sản phẩm"
4. Tìm trong: components/Common/ProductDetail/, components/Common/ProductList/
```

### **BƯỚC 8: Cập Nhật Frontend - Pages**
**Prompt:**
```
Cập nhật các pages:
1. NewBookPage: đổi tên thành NewProductPage hoặc NewCosmeticPage, cập nhật logic và text
2. HomePage: cập nhật text từ "sách" sang "mỹ phẩm"
3. CategoryPage: cập nhật text
4. SearchResults: cập nhật text
5. Tất cả pages khác có tham chiếu đến "sách"
```

### **BƯỚC 9: Cập Nhật Frontend - Navigation và Branding**
**Prompt:**
```
Cập nhật navigation và branding:
1. Header/NavBar: đổi "LuminaBook" thành "LilaShop" (đã hoàn thành)
2. Footer: cập nhật text và branding
3. SideBar: cập nhật menu items từ "Sách" sang "Mỹ phẩm"
4. Logo và favicon: thay đổi nếu có
5. Tìm trong: layouts/components/Header/, layouts/components/Footer/, layouts/components/NavBar/, layouts/components/SideBar/
```

### **BƯỚC 10: Cập Nhật Frontend - Icons và Images**
**Prompt:**
```
Cập nhật assets:
1. Xóa hoặc thay thế icon_book.png
2. Cập nhật các hình ảnh liên quan đến sách (img_sach.png, img_sachgiadinh.png, etc.)
3. Thêm icon mỹ phẩm nếu cần
4. Cập nhật logo từ logo_luminabook.png sang logo mới (TODO: cần thay thế file logo)
5. Tìm trong: frontend/src/assets/
```

### **BƯỚC 11: Cập Nhật Frontend - Routes**
**Prompt:**
```
Cập nhật routes:
1. Đổi route '/new-book' thành '/new-product' hoặc '/new-cosmetic'
2. Cập nhật tất cả links và navigation references
3. Kiểm tra file: frontend/src/routes/routes.js và frontend/src/config/routes.js
```

### **BƯỚC 12: Cập Nhật Backend - Category Data**
**Prompt:**
```
Cập nhật categories trong database:
1. Tạo script migration hoặc SQL để:
   - Xóa các categories sách cũ 
   - Thêm categories mỹ phẩm mới: Chăm sóc da, Trang điểm, Chăm sóc tóc, Nước hoa, Chăm sóc cơ thể
   - Cập nhật subcategories phù hợp
2. Hoặc tạo endpoint admin để quản lý categories
```

### **BƯỚC 13: Cập Nhật Database Schema (Nếu Cần)**
**Prompt:**
```
Tạo migration script SQL để:
1. ALTER TABLE products: 
   - Xóa columns: author, publisher, publication_date
   - Thêm columns: brand (VARCHAR, NOT NULL), shade_color, finish, skin_type, skin_concern, volume, origin, expiry_date, ingredients (TEXT), usage_instructions (TEXT), safety_note (TEXT)
2. Backup dữ liệu cũ trước khi migration
3. Xử lý dữ liệu cũ (có thể migrate hoặc xóa)
```

### **BƯỚC 14: Cập Nhật Documentation và Comments**
**Prompt:**
```
Tìm và cập nhật tất cả comments và documentation:
1. Đổi "sách" thành "mỹ phẩm" hoặc "sản phẩm"
2. Đổi "LuminaBook" thành "LilaShop"
3. Cập nhật README.md
4. Cập nhật các file markdown khác
```

### **BƯỚC 15: Testing và Validation**
**Prompt:**
```
Sau khi hoàn thành các bước trên, hãy:
1. Kiểm tra tất cả API endpoints hoạt động đúng
2. Test form tạo/sửa sản phẩm với dữ liệu mỹ phẩm
3. Test hiển thị sản phẩm trên frontend
4. Test search và filter
5. Test cart và checkout flow
6. Kiểm tra không còn tham chiếu nào đến "sách" hoặc "book" trong UI
```

## Lưu Ý Quan Trọng

1. **Backup Database**: Luôn backup database trước khi thực hiện migration
2. **Thứ Tự Thực Hiện**: Thực hiện theo đúng thứ tự từ Bước 1 đến Bước 15
3. **Testing**: Test từng bước trước khi chuyển sang bước tiếp theo
4. **Data Migration**: Nếu có dữ liệu sách cũ, cần quyết định migrate hay xóa
5. **CosmeticProduct Entity**: Có thể cần quyết định sử dụng entity `CosmeticProduct` hiện có hay cập nhật `Product` entity

## Files Quan Trọng Cần Kiểm Tra

### Backend:
- `backend/src/main/java/com/lila_shop/backend/entity/Product.java`
- `backend/src/main/java/com/lila_shop/backend/dto/request/ProductCreationRequest.java`
- `backend/src/main/java/com/lila_shop/backend/dto/request/ProductUpdateRequest.java`
- `backend/src/main/java/com/lila_shop/backend/dto/response/ProductResponse.java`
- `backend/src/main/java/com/lila_shop/backend/service/ProductService.java`
- `backend/src/main/java/com/lila_shop/backend/controller/ProductController.java`

### Frontend:
- `frontend/src/services/constants.js`
- `frontend/src/components/Common/ProductDetail/ProductDetail.js`
- `frontend/src/components/Common/ProductList/`
- `frontend/src/pages/NewBook/NewBookPage.js`
- `frontend/src/pages/Employees/Staff/ProductManagement/`
- `frontend/src/layouts/components/Header/`
- `frontend/src/layouts/components/Footer/`
- `frontend/src/routes/routes.js`

## Gợi Ý Thêm

Nếu muốn giữ lại cả hai hệ thống (sách và mỹ phẩm), có thể:
- Tạo một field `productType` trong Product entity
- Hoặc sử dụng riêng biệt Product và CosmeticProduct
- Tạo separate routes và controllers

