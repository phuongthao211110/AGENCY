---
id: GSA-ROUTE-11
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Bộ vùng tuyến — mỗi lần lưu tạo 1 bộ mới, không sửa đè

## User Story

Là GHN Super Admin, tôi muốn mỗi lần chỉnh sửa Vùng miền/Tuyến/Nội-Ngoại thành và lưu lại, hệ thống tự tạo ra 1 "bộ vùng tuyến" MỚI thay vì sửa đè lên bộ đang dùng, để lịch sử cấu hình cũ luôn được giữ lại nguyên vẹn, có thể xem lại hoặc áp dụng lại bất cứ lúc nào.

## User Flow

1. Mỗi khi bấm "Lưu thay đổi" ở trang "Chỉnh sửa vùng & tuyến" (xem GSA-ROUTE-14), hệ thống KHÔNG sửa đè dữ liệu hiện tại — tạo hẳn 1 "bộ" mới, đặt tên tự động "Bộ #N", ghi thời điểm tạo, và NGAY LẬP TỨC áp dụng bộ đó cho toàn hệ thống (thay thế bộ đang dùng trước đó).
2. Bộ vừa bị thay thế KHÔNG mất đi — vẫn còn nguyên trong "Danh sách bộ vùng tuyến" (GSA-ROUTE-12), chỉ chuyển trạng thái từ "Đang áp dụng" sang "Đã khoá" (không sửa lại được nữa, chỉ xem).
3. Super Admin có thể quay lại áp dụng 1 bộ CŨ bất kỳ trong lịch sử bất cứ lúc nào (xem GSA-ROUTE-13 "Đặt làm mặc định") mà không cần tạo bộ mới trùng nội dung.

## System Flow

1. `RouteConfigVersion` = { id, version, label, createdAt, regions, routeMatrix, urbanConfigs } — snapshot ĐẦY ĐỦ của cả 3 phần (Vùng miền + Tuyến + Nội/Ngoại thành) tại 1 thời điểm.
2. `routeConfigVersions: RouteConfigVersion[]` — mảng lưu TOÀN BỘ lịch sử, seed sẵn 1 phần tử "Bộ mặc định" (`id: 'rcv_seed'`) khi ứng dụng khởi động.
3. `commitNewRouteConfigVersion(draftRegions, draftRouteMatrix, draftUrbanConfigs, label?)` — tạo `RouteConfigVersion` mới (`id: rcv_${Date.now()}`, `version: routeConfigVersions.length + 1`, label mặc định `Bộ #${N}` nếu không truyền), đẩy vào cuối `routeConfigVersions`, rồi gọi `applyVersionToStore()` để đồng bộ NGAY vào 3 biến dùng chung toàn app.
4. `applyVersionToStore(version)` — ghi đè NỘI DUNG (không đổi identity) của 3 biến export `regions`/`routeMatrix`/`urbanConfigs` bằng `.length = 0` + `.push()`/`Object.assign()` — nhờ vậy mọi nơi khác trong app (CarrierSetup, PricingCreate, Web Shop Orders, RouteCheck...) đang import trực tiếp 3 biến này TỰ ĐỘNG thấy dữ liệu mới nhất ngay lập tức, không cần sửa lại import ở bất kỳ file nào khác; đồng thời cập nhật con trỏ `activeVersionId` = id của bộ vừa áp dụng.
5. "Bộ đang áp dụng" xác định qua `getActiveRouteConfigVersion()` — tìm phần tử trong `routeConfigVersions` có `id === activeVersionId`, KHÔNG suy ra từ vị trí cuối mảng (vì Super Admin có thể áp dụng lại 1 bộ cũ hơn — xem GSA-ROUTE-13).
6. Không có hàm mutate rời nào (như `renameRegion()`, `setRouteName()` phiên bản cũ) ghi trực tiếp vào `regions`/`routeMatrix`/`urbanConfigs` nữa — CÁCH DUY NHẤT thay đổi 3 biến này là qua `commitNewRouteConfigVersion()` hoặc `setActiveRouteConfigVersion()` (GSA-ROUTE-13).

## Acceptance Criteria

**AC1:** Bấm "Lưu thay đổi" ở trang chỉnh sửa → tạo đúng 1 bộ mới trong `routeConfigVersions`, KHÔNG xoá hay sửa nội dung bất kỳ bộ nào đã có trước đó.

**AC2:** Bộ mới tạo được áp dụng NGAY LẬP TỨC — mọi nơi khác trong app (bảng giá, tạo đơn, kiểm tra tuyến...) đọc đúng dữ liệu của bộ mới, không cần tải lại trang.

**AC3:** Mỗi bộ có `version` tăng dần tuyệt đối theo thứ tự tạo (KHÔNG trùng, KHÔNG tái sử dụng số cũ dù bộ đó sau này bị thay thế).

**AC4:** Bộ bị thay thế (không còn là "đang áp dụng") vẫn giữ nguyên 100% nội dung (`regions`/`routeMatrix`/`urbanConfigs`) trong `routeConfigVersions` — xem lại được đầy đủ ở GSA-ROUTE-12, không bị xoá hay rút gọn.

**AC5:** Không tồn tại đường nào trong code cho phép sửa trực tiếp nội dung 1 bộ ĐÃ TẠO (không có hàm public nào nhận `versionId` + dữ liệu mới rồi ghi đè in-place vào đúng bộ đó).

## Notes

- **Đây là tính năng nền tảng cho toàn bộ khu vực "Vùng & Tuyến"** — mọi thao tác chỉnh sửa Vùng miền (GSA-ROUTE-2), Tuyến (GSA-ROUTE-3), Nội/Ngoại thành (GSA-ROUTE-4) giờ đều đi qua cơ chế versioning này thay vì ghi trực tiếp vào store như mô tả trong 3 story đó — **3 story đó hiện mô tả ĐÚNG các thao tác/field (thêm/sửa/xoá vùng, tuyến, tỉnh...) nhưng SAI phần "khi nào thì lưu"** (mô tả cũ: ghi thẳng vào store mỗi lần đổi; thực tế mới: chỉ ghi khi bấm "Lưu thay đổi", và ghi thành bộ mới) — cần cập nhật lại phần đó khi rà soát, chưa xử lý trong phạm vi 4 story mới này.
- Tương tự, GSA-ROUTE-6 (Thêm vùng), GSA-ROUTE-7 (Thêm tuyến), GSA-ROUTE-8 (Thêm tỉnh), GSA-ROUTE-9 (Thiết lập lại), GSA-ROUTE-10 (Chỉnh sửa vùng/tuyến/tỉnh) đều mô tả cơ chế TRƯỚC khi có versioning — hành vi THÊM/SỬA/XOÁ từng field cụ thể (tick chip, nhập tên...) không đổi, nhưng đường lưu đã đổi hoàn toàn.
- Không có "known gap" nào về mặt dữ liệu — mọi bộ đều là dữ liệu thật do Super Admin nhập, không dùng công thức demo cố định.
