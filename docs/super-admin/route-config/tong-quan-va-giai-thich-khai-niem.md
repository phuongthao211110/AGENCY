---
id: GSA-ROUTE-1
jiraKey: 
platform: super-admin
section: Cấu hình Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Cấu hình Vùng & Tuyến: Tổng quan và giải thích khái niệm

## User Story

Là GHN Super Admin, tôi muốn truy cập trang Cấu hình Vùng & Tuyến và đọc phần giải thích khái niệm để hiểu rõ cách hệ thống tính ra tên tuyến trước khi bắt đầu cấu hình.

## User Flow

1. Super Admin truy cập menu "Cấu hình Vùng & Tuyến" (route `/super-admin/route-config`)
2. Hệ thống hiển thị tiêu đề trang và mô tả ngắn về mục đích
3. Super Admin đọc panel xanh dương "Cách tuyến được tính ra" gồm 3 khái niệm theo thứ tự: Miền → Cặp miền → Tuyến
4. Super Admin đọc ví dụ minh hoạ cụ thể đính kèm trong panel

## System Flow

1. Route `/super-admin/route-config` render component `RouteConfig.tsx` (`src/platforms/super-admin/pages/RouteConfig.tsx`, dòng 200–244)
2. Trang hiển thị tiêu đề "Cấu hình Vùng & Tuyến" và mô tả tổng quan: "Định nghĩa 1 lần, dùng chung cho mọi đại lý — mọi bảng giá (GHN, 247Express, NVC khác) khi được tạo ở Agency Admin sẽ đọc đúng danh sách miền/tuyến này, không cần cấu hình lại theo từng đại lý."
3. Panel giải thích render 3 khái niệm tĩnh (không phụ thuộc dữ liệu động) kèm ví dụ minh hoạ cụ thể — không có API call hay side effect nào ở bước này

## Acceptance Criteria

**AC1:** Trang hiển thị tiêu đề "Cấu hình Vùng & Tuyến" và mô tả: "Định nghĩa 1 lần, dùng chung cho mọi đại lý — mọi bảng giá (GHN, 247Express, NVC khác) khi được tạo ở Agency Admin sẽ đọc đúng danh sách miền/tuyến này, không cần cấu hình lại theo từng đại lý."

**AC2:** Panel xanh dương "Cách tuyến được tính ra" giải thích đúng 3 khái niệm theo thứ tự:
- **Miền** — nhóm tỉnh, mỗi tỉnh thuộc đúng 1 miền
- **Cặp miền** — 2 miền ghép lại khi có đơn gửi từ tỉnh miền này đến tỉnh miền kia (kể cả cùng 1 miền)
- **Tuyến** — tên đặt cho 1 hoặc nhiều cặp miền, dùng tính giá, nhiều cặp có thể chung 1 tên

**AC3:** Panel kèm ví dụ minh hoạ cụ thể: Hà Nội → TP. Hồ Chí Minh → cặp miền "Hà Nội (Đặc biệt)" ↔ "TP. Hồ Chí Minh (Đặc biệt)" → tuyến "Liên Vùng Đặc Biệt".
