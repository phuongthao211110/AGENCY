---
id: GSA-DL-8
jiraKey: 
platform: super-admin
section: Quản lý Đại lý
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: approved
---

# [GSA] Đại lý: View thông tin chi tiết đại lý

## User Story

Là GHN Super Admin, tôi muốn xem thông tin chi tiết của một đại lý để kiểm tra thông tin, theo dõi hoạt động và quản lý tài khoản đăng nhập của đại lý đó.

## User Flow

1. Super Admin click vào tên đại lý tại màn danh sách đại lý
2. Hệ thống điều hướng đến trang chi tiết đại lý
3. Super Admin xem thống kê tổng quan (4 KPIs)
4. Super Admin chuyển giữa các tab: Thông tin đại lý / Danh sách shop / Đơn hàng
5. Tại tab Thông tin đại lý: Super Admin có thể copy username, ẩn/hiện và copy mật khẩu

## Acceptance Criteria

**AC1:** Trang hiển thị 4 KPI tổng quan: Số shop, Số đơn hàng, Tổng COD (₫), Doanh thu (₫).

**AC2:** Trang có 3 tab: "Thông tin đại lý", "Danh sách shop", "Đơn hàng".

**AC3:** Tab "Thông tin đại lý" — section Thông tin cơ bản hiển thị: Tên đại lý, Mã đại lý, Họ tên chủ đại lý, Số điện thoại, Địa chỉ.

**AC4:** Tab "Thông tin đại lý" — section Cấu hình trang hiển thị URL trang Agency Admin (https://admin-[slug].chotdon.ai) và URL Web/App shop (https://shop-[slug].chotdon.ai).

**AC5:** Tab "Thông tin đại lý" — section Tài khoản Agency Admin hiển thị: Tên đăng nhập (có nút copy), Mật khẩu (có nút ẩn/hiện + nút copy).

**AC6:** Tab "Danh sách shop" hiển thị danh sách các shop thuộc đại lý.

**AC7:** Tab "Đơn hàng" hiển thị danh sách đơn hàng của các shop thuộc đại lý.

**AC8:** Khi copy text (username hoặc password), hệ thống hiển thị toast "Sao chép thành công" tự ẩn sau 2 giây.

**AC9:** Khi không tìm thấy đại lý (ID không hợp lệ), hệ thống hiển thị thông báo lỗi và link quay lại danh sách đại lý.
