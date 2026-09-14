---
id: GSA-ROUTE-8
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Thêm tỉnh

## User Story

Là GHN Super Admin, tôi muốn thêm 1 tỉnh/thành mới vào danh sách phân biệt Nội thành/Ngoại thành (trong khối "Cấu hình nội & ngoại thành"), để tỉnh đó có mặt trong hệ thống và sẵn sàng được phân loại xã/phường khi có dữ liệu.

## User Flow

1. Trong khối "🏙️ Cấu hình nội & ngoại thành", cuộn tới cuối sidebar bên trái.
2. Bấm nút "+ Thêm tỉnh" — nếu cả 63 tỉnh đã có trong sidebar, nút bị mờ và không bấm được.
3. Danh sách các tỉnh CHƯA có trong sidebar thả LÊN TRÊN (phía trên nút "+ Thêm tỉnh").
4. Bấm chọn 1 tỉnh trong danh sách → tỉnh đó được thêm vào CUỐI sidebar, tự động được chọn (tô cam, viền trái cam) để xem ngay, và danh sách thả đóng lại.
5. Panel chính hiện 2 cột "Nội thành"/"Ngoại thành" của tỉnh mới — cả 2 cột đều RỖNG vì tỉnh mới chưa có xã/phường nào.
6. Thao tác này chỉ ảnh hưởng bản NHÁP — tỉnh mới chưa xuất hiện cho Agency Admin cho tới khi Super Admin bấm "💾 Lưu thay đổi".
7. Có thể huỷ việc thêm tỉnh bằng nút "✕ Huỷ bỏ" (quay lại đúng danh sách đã lưu trước đó), hoặc bấm X trên dòng tỉnh trong sidebar để gỡ riêng tỉnh đó khỏi bản nháp trước khi lưu.

## System Flow

1. `handleAddUrbanProvinceDraft(name)` (`RouteConfig.tsx`): guard `if (!name) return`; thêm `{ province: name, wards: [] }` vào `urbanDraft` (chỉ khi chưa tồn tại), `setSelectedUrbanProvince(name)`, `setAddProvinceMenuOpen(false)`.
2. `availableUrbanProvinces = ALL_PROVINCES.filter(p => !urbanDraftAssignedSet.has(p))` — 63 tỉnh trừ các tỉnh đã có trong `urbanDraft` (so với `urbanDraft`, không phải `localUrbanConfigs` đã lưu — nên tỉnh vừa thêm trong phiên nháp hiện tại cũng bị loại khỏi danh sách chọn thêm lần nữa, tránh trùng).
3. Nút "+ Thêm tỉnh" disable khi `availableUrbanProvinces.length === 0`.
4. Dropdown `addProvinceMenuOpen` render danh sách tỉnh khả dụng, `position: absolute; bottom: 100%` (thả lên trên nút, không che khuất phần sidebar phía trên).
5. Tỉnh mới có `wards: []` — component `UrbanCategoryColumn` (2 cột Nội/Ngoại thành) hiện 0 phường/xã ở cả 2 cột, ô tìm kiếm luôn trả về rỗng, checkbox "Tất cả" luôn unchecked vì `categoryWards.length === 0`.
6. Vì không có cơ chế thêm ward qua UI (xem GSA-ROUTE-4, AC6), tỉnh mới thêm sẽ trống mãi mãi cho tới khi có cơ chế seed dữ liệu ward bằng code.
7. `commitUrbanDraft()` (khi bấm "Lưu thay đổi"): với mỗi tỉnh trong `urbanDraft` chưa có trong `localUrbanConfigs`, gọi `addUrbanProvince(draftCfg.province)` từ `routeConfig.ts` — hàm này chỉ `push({ province, wards: [] })` vào `urbanConfigs` (store dùng chung) nếu tỉnh đó chưa tồn tại.
8. `cancelUrbanDraft()` reset `urbanDraft` về bản sao sâu của `localUrbanConfigs` — bỏ hết tỉnh mới thêm chưa lưu, cùng mọi thay đổi nháp khác (nếu có).

## Acceptance Criteria

**AC1:** Nút "+ Thêm tỉnh" nằm ở CUỐI sidebar (dưới danh sách tỉnh hiện có); disable (mờ, không bấm được) khi cả 63 tỉnh đã có mặt trong sidebar.

**AC2:** Bấm nút mở danh sách thả LÊN TRÊN (phía trên nút) liệt kê CHỈ các tỉnh chưa có trong sidebar — bao gồm cả những tỉnh vừa thêm trong phiên nháp hiện tại dù chưa bấm "Lưu thay đổi".

**AC3:** Chọn 1 tỉnh trong danh sách → tỉnh đó được thêm vào cuối sidebar, TỰ ĐỘNG được chọn (tô cam, viền trái cam) để xem ngay ở panel chính, và danh sách thả đóng lại.

**AC4:** Tỉnh mới thêm có 0 xã/phường ở cả 2 cột "Nội thành"/"Ngoại thành" — không có cách nào qua UI để thêm xã/phường cho tỉnh này (xem GSA-ROUTE-4, AC6).

**AC5:** Thao tác thêm tỉnh chỉ sửa bản nháp (`urbanDraft`) — dữ liệu dùng chung (đọc bởi Agency Admin) không đổi cho đến khi bấm "💾 Lưu thay đổi"; nút "✕ Huỷ bỏ" và "💾 Lưu thay đổi" hết disable ngay sau khi thêm tỉnh (vì `hasUrbanChanges` chuyển `true`).

**AC6:** Bấm "✕ Huỷ bỏ" trước khi lưu → tỉnh vừa thêm biến mất khỏi sidebar, quay về đúng danh sách đã lưu trước đó.

**AC7:** Bấm X trên dòng tỉnh mới thêm (trong sidebar) trước khi lưu → gỡ ngay tỉnh đó khỏi bản nháp, không cần chờ tới bước "Huỷ bỏ"/"Lưu thay đổi" ở cấp toàn khối.

**AC8:** Sau khi bấm "Lưu thay đổi", tỉnh mới (với danh sách xã/phường rỗng) được ghi vào store dùng chung (`urbanConfigs`) — xuất hiện trong modal "Bảng mô tả tuyến dịch vụ" ở Agency Admin (phần "Định nghĩa Nội thành/Ngoại thành") với dòng "Chưa có xã/phường nào." (xem GSA-ROUTE-5).

## Notes

- Story tách riêng khỏi GSA-ROUTE-4 (Cấu hình nội & ngoại thành) để tập trung mô tả riêng nút "+ Thêm tỉnh", tương tự cách GSA-ROUTE-6/7 tách "Thêm vùng"/"Thêm tuyến" khỏi story cha.
- **Nhắc lại hệ quả đã biết (từ GSA-ROUTE-4)**: tỉnh mới thêm sẽ có danh sách xã/phường rỗng VĨNH VIỄN qua UI hiện tại. Khác với "Thêm vùng" (GSA-ROUTE-6) hay "Thêm tuyến" (GSA-ROUTE-7) — nơi đối tượng vừa tạo đã có thể dùng ngay (dù cần cấu hình thêm) — "Thêm tỉnh" tạo ra 1 tỉnh KHÔNG THỂ dùng được cho tới khi có cơ chế nạp danh sách xã/phường chuẩn theo tỉnh; cần bổ sung ở sprint sau.
- **Khác biệt cơ chế lưu**: "Thêm vùng"/"Thêm tuyến" ghi thẳng vào store dùng chung ngay lập tức khi bấm nút. "Thêm tỉnh" thì KHÔNG — nó đi qua cơ chế nháp/lưu riêng của khối Nội & Ngoại thành (xem GSA-ROUTE-4): phải bấm "💾 Lưu thay đổi" thì Agency Admin mới thấy được tỉnh mới.
- Không có validate chống trùng tỉnh qua UI (không cần thiết) — vì danh sách chọn `availableUrbanProvinces` đã tự loại các tỉnh đang có trong `urbanDraft`, nên về mặt kỹ thuật không thể chọn trùng.
