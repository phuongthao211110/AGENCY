---
id: AGA-CARRIER-23
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGENCY] Thiết lập NVC - Agency Admin xem được tuyến/cặp vùng miền đang bị Super Admin khoá

## User Story

Là Agency Admin, tôi muốn thấy được tuyến nào (hoặc cặp vùng miền nào trong tuyến) đang bị Super Admin khoá ngay tại những nơi tôi đang thao tác — khi tạo bảng giá, khi xem chi tiết bảng giá, và khi kiểm tra tuyến — để tôi chủ động nắm được cấu hình nào đang bị hạn chế mà không cần hỏi Super Admin.

## User Flow

1. **Tạo bảng giá** — Vào "Thiết lập NVC" → tab Bảng giá → "Thêm bảng giá". Trong phần "Danh sách tuyến", mỗi dropdown "Tuyến" hiển thị hậu tố trạng thái khoá: "(Đã khoá)" cho tuyến bị khoá toàn bộ, "(1 số cặp bị khoá)" cho tuyến bị khoá 1 phần.
2. Sau khi chọn 1 tuyến bị khoá và đóng dropdown (label chính không còn hậu tố), 1 badge vàng hiện ngay dưới dropdown để nhắc trạng thái khoá của tuyến đang chọn.
3. Mở modal "Bảng mô tả tuyến dịch vụ" (nút "Định nghĩa tuyến" hoặc icon (i) cạnh toggle Nội/Ngoại thành) → bảng mô tả tuyến trong modal cũng hiển thị badge khoá cạnh mỗi tên tuyến.
4. **Xem chi tiết bảng giá đã tạo** — Vào chi tiết 1 bảng giá; trong card "Tuyến vận chuyển", mỗi zone có tên tuyến kèm badge khoá nếu tuyến đó đang bị khoá theo bộ tuyến active hiện tại.
5. **Kiểm tra tuyến** — Vào công cụ "Kiểm tra tuyến" (mục Công cụ trong sidebar); badge khoá hiện trong cả khung kết quả phân loại (sau khi nhập địa chỉ và bấm "Kiểm tra tuyến") và bảng tổng quan "N Tuyến hiện tại" (luôn hiển thị sẵn).
6. Tất cả badge là thông tin tham khảo — Agency Admin vẫn có thể chọn và dùng tuyến đang bị khoá bình thường, không bị chặn.

## System Flow

1. `routeConfig.ts` thêm hàm thuần `routeLockStatusIn(version: RouteConfigVersion, routeName: string): 'full' | 'partial' | 'none'`:
   - Trả về `'full'` nếu `routeName` nằm trong `version.lockedRouteNames[]`
   - Trả về `'full'` nếu 100% cặp miền của tuyến đó đều nằm trong `version.lockedPairKeys[]` (kể cả khi không ai bấm khoá tên tuyến — khoá từng cặp đủ hết thì tương đương)
   - Trả về `'partial'` nếu có ít nhất 1 nhưng chưa đủ 100% cặp của tuyến bị khoá qua `lockedPairKeys[]`
   - Trả về `'none'` nếu tuyến không bị khoá theo bất kỳ cơ chế nào
2. `PricingCreate.tsx` gọi `routeLockStatusIn(selectedBundle, routeName)` trong render mỗi `<option>` của dropdown "Tuyến" (thêm hậu tố text) và trong render badge ngay dưới dropdown; `selectedBundle` là bộ tuyến đang chọn ở dropdown "Bộ tuyến áp dụng" (xem AGA-CARRIER-22), không phải bộ global.
3. `ZoneGuideModal` nhận `bundle` prop từ `PricingCreate.tsx`; gọi `routeLockStatusIn(bundle, name)` cho mỗi hàng trong bảng mô tả tuyến — đồng nhất với dropdown.
4. `PricingDetail.tsx` gọi `routeLockStatusIn(getActiveRouteConfigVersion(), zone.routeName)` cho mỗi zone trong card "Tuyến vận chuyển"; đọc bộ ĐANG ACTIVE TOÀN HỆ THỐNG vì trang này không có khái niệm "chọn bộ".
5. `RouteCheck.tsx` gọi `routeLockStatusIn(getActiveRouteConfigVersion(), routeName)` cho 2 vị trí: tên tuyến trong khung kết quả phân loại và mỗi hàng tuyến trong bảng tổng quan; cũng đọc bộ global active.
6. Không có logic nào chặn hoặc disable thao tác — hàm `routeLockStatusIn` chỉ được gọi để render badge, không gắn vào điều kiện cho phép/từ chối hành động nào.

## Acceptance Criteria

**AC1:** Ở trang "Tạo bảng giá", dropdown "Tuyến" của mỗi dòng trong "Danh sách tuyến" hiển thị hậu tố động:
- Tuyến bị khoá toàn bộ (`lockedRouteNames` chứa tên tuyến, HOẶC 100% cặp miền của tuyến đều nằm trong `lockedPairKeys`): hậu tố " 🔒 (Đã khoá)"
- Tuyến bị khoá 1 phần (ít nhất 1 nhưng chưa đủ 100% cặp trong `lockedPairKeys`): hậu tố " 🔒 (1 số cặp bị khoá)"
- Tuyến không bị khoá: hiển thị bình thường, không hậu tố

**AC2:** Sau khi chọn 1 tuyến bị khoá rồi đóng dropdown, badge xuất hiện ngay bên dưới dropdown với nội dung tương ứng:
- Khoá full → "🔒 Tuyến đang bị khoá"
- Khoá partial → "🔒 1 số cặp trong tuyến này đang bị khoá"
- Không bị khoá → không hiển thị badge

**AC3:** Modal "Bảng mô tả tuyến dịch vụ" (mở qua nút "Định nghĩa tuyến" hoặc icon (i) cạnh toggle Nội/Ngoại thành) hiển thị badge khoá cùng quy tắc AC1 cạnh mỗi tên tuyến trong bảng mô tả.

**AC4:** Badge khoá ở PricingCreate (AC1–AC3) đọc theo bộ tuyến ĐANG CHỌN ở dropdown "Bộ tuyến áp dụng" (AGA-CARRIER-22), không cố định đọc bộ global. Khi đổi sang bộ khác → badge và hậu tố cập nhật theo trạng thái khoá của bộ vừa chọn.

**AC5:** Ở trang xem chi tiết bảng giá (PricingDetail), trong card "Tuyến vận chuyển", mỗi zone hiển thị badge khoá (cùng quy tắc full/partial ở AC1) cạnh tên tuyến; đọc theo bộ tuyến ĐANG ACTIVE TOÀN HỆ THỐNG tại thời điểm xem.

**AC6:** Ở công cụ "Kiểm tra tuyến" (RouteCheck), badge khoá hiển thị đúng ở 2 vị trí:
- Trong khung kết quả phân loại (sau khi nhập địa chỉ lấy/giao và bấm "Kiểm tra tuyến"): cạnh tên tuyến được phân loại
- Trong bảng tổng quan "N Tuyến hiện tại" (luôn hiển thị sẵn): cạnh mỗi tên tuyến trong danh sách

**AC7:** Khoá RIÊNG từng cặp vùng miền trong 1 tuyến (bấm khoá cặp, không bấm khoá tên tuyến) → badge hiện "partial"; khi đủ 100% số cặp của tuyến đó bị khoá theo cách này → badge tự động nâng lên "full" (không cần ai bấm khoá cả tuyến).

**AC8:** Toàn bộ badge là thông tin tham khảo — không chặn Agency Admin chọn tuyến bị khoá, không chặn tạo bảng giá, không chặn sử dụng RouteCheck với tuyến bị khoá.

## Notes

- Hàm `routeLockStatusIn()` xử lý cả 2 cấp khoá độc lập: `lockedRouteNames[]` (khoá cả tên tuyến) và `lockedPairKeys[]` (khoá riêng từng cặp miền). Trước khi có hàm này, code chỉ kiểm tra `lockedRouteNames` nên khoá cặp riêng lẻ không được phản chiếu — đây là gap thật được phát hiện qua UAT.
- Quy tắc "100% cặp bị khoá riêng lẻ = coi như full" được thiết kế để không đánh giá thấp mức độ ảnh hưởng: nếu mọi cặp đều bị khoá thì về bản chất tuyến không còn cặp nào tự do.
- `PricingDetail.tsx` là trang read-only (không có chức năng sửa giá — xem AGA-CARRIER-19) nên badge khoá ở đây thuần tham khảo.
- Khoá tuyến không ảnh hưởng đơn hàng đã tạo, không ảnh hưởng tính phí — chỉ là rào chắn edit-time cho Super Admin (xem AGA-CARRIER-19). Badge phản chiếu thông tin này cho Agency Admin.
- Xem AGA-CARRIER-22 để hiểu cơ chế "Bộ tuyến áp dụng" — story này đọc trạng thái khoá theo ĐÚNG BỘ đang chọn ở PricingCreate, không đọc bộ global.
- Web Shop không có bất kỳ hiển thị nào về tuyến bị khoá — nằm ngoài phạm vi story này.
