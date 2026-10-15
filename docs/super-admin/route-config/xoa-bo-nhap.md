---
id: GSA-ROUTE-18
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Xoá bộ Nháp

## User Story

Là GHN Super Admin, tôi muốn xoá hẳn 1 bộ Nháp khỏi danh sách khi không còn cần dùng — để danh sách gọn, không bị loãng bởi các bản nháp thử nghiệm đã lỗi thời.

## User Flow

**Entry point 1 — Từ trang danh sách (GSA-ROUTE-12):**

1. Tìm dòng bộ Nháp muốn xoá trong bảng.
2. Bấm nút "Xoá" (đỏ) trong cột Thao tác → `window.confirm`: "Xoá hẳn bộ Nháp '[tên bộ]'? Không thể khôi phục lại."
3. Xác nhận → bộ bị xoá khỏi `routeConfigVersions`, dòng biến mất khỏi danh sách ngay lập tức. Không điều hướng rời trang.
4. Huỷ → không thay đổi gì.

**Entry point 2 — Từ trang sửa (GSA-ROUTE-14):**

1. Khi đang mở bộ Nháp, nút "🗑 Xoá" xuất hiện ở header trang sửa (chỉ hiện khi bộ là Nháp).
2. Bấm "🗑 Xoá" → `window.confirm`: "Xoá hẳn bộ Nháp '[tên bộ]'? Không thể khôi phục lại."
3. Xác nhận → bộ bị xoá, **điều hướng VỀ TRANG DANH SÁCH** (`/super-admin/route-config`) — khác entry point 1 (không điều hướng).
4. Huỷ → không thay đổi gì.

**Ràng buộc chung:** Nút "Xoá" KHÔNG bao giờ xuất hiện với bộ Hoạt động — lịch sử giữ vĩnh viễn.

## System Flow

1. Nút "Xoá" trong cột Thao tác (danh sách) chỉ render khi `version.status === 'draft'`. Nút "🗑 Xoá" ở header trang sửa chỉ render khi `!isPublished`.
2. **Trang danh sách** — `handleDelete(version)`: gọi `window.confirm(...)`, chỉ tiếp tục nếu xác nhận → `deleteDraftVersion(id)` → lọc bỏ id khỏi `versions` state (dòng biến mất, không điều hướng).
3. **Trang sửa** — `handleDeleteDraft()`: gọi `window.confirm(...)`, chỉ tiếp tục nếu xác nhận → `deleteDraftVersion(bundle.id)` → nếu thành công, `navigate('/super-admin/route-config')` (điều hướng về trang danh sách).
4. `deleteDraftVersion(id)` — validate `routeConfigVersions[idx].status === 'draft'` phía store. Nếu bộ không tồn tại hoặc không còn là Nháp → trả `false`, không xoá. Nếu hợp lệ → `routeConfigVersions.splice(idx, 1)`, persist localStorage, trả `true`.

## Acceptance Criteria

**AC1:** Nút "Xoá" chỉ xuất hiện ở dòng Nháp (trang danh sách) và ở header trang sửa khi bộ là Nháp. Bộ Hoạt động không có nút Xoá ở bất kỳ đâu.

**AC2:** Bấm "Xoá" (bất kỳ entry point) → luôn hiện `window.confirm` trước, không xoá ngay khi chưa xác nhận.

**AC3:** Xác nhận từ trang danh sách → bộ bị xoá HẲN khỏi danh sách ngay lập tức (dòng biến mất), không điều hướng rời trang.

**AC4:** Xác nhận từ trang sửa → bộ bị xoá HẲN, điều hướng VỀ TRANG DANH SÁCH (`/super-admin/route-config`).

**AC5:** Huỷ `window.confirm` → không có gì thay đổi, không điều hướng.

**AC6:** Bộ Hoạt động không thể xoá qua bất kỳ đường nào — `deleteDraftVersion` trả `false` nếu gọi với bộ không phải Nháp (guard phía store, ngoài guard UI).

## Notes

- Không có trạng thái "Đã huỷ" trong hệ thống (cố ý bỏ theo thiết kế) — bộ Nháp không dùng thì xoá hẳn, bộ Hoạt động giữ vĩnh viễn.
- Bộ Hoạt động có thể đã được Agency Admin dùng trong bảng giá — xoá sẽ tạo orphan tham chiếu, vì vậy không cho xoá.
