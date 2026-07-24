---
id: AGA-ORDER-9
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Danh sách: Phân trang

## User Story

Là Agency Admin (Đại lý), tôi muốn xem danh sách đơn hàng theo từng trang, có thể đổi số dòng mỗi trang và nhảy nhanh tới trang bất kỳ, để duyệt qua danh sách lớn thuận tiện.

## User Flow

1. Cuối bảng có bộ điều khiển phân trang: chọn số dòng mỗi trang (50/100), các nút số trang, nút về trang đầu/cuối, ô "Đi đến trang số"
2. Bấm số trang hoặc gõ số vào ô "Đi đến trang số" rồi Enter → nhảy đúng trang đó

## System Flow

1. `Pagination` component: "Hiển thị" chỉ có 2 lựa chọn 50/100, bấm là đảo giá trị (không phải dropdown nhiều lựa chọn)
2. Danh sách số trang: hiện đủ nếu tổng số trang ≤ 7, ngược lại hiện 3 trang đầu + dấu "..." + 3 trang cuối
3. Ô "Đi đến trang số": nhận Enter, chỉ nhảy nếu giá trị nhập là số nguyên hợp lệ trong khoảng [1, tổng số trang]

## Acceptance Criteria

**AC1:** Mặc định hiển thị 50 dòng/trang.

**AC2:** Bấm chọn "100" → hiển thị 100 dòng/trang, tính lại tổng số trang.

**AC3:** Tổng số trang ≤ 7 → hiện đủ số nút trang. Nhiều hơn 7 → hiện 3 trang đầu, dấu "...", 3 trang cuối.

**AC4:** Gõ số hợp lệ vào ô "Đi đến trang số" rồi Enter → nhảy đúng trang đó. Gõ số ngoài phạm vi hoặc không phải số → không nhảy trang.

**AC5:** Nút về trang đầu/trang cuối luôn nhảy đúng trang 1 / trang cuối cùng.

## Notes

- Không có tuỳ chọn số dòng/trang nào khác ngoài 50 và 100 (không phải dropdown mở rộng như 20/50/100/200).
