---
id: AGA-CARRIER-6
jiraKey: AGENCY-148
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGA] Nhà vận chuyển - Tạo mới dịch vụ: Thông tin cơ bản

## User Story

Là Agency Admin (Đại lý), tôi muốn nhập thông tin cơ bản khi tạo mới gói dịch
vụ để định danh dịch vụ và gắn các Shop ID GHN sẽ thực hiện vận chuyển cho
dịch vụ đó.

## User Flow

1. Agency Admin nhấn **Tạo dịch vụ mới** từ tab Dịch vụ (AGENCY-68)
2. Hệ thống hiển thị modal tạo dịch vụ
3. Agency Admin nhập thông tin cơ bản và chọn Shop ID GHN
4. Nhấn **Tạo dịch vụ** → hệ thống tạo và điều hướng sang trang chi tiết
   dịch vụ vừa tạo

## System Flow

1. Validate toàn bộ field trước khi lưu
2. Kiểm tra mã dịch vụ unique trong phạm vi `agencyId`
3. Tạo Service với `enabled = false` (chưa kích hoạt mặc định)
4. Lưu mapping `service ↔ ghnShopIds`
5. Điều hướng đến trang chi tiết dịch vụ vừa tạo

## Acceptance Criteria

**AC1:** Modal tạo dịch vụ gồm các field:

- **Mã dịch vụ** *(bắt buộc)*: font monospace, chỉ cho phép `a-z A-Z 0-9 _`,
  tối đa 50 ký tự, unique trong phạm vi đại lý
- **Tên dịch vụ** *(bắt buộc)*: tối đa 255 ký tự
- **Mô tả** *(tuỳ chọn)*: tối đa 500 ký tự
- **Shop ID GHN** *(tuỳ chọn)*: multi-select, chỉ liệt kê Shop ID đã kết nối
  trong tab Kết nối NVC (AGENCY-37)

**AC2:** Nút **Tạo dịch vụ** disable khi chưa nhập Mã hoặc Tên dịch vụ.

**AC3:** Mã dịch vụ trùng trong cùng đại lý → hiển thị lỗi inline
`"Mã dịch vụ đã tồn tại"`, không cho submit.

**AC4:** Field không hợp lệ → hiển thị lỗi inline ngay tại field, không cho
submit.

**AC5:** Tạo thành công → đóng modal, điều hướng sang trang chi tiết dịch vụ.

## Notes

- Dịch vụ mới tạo mặc định ở trạng thái **chưa kích hoạt** —
  Agency Admin bật toggle sau khi hoàn tất cấu hình
- Chưa gắn Shop ID GHN khi tạo vẫn được, có thể bổ sung ở trang chi tiết
