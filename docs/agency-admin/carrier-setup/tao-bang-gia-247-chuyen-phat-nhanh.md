---
id: AGA-CARRIER-9
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Thiết lập NVC - Bảng giá 247Express: Dịch vụ Chuyển phát nhanh

## User Story

Là Agency Admin, tôi muốn cấu hình bảng giá chi tiết cho dịch vụ "Chuyển phát nhanh" của 247Express theo 6 vùng giao và các bậc khối lượng (gram bracket) để xác định giá bán phù hợp với chi phí của từng tuyến.

## User Flow

1. Agency Admin mở trang "Tạo bảng giá 247Express" → tab "Chuyển phát nhanh"
2. Hệ thống hiển thị phần cấu hình "Mốc khối lượng" chung dùng cho tất cả zone (mặc định: 50g, 100g, 200g, 500g, 1000g, 2000g)
3. Agency Admin thêm, xoá hoặc chỉnh sửa các mốc → tất cả 6 zone card cập nhật đồng bộ
4. Hệ thống hiển thị 6 zone card: Nội tỉnh 1, Nội tỉnh 2, Đến 300km, Trên 300km, Nội tỉnh 1 HCM↔ĐN/ĐN↔HN, Nội tỉnh 1 HCM↔HN
5. Với mỗi zone, Agency Admin nhập giá bán tại từng mốc khối lượng và 2 mức "+500gr tiếp theo" (band 2–10kg và >10kg)
6. Mỗi ô nhập giá bán hiển thị label "Giá vốn: X đ" tham chiếu bên cạnh

## System Flow

1. Phần "Mốc khối lượng" là shared config — khi thay đổi, hệ thống cập nhật số hàng của tất cả 6 zone card
2. Mỗi zone card render bảng giá theo danh sách mốc hiện tại + 2 hàng bổ sung "+500gr tiếp theo" (2–10kg và >10kg)
3. Field "Giá bán" nhận số nguyên dương, hiển thị format phân cách nghìn (.)
4. Giá vốn là dữ liệu tham chiếu cố định từ hợp đồng 247Express, không do Agency Admin nhập

## Acceptance Criteria

**AC1:** Tab "Chuyển phát nhanh" có phần cấu hình "Mốc khối lượng" chung (shared across all zones): các mốc gram mặc định 50g, 100g, 200g, 500g, 1000g, 2000g. Agency Admin có thể thêm mốc mới, xoá mốc hiện có, hoặc chỉnh sửa giá trị. Thay đổi mốc → tất cả 6 zone card cập nhật đồng bộ ngay lập tức.

**AC2:** 6 zone card hiển thị đúng thứ tự và tên: (1) Nội tỉnh 1, (2) Nội tỉnh 2, (3) Đến 300km, (4) Trên 300km, (5) Nội tỉnh 1 HCM↔ĐN / ĐN↔HN, (6) Nội tỉnh 1 HCM↔HN.

**AC3:** Mỗi zone card hiển thị bảng giá theo mốc khối lượng. Mỗi hàng gồm: nhãn mốc khối lượng, ô nhập "Giá bán" (đồng, bắt buộc khi zone được kích hoạt), label "Giá vốn: X đ" tham chiếu từ 247Express.

**AC4:** Ngoài các mốc khối lượng, mỗi zone có thêm 2 hàng "+500gr tiếp theo": một cho band 2–10kg và một cho >10kg, mỗi hàng có ô nhập giá bán và giá vốn tham chiếu riêng.

**AC5:** Mỗi zone card có toggle "Vượt cân" — khi bật, hiển thị form cấu hình cước vượt cân theo cú pháp "Tăng X đồng trên mỗi Y gram".

**AC6:** Mỗi zone card có toggle "Phụ phí" — khi bật, mở section phụ phí của zone đó (chi tiết tại AGA-CARRIER-10).
