---
id: SHOP-ORDER-18
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Cài đặt đơn hàng - In đơn hàng: Xem trước phiếu in

## User Story

Là chủ shop, tôi muốn xem trước chính xác phiếu in sẽ trông như thế nào trước khi in thật, để chỉnh đúng cấu hình (khổ giấy, thông tin hiển thị) mà không phải in thử nhiều lần tốn giấy.

## User Flow

1. Cấu hình khổ giấy ([SHOP-ORDER-15](./in-don-hang-chon-kho-giay.md)) và tick/bỏ tick thông tin hiển thị ([SHOP-ORDER-19](./in-don-hang-thong-tin-hien-thi-hang-hoa.md)/[SHOP-ORDER-20](./in-don-hang-thong-tin-hien-thi-thu.md)).
2. Xem ngay khung "Xem trước phiếu in" phía dưới — cập nhật tức thì theo mọi thay đổi ở trên, không cần bấm nút "Xem trước" riêng.
3. Preview dùng dữ liệu mẫu cố định (không phải đơn thật) — có ghi rõ dòng chú thích ngay trên khung preview.

## System Flow

1. Khung preview là 1 `<div>` có `width` = giá trị từ `PAPER_PREVIEW_WIDTH[paperSize]`, nền trắng, đặt giữa 1 khung nền xám `#F3F4F6`.
2. Nội dung preview render tuần tự theo đúng thứ tự thật của phiếu in: (Tên/logo shop nếu tick) → Barcode+QR+mã vận đơn → Mã đơn shop (nếu tick) → Người gửi (nếu tick) → Người nhận (luôn có) → Sản phẩm/Nội dung thư (nếu tick) → Khối lượng/Kích thước/COD/Phí ship (nếu tick, đúng thứ tự) → Ghi chú (nếu tick).
3. Mỗi dòng nội dung điều kiện hiện/ẩn bind trực tiếp theo state checkbox tương ứng — không có nút "Cập nhật preview" riêng, mọi thay đổi state re-render ngay (React state thông thường, không debounce).
4. Font `monospace` cho toàn bộ nội dung preview — mô phỏng đúng cảm giác giấy in nhiệt/máy in đơn giản.

## Acceptance Criteria

**AC1:** Preview hiện ngay khi vào tab, không cần thao tác gì thêm.

**AC2:** Tick/bỏ tick bất kỳ mục nào trong checklist → dòng tương ứng hiện/ẩn trong preview ngay lập tức (không delay, không cần refresh).

**AC3:** Đổi khổ giấy → độ rộng khung preview đổi theo ngay.

**AC4:** Chuyển giữa sub-tab Hàng hoá/Thư tài liệu → preview hiện đúng dữ liệu mẫu và field tương ứng loại đơn đang xem (không lẫn dữ liệu mẫu của tab khác).

**AC5:** Có dòng chú thích rõ đây là "dữ liệu mẫu", không phải đơn thật.

## Notes

- Tách từ [SHOP-ORDER-13](./in-don-hang-hang-hoa.md) và [SHOP-ORDER-14](./in-don-hang-thu-tai-lieu.md).
- Preview không thật sự render ra 1 file/hình có thể in hoặc export — chỉ là mô phỏng trực quan trong UI Cài đặt để tham khảo trước.
