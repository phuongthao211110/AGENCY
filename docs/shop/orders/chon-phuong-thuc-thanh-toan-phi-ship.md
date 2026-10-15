---
id: SHOP-ORDER-41
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Tạo đơn: Chọn phương thức thanh toán phí ship

## User Story

Là chủ shop, khi tạo đơn Hàng hoá và tôi là người trả phí ship, tôi muốn chọn cách thanh toán phí ship (Tiền mặt / MoMo / Chuyển khoản ngân hàng) để linh hoạt theo hoàn cảnh tài chính của mình.

## User Flow

1. Mở "Tạo đơn mới" (`CreateOrderDrawer`), section "Dịch vụ".
2. Khi người trả ship = "Shop trả ship" (`effectiveFeePayer === 'sender'`), phía trên danh sách dịch vụ hiển thị nhóm "Hình thức thanh toán phí ship" với 3 pill-button: **Tiền mặt** / **Thanh toán qua MoMo** / **Chuyển khoản ngân hàng**.
3. Mặc định: "Tiền mặt" được chọn.
4. Shop bấm chọn 1 trong 3 lựa chọn → pill đang chọn đổi nền cam `#FF5200` chữ trắng, các pill còn lại nền xám `#F3F4F6`.
5. Khi người trả ship = "Khách trả ship" (`effectiveFeePayer === 'receiver'`) → picker ẩn hoàn toàn.

## System Flow

1. `PaymentMethodPicker` (dòng 1008–1035) render 3 pill-button, chỉ xuất hiện khi `effectiveFeePayer === 'sender'` (dòng 1803).
2. Khi shop bấm pill, `handleSelectPaymentMethod(m)` (dòng 1307–1311) chạy:
   - `setPaymentMethod(m)`
   - `m !== 'cash'` → `setPaymentStatus('pending')`
   - `m === 'cash'` → `setPaymentStatus('not_required')`
   - Reset `paymentPaidAt` về `undefined`.
3. `paymentMethod` và `paymentStatus` lưu trong state cục bộ của `CreateOrderDrawer`, truyền vào `buildOrder()` khi tạo đơn thật sự.

## Acceptance Criteria

**AC1:** Khi người trả ship = "Shop trả ship", form tạo đơn hiển thị nhóm "Hình thức thanh toán phí ship" với đúng 3 lựa chọn: Tiền mặt / Thanh toán qua MoMo / Chuyển khoản ngân hàng.

**AC2:** Mặc định khi mở form: "Tiền mặt" được chọn, `paymentStatus = 'not_required'`.

**AC3:** Pill đang được chọn có nền `#FF5200`, chữ trắng; các pill khác nền `#F3F4F6`, chữ `#4B5563`.

**AC4:** Chọn "Thanh toán qua MoMo" hoặc "Chuyển khoản ngân hàng" → `paymentStatus` chuyển sang `'pending'` ngay (chưa mở modal, chưa tạo đơn).

**AC5:** Chọn lại "Tiền mặt" → `paymentStatus` chuyển về `'not_required'`.

**AC6:** Khi người trả ship = "Khách trả ship" → picker ẩn hoàn toàn. Shop không thể chọn phương thức thanh toán online vì phí ship do GHN thu hộ từ người nhận khi giao.

## Notes

- **PROTOTYPE THUẦN** — không có SDK MoMo hay cổng thanh toán ngân hàng thật. Toàn bộ là mô phỏng UI.
- `effectiveFeePayer` = `formComponents.cod ? feePayer : 'sender'` — khi Super Admin tắt COD, `effectiveFeePayer` bị ép về `'sender'`, picker hiện mà không cần shop chọn.
- Chỉ áp dụng cho `CreateOrderDrawer` (đơn Hàng hoá). `CreateLetterDrawer` (247Express) không có tính năng này.
