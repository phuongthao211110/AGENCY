---
id: AGA-ORDER-4
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Danh sách: Tách "Thao tác" thành cột riêng

## User Story

Là Agency Admin (Đại lý), tôi muốn nút hành động (VD: "Gửi qua 247Express") nằm ở **cột riêng cố định**, không lẫn trong cột "Người tạo", để dễ nhận biết và thao tác nhanh trên từng dòng đơn.

## User Flow

1. Agency Admin vào "Đơn hàng" → tab "Chờ xử lý"
2. Nút "Gửi qua 247Express" nằm ở cột **"Thao tác"** cuối bảng, tách biệt hoàn toàn khỏi cột "Người tạo"
3. Cột "Người tạo" chỉ còn tên người tạo + thời gian tạo, không còn nút hành động nào bên trong

## System Flow

1. `AgencyOrders.tsx` → `THead` thêm cột `'Thao tác'` (160px, cố định) sau cột "Người tạo"
2. `TRow`: chuyển nút "Gửi qua 247Express" (điều kiện `onDispatch247`) ra khỏi cell "Người tạo", đặt vào cell "Thao tác" mới
3. Không đổi điều kiện hiển thị nút (`onDispatch247` chỉ truyền khi `activeTab === 'pending_247'`) — chỉ đổi vị trí render

## Acceptance Criteria

**AC1:** Bảng "Đơn hàng" có cột header "Thao tác" riêng, nằm sau cột "Người tạo".

**AC2:** Cột "Người tạo" chỉ còn 2 dòng: tên người tạo, "Tạo lúc {ngày}" — không còn nút nào bên trong.

**AC3:** Nút "Gửi qua 247Express" chỉ hiện ở cột "Thao tác" khi đơn đang ở tab "Chờ xử lý" — các tab khác cột này để trống, không đổi điều kiện hiển thị so với trước.

**AC4:** Bấm nút vẫn mở đúng modal "Xác nhận gửi qua 247Express" như cũ, không đổi hành vi.

## Notes

- Thuần tuý thay đổi vị trí hiển thị (tách cột), không đổi logic dispatch/điều kiện hiển thị nút.
