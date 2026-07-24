---
id: AGA-ORDER-3
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Danh sách: Thêm phân loại hàng hoá

## User Story

Là Agency Admin (Đại lý), tôi muốn thấy được **đơn nào là Hàng hoá, đơn nào là Thư/bưu phẩm** ngay trong danh sách "Đơn hàng", để phân biệt nhanh loại đơn khi xử lý số lượng lớn từ nhiều shop.

## User Flow

1. Agency Admin vào "Đơn hàng"
2. Cột **"Loại đơn"** (tách riêng, nằm giữa "Mã đơn hàng" và "Shop") hiển thị tag: **Hàng hoá** hoặc **Thư**
3. Áp dụng cho mọi tab trạng thái (Chờ xử lý, Đơn nháp, Chờ bàn giao...)

## System Flow

1. `AgencyOrders.tsx` → `THead` thêm cột `'Loại đơn'` (100px, cố định), `TRow` thêm cell tương ứng đọc `order.sendKind`
2. Style tag: `sendKind === 'letter'` → "Thư" (nền `#EDE9FE`, chữ `#7C3AED`); ngược lại → "Hàng hoá" (nền `#F3F4F6`, chữ `#4B5563`)
3. Khác với danh sách đơn hàng Web Shop (nơi tag gộp chung vào ô "Mã đơn hàng") — bên Agency Admin đây là **cột riêng**, vì danh sách có thêm nhiều cột khác (Shop, Loại đơn, Thao tác...) nên tách cột cho rõ ràng hơn là gộp

## Acceptance Criteria

**AC1:** Danh sách "Đơn hàng" có cột header "Loại đơn" riêng biệt, không gộp vào cột nào khác.

**AC2:** `sendKind = 'letter'` → tag "Thư" (tím). `sendKind = 'goods'` (hoặc không có giá trị) → tag "Hàng hoá" (xám).

**AC3:** Cột hiển thị đúng ở toàn bộ tab trạng thái, không chỉ riêng "Chờ xử lý".

**AC4:** Không ảnh hưởng vị trí/nội dung các cột khác (Shop, Khách hàng, Sản phẩm, Khối lượng, COD, Phí ship, GTB - TT, Người tạo, Thao tác).

## Notes

- Cùng khái niệm `sendKind` đã áp dụng ở Thiết lập NVC (`AGA-CARRIER-12/13/14`) và danh sách đơn hàng Web Shop (`SHOP-ORDER-5`) — 3 nơi dùng chung 1 field, chỉ khác cách trình bày (cột riêng vs gộp chung ô) tuỳ bối cảnh từng màn hình.
