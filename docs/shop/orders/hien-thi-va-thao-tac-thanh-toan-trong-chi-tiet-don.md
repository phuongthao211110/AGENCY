---
id: SHOP-ORDER-45
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Hiển thị và thao tác lại thanh toán trong Chi tiết đơn

## User Story

Là chủ shop xem chi tiết một đơn hàng, tôi muốn thấy phương thức và trạng thái thanh toán phí ship, và nếu đơn nháp chưa thanh toán, tôi muốn hoàn tất thanh toán ngay tại đây mà không cần tạo lại đơn.

## User Flow

1. Mở chi tiết đơn (`OrderDetailDrawer`), tab "Thông tin".
2. Section "Ghi chú & thông tin khác": dòng "Thanh toán" hiển thị phương thức ("Thanh toán qua MoMo" / "Thanh toán qua chuyển khoản ngân hàng" / "Thanh toán Tiền mặt (Thu hộ COD)").
3. Nếu phương thức là MoMo hoặc CK: hiện thêm dòng "Trạng thái MoMo/chuyển khoản: {label}" màu tương ứng.
4. Nếu đã thanh toán (`paymentStatus = 'paid'`): dòng trạng thái kèm thêm thời điểm thanh toán (vd: "09:45 ngày 13/10" từ `formatPaidAt(order.paymentPaidAt)`).
5. Đơn nháp (`status='pending'`) chưa thanh toán online: vào edit mode, đổi status, bấm "Lưu thay đổi" → modal thanh toán mở (xem SHOP-ORDER-43). Xác nhận xong → đơn cập nhật trạng thái và `paymentStatus` vào store.

## System Flow

1. Tab "Thông tin" (dòng 3027–3047): dòng "Thanh toán" luôn hiện, đọc `order.paymentMethod`.
2. Nếu `order.paymentMethod === 'momo' || 'bank_transfer'`: render thêm dòng "Trạng thái {methodLabel}":
   - Text = `paymentBadge(order)?.label`, màu = `paymentBadge(order)?.color`.
   - Nếu `paymentStatus === 'paid' && paymentPaidAt`: thêm suffix `· {formatPaidAt(order.paymentPaidAt)}` (màu `C_TEXT_SECONDARY`, fontWeight 400).
3. `OnlinePaymentModal` (dòng 3278–3287) trong `OrderDetailDrawer`:
   - `amount = order.fee`, `orderRef = order.trackingCode`.
   - `onConfirmPaid = handlePaymentPaidInDetail` (dòng 2614–2620): `updateOrder(order.id, { paymentStatus: 'paid', paymentPaidAt })` rồi `commitSave(draft.status)`.
   - `onExpire = handlePaymentExpireInDetail` (dòng 2622–2626): `updateOrder(order.id, { paymentStatus: 'failed' })`.
   - `onRetry = handlePaymentRetryInDetail` (dòng 2628–2632): `updateOrder(order.id, { paymentStatus: 'pending' })`.
4. Khác `CreateOrderDrawer` (state cục bộ): `OrderDetailDrawer` dùng `updateOrder()` ngay khi expire/retry — thay đổi persist vào store dù chưa xác nhận thanh toán xong.

## Acceptance Criteria

**AC1:** Tab "Thông tin" của mọi đơn đều hiển thị dòng "Thanh toán" với đúng phương thức.

**AC2:** Đơn `paymentMethod = 'cash'`: dòng "Thanh toán" hiện "Thanh toán Tiền mặt (Thu hộ COD)", không có dòng trạng thái MoMo/CK bên dưới.

**AC3:** Đơn `paymentMethod = 'momo'/'bank_transfer'`: hiện thêm dòng "Trạng thái MoMo/chuyển khoản: {badge text}" đúng màu từ `paymentBadge()`.

**AC4:** Khi `paymentStatus = 'paid'` và `paymentPaidAt` có giá trị → dòng trạng thái kèm suffix thời điểm thanh toán định dạng `HH:mm ngày DD/MM`.

**AC5:** Đơn nháp (`status='pending'`) có online payment chưa thanh toán → vào edit mode, đổi status sang bất kỳ trạng thái nào khác `'pending'`, bấm "Lưu thay đổi" → modal thanh toán mở thay vì lưu ngay.

**AC6:** Xác nhận "Tôi đã thanh toán" trong modal → `paymentStatus` đổi sang `'paid'` và persist vào store (không mất khi reload), trạng thái đơn cũng cập nhật theo `draft.status`.

**AC7:** Hết thời gian đếm ngược trong modal → `paymentStatus` đổi sang `'failed'` và persist vào store, đơn vẫn giữ trạng thái `'pending'`.

**AC8:** Bấm "Tạo QR mới"/"Tạo mã mới" → `paymentStatus` đổi về `'pending'` và persist vào store, đếm ngược reset.

## Notes

- **PROTOTYPE THUẦN** — không có SDK/gateway thanh toán thật. QR giả lập, thông tin CK là `DEMO_BANK_INFO`.
- Khác `CreateOrderDrawer` (state cục bộ, chỉ gọi `addOrder()` lúc xác nhận thanh toán): `OrderDetailDrawer` dùng `updateOrder()` ngay cả khi expire/retry — thay đổi persist vào store dù chưa xác nhận xong.
- Không có nút "Thanh toán ngay" riêng biệt trong giao diện chi tiết đơn. Modal chỉ mở khi shop bấm "Lưu thay đổi" trong edit mode với điều kiện đơn đang nháp và chưa thanh toán online.
