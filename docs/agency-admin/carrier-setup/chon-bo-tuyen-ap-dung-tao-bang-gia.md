---
id: AGA-CARRIER-22
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGENCY] Thiết lập NVC - Tạo bảng giá: Chọn bộ tuyến áp dụng

## User Story

Là Agency Admin (Đại lý), tôi muốn bảng giá đang tạo tự động áp dụng đúng bộ tuyến hệ thống đang dùng (thay vì phải tự chọn từ đầu), và luôn thấy rõ tên bộ tuyến đang áp dụng ngay trên form, để biết chắc bảng giá sắp tạo dựa trên đúng cấu hình tuyến nào.

## User Flow

1. Vào "Thiết lập NVC" → tab Bảng giá → "Thêm bảng giá".
2. Trong card "Thông tin cơ bản", ngay bên dưới ô "Mô tả", có 1 dòng "Bộ tuyến áp dụng" hiển thị tên bộ đang chọn (🔀 Tên bộ), có hậu tố " (Mặc định)" nếu đó là bộ Super Admin đang đặt làm mặc định hệ thống.
3. Dòng này mặc định hiển thị BỘ TUYẾN ĐANG LÀ MẶC ĐỊNH HỆ THỐNG (bộ Super Admin đặt "Đặt làm mặc định") — không phải bộ gần nhất tạo nếu bộ đó khác bộ mặc định.
4. Cạnh tên bộ có 2 link "Xem chi tiết" (xem AGA-CARRIER-25) và "Thay đổi" (xem AGA-CARRIER-26) — 2 thao tác này có story riêng, không mô tả lại chi tiết ở đây.
5. Có dòng chú thích nhỏ dưới cùng khối: "Danh sách tuyến bên dưới lấy theo bộ này. Chỉ áp dụng cho bảng giá đang tạo — đổi bộ sau khi lưu không ảnh hưởng bảng giá đã có."
6. Bấm "Tạo bảng giá" → bảng giá được lưu với `routeName` mỗi zone chốt cứng dạng chuỗi theo bộ tuyến đã chọn tại thời điểm lưu; bảng giá đã tồn tại trước đó KHÔNG bị đổi theo.

## System Flow

1. `PricingCreate.tsx` khai báo state `selectedBundleId` khởi tạo bằng `getActiveRouteConfigVersion().id` (bộ Super Admin đang đặt làm mặc định); derive `selectedBundle = routeConfigVersions.find(v => v.id === selectedBundleId) ?? getActiveRouteConfigVersion()`.
2. Dòng "Bộ tuyến áp dụng" hiện `🔀 {selectedBundle.label}` + hậu tố " (Mặc định)" nếu `selectedBundle.id === getActiveRouteConfigVersion().id`.
3. `routes` (state "Danh sách tuyến") khởi tạo lần đầu bằng `listRouteNamesIn(selectedBundle).map((name, i) => makeEmptyRoute(name, String(i + 1)))` — luôn khớp đúng bộ đang chọn ngay từ đầu.
4. `handleSubmit()` lưu `routeName` mỗi zone dạng chuỗi (theo bộ đã chọn tại thời điểm bấm "Tạo bảng giá", không lưu thêm id bộ tuyến) — schema `PriceTable`/`PriceZone` không thay đổi; bảng giá cũ không bị tác động.
5. `selectedBundleId`/`selectedBundle` được 2 thao tác con cập nhật: AGA-CARRIER-25 (Xem chi tiết) chỉ ĐỌC, không đổi; AGA-CARRIER-26 (Thay đổi) là nơi DUY NHẤT thay đổi giá trị này.

## Acceptance Criteria

**AC1:** Card "Thông tin cơ bản" hiện dòng "Bộ tuyến áp dụng" với tên bộ đang chọn (🔀 + tên), hậu tố " (Mặc định)" nếu đúng bộ mặc định hệ thống, và 2 link "Xem chi tiết" / "Thay đổi".

**AC2:** Dòng này mặc định hiển thị bộ tuyến là MẶC ĐỊNH HỆ THỐNG (bộ Super Admin đặt "Đặt làm mặc định") — không phải bộ mới nhất tạo gần đây nếu bộ đó không phải bộ mặc định.

**AC3:** "Danh sách tuyến" (card bên dưới) ngay từ lần render đầu tiên đã populate đúng theo bộ mặc định hệ thống — không rỗng, không cần thao tác gì thêm.

**AC4:** Bảng giá đã lưu trước khi có tính năng này (và bảng giá mới lưu với bộ A) KHÔNG bị ảnh hưởng nếu sau đó người dùng chọn bộ B — `routeName` trong mỗi zone đã chốt cứng dạng chuỗi tại thời điểm lưu.

## Notes

- Story này chỉ mô tả phần HIỂN THỊ + GIÁ TRỊ MẶC ĐỊNH của "Bộ tuyến áp dụng". Chi tiết modal "Xem chi tiết" xem AGA-CARRIER-25; chi tiết modal "Thay đổi" (bảng tìm kiếm/phân trang, cách reset "Danh sách tuyến") xem AGA-CARRIER-26.
- Trước đây (bản gốc) đây là 1 `<select>` gộp chung cả việc hiển thị lẫn đổi bộ trong 1 story duy nhất — đã tách thành 3 story riêng (22/25/26) để mỗi thao tác có AC rõ ràng, đúng quy ước "1 story = 1 thao tác" của dự án.
- Phạm vi thay đổi CHỈ ảnh hưởng bảng giá MỚI TẠO — bảng giá đã lưu trước đó (cả seed gốc lẫn bảng tạo qua AGA-CARRIER-21) KHÔNG đổi theo vì `routeName` đã chốt cứng dạng chuỗi.
- Xem AGA-CARRIER-19 để hiểu dropdown "Tuyến" (mỗi dòng trong "Danh sách tuyến") lấy danh sách tên tuyến từ đâu — dropdown đó là thành phần khác, không đụng tới cơ chế chọn CẤP BỘ TUYẾN mô tả ở đây.
