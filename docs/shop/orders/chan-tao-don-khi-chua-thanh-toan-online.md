---
id: SHOP-ORDER-43
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Chặn tạo đơn/xác nhận gửi đơn khi chưa thanh toán online

## User Story

Là chủ shop đã chọn thanh toán phí ship qua MoMo hoặc chuyển khoản, tôi muốn hệ thống chặn và nhắc tôi hoàn tất thanh toán trước khi đơn được tạo hoặc xác nhận gửi, để phí ship được thanh toán trước khi đơn đi vào luồng xử lý.

## User Flow

1. **Tạo đơn mới**: Shop chọn MoMo/CK, bấm "Tạo đơn" → modal thanh toán mở thay vì tạo đơn ngay.
   - Bấm "Tôi đã thanh toán" → đơn mới được tạo vào store, drawer đóng.
   - Bấm "Đóng" → modal đóng, đơn chưa được tạo, shop quay lại form.
2. **Xác nhận gửi đơn nháp**: Shop mở chi tiết đơn "Đơn nháp" (status='pending') có `paymentMethod = momo/bank_transfer`, vào edit mode, đổi trạng thái sang khác `'pending'`, bấm "Lưu thay đổi" → modal thanh toán mở thay vì lưu ngay.
   - Bấm "Tôi đã thanh toán" → `paymentStatus` cập nhật `'paid'` vào store, trạng thái đơn đổi theo draft.
   - Bấm "Đóng" → modal đóng, đơn vẫn giữ trạng thái `'pending'`, `paymentStatus` không đổi.

## System Flow

1. `handleCreate()` (dòng 1388–1395): kiểm tra `paymentMethod !== 'cash' && paymentStatus !== 'paid'` → `setPaymentModalOpen(true)` và return sớm, không gọi `addOrder()`.
2. `handlePaymentPaid()` (dòng 1397–1404): ghi `paymentStatus: 'paid'` + `paymentPaidAt = new Date().toISOString()`, đóng modal, gọi `addOrder(buildOrder('paid', paidAt))` → đơn mới vào store, `onClose()` đóng drawer.
3. `saveEdit()` trong `OrderDetailDrawer` (dòng 2603–2611): tính `leavingDraft = order.status === 'pending' && draft.status !== 'pending'` VÀ `onlineUnpaid = (paymentMethod === 'momo' || 'bank_transfer') && paymentStatus !== 'paid'` → nếu cả 2 đều true, `setPaymentModalOpen(true)` và return sớm.
4. `handlePaymentPaidInDetail()` (dòng 2614–2620): `updateOrder(order.id, { paymentStatus: 'paid', paymentPaidAt })` → đóng modal → `commitSave(draft.status)`.
5. Đơn tiền mặt hoặc đã `paymentStatus === 'paid'` → không qua modal, tạo/lưu đơn ngay.

## Acceptance Criteria

**AC1:** Shop chọn MoMo/CK và bấm "Tạo đơn" khi `paymentStatus !== 'paid'` → modal thanh toán mở, đơn chưa xuất hiện trong danh sách.

**AC2:** Trong modal, bấm "Tôi đã thanh toán" → đơn mới xuất hiện trong danh sách với `paymentStatus = 'paid'` và `paymentPaidAt` có giá trị.

**AC3:** Trong modal, bấm "Đóng" → modal đóng, đơn vẫn chưa được tạo, form tạo đơn vẫn còn mở.

**AC4:** Shop chọn tiền mặt → bấm "Tạo đơn" tạo đơn ngay, không mở modal.

**AC5:** Shop đã thanh toán (`paymentStatus === 'paid'`) rồi bấm "Tạo đơn" → tạo đơn ngay, không mở modal lần 2.

**AC6:** Đơn nháp (`status='pending'`) có `paymentMethod = momo/bank_transfer`, chưa thanh toán → bấm "Lưu thay đổi" để chuyển trạng thái → modal thanh toán mở, trạng thái đơn chưa đổi.

**AC7:** Xác nhận thanh toán trong `OrderDetailDrawer` → `paymentStatus` cập nhật `'paid'` vào store ngay, trạng thái đơn đổi theo `draft.status`, đơn không còn là nháp.

**AC8:** Chỉ chặn khi đơn nháp ĐANG rời trạng thái `'pending'` (`leavingDraft = true`). Cập nhật thông tin đơn mà giữ nguyên trạng thái `'pending'` → không mở modal.

## Notes

- **PROTOTYPE THUẦN** — không có SDK/gateway thanh toán thật. Đây là mô phỏng luồng chặn thuần UI.
- `handleCreate()` và `saveEdit()` là 2 điểm gate duy nhất chặn tạo/xác nhận đơn. Không có cơ chế validate phía server.
