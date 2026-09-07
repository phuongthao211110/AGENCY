---
id: SHOP-ORDER-33
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [WEB SHOP] Cài đặt đơn hàng - Thông tin mặc định - Thư tài liệu: Nội dung thư, tài liệu mặc định

## User Story

Là chủ shop, tôi muốn điền sẵn nội dung thư thường dùng vào cài đặt mặc định, để mỗi lần tạo đơn Thư mới trường "Nội dung thư, tài liệu" được prefill sẵn, không phải gõ lại.

## User Flow

1. Vào "Cài đặt đơn hàng" → tab "Thông tin mặc định" → sub-tab **Thư tài liệu**.
2. Trong nhóm **Thông tin thư, tài liệu**: gõ hoặc xoá nội dung trong textarea "Nội dung thư, tài liệu".
3. Khi rỗng, placeholder "Nội dung thư, tài liệu" hiện trong ô. Ô resize được theo chiều dọc.

## System Flow

1. Textarea nhận prop `contentDefault: string` từ component `LetterDefaultSettings`.
2. Khi nội dung thay đổi → gọi `setContentDefault(e.target.value)` cập nhật state cha.

## Acceptance Criteria

**AC1:** Textarea "Nội dung thư, tài liệu" nằm trong nhóm **Thông tin thư, tài liệu** của sub-tab Thư tài liệu — nhập/xoá nội dung phản ánh đúng state, ô có thể resize theo chiều dọc.

**AC2:** Khi textarea rỗng, placeholder "Nội dung thư, tài liệu" hiện trong ô (màu #9CA3AF).
