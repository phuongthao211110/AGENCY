---
id: GSA-ROUTE-15
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Khoá tuyến

## User Story

Là GHN Super Admin, tôi muốn khoá CẢ MỘT tuyến hoặc khoá RIÊNG một cặp vùng miền trong một modal "Khoá tuyến" tách biệt hoàn toàn khỏi bảng "Cấu hình tuyến", để chốt cứng những tuyến/cặp quan trọng (tránh bị đổi tên, gán nhầm, hay xoá nhầm) mà không làm rối thao tác chỉnh sửa tuyến hàng ngày ở bảng chính.

## User Flow

1. Tại trang "Chỉnh sửa vùng & tuyến" (`/super-admin/route-config/edit`, xem GSA-ROUTE-14), bấm nút "🔒 Khoá tuyến" ở header, cạnh nút "↻ Thiết lập lại" → mở modal "Khoá tuyến".
2. Modal hiện dòng phụ đề "Đã khoá N. Bấm vào tên tuyến để khoá/mở khoá CẢ tuyến, bấm vào 1 cặp vùng miền để khoá/mở khoá riêng cặp đó." (N = tổng số tuyến đã khoá cả + số cặp đã khoá riêng, cộng chung 1 số).
3. Bảng trong modal liệt kê MỌI tuyến hiện có NGOẠI TRỪ "Nội Tỉnh" (không khoá được), mỗi dòng gồm: pill cam "Tên tuyến" (bấm để toggle khoá CẢ tuyến) | các pill viền xanh dương "Cặp vùng miền" thuộc tuyến đó (bấm để toggle khoá RIÊNG từng cặp).
4. Bấm vào pill tên tuyến → nếu đang chưa khoá thì chuyển sang viền/chữ đỏ (đã khoá cả tuyến); bấm lại → mở khoá, về lại màu cam.
5. Bấm vào pill 1 cặp vùng miền → tương tự, toggle khoá riêng CẶP đó (không phụ thuộc tuyến có bị khoá cả hay không).
6. Bấm ✕ ở góc phải trên → đóng modal, KHÔNG lưu thay đổi vừa chọn.
7. Bấm "Lưu thay đổi" (cam, góc phải dưới) → lưu các thay đổi khoá, đóng modal. Quay lại bảng "Cấu hình tuyến" chính sẽ thấy input tên/chip/nút xoá của tuyến hoặc cặp vừa khoá chuyển sang trạng thái disabled (xám), dòng tuyến bị khoá cả có nền đỏ nhạt.

## System Flow

1. Modal dùng 2 draft cục bộ riêng — `lockDraftRouteNames: Set<string>`, `lockDraftPairKeys: Set<string>` — khởi tạo (`openLockModal`) từ state khoá hiện tại (`lockedRouteNames`, `lockedPairKeys`) mỗi lần mở modal, KHÔNG liên quan đến `regionsDraft`/`matrixDraft`/`urbanDraft` đang dở ở 3 khối chính.
2. Dữ liệu hiển thị trong modal (danh sách tên tuyến, cặp vùng miền thuộc từng tuyến) lấy từ bộ ĐANG ÁP DỤNG (`activeVersion.regions`/`activeVersion.routeMatrix`) — không lấy từ `matrixDraft` đang sửa dở ở bảng "Cấu hình tuyến" chính (nếu Super Admin đang có thay đổi chưa lưu ở đó).
3. `toggleLockDraftRoute(name)` / `toggleLockDraftPair(key)` — chỉ add/remove phần tử trong 2 Set draft cục bộ, không ghi gì ra ngoài cho tới khi bấm "Lưu thay đổi".
4. `commitLockDraft()` — gọi `commitNewRouteConfigVersion(activeVersion.regions, activeVersion.routeMatrix, activeVersion.urbanConfigs, undefined, Array.from(lockDraftRouteNames), Array.from(lockDraftPairKeys))`: tạo 1 bộ vùng tuyến MỚI giữ NGUYÊN y hệt `regions`/`routeMatrix`/`urbanConfigs` của bộ đang áp dụng, CHỈ thay đổi 2 field `lockedRouteNames`/`lockedPairKeys` — độc lập hoàn toàn với 3 nút "Lưu thay đổi" khác của khối Vùng miền/Tuyến/Nội-Ngoại thành (xem GSA-ROUTE-14).
5. Sau khi commit, cập nhật `activeVersion` bằng bộ mới, đồng bộ `lockedRouteNames`/`lockedPairKeys` (state dùng cho bảng chính) theo đúng 2 draft vừa lưu, rồi đóng modal.
6. Đóng modal bằng ✕ chỉ `setLockModalOpen(false)`, không gọi `commitLockDraft` — mọi toggle trong phiên mở modal bị bỏ.
7. Bảng "Cấu hình tuyến" chính đọc trực tiếp `lockedRouteNames`/`lockedPairKeys` để quyết định disable input tên tuyến, chip gán cặp, và nút xoá tuyến — KHÔNG còn bất kỳ icon/nút khoá-mở khoá nào nằm trong bảng chính nữa (đã gỡ bỏ hoàn toàn, chuyển hết logic toggle vào modal này).
8. `hasTuyenChanges` (cờ bật nút Huỷ bỏ/Lưu thay đổi của khối "Cấu hình tuyến" chính) có so sánh thêm `lockedRouteNames`/`lockedPairKeys` hiện tại với bộ đang áp dụng — nhưng việc LƯU thật của 2 field này chỉ xảy ra qua `commitLockDraft`, không qua nút Lưu của khối "Cấu hình tuyến".

## Acceptance Criteria

**AC1:** Nút "🔒 Khoá tuyến" nằm ở header trang "Chỉnh sửa vùng & tuyến", cạnh nút "↻ Thiết lập lại" — bấm vào mở modal "Khoá tuyến", không điều hướng sang trang khác.

**AC2:** Modal hiện dòng "Đã khoá {N}..." với N = số tuyến đã khoá cả + số cặp đã khoá riêng (cộng chung thành 1 số duy nhất).

**AC3:** Bảng trong modal liệt kê mọi tuyến hiện có của bộ ĐANG ÁP DỤNG, trừ "Nội Tỉnh" — không hiện "Nội Tỉnh" vì tuyến này không khoá được ở bất kỳ cấp nào.

**AC4:** Bấm vào pill tên tuyến → toggle khoá/mở khoá CẢ tuyến đó: khi khoá, pill chuyển viền/chữ màu đỏ; khi mở khoá, trở về viền/chữ màu cam.

**AC5:** Bấm vào pill 1 cặp vùng miền → toggle khoá/mở khoá RIÊNG đúng cặp đó, độc lập với trạng thái khoá cả tuyến đang chứa cặp này: khi khoá, pill chuyển viền/chữ màu đỏ; khi mở khoá, trở về viền/chữ xanh dương.

**AC6:** Bấm ✕ đóng modal → mọi toggle vừa bấm trong phiên mở modal này bị HUỶ BỎ, không ảnh hưởng tới bảng "Cấu hình tuyến" chính.

**AC7:** Bấm "Lưu thay đổi" → tạo đúng 1 bộ vùng tuyến MỚI, giữ nguyên y hệt dữ liệu vùng miền/tuyến/nội-ngoại thành của bộ đang áp dụng, CHỈ thay đổi danh sách tuyến bị khoá cả và danh sách cặp bị khoá riêng theo đúng lựa chọn vừa toggle trong modal; modal tự đóng sau khi lưu.

**AC8:** Hành động "Lưu thay đổi" của modal "Khoá tuyến" HOÀN TOÀN ĐỘC LẬP với draft đang sửa dở (nếu có) ở 3 khối Vùng miền/Tuyến/Nội-Ngoại thành của bảng chính — bấm Lưu ở modal không làm mất, không gộp, và không bị ảnh hưởng bởi thay đổi chưa lưu ở 3 khối đó.

**AC9:** Sau khi lưu khoá, tại bảng "Cấu hình tuyến" chính: input tên của tuyến bị khoá cả chuyển disabled (nền xám, không gõ được); mọi chip cặp vùng miền thuộc tuyến đó (dù bấm từ chip của chính tuyến này hay từ chip của tuyến KHÁC đang cố gán cặp đó) đều disabled; nút xoá (✕) của tuyến đó disabled.

**AC10:** Sau khi khoá riêng 1 cặp vùng miền (không khoá cả tuyến): chip của đúng cặp đó disabled ở MỌI tuyến (không cho đổi cặp này sang tuyến khác), nhưng các chip/cặp khác và input tên của tuyến đang chứa cặp này vẫn hoạt động bình thường nếu bản thân tuyến không bị khoá cả.

**AC11:** Dòng tuyến đang bị khoá cả tuyến trong bảng "Cấu hình tuyến" chính hiển thị nền đỏ nhạt (`#FEF2F2`) để nhận biết trực quan, dù không bấm thao tác khoá/mở khoá được tại đó.

**AC12:** Tuyến đang chứa ít nhất 1 cặp vùng miền bị khoá RIÊNG (dù bản thân tuyến không bị khoá cả) → nút xoá (✕) của tuyến đó tại bảng chính vẫn bị disabled, kèm tooltip giải thích cần mở khoá cặp đó trước khi xoá — tránh xoá tuyến làm mất gán của cặp đã khoá riêng (orphan khoá).

**AC13:** Bảng "Cấu hình tuyến" chính KHÔNG còn bất kỳ icon hay nút bấm khoá/mở khoá nào nằm trực tiếp trong từng dòng tuyến hoặc từng chip cặp — mọi thao tác thay đổi trạng thái khoá chỉ thực hiện được qua modal "Khoá tuyến".

## Notes

- Story này là bản TÁCH RA sau phản hồi người dùng: ý tưởng ban đầu là đặt icon khoá/mở khoá lẫn ngay trong từng dòng tuyến và từng chip của bảng "Cấu hình tuyến" chính, nhưng sau phản hồi muốn tách hẳn thành 1 khu vực/modal độc lập để bảng chính gọn hơn, không lẫn 2 loại thao tác (sửa cấu hình vs. khoá) cùng 1 chỗ — nên toàn bộ phần khoá được rút ra thành modal "Khoá tuyến" mô tả trong story này, bảng chính chỉ còn hiển thị trạng thái (disabled + nền đỏ nhạt).
- 2 cấp khoá độc lập với nhau: khoá CẢ TUYẾN (`lockedRouteNames`) chặn đổi tên/thêm-bớt bất kỳ cặp nào khỏi/vào tuyến đó và chặn xoá tuyến; khoá RIÊNG 1 CẶP (`lockedPairKeys`) chặn đổi cặp đó sang tuyến khác bất kể tuyến nguồn/đích có khoá cả hay không, và khiến tuyến chứa cặp đó không xoá được dù bản thân tuyến không khoá cả.
- "Nội Tỉnh" không khoá được ở cấp nào — không hiện trong modal này (hành vi giữ nguyên từ trước khi có tính năng khoá: không đổi tên, không xoá được).
- Dữ liệu modal lấy từ bộ ĐANG ÁP DỤNG, không phải từ draft đang sửa dở ở bảng "Cấu hình tuyến" — nếu Super Admin đang có thay đổi tuyến/cặp chưa lưu ở bảng chính, modal "Khoá tuyến" sẽ không phản ánh các thay đổi nháp đó cho tới khi được lưu thật.
