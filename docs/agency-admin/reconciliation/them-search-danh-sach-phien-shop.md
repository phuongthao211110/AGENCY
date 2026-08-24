---
id: AGA-RECON-11
jiraKey: 
platform: agency-admin
section: Đối soát & Chuyển khoản
figma: 
status: draft
---

# [AGENCY] Đối soát - Danh sách phiên shop: Thêm search

## User Story

Là Agency Admin, tôi muốn tìm nhanh 1 phiên shop cụ thể trong danh sách phiên shop (theo mã phiên shop, tên shop, hoặc mã phiên GHN gốc), để không phải cuộn/dò qua toàn bộ danh sách khi cần kiểm tra đối soát của 1 shop cụ thể.

## User Flow

1. Vào "Đối soát NVC" → tab "Phiên shop".
2. Có ô search "Tìm theo mã phiên, tên shop hoặc phiên GHN" cạnh các filter Trạng thái/Shop/Thời gian đã có.
3. Gõ mã phiên shop, tên shop, hoặc mã phiên GHN gốc → danh sách tự lọc ngay.
4. Search kết hợp đúng với các filter khác (Trạng thái, Shop, khoảng thời gian); bấm "Xoá tất cả filter" cũng reset luôn search về rỗng.

## System Flow

1. `AgencyReconciliation.tsx`, `TabShop`: state `search` (string) riêng, độc lập hoàn toàn với search bên `TabCarrier` (xem [AGA-RECON-10](./them-search-danh-sach-chi-tiet-phien-ghn.md)).
2. Filter `filtered` áp dụng đồng thời 4 điều kiện: `matchStatus`, `matchShop`, `matchDate`, `matchSearch` — cả 4 phải TRUE thì phiên mới hiện.
3. `matchSearch` khớp không phân biệt hoa/thường trên 3 field: `s.shopName`, `s.id` (mã phiên shop), `s.nvcSessionCode` (mã phiên GHN mà phiên shop này được tách ra từ đó).
4. `hasActiveFilter` tính luôn cả `!!search` — ô search có nội dung cũng coi là "đang có filter", hiện đúng nút "Xoá tất cả filter".
5. `clearFilters()` reset cả `filterStatus`/`filterShop`/`datePreset`/`dateRange` VÀ `search` về rỗng cùng lúc — không sót lại search cũ sau khi bấm xoá.

## Acceptance Criteria

**AC1:** Tab "Phiên shop" có ô search cạnh các filter Trạng thái/Shop/Thời gian.

**AC2:** Gõ đúng 1 phần mã phiên shop → chỉ còn đúng phiên khớp.

**AC3:** Gõ đúng 1 phần tên shop (không phân biệt hoa/thường) → lọc đúng theo tên shop.

**AC4:** Gõ mã phiên GHN gốc (mã phiên GHN mà phiên shop được tách ra) → lọc đúng phiên shop tương ứng.

**AC5:** Search kết hợp đúng với filter Trạng thái/Shop/Thời gian đang chọn — tất cả điều kiện cùng áp dụng.

**AC6:** Bấm "Xoá tất cả filter" → search cũng bị xoá theo, không chỉ riêng các filter dropdown/khoảng ngày.

## Notes

- Search này ĐỘC LẬP với search ở tab "Phiên NVC" (danh sách phiên GHN, xem [AGA-RECON-10](./them-search-danh-sach-chi-tiet-phien-ghn.md)) — 2 state riêng, phạm vi tìm khác nhau: phiên shop có thêm field tên shop và mã phiên GHN gốc để đối chiếu ngược, phiên GHN không có.
- Trường `nvcSessionCode` cho search theo mã phiên GHN gốc rất hữu ích khi đại lý cần tra "phiên shop này tách ra từ phiên GHN nào" mà chỉ nhớ mã GHN, không nhớ mã phiên shop.
- Không mở rộng search qua các field số (COD, phí...) — chỉ đúng 3 field text đã liệt kê ở placeholder.
