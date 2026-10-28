---
id: AGA-PAYMENT-9
jiraKey: 
platform: agency-admin
section: Duyệt thanh toán tiền mặt
figma: 
status: draft
---

# [AGA] Duyệt thanh toán tiền mặt: Xác nhận đã hoàn tiền thừa cho Shop

## Bối cảnh

Chiều NGƯỢC với phí hoàn hàng/đổi địa chỉ (fee TĂNG sau khi đã duyệt — xem SHOP-ORDER-56/AGA-PAYMENT-6): đơn đã `confirmed` nhưng `fee` sau đó GIẢM xuống dưới `paymentApprovedAmount` (VD: phúc tra phát hiện phí thật thấp hơn lúc duyệt ban đầu) — đại lý đã thực nhận NHIỀU HƠN mức đúng từ Shop, cần chủ động hoàn lại phần chênh lệch. Story này mô tả hành động "Xác nhận đã hoàn" trong màn "Chi tiết" (AGA-PAYMENT-6).

## User Story

Là Agency Admin, sau khi đã THỰC SỰ chuyển trả phần tiền thừa cho Shop (ngoài hệ thống — chuyển khoản/tiền mặt trực tiếp), tôi muốn xác nhận lại trong hệ thống để đơn hết hiện trạng "Cần hoàn tiền Shop" và số liệu đối soát khớp đúng mức phí hiện tại, tránh để treo mãi 1 khoản chênh lệch không rõ đã xử lý hay chưa.

## User Flow

1. Ở màn "Chi tiết" shop (xem AGA-PAYMENT-6), đơn nào có `fee` thấp hơn số tiền đã duyệt trước đó → cột "Chưa thanh toán" tô xanh dương (số dương), cột "Trạng thái" hiện **"Cần hoàn tiền Shop"** + số tiền cần hoàn + nút **"Xác nhận đã hoàn"**.
2. Bấm "Xác nhận đã hoàn" → `window.confirm`: "Xác nhận đã hoàn {X}đ cho shop vì phí ship giảm từ {mức cũ}đ xuống {mức mới}đ?"
3. Xác nhận → đơn NGAY LẬP TỨC chuyển trạng thái về **"Đã thanh toán"** bình thường (xanh), cột "Chưa thanh toán" về 0 — vẫn ĐỨNG NGUYÊN ở màn "Chi tiết" (khác với nút "✓ Đã nhận" ở header, vốn thoát về danh sách sau khi duyệt — xem AGA-PAYMENT-8), vì đây là tất toán 1 khoản lẻ, không phải duyệt toàn bộ shop.
4. Huỷ `window.confirm` → không có gì thay đổi, đơn vẫn đứng ở trạng thái "Cần hoàn tiền Shop".
5. Đây là xác nhận MỘT CHIỀU, không có cơ chế chuyển tiền thật nào trong prototype — giống hệt tinh thần các nút duyệt/xác nhận khác trong hệ thống (xem Notes).

## System Flow

1. `confirmFeeRefund(orderId, confirmedBy): boolean` (`orderStore.ts`, hàm MỚI): tìm đơn theo `orderId`; nếu không `confirmed` hoặc `fee >= paymentApprovedAmount` (không còn gì để hoàn) → trả `false`, không làm gì; ngược lại set `paymentApprovedAmount = fee` (đồng bộ lại đúng mức hiện tại) và gọi `appendActionHistory(orderId, confirmedBy, 'Đại lý xác nhận đã hoàn tiền thừa cho Shop', ...)` ghi lại số tiền cũ/mới vào lịch sử thao tác của đơn.
2. `OrderStatusLine`'s nhánh `extra < 0` (`CashRemittance.tsx`) gọi hàm này khi bấm nút: `confirmFeeRefund(order.id, CURRENT_AGENT)`, nếu trả `true` thì gọi `onRefunded?.()` (= `onApproved` được truyền từ `ShopDetailView`, tức `refresh` ở component cha) — KHÔNG gọi `onBack()`, nên màn Chi tiết KHÔNG đóng lại.
3. Vì `detailStats`/`stats.orders` tính lại MỖI LẦN RENDER từ `allStats` (xem AGA-PAYMENT-6), sau khi `confirmFeeRefund()` cập nhật `localStorage` và `refresh()` được gọi, dòng đơn đó tự re-render với `rowAmounts()` mới — không cần logic "cập nhật dòng" thủ công nào.
4. KHÔNG có guard nào giới hạn AI được bấm nút này hay phải xảy ra sau bước nào — bất kỳ đơn nào đang ở trạng thái "Cần hoàn tiền Shop" đều bấm được ngay.

## Acceptance Criteria

**AC1:** Nút "Xác nhận đã hoàn" chỉ hiện khi đơn đã `confirmed` VÀ `fee < paymentApprovedAmount` (đang ở trạng thái "Cần hoàn tiền Shop").

**AC2:** Bấm nút → `window.confirm` nêu rõ số tiền cần hoàn + mức phí cũ/mới, trước khi thực hiện.

**AC3:** Xác nhận → `paymentApprovedAmount` của ĐÚNG đơn đó cập nhật xuống bằng `fee` hiện tại; cột "Chưa thanh toán" về 0; cột "Trạng thái" chuyển về "Đã thanh toán" (xanh) bình thường.

**AC4:** Sau khi xác nhận, màn "Chi tiết" (AGA-PAYMENT-6) KHÔNG đóng lại / KHÔNG quay về danh sách chính — vẫn đứng nguyên tại chỗ, các đơn khác trong bảng không bị ảnh hưởng.

**AC5:** Huỷ `window.confirm` → không có gì thay đổi, đơn vẫn ở trạng thái "Cần hoàn tiền Shop".

## Notes

- **Mới hoàn toàn** — trước khi có story này, chiều "fee giảm sau khi đã duyệt" hoàn toàn không được xử lý ở bất kỳ đâu trong hệ thống: form "Cập nhật" chung (sửa `fee` trực tiếp) không hề đụng tới `paymentApprovalStatus`/`paymentApprovedAmount`, khiến "Đã thanh toán" hiện SAI (vẫn số cũ cao hơn), "Chưa thanh toán" bị kẹp về 0 (mất thông tin), phá vỡ bất biến `fee = Đã thanh toán - Chưa thanh toán`.
- **PROTOTYPE THUẦN** — "Xác nhận đã hoàn" chỉ đồng bộ lại số liệu trong hệ thống, KHÔNG có cơ chế chuyển tiền thật nào (không gọi API ngân hàng/ví điện tử, không tạo phiếu chi). Agency Admin phải tự chuyển tiền thật cho Shop NGOÀI hệ thống trước, rồi mới vào đây xác nhận lại — giống đúng tinh thần các xác nhận khác trong hệ thống (VD: "✓ Đã nhận" ở AGA-PAYMENT-2/7/8 cũng chỉ là xác nhận lại, không có luồng chuyển tiền thật).
- Theo yêu cầu, KHÔNG giới hạn ai/khi nào được sửa `fee` xuống thấp hơn trên đơn đã `confirmed` (form "Cập nhật" chung vẫn mở, không thêm validate) — chỉ xử lý phần HIỂN THỊ + XÁC NHẬN HOÀN sau khi `fee` đã bị sửa, không chặn việc sửa.
- Xem AGA-PAYMENT-6 (màn "Chi tiết" — nơi nút này nằm, mô tả đầy đủ cả 2 chiều phát sinh/hoàn tiền); SHOP-ORDER-55 (Web Shop — badge "💙 Đại lý sẽ hoàn {X}đ" tương ứng, thuần hiển thị, Shop không có hành động nào ở chiều này).
