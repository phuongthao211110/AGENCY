---
id: SHOP-ORDER-34
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [WEB SHOP] Cài đặt đơn hàng - Thông tin mặc định - Thư tài liệu: Ghi chú xem hàng

## User Story

Là chủ shop, khi vào sub-tab Thư tài liệu của Thông tin mặc định, tôi thấy dòng "Ghi chú xem hàng" hiển thị cố định "Cho xem hàng" kèm chevron-down — dòng này chưa tương tác được, chưa cho phép thay đổi giá trị tại màn Cài đặt này.

## User Flow

1. Vào "Cài đặt đơn hàng" → tab "Thông tin mặc định" → sub-tab **Thư tài liệu**.
2. Trong nhóm **Thông tin thư, tài liệu**, thấy dòng "Ghi chú xem hàng" hiển thị "Cho xem hàng" kèm icon chevron-down — trông giống dropdown.
3. Bấm vào dòng đó → **không có phản ứng gì**: không mở dropdown, không thay đổi giá trị.

## System Flow

1. Dòng "Ghi chú xem hàng" render qua component `SelectCtrl` (định nghĩa tại `Orders.tsx` dòng 730–737) với `value="Cho xem hàng"`.
2. `SelectCtrl` là component hiển thị thuần túy (`div + span + icon chevron-down`) — **không có `onClick`, `onChange`, hay dropdown logic nào**. Luôn hiện cứng chuỗi được truyền vào prop `value`.
3. `LetterDefaultSettings` **không có prop nào** tương ứng với field này — không có state, không có handler.
4. Tập giá trị ý định (`VIEW_GOODS_OPTIONS` dòng 66 `Orders.tsx`: "Cho xem hàng" / "Không cho xem hàng") đã định nghĩa sẵn trong code và được dùng thật ở `CreateLetterDrawer` (dòng 1826/1834), nhưng **chưa nối vào màn Cài đặt này**.

## Acceptance Criteria

**AC1:** Dòng "Ghi chú xem hàng" trong nhóm **Thông tin thư, tài liệu** hiển thị chuỗi "Cho xem hàng" và icon chevron-down.

**AC2:** Bấm vào dòng này → **không mở dropdown, không thay đổi giá trị, không có sự kiện click nào** — đây là placeholder hiển thị thuần túy (`SelectCtrl` không có `onClick`/`onChange`).

**AC3:** `LetterDefaultSettings` không nhận prop nào cho field "Ghi chú xem hàng" — không có state, không có handler tương ứng trong component này.

## Notes

- `SelectCtrl` (dòng 730–737 `Orders.tsx`) là component tĩnh: `div + span + icon chevron-down`, không có sự kiện nào — verify trực tiếp trong code.
- Tập giá trị khi implement đầy đủ: `VIEW_GOODS_OPTIONS` (dòng 66 `Orders.tsx`): "Cho xem hàng" / "Không cho xem hàng" — không bao gồm "không thử" vốn chỉ hợp với hàng vật lý. Constant này đã dùng thật ở `CreateLetterDrawer` (dòng 1826/1834), chưa nối vào màn Cài đặt.
- Phân biệt rõ với `CreateLetterDrawer`: ở màn tạo đơn, "Ghi chú xem hàng" là dropdown thật dùng `VIEW_GOODS_OPTIONS` làm lựa chọn; ở màn Cài đặt này, chỉ là `SelectCtrl` tĩnh giữ chỗ hiển thị.
