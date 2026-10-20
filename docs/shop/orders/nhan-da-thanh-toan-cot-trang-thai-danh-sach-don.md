---
id: SHOP-ORDER-54
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Danh sách đơn hàng: Nhãn "Đã thanh toán" ở cột Trạng thái

> ⚠️ **CHƯA IMPLEMENT** — Đã rà soát `rowStatus(order)` trong `Orders.tsx`: hàm này CHỈ thêm suffix cho 2 trường hợp — `status === 'pending' && paymentApprovalStatus === 'pending_review'` ("· Chờ GHN xác nhận", xem SHOP-ORDER-48) và `status === 'pending' && paymentApprovalStatus === 'rejected'` ("· GHN từ chối xác nhận"). KHÔNG có nhánh nào cho `paymentApprovalStatus === 'confirmed'` — lý do là khi GHN duyệt (`approveOrderPayment()`), đơn tự động rời `status: 'pending'` sang `status: 'pickup'` ngay lập tức (xem `orderStore.ts` dòng 215-230), nên nhãn "Đơn nháp" (nơi 2 suffix trên gắn vào) biến mất hoàn toàn, không còn chỗ để gắn suffix "đã thanh toán". Việc đơn đã được xác nhận nhận tiền HIỆN chỉ hiển thị qua badge "✓ Đã nhận {kênh}" ở cột "Phí ship" riêng (xem SHOP-ORDER-44), không có gì ở cột "Trạng thái". Nội dung dưới đây là SPEC đề xuất, chưa có trong code.

## User Story

Là chủ shop nhìn vào cột Trạng thái trong danh sách đơn, tôi muốn biết ngay đơn đã được GHN xác nhận nhận tiền hay chưa mà không cần liếc sang cột Phí ship, để xác nhận nhanh "đơn này đã xong phần tiền, chỉ còn chờ vận chuyển".

## User Flow (dự kiến)

1. Đơn Shop trả ship (tiền mặt/MoMo/chuyển khoản) sau khi được GHN duyệt → `status` chuyển từ "Đơn nháp" sang "Chờ lấy hàng" (hoặc trạng thái vận chuyển hiện tại của đơn).
2. Ngay sau khi chuyển, nhãn ở cột Trạng thái hiện thêm hậu tố: "Chờ lấy hàng · Đã thanh toán" (áp dụng tương tự cho "Đang giao · Đã thanh toán" nếu đơn đã ở bước xa hơn khi Shop mở lại trang).
3. Màu nhãn giữ nguyên màu của trạng thái vận chuyển (ví dụ xanh lá của "Chờ lấy hàng") — suffix "Đã thanh toán" KHÔNG đổi màu nhãn, khác với suffix "GHN từ chối xác nhận" (vốn ép màu đỏ).
4. Đơn Khách trả ship (COD), hoặc đơn Shop trả nhưng CHƯA được duyệt (`pending_review`/`rejected`/chưa có `paymentApprovalStatus`) → không có suffix "Đã thanh toán".

## System Flow (dự kiến — chưa code)

1. Cần thêm 1 nhánh trong `rowStatus(order)`, đặt SAU 2 nhánh hiện có (`pending_review`/`rejected`) và TRƯỚC `return base`:
   ```js
   if (order.paymentApprovalStatus === 'confirmed') {
     return { ...base, label: `${base.label} · Đã thanh toán` }
   }
   ```
2. Khác với 2 nhánh hiện có, nhánh này KHÔNG giới hạn `order.status === 'pending'` — vì theo `approveOrderPayment()`, tại thời điểm `paymentApprovalStatus` chuyển `'confirmed'`, `status` đã không còn là `'pending'` nữa (đã tự đẩy sang `'pickup'`).
3. Cần loại trừ `status === 'cancelled'` khỏi nhánh này (đơn huỷ đã có suffix riêng "· Chờ hoàn tiền" — xem SHOP-ORDER-47) để tránh 2 suffix chồng nhau trên cùng 1 dòng — đặt nhánh `cancelled` TRƯỚC nhánh `confirmed` mới (đúng thứ tự `rowStatus()` hiện tại đã làm vậy).
4. Không đổi `paymentBadge()` (SHOP-ORDER-44) — 2 chỗ hiển thị độc lập, suffix này chỉ bổ sung thêm ở cột Trạng thái, không thay thế badge cột Phí ship.

## Acceptance Criteria (dự kiến)

**AC1:** Đơn Shop trả ship, `paymentApprovalStatus === 'confirmed'`, `status` bất kỳ (trừ `cancelled`) → nhãn cột Trạng thái có thêm hậu tố "· Đã thanh toán".

**AC2:** Màu nhãn giữ nguyên màu gốc của trạng thái vận chuyển hiện tại — suffix không ép màu riêng.

**AC3:** Đơn đã huỷ (`status === 'cancelled'`) dù `paymentApprovalStatus === 'confirmed'` → vẫn chỉ hiện "Đã huỷ · Chờ hoàn tiền" (SHOP-ORDER-47), KHÔNG cộng thêm "· Đã thanh toán" (tránh 2 suffix cùng lúc).

**AC4:** Đơn Khách trả ship (COD), hoặc Shop trả nhưng chưa được duyệt — không có suffix "Đã thanh toán".

## Notes

- **GAP — CHƯA CÓ TRONG CODE.** Phát hiện khi rà soát lại toàn bộ các suffix hiện có của `rowStatus()` — hiện tại hệ thống chỉ báo 2 trạng thái "xấu/đang chờ" (chờ duyệt, bị từ chối) mà không có trạng thái "tốt" (đã duyệt) tương ứng ở CÙNG MỘT cột, dù thông tin đó đã tồn tại sẵn trong dữ liệu (`paymentApprovalStatus`).
- Cần xác nhận lại với Product: suffix "Đã thanh toán" có nên hiển thị MÃI MÃI trong suốt vòng đời đơn (kể cả khi đã "Giao thành công"), hay chỉ hiển thị tạm thời ngay sau khi duyệt (ví dụ chỉ ở trạng thái "Chờ lấy hàng") rồi tự ẩn đi sau đó vì không còn cần thiết nhắc nữa.
- Xem SHOP-ORDER-44 (badge cột Phí ship, đã có sẵn, không đổi), SHOP-ORDER-48 (2 suffix "chờ/từ chối" đã có), SHOP-ORDER-47 (suffix "Chờ hoàn tiền" cho đơn huỷ) để biết đầy đủ các nhãn liên quan ở cùng khu vực.
