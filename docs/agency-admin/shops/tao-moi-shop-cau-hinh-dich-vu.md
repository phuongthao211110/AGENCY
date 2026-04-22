---
id: AGA-SHOP-6
jiraKey: 
platform: agency-admin
section: Quản lý Shop
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Shop - Tạo mới shop: Cấu hình dịch vụ

## User Story

Là Agency Admin (Đại lý), tôi muốn cấu hình dịch vụ vận chuyển cho shop ngay khi tạo mới để xác định shop đó có thể sử dụng những dịch vụ nào và theo bảng giá nào.

## Notes

- Mỗi dịch vụ (Service) được kết nối với 1 GHN Shop ID — đây là Shop ID của tài khoản GHN, khác với shop_id của agency shop
- Shop có thể được gắn với nhiều dịch vụ, mỗi dịch vụ dùng 1 bảng giá riêng
- Nếu một dịch vụ không được chọn bảng giá → dịch vụ đó không khả dụng với shop này
- Section "Cấu hình dịch vụ" là Section 3 trong form tạo shop mới, sau "Thông tin cơ bản" (AGA-SHOP-3) và "Cấu hình tài khoản" (AGA-SHOP-4)

## User Flow

1. Agency Admin truy cập màn tạo shop mới
2. Sau khi điền thông tin cơ bản và tài khoản đăng nhập, Agency Admin kéo xuống Section 3 "Cấu hình dịch vụ"
3. Hệ thống hiển thị danh sách tất cả dịch vụ đang được cấu hình trong đại lý
4. Với mỗi dịch vụ, Agency Admin chọn bảng giá từ dropdown
5. Nếu không chọn bảng giá cho một dịch vụ, hệ thống hiển thị cảnh báo màu vàng "Dịch vụ sẽ không khả dụng"
6. Agency Admin hoàn tất và submit form tạo shop

## Acceptance Criteria

**AC1:** Màn hình tạo shop mới có Section 3 "Cấu hình dịch vụ" nằm sau Section 1 (Thông tin cơ bản) và Section 2 (Cấu hình tài khoản).

**AC2:** Section "Cấu hình dịch vụ" hiển thị danh sách tất cả dịch vụ vận chuyển đang active trong đại lý. Mỗi dịch vụ hiện tên dịch vụ, mã dịch vụ và dropdown chọn bảng giá.

**AC3:** Dropdown bảng giá của mỗi dịch vụ chỉ liệt kê các bảng giá đang thuộc dịch vụ đó (không trộn bảng giá của dịch vụ khác).

**AC4:** Khi Agency Admin chưa chọn bảng giá cho một dịch vụ, hệ thống hiển thị cảnh báo màu vàng bên dưới dịch vụ đó: "Dịch vụ sẽ không khả dụng nếu không có bảng giá".

**AC5:** Agency Admin có thể bỏ qua việc chọn bảng giá cho một hoặc nhiều dịch vụ — không bắt buộc phải chọn đủ tất cả dịch vụ để submit form.

**AC6:** Sau khi tạo shop thành công, hệ thống lưu mapping giữa shop và từng dịch vụ kèm bảng giá đã chọn. Dịch vụ không được chọn bảng giá sẽ không khả dụng với shop đó.

**AC7:** Hệ thống đảm bảo tenant isolation: danh sách dịch vụ và bảng giá trong dropdown chỉ bao gồm dịch vụ/bảng giá thuộc đại lý của Agency Admin đang đăng nhập.

**AC8:** Khi không có dịch vụ nào được cấu hình trong đại lý, Section "Cấu hình dịch vụ" hiển thị thông báo hướng dẫn Agency Admin thiết lập dịch vụ tại màn "Thiết lập NVC" trước.
