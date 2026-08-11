---
id: AGA-RECON-6
jiraKey: 
platform: agency-admin
section: Đối soát & Chuyển khoản
figma: 
status: draft
---

# [AGENCY] Đối soát NVC: Tab "Quá hạn đối soát" — cảnh báo đơn đã giao nhưng chưa từng lên file GHN

## User Story

Là Agency Admin (Đại lý), tôi muốn biết đơn nào **đã giao thành công quá lâu mà chưa từng xuất hiện trong bất kỳ file đối soát GHN nào**, để phát hiện trường hợp GHN có thể đã bỏ sót đơn — mà không bị làm phiền bởi cảnh báo giả do độ trễ báo cáo bình thường của GHN.

## User Flow

1. Vào "Đối soát NVC" → tab mới **"Quá hạn đối soát"**
2. Thấy danh sách đơn: đã "Giao hàng thành công" trên hệ thống quá **30 ngày**, nhưng **chưa từng có mặt** trong dữ liệu đối soát GHN (dù ở phiên nào)
3. Mỗi dòng hiện: Mã đơn, Shop, ngày giao thành công, số ngày đã quá hạn, link "Xem đơn hàng"
4. Nếu không có đơn nào thoả điều kiện → hiện empty state "Không có đơn nào quá hạn đối soát"

## System Flow

1. `computeOverdueOrders()` — hàm mới trong `AgencyReconciliation.tsx`:
   - Lọc đơn của các shop thuộc đại lý hiện tại (`AGN001`), `status === 'delivered'`
   - Loại bỏ đơn mà `trackingCode` đã xuất hiện ở **bất kỳ đâu** trong `carrier-reconciliation-items.json` (không giới hạn theo phiên nào)
   - Với đơn còn lại: tính số ngày từ `log[].status === 'delivered'` đến hiện tại
   - Chỉ giữ đơn có số ngày > `OVERDUE_THRESHOLD_DAYS` (30 — hằng số ở đầu file)
2. **Đây chính là "so sánh lệch có ngưỡng thời gian"** đã thống nhất trước đó — khác với so sánh tức thời `order.status` vs `ghnStatus` (đã bị loại bỏ vì luôn báo giả do GHN báo theo kỳ ~15 ngày): ở đây so sánh dựa trên **thời gian đã trôi qua**, không so trạng thái tại 1 thời điểm.
3. Đã thêm 1 đơn demo (`ORD033`, mã `GHN00999999`, giao thành công 17/04/2024, chưa từng có trong `carrier-reconciliation-items.json`) vào `orders.json` để minh hoạ — vì toàn bộ 16 đơn "delivered" có sẵn trước đó đều ĐÃ được đối soát, không có case nào để demo tính năng này.

## Acceptance Criteria

**AC1:** Tab "Quá hạn đối soát" chỉ hiện đơn thoả ĐỦ 3 điều kiện: thuộc đại lý hiện tại, đã giao thành công, và số ngày từ lúc giao đến nay > 30 ngày.

**AC2:** Đơn đã có mặt trong `carrier-reconciliation-items.json` (dù ở phiên nào, MATCH/MISMATCH/PENDING/NOT_FOUND) — không xuất hiện trong danh sách này, kể cả khi đã giao rất lâu.

**AC3:** Đơn đã giao nhưng CHƯA đủ 30 ngày — không xuất hiện (đang trong thời gian chờ hợp lý, không phải bất thường).

**AC4:** Không có đơn nào thoả điều kiện → hiện empty state rõ ràng, không phải bảng trống khó hiểu.

**AC5:** Bấm "Xem đơn hàng" → điều hướng sang trang "Đơn hàng" của đại lý.

## Notes

- Tính năng này giải quyết đúng câu hỏi: agency admin nêu ra việc so sánh `order.status` (tracking) với `ghnStatus` (file đối soát) không có ý nghĩa vì luôn lệch do độ trễ báo cáo — nhưng agency admin vẫn muốn GIỮ một dạng so sánh lệch nào đó. Giải pháp: đổi từ so sánh **tức thời theo trạng thái** sang so sánh **theo ngưỡng thời gian tích luỹ**, chỉ báo khi độ trễ vượt quá mức hợp lý (30 ngày, dư ra so với chu kỳ thanh toán GHN thật ~15 ngày để tránh báo giả).
- Ngưỡng 30 ngày là số cấu hình cứng (`OVERDUE_THRESHOLD_DAYS`) — chưa có UI cho phép đại lý tự chỉnh ngưỡng, có thể bổ sung sau nếu cần.
- Đây KHÔNG phải là "lệch số tiền" (MISMATCH) — là 1 loại cảnh báo hoàn toàn khác: "chưa từng được đối soát", cần agency chủ động liên hệ GHN xác minh, không tự động giải quyết được trong hệ thống.
- Liên quan trực tiếp: [mapping-trang-thai-doi-soat-ghn.md](./mapping-trang-thai-doi-soat-ghn.md) (AGA-RECON-4), [them-trang-thai-dang-cho-cod.md](./them-trang-thai-dang-cho-cod.md) (AGA-RECON-5).
