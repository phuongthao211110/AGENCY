---
id: SHOP-ORDER-61
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Báo cáo dòng tiền: Cột "Lịch sử thanh toán"

## Bối cảnh

Tách từ [SHOP-ORDER-60](./bao-cao-dong-tien-thanh-toan-cho-dai-ly.md) (nút "Thanh toán cho đại lý") — phần cột PHẢI của modal "Thanh toán hạn mức đã dùng", liệt kê mọi lần Shop đã khai thanh toán tiền mặt trước đó, để Shop tra cứu lại lô nào đã khai, khai lúc nào, gồm những đơn nào.

## User Story

Là chủ shop, tôi muốn xem lại lịch sử các lần đã khai "đã chuyển tiền mặt" cho đại lý (mã, thời gian, tổng tiền, danh sách đơn), để tra cứu lại khi cần đối chiếu mà không phải nhớ hoặc hỏi lại đại lý.

## User Flow

1. Trong modal "Thanh toán hạn mức đã dùng" (mở từ nút "Thanh toán cho đại lý", xem SHOP-ORDER-60), cột PHẢI **"Lịch sử thanh toán"** liệt kê MỌI lần Shop đã bấm "Xác nhận thanh toán" trước đó (mới nhất lên đầu).
2. Mỗi card: chip xanh "✓ Đã gửi yêu cầu thanh toán", "Mã thanh toán: {code}" (kèm icon copy), "Thời gian: dd/mm/yyyy hh:mm:ss", "Tổng tiền: Xđ", nút "Xem chi tiết".
3. Bấm icon copy cạnh "Mã thanh toán" → copy mã vào clipboard.
4. Bấm "Xem chi tiết" → hiện danh sách mã vận đơn thuộc lô đó.
5. Vừa khai xong 1 lượt mới (SHOP-ORDER-60) → card mới xuất hiện NGAY đầu danh sách, không cần đóng/mở lại modal.

## System Flow

1. `loadRemittanceBatches(shopId)` (`orderStore.ts`) đọc `CashRemittanceBatch[]` từ `localStorage` key `ghn_cash_remittance_batches_v1` (ghi bởi `declareCashRemittance()`, xem SHOP-ORDER-60), lọc đúng `shopId`, sắp xếp `declaredAt` giảm dần.
2. Mỗi card đọc trực tiếp từ 1 `CashRemittanceBatch`: `{ id, declaredAt, totalAmount, orderIds }` — ĐÂY LÀ LỊCH SỬ LỜI KHAI của Shop, KHÁC với lịch sử Agency đã duyệt (không đọc `paymentApprovalStatus` ở đây, chỉ hiện đúng những gì Shop đã khai, không phản ánh Agency đã duyệt hay chưa).
3. Icon copy: `navigator.clipboard.writeText(batch.id).catch(() => {})`.
4. `handleViewDetail(batch)`: tra `trackingCode` từng `orderId` trong `batch.orderIds` (qua `loadOrders()`) rồi `window.alert` liệt kê — PROTOTYPE THUẦN, không mở modal/trang riêng.
5. State `justDeclared` ở `RemittanceModal` (component cha, SHOP-ORDER-60) khi có giá trị thì được PREPEND vào đầu danh sách batches hiển thị ở cột này — card mới hiện ngay, không cần re-fetch/đóng-mở modal.

## Acceptance Criteria

**AC1:** Cột "Lịch sử thanh toán" liệt kê đúng toàn bộ các lần Shop đã khai trước đó, mới nhất lên đầu; shop chưa khai lần nào → danh sách rỗng (không lỗi).

**AC2:** Mỗi card hiện đúng mã thanh toán, thời gian, tổng tiền khớp đúng `CashRemittanceBatch` tương ứng.

**AC3:** Bấm icon copy → mã thanh toán được copy vào clipboard, không phát sinh lỗi console (kể cả khi trình duyệt từ chối quyền clipboard).

**AC4:** Bấm "Xem chi tiết" → hiện đúng danh sách mã vận đơn thuộc lô đó, không thiếu/thừa đơn nào.

**AC5:** Sau khi khai 1 lượt mới ở cột trái (SHOP-ORDER-60), card tương ứng xuất hiện NGAY ở đầu cột "Lịch sử thanh toán" trong cùng modal, không cần đóng/mở lại.

## Notes

- **Bug đã phát hiện qua UAT và sửa (phát hiện khi làm SHOP-SETTINGS-3, Tem QR)**: icon copy "Mã thanh toán" dùng `try { navigator.clipboard.writeText(batch.id) } catch { ... }` — `writeText()` trả về `Promise`, lỗi quyền clipboard bị từ chối xảy ra BẤT ĐỒNG BỘ nên `try/catch` đồng bộ không bắt được, rơi thành unhandled promise rejection. Đã sửa thành `navigator.clipboard.writeText(batch.id).catch(() => {})`.
- **PROTOTYPE THUẦN**: "Xem chi tiết" chỉ `window.alert` liệt kê mã vận đơn — không có modal/trang chi tiết riêng, không xuất file.
- Dữ liệu này ĐỘC LẬP với trạng thái Agency đã duyệt hay chưa — 1 batch đã khai xong vẫn hiện ở đây dù Agency sau đó duyệt, từ chối, hay chưa xử lý gì; muốn biết Agency đã duyệt chưa phải xem lại bảng chính (SHOP-ORDER-55, cột "Đã thanh toán"/"Chưa thanh toán"), không phải ở đây.
- Xem [SHOP-ORDER-60](./bao-cao-dong-tien-thanh-toan-cho-dai-ly.md) (nơi tạo ra các `CashRemittanceBatch` mà cột này đọc lại), [SHOP-ORDER-55](./bao-cao-dong-tien.md) (bảng chính).
