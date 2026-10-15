---
id: GSA-ROUTE-19
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Đổi tên bộ vùng tuyến

## User Story

Là GHN Super Admin, tôi muốn đổi tên 1 bộ vùng tuyến (Nháp hoặc Hoạt động) ngay trên trang sửa, để điều chỉnh nhãn hiển thị mà không cần nhân bản hay phát hành lại.

## User Flow

1. Mở trang sửa bộ vùng tuyến (`/super-admin/route-config/edit/:id`).
2. Ở header trang, bấm nút "✏️ Đổi tên" (nằm cạnh nút "📋 Nhân bản").
3. `window.prompt` hiện ra với nội dung "Đổi tên bộ vùng tuyến:", giá trị mặc định là tên hiện tại của bộ.
4. Nhập tên mới rồi xác nhận → tên bộ đổi ngay trên header, toast "Đã đổi tên" xuất hiện, không tải lại trang.
5. Xoá hết nội dung trong prompt rồi xác nhận → tên KHÔNG thay đổi (chuỗi rỗng sau khi trim bị bỏ qua, tên cũ giữ nguyên).
6. Huỷ `window.prompt` → không thay đổi gì.

## System Flow

1. `handleRename()` trong `RouteConfig.tsx`: gọi `window.prompt('Đổi tên bộ vùng tuyến:', bundle.label)`.
2. Nếu người dùng huỷ (`next === null`) → dừng, không làm gì.
3. Nếu người dùng xác nhận (`next !== null`) → gọi `renameRouteConfigVersion(bundle.id, next)`.
4. `renameRouteConfigVersion(id, newLabel)` trong `routeConfig.ts`: trim `newLabel`; nếu rỗng sau trim → trả `null`, không đổi; tìm bộ theo `id`, cập nhật `label: trimmed`, persist, trả version mới.
5. Nếu hàm trả version mới → `setBundle(updated)` + toast "Đã đổi tên".

## Acceptance Criteria

**AC1:** Nút "✏️ Đổi tên" xuất hiện ở header trang sửa cho CẢ bộ Nháp lẫn bộ Hoạt động — không bị ẩn theo trạng thái bộ.

**AC2:** Bấm "✏️ Đổi tên" → `window.prompt` hiện ra, trường nhập điền sẵn tên hiện tại của bộ.

**AC3:** Nhập tên mới và xác nhận → tên cập nhật ngay trên header, toast "Đã đổi tên" xuất hiện, không tải lại trang.

**AC4:** Xoá hết nội dung trong prompt rồi xác nhận → tên KHÔNG thay đổi (trim về rỗng → bỏ qua, giữ tên cũ).

**AC5:** Huỷ prompt → không thay đổi gì, tên bộ giữ nguyên.

**AC6:** Đổi tên chỉ thay đổi nhãn hiển thị (`label`) — KHÔNG ảnh hưởng cấu trúc bộ (Vùng miền, Tuyến, Nội/Ngoại thành, khoá tuyến) và KHÔNG thay đổi `status`. Bộ Hoạt động sau khi đổi tên vẫn là Hoạt động.

## Notes

- Đổi tên bộ (`renameRouteConfigVersion`) hoàn toàn khác với đổi tên 1 TUYẾN bên trong bộ (`handleRenameTuyen`) — đổi tên tuyến bị khoá khi bộ Hoạt động (`isPublished`), còn đổi tên bộ thì hoạt động ở cả 2 trạng thái.
- Không có entry point nào khác ngoài trang sửa — trang danh sách không có nút hoặc inline edit để đổi tên từ đó.
