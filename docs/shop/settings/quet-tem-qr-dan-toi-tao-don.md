---
id: SHOP-SETTINGS-4
jiraKey: 
platform: shop
section: Cài đặt
figma: 
status: draft
---

# [WEB SHOP] Cài đặt: Tem QR — Quét tem dẫn tới Tạo đơn hàng

## Bối cảnh

Tách từ story gốc "Tem QR" (xem SHOP-SETTINGS-2 để biết trang danh sách/store nền). Đây là PHẦN LÕI của cả tính năng — lý do tem QR tồn tại: khách quét tem dán ở quầy, trình duyệt tự mở đúng trang Tạo đơn hàng của shop.

## User Story

Là chủ shop, khi khách quét tem QR đã dán ở quầy, tôi muốn trình duyệt của khách tự động mở sẵn form "Tạo đơn hàng" (với ghi chú biết ngay đơn này từ tem nào) — và nếu tem đã hết hạn/bị tắt/hết lượt quét, hoặc shop tôi đang bị khoá tạo đơn, khách phải thấy đúng lý do thay vì mở được form một cách sai lệch.

## User Flow

1. Khách quét mã QR thật (hoặc Shop tự mở thử link) → trình duyệt mở `/shop/orders?qr=<mã tem>`.
2. Hệ thống tự kiểm tra tem còn hợp lệ không (đang bật, chưa hết hạn, chưa chạm giới hạn lượt quét).
3. **Hợp lệ** → tự cộng 1 lượt quét, xoá query param `qr` khỏi URL, rồi MỞ SẴN form "Tạo đơn hàng" với Ghi chú đơn hàng tự điền sẵn "Đơn từ Tem QR: {tên tem}" (Shop vẫn sửa/xoá được ghi chú này bình thường trước khi bấm "Tạo đơn").
4. **Không hợp lệ** (hết hạn/đã tắt/hết lượt/không tồn tại) → hiện `window.alert` báo lỗi, KHÔNG mở form, KHÔNG cộng lượt quét.
5. **Shop đang bị khoá tạo đơn** (quá hạn chuyển tiền mặt cho đại lý, xem AGA-PAYMENT-3) → dù tem hợp lệ, hiện đúng cảnh báo khoá tạo đơn thay vì mở form — giống hệt cảnh báo Shop thấy khi tự bấm "+ Tạo đơn hàng" trong tình huống này.

## System Flow

1. Deep-link vào `Orders.tsx` (component `ShopOrders`): dùng `useSearchParams()` (react-router-dom), `useEffect` đọc `searchParams.get('qr')` — có giá trị thì xoá param khỏi URL ngay (`setSearchParams(..., { replace: true })`, tránh F5 tính thêm lượt quét — xem chi tiết cơ chế chống đếm trùng ở SHOP-SETTINGS-6).
2. Thứ tự kiểm tra: `findQrCode(qrId)` (`qrStore.ts`) → nếu `null` hoặc `!isQrCodeUsable(qr)` → `window.alert(...)`, dừng lại. Hợp lệ → kiểm tiếp `isOrderCreationBlocked('SHP001')` (`orderStore.ts`, xem AGA-PAYMENT-3) → nếu đang khoá → `window.alert` đúng nội dung khoá, dừng lại, KHÔNG gọi `recordQrScan()` (không tính lượt quét cho 1 lần quét không thực sự dẫn tới được gì).
3. Hợp lệ VÀ không bị khoá → `recordQrScan(qrId)` (`qrStore.ts`, tăng `scanCount`), `setQrSourceNote('Đơn từ Tem QR: ' + qr.name)`, `setDrawerOpen(true)` để mở `CreateOrderDrawer`.
4. `isQrCodeUsable(qr)` (`qrStore.ts`): `active === true && (!expiresAt || expiresAt chưa qua) && (scanLimit === null || scanCount < scanLimit)`.
5. `CreateOrderDrawer` nhận thêm prop tuỳ chọn `initialNote?: string`; vì drawer này LUÔN mount sẵn (ẩn/hiện bằng CSS transform, không unmount — xem SHOP-ORDER-43), có 1 `useEffect` riêng theo dõi `open && initialNote` để set vào state `orderNote` đúng lúc drawer mở từ luồng quét QR (không ảnh hưởng luồng mở drawer bình thường từ menu "+ Tạo đơn hàng", lúc đó `initialNote` là `undefined`).
6. "Ghi chú đơn hàng" tự điền chỉ là giá trị KHỞI TẠO của state `orderNote` — Shop vẫn sửa/xoá bình thường như mọi ghi chú khác trước khi bấm "Tạo đơn", không có gì khoá field này lại.

## Acceptance Criteria

**AC1:** Mở link `/shop/orders?qr=<id>` của 1 tem đang hoạt động, chưa hết hạn, chưa chạm giới hạn lượt quét, shop không bị khoá tạo đơn → tự mở form "Tạo đơn hàng" với Ghi chú đơn hàng = "Đơn từ Tem QR: {tên tem}", đồng thời "Lượt quét" của tem đó tăng thêm đúng 1.

**AC2:** Mở link của 1 tem đã TẮT, đã HẾT HẠN, hoặc đã chạm giới hạn lượt quét → hiện cảnh báo, KHÔNG mở form tạo đơn, KHÔNG cộng thêm lượt quét.

**AC3:** Mở link của 1 mã tem KHÔNG TỒN TẠI (đã xoá, hoặc gõ sai) → `findQrCode()` trả `null`, bị từ chối giống AC2.

**AC4:** Mở link QR trong lúc shop đang bị khoá tạo đơn (quá hạn chuyển tiền mặt, xem AGA-PAYMENT-3) → hiện đúng cảnh báo khoá tạo đơn, không mở form, KHÔNG cộng lượt quét, dù tem hợp lệ.

**AC5:** Ghi chú đơn hàng tự điền chỉ là giá trị khởi tạo — Shop sửa/xoá được bình thường trước khi tạo đơn, không bị khoá field.

## Notes

- Đây là lý do nghiệp vụ DUY NHẤT khiến tính năng Tem QR tồn tại — SHOP-SETTINGS-2/3/5/7 chỉ là phần quản lý xoay quanh cái lõi này.
- Xem SHOP-ORDER-43 (vì sao `CreateOrderDrawer` luôn mount sẵn, ẩn/hiện bằng transform — lý do cần `useEffect` riêng để seed `initialNote` thay vì seed lúc mount), AGA-PAYMENT-3 (cơ chế khoá tạo đơn mà luồng quét QR phải tôn trọng).
- Xem SHOP-SETTINGS-6 để biết cơ chế chống đếm 1 lượt quét thật thành 2 (bug StrictMode đã phát hiện và sửa) — liên quan trực tiếp tới AC1 ở đây.
- **PROTOTYPE THUẦN** — "lượt quét" chỉ tăng khi trình duyệt THỰC SỰ mở đúng link (không phân biệt được quét QR thật hay gõ tay/dán link — theo đúng tinh thần demo).
