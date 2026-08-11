---
id: AGA-ORDER-16
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Xác nhận đã giao hoàn đơn Thư cho shop

## Bối cảnh — vì sao cần bước này

Đơn **Thư, tài liệu** (`sendKind: 'letter'`) do **đại lý** trực tiếp gửi hộ shop qua 247Express (xem [AGA-ORDER-15](./tao-don-thu-thay-shop.md) và luồng agency-mediated dispatch) — khác với đơn **Hàng hoá** (`sendKind: 'goods'`), shop tự gửi thẳng qua GHN.

Do đại lý là người trực tiếp giao hàng cho nhà vận chuyển (247Express), khi đơn Thư **hoàn hàng** (giao không thành công, chuyển hoàn), **hàng vật lý quay về tay đại lý trước** — không tự động về thẳng shop như đơn Hàng hoá.

**Vấn đề nếu không xử lý:** `order.status` chuyển thành `'returning'`/`'failed'` — y hệt cách hiển thị của đơn Hàng hoá. Nếu chỉ nhìn status, không có gì phân biệt "hàng đã hoàn về shop thật" với "hàng vẫn ở đại lý, chưa giao lại" — đại lý cần 1 cách rõ ràng để tự theo dõi và đánh dấu đã hoàn tất bước giao vật lý này.

Xem thêm phía Shop (Shop nhìn thấy gì trong lúc này) ở [SHOP-ORDER-8](../../shop/orders/xem-trang-thai-don-thu-hoan-hang.md).

## User Story

Là Agency Admin, khi đơn Thư mà tôi gửi hộ shop bị hoàn hàng, tôi cần 1 cách rõ ràng để đánh dấu đã giao hoàn hàng vật lý lại cho shop, để tôi tự theo dõi được đơn nào đã xử lý xong, đơn nào còn cần giao lại — và để dữ liệu này lan sang đúng cho Shop biết (xem SHOP-ORDER-8).

## User Flow

1. Mở 1 đơn Thư đang ở tab "Đang hoàn hàng" hoặc "Hoàn tất" (đã từng dispatch qua 247Express, đang `returning`/`failed`) → bảng đơn hàng hiện badge vàng **"Hàng hoàn đang ở đại lý"** ngay dưới tên shop.
2. Mở chi tiết đơn → card hành động hiện khối cảnh báo vàng: *"Đơn thư đã chuyển hoàn — hàng đang ở đại lý, chưa về tay shop. Đại lý cần trực tiếp giao lại hàng cho shop rồi bấm xác nhận."* kèm nút **"Xác nhận đã giao hoàn cho shop"**.
3. Sau khi đại lý đã vật lý giao hàng lại cho shop, bấm nút xác nhận → khối cảnh báo đổi sang màu xanh: *"Đại lý đã giao hoàn hàng cho shop lúc [ngày giờ]"*, badge trong bảng cũng đổi thành **"Đã giao hoàn cho shop"** (xanh).
4. Nút **"Huỷ đơn"**/**"Cập nhật"** thông thường ở dưới card hành động **bị ẩn hẳn** trong suốt thời gian đơn ở trạng thái này (dù đã xác nhận hay chưa) — huỷ/sửa 1 đơn đã dispatch và đang hoàn hàng không còn hợp lý về nghiệp vụ.

## System Flow

1. Thêm field mới `returnHandoverAt: string | null` vào `Order` (`orderStore.ts`) — `null` mặc định, ghi timestamp khi đại lý xác nhận đã giao hoàn vật lý cho shop.
2. Hàm điều kiện `isLetterReturnCase(order)`: đúng khi `sendKind === 'letter' && dispatchStatus === 'dispatched' && status ∈ {'returning','cancelled','failed'}` — loại trừ trường hợp đơn Thư bị huỷ TRƯỚC khi dispatch (chưa từng ra khỏi đại lý nên không có bước giao hoàn vật lý nào cả).
3. Nút "Xác nhận đã giao hoàn cho shop" gọi `updateOrder(orderId, { returnHandoverAt: new Date().toISOString() })` — dùng chung hàm `updateOrder()` đã có, không cần thêm store function mới.
4. `returnHandoverAt` được ghi vào `localStorage` (`ghn_orders_v1`) — dùng chung giữa Agency và Shop, nên Shop tự đọc được ngay (xem SHOP-ORDER-8), Agency không cần gọi API/thông báo gì thêm.
5. Badge trong bảng và khối cảnh báo trong chi tiết đơn đều đọc trực tiếp `isLetterReturnCase(order)` + `order.returnHandoverAt` — không thêm state riêng, không thêm tab mới.
6. Nút "Huỷ đơn"/"Cập nhật" (toàn bộ hàng nút, kể cả khi đang `editMode`) chỉ render khi `!isLetterReturnCase(order)` — ẩn hẳn cho case hoàn hàng, không disable/greyed-out.

## Acceptance Criteria

**AC1:** Đơn Hàng hoá (GHN, `sendKind: 'goods'`) không bị ảnh hưởng — không hiện badge/khối cảnh báo này, dù cùng ở tab "Đang hoàn hàng"/"Hoàn tất".

**AC2:** Đơn Thư bị huỷ TRƯỚC khi dispatch (`dispatchStatus` vẫn `pending_agency`) không hiện badge này — vì hàng chưa từng ra khỏi đại lý.

**AC3:** Đơn Thư đã dispatch, đang `returning`/`cancelled`/`failed`, `returnHandoverAt` còn `null` → bảng và chi tiết đơn hiện đúng badge/khối vàng "chưa về tay shop", kèm nút xác nhận.

**AC4:** Bấm "Xác nhận đã giao hoàn cho shop" → `returnHandoverAt` được ghi nhận ngay, badge/khối đổi xanh, không cần tải lại trang.

**AC5:** Không đổi `order.status`/tab hiện có — `returnHandoverAt` là 1 field cờ độc lập, không phải trạng thái mới, không thêm tab mới trong danh sách đơn hàng.

**AC6:** Đơn đang `isLetterReturnCase` (dù `returnHandoverAt` null hay đã có giá trị) → không hiện nút "Huỷ đơn"/"Cập nhật" ở card hành động. Đơn khác (Hàng hoá, hoặc Thư ở trạng thái bình thường) không bị ảnh hưởng — vẫn hiện đủ 2 nút.

## Notes

- Xuất phát từ câu hỏi thực tế của đại lý: "nếu đơn hoàn hàng thành công trên agency thì đại lý phải cầm đơn đó giao cho shop thì chỗ đó sẽ xử lý thế nào" — trước đó hệ thống hoàn toàn chưa có field/UI nào cho bước này.
- Chọn phương án "cờ đơn giản" (không thêm status/tab mới) theo đúng yêu cầu của đại lý.
- `isLetterReturnCase()` duplicate ở cả `AgencyOrders.tsx` và `Orders.tsx` theo convention duplication của dự án (các hàm riêng theo platform không share code).
- Không có migration cho field mới — `returnHandoverAt` là optional (`?: string | null`), các đơn cũ tự hiểu là `undefined`/`null` (mặc định "chưa giao hoàn").
- Tách riêng khỏi story ban đầu (từng gộp cả 2 platform) theo yêu cầu trực tiếp — xem [SHOP-ORDER-8](../../shop/orders/xem-trang-thai-don-thu-hoan-hang.md) cho phần Shop.
- **Bổ sung sau khi xem demo:** ban đầu "Huỷ đơn"/"Cập nhật" vẫn hiện song song với khối cảnh báo giao hoàn — đại lý phản hồi trực tiếp yêu cầu bỏ hẳn 2 nút này khi đơn đang ở luồng hoàn hàng, vì huỷ/sửa 1 đơn đã dispatch và đang hoàn không hợp lý về nghiệp vụ.
- **Bug seed data phát hiện khi đại lý báo "không thấy đơn nào được hoàn":** `migrateOrder()` (`orderStore.ts`) trước đây ép cứng `sendKind: 'goods'`/`carrierCode: 'GHN'` cho MỌI đơn trong `orders.json`, khiến không đơn nào trong seed data có thể là đơn Thư — feature này chỉ demo được qua đơn tự seed tạm vào `localStorage`. Đã fix `migrateOrder()` để giữ nguyên `sendKind`/`dispatchStatus`/`carrierCode` nếu seed data đã khai báo, và thêm 1 đơn thật (`ORD034`, `247EX00987654`, status `failed`) vào `orders.json`.
- **Backfill cho browser đã có `localStorage` cũ:** `loadOrders()` trước đây chỉ reseed từ `orders.json` khi `localStorage` HOÀN TOÀN rỗng — browser đã mở app trước đó (đã có `ghn_orders_v1`) sẽ không tự thấy đơn mới thêm vào `orders.json` sau này (như `ORD034`). Đã thêm bước backfill: mỗi lần `loadOrders()`, so khớp id giữa dữ liệu đã lưu và `orders.json`, bù thêm đơn base còn thiếu (không đụng đơn đã có/đã sửa) — không cần xoá `localStorage` nữa, đơn mới tự xuất hiện ngay lần load kế tiếp.
