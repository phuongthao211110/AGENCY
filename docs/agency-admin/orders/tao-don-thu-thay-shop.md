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

1. Ở trang "Đơn hàng", bấm nút cam **"Tạo đơn hàng"** (giờ có mũi tên ▾) → dropdown xổ ra 2 lựa chọn: **"Tạo đơn hàng"** và **"Tạo thư, tài liệu"** — giống hệt dropdown đã có ở Web Shop.
2. Chọn "Tạo thư, tài liệu" → drawer **"Gửi thư, tài liệu"** mở ra.
3. Chọn **Shop tạo đơn** ở đầu drawer — chỉ gắn đơn với đúng shop đó và reset tỉnh/thành mặc định của "Bên nhận" theo tỉnh shop mới. **KHÔNG** ảnh hưởng tới card "Bên gửi" — 2 lựa chọn hoàn toàn độc lập.
4. Card **"Bên gửi"** — chọn 1 trong các bưu cục 247Express đại lý đã được cấp (không phải địa chỉ shop) — đổi bưu cục thì thông tin liên hệ/địa chỉ hiển thị đổi theo, và phí ship tính lại theo tuyến mới (tính từ tỉnh của bưu cục, không phải tỉnh shop).
5. Điền Bên nhận (tên/SĐT/địa chỉ/tỉnh), Khối lượng — card "Dịch vụ" tự tính phí ship theo đúng tuyến (tỉnh bưu cục → tỉnh nhận) và khối lượng, chọn dịch vụ 247Express rẻ nhất khả dụng của đại lý.
6. Điền thêm Mã đơn shop / Giá trị hàng / Nội dung thư (không bắt buộc).
7. Bấm "Tạo đơn" → đơn được tạo thật, vào tab "Chờ xử lý" (như đơn thư shop tự tạo) — chờ đại lý xác nhận chọn hub gửi 247Express.

## System Flow

1. Thêm dropdown ở nút "Tạo đơn hàng" (state `createMenuOpen`) — 2 mục: "Tạo đơn hàng" → `setDrawerOpen(true)` (mở `CreateOrderDrawer` có sẵn), "Tạo thư, tài liệu" → `setLetterDrawerOpen(true)` (mở `CreateLetterDrawerAgency` mới) — cùng pattern với dropdown đã có ở `Orders.tsx` (Web Shop).
2. `CreateLetterDrawerAgency` có 2 field lựa chọn ĐỘC LẬP: **"Shop tạo đơn"** (`selectedShopId`, mặc định `agencyShops[0]` — chỉ dùng để gắn `shopId` cho đơn và reset tỉnh "Bên nhận") và **"Bên gửi"** (`selectedHubId`, mặc định `agencyHubs[0]` — chọn 1 bưu cục 247Express thật của đại lý, lấy từ `agency.clientHubIds` → `clientHubs247`). Đổi field này không ảnh hưởng field kia.
3. `fromProvince` (dùng để tính phí ship) lấy theo `selectedHub.provinceName` — KHÔNG phải tỉnh của shop — vì đơn Thư do đại lý tạo hộ đi qua 247Express thật sự xuất phát từ bưu cục, không phải từ nhà shop. Đây là điểm sửa chính của story này (trước đây `fromProvince` lấy nhầm theo tỉnh shop).
4. Engine tính phí **copy lại** từ `CreateLetterDrawer` (Web Shop): tìm dịch vụ 247Express đang bật của đại lý (`allServices.filter(carrier==='247Express' && enabled && agencyId===CURRENT_AGENCY_ID)`) có phí thấp nhất theo tuyến (tỉnh bưu cục → tỉnh nhận) + khối lượng, qua `letterFeeFromPriceTable()` — không dùng `configuredServices`/`demoFee` như `CreateOrderDrawer` (Hàng hoá).
5. Bấm "Tạo đơn" → gọi `addOrder()` thật: `shopId` = shop đã chọn, `senderName`/`senderPhone`/`senderAddress` lấy từ **bưu cục** đã chọn (`contactName`/`contactPhone`/`location`) — KHÔNG còn lấy từ shop, `cod: 0`, `sendKind: 'letter'`, `dispatchStatus: 'pending_agency'`, `carrierCode: null`.
6. Đại lý chưa được cấp bưu cục 247Express nào (`agencyHubs.length === 0`) → card "Bên gửi" hiện thông báo "Đại lý chưa được cấp bưu cục 247Express nào — liên hệ Super Admin" thay vì dropdown rỗng.

## Acceptance Criteria

**AC1:** Nút "Tạo đơn hàng" có mũi tên ▾, bấm ra dropdown 2 lựa chọn đúng như Web Shop.

**AC2:** Chọn "Tạo thư, tài liệu" → mở đúng drawer "Gửi thư, tài liệu", không phải drawer Hàng hoá.

**AC3:** Đổi "Shop tạo đơn" → chỉ đổi `shopId` gắn với đơn và tỉnh mặc định của "Bên nhận" — KHÔNG đổi bất kỳ thông tin nào ở card "Bên gửi".

**AC4:** Card "Bên gửi" là dropdown chọn bưu cục 247Express của đại lý (không phải địa chỉ shop) — đổi bưu cục → thông tin liên hệ + địa chỉ cập nhật đúng theo bưu cục mới.

**AC5:** Đổi bưu cục ở "Bên gửi" → phí ship tính lại theo tuyến MỚI, tính từ tỉnh bưu cục (không phải tỉnh shop) — đã verify: bưu cục "Hub TP.HCM Trung Tâm" → Hà Nội = 22.000đ; bưu cục "Hub Hà Nội Trung Tâm" → Hà Nội = 17.000đ.

**AC6:** Đại lý chưa được cấp bưu cục 247Express nào → card "Bên gửi" hiện đúng thông báo, không cho chọn gì, không crash.

**AC7:** Không có dịch vụ 247Express nào khả dụng cho đại lý → card "Dịch vụ" hiện "Không có dịch vụ khả dụng", không crash.

**AC8:** Bấm "Tạo đơn" → đơn được lưu thật vào `orderStore` với `senderName`/`senderPhone`/`senderAddress` lấy từ bưu cục đã chọn (không phải từ shop), `sendKind: 'letter'`, `dispatchStatus: 'pending_agency'`, xuất hiện đúng ở tab "Chờ xử lý".

## Notes

- **Đính chính so với bản đầu:** ban đầu card "Bên gửi" hiển thị nhầm thông tin của SHOP đã chọn (giống như shop tự gửi từ nhà mình) — đã sửa lại đúng theo yêu cầu nghiệp vụ trực tiếp: đơn Thư do đại lý tạo hộ phải xuất phát từ 1 bưu cục 247Express thật, không phải từ địa chỉ shop. AC3/AC4/AC5 và phần System Flow liên quan đã viết lại theo hành vi đúng này; AC4/AC5 cũ (số liệu ví dụ đổi tỉnh Bên nhận Hà Nội→TP.HCM) không còn chính xác 100% vì gốc phí giờ tính từ bưu cục chứ không phải tỉnh shop, đã thay bằng ví dụ verify mới theo đúng cơ chế bưu cục.
- Tái sử dụng gần như toàn bộ UI đã đơn giản hoá của `CreateLetterDrawer` (Web Shop) — không có toggle Tài liệu/Hàng hoá, không Kích thước, không 3 checkbox phụ phí, không 2 ô giá trị.
- Các helper hàm tính phí (`letterParseProvince`, `letterResolveZoneIndex`, `letterFeeFromPriceTable`...) được **copy riêng** vào `AgencyOrders.tsx` (đặt tên khác `letter*` để tránh trùng) vì 2 file `Orders.tsx` (Web Shop) và `AgencyOrders.tsx` không share code.
- Nút "Lưu nháp" vẫn chưa có `onClick` (giống Web Shop) — chỉ nút "Tạo đơn" hoạt động thật.
- Không đổi gì ở `CreateOrderDrawer` (Hàng hoá) — gap "Tạo đơn không lưu" ở đó (AGA-ORDER-13) vẫn còn nguyên, ngoài phạm vi task này.
