---
id: SHOP-ORDER-7
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [SHOP] Đơn hàng - Chi tiết: Huỷ đơn và Cập nhật thông tin đơn

## User Story

Là chủ shop, tôi muốn huỷ đơn hoặc sửa thông tin đơn ngay từ drawer chi tiết, để tự xử lý các trường hợp nhập sai hoặc cần huỷ mà không phải liên hệ ai khác.

## User Flow

1. Ở drawer chi tiết đơn, tab "Thông tin đơn", bấm **"Cập nhật"** → các trường chuyển thành ô nhập viền xanh: Bên nhận (tên, SĐT, địa chỉ), Khối lượng, COD, Trạng thái, Phí ship
2. Card tổng tiền cập nhật live theo giá trị đang sửa; có dòng nhắc "Đang sửa thông tin đơn..."
3. Bấm **"Lưu thay đổi"** → lưu vào `orderStore`, quay về hiển thị bình thường với dữ liệu mới
4. Bấm **"Huỷ"** (thay cho "Cập nhật" lúc đang sửa) → bỏ hết thay đổi đang nhập, không lưu gì
5. Nút **"Huỷ đơn"** (nút riêng, không phải "Huỷ" của chế độ sửa) CHỈ hiện khi đơn còn `status: 'pending'` HOẶC `status: 'pickup'` ("Đơn nháp"/"Chờ xử lý"/"Chờ bàn giao" — `isCancellable`, xem SHOP-ORDER-21 và AGA-ORDER-23) — đơn đã THỰC SỰ rời khỏi shop (`in_transit` trở đi) KHÔNG còn nút này trong drawer, khớp đúng quy tắc đang áp dụng ở nút huỷ nhanh/huỷ hàng loạt trong danh sách.
6. Bấm "Huỷ đơn" (khi đủ điều kiện) → hiện cảnh báo đỏ "Bạn chắc chắn muốn huỷ đơn này? Thao tác này không thể hoàn tác." kèm 2 nút "Không huỷ"/"Xác nhận huỷ đơn"
7. Bấm "Xác nhận huỷ đơn" → đơn chuyển trạng thái "Đơn huỷ", drawer tự đóng

## System Flow

1. `OrderDetailDrawer` (Web Shop, `Orders.tsx`) thêm state `editMode`/`draft` (giống Agency) và `confirmingCancel` (boolean, riêng cho luồng huỷ)
2. Field sửa ánh xạ đúng field thật của `Order`: `receiverName/receiverPhone/receiverAddress`, `weight` (nhập kg, lưu nhân 1000 ra gram), `cod`, `fee`, `status`
3. "Lưu thay đổi" → gọi `updateOrder(order.id, patch)` (hàm dùng chung `orderStore.ts`, đã thêm trước đó cho Agency) → `onUpdated()` refresh cả `orders` và `selectedOrder`
4. "Xác nhận huỷ đơn" → gọi `cancelOrder(order.id)` (hàm có sẵn từ trước, đã dùng ở nút huỷ nhanh trong danh sách tab "Chờ xử lý") → `onUpdated()` → `onClose()` đóng drawer
5. `editMode` và `confirmingCancel` loại trừ nhau — đang sửa thì không hiện được cảnh báo huỷ và ngược lại
6. Nút "Huỷ đơn" bọc trong `{isCancellable(order) && (...)}` (hàm dùng CHUNG với danh sách/bulk-cancel — xem SHOP-ORDER-21) — TRƯỚC ĐÂY nút này không có điều kiện gì, cho huỷ được ở BẤT KỲ `status` nào kể cả đơn đã dispatch/đã thanh toán, khác hẳn quy tắc `isCancellable` áp dụng ở mọi nơi khác trong app (xem Notes).
7. `isCancellable(o) = o.status === 'pending' || o.status === 'pickup'` (xem AGA-ORDER-23) — KHÔNG kèm điều kiện `sendKind`/`carrierCode`, áp dụng chung cho mọi loại đơn Hàng hoá lẫn Thư.

## Acceptance Criteria

**AC1:** Bấm "Cập nhật" → field liệt kê ở User Flow bước 1 chuyển thành ô nhập được, có dòng cảnh báo nhỏ.

**AC2:** Sửa xong bấm "Lưu thay đổi" → dữ liệu lưu đúng vào `orderStore`, danh sách + drawer hiển thị đúng giá trị mới (VD: đổi Trạng thái → đơn chuyển đúng tab).

**AC3:** Bấm "Huỷ" khi đang sửa → bỏ hết thay đổi, không lưu gì vào `orderStore`.

**AC4:** Bấm "Huỷ đơn" → hiện đúng cảnh báo xác nhận (nền đỏ nhạt), có 2 lựa chọn rõ ràng, không huỷ ngay lập tức khi bấm lần đầu.

**AC4b:** Nút "Huỷ đơn" CHỈ hiện khi `order.status === 'pending'` HOẶC `order.status === 'pickup'` (`isCancellable`) — mở drawer của đơn đang giao/đã xong/đã huỷ (từ `in_transit` trở đi) thì KHÔNG thấy nút này (dù trước đây vẫn hiện được, xem Notes).

**AC5:** Bấm "Không huỷ" → quay về trạng thái bình thường, đơn không đổi gì.

**AC6:** Bấm "Xác nhận huỷ đơn" → `order.status` đổi thành `'cancelled'`, đơn chuyển sang tab "Đơn huỷ", drawer tự đóng.

## Notes

- **Mở rộng phạm vi (sau khi đã thêm guard `isCancellable`)**: ban đầu `isCancellable` chỉ cho `status === 'pending'`. Theo yêu cầu trực tiếp, đã mở rộng thêm `status === 'pickup'` ("Chờ bàn giao") — áp dụng chung cho MỌI loại đơn (Hàng hoá GHN lẫn Thư 247Express), không giới hạn riêng loại nào. Thay đổi này nằm ở đúng 1 hàm `isCancellable()` dùng chung, nên tự động áp dụng cho CẢ nút trong drawer này LẪN nút nhanh trong bảng/huỷ hàng loạt (SHOP-ORDER-21) mà không cần sửa thêm nơi nào khác. Xem [AGA-ORDER-23](../../agency-admin/orders/huy-don-trang-thai-da-tiep-nhan.md) để biết chi tiết đầy đủ + lý do đổi phạm vi.
- **GAP đã sửa (phát hiện khi review logic huỷ đơn đã thanh toán)**: nút "Huỷ đơn" trong drawer chi tiết TRƯỚC ĐÂY không có điều kiện `isCancellable` nào — khác với mọi lối huỷ đơn khác trong app (nút nhanh trong bảng, nút huỷ hàng loạt, nút "Huỷ đơn" trong drawer chi tiết bên Agency Admin) đều chỉ cho huỷ khi `status === 'pending'`. Hậu quả: Shop có thể huỷ 1 đơn ĐÃ dispatch/đang giao/ĐÃ ĐƯỢC ĐẠI LÝ XÁC NHẬN THANH TOÁN qua đúng đường này, lách qua quy tắc áp dụng ở mọi nơi khác — huỷ xong thì rơi đúng vào trường hợp "Đã huỷ · Chờ hoàn tiền" (xem SHOP-ORDER-47) mà đáng lẽ không nên xảy ra dễ dàng như vậy (huỷ đơn đã thanh toán nên là trường hợp hiếm, không phải thao tác 1-click tuỳ tiện). Đã sửa: bọc nút trong `isCancellable(order) &&`, khớp đúng quy tắc chung.
- Tái sử dụng đúng `updateOrder()`/`cancelOrder()` đã có sẵn trong `orderStore.ts` — không tạo cơ chế lưu riêng cho Web Shop, đảm bảo Agency và Shop luôn thao tác trên cùng 1 nguồn dữ liệu nhất quán.
- Phạm vi field sửa được giữ giống hệt Agency (AGA-ORDER-12) — không thêm sửa cho card "Sản phẩm"/"Phụ phí" vì các card này vẫn hiển thị dữ liệu tĩnh/demo, không có field tương ứng trên `Order`.
- Khác với Agency: Web Shop **không có** field "Đơn vị vận chuyển" trong form sửa (agency mới là bên quyết định carrier khi dispatch), và có thêm nút "Huỷ đơn" thật với xác nhận 2 bước — trong khi Agency (AGA-ORDER-12) hiện tại nút "Huỷ đơn" **vẫn còn là gap chưa hoạt động**. Đây là 2 story riêng biệt, không đối xứng hoàn toàn giữa 2 platform ở thời điểm này.
- Nút huỷ nhanh sẵn có trong danh sách (cột thao tác, tab "Chờ xử lý") dùng chung `cancelOrder()` — không đổi logic đó, chỉ thêm điểm vào mới từ chi tiết đơn.
