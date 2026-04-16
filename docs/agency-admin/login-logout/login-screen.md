---
id: AGA-AUTH-1
jiraKey: AGENCY-40
platform: agency-admin
section: Login / Logout
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
---

# [AGA] Login screen

## User Story

Là Agency Admin (Đại lý), tôi muốn đăng nhập vào trang quản trị của đại lý thông qua URL riêng và tài khoản được GHN Super Admin cung cấp để có thể quản lý shop và đơn hàng.

## Notes

- URL đăng nhập được cấu hình tại bước tạo đại lý (AGENCY-14: [GSA] Đại lý - Tạo mới đại lý: Cấu hình URL trang Agency Admin)
- Tài khoản (username/password) được cấp bởi GHN Super Admin (AGENCY-15)
- Chưa hỗ trợ đăng ký tài khoản
- Tài khoản chỉ đăng nhập được trên đúng URL (slug) của đại lý

## User Flow

1. Agency Admin truy cập URL trang quản trị đại lý: `https://admin-[slug].chotdon.ai`
2. Hệ thống xác định đại lý mà user đang truy cập dựa trên URL
3. Agency Admin nhập Tên đăng nhập và Mật khẩu
4. Nhấn "Đăng nhập"
5. Hệ thống kiểm tra tài khoản hợp lệ và tài khoản thuộc đúng tenant (slug)
6. Nếu hợp lệ → đăng nhập thành công và chuyển đến màn hình Quản lý shop
7. Nếu không hợp lệ → hiển thị lỗi tương ứng

## Acceptance Criteria

**AC1:** Hệ thống hiển thị màn hình đăng nhập với các trường: Tên đăng nhập, Mật khẩu, Nút "Đăng nhập".

**AC2:** Agency Admin chỉ có thể truy cập trang login thông qua URL đã được cấu hình cho đại lý.

**AC3:** Khi Agency Admin thực hiện đăng nhập, hệ thống phải kiểm tra đồng thời:
- Username/password hợp lệ
- Tài khoản thuộc đúng agency_id tương ứng với slug trên URL
- Hệ thống phải xác định đúng đại lý (tenant) dựa trên slug trong URL

**AC4:** Điều kiện đăng nhập thành công: Username/password đúng VÀ tài khoản thuộc đúng tenant (slug) → Hệ thống cho phép đăng nhập.

**AC5:** Trường hợp username/password đúng nhưng sai tenant (slug):
- Hệ thống từ chối đăng nhập
- Hiển thị lỗi "Tài khoản không thuộc hệ thống này"

**AC6:** Hệ thống không cho phép đăng nhập chéo giữa các tenant. Một tài khoản Agency Admin chỉ đăng nhập được tại đúng URL slug đã được cấu hình.

**AC7:** Hệ thống không cung cấp chức năng đăng ký tài khoản.

**AC8:** Sau khi đăng nhập thành công, hệ thống tạo và lưu session 7 ngày cho người dùng.

**AC9:** Khi session hết hạn, Agency Admin bị đăng xuất và chuyển về màn hình login.
