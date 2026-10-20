---
id: SHOP-ORDER-53
jiraKey: AGENCY-1325
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Chi tiết đơn hàng: Tự reset phương thức thanh toán

> ⚠️ **CHƯA IMPLEMENT / NGHI NGỜ TRÙNG TICKET** — Đã rà soát toàn bộ `OrderDetailDrawer` trong `Orders.tsx`: `useEffect` DUY NHẤT trong component này chỉ reset state UI cục bộ (tab đang chọn, edit mode, draft...) khi CHUYỂN SANG xem đơn khác — không có logic nào tự reset `paymentMethod` khi sửa đơn. Cơ chế "tự reset phương thức thanh toán khi đổi người trả ship" THỰC SỰ đang tồn tại chỉ ở màn **Tạo đơn hàng** (`CreateOrderDrawer`, xem SHOP-ORDER-46) — rất có thể ticket Jira AGENCY-1325 này là bị gắn nhầm section "Chi tiết đơn hàng" thay vì "Tạo đơn hàng", trỏ tới đúng tính năng đã mô tả ở SHOP-ORDER-46. Story này giữ lại để khớp đúng số ticket, nhưng đề xuất XÁC NHẬN LẠI với Product trước khi code bất kỳ thứ gì mới.

## User Story (giả định theo đúng tên ticket)

Là chủ shop đang sửa 1 đơn nháp trong Chi tiết đơn hàng, nếu tôi đổi người trả phí ship từ "Shop trả" sang "Khách trả", tôi muốn phương thức thanh toán online đã chọn trước đó tự động bị xoá/reset, để tránh đơn được lưu có dữ liệu thanh toán không khớp với người trả ship.

## User Flow (dự kiến — PHỤ THUỘC vào SHOP-ORDER-51 được triển khai trước)

1. Điều kiện tiên quyết: Chi tiết đơn hàng phải CÓ sẵn khả năng đổi `feePayer`/`paymentMethod` trong edit mode (tính năng này CHƯA CÓ — xem SHOP-ORDER-51, cũng đang ở trạng thái "chưa implement").
2. Giả sử SHOP-ORDER-51 đã có: Shop đang sửa đơn, đã chọn MoMo/CK, rồi đổi người trả ship sang "Khách trả ship".
3. Hệ thống tự động reset `paymentMethod` về `'cash'`, xoá lựa chọn online đã chọn trong draft.
4. Picker thanh toán trong draft ẩn đi (vì người trả ship không còn là Shop).

## System Flow (dự kiến — chưa code, phụ thuộc SHOP-ORDER-51)

1. Cần 1 `useEffect` tương tự bản đã có trong `CreateOrderDrawer` (xem SHOP-ORDER-46: `if (effectiveFeePayer === 'receiver' && paymentMethod !== 'cash') { reset về cash }`), nhưng áp dụng cho `draft.feePayer`/`draft.paymentMethod` bên trong `OrderDetailDrawer` thay vì state cục bộ của form tạo đơn.
2. Phụ thuộc hoàn toàn vào việc `OrderDraft` có field `feePayer`/`paymentMethod` hay chưa (xem SHOP-ORDER-51) — nếu SHOP-ORDER-51 không được triển khai, ticket này KHÔNG THỂ triển khai vì không có gì để "reset".

## Acceptance Criteria (dự kiến)

**AC1:** (Phụ thuộc SHOP-ORDER-51) Trong edit mode của Chi tiết đơn, đổi người trả ship sang "Khách trả ship" trong lúc đang có `paymentMethod` online → tự reset về `'cash'`.

**AC2:** Reset không tự lưu — chỉ áp dụng cho `draft` cục bộ, Shop vẫn phải bấm "Lưu thay đổi" để ghi nhận.

## Notes

- **GAP — CHƯA CÓ TRONG CODE**, và nhiều khả năng là ticket bị gắn nhầm section. Khuyến nghị: xác nhận lại với Product xem ticket AGENCY-1325 có thực sự muốn mô tả 1 tính năng MỚI trong Chi tiết đơn hàng, hay chỉ là cùng 1 tính năng đã có ở Tạo đơn hàng (SHOP-ORDER-46) nhưng gắn nhầm section lúc tạo ticket.
- Nếu xác nhận là trùng → nên đóng/liên kết ticket này với SHOP-ORDER-46 thay vì code thêm 1 lần nữa.
- Nếu xác nhận là tính năng THỰC SỰ mới cho Chi tiết đơn → phải làm SHOP-ORDER-51 (Đổi phương thức thanh toán ở Chi tiết đơn) TRƯỚC, vì không có field để reset nếu chưa có field để đổi.
