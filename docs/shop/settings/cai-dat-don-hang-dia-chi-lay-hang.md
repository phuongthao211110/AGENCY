---
id: SHOP-SETTINGS-1
jiraKey: AGENCY-165
platform: shop
section: Cài đặt đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP
status: draft
---

# [WEB SHOP] Đơn hàng - Cài đặt đơn hàng: Địa chỉ lấy hàng

## User Story

Là Shop, tôi muốn quản lý danh sách địa chỉ lấy hàng và đặt địa chỉ mặc
định để mỗi lần tạo đơn không cần nhập lại địa chỉ gửi từ đầu.

## User Flow

1. Shop nhấn **Cài đặt đơn hàng** (icon gear) trên trang Đơn hàng
2. Hệ thống mở modal Cài đặt → sidebar có: Thông tin mặc định, Địa chỉ
   lấy hàng, In đơn hàng
3. Shop chọn tab **Địa chỉ lấy hàng**
4. Shop có thể:
   - Thêm địa chỉ mới (nhấn **+ Thêm địa chỉ lấy hàng**)
   - Đặt một địa chỉ làm mặc định (nhấn **Đặt làm mặc định**)
   - Xoá địa chỉ không dùng nữa (nhấn icon thùng rác)
   - Tìm kiếm địa chỉ theo tên hoặc địa chỉ

## System Flow

1. Load danh sách địa chỉ lấy hàng thuộc `shopId`
2. Đánh dấu địa chỉ mặc định (`isDefault = true`)
3. Khi thêm/sửa/xoá → cập nhật danh sách ngay
4. Khi đặt mặc định mới → địa chỉ cũ tự động bỏ mặc định
5. Địa chỉ mặc định được tự động điền vào **Bên gửi** khi shop mở
   form tạo đơn

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Web Shop** — Tạo đơn | Địa chỉ mặc định tự động điền vào section Bên gửi khi mở form tạo đơn |

## Acceptance Criteria

**AC1:** Nhấn **Cài đặt đơn hàng** → mở modal với sidebar gồm
**Thông tin mặc định**, **Địa chỉ lấy hàng**, **In đơn hàng**.

**AC2:** Danh sách địa chỉ hiển thị các cột: Họ tên + SĐT, Địa chỉ
(số nhà + Phường/Xã - Quận/Huyện - Tỉnh/Thành), Mặc định, Thao tác.

**AC3:** Địa chỉ mặc định hiển thị text `"Địa chỉ lấy hàng mặc định"`
màu xanh lá, không có nút Đặt làm mặc định và không có icon xoá.

**AC4:** Địa chỉ không mặc định hiển thị nút **Đặt làm mặc định**
và icon xoá màu đỏ.

**AC5:** Nhấn **Đặt làm mặc định** → địa chỉ đó trở thành mặc định,
địa chỉ cũ tự động bỏ trạng thái mặc định.

**AC6:** Nhấn icon xoá → xoá địa chỉ đó. Không cho phép xoá địa chỉ
mặc định.

**AC7:** Nhấn **+ Thêm địa chỉ lấy hàng** → form nhập với các field:
- **Họ tên** *(bắt buộc)*: tối đa 100 ký tự
- **Số điện thoại** *(bắt buộc)*: 10 số, bắt đầu bằng 0
- **Địa chỉ** *(bắt buộc)*: số nhà/tên đường, tối đa 255 ký tự
- **Tỉnh/Thành, Quận/Huyện, Phường/Xã** *(bắt buộc)*: chọn dropdown
  theo thứ tự

**AC8:** Tìm kiếm theo họ tên hoặc địa chỉ, partial match.

**AC9:** Phân trang, mặc định hiển thị 50 bản ghi/trang.

**AC10:** Danh sách chỉ hiển thị địa chỉ thuộc shop đang đăng nhập
(tenant isolation).

## Notes

- Phải có ít nhất 1 địa chỉ — địa chỉ cuối cùng không cho phép xoá
- Khi tạo đơn, shop vẫn có thể chọn địa chỉ khác ngoài mặc định
