---
id: SHOP-ORDER-54
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Danh sách đơn hàng: Nhãn "Đã thanh toán" ở cột Trạng thái

## User Story

Là chủ shop nhìn vào cột Trạng thái trong danh sách đơn, tôi muốn biết ngay đơn đã được đại lý xác nhận nhận tiền hay chưa mà không cần liếc sang cột Phí ship, để xác nhận nhanh "đơn này đã xong phần tiền, chỉ còn chờ vận chuyển".

## User Flow

1. Đơn Shop trả ship (tiền mặt/MoMo/chuyển khoản) sau khi được đại lý xác nhận → nhãn ở cột Trạng thái hiện thêm hậu tố: "Chờ lấy hàng · Đã thanh toán" (áp dụng tương tự cho "Đang giao · Đã thanh toán" nếu đơn đã ở bước xa hơn khi Shop mở lại trang).
2. Màu nhãn giữ nguyên màu của trạng thái vận chuyển (ví dụ xanh lá của "Chờ lấy hàng") — suffix "Đã thanh toán" KHÔNG đổi màu nhãn, khác với suffix "GHN từ chối xác nhận" (vốn ép màu đỏ).
3. Đơn Khách trả ship (COD), hoặc đơn Shop trả nhưng CHƯA được duyệt (`pending_review`/`rejected`/chưa có `paymentApprovalStatus`) → không có suffix "Đã thanh toán".
4. Đơn đã huỷ (`status === 'cancelled'`) dù đã được xác nhận nhận tiền → vẫn chỉ hiện "Đã huỷ · Chờ hoàn tiền" (SHOP-ORDER-47), KHÔNG cộng thêm "· Đã thanh toán".

## System Flow

1. Thêm 1 nhánh trong `rowStatus(order)` (`Orders.tsx`), đặt SAU nhánh `cancelled` và 2 nhánh `pending_review`/`rejected` hiện có, TRƯỚC `return base`:
   ```js
   if (order.paymentApprovalStatus === 'confirmed') {
     return { ...base, label: `${base.label} · Đã thanh toán` }
   }
   ```
2. KHÔNG giới hạn `order.status === 'pending'` (khác 2 nhánh `pending_review`/`rejected` phía trên) — vì theo `approveOrderPayment()`, tại thời điểm `paymentApprovalStatus` chuyển `'confirmed'`, `status` đã không còn là `'pending'` nữa (đã tự đẩy sang `'pickup'`).
3. Đặt SAU nhánh `cancelled` nên đơn huỷ đã có suffix riêng "· Chờ hoàn tiền" không bị chồng thêm "· Đã thanh toán" trên cùng 1 dòng.
4. Không đổi `paymentBadge()` (SHOP-ORDER-44) — 2 chỗ hiển thị độc lập, suffix này chỉ bổ sung thêm ở cột Trạng thái, không thay thế badge cột Phí ship.

## Acceptance Criteria

**AC1:** Đơn Shop trả ship, `paymentApprovalStatus === 'confirmed'`, `status` bất kỳ (trừ `cancelled`) → nhãn cột Trạng thái có thêm hậu tố "· Đã thanh toán".

**AC2:** Màu nhãn giữ nguyên màu gốc của trạng thái vận chuyển hiện tại — suffix không ép màu riêng.

**AC3:** Đơn đã huỷ (`status === 'cancelled'`) dù `paymentApprovalStatus === 'confirmed'` → vẫn chỉ hiện "Đã huỷ · Chờ hoàn tiền" (SHOP-ORDER-47), KHÔNG cộng thêm "· Đã thanh toán".

**AC4:** Đơn Khách trả ship (COD), hoặc Shop trả nhưng chưa được duyệt — không có suffix "Đã thanh toán".

## Notes

- Hiện tại hệ thống trước đây chỉ báo 2 trạng thái "xấu/đang chờ" (chờ duyệt, bị từ chối, cả 2 đều gate theo `status === 'pending'` nên gần như không còn kích hoạt được — xem SHOP-ORDER-48) mà không có trạng thái "tốt" (đã duyệt) tương ứng ở CÙNG MỘT cột, dù thông tin đó đã tồn tại sẵn trong dữ liệu (`paymentApprovalStatus`). Nhánh mới này lấp đúng khoảng trống đó, và vì không gate theo `status`, nó hoạt động được ngay cả khi 2 nhánh cũ đã thành code chết.
- Suffix "Đã thanh toán" hiển thị MÃI MÃI trong suốt vòng đời đơn (kể cả khi đã "Giao thành công"), không tự ẩn — giữ đúng theo tinh thần "biết ngay đơn này đã xong phần tiền" của user story, không cần phân biệt thêm "tạm thời/vĩnh viễn".
- Xem SHOP-ORDER-44 (badge cột Phí ship, đã có sẵn, không đổi), SHOP-ORDER-48 (2 suffix "chờ/từ chối" cũ, nay gần như không còn kích hoạt được), SHOP-ORDER-47 (suffix "Chờ hoàn tiền" cho đơn huỷ) để biết đầy đủ các nhãn liên quan ở cùng khu vực.
