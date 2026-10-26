---
id: AGA-PAYMENT-5
jiraKey: 
platform: agency-admin
section: Duyệt thanh toán tiền mặt
figma: 
status: draft
---

# [AGA] Duyệt thanh toán tiền mặt: Chọn nhiều shop để duyệt hàng loạt

## Bối cảnh

Tách từ AGA-PAYMENT-1 gốc (cơ chế checkbox trong User Flow) — CHỈ còn phạm vi: cơ chế TICK CHỌN (checkbox từng dòng + checkbox header chọn tất cả) và nút "Duyệt N shop đã chọn" XUẤT HIỆN khi nào. Hành động THỰC SỰ duyệt khi bấm nút đó xem AGA-PAYMENT-7.

## User Story

Là Agency Admin quản lý nhiều shop đã thực nhận tiền mặt cùng lúc từ nhiều shop, tôi muốn tick chọn chính xác những shop mình đã nhận đủ tiền trước, rồi mới xác nhận duyệt gộp 1 lần, thay vì phải bấm "✓ Đã nhận" lặp lại cho từng shop một.

## User Flow

1. Ở tab "Chờ xác nhận" (xem AGA-PAYMENT-1): mỗi dòng shop có 1 checkbox đầu dòng; header bảng có 1 checkbox "chọn tất cả".
2. Tick ≥1 checkbox dòng → nút xanh **"✓ Duyệt N shop đã chọn"** xuất hiện cạnh ô tìm kiếm (N = số shop đang được tick).
3. Tick checkbox header → chọn (hoặc bỏ chọn, nếu đang chọn hết) TOÀN BỘ các dòng ĐANG HIỂN THỊ TRÊN TRANG HIỆN TẠI (sau khi đã áp bộ lọc/tìm kiếm — xem AGA-PAYMENT-4), KHÔNG ảnh hưởng dòng ở trang khác dù dòng đó cũng khớp bộ lọc.
4. Bỏ tick hết các dòng đã chọn → nút "✓ Duyệt N shop đã chọn" tự ẩn đi.
5. Đổi tab (sang "Đã xác nhận" rồi quay lại "Chờ xác nhận") → TOÀN BỘ lựa chọn tick tự xoá sạch — tránh giữ lựa chọn "vô hình" không còn ý nghĩa (tab "Đã xác nhận" không có checkbox, không có gì để duyệt).
6. Việc tick/bỏ tick KHÔNG làm thay đổi bất kỳ dữ liệu/trạng thái đơn hàng nào — thuần chuẩn bị danh sách trước khi bấm nút duyệt (xem AGA-PAYMENT-7).

## System Flow

1. `selectedShopIds: Set<string>` (state ở component cha `CashRemittance`).
2. `toggleSelect(shopId)`: thêm/xoá 1 `shopId` khỏi `selectedShopIds`.
3. `pagedPendingIds = pagedRows.map(s => s.shop.id)` (ids đang hiển thị trên trang hiện tại, SAU khi đã lọc/tìm kiếm/phân trang — xem AGA-PAYMENT-4); `allPagedSelected = pagedPendingIds.length > 0 && pagedPendingIds.every(id => selectedShopIds.has(id))`.
4. `toggleSelectAllPaged()`: nếu `allPagedSelected` thì xoá hết `pagedPendingIds` khỏi `selectedShopIds`, ngược lại thêm hết vào — CHỈ tác động `pagedPendingIds`, các `id` khác trong `selectedShopIds` (nếu có, từ trang khác) giữ nguyên.
5. `useEffect(() => { setSelectedShopIds(new Set()) }, [activeTab])` — đổi tab là xoá sạch lựa chọn, không giữ qua tab.
6. Nút "✓ Duyệt N shop đã chọn" chỉ render khi `selectedShopIds.size > 0`; N hiển thị = `selectedShopIds.size` — xem AGA-PAYMENT-7 cho hành động khi bấm nút này.

## Acceptance Criteria

**AC1:** Tick ≥1 checkbox dòng → nút "✓ Duyệt N shop đã chọn" xuất hiện với N đúng bằng số dòng đang tick.

**AC2:** Tick checkbox header → chọn/bỏ chọn ĐÚNG các dòng đang hiển thị trên trang hiện tại (sau lọc/tìm kiếm), không ảnh hưởng dòng ở trang khác.

**AC3:** Bỏ tick hết → nút "✓ Duyệt N shop đã chọn" tự ẩn.

**AC4:** Đổi tab (bất kỳ hướng nào) → toàn bộ lựa chọn tick tự xoá sạch.

**AC5:** Tick/bỏ tick không làm thay đổi bất kỳ dữ liệu đơn hàng/trạng thái shop nào — chỉ là trạng thái UI tạm thời.

## Notes

- Tách từ AGA-PAYMENT-1 gốc (mục "checkbox" trong User Flow) — cơ chế MỚI, chưa từng có ở các bản trước khi chưa có chọn-nhiều (trước đó mỗi shop duyệt riêng từng dòng).
- Story này CHỈ mô tả cơ chế chọn — xem AGA-PAYMENT-7 để biết điều gì xảy ra khi thực sự bấm nút "✓ Duyệt N shop đã chọn" (window.confirm, gọi API duyệt, v.v.).
- Xem AGA-PAYMENT-1 (bố cục bảng chính); AGA-PAYMENT-4 (bộ lọc/tìm kiếm — quyết định `pagedPendingIds` nào checkbox header tác động tới).
