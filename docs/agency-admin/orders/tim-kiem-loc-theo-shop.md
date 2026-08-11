---
id: AGA-ORDER-7
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng: Tìm kiếm theo mã đơn/tên khách hàng

## User Story

Là Agency Admin (Đại lý), tôi muốn tìm nhanh 1 đơn theo mã đơn hoặc tên khách hàng, để không phải dò qua toàn bộ danh sách khi có nhiều đơn.

## User Flow

1. Ở trang "Đơn hàng", gõ vào ô "Tìm theo mã đơn hoặc tên khách hàng" → danh sách lọc ngay theo nội dung gõ.
2. Có thể dùng đồng thời với filter shop ([AGA-ORDER-20](./danh-sach-don-hang-filter-shop.md)) — tìm kiếm áp dụng SAU khi đã lọc theo tab + shop.

## System Flow

1. Ô tìm kiếm: state `search`, lọc case-insensitive theo `trackingCode` HOẶC `receiverName` chứa chuỗi gõ vào (áp dụng sau khi đã lọc theo tab + `shopFilter`).
2. Reset `page` về 1 khi gõ, nhưng KHÔNG xoá các đơn đang được tick chọn (`selected`).

## Acceptance Criteria

**AC1:** Gõ vào ô tìm kiếm → danh sách chỉ còn đơn có mã đơn hoặc tên khách hàng chứa đúng chuỗi đã gõ (không phân biệt hoa/thường).

**AC2:** Lọc theo shop ([AGA-ORDER-20](./danh-sach-don-hang-filter-shop.md)) rồi tìm kiếm → kết quả là giao của cả 2 điều kiện (đúng shop VÀ khớp từ khoá).

**AC3:** Gõ vào ô tìm kiếm → về trang 1, nhưng các đơn đã tick chọn trước đó vẫn giữ nguyên trạng thái tick (không bị xoá như khi đổi tab).

## Notes

- Tách riêng khỏi story ban đầu (từng gộp chung với dropdown filter shop) theo yêu cầu trực tiếp — xem [AGA-ORDER-20](./danh-sach-don-hang-filter-shop.md) cho phần filter shop.
- Đổi TAB xoá hết lựa chọn — đổi ô tìm kiếm KHÔNG xoá lựa chọn, vì đây vẫn là cùng 1 tập dữ liệu đang thao tác, chỉ thu hẹp view.
