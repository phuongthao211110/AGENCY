---
id: SHOP-ORDER-42
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Modal thanh toán online: cơ chế đếm ngược và tự xác nhận (dùng chung MoMo/chuyển khoản)

## User Story

Là chủ shop đã chọn thanh toán phí ship qua MoMo hoặc chuyển khoản ngân hàng, tôi muốn đơn của mình được tạo ngay, rồi sau đó mới cần quét mã/chuyển khoản để xác nhận — không phải chờ xong bước thanh toán mới thấy đơn xuất hiện.

## User Flow

1. Bấm "Tạo đơn" (xem SHOP-ORDER-43) → đơn được TẠO NGAY LẬP TỨC, drawer tạo đơn đóng lại, đơn xuất hiện trong danh sách ở "Chờ lấy hàng". Modal `OnlinePaymentModal` mở lên NGAY SAU ĐÓ, độc lập với drawer — nội dung bên trong modal (QR MoMo hay bảng chuyển khoản) xem riêng SHOP-ORDER-49 (MoMo)/SHOP-ORDER-50 (Chuyển khoản).
2. Đếm ngược 15 phút hiển thị bên dưới nội dung kênh: "Mã [QR/chuyển khoản] hết hạn sau MM:SS", màu cam `#FF5200`.
3. **Trong lúc chờ (chưa hết giờ, chưa xác nhận)**: KHÔNG có nút "Tôi đã thanh toán" — chỉ có dòng chữ cam đang chạy: "⏳ Đang chờ xác nhận từ MoMo" / "⏳ Đang chờ xác nhận từ ngân hàng", kèm dấu chấm động (một/hai/ba chấm lặp lại) mô phỏng đang xử lý. Chỉ còn nút "Đóng" (ghost).
4. Sau 3–6 giây ngẫu nhiên (mô phỏng độ trễ webhook thật), modal TỰ ĐỘNG xác nhận đã thanh toán — Shop không cần bấm gì. Đơn đã tạo ở bước 1 được CẬP NHẬT (không tạo thêm đơn mới nào) sang "✓ Đã nhận {kênh}".
5. **Nếu Shop bấm "Đóng" trước khi tự xác nhận, hoặc hết 15 phút mà chưa xác nhận**: đơn VẪN TỒN TẠI trong danh sách (không bị mất/huỷ), chỉ là chưa được xác nhận thanh toán — badge vẫn "Chờ thanh toán {kênh}" (hết hạn thì "Thanh toán thất bại"). Shop có thể vào Chi tiết đơn đó sau, bấm link "Thanh toán lại →" (xem SHOP-ORDER-45) để mở lại modal bất cứ lúc nào.
6. Bấm "Tạo QR mới"/"Tạo mã mới" (khi đang mở lại modal từ Chi tiết đơn) → đồng hồ reset về 15:00, `paymentStatus` về `'pending'`, vòng chờ-tự-xác-nhận bắt đầu lại từ đầu.

## System Flow

1. `OnlinePaymentModal`: nhận props `open`, `method`, `amount`, `orderRef`, `onConfirmPaid`, `onClose`, `onExpire`, `onRetry`. `method` quyết định nội dung render bên trong (xem SHOP-ORDER-49/50) — logic đếm ngược/tự-xác-nhận/hết hạn dưới đây dùng CHUNG cho cả 2 kênh VÀ CHUNG cho cả 2 ngữ cảnh gọi (tạo đơn mới / mở lại từ Chi tiết đơn).
2. `COUNTDOWN_SECONDS = 15 * 60`. `useEffect` reset về `COUNTDOWN_SECONDS` mỗi khi `open` chuyển sang `true`.
3. **Tự động xác nhận**:
   ```js
   useEffect(() => {
     if (!open || expired) return
     const delay = 3000 + Math.random() * 3000  // 3-6 giây
     const timer = setTimeout(() => onConfirmPaid(), delay)
     return () => clearTimeout(timer)
   }, [open, expired])
   ```
4. Animation chấm chạy: state `waitDots` (1→2→3→1...) đổi mỗi 450ms qua `setInterval`, chỉ chạy khi `open && !expired`.
5. Interval đếm ngược 1 giây: khi `secondsLeft <= 1` → `setExpired(true)`, gọi `onExpire?.()` — huỷ luôn timer tự-xác-nhận (vì `useEffect` ở bước 3 có điều kiện `!expired`).
6. **`CreateOrderDrawer` (tạo đơn mới)**: `handleCreate()` gọi `addOrder(buildOrder(isOnline ? 'pending' : paymentStatus, undefined))` + `setCreatedOrderId(newOrder.id)` + `setPaymentModalOpen(true)` NGAY (không chặn/return sớm như trước) — đơn đã nằm trong store TRƯỚC KHI modal render. `onConfirmPaid` (`handlePaymentPaid`) gọi `updateOrder(createdOrderId, { paymentStatus: 'paid', paymentApprovalStatus: 'confirmed', ... })` — CẬP NHẬT đơn đã tồn tại, không `addOrder()` lần nữa.
7. **`OrderDetailDrawer` (mở lại từ "Thanh toán lại")**: `handlePaymentPaidInDetail()` cũng `updateOrder()` y hệt, trên đơn đã có sẵn từ trước — 2 ngữ cảnh dùng chung logic cập nhật, chỉ khác state nào giữ "đơn đang được cập nhật là đơn nào" (`createdOrderId` vs `order.id` theo prop).
8. "Đóng" / X → `onClose()` → modal đóng, không đổi state của đơn, không huỷ timer đếm ngược 15 phút.
9. `regenerateCode()`: reset `secondsLeft`, `setExpired(false)`, gọi `onRetry?.()` → `paymentStatus: 'pending'` — timer tự-xác-nhận 3-6s cũng tự khởi động lại vì phụ thuộc `open`/`expired`.

## Acceptance Criteria

**AC1:** Bấm "Tạo đơn" (online) → đơn xuất hiện NGAY trong danh sách TRƯỚC KHI modal tự xác nhận xong — không phải sau.

**AC2:** Đếm ngược bắt đầu từ 15:00, giảm dần 1 giây/lần khi modal đang mở. Reset về 15:00 mỗi khi modal đóng rồi mở lại.

**AC3:** KHÔNG có nút "Tôi đã thanh toán" nào trong modal (cả 2 kênh, cả 2 ngữ cảnh gọi).

**AC4:** Sau 3–6 giây (ngẫu nhiên), modal TỰ ĐỘNG gọi xác nhận đã thanh toán — CẬP NHẬT đơn đã tạo (không tạo thêm đơn mới).

**AC5:** Hết 15 phút mà chưa tự xác nhận, hoặc Shop bấm "Đóng" trước đó → đơn VẪN TỒN TẠI trong danh sách, chỉ badge là "Chờ thanh toán {kênh}"/"Thanh toán thất bại" — không có cách nào làm đơn biến mất qua modal này.

**AC6:** Bấm "Tạo QR mới"/"Tạo mã mới" → đồng hồ reset về 15:00, `paymentStatus = 'pending'`, vòng chờ-tự-xác-nhận bắt đầu lại.

## Notes

- **Thay đổi lớn (đảo ngược thứ tự so với thiết kế trước)**: trước đây modal mở TRƯỚC khi đơn tồn tại — đơn CHỈ được tạo (`addOrder`) sau khi modal tự xác nhận xong, nghĩa là đóng modal giữa chừng thì đơn không hề tồn tại. Giờ đơn được tạo NGAY lúc bấm "Tạo đơn" (xem SHOP-ORDER-43), modal chỉ còn tác dụng CẬP NHẬT trạng thái thanh toán của đơn đã có sẵn — khớp đúng tinh thần "QR xin SAU khi tạo đơn, không phải xin TRƯỚC khi bấm tạo".
- Hệ quả: link "Thanh toán lại →" ở Chi tiết đơn (SHOP-ORDER-45) giờ hiện bất cứ khi nào `paymentApprovalStatus !== 'confirmed'` (không chỉ khi bị đại lý từ chối) — vì đơn có thể ở trạng thái "chưa từng xác nhận" (Shop đóng modal sớm lúc tạo đơn) chứ không chỉ "bị từ chối".
- **PROTOTYPE THUẦN** — độ trễ 3-6 giây là random thuần client-side, không phải webhook thật.
- Modal dùng chung cho `CreateOrderDrawer` (đơn MỚI tạo, cập nhật qua `createdOrderId`) lẫn `OrderDetailDrawer` (đơn ĐÃ CÓ, cập nhật qua `order.id`). Callback `onConfirmPaid`, `onExpire`, `onRetry` khác nhau giữa 2 context nhưng component `OnlinePaymentModal` giống hệt nhau.
- Việc modal "tự xác nhận" chỉ có nghĩa Shop đã hoàn tất bước thanh toán — đơn vẫn PHẢI chờ đại lý xác nhận thực sự nhận được tiền mới đi tiếp (chỉ áp dụng thật cho tiền mặt; MoMo/CK coi như tự biết luôn) — xem SHOP-ORDER-43.
