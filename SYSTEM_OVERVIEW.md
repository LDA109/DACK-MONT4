# 📓 Tổng quan dự án: Nhà sách DACK-Thu4

Tài liệu này cung cấp cái nhìn chi tiết về kiến trúc, công nghệ và các luồng hoạt động của dự án Bookstore. Đây là tài liệu tham khảo cho việc phát triển và bảo trì hệ thống.

---

## 🚀 1. Tổng quan dự án & Công nghệ (Tech Stack)

Dự án được xây dựng theo mô hình **Client-Server (Mern-ish)** với Frontend tách rời Backend, giao tiếp qua REST API.

### **Frontend**
- **Framework:** React 19 (Vite)
- **Styling:** CSS Vanilla (CSS custom properties/variables)
- **State Management:** React Context API (`AuthContext`, `CartContext`)
- **Routing:** React Router v7
- **HTTP Client:** Axios (Interceptors để xử lý JWT & Error 401)
- **Xác thực:** JWT + Google OAuth (`@react-oauth/google`)
- **UI Feedback:** React Hot Toast

### **Backend**
- **Runtime:** Node.js
- **Framework:** Express.js 5
- **Database:** MongoDB (Mongoose ORM)
- **Xác thực:** JWT (JSON Web Token) + Bcryptjs
- **Thanh toán:** Tích hợp Cổng thanh toán VNPay (Sandbox)
- **AI:** Google Generative AI (dành cho các tính năng mở rộng trong tương lai)

---

## 📂 2. Cấu trúc thư mục (Folder Structure)

```text
DACK-Thu4/
├── backend/
│   ├── src/
│   │   ├── config/ (Kết nối DB)
│   │   ├── controllers/ (Logic xử lý request)
│   │   ├── middleware/ (Auth, AdminAuth)
│   │   ├── models/ (Cấu trúc Schema MongoDB)
│   │   ├── routes/ (Định nghĩa các điểm cuối API)
│   │   ├── services/ (VNPay, Mail, v.v.)
│   │   └── seed/ (Dữ liệu mẫu ban đầu)
│   ├── server.js (File chạy chính)
│   └── .env (Cấu hình môi trường)
├── frontend/
│   ├── src/
│   │   ├── components/ (Navbar, Footer, v.v.)
│   │   ├── context/ (AuthContext, CartContext)
│   │   ├── pages/ (Home, Books, Login, Admin, v.v.)
│   │   ├── services/ (api.js - Axios config)
│   │   └── App.jsx (Routing chính)
│   └── .env (Cấu hình Client)
└── IDEAS.md (Danh sách các tính năng cải tiến)
```

---

## 🛠 3. Chi tiết Backend

### **Mô hình Dữ liệu (Models)**
- **User:** Lưu thông tin người dùng (Tên, Email, Password hứa, Vai trò admin/user, GoogleId).
- **Book:** Thông tin sách (Tiêu đề, Tác giả, Giá, Tồn kho, Thuộc tính Flash Sale/Bestseller, v.v.).
- **Category:** Danh mục sách (Manga, Tiểu thuyết, v.v.).
- **Cart:** Giỏ hàng theo từng User.
- **Order:** Đơn hàng (Thông tin địa chỉ, Tổng tiền, Trạng thái thanh toán, Mã VNPay).

### **Hệ thống API**
| Prefix | Chức năng |
| :--- | :--- |
| `/api/auth` | Đăng ký, Đăng nhập (Local & Google), Profile |
| `/api/books` | Xem danh sách sách, Chi tiết, Flash-sale |
| `/api/categories` | Danh sách danh mục |
| `/api/cart` | CRUD Giỏ hàng (Cần đăng nhập) |
| `/api/orders` | Đặt hàng, Xem lịch sử đơn hàng |
| `/api/payment` | Tạo URL thanh toán VNPay, Callback nhận kết quả |
| `/api/admin` | Quản lý toàn bộ Sách, Đơn hàng, User (Chỉ Admin) |

---

## 💻 4. Chi tiết Frontend

### **Quản lý trạng thái (Contexts)**
- **AuthContext:** Lưu trữ thông tin người dùng đang đăng nhập (`user`) và token. Xử lý logic Login/Logout.
- **CartContext:** Quản lý giỏ hàng toàn cục, đồng bộ với Backend mỗi khi người dùng thêm/xóa sản phẩm.

### **Định tuyến (Routing)**
- **Public Routes:** Home, Books, BookDetail, Login, Register.
- **Protected Routes:** Profiles, Orders, Cart, Checkout (Yêu cầu đăng nhập).
- **Admin Routes:** Dashboard, Quản lý Sách/Đơn/User (Yêu cầu vai trò Admin).

---

## 🔄 5. Các luồng nghiệp vụ chính

### **A. Luồng Đăng nhập/Xác thực**
1. Người dùng gửi Email/Password hoặc dùng Google Login.
2. Backend xác thực -> Trả về JWT Token.
3. Frontend lưu Token vào `localStorage` -> Gắn vào Header `Authorization: Bearer <token>` cho mọi request sau đó (qua Axios Interceptor).

### **B. Luồng Mua hàng & Thanh toán (VNPay)**
1. **Giỏ hàng:** Người dùng thêm sách -> Lưu vào DB (Model Cart).
2. **Checkout:** Người dùng nhập địa chỉ -> Backend tạo Order (Trạng thái `pending`, P.Thức `vnpay`).
3. **Thanh toán:**
    - Frontend gọi `/api/payment/vnpay-create`.
    - Backend tạo URL VNPay -> Redirect người dùng sang trang thanh toán VNPay.
    - Sau khi thanh toán xong, VNPay gọi về `VNPayReturn.jsx` (Frontend) và `/api/payment/vnpay-ipn` (Backend).
    - Backend xác thực chữ ký -> Cập nhật Order thành `paid`.

### **C. Quản trị Admin**
- Admin có quyền CRUD (Thêm, Sửa, Xóa) các đầu sách.
- Xem thống kê doanh thu, đơn hàng tại Dashboard.
- Quản lý trạng thái đơn hàng (Đang giao, Đã giao).

---

## 📝 6. Ghi chú thêm
- Hệ thống sử dụng cơ chế **Double Check** cho VNPay (cả Return URL và IPN) để đảm bảo an toàn giao dịch.
- UI được thiết kế theo phong cách hiện đại với CSS Variables dễ dàng tùy chỉnh màu sắc chủ đạo.
