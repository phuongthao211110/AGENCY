---
id: AGA-CARRIER-19
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGA] Thiết lập NVC - Tạo bảng giá: Dùng chung cấu hình vùng & tuyến

## User Story

Là Agency Admin (Đại lý), tôi muốn dropdown "Tuyến" và "Vùng" trong màn Tạo bảng giá
tự động phản ánh cấu hình Miền/Vùng & Tuyến mà tôi đã thiết lập — thay vì bị cố định
6 tuyến hardcode như trước — để mọi bảng giá (GHN, 247Express, NVC khác) đều dùng
chung 1 định nghĩa tuyến nhất quán, không cần sửa code khi thêm/bớt tuyến.

## User Flow

1. Agency Admin vào màn **Tạo bảng giá** (Thiết lập NVC → tab Bảng giá → Thêm bảng giá)
2. Trong phần "Danh sách tuyến", bấm nút **Định nghĩa tuyến** để kiểm tra cấu hình hiện tại: modal hiển thị từng tên tuyến + cặp miền đang áp dụng + 1 dòng cố định cho luật "Nội Tỉnh"
3. Bấm link **"Chỉnh sửa cấu hình vùng & tuyến →"** trong modal để điều hướng sang trang Cấu hình vùng & tuyến nếu cần sửa
4. Bấm "Thêm tuyến" → dropdown "Tuyến" liệt kê tên tuyến động từ cấu hình Bước 2 (AGA-CARRIER-18)
5. Phần thu hẹp phạm vi Tỉnh/Quận/Phường hiển thị cho tất cả tuyến, trừ tuyến có tên trùng luật "Nội Tỉnh"
6. Dropdown "Vùng" trong phần thu hẹp phạm vi lấy danh sách tên miền động từ cấu hình Bước 1 (AGA-CARRIER-17)

## System Flow

1. `PricingCreate.tsx` import danh sách tuyến và miền từ `routeConfig.ts` (store dùng chung) thay vì mảng hardcode
2. Dropdown "Tuyến" render danh sách options từ `listRouteNames()` — thêm/xoá/đổi tên tuyến ở trang Cấu hình vùng & tuyến phản ánh ngay khi mở lại form Tạo bảng giá
3. Dropdown "Vùng" trong phần thu hẹp phạm vi render từ mảng `regions` (export trực tiếp từ `routeConfig.ts`) thay vì ["Vùng 1", "Vùng 2", "Vùng 3"] hardcode
4. Kiểm tra tên tuyến = tên luật Nội Tỉnh (`sameProvinceRoute`): nếu khớp → ẩn section thu hẹp phạm vi Tỉnh/Quận/Phường cho tuyến đó
5. Nút "Định nghĩa tuyến": modal tự tính toán trực tiếp trong `PricingCreate.tsx` từ `routeMatrix` + `regions` + `sameProvinceRoute` (không qua 1 hàm helper riêng) — với mỗi tên tuyến, liệt kê cặp miền đang áp dụng (tên đầy đủ) + 1 dòng cố định "Nội Tỉnh: Cùng 1 tỉnh, bất kỳ miền nào"
6. Link "Chỉnh sửa cấu hình vùng & tuyến →" trong modal dùng `navigate('/agency-admin/route-config')`

## Acceptance Criteria

**AC1:** Dropdown "Tuyến" trong form Tạo bảng giá lấy danh sách tên tuyến động từ cấu hình Bước 2 — không còn hardcode 6 tuyến cố định.

**AC2:** Thêm/đổi tên/xoá tuyến ở trang "Cấu hình vùng & tuyến" → dropdown "Tuyến" trong form Tạo bảng giá phản ánh thay đổi ngay khi mở lại form, không cần sửa code.

**AC3:** Dropdown "Vùng" trong phần thu hẹp phạm vi Từ/Đến của mỗi dòng tuyến lấy danh sách tên miền động từ cấu hình Bước 1 — không còn hardcode "Vùng 1/2/3".

**AC4:** Tuyến có tên trùng luật "Nội Tỉnh" → phần thu hẹp phạm vi Tỉnh/Quận/Phường bị ẩn cho tuyến đó; tất cả tuyến khác vẫn hiển thị phần thu hẹp phạm vi bình thường.

**AC5:** Nút "Định nghĩa tuyến" mở modal hiển thị: với mỗi tên tuyến, liệt kê đầy đủ các cặp miền đang áp dụng (tên đầy đủ, không viết tắt); cộng thêm 1 dòng cố định "Nội Tỉnh: Cùng 1 tỉnh, bất kỳ miền nào".

**AC6:** Modal "Định nghĩa tuyến" có link "Chỉnh sửa cấu hình vùng & tuyến →" điều hướng thẳng sang trang `/agency-admin/route-config`.

**AC7:** Cấu hình vùng & tuyến dùng chung cho mọi bảng giá (GHN, 247Express, và NVC khác trong tương lai) — không phải cấu hình riêng per bảng giá.

## Notes

- Trang "Kiểm tra tuyến" (`RouteCheck.tsx`, menu CÔNG CỤ) **hiện CHƯA được nối** vào cấu hình dùng chung này — vẫn dùng logic tra tuyến tĩnh cũ (`determineRoute()` trong `vietnam-provinces.ts`). Nếu admin sửa cấu hình Miền/Vùng hoặc Tuyến, trang "Kiểm tra tuyến" sẽ KHÔNG cập nhật theo — có thể gây lệch dữ liệu giữa 2 trang. Đây là hạn chế đã biết, chưa xử lý.
- Toàn bộ dữ liệu (miền, tuyến) lưu ở bộ nhớ trong phiên (module-level state trong `routeConfig.ts`), KHÔNG có backend/persistence thật — reload lại toàn trang (browser mới/tab mới) sẽ trả về đúng dữ liệu seed ban đầu.
