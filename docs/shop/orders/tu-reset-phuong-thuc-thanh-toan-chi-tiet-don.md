---
id: SHOP-ORDER-53
jiraKey: AGENCY-1325
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Chi tiết đơn hàng: Tự reset phương thức thanh toán (ĐÃ ĐÓNG — trùng SHOP-ORDER-46)

> ⚠️ **ĐÃ ĐÓNG, KHÔNG CODE THÊM** — Sau khi triển khai SHOP-ORDER-51 (đổi phương thức thanh toán ở Chi tiết đơn), xác nhận lại: `OrderDraft`/edit mode của Chi tiết đơn hàng VẪN KHÔNG có field `feePayer` nào để sửa (chỉ có `paymentMethod` mới thêm cho SHOP-ORDER-51) — nghĩa là Shop không có cách nào đổi "ai trả ship" ngay trong Chi tiết đơn, nên "tự reset phương thức khi đổi người trả ship" KHÔNG CÓ GÌ để kích hoạt ở màn hình này. Cơ chế này THỰC SỰ chỉ tồn tại ở màn **Tạo đơn hàng** (`CreateOrderDrawer`, xem SHOP-ORDER-46) — xác nhận ticket Jira AGENCY-1325 bị gắn nhầm section "Chi tiết đơn hàng" thay vì "Tạo đơn hàng", trỏ đúng tính năng đã có sẵn ở SHOP-ORDER-46. Đóng story này, không code gì thêm cho tới khi có yêu cầu THẬT SỰ cho phép đổi `feePayer` trong Chi tiết đơn (lúc đó mới cần tính năng reset tương ứng).

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

- **ĐÃ ĐÓNG.** SHOP-ORDER-51 (đổi phương thức thanh toán ở Chi tiết đơn) đã triển khai xong nhưng CỐ Ý không thêm field `feePayer` vào `OrderDraft` (ngoài phạm vi, Shop vẫn không đổi được "ai trả ship" trong Chi tiết đơn) — nên điều kiện tiên quyết của story này vẫn chưa tồn tại, xác nhận đây đúng là trùng với SHOP-ORDER-46 (Tạo đơn hàng), không phải tính năng riêng cho Chi tiết đơn.
- Nếu sau này Product thực sự muốn cho đổi `feePayer` ngay trong Chi tiết đơn → mở lại ticket mới, lúc đó mới cần tính năng tự reset tương ứng (tái dùng đúng pattern `useEffect` đã có ở SHOP-ORDER-46).
