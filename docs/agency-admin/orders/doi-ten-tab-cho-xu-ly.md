---
id: AGA-ORDER-2
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Danh sách: Đổi tên tab "Chờ gửi 247Express" thành "Chờ xử lý"

## User Story

Là Agency Admin (Đại lý), tôi muốn tên tab hiển thị trạng thái đơn chờ xử lý **giống với tên tab bên Web Shop**, để không bị lẫn lộn khi trao đổi với shop về cùng 1 đơn đang ở trạng thái nào.

## User Flow

1. Agency Admin vào "Đơn hàng"
2. Tab trước đây tên "Chờ gửi 247Express" nay đổi thành **"Chờ xử lý"** — cùng tên với tab bên Web Shop cho đúng đơn đó
3. Nội dung/điều kiện lọc của tab không đổi — vẫn là các đơn thư đang `pending_agency`

## System Flow

1. `AgencyOrders.tsx` → mảng `TABS`: đổi `label` của tab có `key: 'pending_247'` từ `'Chờ gửi 247Express'` sang `'Chờ xử lý'`
2. `key` giữ nguyên `'pending_247'` — không đổi logic lọc (`isPending247`), không đổi bất kỳ điều kiện nào khác, chỉ đổi chữ hiển thị

## Acceptance Criteria

**AC1:** Tab đầu tiên trong danh sách "Đơn hàng" (Agency Admin) hiển thị chữ "Chờ xử lý", không còn "Chờ gửi 247Express".

**AC2:** Số đếm (badge cam) và nội dung lọc của tab không đổi — vẫn đúng các đơn thư `sendKind === 'letter' && dispatchStatus === 'pending_agency'`.

**AC3:** Tên tab này khớp với tên tab "Chờ xử lý" đang có sẵn bên Web Shop (`Orders.tsx`) cho cùng nhóm đơn.

## Notes

- Thuần tuý đổi label hiển thị, không đổi `key`/logic/data — rủi ro thấp.
