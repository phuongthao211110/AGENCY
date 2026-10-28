---
id: SHOP-ORDER-57
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Báo cáo dòng tiền: Badge cảnh báo phát sinh thêm / cần hoàn tiền

## Bối cảnh

Tách từ [SHOP-ORDER-55](./bao-cao-dong-tien.md) (bảng chính "Phí dịch vụ") — phần hiển thị badge cảnh báo ngay dưới mã vận đơn khi phí hiệu lực của 1 đơn LỆCH khỏi số tiền đại lý đã duyệt trước đó. Phụ thuộc vào `effectiveFee()`/`rowAmounts()` đã có ở SHOP-ORDER-55.

## User Story

Là chủ shop, khi 1 đơn đã thanh toán xong nhưng SAU ĐÓ phát sinh thêm phí (hoàn hàng/đổi địa chỉ) hoặc được đại lý hoàn lại 1 phần (phí giảm/đơn huỷ), tôi muốn thấy ngay badge cảnh báo dưới mã vận đơn trong bảng chính, để biết lý do "Chưa thanh toán" khác 0 mà không cần bấm vào xem breakdown từng đơn mới biết.

## User Flow

1. Đơn đã `confirmed` (đại lý đã duyệt) nhưng SAU ĐÓ phát sinh thêm phí (phí hoàn hàng/phụ phí đổi địa chỉ — xem SHOP-ORDER-56) mà phần phát sinh đó CHƯA được duyệt lại → ngay dưới "Mã đơn" hiện thêm 1 **badge nhỏ màu VÀNG** "⚠️ Phí hoàn hàng chưa duyệt" (nếu do trả hàng) hoặc "⚠️ Phụ phí đổi địa chỉ chưa duyệt" (nếu do đổi địa chỉ).
2. Chiều NGƯỢC: đơn đã `confirmed` mà `fee` SAU ĐÓ giảm xuống dưới số đã duyệt (VD: đại lý phúc tra phát hiện phí thật thấp hơn lúc duyệt), HOẶC đơn bị HUỶ sau khi đã thanh toán → badge **MÀU XANH DƯƠNG** "💙 Đại lý sẽ hoàn {X}đ" (nêu đúng số tiền) — CÙNG 1 BADGE cho cả 2 nguyên nhân, không tách nhãn riêng cho đơn huỷ.
3. Badge xanh dương thuần thông báo — Shop KHÔNG có hành động nào ở đây; bên XỬ LÝ (xác nhận đã hoàn) là Agency Admin, xem [AGA-PAYMENT-9](../../agency-admin/cash-remittance/xac-nhan-hoan-tien-thua-cho-shop.md)/[AGA-ORDER-29](../../agency-admin/orders/xac-nhan-hoan-tien-huy-don-da-thanh-toan.md).
4. Đơn không có chênh lệch gì (đa số) → KHÔNG hiện badge nào.

## System Flow

1. `pendingSurchargeLabel(order)` (`CashFlowReport.tsx`): trả `null` nếu đơn chưa `confirmed` hoặc `extra = effectiveFee(order) - (paymentApprovedAmount ?? fee)` bằng `0`.
2. Nếu `extra > 0` (Shop còn nợ thêm) → trả `{ label: 'Phí hoàn hàng chưa duyệt', tone: 'warn' }` khi `order.status === 'returning'`, `{ label: 'Phụ phí đổi địa chỉ chưa duyệt', tone: 'warn' }` khi `feeAddressChange > 0`, hoặc `{ label: 'Phát sinh thêm chưa duyệt', tone: 'warn' }` cho trường hợp còn lại.
3. Nếu `extra < 0` (đại lý cần hoàn — DÙ do phúc tra phí giảm HAY do đơn bị huỷ, GỘP CHUNG cùng 1 nhánh, không tách nhãn riêng cho đơn huỷ) → trả `{ label: 'Đại lý sẽ hoàn {X}đ', tone: 'info' }` với `X = -extra`.
4. Badge CHỈ hiện khi hàm này trả khác `null`, render ngay dưới mã vận đơn ở cột "Mã đơn" — `tone: 'warn'` tô vàng (`#FEF3C7`/`#92400E`, icon ⚠️, cùng tông banner cảnh báo trễ hạn ở AGA-PAYMENT-3), `tone: 'info'` tô xanh dương (`#DBEAFE`/`#1D4ED8`, icon 💙).
5. Đơn `status: 'cancelled'` tự rơi vào nhánh `extra < 0` ở bước 3 nhờ `effectiveFee()` (SHOP-ORDER-55) coi fee hiệu lực = 0 cho đơn huỷ-chưa-hoàn — KHÔNG có nhánh `if (order.status === 'cancelled')` riêng nào trong `pendingSurchargeLabel()`.

## Acceptance Criteria

**AC1:** Đơn đã `confirmed` mà phát sinh thêm phí hoàn hàng/đổi địa chỉ CHƯA được duyệt lại (`fee > paymentApprovedAmount`) → hiện đúng badge VÀNG tương ứng ("Phí hoàn hàng chưa duyệt" nếu do trả hàng, "Phụ phí đổi địa chỉ chưa duyệt" nếu do đổi địa chỉ) ngay dưới mã vận đơn ở bảng chính; đơn KHÔNG có phát sinh gì thêm (đa số) hoặc đơn chưa từng `confirmed` → KHÔNG hiện badge nào.

**AC2:** Đơn đã `confirmed` mà `fee` GIẢM xuống dưới `paymentApprovedAmount` → hiện badge XANH DƯƠNG "💙 Đại lý sẽ hoàn {X}đ" đúng số tiền chênh lệch ngay dưới mã vận đơn; cột "Chưa thanh toán" hiện đúng số DƯƠNG bằng số tiền đó (khác dấu với trường hợp Shop còn nợ thêm).

**AC3:** Đơn `status: 'cancelled'` mà `paymentApprovalStatus: 'confirmed'` CHƯA xác nhận hoàn (`cancelRefundConfirmedAt` rỗng) → hiện ĐÚNG badge xanh dương "💙 Đại lý sẽ hoàn {X}đ" GIỐNG HỆT trường hợp phí giảm (`X = paymentApprovedAmount`, toàn bộ số đã duyệt, vì `effectiveFee()` coi fee hiệu lực = 0) — KHÔNG có nhãn/badge riêng nào khác cho đơn huỷ; cột "Phí dịch vụ" hiện `0` (không phải số âm thật của `order.fee`).

## Notes

- **Thêm mới (badge cảnh báo phát sinh chưa duyệt)**: trước đây, đơn `confirmed` có phí hoàn hàng/đổi địa chỉ phát sinh thêm chỉ lộ ra ở cột "Chưa thanh toán" bằng 1 con số thường (cùng màu/cỡ chữ các số khác) — Shop dễ bỏ sót nếu không tự bấm vào breakdown từng đơn (SHOP-ORDER-58). Đã thêm badge vàng "⚠️ ..." ngay dưới mã vận đơn để báo trước, không cần đổi màu cột số tiền (giữ nguyên theo yêu cầu, chỉ thêm badge).
- **Thêm mới (chiều ngược — "Đại lý sẽ hoàn")**: `fee` không chỉ TĂNG (phí hoàn hàng/đổi địa chỉ) mà còn có thể GIẢM sau khi đã duyệt (VD: phúc tra phát hiện phí thật thấp hơn). Trước đây chiều này hoàn toàn chưa được xử lý — `rowAmounts()` kẹp "Chưa thanh toán" về 0, khiến Shop không biết đại lý đang nợ lại mình 1 khoản. Đã bỏ kẹp, cho "Chưa thanh toán" hiện số DƯƠNG đúng khoản đó, kèm badge xanh dương "💙 Đại lý sẽ hoàn {X}đ".
- **Mở rộng (đơn huỷ-đã-thanh-toán dùng CHUNG đúng nhánh này, không tách riêng)**: đơn `cancelled` mà `confirmed` chưa hoàn (xem AGA-ORDER-29) CŨNG cần đại lý hoàn tiền — ban đầu định làm badge/nhãn riêng ("(đơn huỷ)"), nhưng theo phản hồi trực tiếp đã sửa lại: dùng NGAY nhánh "Đại lý sẽ hoàn" sẵn có thông qua `effectiveFee()` (SHOP-ORDER-55) — không viết thêm nhãn/màu riêng nào. Nhờ vậy badge cho đơn huỷ và đơn-phí-giảm trông Y HỆT nhau, đúng tinh thần "đồng bộ UI" đã yêu cầu.
- Xem [AGA-PAYMENT-9](../../agency-admin/cash-remittance/xac-nhan-hoan-tien-thua-cho-shop.md) (Agency Admin xác nhận đã hoàn khi phí giảm), [AGA-ORDER-29](../../agency-admin/orders/xac-nhan-hoan-tien-huy-don-da-thanh-toan.md) (Agency Admin xác nhận đã hoàn khi huỷ đơn), [SHOP-ORDER-56](./dieu-chinh-dia-chi-phat-sinh-phu-phi.md) (nguồn gốc phụ phí đổi địa chỉ), [SHOP-ORDER-55](./bao-cao-dong-tien.md) (bảng chính + `effectiveFee()`/`rowAmounts()` mà badge này phụ thuộc vào).
