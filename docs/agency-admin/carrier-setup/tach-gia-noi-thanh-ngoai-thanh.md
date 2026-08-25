---
id: AGA-CARRIER-16
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGA] Thiết lập NVC - Tạo bảng giá: Tách giá Nội thành / Ngoại thành theo tuyến

## User Story

Là Agency Admin (Đại lý), tôi muốn tuỳ chọn tách giá cước của từng tuyến
thành 2 mức "Nội thành" và "Ngoại thành" thay vì chỉ dùng 1 giá chuẩn chung,
để cấu hình bảng giá sát hơn với thực tế vận hành khi mức phí giữa nội/ngoại
thành khác nhau đáng kể.

## User Flow

1. Agency Admin vào màn **Tạo bảng giá** (Thiết lập NVC → tab Bảng giá → Thêm bảng giá)
2. Thêm hoặc chọn một tuyến trong danh sách tuyến
3. Mỗi tuyến hiển thị ô **Giá chuẩn *** và bên dưới có toggle **Tách khu vực** (mặc định TẮT)
4. Để dùng 1 giá chung: nhập giá vào ô **Giá chuẩn** như bình thường, không bật toggle
5. Để tách Nội/Ngoại thành: bật toggle **Tách khu vực**
   - Ô **Giá chuẩn** đơn được thay bằng 2 ô riêng: **Nội thành** và **Ngoại thành**
   - Nhập giá VNĐ cho từng ô
6. Tắt lại toggle: quay về 1 ô **Giá chuẩn**, giá trị Nội/Ngoại thành bị ẩn (không xoá)
7. Lưu bảng giá

## System Flow

1. Mỗi tuyến lưu trạng thái toggle `splitZone: boolean` độc lập — không ảnh hưởng tuyến khác
2. Khi `splitZone = false`: validate và lưu `basePrice` (giá chuẩn đơn)
3. Khi `splitZone = true`: validate và lưu `innerPrice` (Nội thành) + `outerPrice` (Ngoại thành); `basePrice` không dùng
4. Phần **Vượt cân** và **Phụ phí** vẫn áp dụng chung cho tuyến, không tách theo Nội/Ngoại thành
5. Submit form hiện chỉ chặn khi thiếu **Tên bảng giá** — chưa validate ô giá của từng tuyến (kể cả trước khi có tính năng này), xem AC6/AC7

## Acceptance Criteria

**AC1:** Mỗi dòng tuyến trong form tạo bảng giá có toggle **Tách khu vực** nằm bên dưới ô Giá chuẩn, mặc định ở trạng thái TẮT.

**AC2:** Khi toggle TẮT — tuyến hiển thị 1 ô **Giá chuẩn *** *(bắt buộc)*: số nguyên ≥ 0, đơn vị VNĐ.

**AC3:** Khi bật toggle **Tách khu vực** — ô Giá chuẩn được thay thế bằng 2 ô riêng:
- **Nội thành *** *(bắt buộc)*: số nguyên ≥ 0, đơn vị VNĐ
- **Ngoại thành *** *(bắt buộc)*: số nguyên ≥ 0, đơn vị VNĐ

**AC4:** Toggle **Tách khu vực** hoạt động độc lập theo từng tuyến — bật tuyến A không ảnh hưởng tuyến B.

**AC5:** Khi tắt lại toggle sau khi đã nhập Nội/Ngoại thành — UI quay về ô Giá chuẩn đơn; giá trị đã nhập cho Nội/Ngoại thành bị ẩn khỏi UI nhưng không bị xoá.

**AC6:** Submit form không chặn dù ô Giá chuẩn (toggle TẮT) đang để trống — giữ đúng hành vi hiện có của form trước khi có tính năng này (form chỉ chặn submit khi thiếu Tên bảng giá).

**AC7:** Submit form không chặn dù ô Nội thành hoặc Ngoại thành (toggle BẬT) đang để trống — tương tự AC6, chưa có validate bắt buộc ở cấp field giá.

**AC8:** Phần **Vượt cân** và **Phụ phí** không tách theo Nội/Ngoại thành — vẫn là 1 cấu hình chung cho toàn tuyến dù toggle bật hay tắt.

## Notes

- Tính năng này lấy cảm hứng từ cấu trúc bảng giá thực tế của GHN dịch vụ "Đi bộ": mỗi tuyến có 2 cột giá Nội thành/Ngoại thành + 1 cột "Thêm 0.5kg" dùng chung.
- Toggle là tuỳ chọn per-tuyến, không phải cấu hình toàn bảng giá — đây là điểm khác biệt so với các cấu hình bảng giá khác (Vượt cân, Phụ phí áp dụng toàn tuyến).
- Khi tắt toggle, dữ liệu Nội/Ngoại thành không bị mất — hành vi này cho phép Agency Admin thử bật/tắt mà không mất công nhập lại, nhưng giá trị ẩn đó không được lưu nếu submit ở trạng thái TẮT.
