---
id: AGA-CARRIER-8
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Thiết lập NVC - Bảng giá 247Express: Selector dịch vụ và cấu trúc zone block

## User Story

Là Agency Admin, tôi muốn tạo bảng giá cho 247Express bằng cách chọn từng dịch vụ cụ thể và cấu hình giá theo từng zone dưới dạng card riêng biệt để mỗi dịch vụ có cấu hình độc lập và không ảnh hưởng lẫn nhau trong cùng một lần tạo bảng giá.

## User Flow

1. Agency Admin truy cập Thiết lập NVC → tab Bảng giá → chọn NVC "247Express" → click "Thêm bảng giá"
2. Hệ thống mở trang "Tạo bảng giá 247Express"
3. Trang hiển thị 3 tab dịch vụ ở đầu: "Chuyển phát nhanh" / "Chuyển phát nhanh tiết kiệm" / "Chuyển phát đường bộ"
4. Agency Admin chọn một tab dịch vụ → nội dung bên dưới hiển thị các zone block tương ứng với dịch vụ đó
5. Mỗi zone được hiển thị dạng card có viền trái màu sắc đặc trưng, tên zone, và các field nhập giá bán kèm giá vốn tham chiếu
6. Agency Admin cấu hình lần lượt các dịch vụ → dữ liệu mỗi dịch vụ được lưu độc lập khi chuyển tab
7. Agency Admin hoàn tất và submit bảng giá

## System Flow

1. Trang khởi tạo state độc lập cho từng dịch vụ (3 slice riêng biệt)
2. Khi chuyển tab dịch vụ, hệ thống giữ nguyên dữ liệu tab cũ và load dữ liệu tab mới từ state
3. Mỗi dịch vụ có schema zone khác nhau: "Chuyển phát nhanh" có 6 zone, "Chuyển phát nhanh tiết kiệm" và "Chuyển phát đường bộ" mỗi dịch vụ có 5 zone
4. Mỗi zone được render dưới dạng card với toggle "Vượt cân" (và "Phụ phí" riêng cho Chuyển phát nhanh)
5. Khi Agency Admin submit, hệ thống validate và lưu toàn bộ 3 dịch vụ

## Cấu trúc dữ liệu

Bảng giá 247Express tham chiếu hợp đồng số **1231/2026/HĐDV-247**. Gồm 3 dịch vụ độc lập:

| Dịch vụ | Số zone | Cơ chế giá | Phụ phí |
|---------|---------|------------|---------|
| Chuyển phát nhanh | 6 | Bậc gram (50g–2000g) + "+500gr tiếp theo" | Có (ngoại thành, nhiên liệu, hàng đặc biệt, xe nâng...) |
| Chuyển phát nhanh tiết kiệm | 5 | Base đến 5kg + cộng thêm 1kg (4 band) | Chưa có dữ liệu |
| Chuyển phát đường bộ | 5 | Base đến 5kg + cộng thêm 1kg (4 band) | Chưa có dữ liệu |

## Acceptance Criteria

**AC1:** Trang "Tạo bảng giá 247Express" hiển thị tiêu đề bảng giá kèm ghi chú tham chiếu hợp đồng số 1231/2026/HĐDV-247.

**AC2:** Trang có 3 tab dịch vụ ở đầu: "Chuyển phát nhanh" / "Chuyển phát nhanh tiết kiệm" / "Chuyển phát đường bộ". Mặc định chọn tab đầu tiên.

**AC3:** Dữ liệu từng tab dịch vụ lưu độc lập — Agency Admin có thể cấu hình cả 3 dịch vụ trong cùng một lần tạo bảng giá mà không mất dữ liệu khi chuyển tab.

**AC4:** Mỗi zone được render dưới dạng card riêng biệt có viền trái màu sắc, hiển thị tên zone, và các field nhập giá bán bên cạnh label giá vốn tham chiếu.

**AC5:** Tab "Chuyển phát nhanh" hiển thị 6 zone card. Tab "Chuyển phát nhanh tiết kiệm" và "Chuyển phát đường bộ" mỗi tab hiển thị 5 zone card.

**AC6:** Mỗi zone card có toggle "Vượt cân" — khi bật, hiển thị form cấu hình cước vượt cân theo cú pháp "Tăng X đồng trên mỗi Y gram" (nhất quán với PricingCreate GHN).

**AC7:** Tab "Chuyển phát nhanh" có thêm toggle "Phụ phí" trên mỗi zone card; tab "Chuyển phát nhanh tiết kiệm" và "Chuyển phát đường bộ" không có toggle này.

## Notes

- Kiến trúc zone block tương đồng với `PricingCreate.tsx` (GHN "tuyến" route blocks) — tham khảo pattern đó khi implement để đảm bảo nhất quán
- 3 dịch vụ 247Express là KHÔNG thể hoán đổi — giá vốn và cấu trúc zone của mỗi dịch vụ là khác nhau hoàn toàn
