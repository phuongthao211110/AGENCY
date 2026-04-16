---
id: AGA-SHOP-4
jiraKey: AGENCY-46
platform: agency-admin
section: Quản lý Shop
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
---

# [AGA] Shop - Tạo mới shop: Cấu hình User/Password cho chủ shop đăng nhập Web/App shop

## User Story

Là Agency Admin (Đại lý), tôi muốn cấu hình tài khoản đăng nhập (username/password) cho shop để chủ shop có thể đăng nhập vào hệ thống Web/App và sử dụng dịch vụ.

## Acceptance Criteria

**AC1:** Hệ thống hiển thị section cấu hình tài khoản đăng nhập trong màn hình tạo shop.

**AC2:** Username shop được cấu thành theo format: `username = shop_id + "-" + {username do Agency Admin nhập}`.
- `shop_id` do hệ thống generate (6 ký tự: 3 chữ in hoa + 3 số)
- Phần suffix được prefill sẵn bằng số điện thoại chủ shop, Agency Admin có thể edit lại

**AC3:** Agency Admin không được chỉnh sửa phần shop_id trong username. Chỉ được nhập phần phía sau dấu "-".

**AC4:** Username là bắt buộc, không chứa ký tự đặc biệt (chỉ a-z, 0-9), unique toàn hệ thống.

**AC5:** Khi username bị trùng: Hệ thống hiển thị lỗi "Tên đăng nhập đã tồn tại", không cho phép lưu.

**AC6:** Password là bắt buộc, tối thiểu 8 ký tự, ít nhất 1 ký tự viết hoa, 1 ký tự viết thường, 1 ký tự số và 1 ký tự đặc biệt.

**AC7:** Hệ thống hỗ trợ: Ẩn/hiện mật khẩu, Sao chép username, Sao chép mật khẩu.

**AC8:** Khi submit hợp lệ, hệ thống lưu username, password mapping với shop_id và agency_id.

**AC9:** Đảm bảo tenant isolation: Shop chỉ đăng nhập được vào hệ thống thuộc agency_id của mình.

**AC10:** Khi dữ liệu không hợp lệ: Hiển thị lỗi tại từng field, không cho submit.

**AC11:** Sau khi tạo thành công, tài khoản shop có thể sử dụng để đăng nhập Web shop (AGENCY-78) và App shop (AGENCY-79).
