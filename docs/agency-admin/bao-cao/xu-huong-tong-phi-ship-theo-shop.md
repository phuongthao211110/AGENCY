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

Là nhân viên đại lý (Agency Admin), tôi muốn xem biểu đồ xu hướng TỔNG PHÍ SHIP theo Ngày/Tuần/Tháng, lọc được theo 1 shop cụ thể hoặc xem gộp Tất cả shop, so sánh với cùng kỳ liền trước, để biết shop nào đang tăng/giảm đóng góp vào tổng phí ship theo thời gian.

## User Flow

1. Trong trang "Báo cáo", cuộn tới khối "Chỉ số hoạt động theo kỳ" (khối này còn chứa 4 KPI mới AOV/Onboard/Re-active — xem AGA-REPORT-6; story này chỉ mô tả phần biểu đồ xu hướng tổng phí ship + 3 ô so sánh kỳ).
2. Chọn 1 trong 3 tab thời gian: "Ngày" / "Tuần" / "Tháng" (mặc định "Tuần").
3. 3 ô tổng hợp hiện ngay dưới: "Kỳ này (khoảng ngày)" — tổng phí kỳ hiện tại; ô thứ 2 — tổng phí "kỳ trước" theo ĐÚNG định nghĩa của tab đang chọn (tab Ngày ghi "Cùng kỳ D-7", tab Tuần ghi "Tuần liền trước", tab Tháng ghi "MTD-1 (cùng ngày tháng trước)"); "So với cùng kỳ" — % tăng/giảm (kèm icon mũi tên lên/xuống màu xanh/đỏ), hoặc chữ "Mới" (xanh lá) nếu kỳ trước = 0.
4. Dropdown "Shop" bên dưới 3 ô tổng hợp — mặc định "Tất cả shop". Bấm vào mở panel có Ô TÌM KIẾM (theo tên hoặc mã shop) + danh sách shop cuộn được — cần thiết khi đại lý có hàng chục/hàng trăm shop, không thể chọn nhanh bằng `<select>` gốc. Chọn 1 shop cụ thể → CẢ 3 ô tổng hợp lẫn biểu đồ đều thu hẹp lại chỉ tính phí ship của đúng shop đó.
5. Biểu đồ cột: khi "Tất cả shop" → cột CHỒNG (stacked bar), mỗi cột là 1 kỳ — tab Tuần vẽ đúng 4 cột (4 tuần gần nhất), tab Ngày/Tháng vẽ 6 cột. Nếu đại lý có ≤ 8 shop, mỗi lát màu là 1 shop; nếu > 8 shop, chỉ 8 shop đóng góp NHIỀU NHẤT (cộng dồn phí qua toàn bộ khung đang hiển thị) được tách lát riêng, phần còn lại GỘP vào 1 lát xám "Khác (N shop)" duy nhất — tránh cột bị chia thành hàng chục/hàng trăm lát siêu mỏng không đọc được. Khi đã chọn 1 shop cụ thể → mỗi cột chỉ còn 1 màu CAM duy nhất (đúng màu accent của hệ thống), thể hiện phí ship riêng của shop đó qua từng kỳ.
6. Di chuột vào 1 cột bất kỳ (không cần trúng đúng lát mỏng) → hiện tooltip liệt kê TỪNG SHOP (hoặc chỉ 1 shop nếu đang lọc) có phát sinh phí trong kỳ đó kèm số tiền, và tổng cả kỳ ở đầu tooltip.
7. Cột cuối cùng (kỳ hiện tại) luôn hiện số tổng ngay trên đỉnh cột, không cần hover.
8. Dưới biểu đồ có legend liệt kê tên + màu từng shop đang hiển thị trên biểu đồ (1 dòng nếu đang lọc theo 1 shop).
9. Bấm "Xem dạng bảng" → hiện bảng số liệu ĐẦY ĐỦ MỌI SHOP của đại lý (không bị ảnh hưởng bởi dropdown "Shop" phía trên) — hàng là từng shop (sắp theo tổng phí giảm dần), cột là từng kỳ; bấm lại ("Ẩn dạng bảng") để ẩn bảng.

## System Flow

1. `getAgencyOrders()` lấy toàn bộ đơn của mọi shop thuộc `CURRENT_AGENCY_ID`.
2. Vì dữ liệu đơn hàng demo là NGÀY CỐ ĐỊNH trong quá khứ (không tự cập nhật theo ngày hệ thống thật), `anchorDate` (mốc "hiện tại") lấy theo NGÀY CÓ ĐƠN GẦN NHẤT của đại lý (`Math.max(...agencyOrders.map(...))`), KHÔNG dùng `new Date()` thật — nếu dùng ngày thật, mọi kỳ sẽ luôn rơi vào lúc chưa có dữ liệu demo.
3. Dùng PHÍ SHIP (`order.fee`) làm số liệu chính, KHÔNG dùng COD — vì không phải đơn nào cũng có COD (đơn khách trả trước/chuyển khoản thì COD = 0), nhưng đơn nào cũng phát sinh phí ship.
4. `PERIOD_DAYS = { day: 1, week: 7, month: 30 }` — CHỈ dùng để tính độ dài 1 "bucket" khi vẽ biểu đồ xu hướng (`buildShopTrendSeries`), KHÔNG còn dùng để tính khoảng so sánh "Kỳ này/Kỳ trước" (xem điểm 5 — đã tách hẳn thành `getComparisonRanges()`, theo đúng yêu cầu nghiệp vụ D-7/tuần liền trước/MTD-MTD-1, không phải cứ lùi đều theo `PERIOD_DAYS`).
5. `getComparisonRanges(period, anchor)` — 3 định nghĩa "kỳ trước" KHÁC NHAU theo tab, KHÔNG còn dùng chung 1 công thức lùi đều như bản cũ:
   - **Ngày**: `curStart/curEnd` = đúng ngày `anchor`; `prevStart/prevEnd` = đúng ngày `anchor − 7 ngày` (CÙNG THỨ trong tuần, không phải hôm qua).
   - **Tuần**: `curStart/curEnd` = 7 ngày gần nhất kết thúc tại `anchor`; `prevStart/prevEnd` = 7 ngày LIỀN TRƯỚC đó (liền kề, không chồng lấn) — để tính được % tăng/giảm.
   - **Tháng**: `curStart` = ngày 1 tháng của `anchor` (`startOfMonth`), `curEnd = anchor` (MTD — Month-to-Date); `prevStart` = ngày 1 tháng TRƯỚC, `prevEnd` = ngày TƯƠNG ỨNG (cùng số ngày trong tháng) của tháng trước — có `Math.min(dayOfMonth, daysInPrevMonth)` để clamp khi tháng trước ít ngày hơn (VD 31/3 → tháng trước chỉ tới 28/2, không tràn sang 2-3/3). Đây là MTD-1, KHÔNG so với trọn tháng trước.
6. `computePeriodComparison()` gọi `getComparisonRanges()` lấy 4 mốc trên + `compareLabel` (nhãn hiển thị cho ô "kỳ trước": "Cùng kỳ D-7" / "Tuần liền trước" / "MTD-1 (cùng ngày tháng trước)"), rồi `current`/`previous` = `sumFeeInRange()` theo đúng 2 khoảng đó. `deltaPct = previous > 0 ? (current−previous)/previous×100 : (current > 0 ? null : 0)` — `previous = 0` VÀ `current > 0` → trả `null` (hiển thị "Mới") thay vì % tăng vô hạn.
7. `selectedShopId` (state, mặc định `''` = "Tất cả shop"): `trendOrders = selectedShopId ? agencyOrders.filter(o => o.shopId === selectedShopId) : agencyOrders` — dùng đúng biến này cho `computePeriodComparison()`, nên 3 ô tổng hợp LUÔN khớp phạm vi dropdown "Shop".
8. `buildShopTrendSeries()` vẽ `TREND_BAR_COUNT[period]` kỳ liên tiếp gần nhất (kỳ cuối trùng "Kỳ này") — `TREND_BAR_COUNT = { day: 6, week: 4, month: 6 }`, tab Tuần chốt đúng 4 cột (4 tuần gần nhất) theo yêu cầu nghiệp vụ, Ngày/Tháng giữ 6 cột như trước. Mỗi kỳ tính riêng phí ship của từng shop trong `shopList` truyền vào. Có 2 lời gọi riêng biệt:
   - `fullShopTrendSeries = buildShopTrendSeries(agencyOrders, shops, ...)` — LUÔN đủ mọi shop, dùng cho bảng "Xem dạng bảng" (không phụ thuộc dropdown).
   - `chartPoints = selectedShopId ? buildShopTrendSeries(agencyOrders, [selectedShop], ...) : collapseToTopShops(fullShopTrendSeries, SHOP_CHART_COLORS.length)` — dữ liệu vẽ biểu đồ: thu hẹp còn 1 shop khi có chọn, hoặc gộp Top 8 + "Khác" khi xem "Tất cả shop". `ShopTrendTable` KHÔNG dùng `chartPoints` mà dùng thẳng `fullShopTrendSeries` chưa gộp, nên bảng luôn liệt kê đủ từng shop riêng lẻ dù biểu đồ đã gộp "Khác".
9. `SHOP_CHART_COLORS` — bảng màu categorical 8 màu ĐÃ VALIDATE (theo skill `dataviz`, đảm bảo phân biệt được dưới mù màu/CVD khi nhiều lát xếp chồng), dùng khi hiển thị "Tất cả shop". `collapseToTopShops(points, topN)` (`topN = SHOP_CHART_COLORS.length = 8`): nếu tổng số shop ≤ `topN` thì trả nguyên `points`, không đổi gì; nếu > `topN` thì xếp hạng shop theo TỔNG phí CỘNG DỒN qua toàn bộ `points` (không phải theo 1 kỳ đơn lẻ, để Top 8 ổn định giữa các kỳ), giữ nguyên `topN` shop cao nhất, GỘP phần còn lại thành 1 `ShopSlice` tổng hợp `{ shopId: '__other__', shopName: 'Khác (N shop)', color: '#9CA3AF' }` (xám, tách biệt hẳn 8 màu categorical) — tổng giá trị các lát sau khi gộp vẫn khớp `p.total` gốc.
10. `ShopTrendChart` (đổi tên từ `ShopTrendStackedChart`) nhận thêm prop `overrideColor?: string` — khi dropdown đang lọc 1 shop cụ thể, trang truyền `overrideColor={C_ACTION}` (cam), ép TOÀN BỘ lát cột + legend render đúng 1 màu cam thay vì màu categorical theo index gốc của shop đó trong `SHOP_CHART_COLORS`. Hover CẢ CỘT (không phải riêng 1 lát) để hiện tooltip liệt kê đủ shop có `value > 0` trong kỳ đó. Trục Y có 5 mốc gridline (`0/25/50/75/100%` của giá trị cao nhất). Legend căn GIỮA theo chiều ngang toàn khối chart (không lệch theo trục Y).
11. Nhãn tổng cố định trên đỉnh cột hiện tại (`isCurrent`, không cần hover) CHỈ hiện ở chế độ "Tất cả shop" (`!overrideColor`) — khi đã lọc theo 1 shop cụ thể thì KHÔNG hiện nhãn cố định này nữa (chỉ còn tooltip khi hover), giữ chart gọn theo đúng mockup lọc-1-shop.
12. Nút "Xem dạng bảng" (`showTable`, state ở component cha — KHÔNG còn nằm trong `ShopTrendChart`) có icon mũi tên lên/xuống (`UpOutlined`/`DownOutlined`) trước label, bật sẽ render `ShopTrendTable` — LUÔN nhận `fullShopTrendSeries` + `ranked` (danh sách shop sort theo tổng phí giảm dần, cùng thứ tự với bảng "COD & phí theo shop") làm input, không nhận `chartPoints` — nên bảng luôn đủ mọi shop bất kể dropdown "Shop" đang lọc gì. Bảng transposed: cột đầu "Shop" (2 dòng: tên shop in đậm + mã shop màu xám bên dưới), các cột sau là từng kỳ (nhãn ngày), mỗi ô tra theo `point.slices.find(s => s.shopId === shop.id)?.value ?? 0`.
13. `ShopFilterDropdown` — combobox tự viết (không phải `<select>` native), cùng pattern trigger + panel nổi + đóng khi click ra ngoài (`useRef` + `mousedown` listener trên `document`) đã dùng ở bộ lọc "Thời gian" của `AgencyReconciliation.tsx`. Panel có ô tìm kiếm lọc theo `name`/`id` (case-insensitive, `includes`) + danh sách cuộn (`maxHeight: 280px`) + dòng "Tất cả shop" luôn ghim đầu danh sách. Cần thiết vì `<select>` native chỉ nhảy theo ký tự đầu, không tìm được theo từ giữa chuỗi — không dùng được tốt khi đại lý có hàng trăm shop.

## Acceptance Criteria

**AC1:** 3 tab "Ngày"/"Tuần"/"Tháng" — mặc định chọn "Tuần"; đổi tab → toàn bộ 3 ô tổng hợp + biểu đồ + bảng cập nhật lại theo độ dài kỳ mới, đồng thời tôn trọng shop đang lọc ở dropdown "Shop" (nếu có).

**AC2:** Mốc "hiện tại" dùng NGÀY CÓ ĐƠN GẦN NHẤT của đại lý (không phải ngày hệ thống thật) — caption dưới tiêu đề khối nêu rõ điều này kèm ngày cụ thể.

**AC3:** Dropdown "Shop" mặc định "Tất cả shop"; chọn 1 shop cụ thể → 3 ô tổng hợp VÀ biểu đồ đều chỉ tính phí ship của đúng shop đó (không còn gộp toàn đại lý).

**AC4:** 3 ô tổng hợp hiện đúng khoảng ngày của "Kỳ này" và ô "kỳ trước" (nhãn đổi theo tab — "Cùng kỳ D-7" / "Tuần liền trước" / "MTD-1 (cùng ngày tháng trước)"), và số liệu tổng phí ship tương ứng đúng phạm vi đang lọc (Tất cả shop hoặc 1 shop). Riêng tab Tuần: 2 khoảng liền kề nhau, không chồng lấn; tab Ngày/Tháng: 2 khoảng KHÔNG liền kề (D-7 và MTD-1 cố ý cách nhau, không phải kỳ ngay trước).

**AC5:** "So với cùng kỳ" hiện % tăng (xanh lá, icon mũi tên lên) hoặc % giảm (đỏ, mũi tên xuống); nếu kỳ trước = 0 và kỳ này > 0 → hiện chữ "Mới" (xanh lá, không có %); nếu cả 2 kỳ đều = 0 → hiện "0.0%" (không mũi tên).

**AC6:** Khi "Tất cả shop" VÀ tổng số shop ≤ 8 — biểu đồ hiện đúng `TREND_BAR_COUNT[period]` cột (kỳ) — 4 cột ở tab Tuần, 6 cột ở tab Ngày/Tháng — mỗi cột chồng nhiều lát màu, mỗi màu ứng với 1 shop, thứ tự màu CỐ ĐỊNH theo shop (không đổi màu ngẫu nhiên giữa các lần render).

**AC6b:** Khi "Tất cả shop" VÀ tổng số shop > 8 — biểu đồ chỉ tách lát riêng cho 8 shop đóng góp NHIỀU NHẤT (tính tổng phí cộng dồn qua toàn bộ khung đang hiển thị), phần còn lại gộp thành 1 lát màu XÁM DUY NHẤT "Khác (N shop)" (N = tổng số shop − 8); tổng chiều cao cột (8 lát Top + 1 lát Khác) khớp đúng tổng phí thật của kỳ đó; Top 8 không đổi giữa các kỳ trong cùng 1 lần xem (xếp hạng theo tổng cả khung thời gian, không theo từng kỳ riêng lẻ).

**AC7:** Khi đã chọn 1 shop cụ thể — biểu đồ hiện đúng số cột theo `TREND_BAR_COUNT[period]`, mỗi cột CHỈ 1 màu cam duy nhất (không dùng lại màu categorical theo index gốc của shop trong bảng 8 màu); legend bên dưới cũng chỉ 1 dòng, cùng màu cam.

**AC8:** Hover vào bất kỳ đâu trên 1 cột (không cần trúng đúng lát) → hiện tooltip liệt kê shop có phát sinh phí (`value > 0`) trong kỳ đó kèm số tiền, cộng tổng kỳ ở đầu tooltip; shop có `value = 0` trong kỳ đó KHÔNG xuất hiện trong tooltip.

**AC9:** Ở chế độ "Tất cả shop" — cột cuối cùng (kỳ hiện tại) luôn hiện nhãn tổng số tiền ngay trên đỉnh cột mà không cần hover; các cột khác chỉ hiện số khi hover. Khi đã lọc theo 1 shop cụ thể — KHÔNG cột nào hiện nhãn cố định (kể cả cột cuối), chỉ hiện số khi hover vào cột.

**AC10:** Bấm "Xem dạng bảng" (có icon mũi tên xuống, đổi thành mũi tên lên khi đang mở) → hiện bảng ĐẦY ĐỦ MỌI SHOP của đại lý — kể cả khi biểu đồ đang gộp "Khác" ở AC6b, bảng vẫn liệt kê từng shop riêng lẻ, không gộp — (không bị ảnh hưởng bởi dropdown "Shop" đang lọc gì cho biểu đồ) — hàng là shop (sắp theo tổng phí giảm dần), mỗi ô "Shop" hiện 2 dòng (tên shop in đậm + mã shop màu xám), cột đầu "Shop", các cột sau là từng kỳ; bấm lại (nay hiện "Ẩn dạng bảng") → ẩn bảng.

**AC11:** Bấm vào dropdown "Shop" → mở panel có ô tìm kiếm (tự động focus) + danh sách shop cuộn được, dòng "Tất cả shop" luôn ở đầu danh sách bất kể đang gõ tìm gì. Gõ vào ô tìm kiếm → danh sách lọc theo tên HOẶC mã shop chứa đúng chuỗi đã gõ (không phân biệt hoa/thường); không tìm thấy → hiện "Không tìm thấy shop phù hợp.". Bấm 1 dòng → chọn shop đó, đóng panel, xoá chuỗi tìm kiếm. Bấm ra ngoài panel (không chọn gì) → đóng panel, giữ nguyên lựa chọn cũ.

## Notes

- Bảng màu categorical 8 màu đã chạy qua script validate của skill `dataviz` (đảm bảo phân biệt dưới mù màu) trước khi đưa vào code — không tự ý đổi thứ tự hay thêm màu tuỳ ý.
- **Đã fix (trước là known gap)**: trước đây với đại lý có > 8 shop, các shop từ thứ 9 trở đi LẶP LẠI màu (`idx % 8`), gây nhầm lẫn 2 shop khác nhau trông giống màu nhau. Nay `collapseToTopShops()` gộp mọi shop ngoài Top 8 vào 1 lát "Khác" màu xám — không còn tình trạng trùng màu categorical. Dữ liệu demo đã seed 105 shop cho `AGN001` (`shops.json`, `SHP101`–`SHP200`) + đơn hàng cho 20 shop trong số đó (`orders.json`, `ORD101`–`ORD141`, ngày trong khoảng 01–15/4/2024 — không đổi `anchorDate` hiện có) để chứng minh trực tiếp hành vi gộp "Khác" và ô tìm kiếm shop khi danh sách dài.
- Vì `anchorDate` neo theo dữ liệu demo cố định (không phải ngày hệ thống thật), khi xem lại demo này ở BẤT KỲ THỜI ĐIỂM NÀO trong tương lai, "hiện tại" vẫn luôn là cùng 1 ngày cố định — đây là hành vi CHỦ Ý cho môi trường demo, không phải bug.
- Dùng `order.fee` (phí ship) thay vì COD làm số liệu chính — quyết định rõ ràng của user trong phiên trước ("vì có thể tôi sẽ không có cod").
- Bảng "Xem dạng bảng" tách khỏi component biểu đồ (`ShopTrendChart` → `ShopTrendTable` riêng) và luôn build từ TOÀN BỘ shop — thiết kế có chủ đích để bảng dùng làm dữ liệu đối chiếu đầy đủ, còn dropdown "Shop" + biểu đồ chỉ là công cụ xem nhanh xu hướng của 1 shop cụ thể.
- **Đổi tên khối + đổi cách tính "kỳ trước"**: khối bao ngoài đổi tên từ "Xu hướng tổng phí ship theo shop" thành "Chỉ số hoạt động theo kỳ" — cùng khối này giờ còn chứa 4 KPI mới (AOV theo sản lượng/theo cân, KH Onboard mới, KH Re-active — xem AGA-REPORT-6), dùng CHUNG state `period`/`anchorDate`/dropdown "Shop" với story này. Đồng thời "kỳ trước" đổi từ công thức lùi đều 1 kiểu cho cả 3 tab sang 3 định nghĩa khác nhau theo yêu cầu nghiệp vụ thật (D-7/tuần liền trước/MTD-MTD-1) — xem System Flow điểm 5.
