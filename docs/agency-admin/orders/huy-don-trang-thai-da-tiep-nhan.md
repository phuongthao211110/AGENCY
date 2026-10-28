---
id: AGA-ORDER-23
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng: Thêm huỷ đơn ở trạng thái "Chờ bàn giao" (danh sách + chi tiết đơn hàng)

## User Story

Là Agency Admin, tôi muốn huỷ được đơn (Hàng hoá GHN LẪN Thư 247Express) đang ở "Chờ bàn giao" — đã có mã vận đơn/carrier nhưng nhà vận chuyển CHƯA thực sự đến lấy hàng — để có thể chủ động dừng đơn khi shop đổi ý hoặc nhập sai, thay vì phải chờ đơn tự trôi qua các bước tiếp theo mới có cách xử lý.

## User Flow

1. Đơn đang ở tab "Chờ bàn giao" (`status: 'pickup'`) — áp dụng cho CẢ đơn Hàng hoá (GHN, dispatch ngay lúc tạo) lẫn đơn Thư đã được đại lý gửi qua 247Express (chọn hub, xác nhận gửi) — NVC đã nhận đơn vào hệ thống/đã có mã vận đơn nhưng chưa đến lấy hàng thật.
2. Ở danh sách đơn hàng, dòng đơn này có thêm nút "Huỷ đơn" (trước đây không có — trước khi mở rộng, chỉ đơn chưa dispatch mới được huỷ).
3. Chọn nhiều đơn cùng đang "Chờ bàn giao" → thanh bulk-action ở đáy màn hình cũng hiện nút "Huỷ đơn" cho các đơn hợp lệ trong lựa chọn.
4. Mở chi tiết 1 đơn đang "Chờ bàn giao" → nút "Huỷ đơn" xuất hiện cạnh "Cập nhật", giống hệt cách hiện có ở đơn "Đơn nháp"/"Chờ xử lý".
5. Bấm "Huỷ đơn" → xác nhận → đơn chuyển sang "Đơn huỷ", dùng đúng cơ chế huỷ đã có.

## System Flow

1. `isCancellable(o)` (dùng chung cho cả danh sách, bulk-bar, và chi tiết — 1 nguồn duy nhất, cả 2 platform Agency Admin VÀ Web Shop) mở rộng từ `o.status === 'pending'` thành `o.status === 'pending' || o.status === 'pickup'` — KHÔNG kèm điều kiện `sendKind`/`carrierCode` nào cả, áp dụng ĐỒNG LOẠT cho mọi loại đơn ở `pickup` (xem Notes — khác với phạm vi dự tính ban đầu của story này).
2. Cơ chế huỷ dùng lại nguyên `cancelOrder()` đã có (chỉ set `status: 'cancelled'`) — không cần thêm logic gọi API/thông báo carrier nào khác cho prototype này.
3. Vì `isCancellable` là 1 hàm dùng chung cho cả 3 nơi (row quick-action, bulk-bar `eligibleCancel`, nút trong chi tiết `OrderDetailDrawer`), chỉ cần sửa đúng 1 chỗ là cả "danh sách" và "chi tiết đơn hàng" đều tự động có nút Huỷ đơn ở trạng thái mới này — đúng yêu cầu "danh sách + chi tiết" trong tiêu đề.

## Acceptance Criteria

**AC1:** Đơn đang ở trạng thái "Chờ bàn giao" (`status: 'pickup'`) — Hàng hoá GHN LẪN Thư 247Express — đều có nút "Huỷ đơn" ở dòng trong danh sách.

**AC2:** Cùng đơn đó, mở chi tiết → có nút "Huỷ đơn" cạnh "Cập nhật", giống hệt UI đã có ở "Đơn nháp"/"Chờ xử lý".

**AC3:** Chọn nhiều đơn đang "Chờ bàn giao" (bất kỳ loại nào) → thanh bulk-action hiện nút "Huỷ đơn" cho các đơn hợp lệ.

**AC4:** Đơn đã qua khỏi "Chờ bàn giao" (`in_transit` trở đi: đang giao/đã hoàn tất/đang hoàn hàng/đã huỷ...) → không còn nút "Huỷ đơn" (giữ nguyên giới hạn cũ, chỉ mở rộng thêm đúng 1 trạng thái `pickup`).

**AC5:** Bấm "Huỷ đơn" và xác nhận → đơn chuyển đúng sang "Đơn huỷ", không lỗi.

## Notes

- **THAY ĐỔI PHẠM VI so với bản spec gốc (quan trọng)**: bản đầu của story này (tiêu đề "[AGENCY][247]") chỉ dự tính mở rộng cho ĐÚNG đơn Thư/247Express ở "Chờ bàn giao" (`sendKind === 'letter' && carrierCode === '247EXPRESS'`), và AC4 bản gốc còn ghi rõ "Đơn Hàng hoá (GHN) ở Chờ bàn giao → KHÔNG có nút Huỷ đơn". Khi hỏi lại trực tiếp, xác nhận nhu cầu thực tế là NGƯỢC LẠI — cần huỷ được đúng đơn HÀNG HOÁ (GHN) ở "Chờ bàn giao", không giới hạn riêng 247Express. Do `isCancellable()` là hàm chung không có chỗ phân biệt carrier một cách rẻ tiền, quyết định cuối cùng là mở rộng KHÔNG điều kiện cho mọi loại đơn ở `pickup` — vừa đáp ứng đúng nhu cầu Hàng hoá, vừa tiện thể đáp ứng luôn nhu cầu Thư/247Express mà bản spec gốc hướng tới. AC4 bản gốc (chặn GHN) vì vậy bị ĐẢO NGƯỢC hoàn toàn trong bản này.
- "Chờ bàn giao" tương ứng với trạng thái "đã tiếp nhận"/`DATIEPNHAN` của 247Express (NVC đã nhận đơn vào hệ thống nhưng CHƯA đến lấy hàng) đối với đơn Thư, và đơn giản là "đã có mã vận đơn, đang chờ NVC đến lấy" đối với đơn Hàng hoá GHN (dispatch ngay lúc tạo, xem `CreateOrderDrawer`) — 2 ý nghĩa nghiệp vụ khác nhau nhưng CÙNG 1 giá trị `status: 'pickup'`, nên dùng chung 1 điều kiện `isCancellable` là đủ, không cần tách riêng.
- Vì `isCancellable()` được dùng chung cho danh sách (row + bulk) và chi tiết, Ở CẢ 2 PLATFORM (Agency Admin `AgencyOrders.tsx` và Web Shop `Orders.tsx` — mỗi platform có 1 bản hàm riêng nhưng cùng công thức), sửa đúng 1 chỗ mỗi platform là đủ cho toàn bộ story.
- Xem [AGA-ORDER-25](./danh-sach-tab-don-nhap.md) (tab "Đơn nháp" — cũng trích dẫn `isCancellable()`, đã cập nhật khớp theo thay đổi này); phía Web Shop xem [SHOP-ORDER-21](../../shop/orders/confirm-huy-don.md) và [SHOP-ORDER-7](../../shop/orders/chi-tiet-huy-cap-nhat-don-hang.md).
