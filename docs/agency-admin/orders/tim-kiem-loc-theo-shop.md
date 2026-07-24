---
id: AGA-ORDER-7
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Danh sách: Tìm kiếm và lọc theo Shop

## User Story

Là Agency Admin (Đại lý), tôi muốn tìm nhanh 1 đơn theo mã đơn/tên khách hàng, hoặc chỉ xem đơn của 1 shop cụ thể, để không phải dò qua toàn bộ danh sách khi có nhiều shop và nhiều đơn.

## User Flow

1. Ở trang "Đơn hàng", gõ vào ô "Tìm theo mã đơn hoặc tên khách hàng" → danh sách lọc ngay theo nội dung gõ
2. Chọn 1 shop cụ thể ở dropdown "Tất cả shop (N)" → chỉ còn đơn của shop đó
3. Có thể dùng đồng thời cả 2 (lọc shop trước, rồi tìm kiếm trong kết quả đó)

## System Flow

1. Ô tìm kiếm: state `search`, lọc case-insensitive theo `trackingCode` HOẶC `receiverName` chứa chuỗi gõ vào (áp dụng SAU khi đã lọc theo tab + shop)
2. Dropdown shop: state `shopFilter`, mặc định "Tất cả shop" hiện tổng số shop của đại lý; chọn 1 shop → lọc `o.shopId === shopFilter`
3. Cả 2 filter đều reset `page` về 1 khi thay đổi, nhưng KHÔNG xoá các đơn đang được tick chọn

## Acceptance Criteria

**AC1:** Gõ vào ô tìm kiếm → danh sách chỉ còn đơn có mã đơn hoặc tên khách hàng chứa đúng chuỗi đã gõ (không phân biệt hoa/thường).

**AC2:** Dropdown shop liệt kê đúng các shop thuộc đại lý, mặc định chọn "Tất cả shop".

**AC3:** Lọc theo shop rồi tìm kiếm → kết quả là giao của cả 2 điều kiện (đúng shop VÀ khớp từ khoá).

**AC4:** Đổi bộ lọc (tìm kiếm hoặc shop) → về trang 1, nhưng các đơn đã tick chọn trước đó vẫn giữ nguyên trạng thái tick (không bị xoá như khi đổi tab).

## Notes

- Khác với đổi TAB (xoá hết lựa chọn) — đổi filter tìm kiếm/shop KHÔNG xoá lựa chọn, vì đây vẫn là cùng 1 tập dữ liệu đang thao tác, chỉ thu hẹp view.
