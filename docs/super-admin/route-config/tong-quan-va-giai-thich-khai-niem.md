---
id: GSA-ROUTE-1
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Tổng quan và giải thích khái niệm

## User Story

Là GHN Super Admin, tôi muốn hiểu rõ mối quan hệ giữa Miền, Cặp miền và Tuyến ngay trên trang cấu hình, để không cấu hình sai khi thêm/sửa miền hoặc tuyến ở các khối bên dưới.

## User Flow

1. Vào trang "Vùng & Tuyến" (`/super-admin/route-config`).
2. Ngay dưới tiêu đề trang là khối giải thích màu xanh nhạt "Cách tuyến được tính ra", gồm 3 khái niệm theo thứ tự: Miền → Cặp miền → Tuyến.
3. Cuối khối có 1 ví dụ trực quan: đơn gửi từ Hà Nội đến TP. Hồ Chí Minh → cặp miền "Hà Nội (Đặc biệt)" ↔ "TP. Hồ Chí Minh (Đặc biệt)" → tuyến "Liên Vùng Đặc Biệt".
4. Ở góc phải tiêu đề trang có nút "↻ Thiết lập lại" — tải lại toàn bộ trang, xem GSA-ROUTE-5 (dữ liệu dùng chung) và các story cấu hình bên dưới để biết tác động.

## System Flow

1. `RouteConfig.tsx` — tiêu đề trang "Vùng & Tuyến" (rút gọn từ "Cấu hình Vùng & Tuyến"), mô tả 1 dòng "Cấu hình vùng, miền và tuyến dùng chung cho mọi đại lý."
2. Khối giải thích là nội dung tĩnh (không đọc dữ liệu động), gồm 3 card: "1. Miền" (nhóm các tỉnh lại — mỗi tỉnh thuộc đúng 1 miền), "2. Cặp miền" (2 miền ghép lại khi có đơn gửi từ tỉnh miền này đến tỉnh miền kia — kể cả gửi trong cùng 1 miền), "3. Tuyến" (tên đặt cho 1 hoặc nhiều cặp miền, dùng để tính giá — nhiều cặp có thể chung 1 tên nếu muốn tính cùng giá).
3. Ví dụ minh hoạ cuối khối cũng là chuỗi tĩnh, không đổi theo dữ liệu thật đang cấu hình.
4. Nút "Thiết lập lại" gọi `window.location.reload()` — tải lại toàn bộ trang, reset MỌI thay đổi trong phiên (Cấu hình vùng miền, Cấu hình tuyến, Nội/Ngoại thành) về dữ liệu mẫu gốc vì store chỉ là module-level in-memory, không có backend/localStorage.

## Acceptance Criteria

**AC1:** Khối giải thích luôn hiển thị ngay dưới tiêu đề trang, trước mọi khối cấu hình khác.

**AC2:** Đúng thứ tự và nội dung 3 khái niệm: Miền, Cặp miền, Tuyến — kèm mô tả 1 dòng cho mỗi khái niệm.

**AC3:** Ví dụ minh hoạ hiển thị đúng chuỗi: Hà Nội → TP. Hồ Chí Minh ⇒ cặp miền "Hà Nội (Đặc biệt)" ↔ "TP. Hồ Chí Minh (Đặc biệt)" ⇒ tuyến "Liên Vùng Đặc Biệt".

**AC4:** Nút "Thiết lập lại" luôn hiển thị ở góc phải tiêu đề trang, bấm vào tải lại toàn bộ trang (không chỉ riêng 1 khối).

## Notes

- Đây là story mô tả phần giới thiệu/khái niệm tĩnh của trang — các thao tác cấu hình thật (thêm/sửa/xoá miền, tuyến, nội/ngoại thành) xem GSA-ROUTE-2 đến GSA-ROUTE-4.
- Cập nhật lại từ bản cũ: tên trang rút gọn ("Vùng & Tuyến" thay vì "Cấu hình Vùng & Tuyến"), thêm nút "Thiết lập lại" ở cấp trang (trước đây không có).
