---
id: SHOP-SETTINGS-8
jiraKey: 
platform: shop
section: Cài đặt
figma: 
status: draft
---

# [WEB SHOP] Cài đặt: Tem QR — Tải tem QR (PNG & PDF)

## Bối cảnh

Tách từ SHOP-SETTINGS-3 (xem màn hình "Xem tem QR" đầy đủ) — phần "Tải xuống" ban đầu gộp chung trong story đó, nay tách riêng vì là 1 năng lực kỹ thuật độc lập (chụp DOM thành ảnh rồi xuất file) không liên quan tới bố cục màn hình xem.

## User Story

Là chủ shop đang xem màn hình "Xem tem QR" của 1 tem, tôi muốn tải về đúng thiết kế tem đang hiển thị (không chỉ ảnh QR trắng đen đơn thuần) dưới dạng PNG hoặc PDF, để có file sẵn sàng gửi đi in ấn chuyên nghiệp hoặc lưu trữ.

## User Flow

1. Trong màn hình "Xem tem QR" (SHOP-SETTINGS-3), bấm nút **"Tải xuống ▾"** → mở dropdown 2 lựa chọn: **"Tải PNG"** / **"Tải PDF"**.
2. Chọn **"Tải PNG"** → tải về 1 file `.png` chứa ĐÚNG thẻ tem cách điệu đang hiển thị (nền cam họa tiết + tên shop + QR + nút kêu gọi) — không phải chỉ ảnh QR trắng đen trơn.
3. Chọn **"Tải PDF"** → tải về 1 file `.pdf` 1 trang, chứa CÙNG ảnh thẻ tem đó, kích thước trang khớp đúng tỉ lệ ảnh (không bị méo/cắt/co giãn sai).
4. Bấm ra ngoài dropdown (không chọn gì) → dropdown tự đóng, không tải gì.
5. Tải nhiều lần liên tiếp (PNG rồi PDF, hoặc PNG nhiều lần) → mỗi lần đều ra đúng 1 file mới, không bị lẫn/ghi đè dữ liệu của lần trước.

## System Flow

1. Dùng lại `cardRef` (tham chiếu tới `<div>` thẻ tem cách điệu) đã có sẵn từ SHOP-SETTINGS-3 — KHÔNG tạo thêm DOM/ảnh riêng cho việc tải, đảm bảo file tải về LUÔN khớp 100% với những gì đang hiển thị trên màn hình.
2. `renderCardCanvas()`: `html2canvas(cardRef.current, { backgroundColor: null, scale: 2 })` (thư viện MỚI `html2canvas`, `npm install html2canvas`, thêm vào `package.json`) → trả về `<canvas>` độ phân giải gấp đôi (scale 2) để ảnh/PDF tải về nét hơn, không bị vỡ hạt khi phóng to.
3. `handleDownload('png' | 'pdf')`: gọi `renderCardCanvas()` MỖI LẦN bấm (không cache canvas cũ) — đảm bảo nếu dữ liệu tem vừa đổi (hiếm khi xảy ra vì màn hình này không cho sửa) thì ảnh tải về vẫn luôn mới nhất.
4. **PNG**: `canvas.toDataURL('image/png')` → tạo thẻ `<a href={dataUrl} download="tem-qr-{tên tem}.png">` → `.click()` ngay (không hiện UI trung gian nào) — tải file ảnh THẬT, không phải nút giả.
5. **PDF**: thư viện MỚI `jsPDF` (`npm install jspdf`, thêm vào `package.json`) — `new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] })` (khởi tạo trang PDF ĐÚNG kích thước pixel của canvas, không dùng khổ giấy cố định A4/Letter để tránh méo tỉ lệ), `pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height)`, `pdf.save('tem-qr-{tên tem}.pdf')`.
6. Tên file cả 2 định dạng: `tem-qr-{qr.name thay khoảng trắng bằng dấu gạch ngang}.{ext}` — nhất quán giữa PNG/PDF, dễ nhận ra khi tải nhiều tem khác nhau.
7. Dropdown "Tải xuống ▾" dùng CHUNG pattern overlay-trong suốt-bắt-click-ngoài đã có sẵn ở nhiều nơi khác trong dự án (ví dụ dropdown "Trạng thái" ở Agency Admin "Duyệt thanh toán", AGA-PAYMENT-1) — click ngoài hoặc chọn 1 lựa chọn đều tự đóng dropdown.

## Acceptance Criteria

**AC1:** Bấm "Tải xuống" → hiện dropdown đúng 2 lựa chọn "Tải PNG"/"Tải PDF", không có lựa chọn thừa/thiếu.

**AC2:** Chọn "Tải PNG" → tải về đúng 1 file `.png`, tên file chứa `tem-qr-` + tên tem, nội dung ảnh là ĐÚNG thẻ tem cách điệu (nền cam + tên shop + QR + nút kêu gọi), không phải chỉ mã QR trắng đen.

**AC3:** Chọn "Tải PDF" → tải về đúng 1 file `.pdf`, đúng 1 trang, kích thước trang khớp tỉ lệ ảnh thẻ tem (không méo/không bị cắt viền).

**AC4:** Bấm ra ngoài dropdown mà không chọn gì → dropdown đóng lại, KHÔNG có file nào được tải.

**AC5:** Tải PNG rồi tải PDF liên tiếp (không đóng màn hình giữa chừng) → cả 2 file đều đúng nội dung, không bị lẫn/dùng nhầm canvas của nhau.

## Notes

- `html2canvas`/`jsPDF` CHỈ dùng trong phạm vi tính năng Tem QR (SHOP-SETTINGS-3/8/9) — không ảnh hưởng/dùng chung với bất kỳ chỗ nào khác trong dự án.
- **PROTOTYPE nhưng NÚT TẢI LÀ THẬT** — xuất file PNG/PDF thật xuống máy, không phải nút giả/mô phỏng.
- Dùng CHUNG `renderCardCanvas()` với SHOP-SETTINGS-9 (In tem QR) — cả 2 story đều rasterize đúng `cardRef`, đảm bảo file tải về và bản in LUÔN cùng 1 thiết kế.
- Xem SHOP-SETTINGS-3 để biết bố cục màn hình "Xem tem QR" mà nút này nằm trong đó.
