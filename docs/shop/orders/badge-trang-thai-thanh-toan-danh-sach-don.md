---
id: SHOP-ORDER-44
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Badge trạng thái thanh toán ở danh sách đơn

## User Story

Là chủ shop nhìn vào danh sách đơn hàng, tôi muốn thấy rõ trạng thái thanh toán phí ship của các đơn đã chọn MoMo hoặc chuyển khoản, để biết đơn nào cần hoàn tất thanh toán và đơn nào đã xong.

## User Flow

1. Danh sách đơn hàng hiển thị từng dòng (`TRow`).
2. Cột "Phí ship" (phía phải): nếu đơn có `paymentMethod = 'momo'` hoặc `'bank_transfer'`, hiển thị badge nhỏ dưới dòng "Shop trả"/"Khách trả".
3. Badge màu sắc khác nhau theo `paymentStatus`.
4. Đơn `paymentMethod = 'cash'` hoặc không có field → không hiển thị badge.

## System Flow

1. `paymentBadge(order)` (dòng 1041–1048): trả về `null` nếu `paymentMethod` không phải `'momo'` hoặc `'bank_transfer'`.
2. Badge theo `paymentStatus`:
   - `'paid'` → `Đã thanh toán {MoMo/chuyển khoản}`, chữ `#00C853`, nền `#D9F7E5`.
   - `'pending'` → `Chờ thanh toán {MoMo/chuyển khoản}`, chữ `#F59E0B`, nền `#FEF3C7`.
   - `'failed'` → `Thanh toán thất bại`, chữ `#EF4444`, nền `#FEE2E2`.
3. `TRow` (dòng 3464, 3546–3553): `const payBadge = paymentBadge(order)` → nếu `payBadge` khác null, render `<span>` pill trong cột Phí ship (font 11px, padding `1px 6px`, borderRadius 8).

## Acceptance Criteria

**AC1:** Đơn `paymentMethod = 'momo'` + `paymentStatus = 'paid'` → badge xanh "Đã thanh toán MoMo" trong cột Phí ship.

**AC2:** Đơn `paymentMethod = 'bank_transfer'` + `paymentStatus = 'paid'` → badge xanh "Đã thanh toán chuyển khoản".

**AC3:** `paymentStatus = 'pending'` → badge vàng "Chờ thanh toán MoMo" hoặc "Chờ thanh toán chuyển khoản".

**AC4:** `paymentStatus = 'failed'` → badge đỏ "Thanh toán thất bại" (không kèm tên kênh).

**AC5:** Đơn `paymentMethod = 'cash'` hoặc không có `paymentMethod` → không hiển thị badge.

**AC6:** Badge nằm trong cột "Phí ship", dưới dòng "Shop trả"/"Khách trả", dạng pill nhỏ (font 11px). Không hiện ở cột khác.

## Notes

- **PROTOTYPE THUẦN** — badge phản ánh state mock data trong localStorage, không kết nối gateway thanh toán thật.
- Màu badge tái sử dụng bộ màu đã có sẵn trong file (không bịa mã màu mới): xanh `#D9F7E5`/`#00C853` (cùng badge TLHH), vàng `#FEF3C7`/`#F59E0B` (cùng `ROW_STATUS_STYLE.returning`), đỏ `#FEE2E2`/`#EF4444` (cùng `ROW_STATUS_STYLE.cancelled`).
- Text badge phân biệt "MoMo" và "chuyển khoản" theo đúng `paymentMethod` của từng đơn — không dùng nhãn chung cho cả 2.
