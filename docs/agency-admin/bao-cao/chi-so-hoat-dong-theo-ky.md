---
id: AGA-REPORT-6
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Chỉ số hoạt động theo kỳ (AOV, KH Onboard, KH Re-active)

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn xem 4 chỉ số vận hành theo đúng kỳ đang chọn (Ngày/Tuần/Tháng) — AOV theo sản lượng, AOV theo cân, số shop mới Onboard, số shop Re-active — ngay trong khối "Chỉ số hoạt động theo kỳ" ở trang "Báo cáo", để đánh giá hiệu quả kinh doanh và mức độ giữ chân shop của đại lý theo thời gian, không chỉ dừng ở tổng phí ship.

## User Flow

1. Trong trang "Báo cáo", ở khối "Chỉ số hoạt động theo kỳ" (cùng khối với "Xu hướng tổng phí ship theo shop" — xem AGA-REPORT-2), bên dưới 3 ô "Kỳ này / Kỳ trước / So với cùng kỳ" xuất hiện thêm 1 hàng 4 ô nhỏ.
2. Ô 1 — "AOV theo sản lượng": doanh thu (phí ship) kỳ này chia cho số đơn kỳ này, kèm dòng phụ ghi rõ số đơn dùng để tính.
3. Ô 2 — "AOV theo cân": doanh thu kỳ này chia cho tổng khối lượng (kg) kỳ này, kèm dòng phụ ghi rõ tổng cân nặng dùng để tính.
4. Ô 3 — "KH Onboard mới": số shop của đại lý có ngày tạo (`createdAt`) rơi vào đúng khoảng "Kỳ này" đang chọn.
5. Ô 4 — "KH Re-active": số shop có đơn phát sinh ở "Kỳ này" nhưng KHÔNG có đơn nào ở "Kỳ trước" liền kề, dù trước đó đã từng có đơn (không tính shop hoàn toàn mới — shop mới đã tính ở ô 3).
6. Đổi tab "Ngày"/"Tuần"/"Tháng" → cả 4 ô cập nhật lại theo đúng khoảng "Kỳ này"/"Kỳ trước" mới của tab đó (xem AGA-REPORT-2 cho định nghĩa chính xác D-7/tuần liền trước/MTD-MTD-1 theo từng tab).
7. Đổi dropdown "Shop" (đang lọc cho biểu đồ xu hướng) → 2 ô AOV (1, 2) thu hẹp tính theo đúng 1 shop đang chọn; 2 ô KH Onboard/Re-active (3, 4) KHÔNG đổi theo dropdown này — luôn đếm trên toàn bộ shop của đại lý, vì đơn vị đang đếm là SỐ SHOP, không hợp lý nếu bó hẹp vào đúng 1 shop.

## System Flow

1. 4 chỉ số này dùng CHUNG state `period`/`anchorDate`/`selectedShopId`/`trend` (kết quả `computePeriodComparison()`) với khối "Xu hướng tổng phí ship theo shop" — không có state hay period selector riêng.
2. `curOrders = trendOrders.filter(o => createdAt nằm trong [trend.curStart, trend.curEnd])` — `trendOrders` đã tôn trọng dropdown "Shop" (xem AGA-REPORT-2 điểm 7).
3. `aovByVolume = curOrders.length > 0 ? trend.current / curOrders.length : 0` — `trend.current` = tổng phí ship (`order.fee`) kỳ này, ĐÃ tính sẵn ở `computePeriodComparison()`, không tính lại.
4. `curTotalWeightKg = Σ curOrders[i].weight / 1000` (đổi gram → kg); `aovByWeight = curTotalWeightKg > 0 ? trend.current / curTotalWeightKg : 0`.
5. `newShopsOnboard = shops.filter(s => s.createdAt nằm trong [trend.curStart, trend.curEnd]).length` — dùng `shops` (TOÀN BỘ shop đại lý, KHÔNG lọc theo `selectedShopId`), so theo field `createdAt` có sẵn của `Shop`.
6. `countReactiveShops(orders, shopList, curStart, curEnd, prevStart, prevEnd)` — hàm mới, duyệt TỪNG shop trong `shopList` (luôn = `shops`, toàn bộ đại lý): `hasCurrent` = có ≥ 1 đơn trong `[curStart, curEnd]`; nếu không có → loại. `hasPrevPeriod` = có ≥ 1 đơn trong `[prevStart, prevEnd]`; nếu CÓ → loại (shop vẫn đang hoạt động ở kỳ trước, không phải "quay lại"). Còn lại kiểm tra `hasHistoryBeforePrev` = có ≥ 1 đơn trước `prevStart` — CHỈ đếm là "re-active" nếu có lịch sử trước đó (loại shop hoàn toàn mới, vì shop mới đã được tính ở "KH Onboard mới", tránh đếm trùng 2 ô).
7. Cả 4 ô render trong 1 hàng flex riêng, ngay dưới hàng 3 ô "Kỳ này/Kỳ trước/So với cùng kỳ" và phía trên dropdown "Shop" — dùng `KpiCard`-style nhỏ gọn (label xám 12px, giá trị 18px đậm, dòng phụ 11px xám) chứ không dùng lại component `KpiCard` lớn ở đầu trang (kích thước khác, tránh lẫn với 4 KPI tổng quan toàn đại lý ở AGA-REPORT-1).

## Acceptance Criteria

**AC1:** Hàng 4 ô "AOV theo sản lượng / AOV theo cân / KH Onboard mới / KH Re-active" hiện đúng thứ tự, ngay dưới 3 ô "Kỳ này/Kỳ trước/So với cùng kỳ" và phía trên dropdown "Shop", trong CÙNG khối "Chỉ số hoạt động theo kỳ" với AGA-REPORT-2.

**AC2:** "AOV theo sản lượng" = tổng phí ship kỳ này ÷ số đơn kỳ này; kỳ này có 0 đơn → hiện "0 ₫", không lỗi/NaN.

**AC3:** "AOV theo cân" = tổng phí ship kỳ này ÷ tổng khối lượng (kg) kỳ này (đổi từ gram); kỳ này có tổng khối lượng 0 → hiện "0 ₫", không lỗi/NaN.

**AC4:** "KH Onboard mới" = đúng số shop có `createdAt` rơi vào khoảng "Kỳ này" đang chọn — không lọc theo dropdown "Shop" (luôn tính trên toàn bộ shop đại lý).

**AC5:** "KH Re-active" = đúng số shop thoả cả 3 điều kiện: (a) có đơn ở Kỳ này, (b) KHÔNG có đơn ở Kỳ trước, (c) có đơn TỪ TRƯỚC Kỳ trước (không phải shop mới toanh) — không lọc theo dropdown "Shop".

**AC6:** Đổi tab Ngày/Tuần/Tháng → cả 4 ô cập nhật lại theo đúng khoảng Kỳ này/Kỳ trước mới của tab đó, khớp với 3 ô so sánh phía trên (AGA-REPORT-2 AC4).

**AC7:** Đổi dropdown "Shop" sang 1 shop cụ thể → 2 ô AOV (1, 2) thu hẹp đúng theo shop đó; 2 ô KH Onboard/Re-active (3, 4) GIỮ NGUYÊN số liệu toàn đại lý, không đổi theo shop đang lọc.

**AC8:** 1 shop KHÔNG được tính đồng thời ở cả "KH Onboard mới" VÀ "KH Re-active" trong cùng 1 kỳ — shop có đơn đầu tiên trong Kỳ này (chưa từng có đơn trước đó) CHỈ tính vào "KH Onboard mới"; shop có đơn Kỳ này sau khi từng có đơn (nhưng không có ở Kỳ trước) CHỈ tính vào "KH Re-active".

## Notes

- **Nguồn gốc yêu cầu**: dựa theo backlog "Thống kê shop trên Agency" (15/09/2026) — 5 gạch đầu dòng: AOV (theo cân, theo sản lượng); Khách hàng re-active dịch vụ; Doanh thu - sản lượng phát sinh của từng shop (ĐÃ có sẵn ở AGA-REPORT-3, không cần xây thêm); Số lượng KH OB (Onboard, đếm KH phát sinh); View theo Ngày (cùng kỳ D-7)/Tuần (4 tuần gần nhất)/Tháng (MTD, MTD-1) — áp dụng lại đúng cơ chế Ngày/Tuần/Tháng đã có ở AGA-REPORT-2, xem story đó để biết chi tiết `getComparisonRanges()`.
- **"BC" trong backlog gốc = Shop** — đã xác nhận trực tiếp với người yêu cầu trước khi viết story này, khớp với tiêu đề dòng backlog "Thống kê SHOP trên Agency".
- **AOV** viết tắt "Average Order Value" — ở đây KHÔNG dùng 1 công thức duy nhất mà tách 2 biến thể theo đúng yêu cầu: chia theo SỐ ĐƠN (sản lượng) và chia theo TỔNG CÂN (kg) — 2 con số này thường KHÁC NHAU đáng kể nếu đại lý có nhiều đơn nhẹ/nhỏ lẻ so với ít đơn nặng.
- **Định nghĩa "Re-active" là quyết định nghiệp vụ tự suy ra** (backlog gốc chỉ ghi "Khách hàng re-active dịch vụ", không có công thức chi tiết) — logic hiện tại: đã từng có đơn, KHÔNG có đơn ở đúng kỳ liền trước, rồi CÓ đơn trở lại ở kỳ này. Nếu đội nghiệp vụ có định nghĩa khác (VD: khoảng "ngừng hoạt động" phải dài hơn 1 kỳ, không chỉ đúng 1 kỳ liền trước) thì cần chỉnh lại `countReactiveShops()`.
- Không có "known gap" nào về mặt tính toán — cả 4 chỉ số đều dùng dữ liệu đơn hàng/shop thật (`orderStore`/`shopStore`), không dùng công thức demo cố định như 1 số KPI khác trong hệ thống (xem AGA-REPORT-1 Notes về "Known inconsistency" của cách tính COD).
