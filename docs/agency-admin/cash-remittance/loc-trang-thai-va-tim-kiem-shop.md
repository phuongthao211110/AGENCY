---
id: AGA-PAYMENT-4
jiraKey: 
platform: agency-admin
section: Duyệt thanh toán tiền mặt
figma: 
status: draft
---

# [AGA] Duyệt thanh toán tiền mặt: Lọc theo trạng thái & tìm kiếm shop

## Bối cảnh

Tách từ AGA-PAYMENT-1 gốc (mục "Bộ lọc" trong User Flow) — nay thành story riêng vì là 1 năng lực độc lập (lọc/tìm kiếm dữ liệu đã có sẵn trên bảng), không gắn với bố cục chung của trang danh sách.

## User Story

Là Agency Admin quản lý nhiều shop, tôi muốn lọc nhanh theo trạng thái khoá/cho phép tạo đơn và tìm theo tên hoặc mã shop ngay trên danh sách "Duyệt thanh toán", để tìm đúng shop cần xử lý mà không phải cuộn qua toàn bộ danh sách khi đại lý có nhiều shop.

## User Flow

1. Ngay dưới 2 tab (xem AGA-PAYMENT-1): dropdown **"Trạng thái"** (Tất cả / Đã khoá tạo đơn / Cho phép tạo đơn) — CHỈ hiện ở tab "Chờ xác nhận" (tab "Đã xác nhận" luôn toàn "Cho phép tạo đơn" nên không cần lọc).
2. Ô tìm kiếm **"Tìm kiếm theo tên shop hoặc mã shop"** — hiện ở CẢ 2 tab.
3. Chọn 1 mức trong dropdown "Trạng thái" → bảng tab "Chờ xác nhận" chỉ còn đúng các dòng khớp trạng thái đó.
4. Gõ vào ô tìm kiếm (tên hoặc mã shop) → bảng (ở tab đang xem) chỉ còn dòng khớp, không phân biệt hoa/thường; xoá ô tìm kiếm → đủ lại toàn bộ dòng.
5. Dùng ĐỒNG THỜI cả dropdown lẫn tìm kiếm (ở tab "Chờ xác nhận") → bảng chỉ còn dòng khớp CẢ 2 điều kiện cùng lúc.
6. Đổi tab Chờ/Đã xác nhận → ô tìm kiếm giữ nguyên giá trị đang gõ (không bị xoá), dropdown "Trạng thái" tự ẩn nếu chuyển sang tab "Đã xác nhận".
7. Lọc/tìm kiếm chỉ ảnh hưởng những gì HIỂN THỊ trên bảng — không đổi dữ liệu/trạng thái thật của bất kỳ shop nào.

## System Flow

1. `statusFilter: 'all' | 'blocked' | 'allowed'` (state ở component cha `CashRemittance`) — chỉ áp dụng cho nhánh `pendingShops`, không áp dụng cho `confirmedShops`.
2. `search: string` (state dùng chung CẢ 2 tab) — `matchesSearch(shop)`: `shop.name.toLowerCase().includes(q) || shop.id.toLowerCase().includes(q)` với `q = search.trim().toLowerCase()`.
3. `filteredPendingShops = pendingShops.filter(s => matchesSearch(s.shop) && (statusFilter === 'all' || (statusFilter === 'blocked' ? s.blocked : !s.blocked)))`; `filteredConfirmedShops = confirmedShops.filter(s => matchesSearch(s.shop))` (không áp `statusFilter`).
4. `activeRows = activeTab === 'pending' ? filteredPendingShops : filteredConfirmedShops` — nguồn dữ liệu cho bảng + phân trang (xem AGA-PAYMENT-1).
5. `useEffect(() => { setPage(1) }, [activeTab, search, statusFilter])` — đổi bất kỳ điều kiện lọc nào cũng reset về trang 1, tránh đứng ở trang rỗng nếu bộ lọc làm giảm số dòng.

## Acceptance Criteria

**AC1:** Dropdown "Trạng thái" chỉ hiện ở tab "Chờ xác nhận", KHÔNG hiện ở tab "Đã xác nhận".

**AC2:** Chọn "Đã khoá tạo đơn"/"Cho phép tạo đơn" trong dropdown → bảng chỉ còn đúng các dòng khớp trạng thái đó; chọn lại "Tất cả" → đủ lại toàn bộ dòng của tab.

**AC3:** Gõ tên hoặc mã shop vào ô tìm kiếm → bảng (ở tab đang xem) chỉ còn dòng khớp, không phân biệt hoa/thường; xoá ô tìm kiếm → đủ lại toàn bộ dòng.

**AC4:** Dùng đồng thời dropdown + tìm kiếm → bảng chỉ còn dòng khớp CẢ 2 điều kiện.

**AC5:** Đổi tab → giá trị ô tìm kiếm GIỮ NGUYÊN (không bị xoá); dropdown ẩn/hiện đúng theo tab.

**AC6:** Thay đổi bất kỳ điều kiện lọc/tìm kiếm nào → trang hiện tại tự reset về trang 1.

## Notes

- Tách từ AGA-PAYMENT-1 gốc (mục 5 cũ của User Flow) — hành vi KHÔNG đổi so với bản gộp trước đó, chỉ tách ra thành story riêng để dễ ước lượng/test độc lập.
- Lọc/tìm kiếm chỉ là bộ lọc HIỂN THỊ (client-side trên mảng đã tính sẵn) — không gọi lại API/tính lại `buildShopStats`, nên phản hồi tức thì khi gõ.
- Xem AGA-PAYMENT-1 (bố cục trang, 3 thẻ tổng quan, 2 tab); AGA-PAYMENT-5 (chọn nhiều shop, dùng chung dòng dữ liệu đã lọc ở đây — tick chọn chỉ áp dụng cho các dòng ĐANG hiển thị sau khi lọc/tìm kiếm).
