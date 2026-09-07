---
id: GSA-ROUTE-2
jiraKey: 
platform: super-admin
section: Cấu hình Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Cấu hình Vùng & Tuyến: Bước 1 — Định nghĩa Miền/Vùng

## User Story

Là GHN Super Admin, tôi muốn định nghĩa và quản lý các miền/vùng địa lý (thêm miền mới, đổi tên, xoá miền; gán và gỡ tỉnh) để xây dựng cơ sở phân vùng cho hệ thống tính tuyến dùng chung cho mọi đại lý.

## User Flow

1. Super Admin ở trang Cấu hình Vùng & Tuyến, cuộn đến khối "Bước 1: Định nghĩa Miền/Vùng"
2. Hệ thống hiển thị 6 miền seed sẵn theo quy tắc GHN thật
3. Super Admin đổi tên miền bằng cách nhập trực tiếp vào ô input trên card miền
4. Super Admin gỡ tỉnh khỏi miền bằng cách bấm nút X trên chip tỉnh
5. Super Admin gán thêm tỉnh vào miền qua dropdown "+ Thêm tỉnh" (chỉ liệt kê tỉnh chưa thuộc miền nào)
6. Super Admin xoá cả miền bằng nút X đầu card
7. Super Admin tạo miền mới bằng nút "+ Thêm miền"

## System Flow

1. `RouteConfig.tsx` dòng 246–369 render khối Bước 1 — đọc danh sách miền từ store `routeConfig.ts`
2. Seed sẵn 6 miền: 3 miền đặc biệt (Hà Nội, Đà Nẵng, TP. Hồ Chí Minh — mỗi miền chỉ 1 tỉnh/thành) + 3 vùng số (Miền Nam/Vùng 1, Miền Trung/Vùng 2, Miền Bắc/Vùng 3 — gộp nhiều tỉnh)
3. `handleRenameRegion` — đổi tên miền inline trên card, cập nhật store ngay lập tức
4. `handleRemoveProvince` — gỡ tỉnh khỏi miền khi bấm X trên chip; tỉnh trở thành "chưa gán"
5. `handleAssignProvince` — gán tỉnh từ dropdown (dropdown chỉ liệt kê tỉnh chưa thuộc miền nào); khi gán vào miền mới, hệ thống tự động gỡ tỉnh đó khỏi miền cũ — không cảnh báo thêm
6. `handleDeleteRegion` — xoá cả miền khỏi store; kéo theo xoá toàn bộ cặp miền trong ma trận Bước 2 có nhắc tới miền đó
7. Cảnh báo vàng cuối khối xuất hiện nếu có tỉnh chưa gán miền nào: liệt kê tối đa 10 tỉnh đầu + đếm số còn lại, kèm câu "chưa tra được tuyến cho các tỉnh này"

## Acceptance Criteria

**AC1:** Khối "Bước 1: Định nghĩa Miền/Vùng" hiển thị đúng 6 miền seed sẵn: 3 miền đặc biệt (Hà Nội, Đà Nẵng, TP. Hồ Chí Minh — mỗi miền chỉ 1 tỉnh/thành) và 3 vùng số (Miền Nam/Vùng 1, Miền Trung/Vùng 2, Miền Bắc/Vùng 3 — mỗi vùng gộp nhiều tỉnh).

**AC2:** Mỗi card miền gồm: ô input đổi tên miền inline, dải chip tỉnh thuộc miền (mỗi chip có nút X để gỡ tỉnh), dropdown "+ Thêm tỉnh" chỉ liệt kê tỉnh chưa thuộc miền nào, và nút X đầu card để xoá cả miền.

**AC3:** Một tỉnh chỉ thuộc đúng 1 miền tại 1 thời điểm — khi gán tỉnh vào miền mới qua dropdown, hệ thống tự động gỡ tỉnh đó khỏi miền cũ mà không yêu cầu xác nhận thêm.

**AC4:** Xoá miền (bấm X đầu card) kéo theo xoá toàn bộ cặp miền trong ma trận Bước 2 có nhắc tới miền đó — chip cặp miền tương ứng ở các tuyến Bước 2 biến mất.

**AC5:** Nút "+ Thêm miền" tạo 1 card miền mới rỗng với tên mặc định "Miền mới N".

**AC6:** Nếu có tỉnh chưa được gán vào miền nào, hiển thị cảnh báo vàng cuối khối: liệt kê tối đa 10 tỉnh đầu và đếm số tỉnh còn lại, kèm thông báo "chưa tra được tuyến cho các tỉnh này".

**AC7:** Khi tất cả 63 tỉnh đã được gán miền, cảnh báo vàng không hiển thị.
