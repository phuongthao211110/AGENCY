---
id: SHOP-SETTINGS-7
jiraKey: 
platform: shop
section: Cài đặt
figma: 
status: draft
---

# [WEB SHOP] Cài đặt: Tem QR — Chỉnh sửa tem

## Bối cảnh

Tách từ story gốc "Tem QR" (xem SHOP-SETTINGS-2 để biết trang danh sách/store nền). Tính năng Sửa tem được bổ sung SAU, theo đúng 1 ảnh tham khảo UI thật "Chỉnh sửa tem QR" — trước đó chỉ có Thêm (SHOP-SETTINGS-2)/Bật-tắt-ngoài-bảng/Xoá (SHOP-SETTINGS-5).

## User Story

Là chủ shop, tôi muốn sửa lại tên/hạn/giới hạn lượt quét/ghi chú của 1 tem đã tạo, và bật/tắt trạng thái ngay trong CÙNG 1 modal, để chỉnh lại thông tin khi cần mà không phải xoá tạo lại tem mới (mất hết lịch sử lượt quét).

## User Flow

1. Bấm icon **bút chì** (thứ hai trong cột Thao tác — nay chỉ còn 3 icon, xem SHOP-SETTINGS-2) ở 1 dòng → modal **"Chỉnh sửa tem QR"** mở ra với 4 field GIỐNG modal Thêm (xem SHOP-SETTINGS-2), đã điền sẵn ĐÚNG giá trị hiện tại của tem đó (kể cả giờ hết hạn hiển thị đúng theo giờ LOCAL trình duyệt).
2. Cộng thêm khối **"Đang hoạt động:"** (toggle + chú thích "Tắt để vô hiệu hoá tem — mọi phiên khách đang mở sẽ bị thu hồi ngay.") — khối này CHỈ xuất hiện ở modal Sửa, KHÔNG có ở modal Thêm.
3. Đổi "Tên tem"/"Ghi chú"/"Giới hạn lượt quét"/"Thời điểm hết hạn" rồi bấm **"Lưu thay đổi"** → bảng cập nhật đúng giá trị mới NGAY, không tạo thêm dòng mới, `id`/mã tem/lượt quét đã có KHÔNG đổi.
4. Tắt toggle "Đang hoạt động" rồi "Lưu thay đổi" → sửa được CẢ trạng thái bật/tắt ngay trong modal này (không bắt buộc phải đóng modal rồi bấm toggle ở bảng mới có hiệu lực — xem SHOP-SETTINGS-5 để biết cách sửa trạng thái NGOÀI modal này).
5. Xoá trắng "Tên tem" → nút "Lưu thay đổi" disabled, không lưu được — giống hệt validate của modal Thêm.

## System Flow

1. `QrFormModal({ mode: 'edit', initial, onSave, onClose })` — component DÙNG CHUNG với modal Thêm (xem SHOP-SETTINGS-2), refactor từ 2 component riêng ban đầu thành 1 component chung; khác nhau ở tiêu đề ("Chỉnh sửa tem QR" vs "Thêm tem QR"), nhãn nút lưu ("Lưu thay đổi" vs "Thêm tem QR"), và khối toggle "Đang hoạt động" (CHỈ render khi `mode === 'edit'`).
2. `isoToLocalInput(iso)` (`QrCodes.tsx`, helper riêng cho modal Sửa): chuyển ISO string lưu trong `qr.expiresAt` sang định dạng input `datetime-local` theo giờ LOCAL của trình duyệt — cần thiết vì input HTML `datetime-local` không tự hiểu timezone, nếu không chuyển đúng sẽ hiện sai giờ khi mở lại modal Sửa.
3. `updateQrCode(id, input: { name, expiresAt, scanLimit, note, active })` (`qrStore.ts`): cập nhật CẢ 4 field lẫn trạng thái `active` CÙNG LÚC qua đúng 1 lần gọi/1 lần lưu — KHÔNG đổi `id`/`shopId`/`scanCount`/`createdAt`.
4. `handleEditSave()` (`QrCodes.tsx`): gọi `updateQrCode()` rồi đóng modal, bảng tự re-render với dữ liệu mới (đọc lại `loadQrCodes(shopId)`).
5. Nếu giới hạn lượt quét MỚI < `scanCount` hiện có → tem lập tức coi là hết lượt ở lần quét kế tiếp (xem `isQrCodeUsable()`, SHOP-SETTINGS-4/5) — không cần xử lý gì thêm, logic đã tự đúng vì chỉ so sánh trực tiếp `scanCount >= scanLimit`.

## Acceptance Criteria

**AC1:** Bấm icon bút chì → modal "Chỉnh sửa tem QR" mở ra với 4 field ĐÃ ĐIỀN ĐÚNG giá trị hiện tại của tem đó (kể cả giờ hết hạn hiển thị đúng theo giờ LOCAL trình duyệt), kèm toggle "Đang hoạt động" đúng trạng thái hiện tại.

**AC2:** Đổi "Tên tem"/"Ghi chú"/"Giới hạn lượt quét"/"Thời điểm hết hạn" rồi bấm "Lưu thay đổi" → bảng cập nhật đúng giá trị mới NGAY, không tạo thêm dòng mới, `id`/mã tem/lượt quét đã có KHÔNG đổi.

**AC3:** Tắt toggle "Đang hoạt động" rồi "Lưu thay đổi" → Trạng thái ở bảng đổi ngay "Đã vô hiệu"; mở lại link QR của tem đó → bị từ chối (xem SHOP-SETTINGS-4 AC2) — không cần đóng modal rồi bấm toggle ở bảng mới có hiệu lực.

**AC4:** Xoá trắng "Tên tem" → nút "Lưu thay đổi" disabled, không lưu được (giống AC2 của modal Thêm, SHOP-SETTINGS-2).

**AC5:** Sửa giới hạn lượt quét xuống THẤP HƠN `scanCount` hiện có → tem lập tức bị coi là hết lượt ở lần quét kế tiếp, không cần thao tác gì thêm.

## Notes

- Dòng chú thích "Tắt để vô hiệu hoá tem — mọi phiên khách đang mở sẽ bị thu hồi ngay" chỉ mang tính MÔ TẢ hành vi đã có sẵn (mọi lượt quét đều tự kiểm `isQrCodeUsable()` ngay tại thời điểm quét — xem SHOP-SETTINGS-4) — không cần thêm cơ chế "thu hồi phiên" nào khác, vì app không có khái niệm phiên khách đang mở kéo dài (mỗi lượt quét là 1 lần tải trang độc lập, không có session server-side nào để "thu hồi" theo đúng nghĩa đen).
- `isoToLocalInput()` ban đầu được viết trước khi có caller (lỗi TS "declared but never read"), bị xoá, rồi thêm lại đúng lúc modal Sửa thực sự cần tới.
- Xem SHOP-SETTINGS-5 để biết cách sửa trạng thái bật/tắt theo cách KHÁC (toggle ngoài bảng, không qua modal này).
