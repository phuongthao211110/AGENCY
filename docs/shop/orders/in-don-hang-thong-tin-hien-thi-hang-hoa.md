---
id: SHOP-ORDER-19
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Đơn hàng - In đơn hàng - Hàng hoá: Thông tin hiển thị trên phiếu in

## User Story

Là chủ shop gửi đơn Hàng hoá, tôi muốn chọn đúng những thông tin cần in lên phiếu vận đơn, để phiếu đủ dùng cho cả đóng gói, giao hàng và thu tiền mà không in dư thông tin không cần.

## User Flow

1. Ở sub-tab "Hàng hoá" của "In đơn hàng", thấy danh sách 11 mục trong "Thông tin hiển thị trên phiếu in".
2. 2 mục đầu (Mã vận đơn+Barcode+QR, Người nhận) luôn có tick, không tắt được.
3. Tick/bỏ tick 9 mục còn lại theo nhu cầu.

## System Flow

1. Checklist đầy đủ theo đúng field thật của đơn Hàng hoá (`Order` + `CreateOrderDrawer`):
   - Luôn hiển thị: Mã vận đơn + Barcode + QR code, Người nhận (tên, SĐT, địa chỉ)
   - Tick được (mặc định): Người gửi (tên, SĐT shop) — on; Sản phẩm (tên, số lượng) — on; Khối lượng đơn hàng — on; Kích thước đơn hàng — on; Tiền thu hộ (COD) — on; Phí ship — on; Ghi chú đơn hàng — on; Mã đơn shop (mã nội bộ riêng) — off; Tên/logo shop — off
2. Mỗi mục là 1 state boolean riêng (`goodsShowSender`, `goodsShowProduct`, `goodsShowWeight`, `goodsShowSize`, `goodsShowCOD`, `goodsShowShipFee`, `goodsShowNote`, `goodsShowShopCode`, `goodsShowShopLogo`), độc lập hoàn toàn với bộ state của sub-tab Thư tài liệu ([SHOP-ORDER-20](./in-don-hang-thong-tin-hien-thi-thu.md)).

## Acceptance Criteria

**AC1:** Hiện đúng 11 mục theo đúng thứ tự: Mã vận đơn+Barcode+QR, Người nhận, Người gửi, Sản phẩm, Khối lượng, Kích thước, COD, Phí ship, Ghi chú, Mã đơn shop, Tên/logo shop.

**AC2:** 2 mục đầu luôn tick, click không đổi trạng thái, có nhãn "Luôn hiển thị".

**AC3:** Mặc định khi mở tab lần đầu: Người gửi/Sản phẩm/Khối lượng/Kích thước/COD/Phí ship/Ghi chú = tick sẵn; Mã đơn shop/Tên logo shop = chưa tick.

**AC4:** Tick/bỏ tick từng mục → thay đổi phản ánh ngay trong "Xem trước phiếu in" ([SHOP-ORDER-18](./in-don-hang-xem-truoc-phieu-in.md)).

## Notes

- Tách từ [SHOP-ORDER-13](./in-don-hang-hang-hoa.md) theo yêu cầu trực tiếp "hiển thị đầy đủ thông tin trên 1 đơn hàng" — bản đầu chỉ có 5 mục (Mã vận đơn, Khối lượng, COD, Ghi chú, Logo).
- Đối chứng với sub-tab Thư tài liệu ([SHOP-ORDER-20](./in-don-hang-thong-tin-hien-thi-thu.md)) để thấy rõ khác biệt: Thư tài liệu không có COD và Kích thước.
