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

Là Agency Admin, tôi muốn modal "Thay đổi vùng tuyến" (xem AGA-CARRIER-26) khi tạo bảng giá chỉ hiện các bộ vùng tuyến đã phát hành — không hiện bộ Nháp đang soạn dở — để không vô tình gắn bảng giá vào 1 bộ tuyến chưa hoàn chỉnh.

## User Flow

1. Agency Admin vào "Tạo bảng giá" → bấm "Thay đổi" để mở modal "Thay đổi vùng tuyến" (xem AGA-CARRIER-26).
2. Bảng trong modal chỉ liệt kê các bộ có `status === 'published'`. Bộ Nháp không xuất hiện trong danh sách, dù đang tồn tại trong hệ thống.
3. Sau khi Super Admin áp dụng 1 bộ Nháp (xem GSA-ROUTE-13), bộ đó lập tức xuất hiện trong bảng lần mở modal tiếp theo (dữ liệu cùng phiên SPA, không cần tải lại trang thật).

## System Flow

1. `PricingCreate.tsx` — props `bundles` truyền vào `ChangeBundleModal` được filter:
   `routeConfigVersions.filter(v => v.status === 'published')`
   — bộ Nháp bị loại trước khi truyền vào modal.
2. Không có guard phụ ở store-level cho thao tác này (khác với `setActiveRouteConfigVersion` có guard phía store) — trách nhiệm lọc hoàn toàn ở `PricingCreate.tsx`.

## Acceptance Criteria

**AC1:** Bảng trong modal "Thay đổi vùng tuyến" chỉ hiện bộ có `status === 'published'` — bộ Nháp không bao giờ xuất hiện.

**AC2:** Khi Super Admin phát hành 1 bộ Nháp mới, bộ đó xuất hiện trong bảng lần mở modal tiếp theo (trong cùng phiên SPA, không cần tải lại trang thật).

**AC3:** Nếu hệ thống không có bộ Đã phát hành nào → bảng trong modal rỗng (hiện dòng "Không tìm thấy bộ vùng tuyến nào"); Agency Admin không thể chọn bộ tuyến và không thể lưu bảng giá hợp lệ.

## Notes

- Story này liên hệ trực tiếp với AGA-CARRIER-26 (Thay đổi bộ tuyến áp dụng khi tạo bảng giá) — bổ sung ràng buộc về trạng thái bộ tuyến. AGA-CARRIER-26 mô tả cơ chế modal "Thay đổi vùng tuyến"; story này mô tả filter loại bỏ bộ Nháp trong bảng của modal đó. Xem thêm AGA-CARRIER-22 (hiển thị/mặc định "Bộ tuyến áp dụng") và AGA-CARRIER-25 (Xem chi tiết).
- Tương tự, `setActiveRouteConfigVersion` phía Super Admin cũng chỉ nhận bộ `'published'` (xem GSA-ROUTE-13).
