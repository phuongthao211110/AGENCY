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
2. Trong danh sách đơn (Web Shop LẪN Agency Admin — xem Notes), cột trạng thái hiển thị "Đã huỷ · Chờ hoàn tiền" (đỏ) thay vì chỉ "Đã huỷ".
3. Đơn bị huỷ mà đại lý CHƯA xác nhận (đang `pending_review`), hoặc ĐÃ TỪ CHỐI (`rejected`), hoặc không có `paymentApprovalStatus` (tiền mặt do Khách trả, hoặc online chưa tự khai xong) → trạng thái chỉ là "Đã huỷ" bình thường, không có suffix — vì đại lý chưa thực sự có tiền trong tay nên không có gì để hoàn.
4. Sau khi Agency Admin bấm "Xác nhận đã hoàn tiền cho Shop" (chỉ có bên Agency Admin — xem AGA-ORDER-29) → nhãn đổi thành **"Đã huỷ · Đã hoàn tiền"** (xanh lá) ở CẢ 2 platform — Shop chỉ xem kết quả, không có hành động nào ở chiều này.

## System Flow

1. `rowStatus(order)` (`src/platforms/shop/pages/Orders.tsx` VÀ `src/platforms/agency-admin/pages/AgencyOrders.tsx` — 2 bản SONG SONG, cùng 1 công thức):
   ```js
   if (order.status === 'cancelled' && order.paymentApprovalStatus === 'confirmed') {
     return order.cancelRefundConfirmedAt
       ? { ...base, label: `${base.label} · Đã hoàn tiền`, color: '#16A34A' }
       : { ...base, label: `${base.label} · Chờ hoàn tiền` }
   }
   ```
2. Điều kiện dựa trên `paymentApprovalStatus === 'confirmed'` — áp dụng cho MỌI phương thức Shop trả (tiền mặt lẫn MoMo/chuyển khoản), không giới hạn `paymentMethod === 'momo'/'bank_transfer'` như thiết kế ban đầu.
3. `TRow`: `rowStatus(order).label` hiển thị trong cột trạng thái, màu `rowStatus(order).color` (kế thừa màu base của `'cancelled'` trong `ROW_STATUS_STYLE` ở nhánh "Chờ hoàn tiền"; đổi riêng thành xanh lá `#16A34A` ở nhánh "Đã hoàn tiền") — áp dụng ĐỒNG NHẤT ở cả bảng đơn Web Shop lẫn bảng đơn Agency Admin.
4. `cancelRefundConfirmedAt`/`cancelRefundConfirmedBy` (field MỚI, `Order` interface) — set bởi `confirmCancelRefund()` (`orderStore.ts`), gọi từ nút "Xác nhận đã hoàn tiền cho Shop" CHỈ có bên Agency Admin (xem AGA-ORDER-29) — Web Shop chỉ ĐỌC field này để đổi nhãn, không có hành động nào ghi vào field đó.

## Acceptance Criteria

**AC1:** Đơn `status='cancelled'` + `paymentApprovalStatus='confirmed'` (bất kỳ phương thức nào: tiền mặt/MoMo/chuyển khoản) → nhãn trạng thái trong danh sách là "Đã huỷ · Chờ hoàn tiền" — đúng ở CẢ danh sách đơn Web Shop VÀ danh sách đơn Agency Admin.

**AC2:** Đơn `status='cancelled'` + Khách trả ship (không có `paymentApprovalStatus`) → nhãn chỉ là "Đã huỷ", không có suffix.

**AC3:** Đơn `status='cancelled'` + `paymentApprovalStatus='pending_review'` hoặc `'rejected'` → nhãn chỉ là "Đã huỷ" (GHN chưa thực sự nhận tiền, không cần hoàn).

**AC4:** Đơn `status` khác `'cancelled'` (dù `paymentApprovalStatus = 'confirmed'`) → không hiện suffix "Chờ hoàn tiền".

**AC5:** Sau khi Agency Admin xác nhận đã hoàn (AGA-ORDER-29) → nhãn đổi thành "Đã huỷ · Đã hoàn tiền" (xanh lá) ở CẢ Web Shop lẫn Agency Admin, không còn "Chờ hoàn tiền" (đỏ) nữa.

## Notes

- **Thêm mới (có hành động xác nhận hoàn, không còn treo mãi)**: trước đây "Chờ hoàn tiền" chỉ là nhãn TREO VĨNH VIỄN, không có cách nào trong UI để đánh dấu đã xử lý xong dù Agency Admin đã thực sự chuyển tiền lại cho Shop. Đã thêm `cancelRefundConfirmedAt`/`cancelRefundConfirmedBy` + hàm `confirmCancelRefund()` + nút "Xác nhận đã hoàn tiền cho Shop" trong `OrderDetailDrawer` (Agency Admin) — xem đầy đủ ở [AGA-ORDER-29](../../agency-admin/orders/xac-nhan-hoan-tien-huy-don-da-thanh-toan.md). "PROTOTYPE THUẦN" ở note dưới đây vẫn đúng — hành động xác nhận chỉ đồng bộ lại trạng thái, không có luồng chuyển tiền thật.
- **Thêm mới (mirror sang Agency Admin)**: trước đây nhãn "Chờ hoàn tiền" CHỈ có ở `rowStatus()` của Web Shop (`Orders.tsx`) — Agency Admin hoàn toàn không có gì tương ứng, nên đại lý không biết đơn nào bị huỷ-mà-đã-thu-tiền cần xử lý hoàn (mất đối xứng thông tin, phát hiện khi review logic huỷ đơn). Đã thêm ĐÚNG nhánh điều kiện này vào `rowStatus()` của Agency Admin (`AgencyOrders.tsx`) — cùng công thức, cùng nhãn, không lệch nhau giữa 2 platform.
- **Thay đổi quan trọng so với bản gốc**: điều kiện trước đây dựa trên `paymentStatus === 'paid'` (Shop tự khai) — nay đổi sang `paymentApprovalStatus === 'confirmed'` (đại lý đã THỰC SỰ xác nhận), vì chỉ khi đại lý xác nhận thì mới chắc chắn có tiền thật để cần hoàn; đơn Shop tự khai "đã trả" nhưng đại lý chưa duyệt/đã từ chối thì đại lý chưa có tiền, không có gì để hoàn.
- **PROTOTYPE THUẦN** — không có quy trình hoàn tiền thật. Đây CHỈ là nhắc nhở hiển thị trong UI. Hệ thống không gửi request hoàn tiền đến MoMo hay ngân hàng, không tạo ticket support tự động, không tính lại công nợ đối soát.
- Nhãn "· Chờ hoàn tiền"/"· Đã hoàn tiền" CHỈ áp dụng cho danh sách đơn (`TRow`), KHÔNG lặp lại trong `OrderDetailDrawer` (vẫn chỉ hiện trạng thái thanh toán qua `paymentBadge()`, xem SHOP-ORDER-44/45) — riêng drawer bên AGENCY ADMIN (không phải Web Shop) có thêm 1 khối cảnh báo + nút hành động RIÊNG cho chính xác trường hợp này (xem AGA-ORDER-29), nội dung/vị trí khác hẳn `paymentBadge()`.
- Xem SHOP-ORDER-48 để biết 2 nhánh còn lại của `rowStatus()` dành cho đơn CHƯA bị huỷ (đang "Đơn nháp · Chờ GHN xác nhận" / "Đơn nháp · GHN từ chối xác nhận") — cùng 1 hàm `rowStatus()` nhưng khác điều kiện `status`.
