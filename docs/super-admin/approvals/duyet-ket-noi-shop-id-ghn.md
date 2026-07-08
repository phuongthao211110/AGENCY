---
id: GSA-APV-1
jiraKey: 
platform: super-admin
section: Duyệt yêu cầu
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Duyệt yêu cầu: Duyệt kết nối Shop ID GHN của đại lý

## User Story

Là GHN Super Admin, tôi muốn xem và xử lý các yêu cầu kết nối Shop ID GHN đang chờ duyệt từ các đại lý để kiểm soát việc đại lý nào được phép kết nối tài khoản GHN nào vào hệ thống.

## User Flow

1. Super Admin truy cập menu "Approvals"
2. Hệ thống hiển thị danh sách yêu cầu đang chờ duyệt; Super Admin có thể lọc theo loại: "Kết nối Shop ID GHN" / "Kích hoạt nhà vận chuyển"
3. Super Admin xem thông tin từng yêu cầu kết nối Shop ID (tên đại lý, tên cửa hàng GHN, Shop ID, SĐT, ngày yêu cầu)
4. Super Admin click "Duyệt" → xác nhận → yêu cầu được chấp nhận
5. Hoặc Super Admin click "Từ chối" → nhập lý do từ chối → gửi

## System Flow

1. Khi Agency Admin hoàn thành OTP kết nối Shop ID GHN (AGA-CARRIER-1), hệ thống tạo một pending request trong queue Approvals
2. Super Admin load trang Approvals → hệ thống fetch danh sách pending requests phân loại theo loại yêu cầu
3. Khi Super Admin duyệt → status request chuyển "approved", Shop ID được activate trong tài khoản đại lý
4. Khi Super Admin từ chối → status chuyển "rejected", lý do từ chối được lưu và đại lý thấy trạng thái bị từ chối trong tab "Kết nối" của Thiết lập NVC

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Agency Admin** — Thiết lập NVC / tab Kết nối | Sau khi được duyệt, Shop ID hiển thị trạng thái "Đã kết nối" trong danh sách. Khi bị từ chối, hiển thị trạng thái "Bị từ chối" kèm lý do. |

## Acceptance Criteria

**AC1:** Trang Approvals hiển thị danh sách yêu cầu đang chờ duyệt với khả năng lọc theo loại: "Kết nối Shop ID GHN" và "Kích hoạt nhà vận chuyển".

**AC2:** Mỗi yêu cầu kết nối Shop ID trong danh sách hiển thị: Tên đại lý (mã đại lý), Tên cửa hàng GHN, Shop ID, Số điện thoại, Ngày yêu cầu, Trạng thái.

**AC3:** Super Admin có thể Approve yêu cầu → Shop ID được kích hoạt trong tài khoản đại lý; Agency Admin thấy Shop ID hiển thị "Đã kết nối" trong tab "Kết nối" của Thiết lập NVC.

**AC4:** Super Admin có thể Reject yêu cầu → bắt buộc nhập lý do từ chối *(bắt buộc)*: tối đa 500 ký tự; Agency Admin thấy trạng thái "Bị từ chối" kèm lý do trên cùng yêu cầu.

**AC5:** Khi không có yêu cầu chờ duyệt thuộc loại "Kết nối Shop ID GHN", hệ thống hiển thị trạng thái empty phù hợp.
