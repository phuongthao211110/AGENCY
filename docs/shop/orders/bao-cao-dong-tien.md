---
id: SHOP-ORDER-55
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Báo cáo dòng tiền: Trang & bảng phí dịch vụ đã/chưa thanh toán

## Bối cảnh

Story này là PHẦN LÕI của trang "Báo cáo dòng tiền" (route, nhãn, bảng chính, dòng Tổng, export excel). Bản đầu của story này gộp chung CẢ phần badge cảnh báo trên bảng, 2 modal breakdown (Phí dịch vụ/Đã thanh toán), và nút "Thanh toán cho đại lý" — nay tách thành các story nhỏ hơn để dễ review/ước lượng riêng:

- [SHOP-ORDER-57](./bao-cao-dong-tien-badge-canh-bao.md) — badge cảnh báo phát sinh thêm/cần hoàn ngay dưới mã vận đơn.
- [SHOP-ORDER-58](./bao-cao-dong-tien-breakdown-phi-dich-vu.md) — modal breakdown "Phí dịch vụ" (click vào số).
- [SHOP-ORDER-59](./bao-cao-dong-tien-breakdown-da-thanh-toan.md) — modal breakdown "Đã thanh toán" (kênh thanh toán).
- [SHOP-ORDER-60](./bao-cao-dong-tien-thanh-toan-cho-dai-ly.md) — nút "Thanh toán cho đại lý" + modal khai nộp tiền mặt + lịch sử thanh toán.

4 story trên đều PHỤ THUỘC vào story này (route, bảng, công thức `effectiveFee()`/`rowAmounts()`) — làm xong story này trước mới có chỗ gắn badge/modal/nút vào.

## User Story

Là chủ shop, tôi muốn có 1 trang riêng dạng bảng đối soát (giống bảng "Phí dịch vụ" thật của GHN) để xem rõ tổng phí ship đã thanh toán và còn nợ bao nhiêu, cùng chi tiết từng đơn, thay vì phải tự cộng tay hay lướt từng dòng trong danh sách đơn.

## User Flow

1. Vào menu "Báo cáo dòng tiền" trong sidebar Web Shop (icon 💲, giữa "Đơn hàng" và "Đối soát") → route `/shop/cash-flow`.
2. Đầu trang hiện nhãn **"Phí dịch vụ"** (gạch chân cam) — trang chỉ tập trung vào phí ship, không có tab "Tiền thu hộ" nào (COD đã có trang "Đối soát" riêng, không lặp lại ở đây).
3. Góc phải: ghi chú ngắn + nút **"Tải file excel"** (tải thật 1 file `.xlsx` chứa đúng dữ liệu đang hiển thị) + nút **"Thanh toán cho đại lý (Xđ)"** (xem [SHOP-ORDER-60](./bao-cao-dong-tien-thanh-toan-cho-dai-ly.md) cho hành vi đầy đủ của nút này).
4. Bảng: dòng đầu tiên luôn là **"Tổng"** (nền cam nhạt), cộng dồn 3 cột tiền của TOÀN BỘ đơn.
5. Các dòng sau, mỗi dòng 1 đơn: **STT**, **Mã đơn** (gạch chân xanh — có thể kèm badge cảnh báo ngay dưới, xem SHOP-ORDER-57), **Ngày thanh toán** (giờ + ngày), **Người nhận** (tên + SĐT che bớt "xxxx 1234" + tỉnh/thành), **Trạng thái** (tên kênh: MoMo/Chuyển khoản/Tiền mặt), **Phí dịch vụ** (số ÂM — toàn bộ phí ship hiệu lực của đơn, có thể bấm vào xem breakdown, xem SHOP-ORDER-58), **Đã thanh toán** (số DƯƠNG nếu đại lý đã xác nhận, 0 nếu chưa, có thể bấm vào xem breakdown kênh, xem SHOP-ORDER-59), **Chưa thanh toán** (số ÂM nếu Shop còn nợ thêm, số DƯƠNG nếu đại lý cần hoàn, 0 nếu đã xong).
6. Chỉ hiện đơn Shop TỰ TRẢ SHIP (tiền mặt/MoMo/chuyển khoản) của shop đang đăng nhập — đơn Khách trả ship (COD) không xuất hiện.

## System Flow

1. `src/platforms/shop/pages/CashFlowReport.tsx`, route `cash-flow` trong `App.tsx`, nav item trong `ShopLayout.tsx`.
2. `relevantOrders = loadOrders().filter(o => o.shopId === 'SHP001' && !!o.paymentApprovalStatus).sort(...)` — sắp xếp theo `paymentPaidAt` giảm dần, KHÔNG nhóm theo ngày (bảng phẳng, khớp đúng dạng bảng đối soát thật).
3. `effectiveFee(order)` (hàm DÙNG CHUNG công thức với Agency Admin `CashRemittance.tsx`): trả `0` nếu `order.status === 'cancelled' && !order.cancelRefundConfirmedAt` (đơn huỷ chưa hoàn — không còn nghĩa vụ phí ship nào), ngược lại trả đúng `order.fee`. `rowAmounts(order)`: `fee = effectiveFee(order)`, `phiDichVu = -fee || 0` (`|| 0` chuẩn hoá `-0` thành `0`). Nếu chưa `confirmed`: `daThanhToan = 0`, `chuaThanhToan = -fee || 0`. Nếu đã `confirmed`: `daThanhToan = order.paymentApprovedAmount ?? fee` (snapshot `fee` NGAY TẠI THỜI ĐIỂM đại lý duyệt — xem SHOP-ORDER-56), `chuaThanhToan = -(fee - daThanhToan) || 0` — tách riêng phần ĐÃ DUYỆT khỏi phần phí/nghĩa vụ thay đổi SAU KHI duyệt (phí hoàn hàng/đổi địa chỉ TĂNG, phúc tra GIẢM, HOẶC đơn bị HUỶ — fee hiệu lực về 0) để không ngộ nhận gộp cả vào "Đã thanh toán" chỉ vì đơn đang ở trạng thái confirmed. Đơn chưa từng phát sinh/thay đổi gì sau duyệt (đa số) có `paymentApprovedAmount === fee` → hành vi giống hệt bản nhị phân cũ. Đây là NỀN TẢNG mà cả badge (SHOP-ORDER-57) lẫn 2 modal breakdown (SHOP-ORDER-58/59) đều dựa vào.
4. Dòng "Tổng" = `reduce` cộng dồn 3 giá trị trên qua TOÀN BỘ `relevantOrders` (không phụ thuộc trang/phân trang).
5. `handleExport()`: dùng thư viện `xlsx` (đã có sẵn trong project, xem `Shops.tsx`/`AgencyOrders.tsx`), build `headers` + `rows` từ đúng dữ liệu đang hiển thị, `XLSX.writeFile(...)` tải file `phi-dich-vu-{ngày}.xlsx` — XUẤT FILE THẬT, không phải nút giả.
6. `maskedReceiver(order)`: che SĐT chỉ còn 4 số cuối (`slice(-4)`), lấy phần cuối cùng của `receiverAddress` (sau dấu phẩy cuối) làm "tỉnh/thành" hiển thị.
7. Không có tab "Tiền thu hộ" nào trong trang này (đã bỏ theo yêu cầu) — COD xem ở trang "Đối soát" (`/shop/reconciliation`) riêng.

## Acceptance Criteria

**AC1:** Sidebar Web Shop có mục "Báo cáo dòng tiền", route `/shop/cash-flow` mở đúng trang, không lỗi console.

**AC2:** Trang chỉ hiện nhãn "Phí dịch vụ" (gạch chân cam) — KHÔNG có tab "Tiền thu hộ" nào.

**AC3:** Dòng "Tổng" hiện đúng tổng 3 cột tiền của toàn bộ đơn khớp bộ lọc shop; luôn thoả `|Phí dịch vụ| = Đã thanh toán + |Chưa thanh toán|`.

**AC4:** Đơn `paymentApprovalStatus === 'confirmed'` → "Đã thanh toán" > 0 (= `order.paymentApprovedAmount`, mặc định bằng `order.fee` nếu chưa từng phát sinh phí sau khi duyệt), "Chưa thanh toán" = 0 — TRỪ KHI đơn có chênh lệch phát sinh sau duyệt (xem [SHOP-ORDER-57](./bao-cao-dong-tien-badge-canh-bao.md) cho đầy đủ 2 chiều phát sinh/hoàn).

**AC5:** Đơn `paymentApprovalStatus !== 'confirmed'` (pending_review/rejected) → "Đã thanh toán" = 0, "Chưa thanh toán" < 0 (= `-order.fee`).

**AC6:** Cột "Người nhận" hiện SĐT che bớt dạng "xxxx 1234" (chỉ 4 số cuối) + tỉnh/thành — KHÔNG hiện SĐT đầy đủ.

**AC7:** Bấm "Tải file excel" → tải thật 1 file `.xlsx` đúng dữ liệu đang hiển thị (STT/Mã đơn/Ngày/Người nhận/Trạng thái/3 cột tiền), không lỗi JS.

**AC8:** Đơn Khách trả ship (COD) không xuất hiện trong bảng.

## Notes

- Đây là BẢN LÀM LẠI (v2) sau khi đối chiếu với 1 ảnh UI thật của GHN (bảng "Phí dịch vụ" trong trang đối soát) — bản v1 trước đó (chip tổng + 4 tab lọc + badge theo đơn, nhóm theo ngày) đã bị thay thế hoàn toàn vì không khớp cách trình bày thật.
- Tab "Tiền thu hộ" (có ở bản tham khảo ban đầu) đã bị BỎ theo yêu cầu — trang này giờ CHỈ còn "Phí dịch vụ", không có cơ chế điều hướng/tab nào khác.
- Quy ước dấu (Phí dịch vụ âm, Đã thanh toán dương, Chưa thanh toán âm/dương) và dòng "Tổng" ở đầu bảng là MÔ PHỎNG đúng theo ảnh tham khảo thật — không phải quy ước tự nghĩ ra.
- Cột "Trạng thái" trong ảnh gốc là LÝ DO NGOẠI LỆ GIAO HÀNG (hàng ngoại lệ/chuyển hoàn/hư hỏng) của 1 loại phí phát sinh khác hẳn — ở đây CỐ TÌNH đổi nghĩa thành KÊNH THANH TOÁN (MoMo/CK/Tiền mặt) để khớp với mô hình dữ liệu `paymentApprovalStatus` đang có, KHÔNG xây dựng tính năng "phí phát sinh ngoại lệ" mới (ngoài phạm vi).
- Trang này THAY THẾ vai trò hiển thị trạng thái thanh toán trước đây nằm ở cột "Phí ship" trong danh sách Đơn hàng — xem SHOP-ORDER-44 (đã bỏ badge khỏi danh sách đơn).
- **PROTOTYPE THUẦN** cho phần số liệu (đọc trực tiếp `orderStore.ts`) nhưng nút "Tải file excel" xuất file THẬT (dùng thư viện `xlsx`, không phải mock).
- Xem SHOP-ORDER-43 (vì sao MoMo/CK gần như luôn "Đã thanh toán" ngay), SHOP-ORDER-45 (Chi tiết đơn vẫn còn dòng "Trạng thái {kênh}" riêng, không bị ảnh hưởng).
- **Tách story (meta)**: `effectiveFee()`/`rowAmounts()` ở đây là 1 ĐIỂM DUY NHẤT mà SHOP-ORDER-57/58/59/60 đều phụ thuộc vào — sửa công thức ở story này (nếu cần) sẽ ảnh hưởng tới cả 4 story kia, cần test lại toàn bộ khi đổi.
- Xem AGA-PAYMENT-1/6 (Agency Admin) — bảng tương đương bên phía đại lý, dùng chung công thức `effectiveFee()`/`rowAmounts()`.
