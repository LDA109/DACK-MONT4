# 🎟️ Tài liệu tính năng Mã giảm giá (Coupon)

Tài liệu này hướng dẫn cách sử dụng và quản lý tính năng mã giảm giá trong hệ thống Bookstore.

---

## 📖 1. Chức năng chính

Hệ thống hỗ trợ 2 loại giảm giá:
1.  **Giảm theo phần trăm (%)**: Ví dụ giảm 10% tổng giá trị đơn hàng. Có thể thiết lập mức giảm tối đa (VD: Giảm 10% tối đa 50k).
2.  **Giảm theo số tiền cố định (VND)**: Ví dụ giảm thẳng 50.000đ vào đơn hàng.

Các điều kiện áp dụng đi kèm:
-   **Giá trị đơn hàng tối thiểu**: Mã chỉ có hiệu lực khi tổng tiền hàng (tạm tính) đạt mức quy định.
-   **Thời hạn sử dụng**: Mã có ngày bắt đầu và ngày kết thúc rõ ràng.
-   **Giới hạn lượt dùng**: Mỗi mã có một số lượng sử dụng tối đa trên toàn hệ thống.

---

## 👨‍💼 2. Quản lý dành cho Admin

Admin có thể quản lý mã giảm giá tại đường dẫn: `/admin/coupons`.

### Các thao tác hỗ trợ:
-   **Tạo mã mới**: Nhập Code, chọn loại giảm giá, thiết lập giá trị và thời hạn.
-   **Bật/Tắt hoạt động**: Cho phép tạm dừng một mã giảm giá mà không cần xóa.
-   **Theo dõi sử dụng**: Xem số lần mã đã được khách hàng sử dụng thực tế.
-   **Xóa mã**: Xóa hoàn toàn mã khỏi hệ thống.

> [!TIP]
> Bạn nên đặt mã Code in hoa (ví dụ: `BOOK2024`) để người dùng dễ nhìn thấy và nhập liệu.

---

## 🛒 3. Trải nghiệm người dùng

Tại trang **Checkout (Thanh toán)**:
1.  Người dùng nhập mã vào ô "Mã giảm giá".
2.  Nhấn nút **"Áp dụng"**.
3.  Hệ thống sẽ gọi API kiểm tra tính hợp lệ:
    -   Nếu hợp lệ: Hiển thị số tiền được giảm và trừ trực tiếp vào tổng thanh toán.
    -   Nếu không hợp lệ: Hiển thị thông báo lỗi cụ thể (ví dụ: "Mã đã hết hạn", "Đơn hàng chưa đủ 200k",...).
4.  Sau khi đặt hàng và thanh toán thành công (VNPay hoặc COD), lượt dùng của mã sẽ tự động tăng thêm 1.

---

## 🛡️ 4. Cơ chế bảo mật & Kỹ thuật

-   **Xác thực 2 lớp**: Hệ thống kiểm tra mã giảm giá 1 lần tại giao diện (để hiển thị giá) và **1 lần nữa tại Server** khi tạo đơn hàng. Điều này ngăn chặn việc người dùng cố tình can thiệp vào giá tiền từ phía trình duyệt.
-   **Đồng bộ VNPay**: Số tiền gửi sang cổng thanh toán VNPay luôn là số tiền cuối cùng sau khi đã trừ đi giảm giá, đảm bảo khách hàng thanh toán đúng số tiền hiển thị.

---

*Tài liệu được khởi tạo tự động bởi Antigravity AI.*
