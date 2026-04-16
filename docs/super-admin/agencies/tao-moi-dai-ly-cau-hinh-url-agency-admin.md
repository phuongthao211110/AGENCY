---
id: GSA-DL-5
jiraKey: AGENCY-14
platform: super-admin
section: Quản lý Đại lý
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
---

# [GSA] Đại lý - Tạo mới đại lý: Cấu hình URL trang Agency Admin

## User Story

Là GHN Super Admin, tôi muốn cấu hình URL trang quản trị của đại lý để tạo tenant riêng cho từng đại lý và giúp họ truy cập hệ thống quản trị của mình.

## User Flow

1. Tại màn hình tạo mới Đại lý → bước "Cấu hình URL trang Agency Admin"
2. Nhập tên định danh (slug) cho đại lý
3. Hệ thống tự động hiển thị URL hoàn chỉnh (preview)
4. Super Admin kiểm tra và chỉnh sửa nếu cần

## Acceptance Criteria

**AC1:** Hệ thống hiển thị trường nhập URL trang quản trị đại lý gồm:
- Prefix cố định: `https://admin-`
- Trường nhập slug (tên đại lý — prefill bằng tên đại lý, viết thường, không dấu cách, nếu trùng slug thì đánh index 1,2,3,...n)
- Domain cố định: `.chotdon.ai`

**AC2:** Super Admin có thể nhập slug để cấu hình URL cho đại lý.

**AC3:** Hệ thống hiển thị preview URL hoàn chỉnh theo định dạng: `https://admin-[slug].chotdon.ai`.

**AC4:** Slug chỉ cho phép: Chữ thường (a-z), Số (0-9), Dấu gạch ngang (-).

**AC5:** Slug không được để trống.

**AC6:** Slug phải là duy nhất trong hệ thống. Nếu trùng, hệ thống hiển thị lỗi.

**AC7:** Khi slug không hợp lệ (ký tự đặc biệt, khoảng trắng...), hệ thống hiển thị lỗi validate.

**AC8:** Khi nhập hợp lệ, hệ thống cho phép lưu và tiếp tục.

**AC9:** Sau khi lưu, URL được gán cho đại lý và dùng để truy cập trang Agency Admin.
