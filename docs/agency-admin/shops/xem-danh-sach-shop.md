---
id: AGA-SHOP-1
jiraKey: AGENCY-42
platform: agency-admin
section: Quản lý Shop
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
---

# [AGA] Shop - Danh sách shop: Xem danh sách shop

## User Story

Là Agency Admin (Đại lý), tôi muốn xem và quản lý danh sách các shop thuộc đại lý của mình để có thể theo dõi hoạt động, kiểm soát trạng thái và thực hiện các thao tác quản lý shop.

## User Flow

1. Agency Admin truy cập menu Quản lý shop
2. Hệ thống hiển thị danh sách tất cả shop thuộc đại lý
3. Agency Admin có thể:
   - Xem thông tin từng shop
   - Tìm kiếm shop (AGENCY-43)
   - Phân trang danh sách
   - Tạo shop mới (AGENCY-45)

## Acceptance Criteria

**AC1:** Khi Agency Admin truy cập màn "Quản lý shop", hệ thống hiển thị danh sách shop thuộc đúng đại lý.

**AC2:** Mỗi shop hiển thị các thông tin: Tên shop - Mã shop (shop_id), Chủ shop - Số điện thoại, Số đơn hàng, Tổng COD, Doanh thu.

**AC3:** Agency Admin chỉ có thể xem các shop thuộc đại lý của mình, không thể truy cập shop của đại lý khác.

**AC4:** Hệ thống hỗ trợ tìm kiếm không phân biệt chữ hoa/thường và theo từ khóa một phần.

**AC5:** Hệ thống hỗ trợ phân trang danh sách shop.

**AC6:** Agency Admin có thể chọn số lượng bản ghi hiển thị trên mỗi trang.

**AC7:** Agency Admin có thể nhấn "Tạo shop mới" để chuyển sang màn tạo shop (AGENCY-45).

**AC8:** Khi không có dữ liệu, hệ thống hiển thị trạng thái empty phù hợp.
