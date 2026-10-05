---
id: AGA-ORDER-27
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGENCY] Đơn hàng - Chi tiết đơn: Redesign tab Lịch sử thao tác theo đúng UI thật

## User Story

Là Agency Admin (Đại lý), tôi muốn xem lịch sử thao tác (ai đổi gì, lúc nào) của một đơn hàng theo đúng bố cục UI thật GHN — nhóm theo ngày, hiển thị thay đổi dạng mũi tên — để tra soát đơn nhanh hơn.

## User Flow

1. Trong drawer chi tiết đơn, bấm tab "Lịch sử thao tác"
2. Danh sách nhóm theo ngày (mới nhất lên trước); mỗi nhóm có banner nền cam nhạt ghi ngày định dạng `dd/mm/yyyy`
3. Mỗi dòng gồm 4 cột: **Thời gian** | **Người thực hiện** | **Trường thay đổi** | **Nội dung thay đổi**
   - Có thay đổi thật: `giá trị cũ → **giá trị mới**` (giá trị mới in đậm)
   - Chỉ có giá trị mới (tạo mới): `→ **giá trị mới**`
   - Hành động xem/in (không đổi giá trị): `—`

## System Flow

1. `AgencyOrders.tsx` ~dòng 2263–2305: Render 4 cột (Thời gian | Người thực hiện | Trường thay đổi | Nội dung thay đổi). Dữ liệu từ `order.actionHistory[]`, nhóm theo ngày qua `actionByDate`. Banner ngày dùng chung hàm `formatDateHeader()` với tab "Lịch sử trạng thái" (xem [[AGA-ORDER-26]]).
2. Format cột Nội dung thay đổi: `oldContent === '-' && newContent === '-'` → hiện `—`; `oldContent === '-'` nhưng có `newContent` → hiện `→ <strong>newContent</strong>`; ngược lại → `oldContent → <strong>newContent</strong>`.
3. Pattern hiển thị cột "Nội dung thay đổi" đồng bộ với trang "Lịch sử đơn hàng" toàn đại lý (`AgencyOrdersHistory.tsx`, route `/agency-admin/orders/history`) — 2 nơi dùng chung 1 kiểu trình bày audit-log.
4. Schema mock data (`order.actionHistory[]`) và tất cả field liên quan không đổi — chỉ thay đổi render layer.

## Acceptance Criteria

**AC1:** Tab "Lịch sử thao tác" hiển thị đúng 4 cột: Thời gian | Người thực hiện | Trường thay đổi | Nội dung thay đổi.

**AC2:** Cột Nội dung thay đổi format đúng: `oldContent = newContent = '-'` → hiện `—`; `oldContent = '-'` có `newContent` → hiện `→ **newContent**` (bold); trường hợp còn lại → hiện `oldContent → **newContent**` (giá trị mới bold, giá trị cũ thường).

**AC3:** Nhóm theo ngày với banner nền `#FFF4ED`, format ngày `dd/mm/yyyy` (không kèm tên thứ).

**AC4:** Đơn không có `actionHistory[]` → tab hiện trạng thái rỗng, không lỗi.

## Notes

- Đây là redesign giao diện tab "Lịch sử thao tác" đã tồn tại trong `OrderDetailDrawer` — không phải tính năng mới, không thay đổi data model hay schema mock data.
- Tách ra từ 1 story ban đầu gộp chung 2 tab — xem thêm [[AGA-ORDER-26]] (tab "Lịch sử trạng thái", file `redesign-lich-su-trang-thai.md`), 2 story làm chung 1 lần sửa code cùng lúc.
- Thay thế thiết kế cũ tại AGA-ORDER-11 (`lich-su-trang-thai-thao-tac.md`) — story đó mô tả bản UI cũ: bảng 5 cột tách riêng cột cũ/mới.
- **GAP chưa làm:** Web Shop (`src/platforms/shop/pages/Orders.tsx` ~dòng 2655–3400) có modal chi tiết đơn với tab "Lịch sử thao tác" tương tự nhưng `actionByDate` còn nested thêm theo time-group — khác cấu trúc Agency Admin, chưa được đồng bộ theo thiết kế mới này.
