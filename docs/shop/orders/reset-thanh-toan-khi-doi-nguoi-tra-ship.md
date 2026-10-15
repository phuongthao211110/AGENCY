---
id: SHOP-ORDER-46
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Tự reset phương thức thanh toán khi đổi người trả ship

## User Story

Là chủ shop đang tạo đơn, khi tôi thay đổi người trả phí ship từ "Shop trả" sang "Khách trả", tôi muốn lựa chọn thanh toán online (MoMo/CK) tự động bị xoá, để tránh đơn được tạo ra có dữ liệu `paymentMethod` không phù hợp với `feePayer`.

## User Flow

1. Trong form tạo đơn, shop chọn "Thanh toán qua MoMo" hoặc "Chuyển khoản ngân hàng".
2. Shop đổi người trả ship sang "Khách trả ship" (`feePayer = 'receiver'`).
3. Hệ thống tự động reset `paymentMethod` về `'cash'`, `paymentStatus` về `'not_required'`, xoá `paymentPaidAt`.
4. Picker thanh toán ẩn đi (vì `effectiveFeePayer !== 'sender'`).
5. Shop chuyển lại "Shop trả ship" → picker hiện trở lại, mặc định là "Tiền mặt".

## System Flow

1. `useEffect` (dòng 1315–1322) trong `CreateOrderDrawer`: watch `effectiveFeePayer`.
2. Điều kiện trigger: `effectiveFeePayer === 'receiver' && paymentMethod !== 'cash'`.
3. Nếu đúng:
   - `setPaymentMethod('cash')`
   - `setPaymentStatus('not_required')`
   - `setPaymentPaidAt(undefined)`
4. Khi `effectiveFeePayer === 'sender'`: không làm gì (picker hiện trở lại với giá trị đã reset về `'cash'`).

## Acceptance Criteria

**AC1:** Shop chọn MoMo/CK, rồi đổi người trả sang "Khách trả ship" → `paymentMethod` tự về `'cash'`, `paymentStatus` về `'not_required'`, picker ẩn.

**AC2:** Đổi lại sang "Shop trả ship" → picker hiện lại với "Tiền mặt" được chọn (không phục hồi lựa chọn MoMo/CK cũ).

**AC3:** Shop đang chọn "Tiền mặt" rồi đổi sang "Khách trả ship" → picker ẩn, không có side effect thêm (không trigger reset vì `paymentMethod` đã là `'cash'`).

**AC4:** Reset không mở modal thanh toán — chỉ đổi state cục bộ trong form.

## Notes

- **PROTOTYPE THUẦN** — không có SDK/gateway thật.
- `effectiveFeePayer = formComponents.cod ? feePayer : 'sender'`. Nếu Super Admin đã tắt COD thì `effectiveFeePayer` luôn là `'sender'` bất kể `feePayer` — `useEffect` này sẽ không bao giờ trigger trong trường hợp đó.
- Chỉ áp dụng trong `CreateOrderDrawer` (state cục bộ trước khi tạo đơn). Đơn đã tạo trong store không có cơ chế tương tự vì `feePayer` đã được lưu cố định vào `Order`.
