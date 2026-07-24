---
id: AGA-ORDER-12
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Chi tiết: Huỷ đơn / Cập nhật đơn — CHƯA HOẠT ĐỘNG (gap)

## User Story

Là Agency Admin (Đại lý), tôi muốn huỷ 1 đơn hoặc cập nhật thông tin đơn ngay từ drawer chi tiết, để xử lý các trường hợp shop nhập sai hoặc cần huỷ đơn mà không phải thao tác bên Web Shop.

## User Flow (mong muốn — CHƯA implement)

1. Ở drawer chi tiết đơn, tab "Thông tin đơn", cuối trang có 2 nút: "Huỷ đơn" và "Cập nhật"
2. Bấm "Huỷ đơn" → (dự kiến) hỏi xác nhận, huỷ đơn, chuyển trạng thái sang "Đơn huỷ"
3. Bấm "Cập nhật" → (dự kiến) cho sửa các trường của đơn rồi lưu lại

## System Flow

> ⚠️ Cả 2 nút hiện **không có `onClick` handler nào** — bấm vào không có phản ứng gì. Đây là spec mô tả hành vi mong muốn, dùng làm cơ sở cho story implement sau.

## Acceptance Criteria

**AC1 — GAP, chưa hoạt động:** Nút "Huỷ đơn" hiện tại bấm vào không có phản ứng gì (không mở modal xác nhận, không đổi trạng thái đơn).

**AC2 — GAP, chưa hoạt động:** Nút "Cập nhật" hiện tại bấm vào không có phản ứng gì (không mở form sửa, không lưu thay đổi nào).

**AC3 (dự kiến, khi implement):** Bấm "Huỷ đơn" → modal xác nhận → xác nhận thì đổi `order.status` sang `'cancelled'`, đơn chuyển sang tab "Đơn huỷ".

**AC4 (dự kiến, khi implement):** Bấm "Cập nhật" → cho sửa các trường phù hợp (VD: SĐT/địa chỉ người nhận, ghi chú) → lưu thành công cập nhật lại đơn trong `orderStore`.

## Notes

- **GAP quan trọng cần biết:** đây là 1 trong số các nút "trang trí" chưa nối logic trong `AgencyOrders.tsx` — tương tự các gap khác đã ghi nhận trong project (VD: xác nhận phiên shop, cấu hình dịch vụ...). Cần story riêng để implement thật khi có yêu cầu cụ thể (VD: đơn nào được phép huỷ — chỉ đơn nháp/chờ xử lý, hay mọi trạng thái?).
- Việc huỷ đơn bên Web Shop (nếu có) có thể đã hoạt động riêng — cần kiểm tra `Orders.tsx` (Web Shop) trước khi giả định 2 nơi dùng chung 1 luồng huỷ.
