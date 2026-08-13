---
id: SHOP-ORDER-13
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Cài đặt đơn hàng - In đơn hàng: Hàng hoá

## User Story

Là chủ shop, tôi muốn cấu hình mặc định cho việc in vận đơn đơn Hàng hoá (khổ giấy, thông tin hiển thị, tự động in), để mỗi lần tạo đơn không phải chỉnh lại từ đầu, và xem trước đúng phiếu sẽ in ra trước khi thật sự in.

## User Flow

1. Vào "Cài đặt đơn hàng" → tab "In đơn hàng" → sub-tab "Hàng hoá" (mặc định active).
2. Bật/tắt "Tự động in khi tạo đơn" — tự mở phiếu in ngay sau khi tạo đơn thành công.
3. Chọn khổ giấy in — 3 lựa chọn dạng nút bấm: **In khổ A5** / **In khổ 52 x 70 mm** / **In khổ 80 x 80 mm**.
4. Tick/bỏ tick từng mục trong "Thông tin hiển thị trên phiếu in" — đầy đủ thông tin 1 đơn hàng thật (không chỉ vài field rời rạc).
5. Xem ngay "Xem trước phiếu in" — preview cập nhật theo đúng khổ giấy + mục đã tick, dùng dữ liệu mẫu minh hoạ.

## System Flow

1. Khổ giấy `paperSize: 'A5' | '52x70' | '80x80'`, chọn qua `PaperSizePicker` (3 nút pill, nút đang chọn tô nền xanh đậm `#1E4C7A`) — thay hoàn toàn cho dropdown `<select>` ban đầu (K80/A6/A5/A4, không đúng khổ giấy thật đang dùng).
2. Checklist "Thông tin hiển thị trên phiếu in" — **2 mục luôn hiển thị, không tắt được** vì thiếu thì phiếu in không dùng được: "Mã vận đơn + Barcode + QR code", "Người nhận (tên, SĐT, địa chỉ)". Các mục còn lại tick được: Người gửi, Sản phẩm, Khối lượng, Kích thước, Tiền thu hộ (COD), Phí ship, Ghi chú đơn hàng, Mã đơn shop, Tên/logo shop.
3. Preview mô phỏng đúng layout phiếu in thật: barcode (mô phỏng bằng các vạch), QR code (lưới 9x9 có 3 "finder pattern" ở góc giống QR thật) — cả 2 cùng encode 1 mã vận đơn hiển thị bên dưới, phục vụ 2 kiểu máy quét khác nhau (tuyến tính vs 2D). Độ rộng preview đổi theo khổ giấy đã chọn.
4. Đơn Hàng hoá có mã vận đơn thật **ngay lúc tạo đơn** (gửi trực tiếp qua GHN, không qua trung gian) nên barcode/QR luôn hợp lệ để in ngay — khác với đơn Thư tài liệu (xem [SHOP-ORDER-14](./in-don-hang-thu-tai-lieu.md)).

## Acceptance Criteria

**AC1:** 3 nút chọn khổ giấy hiển thị đúng: "In khổ A5", "In khổ 52 x 70 mm", "In khổ 80 x 80 mm" — nút đang chọn có nền xanh đậm + chữ trắng, các nút khác nền xám nhạt + chữ tối.

**AC2:** "Mã vận đơn + Barcode + QR code" và "Người nhận" luôn có tick, không click tắt được, có nhãn "Luôn hiển thị".

**AC3:** Tick/bỏ tick bất kỳ mục còn lại (Người gửi, Sản phẩm, Khối lượng, Kích thước, COD, Phí ship, Ghi chú, Mã đơn shop, Tên/logo shop) → preview ẩn/hiện đúng dòng tương ứng ngay, không cần thao tác thêm.

**AC4:** Đổi khổ giấy → độ rộng khung preview đổi theo (A5 rộng nhất, 52x70mm hẹp nhất).

**AC5:** Preview hiện đúng 1 barcode + 1 QR code cạnh nhau, cùng 1 mã vận đơn hiển thị dưới cả 2.

**AC6:** Cấu hình ở đây độc lập hoàn toàn với sub-tab "Thư tài liệu" — đổi 1 bên không ảnh hưởng bên kia.

## Notes

- **Đã tách thành các story con nhỏ hơn theo yêu cầu trực tiếp** — story này giữ vai trò tổng quan, chi tiết từng phần nằm ở:
  - [SHOP-ORDER-15](./in-don-hang-chon-kho-giay.md) — Chọn khổ giấy in
  - [SHOP-ORDER-16](./in-don-hang-tu-dong-in.md) — Tự động in vận đơn
  - [SHOP-ORDER-17](./in-don-hang-barcode-qr.md) — Mã vận đơn: Barcode + QR code
  - [SHOP-ORDER-18](./in-don-hang-xem-truoc-phieu-in.md) — Xem trước phiếu in
  - [SHOP-ORDER-19](./in-don-hang-thong-tin-hien-thi-hang-hoa.md) — Thông tin hiển thị trên phiếu in (Hàng hoá)
- Đã cân nhắc thêm 1 sub-tab thứ 3 "Mẫu in đơn hàng" (chọn giữa nhiều mẫu layout cố định) nhưng **đã bỏ theo yêu cầu trực tiếp** vì "quá rối rắm" — giữ đúng 2 sub-tab Hàng hoá/Thư tài liệu, không thêm khái niệm mẫu in riêng.
- Toàn bộ cấu hình ở đây chỉ là **preference UI, chưa persist** (localStorage/API) — giống toàn bộ popup "Cài đặt đơn hàng" nói chung, xem [WS-ORDER-1](./cai-dat-don-hang-mac-dinh.md).
