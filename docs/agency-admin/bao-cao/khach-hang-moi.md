---
id: AGA-REPORT-8
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Chỉ số "Khách hàng mới" (KH có đơn hợp lệ đầu tiên trong kỳ)

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn biết có bao nhiêu KHÁCH HÀNG CUỐI (người mua/nhận hàng của shop) có đơn HỢP LỆ (không tính đơn đã huỷ) ĐẦU TIÊN trong kỳ đang chọn — cả theo từng shop và tổng toàn đại lý — để đánh giá khả năng thu hút khách mới của từng shop, tách biệt khỏi số khách quay lại mua tiếp (xem AGA-REPORT-9).

## User Flow

1. "Khách hàng mới" xuất hiện ở 3 nơi trên trang "Báo cáo": (a) 1 trong 6 thẻ KPI đầu trang, (b) khối đầu tiên trong card "Khách hàng" (chấm màu xanh lá, góc phải trang), (c) cột "Khách mới" trong bảng "Chi tiết theo shop".
2. Thẻ KPI đầu trang: hiện số khách mới TOÀN đại lý trong kỳ, kèm badge % so với kỳ trước (hoặc chữ "Mới" màu xanh dương nếu kỳ trước = 0 khách mới); ngay dưới số lớn LUÔN hiện 1 dòng chú thích nhỏ "Đơn hợp lệ đầu tiên trong kỳ này (không tính đơn đã huỷ)" (không cần hover).
3. Khối trong card "Khách hàng": chấm màu xanh lá (`#0D9488`) + nhãn "Khách hàng mới" + badge % (góc phải) → dòng định nghĩa "Đơn hợp lệ đầu tiên trong kỳ này (không tính đơn đã huỷ)" → số lớn → biểu đồ cột theo ngày (hoặc tuần nếu kỳ > 30 ngày — xem AGA-REPORT-12 cho cách gộp tuần).
4. Cột "Khách mới" trong bảng "Chi tiết theo shop": số khách mới CỦA RIÊNG shop đó trong kỳ đang chọn, hover vào tiêu đề cột hiện tooltip định nghĩa.
5. Đổi bộ lọc "Thời gian" ở header trang → cả 3 nơi cập nhật lại theo đúng khoảng "Kỳ này" mới — biểu đồ cột trong card "Khách hàng" bám đúng `trendDays` của bộ lọc (KHÔNG còn cố định 7 ngày như thiết kế rất cũ).

## System Flow

1. Khách hàng nhận diện qua `order.receiverPhone` (người nhận/mua hàng thật) — KHÔNG PHẢI chính shop. `customersActiveInRange(orders, start, end)` gom `Set<receiverPhone>` có đơn HỢP LỆ (bỏ qua đơn `status === 'cancelled'`) trong khoảng đó.
2. `countNewCustomers(orders, curStart, curEnd)` = số khách có mặt trong `customersActiveInRange(orders, curStart, curEnd)` (có đơn hợp lệ trong Kỳ này) VÀ KHÔNG có đơn HỢP LỆ nào khác trước `curStart` trong toàn bộ lịch sử đơn được truyền vào — đơn `status === 'cancelled'` không tính là "đã mua" nên KHÔNG chặn khách được tính là "mới" (khách có 1 đơn huỷ ở quá khứ rồi giờ mới có đơn hợp lệ đầu tiên → vẫn là "Khách hàng mới").
3. Tính theo TỪNG shop (cột bảng, khối trong `buildShopPeriodStats`): truyền `shopOrders` đã lọc theo ĐÚNG 1 `shopId` vào `countNewCustomers()` — vì 1 số điện thoại có thể "mới" ở shop A nhưng đã từng mua ở shop B, 2 quan hệ khách hàng độc lập theo từng shop. Số ở thẻ KPI đầu trang = Σ giá trị này qua mọi shop (`shopStatsCur.reduce(...)`), KHÔNG tính lại trên toàn bộ `agencyOrders` gộp chung (tránh đếm trùng 1 khách mua ở nhiều shop thành "mới" 2 lần theo nghĩa khác).
4. Biểu đồ cột trong card "Khách hàng": mỗi cột = `countNewCustomers(agencyOrders, start, end)` của ĐÚNG ngày (hoặc tuần khi gộp, xem AGA-REPORT-12) đó, trên TOÀN đại lý — dùng CHUNG 1 định nghĩa với số lớn phía trên, không có ngoại lệ "cố định 7 ngày" nào nữa.
5. `pctDelta(cur, prev)`: `prev > 0` → % bình thường; `prev = 0` và `cur > 0` → trả `null` (hiện badge "Mới" màu xanh dương); cả 2 = 0 → 0%. Giá trị "kỳ trước" tính lại bằng `buildShopPeriodStats(shop, agencyOrders, trend.prevStart, trend.prevEnd)` — gọi lại ĐÚNG công thức hiện tại trên khoảng lùi 1 kỳ, không cần "kỳ trước của kỳ trước" nào (không còn `getCycleBeforePrev()`, đã xoá khỏi code).
6. Component hiển thị: `CompactKpiCard` (thẻ KPI đầu trang, nay hiện cả `title` tooltip LẪN 1 dòng chú thích luôn hiện — xem AGA-REPORT-10), khối tự viết trong card "Khách hàng" (không dùng component riêng), header cột bảng có `title` tooltip.

## Acceptance Criteria

**AC1:** "Khách hàng mới" của 1 shop = khách (theo `receiverPhone`) có đơn HỢP LỆ trong Kỳ này VÀ KHÔNG có đơn HỢP LỆ nào khác trước thời điểm bắt đầu Kỳ này, trong toàn bộ lịch sử đơn CỦA RIÊNG shop đó.

**AC2:** Khách có 1 (hoặc nhiều) đơn đã HUỶ trước Kỳ này, và đây là đơn HỢP LỆ đầu tiên của họ → vẫn tính là "Khách hàng mới" (đơn huỷ trước đó không tính là đã từng mua).

**AC3:** Số ở thẻ KPI đầu trang = TỔNG (Σ) đúng bằng cột "Khách mới" cộng dồn qua mọi shop trong bảng "Chi tiết theo shop" — không lệch số.

**AC4:** Badge % ở thẻ KPI và khối trong card "Khách hàng" hiện đúng % tăng/giảm so với kỳ trước; nếu kỳ trước = 0 khách mới và kỳ này > 0 → hiện chữ "Mới" (xanh dương), không hiện %/∞.

**AC5:** Đổi bộ lọc "Thời gian" ở header trang → số ở thẻ KPI, khối trong card "Khách hàng" (kể cả biểu đồ cột) và cột bảng đều cập nhật theo đúng khoảng Kỳ này mới — không còn ngoại lệ nào dùng "7 ngày cố định".

**AC6:** Đại lý/shop không có đơn hợp lệ nào trong Kỳ này → hiện "0 KH", không lỗi/NaN; không nhầm lẫn với "Khách quay lại" (AGA-REPORT-9) — 1 khách hàng không được tính đồng thời ở cả 2 chỉ số trong cùng 1 kỳ, của cùng 1 shop (xem AC6 của AGA-REPORT-9).

## Notes

- **Cập nhật (2026-10-21)**: thêm điều kiện loại trừ đơn ĐÃ HUỶ khỏi mọi phép đếm "đã từng mua"/"có hoạt động trong kỳ" — trước đây đơn huỷ vẫn tính như đơn bình thường, khiến 1 khách có đơn đầu tiên bị huỷ rồi mới thực sự mua lần đầu (hợp lệ) bị tính NHẦM thành "Khách quay lại" thay vì "Khách hàng mới". Thay đổi này đi kèm với redesign toàn bộ định nghĩa "Khách quay lại" — xem [AGA-REPORT-9](./khach-quay-lai.md) Notes để biết chi tiết đầy đủ.
- **Sửa mô tả lỗi thời**: doc bản trước mô tả sparkline "luôn cố định 7 ngày gần nhất, không đổi theo tab" — mô tả đó đã KHÔNG còn đúng với code từ đợt redesign "cột chồng theo shop, filter thời gian" (biểu đồ giờ bám đúng `trendDays` của bộ lọc, xem AGA-REPORT-12); đã sửa lại System Flow/User Flow cho khớp code thật.
- **Tách ra từ AGA-REPORT-7** (redesign tổng thể trang "Báo cáo") theo yêu cầu quản lý riêng từng chỉ số.
- "Khách hàng quay lại" (chỉ số song song, dùng chung `buildShopPeriodStats`) được tách thành story riêng — xem [AGA-REPORT-9](./khach-quay-lai.md).
- **Định nghĩa nghiệp vụ đã xác nhận với người yêu cầu**: "KH" = khách hàng CUỐI của shop (người mua/nhận hàng, nhận diện qua `receiverPhone`) — KHÔNG PHẢI đếm số shop.
- Không có "known gap" về nguồn dữ liệu — dùng dữ liệu đơn hàng thật (`orderStore`), không dùng công thức demo cố định.
