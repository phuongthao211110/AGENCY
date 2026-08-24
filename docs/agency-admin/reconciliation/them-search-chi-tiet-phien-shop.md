---
id: AGA-RECON-12
jiraKey: 
platform: agency-admin
section: Đối soát & Chuyển khoản
figma: 
status: draft
---

# [AGENCY] Đối soát - Chi tiết phiên shop: Thêm search

## User Story

Là Agency Admin, tôi muốn tìm nhanh 1 đơn cụ thể (theo mã đơn GHN hoặc mã đơn khách hàng) khi xem chi tiết 1 phiên shop, để không phải cuộn qua toàn bộ danh sách đơn trong phiên khi cần kiểm tra 1 đơn cụ thể.

## User Flow

1. Từ tab "Phiên shop" → mở chi tiết 1 phiên shop.
2. Ngay trên bảng danh sách đơn trong phiên, có ô search "Tìm theo mã đơn GHN hoặc mã đơn KH".
3. Gõ mã đơn GHN hoặc mã đơn khách hàng → bảng tự lọc ngay, chỉ còn đơn khớp.

## System Flow

1. `AgencyReconciliationShopDetail.tsx`: thêm state `search` (string) — trước đây file này KHÔNG có bất kỳ state hay filter UI nào, `items` (đơn trong phiên, lọc theo `sessionId` + `resolveShopId(it) === session.shopId`) được render trực tiếp không qua bước lọc thêm nào.
2. Thêm `filteredItems = items.filter(...)` — match không phân biệt hoa/thường trên `i.orderCode` HOẶC `i.customerOrderCode` (dùng `?? ''` an toàn cho đơn không có `customerOrderCode`), cùng logic match với chi tiết phiên GHN ([AGA-RECON-10](./them-search-danh-sach-chi-tiet-phien-ghn.md)); bảng render đổi từ `items` sang `filteredItems`.
3. Thêm cả khối "Filter bar" (trước đây không tồn tại) — chỉ 1 ô search duy nhất, không có filter dropdown nào khác đi kèm (khác chi tiết phiên GHN có thêm filter Trạng thái).
4. Import mới `SearchOutlined` (file trước đó chỉ có `ArrowLeftOutlined`).

## Acceptance Criteria

**AC1:** Mở chi tiết 1 phiên shop → có ô search "Tìm theo mã đơn GHN hoặc mã đơn KH" ngay trên bảng danh sách đơn.

**AC2:** Gõ mã đơn GHN → chỉ còn đúng đơn khớp trong bảng.

**AC3:** Gõ mã đơn khách hàng (`customerOrderCode`) → lọc đúng, kể cả với đơn không có `customerOrderCode` (không lỗi, không hiện nhầm).

**AC4:** Xoá hết nội dung search → bảng trả về đầy đủ toàn bộ đơn trong phiên (không có filter khác che thêm).

**AC5:** Các số liệu tổng (Tổng COD, Tổng phí DV shop/GHN, Lợi nhuận ĐL, Nhận về) ở phần trên KHÔNG bị ảnh hưởng bởi search — vẫn tính trên toàn bộ `items` gốc của phiên, chỉ bảng danh sách đơn bên dưới bị lọc.

## Notes

- Đây là lần ĐẦU TIÊN trang này có filter/search UI — trước đó `items` hiện trực tiếp không qua bước lọc nào, không có state nào ngoài dữ liệu tính sẵn từ `location.state`.
- Cùng logic match với chi tiết phiên GHN ([AGA-RECON-10](./them-search-danh-sach-chi-tiet-phien-ghn.md)) — dùng lại đúng 2 field `orderCode`/`customerOrderCode`, chỉ khác là KHÔNG có filter Trạng thái đi kèm (trang này chưa có khái niệm trạng thái đơn riêng theo dòng, chỉ có tổng số liệu ở cấp phiên).
- Cố ý KHÔNG cho search ảnh hưởng tới các số liệu tổng ở đầu trang — search chỉ là công cụ tìm/xem, không phải bộ lọc dữ liệu tính toán.
