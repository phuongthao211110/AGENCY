---
id: SHOP-ORDER-17
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Cài đặt đơn hàng - In đơn hàng: Mã vận đơn — Barcode + QR code

## User Story

Là chủ shop, tôi muốn phiếu in có cả barcode và QR code cùng mã vận đơn, để phù hợp với nhiều loại máy quét khác nhau (máy quét tuyến tính lẫn máy quét 2D/camera điện thoại) khi giao hàng.

## User Flow

1. Trong "Thông tin hiển thị trên phiếu in", mục "Mã vận đơn + Barcode + QR code" luôn có tick, không tắt được.
2. Xem "Xem trước phiếu in" — thấy 1 barcode và 1 QR code đặt cạnh nhau, cùng hiển thị đúng 1 mã vận đơn ngay dưới.

## System Flow

1. Barcode mô phỏng: dãy `barcodeBars` (độ rộng vạch cố định xen kẽ) render thành các `<div>` màu đen cạnh nhau — chỉ là hình minh hoạ, không phải barcode thật quét được.
2. QR mô phỏng: lưới `QR_SIZE x QR_SIZE` (9x9), 3 góc là "finder pattern" (khối đặc, có lỗ trống ở tâm — giống cấu trúc finder pattern QR thật), phần còn lại là hoa văn cố định theo công thức `(r*5+c*3)%4===0 || (r+c)%3===0` — **không phải QR thật, không quét ra được gì** (không dùng thư viện tạo QR thật).
3. Mã vận đơn hiển thị dưới barcode+QR khác nhau theo loại đơn:
   - Hàng hoá: mã mẫu dạng `SPX2024061200123` (mã GHN, có thật ngay lúc tạo đơn).
   - Thư tài liệu: mã mẫu dạng `247EX00987654` (mã 247Express, chỉ có thật sau khi đại lý dispatch — xem [SHOP-ORDER-14](./in-don-hang-thu-tai-lieu.md)).

## Acceptance Criteria

**AC1:** "Mã vận đơn + Barcode + QR code" luôn có tick trong checklist, click không tắt được, có nhãn "Luôn hiển thị".

**AC2:** Preview hiện đúng 1 khối barcode (dạng vạch) và 1 khối QR (dạng lưới ô vuông có 3 góc đặc) đặt cạnh nhau.

**AC3:** QR mô phỏng có đúng 3 góc là finder pattern (khối đặc viền ngoài, có ô trống nhỏ ở giữa) — nhận diện được đây là kiểu QR, không phải hoa văn ngẫu nhiên hoàn toàn.

**AC4:** Mã vận đơn hiển thị dưới barcode/QR đúng theo loại đơn (SPX... cho Hàng hoá, 247EX... cho Thư tài liệu).

## Notes

- Tách từ [SHOP-ORDER-13](./in-don-hang-hang-hoa.md) và [SHOP-ORDER-14](./in-don-hang-thu-tai-lieu.md).
- QR code được thêm sau khi người dùng yêu cầu trực tiếp ("ngoài code 102 tôi cần qr code") — trước đó phiếu in chỉ có barcode.
- Đây chỉ là hình minh hoạ cho preview cấu hình — **không phải cơ chế in thật**, không tạo barcode/QR thật quét được (cần thư viện chuyên dụng nếu làm thật, ví dụ `qrcode`/`jsbarcode`).
