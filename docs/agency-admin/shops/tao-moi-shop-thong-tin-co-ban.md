---
id: AGA-SHOP-3
jiraKey: AGENCY-45
platform: agency-admin
section: Quản lý Shop
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
---

# [AGA] Shop - Tạo mới shop: Thông tin cơ bản

## User Story

Là Agency Admin (Đại lý), tôi muốn nhập thông tin cơ bản của shop để tạo mới shop thuộc đại lý của mình, giúp các shop có thể sử dụng hệ thống để lên đơn.

## User Flow

1. Agency Admin truy cập màn "Quản lý shop"
2. Agency Admin click "Tạo shop mới"
3. Hệ thống hiển thị form "Thông tin cơ bản"
4. Agency Admin nhập các thông tin: Thông tin chung, Cấu hình tài khoản shop đăng nhập (AGENCY-46)
5. Agency Admin click "Lưu"
6. Hệ thống validate dữ liệu
7. Nếu hợp lệ → cho phép lưu shop
8. Nếu không hợp lệ → hiển thị lỗi

## Acceptance Criteria

**AC1:** Agency Admin có thể truy cập màn tạo shop từ màn "Quản lý shop".

**AC2:** Hệ thống hiển thị các field:
- Tên shop (bắt buộc)
- Tên chủ shop
- Số điện thoại (bắt buộc)
- Địa chỉ lấy hàng (bắt buộc): Số nhà/tên đường, Tỉnh/Thành, Quận/Huyện, Phường/Xã

**AC3:** Mã shop (shop_id) được hệ thống tự động generate. Gồm 6 ký tự, format: 3 chữ cái IN HOA + 3 số (ví dụ: ABC123, XDF908). Unique toàn hệ thống.

**AC5:** Validate dữ liệu:
- Tên shop: không được để trống, tối đa 255 ký tự
- Số điện thoại: không được để trống, đúng định dạng di động, unique trong phạm vi cùng agency
- Địa chỉ: không được để trống, phải chọn đủ Tỉnh/Thành → Quận/Huyện → Phường/Xã

**AC6:** Khi tạo shop thành công, hệ thống lưu shop_id (system generate), agency_id (từ Agency Admin đang đăng nhập). Trạng thái mặc định: Hoạt động.

**AC7:** Hệ thống đảm bảo tenant isolation: Agency Admin chỉ tạo được shop thuộc đại lý của mình.

**AC9:** Trường hợp nhập SĐT bị trùng trong cùng agency: Hệ thống hiển thị lỗi số điện thoại đã tồn tại trong đại lý, không cho phép tạo shop.

**AC10:** Trường hợp dữ liệu không hợp lệ: Hiển thị message lỗi tại từng field, không cho submit.
