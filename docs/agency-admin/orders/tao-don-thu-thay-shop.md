---
id: AGA-ORDER-15
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY][247] Đơn hàng: Tạo đơn thay shop

## User Story

Là Agency Admin (Đại lý), tôi muốn tạo đơn **thư, tài liệu** thay cho shop — không chỉ đơn hàng hoá như hiện tại — để hỗ trợ shop nhập đơn thư khi cần, giống hệt cách tôi đã tạo được đơn hàng hoá.

## User Flow

1. Ở trang "Đơn hàng", bấm nút cam **"Tạo đơn hàng"** (giờ có mũi tên ▾) → dropdown xổ ra 2 lựa chọn: **"Tạo đơn hàng"** và **"Tạo thư, tài liệu"** — giống hệt dropdown đã có ở Web Shop
2. Chọn "Tạo thư, tài liệu" → drawer **"Gửi thư, tài liệu"** mở ra
3. Chọn **Shop tạo đơn** ở đầu drawer — đổi shop thì "Bên gửi" và tỉnh/thành mặc định của "Bên nhận" cũng đổi theo
4. Điền Bên nhận (tên/SĐT/địa chỉ/tỉnh), Khối lượng — card "Dịch vụ" tự tính phí ship theo đúng tuyến (tỉnh shop → tỉnh nhận) và khối lượng, chọn dịch vụ 247Express rẻ nhất khả dụng của đại lý
5. Điền thêm Mã đơn shop / Giá trị hàng / Nội dung thư (không bắt buộc)
6. Bấm "Tạo đơn" → đơn được tạo thật, vào tab "Chờ xử lý" (như đơn thư shop tự tạo) — chờ đại lý xác nhận chọn hub gửi 247Express

## System Flow

1. Thêm dropdown ở nút "Tạo đơn hàng" (state `createMenuOpen`) — 2 mục: "Tạo đơn hàng" → `setDrawerOpen(true)` (mở `CreateOrderDrawer` có sẵn), "Tạo thư, tài liệu" → `setLetterDrawerOpen(true)` (mở `CreateLetterDrawerAgency` mới) — cùng pattern với dropdown đã có ở `Orders.tsx` (Web Shop)
2. `CreateLetterDrawerAgency` — component mới trong `AgencyOrders.tsx`, có thêm 1 field mà bản Web Shop không có: **"Shop tạo đơn"** (`selectedShopId`, mặc định `agencyShops[0]`) — đổi shop thì tỉnh "Bên nhận" reset theo tỉnh của địa chỉ shop mới
3. Engine tính phí **copy lại** từ `CreateLetterDrawer` (Web Shop): tìm dịch vụ 247Express đang bật của đại lý (`allServices.filter(carrier==='247Express' && enabled && agencyId===CURRENT_AGENCY_ID)`) có phí thấp nhất theo tuyến (tỉnh shop → tỉnh nhận) + khối lượng, qua `letterFeeFromPriceTable()` (tra `zones`/`weights`/`prices` của price table dịch vụ đó) — **không** dùng `configuredServices`/`demoFee` như `CreateOrderDrawer` (Hàng hoá), vì hiện chưa shop nào được cấu hình dịch vụ 247Express theo cơ chế đó
4. Bấm "Tạo đơn" → gọi `addOrder()` thật (không phải gap như `CreateOrderDrawer` — xem AGA-ORDER-13): `shopId` = shop đã chọn, `senderName/senderPhone` từ shop đó, `cod: 0`, `sendKind: 'letter'`, `dispatchStatus: 'pending_agency'`, `carrierCode: null` — đúng semantics như đơn thư shop tự tạo

## Acceptance Criteria

**AC1:** Nút "Tạo đơn hàng" có mũi tên ▾, bấm ra dropdown 2 lựa chọn đúng như Web Shop.

**AC2:** Chọn "Tạo thư, tài liệu" → mở đúng drawer "Gửi thư, tài liệu", không phải drawer Hàng hoá.

**AC3:** Đổi "Shop tạo đơn" → card "Bên gửi" hiển thị đúng thông tin shop mới, tỉnh "Bên nhận" reset theo tỉnh shop mới.

**AC4:** Đổi tỉnh "Bên nhận" hoặc Khối lượng → phí ship ở card "Dịch vụ" cập nhật lại đúng theo tuyến/khối lượng mới (đã verify: đổi tỉnh nhận Hà Nội → TP.HCM khiến phí đổi từ 17.000đ → 22.000đ).

**AC5:** Không có dịch vụ 247Express nào khả dụng cho đại lý → card "Dịch vụ" hiện "Không có dịch vụ khả dụng", không crash.

**AC6:** Bấm "Tạo đơn" → đơn được lưu thật vào `orderStore` (`sendKind: 'letter'`, `dispatchStatus: 'pending_agency'`), xuất hiện đúng ở tab "Chờ xử lý" của trang Đơn hàng.

## Notes

- Tái sử dụng gần như toàn bộ UI đã đơn giản hoá của `CreateLetterDrawer` (Web Shop) — không có toggle Tài liệu/Hàng hoá, không Kích thước, không 3 checkbox phụ phí, không 2 ô giá trị — khớp đúng tinh thần "tái hiện UI tham chiếu" đã làm trước đó cho Web Shop.
- Các helper hàm tính phí (`letterParseProvince`, `letterResolveZoneIndex`, `letterFeeFromPriceTable`...) được **copy riêng** vào `AgencyOrders.tsx` (đặt tên khác `letter*` để tránh trùng) vì 2 file `Orders.tsx` (Web Shop) và `AgencyOrders.tsx` không share code — đúng convention duplication đã dùng xuyên suốt dự án cho các component/hàm riêng theo từng platform.
- Nút "Lưu nháp" vẫn chưa có `onClick` (giống Web Shop) — chỉ nút "Tạo đơn" hoạt động thật.
- Không đổi gì ở `CreateOrderDrawer` (Hàng hoá) — gap "Tạo đơn không lưu" ở đó (AGA-ORDER-13) vẫn còn nguyên, ngoài phạm vi task này.
