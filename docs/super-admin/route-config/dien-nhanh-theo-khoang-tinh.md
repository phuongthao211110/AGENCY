---
id: GSA-ROUTE-3
jiraKey: 
platform: super-admin
section: Cấu hình Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Cấu hình Vùng & Tuyến: Điền nhanh theo khoảng tỉnh

## User Story

Là GHN Super Admin, tôi muốn gán hàng loạt tỉnh vào một miền theo khoảng địa lý Bắc → Nam để tiết kiệm thời gian so với việc gán từng tỉnh một qua chip.

## User Flow

1. Trong khối Bước 1, Super Admin thấy khu vực "Điền nhanh theo khoảng tỉnh" phía trên dải chip
2. Chọn "Từ tỉnh" từ dropdown 63 tỉnh (thứ tự Bắc → Nam)
3. Chọn "Đến tỉnh" từ cùng dropdown
4. Chọn miền đích từ dropdown miền hiện có
5. Bấm nút "Áp dụng"
6. Toàn bộ tỉnh trong khoảng (bao gồm 2 đầu) được gán vào miền đích; tỉnh đang thuộc miền khác trong khoảng tự động chuyển sang miền mới

## System Flow

1. `RouteConfig.tsx` dòng 267–311 render khu vực điền nhanh nằm trong khối Bước 1
2. `handleApplyRange` (dòng 111–123): lấy index của tỉnh "từ" và "đến" trong mảng `ALL_PROVINCES` (63 tỉnh, thứ tự file `vietnam-provinces.ts` — Bắc → Nam), tự động xác định `minIndex`/`maxIndex` không phụ thuộc thứ tự người dùng chọn trước/sau
3. Vòng lặp gọi `assignProvinceToRegion` cho từng tỉnh trong khoảng `[minIndex, maxIndex]` (gồm 2 đầu) — tỉnh đang thuộc miền khác trong khoảng tự động chuyển sang miền đích mà không cảnh báo thêm
4. Nút "Áp dụng" bị disable khi chưa chọn đủ cả 3 giá trị (từ tỉnh, đến tỉnh, miền đích)

## Acceptance Criteria

**AC1:** Khu vực điền nhanh trong Bước 1 gồm: dropdown "Từ tỉnh", dropdown "Đến tỉnh" (mỗi dropdown liệt kê đủ 63 tỉnh theo thứ tự Bắc → Nam của `vietnam-provinces.ts`), dropdown chọn miền đích, và nút "Áp dụng".

**AC2:** Nút "Áp dụng" bị disable cho đến khi chọn đủ cả 3 giá trị (từ tỉnh, đến tỉnh, miền đích).

**AC3:** Khi bấm "Áp dụng", hệ thống xác định khoảng theo index trong `ALL_PROVINCES` — không phụ thuộc thứ tự người dùng chọn "từ tỉnh" hay "đến tỉnh" trước — rồi gán toàn bộ tỉnh trong khoảng (gồm cả 2 đầu) vào miền đích.

**AC4:** Tỉnh trong khoảng đang thuộc miền khác sẽ tự động chuyển sang miền đích — không có cảnh báo hay bước xác nhận thêm.

**AC5:** Ghi chú nhỏ dưới khu vực điền nhanh: "Dựa theo thứ tự Bắc → Nam có sẵn — tỉnh đang thuộc miền khác sẽ bị chuyển sang miền vừa chọn. Chỉ để điền nhanh hàng loạt; vẫn sửa tay từng tỉnh bằng chip bên dưới cho các ngoại lệ."

**AC6:** Công cụ điền nhanh là lối tắt bổ trợ, không thay thế cơ chế gán tỉnh bằng chip — chip vẫn là cách xử lý ngoại lệ (ví dụ: 3 TP đặc biệt có ranh giới miền không trùng với thứ tự địa lý liên tục).

## Notes

- Tính năng được thêm sau khi thảo luận về cách tham chiếu một bảng định nghĩa miền theo ranh giới ("từ tỉnh X trở vào/ra") thay vì tick từng tỉnh. Quyết định cuối: KHÔNG thay thế cơ chế chip (giữ lại để xử lý ngoại lệ), chỉ thêm công cụ điền nhanh hàng loạt bổ trợ.
