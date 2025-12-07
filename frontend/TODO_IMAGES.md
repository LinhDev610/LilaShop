# TODO: Thay thế ảnh mẫu/mặc định trong Frontend

## 📋 Tổng quan
File này liệt kê tất cả các ảnh mẫu/mặc định (placeholder/fallback images) đang được sử dụng trong frontend, cần được thay thế bằng ảnh thực tế phù hợp với dự án mỹ phẩm.

## ⚠️ Lưu ý quan trọng về Banner/Slide

### ✅ **TỰ ĐỘNG THAY THẾ** (Không cần thay ảnh trong code)
- **Hero Banner/Slide chính** (`Banner1` - bên trái):
  - **Tự động lấy từ API**: `/banners/active`
  - Khi bạn thêm banner vào database với `status = true`, frontend sẽ **tự động hiển thị**
  - Nếu có nhiều banners → tự động tạo carousel với auto-play 10s
  - **Fallback**: Chỉ dùng `img_qc.png` khi không có banners từ API
  - **File liên quan**: `frontend/src/hooks/useBanners.js`, `frontend/src/pages/Home/Home.js` (line 124-127)

### ✅ **TỰ ĐỘNG THAY THẾ** (Đã cập nhật - Không cần thay ảnh trong code)
- **Promo Banners** (3 ảnh nhỏ bên phải trong `Banner1`):
  - ✅ **Đã cập nhật**: Tự động lấy từ API với `orderIndex` 100-199
  - **Fallback**: Dùng `PROMO_ITEMS` khi không có banners từ API
  - **File liên quan**: `frontend/src/hooks/useBanners.js` (useCategorizedBanners), `frontend/src/pages/Home/Home.js`
  
- **Banner2** (3 banner dưới hero banner):
  - ✅ **Đã cập nhật**: Tự động lấy từ API với `orderIndex` 200-299
  - **Fallback**: Dùng `BANNER_ITEMS` khi không có banners từ API
  - **File liên quan**: `frontend/src/hooks/useBanners.js` (useCategorizedBanners), `frontend/src/pages/Home/Home.js`

---

## 🖼️ Ảnh mẫu hiện tại

### 1. **Ảnh sản phẩm mặc định (Product Fallback Images)**

#### `img_qc.png` - Ảnh mặc định chính cho sản phẩm
**Vị trí:** `frontend/src/assets/images/img_qc.png`

**Đang được sử dụng tại:**
- ✅ `frontend/src/services/utils.js` (line 3)
  - Export: `PRODUCT_IMAGE_FALLBACK`
  - Sử dụng trong: `mapProductToCard()` function (line 239)
  
- ✅ `frontend/src/components/Common/ProductCard/ProductCard.js` (line 5)
  - Import: `defaultProductImage`
  - Sử dụng khi: `image || imageUrl || thumbnailUrl || defaultMediaUrl || mediaUrl` không có
  - **TODO comment:** "Fallback image for products - TODO: Replace with cosmetic product placeholder image"

- ✅ `frontend/src/pages/CartPage/CartPage.js` (line 18)
  - Import: `defaultProductImage`
  - Sử dụng khi: `meta.imageUrl` không có (line 134, 166, 648)
  - **TODO comment:** "Fallback image for products - TODO: Replace with cosmetic product placeholder image"

- ✅ `frontend/src/pages/CheckoutPage/ConfirmCheckout/ConfirmCheckoutPage.js` (line 6)
  - Import: `defaultProductImage`
  - Sử dụng khi: `item.imageUrl` không có (line 334, 343)
  - **TODO comment:** "Fallback image for products - TODO: Replace with cosmetic product placeholder image"

- ✅ `frontend/src/pages/CheckoutPage/CheckoutDetails/CheckoutDetailPage.js` (line 8)
  - Import: `defaultProductImage`
  - Sử dụng khi: `meta.imageUrl` không có (line 218, 261, 294, 843, 1092, 1134)
  - **TODO comment:** "Fallback image for products - TODO: Replace with cosmetic product placeholder image"

- ✅ `frontend/src/pages/CustomerAccount/CustomerOrderHistory/CustomerOrderHistoryPage.js` (line 7)
  - Import: `defaultProductImage`
  - Sử dụng cho: Order history items

- ✅ `frontend/src/components/Common/ProductDetail/ProductDetail.js` (line 13, 16)
  - Import: `imgSach`, `imgQc`
  - Sử dụng trong: `heroFallback` và `onError` handler (line 655)
  - **TODO comment:** "Fallback images for products - TODO: Replace with cosmetic product images"

#### `img_qc1.png` - Ảnh mẫu phụ 1
**Vị trí:** `frontend/src/assets/images/img_qc1.png`

**Đang được sử dụng tại:**
- ✅ `frontend/src/pages/Home/Home.js` (line 11, 13)
  - Import: `promoImage2`, `bannerImage1`
  - Sử dụng cho: Promo banners và promotional banners

- ✅ `frontend/src/components/Common/ProductDetail/ProductDetail.js` (line 14)
  - Import: `imgTaiChinh`
  - Sử dụng cho: Product detail fallback

#### `img_qc2.png` - Ảnh mẫu phụ 2
**Vị trí:** `frontend/src/assets/images/img_qc2.png`

**Đang được sử dụng tại:**
- ✅ `frontend/src/pages/Home/Home.js` (line 12, 14)
  - Import: `promoImage3`, `bannerImage2`
  - Sử dụng cho: Promo banners và promotional banners

- ✅ `frontend/src/components/Common/ProductDetail/ProductDetail.js` (line 15)
  - Import: `imgSachGiaDinh`
  - Sử dụng cho: Product detail fallback

---

### 2. **Ảnh Banner mặc định (Banner Fallback Images)**

#### `img_qc.png` - Banner hero mặc định
**Vị trí:** `frontend/src/assets/images/img_qc.png`

**Đang được sử dụng tại:**
- ✅ `frontend/src/pages/Home/Home.js` (line 10, 15, 17)
  - Import: `heroImage`, `bannerImage3`, `imgsach_test`
  - Sử dụng cho:
    - Hero banner fallback (line 180): `heroImages={banners.length ? banners : [heroImage]}`
    - Banner 3 trong promotional banners
    - Promo item trong Banner1

#### `img_christmas.png` - Background banner
**Vị trí:** `frontend/src/assets/images/img_christmas.png`

**Đang được sử dụng tại:**
- ✅ `frontend/src/pages/Home/Home.js` (line 16)
  - Import: `bgChristmas`
  - Sử dụng cho: Featured section background (line 244)
  - **Lưu ý:** Đây là ảnh nền cho section "Tết ông trăng", có thể cần thay đổi theo mùa/sự kiện

---

## 📝 Chi tiết theo file

### `frontend/src/pages/Home/Home.js`
**Tất cả ảnh mẫu được import:**
```javascript
import heroImage from '../../assets/images/img_qc.png';          // Hero banner fallback
import promoImage2 from '../../assets/images/img_qc1.png';       // Promo banner 2
import promoImage3 from '../../assets/images/img_qc2.png';       // Promo banner 3
import bannerImage1 from '../../assets/images/img_qc1.png';      // Banner 1
import bannerImage2 from '../../assets/images/img_qc2.png';      // Banner 2
import bannerImage3 from '../../assets/images/img_qc.png';      // Banner 3
import bgChristmas from '../../assets/images/img_christmas.png'; // Background
import imgsach_test from '../../assets/images/img_qc.png';      // Test promo
```

**Sử dụng:**
- Line 180: Hero banner fallback khi không có banners từ API
- Line 182-185: Promo items cho Banner1
- Line 193-196: Banner items cho Banner2
- Line 244: Background cho featured section

### `frontend/src/services/utils.js`
**Export constant:**
```javascript
import PRODUCT_IMAGE_FALLBACK from '../assets/images/img_qc.png';
```
- Sử dụng trong `mapProductToCard()` function
- Được import và sử dụng ở nhiều nơi khác

### `frontend/src/components/Common/ProductCard/ProductCard.js`
**Fallback logic:**
```javascript
const resolvedImage =
    image ||
    imageUrl ||
    thumbnailUrl ||
    product.defaultMediaUrl ||
    product.mediaUrl ||
    defaultProductImage; // ← img_qc.png
```

### `frontend/src/components/Common/ProductDetail/ProductDetail.js`
**Fallback images:**
```javascript
import imgSach from '../../../assets/images/img_qc.png';
import imgTaiChinh from '../../../assets/images/img_qc1.png';
import imgSachGiaDinh from '../../../assets/images/img_qc2.png';
import imgQc from '../../../assets/images/img_qc.png';
```
- Sử dụng trong `heroFallback` và `onError` handler

---

## ✅ Checklist thay thế

### Ảnh sản phẩm cần thay thế:
- [ ] `img_qc.png` → Ảnh placeholder mỹ phẩm chuyên nghiệp
- [ ] `img_qc1.png` → Ảnh mỹ phẩm phụ 1 (nếu cần)
- [ ] `img_qc2.png` → Ảnh mỹ phẩm phụ 2 (nếu cần)

### Ảnh banner cần thay thế:
- [ ] **Hero banner fallback** (`img_qc.png`) → Banner mỹ phẩm chuyên nghiệp
  - ⚠️ **Lưu ý**: Chỉ dùng khi không có banners từ API. Nếu đã có banners trong database thì không cần thay.
  
- [ ] **Promo banners** (3 ảnh) → Banner khuyến mãi mỹ phẩm
  - ⚠️ **Lưu ý**: Đang hardcoded, cần thay trong code HOẶC cập nhật logic để lấy từ API
  
- [ ] **Banner2** (3 banner) → Banner marketing mỹ phẩm
  - ⚠️ **Lưu ý**: Đang hardcoded, cần thay trong code HOẶC cập nhật logic để lấy từ API
  
- [ ] **Background** `img_christmas.png` → Background phù hợp với theme mỹ phẩm hoặc theo mùa

---

## 🎯 Yêu cầu ảnh thay thế

### Ảnh sản phẩm placeholder:
- **Kích thước:** 400x400px (hoặc tỷ lệ 1:1)
- **Format:** PNG với nền trong suốt hoặc nền trắng
- **Nội dung:** Icon/illustration mỹ phẩm chung (không phải sản phẩm cụ thể)
- **Style:** Minimalist, professional, phù hợp với brand

### Ảnh banner:
- **Kích thước:** 
  - Hero banner: 1920x600px (hoặc tỷ lệ 16:5)
  - Promo banners: 600x300px (hoặc tỷ lệ 2:1)
- **Format:** PNG hoặc JPG (tối ưu hóa)
- **Nội dung:** Banner marketing mỹ phẩm, có thể có text overlay
- **Style:** Modern, attractive, phù hợp với brand identity

---

## 📌 Lưu ý

1. **Sau khi thay thế ảnh:**
   - Kiểm tra tất cả các file import để đảm bảo đường dẫn đúng
   - Test trên các màn hình khác nhau (responsive)
   - Kiểm tra performance (kích thước file, loading time)
   - Xóa các TODO comments sau khi hoàn thành

2. **Tối ưu hóa:**
   - Nén ảnh trước khi commit
   - Sử dụng WebP format nếu có thể (với fallback)
   - Lazy loading đã được implement, đảm bảo ảnh mới cũng support

3. **Naming convention:**
   - Đề xuất đổi tên file cho rõ ràng:
     - `img_qc.png` → `product-placeholder.png` hoặc `default-product-image.png`
     - `img_qc1.png` → `banner-promo-1.png`
     - `img_qc2.png` → `banner-promo-2.png`
     - `img_christmas.png` → `banner-background.png` hoặc `seasonal-banner-bg.png`

---

## 🔗 Files cần cập nhật sau khi thay ảnh

1. `frontend/src/pages/Home/Home.js` - 8 imports
2. `frontend/src/services/utils.js` - 1 import
3. `frontend/src/components/Common/ProductCard/ProductCard.js` - 1 import
4. `frontend/src/components/Common/ProductDetail/ProductDetail.js` - 4 imports
5. `frontend/src/pages/CartPage/CartPage.js` - 1 import
6. `frontend/src/pages/CheckoutPage/ConfirmCheckout/ConfirmCheckoutPage.js` - 1 import
7. `frontend/src/pages/CheckoutPage/CheckoutDetails/CheckoutDetailPage.js` - 1 import
8. `frontend/src/pages/CustomerAccount/CustomerOrderHistory/CustomerOrderHistoryPage.js` - 1 import

**Tổng cộng: 18 imports cần cập nhật**

---

## 🔄 Cách hoạt động của Banner System

### ✅ Tất cả banners đều tự động lấy từ API

**Phân loại banners theo `orderIndex`:**
- **orderIndex 0-99**: Hero banners (slide chính bên trái)
- **orderIndex 100-199**: Promo banners (3 ảnh nhỏ bên phải)
- **orderIndex 200-299**: Banner2 (3 banner dưới hero banner)

### Hero Banner
```javascript
// frontend/src/pages/Home/Home.js
const allBanners = useBanners(); // Fetch từ API /banners/active
const { hero: heroBanners } = useCategorizedBanners(allBanners);
const heroImages = useMemo(() => 
    heroBanners.length > 0 ? heroBanners : [heroImage], // Tự động thay thế
    [heroBanners]
);
```

### Promo Banners
```javascript
const { promo: promoBanners } = useCategorizedBanners(allBanners);
const promoItems = useMemo(() => {
    if (promoBanners.length > 0) {
        // Fill to 3 items if needed with fallback
        const result = [...promoBanners];
        for (let i = result.length; i < 3 && i < PROMO_ITEMS.length; i++) {
            result.push(PROMO_ITEMS[i]);
        }
        return result.slice(0, 3);
    }
    return PROMO_ITEMS; // Fallback
}, [promoBanners]);
```

### Banner2
```javascript
const { bottom: bottomBanners } = useCategorizedBanners(allBanners);
const bottomBannerItems = useMemo(() => {
    if (bottomBanners.length > 0) {
        // Fill to 3 items if needed with fallback
        const result = [...bottomBanners];
        for (let i = result.length; i < 3 && i < BANNER_ITEMS.length; i++) {
            result.push({ ...BANNER_ITEMS[i], variant: i + 1 });
        }
        return result.slice(0, 3);
    }
    return BANNER_ITEMS; // Fallback
}, [bottomBanners]);
```

**Khi thêm banner vào database:**
1. Tạo banner với `status = true` (active)
2. Set `imageUrl` và `orderIndex`:
   - `orderIndex` 0-99 → Hero banner
   - `orderIndex` 100-199 → Promo banner
   - `orderIndex` 200-299 → Bottom banner
3. Set `linkUrl` (optional) để banner có thể click
4. Frontend tự động fetch, phân loại và hiển thị
5. Nếu có nhiều hero banners → tự động tạo carousel

**API Endpoint:** `GET /banners/active`
- Trả về: `{ result: [{ imageUrl: "...", orderIndex: 1, linkUrl: "...", title: "...", ... }] }`
- Frontend tự động normalize URL, phân loại và hiển thị

---

*Cập nhật lần cuối: [Ngày hiện tại]*
*Người tạo: AI Assistant*

