---
id: GSA-DL-3
jiraKey: AGENCY-12
platform: super-admin
section: Quản lý Đại lý
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
---

# [GSA] Đại lý - Tạo mới đại lý: Thông tin cơ bản

## User Story

Là GHN Super Admin, tôi muốn nhập thông tin cơ bản của đại lý để có thể tạo mới một đại lý trong hệ thống.

## User Flow

1. Tại màn hình Đại lý, user bấm vào button "Tạo đại lý mới" → Mở trang tạo đại lý
2. Nhập các thông tin: Thông tin cơ bản, Tài khoản GHN, Cấu hình trang quản trị của đại lý (Agency Admin), Cấu hình trang của shop
3. Nhấn nút "Lưu"
4. Hệ thống validate dữ liệu
5. Nếu hợp lệ → tạo thành công
6. Nếu không hợp lệ → hiển thị lỗi

## Acceptance Criteria

**AC1:** Hệ thống hiển thị form nhập thông tin cơ bản khi tạo đại lý.

**AC2:** Super Admin có thể nhập các trường: Tên đại lý, Họ tên chủ đại lý, Số điện thoại, Địa chỉ / Tỉnh/Thành / Quận/Huyện / Phường/Xã (hỗ trợ địa chỉ cũ/mới).

**AC3:** Khi Super Admin không nhập các trường bắt buộc, hệ thống hiển thị lỗi tương ứng.

**AC4:** Mã đại lý (agency_id) là duy nhất trong hệ thống, được generate random số gồm 6 ký tự số.

**AC5:** Validate dữ liệu:
- Tên đại lý: không được để trống, tối đa 255 ký tự
- Tên chủ đại lý: không được để trống, tối đa 255 ký tự
- Số điện thoại: không được để trống, định dạng sdt di động, phải unique toàn hệ thống
- Địa chỉ: không được để trống, phải chọn đủ Tỉnh/Thành → Quận/Huyện → Phường/Xã

**AC6:** Khi Super Admin nhập đầy đủ và hợp lệ, hệ thống cho phép lưu thành công.

**AC7:** Khi có lỗi validation, hệ thống không cho phép tiếp tục và hiển thị rõ lỗi tại từng trường.
