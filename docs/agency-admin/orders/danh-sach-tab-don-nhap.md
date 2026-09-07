---
id: AGA-ORDER-25
jiraKey: 
platform: agency-admin
section: Đơn hàng
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGENCY] Đơn hàng - Danh sách đơn hàng: Đơn nháp

## User Story

Là Agency Admin (Đại lý), tôi muốn xem tab "Đơn nháp" trong danh sách đơn hàng để biết đơn nào đang ở trạng thái `pending` (chưa được xử lý gì thêm) trước khi chuyển sang các bước bàn giao/vận chuyển.

## User Flow

1. Agency Admin vào menu "Đơn hàng" → mặc định active tab **"Đơn nháp"**
2. Danh sách hiển thị các đơn `status === 'pending'` thuộc các shop của đại lý, KHÔNG bao gồm đơn Thư đang chờ đại lý xử lý (2 khái niệm khác nhau dù cùng status gốc)
3. Với mỗi đơn đủ điều kiện, có nút "Huỷ đơn" ở cột thao tác
4. Tick chọn nhiều đơn → thanh hành động hàng loạt hiện ở đáy, có nút "Huỷ đơn" cho cả lựa chọn

## System Flow

1. `AgencyOrders.tsx` dòng 2629: `ordersByTab.draft = orders.filter(o => o.status === 'pending' && !isPending247(o))` — `isPending247(o) = o.sendKind === 'letter' && o.dispatchStatus === 'pending_agency'` (dòng 2625). Tách 2 nhánh vì cùng `status: 'pending'` gốc nhưng ý nghĩa khác nhau: Hàng hoá `pending` = đơn thật sự còn "nháp"; Thư `pending` + `pending_agency` = đơn đã shop gửi, đang chờ đại lý chọn hub — nhánh này hiện ở tab "Chờ xử lý" riêng, không phải "Đơn nháp".
2. Tab mặc định khi load trang: `useState('draft')` (dòng 2563).
3. `isCancellable(o) = o.status === 'pending'` (dòng 89-91) — Đơn nháp và Chờ xử lý là 2 tab DUY NHẤT cho phép huỷ đơn theo cách này; đơn đã dispatch/đang giao không huỷ được nữa qua nút này.
4. Badge số đếm tab dùng `countColor: '#F59E0B'` (cam), icon `<FileOutlined />` (dòng 2668).
5. **Phát hiện quan trọng — hiện KHÔNG có luồng tạo đơn nào đưa đơn mới vào tab này:**
   - Đơn Hàng hoá (`CreateOrderDrawer`, Web Shop) tạo đơn với `status: 'pickup'` NGAY LẬP TỨC (`Orders.tsx` dòng 1097), kèm `dispatchStatus: 'dispatched'`, `carrierCode: 'GHN'` — bỏ qua hẳn trạng thái `pending`, vào thẳng tab "Chờ bàn giao".
   - Đơn Thư (`CreateLetterDrawer`) tạo với `status: 'pending'` nhưng `dispatchStatus: 'pending_agency'` (dòng 1638-1643) → bị loại khỏi "Đơn nháp" bởi `isPending247`, hiện ở "Chờ xử lý" thay vào đó.
   - Kết quả: 3 đơn hiện đang hiện ở tab "Đơn nháp" trong dữ liệu demo (`ORD012`, `ORD020`, `ORD028` trong `orders.json`) đều là dữ liệu SEED CŨ (không có field `dispatchStatus`/`sendKind` tường minh, được `migrateOrder()` mặc định thành Hàng hoá đã dispatch — nhưng field `status` gốc trong JSON vẫn giữ nguyên `'pending'` từ trước khi có luồng dispatch tường minh). Không có nút/hành động nào trong ứng dụng hiện tại tạo thêm đơn mới rơi vào đúng tab này.

## Acceptance Criteria

**AC1:** Tab "Đơn nháp" là tab mặc định khi vào trang "Đơn hàng".

**AC2:** Tab chỉ hiện đơn `status === 'pending'` thuộc shop của đại lý đang đăng nhập, loại trừ đơn Thư đang `pending_agency` (đơn đó thuộc tab "Chờ xử lý").

**AC3:** Mỗi đơn trong tab có nút "Huỷ đơn" — bấm được vì mọi đơn trong tab này đều thoả `isCancellable`.

**AC4:** Tick chọn nhiều đơn → thanh hành động hàng loạt hiện nút "Huỷ đơn" áp dụng cho toàn bộ lựa chọn.

**AC5 *(gap đã xác nhận)*:** Không có luồng tạo đơn nào trong ứng dụng (Web Shop `CreateOrderDrawer`/`CreateLetterDrawer`) tạo ra đơn mới rơi vào tab này — đơn Hàng hoá vào thẳng "Chờ bàn giao", đơn Thư vào "Chờ xử lý". Dữ liệu hiện có trong tab chỉ đến từ 3 đơn seed cũ (`ORD012`, `ORD020`, `ORD028`) chưa có field dispatch tường minh.

## Notes

- Tách chi tiết từ [AGA-ORDER-6](./xem-danh-sach-theo-trang-thai.md) (story tổng quan 8 tab) — story đó đã có 1 dòng note ngắn về cách tách "Đơn nháp"/"Chờ xử lý", story này đào sâu đúng riêng tab "Đơn nháp".
- **Gap đáng chú ý:** tên tab "Đơn nháp" ngụ ý đây là nơi đơn "mới tạo, chưa xử lý" sẽ xuất hiện — nhưng vì luồng tạo đơn Hàng hoá thật (`CreateOrderDrawer`) bỏ qua trạng thái `pending` hoàn toàn (tạo thẳng ở `pickup`), tab này trên thực tế không có đường vào từ bất kỳ hành động nào của shop hay đại lý hiện tại — chỉ tồn tại nhờ dữ liệu seed lịch sử. Nếu có ý định thật để đơn Hàng hoá "nháp" trước khi bàn giao (ví dụ shop lưu nháp trước khi hoàn tất), cần thêm bước tạo đơn ở trạng thái `pending` thật sự — hiện chưa có.
- Huỷ đơn ở đây (`isCancellable`) không ghi log vào `order.log[]` — khác hoàn toàn với luồng huỷ 247Express đã tiếp nhận (xem [AGA-ORDER-23](./huy-don-trang-thai-da-tiep-nhan.md)).
