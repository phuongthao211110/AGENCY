---
id: GSA-DL-1
jiraKey: AGENCY-7
platform: super-admin
section: Quản lý Đại lý
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
---

# [GSA] Đại lý - Danh sách đại lý: Xem danh sách đại lý

## User Story

Là GHN Super Admin, tôi muốn xem danh sách tất cả đại lý trong hệ thống để có thể theo dõi, quản lý và thực hiện các thao tác với đại lý.

## User Flow

1. Super Admin truy cập menu Đại lý
2. Hệ thống hiển thị danh sách tất cả đại lý
3. Super Admin có thể tìm kiếm theo tên/mã/số điện thoại đại lý
4. Super Admin có thể xem thông tin chi tiết từng đại lý

## Acceptance Criteria

**AC1:** Khi truy cập màn hình Đại lý, hệ thống hiển thị danh sách đại lý dạng bảng.

**AC2:** Mỗi dòng đại lý hiển thị các cột: Tên đại lý - Mã đại lý (agency_id), Chủ đại lý - Số điện thoại, Số shop (tổng số shop thuộc đại lý), Số đơn hàng (tổng số đơn hàng của shop thuộc đại lý), Tổng COD, Doanh thu (tổng doanh thu phí ship đơn hàng của shop thuộc đại lý).

**AC3:** Super Admin có thể tìm kiếm theo tên/mã/số điện thoại đại lý.

**AC4:** Khi nhập từ khóa tìm kiếm, hệ thống hiển thị danh sách phù hợp với từ khóa.

**AC7:** Super Admin có thể xem phân trang danh sách đại lý. Cho phép hiển thị số lượng dòng trên mỗi trang và cho phép thay đổi số lượng hiển thị 20/50/100/150/200, mặc định chọn 20.

**AC11:** Super Admin có thể nhấn "Tạo đại lý mới" để chuyển sang màn tạo đại lý.

**AC14:** Khi không có dữ liệu, hoặc tìm kiếm không có kết quả hệ thống hiển thị trạng thái empty phù hợp.
