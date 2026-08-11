---
id: SHOP-ORDER-11
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Đơn hàng - Danh sách đơn hàng: Chờ xử lý

## Bối cảnh

Đơn **Thư, tài liệu** shop tạo qua drawer "Tạo thư, tài liệu" (hoặc import) không tự gửi thẳng nhà vận chuyển như đơn Hàng hoá — nó phải qua **đại lý** (agency-mediated dispatch): đại lý là bên trực tiếp chọn hub và gửi qua 247Express. Trong lúc chờ đại lý xử lý bước này, đơn cần 1 chỗ riêng trong danh sách để shop biết "đơn đã gửi đi rồi, đang chờ đại lý, không phải đơn nháp còn nằm im".

## User Story

Là chủ shop, tôi muốn có 1 tab riêng **"Chờ xử lý"** trong danh sách đơn hàng để thấy ngay những đơn Thư đã tạo xong và đang chờ đại lý xử lý (chưa gửi nhà vận chuyển) — tách biệt hẳn với "Đơn nháp" (chưa gửi đi đâu) và các tab đã dispatch (đã có nhà vận chuyển xử lý).

## User Flow

1. Ở trang "Đơn hàng", tab **"Chờ xử lý"** nằm ngay sau "Đơn nháp", hiện số lượng đơn đang ở trạng thái này (badge cam cạnh tên tab).
2. Bấm vào tab → chỉ hiện đơn **Thư** đã tạo (drawer hoặc import) nhưng **chưa được đại lý dispatch qua 247Express** — đơn Hàng hoá không bao giờ xuất hiện ở đây (đơn Hàng hoá luôn gửi GHN ngay khi tạo, không qua bước chờ đại lý).
3. Mỗi dòng trong tab hiện badge trạng thái **"Chờ xử lý"** (màu cam) ngay dưới mã đơn — nhất quán với cách các tab khác hiện trạng thái theo dòng, không chỉ dựa vào việc đang đứng ở tab nào.
4. Bấm vào 1 đơn → mở chi tiết, thấy banner riêng giải thích đơn đang chờ đại lý (xem [SHOP-ORDER-6](./chi-tiet-don-thu-trang-thai-cho-dai-ly.md)) — không có hành động nào shop tự làm được ở bước này.
5. Khi đại lý xác nhận chọn hub và gửi qua 247Express, đơn tự rời tab "Chờ xử lý", chuyển sang tab dispatch tương ứng (VD "Chờ bàn giao").

## System Flow

1. Điều kiện `isPendingCarrier(order)`: `order.sendKind === 'letter' && order.dispatchStatus === 'pending_agency'`.
2. `ordersByTab.pending_carrier = orders.filter(isPendingCarrier)` — tách riêng khỏi `draft` (đơn nháp thật, `status === 'pending' && !isPendingCarrier(order)`), dù cả 2 đều có `status: 'pending'` ở tầng dữ liệu.
3. Tab hiện đếm `ordersByTab.pending_carrier.length`, đặt ngay sau tab "Đơn nháp" trong danh sách tab.
4. Badge trạng thái theo dòng: hàm `rowStatus(order)` trả về `{ label: 'Chờ xử lý', color: '#F59E0B' }` khi `isPendingCarrier(order)` đúng — override ưu tiên trước khi tra `ROW_STATUS_STYLE[order.status]` (vì `status` vẫn là `'pending'` giống đơn nháp, cần override riêng để không hiện nhãn "Đơn nháp" sai).
5. Nút "Huỷ đơn" (`onCancel`) vẫn khả dụng ở tab này (`activeTab === 'pending_carrier' ? () => handleCancelOrder(order.id) : undefined` — shop huỷ được đơn Thư trước khi đại lý dispatch, không cần đại lý xác nhận gì).

## Acceptance Criteria

**AC1:** Tab "Chờ xử lý" chỉ chứa đơn `sendKind: 'letter'` có `dispatchStatus: 'pending_agency'` — không lẫn đơn Hàng hoá, không lẫn đơn Thư đã dispatch.

**AC2:** Số đếm trên tab khớp đúng số đơn thoả điều kiện `isPendingCarrier`, cập nhật ngay khi có đơn mới tạo hoặc đại lý dispatch xong (không cần tải lại trang).

**AC3:** Mỗi dòng trong tab hiện badge "Chờ xử lý" (cam) dưới mã đơn — không hiện nhãn "Đơn nháp" dù `order.status` cũng là `'pending'`.

**AC4:** Đơn ở tab này huỷ được qua nút "Huỷ đơn" trong bảng (quick action) — huỷ ngay, không cần đợi đại lý.

**AC5:** Ngay khi đại lý xác nhận dispatch (đổi `dispatchStatus` thành `'dispatched'`), đơn rời tab "Chờ xử lý" ở lần load kế tiếp — không cần thêm thao tác nào từ shop.

## Notes

- Đây là tab, khác với [SHOP-ORDER-6](./chi-tiet-don-thu-trang-thai-cho-dai-ly.md) — SHOP-ORDER-6 nói về banner trong **chi tiết** 1 đơn khi đang ở trạng thái này; story này nói về **danh sách/tab** chứa các đơn đó.
- `status: 'pending'` dùng chung cho cả "Đơn nháp" và "Chờ xử lý" ở tầng dữ liệu — 2 tab này phân biệt hoàn toàn bằng `dispatchStatus`/`sendKind`, không phải bằng `status`. Cần lưu ý khi đọc/sửa logic liên quan tới `status === 'pending'` ở bất kỳ nơi nào khác trong code, tránh gộp nhầm 2 nhóm đơn khác bản chất này.
- Phía Agency Admin có tab tương đương cùng tên "Chờ xử lý" (`isPending247`, logic giống hệt) — xem `AgencyOrders.tsx`.
