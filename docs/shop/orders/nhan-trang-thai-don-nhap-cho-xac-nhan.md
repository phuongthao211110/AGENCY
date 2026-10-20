---
id: SHOP-ORDER-48
jiraKey: AGENCY-1322
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Nhãn trạng thái "Đơn nháp" khi đang chờ/bị từ chối xác nhận thanh toán

## User Story

Là chủ shop nhìn vào cột trạng thái trong danh sách đơn, tôi muốn phân biệt được "Đơn nháp" bình thường (chưa làm gì) với "Đơn nháp" đang bị giữ lại CHỈ VÌ chờ GHN xác nhận thanh toán (hoặc đã bị từ chối), để biết ngay lý do đơn chưa đi tiếp mà không cần mở chi tiết từng đơn.

## User Flow

1. Danh sách đơn hàng, cột trạng thái mỗi dòng.
2. Đơn "Đơn nháp" (`status = 'pending'`) THÔNG THƯỜNG (chưa chọn kênh thanh toán, hoặc Khách trả ship) → nhãn chỉ là "Đơn nháp" trơn, màu xám.
3. Đơn "Đơn nháp" đang CHỜ GHN xác nhận thanh toán (`paymentApprovalStatus = 'pending_review'`) → nhãn "Đơn nháp · Chờ GHN xác nhận", vẫn màu xám (kế thừa màu base).
4. Đơn "Đơn nháp" ĐÃ BỊ GHN TỪ CHỐI xác nhận (`paymentApprovalStatus = 'rejected'`) → nhãn "Đơn nháp · GHN từ chối xác nhận", màu ĐỎ `#EF4444` (khác màu base, để chú ý ngay).

## System Flow

1. `rowStatus(order)`:
   ```js
   const base = ROW_STATUS_STYLE[order.status] ?? { label: order.status, color: '#6B7280' }
   if (order.status === 'pending' && order.paymentApprovalStatus === 'pending_review') {
     return { ...base, label: `${base.label} · Chờ GHN xác nhận` }
   }
   if (order.status === 'pending' && order.paymentApprovalStatus === 'rejected') {
     return { ...base, label: `${base.label} · GHN từ chối xác nhận`, color: '#EF4444' }
   }
   return base
   ```
2. Nhánh `rejected` CHỦ ĐỘNG ghi đè `color` thành `#EF4444` thay vì giữ màu xám `base.color` của "Đơn nháp" — đây là điểm khác biệt duy nhất giữa 2 nhánh (nhánh `pending_review` giữ nguyên màu base).
3. Cả 2 nhánh chỉ áp dụng khi `order.status === 'pending'` — nếu đơn đã rời khỏi "Đơn nháp" (ví dụ GHN đã duyệt và đơn chuyển `'pickup'`), nhãn trở về bình thường theo `status` mới, không còn suffix nào.
4. `TRow` render `rowStatus(order).label`/`.color` trong cột trạng thái — cùng hàm, cùng vị trí render với nhãn "Đã huỷ · Chờ hoàn tiền" (xem SHOP-ORDER-47).

## Acceptance Criteria

**AC1:** Đơn `status='pending'` không có `paymentApprovalStatus` → nhãn "Đơn nháp" trơn, màu xám `#6B7280`.

**AC2:** Đơn `status='pending'` + `paymentApprovalStatus='pending_review'` → nhãn "Đơn nháp · Chờ GHN xác nhận", màu xám (không đổi màu).

**AC3:** Đơn `status='pending'` + `paymentApprovalStatus='rejected'` → nhãn "Đơn nháp · GHN từ chối xác nhận", màu ĐỎ `#EF4444`.

**AC4:** Đơn đã rời "Đơn nháp" (status khác `'pending'`) → không còn 2 suffix này nữa, dù `paymentApprovalStatus` là gì.

**AC5:** 2 nhãn này là MÔ TẢ, không có hành động gắn kèm trực tiếp tại dòng — Shop phải mở chi tiết đơn để xử lý tiếp (xem SHOP-ORDER-45).

## Notes

- Đây là phần TRƯỚC ĐÂY CHƯA TỪNG ĐƯỢC VIẾT TÀI LIỆU — tách riêng khỏi SHOP-ORDER-47 (vốn chỉ mô tả nhãn "Đã huỷ · Chờ hoàn tiền" cho đơn ĐÃ BỊ HUỶ) vì đây là 2 kịch bản khác hẳn: SHOP-ORDER-47 nói về đơn đã huỷ cần hoàn tiền; story này nói về đơn ĐANG CÒN LÀ NHÁP, chưa huỷ, chỉ đang chờ/bị từ chối xác nhận.
- Nhãn `rejected` cố tình đổi màu đỏ (khác màu xám mặc định của "Đơn nháp") để Shop dễ nhận ra ngay trong danh sách dài mà không cần mở từng đơn — nhánh `pending_review` không cần đổi màu vì đây là trạng thái "đang chờ" bình thường, không cần gấp.
- **PROTOTYPE THUẦN** — nhãn chỉ phản ánh mock data, không có cảnh báo/âm thanh/push notification nào khác đi kèm.
- **LEGACY (sau thay đổi SHOP-ORDER-43)**: đơn Shop trả ship (mọi phương thức) giờ đi NGAY vào `status: 'pickup'` từ lúc tạo, không còn đơn nào mới có `status === 'pending'` VÌ LÝ DO thanh toán nữa — 2 nhánh suffix ở story này do đó chỉ còn khớp với dữ liệu "Đơn nháp" CŨ (tạo trước thay đổi) hoặc đơn Shop tự chuyển tay về `'pending'` qua dropdown trạng thái (không liên quan thanh toán). Code (`rowStatus()`) vẫn giữ nguyên 2 nhánh này vì không sai, chỉ là hiếm khi còn kích hoạt với đơn mới.
- Xem SHOP-ORDER-43 để biết khi nào đơn vào trạng thái `pending_review` (giờ chỉ còn tiền mặt); SHOP-ORDER-45 để biết Shop xử lý thế nào khi đơn bị `rejected`; AGA-PAYMENT-1/2 (Agency Admin) để biết cơ chế duyệt/từ chối.
