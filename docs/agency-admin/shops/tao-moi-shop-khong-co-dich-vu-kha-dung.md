---
id: AGA-SHOP-10
jiraKey: 
platform: agency-admin
section: Quản lý Shop
figma: 
status: draft
---

# [AGENCY] Shop - Tạo mới shop: Không có dịch vụ khả dụng

## User Story

Là Agency Admin (Đại lý), khi đại lý CHƯA cấu hình dịch vụ vận chuyển nào, tôi muốn Section "Cấu hình dịch vụ" ở màn tạo shop mới đơn giản là hiển thị rỗng, để tôi vẫn tạo shop bình thường mà không bị chặn hay bị làm phiền bởi thông báo/điều hướng không cần thiết.

## User Flow

1. Đại lý chưa từng cấu hình dịch vụ nào (vào "Thiết lập NVC" chưa có Service nào active)
2. Vào "Tạo mới shop", kéo xuống Section 3 "Cấu hình dịch vụ"
3. Section hiện đúng tiêu đề + mô tả, phần bảng dịch vụ hiển thị rỗng (không có dòng dịch vụ nào) — đây là hành vi ĐÚNG, không phải lỗi cần sửa
4. Agency Admin bỏ qua Section này, tiếp tục điền các phần còn lại và bấm "Tạo mới" — shop được tạo bình thường, không bị chặn
5. Shop tạo xong có `configuredServices` rỗng — giống hệt case shop tự đăng ký ([AGA-SHOP-9](./nhan-dien-shop-tu-dang-ky.md)), sau này agency cấu hình dịch vụ ở "Thiết lập NVC" rồi vào sửa shop để gắn bảng giá sau

## System Flow

1. `allServices` (`mock-data/services.json`) lọc theo `agencyId` hiện tại trong `ShopCreate.tsx` — nếu rỗng, `visibleServiceIds` và `addableServices` đều rỗng theo, khớp đúng hành vi mong muốn
2. Không cần thêm nhánh check `length === 0` hay khối thông báo/CTA nào — bảng rỗng tự nhiên (chỉ còn header) đã là đúng yêu cầu, không phải gap cần vá
3. `canCreate` (dòng 109: `!requiredMissing && !phoneInvalid && !usernameTaken`) không tính đến việc thiếu dịch vụ — đúng ý: nút "Tạo mới" vẫn bật, không chặn tạo shop chỉ vì chưa có dịch vụ
4. Nút "Thêm dịch vụ" tự ẩn khi `addableServices` rỗng (dòng 434) — không cần hiện nút này khi không có gì để thêm, hành vi hiện tại đã đúng

## Acceptance Criteria

**AC1:** Khi đại lý chưa có Service nào active → Section "Cấu hình dịch vụ" hiển thị rỗng (chỉ còn header bảng, không có dòng dịch vụ nào) — không hiện thông báo lỗi, không hiện CTA điều hướng.

**AC2:** Nút "Thêm dịch vụ" không hiện khi không có dịch vụ nào khả dụng để thêm — đúng hành vi hiện tại, giữ nguyên.

**AC3:** Agency Admin vẫn tạo được shop bình thường dù Section "Cấu hình dịch vụ" đang rỗng — nút "Tạo mới" không bị khoá.

**AC4:** Shop tạo xong trong trường hợp này có `configuredServices` rỗng (`[]`), không lỗi, không crash.

**AC5:** Ngay khi đại lý có ít nhất 1 dịch vụ active, lần tạo shop tiếp theo Section 3 hiện lại đúng bảng dịch vụ bình thường với dòng dữ liệu thật.

## Notes

- **Đính chính:** bản nháp đầu tiên của story này hiểu sai — đề xuất thêm khối thông báo + CTA điều hướng sang "Thiết lập NVC" khi rỗng (dựa theo AC8 của [AGA-SHOP-6](./tao-moi-shop-cau-hinh-dich-vu.md), vốn cũng chỉ là spec chưa xác nhận lại). Đại lý xác nhận trực tiếp: hành vi ĐÚNG là hiển thị rỗng đơn giản, không cần thông báo/CTA gì thêm — story đã viết lại theo đúng hướng này.
- Vì vậy đây KHÔNG còn là gap cần vá — mã nguồn hiện tại (`ShopCreate.tsx`) đã hoạt động đúng: `allServices` rỗng → bảng rỗng, nút Thêm dịch vụ tự ẩn, không chặn tạo shop. Story này ghi nhận lại hành vi đúng để tránh nhầm lẫn về sau (kể cả trong chính phiên làm việc này).
- AC8 của AGA-SHOP-6 (thông báo hướng dẫn + CTA) theo đó cũng cần xem lại/loại bỏ nếu muốn đồng bộ — chưa tự ý sửa AGA-SHOP-6 trong lần này vì chưa được yêu cầu, chỉ nêu ra để lưu ý.
