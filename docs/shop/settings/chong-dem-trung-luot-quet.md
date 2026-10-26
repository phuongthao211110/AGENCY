---
id: SHOP-SETTINGS-6
jiraKey: 
platform: shop
section: Cài đặt
figma: 
status: draft
---

# [WEB SHOP] Cài đặt: Tem QR — Chống đếm trùng lượt quét

## Bối cảnh

Tách từ story gốc "Tem QR" (xem SHOP-SETTINGS-2 để biết trang danh sách/store nền, SHOP-SETTINGS-4 để biết luồng quét đầy đủ). Story này ghi lại riêng 1 bug đã phát hiện qua UAT và cách đã sửa — tách thành story riêng vì là 1 cơ chế kỹ thuật độc lập (`useRef` guard), không gắn chặt vào bất kỳ hành vi nghiệp vụ nào khác.

## User Story

Là chủ shop, tôi muốn 1 lượt quét QR thật của khách CHỈ được tính đúng 1 lần (không bị đếm thành 2), để "Lượt quét"/"Giới hạn lượt quét" hiển thị đúng số liệu thật, không bị tiêu hao quota oan vì lỗi kỹ thuật của hệ thống.

## User Flow

1. Khách quét 1 tem QR có giới hạn lượt quét (ví dụ giới hạn 2 lượt) → mở link `/shop/orders?qr=<id>` → form Tạo đơn hàng mở ra đúng 1 lần.
2. Kiểm tra lại "Lượt quét" của tem đó trong bảng → chỉ tăng đúng **+1**, không phải +2.
3. Tải lại trang (F5) ngay sau khi quét 1 lần → KHÔNG tự mở lại form tạo đơn lần nữa, KHÔNG cộng thêm lượt quét (vì query param `qr` đã bị xoá khỏi URL ngay sau lần xử lý đầu — xem SHOP-SETTINGS-4).

## System Flow

1. **Bug đã phát hiện qua UAT**: effect xử lý `?qr=<id>` trong `Orders.tsx` (xem SHOP-SETTINGS-4) có side-effect KHÔNG idempotent (`recordQrScan()` cộng dồn `scanCount`) nên bị `React.StrictMode` (bật trong `src/main.tsx`, chỉ ở dev mode) tự gọi lại effect đó LẦN THỨ 2 ngay lúc mount → 1 lượt quét thật bị tính thành 2.
2. Ảnh hưởng trực tiếp: tem đặt "Giới hạn lượt quét" = 2 bị tiêu hết quota chỉ sau ĐÚNG 1 lượt quét thật (StrictMode tự nhân đôi ngay từ lần đầu).
3. **Cách sửa**: thêm `const handledQrIdRef = useRef<string | null>(null)` trong component `ShopOrders` — guard đầu effect: `if (!qrId || handledQrIdRef.current === qrId) return; handledQrIdRef.current = qrId` SET NGAY trước khi làm bất kỳ việc gì khác (trước cả `setSearchParams`) — chặn xử lý trùng cùng 1 `qrId` ở lần gọi effect thứ 2 trở đi, KHÔNG phụ thuộc chờ `setSearchParams()` kịp cập nhật state giữa 2 lần StrictMode invoke (vốn là cách sửa ban đầu đã thử nhưng KHÔNG đủ nhanh để chặn lần gọi thứ 2 trong cùng 1 chu kỳ đồng bộ).
4. **Xác nhận lại qua UAT**: bản build production (`vite build`, không có StrictMode double-invoke) vốn KHÔNG dính bug này ngay cả TRƯỚC khi sửa — nhưng vẫn sửa ở tầng effect để an toàn cho CẢ dev mode lẫn production (không dựa vào "may mắn không double-invoke" làm chỗ dựa đúng).

## Acceptance Criteria

**AC1:** Quét 1 lần 1 tem QR hợp lệ (chạy ở `npm run dev`, có `React.StrictMode`) → "Lượt quét" của tem đó tăng đúng **+1**, không phải +2.

**AC2:** Tải lại trang (F5) ngay sau khi quét 1 lần → KHÔNG tự mở lại form tạo đơn, KHÔNG cộng thêm lượt quét lần 2.

**AC3:** Quét 2 lần RIÊNG BIỆT (2 lần mở link thật, không phải F5 lại cùng 1 lần tải) → "Lượt quét" tăng đúng +2 (guard chỉ chặn TRÙNG LẶP trong CÙNG 1 lần tải trang, không chặn 2 lượt quét thật khác nhau).

**AC4:** Hành vi giống hệt nhau giữa `npm run dev` (có StrictMode) và bản build production (`vite build`, không StrictMode) — không có khác biệt số lượt quét giữa 2 môi trường.

## Notes

- Đây là bug kỹ thuật THUẦN TUÝ (React StrictMode double-invoke effect trong dev mode) — không phải lỗi nghiệp vụ, không ảnh hưởng gì tới logic hợp lệ/không hợp lệ của tem (xem SHOP-SETTINGS-4).
- `handledQrIdRef` là `useRef`, không phải `useState` — cố ý, vì set giá trị này KHÔNG được trigger re-render (chỉ cần nhớ giá trị qua các lần gọi effect, không cần vẽ lại UI).
- Xem SHOP-SETTINGS-4 (luồng quét đầy đủ mà effect này nằm trong đó) để biết context đầy đủ của đoạn code được sửa.
