---
id: AGA-ORDER-29
jiraKey: 
platform: agency-admin
section: Đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Chi tiết: Xác nhận đã hoàn tiền cho Shop (đơn huỷ sau khi đã thanh toán)

## Bối cảnh

Đơn `status: 'cancelled'` mà `paymentApprovalStatus: 'confirmed'` (đại lý đã xác nhận nhận tiền TRƯỚC KHI đơn bị huỷ) từ lâu đã có nhãn hiển thị "Đã huỷ · Chờ hoàn tiền" (xem SHOP-ORDER-47) ở danh sách đơn CẢ 2 platform — nhưng đó CHỈ là nhãn, chưa từng có hành động nào để Agency Admin đánh dấu đã xử lý xong khoản hoàn đó. Story này thêm đúng hành động đó, cùng tinh thần với AGA-PAYMENT-9 (xác nhận hoàn tiền khi phí giảm sau duyệt) nhưng áp dụng cho chiều "huỷ đơn" thay vì "điều chỉnh phí".

## User Story

Là Agency Admin, sau khi đã THỰC SỰ chuyển trả phí ship cho Shop của 1 đơn đã huỷ-mà-đã-thu-tiền (ngoài hệ thống), tôi muốn xác nhận lại trong hệ thống để đơn hết hiện trạng "Chờ hoàn tiền", tránh để treo mãi 1 khoản không rõ đã xử lý hay chưa.

## User Flow

1. Mở chi tiết (drawer) 1 đơn đang hiện "Đã huỷ · Chờ hoàn tiền" ở danh sách đơn Agency Admin (bất kỳ tab nào đơn đó đang nằm, thường là "Đơn huỷ").
2. Ngay trong drawer, phía trên khối nút "Huỷ đơn"/"Cập nhật", hiện 1 khối cảnh báo **MÀU XANH DƯƠNG**: "Đơn này đã huỷ nhưng Shop đã thanh toán phí ship trước đó ({X}đ) — đại lý cần hoàn lại khoản này cho Shop." kèm nút **"Xác nhận đã hoàn tiền cho Shop"**.
3. Bấm nút → `window.confirm`: "Xác nhận đã hoàn {X}đ cho shop vì đơn này đã bị huỷ sau khi đã thanh toán?"
4. Xác nhận → khối cảnh báo xanh dương đổi thành khối **MÀU XANH LÁ**: "Đã hoàn {X}đ cho shop lúc {giờ/ngày}." — đơn KHÔNG đóng drawer, vẫn đứng nguyên tại chỗ.
5. Ở danh sách đơn (cả Agency Admin lẫn Web Shop), nhãn trạng thái đổi từ "Đã huỷ · Chờ hoàn tiền" (đỏ) thành **"Đã huỷ · Đã hoàn tiền"** (xanh lá).
6. Huỷ `window.confirm` → không có gì thay đổi, đơn vẫn ở trạng thái "Chờ hoàn tiền".
7. Shop (Web Shop) CHỈ xem được kết quả (nhãn đổi màu/chữ) — không có hành động nào ở phía Shop cho chiều này, Agency Admin mới là bên chủ động xác nhận.

## System Flow

1. `confirmCancelRefund(orderId, confirmedBy): boolean` (`orderStore.ts`, hàm MỚI): chỉ áp dụng khi đơn đang `status === 'cancelled' && paymentApprovalStatus === 'confirmed' && !cancelRefundConfirmedAt`; set `cancelRefundConfirmedAt` (ISO timestamp) + `cancelRefundConfirmedBy`, ghi `appendActionHistory(...)` vào lịch sử thao tác của đơn.
2. `Order` (orderStore.ts) thêm 2 field MỚI: `cancelRefundConfirmedAt?: string`, `cancelRefundConfirmedBy?: string` — `undefined` = chưa hoàn (trạng thái mặc định cho mọi đơn huỷ-đã-thanh-toán cũ).
3. `rowStatus()` (CẢ `AgencyOrders.tsx` lẫn `Orders.tsx` — 2 bản song song, cùng công thức): nhánh `status === 'cancelled' && paymentApprovalStatus === 'confirmed'` tách thêm theo `cancelRefundConfirmedAt` — có giá trị → `"{base.label} · Đã hoàn tiền"` (xanh lá `#16A34A`); `undefined` → `"{base.label} · Chờ hoàn tiền"` (giữ nguyên hành vi cũ, màu đỏ mặc định của `base`).
4. `handleConfirmCancelRefund()` (`AgencyOrders.tsx`'s `OrderDetailDrawer`): `window.confirm(...)` rồi gọi `confirmCancelRefund(order.id, 'Agency Admin')`, nếu `true` thì gọi `onUpdated?.()` — KHÔNG gọi `onClose()`, nên drawer không đóng lại (khác với `confirmCancelOrder()` ở NGAY TRÊN, vốn gọi cả `onUpdated()` lẫn `onClose()`).
5. Khối cảnh báo (xanh dương/xanh lá) đặt NGAY TRƯỚC khối nút "Huỷ đơn"/"Cập nhật" trong `OrderDetailDrawer` — dùng ĐÚNG pattern UI đã có sẵn cho "Xác nhận đã giao hoàn cho shop" (đơn Thư 247Express hoàn hàng vật lý) ở ngay phía trên nó trong cùng file, chỉ đổi màu/nội dung/hàm gọi.
6. Web Shop (`Orders.tsx`) KHÔNG có nút gì tương ứng — chỉ đọc `cancelRefundConfirmedAt` để đổi nhãn trong `rowStatus()`, không có UI hành động nào khác.

## Acceptance Criteria

**AC1:** Mở drawer 1 đơn đang "Đã huỷ · Chờ hoàn tiền" → hiện khối cảnh báo xanh dương + nút "Xác nhận đã hoàn tiền cho Shop", nêu đúng số tiền = `order.fee`.

**AC2:** Bấm nút → `window.confirm` nêu rõ số tiền, trước khi thực hiện.

**AC3:** Xác nhận → `cancelRefundConfirmedAt`/`cancelRefundConfirmedBy` của ĐÚNG đơn đó được set; khối cảnh báo đổi sang xanh lá "Đã hoàn {X}đ cho shop lúc {giờ}"; drawer KHÔNG đóng lại.

**AC4:** Sau khi xác nhận, nhãn trạng thái ở danh sách đơn (cả Agency Admin lẫn Web Shop) đổi từ "Đã huỷ · Chờ hoàn tiền" (đỏ) thành "Đã huỷ · Đã hoàn tiền" (xanh lá).

**AC5:** Huỷ `window.confirm` → không có gì thay đổi, đơn vẫn ở trạng thái "Chờ hoàn tiền".

**AC6:** Đơn đã `cancelRefundConfirmedAt` (đã hoàn rồi) → KHÔNG còn hiện lại khối cảnh báo/nút nào nữa, chỉ còn khối xanh lá xác nhận đã xong — không bấm hoàn lại lần 2 được.

**AC7:** Web Shop KHÔNG có nút/hành động nào cho chiều này — chỉ thấy đúng nhãn trạng thái đã đổi.

## Notes

- **Mới hoàn toàn** — trước khi có story này, nhãn "Chờ hoàn tiền" (SHOP-ORDER-47) treo VĨNH VIỄN trên mọi đơn huỷ-đã-thanh-toán, không có cách nào trong UI để đánh dấu đã xử lý xong, dù Agency Admin đã thực sự chuyển tiền lại cho Shop ngoài hệ thống.
- **PROTOTYPE THUẦN** — "Xác nhận đã hoàn tiền cho Shop" chỉ đồng bộ lại trạng thái trong hệ thống, KHÔNG có cơ chế chuyển tiền thật nào (không gọi API ngân hàng/ví điện tử). Agency Admin phải tự chuyển tiền thật NGOÀI hệ thống trước, rồi mới vào đây xác nhận lại.
- Cùng tinh thần với [AGA-PAYMENT-9](../cash-remittance/xac-nhan-hoan-tien-thua-cho-shop.md) (xác nhận hoàn tiền thừa khi PHÍ GIẢM sau duyệt) nhưng khác cơ chế lưu trữ: AGA-PAYMENT-9 tái dùng `paymentApprovedAmount` (đồng bộ xuống bằng `fee` hiện tại — vì có sẵn field số tiền để so sánh), còn story này cần field MỚI hẳn (`cancelRefundConfirmedAt`) vì đơn huỷ không có "mức phí mới" nào để đồng bộ tới — toàn bộ `fee` là khoản cần hoàn.
- **Mở rộng (cùng lúc thêm luôn vào trang "Duyệt thanh toán")**: ngoài drawer chi tiết ở danh sách "Đơn hàng" (story này), nút "Xác nhận đã hoàn" cho đúng trường hợp đơn huỷ-đã-thanh-toán CŨNG được thêm vào `OrderStatusLine` ở màn "Chi tiết" shop bên trang "Duyệt thanh toán" (xem AGA-PAYMENT-6) — vì đây mới là nơi Agency Admin thực sự làm việc đối soát tiền mặt theo shop. Cả 2 nơi dùng CHUNG đúng 1 hàm `confirmCancelRefund()` và field `cancelRefundConfirmedAt` — xác nhận ở nơi nào thì nơi còn lại cũng tự cập nhật theo, không lệch nhau.
- Xem SHOP-ORDER-47 (nguồn gốc nhãn "Chờ hoàn tiền", nay có thêm nhánh "Đã hoàn tiền"); AGA-PAYMENT-6 (màn "Chi tiết" shop bên "Duyệt thanh toán" — nơi thứ 2 cũng có đúng hành động này); AGA-ORDER-25 (tab "Đơn nháp", có trích dẫn `isCancellable`/`rowStatus`, không trực tiếp liên quan nhưng cùng khu vực code).
