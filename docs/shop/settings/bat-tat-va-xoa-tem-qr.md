---
id: SHOP-SETTINGS-5
jiraKey: 
platform: shop
section: Cài đặt
figma: 
status: draft
---

# [WEB SHOP] Cài đặt: Tem QR — Bật/tắt và xoá tem

## Bối cảnh

Tách từ story gốc "Tem QR" (xem SHOP-SETTINGS-2 để biết trang danh sách/store nền). Story này mô tả 2 thao tác vòng đời của 1 tem đã tạo, thực hiện NGAY từ bảng danh sách (không cần mở modal nào).

## User Story

Là chủ shop, tôi muốn bật/tắt hoặc xoá hẳn 1 tem QR ngay từ bảng danh sách, để tạm ngưng hoặc dọn dẹp những tem không còn dùng (quầy đã dẹp, tem in sai...) mà không cần mở modal Sửa chỉ để đổi 1 trạng thái.

## User Flow

1. Bấm **toggle trạng thái** ở cột "Trạng thái" của 1 dòng (không qua modal Sửa) → bật/tắt NGAY tem đó, KHÔNG cần `window.confirm` xác nhận.
2. Tem vừa TẮT: mã QR cũ vẫn quét được (link không đổi, vẫn trỏ đúng `/shop/orders?qr=<id>`) nhưng sẽ báo "không hợp lệ" và KHÔNG dẫn vào trang Tạo đơn hàng nữa (xem SHOP-SETTINGS-4, AC2).
3. Bấm icon **thùng rác** (thứ ba, cuối cùng trong cột Thao tác — nay chỉ còn 3 icon, xem SHOP-SETTINGS-2) → `window.confirm` xác nhận xoá hẳn (không khôi phục được) → xoá tem khỏi danh sách.
4. Tem đã xoá: mở lại link QR cũ của tem đó → hệ thống không tìm thấy tem, bị từ chối y như tem đã tắt.

## System Flow

1. `setQrCodeActive(id, active)` (`qrStore.ts`): bật/tắt RIÊNG LẺ 1 tem, dùng cho toggle ngoài bảng — KHÔNG đổi field nào khác (`name`/`expiresAt`/`scanLimit`/`note`/`scanCount` giữ nguyên).
2. `deleteQrCode(id)` (`qrStore.ts`): lọc bỏ hẳn tem khỏi mảng lưu trong `localStorage` — xoá VĨNH VIỄN, không có "thùng rác"/khôi phục.
3. Toggle ở bảng gọi trực tiếp `setQrCodeActive()` khi `onChange`, KHÔNG qua `window.confirm` — khác hẳn nút Xoá (CÓ `window.confirm`) vì bật/tắt là thao tác dễ đảo ngược (bật lại được ngay), còn xoá thì không.
4. `isQrCodeUsable(qr)` (`qrStore.ts`, dùng ở luồng quét — SHOP-SETTINGS-4) kiểm `active === true` là điều kiện ĐẦU TIÊN — tem tắt lập tức fail check này dù các điều kiện khác (hạn/lượt quét) vẫn còn hợp lệ.
5. `findQrCode(id)` (`qrStore.ts`) trả `null` cho tem đã xoá — luồng quét (SHOP-SETTINGS-4) coi `null` giống hệt "không hợp lệ", không cần logic riêng cho "đã xoá" vs "đã tắt".

## Acceptance Criteria

**AC1:** Bấm toggle trạng thái ở bảng → tem đổi trạng thái NGAY (không cần xác nhận, không cần reload), nhãn đổi đúng "Đang hoạt động"/"Đã vô hiệu".

**AC2:** Tắt 1 tem → mở lại link QR của tem đó → bị từ chối (hiện cảnh báo, không mở form tạo đơn — xem SHOP-SETTINGS-4 AC2).

**AC3:** Bật lại 1 tem đã tắt → mở lại đúng link QR cũ (không đổi link) → hoạt động bình thường trở lại, `scanCount` giữ nguyên số đã quét trước đó (không reset về 0).

**AC4:** Bấm icon thùng rác → luôn hiện `window.confirm` cảnh báo không khôi phục được, trước khi xoá thật.

**AC5:** Xác nhận xoá → tem biến mất khỏi danh sách (mọi tab lọc); mở lại link QR cũ của tem đó → bị từ chối giống AC2.

**AC6:** Huỷ `window.confirm` khi xoá → tem KHÔNG bị xoá, giữ nguyên trong danh sách.

## Notes

- Toggle ngoài bảng và toggle trong modal Sửa (xem SHOP-SETTINGS-7) CÙNG đổi 1 giá trị `active`, chỉ khác NƠI bấm — toggle ngoài bảng gọi thẳng `setQrCodeActive()`, modal Sửa gộp chung vào `updateQrCode()` cùng lúc với các field khác.
- Xoá tem KHÔNG xoá lịch sử `scanCount` đã ghi nhận ở đâu khác (vì hệ thống không lưu log từng lượt quét riêng lẻ, chỉ có bộ đếm tổng) — xoá là xoá sạch, không còn gì để tra cứu lại.
- **PROTOTYPE THUẦN** — không có "thùng rác" tạm/khôi phục trong X ngày như nhiều hệ thống thật; xoá là xoá hẳn ngay lập tức.
