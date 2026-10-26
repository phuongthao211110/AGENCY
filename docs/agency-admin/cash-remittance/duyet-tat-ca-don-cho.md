---
id: AGA-PAYMENT-2
jiraKey: 
platform: agency-admin
section: Duyệt thanh toán tiền mặt
figma: 
status: draft
---

# [AGA] Duyệt thanh toán tiền mặt: Duyệt 1 shop ở bảng chính (nút "✓ Đã nhận")

## Bối cảnh

Tách nhỏ (lần 2) từ bản AGA-PAYMENT-2 gộp trước đó (từng mô tả cả 3 cách duyệt trong 1 story) — nay CHỈ còn CÁCH 1: nút "✓ Đã nhận" ở mỗi dòng shop trên bảng danh sách chính (tab "Chờ xác nhận"). 2 cách còn lại tách riêng: AGA-PAYMENT-7 (duyệt hàng loạt qua checkbox), AGA-PAYMENT-8 (duyệt từ màn "Chi tiết").

## User Story

Là Agency Admin, sau khi đã thực nhận đủ tiền mặt từ MỘT Shop (bưu cục) cụ thể chuyển lên, tôi muốn duyệt hết đơn tiền mặt đang "Chờ duyệt" của RIÊNG SHOP ĐÓ chỉ bằng 1 lần bấm ngay trên dòng của shop đó, mà KHÔNG ảnh hưởng tới các shop khác chưa chuyển tiền, để mở lại ngay việc tạo đơn cho shop đó nếu đang bị khoá.

## User Flow

1. Ở tab "Chờ xác nhận" (xem AGA-PAYMENT-1), mỗi dòng shop có nút xanh **"✓ Đã nhận"** ở cột Thao tác.
2. Bấm "✓ Đã nhận" → `window.confirm`: "Duyệt N đơn tiền mặt đang chờ của shop '{tên shop}'? Thao tác này xác nhận ĐÃ THỰC NHẬN đủ tiền shop chuyển lên — nếu shop đang bị khoá tạo đơn, sẽ được mở lại ngay."
3. Xác nhận → CHỈ đơn tiền mặt "Chờ duyệt" của SHOP ĐÓ chuyển "✓ Đã nhận tiền"; shop đó rời tab "Chờ xác nhận" sang "Đã xác nhận" NGAY; shop khác (kể cả đang hiện cùng trang) hoàn toàn không bị đổi gì.
4. Huỷ `window.confirm` → không có gì thay đổi.
5. **Hệ quả tức thì bên Web Shop**: shop vừa được duyệt nếu đang bị tự động khoá tạo đơn (vì trễ đủ số ngày cấu hình) → được MỞ LẠI NGAY lập tức (nút "+ Tạo đơn hàng" hết xám).
6. Không có cách chọn lọc duyệt RIÊNG 1 vài đơn trong cùng 1 shop qua nút này — luôn áp dụng cho TẤT CẢ đơn `pending_review` của shop đó. Nếu có 1 đơn cụ thể còn nghi ngờ (Shop khai nhưng chưa chắc đã chuyển tiền thật), Agency Admin phải xử lý đơn đó NGOÀI hệ thống (liên hệ Shop) TRƯỚC KHI bấm "✓ Đã nhận".

## System Flow

1. `approveShop(stats: ShopCashStats): boolean` (hàm dùng CHUNG, `CashRemittance.tsx`): gói `window.confirm(...)` (có tên shop + số đơn trong nội dung) rồi lặp `for (const o of stats.pending) approveOrderPayment(o.id, CURRENT_AGENT)` nếu xác nhận; trả `true`/`false` để nơi gọi biết có nên `refresh()` hay không — CÙNG 1 HÀM được dùng lại ở AGA-PAYMENT-7 và AGA-PAYMENT-8.
2. `approveOrderPayment(orderId, approvedBy)` (dùng chung, `orderStore.ts`): chỉ áp dụng khi đơn đang `paymentApprovalStatus === 'pending_review'`; set `paymentApprovalStatus: 'confirmed'`, `paymentApprovedAt`, `paymentApprovedBy`, VÀ `paymentApprovedAmount` (snapshot `fee` tại thời điểm duyệt — xem SHOP-ORDER-56, Web Shop).
3. `shopCashOverdueDays(shopId)` (`orderStore.ts`) chỉ đếm đơn CÒN `pending_review` CỦA ĐÚNG shop đó — sau khi duyệt xong shop A, `shopCashOverdueDays('A')` về `0` ngay, shop B (chưa duyệt) giữ nguyên số ngày trễ.
4. Nút "✓ Đã nhận" gọi `approveShop(stats)`, nếu trả `true` thì gọi `refresh()` (tick state ở component cha) — re-render lại `allStats`/`pendingShops`/`confirmedShops`.

## Acceptance Criteria

**AC1:** Nút "✓ Đã nhận" ở mỗi dòng áp dụng đúng N = số đơn tiền mặt "Chờ duyệt" CỦA RIÊNG shop đó.

**AC2:** Bấm nút (N > 0) → luôn hiện `window.confirm` có TÊN SHOP + SỐ ĐƠN trong nội dung, trước khi thực hiện.

**AC3:** Xác nhận → CHỈ đơn tiền mặt "Chờ duyệt" của shop đó chuyển `confirmed`; shop khác (kể cả đang hiện trên cùng trang) giữ nguyên.

**AC4:** Shop đang bị tự động khoá tạo đơn → sau khi duyệt, Web Shop của shop đó MỞ LẠI tạo đơn NGAY (F5 là thấy).

**AC5:** Huỷ `window.confirm` → không có đơn nào bị đổi trạng thái.

**AC6:** Không có cách chọn lọc duyệt RIÊNG 1 vài đơn trong cùng 1 shop qua nút này — luôn áp dụng cho TẤT CẢ đơn `pending_review` của shop đó.

## Notes

- **Lịch sử tách story**: bản gốc AGA-PAYMENT-2 (v4) mô tả chung 3 cách duyệt (dòng/hàng loạt/màn Chi tiết) trong 1 story. Nay tách thành 3 story riêng (AGA-PAYMENT-2/7/8) để mỗi cách ước lượng/test độc lập được — nghiệp vụ duyệt dùng CHUNG 1 hàm `approveShop()`, KHÔNG đổi.
- Lịch sử xa hơn: v1 chỉ có 1 nút "Duyệt tất cả đơn chờ" DUY NHẤT cho TOÀN ĐẠI LÝ (không chọn lọc được shop nào) — v2 đổi thành mỗi shop 1 nút riêng để kiểm soát chính xác hơn, giữ nguyên tới nay.
- KHÔNG có cách Từ chối 1 đơn cụ thể qua UI (hàm `rejectOrderPayment()` còn tồn tại trong code nhưng chưa có nút gọi). Nếu phát hiện 1 đơn gian lận/sai sót, xử lý NGOÀI hệ thống (liên hệ Shop) trước khi duyệt các đơn còn lại của shop đó.
- Xem AGA-PAYMENT-1 (bảng danh sách chính); AGA-PAYMENT-7 (duyệt hàng loạt qua checkbox); AGA-PAYMENT-8 (duyệt từ màn "Chi tiết"); AGA-PAYMENT-3 (cảnh báo/khoá tự động phía Web Shop); GSA-PAYMENT-CONFIG-1 (Super Admin — nơi cấu hình ngưỡng khoá, riêng từng đại lý).
