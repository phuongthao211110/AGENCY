---
id: AGA-REPORT-13
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Bảng "Chi tiết theo shop"

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn có 1 bảng liệt kê đủ số liệu (Doanh thu, Sản lượng, AOV/đơn, Khách mới, Khách quay lại) của TỪNG shop, sắp xếp theo doanh thu và tìm kiếm được, để đối chiếu nhanh giữa các shop mà không cần cộng dồn thủ công, và bấm vào 1 shop để xem chi tiết ngay.

## User Flow

1. Bảng nằm ở cuối trang "Báo cáo", dưới 2 card "Xu hướng doanh thu & sản lượng" và "Khách hàng" (xem [AGA-REPORT-7](./redesign-thong-ke-shop-6-kpi-khach-hang.md) cho vị trí tổng thể trên trang).
2. Tiêu đề bảng "Chi tiết theo shop" bên trái, ô tìm kiếm "Tìm shop..." bên phải cùng hàng.
3. Header bảng đủ 6 cột: Shop | Doanh thu | Sản lượng | AOV/đơn | Khách mới | Khách quay lại.
4. Các dòng sắp theo Doanh thu giảm dần; mỗi dòng hiện tên shop (màu xanh, đậm) + mã shop nhỏ bên dưới.
5. Bấm vào 1 dòng bất kỳ → điều hướng sang trang chi tiết shop đó.
6. Gõ vào ô tìm kiếm → lọc theo tên hoặc mã shop; không có shop nào khớp → hiện "Không tìm thấy shop phù hợp."; đại lý chưa có shop nào → hiện "Chưa có shop nào."
7. Đổi dropdown "Thời gian" (đặt ở header trang — xem [AGA-REPORT-7](./redesign-thong-ke-shop-6-kpi-khach-hang.md)) → toàn bộ số liệu trong bảng cập nhật lại theo đúng khoảng Kỳ này mới.

## System Flow

1. Nguồn dữ liệu: `buildShopPeriodStats(shop, allOrders, curStart, curEnd, prevStart, prevEnd)` gọi cho TỪNG shop trong đại lý — DÙNG CHUNG với khối 6 KPI ([AGA-REPORT-10](./kpi-tong-quan-theo-ky.md)), không phải 2 nguồn tính riêng, đảm bảo 6 KPI luôn khớp CHÍNH XÁC với tổng (Σ) cột tương ứng của bảng này.
2. `rankedShopStats = shopStatsCur` lọc theo ô tìm kiếm (khớp không phân biệt hoa/thường trên `name` hoặc `id` của shop), sắp giảm dần theo `revenue`.
3. Click 1 dòng → `navigate('/agency-admin/shops/:id')`.
4. Bộ lọc "Thời gian" (dropdown đặt ở header trang — AGA-REPORT-7) điều khiển khoảng Kỳ này/Kỳ trước dùng để tính bảng này — đổi lựa chọn → gọi lại `buildShopPeriodStats()` cho mọi shop theo khoảng mới.
5. "Khách mới"/"Khách quay lại" trong bảng dùng đúng định nghĩa/logic ở [AGA-REPORT-8](./khach-hang-moi.md)/[AGA-REPORT-9](./khach-quay-lai.md) — không tính lại riêng ở đây.

## Acceptance Criteria

**AC1:** Bảng đủ 6 cột đúng thứ tự: Shop, Doanh thu, Sản lượng, AOV/đơn, Khách mới, Khách quay lại — sắp theo Doanh thu giảm dần.

**AC2:** Gõ vào ô tìm kiếm lọc đúng theo tên/mã shop (không phân biệt hoa/thường); không có shop nào khớp → hiện "Không tìm thấy shop phù hợp."; đại lý chưa có shop → hiện "Chưa có shop nào."

**AC3:** Bấm vào 1 dòng bất kỳ trong bảng → điều hướng đúng trang chi tiết shop đó (`/agency-admin/shops/:id`).

**AC4:** Giá trị mỗi dòng trong bảng khớp CHÍNH XÁC với kết quả `buildShopPeriodStats()` của đúng shop đó, theo đúng khoảng Kỳ này đang chọn ở dropdown "Thời gian".

**AC5:** Đổi dropdown "Thời gian" → bảng cập nhật lại theo đúng khoảng Kỳ này mới, khớp với 6 KPI ở AGA-REPORT-10.

**AC6:** Đại lý chưa có đơn hàng nào (`agencyOrders` rỗng) → mọi dòng trong bảng hiện 0/0 ₫/0 KH, không lỗi/NaN.

## Notes

- **Redesign lần 2 (2026-09-27)**: bộ lọc kỳ điều khiển bảng này đổi từ 3 nút Ngày/Tuần/Tháng đặt trong card "Xu hướng..." (AGA-REPORT-12) sang dropdown "Thời gian" ở header trang (AGA-REPORT-7) — bản thân bảng (cột, sắp xếp, tìm kiếm) không đổi gì.
- **Tách ra từ AGA-REPORT-7** (redesign tổng thể trang "Báo cáo") theo yêu cầu quản lý riêng từng phần của trang — AGA-REPORT-7 giờ chỉ còn giữ khung trang tổng thể (header, thứ tự các khối), không còn mô tả bảng này nữa.
- Không có "known gap" nào về nguồn dữ liệu — bảng dùng dữ liệu đơn hàng thật (`orderStore`), không dùng công thức demo cố định.
