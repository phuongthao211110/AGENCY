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

Là nhân viên đại lý (Agency Admin), tôi muốn xem biểu đồ đường thể hiện doanh thu/sản lượng theo từng ngày trong 14 ngày gần nhất, so sánh trực quan với đúng 14 ngày đó lùi 7 ngày trước, để nhận biết xu hướng tăng/giảm mà không cần đọc số liệu thô.

## User Flow

1. Card "Xu hướng doanh thu & sản lượng" nằm bên TRÁI, cùng hàng với card "Khách hàng" (xem AGA-REPORT-11).
2. Đầu card: tiêu đề bên trái; bên phải gồm 1 dropdown chọn shop (mặc định "Toàn đại lý", liệt kê tên từng shop của đại lý) đặt NGAY BÊN TRÁI cụm nút toggle "Doanh thu"/"Sản lượng" (đổi biểu đồ này) — bộ lọc kỳ (trước đây là 3 nút Ngày/Tuần/Tháng đặt ở card này) đã chuyển hẳn lên dropdown "Thời gian" ở header trang (xem AGA-REPORT-7), không còn nút chọn kỳ nào trong card này nữa.
3. Dưới cụm nút là 2 dòng chú thích nhỏ: dòng 1 "6 KPI & Bảng chi tiết đang so với [kỳ trước theo lựa chọn]", dòng 2 "Biểu đồ luôn hiện 14 ngày gần nhất, không đổi theo tab." — khi dropdown đang chọn 1 shop cụ thể (khác "Toàn đại lý"), dòng 2 nối thêm " — đang xem riêng shop **[Tên shop]**" (tên shop tô màu xanh `#3B82F6`, bold).
4. Chọn 1 shop trong dropdown → biểu đồ (cả 2 đường Kỳ này/Kỳ trước) vẽ lại chỉ dựa trên đơn hàng của riêng shop đó, không còn là tổng toàn đại lý. Chọn lại "Toàn đại lý" → biểu đồ về đúng hành vi mặc định (tổng toàn đại lý) như trước.
5. Biểu đồ: đường nét liền màu cam (`#FF5200`) = Kỳ này (14 ngày gần nhất), đường nét đứt xám = Kỳ trước (đúng 14 ngày đó lùi 7 ngày); có vùng tô mờ dưới đường Kỳ này; trục Y hiện 5 mốc giá trị, trục X hiện nhãn ngày (DD/MM) cách quãng.
6. Rê chuột vào biểu đồ → hiện đường dọc chỉ vị trí đang trỏ, chấm tròn trên đường Kỳ này, và 1 dòng text dưới biểu đồ ghi rõ ngày + giá trị Kỳ này + giá trị Kỳ trước (D-7) của đúng ngày đó.
7. Cuối card là legend 2 dòng: nét liền cam = "Kỳ này", nét đứt xám = "Kỳ trước (D-7)".

## System Flow

1. `buildDailySeries(orders, endDate, days)` — trả về `days` điểm liên tiếp theo NGÀY, điểm cuối = `endDate`; mỗi điểm gồm `revenue` (Σ `order.fee` trong ngày) và `volume` (đếm đơn trong ngày).
2. State `chartShopId` (mặc định `'all'`) điều khiển bởi dropdown chọn shop mới; options của dropdown lấy từ `shops` (kết quả `buildShopStats()` của toàn đại lý).
3. `chartOrders = chartShopId === 'all' ? agencyOrders : agencyOrders.filter(o => o.shopId === chartShopId)` — khi chọn "Toàn đại lý", `chartOrders` = `agencyOrders` (hành vi y hệt trước đây, không đổi); khi chọn 1 shop cụ thể, `chartOrders` chỉ còn đơn của riêng shop đó.
4. `dailyCurrent = buildDailySeries(chartOrders, anchorDate, 14)`; `dailyPrevious = buildDailySeries(chartOrders, anchorDate - 7 ngày, 14)` — 2 mảng CÙNG ĐỘ DÀI (14), khớp theo INDEX (điểm thứ i của `dailyPrevious` = đúng 7 ngày trước điểm thứ i của `dailyCurrent`) — hoàn toàn ĐỘC LẬP với tab Ngày/Tuần/Tháng; nguồn dữ liệu đầu vào (`chartOrders`) là phần DUY NHẤT thay đổi theo `chartShopId`, logic dựng chuỗi ngày không đổi.
5. `TrendLineChart({current, previous, metric})` vẽ bằng SVG thuần: `xFor(i)`/`yFor(v)` map index/giá trị sang toạ độ; `curPath`/`prevPath` là chuỗi lệnh `M`/`L` nối các điểm; `areaPath` = `curPath` khép kín xuống đáy để tô vùng mờ (opacity 0.08).
6. `maxValue = Math.max(1, ...curValues, ...prevValues)` — dùng CHUNG 1 trục Y cho cả 2 đường để so sánh đúng tỉ lệ; tối thiểu 1 để tránh chia 0 khi toàn bộ dữ liệu = 0 (bao gồm trường hợp shop đang chọn không có đơn nào trong 14 ngày).
7. Hover: `<rect>` trong suốt phủ từng "cột" ngày (`onMouseEnter`/`onMouseLeave` set `hoverIdx`) → khi có `hoverIdx`, vẽ thêm đường dọc nét đứt + chấm tròn tại điểm đang trỏ + dòng text tổng hợp Kỳ này/Kỳ trước của ngày đó.
8. `chartMetric` (state `'revenue' | 'volume'`) chọn field nào của `DailyPoint` dùng để vẽ (`curValues = current.map(p => p[metric])`) và định dạng số hiển thị (`fmtVND` cho revenue, `fmtNum` cho volume).
9. Bộ lọc kỳ (dropdown "Thời gian") đặt VẬT LÝ ở header trang (AGA-REPORT-7), KHÔNG còn trong card này — điều khiển 6 KPI (AGA-REPORT-10) và bảng "Chi tiết theo shop" (AGA-REPORT-13), KHÔNG điều khiển chính biểu đồ này (biểu đồ luôn cố định 14 ngày, độc lập hoàn toàn với lựa chọn kỳ).
10. `chartShopId` CHỈ đọc bởi biểu đồ này — không truyền xuống/ảnh hưởng 6 KPI đầu trang, bảng "Chi tiết theo shop" (AGA-REPORT-13), hay card "Khách hàng" (AGA-REPORT-11); các khối đó tiếp tục dùng `agencyOrders` (toàn đại lý) không đổi.

## Acceptance Criteria

**AC1:** Card nằm bên trái, cùng hàng với card "Khách hàng" (AGA-REPORT-11), chiếm tỉ lệ rộng hơn (~2:1) khi đủ chỗ.

**AC2:** Toggle "Doanh thu"/"Sản lượng" đổi đúng cả trục Y lẫn 2 đường biểu đồ theo field tương ứng.

**AC3:** Biểu đồ luôn hiện đúng 14 điểm/ngày cho cả 2 đường, bất kể dropdown "Thời gian" ở header đang chọn Ngày/Tuần/Tháng.

**AC4:** Đường "Kỳ trước" tại vị trí ngày X = đúng giá trị của ngày (X trừ 7 ngày) — khớp theo index, không theo khoảng của lựa chọn kỳ ở header.

**AC5:** Rê chuột vào biểu đồ → hiện đường chỉ vị trí + chấm tròn + dòng text đúng ngày/giá trị Kỳ này/giá trị Kỳ trước (D-7) của điểm đang trỏ; rời chuột ra → ẩn hết, chỉ còn chấm tròn cố định ở điểm cuối cùng (ngày gần nhất).

**AC6:** Không có đơn hàng nào trong toàn bộ 14 ngày (`agencyOrders` rỗng hoặc quá cũ) → biểu đồ vẫn render (2 đường phẳng ở đáy), không lỗi/NaN/chia 0.

**AC7:** Legend hiện đúng 2 mục: nét liền cam "Kỳ này", nét đứt xám "Kỳ trước (D-7)".

**AC8:** Dropdown chọn shop mặc định ở "Toàn đại lý" và liệt kê đầy đủ tên các shop của đại lý; chọn 1 shop cụ thể → 2 đường biểu đồ (Kỳ này/Kỳ trước) đổi đúng theo dữ liệu đơn hàng của riêng shop đó, không còn lẫn dữ liệu của shop khác.

**AC9:** Chọn lại "Toàn đại lý" sau khi đã chọn 1 shop → biểu đồ trở về đúng tổng dữ liệu toàn đại lý như hành vi mặc định trước đây.

**AC10:** Chọn 1 shop không có đơn hàng nào trong 14 ngày gần nhất → biểu đồ vẫn render bình thường (2 đường phẳng ở đáy), không lỗi/NaN/chia 0.

**AC11:** Khi đang chọn 1 shop cụ thể, dòng chú thích dưới toggle hiện thêm "đang xem riêng shop [Tên shop]" với tên shop tô màu xanh `#3B82F6` in đậm; khi chọn "Toàn đại lý" thì không hiện phần này.

**AC12:** Bộ lọc shop của biểu đồ này không ảnh hưởng đến 6 KPI đầu trang, bảng "Chi tiết theo shop" (AGA-REPORT-13), hay card "Khách hàng" (AGA-REPORT-11) — các khối đó luôn tính trên toàn đại lý bất kể dropdown đang chọn shop nào.

## Notes

- **Bổ sung ngày 2026-10-01**: thêm dropdown chọn shop ("Toàn đại lý" hoặc 1 shop cụ thể) cho riêng biểu đồ này, đặt bên trái cụm toggle Doanh thu/Sản lượng. Khi chọn 1 shop, `chartOrders` được lọc theo `shopId` trước khi dựng `dailyCurrent`/`dailyPrevious`, nên 2 đường biểu đồ phản ánh đúng dữ liệu riêng của shop đó. Thay đổi này CHỈ tác động biểu đồ xu hướng — không ảnh hưởng 6 KPI đầu trang, bảng "Chi tiết theo shop" (AGA-REPORT-13), hay card "Khách hàng" (AGA-REPORT-11), các khối đó vẫn tính trên toàn đại lý như cũ.
- **Redesign lần 2 (2026-09-27)**: gỡ hẳn bộ lọc Ngày/Tuần/Tháng khỏi card này — chuyển lên dropdown "Thời gian" ở header trang (AGA-REPORT-7), card giờ chỉ còn đúng 1 toggle Doanh thu/Sản lượng — theo đúng ảnh mockup UI thật do người yêu cầu cung cấp. Trước đây bộ lọc đặt vật lý trong card này nhưng không điều khiển chính biểu đồ, dễ gây hiểu lầm — bản mới loại bỏ hẳn nguồn nhầm lẫn đó bằng cách dời hẳn ra khỏi card.
- **Tách ra từ AGA-REPORT-7** (redesign tổng thể trang "Báo cáo") theo yêu cầu quản lý riêng từng phần của trang.
- Màu `#FF5200` (cam, `C_ACTION`) cho đường "Kỳ này" dùng ĐÚNG token màu hành động chính của app (theo CLAUDE.md), khác với màu teal trong ảnh mockup gốc — chủ động không copy màu mockup để giữ nhất quán toàn hệ thống.
- Không có "known gap" nào về nguồn dữ liệu — dùng dữ liệu đơn hàng thật (`orderStore`), không dùng công thức demo cố định.
