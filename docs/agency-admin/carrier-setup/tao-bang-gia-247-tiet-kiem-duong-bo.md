---
id: AGA-CARRIER-11
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Thiết lập NVC - Bảng giá 247Express: Chuyển phát nhanh tiết kiệm & Chuyển phát đường bộ

## User Story

Là Agency Admin, tôi muốn cấu hình bảng giá cho dịch vụ "Chuyển phát nhanh tiết kiệm" và "Chuyển phát đường bộ" của 247Express theo 5 vùng giao với cơ chế giá base đến 5kg cộng thêm theo 4 band khối lượng để xác định giá bán phù hợp với từng tuyến.

## User Flow

1. Agency Admin mở trang "Tạo bảng giá 247Express" → tab "Chuyển phát nhanh tiết kiệm" hoặc "Chuyển phát đường bộ"
2. Hệ thống hiển thị 5 zone card: Nội tỉnh 1, Nội tỉnh 2, Đến 300km, Đến 1000km, Trên 1000km
3. Mỗi zone card có: ô nhập giá "đến 5kg" (base price) và 4 ô "giá cộng thêm mỗi 1kg tiếp theo" chia theo band
4. Mỗi ô hiển thị giá vốn tham chiếu tương ứng
5. Agency Admin nhập giá bán tại từng ô và có thể bật toggle "Vượt cân" nếu cần cấu hình bậc cước vượt cân

## System Flow

1. 5 zone card được render cố định theo schema của từng dịch vụ — không dùng "Mốc khối lượng" chung như dịch vụ Chuyển phát nhanh
2. Mỗi zone có cấu trúc cố định: 1 ô "đến 5kg" + 4 ô "cộng thêm 1kg" (đến 50kg / đến 200kg / đến 500kg / trên 500kg)
3. Giá vốn là dữ liệu tham chiếu cố định từ hợp đồng — khác nhau giữa 2 dịch vụ
4. Dữ liệu tab tiết kiệm và tab đường bộ lưu hoàn toàn độc lập

## Acceptance Criteria

**AC1:** Tab "Chuyển phát nhanh tiết kiệm" và tab "Chuyển phát đường bộ" mỗi tab hiển thị 5 zone card theo đúng thứ tự: (1) Nội tỉnh 1, (2) Nội tỉnh 2, (3) Đến 300km, (4) Đến 1000km, (5) Trên 1000km.

**AC2:** Mỗi zone card có 2 phần cấu hình: (1) Giá "đến 5kg" (base price, 1 ô nhập giá bán + giá vốn tham chiếu), (2) "Giá cộng thêm mỗi 1kg tiếp theo" với 4 band khối lượng: đến 50kg / đến 200kg / đến 500kg / trên 500kg — mỗi band có ô nhập giá bán và giá vốn tham chiếu.

**AC3:** Hai dịch vụ có cùng cấu trúc zone nhưng giá vốn (247Express cost) khác nhau — hệ thống hiển thị đúng giá vốn theo từng dịch vụ đang chọn.

**AC4:** Cả 2 tab đều hiển thị ghi chú rõ ràng: "Chưa có dữ liệu phụ phí cho dịch vụ này" — không hiển thị toggle "Phụ phí" và không tái sử dụng dữ liệu phụ phí của dịch vụ Chuyển phát nhanh.

**AC5:** Mỗi zone card có toggle "Vượt cân" — khi bật, hiển thị form cấu hình cước vượt cân theo cú pháp "Tăng X đồng trên mỗi Y gram".

**AC6:** Dữ liệu của tab Chuyển phát nhanh tiết kiệm và tab Chuyển phát đường bộ lưu độc lập với nhau và với tab Chuyển phát nhanh.
