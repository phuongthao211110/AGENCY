---
id: AGA-CARRIER-25
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGENCY] Thiết lập NVC - Tạo bảng giá: Xem chi tiết bộ tuyến đang áp dụng

## User Story

Là Agency Admin, tôi muốn xem đầy đủ Vùng miền, Tuyến, và Nội/Ngoại thành của bộ tuyến đang áp dụng cho bảng giá ngay tại trang Tạo bảng giá, để hiểu rõ cấu hình trước khi nhập giá cho từng tuyến, mà không cần rời trang hay hỏi Super Admin.

## User Flow

1. Tại trang "Tạo bảng giá", card "Thông tin cơ bản" → dòng "Bộ tuyến áp dụng" (xem AGA-CARRIER-22) → bấm link **"Xem chi tiết"**.
2. Modal **"Bảng mô tả tuyến dịch vụ"** mở ra — ĐÚNG CÙNG 1 modal với nút "Định nghĩa tuyến" ở khối "Danh sách tuyến", không phải modal riêng. Nội dung gồm:
   - Danh sách Vùng miền của bộ (tên vùng + số tỉnh/thành).
   - Bảng Tuyến ↔ Cặp vùng miền (mỗi tuyến liệt kê các cặp vùng miền đang gán, kèm badge khoá nếu có — xem AGA-CARRIER-23).
   - Danh sách Nội thành/Ngoại thành theo từng tỉnh đã cấu hình.
3. Nội dung modal LUÔN phản ánh đúng bộ đang chọn ở dòng "Bộ tuyến áp dụng" — nếu vừa đổi bộ qua "Thay đổi" (AGA-CARRIER-26) rồi mới bấm "Xem chi tiết", modal hiện dữ liệu của bộ MỚI, không phải bộ cũ.
4. Đóng modal (nút X hoặc click ra ngoài) → quay lại form Tạo bảng giá, không có gì thay đổi — đây là modal CHỈ XEM, không có thao tác chỉnh sửa nào.

## System Flow

1. `PricingCreate.tsx`: nút "Xem chi tiết" gọi `setShowZoneGuide(true)` — state `showZoneGuide` dùng CHUNG với nút "Định nghĩa tuyến" ở khối "Danh sách tuyến" (cùng 1 state, cùng 1 modal, 2 điểm vào).
2. `<ZoneGuideModal bundle={selectedBundle} onClose={() => setShowZoneGuide(false)} />` — prop `bundle` LUÔN là `selectedBundle` hiện tại (derive từ `selectedBundleId`, xem AGA-CARRIER-22), nên tự động đổi nội dung ngay khi `selectedBundleId` đổi qua AGA-CARRIER-26.
3. `ZoneGuideModal` tự build dữ liệu hiển thị từ `bundle.regions`, `bundle.routeMatrix` (qua `listRouteNamesIn(bundle)`, `isSameProvinceRouteNameIn(bundle, x)`, `describeSameProvinceRoutePairsIn(bundle, x)`) và `bundle.urbanConfigs` — không đọc state global của `routeConfig.ts`.
4. Badge khoá trong bảng Tuyến ↔ Cặp vùng miền gọi `routeLockStatusIn(bundle, routeName)` — xem AGA-CARRIER-23 để biết đầy đủ quy tắc full/partial.
5. Modal không có nút lưu/sửa nào — đóng bằng `onClose`, không mutate bất kỳ state nào của `PricingCreate.tsx` hay `routeConfig.ts`.

## Acceptance Criteria

**AC1:** Bấm "Xem chi tiết" ở dòng "Bộ tuyến áp dụng" → mở đúng modal "Bảng mô tả tuyến dịch vụ" — cùng modal với nút "Định nghĩa tuyến" ở khối "Danh sách tuyến" (không phải 2 modal khác nhau).

**AC2:** Nội dung modal hiển thị đủ 3 phần: Vùng miền, bảng Tuyến ↔ Cặp vùng miền (kèm badge khoá), Nội/Ngoại thành — của ĐÚNG bộ đang chọn ở "Bộ tuyến áp dụng".

**AC3:** Nếu vừa đổi bộ qua "Thay đổi" (AGA-CARRIER-26) rồi mới bấm "Xem chi tiết" → modal hiện dữ liệu của bộ MỚI vừa chọn, không phải bộ trước đó.

**AC4:** Modal không có bất kỳ nút chỉnh sửa/lưu nào — đóng modal không làm thay đổi gì ở form Tạo bảng giá hay dữ liệu Vùng & Tuyến của Super Admin.

## Notes

- Đây KHÔNG phải modal riêng mới tạo — là modal `ZoneGuideModal` đã có sẵn (trước đây chỉ mở được qua nút "Định nghĩa tuyến"), nay có thêm 1 điểm vào thứ 2 từ dòng "Bộ tuyến áp dụng". Không có logic mới nào trong `ZoneGuideModal` — chỉ thêm 1 chỗ gọi `setShowZoneGuide(true)`.
- Xem AGA-CARRIER-22 để biết dòng "Bộ tuyến áp dụng" hiển thị/mặc định ra sao; AGA-CARRIER-26 để biết cách đổi bộ qua "Thay đổi".
- Xem AGA-CARRIER-23 để biết đầy đủ quy tắc hiển thị badge khoá (full/partial) trong bảng Tuyến ↔ Cặp vùng miền của modal này.
