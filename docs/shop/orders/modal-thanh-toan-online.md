---
id: SHOP-ORDER-42
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Modal thanh toán online (QR MoMo / chuyển khoản ngân hàng)

## User Story

Là chủ shop đã chọn thanh toán phí ship qua MoMo hoặc chuyển khoản ngân hàng, tôi muốn thấy QR code hoặc thông tin chuyển khoản rõ ràng và có đủ thời gian để hoàn tất, để đảm bảo thanh toán trước khi đơn đi vào hệ thống.

## User Flow

1. Modal `OnlinePaymentModal` mở khi shop bấm "Tạo đơn" (xem SHOP-ORDER-43) hoặc "Lưu thay đổi" trên đơn nháp chưa thanh toán (xem SHOP-ORDER-43).
2. **MoMo**: Modal hiển thị QR giả lập tĩnh (`FakeMomoQr`, 160×160px) + số tiền phí ship lớn ở giữa + mã đơn tham chiếu.
3. **Chuyển khoản**: Modal hiển thị bảng 5 dòng — Ngân hàng / Số tài khoản / Chủ tài khoản / Số tiền / Nội dung chuyển khoản (= mã tracking đơn).
4. Đếm ngược 15 phút hiển thị bên dưới QR/bảng, định dạng `MM:SS` màu cam `#FF5200`.
5. **Chưa hết giờ**: nút "Đóng" (ghost) và nút "Tôi đã thanh toán" (cam).
6. **Hết 15 phút**: QR mờ (opacity 0.3) / bảng CK mờ (opacity 0.4), dòng đỏ "Mã [QR/chuyển khoản] đã hết hạn — thanh toán thất bại", chỉ còn 1 nút "Tạo QR mới" (MoMo) hoặc "Tạo mã mới" (CK).
7. Bấm "Tôi đã thanh toán" → đơn được tạo hoặc trạng thái được lưu, modal đóng.
8. Bấm "Đóng" hoặc nút X góc trên phải → modal đóng, trạng thái không đổi.
9. Bấm "Tạo QR mới"/"Tạo mã mới" → đồng hồ reset về 15:00, `paymentStatus` về `'pending'`.

## System Flow

1. `OnlinePaymentModal` (dòng 1116–1230): nhận props `open`, `method`, `amount`, `orderRef`, `onConfirmPaid`, `onClose`, `onExpire`, `onRetry`.
2. `COUNTDOWN_SECONDS = 15 * 60` (dòng 1126). `useEffect` reset về `COUNTDOWN_SECONDS` mỗi khi `open` chuyển sang `true` (dòng 1131–1133).
3. `method === 'momo'` → render `FakeMomoQr` (SVG tĩnh seed cố định, dòng 1056–1077) + số tiền phí.
4. `method === 'bank_transfer'` → render `BankTransferInfo` (dòng 1087–1110): dữ liệu từ `DEMO_BANK_INFO` (dòng 1081–1085, Vietcombank cố định) + `amount` + `orderRef` làm nội dung CK.
5. Interval đếm ngược 1 giây: khi `secondsLeft <= 1` → `setExpired(true)`, gọi `onExpire?.()`.
6. `onExpire` → `paymentStatus: 'failed'` (CreateOrderDrawer: `handlePaymentExpire` dòng 1406; OrderDetailDrawer: `handlePaymentExpireInDetail` dòng 2622).
7. "Tôi đã thanh toán" → `onConfirmPaid()` → `paymentStatus: 'paid'` + `paymentPaidAt = new Date().toISOString()`.
8. "Đóng" / X → `onClose()` → modal đóng, không đổi state.
9. `regenerateCode()` (dòng 1155–1159): reset `secondsLeft`, `setExpired(false)`, gọi `onRetry?.()` → `paymentStatus: 'pending'`.

## Acceptance Criteria

**AC1:** Modal "Thanh toán phí ship qua MoMo" hiện QR giả lập tĩnh 160×160px và số tiền phí ship (font >= 22px) ở trung tâm, cùng dòng "Mã đơn tham chiếu" phía trên.

**AC2:** Modal "Thanh toán phí ship qua chuyển khoản ngân hàng" hiện bảng đủ 5 dòng: Ngân hàng / Số tài khoản / Chủ tài khoản / Số tiền / Nội dung chuyển khoản. Số tiền và Nội dung CK đổi màu `#3B82F6` để nhấn mạnh.

**AC3:** Đếm ngược bắt đầu từ 15:00, giảm dần 1 giây/lần khi modal đang mở. Đếm ngược reset về 15:00 mỗi khi modal đóng và mở lại.

**AC4:** Hết 15 phút → QR/bảng CK mờ đi, hiện dòng đỏ "Mã [QR/chuyển khoản] đã hết hạn — thanh toán thất bại", thay 2 nút cũ bằng 1 nút "Tạo QR mới" (MoMo) hoặc "Tạo mã mới" (CK).

**AC5:** Bấm "Tôi đã thanh toán" → modal đóng, `paymentStatus = 'paid'`, `paymentPaidAt` ghi ISO timestamp.

**AC6:** Bấm "Đóng" (nút hoặc nút X góc trên phải) → modal đóng, `paymentStatus` KHÔNG đổi (vẫn `'pending'`).

**AC7:** Bấm "Tạo QR mới"/"Tạo mã mới" → đồng hồ reset về 15:00, QR/bảng CK sáng trở lại, `paymentStatus = 'pending'`.

## Notes

- **PROTOTYPE THUẦN** — `FakeMomoQr` là hình SVG tĩnh giả lập, không phải QR thật từ SDK MoMo. `DEMO_BANK_INFO` là dữ liệu giả lập (Vietcombank 0071000123456 / CTY TNHH GHN AGENCY DEMO), không có tài khoản thật.
- Modal dùng chung cho `CreateOrderDrawer` (đơn chưa tồn tại trong store) lẫn `OrderDetailDrawer` (đơn đã có trong store). Callback `onConfirmPaid`, `onExpire`, `onRetry` khác nhau giữa 2 context nhưng component `OnlinePaymentModal` giống hệt nhau.
