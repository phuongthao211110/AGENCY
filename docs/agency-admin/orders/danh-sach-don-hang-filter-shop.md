---
id: AGA-ORDER-20
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Danh sách đơn hàng: Filter shop

## User Story

Là Agency Admin (Đại lý), tôi muốn chỉ xem đơn hàng của **1 shop cụ thể** trong danh sách đơn hàng, để không phải dò qua đơn của toàn bộ shop khi tôi chỉ cần kiểm tra riêng 1 shop.

## User Flow

1. Ở trang "Đơn hàng", cạnh ô tìm kiếm có dropdown **"Tất cả shop (N)"** (N = tổng số shop thuộc đại lý).
2. Chọn 1 shop cụ thể trong dropdown → danh sách chỉ còn đơn của shop đó, ở tab đang xem.
3. Chọn lại "Tất cả shop" → hiện lại đủ đơn của mọi shop trong tab đó.
4. Có thể dùng đồng thời với ô tìm kiếm ([AGA-ORDER-7](./tim-kiem-loc-theo-shop.md)) — lọc shop trước, tìm kiếm áp dụng trong kết quả đã lọc.

## System Flow

1. State `shopFilter` (mặc định `'all'`) — dropdown liệt kê `agencyShops` (toàn bộ shop thuộc đại lý hiện tại), value là `shopId`, label là tên shop.
2. `shopFiltered = shopFilter === 'all' ? tabOrders : tabOrders.filter(o => o.shopId === shopFilter)` — áp dụng NGAY SAU khi lọc theo tab (`ordersByTab`), TRƯỚC khi áp dụng ô tìm kiếm.
3. Đổi `shopFilter` → `setPage(1)` (về trang 1), nhưng KHÔNG xoá `selected` (các đơn đang tick chọn vẫn giữ nguyên).
4. Option "Tất cả shop" hiện kèm tổng số shop `agencyShops.length` ngay trong label, không cần đếm riêng.

## Acceptance Criteria

**AC1:** Dropdown liệt kê đúng và đủ các shop thuộc đại lý hiện tại — không lẫn shop của đại lý khác.

**AC2:** Mặc định chọn "Tất cả shop (N)", N khớp đúng tổng số shop của đại lý.

**AC3:** Chọn 1 shop → danh sách chỉ còn đơn có `shopId` khớp đúng shop đó, trong đúng tab đang xem (không tự đổi tab).

**AC4:** Đổi shop filter → về trang 1; các đơn đã tick chọn trước đó (nếu vẫn còn hiển thị sau khi lọc) vẫn giữ trạng thái tick.

**AC5:** Lọc theo shop rồi gõ ô tìm kiếm → kết quả là giao của cả 2 điều kiện (đúng shop VÀ khớp từ khoá tìm kiếm).

**AC6:** Đổi TAB (Đơn nháp/Chờ xử lý/...) khi đang lọc theo 1 shop → filter shop vẫn giữ nguyên (không tự reset về "Tất cả shop"), chỉ đổi tập đơn theo tab mới.

## Notes

- Tách riêng từ story ban đầu (AGA-ORDER-7, từng gộp chung với ô tìm kiếm) theo yêu cầu trực tiếp — xem [AGA-ORDER-7](./tim-kiem-loc-theo-shop.md) cho phần tìm kiếm theo mã đơn/tên khách hàng.
- Thứ tự lọc cố định: **Tab → Shop → Tìm kiếm** — mỗi bước thu hẹp dần trên kết quả của bước trước, không phải 3 điều kiện độc lập áp cùng lúc trên toàn bộ đơn.
- Không đổi hành vi đổi TAB (vẫn xoá `selected`) — chỉ filter tìm kiếm/shop mới giữ nguyên lựa chọn, theo đúng quy ước đã có từ trước.
