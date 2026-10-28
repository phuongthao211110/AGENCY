---
id: SHOP-ORDER-60
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Báo cáo dòng tiền: Nút "Thanh toán cho đại lý" (khai đã chuyển tiền mặt)

## Bối cảnh

Tách từ [SHOP-ORDER-55](./bao-cao-dong-tien.md) (bảng chính "Phí dịch vụ") — phần nút "Thanh toán cho đại lý" + modal "Thanh toán hạn mức đã dùng" (cột khai nộp), nơi Shop TỰ KHAI đã chuyển tiền mặt phí ship cho đại lý (ngoài hệ thống) để đại lý tiện đối chiếu và duyệt lại các đơn đang `rejected`. Cột "Lịch sử thanh toán" (bên phải modal) được tách riêng — xem [SHOP-ORDER-61](./bao-cao-dong-tien-lich-su-thanh-toan.md).

## User Story

Là chủ shop, sau khi đã chuyển tiền mặt phí ship cho đại lý ngoài hệ thống, tôi muốn khai lại trong hệ thống, để đại lý tiện đối chiếu và để các đơn từng bị từ chối có cơ hội được duyệt lại thay vì kẹt vĩnh viễn.

## User Flow

1. Góc phải trang: nút **"Thanh toán cho đại lý (Xđ)"** (nền xanh navy) — X là tổng phí ship các đơn TIỀN MẶT đang `pending_review` HOẶC `rejected` ("Nợ tồn") của shop này, CHƯA từng khai. Không có đơn nào cần chuyển → nút disabled, label "Không có đơn cần chuyển".
2. Bấm nút → mở **modal "Thanh toán hạn mức đã dùng"**, cột TRÁI (cột phải "Lịch sử thanh toán" xem SHOP-ORDER-61): chip trạng thái "⏱ Chưa thanh toán" (xám); dòng "Phí giao hàng (Đơn hàng đã bàn giao/ Hoàn tất) [Tải danh sách đơn]" (link cam, xuất file riêng danh sách đơn cần trả) = tổng đơn `pending_review`; dòng "Nợ tồn" = tổng đơn `rejected`; "Tổng tiền cần thanh toán" (cam, đậm, to) = 2 dòng trên cộng lại; ghi chú nhắc đọc kỹ; checkbox "Tôi đã đọc, hiểu và chấp nhận điều khoản thanh toán của GHN" (BẮT BUỘC tick mới bấm được nút); nút **"Xác nhận thanh toán"** (cam, disabled nếu chưa tick hoặc tổng = 0).
3. Bấm "Xác nhận thanh toán" → gọi `declareCashRemittance()`, hiện banner xanh "✓ Đã gửi yêu cầu thanh toán Xđ cho đại lý — mã ..." ngay trong modal; đơn đang `rejected` ("Nợ tồn") được ĐƯA VỀ `pending_review` để Agency duyệt lại được (không kẹt mãi).
4. Đóng rồi mở lại modal (hoặc nhìn nút ngoài trang): các đơn vừa khai KHÔNG được tính lại vào khoản cần thanh toán nữa — không khai trùng được cùng 1 lô đơn.
5. Nếu Agency sau đó từ chối lại 1 đơn đã từng khai → đơn quay về "chưa khai", xuất hiện LẠI trong "Nợ tồn" ở lần mở modal tiếp theo để Shop khai lại.
6. Agency Admin (trang "Duyệt thanh toán") KHÔNG hiện thêm bất kỳ gợi ý nào về việc Shop đã khai hay chưa — Agency tự dựa vào số ngày trễ rồi tự đối chiếu sổ quỹ thật trước khi duyệt, không dựa vào lời khai này để tin.

## System Flow

1. `declareCashRemittance(shopId, declaredBy)` (`orderStore.ts`): trả về 1 `CashRemittanceBatch` (hoặc `null` nếu không có gì để khai) — đánh dấu `cashRemittanceDeclaredAt` (ISO timestamp) trên MỌI đơn `paymentMethod === 'cash'` đang `pending_review` HOẶC `rejected` của shop đó; đơn `rejected` được ĐỔI NGƯỢC về `pending_review` (xoá `paymentApprovalRejectedReason`) vì `approveOrderPayment()` chỉ nhận đơn `pending_review` — nếu không reset, đơn `rejected` sẽ kẹt vĩnh viễn không bao giờ duyệt lại được; ghi 1 dòng "Báo đã chuyển tiền mặt cho đại lý" vào Lịch sử thao tác của TỪNG đơn liên quan.
2. `CashRemittanceBatch` (`orderStore.ts`, kiểu dữ liệu riêng): `{ id, shopId, declaredAt, declaredBy, totalAmount, orderIds }` — `id` sinh kiểu `YYMMDD + 5 ký tự ngẫu nhiên` (`generateRemittanceCode()`), lưu vào `localStorage` key `ghn_cash_remittance_batches_v1` qua `saveRemittanceBatch()`. Đây là bản ghi mà [SHOP-ORDER-61](./bao-cao-dong-tien-lich-su-thanh-toan.md) đọc lại để liệt kê lịch sử.
3. `RemittanceModal` (`CashFlowReport.tsx`): tự tính `phiGiaoHang`/`noTon`/`tongTien` từ dữ liệu LIVE (không nhận props số liệu) để luôn khớp đúng lúc mở modal; `handleConfirm()` gọi `declareCashRemittance()`, lưu kết quả vào state `justDeclared` để hiện banner xanh NGAY TRONG modal (không cần đóng/mở lại).
4. `unpaidOrders`/`overdueOrders` (và `unremittedCashOrders` ở component cha) đều lọc thêm `&& !o.cashRemittanceDeclaredAt` — đơn đã khai rồi (đang chờ Agency đối chiếu) KHÔNG được tính lại vào khoản cần thanh toán, tránh khai trùng lặp vô hạn lần.
5. `rejectOrderPayment()` (Agency Admin) XOÁ `cashRemittanceDeclaredAt` khi từ chối 1 đơn đã từng được khai — nếu không xoá, đơn bị từ chối sau khi đã khai 1 lần sẽ bị loại vĩnh viễn khỏi "cần thanh toán" dù Agency chưa thực sự nhận tiền.
6. Bên Agency Admin (`CashRemittance.tsx`): `StatusCell` KHÔNG hiện bất kỳ dòng "Shop báo đã chuyển..." nào dù `order.cashRemittanceDeclaredAt` có giá trị hay không — Agency không dựa vào lời khai này để tin, chỉ dựa vào số ngày trễ (hệ thống tự track) rồi tự đối chiếu sổ quỹ thật trước khi duyệt (xem AGA-PAYMENT-1 Notes).

## Acceptance Criteria

**AC1:** Nút "Thanh toán cho đại lý" hiện đúng tổng phí ship các đơn TIỀN MẶT `pending_review` HOẶC `rejected` (CHƯA có `cashRemittanceDeclaredAt`) của shop; disabled "Không có đơn cần chuyển" khi không còn đơn nào thoả điều kiện đó.

**AC2:** Modal "Thanh toán hạn mức đã dùng" (cột trái) hiện đúng "Phí giao hàng" (= tổng đơn `pending_review` chưa khai), "Nợ tồn" (= tổng đơn `rejected` chưa khai), "Tổng tiền cần thanh toán" = 2 dòng cộng lại; nút "Xác nhận thanh toán" disabled khi chưa tick checkbox HOẶC tổng = 0.

**AC3:** Sau khi bấm "Xác nhận thanh toán": banner xanh hiện NGAY trong modal (không cần đóng/mở lại); đơn `rejected` trong lô vừa khai được ĐƯA VỀ `pending_review` (xoá lý do từ chối) để Agency duyệt lại được.

**AC4:** Đóng rồi mở lại modal (hoặc nhìn nút ngoài trang) SAU KHI đã khai: các đơn vừa khai KHÔNG được tính lại vào "Phí giao hàng"/"Nợ tồn"/tổng tiền cần thanh toán nữa (dù vẫn đang `pending_review`, chưa được Agency duyệt) — Shop KHÔNG bấm "Xác nhận thanh toán" lặp lại được cho cùng 1 lô đơn.

**AC5:** Sau khi Shop khai, Agency Admin (`/agency-admin/cash-remittance`) KHÔNG hiện thêm bất kỳ dòng "Shop báo đã chuyển..." nào — badge trạng thái (Chờ duyệt/⚠ Trễ N ngày) giữ nguyên như khi chưa khai, Agency vẫn phải tự đối chiếu sổ quỹ rồi bấm "Duyệt shop này" mới chuyển "✓ Đã nhận tiền".

**AC6:** Nếu Agency từ chối (`rejectOrderPayment`) 1 đơn đã từng được Shop khai trước đó → đơn quay về trạng thái "chưa khai" (`cashRemittanceDeclaredAt` bị xoá), xuất hiện LẠI trong "Nợ tồn" ở lần mở modal tiếp theo để Shop khai lại — không bị loại vĩnh viễn.

## Notes

- **Bug đã phát hiện qua UAT và sửa (v3 — modal "Thanh toán hạn mức đã dùng")**: bản đầu của `unpaidOrders`/`overdueOrders`/`unremittedCashOrders` chỉ lọc theo `paymentApprovalStatus`, KHÔNG loại trừ đơn đã có `cashRemittanceDeclaredAt` — khiến Shop xác nhận thanh toán xong, đóng rồi mở lại modal vẫn thấy y nguyên số tiền cũ và có thể bấm "Xác nhận thanh toán" lặp lại vô hạn lần cho cùng 1 lô đơn chưa được Agency duyệt (tạo nhiều `CashRemittanceBatch` trùng lặp cho cùng 1 khoản nợ). Đã sửa: thêm điều kiện `!o.cashRemittanceDeclaredAt` vào cả 3 chỗ lọc trên. Đồng thời sửa `rejectOrderPayment()` để XOÁ `cashRemittanceDeclaredAt` khi Agency từ chối (cùng dạng lỗi "kẹt vĩnh viễn" như bug `rejected` đã sửa ở AGA-PAYMENT-1).
- Nút "Thanh toán cho đại lý" chỉ áp dụng cho TIỀN MẶT — MoMo/Chuyển khoản tự "Đã nhận" ngay từ lúc tạo đơn (xem SHOP-ORDER-43), không có gì để Shop "khai" thêm, nên không tính vào `unremittedCashOrders`.
- Đây là lời khai TỰ NGUYỆN, một chiều — không có cơ chế nào bắt Shop phải bấm nút này trước khi Agency duyệt; Agency vẫn có thể tự chủ động "Duyệt shop này" (AGA-PAYMENT-2) bất cứ lúc nào mà không cần chờ Shop khai trước.
- **Thay đổi (bỏ hint "Shop báo đã chuyển" bên Agency Admin)**: trước đây Agency Admin (`CashRemittance.tsx`) hiện thêm dòng "💬 Shop báo đã chuyển lúc..." khi đơn có `cashRemittanceDeclaredAt` — đã BỎ theo yêu cầu (xem AGA-PAYMENT-1 Notes): Agency không cần "thông báo" kiểu Shop tự khai để tin, mà tự dựa vào số ngày trễ (hệ thống tự track) rồi tự đối chiếu sổ quỹ thật. Cơ chế khai của Shop ở story này KHÔNG đổi gì — Shop vẫn khai bình thường, chỉ là lời khai đó không còn hiển thị gì thêm ở phía Agency Admin nữa.
- **Tách story**: cột phải "Lịch sử thanh toán" trong CÙNG modal này được tách thành story riêng ([SHOP-ORDER-61](./bao-cao-dong-tien-lich-su-thanh-toan.md)) vì có hành vi/bug riêng (copy mã, xem chi tiết) không phụ thuộc vào luồng khai nộp — 2 story cùng render trong 1 modal nhưng độc lập về mặt code (`RemittanceModal` 2 cột).
- Xem AGA-PAYMENT-1/2 (Agency Admin) để biết cách Agency nhìn thấy và xử lý lời khai này; [SHOP-ORDER-55](./bao-cao-dong-tien.md) (bảng chính nơi nút này nằm).
