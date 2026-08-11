---
id: SHOP-ORDER-10
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Đơn hàng - Chi tiết: Xác nhận yêu cầu hoàn hàng

## Bối cảnh

Nút **"Hoàn hàng"** đã có sẵn ở cả bảng đơn hàng (quick action) và chi tiết đơn (card hành động), hiện khi `isReturnEligible(order)` đúng (đơn ở status `redelivery`, hoặc log gần nhất là `DELIVERY_FAIL`/`WAITING_TO_RETURN`) — nhưng nút này **chưa có `onClick`**, bấm vào không làm gì cả. Nút "Hoàn hàng" ở bảng thực chất chỉ mở chi tiết đơn (`onReturn` → mở drawer), không thực hiện hành động hoàn hàng nào.

## User Story

Là Shop, khi đơn giao lại thất bại nhiều lần (hoặc đang chờ xác nhận giao lại), tôi muốn chủ động yêu cầu **hoàn hàng** thay vì tiếp tục chờ giao lại — bấm "Hoàn hàng" ở chi tiết đơn phải thực sự chuyển đơn sang trạng thái hoàn hàng, không phải nút chết.

## User Flow

1. Đơn ở tab "Chờ xác nhận giao lại" (hoặc có log giao thất bại) → cả ở bảng và chi tiết đơn đều có nút **"Hoàn hàng"** (cam nhạt).
2. Ở chi tiết đơn, bấm "Hoàn hàng" → hiện khối cảnh báo cam: *"Bạn chắc chắn muốn yêu cầu hoàn hàng đơn này? Đơn sẽ chuyển sang trạng thái 'Đang hoàn hàng' — nhà vận chuyển sẽ chuyển hoàn về địa chỉ trả hàng đã đăng ký."* kèm 2 nút **"Không hoàn hàng"** / **"Xác nhận hoàn hàng"**.
3. Bấm "Xác nhận hoàn hàng" → đơn chuyển `status: 'returning'`, đóng chi tiết đơn, đơn rời tab "Chờ xác nhận giao lại", xuất hiện ở tab **"Đã bàn giao - Đang hoàn hàng"**.
4. Bấm "Không hoàn hàng" → quay lại card hành động bình thường, không đổi gì.

## System Flow

1. Thêm state `confirmingReturn` (song song với `confirmingCancel` đã có) trong `OrderDetailDrawer`, reset khi đổi đơn.
2. `confirmReturnOrder()`: gọi `updateOrder(order.id, { status: 'returning' })` — dùng chung hàm `updateOrder()` đã có, không cần store function mới; đóng drawer + `onUpdated?.()` sau khi xác nhận, giống pattern `confirmCancelOrder()`.
3. Nút "Hoàn hàng" trong card hành động (view mode, không editMode) đổi từ không có `onClick` → `onClick={() => setConfirmingReturn(true)}`.
4. Thêm nhánh `confirmingReturn` vào hàng nút (song song `editMode`/`confirmingCancel`): 2 nút "Không hoàn hàng" (outline) / "Xác nhận hoàn hàng" (cam đặc, `C_ACTION`).
5. Không đổi nút "Hoàn hàng" ở bảng (`TRow`, prop `onReturn`) — vẫn chỉ mở chi tiết đơn, nơi thao tác xác nhận thật sự diễn ra.

## Acceptance Criteria

**AC1:** Đơn `isReturnEligible` → nút "Hoàn hàng" ở chi tiết đơn bấm được, hiện khối xác nhận, không còn là nút chết.

**AC2:** Bấm "Xác nhận hoàn hàng" → `order.status` đổi thành `'returning'`, đơn rời tab hiện tại, xuất hiện ở tab "Đã bàn giao - Đang hoàn hàng".

**AC3:** Bấm "Không hoàn hàng" → không đổi `order.status`, quay lại card hành động bình thường.

**AC4:** Đơn không `isReturnEligible` → không hiện nút "Hoàn hàng" ở cả bảng và chi tiết đơn (không đổi so với trước).

**AC5:** Đơn Thư đang ở `isLetterReturnCase` (AGA-ORDER-16/SHOP-ORDER-8) → không bị ảnh hưởng, vì 2 điều kiện (`isReturnEligible` vs `isLetterReturnCase`) không trùng status.

## Notes

- Đây là nút đã tồn tại từ trước (không phải feature hoàn toàn mới) — chỉ bổ sung `onClick` + luồng xác nhận còn thiếu, theo đúng pattern `confirmingCancel`/"Huỷ đơn" đã có sẵn trong cùng component.
- Không thêm log entry vào `order.log[]` cho hành động này (khác với dữ liệu log GHN thật) — giữ tối giản, khớp cách `confirmCancelOrder()` cũng không ghi log.
- Đơn sau khi chuyển `returning` đi theo đúng luồng đã build trước đó: nếu tiếp tục hoàn thành công (`status: 'failed'`) sẽ vào tab "Hoàn tất" theo AGA-ORDER-17; nếu là đơn Thư do đại lý gửi hộ, áp dụng luôn badge/luồng giao hoàn ở AGA-ORDER-16/SHOP-ORDER-8.
- Chưa xử lý: gọi API carrier thật để yêu cầu hoàn hàng (ngoài phạm vi prototype, chỉ đổi status nội bộ).
