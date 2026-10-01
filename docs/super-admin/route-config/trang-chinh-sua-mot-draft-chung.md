---
id: GSA-ROUTE-14
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Trang "Chỉnh sửa vùng & tuyến" — 1 draft chung cho 3 phần

## User Story

Là GHN Super Admin, tôi muốn chỉnh sửa Vùng miền, Tuyến, và Nội/Ngoại thành trên CÙNG 1 bản nháp (draft), rồi lưu MỘT LẦN DUY NHẤT để tạo ra 1 bộ vùng tuyến mới hoàn chỉnh — thay vì phải lưu riêng từng phần — để đảm bảo 3 phần này luôn đồng bộ với nhau trong cùng 1 bộ, không bị lệch pha.

## User Flow

1. Vào trang qua nút "Chỉnh sửa vùng & tuyến" ở trang danh sách (GSA-ROUTE-12), route `/super-admin/route-config/edit`.
2. Đầu trang có link "← Danh sách bộ vùng tuyến" quay lại GSA-ROUTE-12; tiêu đề "Chỉnh sửa vùng & tuyến"; mô tả "Đang chỉnh trên bộ vùng tuyến đang áp dụng — bấm 'Lưu thay đổi' sẽ tự sinh ra 1 bộ MỚI, bộ hiện tại vẫn giữ nguyên trong lịch sử, không bị sửa đè."
3. Trang mở sẵn với dữ liệu của bộ ĐANG ÁP DỤNG (không phải trống) — Super Admin sửa trực tiếp trên đó y hệt trước đây (thêm/sửa/xoá vùng miền, tick chip gán tuyến, thêm/sửa/xoá tuyến, cấu hình Nội/Ngoại thành theo tỉnh/xã-phường).
4. Có 2 thanh hành động GIỐNG HỆT NHAU (1 ở ngay dưới khối "Cấu hình tuyến", 1 ở cuối khối "Cấu hình nội & ngoại thành") — cả 2 đều điều khiển CHUNG 1 draft, bấm ở đâu cũng ra kết quả như nhau (tiện vì Nội/Ngoại thành nằm cuối trang, khỏi phải cuộn lên).
5. "Huỷ bỏ" (chỉ bật khi có thay đổi) → khôi phục draft về đúng dữ liệu bộ đang áp dụng, bỏ mọi chỉnh sửa chưa lưu.
6. "💾 Lưu thay đổi (tạo bộ mới)" (chỉ bật khi có thay đổi) → tạo 1 bộ mới (xem GSA-ROUTE-11), trang KHÔNG điều hướng đi đâu cả — tiếp tục ở lại trang này, có thể sửa/lưu tiếp nhiều lần trong 1 phiên, mỗi lần lưu là 1 bộ mới.
7. "↻ Thiết lập lại" → tải lại toàn bộ trang, mất mọi thay đổi trong phiên (kể cả các bộ đã lỡ tạo trong phiên — vì đây là demo, dữ liệu chỉ ở bộ nhớ, không persist).

## System Flow

1. State draft hợp nhất: `routeDraftRegions`, `routeDraftMatrix`, `routeNames`, `routeDraftUrbanConfigs` — TẤT CẢ khởi tạo từ dữ liệu bộ đang áp dụng (`regions`/`routeMatrix`/`urbanConfigs` hiện tại), không có state draft riêng cho Nội/Ngoại thành nữa (khác bản trước khi tính năng versioning chưa có — lúc đó Nội/Ngoại thành có draft + nút Lưu RIÊNG, độc lập với Vùng miền/Tuyến).
2. `activeVersion` (state, khởi tạo `getActiveRouteConfigVersion()`) — dùng để so sánh draft hiện tại với bộ đang áp dụng, tính `hasRouteChanges` (bật/tắt nút Huỷ bỏ/Lưu thay đổi).
3. Mọi handler sửa Vùng miền/Tuyến (`handleAddRegion`, `handleRenameRegion`, `handleDeleteRegion`, `handleAssignProvince`, `handleRemoveProvince`, `handleAddTuyen`, `handleRenameTuyen`, `handleDeleteTuyen`, `handleToggleChip`) và Nội/Ngoại thành (`handleAddUrbanProvinceDraft`, `handleRemoveUrbanProvinceDraft`, `handleToggleUrbanWardDraft`, `handleSelectAllUrbanWards`) đều CHỈ gọi `setState` trên draft cục bộ — không có hàm nào ghi vào store dùng chung nữa (khác bản cũ, nơi các handler này gọi thẳng hàm mutate của `routeConfig.ts`).
4. `commitRouteDraft()` — gọi `commitNewRouteConfigVersion(routeDraftRegions, routeDraftMatrix, routeDraftUrbanConfigs)`, cập nhật `activeVersion` bằng version mới trả về, rồi đồng bộ LẠI draft từ store (giờ đã trỏ đúng bộ mới) để các thao tác tiếp theo so sánh đúng với bộ vừa tạo.
5. `cancelRouteDraft()` — reset draft về đúng `activeVersion.regions/routeMatrix/urbanConfigs` (deep clone).
6. `hasRouteChanges` = so sánh `JSON.stringify` draft với `JSON.stringify` `activeVersion` cho CẢ 3 phần (`regions`, `routeMatrix`, `urbanConfigs`) — sửa BẤT KỲ phần nào trong 3 phần cũng làm biến này = true.

## Acceptance Criteria

**AC1:** Trang mở sẵn dữ liệu của bộ ĐANG ÁP DỤNG (không trống) ở cả 3 khối Vùng miền/Tuyến/Nội-Ngoại thành.

**AC2:** Sửa BẤT KỲ 1 trong 3 khối (Vùng miền HOẶC Tuyến HOẶC Nội/Ngoại thành) → CẢ 2 thanh hành động (trên và dưới) đều bật nút "Huỷ bỏ"/"Lưu thay đổi" cùng lúc.

**AC3:** Bấm "Lưu thay đổi" ở thanh TRÊN hay thanh DƯỚI đều cho kết quả giống hệt nhau — tạo đúng 1 bộ mới chứa ĐỦ dữ liệu cả 3 khối tại thời điểm bấm (không phải chỉ khối gần nút nhất).

**AC4:** Sau khi lưu thành công, nút "Huỷ bỏ"/"Lưu thay đổi" tự tắt lại (vì draft giờ khớp đúng bộ mới vừa tạo) — không còn "có thay đổi chưa lưu" giả.

**AC5:** Bấm "Huỷ bỏ" → mọi ô nhập/tick trên cả 3 khối trở về ĐÚNG giá trị của bộ đang áp dụng (trước khi sửa), không sót lại thay đổi nào.

**AC6:** Không điều hướng rời trang sau khi lưu — Super Admin có thể lưu nhiều lần liên tiếp trong 1 phiên, mỗi lần tạo đúng 1 bộ mới.

**AC7:** Không có vùng miền nào → khối "Cấu hình tuyến" hiện "Chưa có vùng miền nào — thêm ở khối 'Cấu hình vùng miền' trước." (giữ nguyên hành vi cũ, không đổi).

## Notes

- **Route đổi từ `/super-admin/route-config` sang `/super-admin/route-config/edit`** — route gốc giờ thuộc về trang danh sách (GSA-ROUTE-12).
- Story này chỉ mô tả CƠ CHẾ DRAFT CHUNG + LƯU TẠO BỘ MỚI — chi tiết từng thao tác cụ thể (thêm vùng, tick chip gán tuyến, thêm tỉnh Nội/Ngoại thành...) đã có sẵn ở GSA-ROUTE-2/3/4/6/7/8/10 — các story đó vẫn ĐÚNG về THAO TÁC, chỉ SAI về thời điểm lưu (mô tả "ghi thẳng vào store" cần hiểu lại thành "ghi vào draft, chỉ lưu thật khi bấm Lưu thay đổi") — chưa cập nhật lại trong phạm vi story này.
- Trước khi có tính năng versioning, khối "Nội & ngoại thành" có nút Lưu/Huỷ RIÊNG, độc lập với Vùng miền/Tuyến (xem GSA-ROUTE-4) — bản này gộp chung làm 1, GSA-ROUTE-4 cần cập nhật lại phần đó.
- Không có "known gap" về nguồn dữ liệu — toàn bộ là dữ liệu Super Admin nhập thật, không dùng công thức demo cố định.
