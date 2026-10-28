---
id: SHOP-ORDER-58
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Báo cáo dòng tiền: Modal breakdown "Phí dịch vụ"

## Bối cảnh

Tách từ [SHOP-ORDER-55](./bao-cao-dong-tien.md) (bảng chính "Phí dịch vụ") — phần click vào số tiền cột "Phí dịch vụ" của 1 dòng để mở modal giải thích phí đó CẤU THÀNH TỪ những khoản nào, thay vì chỉ thấy 1 con số gộp.

## User Story

Là chủ shop, tôi muốn bấm vào số tiền "Phí dịch vụ" của 1 đơn để xem rõ phí đó gồm những khoản phí GHN thật nào (giao hàng/bảo hiểm/giao trả 1 phần/giao thất bại thu tiền/thu hộ/trả hàng/đổi địa chỉ), để đối chiếu đúng với lúc tạo đơn thay vì phải tin suông 1 con số không rõ cấu thành.

## User Flow

1. Bấm vào SỐ TIỀN ở cột "Phí dịch vụ" của 1 dòng bất kỳ → mở modal: mã vận đơn ở header, dòng "Người nhận" (tên + giờ/ngày + SĐT che bớt + tỉnh/thành), tổng "PHÍ DỊCH VỤ" (số âm, to, đậm).
2. Rồi breakdown 5 hạng mục phí GHN THẬT (đúng những khoản đã tính khi tạo đơn ở `CreateOrderDrawer`): "Phí giao hàng", "Phí bảo hiểm (khai giá)", "Phí giao trả 1 phần", "Phí giao thất bại thu tiền", "Phí thu hộ" — cộng dồn 5 dòng này LUÔN đúng bằng tổng "PHÍ DỊCH VỤ".
3. Nếu đơn có phát sinh phí hoàn hàng hoặc đổi địa chỉ sau khi tạo (xem SHOP-ORDER-56) → breakdown có thêm dòng "Phí trả hàng (hoàn hàng)" và/hoặc "Phụ phí đổi địa chỉ".
4. Bấm X hoặc click ra ngoài overlay để đóng.

## System Flow

1. `Order` (orderStore.ts) có thêm 5 field lưu ĐÚNG breakdown phí lúc tạo đơn: `feeShipping`, `feeInsurance` (phí bảo hiểm/khai giá), `feePartial` (phí giao trả 1 phần), `feeDeliveryFail` (phí giao thất bại thu tiền), `feeCod` (phí thu hộ) — trước đây các khoản này chỉ được TÍNH trong state cục bộ của `CreateOrderDrawer`/`CreateLetterDrawer` để hiện trên form, rồi CỘNG GỘP vào `order.fee` khi lưu, làm MẤT breakdown; giờ `buildOrder()` lưu riêng từng field luôn.
2. `feeBreakdownRows(order)` (`CashFlowReport.tsx`): trả về 7 dòng `{ label, amount }` (5 khoản tính lúc tạo đơn + "Phí trả hàng (hoàn hàng)" = `-(order.feeReturn ?? 0)` + "Phụ phí đổi địa chỉ" = `-(order.feeAddressChange ?? 0)` — SHOP-ORDER-56 — cả 2 chỉ phát sinh SAU khi có sự kiện thật xảy ra, xem `confirmReturnOrder()`/`confirmAddressChangeOrder()`, Orders.tsx).
3. Đơn CŨ không có field breakdown (`feeShipping === undefined`) → fallback "Phí giao hàng" = `-(order.fee - (order.feeReturn ?? 0) - (order.feeAddressChange ?? 0))` — PHẢI trừ cả 2 khoản phát sinh sau ra trước vì `order.fee` đã cộng sẵn khi chúng xảy ra, nếu không sẽ bị đếm trùng 2 lần (bug `feeReturn` đã phát hiện và sửa qua UAT; áp dụng tương tự cho `feeAddressChange`).
4. Click vào số tiền cột "Phí dịch vụ" (`onClick={() => setBreakdownOrder(order)}`) mở `FeeBreakdownModal`; click overlay nền hoặc icon X đóng modal — state `breakdownOrder` reset về `null`.

## Acceptance Criteria

**AC1:** Bấm vào số tiền cột "Phí dịch vụ" của 1 dòng → mở modal đúng mã vận đơn của dòng đó, tổng "PHÍ DỊCH VỤ" = đúng `-order.fee` (hoặc `-effectiveFee(order)` nếu đã huỷ-chưa-hoàn — xem SHOP-ORDER-57), cộng dồn các dòng breakdown LUÔN khớp đúng 100% với tổng đó.

**AC2:** Bấm X hoặc click ra vùng overlay bên ngoài modal → modal đóng; mở lại với đơn khác → luôn hiện đúng dữ liệu đơn vừa bấm, không dính dữ liệu đơn trước.

**AC3:** Đơn tạo TRƯỚC khi có field `feeShipping` (dữ liệu cũ) → modal vẫn mở đúng, "Phí giao hàng" fallback = `-order.fee` (không phải `0`/`NaN`), 4 dòng phụ phí còn lại = `0`.

## Notes

- **Sửa quan trọng (sau phản hồi "phí phát sinh phải dựa theo phí GHN")**: bản đầu của modal breakdown dùng 6 nhãn phụ phí BỊA theo đúng chữ trong ảnh tham khảo (Phí trả hàng/Phí giao lại/Phí khai giá/Phí khuyến mãi/Phí đồng kiểm/Phí thu hồi chứng từ) nhưng gán cứng = 0, không map với dữ liệu thật nào. Đã sửa: bỏ hẳn 6 nhãn bịa đó, dùng ĐÚNG 5 hạng mục phí GHN thật mà form Tạo đơn (`CreateOrderDrawer`) đã có sẵn công thức tính (`shopFeeFromPriceTable`, checkbox Khai giá/Giao 1 phần/Giao thất bại thu tiền/Thu hộ) — đồng thời thêm field lưu persist các khoản này vào `Order` (trước đó chỉ tính rồi cộng gộp, không lưu riêng).
- Modal này HOÀN TOÀN KHÁC modal breakdown "Đã thanh toán" (xem [SHOP-ORDER-59](./bao-cao-dong-tien-breakdown-da-thanh-toan.md)) — đây là breakdown CẤU THÀNH PHÍ, còn SHOP-ORDER-59 là breakdown KÊNH THANH TOÁN, dù cả 2 cùng style click-số-để-mở-modal.
- Xem SHOP-ORDER-56 (nguồn gốc 2 dòng phụ phí phát sinh sau khi tạo đơn: trả hàng/đổi địa chỉ), [SHOP-ORDER-55](./bao-cao-dong-tien.md) (bảng chính nơi cột "Phí dịch vụ" này nằm).
