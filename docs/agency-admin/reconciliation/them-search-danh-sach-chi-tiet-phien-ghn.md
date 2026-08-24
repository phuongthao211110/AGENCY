---
id: AGA-RECON-10
jiraKey: 
platform: agency-admin
section: Đối soát & Chuyển khoản
figma: 
status: draft
---

# [AGENCY] Đối soát: Thêm search cho danh sách và chi tiết phiên GHN

## User Story

Là Agency Admin, tôi muốn tìm nhanh 1 phiên GHN cụ thể (theo mã phiên hoặc tên file) trong danh sách, và tìm nhanh 1 đơn cụ thể (theo mã đơn GHN hoặc mã đơn khách hàng) trong chi tiết phiên, để không phải cuộn/dò qua toàn bộ danh sách dài khi cần kiểm tra 1 phiên hoặc 1 đơn cụ thể.

## User Flow

1. Vào "Đối soát NVC" → tab "Phiên NVC" (danh sách phiên GHN) → có ô search "Tìm theo mã phiên GHN hoặc tên file" cạnh 2 filter NVC/Trạng thái.
2. Gõ mã phiên (VD "COD_2024031") hoặc 1 phần tên file → danh sách tự lọc ngay, không cần bấm nút tìm.
3. Mở chi tiết 1 phiên GHN → có ô search "Tìm theo mã đơn GHN hoặc mã đơn KH" cạnh filter "Trạng thái".
4. Gõ mã đơn GHN hoặc mã đơn khách hàng → danh sách đơn trong phiên tự lọc ngay.

## System Flow

1. Danh sách (`AgencyReconciliation.tsx`, `TabCarrier`): state `search` (string) + filter chain — lọc theo `filterStatus` trước, sau đó lọc tiếp theo search, match không phân biệt hoa/thường trên `s.ghnSessionCode` HOẶC `s.fileName`.
2. Chi tiết (`AgencyReconciliationDetail.tsx`): state `search` riêng + filter trên `i.orderCode` HOẶC `i.customerOrderCode` (dùng `?? ''` vì `customerOrderCode` có thể rỗng ở 1 số đơn) — cũng không phân biệt hoa/thường.
3. Cả 2 nơi dùng chung UI pattern: icon `SearchOutlined` + input trong khung viền, đặt cạnh các filter dropdown có sẵn (không phải khu vực riêng).
4. Search hoạt động cộng dồn với filter khác đã có (VD filter Trạng thái ở cả 2 màn) — không thay thế, không loại trừ lẫn nhau.

## Acceptance Criteria

**AC1:** Danh sách phiên GHN có ô search, gõ đúng 1 phần mã phiên GHN → chỉ còn đúng phiên khớp trong danh sách.

**AC2:** Gõ đúng 1 phần tên file (không phân biệt hoa/thường) → lọc đúng theo tên file, không cần gõ chính xác toàn bộ tên.

**AC3:** Chi tiết phiên GHN có ô search riêng, gõ mã đơn GHN → chỉ còn đúng đơn khớp trong bảng.

**AC4:** Gõ mã đơn khách hàng (`customerOrderCode`) → lọc đúng, cả với đơn không có `customerOrderCode` (không lỗi, không hiện nhầm).

**AC5:** Search kết hợp đúng với filter Trạng thái đã có ở cả 2 màn — cả 2 điều kiện cùng áp dụng, không cái nào ghi đè cái kia.

**AC6:** Xoá hết nội dung search → danh sách trả về đầy đủ theo đúng filter khác đang chọn (không bị kẹt ở trạng thái rỗng).

## Notes

- 2 ô search độc lập hoàn toàn (state riêng, không share) — vì phạm vi tìm kiếm khác nhau: phiên GHN ở cấp danh sách, đơn hàng ở cấp chi tiết 1 phiên.
- Không tìm theo các field khác (VD tên shop, số tiền) — chỉ đúng 2 field đã liệt kê ở placeholder, tránh gây hiểu nhầm phạm vi tìm kiếm rộng hơn thực tế.
- Đã verify lại bằng Playwright sau khi được hỏi lại giữa phiên làm việc — xác nhận cả 2 ô search vẫn hoạt động đúng như thiết kế, không bị mất/revert.
