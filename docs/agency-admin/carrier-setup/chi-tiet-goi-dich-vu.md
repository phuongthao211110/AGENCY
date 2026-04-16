---
id: AGA-CARRIER-3
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: approved
---

# [AGA] Thiết lập NVC: Chi tiết gói dịch vụ

## User Story

Là Agency Admin (Đại lý), tôi muốn xem và chỉnh sửa chi tiết một gói dịch vụ vận chuyển, bao gồm thông tin cơ bản, địa điểm khả dụng và địa điểm bị chặn để cấu hình vùng phủ dịch vụ phù hợp.

## User Flow

1. Agency Admin click vào tên gói dịch vụ trong danh sách (AGA-CARRIER-2)
2. Hệ thống hiển thị trang chi tiết gói dịch vụ với 3 tab
3. Agency Admin xem/chỉnh sửa thông tin tại tab "Thông tin"
4. Agency Admin quản lý địa điểm khả dụng tại tab "Địa điểm khả dụng"
5. Agency Admin quản lý địa điểm bị chặn tại tab "Địa điểm chặn"
6. Agency Admin có thể quay lại danh sách dịch vụ bằng nút back

## Acceptance Criteria

**AC1:** Trang chi tiết có 3 tab: "Thông tin", "Địa điểm khả dụng", "Địa điểm chặn".

**AC2:** Tab "Thông tin" hiển thị ở chế độ xem (view): Mã gói, Tên gói, Mô tả, Shop ID GHN kết nối, danh sách bảng giá liên kết. Agency Admin có thể click "Chỉnh sửa" để chuyển sang chế độ edit.

**AC3:** Ở chế độ edit, Agency Admin có thể sửa: Mã gói, Tên gói, Mô tả, Shop ID GHN. Có nút "Lưu" và "Huỷ".

**AC4:** Tab "Địa điểm khả dụng" gồm 2 section: Lấy hàng và Giao hàng. Mỗi section hiển thị danh sách địa điểm đã thêm và nút "Thêm địa điểm".

**AC5:** Tab "Địa điểm chặn" có cấu trúc tương tự tab "Địa điểm khả dụng" nhưng dùng để cấu hình địa điểm không phục vụ.

**AC6:** Agency Admin có thể thêm địa điểm vào danh sách Lấy hàng hoặc Giao hàng thông qua modal chọn địa điểm.

**AC7:** Agency Admin có thể xoá địa điểm khỏi danh sách bằng nút xoá tương ứng.

**AC8:** Nút back điều hướng về trang Thiết lập NVC.
