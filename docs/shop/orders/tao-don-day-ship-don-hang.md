---
id: SHOP-ORDER-4
jiraKey: AGENCY-162
platform: shop
section: Quản lý đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP
status: draft
---

# [WEB SHOP] Đơn hàng - Tạo mới: Đẩy ship đơn hàng

## User Story

Là Shop, sau khi tôi xác nhận tạo đơn, tôi muốn hệ thống tự động đẩy đơn
sang GHN để đơn được xử lý vận chuyển mà tôi không cần thao tác thêm.

## User Flow

1. Shop nhấn **Tạo đơn** sau khi điền đầy đủ thông tin
2. Hệ thống tạo đơn và tự động chạy Routing Engine ngầm
3. Shop thấy đơn hàng ở trạng thái thành công, có mã vận đơn GHN

## System Flow

Chạy ngay sau khi shop nhấn **Tạo đơn** và đơn được lưu thành công:

**B1 — Lấy dịch vụ đã chọn**
- Lấy `serviceId` từ đơn hàng vừa tạo

**B2 — Expand danh sách Shop ID GHN**
- Từ `serviceId` → lấy danh sách `[{ shopIdGhn, goiCuoc }]` đã kết nối

**B3 — Tính phí GHN cho từng Shop ID**
- Với mỗi `shop_id_ghn`: gọi GHN API lấy `fee_ghn` và `SLA`

**B4 — Chọn phương án tối ưu**
Ưu tiên theo thứ tự:
1. Fee GHN thấp nhất
2. SLA tốt hơn (nếu fee bằng nhau)
3. Shop ưu tiên (nếu SLA bằng nhau)

**B5 — Push đơn sang GHN**
- Gọi GHN API tạo đơn với `selected_shop_id_ghn`
- Nhận về `ghn_order_code`
- Lưu `ghn_order_code` + `shop_id_ghn_used` vào đơn hàng

**B6 — Xử lý lỗi**
- Không có Shop ID GHN khả dụng → trạng thái `Chờ đẩy GHN`
- GHN API lỗi → retry tối đa 3 lần → nếu vẫn lỗi: `Đẩy GHN thất bại`

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Agency Admin** — Quản lý đơn | Có thể xem `shop_id_ghn_used` và `fee_ghn` thực tế trong chi tiết đơn để theo dõi margin |

## Acceptance Criteria

**AC1:** Sau khi shop nhấn **Tạo đơn** thành công → hệ thống tự động
chạy Routing Engine, shop không cần thao tác thêm.

**AC2:** Routing Engine chọn Shop ID GHN tối ưu theo thứ tự ưu tiên:
fee thấp nhất → SLA tốt hơn → shop ưu tiên.

**AC3:** Push GHN thành công → đơn có mã vận đơn GHN, trạng thái
chuyển sang `Đang xử lý`.

**AC4:** Không có Shop ID GHN khả dụng hoặc push thất bại sau 3 lần
retry → đơn ở trạng thái `Đẩy GHN thất bại`, cần xử lý thủ công.

**AC5:** Phí GHN thực tế được lưu nội bộ vào đơn hàng.
Shop không thấy thông tin này.

**AC6:** Phí ship hiển thị với shop (giá đại lý) không thay đổi dù
Routing Engine chọn Shop ID GHN nào.

## Notes

- Routing Engine chạy ngầm (background) — shop chỉ thấy kết quả cuối
- GHN fee > giá bán đại lý → vẫn đẩy đơn, hệ thống log margin âm
- `shop_id_ghn_used` và `fee_ghn` dùng cho đối soát nội bộ đại lý ↔ GHN
