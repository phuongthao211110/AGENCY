---
id: AGA-ORDER-17
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Đơn hoàn hàng thành công vào tab "Hoàn tất", không phải "Đơn huỷ"

## Bối cảnh

Danh sách đơn hàng (Agency Admin và Web Shop) trước đây gộp chung 2 status khác nhau vào cùng 1 tab "Đơn huỷ":

```
cancelled: orders.filter(o => o.status === 'cancelled' || o.status === 'failed')
```

- `cancelled` = đại lý/shop **chủ động huỷ** đơn
- `failed` = giao hàng không thành công → **hoàn hàng thành công** — đây là 1 kết quả xử lý xong, không phải huỷ

Theo mapping trạng thái GHN thật đã xác nhận với đại lý ([AGA-RECON-4](../reconciliation/mapping-trang-thai-doi-soat-ghn.md)), **"Hoàn hàng thành công" thuộc nhóm "Kết thúc — chốt so khớp"**, cùng nhóm với "Giao hàng thành công" — tức đây là 1 nhánh **hoàn tất**, khác nhánh giao hàng nhưng cùng bản chất "đã xử lý xong", không phải "huỷ đơn".

## User Story

Là Agency Admin/Shop, tôi muốn đơn hoàn hàng thành công (`status: 'failed'`) nằm ở tab "Hoàn tất" — đúng bản chất "đã xử lý xong lô hàng" — thay vì lẫn vào tab "Đơn huỷ" cùng với các đơn bị huỷ chủ động, để không nhầm lẫn 2 loại kết quả khác nhau.

## System Flow

1. `ordersByTab` (cả `AgencyOrders.tsx` và `Orders.tsx`): `completed` nhận thêm `status === 'failed'`; `cancelled` chỉ còn `status === 'cancelled'`.
2. Agency: `STATUS_GROUPS` (dùng cho filter checkbox ở modal Xuất đơn hàng) — nhóm "Hoàn tất" nhận thêm `match: ['delivered', 'failed']`; nhóm "Đơn huỷ" chỉ còn `match: ['cancelled']`.
3. Agency: `ORDER_STATUS_LABELS['failed']` đổi từ `'Đơn huỷ'` → `'Đã hoàn hàng'` — để nhãn xuất Excel (`buildExportRows`) phản ánh đúng bản chất, không còn gọi chung là "Đơn huỷ" với đơn bị huỷ chủ động.
4. Không đổi `isLetterReturnCase()` (badge/action giao hoàn đơn Thư, xem [AGA-ORDER-16](./hoan-hang-don-thu-giao-lai-shop.md)) — vẫn match cả `returning`/`cancelled`/`failed`, vì badge đó theo dõi **ai đang giữ hàng vật lý**, độc lập với việc đơn hiện tab nào. Ảnh hưởng duy nhất: đơn Thư `status: 'failed'` giờ hiện badge đó ở tab "Hoàn tất" thay vì "Đơn huỷ".

## Acceptance Criteria

**AC1:** Đơn `status: 'failed'` (bất kỳ carrier/loại đơn) → hiện ở tab "Hoàn tất", không còn ở tab "Đơn huỷ", ở cả Agency Admin và Web Shop.

**AC2:** Đơn `status: 'cancelled'` không đổi gì — vẫn ở tab "Đơn huỷ" như trước.

**AC3:** Modal Xuất đơn hàng (Agency) — filter checkbox "Hoàn tất" giờ xuất cả đơn `delivered` và `failed`; filter "Đơn huỷ" chỉ xuất đơn `cancelled`. Nhãn cột "Trạng thái" trong file xuất cho đơn `failed` hiện "Đã hoàn hàng", không còn "Đơn huỷ".

**AC4:** Badge "Hàng hoàn đang ở đại lý"/"Đang chuyển hoàn" (AGA-ORDER-16) vẫn hiện đúng cho đơn Thư `failed`, chỉ khác là bây giờ nằm trong tab "Hoàn tất" thay vì "Đơn huỷ".

## Notes

- Xuất phát từ phản hồi trực tiếp của đại lý khi xem demo AGA-ORDER-16: "bình thường thì đã hoàn hàng hoặc hoàn hàng thành công là nằm ở tab hoàn tất" — đối chiếu lại đúng với mapping GHN thật đã có sẵn ở AGA-RECON-4.
- Áp dụng cho **toàn bộ đơn** (Hàng hoá và Thư, cả 2 platform) theo lựa chọn của đại lý — không chỉ giới hạn ở luồng đơn Thư của AGA-ORDER-16.
- `EDIT_STATUS_OPTIONS` (dropdown đổi trạng thái tay ở chi tiết đơn) hiện chưa có option `'failed'` — gap có sẵn từ trước, ngoài phạm vi thay đổi này (không ai chọn tay được trạng thái này qua UI, chỉ tồn tại sẵn trong mock data).
- "Trạng thái" hiển thị trong tab "Chi tiết đơn" (`log[0]?.status_name || order.status`) đang đọc theo log GHN thật (nếu có) hoặc rơi về raw `order.status` — không dùng `ORDER_STATUS_LABELS` — gap hiển thị có sẵn từ trước, ngoài phạm vi thay đổi này.
