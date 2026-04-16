---
id: AGA-CARRIER-2
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: approved
---

# [AGA] Thiết lập NVC: Quản lý gói dịch vụ

## User Story

Là Agency Admin (Đại lý), tôi muốn xem và quản lý danh sách các gói dịch vụ vận chuyển để kiểm soát dịch vụ nào đang được kích hoạt cho đại lý và tạo mới gói dịch vụ khi cần.

## User Flow

1. Agency Admin truy cập menu "Thiết lập NVC" → tab "Dịch vụ"
2. Hệ thống hiển thị danh sách gói dịch vụ
3. Agency Admin có thể bật/tắt kích hoạt từng gói dịch vụ
4. Agency Admin click vào tên gói để xem chi tiết (AGA-CARRIER-3)
5. Agency Admin click "Tạo mới dịch vụ" để tạo gói mới
6. Hệ thống hiển thị modal tạo gói dịch vụ
7. Sau khi tạo thành công, hệ thống chuyển đến trang chi tiết gói vừa tạo

## Acceptance Criteria

**AC1:** Tab "Dịch vụ" hiển thị danh sách gói dịch vụ với các cột: Gói dịch vụ (tên), Mã dịch vụ NVC, NVC (nhà vận chuyển), Tải trọng tối đa, Vùng giao, Toggle kích hoạt.

**AC2:** Agency Admin có thể bật/tắt kích hoạt từng gói dịch vụ bằng toggle.

**AC3:** Agency Admin có thể click vào tên gói dịch vụ để xem trang chi tiết (AGA-CARRIER-3).

**AC4:** Khi click "Tạo mới dịch vụ", hệ thống hiển thị modal gồm các trường: Mã gói (bắt buộc, monospace), Tên gói (bắt buộc), Mô tả, Kết nối Shop ID GHN (dropdown chọn từ danh sách đã kết nối).

**AC5:** Nút "Tạo gói dịch vụ" bị disable khi chưa nhập Mã gói và Tên gói.

**AC6:** Sau khi tạo thành công, hệ thống điều hướng đến trang chi tiết gói dịch vụ vừa tạo ở chế độ mới (isNew).
