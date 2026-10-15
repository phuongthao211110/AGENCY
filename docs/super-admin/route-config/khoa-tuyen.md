---
id: GSA-ROUTE-15
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Khoá riêng cặp vùng miền

## User Story

Là GHN Super Admin, tôi muốn khoá RIÊNG một cặp vùng miền cụ thể trực tiếp trong bảng "Cấu hình tuyến" bằng icon khoá inline — và thao tác này có hiệu lực ngay lập tức trên đúng bộ đang xem (dù Nháp hay Hoạt động), để chốt cứng những cặp quan trọng mà không cần mở modal riêng, không cần tạo thêm bộ mới, và không phải khoá cứng cả tuyến chỉ vì 1 cặp cần giữ nguyên.

## User Flow

1. Mở trang sửa bộ vùng tuyến (GSA-ROUTE-14), vào khối "🔀 Cấu hình tuyến".
2. Dòng tuyến chỉ liệt kê các chip cho cặp vùng miền ĐÃ ĐƯỢC GÁN cho đúng tuyến đó (chip viền xanh dương nhạt) — cặp chưa gán KHÔNG hiện ở đây (xem GSA-ROUTE-3, gộp vào khối "chưa được gán tuyến" cuối bảng với dropdown gán riêng). Mỗi chip đã gán có 1 icon khoá nhỏ gắn liền bên trái.
3. Bấm icon khoá cạnh 1 chip → toggle khoá RIÊNG đúng cặp đó. Trạng thái đổi NGAY LẬP TỨC, không có bước xác nhận, không có nút Lưu riêng — lưu thẳng vào bộ đang xem qua `updateVersionLocks`.
4. Chip đang khoá chuyển hẳn sang viền đỏ + icon khoá đặc màu đỏ; chip chưa khoá giữ viền xanh dương + icon khoá mở màu xanh dương.
5. Khoá 1 cặp KHÔNG ảnh hưởng gì tới các cặp khác trong CÙNG tuyến, và KHÔNG ảnh hưởng tới tên tuyến — tên tuyến vẫn sửa/xoá được bình thường (trừ khi bộ Hoạt động, lúc đó Vùng miền/Tuyến khoá cứng vì lý do khác — xem GSA-ROUTE-14). Không có khái niệm "khoá cả tuyến" trong hệ thống.
6. Thao tác khoá/mở khoá hoạt động ở CẢ 2 trạng thái Nháp và Hoạt động — đây là ngoại lệ được cho phép (khối Vùng miền + Tuyến bị khoá cho bộ Hoạt động, nhưng thao tác khoá/mở cặp thì vẫn dùng được). Ngoài ra, thao tác này còn hoạt động ĐỘC LẬP với chế độ Xem/Sửa của khối "Cấu hình tuyến" (`tuyenEditing`) — icon khoá bấm được dù khối Tuyến đang ở chế độ Xem (chưa bấm "✏️ Chỉnh sửa"). Xem GSA-ROUTE-14 AC8.

## System Flow

1. `togglePairLock(key)` — add/remove `key` trong `lockedPairKeys` set, gọi ngay `updateVersionLocks(bundle.id, Array.from(next))`. Không qua draft, không tạo bộ mới.
2. `updateVersionLocks(id, lockedPairKeys)` — tìm bộ theo `id`, cập nhật field `lockedPairKeys` TẠI CHỖ, persist vào localStorage. Hợp lệ với cả `'draft'` lẫn `'published'`.
3. Sau khi lưu thành công, component cập nhật `lockedPairKeys` state để UI phản ánh ngay — icon và chip liên quan đổi màu/disabled.
4. Áp dụng cho ĐÚNG BỘ ĐANG XEM (`bundle.id`) — không chỉ bộ đang active toàn hệ thống. Super Admin khoá/mở được cả ở bộ Hoạt động chưa phải active.
5. Dòng tuyến chỉ render `assignedPairs = allRegionPairs.filter(([a,b]) => matrixDraft[pairKey(a.id,b.id)] === name)` — không duyệt toàn bộ `allRegionPairs` cho mỗi dòng (tránh hiện hàng loạt chip xám "chưa gán" rối mắt). Tuyến chưa có cặp nào hiện dòng chữ nghiêng "Chưa có cặp vùng miền nào".
6. `handleToggleChip(routeName, regionIdA, regionIdB)` — chỉ chặn khi `isPublished` hoặc `lockedPairKeys.has(key)`; KHÔNG còn nhánh kiểm tra "route đang bị khoá" (đã bỏ hẳn khái niệm này khỏi codebase).
7. `handleRenameTuyen`/`handleDeleteTuyen` — chỉ chặn khi `isPublished` (và `'Nội Tỉnh'` cho rename) hoặc `hasLockedPair` (cho xoá, xem AC5); không còn nhánh kiểm tra khoá cả tuyến.

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Agency Admin** — Tạo bảng giá | Dropdown "Tuyến" trong PricingCreate.tsx hiện badge khoá (full/partial/none) theo bộ tuyến đang chọn, tính từ `routeLockStatusIn()` — "full" khi 100% cặp của tuyến đó đều nằm trong `lockedPairKeys`, "partial" khi chỉ 1 phần, "none" khi chưa cặp nào bị khoá. Tuyến bị khoá vẫn chọn được, badge chỉ để tham khảo (xem AGA-CARRIER-23). |

## Acceptance Criteria

**AC1:** Dòng tuyến chỉ hiện chip cho cặp ĐÃ GÁN (viền xanh dương `#BFDBFE`, chữ/icon `#3B82F6`) — không còn hiện chip cho cặp chưa gán. Mỗi chip đã gán có icon khoá nhỏ gắn liền bên trái.

**AC2:** Bấm icon khoá cạnh 1 chip → toggle khoá riêng đúng cặp đó NGAY LẬP TỨC, không có bước xác nhận, không có nút Lưu riêng.

**AC3:** Khoá/mở khoá lưu NGAY, áp dụng cho đúng bộ đang xem theo `bundle.id`.

**AC4:** Thao tác khoá/mở khoá hoạt động ở CẢ bộ Nháp lẫn bộ Hoạt động, VÀ ở cả 2 chế độ Xem/Sửa của khối "Cấu hình tuyến" (không bị gate bởi `tuyenEditing`).

**AC5:** Cặp bị khoá: chip của đúng cặp đó disabled (không cho đổi sang tuyến khác, không gỡ được khi đang Sửa), nhưng tên tuyến và mọi chip khác của tuyến chứa cặp đó vẫn tự do sửa/gỡ bình thường (nếu bộ còn là Nháp và khối Tuyến đang ở chế độ Sửa).

**AC6:** Tuyến chứa ít nhất 1 cặp bị khoá → nút xoá tuyến đó disabled (tránh orphan khoá: xoá tuyến sẽ tự gỡ gán mọi cặp của tuyến, kể cả cặp đang khoá).

**AC7:** Cặp vùng miền CHƯA được gán vào tuyến nào không hiện ở bất kỳ dòng tuyến nào — gộp riêng vào khối "X cặp vùng miền chưa được gán tuyến" cuối bảng (ẩn hẳn khi bộ Hoạt động), mỗi cặp có dropdown "Gán vào tuyến..." để chọn gán.

**AC8:** Không có bất kỳ nút/icon nào để khoá "cả 1 tuyến" — chỉ khoá được ở cấp từng cặp vùng miền. Xoá/đổi tên tuyến chỉ bị chặn bởi `isPublished` hoặc bởi AC6, không có trạng thái "tuyến đã khoá" nào khác.

## Notes

- **Đã bỏ hẳn tính năng khoá CẢ TUYẾN** theo yêu cầu — trước đây có 2 cấp khoá độc lập (khoá cả tuyến qua `lockedRouteNames` + khoá riêng từng cặp qua `lockedPairKeys`), giờ CHỈ còn đúng 1 cấp: khoá riêng từng cặp. Đã xoá field `lockedRouteNames` khỏi `RouteConfigVersion`, hàm `toggleRouteLock`, và icon khoá cạnh tên tuyến khỏi `RouteConfig.tsx`. `updateVersionLocks()` đổi chữ ký từ `(id, lockedRouteNames, lockedPairKeys)` còn `(id, lockedPairKeys)`.
- Quyết định này KHÁC với artifact thiết kế gốc (chỉ mô tả 1 công tắc khoá/tuyến, không có khoá riêng từng cặp) — Super Admin chủ động chọn giữ lại khoá-theo-cặp (mịn hơn spec) thay vì công tắc khoá cả tuyến (thô hơn spec).
- `routeLockStatusIn()` (dùng cho badge ở Agency Admin) không đổi logic tính "full" — trước đây đã có nhánh tự suy ra "full" khi 100% cặp bị khoá dù không ai bấm khoá cả tuyến, nên bỏ `lockedRouteNames` không làm mất khả năng hiện "full" cho Agency Admin.
- Story này viết lại từ 2 bản trước: bản gốc mô tả khoá qua modal riêng (đã thay bằng icon inline), bản thứ 2 có cả khoá-cả-tuyến lẫn khoá-riêng-từng-cặp (nay bỏ khoá-cả-tuyến).
