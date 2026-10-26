---
id: AGA-REPORT-12
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Biểu đồ "Xu hướng doanh thu & sản lượng"

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn xem 1 biểu đồ miền (area) chồng theo từng shop thể hiện doanh thu theo ngày, cùng lúc với 1 đường tổng sản lượng đè lên trên, trong đúng khoảng thời gian tôi đang chọn ở bộ lọc "Thời gian" của trang, để biết shop nào đóng góp bao nhiêu và xu hướng tổng thể mà không cần đọc số liệu thô.

## User Flow

1. Card "Xu hướng doanh thu & sản lượng" chiếm TOÀN BỘ chiều rộng trang, nằm riêng 1 hàng — KHÔNG còn chung hàng tỉ lệ 2:1 với card "Khách hàng" (AGA-REPORT-11) như thiết kế cũ, để cả 2 card cùng rộng ngang nhau, cùng mật độ cột/pixel dù biểu đồ có vẽ tới 90 điểm.
2. Đầu card: tiêu đề bên trái; bên phải là nút **"Chọn shop (N/10)"** — bấm vào mở 1 dropdown có ô tìm kiếm + danh sách checkbox TẤT CẢ shop của đại lý, xếp theo doanh thu giảm dần (shop doanh thu cao hiện trước). Tối đa chọn được 10 shop cùng lúc — chạm mốc 10 thì các checkbox chưa chọn tự mờ/disable kèm dòng nhắc đỏ "Đã chọn tối đa 10 shop — bỏ chọn bớt để thêm shop khác."
3. KHÔNG còn toggle "Doanh thu"/"Sản lượng" nào — biểu đồ hiện ĐỒNG THỜI cả 2 chỉ số: miền chồng theo shop = doanh thu (trục trái), 1 đường cam duy nhất = sản lượng (trục phải), không có cách tách riêng từng chỉ số để xem 1 mình nữa.
4. KHÔNG còn đường "Kỳ trước (D-7)" so sánh nào — biểu đồ chỉ vẽ ĐÚNG 1 kỳ (kỳ hiện tại theo bộ lọc "Thời gian"). So sánh với kỳ trước chỉ còn ở 6 KPI đầu trang và bảng "Chi tiết theo shop" (dạng % delta), không còn ở biểu đồ này.
5. Dưới cụm nút là 2 dòng chú thích nhỏ: dòng 1 "6 KPI & Bảng chi tiết đang so với [kỳ trước theo lựa chọn]", dòng 2 "Biểu đồ hiện đúng [N] ngày của kỳ đang chọn ở filter 'Thời gian' — miền theo shop = doanh thu (trục trái), đường cam = tổng sản lượng (trục phải)".
6. Đổi bộ lọc "Thời gian" ở header trang (Hôm nay/Hôm qua/30-60-90 ngày trước/tuỳ chỉnh) → số ngày hiển thị trên biểu đồ này đổi theo NGAY (khác thiết kế cũ — biểu đồ này giờ KHÔNG cố định 14 ngày nữa, luôn bám đúng số ngày của kỳ đang chọn).
7. Danh sách shop đã TICK CHỌN không tự đổi khi đổi bộ lọc "Thời gian" sau đó — chỉ có THỨ TỰ hiện trong dropdown (xếp theo doanh thu) và DỮ LIỆU vẽ trên biểu đồ mới cập nhật theo kỳ mới; mặc định 10 shop doanh thu cao nhất chỉ được tự động chọn sẵn đúng 1 LẦN lúc mới vào trang.
8. Rê chuột vào biểu đồ → hiện đường dọc chỉ vị trí đang trỏ, chấm tròn phóng to trên đường sản lượng, và 1 khối tooltip dưới biểu đồ liệt kê đúng ngày + doanh thu từng shop đang chọn (sắp giảm dần) + tổng sản lượng của ngày đó.
9. Cuối card là legend: 1 ô màu vuông nhỏ cho mỗi shop đang chọn (kèm tên), và 1 line-swatch cam "Tổng sản lượng (trục phải)"; nếu chưa shop nào có doanh thu trong kỳ → thay bằng dòng "Chưa có shop nào phát sinh doanh thu trong N ngày gần nhất."
10. Dưới cùng có link **"↓ Xem dạng bảng"** — chuyển sang bảng số liệu thô: cột là từng ngày, hàng là từng shop đang chọn (tên + mã shop) hiện đúng doanh thu, hàng cuối "Tổng sản lượng" hiện số đơn mỗi ngày; link đổi thành "↑ Xem dạng biểu đồ" để quay lại.

## System Flow

1. `rankShopIdsByRevenue(agencyOrders, shops, trend.curEnd, trendDays)`: xếp hạng TOÀN BỘ shop của đại lý theo tổng doanh thu trong đúng cửa sổ `trendDays` ngày kết thúc tại `trend.curEnd` (shop 0đ vẫn có mặt, xếp cuối) — tính LẠI mỗi lần render (đổi filter "Thời gian" là xếp hạng lại), dùng cho cả mặc định ban đầu lẫn thứ tự hiện trong dropdown.
2. `trendDays` suy ra trực tiếp từ khoảng `trend.curStart`/`trend.curEnd` của bộ lọc "Thời gian" đang chọn ở header trang (`getComparisonRanges`/`rollingRange`) — khác thiết kế cũ, giờ KHÔNG còn hằng số 14 cố định nào, biểu đồ này và card "Khách hàng" dùng CHUNG 1 giá trị `trendDays`.
3. `selectedShopIds` (state `Set<string>`) khởi tạo 1 LẦN DUY NHẤT lúc mount bằng `shopRankedIds.slice(0, MAX_COLORED_SHOPS)` (10 shop đầu bảng xếp hạng tại thời điểm mount) — đổi filter "Thời gian" sau đó KHÔNG reset lại Set này, giữ đúng lựa chọn thủ công của người dùng.
4. `toggleShopSelected(id)`: thêm/bớt 1 id khỏi Set; chặn thêm khi `selectedShopIds.size >= MAX_COLORED_SHOPS` (= 10) — picker tự disable checkbox ở ngưỡng này, hàm có thêm 1 lớp guard dự phòng.
5. `buildShopStackedSeries(agencyOrders, shops, trend.curEnd, trendDays, shopRankedIds.filter(id => selectedShopIds.has(id)))`: dựng `points` (mỗi điểm 1 ngày, `values[shopId] = {revenue, volume}`) CHỈ cho các shop đã chọn — thứ tự entities theo đúng thứ tự xếp hạng hiện tại (không theo thứ tự tick), mỗi entity gán 1 màu cố định từ `SHOP_PALETTE` (10 màu) theo chỉ số trong mảng entities.
6. `ShopRevenueVolumeChart({points, entities})`: tự tính `revenueTotals`/`volumeTotals` bằng cách CỘNG DỒN qua đúng các `entities` được truyền vào (nghĩa là đường sản lượng = tổng sản lượng của các SHOP ĐANG CHỌN, không phải toàn đại lý) — vẽ `bands` (miền chồng tích luỹ đáy→đỉnh theo thứ tự entities, có seam trắng phân tách) cho doanh thu trên trục trái, và 1 `volumeLinePath` duy nhất cho sản lượng trên trục phải, dùng màu `C_ACTION` (cam) — cố ý KHÔNG trùng bất kỳ màu nào trong `SHOP_PALETTE` để không bị nhầm là "1 shop nữa".
7. Khác với biểu đồ "Khách hàng" bên dưới (`buildCustomerPoints`, gộp theo TUẦN khi `trendDays > 30`) — `ShopRevenueVolumeChart` LUÔN vẽ theo NGÀY, không bao giờ gộp tuần dù `trendDays` lên tới 90 (do biểu đồ này đã full-width riêng hàng, đủ rộng để vẽ dày điểm).
8. Toggle "Xem dạng bảng" là state cục bộ `tableView` trong chính component — không ảnh hưởng gì tới `selectedShopIds`/dữ liệu, chỉ đổi cách trình bày CÙNG 1 bộ `points`/`entities` đã tính.
9. Picker "Chọn shop": state `shopPickerOpen`/`shopPickerSearch`, đóng khi click ra ngoài (`mousedown` + `shopPickerRef.current.contains`) — cùng pattern click-outside dùng ở nhiều dropdown khác trong dự án.
10. KHÔNG có toggle Doanh thu/Sản lượng và KHÔNG có state nào cho "kỳ trước" trong component này nữa — cả 2 cơ chế của thiết kế cũ (AGA-REPORT-12 bản trước) đã bị GỠ BỎ hoàn toàn khỏi code, không phải tạm ẩn.

## Acceptance Criteria

**AC1:** Card chiếm full-width, riêng 1 hàng — không chia cột với card "Khách hàng".

**AC2:** Nút "Chọn shop (N/10)" hiện đúng số shop đang chọn; bấm mở dropdown có ô tìm kiếm + checkbox list xếp theo doanh thu giảm dần của đúng kỳ đang chọn.

**AC3:** Chọn đủ 10 shop → các checkbox chưa chọn tự mờ/disable, hiện dòng cảnh báo đỏ nhắc đã đạt tối đa.

**AC4:** Đổi bộ lọc "Thời gian" ở header trang → số ngày vẽ trên biểu đồ đổi đúng theo, KHÔNG cố định ở bất kỳ con số nào.

**AC5:** Đổi bộ lọc "Thời gian" sau khi đã tự tick chọn shop → danh sách shop ĐANG CHỌN giữ nguyên (không bị reset về top 10 mới), chỉ dữ liệu/thứ tự trong dropdown cập nhật theo kỳ mới.

**AC6:** Biểu đồ hiện ĐÚNG 1 đường sản lượng (không tách theo shop) và miền chồng doanh thu CHỈ tính trên các shop đang được tick chọn — bỏ chọn bớt 1 shop thì cả miền lẫn tổng sản lượng đều giảm tương ứng.

**AC7:** Rê chuột vào biểu đồ → hiện đường chỉ vị trí + chấm tròn phóng to trên đường sản lượng + tooltip liệt kê đúng doanh thu từng shop (sắp giảm dần) và tổng sản lượng của ngày đang trỏ; rời chuột → ẩn hết.

**AC8:** Không có shop nào (trong số đang chọn) phát sinh doanh thu trong toàn bộ kỳ → biểu đồ vẫn render (trục/lưới đầy đủ), không lỗi/NaN/chia 0, legend hiện dòng nhắc "Chưa có shop nào phát sinh doanh thu...".

**AC9:** Bấm "Xem dạng bảng" → hiện đúng bảng: cột theo ngày, hàng theo từng shop đang chọn (tên + mã shop), hàng cuối "Tổng sản lượng"; bấm "Xem dạng biểu đồ" → quay lại đúng trạng thái biểu đồ trước đó.

**AC10:** KHÔNG còn toggle Doanh thu/Sản lượng, KHÔNG còn đường "Kỳ trước" nào trên biểu đồ này — chỉ 6 KPI đầu trang và bảng "Chi tiết theo shop" mới hiện % so với kỳ trước.

## Notes

- **Doc này đã lỗi thời và được VIẾT LẠI HOÀN TOÀN** để khớp đúng code thật đang chạy — bản trước mô tả 1 thiết kế KHÁC HẲN (2 đường line "Kỳ này"/"Kỳ trước D-7" cố định 14 ngày, dropdown chọn 1 shop duy nhất mặc định "Toàn đại lý", toggle Doanh thu/Sản lượng) đã bị thay thế từ đợt redesign "cột chồng theo shop, filter thời gian" (xem commit `8ae4c05`) nhưng doc chưa từng được cập nhật theo — hai thiết kế không tương thích với nhau, không phải chỉnh sửa nhỏ.
- Màu trục phải/đường sản lượng dùng `C_ACTION` (cam, token hành động chính của app theo CLAUDE.md) — nhất quán với các biểu đồ khác trong cùng trang.
- `MAX_COLORED_SHOPS = 10` là giới hạn CỨNG — không có khái niệm gộp phần dư vào "Khác" nữa (khác thiết kế gộp-nhóm từng cân nhắc trước đó); người dùng tự chọn đúng danh sách muốn xem, tối đa 10.
- Không có "known gap" về nguồn dữ liệu — dùng dữ liệu đơn hàng thật (`orderStore`/`agencyOrders`), doanh thu loại trừ đơn online đã trả trước (`isPrepaidOnline`), không dùng công thức demo cố định.
- Xem AGA-REPORT-7 (bộ lọc "Thời gian" ở header, nguồn `trendDays`/`trend.curStart`/`trend.curEnd` dùng chung cho cả trang), AGA-REPORT-11 (card "Khách hàng", dùng chung `trendDays` nhưng KHÁC ở chỗ gộp theo tuần khi > 30 ngày), AGA-REPORT-13 (bảng "Chi tiết theo shop", nơi còn giữ % so với kỳ trước).
