---
id: WS-ORDER-1
jiraKey: SHOP-1
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-WS--WEB-SHOP?node-id=4696-13738
status: draft
---

# [WS] Đơn hàng - Cài đặt đơn hàng mặc định

## User Story

Là chủ shop (Web Shop), tôi muốn thiết lập các thông số mặc định cho đơn hàng
(ca lấy hàng, kích thước, ghi chú, phí ship, địa chỉ trả hàng...) để khi tạo
đơn mới các trường quan trọng đã được điền sẵn, giảm thao tác lặp lại mỗi lần
tạo đơn.

## User Flow

1. Chủ shop nhấn nút **Cài đặt đơn hàng** trên màn hình danh sách đơn hàng
   (nằm bên trái nút **Tạo đơn hàng**)
2. Hệ thống mở popup **Cài đặt đơn hàng** (overlay full-screen 16px inset)
3. Chủ shop thấy sidebar trái với 3 tab điều hướng
4. Chủ shop chọn tab **Thông tin mặc định** (mặc định active)
5. Chủ shop chỉnh sửa các thông số theo từng nhóm (Bên gửi, Sản phẩm,
   Thông tin đơn hàng, Dịch vụ, Trả hàng)
6. Thay đổi được áp dụng ngay (không cần nhấn Lưu ở prototype)
7. Nhấn **X** hoặc click backdrop để đóng popup

## Màn hình

### Popup Cài đặt đơn hàng

**Layout:**
- Modal: trắng, border-radius 12px, box-shadow, inset 16px toàn màn hình, zIndex 210
- Header: title "Cài đặt đơn hàng" (14px bold) + nút X (20px icon)
- Divider 1px #E5E7EB
- Body: sidebar 240px (border-right) + form area flex-1 (scroll Y)

**Sidebar (240px):**

| Tab | Icon | Active style |
|-----|------|-------------|
| Thông tin mặc định | ⭐ star | bg #FFF4ED, text #FF5200, icon cam |
| Địa chỉ lấy hàng | 📍 map-pin | bg transparent, text #4B5563 |
| In đơn hàng | 🖨️ printer | bg transparent, text #4B5563 |

- Nhãn danh mục: "CÀI ĐẶT ĐƠN HÀNG" (12px uppercase, #4B5563)
- Menu item: padding 8px, border-radius 6px, font 14px semibold, gap 12px

### Tab: Thông tin mặc định

**Section "Bên gửi"** (icon building-store):

| Field | Loại | Giá trị mặc định |
|-------|------|-----------------|
| Ca lấy hàng | Dropdown | Tự chọn ca lấy hàng sau |

**Section "Sản phẩm"** (icon cube):

| Field | Loại | Mặc định |
|-------|------|---------|
| Khối lượng đơn hàng | Toggle | Tắt |
| Kích thước đơn hàng | Toggle | Tắt |

**Section "Thông tin đơn hàng"** (icon clipboard):

| Field | Loại | Mặc định |
|-------|------|---------|
| Khai giá trị hàng | Toggle | Tắt |
| Giao / Trả 1 phần | Toggle | Tắt |
| Giao thất bại thu tiền | Toggle | Tắt |
| Ghi chú đơn hàng | Textarea (min-height 80px) | Trống |
| Ghi chú xem hàng | Dropdown | Cho xem hàng không thử |
| Tự động yêu cầu giao lại | Toggle | Tắt |

**Section "Dịch vụ"** (icon truck):

| Field | Loại | Mặc định |
|-------|------|---------|
| Phí ship | Dropdown | Khách trả phí shop |
| Thu ship khách hàng | Number input + đ badge | 0 |

**Section "Trả hàng"** (icon arrow-return):

| Field | Loại | Mặc định |
|-------|------|---------|
| Địa chỉ trả hàng | Dropdown (flex-1 width) | Chọn địa chỉ lấy hàng làm địa chỉ trả hàng |

### Thiết kế Toggle

- Width 36px, height 20px, border-radius 10px
- Off: bg #E5E7EB, knob position left 2px
- On: bg #FF5200, knob position left 18px
- Transition: background + knob position 0.2s

### Thiết kế Setting Row (mỗi dòng trong section)

```
[Label 14px semibold #111827          ] [Control 240px hoặc flex-1]
[Description 14px normal #4B5563     ]
```

- Flex: gap 32px, align-items center, padding-top/bottom 6px
- Description dài vẫn wrap text bình thường

## Acceptance Criteria

**AC1:** Nút **Cài đặt đơn hàng** hiển thị bên trái nút **Tạo đơn hàng** trên
header màn hình danh sách đơn hàng, style secondary (trắng, viền #E5E7EB, icon gear).

**AC2:** Click nút → popup overlay xuất hiện với backdrop #000 opacity 25%,
modal inset 16px, border-radius 12px, zIndex đè lên toàn bộ trang.

**AC3:** Sidebar hiển thị đúng 3 tab; tab **Thông tin mặc định** active mặc định
(bg #FFF4ED, text + icon màu #FF5200).

**AC4:** Click tab khác → form area chuyển nội dung tương ứng, active style
chuyển theo tab được chọn.

**AC5:** Form tab **Thông tin mặc định** hiển thị đúng 5 section (Bên gửi,
Sản phẩm, Thông tin đơn hàng, Dịch vụ, Trả hàng) với đúng các field và loại
control theo bảng ở trên.

**AC6:** Toggle hoạt động đúng — click toggle → đổi trạng thái On/Off, animation
knob trượt + đổi màu nền.

**AC7:** Textarea **Ghi chú đơn hàng** có min-height 80px, resize vertical,
placeholder màu #9CA3AF.

**AC8:** Number input **Thu ship khách hàng** có badge đơn vị "đ" (bg #F3F4F6,
border-left #E5E7EB, 32×32px), nhập số ≥ 0.

**AC9:** Dropdown **Địa chỉ trả hàng** chiếm flex-1 (không cố định 240px) để
hiển thị đầy đủ label dài.

**AC10:** Click X hoặc click backdrop → đóng popup, trạng thái trang đơn hàng
không bị thay đổi.

**AC11:** Form area có overflow-y auto — cuộn được khi nội dung dài hơn viewport.

## Notes

- Prototype hiện tại: tab **Địa chỉ lấy hàng** và **In đơn hàng** chỉ hiển thị
  tiêu đề placeholder, chưa có form — cần implement ở story tiếp theo
- Cài đặt trong popup này chưa được persist (localStorage/API) ở prototype;
  production cần save per-shop-user
- Nút mở popup đặt ở list page (không phải trong drawer tạo đơn) để tiện chỉnh
  settings mà không cần mở form tạo đơn
