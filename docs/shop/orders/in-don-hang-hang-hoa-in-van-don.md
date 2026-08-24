---
id: SHOP-ORDER-22
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Đơn hàng - In đơn hàng - Hàng hoá: In vận đơn

## User Story

Là chủ shop gửi đơn Hàng hoá, tôi muốn có 1 khu vực "In vận đơn" gộp chung 2 thiết lập liên quan trực tiếp tới việc in (tự động in + khổ giấy), để cấu hình xong 1 lần cho việc in vận đơn mà không phải tìm rải rác nhiều nơi.

## User Flow

1. Vào "Cài đặt đơn hàng" → tab "In đơn hàng" → sub-tab "Hàng hoá"
2. Card đầu tiên có icon máy in + tiêu đề "In vận đơn", gộp 2 thiết lập: "Tự động in khi tạo đơn" (toggle) và "Khổ giấy in" (3 nút pill A5/52x70mm/80x80mm)
3. Bật toggle "Tự động in khi tạo đơn" → mỗi lần tạo đơn Hàng hoá mới thành công, phiếu in tự mở ngay, không cần quay lại danh sách đơn để in thủ công
4. Chọn khổ giấy phù hợp máy in đang dùng — áp dụng ngay cho card preview "Xem trước phiếu in" phía dưới

## System Flow

1. Card "In vận đơn" là 1 `SectionCard` (icon `IcPrinter`) trong `PrintKindSettings` (`Orders.tsx`) — gộp UI 2 control độc lập: `Toggle` cho `autoPrint` và `PaperSizePicker` cho `paperSize`, cùng nằm dưới 1 tiêu đề card duy nhất
2. `autoPrint`/`paperSize` là state cục bộ trong modal cài đặt, riêng cho sub-tab Hàng hoá (không dùng chung với sub-tab Thư tài liệu)
3. Đơn Hàng hoá có mã vận đơn thật ngay lúc tạo đơn (gửi trực tiếp qua GHN, không qua trung gian) nên "Tự động in" ở đây in được ngay — khác hẳn ý nghĩa của cùng toggle này bên Thư tài liệu (chỉ có tác dụng thật SAU khi đại lý dispatch, xem [SHOP-ORDER-14](./in-don-hang-thu-tai-lieu.md)/[SHOP-ORDER-16](./in-don-hang-tu-dong-in.md))
4. Chi tiết đầy đủ của từng control đã tách riêng: khổ giấy ở [SHOP-ORDER-15](./in-don-hang-chon-kho-giay.md), toggle tự động in ở [SHOP-ORDER-16](./in-don-hang-tu-dong-in.md) — story này chỉ mô tả việc 2 control đó được TRÌNH BÀY CHUNG dưới 1 card "In vận đơn"

## Acceptance Criteria

**AC1:** Card đầu tiên trong sub-tab Hàng hoá có tiêu đề đúng "In vận đơn", kèm icon máy in.

**AC2:** Trong card này có đủ 2 control: toggle "Tự động in khi tạo đơn" và 3 nút chọn khổ giấy — không tách rời ra 2 card khác nhau.

**AC3:** Bật/tắt toggle không ảnh hưởng lựa chọn khổ giấy và ngược lại — 2 control độc lập, chỉ gộp chung về mặt hiển thị.

**AC4:** Card "In vận đơn" của sub-tab Hàng hoá độc lập hoàn toàn với card cùng tên ở sub-tab Thư tài liệu — đổi 1 bên không ảnh hưởng bên kia.

**AC5:** Thay đổi ở card này phản ánh ngay tại card "Xem trước phiếu in" bên dưới trong cùng sub-tab, không cần thao tác thêm.

## Notes

- Story này KHÔNG lặp lại chi tiết acceptance criteria đã có ở [SHOP-ORDER-15](./in-don-hang-chon-kho-giay.md) (Chọn khổ giấy in) và [SHOP-ORDER-16](./in-don-hang-tu-dong-in.md) (Tự động in vận đơn) — chỉ ghi nhận việc 2 story con đó được nhóm chung dưới 1 tiêu đề UI "In vận đơn" mà trước đó chưa có story nào mô tả rõ.
- Phạm vi cố ý giới hạn riêng cho sub-tab Hàng hoá theo đúng title được yêu cầu — sub-tab Thư tài liệu có card "In vận đơn" tương tự nhưng ý nghĩa toggle khác (xem [SHOP-ORDER-14](./in-don-hang-thu-tai-lieu.md)), không thuộc phạm vi story này.
- Xem thêm tổng quan toàn bộ tab "In đơn hàng" ở [SHOP-ORDER-13](./in-don-hang-hang-hoa.md).
