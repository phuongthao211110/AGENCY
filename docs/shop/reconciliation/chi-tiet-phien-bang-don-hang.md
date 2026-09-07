---
id: SHOP-RECON-4
jiraKey: 
platform: shop
section: Đối soát
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [SHOP] Đối soát: Bảng chi tiết đơn hàng trong phiên

## User Story

Là chủ shop, khi xem chi tiết một phiên đối soát, tôi muốn thấy breakdown từng đơn hàng — COD thu được, từng loại phí bị trừ, và số tiền thực nhận cho mỗi đơn — để đối chiếu với dữ liệu của mình và phát hiện đơn nào bị tính sai.

## User Flow

1. Trong trang chi tiết phiên (SHOP-RECON-3), phía dưới 4 summary card có ô tìm kiếm (chi tiết đầy đủ xem SHOP-RECON-7).
2. Bảng 14 cột hiển thị từng đơn trong phiên, số liệu chi tiết từng cột phụ thuộc trạng thái đơn (thành công / chưa thành công / trung gian).
3. Cuộn ngang khi bảng vượt độ rộng màn hình.

## System Flow

1. Items lọc: `getReconciliationItems().filter(it => it.sessionId === session.nvcSessionId && it.shopId === 'SHP001')` — xem System Flow SHOP-RECON-3.
2. Ô tìm kiếm lọc theo mã đơn GHN / mã đơn của shop — công thức, empty-state, AC đầy đủ xem SHOP-RECON-7.
3. **14 cột bảng** (theo đúng thứ tự):
   - **Mã đơn GHN** (`orderCode`)
   - **Mã đơn của bạn** (`customerOrderCode`)
   - **Trạng thái GHN** — màu theo nhóm: xanh lá = thành công (giao/hoàn thành công), đỏ = thất bại, xám = trung gian/chưa có trong hệ thống, cam = khác
   - **Tiền COD** — hiển thị 2 dòng (`dual`): dòng trên = `item.systemCOD` (số hệ thống tính tiền thật); dòng dưới, chữ nhỏ xám = `item.ghnCOD` tham chiếu; chỉ hiện khi đơn ở trạng thái "kết thúc" (Giao thành công / Hoàn hàng thành công)
   - **Giao TT thu sau** — chỉ áp dụng khi đơn chưa thành công (nhóm trung gian)
   - **Phí giao hàng** (`deliveryFee`) — chỉ áp dụng khi chưa thành công
   - **Phí bảo hiểm** (`insuranceFee`) — chỉ áp dụng khi chưa thành công
   - **Giao trả 1 phần** (`partialDelivery`) — chỉ áp dụng khi đã thành công
   - **Phí giao thất bại** (`failedDelivery`) — chỉ áp dụng khi đã thành công
   - **Phí thu hộ** (`codFee`) — chỉ áp dụng khi đã thành công
   - **Phí kích hoạt giao lại** (`redeliveryFee`) — chỉ áp dụng khi đã thành công
   - **Phí hoàn** (`returnFee`) — chỉ áp dụng khi đã thành công
   - **Phí DV** (`sysFee`) — tổng phí dịch vụ, luôn hiện
   - **Tổng đối soát** (`net`) — net = COD - sysFee (thành công) hoặc 0 - sysFee (chưa thành công); in đậm, luôn hiện
4. **Công thức `sysFee`**:
   - Đơn thành công: `sysFee = partialDelivery + failedDelivery + codFee + redeliveryFee + returnFee`
   - Đơn chưa thành công: `sysFee = deliveryFee + insuranceFee`
5. **Công thức `net`**: `net = (thành công ? item.systemCOD : 0) - sysFee` — `sysFee` ở đây là biến cục bộ tính riêng cho từng dòng bảng (bước 4), khác với `item.systemFee` dùng ở summary card SHOP-RECON-3.
6. **Hiển thị 2 dòng** (`dual` / `feeCell`): ô có 2 dòng — dòng trên in thường (số hệ thống thật dùng tính tiền), dòng dưới chữ nhỏ màu xám (số GHN tham chiếu để đối chiếu). Pattern này giống hệt `AgencyReconciliationShopDetail.tsx`.
7. Ô chỉ áp dụng cho nhóm đơn nhất định (ví dụ: Phí giao hàng chỉ dành cho đơn chưa thành công) hiển thị `—` (gạch ngang) nếu không áp dụng cho đơn đó.

## Acceptance Criteria

**AC1:** Bảng hiển thị đúng 14 cột theo thứ tự đã mô tả — không thêm, không bớt.

**AC2:** Cột "Trạng thái GHN" tô màu đúng theo nhóm: xanh lá (thành công), đỏ (thất bại), xám (trung gian/chưa có), cam (khác).

**AC3:** Cột "Tiền COD" chỉ hiện khi đơn ở trạng thái "kết thúc" (Giao thành công / Hoàn hàng thành công). Đơn trung gian ô này để `—`.

**AC4:** 5 cột phụ phí (Giao trả 1 phần, Phí giao thất bại, Phí thu hộ, Phí kích hoạt giao lại, Phí hoàn) chỉ hiện số khi đơn thành công; chưa thành công để `—`.

**AC5:** 2 cột (Phí giao hàng, Phí bảo hiểm) chỉ hiện số khi đơn chưa thành công; đã thành công để `—`.

**AC6:** Cột "Phí DV" = tổng phí theo đúng công thức tương ứng nhóm đơn (thành công / chưa thành công). Cột "Tổng đối soát" = `net` đúng công thức, in đậm.

**AC7:** Ô có 2 dòng (`dual`): dòng trên = số hệ thống (màu thường), dòng dưới = số GHN tham chiếu (chữ nhỏ, màu xám `#6B7280`).

**AC8:** Bảng cuộn ngang trong container `overflow-x: auto` khi nội dung vượt chiều rộng màn hình — body trang không cuộn ngang.

Phần AC về ô tìm kiếm (lọc realtime, empty-state "Không tìm thấy đơn hàng phù hợp") xem SHOP-RECON-7.

## Notes

- Tách phần search (User Flow, System Flow, AC riêng) sang SHOP-RECON-7 — tránh lặp nội dung ở 2 nơi.
- Công thức `sysFee` và `net` dùng đúng theo Agency Admin (`AgencyReconciliationShopDetail.tsx`) — không tự nghĩ công thức mới.
- Cột "Giao TT thu sau" (dòng trung gian): tên cột đặc thù đối soát GHN — chỉ xuất hiện khi đơn chưa kết thúc, GHN tạm ghi nhận khoản này để đối trừ ở phiên sau.
- `MISMATCH` / `NOT_FOUND` (từ `getReconciliationItems()`) — các đơn này có thể hiện "Tổng đối soát" khác với kỳ vọng của shop; shop thấy tín hiệu qua card "Đơn lệch" ở trang danh sách (SHOP-RECON-1), chi tiết đơn cụ thể xem ở bảng này.
- Hiện chưa có cột hay badge riêng trong bảng để đánh dấu trực tiếp đơn `MISMATCH` / `NOT_FOUND` — phần này là gap tiếp theo nếu muốn shop tự đối chiếu dễ hơn.
