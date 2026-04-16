---
id: GSA-LOGIN-1
jiraKey: AGENCY-6
platform: super-admin
section: Login / Logout
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
---

# [GSA] Login screen

## User Story

Là GHN Super Admin, tôi muốn đăng nhập bằng tài khoản được cấp sẵn để có thể truy cập và quản lý hệ thống đại lý.

## Notes

- Tài khoản được cấp bởi hệ thống (chưa hỗ trợ đăng ký)
- Chỉ user hợp lệ mới truy cập được hệ thống
- GHN Super Admin domain: ….

## User Flow

1. Super Admin truy cập trang đăng nhập (admin domain)
2. Nhập Email/Username và Mật khẩu
3. Nhấn nút "Đăng nhập"
4. Hệ thống kiểm tra thông tin đăng nhập
5. Nếu hợp lệ → chuyển đến trang Đại Lý
6. Nếu không hợp lệ → hiển thị thông báo lỗi

## Acceptance Criteria

**AC1:** Hệ thống hiển thị màn hình đăng nhập với 2 trường Email/Username và Mật khẩu, cùng nút "Đăng nhập".

**AC2:** Khi Super Admin nhập đúng tài khoản và mật khẩu, hệ thống cho phép đăng nhập thành công và chuyển hướng đến quản lý đại lý.

**AC3:** Khi Super Admin nhập sai tài khoản hoặc mật khẩu, hệ thống hiển thị thông báo lỗi "Sai tài khoản hoặc mật khẩu".

**AC4:** Các trường Email/Username và Mật khẩu là bắt buộc. Nếu để trống, hệ thống hiển thị lỗi tương ứng.

**AC5:** Nếu email nhập không đúng định dạng, hệ thống hiển thị lỗi validate.

**AC6:** Hệ thống không cung cấp chức năng đăng ký tài khoản, chỉ cho phép đăng nhập bằng tài khoản đã được cấp.

**AC7:** Sau khi đăng nhập thành công, hệ thống tạo và lưu session 7 ngày cho người dùng.

**AC8:** Khi session hết hạn, người dùng sẽ bị đăng xuất và được chuyển về màn hình đăng nhập.
