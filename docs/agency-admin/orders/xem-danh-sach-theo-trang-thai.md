---
id: AGA-ORDER-6
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Danh sách: Xem đơn hàng theo trạng thái

## User Story

Là Agency Admin (Đại lý), tôi muốn xem đơn hàng của tất cả shop thuộc đại lý mình, phân theo từng trạng thái vận chuyển, để theo dõi tiến độ xử lý đơn mà không cần hỏi lại từng shop.

## User Flow

1. Agency Admin vào menu "Đơn hàng"
2. Thấy dải tab trạng thái: Đơn nháp, Chờ bàn giao, Đã bàn giao - Đang giao, Đã bàn giao - Đang hoàn hàng, Chờ xác nhận giao lại, Hoàn tất, Đơn huỷ, Hàng thất lạc - hư hỏng (không tính tab "Chờ xử lý" đã có story riêng)
3. Mỗi tab có số đếm badge màu, bấm vào tab để xem đúng danh sách đơn ở trạng thái đó
4. Chuyển tab thì bộ chọn (checkbox) đang tick bị xoá, về trang 1

## System Flow

1. `AgencyOrders.tsx` load `orders` = `loadOrders()` lọc theo `shopId` thuộc các shop của đại lý (`agencyShopIds`)
2. `ordersByTab` tính sẵn danh sách theo từng `key` tab: `draft` (`status==='pending'`, trừ đơn đang `pending_247`), `pickup`, `in_transit`, `returning`, `redelivery`, `completed` (`status==='delivered'`), `cancelled` (`'cancelled'` hoặc `'failed'`), `lost_damaged` (`'lost'` hoặc `'damaged'`)
3. Bấm tab → `setActiveTab`, `setPage(1)`, `setSelected(new Set())`

## Acceptance Criteria

**AC1:** Danh sách hiển thị đủ 8 tab trạng thái (ngoài "Chờ xử lý"), mỗi tab có badge số đếm đúng theo dữ liệu hiện có.

**AC2:** Bấm 1 tab → chỉ hiện đúng đơn thuộc trạng thái đó, thuộc các shop của đại lý đang đăng nhập (không thấy đơn của đại lý khác).

**AC3:** Tab mặc định khi vào trang là "Đơn nháp".

**AC4:** Chuyển tab → reset về trang 1, bỏ chọn mọi đơn đã tick trước đó.

## Notes

- Đơn "Đơn nháp" ở đây là đơn `status === 'pending'` nhưng KHÔNG phải đơn thư đang chờ xử lý (loại trừ qua `isPending247`) — 2 khái niệm "nháp"/"chờ xử lý" tách biệt dù cùng status gốc `pending`.
