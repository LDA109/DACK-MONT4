# 💡 Danh sách Ý tưởng Cải tiến Project: DACK-Thu4 (Bookstore)

Dưới đây là danh sách các tính năng được đề xuất để nâng cấp đồ án Bookstore, sắp xếp theo độ ưu tiên và mục tiêu phát triển.

---

## ⭐️ 1. Hệ thống Đánh giá & Nhận xét (Reviews & Ratings)
- **Mô tả:** Người dùng đã mua hàng có thể bình luận và chấm điểm sao.
- **Yêu cầu:** 
  - Model `Review` lưu database.
  - API POST để gửi đánh giá, API GET để lấy danh sách đánh giá theo sách.
  - UI tại trang `BookDetail` để hiển thị và cho phép người dùng nhập đánh giá.
- **Trạng thái:** 📅 Chờ triển khai

## 💖 2. Danh sách yêu thích (Wishlist)
- **Mô tả:** Nút "Lưu vào Wishlist" tại trang danh sách sách và chi tiết sách.
- **Yêu cầu:**
  - Endpoint để add/remove sách khỏi wishlist trong model `User` hoặc model `Wishlist` riêng.
  - Trang quản lý Wishlist riêng để người dùng xem lại.
- **Trạng thái:** 📅 Chờ triển khai

## 🎫 3. Quản lý Mã giảm giá (Vouchers/Coupons)
- **Mô tả:** Hệ thống giảm giá bằng mã code trực tiếp khi thanh toán.
- **Yêu cầu:**
  - Model `Voucher` với các trường: `code`, `discountType` (phần trăm hoặc tiền mặt), `expiryDate`, `minOrderValue`.
  - Logic kiểm tra mã ở Backend khi người dùng nhấn "Áp dụng" ở Checkout.
- **Trạng thái:** 📅 Chờ triển khai

## 🔍 4. Bộ lọc & Tìm kiếm nâng cao (Advanced Filters)
- **Mô tả:** Giúp khách hàng tìm sách nhanh hơn.
- **Yêu cầu:**
  - Lọc theo: `Price Range`, `Publisher`, `Author`, `Category`.
  - Sắp xếp theo: `Newest`, `Price Low-High`, `Price High-Low`.
- **Trạng thái:** 📅 Chờ triển khai

## 🔄 5. Gợi ý sách thông minh (Recommendations)
- **Mô tả:** Mục "Sách tương quan" hoặc "Bạn có thể thích".
- **Yêu cầu:**
  - Logic backend gợi ý dựa trên cùng `Category` hoặc cùng `Author`.
  - Hiển thị theo dạng slide (Carousel) ở cuối trang chi tiết sách.
- **Trạng thái:** 📅 Chờ triển khai

## 📧 6. Thông báo tự động qua Email (Email Notifications)
- **Mô tả:** Email xác nhận đơn hàng, đổi mật khẩu, v.v.
- **Yêu cầu:**
  - Thư viện `Nodemailer`.
  - Cấu hình SMTP (Gmail hoặc Mailtrap).
- **Trạng thái:** 📅 Chờ triển khai

## 📊 7. Thống kê Admin (Admin Dashboard Analytics)
- **Mô tả:** Biểu đồ hóa dữ liệu cho người quản trị.
- **Yêu cầu:**
  - Biểu đồ doanh thu ngày/tháng.
  - Thống kê sách bán chạy nhất.
  - Thư viện `Chart.js` hoặc `Recharts`.
- **Trạng thái:** 📅 Chờ triển khai

---
*Ghi chú: Bạn có thể đánh dấu [x] vào các đầu mục khi đã hoàn thành.*
