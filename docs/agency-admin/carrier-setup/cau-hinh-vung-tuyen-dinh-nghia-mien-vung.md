---
id: AGA-CARRIER-17
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGA] Thiết lập NVC - Cấu hình vùng & tuyến: Định nghĩa Miền/Vùng

## User Story

Là Agency Admin (Đại lý), tôi muốn xem và chỉnh sửa cấu hình phân chia miền/vùng địa lý
(tỉnh nào thuộc miền nào) để hệ thống tra tuyến đúng khi tính giá cước — mà không phải
tự nhập từ đầu vì đã có sẵn 6 miền theo chuẩn GHN.

## User Flow

1. Agency Admin vào menu **CÔNG CỤ** → chọn **Cấu hình vùng & tuyến**
2. Trang hiển thị card **Bước 1 — Định nghĩa Miền / Vùng** với 6 miền đã cấu hình sẵn
3. Agency Admin kiểm tra danh sách miền; mỗi miền hiển thị tên + danh sách chip tỉnh đã gán (màu xanh, có nút X)
4. Để thêm tỉnh vào miền: bấm dropdown **+ Thêm tỉnh** trong miền đó, chọn tỉnh chưa được gán miền nào
5. Để xoá tỉnh khỏi miền: bấm nút X trên chip tỉnh tương ứng
6. Để thêm miền mới: bấm **+ Thêm miền** → miền mới rỗng xuất hiện, đổi tên qua input trực tiếp
7. Để xoá miền: bấm nút X đỏ trên miền → tất cả cấu hình tuyến tham chiếu miền đó cũng bị xoá theo
8. Nếu có tỉnh nào chưa gán miền → banner cảnh báo vàng tự động hiển thị liệt kê các tỉnh đó

## System Flow

1. Trang Cấu hình vùng & tuyến load dữ liệu từ `routeConfig.ts` (module-level store dùng chung toàn app)
2. Bấm **+ Thêm tỉnh**: dropdown chỉ liệt kê tỉnh chưa thuộc miền nào; khi chọn → tỉnh được gán vào miền hiện tại, tự động rút khỏi miền cũ nếu trước đó đã gán
3. Bấm X trên chip tỉnh → tỉnh bị xoá khỏi miền, trở về trạng thái "chưa gán"; dropdown "+ Thêm tỉnh" của các miền khác có lại tỉnh này trong danh sách
4. Bấm **+ Thêm miền** → tạo miền mới rỗng với tên mặc định, có thể đổi tên ngay qua input
5. Bấm X đỏ xoá miền → xoá miền và đồng thời xoá tất cả cặp miền trong Bước 2 có tham chiếu đến miền vừa xoá (các cặp đó trở về trạng thái "chưa cấu hình")
6. Hệ thống scan danh sách 63 tỉnh thành → hiển thị banner vàng nếu có tỉnh chưa thuộc miền nào
7. Mọi thay đổi ghi vào store dùng chung — lập tức áp dụng cho Bước 2 và màn Tạo bảng giá, không cần reload trang

## Acceptance Criteria

**AC1:** Trang "Cấu hình vùng & tuyến" có card "Bước 1 — Định nghĩa Miền / Vùng" hiển thị sẵn 6 miền theo đúng quy tắc GHN: Hà Nội (chỉ tỉnh Hà Nội), Đà Nẵng (chỉ tỉnh Đà Nẵng), TP. Hồ Chí Minh (chỉ TP. Hồ Chí Minh), Miền Nam/Vùng 1 (Bình Định trở vào trừ HCM), Miền Trung/Vùng 2 (Quảng Ngãi → Quảng Bình), Miền Bắc/Vùng 3 (Hà Tĩnh trở ra trừ Hà Nội).

**AC2:** Mỗi miền hiển thị danh sách chip tỉnh màu xanh đã gán; mỗi chip có nút X riêng — bấm X → tỉnh bị xoá khỏi miền, trở về trạng thái "chưa gán".

**AC3:** Dropdown "+ Thêm tỉnh" của mỗi miền chỉ liệt kê các tỉnh chưa thuộc miền nào — tỉnh đã gán miền khác không xuất hiện.

**AC4:** Gán tỉnh vào miền mới khi tỉnh đó đang thuộc miền khác → hệ thống tự động rút tỉnh khỏi miền cũ, không cần xoá thủ công trước; 1 tỉnh luôn chỉ thuộc đúng 1 miền tại 1 thời điểm.

**AC5:** Nút "+ Thêm miền" tạo miền mới rỗng; tên mặc định có thể đổi qua input trực tiếp trên card.

**AC6:** Nút X đỏ trên miền → xoá miền và đồng thời xoá tất cả cấu hình tuyến (Bước 2) đang tham chiếu miền đó — các cặp miền liên quan trở về "chưa cấu hình".

**AC7:** Khi có ít nhất 1 tỉnh chưa thuộc miền nào → banner cảnh báo màu vàng tự động hiển thị, liệt kê tên các tỉnh đó (tối đa 10 tỉnh, còn lại ghi "và N tỉnh khác") kèm ghi chú "các tỉnh này chưa tra được tuyến".

**AC8:** Mọi thay đổi tại Bước 1 lập tức phản ánh vào Bước 2 (cặp miền cập nhật theo) và màn Tạo bảng giá (dropdown Vùng cập nhật theo) — không cần reload trang.

## Notes

- Trang "Kiểm tra tuyến" (`RouteCheck.tsx`, menu CÔNG CỤ) **hiện CHƯA được nối** vào cấu hình dùng chung này — vẫn dùng logic tra tuyến tĩnh cũ (`determineRoute()` trong `vietnam-provinces.ts`). Nếu admin sửa cấu hình Miền/Vùng sau này, trang "Kiểm tra tuyến" sẽ KHÔNG cập nhật theo — có thể gây lệch dữ liệu giữa 2 trang. Đây là hạn chế đã biết, chưa xử lý.
- Toàn bộ dữ liệu miền lưu ở bộ nhớ trong phiên (module-level state trong `routeConfig.ts`), KHÔNG có backend/persistence thật — reload lại toàn trang (browser mới/tab mới) sẽ trả về đúng dữ liệu seed ban đầu (6 miền GHN).
