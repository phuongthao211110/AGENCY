---
id: SHOP-ORDER-29
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Đơn hàng - Chi tiết đơn hàng: Header mã vận đơn, loại đơn, trạng thái

## User Story

Là chủ shop mở chi tiết 1 đơn hàng, tôi muốn thấy ngay mã vận đơn (copy được), loại đơn và trạng thái hiện tại ngay trên đầu màn hình, cùng nút quay lại rõ ràng, để nắm nhanh thông tin quan trọng nhất của đơn mà không cần đọc sâu vào nội dung bên dưới.

## User Flow

1. Mở chi tiết 1 đơn hàng (bấm mã đơn trong danh sách) → header hiện: nút "←" quay lại, mã vận đơn (xanh, đậm) kèm icon sao chép, dấu "·" phân cách, rồi tag loại đơn (Hàng hoá/Thư) có icon nhỏ.
2. Ngay dưới dòng mã đơn: trạng thái hiện tại của đơn, màu theo đúng trạng thái (VD "Chờ lấy hàng" xanh lá, "Đang giao" xanh dương...).
3. Bấm icon sao chép → copy mã vận đơn vào clipboard.
4. Bấm "←" → đóng chi tiết, quay lại danh sách đơn hàng.

## System Flow

1. Header cũ trong `OrderDetailDrawer` (`Orders.tsx`) chỉ có mã vận đơn + "Tạo lúc {ngày}" + nút "X" đóng ở góc phải — thay bằng cấu trúc mới: "←" (thay X, dùng đúng handler `onClose` cũ), mã vận đơn + `CopyOutlined` (gọi `navigator.clipboard.writeText(order.trackingCode)`), dấu "·", rồi tag loại đơn.
2. Dòng trạng thái dùng lại đúng `rowStatus(order)` (trả về `{ label, color }`) đã có sẵn từ danh sách (`TRow`) — không viết logic màu/label mới, đảm bảo trạng thái hiển thị nhất quán giữa danh sách và chi tiết.
3. Tag loại đơn tái sử dụng đúng style badge đã có ở danh sách, chỉ đổi nền: Hàng hoá nền cam nhạt (`#FFF4ED`) + icon `InboxOutlined`; Thư nền tím nhạt (`#EDE9FE`) + icon `MailOutlined`.
4. Bỏ hẳn nút "X" cũ ở góc phải header — tránh 2 nút cùng làm 1 hành động (đóng drawer) khi đã có "←" bên trái đảm nhiệm việc này.
5. Tab switcher (Thông tin đơn/Lịch sử trạng thái/Lịch sử thao tác) giữ nguyên vị trí và hành vi, không đổi.

## Acceptance Criteria

**AC1:** Mở chi tiết đơn → header có đúng thứ tự: nút "←", mã vận đơn (xanh đậm), icon sao chép, dấu "·", tag loại đơn (icon + text).

**AC2:** Dòng ngay dưới hiện đúng trạng thái đơn, màu khớp đúng với màu badge trạng thái ở danh sách (dùng chung `rowStatus`).

**AC3:** Bấm icon sao chép → mã vận đơn được copy vào clipboard.

**AC4:** Bấm "←" → đóng chi tiết, quay về danh sách đơn hàng — không còn nút "X" nào khác trong header.

**AC5:** Tag loại đơn: Hàng hoá nền cam nhạt + icon hộp; Thư nền tím nhạt + icon thư — đúng màu/icon phân biệt 2 loại đơn.

## Notes

- Trước đây header chỉ hiện mã vận đơn + "Tạo lúc {ngày}" — bỏ ngày tạo khỏi header (không phải thông tin ưu tiên hàng đầu khi mở chi tiết), thay bằng loại đơn + trạng thái, hữu ích hơn để nhận biết nhanh đơn đang ở đâu trong luồng xử lý.
- Dùng chung `rowStatus()` và style badge loại đơn đã có ở danh sách (`TRow`) — không tạo thêm bộ màu/label riêng cho header, tránh lệch màu giữa 2 nơi cùng hiển thị 1 trạng thái.
- Đã implement và verify bằng Playwright: header hiện đúng đủ thành phần theo thứ tự, nút "←" đóng đúng drawer, quay về danh sách.
- Chưa làm tương tự cho `OrderDetailDrawer` bên Agency Admin (`AgencyOrders.tsx`) — phạm vi yêu cầu chỉ là Web Shop.
