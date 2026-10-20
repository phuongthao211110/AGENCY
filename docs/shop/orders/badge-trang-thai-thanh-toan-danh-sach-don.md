---
id: SHOP-ORDER-44
jiraKey: AGENCY-1322
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Badge trạng thái thanh toán ở danh sách đơn (ĐÃ BỎ — dồn sang Báo cáo dòng tiền)

> ⚠️ **ĐÃ BỊ BỎ KHỎI DANH SÁCH ĐƠN** — Badge mô tả ở story này (nằm trong cột "Phí ship" của danh sách Đơn hàng) đã được GỠ BỎ. Lý do: dễ gây hiểu lầm khi lẫn với các cột khác, và lặp lại thông tin đã có ở trang riêng "Báo cáo dòng tiền" (xem SHOP-ORDER-55) — nơi này hiển thị đầy đủ hơn (nhóm theo ngày, lọc theo trạng thái) và không bị bó hẹp trong 1 cột nhỏ của bảng. Nội dung dưới đây giữ lại để biết hàm `paymentBadge()` hoạt động ra sao — hàm này VẪN CÒN dùng ở Chi tiết đơn (xem SHOP-ORDER-45), chỉ không còn render ở danh sách.

## User Story (lịch sử — không còn áp dụng ở danh sách đơn)

Là chủ shop nhìn vào danh sách đơn hàng, tôi muốn thấy rõ trạng thái thanh toán phí ship của MỌI đơn Shop tự trả — nhu cầu này nay được đáp ứng qua trang riêng "Báo cáo dòng tiền" (SHOP-ORDER-55), không còn qua badge trong danh sách đơn nữa.

## Chi tiết hàm `paymentBadge()` (vẫn còn dùng — chỉ đổi NƠI dùng)

1. `paymentBadge(order)`:
   ```js
   function paymentBadge(order: Order): { label: string; color: string; bg: string } | null {
     const methodLabel = order.paymentMethod === 'bank_transfer' ? 'chuyển khoản'
       : order.paymentMethod === 'momo' ? 'MoMo'
       : order.paymentMethod === 'cash' ? 'tiền mặt'
       : null
     if (!methodLabel) return null
     if (order.paymentApprovalStatus === 'confirmed') return { label: `Đã nhận ${methodLabel}`, color: '#00C853', bg: '#D9F7E5' }
     if (order.paymentApprovalStatus === 'rejected') return { label: 'Đại lý từ chối xác nhận', color: '#EF4444', bg: '#FEE2E2' }
     if (order.paymentApprovalStatus === 'pending_review') return { label: `Chờ đại lý xác nhận ${methodLabel}`, color: '#3B82F6', bg: '#EFF6FF' }
     if (order.paymentStatus === 'pending') return { label: `Chờ thanh toán ${methodLabel}`, color: '#F59E0B', bg: '#FEF3C7' }
     if (order.paymentStatus === 'failed') return { label: 'Thanh toán thất bại', color: '#EF4444', bg: '#FEE2E2' }
     return null
   }
   ```
2. `TRow` (danh sách đơn) **KHÔNG còn gọi hàm này nữa** — biến `payBadge` và block render badge trong cột "Phí ship" đã bị xoá khỏi `Orders.tsx`.
3. Hàm `paymentBadge()` vẫn được gọi ở **Chi tiết đơn** (`OrderDetailDrawer`, dòng "Trạng thái {kênh}" trong tab Thông tin — xem SHOP-ORDER-45) và ở trang **Báo cáo dòng tiền** mới (`CashFlowReport.tsx` — tuy trang này tự định nghĩa `StatusBadge` riêng theo cùng logic, không gọi thẳng `paymentBadge()`, vì cách hiển thị hơi khác: badge trong danh sách ngày, không gắn với tên kênh trong label).

## Acceptance Criteria (đã lỗi thời — xem SHOP-ORDER-55 cho AC còn áp dụng)

**AC cũ (KHÔNG còn áp dụng)**: Mọi AC liên quan "badge hiện ở cột Phí ship trong danh sách đơn" đã lỗi thời — cột "Phí ship" giờ chỉ còn 2 dòng: Số tiền + "Shop trả"/"Khách trả", không còn badge nào bên dưới.

## Notes

- **Thay đổi**: bỏ badge khỏi danh sách đơn theo yêu cầu dọn giao diện — tránh trùng lặp thông tin với trang "Báo cáo dòng tiền" mới (SHOP-ORDER-55), nơi hiển thị đầy đủ và rõ ràng hơn.
- Xem SHOP-ORDER-55 để biết đầy đủ UI/AC của trang thay thế.
- Xem SHOP-ORDER-48 để biết nhãn TRẠNG THÁI DÒNG ("Đơn nháp · Chờ GHN xác nhận"...) — đây là nhãn KHÁC, nằm ở cột "Mã vận đơn"/trạng thái vận chuyển, KHÔNG bị ảnh hưởng bởi thay đổi này (vẫn còn trong danh sách đơn như cũ, dù hiện nay hiếm khi kích hoạt — xem ghi chú legacy ở SHOP-ORDER-48).
