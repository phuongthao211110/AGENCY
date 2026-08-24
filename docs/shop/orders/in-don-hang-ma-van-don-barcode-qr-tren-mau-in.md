---
id: SHOP-ORDER-28
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Đơn hàng - In đơn hàng: Mã vận đơn + Barcode + QR code trên mẫu in

## User Story

Là chủ shop khi in vận đơn thật (từ danh sách, chi tiết, hay in hàng loạt), tôi muốn mỗi phiếu in hiện đúng barcode, QR code và mã vận đơn của CHÍNH đơn đó, để không bị lẫn phiếu giữa các đơn khi in nhiều cùng lúc.

## User Flow

1. Mở popup "In đơn hàng" (từ danh sách, chi tiết, hoặc chọn nhiều đơn — [SHOP-ORDER-26](./danh-sach-them-button-in-don-hang.md)/[SHOP-ORDER-27](./chi-tiet-them-button-in-don-hang.md))
2. Mỗi phiếu hiện 1 khối barcode (dạng vạch) bên trái kèm mã vận đơn ngay dưới, và 1 khối QR (lưới ô vuông, 3 góc là finder pattern đặc) bên phải, đặt cạnh nhau
3. Mã vận đơn hiển thị đúng của đơn đang in — Hàng hoá hiện mã thật ngay từ lúc tạo, Thư tài liệu hiện mã thật sau khi đại lý dispatch — không phải mã mẫu cố định
4. In nhiều đơn cùng lúc → mỗi phiếu có đúng barcode+QR+mã vận đơn riêng của từng đơn tương ứng, không lặp lại hay lẫn giữa các đơn

## System Flow

1. `PrintOrderModal` (`Orders.tsx`) định nghĩa lại (copy) đúng thuật toán mock barcode (`barcodeBars` — mảng độ rộng vạch cố định) và QR (`QR_SIZE=9`, `isFinder` cho 3 góc, công thức hoa văn `(r*5+c*3)%4===0 || (r+c)%3===0`) — CÙNG cách tính đã có ở phần "Xem trước phiếu in" trong Cài đặt đơn hàng ([SHOP-ORDER-17](./in-don-hang-barcode-qr.md)), nhưng là 1 bản định nghĩa ĐỘC LẬP, không dùng chung component/hàm với bản settings-preview
2. Khác biệt cốt lõi so với SHOP-ORDER-17: mã hiển thị dưới barcode là `order.trackingCode` THẬT của từng đơn trong mảng `orders` truyền vào modal, không phải mã mẫu cố định (`SPX...`/`247EX...`)
3. Khối render barcode+QR+mã vận đơn nằm bên trong `orders.map(order => ...)` — mỗi đơn trong danh sách in tạo ra đúng 1 phiếu với đúng `order.trackingCode`, `barcodeBars` và `qrCells` của chính nó (2 hằng số này tính 1 lần ở ngoài `.map`, dùng chung hình dạng cho mọi phiếu — chỉ có dòng mã vận đơn text là khác nhau theo từng `order`)
4. Vẫn là hình minh hoạ (barcode/QR không phải mã thật, không quét ra dữ liệu bằng máy quét thật) — kế thừa đúng giới hạn đã ghi nhận ở SHOP-ORDER-17, chỉ khác chỗ mã vận đơn hiển thị là dữ liệu thật của đơn thay vì mã mẫu

## Acceptance Criteria

**AC1:** Mỗi phiếu trong popup "In đơn hàng" có 1 khối barcode (vạch) bên trái + 1 khối QR (lưới, 3 góc là finder pattern đặc) bên phải, đặt cạnh nhau — cùng cấu trúc mock đã có ở Cài đặt đơn hàng ([SHOP-ORDER-17](./in-don-hang-barcode-qr.md)).

**AC2:** Mã vận đơn hiển thị ngay dưới barcode là mã THẬT của đơn đang in (`order.trackingCode`), không phải mã mẫu.

**AC3:** In nhiều đơn cùng lúc → mỗi phiếu hiện đúng barcode+QR+mã vận đơn của đơn tương ứng, không bị lặp hay lẫn giữa các đơn trong cùng 1 lần in.

**AC4:** Barcode/QR vẫn là hình minh hoạ, không phải mã thật tạo bằng thư viện chuyên dụng — không quét ra được dữ liệu, đúng giới hạn đã ghi nhận ở SHOP-ORDER-17.

## Notes

- Story này KHÔNG lặp lại nội dung đã có ở [SHOP-ORDER-17](./in-don-hang-barcode-qr.md) (cấu trúc finder pattern, lý do thêm QR, giới hạn "không phải mã thật scan được") — chỉ ghi nhận điểm khác biệt duy nhất: đây là bản dùng trong phiếu in THẬT (`PrintOrderModal`, [SHOP-ORDER-26](./danh-sach-them-button-in-don-hang.md)/[SHOP-ORDER-27](./chi-tiet-them-button-in-don-hang.md)), hiển thị mã vận đơn thật của từng đơn thay vì mã mẫu cố định trong preview cấu hình.
- Thuật toán mock barcode/QR bị COPY lại y hệt (không refactor thành 1 component/hàm dùng chung giữa preview cấu hình và `PrintOrderModal`) — 2 nơi định nghĩa độc lập, đổi 1 bên không ảnh hưởng bên kia. Nếu sau này cần đổi kiểu hiển thị mock, phải sửa ở cả 2 nơi.
- Xác nhận qua đọc code (`Orders.tsx`): khối barcode+QR+mã vận đơn nằm trong `orders.map(...)`, dùng đúng `order.trackingCode` — không phải hardcode 1 mã chung cho cả batch in.
