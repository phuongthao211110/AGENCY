---
id: SHOP-ORDER-40
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Tạo đơn mới: Áp dụng cấu hình tuyến

## User Story

Là chủ shop, khi tạo đơn hàng hoá mới và đang so sánh các dịch vụ vận chuyển, tôi muốn thấy tuyến đang được dùng để tính phí cho từng dịch vụ, để chọn dịch vụ phù hợp TRƯỚC KHI tạo đơn — thay vì chỉ biết sau khi đơn đã được tạo.

## User Flow

1. Mở "Tạo đơn mới" (`CreateOrderDrawer`) cho đơn Hàng hoá, chọn tỉnh người nhận.
2. Ở khối "Chọn dịch vụ", mỗi dịch vụ đang hiển thị dòng "Phí ship: {fee}đ" → thêm ngay bên dưới 1 dòng nhỏ "Tuyến: {tên tuyến}" cho đúng dịch vụ đó.
3. Dịch vụ nào chưa gán bảng giá, hoặc địa chỉ gửi/nhận chưa khớp được zone nào trong bảng giá → dòng "Tuyến" vẫn hiện, với text fallback rõ ràng thay vì để trống.
4. Đổi tỉnh người nhận → dòng "Tuyến" của TẤT CẢ dịch vụ trong danh sách cập nhật lại ngay, đồng bộ với "Phí ship" (cả 2 đang tính lại mỗi lần render theo cùng cơ chế).
5. Mở "Tạo đơn Thư" (`CreateLetterDrawer`, 247Express) → KHÔNG có dòng "Tuyến" nào xuất hiện.

## System Flow

1. Không cần import gì mới — toàn bộ dữ liệu cần thiết đã có sẵn trong `CreateOrderDrawer` (`Orders.tsx`): `fromProvince`, `rcvProvince`, hàm `resolveZoneIndex` (dòng 93) và `loadPricing()` đã import sẵn ở đầu file.
2. Sửa đúng vị trí đang render từng dịch vụ trong khối "Chọn dịch vụ" (`serviceGroups.map(...)`, khoảng dòng 1817-1849) — nơi đang tính `const fee = shopFeeFromPriceTable(cheapestInGroup(group), weightGram, fromProvince, rcvProvince)` (dòng 1820).
3. Ngay dưới dòng đó, tính thêm (dùng ĐÚNG service của group, qua `cheapestInGroup(group)` — không phải service đầu tiên trong group):
   ```ts
   const service = cheapestInGroup(group)
   const priceTable = service.priceTableId ? (loadPricing() as any[]).find(p => p.id === service.priceTableId) : null
   const zoneIndex = priceTable ? resolveZoneIndex(priceTable, fromProvince, rcvProvince) : -1
   const zone = zoneIndex >= 0 ? priceTable?.zones?.[zoneIndex] : undefined
   const appliedRouteName = zone?.routeName ?? zone?.label
   ```
4. Render thêm 1 dòng nhỏ ngay dưới "Phí ship: {fee}đ" trong cùng card dịch vụ: `Tuyến: {appliedRouteName ?? 'Chưa xác định'}`.
5. KHÔNG đổi `shopFeeFromPriceTable`/`resolveZoneIndex` — chỉ đọc thêm `priceTable.zones[zoneIndex]` để lấy tên hiển thị, không ảnh hưởng số liệu phí đang tính.
6. `CreateLetterDrawer` (247Express, từ dòng ~1963) KHÔNG áp dụng thay đổi này — bảng giá 247Express có zones dạng `{label}` (ước lượng theo miền qua `PROVINCE_REGION`), không có `from`/`to`/`routeName`, nên không có khái niệm "tuyến" để hiển thị.

## Acceptance Criteria

**AC1:** Trong "Tạo đơn mới" (Hàng hoá), mỗi dịch vụ trong khối "Chọn dịch vụ" hiển thị thêm 1 dòng "Tuyến: {tên tuyến}" ngay dưới dòng "Phí ship" của chính dịch vụ đó.

**AC2:** Tên tuyến hiển thị lấy từ `zone.routeName` (fallback `zone.label` nếu `routeName` chưa có) của ĐÚNG zone mà `resolveZoneIndex` trả về cho dịch vụ đó — không phải zone đầu tiên hay tuyến ngẫu nhiên trong bảng giá.

**AC3:** Dịch vụ chưa gán bảng giá (`priceTableId` rỗng/không tìm thấy), hoặc không khớp được zone nào → dòng "Tuyến" hiện fallback rõ ràng (ví dụ "Chưa xác định") — không để trống hoặc hiện `undefined`.

**AC4:** Đổi tỉnh người nhận → dòng "Tuyến" của mọi dịch vụ trong danh sách cập nhật lại tương ứng, cùng nhịp với "Phí ship" đang cập nhật (cả 2 tính lại mỗi render).

**AC5:** Mở "Tạo đơn Thư" (`CreateLetterDrawer`) → không có dòng "Tuyến" nào xuất hiện ở bất kỳ đâu trong form.

**AC6:** Tính năng thuần hiển thị — không thay đổi `feeShipping`/`totalShipping`/`buildOrder()`, không thêm field mới vào `Order` (Order vẫn không lưu `routeName`, giữ đúng nguyên tắc đơn hàng không cần truy vết tuyến).

## Notes

- **PLANNING SPEC — CHƯA CÓ CODE:** Story này mô tả tính năng SẮP làm, chưa có dòng nào trong `Orders.tsx` được sửa tại thời điểm viết. Cần frontend-dev triển khai sau khi story được approve.
- **Khác biệt so với bản doc trước (đã sai):** bản cũ định hướng lấy "tuyến áp dụng" qua `resolveRouteName()` — đọc cấu hình "Vùng & Tuyến" ĐANG ACTIVE của Super Admin trong `routeConfig.ts` — và hiển thị ở màn CHI TIẾT đơn đã tạo. Đọc lại code thực tế cho thấy phí ship lúc TẠO đơn (`shopFeeFromPriceTable`/`resolveZoneIndex`) hoàn toàn KHÔNG dùng `routeConfig.ts` — chỉ tra theo `priceTable.zones` (dữ liệu đã đóng băng lúc Agency Admin tạo bảng giá, xem AGA-CARRIER-22/23). Vì vậy bản doc này chuyển sang lấy tên tuyến từ đúng `zone.routeName`/`zone.label` của bảng giá đang dùng để tính phí — khớp 100% với tuyến THỰC SỰ áp dụng, thay vì 1 tên tuyến khác có thể đã đổi trong cấu hình global kể từ lúc bảng giá được tạo.
- Đặt ở màn "Tạo đơn mới" (trước khi submit) thay vì "Chi tiết đơn" (sau khi đã tạo) — giúp shop so sánh tuyến/phí giữa các dịch vụ TRƯỚC khi quyết định, hữu ích hơn so với chỉ biết sau khi đơn đã tạo xong.
- `zone.routeName` là field traceability mới thêm gần đây (xem AGA-CARRIER-22) — chỉ có ở bảng giá tạo SAU khi field này tồn tại; bảng giá cũ hơn sẽ `undefined`, phải fallback `zone.label`.
- Không áp dụng cho `CreateLetterDrawer`/247Express — bảng giá loại này không có cấu trúc zones dạng route-based (`from`/`to`), chỉ ước lượng theo miền qua `PROVINCE_REGION` — không có khái niệm "tuyến" như GHN để hiển thị.
- Khối "Chọn dịch vụ" hiện render mỗi SERVICE GROUP 1 dòng duy nhất, dùng dịch vụ rẻ nhất trong group (`cheapestInGroup`) — tuyến hiển thị bắt buộc phải tính trên ĐÚNG service đó, không phải service đầu tiên trong group.
- Text fallback chính xác khi chưa xác định được tuyến cần đồng thuận với PM/design trước khi code — AC3 chỉ yêu cầu phải có fallback, không quy định chữ cụ thể.
