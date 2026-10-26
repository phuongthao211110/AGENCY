---
id: SHOP-SETTINGS-3
jiraKey: 
platform: shop
section: Cài đặt
figma: 
status: draft
---

# [WEB SHOP] Cài đặt: Tem QR — Xem tem QR (màn hình riêng, cách điệu)

## Bối cảnh

Tách từ story gốc "Tem QR" (xem SHOP-SETTINGS-2 để biết trang danh sách/store nền). **Bản làm lại (v2)** sau khi đối chiếu với 1 ảnh tham khảo UI thật (mobile app) — bản v1 trước đó là 2 modal RIÊNG ("Xem mã QR" đơn giản + "Xem tem" preview khung nét đứt), đã bị GỘP THÀNH 1 màn hình riêng cách điệu duy nhất, đúng theo ảnh tham khảo. **Tách tiếp lần 2**: phần "Tải xuống" (PNG/PDF) và "In tem QR" — vốn gộp chung trong bản v2 — nay tách thành 2 story riêng (SHOP-SETTINGS-8, SHOP-SETTINGS-9) vì là 2 năng lực kỹ thuật độc lập (rasterize + xuất file khác hẳn mở hộp thoại in). Story này chỉ còn phạm vi: MÀN HÌNH HIỂN THỊ + Copy URL.

## User Story

Là chủ shop, với mỗi tem đã tạo, tôi muốn xem 1 màn hình riêng trình bày tem QR đẹp (có tên đại lý/shop, mã QR thật, lời kêu gọi quét mã) và copy nhanh link đích, để xem lại/chia sẻ tem mà không phải mở nhiều modal khác nhau.

## User Flow

1. Bấm icon **mã QR** (đầu tiên trong cột Thao tác, nay chỉ còn 3 icon — xem SHOP-SETTINGS-2) ở 1 dòng → MỞ MÀN HÌNH RIÊNG (không phải modal/popup — che TOÀN BỘ trang, kể cả sidebar), header có nút **"←" quay lại** + tiêu đề "Xem tem QR".
2. Dưới header: tên tem (to, đậm), rồi tới **thẻ tem cách điệu**: nền cam họa tiết chéo, bên trong có khối trắng bo góc hiện "Bưu cục" + tên shop (chữ cam đậm, viết hoa), bên dưới là khung trắng chứa mã QR THẬT (quét được), có nút tròn dài xanh dương **"QUÉT MÃ TẠO ĐƠN NGAY"** đè lên mép dưới khung QR.
3. Dưới thẻ tem: link đích dạng text (ví dụ `.../shop/orders?qr=<id>`).
4. Nút **"Copy URL"**: copy link đích vào clipboard. (2 nút khác hiện cùng hàng dưới thẻ tem — "Tải xuống" và "In tem QR" — xem riêng SHOP-SETTINGS-8/SHOP-SETTINGS-9, KHÔNG mô tả lại ở đây.)
5. Bấm "←" quay lại → đóng màn hình, về lại đúng danh sách Tem QR, không đổi gì dữ liệu.
6. Toàn bộ màn hình này THUẦN XEM — không có field nào để sửa, không ảnh hưởng `scanCount`/`active`/bất kỳ field nào của tem.

## System Flow

1. `QrStickerFullscreen({ qr, shopName, onClose })` (`QrCodes.tsx`, GỘP từ 2 component cũ `ViewQrModal` + `StickerPreviewModal` thành 1): `position: fixed; inset: 0; zIndex: 2000; background: #fff` — che TOÀN BỘ viewport (không có overlay tối phía sau như modal thường, không phải route điều hướng thật — chỉ là 1 component full-viewport được bật/tắt qua state `stickerQr` ở component cha).
2. Mã QR sinh bằng thư viện `qrcode`, giống hệt cách cũ: `QRCode.toDataURL(qrTargetUrl(qr.id), { width: 200, margin: 1, color: { dark: '#111827', light: '#FFFFFF' } })` → ảnh base64 qua `<img>`.
3. Thẻ tem cách điệu là 1 `<div ref={cardRef}>` — nền `repeating-linear-gradient(135deg, #FF8A3D 0px, #FF8A3D 16px, #FF7A1A 16px, #FF7A1A 32px)` mô phỏng họa tiết chéo cam, bên trong 2 khối trắng bo góc (tên shop; QR + nút kêu gọi đè lên bằng `position: absolute`). `cardRef` này được SHOP-SETTINGS-8/9 dùng lại để rasterize — story đó mới mô tả chi tiết cách chụp/xuất.
4. **Copy URL**: `navigator.clipboard.writeText(qrTargetUrl(qr.id)).catch(() => {})` — `.catch()` THẲNG TRÊN PROMISE (không phải `try/catch` đồng bộ, vốn KHÔNG bắt được lỗi bất đồng bộ của `writeText()` — xem Notes) nếu trình duyệt từ chối quyền clipboard, không crash UI.

## Acceptance Criteria

**AC1:** Bấm icon mã QR → MỞ MÀN HÌNH RIÊNG che toàn bộ trang (không phải modal nhỏ, không còn thấy sidebar/topbar Web Shop phía sau), có nút "←" + tiêu đề "Xem tem QR".

**AC2:** Màn hình hiện đúng: tên tem, thẻ tem nền cam họa tiết với tên shop + mã QR THẬT (quét được, đúng link `{origin}/shop/orders?qr={id}`) + nút "QUÉT MÃ TẠO ĐƠN NGAY" đè lên mép khung QR, link đích dạng text bên dưới.

**AC3:** Bấm "←" → đóng màn hình, quay về đúng danh sách Tem QR (sidebar/topbar hiện lại bình thường), không đổi dữ liệu gì.

**AC4:** Bấm "Copy URL" → copy đúng giá trị `qrTargetUrl(qr.id)` vào clipboard; nếu trình duyệt từ chối quyền clipboard, KHÔNG được làm crash trang.

**AC5:** Mở màn hình này (xem/copy) KHÔNG làm thay đổi `scanCount`, `active`, hay bất kỳ field nào khác của tem — thuần xem, không có side-effect lên dữ liệu.

## Notes

- **Bug đã phát hiện qua UAT và sửa**: `handleCopyLink()` ban đầu viết `try { navigator.clipboard.writeText(link) } catch { ... }` — nhưng `writeText()` trả về 1 `Promise`, lỗi (quyền clipboard bị từ chối) xảy ra BẤT ĐỒNG BỘ nên `try/catch` đồng bộ KHÔNG bắt được, rơi thành unhandled promise rejection làm crash trang. Đã sửa thành `navigator.clipboard.writeText(link).catch(() => {})` — `.catch()` thẳng trên promise mới chặn đúng lỗi. Phát hiện thêm 1 chỗ dùng SAI PATTERN tương tự ở `CashFlowReport.tsx` (nút copy mã thanh toán, SHOP-ORDER-55) và đã sửa cùng lúc — các chỗ copy-to-clipboard khác trong dự án (Super Admin/Agency Admin) vốn đã dùng đúng `.catch()` từ trước.
- **Lịch sử**: bản v1 (2 modal riêng "Xem mã QR"/"Xem tem") đã được build và UAT trước đó — khi user cung cấp thêm 1 ảnh tham khảo mới (màn hình mobile app "Xem tem QR" cách điệu, có nút In + Tải nhiều định dạng + Copy URL riêng), xác nhận đây là tính năng MỚI chưa từng có trong 2 ảnh tham khảo trước. Bản v2 gộp cả Tải/In vào story này; nay tách tiếp (lần 2) thành SHOP-SETTINGS-8 (Tải PNG/PDF) và SHOP-SETTINGS-9 (In tem QR) theo đúng yêu cầu "tách các tính năng vừa thêm thành task riêng".
- Theo yêu cầu của user: dựng ĐÚNG full-screen như ảnh tham khảo (có phần tương đương "thanh trạng thái"/header + nút back của mobile app) thay vì giữ dạng modal nhỏ — đây là NGOẠI LỆ duy nhất trong Web Shop dùng pattern full-viewport-overlay thay vì modal.
- Xem SHOP-SETTINGS-4 để biết chuyện gì xảy ra khi link này THỰC SỰ được mở (quét QR thật, không chỉ xem ở đây); SHOP-SETTINGS-8 (Tải PNG/PDF); SHOP-SETTINGS-9 (In tem QR).
