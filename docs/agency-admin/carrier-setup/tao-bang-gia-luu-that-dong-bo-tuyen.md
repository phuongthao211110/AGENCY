---
id: AGA-CARRIER-21
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGENCY] Thiết lập NVC - Tạo bảng giá: Lưu bảng giá thật, đồng bộ tuyến với Super Admin & Web Shop

## User Story

Là Agency Admin (Đại lý), tôi muốn bấm "Tạo bảng giá" thực sự LƯU bảng giá vào hệ thống (thay vì chỉ điều hướng đi mà không lưu gì), và tuyến trong bảng giá phải dùng ĐÚNG tên tuyến Super Admin đang quản lý — để bảng giá tôi vừa tạo xuất hiện được trong danh sách, xem lại được, và Web Shop tính đúng phí ship theo bảng giá đó.

## User Flow

1. Vào "Tạo bảng giá", điền tên bảng giá, cấu hình "Danh sách tuyến" (chọn tuyến, nhập khối lượng chuẩn + giá) và "Phụ phí đổi địa chỉ" như bình thường.
2. Bấm "Tạo bảng giá" → hệ thống LƯU bảng giá mới, rồi điều hướng về "Thiết lập NVC" (tab Bảng giá).
3. Bảng giá vừa tạo XUẤT HIỆN NGAY trong danh sách bảng giá — bấm vào xem được trang Chi tiết bảng giá đầy đủ (khối "Tuyến vận chuyển" liệt kê đúng các tuyến đã chọn).
4. Tại Web Shop, nếu 1 dịch vụ carrier (`AgencyService`) được gán `priceTableId` trỏ tới bảng giá vừa tạo, đơn hàng tạo mới sẽ tính phí ship theo ĐÚNG bảng giá đó (không còn luôn dùng bộ dữ liệu tĩnh seed sẵn).
5. Nếu Super Admin sau đó XOÁ 1 tuyến đang được dùng trong bảng giá này (ở "Cấu hình vùng & tuyến") → vào lại trang Chi tiết bảng giá, dòng tuyến đó hiện thêm nhãn cảnh báo đỏ "⚠ Tuyến đã bị xoá".

## System Flow

1. File mới `src/mock-data/pricingStore.ts` — cùng convention với `orderStore.ts`/`shopStore.ts`: `loadPricing()` đọc từ `localStorage` (key `ghn_pricing_v1`), seed lần đầu từ `pricing.json`, tự backfill bảng giá mới thêm vào seed sau này; `savePricing(list)`; `addPricingTable(table)` = `loadPricing()` + push + `savePricing()`.
2. `PricingCreate.tsx.handleSubmit()` — TRƯỚC ĐÂY chỉ có `navigate(...)`, không lưu gì. NAY build 1 `PriceTable` object từ state form rồi gọi `addPricingTable()` trước khi điều hướng:
   - `zones`: build từ `routes` — mỗi dòng tuyến trong form → 1 zone, với `label` VÀ `routeName` đều lấy TRỰC TIẾP `route.routeName` (tên tuyến Super Admin đang quản lý trong `routeConfig.ts`) — đây là cầu nối để 3 platform nhận diện đúng 1 tuyến theo cùng 1 tên. `from`/`to` lấy tỉnh cụ thể nếu có thu hẹp phạm vi, không thì lấy tên vùng/miền, cuối cùng fallback "Tất cả".
   - `weights`/`prices`: bảng giá thật (`pricing.json`) chỉ có 1 lưới bậc cân DÙNG CHUNG cho mọi tuyến (`weights[] × zones`), trong khi form cho phép MỖI tuyến tự đặt "Khối lượng chuẩn" + nhiều mức "Vượt cân" riêng — 2 mô hình không khớp nhau. Bản lưu này CHỈ giữ đúng 1 mức giá cơ bản/tuyến tại 1 bậc cân chung (khối lượng chuẩn LỚN NHẤT trong các tuyến, hoặc 500g nếu không tuyến nào nhập) — xem Notes về giới hạn.
   - `surcharges`: `addressChange` map thẳng từ state `addressChangeFee` (đúng nghĩa dùng chung cho cả bảng, không mất gì). Các phụ phí còn lại (Giao trả 1 phần/Bảo hiểm/Thu hộ/Giao thất bại) vẫn cấu hình RIÊNG theo từng tuyến trong form, nhưng `pricing.json` chỉ có 1 object `surcharges` DÙNG CHUNG cho cả bảng — bản lưu này CHỈ giữ cấu hình của TUYẾN ĐẦU TIÊN (`routes[0].surcharges`) cho các phụ phí này.
   - `id`: sinh mới `PRC${Date.now()}`; `agencyId: 'AGN001'`; `nvc: 'GHN'`; `isDefault: false`; `status: 'active'`.
3. `CarrierSetup.tsx` (tab Bảng giá, `TabPricingMerged`) — đổi từ `import allPriceTables from '.../pricing.json'` (tĩnh) sang gọi `loadPricing()` (động) mỗi lần render — danh sách bảng giá hiện đủ cả seed gốc lẫn bảng vừa tạo.
4. `PricingDetail.tsx` — đổi từ import tĩnh sang `loadPricing().find(p => p.id === id)`. Khối "Tuyến vận chuyển" tính thêm `routeDeleted = !!zone.routeName && !listRouteNames().includes(zone.routeName)` cho MỖI zone — zone seed cũ không có field `routeName` nên luôn coi là hợp lệ (chưa từng gắn với 1 tuyến Super Admin cụ thể để mà "mất" được); zone tạo qua bước 2 mà tuyến gốc đã bị Super Admin xoá thì hiện thêm badge đỏ "⚠ Tuyến đã bị xoá" cạnh tên tuyến, kèm tooltip nêu rõ tên tuyến đã mất.
5. `Orders.tsx` (Web Shop) — `shopFeeFromPriceTable()` và nơi tính `surcharges` cho `CreateOrderDrawer` đổi từ đọc biến `allPricing` (import tĩnh `pricing.json`) sang gọi `loadPricing()` trực tiếp — bảng giá vừa tạo ở Agency Admin giờ THẬT SỰ được Web Shop dùng để tính phí ship, nếu có dịch vụ nào trỏ `priceTableId` tới bảng giá đó.

## Acceptance Criteria

**AC1:** Bấm "Tạo bảng giá" (form hợp lệ, có tên bảng giá) → 1 bản ghi bảng giá mới được lưu vào `pricingStore` (`localStorage`), không chỉ điều hướng đi mà không lưu như trước.

**AC2:** Ngay sau khi tạo, quay về tab "Bảng giá" ở "Thiết lập NVC" → bảng giá vừa tạo xuất hiện trong danh sách, không cần tải lại trang.

**AC3:** Bấm vào bảng giá vừa tạo → trang Chi tiết bảng giá hiện đúng: tên, mô tả, khối "Tuyến vận chuyển" liệt kê đủ các tuyến đã cấu hình (đúng Từ/Đến/Nhãn theo dữ liệu đã nhập).

**AC4:** Mỗi zone trong bảng giá mới tạo có `label` VÀ `routeName` trùng khớp CHÍNH XÁC tên tuyến tương ứng đang tồn tại trong `routeConfig.ts` (Super Admin quản lý) tại thời điểm tạo — không tự đặt tên khác.

**AC5:** Nếu sau khi tạo, Super Admin xoá đúng tuyến đang được dùng trong bảng giá đó → mở lại trang Chi tiết bảng giá, đúng dòng tuyến đó hiện badge đỏ "⚠ Tuyến đã bị xoá"; các dòng tuyến khác (còn tồn tại) không bị ảnh hưởng.

**AC6:** Zone thuộc bảng giá SEED GỐC (tạo trước khi có tính năng này, không có field `routeName`) KHÔNG BAO GIỜ hiện badge "Tuyến đã bị xoá", bất kể Super Admin xoá tuyến gì — vì các zone này chưa từng gắn với 1 tuyến Super Admin cụ thể.

**AC7:** Tại Web Shop, đơn hàng dùng 1 dịch vụ carrier có `priceTableId` trỏ tới bảng giá vừa tạo ở Agency Admin → phí ship tính đúng theo `weights`/`prices`/`surcharges` của bảng giá đó, không còn luôn luôn dùng dữ liệu tĩnh seed sẵn trong `pricing.json`.

**AC8:** Reload lại toàn trang (F5) → bảng giá đã tạo vẫn còn (lưu bền trong `localStorage` của trình duyệt, không mất như trước đây khi chưa lưu thật).

## Notes

- **Bối cảnh phát sinh**: xuất phát từ câu hỏi "xoá tuyến ở Super Admin thì tuyến đó có mất ở Agency Admin và Web Shop không" — phát hiện ra "Tạo bảng giá" trước đây hoàn toàn KHÔNG lưu dữ liệu (`handleSubmit` chỉ có `navigate(...)`), nên Web Shop luôn đọc `pricing.json` tĩnh, không hề liên quan gì tới tuyến Super Admin quản lý — 2 hệ thống "tuyến" (routeConfig.ts động vs pricing.json tĩnh) tồn tại song song, không nối với nhau. Story này nối 2 hệ thống lại làm 1, ít nhất là cho MỌI bảng giá tạo mới từ nay trở đi.
- **Giới hạn đã biết (chưa xử lý)**: bậc cân "Vượt cân" theo từng nấc và 2 giá Nội thành/Ngoại thành riêng (form có, `pricing.json` không có chỗ chứa) — CHƯA được lưu đầy đủ, bản lưu chỉ giữ 1 mức giá cơ bản/tuyến tại 1 bậc cân chung. Muốn lưu đủ, cần mở rộng schema `pricing.json`/`pricingStore.ts` (thêm `overweightTiers`/`basePriceUrban`/`basePriceRural` theo từng zone) — chưa nằm trong phạm vi story này.
- **Giới hạn đã biết (chưa xử lý)**: phụ phí Giao trả 1 phần/Bảo hiểm/Thu hộ/Giao thất bại vẫn cấu hình theo TỪNG tuyến trong form (đúng theo quyết định trước đó — xem AGA-CARRIER-19 Notes, KHÔNG gộp các phụ phí này về 1 mối như "Phụ phí đổi địa chỉ"), nhưng `pricing.json` chỉ có 1 object `surcharges` DÙNG CHUNG cho cả bảng — nên khi lưu, chỉ tuyến ĐẦU TIÊN trong danh sách được giữ đúng cấu hình phụ phí; các tuyến còn lại bị bỏ qua phần này. Cần mở rộng schema (surcharges theo từng zone) nếu muốn lưu đúng và đủ.
- **Phạm vi đã cố ý KHÔNG đổi**: các trang chỉ đọc `pricing.json` để hiển thị tên bảng giá (không tạo/sửa) — `ShopCreate.tsx`, `AgencyOrders.tsx`, `ServiceDetail.tsx`, `ShopDetail.tsx`, `src/platforms/shop/pages/Pricing.tsx` — CHƯA đổi sang `pricingStore.ts`, vẫn đọc dữ liệu seed tĩnh. Không ảnh hưởng tính đúng đắn của story này (các trang đó không liên quan tới việc tạo bảng giá mới), nhưng nếu muốn toàn hệ thống nhất quán 100% thì cần đổi nốt các trang này ở 1 story riêng.
- `pricingStore.ts` dùng đúng pattern seed + backfill + `localStorage` như `orderStore.ts`/`shopStore.ts` — dữ liệu KHÔNG có backend thật, reload trình duyệt khác/xoá `localStorage` sẽ mất bảng giá đã tạo, chỉ còn lại 7 bảng giá seed gốc trong `pricing.json`.
