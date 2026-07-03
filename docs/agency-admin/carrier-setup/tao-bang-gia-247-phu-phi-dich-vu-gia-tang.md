---
id: AGA-CARRIER-10
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Thiết lập NVC - Bảng giá 247Express: Phụ phí & Dịch vụ gia tăng (Chuyển phát nhanh)

## User Story

Là Agency Admin, tôi muốn xem dữ liệu phụ phí theo hợp đồng và tính tổng phụ phí theo điều kiện thực tế (loại hàng, ngoại thành, xe nâng...) trên từng zone của dịch vụ Chuyển phát nhanh 247Express để tham chiếu khi cấu hình giá bán.

## User Flow

1. Agency Admin ở tab "Chuyển phát nhanh" của trang tạo bảng giá 247Express
2. Tại một zone card, Agency Admin click toggle "Phụ phí" → section phụ phí mở ra bên dưới zone đó
3. Agency Admin chọn loại hàng hoá (hàng thường / nguyên khối / quá khổ), tích checkbox cước hoàn, ngoại thành, nhập số lượng xe nâng
4. Hệ thống tự tính và hiển thị tổng phụ phí dựa trên các lựa chọn
5. Trang cũng hiển thị các bảng tham chiếu cố định từ hợp đồng: Dịch vụ gia tăng nhanh, Phí đóng gói, Dịch vụ gia tăng khác

## System Flow

1. Tỷ lệ phụ phí (%, công thức, mức phí cố định) được lưu trong config của trang — không do Agency Admin nhập
2. Khi Agency Admin chọn các điều kiện, hệ thống áp công thức từ hợp đồng để tính tổng phụ phí
3. Các bảng tham chiếu (Dịch vụ gia tăng nhanh, Phí đóng gói, Dịch vụ gia tăng khác) hiển thị read-only, không lưu vào bảng giá

## Acceptance Criteria

**AC1:** Mỗi zone card trong tab "Chuyển phát nhanh" có toggle "Phụ phí". Khi mở, section hiển thị: dropdown loại hàng hoá (hàng thường / nguyên khối / quá khổ), checkbox "Cước chuyển hoàn", checkbox "Ngoại thành" (phụ phí 20%), ô nhập số lượng xe nâng, tổng phụ phí được tính tự động.

**AC2:** Dữ liệu phụ phí hiển thị đúng theo hợp đồng 1231/2026/HĐDV-247: phụ phí ngoại thành 20%, phụ phí nhiên liệu 24% (hiệu lực 01/05/2026–31/07/2026), phí hàng nguyên khối 10%, phí hàng quá khổ 10%, phí thuê xe nâng 625.000đ/lần.

**AC3:** Trang hiển thị bảng tham chiếu "Dịch vụ gia tăng nhanh" với 2 loại: Phát trong ngày và Phát hẹn giờ — dưới dạng read-only.

**AC4:** Trang hiển thị bảng tham chiếu "Phí đóng gói" theo vật liệu đóng gói — dưới dạng read-only.

**AC5:** Trang hiển thị bảng "Dịch vụ gia tăng khác" với 21 dịch vụ bổ sung (bao gồm: Chụp hình, Khai giá hàng hóa, Hàng đông lạnh, Phí an ninh, và các dịch vụ khác theo hợp đồng) — dưới dạng read-only.

**AC6:** Tất cả dữ liệu trong các bảng tham chiếu là read-only — Agency Admin không thể chỉnh sửa. Nội dung phản ánh đúng hợp đồng 1231/2026/HĐDV-247.

## Notes

- Phụ phí và dịch vụ gia tăng chỉ áp dụng cho dịch vụ "Chuyển phát nhanh" — không có cho "Chuyển phát nhanh tiết kiệm" và "Chuyển phát đường bộ" (xem AGA-CARRIER-11)
