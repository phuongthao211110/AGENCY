---
id: AGA-SHOP-11
jiraKey: 
platform: agency-admin
section: Quản lý Shop
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGENCY] Shop - Chi tiết shop: Chỉnh sửa thông tin cơ bản

## User Story

Là Agency Admin (Đại lý), tôi muốn chỉnh sửa thông tin cơ bản của shop (tên shop, họ tên chủ shop, số điện thoại, địa chỉ) ngay trên trang chi tiết shop để cập nhật kịp thời mà không cần xoá và tạo lại.

## User Flow

1. Agency Admin vào trang **Chi tiết shop**
2. Nhấn nút **Chỉnh sửa**
3. Trang chuyển sang chế độ edit — section **Thông tin cơ bản** hiển thị dạng form có thể nhập
4. Agency Admin sửa các trường cần thay đổi: Tên shop, Họ tên chủ shop, Số điện thoại, Địa chỉ
5. Nhấn **Lưu thay đổi** để lưu
6. Hệ thống validate → lưu thành công → trở về chế độ view với data mới

## System Flow

1. Load thông tin hiện tại của shop, pre-fill vào form
2. Validate khi submit: Tên shop bắt buộc; Số điện thoại bắt buộc + đúng định dạng SĐT Việt Nam + unique trong agency (nếu thay đổi)
3. Lưu thông tin mới vào shop record
4. Hiển thị lại trang view mode với data đã cập nhật

## Acceptance Criteria

**AC1:** Nhấn **Chỉnh sửa** → section **Thông tin cơ bản** chuyển sang edit mode, hiển thị form pre-fill với các field:
- **Tên shop** *(bắt buộc)*: tối đa 255 ký tự
- **Họ tên chủ shop** *(tuỳ chọn)*: tối đa 100 ký tự
- **Số điện thoại** *(bắt buộc)*: đúng định dạng SĐT Việt Nam (10 số, bắt đầu 0), unique trong agency
- **Địa chỉ** *(tuỳ chọn)*: số nhà/đường + tỉnh/thành (2 field riêng biệt)

**AC2:** Mã shop không được chỉnh sửa — hiển thị read-only ngay cả khi trang đang ở edit mode.

**AC3:** Nhấn **Lưu thay đổi** khi form hợp lệ → lưu thành công, trang trở về view mode với data mới.

**AC4:** Lỗi validate hiển thị inline tại từng field:
- Tên shop để trống → "Tên shop không được để trống"
- Số điện thoại sai định dạng → "Số điện thoại không hợp lệ"
- Số điện thoại trùng với shop khác trong agency → "Số điện thoại đã được sử dụng"

**AC5:** Agency Admin chỉ có thể chỉnh sửa shop thuộc đại lý của mình — không thể chỉnh sửa shop của đại lý khác (tenant isolation).

**AC6:** Section **Cấu hình tài khoản shop đăng nhập** (username/password) không nằm trong phạm vi story này — không hiển thị field đó trong form chỉnh sửa thông tin cơ bản.

## Notes

- Nút "Chỉnh sửa" trong `ShopDetail.tsx` hiện chưa có `onClick` handler — bấm vào không làm gì. Story này là **spec cho dev implement**, chưa phản ánh hành vi thật của prototype.
- Chỉnh sửa thông tin cơ bản không ảnh hưởng đến tài khoản đăng nhập của shop (username/password — nếu cần sửa riêng thì thuộc story khác).
- Phần chỉnh sửa cấu hình dịch vụ/bảng giá khi ở chế độ edit đã được cover ở **AGA-SHOP-7**.
