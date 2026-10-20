---
id: AGA-PAYMENT-2
jiraKey: 
platform: agency-admin
section: Duyệt thanh toán tiền mặt
figma: 
status: draft
---

# [AGA] Duyệt thanh toán tiền mặt: Duyệt theo từng Shop

## User Story

Là Agency Admin, sau khi đã thực nhận đủ tiền mặt từ MỘT Shop (bưu cục) cụ thể chuyển lên, tôi muốn duyệt hàng loạt tất cả đơn tiền mặt đang "Chờ duyệt" của RIÊNG SHOP ĐÓ chỉ bằng 1 lần bấm — mà KHÔNG ảnh hưởng tới các shop khác chưa chuyển tiền — để mở lại ngay việc tạo đơn cho shop đó nếu đang bị khoá.

## User Flow

1. Tại mỗi khối Shop trong trang "Duyệt thanh toán tiền mặt" (xem AGA-PAYMENT-1), góc phải khối có nút **"Duyệt shop này (N)"** — N là số đơn tiền mặt đang "Chờ duyệt" CỦA RIÊNG SHOP ĐÓ (không cộng dồn các shop khác).
2. Nếu N = 0 (shop đó không còn đơn nào chờ duyệt) → nút hiện màu xám, không bấm được.
3. Bấm nút → hiện `window.confirm`: "Duyệt N đơn tiền mặt đang chờ của shop '{tên shop}'? Thao tác này xác nhận ĐÃ THỰC NHẬN đủ tiền shop chuyển lên — nếu shop đang bị khoá tạo đơn, sẽ được mở lại ngay."
4. Xác nhận → CHỈ đơn tiền mặt "Chờ duyệt" của SHOP ĐÓ chuyển "✓ Đã nhận tiền" — các shop khác (kể cả đang hiện trên cùng trang) HOÀN TOÀN không bị ảnh hưởng.
5. **Hệ quả tức thì bên Web Shop**: nếu shop đó đang bị tự động khoá tạo đơn (vì trễ ≥3 ngày) → được MỞ LẠI NGAY lập tức (nút "+ Tạo đơn hàng" hết xám) vì không còn đơn `pending_review` nào của shop đó tính vào hạn 3 ngày nữa.
6. Huỷ confirm → không có gì thay đổi.
7. Badge trạng thái tổng quát của khối Shop đó tự cập nhật ngay thành "Không có đơn chờ" (nếu đã duyệt hết) sau khi duyệt xong.
8. Nếu có 1 đơn cụ thể của shop đó còn nghi ngờ (Shop khai nhưng chưa chắc đã chuyển tiền thật), Agency Admin phải xử lý đơn đó NGOÀI hệ thống (liên hệ Shop) TRƯỚC KHI bấm "Duyệt shop này" — không có cách chọn lọc duyệt riêng 1 vài đơn trong cùng 1 shop qua UI.

## System Flow

1. `ShopGroup`: `pending = orders.filter(o => o.paymentApprovalStatus === 'pending_review')` — tính RIÊNG trên mảng `orders` đã được lọc sẵn theo `shopId` của khối này (xem AGA-PAYMENT-1).
2. `handleApproveShop()`: guard `if (pending.length === 0) return`; `window.confirm(...)` có tên shop trong nội dung; nếu xác nhận, lặp `for (const o of pending) approveOrderPayment(o.id, CURRENT_AGENT)`.
3. `approveOrderPayment(orderId, approvedBy)` (dùng chung, trong `orderStore.ts`): chỉ áp dụng khi đơn đang `paymentApprovalStatus === 'pending_review'`; set `paymentApprovalStatus: 'confirmed'`, `paymentApprovedAt`, `paymentApprovedBy`. Hàm này KHÔNG đổi gì — chỉ khác CẤP GỌI (mỗi khối Shop tự gọi cho đúng `pending` của mình, không có vòng lặp nào gộp nhiều shop).
4. `shopCashOverdueDays(shopId)` (`orderStore.ts`) chỉ đếm đơn CÒN `pending_review` CỦA ĐÚNG shop đó — sau khi duyệt xong shop A, `shopCashOverdueDays('A')` về `0` ngay, trong khi shop B (chưa duyệt) vẫn giữ nguyên số ngày trễ — 2 shop hoàn toàn độc lập.
5. `onApproved` (= `refresh` ở component cha `CashRemittance`) được gọi sau khi duyệt xong 1 shop — re-render LẠI TOÀN TRANG (mọi khối Shop), nhưng vì dữ liệu các shop khác không đổi nên UI của họ không có gì khác biệt.

## Acceptance Criteria

**AC1:** Nút "Duyệt shop này (N)" ở mỗi khối hiện đúng N = số đơn tiền mặt "Chờ duyệt" CỦA RIÊNG shop đó.

**AC2:** N = 0 → nút màu xám, `disabled`, không bấm được.

**AC3:** Bấm nút (N > 0) → luôn hiện `window.confirm` có TÊN SHOP trong nội dung, trước khi thực hiện.

**AC4:** Xác nhận → CHỈ đơn tiền mặt "Chờ duyệt" của shop đó chuyển "✓ Đã nhận tiền"; đơn tiền mặt "Chờ duyệt" của shop KHÁC (nếu đang hiện trên cùng trang) giữ nguyên, không đổi gì.

**AC5:** Shop đang bị tự động khoá tạo đơn (≥3 ngày trễ) → sau khi duyệt RIÊNG shop đó, Web Shop của shop đó MỞ LẠI tạo đơn NGAY (F5 là thấy).

**AC6:** Huỷ `window.confirm` → không có đơn nào của shop đó bị đổi trạng thái.

**AC7:** Không có cách chọn lọc duyệt RIÊNG 1 vài đơn trong CÙNG 1 shop qua UI — bấm "Duyệt shop này" luôn áp dụng cho TẤT CẢ đơn `pending_review` của shop đó.

## Notes

- **Thay đổi lớn (v2)**: trước đây (v1) chỉ có 1 nút "Duyệt tất cả đơn chờ" DUY NHẤT cho TOÀN ĐẠI LÝ (mọi shop cùng lúc) — đã đổi thành mỗi shop có nút "Duyệt shop này" RIÊNG, để Agency Admin kiểm soát chính xác từng shop, tránh duyệt nhầm/duyệt gộp khi chỉ 1 vài shop đã thực sự chuyển tiền.
- KHÔNG có cách Từ chối 1 đơn cụ thể qua UI (hàm `rejectOrderPayment()` còn tồn tại trong code nhưng chưa có nút gọi — kế thừa hạn chế từ thiết kế cũ). Nếu phát hiện 1 đơn gian lận/sai sót, xử lý NGOÀI hệ thống (liên hệ Shop) trước khi bấm "Duyệt shop này" cho các đơn còn lại của shop đó.
- Xem AGA-PAYMENT-1 để biết cấu trúc trang (nhóm theo shop); AGA-PAYMENT-3 để biết cơ chế cảnh báo/khoá tự động phía Web Shop mà hành động này ảnh hưởng tới; GSA-PAYMENT-CONFIG-1 (Super Admin) để biết nơi cấu hình ngưỡng ≥3 ngày (mặc định) quyết định khi nào shop bị khoá.
