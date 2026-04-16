---
id: AGA-CARRIER-1
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: approved
---

# [AGA] Thiết lập NVC: Kết nối Shop ID GHN

## User Story

Là Agency Admin (Đại lý), tôi muốn kết nối tài khoản Shop ID GHN vào hệ thống để có thể sử dụng dịch vụ vận chuyển của Giao Hàng Nhanh cho các shop thuộc đại lý.

## User Flow

1. Agency Admin truy cập menu "Thiết lập NVC" → tab "Kết nối NVC"
2. Hệ thống hiển thị danh sách Shop ID GHN đã kết nối
3. Agency Admin click "Thêm Shop ID"
4. Hệ thống hiển thị modal nhập SĐT tài khoản GHN và Client ID
5. Agency Admin nhập thông tin và click "Kết nối"
6. Hệ thống gửi OTP về SĐT đã nhập
7. Agency Admin nhập mã OTP 6 chữ số
8. Hệ thống xác nhận và thêm Shop ID vào danh sách
9. Agency Admin có thể ngắt kết nối một Shop ID bất kỳ

## Acceptance Criteria

**AC1:** Tab "Kết nối NVC" hiển thị danh sách Shop ID GHN đã kết nối với các cột: Tên cửa hàng, Shop ID, Số điện thoại, Ngày kết nối, Nút ngắt kết nối.

**AC2:** Agency Admin có thể tìm kiếm Shop ID theo tên cửa hàng, Shop ID hoặc số điện thoại.

**AC3:** Khi click "Thêm Shop ID", hệ thống hiển thị modal gồm 2 bước:
- Bước 1 (Form): Nhập SĐT tài khoản GHN và Client ID GHN
- Bước 2 (OTP): Nhập mã OTP 6 chữ số gửi về SĐT

**AC4:** OTP gồm 6 ô nhập riêng biệt, tự động focus sang ô tiếp theo khi nhập xong.

**AC5:** Sau khi gửi OTP, hệ thống bắt đầu đếm ngược 10 phút. Khi hết thời gian, Agency Admin có thể yêu cầu gửi lại OTP.

**AC6:** Agency Admin có thể quay lại bước 1 để thay đổi số điện thoại.

**AC7:** Khi click nút ngắt kết nối, hệ thống ngắt kết nối Shop ID tương ứng khỏi danh sách.

**AC8:** Khi không có kết quả tìm kiếm, hệ thống hiển thị thông báo không tìm thấy.
