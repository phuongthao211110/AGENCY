---
id: SHOP-SETTINGS-9
jiraKey: 
platform: shop
section: Cài đặt
figma: 
status: draft
---

# [WEB SHOP] Cài đặt: Tem QR — In tem QR

## Bối cảnh

Tách từ SHOP-SETTINGS-3 (xem màn hình "Xem tem QR" đầy đủ) — nút "In tem QR" ban đầu gộp chung trong story đó, nay tách riêng vì là 1 năng lực HOÀN TOÀN MỚI (chưa từng tồn tại ở bất kỳ bản Tem QR nào trước đó — bản v1 chỉ có tải PNG, không có in trực tiếp).

## User Story

Là chủ shop đang xem màn hình "Xem tem QR" của 1 tem, tôi muốn bấm 1 nút là mở được hộp thoại in của trình duyệt ngay với đúng thiết kế tem đang hiển thị, để in ra giấy dán lên quầy ngay tại chỗ mà không cần tải file về rồi mở lên in thủ công.

## User Flow

1. Trong màn hình "Xem tem QR" (SHOP-SETTINGS-3), bấm nút **"In tem QR"**.
2. 1 tab/cửa sổ trình duyệt MỚI mở ra, chỉ chứa đúng ảnh thẻ tem cách điệu (không có sidebar/topbar/nút bấm nào khác của Web Shop).
3. Ngay khi ảnh tải xong trong tab mới, hộp thoại in CỦA TRÌNH DUYỆT tự động hiện ra — Shop chọn máy in thật hoặc "Lưu dưới dạng PDF" ngay trong hộp thoại đó như in bất kỳ trang web nào khác.
4. Đóng tab in (hoặc hộp thoại in) → quay lại màn hình "Xem tem QR" ban đầu, không có gì thay đổi.
5. Bấm "In tem QR" nhiều lần liên tiếp → mỗi lần mở đúng 1 tab mới với đúng ảnh hiện tại, không bị treo/mở chồng nhiều tab cũ.

## System Flow

1. Dùng lại `renderCardCanvas()` (dùng chung `cardRef` với SHOP-SETTINGS-8 — Tải PNG/PDF) để rasterize thẻ tem cách điệu thành `<canvas>`, rồi `canvas.toDataURL('image/png')` lấy data URL.
2. `handlePrint()`: `window.open('', '_blank', 'width=480,height=640')` mở 1 tab/cửa sổ trống MỚI; `printWindow.document.write(...)` ghi thẳng 1 trang HTML tối giản chỉ gồm `<img src="{dataUrl}" style="max-width:100%" onload="window.print()" />` căn giữa màn hình; `onload` của chính thẻ `<img>` đó tự gọi `window.print()` ngay khi ảnh tải xong — KHÔNG cần Shop bấm thêm nút nào trong tab mới.
3. Tách in sang TAB RIÊNG (thay vì in thẳng trang `/shop/settings/qr-codes` hiện tại) để KHÔNG phải viết CSS `@media print` che sidebar/topbar/các phần tử khác của Web Shop — tab mới chỉ có đúng 1 `<img>`, trình duyệt in ra đúng y hệt.
4. Không giữ tham chiếu `printWindow` sau khi mở — mỗi lần bấm "In tem QR" là 1 lần gọi `window.open()` độc lập, trình duyệt tự quản lý vòng đời tab đó (đóng theo thao tác người dùng, không có code nào chủ động đóng lại).
5. Nếu trình duyệt chặn popup (hiếm, do cài đặt riêng của người dùng) → `window.open()` trả về `null`, hàm `return` sớm, KHÔNG có lỗi nào văng ra ngoài — chỉ đơn giản là không mở được tab in.

## Acceptance Criteria

**AC1:** Bấm "In tem QR" → mở đúng 1 tab/cửa sổ mới, chỉ chứa ảnh thẻ tem cách điệu (không lẫn giao diện Web Shop).

**AC2:** Ngay khi ảnh trong tab mới tải xong → hộp thoại in của trình duyệt TỰ ĐỘNG hiện ra, không cần thao tác thêm.

**AC3:** Nội dung ảnh trong tab in ĐÚNG HỆT thẻ tem đang hiển thị ở màn hình "Xem tem QR" gốc (cùng tên shop, cùng mã QR, cùng nút kêu gọi).

**AC4:** Đóng tab in (hoặc huỷ hộp thoại in) → không ảnh hưởng gì tới màn hình "Xem tem QR" ban đầu, dữ liệu tem không đổi.

**AC5:** Bấm "In tem QR" nhiều lần liên tiếp → mỗi lần đều mở đúng 1 tab mới, không bị lỗi/treo trang vì gọi lặp lại.

**AC6:** Trình duyệt chặn popup → không có lỗi JS nào hiện ra console, trang hiện tại vẫn hoạt động bình thường.

## Notes

- Đây là năng lực HOÀN TOÀN MỚI — các bản Tem QR trước đó (v1 2-modal, v2 full-screen gộp chung) CHƯA TỪNG có nút In nào, chỉ có tải ảnh về rồi Shop tự in thủ công.
- Dùng CHUNG `renderCardCanvas()` với SHOP-SETTINGS-8 (Tải PNG/PDF) — đảm bảo bản in và file tải về LUÔN cùng 1 thiết kế, không có 2 đường render khác nhau dễ lệch nhau sau này nếu có đổi UI thẻ tem.
- **PROTOTYPE nhưng NÚT IN LÀ THẬT** — gọi đúng `window.print()` thật của trình duyệt, không phải mô phỏng/nút giả. Kết quả in phụ thuộc máy in/driver thật của người dùng, nằm ngoài phạm vi kiểm soát của ứng dụng.
- Xem SHOP-SETTINGS-3 để biết bố cục màn hình "Xem tem QR" mà nút này nằm trong đó; SHOP-SETTINGS-8 để biết cơ chế rasterize dùng chung.
