---
id: SHOP-ORDER-55
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Báo cáo dòng tiền: Bảng phí dịch vụ đã/chưa thanh toán

## User Story

Là chủ shop, tôi muốn có 1 trang riêng dạng bảng đối soát (giống bảng "Phí dịch vụ" thật của GHN) để xem rõ tổng phí ship đã thanh toán và còn nợ bao nhiêu, cùng chi tiết từng đơn, thay vì phải tự cộng tay hay lướt từng dòng trong danh sách đơn.

## User Flow

1. Vào menu "Báo cáo dòng tiền" trong sidebar Web Shop (icon 💲, giữa "Đơn hàng" và "Đối soát") → route `/shop/cash-flow`.
2. Đầu trang hiện nhãn **"Phí dịch vụ"** (gạch chân cam) — trang chỉ tập trung vào phí ship, không có tab "Tiền thu hộ" nào (COD đã có trang "Đối soát" riêng, không lặp lại ở đây).
3. Góc phải: ghi chú ngắn + nút **"Tải file excel"** (tải thật 1 file `.xlsx` chứa đúng dữ liệu đang hiển thị) + nút **"Thanh toán cho đại lý (Xđ)"** (nền xanh navy) — X là tổng phí ship các đơn TIỀN MẶT đang `pending_review` HOẶC `rejected` ("Nợ tồn") của shop này. Không có đơn nào cần chuyển → nút disabled, label "Không có đơn cần chuyển".
4. Bấm nút "Thanh toán cho đại lý" → mở **modal "Thanh toán hạn mức đã dùng"** (2 cột, mô phỏng đúng 1 UI thật tham khảo):
   - **Cột trái**: chip trạng thái "⏱ Chưa thanh toán" (xám); dòng "Phí giao hàng (Đơn hàng đã bàn giao/ Hoàn tất) [Tải danh sách đơn]" (link cam, xuất file riêng danh sách đơn cần trả) = tổng đơn `pending_review`; dòng "Nợ tồn" = tổng đơn `rejected`; "Tổng tiền cần thanh toán" (cam, đậm, to) = 2 dòng trên cộng lại; ghi chú nhắc đọc kỹ; checkbox "Tôi đã đọc, hiểu và chấp nhận điều khoản thanh toán của GHN" (BẮT BUỘC tick mới bấm được nút); nút **"Xác nhận thanh toán"** (cam, disabled nếu chưa tick hoặc tổng = 0) — bấm vào gọi `declareCashRemittance()`, hiện banner xanh "✓ Đã gửi yêu cầu thanh toán Xđ cho đại lý — mã ..." ngay trong modal; đơn đang `rejected` ("Nợ tồn") được ĐƯA VỀ `pending_review` để Agency duyệt lại được (không kẹt mãi).
   - **Cột phải "Lịch sử thanh toán"**: liệt kê MỌI lần Shop đã bấm "Xác nhận thanh toán" trước đó, mỗi card: chip xanh "✓ Đã gửi yêu cầu thanh toán", "Mã thanh toán: {code}" (icon copy), "Thời gian: dd/mm/yyyy hh:mm:ss", "Tổng tiền: Xđ", nút "Xem chi tiết" (hiện danh sách mã vận đơn của lần đó).
4. Bảng: dòng đầu tiên luôn là **"Tổng"** (nền cam nhạt), cộng dồn 3 cột tiền của TOÀN BỘ đơn.
5. Các dòng sau, mỗi dòng 1 đơn: **STT**, **Mã đơn** (gạch chân xanh), **Ngày thanh toán** (giờ + ngày), **Người nhận** (tên + SĐT che bớt "xxxx 1234" + tỉnh/thành), **Trạng thái** (tên kênh: MoMo/Chuyển khoản/Tiền mặt), **Phí dịch vụ** (số ÂM — toàn bộ phí ship của đơn), **Đã thanh toán** (số DƯƠNG nếu đại lý đã xác nhận, 0 nếu chưa), **Chưa thanh toán** (số ÂM nếu đại lý chưa xác nhận, 0 nếu đã xong).
5b. Đơn đã `confirmed` (đại lý đã duyệt) nhưng SAU ĐÓ phát sinh thêm phí (phí hoàn hàng/phụ phí đổi địa chỉ — xem SHOP-ORDER-56) mà phần phát sinh đó CHƯA được duyệt lại → ngay dưới "Mã đơn" hiện thêm 1 **badge nhỏ màu vàng** "⚠️ Phí hoàn hàng chưa duyệt" (nếu do trả hàng) hoặc "⚠️ Phụ phí đổi địa chỉ chưa duyệt" (nếu do đổi địa chỉ) — để Shop biết NGAY trên bảng chính lý do cột "Chưa thanh toán" của đơn đó khác 0 dù "Trạng thái" tổng thể vẫn là đơn đã thanh toán, không cần bấm vào xem breakdown mới biết.
6. Chỉ hiện đơn Shop TỰ TRẢ SHIP (tiền mặt/MoMo/chuyển khoản) của shop đang đăng nhập — đơn Khách trả ship (COD) không xuất hiện.
7. Bấm vào SỐ TIỀN ở cột "Phí dịch vụ" của 1 dòng bất kỳ → mở modal chi tiết: mã vận đơn ở header, dòng "Người nhận" (tên + giờ/ngày + SĐT che bớt + tỉnh/thành), tổng "PHÍ DỊCH VỤ" (số âm, to, đậm), rồi breakdown 5 hạng mục phí GHN THẬT (đúng những khoản đã tính khi tạo đơn ở `CreateOrderDrawer`): "Phí giao hàng", "Phí bảo hiểm (khai giá)", "Phí giao trả 1 phần", "Phí giao thất bại thu tiền", "Phí thu hộ" — cộng dồn 5 dòng này LUÔN đúng bằng tổng "PHÍ DỊCH VỤ". Bấm X hoặc click ra ngoài overlay để đóng.

## System Flow

1. `src/platforms/shop/pages/CashFlowReport.tsx`, route `cash-flow` trong `App.tsx`, nav item trong `ShopLayout.tsx`.
2. `relevantOrders = loadOrders().filter(o => o.shopId === 'SHP001' && !!o.paymentApprovalStatus).sort(...)` — sắp xếp theo `paymentPaidAt` giảm dần, KHÔNG nhóm theo ngày (bảng phẳng, khớp đúng dạng bảng đối soát thật).
3. `rowAmounts(order)`: `phiDichVu = -order.fee`. Nếu chưa `confirmed`: `daThanhToan = 0`, `chuaThanhToan = -order.fee`. Nếu đã `confirmed`: `daThanhToan = order.paymentApprovedAmount ?? order.fee` (snapshot `fee` NGAY TẠI THỜI ĐIỂM đại lý duyệt — xem SHOP-ORDER-56), `chuaThanhToan = -(order.fee - daThanhToan)` nếu hiệu số dương, ngược lại `0` — tách riêng phần ĐÃ DUYỆT khỏi phần phí phát sinh SAU KHI duyệt (phí hoàn hàng/đổi địa chỉ) để không ngộ nhận gộp cả vào "Đã thanh toán" chỉ vì đơn đang ở trạng thái confirmed. Đơn chưa từng phát sinh thêm gì sau duyệt (đa số) có `paymentApprovedAmount === fee` → hành vi giống hệt bản nhị phân cũ, vẫn giữ đúng quy ước dấu: `|phiDichVu| = daThanhToan + |chuaThanhToan|`.
4. Dòng "Tổng" = `reduce` cộng dồn 3 giá trị trên qua TOÀN BỘ `relevantOrders` (không phụ thuộc trang/phân trang).
4b. `pendingSurchargeLabel(order)`: trả `null` nếu đơn chưa `confirmed` hoặc `fee - (paymentApprovedAmount ?? fee) <= 0` (không có gì phát sinh thêm); nếu có phát sinh → trả `'Phí hoàn hàng chưa duyệt'` khi `order.status === 'returning'`, `'Phụ phí đổi địa chỉ chưa duyệt'` khi `feeAddressChange > 0` (và không phải đang `returning`), hoặc `'Phát sinh thêm chưa duyệt'` cho trường hợp còn lại không xác định được loại cụ thể. Badge CHỈ hiện khi hàm này trả về chuỗi khác `null`, render ngay dưới mã vận đơn ở cột "Mã đơn" (nền `#FEF3C7`, chữ `#92400E`, cùng tông với banner cảnh báo trễ hạn ở AGA-PAYMENT-3).
5. `handleExport()`: dùng thư viện `xlsx` (đã có sẵn trong project, xem `Shops.tsx`/`AgencyOrders.tsx`), build `headers` + `rows` từ đúng dữ liệu đang hiển thị, `XLSX.writeFile(...)` tải file `phi-dich-vu-{ngày}.xlsx` — XUẤT FILE THẬT, không phải nút giả.
6. `maskedReceiver(order)`: che SĐT chỉ còn 4 số cuối (`slice(-4)`), lấy phần cuối cùng của `receiverAddress` (sau dấu phẩy cuối) làm "tỉnh/thành" hiển thị.
7. Không có tab "Tiền thu hộ" nào trong trang này (đã bỏ theo yêu cầu) — COD xem ở trang "Đối soát" (`/shop/reconciliation`) riêng.
8. `Order` (orderStore.ts) có thêm 5 field mới lưu ĐÚNG breakdown phí lúc tạo đơn: `feeShipping`, `feeInsurance` (phí bảo hiểm/khai giá), `feePartial` (phí giao trả 1 phần), `feeDeliveryFail` (phí giao thất bại thu tiền), `feeCod` (phí thu hộ) — trước đây các khoản này chỉ được TÍNH trong state cục bộ của `CreateOrderDrawer`/`CreateLetterDrawer` để hiện trên form, rồi CỘNG GỘP vào `order.fee` khi lưu, làm MẤT breakdown; giờ `buildOrder()` lưu riêng từng field luôn.
9. `feeBreakdownRows(order)` (CashFlowReport.tsx): trả về 7 dòng `{ label, amount }` (5 khoản tính lúc tạo đơn + "Phí trả hàng (hoàn hàng)" = `-(order.feeReturn ?? 0)` + "Phụ phí đổi địa chỉ" = `-(order.feeAddressChange ?? 0)` — SHOP-ORDER-56 — cả 2 chỉ phát sinh SAU khi có sự kiện thật xảy ra, xem `confirmReturnOrder()`/`confirmAddressChangeOrder()`, Orders.tsx). Đơn CŨ không có field breakdown (`feeShipping === undefined`) → fallback "Phí giao hàng" = `-(order.fee - (order.feeReturn ?? 0) - (order.feeAddressChange ?? 0))` — PHẢI trừ cả 2 khoản phát sinh sau ra trước vì `order.fee` đã cộng sẵn khi chúng xảy ra, nếu không sẽ bị đếm trùng 2 lần (bug `feeReturn` đã phát hiện và sửa qua UAT; áp dụng tương tự cho `feeAddressChange`).
9. Click vào số tiền cột "Phí dịch vụ" (`onClick={() => setBreakdownOrder(order)}`) mở modal; click overlay nền hoặc icon X đóng modal — state `breakdownOrder` reset về `null`.
10. `declareCashRemittance(shopId, declaredBy)` (`orderStore.ts`): trả về 1 `CashRemittanceBatch` (hoặc `null` nếu không có gì để khai) — đánh dấu `cashRemittanceDeclaredAt` (ISO timestamp) trên MỌI đơn `paymentMethod === 'cash'` đang `pending_review` HOẶC `rejected` của shop đó; đơn `rejected` được ĐỔI NGƯỢC về `pending_review` (xoá `paymentApprovalRejectedReason`) vì `approveOrderPayment()` chỉ nhận đơn `pending_review` — nếu không reset, đơn `rejected` sẽ kẹt vĩnh viễn không bao giờ duyệt lại được; ghi 1 dòng "Báo đã chuyển tiền mặt cho đại lý" vào Lịch sử thao tác của TỪNG đơn liên quan.
11. `CashRemittanceBatch` (`orderStore.ts`, kiểu MỚI): `{ id, shopId, declaredAt, declaredBy, totalAmount, orderIds }` — `id` sinh kiểu `YYMMDD + 5 ký tự ngẫu nhiên` (`generateRemittanceCode()`), lưu vào `localStorage` key `ghn_cash_remittance_batches_v1` qua `loadRemittanceBatches(shopId)`/`saveRemittanceBatch()` — ĐÂY LÀ LỊCH SỬ LỜI KHAI của Shop, KHÁC với lịch sử Agency đã duyệt (đọc `paymentApprovalStatus` của từng đơn trong `orderIds` để biết Agency đã duyệt hay chưa).
12. `RemittanceModal` (`CashFlowReport.tsx`, component MỚI): tự tính `phiGiaoHang`/`noTon`/`tongTien` từ dữ liệu LIVE (không nhận props số liệu) để luôn khớp đúng lúc mở modal; `handleConfirm()` gọi `declareCashRemittance()`, lưu kết quả vào state `justDeclared` để hiện banner xanh NGAY TRONG modal (không cần đóng/mở lại); `handleViewDetail()` tra `trackingCode` từng `orderId` trong batch rồi `window.alert` liệt kê. `unpaidOrders`/`overdueOrders` (và `unremittedCashOrders` ở component cha) đều lọc thêm `&& !o.cashRemittanceDeclaredAt` — đơn đã khai rồi (đang chờ Agency đối chiếu) KHÔNG được tính lại vào khoản cần thanh toán, tránh khai trùng lặp vô hạn lần.
13. Bên Agency Admin (`CashRemittance.tsx`): `StatusCell` KHÔNG hiện bất kỳ dòng "Shop báo đã chuyển..." nào dù `order.cashRemittanceDeclaredAt` có giá trị hay không — Agency không dựa vào lời khai này để tin, chỉ dựa vào số ngày trễ (hệ thống tự track) rồi tự đối chiếu sổ quỹ thật trước khi duyệt (xem AGA-PAYMENT-1 Notes). `cashRemittanceDeclaredAt` vẫn được ghi và dùng ở `declareCashRemittance()`/`RemittanceModal` phía Web Shop như mô tả ở trên — chỉ KHÔNG hiển thị gì thêm ở phía Agency Admin.

## Acceptance Criteria

**AC1:** Sidebar Web Shop có mục "Báo cáo dòng tiền", route `/shop/cash-flow` mở đúng trang, không lỗi console.

**AC2:** Trang chỉ hiện nhãn "Phí dịch vụ" (gạch chân cam) — KHÔNG có tab "Tiền thu hộ" nào.

**AC3:** Dòng "Tổng" hiện đúng tổng 3 cột tiền của toàn bộ đơn khớp bộ lọc shop; luôn thoả `|Phí dịch vụ| = Đã thanh toán + |Chưa thanh toán|`.

**AC4:** Đơn `paymentApprovalStatus === 'confirmed'` → "Đã thanh toán" > 0 (= `order.paymentApprovedAmount`, mặc định bằng `order.fee` nếu chưa từng phát sinh phí sau khi duyệt), "Chưa thanh toán" = 0 — TRỪ KHI đơn có phí phát sinh SAU thời điểm duyệt (phí hoàn hàng/đổi địa chỉ, xem SHOP-ORDER-56 AC-tương ứng), khi đó "Đã thanh toán" giữ nguyên số đã duyệt, "Chưa thanh toán" < 0 bằng đúng phần phát sinh thêm.

**AC5:** Đơn `paymentApprovalStatus !== 'confirmed'` (pending_review/rejected) → "Đã thanh toán" = 0, "Chưa thanh toán" < 0 (= `-order.fee`).

**AC6:** Cột "Người nhận" hiện SĐT che bớt dạng "xxxx 1234" (chỉ 4 số cuối) + tỉnh/thành — KHÔNG hiện SĐT đầy đủ.

**AC7:** Bấm "Tải file excel" → tải thật 1 file `.xlsx` đúng dữ liệu đang hiển thị (STT/Mã đơn/Ngày/Người nhận/Trạng thái/3 cột tiền), không lỗi JS.

**AC8:** Đơn Khách trả ship (COD) không xuất hiện trong bảng.

**AC9:** Bấm vào số tiền cột "Phí dịch vụ" của 1 dòng → mở modal đúng mã vận đơn của dòng đó, tổng "PHÍ DỊCH VỤ" = đúng `-order.fee`, cộng dồn 5 dòng breakdown (Phí giao hàng/Phí bảo hiểm/Phí giao trả 1 phần/Phí giao thất bại thu tiền/Phí thu hộ) LUÔN khớp đúng 100% với tổng đó.

**AC10:** Bấm X hoặc click ra vùng overlay bên ngoài modal → modal đóng; mở lại với đơn khác → luôn hiện đúng dữ liệu đơn vừa bấm, không dính dữ liệu đơn trước.

**AC11:** Đơn tạo TRƯỚC khi có field `feeShipping` (dữ liệu cũ) → modal vẫn mở đúng, "Phí giao hàng" fallback = `-order.fee` (không phải `0`/`NaN`), 4 dòng phụ phí còn lại = `0`.

**AC12:** Nút "Thanh toán cho đại lý" hiện đúng tổng phí ship các đơn TIỀN MẶT `pending_review` HOẶC `rejected` (CHƯA có `cashRemittanceDeclaredAt`) của shop; disabled "Không có đơn cần chuyển" khi không còn đơn nào thoả điều kiện đó.

**AC13:** Modal "Thanh toán hạn mức đã dùng" hiện đúng "Phí giao hàng" (= tổng đơn `pending_review` chưa khai), "Nợ tồn" (= tổng đơn `rejected` chưa khai), "Tổng tiền cần thanh toán" = 2 dòng cộng lại; nút "Xác nhận thanh toán" disabled khi chưa tick checkbox HOẶC tổng = 0.

**AC14:** Sau khi bấm "Xác nhận thanh toán": banner xanh hiện NGAY trong modal (không cần đóng/mở lại), 1 card mới xuất hiện ở "Lịch sử thanh toán"; đơn `rejected` trong lô vừa khai được ĐƯA VỀ `pending_review` (xoá lý do từ chối) để Agency duyệt lại được.

**AC15:** Đóng rồi mở lại modal (hoặc nhìn nút ngoài trang) SAU KHI đã khai: các đơn vừa khai KHÔNG được tính lại vào "Phí giao hàng"/"Nợ tồn"/tổng tiền cần thanh toán nữa (dù vẫn đang `pending_review`, chưa được Agency duyệt) — Shop KHÔNG bấm "Xác nhận thanh toán" lặp lại được cho cùng 1 lô đơn (bug phát hiện qua UAT, xem Notes).

**AC16:** Sau khi Shop khai, Agency Admin (`/agency-admin/cash-remittance`) KHÔNG hiện thêm bất kỳ dòng "Shop báo đã chuyển..." nào — badge trạng thái (Chờ duyệt/⚠ Trễ N ngày) giữ nguyên như khi chưa khai, Agency vẫn phải tự đối chiếu sổ quỹ rồi bấm "Duyệt shop này" mới chuyển "✓ Đã nhận tiền".

**AC17:** Nếu Agency từ chối (`rejectOrderPayment`) 1 đơn đã từng được Shop khai trước đó → đơn quay về trạng thái "chưa khai" (`cashRemittanceDeclaredAt` bị xoá), xuất hiện LẠI trong "Nợ tồn" ở lần mở modal tiếp theo để Shop khai lại — không bị loại vĩnh viễn.

**AC18:** Đơn đã `confirmed` mà phát sinh thêm phí hoàn hàng/đổi địa chỉ CHƯA được duyệt lại (`fee > paymentApprovedAmount`) → hiện đúng badge vàng tương ứng ("Phí hoàn hàng chưa duyệt" nếu do trả hàng, "Phụ phí đổi địa chỉ chưa duyệt" nếu do đổi địa chỉ) ngay dưới mã vận đơn ở bảng chính; đơn KHÔNG có phát sinh gì thêm (đa số) hoặc đơn chưa từng `confirmed` → KHÔNG hiện badge nào.

## Notes

- **Thêm mới (badge cảnh báo phát sinh chưa duyệt)**: trước đây, đơn `confirmed` có phí hoàn hàng/đổi địa chỉ phát sinh thêm chỉ lộ ra ở cột "Chưa thanh toán" bằng 1 con số thường (cùng màu/cỡ chữ các số khác) — Shop dễ bỏ sót nếu không tự bấm vào breakdown từng đơn. Đã thêm badge vàng "⚠️ ..." ngay dưới mã vận đơn (xem `pendingSurchargeLabel()`) để báo trước, không cần đổi màu cột số tiền (giữ nguyên theo yêu cầu, chỉ thêm badge).
- **Bug đã phát hiện qua UAT và sửa (phát hiện khi làm SHOP-SETTINGS-3, Tem QR)**: icon copy "Mã thanh toán" ở cột "Lịch sử thanh toán" dùng `try { navigator.clipboard.writeText(batch.id) } catch { ... }` — `writeText()` trả về `Promise`, lỗi quyền clipboard bị từ chối xảy ra BẤT ĐỒNG BỘ nên `try/catch` đồng bộ không bắt được, rơi thành unhandled promise rejection. Đã sửa thành `navigator.clipboard.writeText(batch.id).catch(() => {})`.
- **Cập nhật sau SHOP-ORDER-56** (phụ phí đổi địa chỉ phát sinh sau khi tạo đơn): phát hiện đơn đã `confirmed` mà phát sinh thêm phí (hoàn hàng/đổi địa chỉ) bị `rowAmounts()` cũ ngộ nhận gộp CẢ phần mới phát sinh vào "Đã thanh toán", dù đại lý chưa hề duyệt phần đó. Đã sửa bằng cách thêm field `order.paymentApprovedAmount` (snapshot `fee` tại đúng thời điểm duyệt, set ở MỌI nơi `paymentApprovalStatus` chuyển `'confirmed'`: `approveOrderPayment()` orderStore.ts, `handlePaymentPaid()`/`handlePaymentPaidInDetail()`/`buildOrder()` Orders.tsx) rồi tách `rowAmounts()` theo field này thay vì dùng thẳng `order.fee`. Xem chi tiết đầy đủ ở [SHOP-ORDER-56](dieu-chinh-dia-chi-phat-sinh-phu-phi.md).
- Đây là BẢN LÀM LẠI (v2) sau khi đối chiếu với 1 ảnh UI thật của GHN (bảng "Phí dịch vụ" trong trang đối soát) — bản v1 trước đó (chip tổng + 4 tab lọc + badge theo đơn, nhóm theo ngày) đã bị thay thế hoàn toàn vì không khớp cách trình bày thật.
- Tab "Tiền thu hộ" (có ở bản tham khảo ban đầu) đã bị BỎ theo yêu cầu — trang này giờ CHỈ còn "Phí dịch vụ", không có cơ chế điều hướng/tab nào khác.
- **Sửa quan trọng (sau phản hồi "phí phát sinh phải dựa theo phí GHN")**: bản đầu của modal breakdown dùng 6 nhãn phụ phí BỊA theo đúng chữ trong ảnh tham khảo (Phí trả hàng/Phí giao lại/Phí khai giá/Phí khuyến mãi/Phí đồng kiểm/Phí thu hồi chứng từ) nhưng gán cứng = 0, không map với dữ liệu thật nào. Đã sửa: bỏ hẳn 6 nhãn bịa đó, dùng ĐÚNG 5 hạng mục phí GHN thật mà form Tạo đơn (`CreateOrderDrawer`) đã có sẵn công thức tính (`shopFeeFromPriceTable`, checkbox Khai giá/Giao 1 phần/Giao thất bại thu tiền/Thu hộ) — đồng thời thêm field lưu persist các khoản này vào `Order` (trước đó chỉ tính rồi cộng gộp, không lưu riêng).
- Quy ước dấu (Phí dịch vụ âm, Đã thanh toán dương, Chưa thanh toán âm) và dòng "Tổng" ở đầu bảng là MÔ PHỎNG đúng theo ảnh tham khảo thật — không phải quy ước tự nghĩ ra.
- Cột "Trạng thái" trong ảnh gốc là LÝ DO NGOẠI LỆ GIAO HÀNG (hàng ngoại lệ/chuyển hoàn/hư hỏng) của 1 loại phí phát sinh khác hẳn — ở đây CỐ TÌNH đổi nghĩa thành KÊNH THANH TOÁN (MoMo/CK/Tiền mặt) để khớp với mô hình dữ liệu `paymentApprovalStatus` đang có, KHÔNG xây dựng tính năng "phí phát sinh ngoại lệ" mới (ngoài phạm vi).
- Trang này THAY THẾ vai trò hiển thị trạng thái thanh toán trước đây nằm ở cột "Phí ship" trong danh sách Đơn hàng — xem SHOP-ORDER-44 (đã bỏ badge khỏi danh sách đơn).
- **PROTOTYPE THUẦN** cho phần số liệu (đọc trực tiếp `orderStore.ts`) nhưng nút "Tải file excel" xuất file THẬT (dùng thư viện `xlsx`, không phải mock).
- Xem SHOP-ORDER-43 (vì sao MoMo/CK gần như luôn "Đã thanh toán" ngay), SHOP-ORDER-45 (Chi tiết đơn vẫn còn dòng "Trạng thái {kênh}" riêng, không bị ảnh hưởng).
- Nút "Thanh toán cho đại lý" chỉ áp dụng cho TIỀN MẶT — MoMo/Chuyển khoản tự "Đã nhận" ngay từ lúc tạo đơn (xem SHOP-ORDER-43), không có gì để Shop "khai" thêm, nên không tính vào `unremittedCashOrders`.
- Đây là lời khai TỰ NGUYỆN, một chiều — không có cơ chế nào bắt Shop phải bấm nút này trước khi Agency duyệt; Agency vẫn có thể tự chủ động "Duyệt shop này" (AGA-PAYMENT-2) bất cứ lúc nào mà không cần chờ Shop khai trước.
- Xem AGA-PAYMENT-1/2 (Agency Admin) để biết cách Agency nhìn thấy và xử lý lời khai này.
- **Thay đổi (bỏ hint "Shop báo đã chuyển" bên Agency Admin)**: trước đây Agency Admin (`CashRemittance.tsx`) hiện thêm dòng "💬 Shop báo đã chuyển lúc..." khi đơn có `cashRemittanceDeclaredAt` — đã BỎ theo yêu cầu (xem AGA-PAYMENT-1 Notes): Agency không cần "thông báo" kiểu Shop tự khai để tin, mà tự dựa vào số ngày trễ (hệ thống tự track) rồi tự đối chiếu sổ quỹ thật. Cơ chế khai của Shop ở trang này (nút "Thanh toán cho đại lý", `declareCashRemittance()`, "Lịch sử thanh toán") KHÔNG đổi gì — Shop vẫn khai bình thường, chỉ là lời khai đó không còn hiển thị gì thêm ở phía Agency Admin nữa.
- **Bug đã phát hiện qua UAT và sửa (v3 — modal "Thanh toán hạn mức đã dùng")**: bản đầu của `unpaidOrders`/`overdueOrders`/`unremittedCashOrders` chỉ lọc theo `paymentApprovalStatus`, KHÔNG loại trừ đơn đã có `cashRemittanceDeclaredAt` — khiến Shop xác nhận thanh toán xong, đóng rồi mở lại modal vẫn thấy y nguyên số tiền cũ và có thể bấm "Xác nhận thanh toán" lặp lại vô hạn lần cho cùng 1 lô đơn chưa được Agency duyệt (tạo nhiều `CashRemittanceBatch` trùng lặp cho cùng 1 khoản nợ). Đã sửa: thêm điều kiện `!o.cashRemittanceDeclaredAt` vào cả 3 chỗ lọc trên. Đồng thời sửa `rejectOrderPayment()` để XOÁ `cashRemittanceDeclaredAt` khi Agency từ chối — nếu không xoá, đơn bị từ chối sau khi đã khai 1 lần sẽ bị loại vĩnh viễn khỏi "cần thanh toán" dù Agency chưa thực sự nhận tiền (cùng dạng lỗi "kẹt vĩnh viễn" như bug `rejected` đã sửa ở AGA-PAYMENT-1).
