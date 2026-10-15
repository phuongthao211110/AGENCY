---
id: GSA-ROUTE-12
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Danh sách bộ vùng tuyến

## User Story

Là GHN Super Admin, tôi muốn xem toàn bộ danh sách các bộ vùng tuyến (Nháp lẫn Hoạt động), biết ngay bộ nào đang được áp dụng toàn hệ thống, và thực hiện các thao tác Sửa / Nhân bản / Xoá ngay từ danh sách — để quản lý vòng đời bộ tuyến mà không cần vào từng bộ một.

## User Flow

1. Vào menu "Vùng & Tuyến" trong sidebar Super Admin → route `/super-admin/route-config`, tiêu đề trang "Vùng & Tuyến".
2. Góc phải đầu trang có nút cam "Nhân bản bộ đang áp dụng" — bấm vào mở `window.prompt` nhập tên bộ mới, hệ thống nhân bản từ bộ đang active, tạo bộ Nháp mới rồi điều hướng sang trang sửa bộ đó.
3. Danh sách liệt kê MỌI bộ đã tạo, mới nhất lên đầu — mỗi dòng hiện: tên bộ, badge trạng thái (Nháp màu vàng / Hoạt động màu xanh lá), label "Đang áp dụng" nếu đó là bộ active, thời gian tạo, số vùng miền / số tuyến / số tỉnh có Nội-Ngoại thành, toggle "Hiển thị mặc định" và cột "Thao tác".
4. Toggle "Hiển thị mặc định": bật (xanh) nếu bộ đang là active. Toggle disabled (cursor not-allowed) với 2 trường hợp: bộ đang active (không thể tự tắt) và bộ Nháp (Nháp không bao giờ áp dụng được). Chỉ bộ Hoạt động và không phải active mới bấm được — bấm vào hiện hộp thoại xác nhận trước khi áp dụng (xem GSA-ROUTE-13).
5. Cột "Thao tác" theo trạng thái:
   - **Sửa**: hiện ở mọi trạng thái — điều hướng sang trang sửa `/super-admin/route-config/edit/:id` đúng bộ đó.
   - **Nhân bản**: hiện ở mọi trạng thái — mở `window.prompt` nhập tên, tạo bộ Nháp mới rồi điều hướng sang trang sửa bộ mới.
   - **Xoá**: chỉ hiện ở bộ Nháp — xác nhận rồi xoá hẳn khỏi danh sách (xem GSA-ROUTE-18). Bộ Hoạt động không có nút Xoá.
6. Bấm nút "Sửa" → sang trang sửa bộ đó (xem GSA-ROUTE-14).

## System Flow

1. `RouteConfigList()` — khởi tạo `useState(() => [...routeConfigVersions])` (setter vì Nhân bản/Xoá thay đổi danh sách), và `useState(() => getActiveRouteConfigVersion())` cho bộ active.
2. Render `[...versions].reverse()` để mới nhất lên đầu — không đổi thứ tự gốc của `routeConfigVersions`.
3. `StatusBadge({ status })` — badge Nháp: chữ/nền vàng (`#8A6100` / `#FDF3D9`); Hoạt động: chữ/nền xanh lá (`#12784A` / `#DCF3E7`).
4. Toggle "Hiển thị mặc định" disabled khi: `isActive` (bộ đang active) HOẶC `!isPublished` (bộ Nháp). Cursor `not-allowed` cho cả 2 trường hợp. Chỉ bộ Hoạt động và không active mới có `onClick` hiệu lực.
5. Nút "Nhân bản": gọi `duplicateRouteConfigVersion(source.id, label)`, cập nhật `versions` state, rồi `navigate('/super-admin/route-config/edit/' + created.id)`.
6. Nút "Xoá": chỉ render khi `status === 'draft'`; gọi `deleteDraftVersion(version.id)`, cập nhật `versions` state bằng cách lọc bỏ id vừa xoá.

## Acceptance Criteria

**AC1:** Danh sách hiện đủ mọi bộ trong `routeConfigVersions`, sắp mới nhất lên đầu. Mỗi dòng có badge trạng thái màu đúng: Nháp = vàng, Hoạt động = xanh lá.

**AC2:** Đúng 1 dòng hiển thị label "Đang áp dụng" (tương ứng `getActiveRouteConfigVersion()`).

**AC3:** Toggle "Hiển thị mặc định" disabled (cursor not-allowed, không tương tác được) với bộ đang active VÀ với mọi bộ Nháp — chỉ bộ Hoạt động không phải active mới bấm được toggle.

**AC4:** Cột "Thao tác": nút "Sửa" và "Nhân bản" luôn hiện ở mọi dòng; nút "Xoá" chỉ hiện ở dòng Nháp; dòng Hoạt động không có nút Xoá.

**AC5:** Bấm "Nhân bản" (cột Thao tác hoặc nút đầu trang) → mở `window.prompt`, nhập tên → tạo bộ Nháp mới → điều hướng ngay sang trang sửa bộ vừa nhân bản.

**AC6:** Bấm "Sửa" → điều hướng đúng sang `/super-admin/route-config/edit/:id` của bộ đó.

**AC7:** Sau khi Xoá 1 bộ Nháp, dòng đó biến mất khỏi danh sách ngay lập tức, không cần tải lại trang.

**AC8:** Mỗi dòng hiện đủ: tên bộ, thời gian tạo (định dạng `vi-VN`), số vùng miền, số tuyến (đếm tên DUY NHẤT), số tỉnh có Nội/Ngoại thành.

## Notes

- Tiêu đề trang đổi từ "Danh sách bộ vùng tuyến" (bản cũ) thành "Vùng & Tuyến".
- Nút đầu trang đổi từ "✎ Chỉnh sửa vùng & tuyến" (bản cũ, điều hướng sang trang sửa 1 draft chung) thành "Nhân bản bộ đang áp dụng" (nhân bản ngay bộ active, không phải chỉnh sửa trực tiếp).
- Story này viết lại từ bản cũ. Bản cũ không có badge trạng thái, không phân biệt Nháp/Hoạt động, không có nút Nhân bản/Xoá riêng trong cột Thao tác, toggle không bị disabled cho bộ Nháp.
