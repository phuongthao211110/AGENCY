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

Là Agency Admin (Đại lý), tôi muốn chọn bộ tuyến nào sẽ áp dụng cho bảng giá đang tạo (thay vì luôn dùng bộ tuyến mặc định global), để có thể tạo bảng giá theo đúng cấu hình tuyến mà Super Admin đã thiết kế cho kịch bản giá cụ thể đó.

## User Flow

1. Vào "Thiết lập NVC" → tab Bảng giá → "Thêm bảng giá".
2. Trong card "Thông tin cơ bản", ngay bên dưới ô "Mô tả", có dropdown "Bộ tuyến áp dụng" liệt kê tất cả bộ tuyến Super Admin đã tạo; bộ đang là mặc định hệ thống có hậu tố " (Mặc định)" trong tên.
3. Dropdown mặc định chọn sẵn BỘ TUYẾN ĐANG LÀ MẶC ĐỊNH HỆ THỐNG (bộ Super Admin đặt "Đặt làm mặc định") — không phải bộ gần nhất tạo nếu bộ đó khác bộ mặc định.
4. Có dòng chú thích nhỏ ngay dưới dropdown: "Danh sách tuyến bên dưới lấy theo bộ này. Chỉ áp dụng cho bảng giá đang tạo — đổi bộ sau khi lưu không ảnh hưởng bảng giá đã có."
5. Đổi dropdown sang bộ khác → toàn bộ "Danh sách tuyến" bên dưới reset và populate lại theo danh sách tuyến của bộ vừa chọn (tên tuyến mỗi dòng đổi theo bộ mới, dữ liệu giá đã nhập bị xoá trắng).
6. Modal "Bảng mô tả tuyến dịch vụ" (nút "Định nghĩa tuyến" đầu khối và icon (i) cạnh toggle "Tách Nội thành/Ngoại thành") cũng phản ánh đúng bộ tuyến đang chọn ở dropdown.
7. Bấm "Tạo bảng giá" → bảng giá được lưu với `routeName` mỗi zone chốt cứng dạng chuỗi theo bộ tuyến đã chọn tại thời điểm lưu; bảng giá đã tồn tại trước đó KHÔNG bị đổi theo.

## System Flow

1. `PricingCreate.tsx` thêm state `selectedBundleId` khởi tạo bằng `getActiveRouteConfigVersion().id` (bộ Super Admin đang đặt làm mặc định); derive `selectedBundle = routeConfigVersions.find(v => v.id === selectedBundleId) ?? getActiveRouteConfigVersion()`.
2. Dropdown "Bộ tuyến áp dụng" render `routeConfigVersions` (mới nhất lên đầu); item có `id === getActiveRouteConfigVersion().id` thêm hậu tố " (Mặc định)" vào label.
3. `handleBundleChange(versionId)`: đổi `selectedBundleId` VÀ reset `routes` thành `listRouteNamesIn(newBundle).map((name, i) => makeEmptyRoute(name, String(i + 1)))` — tên tuyến 2 bộ có thể khác nhau, giữ nguyên route cũ sẽ bị "mồ côi" (giá trị không khớp option nào trong `<select>` của bộ mới).
4. `RouteBlock` và `ZoneGuideModal` nhận thêm prop `bundle: RouteConfigVersion` — mọi chỗ đọc state global (`routeRegions`, `routeMatrix`, `urbanConfigs`, hàm gốc `isSameProvinceRouteName`/`describeSameProvinceRoutePairs`/`listRouteNames`) đổi thành đọc từ `bundle` qua 3 hàm thuần mới: `isSameProvinceRouteNameIn(bundle, x)`, `describeSameProvinceRoutePairsIn(bundle, x)`, `listRouteNamesIn(bundle)`.
5. `routeConfig.ts` bổ sung 3 hàm thuần nhận `RouteConfigVersion` làm tham số — `isSameProvinceRouteNameIn`, `describeSameProvinceRoutePairsIn`, `listRouteNamesIn` — không đụng 3 hàm gốc tương ứng (vẫn đọc global state, dùng cho Web Shop và RouteCheck).
6. `routeConfigVersions` và `activeVersionId` nay persist qua `localStorage` (key `ghn_route_config_v1`): lưu lúc `commitNewRouteConfigVersion()` / `setActiveRouteConfigVersion()`, khôi phục 1 lần lúc module khởi tạo (IIFE ngay sau khai báo `activeVersionId`) — F5 trang lại vẫn đầy đủ bộ tuyến đã tạo.
7. `handleSubmit()` tiếp tục lưu `routeName` mỗi zone dạng chuỗi (theo bộ đã chọn, không lưu thêm id bộ tuyến) — schema `PriceTable`/`PriceZone` không thay đổi; bảng giá cũ không bị tác động.

## Acceptance Criteria

**AC1:** Card "Thông tin cơ bản" trong form Tạo bảng giá có dropdown "Bộ tuyến áp dụng" liệt kê đủ tất cả bộ tuyến Super Admin đã tạo; bộ đang là mặc định hệ thống có thêm hậu tố " (Mặc định)".

**AC2:** Dropdown mặc định chọn sẵn bộ tuyến là MẶC ĐỊNH HỆ THỐNG (bộ Super Admin đặt "Đặt làm mặc định") — không phải bộ mới nhất tạo gần đây nếu bộ đó không phải bộ mặc định.

**AC3:** Đổi dropdown sang bộ khác → toàn bộ "Danh sách tuyến" RESET và populate lại theo danh sách tuyến của bộ vừa chọn; dữ liệu giá đã nhập ở các dòng cũ bị xoá trắng.

**AC4:** Modal "Bảng mô tả tuyến dịch vụ" (nút "Định nghĩa tuyến" và icon (i) cạnh toggle) phản ánh đúng bộ tuyến đang chọn ở dropdown — tên vùng/miền và cấu hình tuyến khớp đúng bộ đó, không phải bộ global.

**AC5:** Bảng giá đã lưu trước khi có tính năng này (và bảng giá mới lưu với bộ A) KHÔNG bị ảnh hưởng nếu sau đó người dùng chọn bộ B — `routeName` trong mỗi zone đã chốt cứng dạng chuỗi tại thời điểm lưu.

**AC6:** Sau khi Super Admin tạo bộ tuyến mới rồi F5 lại trang → bộ mới vẫn xuất hiện trong dropdown (persist localStorage hoạt động) — không bị mất như trước khi có persist.

**AC7:** Khi Super Admin chưa từng tạo thêm bộ tuyến nào (chỉ có 1 bộ mặc định duy nhất) → dropdown hiện đúng 1 bộ đó có hậu tố " (Mặc định)", không ẩn dropdown hay báo lỗi.

## Notes

- Phạm vi thay đổi CHỈ ảnh hưởng bảng giá MỚI TẠO — bảng giá đã lưu trước đó (cả seed gốc lẫn bảng tạo qua AGA-CARRIER-21) KHÔNG đổi theo vì `routeName` đã chốt cứng dạng chuỗi.
- Xem AGA-CARRIER-19 để hiểu dropdown "Tuyến" (mỗi dòng trong "Danh sách tuyến") lấy danh sách tên tuyến từ đâu — story này bổ sung cấp độ chọn BỘ TUYẾN, không thay thế cơ chế dropdown tuyến từng dòng đó.
- 3 hàm gốc `isSameProvinceRouteName()`, `describeSameProvinceRoutePairs()`, `listRouteNames()` (đọc state global) KHÔNG bị thay đổi — Web Shop (`CreateOrderDrawer`, `CreateLetterDrawer`) và RouteCheck.tsx vẫn dùng hàm gốc, đọc đúng bộ tuyến global đang active.
