---
id: SHOP-ORDER-59
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Báo cáo dòng tiền: Modal breakdown "Đã thanh toán" (kênh thanh toán)

## Bối cảnh

Tách từ [SHOP-ORDER-55](./bao-cao-dong-tien.md) (bảng chính "Phí dịch vụ") — phần click vào số tiền cột "Đã thanh toán" để mở modal giải thích số tiền đó đã thanh toán QUA KÊNH NÀO, hoàn toàn khác với modal breakdown "Phí dịch vụ" ([SHOP-ORDER-58](./bao-cao-dong-tien-breakdown-phi-dich-vu.md)).

## User Story

Là chủ shop, tôi muốn bấm vào số tiền "Đã thanh toán" của 1 đơn để xem rõ khoản đó được thanh toán qua kênh nào (tiền mặt/MoMo/chuyển khoản...), giống đúng popup "ĐÃ THANH TOÁN" thật của GHN, thay vì chỉ thấy 1 con số không rõ nguồn.

## User Flow

1. Bấm vào SỐ TIỀN ở cột "Đã thanh toán" của 1 dòng bất kỳ → mở modal KHÁC hẳn modal "Phí dịch vụ" (breakdown KÊNH THANH TOÁN, không phải breakdown phí): mã vận đơn ở header, tổng "ĐÃ THANH TOÁN" (số dương, to, đậm).
2. Rồi breakdown 5 kênh: "Cấn bằng COD", "Thanh toán qua ví", "Tiền mặt thu người nhận", "Tiền mặt thu người gửi", "Thanh toán qua ck ngân hàng" — ĐÚNG 1 dòng khớp kênh thanh toán thật của đơn (`paymentMethod`) bằng toàn bộ số đã thanh toán, 4 dòng còn lại luôn = 0.
3. Bấm X hoặc click ra ngoài overlay để đóng.

## System Flow

1. `paymentBreakdownRows(order)` + `PaymentBreakdownModal` (`CashFlowReport.tsx`) — breakdown KÊNH THANH TOÁN (khác hẳn `feeBreakdownRows`, vốn là breakdown PHÍ): `paid = paymentApprovalStatus === 'confirmed' ? (paymentApprovedAmount ?? fee) : 0`; trả 5 dòng `{ label, amount }` — "Cấn bằng COD" LUÔN `0` (prototype không có khái niệm thu hộ COD bù trừ phí ship), "Thanh toán qua ví" = `paid` nếu `paymentMethod === 'momo'` else `0`, "Tiền mặt thu người nhận" LUÔN `0` (không có khái niệm người NHẬN trả tiền mặt phí ship), "Tiền mặt thu người gửi" = `paid` nếu `paymentMethod === 'cash'` else `0`, "Thanh toán qua ck ngân hàng" = `paid` nếu `paymentMethod === 'bank_transfer'` else `0` — ĐÚNG 1 dòng khớp `paymentMethod` của đơn sẽ khác `0`, 4 dòng còn lại luôn `0` (prototype chỉ có 1 field `paymentMethod` duy nhất mỗi đơn, không mô phỏng thanh toán 1 phần qua nhiều kênh cùng lúc).
2. Click vào số cột "Đã thanh toán" (`onClick={() => setPaymentBreakdownOrder(order)}`) mở `PaymentBreakdownModal`; trước đây span này đã có sẵn `textDecoration: 'underline'` (trông như link) nhưng KHÔNG có `onClick` nào — dead UI affordance, phát hiện khi đối chiếu với 1 ảnh tham khảo UI thật của GHN cho đúng popup "ĐÃ THANH TOÁN" này.
3. Click overlay nền hoặc icon X đóng modal — state `paymentBreakdownOrder` reset về `null`.

## Acceptance Criteria

**AC1:** Bấm vào số tiền cột "Đã thanh toán" của 1 dòng → mở modal "ĐÃ THANH TOÁN" (KHÁC modal "Phí dịch vụ") đúng mã vận đơn của dòng đó, tổng = đúng `a.daThanhToan`, breakdown 5 kênh thanh toán — ĐÚNG 1 dòng khớp `paymentMethod` của đơn bằng toàn bộ số đã thanh toán, 4 dòng còn lại = `0`.

**AC2:** Bấm X hoặc click ra vùng overlay bên ngoài modal → modal đóng; mở lại với đơn khác → luôn hiện đúng dữ liệu đơn vừa bấm, không dính dữ liệu đơn trước.

## Notes

- **Thêm mới (hoàn thiện 1 UI affordance bỏ dở từ trước)**: cột "Đã thanh toán" đã có sẵn style `textDecoration: 'underline'` từ trước (trông giống hệt link như cột "Phí dịch vụ") nhưng CHƯA TỪNG có `onClick` — bấm vào không có phản ứng gì. Phát hiện khi đối chiếu với 1 ảnh chụp UI thật của GHN cho đúng popup này (header mã vận đơn, "Người nhận", tổng "ĐÃ THANH TOÁN" to đậm, breakdown 5 kênh). Đã thêm `paymentBreakdownRows()`/`PaymentBreakdownModal` hoàn thiện đúng affordance đó.
- Modal này sau đó được PORT sang Agency Admin (`CashRemittance.tsx`, màn "Chi tiết" shop) — xem AGA-PAYMENT-6 — dùng chung đúng công thức/breakdown này.
- Xem [SHOP-ORDER-58](./bao-cao-dong-tien-breakdown-phi-dich-vu.md) (modal breakdown PHÍ — khái niệm hoàn toàn khác, đừng nhầm 2 modal này với nhau), [SHOP-ORDER-55](./bao-cao-dong-tien.md) (bảng chính nơi cột "Đã thanh toán" này nằm).
