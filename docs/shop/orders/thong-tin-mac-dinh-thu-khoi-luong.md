---
id: SHOP-ORDER-32
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [WEB SHOP] Cài đặt đơn hàng - Thông tin mặc định - Thư tài liệu: Khối lượng đơn hàng mặc định

## User Story

Là chủ shop, tôi muốn bật toggle "Khối lượng đơn hàng" trong sub-tab Thư tài liệu để đơn Thư mới tự có khối lượng mặc định điền sẵn, không phải nhập lại mỗi lần.

## User Flow

1. Vào "Cài đặt đơn hàng" → tab "Thông tin mặc định" → sub-tab **Thư tài liệu**.
2. Trong nhóm **Sản phẩm**: bấm toggle "Khối lượng đơn hàng" để bật hoặc tắt.
3. Toggle phản ánh trạng thái On/Off ngay lập tức.

## System Flow

1. Toggle nhận prop `weightDefault: boolean` từ component `LetterDefaultSettings`.
2. Khi toggle thay đổi → gọi `setWeightDefault(!weightDefault)` cập nhật state cha.
3. State `weightDefault` (sub-tab Thư tài liệu) hoàn toàn độc lập với state khối lượng tương ứng trong `DefaultInfoSettings` (sub-tab Hàng hoá).

## Acceptance Criteria

**AC1:** Toggle "Khối lượng đơn hàng" nằm trong nhóm **Sản phẩm** của sub-tab Thư tài liệu, bấm được, phản ánh đúng trạng thái On/Off ngay lập tức (animation knob trượt + đổi màu nền).

**AC2:** Giá trị toggle sub-tab Thư tài liệu hoàn toàn độc lập với sub-tab Hàng hoá — bật/tắt 1 bên không ảnh hưởng bên kia.
