---
id: AGA-CARRIER-24
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGENCY] Thiết lập NVC - Tạo bảng giá: Chỉ chọn được bộ tuyến Đã phát hành

## User Story

Là Agency Admin, tôi muốn dropdown "Bộ tuyến áp dụng" (xem AGA-CARRIER-22) khi tạo bảng giá chỉ hiện các bộ vùng tuyến đã phát hành — không hiện bộ Nháp đang soạn dở — để không vô tình gắn bảng giá vào 1 bộ tuyến chưa hoàn chỉnh.

## User Flow

1. Agency Admin vào "Tạo bảng giá" → mở dropdown "Bộ tuyến áp dụng" (xem AGA-CARRIER-22).
2. Dropdown chỉ liệt kê các bộ có `status === 'published'`. Bộ Nháp không xuất hiện trong danh sách, dù đang tồn tại trong hệ thống.
3. Sau khi Super Admin áp dụng 1 bộ Nháp (xem GSA-ROUTE-13), bộ đó lập tức xuất hiện trong dropdown lần mở tiếp theo (dữ liệu cùng phiên SPA, không cần tải lại trang thật).

## System Flow

1. `PricingCreate.tsx` — dropdown "Bộ tuyến áp dụng" filter:
   `routeConfigVersions.filter(v => v.status === 'published')`
   — bộ Nháp bị loại trước khi render `<option>`.
2. Không có guard phụ ở store-level cho thao tác này (khác với `setActiveRouteConfigVersion` có guard phía store) — trách nhiệm lọc hoàn toàn ở `PricingCreate.tsx`.

## Acceptance Criteria

**AC1:** Dropdown "Bộ tuyến áp dụng" trong trang Tạo bảng giá chỉ hiện bộ có `status === 'published'` — bộ Nháp không bao giờ xuất hiện.

**AC2:** Khi Super Admin phát hành 1 bộ Nháp mới, bộ đó xuất hiện trong dropdown lần mở tiếp theo (trong cùng phiên SPA, không cần tải lại trang thật).

**AC3:** Nếu hệ thống không có bộ Đã phát hành nào → dropdown rỗng; Agency Admin không thể chọn bộ tuyến và không thể lưu bảng giá hợp lệ.

## Notes

- Story này liên hệ trực tiếp với AGA-CARRIER-22 (Chọn bộ tuyến áp dụng khi tạo bảng giá) — bổ sung ràng buộc về trạng thái bộ tuyến. AGA-CARRIER-22 mô tả cơ chế chọn bộ tuyến và cách tuyến/khoá tuyến đọc theo bộ đang chọn; story này mô tả filter loại bỏ bộ Nháp.
- Tương tự, `setActiveRouteConfigVersion` phía Super Admin cũng chỉ nhận bộ `'published'` (xem GSA-ROUTE-13).
