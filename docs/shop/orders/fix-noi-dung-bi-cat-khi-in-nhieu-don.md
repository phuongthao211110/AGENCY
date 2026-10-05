---
id: SHOP-ORDER-39
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - In đơn hàng: Fix nội dung bị cắt khi in nhiều đơn

## User Story

Là chủ shop chọn in nhiều đơn cùng lúc (hoặc in 1 đơn nội dung dài), tôi muốn bản in ra giấy có đủ tất cả thẻ đã chọn — không bị mất các đơn sau đơn đầu tiên — để không phải in lại từng đơn riêng lẻ.

## User Flow

1. Chọn ≥2 đơn hàng trong danh sách → bấm "In vận đơn" (xem [SHOP-ORDER-26](./danh-sach-them-button-in-don-hang.md))
2. Modal "In đơn hàng" mở — xem trước hiển thị đủ tất cả thẻ trong vùng cuộn
3. Bấm "In {N} đơn" → trình duyệt mở hộp thoại in
4. Print preview của trình duyệt hiện đủ tất cả N thẻ, không bị cắt
5. Bấm in → giấy ra đủ toàn bộ đơn theo khổ giấy đã cài đặt (xem [SHOP-ORDER-15](./in-don-hang-chon-kho-giay.md))

## System Flow

1. Root cause: div gốc của `PrintOrderModal` (`src/platforms/shop/pages/Orders.tsx`) có CSS `transform: translate(-50%, -50%)` để căn giữa màn hình + `overflow: hidden` + `maxHeight: 85vh`. Theo spec CSS, `transform` tạo một containing block mới cho phần tử `position: fixed` con — do đó `#print-order-area { position: fixed; inset: 0 }` trong `@media print` neo theo khung modal (480px × tối đa 85vh, đang có `overflow: hidden`) thay vì neo theo trang in thật. Mọi nội dung vượt khung (đơn thứ 2 trở đi, hoặc phần cuối đơn dài) bị `overflow: hidden` cắt mất vĩnh viễn — không cuộn lại được, không có cảnh báo.
2. Fix — thêm `id="print-modal-root"` vào div gốc modal; mở rộng CSS `@media print` trong `Orders.tsx`:
   - `#print-modal-root { position: static !important; transform: none !important; overflow: visible !important; max-height: none !important; box-shadow: none !important; }`
   - `#print-order-area { position: static !important; }`
   Neutralize containing block và clipping của ancestor lúc in; nội dung chảy tự nhiên theo flow tài liệu, trình duyệt xuất đủ tất cả thẻ ra giấy.
3. Chỉ CSS trong `@media print` thay đổi — UI modal khi xem thường (nền tối, bo góc, bóng đổ, `overflow: hidden` cuộn xem trước) không bị ảnh hưởng.
4. Verify (Playwright, viewport 1400×700, emulate `media: print`): trước fix — in 4 đơn (3 Hàng hoá + 1 Thư), `#print-order-area` có `scrollHeight` thật = 1602px nhưng bounding box chỉ 480×292.5px; chỉ hiện 1 phần đơn đầu tiên (dừng giữa dòng "Sản phẩm"), 3 đơn còn lại mất hoàn toàn. Sau fix — `document.documentElement.scrollHeight` = 1511px (đủ toàn bộ nội dung), tất cả 4 đơn hiện đầy đủ trong print preview.
5. Test bổ sung sau fix: in 2 kiện từ tính năng tách kiện ([SHOP-ORDER-38](./tach-kien-theo-san-pham.md)) — `scrollHeight` = 853px, cả 2 thẻ hiện đủ, không mất thẻ nào.

## Acceptance Criteria

**AC1:** In 1 đơn → thẻ in hiện đầy đủ nội dung, không bị cắt giữa chừng.

**AC2:** In ≥2 đơn → tất cả thẻ hiện đủ trong print preview của trình duyệt, số thẻ khớp đúng số đơn đã chọn.

**AC3:** Nội dung thẻ từ đơn thứ 2 trở đi (người nhận, sản phẩm, khối lượng, COD, phí ship, barcode/QR) hiện đầy đủ — không bị cắt tại ranh giới 85vh của modal.

**AC4:** Print preview của trình duyệt có `document.documentElement.scrollHeight` đủ chứa toàn bộ thẻ (không còn bị kẹp bằng chiều cao viewport).

**AC5:** UI modal khi xem thường (nền tối, bo góc, bóng đổ, cuộn xem trước) không bị ảnh hưởng — chỉ CSS in `@media print` thay đổi.

**AC6:** Kết hợp với tính năng tách kiện ([SHOP-ORDER-38](./tach-kien-theo-san-pham.md)): bật tách kiện cho đơn 2 sản phẩm → 2 thẻ kiện đều hiện đầy đủ trong bản in, không mất kiện nào.

## Notes

- Lỗi tồn tại ở bất kỳ lần in ≥2 đơn nào (hoặc 1 đơn đủ dài), KHÔNG phải do tính năng tách kiện ([SHOP-ORDER-38](./tach-kien-theo-san-pham.md)) gây ra — lỗi có trước khi tính năng đó được thêm vào. Lý do sửa cùng phiên: tách kiện ngay lập tức bị compound bug này (tách càng nhiều kiện càng dễ mất nội dung), buộc phải sửa cùng lúc để tính năng mới demo được.
- Root cause là hành vi spec của CSS (`transform` tạo containing block cho `position: fixed` con), không phải bug trình duyệt. Neutralize ở `@media print` là cách fix đúng — không thay đổi cấu trúc HTML hay cách modal hiển thị thường.
- Liên quan: [SHOP-ORDER-22](./in-don-hang-hang-hoa-in-van-don.md) (In vận đơn Hàng hoá), [SHOP-ORDER-24](./in-don-hang-thu-tai-lieu-in-van-don.md) (In vận đơn Thư tài liệu).
