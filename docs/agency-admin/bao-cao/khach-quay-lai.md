---
id: AGA-REPORT-9
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Chỉ số "Khách quay lại" (KH mua đơn hợp lệ lần thứ 2 trở lên)

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn biết có bao nhiêu KHÁCH HÀNG CUỐI (người mua/nhận hàng của shop) đang mua đơn HỢP LỆ lần thứ 2 trở lên (không tính đơn đã huỷ) trong kỳ đang chọn — cả theo từng shop và tổng toàn đại lý — để đánh giá mức độ khách hàng quay lại mua tiếp, tách biệt khỏi số khách hoàn toàn mới (xem AGA-REPORT-8).

## User Flow

1. "Khách quay lại" xuất hiện ở 3 nơi trên trang "Báo cáo": (a) 1 trong 6 thẻ KPI đầu trang, (b) khối thứ hai trong card "Khách hàng" (chấm màu tím, góc phải trang), (c) cột "Khách quay lại" trong bảng "Chi tiết theo shop".
2. Thẻ KPI đầu trang: hiện số khách quay lại TOÀN đại lý trong kỳ, kèm badge % so với kỳ trước (hoặc chữ "Mới" màu xanh dương nếu kỳ trước = 0 khách quay lại); ngay dưới số lớn LUÔN hiện 1 dòng chú thích nhỏ "Đã mua lần thứ 2 trở lên (không tính đơn đã huỷ)" (không cần hover).
3. Khối trong card "Khách hàng": chấm màu tím (`#7C3AED`) + nhãn "Khách quay lại" + badge % (góc phải) → dòng định nghĩa "Đã mua lần thứ 2 trở lên (không tính đơn đã huỷ)" → số lớn → biểu đồ cột theo ngày (hoặc tuần nếu kỳ > 30 ngày, xem AGA-REPORT-12).
4. Cột "Khách quay lại" trong bảng "Chi tiết theo shop": số khách quay lại CỦA RIÊNG shop đó trong kỳ đang chọn, hover vào tiêu đề cột hiện tooltip định nghĩa.
5. Đổi bộ lọc "Thời gian" ở header trang → cả 3 nơi cập nhật lại theo đúng khoảng "Kỳ này"/"Kỳ trước" mới — KHÔNG còn ngoại lệ "sparkline dùng D-1 cố định" như thiết kế cũ, biểu đồ cột trong card "Khách hàng" giờ bám đúng `trendDays` của bộ lọc giống hệt biểu đồ "Xu hướng doanh thu & sản lượng" (AGA-REPORT-12).

## System Flow

1. Khách hàng nhận diện qua `order.receiverPhone` — KHÔNG PHẢI chính shop. `customersActiveInRange(orders, start, end)` gom `Set<receiverPhone>` có đơn HỢP LỆ (bỏ qua đơn `status === 'cancelled'`) trong khoảng đó (dùng chung với AGA-REPORT-8).
2. `countReactiveCustomers(orders, curStart, curEnd)` = số khách có mặt trong `customersActiveInRange(orders, curStart, curEnd)` (tức có đơn HỢP LỆ trong Kỳ này) VÀ có ÍT NHẤT 1 đơn HỢP LỆ KHÁC trước `curStart` trong toàn bộ lịch sử — tức đơn trong Kỳ này là lần mua hợp lệ THỨ 2 TRỞ LÊN. Đơn `status === 'cancelled'` KHÔNG tính là "đã mua" ở bất kỳ vị trí nào trong chuỗi lịch sử (kể cả đơn ngay trước đó) — nếu lần mua liền trước của khách bị huỷ, khách vẫn được tính là "Khách hàng mới" (AGA-REPORT-8) ở lần mua hợp lệ kế tiếp, KHÔNG phải "Khách quay lại".
3. KHÔNG còn khái niệm "Kỳ trước"/"ngừng mua đúng 1 kỳ" nào trong định nghĩa này nữa — hàm chỉ cần đúng 2 tham số `curStart`/`curEnd`, không nhận `prevStart`/`prevEnd` như bản thiết kế cũ.
4. Tính theo TỪNG shop (cột bảng, khối trong `buildShopPeriodStats`): truyền `shopOrders` đã lọc theo ĐÚNG 1 `shopId` vào `countReactiveCustomers()`. Số ở thẻ KPI đầu trang = Σ giá trị này qua mọi shop (`shopStatsCur.reduce(...)`), KHÔNG tính lại trên `agencyOrders` gộp chung.
5. Biểu đồ cột trong card "Khách hàng": mỗi cột = kết quả `countReactiveCustomers(agencyOrders, start, end)` của ĐÚNG ngày (hoặc tuần khi gộp) đó — dùng CHUNG 1 định nghĩa với số lớn phía trên, cộng dồn các cột khớp đúng số lớn (không còn "D-1 đơn giản hoá" nào khác biệt như thiết kế cũ).
6. `pctDelta(cur, prev)`: `prev > 0` → % bình thường; `prev = 0` và `cur > 0` → trả `null` (hiện badge "Mới"); cả 2 = 0 → 0%. Giá trị "kỳ trước" của thẻ KPI/bảng tính lại bằng `buildShopPeriodStats(shop, agencyOrders, trend.prevStart, trend.prevEnd)` — gọi lại ĐÚNG công thức hiện tại trên khoảng lùi 1 kỳ, không cần "kỳ trước của kỳ trước" nào nữa (đã bỏ `getCycleBeforePrev`, hàm này xoá khỏi code vì không còn nơi nào dùng).
7. Component hiển thị: `CompactKpiCard` (thẻ KPI đầu trang, nay hiện cả `title` tooltip LẪN 1 dòng chú thích luôn hiện — xem AGA-REPORT-10), khối tự viết trong card "Khách hàng", header cột bảng có `title` tooltip.

## Acceptance Criteria

**AC1:** "Khách quay lại" của 1 shop = khách (theo `receiverPhone`) có đơn HỢP LỆ (không huỷ) trong Kỳ này, VÀ có ít nhất 1 đơn HỢP LỆ KHÁC trước đó trong toàn bộ lịch sử CỦA RIÊNG shop đó.

**AC2:** Số ở thẻ KPI đầu trang = TỔNG (Σ) đúng bằng cột "Khách quay lại" cộng dồn qua mọi shop trong bảng "Chi tiết theo shop" — không lệch số.

**AC3:** Khách có đơn hợp lệ Kỳ này nhưng lần mua TRƯỚC ĐÓ gần nhất của họ đã bị HUỶ (và không có đơn hợp lệ nào khác trước đó nữa) → tính vào "Khách hàng mới" (AGA-REPORT-8), KHÔNG tính vào "Khách quay lại".

**AC4:** Badge % ở thẻ KPI và khối trong card "Khách hàng" hiện đúng % tăng/giảm so với kỳ trước; nếu kỳ trước = 0 khách quay lại và kỳ này > 0 → hiện chữ "Mới" (xanh dương), không hiện %/∞.

**AC5:** Đổi bộ lọc "Thời gian" ở header trang → số ở thẻ KPI, khối trong card "Khách hàng" (kể cả biểu đồ cột) và cột bảng đều cập nhật theo đúng khoảng Kỳ này/Kỳ trước mới — không còn ngoại lệ nào dùng "D-1 cố định".

**AC6:** 1 khách hàng KHÔNG được tính đồng thời ở cả "Khách hàng mới" (AGA-REPORT-8) VÀ "Khách quay lại" trong cùng 1 kỳ, của cùng 1 shop — 2 chỉ số này luôn CHIA ĐÚNG (partition) tập khách có đơn hợp lệ trong kỳ, không chồng lấn, không bỏ sót khách nào.

**AC7:** Đại lý/shop không có đơn hợp lệ nào thoả điều kiện trong Kỳ này → hiện "0 KH", không lỗi/NaN.

## Notes

- **Redesign (2026-10-21) — đổi hẳn định nghĩa**: trước đây "Khách quay lại" = "từng mua, NGỪNG ĐÚNG 1 KỲ liền trước, rồi quay lại mua tiếp kỳ này" (1 dạng "win-back"/reactivation phức tạp, có ngoại lệ sparkline dùng D-1 riêng, cần tính thêm "kỳ trước của kỳ trước" qua `getCycleBeforePrev()`). Theo yêu cầu nghiệp vụ, đã đổi THẲNG sang định nghĩa đơn giản hơn: "mua đơn HỢP LỆ lần thứ 2 trở lên, không tính đơn đã huỷ" — bỏ hẳn khái niệm "nghỉ 1 kỳ", bỏ hẳn `getCycleBeforePrev()` (đã xoá khỏi code, không còn ai gọi), bỏ hẳn ngoại lệ sparkline D-1. 2 định nghĩa KHÔNG tương thích nhau — đây là thay đổi công thức, không phải sửa lỗi nhỏ.
- **Hệ quả tốt của định nghĩa mới**: "Khách hàng mới" + "Khách quay lại" giờ CHIA ĐÚNG (partition) toàn bộ khách có đơn hợp lệ trong kỳ — không còn khách nào "lọt khe" (ví dụ khách mua liên tục mọi kỳ liền nhau, không hề có khoảng nghỉ, trước đây KHÔNG tính vào cả 2 chỉ số vì không phải "mới" cũng không "nghỉ rồi quay lại"; giờ chắc chắn tính vào "Khách quay lại" vì rõ ràng đây không phải lần mua đầu tiên).
- Đơn bị HUỶ không tính là "đã mua" ở bất kỳ đâu trong công thức — áp dụng ĐỒNG NHẤT cho cả việc xác định "có hoạt động trong kỳ" (`customersActiveInRange`) lẫn "đã từng mua trước đó" — xem AC3.
- "Khách hàng mới" (chỉ số song song, loại trừ lẫn nhau — xem AC6) được tách thành story riêng — xem [AGA-REPORT-8](./khach-hang-moi.md).
- Không có "known gap" về nguồn dữ liệu — dùng dữ liệu đơn hàng thật (`orderStore`), không dùng công thức demo cố định.
