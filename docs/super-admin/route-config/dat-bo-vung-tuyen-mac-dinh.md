---
id: GSA-ROUTE-13
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Áp dụng bộ cho toàn hệ thống

## User Story

Là GHN Super Admin, tôi muốn áp dụng 1 bộ vùng tuyến làm bộ mặc định cho toàn hệ thống — dù đó là bộ Nháp (chưa phát hành, cần phát hành trước rồi áp dụng ngay 1 bước) hay bộ Hoạt động chưa phải đang áp dụng (chỉ áp dụng, không phát hành lại), để có thể chốt nhanh cấu hình mới hoặc khôi phục về mốc cũ mà không phải tạo bộ trùng nội dung.

## User Flow

**Entry point 1 — Từ trang danh sách (GSA-ROUTE-12):**

1. Mỗi dòng trong bảng có 1 toggle "Hiển thị mặc định".
2. **Bộ đang áp dụng**: toggle LUÔN bật (xanh), disabled — hover hiện tooltip "Bộ đang áp dụng — không thể tự tắt, muốn đổi thì bật mặc định cho 1 bộ khác".
3. **Bộ Nháp**: toggle tắt, disabled — không bấm được. Thay vào đó, nút "⚡ Áp dụng toàn bộ hệ thống" xuất hiện cạnh bên (xem mục B bên dưới).
4. **Bộ Hoạt động và không phải active**: toggle tắt, bấm được → hiện `window.confirm`: "Áp dụng '[tên bộ]' cho TOÀN HỆ THỐNG? Toàn bộ ứng dụng (bảng giá, tạo đơn, kiểm tra tuyến...) sẽ dùng ngay dữ liệu của bộ này thay cho bộ đang áp dụng hiện tại." → Xác nhận → bộ đó trở thành "đang áp dụng" ngay lập tức.

**Entry point 2 — Từ trang sửa (GSA-ROUTE-14):**

1. Header trang sửa cũng có toggle "Hiển thị mặc định" và — với bộ Nháp — nút "⚡ Áp dụng toàn bộ hệ thống" cạnh bên, hành vi y hệt trang danh sách.

**Mục B — Hành động gộp (Phát hành + Áp dụng) cho bộ Nháp:**

1. Bấm nút "⚡ Áp dụng toàn bộ hệ thống" (chỉ hiện với bộ Nháp).
2. Nếu đang có thay đổi chưa lưu trong khối Vùng miền hoặc Tuyến (`hasRegionChanges || hasTuyenChanges`) → hành động bị chặn, hiện cảnh báo yêu cầu lưu hoặc huỷ thay đổi trước.
3. Nếu không có thay đổi chưa lưu → `window.confirm`: "Phát hành và áp dụng bộ '[tên bộ]' cho TOÀN HỆ THỐNG? Vùng miền/Tuyến sẽ khoá vĩnh viễn (không sửa lại được), và toàn bộ ứng dụng sẽ dùng ngay dữ liệu của bộ này. Hành động không có đường quay lại."
4. Xác nhận → `publishAndApplyRouteConfigVersion(id)`: phát hành bộ (`publishRouteConfigVersion`) rồi áp dụng ngay (`setActiveRouteConfigVersion`) — 2 bước trong 1 lần bấm.
5. Thành công → badge chuyển sang "Hoạt động", banner khoá cấu trúc hiện ra, toggle chuyển thành bật/disabled (đang áp dụng). Nút "⚡ Áp dụng toàn bộ hệ thống" biến mất.
6. Huỷ → không thay đổi gì.

## System Flow

1. **Toggle disabled** khi `isActive` (bộ đang áp dụng) HOẶC `version.status !== 'published'` (bộ Nháp). Cursor `not-allowed` cho cả 2 trường hợp.
2. **`handleApplySystemWide()`** (dùng chung cả 2 entry point):
   - Nếu bundle là Nháp (`!isPublished`): kiểm tra `hasRegionChanges || hasTuyenChanges` → nếu có thì chặn; nếu không → `window.confirm` với nội dung "Phát hành và áp dụng..." → gọi `publishAndApplyRouteConfigVersion(bundle.id)`.
   - Nếu bundle đã Hoạt động nhưng chưa active: `window.confirm` với nội dung "Áp dụng..." → gọi `setActiveRouteConfigVersion(bundle.id)`.
3. **`publishAndApplyRouteConfigVersion(id)`** trong `routeConfig.ts`: gọi `publishRouteConfigVersion(id)` (validate phải có tuyến "Nội Tỉnh") → nếu lỗi trả `{ ok: false, error }` và gọi `window.alert(error)`; nếu thành công gọi tiếp `setActiveRouteConfigVersion(result.version.id)` → trả `{ ok: true, version }`.
4. **`setActiveRouteConfigVersion(versionId)`**: validate `status === 'published'`, gọi `applyVersionToStore(version)` để đồng bộ `regions`/`routeMatrix`/`urbanConfigs` và cập nhật `activeVersionId` — không tạo phần tử mới.
5. Sau khi áp dụng thành công, component cập nhật `bundle`/`activeVersion` state để UI phản ánh ngay.
6. Sau khi phát hành+áp dụng thành công từ bộ Nháp, code tự gọi `setRegionsEditing(false)` và `setTuyenEditing(false)` — tránh để lại UI đang ở chế độ Sửa cho bộ vừa khoá cứng cấu trúc.

## Acceptance Criteria

**AC1:** Toggle của bộ Nháp luôn disabled, không bấm được. Nút "⚡ Áp dụng toàn bộ hệ thống" xuất hiện thay thế.

**AC2:** Toggle của bộ đang áp dụng luôn bật, disabled — hover hiện tooltip giải thích.

**AC3:** Toggle của bộ Hoạt động và không phải active: tắt, bấm được → luôn hiện `window.confirm` trước khi áp dụng.

**AC4:** Xác nhận áp dụng (bộ Hoạt động) → đúng 1 bộ được chọn trở thành "đang áp dụng", bộ cũ tự tắt — tại mọi thời điểm chỉ có đúng 1 bộ đang áp dụng.

**AC5:** Bấm "⚡ Áp dụng toàn bộ hệ thống" (bộ Nháp) khi đang có thay đổi chưa lưu trong khối Vùng miền hoặc Tuyến → hành động bị chặn, không mở confirm.

**AC6:** Bấm "⚡ Áp dụng toàn bộ hệ thống" (bộ Nháp) khi không có thay đổi chưa lưu → hiện `window.confirm` với nội dung "Phát hành và áp dụng..." → xác nhận → bộ được phát hành rồi áp dụng ngay trong 1 bước. Badge chuyển "Hoạt động", banner khoá hiện ra, toggle chuyển bật/disabled.

**AC7:** Bộ Nháp thiếu tuyến "Nội Tỉnh" khi bấm "⚡ Áp dụng toàn bộ hệ thống" → phát hành thất bại, `window.alert` hiện lỗi, trạng thái không đổi.

**AC8:** Huỷ bất kỳ `window.confirm` nào → không có gì thay đổi.

**AC9:** Cả 2 entry point (trang danh sách và trang sửa) đều hoạt động đầy đủ với hành vi y hệt nhau.

**AC10:** Sau khi áp dụng, mọi nơi khác trong app đọc `regions`/`routeMatrix`/`urbanConfigs` đều thấy đúng dữ liệu của bộ vừa được áp dụng, ngay lập tức không cần tải lại trang.

**AC11:** Áp dụng 1 bộ cũ → KHÔNG tạo thêm bộ mới nào trong danh sách (tổng số bộ không đổi).

## Notes

- **Đã gộp GSA-ROUTE-17 (Phát hành bộ Nháp) vào story này** — không còn story riêng cho Phát hành. Hàm `publishRouteConfigVersion` vẫn tồn tại trong `routeConfig.ts` (validate phải có tuyến "Nội Tỉnh"), nhưng giờ chỉ được gọi gián tiếp qua `publishAndApplyRouteConfigVersion` — không có đường nào để chỉ "phát hành mà không áp dụng ngay" cho bộ Nháp từ UI.
- Tác động đa nền tảng (trước đây ở GSA-ROUTE-17): sau khi phát hành (qua hành động gộp), bộ xuất hiện trong dropdown "Bộ tuyến áp dụng" khi Agency Admin tạo bảng giá (PricingCreate.tsx).
- Dùng `window.confirm()` và `window.alert()` — phù hợp quy mô prototype; nên thay bằng modal thiết kế nhất quán khi lên production.
- Story này viết lại từ 2 bản cũ: bản đầu không phân biệt Nháp/Hoạt động; bản thứ hai phân biệt nhưng vẫn có nút Phát hành riêng — cả 2 đã được thay thế hoàn toàn.
