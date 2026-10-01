---
id: AGA-REPORT-10
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Khối KPI tổng quan theo kỳ (6 thẻ, so sánh kỳ trước)

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn xem nhanh 6 chỉ số vận hành quan trọng nhất (Doanh thu, Sản lượng, AOV theo cân, AOV theo sản lượng, Khách hàng mới, Khách quay lại) ngay đầu trang "Báo cáo", mỗi chỉ số kèm % so với kỳ trước, để đánh giá xu hướng kinh doanh mà không cần cuộn xuống hay tính tay.

## User Flow

1. Ngay dưới header trang, hiện 2 hàng thẻ KPI: hàng 1 gồm 4 thẻ đều nhau (Doanh thu, Sản lượng, Khách hàng mới, Khách quay lại); hàng 2 gồm 2 thẻ RỘNG HƠN (AOV theo cân, AOV theo sản lượng).
2. Mỗi thẻ gồm: nhãn xám nhỏ ở trên, số lớn đậm và badge % nằm CÙNG 1 hàng ngay bên dưới (mũi tên xanh khi tăng, đỏ khi giảm, chữ "Mới" màu xanh dương nếu kỳ trước = 0 và kỳ này > 0).
3. 2 thẻ "Khách hàng mới"/"Khách quay lại" có thêm tooltip (hover) giải thích định nghĩa — logic chi tiết xem AGA-REPORT-8 và AGA-REPORT-9.
4. Đổi dropdown "Thời gian" (đặt ở header trang — xem AGA-REPORT-7) → cả 6 thẻ cập nhật lại theo đúng khoảng Kỳ này/Kỳ trước của lựa chọn đó.
5. Màn hình hẹp → mỗi hàng thẻ tự xuống dòng (wrap) độc lập, thẻ hàng 1 rộng tối thiểu ~150px, thẻ hàng 2 rộng tối thiểu ~300px.

## System Flow

1. `getComparisonRanges(period, anchor)` định nghĩa khoảng "Kỳ này"/"Kỳ trước" theo 3 tab: Ngày → so cùng kỳ D-7; Tuần → 7 ngày gần nhất so 7 ngày liền trước; Tháng → MTD so MTD-1 (clamp ngày nếu tháng trước ít ngày hơn).
2. "Doanh thu" = `trend.current`/`trend.previous` (Σ `order.fee` trong khoảng, từ `computePeriodComparison()`). "Sản lượng" = `totalVolume` = Σ `volume` của mọi shop trong `shopStatsCur` (kết quả `buildShopPeriodStats()` cho từng shop).
3. "AOV theo sản lượng" = `trend.current / totalVolume`; "AOV theo cân" = `trend.current / (Σ order.weight trong kỳ / 1000)` — cả 2 chia cho 0 → trả 0, không lỗi/NaN.
4. "Khách hàng mới"/"Khách quay lại" = Σ `newCustomers`/`reactiveCustomers` qua mọi shop trong `shopStatsCur` — logic 2 hàm `countNewCustomers()`/`countReactiveCustomers()` xem AGA-REPORT-8/AGA-REPORT-9 (không lặp lại ở đây để tránh 2 nguồn dễ lệch khi sửa).
5. Giá trị "kỳ trước" của cả 6 KPI tính lại bằng chính công thức tương ứng nhưng áp khoảng `trend.prevStart/prevEnd` (làm "kỳ hiện tại" của phép tính lùi) và `prevCycle.prevStart/prevEnd` (làm "kỳ trước" của phép tính lùi), với `prevCycle = getComparisonRanges(period, trend.prevEnd)`.
6. `pctDelta(cur, prev)`: `prev > 0` → % bình thường; `prev = 0` và `cur > 0` → trả `null` (hiện badge "Mới" màu xanh dương); cả 2 = 0 → 0%. Dùng CHUNG cho cả 6 thẻ.
7. Component `CompactKpiCard({label, value, deltaPct, tooltip?, flexBasis?})` — thẻ trắng bo góc 10px, viền `#E5E7EB`, render nhãn (dòng riêng) rồi số + `DeltaBadge` CÙNG 1 hàng flex (`gap: 8`); `flexBasis` mặc định `150px` (hàng 1), truyền `300px` cho 2 thẻ AOV ở hàng 2 để chúng rộng hơn; `DeltaBadge` render icon `RiseOutlined`/`FallOutlined` + % hoặc chữ "Mới" màu `#3B82F6`.
8. 6 giá trị này CŨNG là TỔNG (Σ) đúng bằng bảng "Chi tiết theo shop" (AGA-REPORT-13) — dùng chung 1 nguồn tính (`shopStatsCur`), không phải 2 nguồn tính riêng.

## Acceptance Criteria

**AC1:** Đúng 2 hàng: hàng 1 gồm 4 thẻ đúng thứ tự (Doanh thu, Sản lượng, Khách hàng mới, Khách quay lại); hàng 2 gồm 2 thẻ RỘNG HƠN đúng thứ tự (AOV theo cân, AOV theo sản lượng).

**AC2:** Mỗi thẻ có số lớn và badge % nằm CÙNG 1 hàng (không phải 2 hàng riêng); badge kèm icon tăng/giảm, hoặc chữ "Mới" (xanh dương) khi kỳ trước = 0 và kỳ này > 0; kỳ này và kỳ trước đều 0 → hiện "0,0%".

**AC3:** Đổi dropdown "Thời gian" ở header trang → cả 6 thẻ cập nhật đúng theo khoảng Kỳ này/Kỳ trước tương ứng của lựa chọn đó.

**AC4:** "Doanh thu"/"Sản lượng" khi đại lý không có đơn nào trong kỳ → hiện "0 ₫"/"0 đơn", không lỗi.

**AC5:** "AOV theo cân"/"AOV theo sản lượng" khi chia cho 0 (0 đơn hoặc 0kg trong kỳ) → hiện "0 ₫/kg"/"0 ₫/đơn", không NaN.

**AC6:** 6 giá trị khớp CHÍNH XÁC với tổng (Σ) cột tương ứng trong bảng "Chi tiết theo shop" (AGA-REPORT-13) — không lệch số.

**AC7:** Màn hình hẹp (dưới ~900px) → mỗi hàng thẻ tự xuống dòng độc lập, không tràn ngang/không phát sinh thanh cuộn ngang.

## Notes

- **Redesign lần 2 (2026-09-27)**: đổi layout từ 1 hàng 6 thẻ đều nhau sang 2 hàng (4 thẻ chính + 2 thẻ AOV rộng hơn), badge % chuyển từ dòng riêng lên CÙNG hàng với số lớn — theo đúng ảnh mockup UI thật do người yêu cầu cung cấp.
- **Tách ra từ AGA-REPORT-7** (redesign tổng thể trang "Báo cáo") theo yêu cầu quản lý riêng từng phần của trang.
- 2 thẻ "Khách hàng mới"/"Khách quay lại" ở đây chỉ mô tả VỊ TRÍ/HÀNH VI HIỂN THỊ trong khối KPI — định nghĩa/công thức tính đầy đủ xem [AGA-REPORT-8](./khach-hang-moi.md) và [AGA-REPORT-9](./khach-quay-lai.md).
- Bộ lọc "Thời gian" điều khiển khối này nhưng KHÔNG nằm trong khối này — xem [AGA-REPORT-7](./redesign-thong-ke-shop-6-kpi-khach-hang.md) (đặt ở góc phải header trang, KHÔNG còn ở card "Xu hướng..." như bản trước).
- Không có "known gap" nào về nguồn dữ liệu — cả 6 KPI đều dùng dữ liệu đơn hàng thật (`orderStore`), không dùng công thức demo cố định.
