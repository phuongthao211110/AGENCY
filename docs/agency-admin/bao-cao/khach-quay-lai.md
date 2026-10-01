---
id: AGA-REPORT-9
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Chỉ số "Khách quay lại" (KH từng mua, ngừng 1 kỳ, nay quay lại)

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn biết có bao nhiêu KHÁCH HÀNG CUỐI (người mua/nhận hàng của shop) từng mua hàng, NGỪNG mua ở kỳ liền trước, rồi QUAY LẠI đặt đơn tiếp trong kỳ đang chọn — cả theo từng shop và tổng toàn đại lý — để đánh giá mức độ giữ chân/kéo lại khách hàng cũ, tách biệt khỏi số khách hoàn toàn mới (xem AGA-REPORT-8).

## User Flow

1. "Khách quay lại" xuất hiện ở 3 nơi trên trang "Báo cáo": (a) 1 trong 6 thẻ KPI đầu trang, (b) khối thứ hai trong card "Khách hàng" (chấm màu tím, góc phải trang), (c) cột "Khách quay lại" trong bảng "Chi tiết theo shop".
2. Thẻ KPI đầu trang: hiện số khách quay lại TOÀN đại lý trong kỳ, kèm badge % so với kỳ trước (hoặc chữ "Mới" màu xanh dương nếu kỳ trước = 0 khách quay lại).
3. Khối trong card "Khách hàng": chấm màu tím (`#7C3AED`) + nhãn "Khách quay lại" + badge % (góc phải) → dòng định nghĩa "Từng mua, ngừng 1 kỳ, nay quay lại đặt đơn tiếp" → số lớn → sparkline 7 cột (7 ngày gần nhất, cột cuối cùng — hôm nay — tô đậm nhất).
4. Cột "Khách quay lại" trong bảng "Chi tiết theo shop": số khách quay lại CỦA RIÊNG shop đó trong kỳ đang chọn, hover vào tiêu đề cột hiện tooltip định nghĩa.
5. Đổi tab Ngày/Tuần/Tháng → cả 3 nơi cập nhật lại theo đúng khoảng "Kỳ này"/"Kỳ trước" mới của tab đó (sparkline trong card "Khách hàng" là ngoại lệ — xem System Flow điểm 4).

## System Flow

1. Khách hàng nhận diện qua `order.receiverPhone` — KHÔNG PHẢI chính shop. `customersActiveInRange(orders, start, end)` gom `Set<receiverPhone>` có đơn trong khoảng đó (dùng chung với AGA-REPORT-8).
2. `countReactiveCustomers(orders, curStart, curEnd, prevStart, prevEnd)` = số khách có đơn trong `[curStart, curEnd]`, KHÔNG có đơn nào trong `[prevStart, prevEnd]` (Kỳ trước — coi là đã ngừng mua ở kỳ đó), NHƯNG có ÍT NHẤT 1 đơn TRƯỚC `prevStart` (từng là khách cũ, không phải khách hoàn toàn mới — khách hoàn toàn mới đã tính ở AGA-REPORT-8, không tính trùng ở đây).
3. Tính theo TỪNG shop (cột bảng, khối trong `buildShopPeriodStats`): truyền `shopOrders` đã lọc theo ĐÚNG 1 `shopId` vào `countReactiveCustomers()`. Số ở thẻ KPI đầu trang = Σ giá trị này qua mọi shop (`shopStatsCur.reduce(...)`), KHÔNG tính lại trên `agencyOrders` gộp chung.
4. Sparkline 7 cột trong card "Khách hàng" là NGOẠI LỆ và dùng "Kỳ trước" ĐƠN GIẢN HOÁ = đúng 1 ngày liền trước (D-1), KHÁC với định nghĩa "Kỳ trước" chính thức ở thẻ KPI/bảng (theo đúng tab Ngày/Tuần/Tháng đang chọn) — mỗi điểm sparkline = `countReactiveCustomers(agencyOrders, startOfDay(day), endOfDay(day), startOfDay(day-1), endOfDay(day-1))`, chỉ minh hoạ xu hướng ngắn hạn, KHÔNG dùng để đọc số chính thức.
5. `pctDelta(cur, prev)`: `prev > 0` → % bình thường; `prev = 0` và `cur > 0` → trả `null` (hiện badge "Mới"); cả 2 = 0 → 0%. Giá trị "kỳ trước" của thẻ KPI/bảng tính lại bằng `buildShopPeriodStats` với `prevCycle = getComparisonRanges(period, trend.prevEnd)` để có đủ 2 mốc lùi (kỳ trước của kỳ trước) cho phép so sánh 3-điểm-thời-gian.
6. Component hiển thị: `CompactKpiCard` (thẻ KPI đầu trang, có `title` tooltip), khối tự viết trong card "Khách hàng", header cột bảng có `title` tooltip.

## Acceptance Criteria

**AC1:** "Khách quay lại" của 1 shop = khách (theo `receiverPhone`) có đơn trong Kỳ này, KHÔNG có đơn nào trong Kỳ trước, NHƯNG có ít nhất 1 đơn TỪ TRƯỚC Kỳ trước — trong lịch sử đơn CỦA RIÊNG shop đó.

**AC2:** Số ở thẻ KPI đầu trang = TỔNG (Σ) đúng bằng cột "Khách quay lại" cộng dồn qua mọi shop trong bảng "Chi tiết theo shop" — không lệch số.

**AC3:** Badge % ở thẻ KPI và khối trong card "Khách hàng" hiện đúng % tăng/giảm so với kỳ trước; nếu kỳ trước = 0 khách quay lại và kỳ này > 0 → hiện chữ "Mới" (xanh dương), không hiện %/∞.

**AC4:** Đổi tab Ngày/Tuần/Tháng → số ở thẻ KPI, khối trong card "Khách hàng" (trừ sparkline) và cột bảng đều cập nhật theo đúng khoảng Kỳ này/Kỳ trước mới; sparkline 7 cột KHÔNG đổi theo tab (luôn dùng D-1 làm "kỳ trước" đơn giản hoá cho từng ngày).

**AC5:** 1 khách hàng KHÔNG được tính đồng thời ở cả "Khách hàng mới" (AGA-REPORT-8) VÀ "Khách quay lại" trong cùng 1 kỳ, của cùng 1 shop — khách có đơn Kỳ này mà chưa từng có đơn trước đó CHỈ tính vào "Khách hàng mới"; khách có đơn Kỳ này sau khi từng có đơn (nhưng không có ở Kỳ trước) CHỈ tính vào "Khách quay lại".

**AC6:** Đại lý/shop không có đơn nào thoả điều kiện trong Kỳ này → hiện "0 KH", không lỗi/NaN.

## Notes

- **Tách ra từ AGA-REPORT-7** (redesign tổng thể trang "Báo cáo") theo yêu cầu quản lý riêng từng chỉ số — AGA-REPORT-7 nay chỉ còn giữ khung trang tổng thể (header, thứ tự các khối), còn định nghĩa/logic chi tiết của "Khách quay lại" chuyển hẳn về story này.
- "Khách hàng mới" (chỉ số song song, loại trừ lẫn nhau — xem AC5) được tách thành story riêng — xem [AGA-REPORT-8](./khach-hang-moi.md).
- **Định nghĩa "quay lại" là quyết định nghiệp vụ tự suy ra** (mockup gốc chỉ ghi "Khách hàng re-active dịch vụ", không có công thức chi tiết) — logic hiện tại: ngừng đúng 1 kỳ liền trước rồi quay lại. Nếu đội nghiệp vụ có định nghĩa khác (VD: khoảng "ngừng hoạt động" phải dài hơn 1 kỳ) thì cần chỉnh lại `countReactiveCustomers()`.
- Không có "known gap" về nguồn dữ liệu — dùng dữ liệu đơn hàng thật (`orderStore`), không dùng công thức demo cố định.
