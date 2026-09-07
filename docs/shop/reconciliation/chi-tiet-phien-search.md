---
id: SHOP-RECON-7
jiraKey: 
platform: shop
section: Đối soát
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [WEB SHOP] Đối soát - Chi tiết phiên: Search phiên đối soát

## User Story

Là chủ shop, khi xem chi tiết 1 phiên đối soát có nhiều đơn hàng, tôi muốn tìm nhanh 1 đơn cụ thể theo mã đơn GHN hoặc mã đơn của mình, để không phải cuộn cả bảng để tìm.

## User Flow

1. Trong trang chi tiết phiên (`/shop/reconciliation/:id`), ngay dưới 4 summary card có 1 ô tìm kiếm, phía trên bảng chi tiết đơn.
2. Gõ mã đơn GHN hoặc mã đơn của shop vào ô — bảng lọc realtime, không cần bấm Enter.
3. Xoá hết từ khoá → bảng hiện lại đầy đủ toàn bộ đơn trong phiên.
4. Gõ từ khoá không khớp đơn nào → bảng hiện "Không tìm thấy đơn hàng phù hợp".

## System Flow

1. `ReconciliationDetail.tsx`: state `const [search, setSearch] = useState('')`.
2. `filteredItems = items.filter(it => { const q = search.trim().toLowerCase(); if (!q) return true; return it.orderCode.toLowerCase().includes(q) || (it.customerOrderCode ?? '').toLowerCase().includes(q) })` — so khớp substring, không phân biệt hoa/thường, khớp 1 trong 2 field (`orderCode` HOẶC `customerOrderCode`) là đủ.
3. `items` (nguồn trước khi lọc search) đã được lọc sẵn theo đúng phiên + đúng shop (`getReconciliationItems().filter(it => it.sessionId === session.nvcSessionId && it.shopId === 'SHP001')`, xem SHOP-RECON-3/4) — ô tìm kiếm chỉ lọc thêm trên tập đó, không truy vấn lại toàn bộ dữ liệu.
4. 4 summary card phía trên (Số đơn, Tổng COD, Tổng phí DV, Nhận về) tính từ `items` GỐC (chưa lọc search) — KHÔNG đổi theo kết quả tìm kiếm, giống hệt cách 4 stat card ở trang danh sách không đổi theo search (SHOP-RECON-6).
5. Bảng render `filteredItems.map(...)` thay vì `items.map(...)` trực tiếp.
6. Ô tìm kiếm dùng chung style với ô search ở trang danh sách phiên (SHOP-RECON-6) và trang "Đơn hàng" — không tạo pattern UI mới.

## Acceptance Criteria

**AC1:** Ô tìm kiếm hiện ngay dưới 4 summary card, phía trên bảng chi tiết đơn.

**AC2:** Gõ từ khoá → bảng lọc realtime, không cần bấm Enter.

**AC3:** Tìm kiếm khớp theo Mã đơn GHN (`orderCode`) HOẶC Mã đơn của bạn (`customerOrderCode`), không phân biệt hoa/thường, so khớp substring.

**AC4:** Xoá hết từ khoá → bảng hiện lại đầy đủ toàn bộ đơn trong phiên.

**AC5:** Không có đơn nào khớp từ khoá → hiện "Không tìm thấy đơn hàng phù hợp".

**AC6:** 4 summary card (Số đơn, Tổng COD, Tổng phí DV, Nhận về) không đổi theo kết quả tìm kiếm — luôn tính trên toàn bộ đơn của phiên, không phải danh sách đã lọc.

**AC7:** Ô tìm kiếm chỉ lọc trong phạm vi đơn của đúng phiên đang xem và đúng shop — không tìm lẫn sang đơn của phiên khác.

## Notes

- Tách ra từ SHOP-RECON-4 (story bảng chi tiết đơn hàng) — SHOP-RECON-4 đã cập nhật để trỏ sang story này cho chi tiết phần search, tránh lặp nội dung ở 2 nơi.
- Cùng cơ chế với SHOP-RECON-6 (search ở trang danh sách phiên) — 2 ô tìm kiếm độc lập, lọc 2 tập dữ liệu khác nhau (phiên vs đơn trong phiên), không dùng chung state.
