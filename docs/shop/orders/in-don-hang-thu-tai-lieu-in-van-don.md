---
id: SHOP-ORDER-24
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Đơn hàng - In đơn hàng - Thư/tài liệu: In vận đơn

## User Story

Là chủ shop gửi đơn Thư tài liệu, tôi muốn có 1 khu vực "In vận đơn" gộp chung tự động in + khổ giấy, nhưng phải nói rõ đúng thời điểm in được thật (sau khi đại lý đã gửi hàng cho nhà vận chuyển), để không hiểu nhầm là in được ngay như đơn Hàng hoá.

## User Flow

1. Vào "Cài đặt đơn hàng" → tab "In đơn hàng" → sub-tab "Thư tài liệu"
2. Đọc dòng ghi chú đầu sub-tab: chỉ in được SAU KHI đại lý đã gửi đơn cho nhà vận chuyển — trước đó chưa có mã vận đơn thật để in
3. Card đầu tiên có icon máy in + tiêu đề "In vận đơn" — giống cấu trúc bên Hàng hoá ([SHOP-ORDER-22](./in-don-hang-hang-hoa-in-van-don.md)), gộp toggle "Tự động in..." và "Khổ giấy in"
4. Nhãn toggle khác hẳn Hàng hoá: "Tự động in khi đại lý đã gửi hàng cho nhà vận chuyển" — không phải "khi tạo đơn", và KHÔNG nhắc tên nhà vận chuyển cụ thể nào
5. Chọn khổ giấy — áp dụng ngay cho card "Xem trước phiếu in" phía dưới cùng sub-tab

## System Flow

1. Card "In vận đơn" là 1 `SectionCard` (icon `IcPrinter`) trong `LetterHandoverSettings` (`Orders.tsx`) — cùng cấu trúc với `PrintKindSettings` bên Hàng hoá (xem [SHOP-ORDER-22](./in-don-hang-hang-hoa-in-van-don.md)), gộp `Toggle` cho `autoPrint` (state riêng của `LetterHandoverSettings`) và `PaperSizePicker` cho `paperSize` riêng của Thư
2. Khác biệt DUY NHẤT so với card cùng tên bên Hàng hoá: nhãn toggle là "Tự động in khi đại lý đã gửi hàng cho nhà vận chuyển" (đúng text trong code — KHÔNG chứa chữ "247"/"247Express" ở bất kỳ đâu trong sub-tab này, kể cả dòng ghi chú đầu trang phía trên card, tuân thủ đúng quy tắc "shop không được biết NVC nào xử lý đơn")
3. Lý do trigger khác Hàng hoá: đơn Thư chỉ có mã vận đơn thật SAU khi `carrierCode` đổi từ `null` → `'247EXPRESS'` lúc đại lý dispatch (xem đầy đủ ở [SHOP-ORDER-14](./in-don-hang-thu-tai-lieu.md)) — nhưng vì shop không được biết tên NVC, nhãn toggle diễn đạt trung tính là "gửi hàng cho nhà vận chuyển", không nêu đích danh 247Express
4. State `autoPrint`/`paperSize` của sub-tab Thư độc lập hoàn toàn với state tương ứng bên Hàng hoá — đổi 1 bên không ảnh hưởng bên kia
5. Toggle này (giống bên Hàng hoá) hiện chỉ là preference UI, CHƯA nối với hành động in thật hay listener theo dõi thời điểm `carrierCode` đổi — xem gap đã ghi ở [SHOP-ORDER-16](./in-don-hang-tu-dong-in.md)

## Acceptance Criteria

**AC1:** Card đầu tiên trong sub-tab Thư tài liệu có tiêu đề đúng "In vận đơn", kèm icon máy in — cùng vị trí/cấu trúc với sub-tab Hàng hoá.

**AC2:** Nhãn toggle đúng "Tự động in khi đại lý đã gửi hàng cho nhà vận chuyển" — KHÔNG dùng nhãn "khi tạo đơn" của Hàng hoá.

**AC3:** Trong card này có đủ 2 control: toggle tự động in và 3 nút chọn khổ giấy — không tách rời ra 2 card khác nhau.

**AC4:** Card "In vận đơn" của sub-tab Thư tài liệu độc lập hoàn toàn với card cùng tên ở sub-tab Hàng hoá — đổi 1 bên không ảnh hưởng bên kia.

**AC5:** Thay đổi ở card này phản ánh ngay tại card "Xem trước phiếu in" bên dưới trong cùng sub-tab, không cần thao tác thêm.

**AC6:** Không có bất kỳ chữ "247"/"247Express" nào xuất hiện ở bất kỳ đâu trong sub-tab Thư tài liệu (kể cả dòng ghi chú đầu trang lẫn nhãn toggle) — đúng nguyên tắc "shop không được biết NVC nào xử lý đơn".

## Notes

- Cặp story với [SHOP-ORDER-22](./in-don-hang-hang-hoa-in-van-don.md) (bản Hàng hoá) — cùng cấu trúc card "In vận đơn", khác đúng 1 điểm: nhãn toggle phản ánh đúng thời điểm in được thật của từng loại đơn, diễn đạt trung tính không nêu tên NVC.
- Story này KHÔNG lặp lại chi tiết AC đã có ở [SHOP-ORDER-15](./in-don-hang-chon-kho-giay.md) (khổ giấy, dùng chung) và [SHOP-ORDER-16](./in-don-hang-tu-dong-in.md) (toggle tự động in) — chỉ ghi nhận việc 2 control được nhóm chung dưới 1 card cho riêng sub-tab Thư tài liệu.
- **Đính chính khi viết story này:** doc SHOP-ORDER-16 từng ghi nhãn toggle Thư là "Tự động in khi đại lý đẩy đơn qua 247" — đã verify lại trực tiếp trong code (`Orders.tsx` dòng 598) và xác nhận text THẬT là "Tự động in khi đại lý đã gửi hàng cho nhà vận chuyển", không hề có chữ "247". Đã cập nhật lại SHOP-ORDER-16 cho khớp ngay sau đó.
- Xem đầy đủ bối cảnh + lịch sử quyết định 2 lần đổi hướng của toàn bộ sub-tab Thư tài liệu ở [SHOP-ORDER-14](./in-don-hang-thu-tai-lieu.md).
