---
id: SHOP-RECON-1
jiraKey: 
platform: shop
section: Đối soát
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [SHOP] Đối soát: Danh sách phiên đối soát

## User Story

Là chủ shop, tôi muốn xem danh sách các phiên đối soát giữa tôi và đại lý (COD chuyển về, phí dịch vụ đã trừ) để theo dõi lịch sử thanh toán và phát hiện sớm các phiên có đơn lệch.

## User Flow

1. Vào menu "Đối soát" → trang `/shop/reconciliation` hiển thị.
2. Phần trên: 4 stat card tổng quan — Tổng phiên, Tổng nhận về, Chờ thanh toán, Đơn lệch.
3. Ô tìm kiếm: nhập mã phiên hoặc mã phiên GHN → bảng lọc realtime (chi tiết đầy đủ xem SHOP-RECON-6).
4. Phần dưới: bảng danh sách phiên, mỗi dòng gồm: Mã phiên, Phiên GHN (mã NVC gốc), Thời gian (khoảng period), Ngày TT, Số đơn, Tổng COD, Tổng phí DV, Nhận về, Trạng thái, nút "Xem".
5. Bấm vào BẤT KỲ đâu trên dòng (không chỉ nút "Xem") → điều hướng sang trang chi tiết phiên (SHOP-RECON-3).

## System Flow

1. `Reconciliation.tsx` gọi `buildShopSessions()` (dòng ~76–117): lọc `carrier-reconciliation.json` lấy các phiên NVC có `status: 'confirmed'` và item có `shopId === 'SHP001'`, gộp theo `sessionId`, tạo danh sách `ShopSession[]` với id dạng `COD_SHOP_{YYYYMMDD}{seq}_{shopId}`.
2. Mỗi `ShopSession` có: `id`, `nvcSessionId`, `nvcSessionCode`, `period`, `paymentDate`, `orderCount`, `totalCOD` (shop), `feeShop` (shop), `netAmount = totalCOD - feeShop`.
3. Items trong session được tính qua `getReconciliationItems()` từ `src/mock-data/reconciliationLedger.ts` — hàm này cộng dồn phí xuyên nhiều phiên GHN (1 đơn có thể xuất hiện ở phiên "trung gian" trừ phí trước, phiên "kết thúc" trả COD sau), trả về `status: MATCH | MISMATCH | NOT_FOUND` cho từng đơn.
4. 4 stat card tính từ `sessions` (KHÔNG bị ảnh hưởng bởi ô tìm kiếm — luôn tính trên toàn bộ danh sách gốc, không phải danh sách đã lọc):
   - **Tổng phiên**: `sessions.length`
   - **Tổng nhận về**: `sum(session.netAmount)` toàn bộ phiên
   - **Chờ thanh toán**: tổng số phiên (hiện tại toàn bộ phiên đều ở trạng thái này — mock data chưa có phiên nào trạng thái khác)
   - **Đơn lệch**: tổng đơn `MISMATCH` hoặc `NOT_FOUND` xuyên tất cả phiên; card này chỉ hiển thị khi giá trị > 0
5. Ô tìm kiếm lọc theo Mã phiên/Phiên GHN — chi tiết công thức, empty-state, AC đầy đủ xem SHOP-RECON-6.
6. Badge trạng thái mỗi dòng hiện hardcode "Chờ thanh toán" (cam) — không đọc field trạng thái thật nào từ dữ liệu.
7. Cột "Nhận về" (`netAmount`) in đậm, màu theo dấu — xanh `#16A34A` khi dương, đỏ `#DC2626` khi âm, xám `C_TEXT_SECONDARY` khi bằng 0 — cùng quy ước với cột "Lợi nhuận ĐL" bên Agency Admin (`AgencyReconciliation.tsx`) và với `ReconciliationDetail.tsx` (SHOP-RECON-3).
8. `TRow` nhận `onView` gắn vào `onClick` của CẢ container dòng (`cursor: 'pointer'`) — không chỉ riêng nút "Xem". Nút "Xem" vẫn giữ `onClick` riêng nhưng gọi `e.stopPropagation()` trước để tránh bắn `onClick` 2 lần (1 từ nút, 1 từ bubble lên dòng cha).
9. `onView` gọi `navigate('reconciliation/:id', { state: { session } })` — truyền toàn bộ object `session` qua `location.state`, không dùng query param hay refetch theo `:id`.

## Acceptance Criteria

**AC1:** Trang danh sách chỉ hiện phiên đối soát của đúng shop đang đăng nhập (`shopId === 'SHP001'`), không lộ phiên của shop khác trong cùng đại lý.

**AC2:** Chỉ hiện phiên NVC có `status: 'confirmed'` — phiên NVC chưa confirmed không xuất hiện trong danh sách.

**AC3:** 4 stat card hiển thị đúng: Tổng phiên, Tổng nhận về (sum `netAmount`), Chờ thanh toán (= tổng số phiên), Đơn lệch (chỉ hiện khi > 0) — tính trên toàn bộ danh sách, không đổi theo kết quả tìm kiếm.

**AC4:** Bảng hiển thị đủ các cột: Mã phiên, Phiên GHN, Thời gian, Ngày TT, Số đơn, Tổng COD, Tổng phí DV, Nhận về, Trạng thái, nút Xem.

**AC5:** Cột "Nhận về" in đậm, đổi màu theo dấu giá trị: `#16A34A` khi dương, `#DC2626` khi âm, `#6B7280` khi bằng 0 — không dùng 1 màu cố định bất kể dấu.

**AC6:** Bấm vào bất kỳ đâu trên 1 dòng (không riêng nút "Xem") → điều hướng đúng sang trang chi tiết của đúng phiên đó, truyền đủ object `session` qua `location.state`.

**AC7:** Card "Đơn lệch" không hiển thị nếu không có đơn nào lệch (giá trị = 0).

**AC8:** Ô tìm kiếm lọc theo Mã phiên hoặc Phiên GHN — chi tiết AC đầy đủ xem SHOP-RECON-6.

## Notes

- `getReconciliationItems()` (reconciliationLedger.ts) thay thế việc đọc thẳng JSON tĩnh — đây là thay đổi quan trọng để khớp cách Agency Admin (`AgencyReconciliationShopDetail.tsx`) tính status MATCH/MISMATCH/NOT_FOUND cho từng đơn. Trước khi sửa, 2 nơi có thể cho kết quả khác nhau cho cùng 1 đơn.
- Trạng thái phiên (badge "Chờ thanh toán") hiện hardcode — chưa có field trạng thái thật trên `ShopSession`. Khi implement thật cần thêm field `paymentStatus` và đọc từ đó thay vì hardcode.
- Web Shop toàn bộ trang này hardcode `shopId = 'SHP001'` — gap: không có khái niệm "shop đang đăng nhập" động.
- Ô tìm kiếm và click-cả-dòng-để-vào-chi-tiết được thêm SAU khi story này viết lần đầu — đã cập nhật lại User Flow/System Flow/AC cho khớp code hiện tại, không phải viết lại từ đầu.
