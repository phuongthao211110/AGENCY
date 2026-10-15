---
id: SHOP-ORDER-47
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Nhắc hoàn tiền khi huỷ đơn đã thanh toán online

## User Story

Là chủ shop, khi một đơn đã thanh toán phí ship qua MoMo hoặc chuyển khoản bị huỷ, tôi muốn thấy nhắc nhở "Chờ hoàn tiền" trong danh sách đơn, để biết cần liên hệ đại lý hoặc GHN để được hoàn lại khoản đã trả — thay vì tưởng đơn đã huỷ là xong hẳn.

## User Flow

1. Đơn đã thanh toán online (`paymentStatus = 'paid'`) bị huỷ (`status = 'cancelled'`).
2. Trong danh sách đơn, cột trạng thái hiển thị "Đã huỷ · Chờ hoàn tiền" thay vì chỉ "Đã huỷ".
3. Đơn bị huỷ mà chưa thanh toán (`paymentStatus = 'pending'/'failed'/'not_required'`) → trạng thái chỉ là "Đã huỷ" bình thường.

## System Flow

1. `rowStatus(order)` (dòng 2484–2495): lấy base label từ `ROW_STATUS_STYLE[order.status]`.
2. Kiểm tra: `order.status === 'cancelled' && (order.paymentMethod === 'momo' || order.paymentMethod === 'bank_transfer') && order.paymentStatus === 'paid'` → trả về `{ ...base, label: \`${base.label} · Chờ hoàn tiền\` }`.
3. `TRow` (dòng 3490–3491): `rowStatus(order).label` hiển thị trong cột mã đơn/trạng thái, màu `rowStatus(order).color` (`#EF4444`).

## Acceptance Criteria

**AC1:** Đơn `status='cancelled'` + `paymentMethod='momo'/'bank_transfer'` + `paymentStatus='paid'` → nhãn trạng thái trong danh sách là "Đã huỷ · Chờ hoàn tiền", màu `#EF4444`.

**AC2:** Đơn `status='cancelled'` + `paymentMethod='cash'` → nhãn chỉ là "Đã huỷ", không có suffix.

**AC3:** Đơn `status='cancelled'` + `paymentMethod='momo'/'bank_transfer'` + `paymentStatus='pending'` hoặc `'failed'` → nhãn chỉ là "Đã huỷ" (chưa thanh toán, không cần hoàn tiền).

**AC4:** Đơn `status` khác `'cancelled'` (dù `paymentStatus = 'paid'`) → không hiện suffix "Chờ hoàn tiền".

## Notes

- **PROTOTYPE THUẦN** — không có quy trình hoàn tiền thật. Đây CHỈ là nhắc nhở hiển thị trong UI. Hệ thống không gửi request hoàn tiền đến MoMo hay ngân hàng, không tạo ticket support tự động, không tính lại công nợ đối soát.
- Chỉ áp dụng cho danh sách đơn (`TRow`). Giao diện chi tiết đơn (`OrderDetailDrawer`) không hiện suffix "Chờ hoàn tiền" — chỉ hiện trạng thái thanh toán qua `paymentBadge()`.
