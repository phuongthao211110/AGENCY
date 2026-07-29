---
id: SHOP-ORDER-6
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [SHOP] Đơn hàng - Chi tiết: Banner trạng thái đơn thư đang chờ đại lý

## User Story

Là chủ shop, khi xem chi tiết 1 đơn thư đang ở trạng thái "Chờ xử lý", tôi muốn thấy rõ đơn của mình đang chờ đại lý xử lý (chưa gửi nhà vận chuyển), để không nhầm là đơn bị treo hoặc quên xử lý.

## User Flow

1. Ở trang "Đơn hàng", vào tab "Chờ xử lý" → bấm mã đơn 1 đơn thư → drawer chi tiết mở ra
2. Ở cuối cột phải (cạnh khối "Tổng phí vận chuyển"/"Tổng thu khách hàng"), thấy banner xanh: **"Đơn thư đã gửi tới đại lý"** kèm mô tả "Đang chờ đại lý chọn hub và gửi qua nhà vận chuyển — bạn sẽ thấy trạng thái cập nhật ở đây khi đại lý xử lý xong."
3. Banner chỉ mang tính thông báo — không có nút thao tác (shop không tự chọn hub hay tự gửi carrier được, việc đó do đại lý làm)
4. Sau khi đại lý xác nhận gửi qua 247Express, đơn chuyển tab khác, banner này không còn hiển thị

## System Flow

1. `OrderDetailDrawer` (Web Shop, `Orders.tsx`) — Action card thêm điều kiện hiển thị: `order.sendKind === 'letter' && order.dispatchStatus === 'pending_agency'`
2. Banner dùng đúng màu/style (`#EFF6FF` nền, `#BFDBFE` viền, chữ `#1D4ED8`) như banner tương ứng ở `AgencyOrders.tsx` (đại lý) — đồng bộ visual language giữa 2 platform cho cùng 1 trạng thái đơn
3. Khác biệt có chủ đích so với bên đại lý: banner shop **không có nút hành động** — bên đại lý có nút "Chọn hub & Gửi qua 247Express" vì đại lý là bên thực hiện dispatch; shop chỉ theo dõi trạng thái, không có quyền chọn hub/gửi carrier

## Acceptance Criteria

**AC1:** Mở chi tiết 1 đơn thư có `dispatchStatus === 'pending_agency'` → banner xanh hiển thị đúng nội dung, đúng vị trí (trong Action card, phía trên nhóm nút Huỷ đơn/Hoàn hàng/Cập nhật).

**AC2:** Mở chi tiết đơn hàng hoá, hoặc đơn thư đã được đại lý dispatch (`dispatchStatus === 'dispatched'`) → KHÔNG hiển thị banner này.

**AC3:** Banner không chứa bất kỳ nút bấm nào — thuần thông báo trạng thái, không cho phép shop tự thao tác dispatch.

**AC4:** Visual style (màu nền, viền, màu chữ) khớp với banner tương ứng bên Agency Admin (`AgencyOrders.tsx`) cho cùng điều kiện đơn.

## Notes

- Đây là phần bổ sung để UI đơn thư ở Web Shop nhất quán với UI đơn thư ở Agency Admin — cả 2 bên cùng hiển thị đúng 1 sự thật (đơn đang ở đâu trong luồng agency-mediated dispatch), chỉ khác nhau ở quyền hành động (đại lý dispatch được, shop chỉ xem).
- Tham chiếu: banner bên Agency được thêm ở [xac-nhan-gui-247express-bat-buoc-chon-hub.md](../../agency-admin/orders/xac-nhan-gui-247express-bat-buoc-chon-hub.md) (AGA-ORDER-1) — cùng 1 phiên làm việc, cùng điều kiện dữ liệu (`sendKind === 'letter' && dispatchStatus === 'pending_agency'`).
- Không đổi field "Trạng thái" hiển thị ở card "Thông tin đơn hàng" (vẫn dùng `log[0]?.status_name || order.status`, hiện show raw `"pending"` khi chưa có log) — gap này đã tồn tại giống nhau ở cả 2 platform trước khi có thay đổi này, không thuộc phạm vi task này.
