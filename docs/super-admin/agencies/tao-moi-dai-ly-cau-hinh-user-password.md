---
id: GSA-DL-6
jiraKey: AGENCY-15
platform: super-admin
section: Quản lý Đại lý
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
---

# [GSA] Đại lý - Tạo mới đại lý: Cấu hình User/Password đăng nhập trang Agency Admin

## User Story

Là GHN Super Admin, tôi muốn tạo tài khoản đăng nhập (username và password) cho đại lý và gán tài khoản này với URL (slug) của đại lý để đảm bảo đại lý chỉ có thể đăng nhập vào đúng tenant của mình.

## Notes

- Đại lý chỉ được đăng nhập bằng tài khoản do Super Admin cấp
- Không hỗ trợ đăng ký tài khoản
- Mỗi tài khoản được gắn với một slug (tenant) cụ thể
- Đại lý chỉ đăng nhập được tại URL tương ứng với slug đã cấu hình
- Đại lý có thể đổi mật khẩu sau khi đăng nhập (flow thuộc Agency Admin)

## User Flow

1. Tại màn hình tạo mới Đại lý → bước "Cấu hình URL trang Agency Admin"
2. Super Admin nhập: Tên đăng nhập (prefill bằng số điện thoại đại lý), Mật khẩu
3. Nhấn "Lưu" hoặc "Hoàn tất tạo đại lý"
4. Hệ thống tạo tài khoản Agency Admin và gán tài khoản với tenant (slug) tương ứng
5. Đại lý truy cập URL: `https://admin-[slug].chotdon.ai`
6. Nhập username/password để đăng nhập
7. Hệ thống kiểm tra tài khoản hợp lệ và tài khoản thuộc đúng tenant (slug)
8. Nếu đúng → login thành công; Nếu sai tenant → từ chối đăng nhập

## Acceptance Criteria

**AC1:** Hệ thống cho phép GHN Super Admin cấu hình tài khoản đăng nhập (username/password) cho Agency Admin khi tạo mới đại lý.

**AC2:** Tài khoản Agency Admin bao gồm: Username (bắt buộc), Password (bắt buộc).

**AC3:** Username — là bắt buộc, được prefill bằng số điện thoại chủ đại lý (có thể edit lại), unique toàn hệ thống, không chứa ký tự đặc biệt (chỉ a-z, 0-9).

**AC4:** Password — là bắt buộc, tối thiểu 8 ký tự, ít nhất 1 ký tự viết hoa, 1 ký tự viết thường, 1 ký tự số và 1 ký tự đặc biệt.

**AC5:** Tài khoản Agency Admin phải được gắn với một tenant (agency) thông qua: agency_id, slug (URL Agency Admin đã cấu hình trước đó).

**AC6:** Khi GHN Super Admin tạo tài khoản thành công, hệ thống lưu: username, password, agency_id, slug.

**AC7:** Khi dữ liệu không hợp lệ — hệ thống hiển thị lỗi tại từng field và không cho phép lưu.

**AC11:** Sau khi tạo thành công, tài khoản có thể sử dụng để đăng nhập web Agency Admin (AGENCY-40).
