---
id: SHOP-ORDER-40
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Chi tiết đơn hàng: Áp dụng cấu hình tuyến

## User Story

Là chủ shop, khi xem chi tiết 1 đơn hàng hoá, tôi muốn thấy tuyến vận chuyển đang áp dụng cho đơn đó (dựa trên địa chỉ gửi/nhận và cấu hình "Vùng & Tuyến" hiện hành của Super Admin), để hiểu rõ đơn của mình được tính phí theo tuyến nào và phát hiện sớm nếu tuyến chưa được cấu hình đúng.

## User Flow

1. Mở chi tiết 1 đơn hàng hoá (`sendKind = 'goods'`) → trong card "Phí vận chuyển", ngay sau dòng "Phí ship: {order.fee}đ", thấy thêm 1 dòng "Tuyến áp dụng: Tuyến 1" (hoặc tên tuyến đang active trong cấu hình).
2. Nếu địa chỉ gửi/nhận chưa được gán vùng, hoặc cặp vùng chưa có tuyến trong cấu hình hiện hành → dòng vẫn hiện "Tuyến áp dụng: ..." với text fallback rõ ràng thay vì để trống.
3. Mở chi tiết đơn Thư (`sendKind = 'letter'`) → dòng "Tuyến áp dụng" KHÔNG xuất hiện.

## System Flow

1. Cần import `resolveRouteName` từ `src/mock-data/routeConfig.ts` và `parseProvinceFromAddress` từ `src/mock-data/pricingCalc.ts` vào `src/platforms/shop/pages/Orders.tsx` — đây là lần đầu tiên 2 module này được nối với `Orders.tsx` (Web Shop).
2. Tại vị trí render card "Phí vận chuyển" trong `Orders.tsx` (khoảng dòng 3061-3102, bên trong nhánh `order.sendKind !== 'letter'` đã có sẵn từ dòng ~3066), cần tính toán tuyến:
   - `const fromProvince = parseProvinceFromAddress(order.senderAddress)`
   - `const toProvince = parseProvinceFromAddress(order.receiverAddress)`
   - `const routeName = resolveRouteName(fromProvince, toProvince)`
3. Sau dòng hiển thị "Phí ship: {order.fee}đ" (dòng ~3089-3101), cần render thêm 1 dòng: `Tuyến áp dụng: {routeName ?? '<text fallback>'}`.
4. Điều kiện render: vị trí thêm đã nằm trong nhánh `order.sendKind !== 'letter'` — không cần thêm điều kiện mới, đơn Thư tự động bị loại trừ.
5. `resolveRouteName` đọc trực tiếp `routeMatrix` và `regions` từ state module-scope trong `routeConfig.ts` — không cần truyền params hay quản lý version, luôn phản ánh cấu hình hiện hành của Super Admin.

## Acceptance Criteria

**AC1:** Mở chi tiết đơn hàng hoá → trong card "Phí vận chuyển", có 1 dòng "Tuyến áp dụng: {tên tuyến}" ngay sau dòng phí ship — tên tuyến khớp với cấu hình "Vùng & Tuyến" hiện hành trong Super Admin.

**AC2:** `resolveRouteName` trả về `null` (tỉnh gửi/nhận chưa được gán vùng, hoặc cặp vùng chưa có tuyến) → dòng "Tuyến áp dụng" vẫn hiện với text fallback rõ ràng — không được hiển thị rỗng hoặc `undefined`.

**AC3:** Mở chi tiết đơn Thư (`sendKind = 'letter'`) → KHÔNG có dòng "Tuyến áp dụng" trong card "Dịch vụ".

**AC4:** Dòng "Tuyến áp dụng" chỉ phản ánh tuyến được phân tích từ địa chỉ thực tế của đơn — không tính lại `order.fee`, không thay đổi bất kỳ giá trị nào đã lưu trong đơn.

**AC5:** Sau khi Super Admin thay đổi cấu hình "Vùng & Tuyến" → mở lại chi tiết đơn → tên tuyến phản ánh đúng cấu hình mới nhất (vì `resolveRouteName` đọc trực tiếp state hiện hành, không cache).

## Notes

- **PLANNING SPEC — CHƯA CÓ CODE:** Story này mô tả tính năng SẮP làm, chưa có dòng nào trong `Orders.tsx`, `routeConfig.ts` hay `pricingCalc.ts` được sửa tại thời điểm viết. Cần frontend-dev triển khai sau khi story được approve.
- Tính năng THUẦN HIỂN THỊ — không đổi logic tính phí, không tính lại `order.fee`. Giá trị fee đã lưu từ lúc tạo đơn giữ nguyên.
- Chỉ áp dụng cho đơn Hàng hoá — đơn Thư đi qua 247Express dùng hệ thống hub riêng, không liên quan `routeMatrix`. Quy ước phân nhánh theo `sendKind` đã tồn tại trong cùng card (dòng ~3066 trong `Orders.tsx` hiện có `order.sendKind !== 'letter'`).
- `resolveRouteName(fromProvince, toProvince)` và `findRegionOf(province)` đã có sẵn trong `routeConfig.ts`; `parseProvinceFromAddress(address)` đã có sẵn trong `pricingCalc.ts` (đã dùng ở `AgencyOrdersImport.tsx`) — không cần viết hàm mới.
- Text fallback chính xác khi tuyến chưa xác định cần được đồng thuận với PM/design trước khi code — AC2 chỉ yêu cầu phải có fallback, không quy định chữ cụ thể.
- Dev cần kiểm tra circular dependency khi import `pricingCalc.ts` vào `Orders.tsx` lần đầu.
