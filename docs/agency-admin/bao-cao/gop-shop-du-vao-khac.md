---
id: AGA-REPORT-4
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Gộp shop dư vào "Khác" khi biểu đồ nhiều shop

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn khi đại lý có nhiều hơn 8 shop, biểu đồ "Xu hướng tổng phí ship theo shop" vẫn dễ đọc bằng cách gộp các shop đóng góp ít vào 1 nhóm "Khác", để không bị rối mắt bởi hàng chục/hàng trăm lát màu siêu mỏng trùng màu nhau.

## User Flow

1. Mở "Báo cáo" → khối "Xu hướng tổng phí ship theo shop", để dropdown "Shop" ở mặc định "Tất cả shop".
2. Nếu đại lý có ≤ 8 shop: biểu đồ hiện đủ từng shop, mỗi màu 1 shop (không đổi so với trước).
3. Nếu đại lý có > 8 shop: biểu đồ chỉ tách lát riêng cho 8 shop đóng góp phí ship nhiều nhất; toàn bộ shop còn lại gộp vào 1 lát màu xám duy nhất, tên "Khác (N shop)" (N = số shop bị gộp).
4. Hover vào cột → tooltip liệt kê đúng 8 shop Top + dòng "Khác (N shop)" kèm tổng phí của nhóm này, y như 1 "shop ảo".
5. Legend dưới biểu đồ hiện đủ 8 tên shop Top + 1 mục "Khác (N shop)" màu xám.
6. Mở "Xem dạng bảng" → bảng KHÔNG áp dụng gộp, vẫn liệt kê đủ từng shop riêng lẻ (kể cả các shop đã bị gộp vào "Khác" trên biểu đồ).

## System Flow

1. `collapseToTopShops(points, topN)` — hàm nhận `points: ShopTrendPoint[]` (đã build sẵn đủ mọi shop) và `topN = SHOP_CHART_COLORS.length = 8`.
2. Nếu số shop trong `points[0].slices` ≤ `topN` → trả nguyên `points`, không gộp.
3. Ngược lại: tính TỔNG phí của mỗi shop CỘNG DỒN qua toàn bộ `points` (không phải theo từng kỳ riêng lẻ) bằng `Map<shopId, tổng>`, sort giảm dần, lấy `topN` shopId đầu làm `topShopIds`.
4. Với mỗi `point`: giữ nguyên slice của shop nằm trong `topShopIds`; slice của các shop còn lại bị lọc ra và CỘNG GIÁ TRỊ lại thành 1 `otherValue`; tạo `ShopSlice` mới `{ shopId: '__other__', shopName: 'Khác (N shop)', value: otherValue, color: '#9CA3AF' }` (xám, tách biệt hẳn 8 màu categorical), gắn vào cuối mảng `slices` của point đó.
5. `p.total` giữ nguyên không đổi — tổng các slice sau khi gộp (8 slice Top + 1 slice Khác) luôn cộng lại đúng bằng `p.total` gốc (không có shop nào bị rơi mất số liệu).
6. Trang gọi hàm này CHỈ cho dữ liệu vẽ biểu đồ (`chartPoints`) khi đang ở chế độ "Tất cả shop": `chartPoints = selectedShopId ? ... : collapseToTopShops(fullShopTrendSeries, SHOP_CHART_COLORS.length)`. `ShopTrendTable` (bảng "Xem dạng bảng") luôn dùng `fullShopTrendSeries` GỐC (chưa gộp), tách biệt hoàn toàn khỏi `chartPoints`.
7. Xếp hạng Top 8 tính theo TỔNG CẢ 6 KỲ đang hiển thị (không phải riêng kỳ hiện tại) — mục đích để danh sách 8 shop Top không nhảy lung tung giữa các cột trong cùng 1 lần xem, dù thứ hạng theo từng kỳ riêng lẻ có thể khác.
8. `ShopTrendChart` không cần biết gì về việc gộp — nó chỉ render đúng mảng `slices` được truyền vào, nên lát "Khác" tự động có tooltip/legend/màu như 1 "shop" bình thường, không cần code riêng.

## Acceptance Criteria

**AC1:** Đại lý có ≤ 8 shop → biểu đồ hiện đủ từng shop, không có lát "Khác" nào xuất hiện (hành vi giữ nguyên như trước khi có tính năng này).

**AC2:** Đại lý có > 8 shop → biểu đồ chỉ có tối đa 9 lát màu mỗi cột: 8 lát cho 8 shop đóng góp nhiều nhất (theo tổng phí cộng dồn cả khung thời gian hiển thị) + 1 lát xám "Khác (N shop)" cho phần còn lại.

**AC3:** N trong "Khác (N shop)" = đúng số shop bị gộp (tổng số shop − 8), không đổi giữa các kỳ trong cùng 1 lần xem trang.

**AC4:** Tổng giá trị của 9 lát (8 Top + Khác) trong 1 cột luôn cộng lại đúng bằng tổng phí thật của kỳ đó — không có shop nào bị mất số liệu khi gộp.

**AC5:** Hover vào cột có lát "Khác" → tooltip liệt kê "Khác (N shop)" kèm số tiền tổng, ở vị trí cuối danh sách (sau 8 shop Top); nếu "Khác" = 0đ trong kỳ đó thì KHÔNG xuất hiện trong tooltip (theo đúng quy tắc ẩn slice `value = 0` đã áp dụng cho mọi slice khác).

**AC6:** Bảng "Xem dạng bảng" KHÔNG áp dụng gộp — luôn liệt kê đủ từng shop dù biểu đồ phía trên đang gộp bao nhiêu shop vào "Khác".

**AC7:** Danh sách 8 shop Top được chọn dựa trên TỔNG phí cộng dồn qua toàn bộ 6 kỳ hiển thị; đổi tab Ngày/Tuần/Tháng → tính lại Top 8 theo đúng khung 6 kỳ mới tương ứng.

## Notes

- Ngưỡng gộp (`topN = 8`) LUÔN bằng đúng `SHOP_CHART_COLORS.length` — nếu sau này đổi bảng màu categorical (thêm/bớt màu), ngưỡng gộp tự động đổi theo, không cần sửa số cứng ở 2 chỗ.
- Việc gộp CHỈ ảnh hưởng biểu đồ "Tất cả shop" — không ảnh hưởng 3 ô KPI tổng hợp (Kỳ này/Cùng kỳ trước đó/So với cùng kỳ), các ô này luôn tính trên TOÀN BỘ đơn hàng thật, không qua bước gộp.
- Trước khi có tính năng này, code cũ dùng `idx % 8` khiến shop thứ 9 trở đi LẶP MÀU với shop thứ 1 — đã thay hẳn bằng cơ chế gộp "Khác", không còn tình trạng 2 shop khác nhau trông giống màu nhau trên biểu đồ.
- Dữ liệu demo hiện có 105 shop cho `AGN001` (seed thêm `SHP101`–`SHP200` trong `shops.json`) để chứng minh trực tiếp hành vi gộp — mở "Báo cáo" ở chế độ "Tất cả shop" sẽ luôn thấy đúng 9 lát/cột.
