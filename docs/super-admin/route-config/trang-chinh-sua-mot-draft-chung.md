---
id: GSA-ROUTE-14
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Trang sửa bộ vùng tuyến theo id

## User Story

Là GHN Super Admin, tôi muốn mở và làm việc với ĐÚNG 1 bộ vùng tuyến cụ thể (theo id trên URL) với header đầy đủ hành động và 3 khối cấu hình theo mô hình Xem/Sửa, để thấy rõ trạng thái bộ đang xem và biết đúng thao tác nào được phép làm ở trạng thái đó.

## User Flow

1. Vào trang qua nút "Sửa" ở trang danh sách (GSA-ROUTE-12), route `/super-admin/route-config/edit/:id`. Link "← Danh sách" quay lại.
2. **Header trang** hiện:
   - Tên bộ (label)
   - Badge trạng thái: **"Nháp"** (vàng) hoặc **"Hoạt động"** (xanh lá) — theo `bundle.status`
   - Toggle "Hiển thị mặc định" + nút "⚡ Áp dụng toàn bộ hệ thống" (chỉ với bộ Nháp) — xem GSA-ROUTE-13
   - Nút "✏️ Đổi tên" — xem GSA-ROUTE-19 (hiện ở CẢ 2 trạng thái)
   - Nút "📋 Nhân bản" — xem GSA-ROUTE-16 (hiện ở CẢ 2 trạng thái)
   - Nút "🗑 Xoá" — xem GSA-ROUTE-18 (chỉ hiện khi bộ là Nháp)
3. **Bộ Hoạt động**: banner vàng/đỏ nhạt hiện ngay dưới header: "🔒 Bộ đã phát hành. Không sửa được Vùng miền và Tuyến. Bạn vẫn có thể khoá/mở tuyến và chỉnh Nội/Ngoại thành. Muốn thay đổi cấu trúc thì nhân bản bộ này."
4. **Khối "🗺️ Cấu hình vùng miền"** — mô hình Xem/Sửa:
   - **Mặc định (chế độ Xem)**: tên vùng miền hiện dạng pill xanh dương (`#EFF6FF`/`#BFDBFE`/`#1D4ED8`), tỉnh/thành cũng dạng pill cùng màu, KHÔNG có input/nút xoá/dropdown/"+Thêm vùng miền"/thanh Lưu-Huỷ. Dòng "X tỉnh chưa được gán vùng miền: ..." luôn hiện dù đang Xem hay Sửa.
   - Nút "✏️ Chỉnh sửa" ở góc phải header khối — chỉ hiện khi `!isPublished && !regionsEditing` (bộ Nháp và chưa vào chế độ Sửa).
   - Bấm "✏️ Chỉnh sửa" → `regionsEditing = true` → hiện đầy đủ input/nút xoá/dropdown/"+Thêm vùng miền"/thanh Lưu-Huỷ.
   - Bấm "💾 Lưu thay đổi" → gọi `commitRegionsDraft`, `updateDraftStructure`, tự set `regionsEditing = false`, quay lại chế độ Xem.
   - Bấm "✕ Huỷ bỏ" → gọi `cancelRegionsDraft`, tự set `regionsEditing = false`, quay lại chế độ Xem.
5. **Khối "🔀 Cấu hình tuyến"** — mô hình Xem/Sửa tương tự:
   - **Mặc định (chế độ Xem)**: tên tuyến hiện dạng pill cam (`#FFEAD9`/`#FDBA74`/`#FF5200`), nút xoá tuyến (X) ẩn, "+Thêm tuyến" và thanh Lưu-Huỷ ẩn, khối "chưa được gán tuyến" hiện dạng text tĩnh.
   - Nút "✏️ Chỉnh sửa" — chỉ hiện khi `!isPublished && !tuyenEditing`.
   - Bấm "✏️ Chỉnh sửa" → `tuyenEditing = true` → hiện đầy đủ input/nút xoá/"+Thêm tuyến"/dropdown gán/thanh Lưu-Huỷ.
   - **Icon khoá/mở khoá riêng từng cặp** (🔒/🔓 cạnh mỗi chip): LUÔN bấm được BẤT KỂ đang ở chế độ Xem hay Sửa — không bị gate bởi `tuyenEditing`. Chỉ bị chặn bởi cặp đang khoá (chip locked thì gỡ chip disabled, nhưng icon khoá vẫn bấm được để mở khoá). Xem GSA-ROUTE-15.
   - Nút gỡ chip (click chip để bỏ gán): bị gate bởi `tuyenReadOnly = isPublished || !tuyenEditing` — chỉ gỡ được khi đang ở chế độ Sửa.
   - Lưu/Huỷ đều tự set `tuyenEditing = false`.
6. **Khối "🏙️ Cấu hình nội & ngoại thành"** — mô hình Xem/Sửa:
   - **Mặc định (chế độ Xem)**: sidebar tỉnh/thành chỉ đọc (không có nút X, không có "+Thêm tỉnh"), panel chính hiện 2 cột "Nội thành"/"Ngoại thành" liệt kê tên xã/phường dạng danh sách tĩnh (không checkbox, không ô tìm kiếm).
   - Nút "✏️ Chỉnh sửa" hiện ở CẢ bộ Nháp lẫn Hoạt động (khác 2 khối trên — khối này sửa được ở cả 2 trạng thái).
   - Bấm "✏️ Chỉnh sửa" → `urbanEditing = true` → hiện sidebar đầy đủ (nút X, "+Thêm tỉnh") + 2 cột checklist + ô tìm kiếm + thanh Lưu-Huỷ-Thiết lập lại.
   - Lưu (`updateVersionUrbanConfigs`) / Huỷ đều tự set `urbanEditing = false`.
7. Mỗi khối hoàn toàn độc lập: lưu khối Vùng miền không ảnh hưởng draft đang dở ở khối Tuyến hay Nội/Ngoại thành.

## System Flow

1. Route `/super-admin/route-config/edit/:id` — đọc `id` từ URL param, tìm đúng bộ trong `routeConfigVersions`. `const isPublished = bundle.status === 'published'`.
2. **State chế độ Xem/Sửa**: `regionsEditing` (bool, mặc định `false`), `tuyenEditing` (bool, mặc định `false`), `urbanEditing` (bool, mặc định `false`). Biến phái sinh: `tuyenReadOnly = isPublished || !tuyenEditing`.
3. **Vùng miền**: state draft cục bộ `regionsDraft`. Nút "✏️ Chỉnh sửa" render khi `!isPublished && !regionsEditing`. Mọi handler thao tác (`handleAddRegion`, v.v.) bị guard `if (isPublished || !regionsEditing) return`. Lưu gọi `updateDraftStructure(bundle.id, ...)`, sau đó `setRegionsEditing(false)`.
4. **Tuyến**: state draft cục bộ `matrixDraft`. Nút "✏️ Chỉnh sửa" render khi `!isPublished && !tuyenEditing`. Handler `handleAddTuyen`, `handleRenameTuyen`, `handleDeleteTuyen`, `handleToggleChip` bị gate bởi `tuyenReadOnly`. `togglePairLock(key)` gọi `updateVersionLocks` — KHÔNG có điều kiện disable từ `tuyenReadOnly` (chỉ bị chặn bởi `isPublished` cho `handleToggleChip` và `lockedPairKeys.has(key)` cho chip). Lưu gọi `updateDraftStructure`, sau đó `setTuyenEditing(false)`.
5. **Nội/Ngoại thành**: state draft `urbanDraft`. Nút "✏️ Chỉnh sửa" render bất kể `isPublished`. Lưu gọi `updateVersionUrbanConfigs(bundle.id, urbanDraft)`, sau đó `setUrbanEditing(false)`.
6. **Khoá tuyến**: không qua draft, save ngay qua `updateVersionLocks(bundle.id, ...)` — hợp lệ ở cả 2 trạng thái và cả 2 chế độ Xem/Sửa. Xem GSA-ROUTE-15.
7. `bundle` (state) được cập nhật sau mỗi lần lưu/hành động thành công để header/badge phản ánh đúng trạng thái mới.
8. **Fix QA**: sau khi `handleApplySystemWide()` phát hành+áp dụng thành công 1 bộ Nháp (chuyển sang Hoạt động), code tự gọi `setRegionsEditing(false)` và `setTuyenEditing(false)` — tránh để lại UI ở chế độ Sửa cho bộ vừa khoá cứng cấu trúc.

## Acceptance Criteria

**AC1:** Trang mở sẵn đúng dữ liệu của bộ theo `id` trên URL — không mặc định mở bộ đang active.

**AC2:** Header hiện badge "Nháp" (vàng) hoặc "Hoạt động" (xanh lá) tuỳ `bundle.status`. Toggle "Hiển thị mặc định" và nút "✏️ Đổi tên", "📋 Nhân bản" xuất hiện ở cả 2 trạng thái.

**AC3:** Bộ Hoạt động: banner khoá hiển thị rõ; nút "🗑 Xoá" và nút "✏️ Chỉnh sửa" của khối Vùng miền và Tuyến đều ẩn; icon khoá/mở khoá từng cặp vẫn bấm được.

**AC4:** Bộ Nháp: nút "🗑 Xoá" và "⚡ Áp dụng toàn bộ hệ thống" hiện ở header; nút "✏️ Chỉnh sửa" hiện ở khối Vùng miền và Tuyến.

**AC5:** Mặc định (chưa bấm Chỉnh sửa): khối Vùng miền và Tuyến ở chế độ Xem — tên hiện dạng pill, KHÔNG có input/nút xoá/dropdown/"+Thêm..."/thanh Lưu-Huỷ.

**AC6:** Bấm "✏️ Chỉnh sửa" ở khối Vùng miền (bộ Nháp) → chế độ Sửa xuất hiện đầy đủ (input, dropdown, "+Thêm vùng miền", thanh Lưu-Huỷ). Lưu hoặc Huỷ → quay về chế độ Xem.

**AC7:** Bấm "✏️ Chỉnh sửa" ở khối Tuyến (bộ Nháp) → chế độ Sửa xuất hiện đầy đủ (input, "+Thêm tuyến", dropdown gán, thanh Lưu-Huỷ). Lưu hoặc Huỷ → quay về chế độ Xem.

**AC8:** Icon khoá/mở khoá riêng từng cặp: bấm được ở CẢ 2 trạng thái (Nháp/Hoạt động) VÀ CẢ 2 chế độ (Xem/Sửa) của khối Tuyến — không bị gate bởi `tuyenEditing`.

**AC9:** Khối Nội/Ngoại thành: nút "✏️ Chỉnh sửa" hiện ở CẢ bộ Nháp lẫn Hoạt động. Ở chế độ Xem: danh sách xã/phường tĩnh không có checkbox. Ở chế độ Sửa: checklist đầy đủ. Lưu gọi `updateVersionUrbanConfigs`.

**AC10:** Sau khi phát hành+áp dụng thành công từ bộ Nháp (chuyển sang Hoạt động), khối Vùng miền và Tuyến tự thoát chế độ Sửa (nếu đang mở) về chế độ Xem.

**AC11:** 3 khối hoàn toàn độc lập: lưu khối Vùng miền không reset hay ảnh hưởng draft đang dở ở khối Tuyến hoặc Nội/Ngoại thành.

## Notes

- Story này viết lại từ 2 bản cũ: bản gốc mô tả 1 draft gộp chung cả 3 khối; bản thứ hai mô tả mỗi khối có nút Lưu/Huỷ riêng nhưng luôn hiện input khi Nháp — cả 2 đã được thay thế hoàn toàn bởi mô hình Xem/Sửa.
- Chi tiết từng thao tác cụ thể (thêm vùng, tick chip, thêm tỉnh...) vẫn được mô tả ở GSA-ROUTE-2/3/4/6/7/8/10; story này mô tả cơ chế Xem/Sửa, phân quyền theo trạng thái, và toàn bộ header.
- Hành động "⚡ Áp dụng toàn bộ hệ thống" và Toggle "Hiển thị mặc định" chi tiết xem GSA-ROUTE-13.
