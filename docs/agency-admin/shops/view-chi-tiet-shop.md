---
id: AGA-SHOP-5
jiraKey: 
platform: agency-admin
section: Quản lý Shop
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: approved
---

# [AGA] Shop: View thông tin chi tiết shop

## User Story

Là Agency Admin (Đại lý), tôi muốn xem thông tin chi tiết của một shop để kiểm tra thông tin cơ bản và tài khoản đăng nhập của chủ shop.

## User Flow

1. Agency Admin truy cập màn "Quản lý shop"
2. Agency Admin click vào tên shop trong danh sách
3. Hệ thống điều hướng đến trang chi tiết shop
4. Agency Admin xem thông tin cơ bản và tài khoản đăng nhập của shop
5. Agency Admin có thể copy username, ẩn/hiện và copy mật khẩu
6. Agency Admin có thể click "Chỉnh sửa" hoặc "Xoá shop"

## Acceptance Criteria

**AC1:** Trang hiển thị section "Thông tin cơ bản" gồm: Tên shop, Mã shop, Họ tên chủ shop, Số điện thoại, Địa chỉ (số nhà/đường + tỉnh/thành).

**AC2:** Trang hiển thị section "Cấu hình tài khoản shop đăng nhập" gồm: Tên đăng nhập (có nút copy), Mật khẩu (có nút ẩn/hiện + nút copy).

**AC3:** Trang hiển thị nút "Chỉnh sửa" để Agency Admin cập nhật thông tin shop.

**AC4:** Trang hiển thị nút "Xoá shop" để Agency Admin xoá shop. Khi xoá, hệ thống xác nhận trước khi thực hiện.

**AC5:** Agency Admin chỉ có thể xem shop thuộc đại lý của mình — không thể truy cập shop của đại lý khác.

**AC6:** Khi không tìm thấy shop (ID không hợp lệ), hệ thống hiển thị thông báo lỗi và link quay lại danh sách shop.
