---
id: AGA-ORDER-12
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Chi tiết: Cập nhật thông tin đơn (Huỷ đơn vẫn là gap)

## User Story

Là Agency Admin (Đại lý), tôi muốn sửa thông tin đơn ngay từ drawer chi tiết (tương tự quyền chỉnh sửa mà shop có khi tạo đơn), để xử lý các trường hợp shop nhập sai hoặc đại lý cần điều chỉnh đơn mà không phải thao tác bên Web Shop.

## User Flow

1. Ở drawer chi tiết đơn, tab "Thông tin đơn", bấm nút "Cập nhật" ở cuối trang
2. Các trường sửa được chuyển thành input/dropdown viền xanh: Bên nhận (tên, SĐT, địa chỉ), Khối lượng, COD, Trạng thái, Đơn vị vận chuyển, Phí ship (giá bán shop)
3. Card tổng tiền (Tổng phí vận chuyển/Tổng thu khách hàng) cập nhật live theo giá trị đang sửa
4. Bấm "Lưu thay đổi" → lưu vào `orderStore`, đóng chế độ sửa, quay về hiển thị bình thường với dữ liệu mới
5. Bấm "Huỷ" (thay cho "Cập nhật" trong lúc sửa) → bỏ hết thay đổi đang nhập, quay về hiển thị dữ liệu cũ, không lưu gì

## System Flow

1. `OrderDetailDrawer` thêm state `editMode` (boolean) và `draft` (bản nháp các field đang sửa, khởi tạo từ `order` khi bấm "Cập nhật")
2. Field sửa được ánh xạ đúng vào field thật của `Order`: `receiverName/receiverPhone/receiverAddress`, `weight` (input nhập theo kg, lưu lại nhân 1000 ra gram), `cod`, `fee`, `status`, `carrierCode`
3. Bấm "Lưu thay đổi" → gọi `updateOrder(order.id, patch)` (hàm mới trong `orderStore.ts`, merge patch vào đúng đơn theo id) → callback `onUpdated()` ở component cha: refresh cả `orders` (list) và `selectedOrder` (để drawer hiển thị đúng dữ liệu vừa lưu, không bị stale)
4. Bấm "Huỷ" lúc đang sửa → `setEditMode(false); setDraft(null)` — không gọi `updateOrder`, dữ liệu gốc giữ nguyên
5. Đổi đơn khác trong khi đang mở drawer → tự thoát `editMode`, xoá `draft` (tránh lẫn dữ liệu giữa 2 đơn)

## Acceptance Criteria

**AC1:** Bấm "Cập nhật" → các field liệt kê ở User Flow bước 2 chuyển thành ô nhập được (viền xanh `#3B82F6`), có 1 dòng cảnh báo nhỏ "Đang sửa thông tin đơn...".

**AC2:** Sửa xong bấm "Lưu thay đổi" → dữ liệu lưu đúng vào `orderStore` (kiểm tra được qua `localStorage['ghn_orders_v1']`), drawer hiển thị lại đúng giá trị mới, danh sách đơn ngoài drawer cũng cập nhật theo (VD: đổi Trạng thái sang "Hoàn tất" → đơn chuyển đúng sang tab "Hoàn tất").

**AC3:** Bấm "Huỷ" khi đang sửa (chưa lưu) → mọi thay đổi đã nhập bị bỏ, hiển thị lại đúng dữ liệu cũ, không có gì được lưu vào `orderStore`.

**AC4:** Đổi `Trạng thái`/`Đơn vị vận chuyển` là 2 dropdown chọn từ danh sách cố định (9 trạng thái tương ứng 9 tab; carrier: GHN/247Express/Chưa gửi NVC) — không phải input tự do.

**AC5 — GAP, vẫn CHƯA hoạt động:** Nút "Huỷ đơn" (khác với "Huỷ" lúc đang sửa) hiện tại **vẫn không có `onClick` handler** — bấm vào không có phản ứng gì. Đây là action riêng (huỷ toàn bộ đơn, không phải huỷ-thao-tác-sửa) chưa được implement trong lần này.

## Notes

- Phạm vi field sửa được giới hạn đúng các field **thật sự tồn tại trên `Order`** — KHÔNG thêm sửa được cho card "Sản phẩm" (Tên sản phẩm/SL/Giá bán) hay "Phụ phí", vì các card này vẫn đang hiển thị dữ liệu tĩnh/demo, không có field tương ứng trên `Order` để lưu (xem gap đã ghi ở [xem-chi-tiet-don-hang.md](./xem-chi-tiet-don-hang.md), AGA-ORDER-10) — sửa "cho có" ở đây sẽ không lưu được gì, nên không làm.
- Dòng "Trạng thái" ở card "Thông tin đơn hàng" ưu tiên hiển thị `log[0]?.status_name` nếu đơn có `log` — với đơn đã có sẵn log (dữ liệu GHN thật từ `orders.json`), sau khi sửa `Trạng thái` thành công, dòng này **vẫn hiện label cũ theo log** (không đổi ngay theo giá trị mới sửa) dù `order.status` đã lưu đúng — đây là hành vi hiển thị đã có từ trước (ưu tiên log hơn status), không phải lỗi mới sinh ra từ tính năng sửa này. Tác dụng thật của việc đổi Trạng thái thể hiện rõ nhất qua việc đơn **chuyển đúng tab** trong danh sách.
- Chỉ implement cho Agency Admin theo đúng yêu cầu — Web Shop's nút "Cập nhật" (`Orders.tsx`) vẫn giữ nguyên trạng thái GAP như trước, không đổi trong lần này.
- Đây là tiền đề cho việc đại lý tự tạo/sửa đơn hoàn chỉnh hơn trong tương lai (đại lý có thể tự lên đơn, không chỉ đại diện shop).
