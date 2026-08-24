---
id: SHOP-ORDER-25
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Đơn hàng - In đơn hàng - Thư/tài liệu: Xem trước phiếu in

## User Story

Là chủ shop gửi đơn Thư tài liệu, tôi muốn xem trước phiếu in ngay khi đang cấu hình ở sub-tab Thư tài liệu, để chỉnh đúng khổ giấy và thông tin hiển thị mà không phải in thử tốn giấy — dù biết phiếu chỉ dùng thật được sau khi đại lý đã gửi hàng cho nhà vận chuyển.

## User Flow

1. Ở sub-tab "Thư tài liệu", cấu hình khổ giấy ([SHOP-ORDER-15](./in-don-hang-chon-kho-giay.md)) và tick/bỏ tick checklist "Thông tin hiển thị trên phiếu in" ([SHOP-ORDER-20](./in-don-hang-thong-tin-hien-thi-thu.md))
2. Xem ngay khung "Xem trước phiếu in" phía dưới cùng sub-tab — cập nhật tức thì theo mọi thay đổi ở trên, không cần bấm nút riêng
3. Preview dùng dữ liệu mẫu Thư tài liệu cố định (nội dung thư, không có sản phẩm/COD) — có dòng chú thích rõ đây là dữ liệu mẫu, không phải đơn thật

## System Flow

1. Dùng chung 1 cơ chế preview với sub-tab Hàng hoá — xem chi tiết kỹ thuật đầy đủ (cấu trúc khung, thứ tự render, font monospace, cách bind điều kiện hiện/ẩn) ở [SHOP-ORDER-18](./in-don-hang-xem-truoc-phieu-in.md)
2. Với sub-tab Thư tài liệu cụ thể: preview KHÔNG render dòng COD và Kích thước — 2 field không áp dụng cho đơn Thư (xem [SHOP-ORDER-20](./in-don-hang-thong-tin-hien-thi-thu.md)), khác preview sub-tab Hàng hoá ([SHOP-ORDER-23](./in-don-hang-hang-hoa-xem-truoc-phieu-in.md)) có đủ 2 dòng này
3. Khung preview đọc `paperSize` và 7 state checkbox riêng của Thư (`letterShowSender`, `letterShowProduct`... — xem [SHOP-ORDER-20](./in-don-hang-thong-tin-hien-thi-thu.md)) để quyết định dòng nào hiện
4. Mã vận đơn mẫu trong preview là `VC00987654` — đã verify trực tiếp trong code (`Orders.tsx` dòng 669). Mã này KHÔNG bắt đầu bằng "247EX" như bản nháp đầu tiên từng dùng — đã đổi từ trước theo đúng quy tắc "không nhắc 247" áp dụng luôn cho cả giá trị dữ liệu mẫu, không chỉ label/copy tĩnh

## Acceptance Criteria

**AC1:** Preview ở sub-tab Thư tài liệu hiện ngay khi vào tab, không cần thao tác gì thêm.

**AC2:** Tick/bỏ tick bất kỳ mục nào trong checklist Thư tài liệu → dòng tương ứng hiện/ẩn trong preview ngay lập tức.

**AC3:** Đổi khổ giấy ở sub-tab Thư tài liệu → độ rộng khung preview đổi theo ngay, không ảnh hưởng khổ giấy/preview đang cấu hình ở sub-tab Hàng hoá.

**AC4:** Preview Thư tài liệu KHÔNG có dòng COD và Kích thước ở bất kỳ trạng thái tick nào — 2 mục này không tồn tại trong checklist của sub-tab này (khác Hàng hoá).

**AC5:** Có dòng chú thích rõ đây là "dữ liệu mẫu", không phải đơn thật.

## Notes

- Story này KHÔNG lặp lại chi tiết kỹ thuật cơ chế preview dùng chung — đã có đầy đủ ở [SHOP-ORDER-18](./in-don-hang-xem-truoc-phieu-in.md) (áp dụng cho cả Hàng hoá lẫn Thư tài liệu). Story này chỉ nêu phần khác biệt và AC riêng khi xét trong phạm vi sub-tab Thư tài liệu.
- Cặp story với [SHOP-ORDER-23](./in-don-hang-hang-hoa-xem-truoc-phieu-in.md) (bản Hàng hoá) — cùng cơ chế preview, khác ở chỗ không có dòng COD/Kích thước và mã vận đơn mẫu khác (`VC00987654` thay vì mã dạng Hàng hoá).
- Khác biệt cốt lõi so với Hàng hoá: preview Thư tài liệu KHÔNG có COD + Kích thước — đúng theo business rule đơn Thư không có 2 field này (`CreateLetterDrawer` hardcode `cod:0`, không có input kích thước).
- Preview không thật sự render ra 1 file/hình có thể in hoặc export — chỉ là mô phỏng trực quan trong UI Cài đặt để tham khảo trước, giống mô tả ở SHOP-ORDER-18.
