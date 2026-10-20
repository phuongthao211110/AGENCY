---
id: AGA-CARRIER-26
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGENCY] Thiết lập NVC - Tạo bảng giá: Thay đổi bộ tuyến áp dụng

## User Story

Là Agency Admin, tôi muốn xem danh sách tất cả bộ tuyến đã phát hành (kèm Vùng miền/Tuyến của từng bộ) để so sánh trước khi chọn, và đổi bộ tuyến áp dụng cho bảng giá đang tạo chỉ trong 1 lần bấm, để dễ dàng tìm đúng bộ phù hợp với kịch bản giá đang cần mà không phải đoán tên bộ qua dropdown.

## User Flow

1. Tại trang "Tạo bảng giá", card "Thông tin cơ bản" → dòng "Bộ tuyến áp dụng" (xem AGA-CARRIER-22) → bấm link **"Thay đổi"**.
2. Modal **"Thay đổi vùng tuyến"** mở ra:
   - Ô tìm kiếm theo tên bộ ở đầu modal.
   - Bảng 4 cột: **Tên** (tên bộ, màu xanh), **Vùng miền** (tên các vùng miền của bộ, nối dấu phẩy), **Tuyến** (tên các tuyến của bộ, nối dấu phẩy), **Thao tác**.
   - Cột Thao tác: bộ đang chọn hiện chữ xanh **"Đã chọn"** (không phải nút); các bộ khác hiện nút **"Chọn"**.
   - Cuối modal có thanh phân trang: "Hiển thị 50" + số trang + "Đến trang".
3. Gõ vào ô tìm kiếm → bảng lọc còn các bộ có tên khớp (không phân biệt hoa/thường), trang tự về 1.
4. Bấm "Chọn" ở 1 dòng bộ khác → modal đóng NGAY, không hỏi xác nhận gì (Tạo bảng giá là trang state cục bộ chưa lưu, đổi/xoá tự do không cần cảnh báo). Dòng "Bộ tuyến áp dụng" cập nhật theo bộ vừa chọn, VÀ toàn bộ "Danh sách tuyến" bên dưới RESET + populate lại theo danh sách tuyến của bộ mới (tên tuyến mỗi dòng đổi theo bộ mới, dữ liệu giá đã nhập ở các dòng cũ bị xoá trắng).
5. Chỉ các bộ `status === 'published'` xuất hiện trong bảng — bộ Nháp Super Admin đang soạn dở không bao giờ hiện (xem AGA-CARRIER-24).
6. Nếu hệ thống chỉ có đúng 1 bộ đã phát hành → bảng hiện đúng 1 dòng đó ("Đã chọn"), không có nút "Chọn" nào khác, không báo lỗi.

## System Flow

1. `ChangeBundleModal` (component trong `PricingCreate.tsx`) nhận props `bundles` (đã filter `status === 'published'` ở nơi gọi, mới nhất lên đầu — xem AGA-CARRIER-24), `selectedId`, `onSelect`, `onClose`.
2. State nội bộ: `search` (chuỗi tìm kiếm), `page`, `pageSize` (mặc định 50).
3. `filtered = bundles.filter(b => b.label.toLowerCase().includes(search.trim().toLowerCase()))`; đổi `search` tự `setPage(1)`.
4. Mỗi dòng tính `regionNames = bundle.regions.map(r => r.name || '(chưa đặt tên)').join(', ')` và `routeNames = listRouteNamesIn(bundle).join(', ')` — tái dùng đúng hàm đã có trong `routeConfig.ts`, không thêm hàm mới.
5. Bấm "Chọn" gọi `onSelect(bundle.id); onClose()` ngay lập tức, không qua bước xác nhận nào. `onSelect` = `handleBundleChange(versionId)` của `PricingCreate.tsx`: đổi `selectedBundleId` VÀ reset `routes` thành `listRouteNamesIn(newBundle).map((name, i) => makeEmptyRoute(name, String(i + 1)))`.
6. `BundlePagination` (component riêng, cùng file) — bản sao kiểu dáng của `Pagination` đã dùng ở `AgencyOrders.tsx`/`Shops.tsx` (mỗi file platform tự có bản `Pagination` riêng, không import chéo).

## Acceptance Criteria

**AC1:** Bấm "Thay đổi" → mở modal "Thay đổi vùng tuyến" với ô tìm kiếm, bảng Tên/Vùng miền/Tuyến/Thao tác, và thanh phân trang ("Hiển thị N" + số trang + "Đến trang").

**AC2:** Bảng chỉ hiện bộ có `status === 'published'` — bộ Nháp không bao giờ xuất hiện (xem AGA-CARRIER-24).

**AC3:** Bộ đang chọn hiện chữ xanh "Đã chọn" ở cột Thao tác (không phải nút); các bộ khác hiện nút "Chọn".

**AC4:** Gõ vào ô tìm kiếm → bảng chỉ còn các bộ có tên khớp (không phân biệt hoa/thường), trang tự reset về 1.

**AC5:** Bấm "Chọn" ở 1 bộ khác → đổi ngay, modal đóng, KHÔNG có bước xác nhận nào (kể cả khi "Danh sách tuyến" đã nhập dữ liệu) — toàn bộ "Danh sách tuyến" RESET + populate lại theo danh sách tuyến của bộ vừa chọn, dữ liệu giá cũ bị xoá trắng.

**AC6:** Khi hệ thống chỉ có đúng 1 bộ đã phát hành → bảng hiện đúng 1 dòng đó ("Đã chọn"), không báo lỗi, không hiện nút "Chọn" nào khác.

## Notes

- Đổi bộ tuyến KHÔNG có bước xác nhận/cảnh báo mất dữ liệu — Tạo bảng giá là trang tạo mới, toàn bộ "Danh sách tuyến" chỉ là state cục bộ CHƯA LƯU vào `pricingStore.ts`; đổi/xoá tự do ở đây không mất dữ liệu đã lưu thật nào. Quyết định này đã được xác nhận lại rõ ràng — KHÔNG thêm `window.confirm` cho thao tác này dù đã nhập dữ liệu, khác với các hành động ảnh hưởng dữ liệu ĐÃ LƯU ở nơi khác trong hệ thống (huỷ đơn, xoá bộ tuyến...).
- Redesign từ `<select>` sang modal bảng có tìm kiếm/phân trang — lý do: `<select>` không đủ chỗ hiện Vùng miền/Tuyến của từng bộ để Agency Admin so sánh trước khi đổi.
- Xem AGA-CARRIER-22 để biết dòng "Bộ tuyến áp dụng" hiển thị/mặc định ra sao; AGA-CARRIER-25 để biết modal "Xem chi tiết".
- 3 hàm gốc `isSameProvinceRouteName()`, `describeSameProvinceRoutePairs()`, `listRouteNames()` (đọc state global) KHÔNG bị ảnh hưởng — Web Shop (`CreateOrderDrawer`, `CreateLetterDrawer`) và RouteCheck.tsx vẫn dùng hàm gốc, đọc đúng bộ tuyến global đang active.
