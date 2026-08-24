---
id: SHOP-ORDER-23
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Đơn hàng - In đơn hàng - Hàng hoá: Xem trước phiếu in

## User Story

Là chủ shop gửi đơn Hàng hoá, tôi muốn xem trước chính xác phiếu in sẽ trông như thế nào ngay khi đang cấu hình ở sub-tab Hàng hoá, để chỉnh đúng khổ giấy và thông tin hiển thị mà không phải in thử tốn giấy.

## User Flow

1. Ở sub-tab "Hàng hoá", cấu hình khổ giấy ([SHOP-ORDER-15](./in-don-hang-chon-kho-giay.md)) và tick/bỏ tick checklist "Thông tin hiển thị trên phiếu in" ([SHOP-ORDER-19](./in-don-hang-thong-tin-hien-thi-hang-hoa.md))
2. Xem ngay khung "Xem trước phiếu in" phía dưới cùng sub-tab — cập nhật tức thì theo mọi thay đổi ở trên, không cần bấm nút riêng
3. Preview dùng dữ liệu mẫu Hàng hoá cố định (sản phẩm, khối lượng, kích thước, COD...) — có dòng chú thích rõ đây là dữ liệu mẫu, không phải đơn thật

## System Flow

1. Dùng chung 1 cơ chế preview với sub-tab Thư tài liệu — xem chi tiết kỹ thuật đầy đủ (cấu trúc khung, thứ tự render, font monospace, cách bind điều kiện hiện/ẩn) ở [SHOP-ORDER-18](./in-don-hang-xem-truoc-phieu-in.md)
2. Với sub-tab Hàng hoá cụ thể: preview render đủ dòng COD và Kích thước — 2 field KHÔNG xuất hiện ở preview sub-tab Thư tài liệu (đơn Thư không có COD/kích thước thật, xem [SHOP-ORDER-20](./in-don-hang-thong-tin-hien-thi-thu.md))
3. Khung preview đọc `paperSize` và toàn bộ 9 state checkbox riêng của Hàng hoá (`goodsShowSender`, `goodsShowProduct`... — xem [SHOP-ORDER-19](./in-don-hang-thong-tin-hien-thi-hang-hoa.md)) để quyết định dòng nào hiện
4. Dữ liệu mẫu minh hoạ dùng số liệu Hàng hoá thật (VD: có tên sản phẩm + số lượng, có số cân nặng/kích thước cụ thể) — khác mẫu Thư tài liệu (nội dung thư dạng text, không có sản phẩm/COD)

## Acceptance Criteria

**AC1:** Preview ở sub-tab Hàng hoá hiện ngay khi vào tab, không cần thao tác gì thêm.

**AC2:** Tick/bỏ tick bất kỳ mục nào trong checklist Hàng hoá (kể cả COD, Kích thước) → dòng tương ứng hiện/ẩn trong preview ngay lập tức.

**AC3:** Đổi khổ giấy ở sub-tab Hàng hoá → độ rộng khung preview đổi theo ngay, không ảnh hưởng khổ giấy/preview đang cấu hình ở sub-tab Thư tài liệu.

**AC4:** Preview Hàng hoá hiện đúng dòng COD và Kích thước khi các mục này được tick — 2 dòng này không tồn tại trong preview sub-tab Thư tài liệu dù có tick tương đương hay không.

**AC5:** Có dòng chú thích rõ đây là "dữ liệu mẫu", không phải đơn thật.

## Notes

- Story này KHÔNG lặp lại chi tiết kỹ thuật cơ chế preview dùng chung — đã có đầy đủ ở [SHOP-ORDER-18](./in-don-hang-xem-truoc-phieu-in.md) (áp dụng cho cả Hàng hoá lẫn Thư tài liệu). Story này chỉ nêu phần khác biệt và AC riêng khi xét trong phạm vi sub-tab Hàng hoá.
- Khác biệt cốt lõi so với Thư tài liệu: preview Hàng hoá có COD + Kích thước, Thư tài liệu thì không — đúng theo business rule đơn Thư không có 2 field này (`CreateLetterDrawer` hardcode `cod:0`, không có input kích thước).
- Preview không thật sự render ra 1 file/hình có thể in hoặc export — chỉ là mô phỏng trực quan trong UI Cài đặt để tham khảo trước, giống mô tả ở SHOP-ORDER-18.
