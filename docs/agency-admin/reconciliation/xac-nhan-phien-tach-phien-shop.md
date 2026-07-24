---
id: AGA-RECON-3
jiraKey: 
platform: agency-admin
section: Đối soát & Chuyển khoản
figma: 
status: draft
---

# [AGA] Đối soát: Xác nhận phiên GHN — tự động tách phiên shop

## User Story

Là Agency Admin (Đại lý), tôi muốn xác nhận một phiên đối soát GHN đang "Chờ xác nhận" để khoá dữ liệu phiên lại và hệ thống tự động tách ra thành các phiên đối soát riêng cho từng shop có đơn trong phiên đó, chuẩn bị cho việc thanh toán COD với từng shop.

## User Flow

1. Agency Admin vào "Đối soát & Chuyển khoản" → tab "Phiên NVC" → mở 1 phiên đang "Chờ xác nhận"
2. Ở trang chi tiết phiên, bấm nút "Xác nhận phiên" (góc trên phải, chỉ hiện khi phiên đang "Chờ xác nhận")
3. Modal "Xác nhận phiên GHN" hiện ra, hỏi xác nhận phiên `{mã phiên}`, kèm cảnh báo: "Sau khi xác nhận, hệ thống sẽ tự động tạo phiên đối soát cho từng shop thuộc đại lý. Dữ liệu phiên sẽ bị khoá, không thể chỉnh sửa."
4. Agency Admin bấm "Xác nhận phiên" → quay lại danh sách phiên NVC, phiên vừa xác nhận chuyển trạng thái "Đã xác nhận"
5. Agency Admin chuyển sang tab "Phiên shop" → thấy danh sách phiên shop mới xuất hiện, mỗi phiên tương ứng 1 shop có đơn trong phiên GHN vừa xác nhận, trạng thái mặc định "Chờ xác nhận"

## System Flow

1. Bấm "Xác nhận phiên" → `CarrierSession.status` chuyển từ `'pending'` sang `'confirmed'` (điều hướng về danh sách kèm `state: { confirmedId: id }`, trang danh sách tự cập nhật session tương ứng)
2. "Tách phiên shop" **không phải một bước ghi dữ liệu riêng** — đây là kết quả tính toán runtime (`deriveShopSessions()`), chạy lại mỗi lần tab "Phiên shop" render:
   - Lọc toàn bộ `CarrierSession` có `status === 'confirmed'`
   - Với mỗi `ItemRecord` thuộc các phiên đó, xác định shop bằng `resolveShopId(item)`: tra `item.orderCode` trong `orders.json` (khớp `trackingCode` hoặc `id`) để lấy `shopId` thật của đơn hàng đại lý; nếu không tìm thấy đơn tương ứng, dùng `item.shopId` (field tĩnh gán sẵn trên dòng đối soát) làm phương án dự phòng
   - Gom `ItemRecord` theo cặp `(sessionId, shopId đã resolve)`
   - Mỗi nhóm tạo 1 `ShopSession` với mã dạng `COD_SHOP_{ngày thanh toán}{số thứ tự 4 chữ số}_{shopId}`
   - Tính: `totalOrders` = số đơn của shop trong phiên; `totalCOD` = tổng `ghnCOD`; `feeShop` = tổng `systemFee` (phí đại lý báo cho shop); `feeGHN` = tổng `ghnFee` (phí GHN thu thật); `profit` = `feeShop − feeGHN`; `totalMismatch` = số đơn có `status !== 'MATCH'`
3. Vì tính runtime từ danh sách phiên GHN đã xác nhận, phiên shop **tự động biến mất** nếu phiên GHN gốc bị xoá (không có bước xoá riêng)
4. Trang chi tiết phiên shop (`AgencyReconciliationShopDetail.tsx`) lọc lại đúng các đơn của shop bằng cùng `resolveShopId(item) === session.shopId` — đảm bảo nhất quán với `deriveShopSessions()`, tránh trường hợp shop đã resolve khác field tĩnh làm rơi đơn khỏi danh sách chi tiết

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Web Shop** — trang "Đối soát" | Sau khi Agency Admin xác nhận phiên GHN, shop thấy ngay phiên đối soát của mình xuất hiện (cùng cơ chế tính runtime), trạng thái "Chờ thanh toán". |

## Acceptance Criteria

**AC1:** Nút "Xác nhận phiên" chỉ hiển thị khi phiên đang trạng thái "Chờ xác nhận"; phiên đã "Đã xác nhận" không còn nút này (và không còn nút "Xoá phiên").

**AC2:** Bấm "Xác nhận phiên" → modal xác nhận hiện đúng mã phiên và cảnh báo về việc tự động tách phiên shop + khoá dữ liệu. Bấm "Huỷ" đóng modal, không đổi trạng thái.

**AC3:** Xác nhận thành công → phiên chuyển "Đã xác nhận" ngay trong danh sách phiên NVC.

**AC4:** Tab "Phiên shop" chỉ có dữ liệu khi có ít nhất 1 phiên GHN "Đã xác nhận"; nếu chưa có, hiển thị trạng thái rỗng "Phiên shop được tạo tự động sau khi xác nhận phiên GHN".

**AC5:** Sau khi xác nhận 1 phiên GHN, tab "Phiên shop" hiển thị đúng 1 phiên shop cho mỗi shop có đơn trong phiên đó — không thiếu, không trùng shop.

**AC6:** Mỗi phiên shop hiển thị đúng: Mã phiên shop, Tên shop, mã Phiên GHN nguồn, khoảng thời gian, Số đơn, Tổng COD, Tổng phí DV (shop), Tổng phí DV (GHN), Lợi nhuận đại lý (`feeShop − feeGHN`, tô xanh nếu dương/đỏ nếu âm), Trạng thái.

**AC7 — GAP, chưa hoạt động:** Trạng thái phiên shop hiện **luôn luôn** là "Chờ xác nhận" — không có hành động "Xác nhận chuyển khoản" nào được nối logic (`confirmedShopIds` không có setter, không có checkbox/thao tác hàng loạt, `AgencyReconciliationShopDetail.tsx` chỉ hiển thị badge trạng thái, không có nút xác nhận). Đây là phần cần làm tiếp — xem Notes.

## Notes

- **GAP quan trọng:** Doc cũ `phien-shop.md` mô tả sẵn 1 luồng "Xác nhận phiên shop" bằng checkbox + thanh bulk action ("Tick checkbox → Thanh bulk action hiện ra → Nhấn Xác nhận phiên đã chọn") — **luồng này chưa tồn tại trong code**. `AgencyReconciliation.tsx` có `const [confirmedShopIds] = useState<Set<string>>(new Set())` — chỉ đọc, không có setter, nên `ShopSession.status` không bao giờ chuyển sang `'confirmed'` được. Cần 1 story riêng để implement đúng: thêm setter, thêm UI xác nhận (từng phiên hoặc hàng loạt) ở cả `TabShop` (danh sách) và `AgencyReconciliationShopDetail.tsx` (chi tiết).
- **Sai lệch khác trong `phien-shop.md`:** doc ghi mã phiên shop dạng `SHOP-{mã GHN}-{mã shop}` (ví dụ `SHOP-GHN003-SHP001`) nhưng code thực tế sinh mã dạng `COD_SHOP_{ngày}{số thứ tự}_{shopId}`. Doc cũng liệt kê cột "Số lệch" trong bảng phiên shop (Agency Admin) nhưng cột này hiện **không** render ở `TabShop` dù `totalMismatch` đã được tính sẵn trong `ShopSession` — cần bổ sung cột hoặc xác nhận với BA đây có phải cố ý ẩn không.
- Câu chuyện này bổ sung phần "chưa viết" mà `AGA-RECON-1` (Tạo phiên đối soát GHN) đã ghi chú: *"Việc tự động sinh 'phiên shop' cho từng shop xảy ra ở bước xác nhận phiên — xem story 'Xác nhận phiên đối soát GHN' (chưa viết)"*.
- **[ĐÃ FIX] Dữ liệu mock khớp `orders.json`:** `carrier-reconciliation-items.json` được viết lại (148 → **32 dòng**, khớp 100% `orderCode`/`trackingCode` với `orders.json`) nên `resolveShopId()` giờ đi qua nhánh match thật, không còn luôn fallback về `shopId` tĩnh. Giữ 3 dòng MISMATCH có chủ đích (1 fee-mismatch, 2 COD-mismatch) để vẫn demo được "Số lệch"/"Đơn lệch" trên UI. `carrier-reconciliation.json` cũng được cập nhật lại `totalOrders`/`totalCOD`/`totalFee`/`totalMismatch`/`totalReconcile`/`netReceived` cho khớp số item mới — không giữ số cũ (100, 62, 38 đơn...) vốn không có item nào chống lưng.
- **[ĐÃ FIX] 3/4 phiên thiếu item:** `247_001`, `247_002`, `247_003` (đều `agencyId: AGN001`, hiện trên trang) giờ đã có `ItemRecord` — tab "Phiên shop" tăng lên **18 phiên shop** (đã xác nhận qua UAT trình duyệt). `GHN005` cũng được thêm item cho đủ, nhưng vẫn không hiện trên trang Agency Admin vì trang lọc cứng `agencyId === 'AGN001'` ([AgencyReconciliation.tsx:1045](../../../src/platforms/agency-admin/pages/AgencyReconciliation.tsx#L1045)) mà `GHN005` có `agencyId: AGN002` — đây là hành vi từ trước, không phải gap mới.
- **Ràng buộc còn tồn đọng (chưa fix, chấp nhận có chủ đích):** chỉ 9/32 đơn trong `orders.json` thực sự thuộc shop của `AGN001` (`SHP001`, `SHP002` theo `shops.json`) — các item còn lại tham chiếu shop thuộc agency khác (`SHP003`–`SHP015`), lặp lại bất nhất agency đã có từ data cũ. Quyết định giữ nguyên để không làm nghèo dữ liệu demo (chỉ còn 2 shop nếu siết đúng agency) — xem lại nếu sau này cần đúng multi-tenant.
