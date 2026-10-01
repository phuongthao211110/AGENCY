---
id: AGA-REPORT-8
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Chỉ số "Khách hàng mới" (KH đặt đơn lần đầu trong kỳ)

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn biết có bao nhiêu KHÁCH HÀNG CUỐI (người mua/nhận hàng của shop) đặt đơn LẦN ĐẦU TIÊN trong kỳ đang chọn — cả theo từng shop và tổng toàn đại lý — để đánh giá khả năng thu hút khách mới của từng shop, tách biệt khỏi số khách quay lại mua tiếp (xem AGA-REPORT-9).

## User Flow

1. "Khách hàng mới" xuất hiện ở 3 nơi trên trang "Báo cáo": (a) 1 trong 6 thẻ KPI đầu trang, (b) khối đầu tiên trong card "Khách hàng" (chấm màu xanh lá, góc phải trang), (c) cột "Khách mới" trong bảng "Chi tiết theo shop".
2. Thẻ KPI đầu trang: hiện số khách mới TOÀN đại lý trong kỳ, kèm badge % so với kỳ trước (hoặc chữ "Mới" màu xanh dương nếu kỳ trước = 0 khách mới).
3. Khối trong card "Khách hàng": chấm màu xanh lá (`#0D9488`) + nhãn "Khách hàng mới" + badge % (góc phải) → dòng định nghĩa "Khách đặt đơn lần đầu tiên trong kỳ này" → số lớn → sparkline 7 cột (7 ngày gần nhất, cột cuối cùng — hôm nay — tô đậm nhất, các cột trước nhạt hơn).
4. Cột "Khách mới" trong bảng "Chi tiết theo shop": số khách mới CỦA RIÊNG shop đó trong kỳ đang chọn, hover vào tiêu đề cột hiện tooltip định nghĩa.
5. Đổi tab Ngày/Tuần/Tháng → cả 3 nơi cập nhật lại theo đúng khoảng "Kỳ này" mới của tab đó (sparkline trong card "Khách hàng" là ngoại lệ — xem System Flow điểm 4).

## System Flow

1. Khách hàng nhận diện qua `order.receiverPhone` (người nhận/mua hàng thật) — KHÔNG PHẢI chính shop. `customersActiveInRange(orders, start, end)` gom `Set<receiverPhone>` có đơn trong khoảng đó.
2. `countNewCustomers(orders, curStart, curEnd)` = số khách có đơn trong `[curStart, curEnd]` VÀ KHÔNG có đơn nào trước `curStart` trong toàn bộ lịch sử đơn được truyền vào (`orders.some(o => o.receiverPhone === phone && createdAt < curStart)` → false với mọi đơn).
3. Tính theo TỪNG shop (cột bảng, khối trong `buildShopPeriodStats`): truyền `shopOrders` đã lọc theo ĐÚNG 1 `shopId` vào `countNewCustomers()` — vì 1 số điện thoại có thể "mới" ở shop A nhưng đã từng mua ở shop B, 2 quan hệ khách hàng độc lập theo từng shop. Số ở thẻ KPI đầu trang = Σ giá trị này qua mọi shop (`shopStatsCur.reduce(...)`), KHÔNG tính lại trên toàn bộ `agencyOrders` gộp chung (tránh đếm trùng 1 khách mua ở nhiều shop thành "mới" 2 lần theo nghĩa khác).
4. Sparkline 7 cột trong card "Khách hàng" là NGOẠI LỆ — tính theo NGÀY cố định (7 ngày gần nhất tính từ `anchorDate`, mỗi điểm = `countNewCustomers(agencyOrders, startOfDay(day), endOfDay(day))` trên TOÀN đại lý), không đổi theo tab Ngày/Tuần/Tháng đang chọn — chỉ minh hoạ xu hướng ngắn hạn.
5. `pctDelta(cur, prev)`: `prev > 0` → % bình thường; `prev = 0` và `cur > 0` → trả `null` (hiện badge "Mới" màu xanh dương); cả 2 = 0 → 0%. Giá trị "kỳ trước" tính lại bằng `buildShopPeriodStats` với `prevCycle = getComparisonRanges(period, trend.prevEnd)` (lùi thêm 1 chu kỳ nữa để có "kỳ trước của kỳ trước" làm mốc so sánh).
6. Component hiển thị: `CompactKpiCard` (thẻ KPI đầu trang, có `title` tooltip), khối tự viết trong card "Khách hàng" (không dùng component riêng), header cột bảng có `title` tooltip.

## Acceptance Criteria

**AC1:** "Khách hàng mới" của 1 shop = khách (theo `receiverPhone`) có đơn trong Kỳ này VÀ KHÔNG có đơn nào trước thời điểm bắt đầu Kỳ này, trong toàn bộ lịch sử đơn CỦA RIÊNG shop đó.

**AC2:** Số ở thẻ KPI đầu trang = TỔNG (Σ) đúng bằng cột "Khách mới" cộng dồn qua mọi shop trong bảng "Chi tiết theo shop" — không lệch số.

**AC3:** Badge % ở thẻ KPI và khối trong card "Khách hàng" hiện đúng % tăng/giảm so với kỳ trước; nếu kỳ trước = 0 khách mới và kỳ này > 0 → hiện chữ "Mới" (xanh dương), không hiện %/∞.

**AC4:** Đổi tab Ngày/Tuần/Tháng → số ở thẻ KPI, khối trong card "Khách hàng" (trừ sparkline) và cột bảng đều cập nhật theo đúng khoảng Kỳ này mới; sparkline 7 cột KHÔNG đổi theo tab (luôn 7 ngày gần nhất tính từ `anchorDate`).

**AC5:** Sparkline hiện đủ 7 cột, cột cuối cùng (hôm nay) tô màu đậm nhất (`#0D9488`), 6 cột trước tô nhạt hơn (`#0D9488` + alpha 33%); hover 1 cột hiện tooltip đúng số khách mới ngày đó.

**AC6:** Đại lý/shop không có đơn nào trong Kỳ này → hiện "0 KH", không lỗi/NaN; không nhầm lẫn với "Khách quay lại" (AGA-REPORT-9) — 1 khách hàng không được tính đồng thời ở cả 2 chỉ số trong cùng 1 kỳ, của cùng 1 shop.

## Notes

- **Tách ra từ AGA-REPORT-7** (redesign tổng thể trang "Báo cáo") theo yêu cầu quản lý riêng từng chỉ số — AGA-REPORT-7 nay chỉ còn giữ khung trang tổng thể (header, thứ tự các khối), còn định nghĩa/logic chi tiết của "Khách hàng mới" chuyển hẳn về story này.
- "Khách hàng quay lại" (chỉ số song song, dùng chung `buildShopPeriodStats`) được tách thành story riêng — xem [AGA-REPORT-9](./khach-quay-lai.md).
- **Định nghĩa nghiệp vụ đã xác nhận với người yêu cầu**: "KH" = khách hàng CUỐI của shop (người mua/nhận hàng, nhận diện qua `receiverPhone`) — KHÔNG PHẢI đếm số shop.
- Không có "known gap" về nguồn dữ liệu — dùng dữ liệu đơn hàng thật (`orderStore`), không dùng công thức demo cố định.
