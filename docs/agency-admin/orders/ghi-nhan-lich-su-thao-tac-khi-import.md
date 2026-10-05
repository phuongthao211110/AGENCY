---
id: AGA-ORDER-28
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGENCY] Đơn hàng - Nhập đơn hàng: Ghi nhận lịch sử thao tác khi import

## User Story

Là Agency Admin (Đại lý), tôi muốn mỗi đơn hàng được tạo qua luồng import hàng loạt đều có dòng lịch sử thao tác khởi tạo — ghi rõ ai thực hiện, vào lúc nào, hành động gì — để khi nhân viên tra soát tab "Lịch sử thao tác" trong chi tiết đơn hoặc xem trang "Lịch sử đơn hàng" toàn đại lý, đơn import không bị xuất hiện trống rỗng như đơn chưa từng có thao tác nào.

## User Flow

1. Agency Admin tải file Excel, upload lên trang `/agency-admin/orders/import`, review bảng và bấm "Nhập N đơn hợp lệ"
2. Sau khi import thành công, mở chi tiết bất kỳ đơn vừa import → bấm tab "Lịch sử thao tác"
3. Thấy đúng 1 dòng lịch sử: thời gian import, người thực hiện "Agency Admin (import)", hành động "Nhập đơn hàng (import)", cột nội dung thay đổi hiện `—`
4. Vào trang "Lịch sử đơn hàng" (`/agency-admin/orders/history`), tìm theo mã đơn vừa import
5. Đơn xuất hiện với cùng nội dung dòng lịch sử nói trên

## System Flow

1. Người dùng bấm "Nhập N đơn hợp lệ" — `handleConfirm()` trong `AgencyOrdersImport.tsx` được gọi
2. Trước khi bắt đầu vòng lặp `validRows.forEach(...)`, `now = new Date()` được khởi tạo một lần duy nhất — mọi đơn trong cùng 1 lần import dùng chung timestamp này
3. Với mỗi `validRow`, `addOrder()` được gọi với field `actionHistory` gồm đúng 1 entry:
   ```ts
   actionHistory: [{
     date: createdAt,                          // fmtDateInput(now) → "YYYY-MM-DD"
     time: now.toTimeString().slice(0, 8),     // "HH:MM:SS"
     operator: 'Agency Admin (import)',         // khớp với dispatchedBy bên dưới
     action: 'Nhập đơn hàng (import)',
     oldContent: '-',
     newContent: '-',
   }]
   ```
4. Tab "Lịch sử thao tác" trong `AgencyOrders.tsx` nhóm `order.actionHistory[]` theo ngày qua `actionByDate`, render 4 cột (Thời gian / Người thực hiện / Trường thay đổi / Nội dung thay đổi); khi `oldContent === '-' && newContent === '-'` thì cột "Nội dung thay đổi" hiện `—`
5. Trang `AgencyOrdersHistory.tsx` (`/agency-admin/orders/history`) gộp `actionHistory[]` từ mọi đơn trong store để build feed lịch sử toàn đại lý; đơn import có entry nên đóng góp đúng 1 dòng vào feed

## Acceptance Criteria

**AC1:** Mỗi đơn hàng được tạo qua import hàng loạt phải có đúng 1 entry trong `actionHistory[]` ngay từ lúc tạo — không được để mảng rỗng.

**AC2:** Entry lịch sử import có các giá trị cố định: `operator = 'Agency Admin (import)'`, `action = 'Nhập đơn hàng (import)'`, `oldContent = '-'`, `newContent = '-'`; `date` theo định dạng `YYYY-MM-DD` và `time` theo định dạng `HH:MM:SS` của thời điểm bấm "Nhập".

**AC3:** Tab "Lịch sử thao tác" trong modal chi tiết đơn (drawer) hiển thị đúng dòng lịch sử này — nhóm theo ngày, cột "Nội dung thay đổi" hiện `—` khi cả `oldContent` lẫn `newContent` đều là `'-'`.

**AC4:** Trang "Lịch sử đơn hàng" (`/agency-admin/orders/history`) hiển thị đơn vừa import với cùng nội dung dòng lịch sử nói trên — đơn import không bị vắng mặt khỏi feed lịch sử toàn đại lý.

**AC5:** Tất cả đơn trong cùng 1 lần bấm "Nhập" có cùng giá trị `time` (dùng chung biến `now` tạo trước vòng lặp) — đây là hành vi đúng, phản ánh đây là 1 hành động batch duy nhất.

**AC6:** Đơn Hàng hoá và đơn Thư được import trong cùng 1 lần đều có entry lịch sử, không phân biệt loại đơn.

## Notes

- **Root cause trước fix:** `handleConfirm()` truyền `actionHistory: []` khi gọi `addOrder()` — mảng rỗng khiến đơn import không có dòng nào trong tab "Lịch sử thao tác" và không xuất hiện trong trang "Lịch sử đơn hàng" (trang đó chỉ gộp entry có thật, không gộp mảng rỗng).
- **Chuỗi `operator` đồng bộ:** `'Agency Admin (import)'` tái dùng đúng giá trị đã có sẵn ở field `dispatchedBy` ngay bên dưới trong cùng hàm — đảm bảo nhất quán tên "ai thực hiện" giữa hai field mà không hardcode thêm hằng số mới.
- **Gap chưa fix — Web Shop:** `CreateOrderDrawer` và `CreateLetterDrawer` trong `src/platforms/shop/pages/Orders.tsx` vẫn gọi `addOrder()` với `actionHistory: []` rỗng — cùng root cause nhưng khác platform, nằm ngoài phạm vi yêu cầu lần này.
- **Timestamp batch:** tất cả đơn trong 1 lần import có cùng `time` (giây), không phân biệt thứ tự xử lý từng dòng — chấp nhận được vì đây đúng là 1 hành động duy nhất, không phải N hành động riêng lẻ.
