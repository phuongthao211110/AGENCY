---
id: SHOP-ORDER-45
jiraKey: AGENCY-1324
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Hiển thị trạng thái thanh toán và tự nguyện thanh toán lại trong Chi tiết đơn

## User Story

Là chủ shop xem chi tiết một đơn hàng, tôi muốn thấy phương thức thanh toán phí ship, trạng thái GHN đối soát nhận tiền hay chưa (kèm lý do nếu bị từ chối), và nếu bị từ chối, tôi muốn có cách tự nguyện thanh toán lại — nhưng đơn của tôi đã đi vận chuyển bình thường rồi, việc này không nên làm gián đoạn gì cả.

## User Flow

1. Mở chi tiết đơn (`OrderDetailDrawer`), tab "Thông tin".
2. Section "Ghi chú & thông tin khác": dòng "Thanh toán" hiển thị phương thức ("Thanh toán qua MoMo" / "Thanh toán qua chuyển khoản ngân hàng" / "Thanh toán Tiền mặt (Thu hộ COD)").
3. Nếu phương thức là MoMo/CK: hiện thêm dòng "Trạng thái {kênh}: {badge text}" đúng màu từ `paymentBadge()` (xem SHOP-ORDER-44) — với MoMo/CK, badge này gần như LUÔN là "✓ Đã nhận {kênh}" ngay từ lúc tạo đơn (xem SHOP-ORDER-43), trừ khi đại lý hậu kiểm phát hiện bất thường và từ chối.
4. Nếu đại lý **đã xác nhận** (`paymentApprovalStatus === 'confirmed'`): thêm dòng **"Đại lý xác nhận lúc"** — với MoMo/CK gần như trùng thời điểm tạo đơn (tự động); với tiền mặt là thời điểm Agency Admin bấm duyệt tay (xem AGA-PAYMENT-2).
5. Nếu đại lý **từ chối** (`paymentApprovalStatus === 'rejected'`, hiếm — chỉ xảy ra khi hậu kiểm phát hiện không khớp): thêm dòng **"Lý do đại lý từ chối"** (chữ đỏ).
6. Nếu bị từ chối VÀ phương thức là MoMo/CK: thêm 1 dòng link **"Thanh toán lại →"** ngay dưới — Shop có thể bấm để tự nguyện mở lại modal thanh toán (xem SHOP-ORDER-42), hoàn toàn TỰ NGUYỆN, không phải điều kiện bắt buộc để đơn đi tiếp (đơn đã đi từ trước rồi).
7. Nếu bị từ chối VÀ phương thức là Tiền mặt: KHÔNG có link nào để bấm — tiền mặt không có "giao dịch số" nào để trả lại qua hệ thống, đại lý sẽ liên hệ Shop xử lý ngoài app.
8. Chỉnh sửa các field khác của đơn (tên/SĐT/địa chỉ/COD/phí ship/trạng thái vận chuyển) và bấm "Lưu thay đổi" — lưu ngay lập tức, không có gì bị chặn bởi trạng thái thanh toán.

## System Flow

1. Tab "Thông tin": dòng "Thanh toán" luôn hiện, đọc `order.paymentMethod` + `order.feePayer`.
2. Dòng "Trạng thái {kênh}" hiện khi `paymentMethod` là `'momo'`/`'bank_transfer'`/`'cash'` (Shop trả) — text/màu lấy từ `paymentBadge(order)` (xem SHOP-ORDER-44).
3. Dòng **"Đại lý xác nhận lúc"** hiện khi `paymentApprovalStatus === 'confirmed' && paymentApprovedAt` — với MoMo/CK, `paymentApprovedAt`/`paymentApprovedBy` được `buildOrder()` gán NGAY lúc tạo đơn (`'Hệ thống (MoMo/Ngân hàng xác nhận tự động)'`), không phải lúc Agency Admin thao tác.
4. Dòng **"Lý do đại lý từ chối"** hiện khi `paymentApprovalStatus === 'rejected' && paymentApprovalRejectedReason`, màu `#EF4444`.
5. Dòng link **"Thanh toán lại"** render ngay sau dòng lý do từ chối, CHỈ khi `paymentApprovalStatus === 'rejected' && (paymentMethod === 'momo' || paymentMethod === 'bank_transfer')`; `onClick={() => setPaymentModalOpen(true)}` — độc lập hoàn toàn với `editMode`/`draft`, hiện được ngay cả khi KHÔNG đang sửa đơn.
6. `saveEdit()`: KHÔNG còn gate nào — `commitSave(draft.status)` luôn chạy, bất kể `paymentApprovalStatus` là gì.
7. `handlePaymentPaidInDetail()` (callback `onConfirmPaid` của modal mở từ nút "Thanh toán lại"): `updateOrder(order.id, { paymentStatus: 'paid', paymentPaidAt, paymentApprovalStatus: 'confirmed', paymentApprovedAt: paidAt, paymentApprovedBy: 'Hệ thống (MoMo/Ngân hàng xác nhận tự động)', paymentApprovalRejectedReason: undefined })` — trả lại thành công là CONFIRMED NGAY (giống lúc tạo đơn), không qua `pending_review`.
8. `handlePaymentRetryInDetail()`: `updateOrder(order.id, { paymentStatus: 'pending', paymentApprovalStatus: undefined, paymentApprovalRejectedReason: undefined })` khi Shop bấm "Tạo mã mới" bên trong modal (không liên quan `saveEdit`).

## Acceptance Criteria

**AC1:** Tab "Thông tin" của mọi đơn đều hiển thị dòng "Thanh toán" với đúng phương thức.

**AC2:** Đơn `paymentMethod` là `momo`/`bank_transfer`/`cash` (Shop trả) → hiện thêm dòng "Trạng thái {kênh}: {badge text}" đúng màu.

**AC3:** `paymentApprovalStatus === 'confirmed'` → hiện thêm dòng "Đại lý xác nhận lúc" với thời điểm đúng; với MoMo/CK thời điểm này gần như trùng lúc tạo đơn.

**AC4:** `paymentApprovalStatus === 'rejected'` → hiện thêm dòng "Lý do đại lý từ chối" (chữ đỏ `#EF4444`) với đúng lý do Agency Admin đã nhập.

**AC5:** `paymentApprovalStatus === 'rejected'` + phương thức MoMo/CK → hiện thêm link "Thanh toán lại →", bấm vào mở modal thanh toán NGAY (không cần vào edit mode trước).

**AC6:** `paymentApprovalStatus === 'rejected'` + phương thức Tiền mặt → KHÔNG có link "Thanh toán lại" nào (không có gì để Shop tự thao tác qua hệ thống).

**AC7:** Trả lại thành công qua modal → `paymentApprovalStatus` chuyển thẳng `'confirmed'` (không qua `'pending_review'`), `paymentApprovalRejectedReason` bị xoá.

**AC8:** Đổi field khác (tên/SĐT/địa chỉ/COD/phí ship/trạng thái) và bấm "Lưu thay đổi" → LUÔN lưu thành công ngay, không bị chặn bởi `paymentApprovalStatus` ở bất kỳ giá trị nào.

## Notes

- **Thay đổi lớn so với thiết kế trước**: trước đây bấm "Lưu thay đổi" khi đơn đang rời "Đơn nháp" mà chưa được duyệt sẽ bị CHẶN LƯU (alert hoặc tự mở lại modal). Đã bỏ hẳn gate này — `saveEdit()` giờ luôn lưu. Modal "Thanh toán lại" giờ là 1 hành động TỰ NGUYỆN, truy cập qua link riêng, không còn gắn vào luồng lưu đơn.
- **Điều kiện hiện link "Thanh toán lại" đã MỞ RỘNG** (sau khi đảo luồng tạo đơn — xem SHOP-ORDER-42/43): từ chỗ chỉ hiện khi `paymentApprovalStatus === 'rejected'`, giờ hiện bất cứ khi nào `paymentApprovalStatus !== 'confirmed'` (gồm cả `undefined` — trường hợp Shop đóng modal QR sớm lúc tạo đơn, chưa từng được xác nhận) — nếu không mở rộng, đơn ở trạng thái "chưa từng xác nhận" sẽ không có cách nào quay lại thanh toán.
- **Bug đã sửa**: dòng "Trạng thái {kênh}" trước đây chỉ hiện cho MoMo/Chuyển khoản (điều kiện check cứng `paymentMethod === 'momo' || 'bank_transfer'`), thiếu Tiền mặt — trái với AC2 bên dưới. Đã sửa điều kiện dựa theo `paymentBadge(order) !== null` (tự đúng null cho đơn COD, không cần check `feePayer` riêng).
- **Bug đã sửa**: sau khi modal QR (mở từ `CreateOrderDrawer` lúc tạo đơn) tự xác nhận xong, Chi tiết đơn không tự cập nhật badge (phải F5) vì `CreateOrderDrawer` không có đường báo cho trang Đơn hàng re-render. Đã thêm prop `onUpdated` cho `CreateOrderDrawer`, và `refreshOrders()` ở trang Đơn hàng giờ đồng bộ CẢ `selectedOrder` (không chỉ mảng `orders`) để Chi tiết đơn đang mở cũng tự cập nhật.
- **PROTOTYPE THUẦN** — không có SDK/gateway thanh toán thật. "Đại lý xác nhận"/"Đại lý từ chối" tiền mặt vẫn là thao tác thủ công của Agency Admin (xem AGA-PAYMENT-1/2); với MoMo/CK là mô phỏng tự động, không có webhook thật.
- Xem SHOP-ORDER-42 (cơ chế modal), SHOP-ORDER-43 (vì sao MoMo/CK confirmed ngay còn tiền mặt thì không), SHOP-ORDER-44 (đầy đủ nhánh `paymentBadge()`).
