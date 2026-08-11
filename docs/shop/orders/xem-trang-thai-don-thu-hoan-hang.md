---
id: SHOP-ORDER-8
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [SHOP] Đơn hàng - Xem trạng thái đơn Thư hoàn hàng, phân biệt rõ "chưa về tay" và "đã về tay"

## Bối cảnh — vì sao cần bước này

Đơn **Thư, tài liệu** do **đại lý** gửi hộ qua 247Express (xem [AGA-ORDER-15](../../agency-admin/orders/tao-don-thu-thay-shop.md)) — khi hoàn hàng, hàng vật lý về tay **đại lý** trước, không tự về thẳng shop.

**Vấn đề nếu không xử lý:** shop nhìn đơn ở tab "Đang hoàn hàng"/"Hoàn tất" (status `returning`/`failed`) mà không có gì phân biệt thêm, dễ hiểu lầm là **hàng đã ở trong tay mình** — trong khi thực tế hàng vẫn đang ở đại lý, chờ đại lý giao lại (xem [AGA-ORDER-16](../../agency-admin/orders/hoan-hang-don-thu-giao-lai-shop.md), phía đại lý xác nhận việc này).

## User Story

Là Shop, khi đơn Thư của tôi bị hoàn hàng, tôi cần biết rõ **hàng đã thật sự về tay tôi hay chưa** — không chỉ dựa vào status đơn (`Đang hoàn hàng`/`Hoàn tất`) dễ gây hiểu lầm — để tôi biết khi nào cần chủ động liên hệ nếu chưa nhận được hàng.

## User Flow

1. Mở đơn Thư đang ở tab "Đang hoàn hàng"/"Hoàn tất" (đã được đại lý dispatch qua 247Express) → bảng đơn hàng hiện badge vàng **"Chưa về tay bạn"** ngay dưới địa chỉ nhận.
2. Mở chi tiết đơn → khối cảnh báo vàng: *"Chưa về tay bạn — Đơn đang được hoàn về, vui lòng chờ cập nhật thêm."* — **không có nút hành động nào** ở đây (chỉ đại lý xác nhận được, vì chỉ đại lý biết đúng lúc nào hàng thật sự về tay shop).
3. Ngay khi đại lý xác nhận đã giao lại hàng (bên ngoài, xem AGA-ORDER-16) → không cần tải lại trang thủ công gì đặc biệt, mở lại/refresh trang là thấy ngay badge/khối cảnh báo đổi thành xanh: **"Đã về tay bạn"** / *"Đã về tay bạn lúc [ngày giờ]"*.

Text phía Shop **giữ đơn giản, không nhắc gì đến "đại lý"/"NVC"** — shop chỉ cần biết trạng thái đơn của chính mình, không cần biết ai đang giữ hàng ở giữa.

Nút **"Huỷ đơn"**/**"Cập nhật"** thông thường ở card hành động cũng **bị ẩn hẳn** trong suốt thời gian đơn ở trạng thái này (dù đã đại lý xác nhận hay chưa) — huỷ/sửa 1 đơn đã dispatch và đang hoàn hàng không còn hợp lý về nghiệp vụ.

## System Flow

1. Đọc field `returnHandoverAt: string | null` trên `Order` (`orderStore.ts`) — field này do phía Agency ghi (xem AGA-ORDER-16), Shop chỉ đọc, không viết.
2. Hàm điều kiện `isLetterReturnCase(order)` (duplicate riêng trong `Orders.tsx` theo convention của dự án): đúng khi `sendKind === 'letter' && dispatchStatus === 'dispatched' && status ∈ {'returning','cancelled','failed'}`.
3. Vì `orderStore.ts` dùng chung `localStorage` key `ghn_orders_v1` giữa 2 platform, Shop thấy ngay kết quả xác nhận của đại lý mà không cần đồng bộ backend nào.
4. Badge trong bảng và khối cảnh báo trong chi tiết đơn đọc trực tiếp `isLetterReturnCase(order)` + `order.returnHandoverAt` — không có action nào ghi field này từ phía Shop.
5. Nút "Huỷ đơn"/"Cập nhật"/"Hoàn hàng" (toàn bộ hàng nút, kể cả khi đang `editMode`/`confirmingCancel`) chỉ render khi `!isLetterReturnCase(order)`.

## Acceptance Criteria

**AC1:** Đơn Hàng hoá (`sendKind: 'goods'`) không hiện badge/khối cảnh báo này.

**AC2:** Đơn Thư bị huỷ TRƯỚC khi đại lý dispatch (`dispatchStatus` vẫn `pending_agency`) không hiện badge này.

**AC3:** Đơn Thư đã dispatch, đang `returning`/`cancelled`/`failed`, `returnHandoverAt` còn `null` → badge vàng "Chưa về tay bạn" trong bảng, khối vàng trong chi tiết đơn — **không có nút/action nào**, chỉ đọc.

**AC4:** Ngay khi đại lý xác nhận (AGA-ORDER-16) → badge/khối đổi xanh "Đã về tay bạn" — không cần shop làm gì, không có action nào phía shop cho toàn bộ luồng này.

**AC5:** Toàn bộ text phía Shop không chứa từ "đại lý" hoặc "NVC" ở cả badge và khối cảnh báo.

**AC6:** Đơn đang `isLetterReturnCase` (dù `returnHandoverAt` null hay đã có giá trị) → không hiện nút "Huỷ đơn"/"Cập nhật"/"Hoàn hàng" ở card hành động. Đơn khác không bị ảnh hưởng.

## Notes

- Tách riêng từ story ban đầu (AGA-ORDER-16, từng gộp cả 2 platform) theo yêu cầu trực tiếp: tách 2 user story riêng cho Agency và Shop.
- Wording giữ đơn giản, không nhắc "đại lý"/"NVC" theo phản hồi trực tiếp: *"tôi muốn gợi ý về đơn shop đều đơn giản không nói gì tới đại lý"*.
- Không có action nào ở Shop cho luồng này — thiết kế có chủ đích, vì chỉ đại lý biết chính xác thời điểm giao vật lý thật, shop không tự xác nhận được.
- **Bổ sung sau khi xem demo:** ban đầu "Huỷ đơn"/"Cập nhật" vẫn hiện song song với khối cảnh báo — theo phản hồi trực tiếp, đã bỏ hẳn 2 nút này khi đơn đang ở luồng hoàn hàng.
- **Đổi wording lần 2:** ban đầu badge dùng "Đang chuyển hoàn"/"Đã nhận lại hàng hoàn" — trùng/lẫn với dòng trạng thái chung mới thêm ("Đang hoàn hàng" cho status `returning`, cùng màu vàng) gây hiểu lầm. Đổi sang **"Chưa về tay bạn"/"Đã về tay bạn"** — tách hẳn khỏi từ vựng "hoàn hàng"/"chuyển hoàn" dùng cho trạng thái vận chuyển chung, đúng bản chất badge này là nói về việc hàng đã tới tay chưa (custody), không phải trạng thái vận chuyển.
