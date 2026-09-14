---
id: AGA-REPORT-2
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Xu hướng tổng phí ship theo shop

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn xem biểu đồ xu hướng TỔNG PHÍ SHIP theo Ngày/Tuần/Tháng, tách theo TỪNG SHOP, so sánh với cùng kỳ liền trước, để biết shop nào đang tăng/giảm đóng góp vào tổng phí ship theo thời gian.

## User Flow

1. Trong trang "Báo cáo", cuộn tới khối "Xu hướng tổng phí ship theo shop".
2. Chọn 1 trong 3 tab thời gian: "Ngày" / "Tuần" / "Tháng" (mặc định "Tuần").
3. 3 ô tổng hợp hiện ngay dưới: "Kỳ này (khoảng ngày)" — tổng phí kỳ hiện tại; "Cùng kỳ trước (khoảng ngày)" — tổng phí kỳ liền trước; "So với cùng kỳ" — % tăng/giảm (kèm icon mũi tên lên/xuống màu xanh/đỏ), hoặc chữ "Mới" (xanh dương) nếu kỳ trước = 0.
4. Bên dưới là biểu đồ cột CHỒNG (stacked bar) — mỗi cột là 1 kỳ (6 kỳ gần nhất), mỗi lát màu trong cột là 1 shop.
5. Di chuột vào 1 cột bất kỳ (không cần trúng đúng lát mỏng) → hiện tooltip liệt kê TỪNG SHOP có phát sinh phí trong kỳ đó kèm số tiền, và tổng cả kỳ ở đầu tooltip.
6. Cột cuối cùng (kỳ hiện tại) luôn hiện số tổng ngay trên đỉnh cột, không cần hover.
7. Dưới biểu đồ có legend liệt kê tên + màu từng shop.
8. Bấm "Xem dạng bảng" → chuyển hiển thị số liệu dạng bảng (cột: Kỳ, từng shop, Tổng) thay cho biểu đồ; bấm lại ("Ẩn dạng bảng") để quay về chỉ biểu đồ.

## System Flow

1. `getAgencyOrders()` lấy toàn bộ đơn của mọi shop thuộc `CURRENT_AGENCY_ID`.
2. Vì dữ liệu đơn hàng demo là NGÀY CỐ ĐỊNH trong quá khứ (không tự cập nhật theo ngày hệ thống thật), `anchorDate` (mốc "hiện tại") lấy theo NGÀY CÓ ĐƠN GẦN NHẤT của đại lý (`Math.max(...agencyOrders.map(...))`), KHÔNG dùng `new Date()` thật — nếu dùng ngày thật, mọi kỳ sẽ luôn rơi vào lúc chưa có dữ liệu demo.
3. Dùng PHÍ SHIP (`order.fee`) làm số liệu chính, KHÔNG dùng COD — vì không phải đơn nào cũng có COD (đơn khách trả trước/chuyển khoản thì COD = 0), nhưng đơn nào cũng phát sinh phí ship.
4. `PERIOD_DAYS = { day: 1, week: 7, month: 30 }` — độ dài 1 kỳ theo tab đang chọn.
5. `computePeriodComparison()`: `curEnd = endOfDay(anchor)`, `curStart = startOfDay(anchor − (days−1) ngày)`, `prevEnd = endOfDay(curStart − 1 ngày)`, `prevStart = startOfDay(prevEnd − (days−1) ngày)` — kỳ trước LUÔN liền kề ngay trước kỳ này, không chồng lấn. `deltaPct = previous > 0 ? (current−previous)/previous×100 : (current > 0 ? null : 0)` — `previous = 0` VÀ `current > 0` → trả `null` (hiển thị "Mới") thay vì % tăng vô hạn.
6. `buildShopTrendSeries()` vẽ `TREND_BAR_COUNT = 6` kỳ liên tiếp gần nhất (kỳ cuối trùng "Kỳ này"), mỗi kỳ tính riêng phí ship của TỪNG shop trong danh sách `shops` (đã lọc theo đại lý).
7. `SHOP_CHART_COLORS` — bảng màu categorical 8 màu ĐÃ VALIDATE (theo skill `dataviz`, đảm bảo phân biệt được dưới mù màu/CVD khi nhiều lát xếp chồng); quá 8 shop thì các shop từ thứ 9 trở đi LẶP LẠI màu theo `idx % 8` (chưa có cơ chế gộp "Khác" thật sự dù comment trong code có nhắc tới ý tưởng này).
8. `ShopTrendStackedChart` — hover CẢ CỘT (không phải riêng 1 lát) để hiện tooltip liệt kê đủ mọi shop có `value > 0` trong kỳ đó; cột hiện tại (`isCurrent`) luôn có nhãn tổng hiện trực tiếp trên đỉnh, không cần hover.
9. Nút "Xem dạng bảng" (`showTable`) chuyển sang bảng: cột "Kỳ" + 1 cột/shop + cột "Tổng" — dùng đúng `shopLegend` (danh sách shop lấy từ `points[0].slices`) làm tiêu đề cột.

## Acceptance Criteria

**AC1:** 3 tab "Ngày"/"Tuần"/"Tháng" — mặc định chọn "Tuần"; đổi tab → toàn bộ 3 ô tổng hợp + biểu đồ + bảng cập nhật lại theo độ dài kỳ mới.

**AC2:** Mốc "hiện tại" dùng NGÀY CÓ ĐƠN GẦN NHẤT của đại lý (không phải ngày hệ thống thật) — caption dưới tiêu đề khối nêu rõ điều này kèm ngày cụ thể.

**AC3:** 3 ô tổng hợp hiện đúng khoảng ngày của "Kỳ này" và "Cùng kỳ trước" (không chồng lấn, liền kề nhau), và số liệu tổng phí ship tương ứng.

**AC4:** "So với cùng kỳ" hiện % tăng (xanh lá, icon mũi tên lên) hoặc % giảm (đỏ, mũi tên xuống); nếu kỳ trước = 0 và kỳ này > 0 → hiện chữ "Mới" (xanh dương, không có %); nếu cả 2 kỳ đều = 0 → hiện "0.0%" (không mũi tên).

**AC5:** Biểu đồ hiện đúng 6 cột (kỳ), mỗi cột chồng nhiều lát màu — mỗi màu ứng với 1 shop, thứ tự màu CỐ ĐỊNH theo shop (không đổi màu ngẫu nhiên giữa các lần render).

**AC6:** Hover vào bất kỳ đâu trên 1 cột (không cần trúng đúng lát) → hiện tooltip liệt kê từng shop có phát sinh phí (`value > 0`) trong kỳ đó kèm số tiền, cộng tổng kỳ ở đầu tooltip; shop có `value = 0` trong kỳ đó KHÔNG xuất hiện trong tooltip.

**AC7:** Cột cuối cùng (kỳ hiện tại) luôn hiện nhãn tổng số tiền ngay trên đỉnh cột mà không cần hover; các cột khác chỉ hiện số khi hover.

**AC8:** Legend liệt kê đủ tên + màu của mọi shop (kể cả shop có `value = 0` ở TẤT CẢ 6 kỳ) — lấy theo danh sách shop tại kỳ đầu tiên (`points[0].slices`), không lọc theo shop có phát sinh hay không.

**AC9:** Bấm "Xem dạng bảng" → hiện bảng cùng số liệu (Kỳ | từng shop | Tổng); bấm lại (nay hiện "Ẩn dạng bảng") → ẩn bảng, quay về chỉ hiện biểu đồ.

## Notes

- Bảng màu categorical 8 màu đã chạy qua script validate của skill `dataviz` (đảm bảo phân biệt dưới mù màu) trước khi đưa vào code — không tự ý đổi thứ tự hay thêm màu tuỳ ý nếu sau này có > 8 shop.
- **Known gap**: với đại lý có > 8 shop, các shop từ thứ 9 trở đi sẽ LẶP LẠI màu của shop thứ 1, 2... (`idx % 8`) — 2 shop khác nhau có thể trùng màu trên biểu đồ, gây nhầm lẫn. Code hiện tại KHÔNG có cơ chế gộp shop dư vào 1 lát "Khác" như comment gợi ý — cần bổ sung nếu đại lý mẫu vượt quá 8 shop.
- Vì `anchorDate` neo theo dữ liệu demo cố định (không phải ngày hệ thống thật), khi xem lại demo này ở BẤT KỲ THỜI ĐIỂM NÀO trong tương lai, "hiện tại" vẫn luôn là cùng 1 ngày cố định — đây là hành vi CHỦ Ý cho môi trường demo, không phải bug.
- Dùng `order.fee` (phí ship) thay vì COD làm số liệu chính — quyết định rõ ràng của user trong phiên trước ("vì có thể tôi sẽ không có cod").
