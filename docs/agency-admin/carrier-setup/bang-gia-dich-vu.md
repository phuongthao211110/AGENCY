---
id: AGA-CARRIER-4
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: approved
---

# [AGA] Thiết lập NVC: Bảng giá dịch vụ

## User Story

Là Agency Admin (Đại lý), tôi muốn xem và quản lý cấu hình giá cho từng gói dịch vụ vận chuyển để kiểm soát chi phí ship theo tuyến và khu vực.

## User Flow

1. Agency Admin truy cập menu "Thiết lập NVC" → tab "Bảng giá"
2. Hệ thống hiển thị segment chọn gói dịch vụ và bảng cấu hình giá
3. Agency Admin chọn gói dịch vụ cần xem
4. Hệ thống lọc và hiển thị danh sách cấu hình giá của gói đó
5. Agency Admin click "Chi tiết" để xem chi tiết một cấu hình giá
6. Agency Admin click "Thêm cấu hình giá" để tạo mới

## Acceptance Criteria

**AC1:** Tab "Bảng giá" hiển thị segment control để chọn gói dịch vụ (Giao hàng nhanh / Giao hàng tiêu chuẩn / Hàng cồng kềnh).

**AC2:** Bảng cấu hình giá hiển thị các cột: Tuyến (Nội tỉnh/Liên tỉnh), Khu vực, Tải trọng cơ bản, Giá cơ bản, Số bậc vượt cân, Số loại phụ phí, Nút Chi tiết.

**AC3:** Khi Agency Admin chọn gói dịch vụ khác, hệ thống lọc và hiển thị đúng cấu hình giá của gói đó.

**AC4:** Khi không có cấu hình giá, hệ thống hiển thị thông báo "Chưa có cấu hình giá".

**AC5:** Agency Admin có thể click "Thêm cấu hình giá" để tạo cấu hình giá mới cho gói đang chọn.

**AC6:** Agency Admin có thể click "Chi tiết" để xem toàn bộ chi tiết cấu hình giá (bậc vượt cân, phụ phí).
