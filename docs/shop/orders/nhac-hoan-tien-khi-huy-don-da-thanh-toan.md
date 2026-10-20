---
id: SHOP-ORDER-47
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Nhắc hoàn tiền khi huỷ đơn đã được đại lý xác nhận thanh toán

## User Story

Là chủ shop, khi một đơn đã được ĐẠI LÝ XÁC NHẬN nhận tiền phí ship (tiền mặt hoặc online) bị huỷ, tôi muốn thấy nhắc nhở "Chờ hoàn tiền" trong danh sách đơn, để biết cần liên hệ đại lý để được hoàn lại khoản đã trả — thay vì tưởng đơn đã huỷ là xong hẳn, mất luôn khoản tiền đó.

## User Flow

1. Đơn ĐÃ ĐƯỢC ĐẠI LÝ XÁC NHẬN nhận tiền (`paymentApprovalStatus = 'confirmed'`) bị huỷ (`status = 'cancelled'`).
2. Trong danh sách đơn, cột trạng thái hiển thị "Đã huỷ · Chờ hoàn tiền" thay vì chỉ "Đã huỷ".
3. Đơn bị huỷ mà đại lý CHƯA xác nhận (đang `pending_review`), hoặc ĐÃ TỪ CHỐI (`rejected`), hoặc không có `paymentApprovalStatus` (tiền mặt do Khách trả, hoặc online chưa tự khai xong) → trạng thái chỉ là "Đã huỷ" bình thường, không có suffix — vì đại lý chưa thực sự có tiền trong tay nên không có gì để hoàn.

## System Flow

1. `rowStatus(order)`:
   ```js
   if (order.status === 'cancelled' && order.paymentApprovalStatus === 'confirmed') {
     return { ...base, label: `${base.label} · Chờ hoàn tiền` }
   }
   ```
2. Điều kiện dựa trên `paymentApprovalStatus === 'confirmed'` — áp dụng cho MỌI phương thức Shop trả (tiền mặt lẫn MoMo/chuyển khoản), không giới hạn `paymentMethod === 'momo'/'bank_transfer'` như thiết kế ban đầu.
3. `TRow`: `rowStatus(order).label` hiển thị trong cột trạng thái, màu `rowStatus(order).color` (kế thừa màu base của `'cancelled'` trong `ROW_STATUS_STYLE`, không đổi màu riêng cho suffix này).

## Acceptance Criteria

**AC1:** Đơn `status='cancelled'` + `paymentApprovalStatus='confirmed'` (bất kỳ phương thức nào: tiền mặt/MoMo/chuyển khoản) → nhãn trạng thái trong danh sách là "Đã huỷ · Chờ hoàn tiền".

**AC2:** Đơn `status='cancelled'` + Khách trả ship (không có `paymentApprovalStatus`) → nhãn chỉ là "Đã huỷ", không có suffix.

**AC3:** Đơn `status='cancelled'` + `paymentApprovalStatus='pending_review'` hoặc `'rejected'` → nhãn chỉ là "Đã huỷ" (GHN chưa thực sự nhận tiền, không cần hoàn).

**AC4:** Đơn `status` khác `'cancelled'` (dù `paymentApprovalStatus = 'confirmed'`) → không hiện suffix "Chờ hoàn tiền".

## Notes

- **Thay đổi quan trọng so với bản gốc**: điều kiện trước đây dựa trên `paymentStatus === 'paid'` (Shop tự khai) — nay đổi sang `paymentApprovalStatus === 'confirmed'` (đại lý đã THỰC SỰ xác nhận), vì chỉ khi đại lý xác nhận thì mới chắc chắn có tiền thật để cần hoàn; đơn Shop tự khai "đã trả" nhưng đại lý chưa duyệt/đã từ chối thì đại lý chưa có tiền, không có gì để hoàn.
- **PROTOTYPE THUẦN** — không có quy trình hoàn tiền thật. Đây CHỈ là nhắc nhở hiển thị trong UI. Hệ thống không gửi request hoàn tiền đến MoMo hay ngân hàng, không tạo ticket support tự động, không tính lại công nợ đối soát.
- Chỉ áp dụng cho danh sách đơn (`TRow`). Giao diện chi tiết đơn (`OrderDetailDrawer`) không hiện suffix "Chờ hoàn tiền" — chỉ hiện trạng thái thanh toán qua `paymentBadge()` (xem SHOP-ORDER-44/45).
- Xem SHOP-ORDER-48 để biết 2 nhánh còn lại của `rowStatus()` dành cho đơn CHƯA bị huỷ (đang "Đơn nháp · Chờ GHN xác nhận" / "Đơn nháp · GHN từ chối xác nhận") — cùng 1 hàm `rowStatus()` nhưng khác điều kiện `status`.
