---
id: GSA-ROUTE-11
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Vòng đời Nháp/Hoạt động

## User Story

Là GHN Super Admin, tôi muốn mỗi "bộ vùng tuyến" có trạng thái rõ ràng — Nháp (đang soạn, chưa dùng được trong bảng giá) hoặc Hoạt động (khoá cấu trúc, dùng được trong bảng giá và có thể áp dụng toàn hệ thống) — để biết bộ nào đã sẵn sàng và bộ nào vẫn đang chỉnh sửa.

## User Flow

1. Cách DUY NHẤT tạo bộ mới là Nhân bản (xem GSA-ROUTE-16) từ 1 bộ có sẵn — Nháp hay Hoạt động đều nhân bản được. Bộ mới luôn bắt đầu ở trạng thái Nháp. Không có "tạo bộ trống từ đầu".
2. Bộ Nháp: Vùng miền + Tuyến sửa được tự do qua bản nháp cục bộ. Bấm "💾 Lưu thay đổi" → ghi TẠI CHỖ trên chính bộ Nháp đó, không sinh bộ mới.
3. Bộ Nháp: Nội/Ngoại thành và khoá/mở tuyến cũng sửa được tự do.
4. Khi đã sửa xong, bấm "⚡ Áp dụng toàn bộ hệ thống" (xem GSA-ROUTE-13) để đồng thời phát hành bộ Nháp sang Hoạt động VÀ áp dụng ngay làm bộ active. Hành động 1 chiều — không có đường quay lại Nháp.
5. Bộ Hoạt động: Vùng miền + Tuyến khoá VĨNH VIỄN — banner thông báo rõ, mọi input/chip liên quan đều disabled. Vẫn sửa được Nội/Ngoại thành và khoá/mở tuyến. Muốn thay đổi cấu trúc → nhân bản bộ này thành bộ Nháp mới.
6. Bộ Hoạt động: có thể "Áp dụng cho toàn hệ thống" (xem GSA-ROUTE-13) và chọn được trong dropdown "Bộ tuyến áp dụng" khi Agency Admin tạo bảng giá.
7. Bộ Nháp không dùng nữa → có thể Xoá hẳn (xem GSA-ROUTE-18). Bộ Hoạt động không bao giờ xoá được — lịch sử giữ vĩnh viễn.

## System Flow

1. `RouteConfigStatus = 'draft' | 'published'` — chỉ 2 trạng thái, không có 'cancelled' hay trạng thái thứ 3 nào khác.
2. `RouteConfigVersion.status` — field bắt buộc trên mỗi bộ. Bộ seed ban đầu (`rcv_seed`) có `status: 'published'`.
3. Dữ liệu cũ trong localStorage (trước khi có field `status`) không có field này → restore logic tự gán `status = 'published'` (an toàn vì mọi bộ cũ đã từng chọn được ở bảng giá, tương đương "phát hành").
4. `updateDraftStructure(id, regions, routeMatrix)` — chỉ hợp lệ khi `status === 'draft'`. Ghi TẠI CHỖ vào đúng phần tử trong `routeConfigVersions`, không tạo phần tử mới. Trả `null` nếu không tìm thấy hoặc bộ không còn là Nháp.
5. `updateVersionUrbanConfigs(id, urbanConfigs)` và `updateVersionLocks(id, lockedPairKeys)` — cho phép ở CẢ 2 trạng thái, luôn lưu TẠI CHỖ. (`updateVersionLocks` chỉ khoá RIÊNG từng cặp vùng miền — không có khái niệm khoá cả tuyến, xem GSA-ROUTE-15.)
6. `publishRouteConfigVersion(id)` — chuyển `status` từ `'draft'` sang `'published'`, validate phải có tuyến "Nội Tỉnh". Không tự động áp dụng bộ vừa phát hành.
7. `setActiveRouteConfigVersion(id)` — chỉ nhận bộ `status === 'published'`, trả `null` cho Nháp.
8. `duplicateRouteConfigVersion(sourceId, label)` — cách DUY NHẤT tạo bộ mới, luôn trả về bộ `status: 'draft'`.
9. `deleteDraftVersion(id)` — chỉ xoá Nháp, trả `false` nếu gọi với bộ Hoạt động.

## Acceptance Criteria

**AC1:** Mỗi bộ vùng tuyến có đúng 2 trạng thái: Nháp và Hoạt động. Không có trạng thái thứ 3.

**AC2:** Bộ Nháp: Vùng miền + Tuyến sửa được qua draft cục bộ; "💾 Lưu thay đổi" ghi TẠI CHỖ trên chính bộ đó — tổng số bộ trong danh sách KHÔNG tăng sau khi lưu.

**AC3:** Bộ Hoạt động: Vùng miền + Tuyến khoá VĨNH VIỄN — mọi input, chip gán cặp miền đều disabled; banner thông báo hiển thị rõ ràng trên trang sửa.

**AC4:** Cả 2 trạng thái đều cho phép sửa Nội/Ngoại thành (`updateVersionUrbanConfigs`) và khoá/mở tuyến (`updateVersionLocks`) — lưu TẠI CHỖ, không sinh bộ mới.

**AC5:** Nút "⚡ Áp dụng toàn bộ hệ thống" chỉ xuất hiện khi bộ đang là Nháp. Sau khi thực hiện thành công, bộ chuyển sang Hoạt động và không có đường quay lại Nháp.

**AC6:** Dropdown "Bộ tuyến áp dụng" trong Agency Admin (PricingCreate.tsx) chỉ hiện bộ Hoạt động — bộ Nháp không bao giờ xuất hiện trong dropdown này.

**AC7:** Bộ Hoạt động không bao giờ có nút "Xoá" — lịch sử giữ vĩnh viễn. Chỉ bộ Nháp mới xoá được.

## Notes

- Story này viết lại từ bản cũ (GSA-ROUTE-11 "Bộ vùng tuyến — mỗi lần lưu tạo 1 bộ mới, không sửa đè"). Bản cũ dùng `commitNewRouteConfigVersion` và không có khái niệm trạng thái Nháp/Hoạt động — đã bị thay thế hoàn toàn.
- Các story liên quan: GSA-ROUTE-16 (Nhân bản), GSA-ROUTE-13 (Áp dụng toàn hệ thống — gộp phát hành + áp dụng), GSA-ROUTE-18 (Xoá nháp).
