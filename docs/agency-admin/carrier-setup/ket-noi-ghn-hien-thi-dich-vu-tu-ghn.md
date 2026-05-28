---
id: AGA-CARRIER-10
jiraKey: AGENCY-243
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGA] Thiết lập GHN - Kết nối GHN: Hiển thị thông tin dịch vụ từ GHN

## User Story

Là Agency Admin (Đại lý), tôi muốn xem các gói dịch vụ GHN (Hàng nhẹ /
Hàng nặng) của từng Shop GHN đã kết nối để biết Shop GHN nào hỗ trợ loại
hàng nào trước khi gắn vào dịch vụ đại lý.

## User Flow

1. Agency Admin vào menu **Thiết lập GHN** → tab **Kết nối GHN**
2. Hệ thống hiển thị danh sách Shop GHN đã kết nối kèm thông tin dịch vụ
3. Agency Admin quan sát cột **Dịch vụ từ GHN** để biết từng shop
   hỗ trợ gói cước nào
4. Agency Admin có thể tìm kiếm shop theo tên hoặc ID

## System Flow

1. Load danh sách Shop GHN đã kết nối theo `agencyId`
2. Với mỗi shop, gọi GHN API để lấy danh sách dịch vụ khả dụng
   (`Hàng nhẹ <20kg` / `Hàng nặng ≥20kg`)
3. Hiển thị kết quả dưới dạng tag trong cột **Dịch vụ từ GHN**
4. Phân trang theo số lượng hiển thị đã chọn

## Acceptance Criteria

**AC1:** Tab **Kết nối GHN** hiển thị bảng danh sách với các cột:
- Checkbox chọn nhiều
- **Cửa hàng GHN**: Shop ID + tên cửa hàng (format `{id} - {tên}`)
- **Số điện thoại**
- **Dịch vụ từ GHN**: tag hiển thị gói cước khả dụng
- **Thao tác**: icon ngắt kết nối

**AC2:** Cột **Dịch vụ từ GHN** hiển thị tag theo loại:
- `Hàng nhẹ <20kg`: nền cam nhạt, chữ cam
- `Hàng nặng ≥20kg`: nền tối, chữ trắng
- Một shop có thể có cả hai tag nếu hỗ trợ cả 2 gói

**AC3:** Shop chưa có dịch vụ nào từ GHN → cột Dịch vụ hiển thị `—`.

**AC4:** Tìm kiếm theo tên cửa hàng hoặc Shop ID, partial match,
không phân biệt hoa/thường.

**AC5:** Hỗ trợ phân trang — dropdown chọn số lượng hiển thị mỗi trang
(mặc định 50).

**AC6:** Danh sách chỉ hiển thị Shop GHN thuộc đại lý đang đăng nhập
(tenant isolation).

## Notes

- Dữ liệu dịch vụ lấy từ GHN API — nếu GHN không phản hồi thì hiển
  thị `—` và không block việc hiển thị danh sách
- Thông tin này là cơ sở để Agency Admin chọn gói cước khi tạo/sửa
  dịch vụ (AGENCY-244)
