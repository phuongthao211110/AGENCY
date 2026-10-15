---
id: GSA-ROUTE-16
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Nhân bản bộ vùng tuyến

## User Story

Là GHN Super Admin, tôi muốn nhân bản 1 bộ vùng tuyến bất kỳ (Nháp hay Hoạt động) thành 1 bộ Nháp mới, để có điểm khởi đầu đầy đủ mà không cần xây từ đầu — đây là cách DUY NHẤT tạo bộ mới trong hệ thống.

## User Flow

1. **Từ trang danh sách** (GSA-ROUTE-12):
   - Nút "Nhân bản bộ đang áp dụng" ở đầu trang → nhân bản từ bộ đang active.
   - Nút "Nhân bản" trong cột Thao tác của bất kỳ dòng nào → nhân bản từ đúng bộ đó.
2. **Từ trang sửa** (GSA-ROUTE-14): nút "📋 Nhân bản" ở header trang → nhân bản từ chính bộ đang mở.
3. Sau khi bấm (bất kỳ entry point nào) → `window.prompt` hiện ra, Super Admin nhập tên cho bộ mới.
4. Nhập tên (hoặc để trống, hệ thống tự dùng `{tên bộ gốc} (bản sao)`) rồi xác nhận → bộ Nháp mới được tạo với toàn bộ nội dung sao chép từ bộ nguồn (Vùng miền, Tuyến, Nội/Ngoại thành, khoá tuyến).
5. Hệ thống điều hướng NGAY sang trang sửa bộ vừa nhân bản (`/super-admin/route-config/edit/:newId`).
6. Huỷ `window.prompt` → không tạo gì, không điều hướng.
7. Bộ mới KHÔNG tự động áp dụng toàn hệ thống — cần áp dụng qua GSA-ROUTE-13.

## System Flow

1. `duplicateRouteConfigVersion(sourceId, label?)` — tìm bộ nguồn theo `sourceId`, tạo `RouteConfigVersion` mới:
   - `id: rcv_${Date.now()}`
   - `status: 'draft'` (luôn là Nháp, bất kể bộ nguồn là Nháp hay Hoạt động)
   - `label: label?.trim() || '{tên nguồn} (bản sao)'`
   - `regions`, `routeMatrix`, `urbanConfigs`, `lockedPairKeys` — deep clone toàn bộ từ bộ nguồn (không có `lockedRouteNames` — đã bỏ khoá cả tuyến, xem GSA-ROUTE-15)
2. Bộ mới được `push` vào cuối `routeConfigVersions`, persist vào localStorage.
3. Bộ mới KHÔNG kích hoạt `applyVersionToStore` — không tự động active.
4. Entry point trang danh sách: `RouteConfigList` cập nhật `versions` state rồi gọi `navigate('/super-admin/route-config/edit/' + created.id)`.
5. Entry point trang sửa: `handleDuplicate()` trong `RouteConfig.tsx` — `window.prompt('Tên bộ mới:', \`${bundle.label} (bản sao)\`)` → gọi `duplicateRouteConfigVersion(bundle.id, name)` → `navigate('/super-admin/route-config/edit/' + created.id)`.

## Acceptance Criteria

**AC1:** Cả 3 entry điểm đều hoạt động: nút "Nhân bản bộ đang áp dụng" đầu trang danh sách, nút "Nhân bản" trong cột Thao tác của từng dòng, và nút "📋 Nhân bản" ở header trang sửa — mỗi entry nhân bản từ đúng bộ tương ứng.

**AC2:** Bộ mới luôn có `status: 'draft'` — bất kể bộ nguồn là Nháp hay Hoạt động.

**AC3:** Bộ mới sao chép ĐẦY ĐỦ: Vùng miền, Tuyến (routeMatrix), Nội/Ngoại thành, danh sách cặp vùng miền bị khoá riêng (lockedPairKeys).

**AC4:** Sau khi nhân bản, hệ thống điều hướng ngay sang trang sửa bộ mới — Super Admin bắt đầu chỉnh sửa từ đó.

**AC5:** Bộ mới KHÔNG tự động áp dụng toàn hệ thống — bộ đang active hiện tại không đổi.

**AC6:** Huỷ `window.prompt` → không tạo bộ mới, danh sách không đổi, không điều hướng.

**AC7:** Tên bộ mới: nếu Super Admin để trống input → hệ thống tự dùng `{tên bộ nguồn} (bản sao)`.
