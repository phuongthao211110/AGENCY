---
id: AGA-CARRIER-6
jiraKey: AGENCY-148
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGA] Thiết lập GHN - Tạo mới dịch vụ: Thông tin cơ bản

## User Story

Là Agency Admin (Đại lý), tôi muốn nhập thông tin cơ bản và kết nối Shop ID
GHN khi tạo mới gói dịch vụ để định danh dịch vụ và xác định Shop GHN nào
sẽ thực hiện vận chuyển cho dịch vụ đó.

## User Flow

1. Agency Admin nhấn **Tạo mới dịch vụ** từ tab Dịch vụ (AGENCY-86)
2. Hệ thống điều hướng sang trang tạo mới dịch vụ
3. Agency Admin nhập thông tin cơ bản: Mã gói, Tên gói, Mô tả
4. Agency Admin chọn Shop ID GHN và gói cước tương ứng (AGENCY-244)
5. Nhấn **Tạo dịch vụ** → hệ thống lưu và chuyển sang chế độ xem chi tiết

## System Flow

1. Validate Mã gói và Tên gói không được trống
2. Kiểm tra Mã gói unique trong phạm vi `agencyId`
3. Tạo Service với `enabled = false` (mặc định chưa kích hoạt)
4. Lưu danh sách Shop ID GHN và gói cước được chọn
5. Điều hướng sang trang chi tiết dịch vụ vừa tạo (chế độ xem)

## Acceptance Criteria

**AC1:** Trang tạo mới hiển thị card **Thông tin cơ bản** với các field:

- **Mã gói** *(bắt buộc)*: font monospace, placeholder `VD: CHUYENNHANH`,
  chỉ cho phép `A-Z a-z 0-9 _`, tối đa 50 ký tự, unique trong phạm vi đại lý
- **Tên gói** *(bắt buộc)*: placeholder `VD: Giao hàng nhanh`, tối đa 255 ký tự
- **Mô tả** *(tuỳ chọn)*: placeholder `Mô tả ngắn về gói dịch vụ...`,
  tối đa 500 ký tự

**AC2:** Bên dưới thông tin cơ bản hiển thị section **Kết nối Shop ID GHN**
(chi tiết xem AGENCY-244).

**AC3:** Nút **Tạo dịch vụ** disabled khi chưa nhập Mã gói hoặc Tên gói.

**AC4:** Mã gói trùng trong cùng đại lý → hiển thị lỗi inline
`"Mã gói đã tồn tại"`, không cho submit.

**AC5:** Field không hợp lệ → hiển thị lỗi inline ngay tại field đó,
không cho submit.

**AC6:** Tạo thành công → chuyển sang trang chi tiết dịch vụ ở chế độ xem.

## Notes

- Dịch vụ mới tạo mặc định **chưa kích hoạt** — Agency Admin bật toggle
  sau khi hoàn tất cấu hình (AGENCY-152)
- Bảng giá chưa thể gắn tại bước này — thực hiện ở AGENCY-149
