---
id: SHOP-ORDER-51
jiraKey: AGENCY-1323
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Chi tiết đơn hàng: Đổi phương thức thanh toán

> ⚠️ **CHƯA IMPLEMENT** — Story này mô tả hành vi DỰ KIẾN theo đúng tên ticket Jira AGENCY-1323. Đã rà soát code hiện tại (`OrderDetailDrawer` trong `Orders.tsx`) và xác nhận tính năng này **chưa tồn tại**: `OrderDraft`/edit mode của Chi tiết đơn hàng không có field `paymentMethod`/`feePayer` nào để sửa, và không có `PaymentMethodPicker` nào được render trong `OrderDetailDrawer`. Nội dung dưới đây là SPEC để tham khảo khi triển khai, không phải mô tả code đã có.

## User Story

Là chủ shop, khi đơn còn là "Đơn nháp" và tôi muốn đổi cách trả phí ship (ví dụ đổi từ Tiền mặt sang MoMo, hoặc ngược lại) mà không cần huỷ đơn tạo lại, tôi muốn có thể đổi phương thức thanh toán ngay trong Chi tiết đơn hàng.

## User Flow (dự kiến)

1. Mở chi tiết 1 "Đơn nháp" (`status='pending'`), vào edit mode.
2. Tại khu vực "Thanh toán" trong tab "Thông tin", hiện lại `PaymentMethodPicker` (3 pill: Tiền mặt / MoMo / Chuyển khoản — xem SHOP-ORDER-41) cho phép chọn lại, chỉ khi đơn ĐANG Ở "Đơn nháp" và CHƯA được đại lý xác nhận (`paymentApprovalStatus` khác `'confirmed'`).
3. Đổi từ tiền mặt sang online (MoMo/CK): bấm "Lưu thay đổi" → mở modal thanh toán (SHOP-ORDER-42/49/50) để hoàn tất kênh mới, giống luồng tạo đơn.
4. Đổi từ online sang tiền mặt: bấm "Lưu thay đổi" → lưu ngay, `paymentApprovalStatus` reset về `'pending_review'` (đơn tiền mặt vẫn cần đại lý xác nhận — xem SHOP-ORDER-43), không mở modal.
5. Đổi giữa 2 kênh online (MoMo ↔ Chuyển khoản): bấm "Lưu thay đổi" → mở modal thanh toán kênh MỚI, bỏ qua trạng thái đã khai của kênh CŨ.
6. Đơn đã được đại lý xác nhận (`paymentApprovalStatus === 'confirmed'`) hoặc đã rời "Đơn nháp" → KHÔNG cho đổi phương thức nữa (picker ẩn hoặc disabled) — tránh đổi phương thức sau khi đại lý đã xác nhận nhận đúng 1 kênh cụ thể.

## System Flow (dự kiến — chưa code)

1. Cần mở rộng `OrderDraft` (hiện chỉ có `receiverName/Phone/Address, weightKg, cod, fee, status`) thêm `paymentMethod` + có thể `feePayer`.
2. `draftFromOrder()` cần khởi tạo thêm `paymentMethod: order.paymentMethod ?? 'cash'`.
3. Cần 1 handler tương đương `handleSelectPaymentMethod` của `CreateOrderDrawer` (xem SHOP-ORDER-41) nhưng áp cho `draft` thay vì state cục bộ độc lập.
4. `saveEdit()` cần thêm nhánh: nếu `draft.paymentMethod !== order.paymentMethod` và `draft.paymentMethod` là online → mở modal thanh toán kênh mới trước khi `commitSave`; nếu đổi sang tiền mặt → `commitSave` kèm `paymentApprovalStatus: 'pending_review'` ngay.
5. Cần guard ẩn/disable picker khi `order.paymentApprovalStatus === 'confirmed'` hoặc `order.status !== 'pending'`.

## Acceptance Criteria (dự kiến)

**AC1:** Đơn "Đơn nháp" CHƯA được đại lý xác nhận → vào edit mode thấy lại được `PaymentMethodPicker` để đổi phương thức.

**AC2:** Đơn ĐÃ được đại lý xác nhận (`confirmed`) hoặc đã rời "Đơn nháp" → không hiện/không cho bấm picker đổi phương thức.

**AC3:** Đổi tiền mặt → online → "Lưu thay đổi" mở modal thanh toán kênh mới, lưu thực sự chỉ sau khi modal tự xác nhận xong.

**AC4:** Đổi online → tiền mặt → "Lưu thay đổi" lưu ngay, `paymentApprovalStatus` chuyển `'pending_review'`, không mở modal.

**AC5:** Đổi online ↔ online (MoMo ↔ CK) → mở modal kênh mới, bỏ hẳn trạng thái khai của kênh cũ (không giữ `paymentPaidAt`/`paymentApprovalStatus` cũ).

## Notes

- **GAP — CHƯA CÓ TRONG CODE.** Story này viết trước làm spec, chờ xác nhận lại phạm vi rồi mới triển khai.
- Khác với `handlePaymentRetryInDetail()` (đã có, xem SHOP-ORDER-52) — hàm đó chỉ tạo LẠI mã thanh toán cho CÙNG 1 kênh sau khi bị từ chối/hết hạn, không cho đổi SANG kênh khác.
- Cần làm rõ thêm với Product trước khi code: có cho đổi phương thức khi đơn đang `pending_review` (chưa bị từ chối) hay không — bản spec này giả định CÓ (chỉ chặn khi đã `confirmed`), cần xác nhận lại.
