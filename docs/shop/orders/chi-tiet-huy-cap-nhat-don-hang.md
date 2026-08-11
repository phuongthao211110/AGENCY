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
5. Bấm **"Huỷ đơn"** (nút riêng, không phải "Huỷ" của chế độ sửa) → hiện cảnh báo đỏ "Bạn chắc chắn muốn huỷ đơn này? Thao tác này không thể hoàn tác." kèm 2 nút "Không huỷ"/"Xác nhận huỷ đơn"
6. Bấm "Xác nhận huỷ đơn" → đơn chuyển trạng thái "Đơn huỷ", drawer tự đóng

## System Flow

1. `OrderDetailDrawer` (Web Shop, `Orders.tsx`) thêm state `editMode`/`draft` (giống Agency) và `confirmingCancel` (boolean, riêng cho luồng huỷ)
2. Field sửa ánh xạ đúng field thật của `Order`: `receiverName/receiverPhone/receiverAddress`, `weight` (nhập kg, lưu nhân 1000 ra gram), `cod`, `fee`, `status`
3. "Lưu thay đổi" → gọi `updateOrder(order.id, patch)` (hàm dùng chung `orderStore.ts`, đã thêm trước đó cho Agency) → `onUpdated()` refresh cả `orders` và `selectedOrder`
4. "Xác nhận huỷ đơn" → gọi `cancelOrder(order.id)` (hàm có sẵn từ trước, đã dùng ở nút huỷ nhanh trong danh sách tab "Chờ xử lý") → `onUpdated()` → `onClose()` đóng drawer
5. `editMode` và `confirmingCancel` loại trừ nhau — đang sửa thì không hiện được cảnh báo huỷ và ngược lại

## Acceptance Criteria

**AC1:** Bấm "Cập nhật" → field liệt kê ở User Flow bước 1 chuyển thành ô nhập được, có dòng cảnh báo nhỏ.

**AC2:** Sửa xong bấm "Lưu thay đổi" → dữ liệu lưu đúng vào `orderStore`, danh sách + drawer hiển thị đúng giá trị mới (VD: đổi Trạng thái → đơn chuyển đúng tab).

**AC3:** Bấm "Huỷ" khi đang sửa → bỏ hết thay đổi, không lưu gì vào `orderStore`.

**AC4:** Bấm "Huỷ đơn" → hiện đúng cảnh báo xác nhận (nền đỏ nhạt), có 2 lựa chọn rõ ràng, không huỷ ngay lập tức khi bấm lần đầu.

**AC5:** Bấm "Không huỷ" → quay về trạng thái bình thường, đơn không đổi gì.

**AC6:** Bấm "Xác nhận huỷ đơn" → `order.status` đổi thành `'cancelled'`, đơn chuyển sang tab "Đơn huỷ", drawer tự đóng.

## Notes

- Tái sử dụng đúng `updateOrder()`/`cancelOrder()` đã có sẵn trong `orderStore.ts` — không tạo cơ chế lưu riêng cho Web Shop, đảm bảo Agency và Shop luôn thao tác trên cùng 1 nguồn dữ liệu nhất quán.
- Phạm vi field sửa được giữ giống hệt Agency (AGA-ORDER-12) — không thêm sửa cho card "Sản phẩm"/"Phụ phí" vì các card này vẫn hiển thị dữ liệu tĩnh/demo, không có field tương ứng trên `Order`.
- Khác với Agency: Web Shop **không có** field "Đơn vị vận chuyển" trong form sửa (agency mới là bên quyết định carrier khi dispatch), và có thêm nút "Huỷ đơn" thật với xác nhận 2 bước — trong khi Agency (AGA-ORDER-12) hiện tại nút "Huỷ đơn" **vẫn còn là gap chưa hoạt động**. Đây là 2 story riêng biệt, không đối xứng hoàn toàn giữa 2 platform ở thời điểm này.
- Nút huỷ nhanh sẵn có trong danh sách (cột thao tác, tab "Chờ xử lý") dùng chung `cancelOrder()` — không đổi logic đó, chỉ thêm điểm vào mới từ chi tiết đơn.
