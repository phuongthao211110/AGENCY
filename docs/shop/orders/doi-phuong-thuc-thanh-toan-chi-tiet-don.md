---
id: SHOP-ORDER-51
jiraKey: AGENCY-1323
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Chi tiết đơn hàng: Đổi phương thức thanh toán

## User Story

Là chủ shop, khi muốn đổi cách trả phí ship của 1 đơn (ví dụ đổi từ Tiền mặt sang MoMo, hoặc ngược lại) mà không cần huỷ đơn tạo lại, tôi muốn có thể đổi phương thức thanh toán ngay trong Chi tiết đơn hàng.

## User Flow

1. Mở chi tiết 1 đơn Shop tự trả ship (`feePayer === 'sender'`), bấm "Chỉnh sửa" vào edit mode.
2. Tại khu vực "Thanh toán" trong tab "Thông tin", dòng text tĩnh biến thành `PaymentMethodPicker` (3 pill: Tiền mặt / MoMo / Chuyển khoản) cho phép chọn lại — CHỈ hiện khi đơn CHƯA được đại lý xác nhận (`paymentApprovalStatus !== 'confirmed'`). Đơn COD (Khách trả ship) không có picker này.
3. Đổi từ tiền mặt sang online (MoMo/CK): bấm "Lưu thay đổi" → lưu ngay phương thức mới (xoá sạch trạng thái duyệt của kênh cũ) rồi mở modal QR thanh toán cho kênh mới, giống luồng tạo đơn.
4. Đổi từ online sang tiền mặt: bấm "Lưu thay đổi" → lưu ngay, `paymentApprovalStatus` chuyển `'pending_review'` (đơn tiền mặt vẫn cần đại lý xác nhận — xem SHOP-ORDER-43), không mở modal nào.
5. Đổi giữa 2 kênh online (MoMo ↔ Chuyển khoản): bấm "Lưu thay đổi" → lưu phương thức mới, mở modal thanh toán kênh MỚI, bỏ hẳn trạng thái đã khai của kênh CŨ.
6. Đơn đã được đại lý xác nhận (`paymentApprovalStatus === 'confirmed'`) → picker không hiện nữa (chỉ còn dòng text tĩnh), tránh đổi phương thức sau khi đại lý đã xác nhận nhận đúng 1 kênh cụ thể.

## System Flow

1. `OrderDraft` (`Orders.tsx`) có thêm field `paymentMethod: 'cash' | 'momo' | 'bank_transfer'`; `draftFromOrder()` khởi tạo `paymentMethod: order.paymentMethod ?? 'cash'`.
2. Dòng "Thanh toán" trong tab "Thông tin": khi `editMode && order.feePayer === 'sender' && order.paymentApprovalStatus !== 'confirmed'` → render `PaymentMethodPicker` (component dùng chung với `CreateOrderDrawer`, xem SHOP-ORDER-41) bind vào `draft.paymentMethod`; ngược lại hiện text tĩnh như cũ.
3. `commitSave(status, extraFields?)`: nhận thêm tham số tuỳ chọn `extraFields` (merge vào `updateOrder()`) — dùng để gửi kèm các field thanh toán khi phương thức đổi, mà không phải viết lại toàn bộ logic lưu field khác (tên/SĐT/địa chỉ/COD/phí/trạng thái).
4. `saveEdit()`: nếu `draft.paymentMethod === order.paymentMethod` → `commitSave(draft.status)` như cũ (không đổi gì về thanh toán). Nếu KHÁC:
   - Đổi sang online (`momo`/`bank_transfer`): `commitSave(draft.status, { paymentMethod, paymentStatus: 'pending', paymentApprovalStatus: undefined, paymentPaidAt: undefined, paymentApprovedAt: undefined, paymentApprovedBy: undefined, paymentApprovalRejectedReason: undefined })` rồi `setPaymentModalOpen(true)` — mở lại `OnlinePaymentModal` đã có sẵn (đọc `order.paymentMethod` trực tiếp nên tự đúng kênh mới ngay khi `order` đồng bộ lại qua `onUpdated()`), tái dùng nguyên `handlePaymentPaidInDetail`/`handlePaymentExpireInDetail`/`handlePaymentRetryInDetail` của luồng "Thanh toán lại" (SHOP-ORDER-45) — không viết thêm callback riêng.
   - Đổi sang tiền mặt: `commitSave(draft.status, { paymentMethod: 'cash', paymentStatus: 'not_required', paymentApprovalStatus: 'pending_review', paymentPaidAt: now, paymentApprovedAt: undefined, paymentApprovedBy: undefined, paymentApprovalRejectedReason: undefined })`, không mở modal.
5. Ghi 1 dòng "Đổi phương thức thanh toán" vào Lịch sử thao tác khi `draft.paymentMethod !== order.paymentMethod`, nêu rõ kênh cũ → kênh mới (`methodLabelOf()`, helper mới).

## Acceptance Criteria

**AC1:** Đơn Shop trả ship CHƯA được đại lý xác nhận → vào edit mode thấy lại được `PaymentMethodPicker` để đổi phương thức.

**AC2:** Đơn ĐÃ được đại lý xác nhận (`confirmed`) → không hiện/không cho bấm picker đổi phương thức (chỉ còn text tĩnh).

**AC3:** Đổi tiền mặt → online → "Lưu thay đổi" lưu phương thức mới NGAY rồi mở modal thanh toán kênh mới — modal tự xác nhận xong mới thực sự chuyển "Đã nhận tiền".

**AC4:** Đổi online → tiền mặt → "Lưu thay đổi" lưu ngay, `paymentApprovalStatus` chuyển `'pending_review'`, không mở modal.

**AC5:** Đổi online ↔ online (MoMo ↔ CK) → mở modal kênh mới, bỏ hẳn trạng thái khai của kênh cũ (không giữ `paymentPaidAt`/`paymentApprovalStatus` cũ).

**AC6:** Đơn Khách trả ship (COD, `feePayer === 'receiver'`) → không hiện picker trong edit mode, dù đơn đang ở trạng thái nào.

## Notes

- **Sửa 1 lỗi phát hiện trước khi code**: spec gốc (viết theo đúng tên ticket Jira AGENCY-1323) gate picker theo `order.status === 'pending'` ("Đơn nháp") — nhưng từ sau đợt refactor "đơn Shop trả ship đi thẳng `pickup` ngay khi tạo" (xem SHOP-ORDER-43 "Thay đổi lớn lần 1"), KHÔNG còn đơn nào ở `status === 'pending'` một khi đã chọn phương thức thanh toán — điều kiện đó sẽ luôn sai, picker sẽ không bao giờ hiện ra được. Đã sửa: bỏ hẳn check `status === 'pending'`, chỉ còn gate theo `paymentApprovalStatus !== 'confirmed'` (giống cách SHOP-ORDER-54 đã tự làm đúng).
- Khác với `handlePaymentRetryInDetail()` (đã có, xem SHOP-ORDER-45/52) — hàm đó chỉ tạo LẠI mã thanh toán cho CÙNG 1 kênh sau khi bị từ chối/hết hạn, không đổi SANG kênh khác; tính năng này mới thực sự cho đổi kênh.
- Không có gì chặn đổi phương thức khi đơn đang `pending_review` (chưa bị từ chối) — chỉ chặn khi đã `confirmed`, theo đúng giả định ban đầu của spec.
- Xem SHOP-ORDER-53 (tự reset phương thức khi đổi người trả ship) — tạm ĐÓNG/gộp vào SHOP-ORDER-46 vì nghi trùng ticket, không phụ thuộc gì story này nữa do `feePayer` vẫn chưa đổi được trong Chi tiết đơn (ngoài phạm vi lần làm này).
