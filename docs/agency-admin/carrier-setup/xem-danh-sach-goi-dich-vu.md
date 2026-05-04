---
id: AGA-CARRIER-5
jiraKey: AGENCY-86
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGA] Nhà vận chuyển - Dịch vụ: Xem danh sách gói dịch vụ

## User Story

Là Agency Admin (Đại lý), tôi muốn xem danh sách các gói dịch vụ đại lý đang
cung cấp để nắm toàn bộ dịch vụ đang hoạt động và quản lý chúng.

## User Flow

1. Agency Admin vào menu **Thiết lập NVC** → chọn tab **Dịch vụ**
2. Hệ thống hiển thị danh sách gói dịch vụ của đại lý
3. Agency Admin có thể:
   - Tìm kiếm dịch vụ theo tên hoặc mã
   - Bật/tắt kích hoạt từng dịch vụ bằng toggle (AGENCY-152)
   - Nhấn tên dịch vụ → vào trang chi tiết (AGENCY-157)
   - Nhấn **Tạo dịch vụ mới** → mở flow tạo dịch vụ (AGENCY-148)

## System Flow

1. Hệ thống lấy danh sách Service theo `agencyId` của Agency Admin đang đăng nhập
2. Sắp xếp theo `createdAt` mới nhất
3. Nếu có keyword → filter theo `name` hoặc `code`
   (partial match, không phân biệt hoa/thường)

## Acceptance Criteria

**AC1:** Tab **Dịch vụ** hiển thị danh sách tất cả gói dịch vụ thuộc đúng
đại lý đang đăng nhập.

**AC2:** Mỗi dòng hiển thị: Tên dịch vụ (link màu xanh, bold), Mã dịch vụ,
danh sách Shop ID GHN được gắn, toggle kích hoạt.

**AC3:** Tìm kiếm theo tên hoặc mã, partial match, không phân biệt hoa/thường.

**AC4:** Không có kết quả tìm kiếm → hiển thị "Không tìm thấy dữ liệu".

**AC5:** Đại lý chưa có dịch vụ nào → empty state kèm nút **Tạo dịch vụ mới**.

**AC6:** Nhấn tên dịch vụ → điều hướng trang chi tiết dịch vụ.

**AC7:** Nhấn **Tạo dịch vụ mới** → mở flow tạo dịch vụ (AGENCY-148).

## Notes

- Dịch vụ chưa gắn Shop ID GHN nào → cột Shop ID hiển thị `—`
- Toggle ở màn danh sách là shortcut của AGENCY-152, không cần vào chi tiết
  để bật/tắt
