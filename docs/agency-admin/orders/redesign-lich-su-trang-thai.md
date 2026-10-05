---
id: AGA-ORDER-26
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGENCY] Đơn hàng - Chi tiết đơn: Redesign tab Lịch sử trạng thái theo đúng UI thật

## User Story

Là Agency Admin (Đại lý), tôi muốn xem lịch sử trạng thái vận chuyển của một đơn hàng theo đúng bố cục UI thật GHN — nhóm theo ngày, tô màu theo kết quả giao hàng — để nhận biết ngay đơn đang giao thành công, thất bại hay trung tính mà không cần đọc từng dòng chữ.

## User Flow

1. Trong drawer chi tiết đơn, bấm tab "Lịch sử trạng thái"
2. Danh sách log nhóm theo ngày (mới nhất lên trước); mỗi nhóm có banner nền cam nhạt ghi ngày định dạng `dd/mm/yyyy`
3. Mỗi dòng log gồm 3 cột: **Thời gian** (giờ:phút) | **Trạng thái** | **Chi tiết**
   - Dòng giao thành công: cả cột Trạng thái và Chi tiết tô xanh lá bold
   - Dòng giao thất bại: cột Trạng thái giữ đen; cột Chi tiết hiện 2 dòng — tên trạng thái (đen) + "Lý do: ..." (cam)
   - Dòng trung tính: Chi tiết hiện ghi chú hoặc tên trạng thái, kèm tên kho màu xám
4. Không còn thanh thống kê "Số lần lấy / Giao / Hoàn" và không còn badge "Hành động"

## System Flow

1. `AgencyOrders.tsx` ~dòng 2196–2260: Render 3 cột (Thời gian | Trạng thái | Chi tiết). Dữ liệu từ `order.log[]`, nhóm theo ngày qua `logByDate` (đã có sẵn từ trước). Hàm `formatDateHeader()` sửa lại bỏ `weekday: 'long'`, chỉ còn format `dd/mm/yyyy`. Banner ngày: `background: '#FFF4ED'`, text đen bold, full-width.
2. Logic tô màu: `isSuccess = item.status_name.includes('thành công') && !item.status_name.includes('không thành công')` → cả cột Trạng thái và Chi tiết tô `#059669` bold. `isFailure = item.action === 'DELIVERY_FAIL'` → cột Trạng thái giữ đen; cột Chi tiết: dòng 1 = `item.status_name` (đen), dòng 2 = `"Lý do: " + item.note` màu `#EA580C` — chỉ render dòng 2 khi `item.note` tồn tại. Các dòng trung tính: Chi tiết = `item.note || item.status_name`, đen thường, kèm `· item.warehouse_name` màu `#6B7280` nếu có.
3. Không còn render phần thống kê (`num_pick` / `num_deliver` / `num_return`) và không còn `ACTION_LABEL` / `ACTION_COLOR` badge trong tab này.
4. Schema mock data (`order.log[]`) và tất cả field liên quan không đổi — chỉ thay đổi render layer.

## Acceptance Criteria

**AC1:** Tab "Lịch sử trạng thái" hiển thị đúng 3 cột: Thời gian (giờ:phút) | Trạng thái | Chi tiết — không còn cột "Hành động" (badge), không còn thanh thống kê Số lần lấy/Giao/Hoàn.

**AC2:** Các dòng log nhóm theo ngày (mới nhất lên trước); mỗi nhóm có banner nền `#FFF4ED`, ngày hiển thị format `dd/mm/yyyy` (không kèm tên thứ).

**AC3:** Dòng giao thành công (`status_name` chứa "thành công" và không chứa "không thành công") → cả cột Trạng thái lẫn Chi tiết tô màu `#059669` bold.

**AC4:** Dòng giao thất bại (`action === 'DELIVERY_FAIL'`) → cột Trạng thái giữ màu đen thường; cột Chi tiết hiện 2 dòng: dòng 1 = tên trạng thái (đen), dòng 2 = "Lý do: {note}" màu `#EA580C`. Dòng 2 chỉ xuất hiện khi `item.note` có giá trị.

**AC5:** Đơn không có `log[]` → tab hiện trạng thái rỗng, không lỗi.

## Notes

- Đây là redesign giao diện tab "Lịch sử trạng thái" đã tồn tại trong `OrderDetailDrawer` — không phải tính năng mới, không thay đổi data model hay schema mock data.
- Tách ra từ 1 story ban đầu gộp chung 2 tab — xem thêm [[AGA-ORDER-27]] (tab "Lịch sử thao tác", file `redesign-lich-su-thao-tac.md`), 2 story làm chung 1 lần sửa code cùng lúc.
- Thay thế thiết kế cũ tại AGA-ORDER-11 (`lich-su-trang-thai-thao-tac.md`) — story đó mô tả bản UI cũ: bảng 4 cột + thanh thống kê.
- **GAP chưa làm:** Web Shop (`src/platforms/shop/pages/Orders.tsx` ~dòng 2655–3400) có modal chi tiết đơn với tab "Lịch sử trạng thái" tương tự nhưng code hoàn toàn tách riêng, chưa được đồng bộ theo thiết kế mới này.
- Schema `GHNLogEntry` hiện không có field tên nhân viên/người cập nhật trạng thái → cột Chi tiết không hiện "Nhân viên cập nhật: ..." như ảnh mẫu GHN gốc. Cần bổ sung field khi làm hệ thống thật.
