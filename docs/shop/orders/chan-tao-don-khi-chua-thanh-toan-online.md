---
id: SHOP-ORDER-43
jiraKey: AGENCY-1321
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Đơn đi ngay khi Shop trả ship, Agency chỉ hậu kiểm/đối soát (mọi phương thức)

## User Story

Là chủ shop trả phí ship (tiền mặt, MoMo, hay chuyển khoản), tôi muốn đơn đi vận chuyển NGAY sau khi đã thể hiện thanh toán xong, không phải chờ duyệt thủ công mới được đi tiếp — việc kiểm tra lại khoản tiền mặt là việc của Agency quản lý shop tôi ở phía sau, không nên làm chậm đơn hàng của tôi.

## User Flow

1. **Tạo đơn mới, Shop trả ship, chọn MoMo/CK**: bấm "Tạo đơn" → đơn được tạo NGAY vào store ở `status: 'pickup'` (Chờ lấy hàng), drawer đóng lại — modal thanh toán (xem SHOP-ORDER-42) mở lên NGAY SAU ĐÓ để Shop "thể hiện" đã chuyển tiền, KHÔNG còn chặn việc tạo đơn để xin QR trước nữa.
   - Modal tự xác nhận sau 3–6 giây (mô phỏng cổng thanh toán tự báo về, giống MoMo IPN/dịch vụ đối soát ngân hàng thật) → đơn ĐÃ CÓ SẴN được CẬP NHẬT (không tạo thêm đơn mới) sang `paymentApprovalStatus: 'confirmed'` — không qua bước "Chờ duyệt" nào cả, vì 2 kênh này tự biết đã nhận tiền.
   - Bấm "Đóng" trước khi modal tự xác nhận, hoặc để hết hạn 15 phút → đơn VẪN TỒN TẠI trong danh sách (không bị mất), chỉ là chưa được xác nhận — Shop có thể vào Chi tiết đơn bấm "Thanh toán lại →" (xem SHOP-ORDER-45) để mở lại modal bất cứ lúc nào.
2. **Tạo đơn mới, Shop trả ship, chọn Tiền mặt**: bấm "Tạo đơn" → đơn được tạo NGAY ở `status: 'pickup'`, nhưng `paymentApprovalStatus: 'pending_review'` — vì tiền mặt KHÔNG có tín hiệu số nào tự báo cho hệ thống biết, Shop chỉ tự khai, Agency Admin (quản lý shop đó) phải xác nhận tay đã thực nhận đủ tiền CHUYỂN LẠI từ shop (xem AGA-PAYMENT-1/2, Agency Admin). Đơn vẫn đi vận chuyển bình thường trong lúc chờ duyệt — việc chờ này KHÔNG chặn gì ngay, chỉ phục vụ đối soát sổ sách, TRỪ KHI trễ quá 3 ngày (xem điểm 5).
3. **Tạo đơn, Khách trả ship (COD)**: tạo đơn ngay ở `status: 'pickup'`, KHÔNG có `paymentApprovalStatus` — GHN tự thu COD lúc giao hàng, không có gì để đối soát riêng.
4. **Agency Admin phát hiện tiền mặt không khớp (hiếm, hậu kiểm)**: nếu sau này Agency Admin từ chối xác nhận 1 đơn tiền mặt (không thực nhận đủ tiền), đơn VẪN đã đi vận chuyển từ trước — Agency xử lý việc thu hồi/liên hệ Shop hoàn toàn NGOÀI hệ thống, không có cơ chế tự huỷ/giữ đơn lại.
5. **Shop trễ quá 3 ngày chưa chuyển tiền mặt cho Agency**: nút "+ Tạo đơn hàng" ở đầu trang Đơn hàng TỰ ĐỘNG chuyển xám "Tạm chặn tạo đơn", không bấm được (xem AGA-PAYMENT-3, Agency Admin) — tính RIÊNG theo từng shop, không phải công tắc thủ công/toàn hệ thống nào. Trễ 1-2 ngày chỉ cảnh báo, chưa chặn.

## System Flow

1. `handleCreate()` trong `CreateOrderDrawer`:
   - Guard đầu tiên: `if (isOrderCreationBlocked('SHP001')) { window.alert(...); return }` — chặn tuyệt đối nếu shop này đã trễ ≥3 ngày chuyển tiền mặt cho Agency (xem AGA-PAYMENT-3), KHÔNG liên quan tới phương thức thanh toán của đơn ĐANG tạo.
   - `const newOrder = buildOrder(isOnline ? 'pending' : paymentStatus, undefined); addOrder(newOrder)` — LUÔN tạo đơn ngay, bất kể phương thức.
   - Nếu online: `setCreatedOrderId(newOrder.id); setPaymentModalOpen(true)` — mở modal SAU khi đơn đã tồn tại, không `return` sớm nữa.
   - `onClose()` gọi ngay sau đó — drawer đóng, modal (nếu có) vẫn tiếp tục hiển thị độc lập (xem SHOP-ORDER-42).
2. `buildOrder()`: `needsPaymentApproval = effectiveFeePayer === 'sender'`, `isOnlineMethod = paymentMethod === 'momo' || paymentMethod === 'bank_transfer'`, `isOnlineConfirmed = isOnlineMethod && payStatus === 'paid'`.
   - `status: 'pickup'` LUÔN LUÔN, bất kể phương thức/trạng thái duyệt.
   - `paymentApprovalStatus`: nếu không `needsPaymentApproval` → `undefined`; nếu `isOnlineMethod` → `'confirmed'` CHỈ KHI `isOnlineConfirmed` (tức `payStatus === 'paid'`, modal đã xác nhận xong), còn lúc tạo đơn ban đầu (`payStatus === 'pending'`) → `undefined` (hiện badge "Chờ thanh toán {kênh}" cho tới khi modal xác nhận); còn lại (tiền mặt) → `'pending_review'` (chờ đại lý xác nhận tay).
   - `handlePaymentPaid()` (callback modal khi tự xác nhận): `updateOrder(createdOrderId, { paymentStatus: 'paid', paymentApprovalStatus: 'confirmed', paymentApprovedAt, paymentApprovedBy: 'Hệ thống (MoMo/Ngân hàng xác nhận tự động)' })` — CẬP NHẬT đơn đã tạo ở bước 1, không `addOrder()` thêm lần nào.
3. `saveEdit()` trong `OrderDetailDrawer` (xem đầy đủ ở SHOP-ORDER-45): KHÔNG còn gate nào theo `paymentApprovalStatus` — luôn `commitSave(draft.status)`.
4. `approveOrderPayment()`/`rejectOrderPayment()` (Agency Admin, `orderStore.ts`) đổi `paymentApprovalStatus` — KHÔNG trực tiếp "mở khoá" vận hành của ĐƠN đó (đơn đã ở `pickup` từ lúc tạo), nhưng CÓ ảnh hưởng gián tiếp tới `isOrderCreationBlocked(shopId)` của CẢ SHOP (vì hàm này đếm đơn `pending_review` còn lại — xem AGA-PAYMENT-3).

## Acceptance Criteria

**AC1:** Shop trả ship, chọn MoMo/CK, bấm "Tạo đơn" → đơn xuất hiện NGAY trong danh sách (badge vàng "Chờ thanh toán {kênh}"), drawer đóng ngay, modal thanh toán mở SAU — KHÔNG phải chặn tạo đơn để chờ modal xong trước.

**AC2:** Modal tự xác nhận xong (xem SHOP-ORDER-42) → đơn ĐÃ CÓ chuyển badge "✓ Đã nhận {kênh}" (xem SHOP-ORDER-44) — KHÔNG có trạng thái "Chờ duyệt" nào cho online, và KHÔNG có đơn thứ 2 nào được tạo thêm.

**AC3:** Trong modal, bấm "Đóng" trước khi tự xác nhận, hoặc để hết hạn 15 phút → đơn VẪN TỒN TẠI trong danh sách, không bị mất; Chi tiết đơn đó có link "Thanh toán lại →" để mở lại modal.

**AC4:** Shop trả ship, chọn Tiền mặt, bấm "Tạo đơn" → đơn xuất hiện NGAY ở "Chờ lấy hàng", kèm badge xanh dương "Chờ đại lý xác nhận tiền mặt" (chỉ là thông tin đối soát, không chặn gì).

**AC5:** Khách trả ship (COD) → tạo đơn ngay ở "Chờ lấy hàng", không có `paymentApprovalStatus`, không có badge đối soát nào.

**AC6:** Không có thao tác nào trên đơn (sửa thông tin, đổi trạng thái vận chuyển, huỷ...) bị chặn bởi `paymentApprovalStatus`, bất kể là `pending_review`, `confirmed`, hay `rejected`.

**AC7:** Khi shop này đã trễ ≥3 ngày chưa chuyển tiền mặt cho Agency (xem AGA-PAYMENT-3) → nút "+ Tạo đơn hàng" đầu trang Đơn hàng chuyển xám, không bấm được; nếu drawer tạo đơn đã mở sẵn từ trước, bấm "Tạo đơn" vẫn bị chặn bởi guard trong `handleCreate()` — guard này tính RIÊNG theo shop, không liên quan gì tới `paymentApprovalStatus` của chính đơn đang tạo.

## Notes

- **Thay đổi lớn (lần 2 — đảo ngược thứ tự tạo đơn/xin QR)**: trước đây modal thanh toán CHẶN việc tạo đơn (đơn chỉ `addOrder()` sau khi modal tự xác nhận). Giờ đơn LUÔN được tạo NGAY lúc bấm "Tạo đơn", modal chỉ còn tác dụng CẬP NHẬT đơn đã có — xin QR diễn ra SAU khi tạo đơn, không phải trước. Xem SHOP-ORDER-42 để biết chi tiết cơ chế modal.
- **Thay đổi lớn (lần 1)**: trước đây đơn Shop trả ship (mọi phương thức) bị GIỮ ở "Đơn nháp" (`status: 'pending'`) cho tới khi GHN duyệt thủ công mới đi tiếp. Đã bỏ hẳn cơ chế chặn này — lý do: với MoMo/Chuyển khoản, cổng thanh toán thật (MoMo IPN, hoặc dịch vụ đối soát ngân hàng như Casso/SePay/VA) đã TỰ BÁO cho hệ thống biết ngay khi nhận tiền, không cần người duyệt tay mới "biết"; với tiền mặt tuy không có tín hiệu số nào, nhưng việc giữ đơn lại chờ duyệt gây chậm trễ không cần thiết cho vận hành.
- **Thay đổi lớn (lần 3 — chuyển quyền duyệt tiền mặt từ GHN sang Agency)**: Shop (bưu cục) thu hộ tiền mặt phải chuyển lại cho ĐẠI LÝ quản lý mình, không phải GHN trực tiếp — nên người duyệt `pending_review` → `confirmed`/`rejected` giờ là Agency Admin (AGA-PAYMENT-1/2), không còn là Super Admin. Cơ chế chặn tạo đơn cũng đổi từ công tắc THỦ CÔNG/TOÀN HỆ THỐNG (GSA-PAYMENT-3, đã xoá) sang TỰ ĐỘNG/RIÊNG TỪNG SHOP theo số ngày trễ (AGA-PAYMENT-3): trễ 1-2 ngày chỉ cảnh báo, trễ ≥3 ngày tự động khoá.
- Tiền mặt vẫn là trường hợp DUY NHẤT thực sự cần xác nhận tay (`pending_review` → `confirmed`/`rejected` qua AGA-PAYMENT-1/2) vì không có cách nào khác để hệ thống tự biết.
- **PROTOTYPE THUẦN** — "hệ thống tự biết" với MoMo/CK chỉ là mô phỏng (modal tự xác nhận sau 3-6 giây), KHÔNG có tích hợp webhook/cổng thanh toán thật nào. Khi triển khai thật, cần tích hợp MoMo Payment Gateway (IPN) cho MoMo, và Virtual Account hoặc dịch vụ đối soát (Casso, SePay...) cho chuyển khoản mới có tín hiệu tự động tương đương.
- `handleCreate()` và `isOrderCreationBlocked(shopId)` (AGA-PAYMENT-3) là 2 cơ chế ĐỘC LẬP về MẶT KÍCH HOẠT (guard phòng hờ vs tự động tính theo ngày), nhưng CÙNG chung 1 nguồn dữ liệu (đơn `pending_review` của shop) — không còn tách biệt hoàn toàn như thiết kế GSA-PAYMENT-3 cũ (vốn là 1 cờ độc lập không liên quan gì tới thanh toán).
- **Cập nhật**: mọi số ngày "1 ngày"/"3 ngày" nhắc tới trong tài liệu này chỉ còn là giá trị MẶC ĐỊNH — Super Admin cấu hình lại được 2 ngưỡng này ở `/super-admin/settings/cash-remittance-rules` (xem GSA-PAYMENT-CONFIG-1), áp dụng ngay không cần build lại.
