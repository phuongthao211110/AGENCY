---
id: SHOP-ORDER-52
jiraKey: AGENCY-1324
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Chi tiết đơn hàng: Trạng thái thanh toán và lịch sử thao tác

## User Story

Là chủ shop xem chi tiết 1 đơn hàng, tôi muốn thấy trạng thái thanh toán hiện tại NGAY trong tab Thông tin, và xem lại được toàn bộ lịch sử các lần tôi/hệ thống thao tác liên quan tới thanh toán (chọn kênh, xác nhận, tạo mã lại...) trong 1 tab riêng, để truy vết lại chính xác chuyện gì đã xảy ra với đơn này.

## User Flow

1. **Trạng thái hiện tại** (tab "Thông tin"): dòng "Thanh toán" + "Trạng thái {kênh}" + "Đại lý xác nhận lúc"/"Lý do đại lý từ chối" — mô tả ĐẦY ĐỦ ở SHOP-ORDER-45, không lặp lại ở đây.
2. **Lịch sử thao tác**: mở tab **"Lịch sử thao tác"** (1 trong 3 tab của Chi tiết đơn, cạnh "Thông tin đơn" và "Lịch sử trạng thái") → bảng liệt kê mọi hành động đã xảy ra với đơn, nhóm theo ngày, mỗi dòng gồm: Thời gian / Người thao tác / Hành động / Nội dung cũ / Nội dung mới.
3. Các hành động LIÊN QUAN THANH TOÁN xuất hiện trong bảng này cùng với mọi hành động khác (sửa thông tin, huỷ đơn...), KHÔNG có tab/bộ lọc riêng chỉ cho thanh toán:
   - "Chọn hình thức thanh toán phí ship" (ghi lúc tạo đơn, nếu chọn online).
   - "Xác nhận đã thanh toán" (khi modal tự xác nhận hoặc Shop xác nhận lại trong Chi tiết đơn).
   - "Thanh toán thất bại (hết hạn mã)" (khi đếm ngược 15 phút hết mà chưa xác nhận).
   - "Tạo mã thanh toán mới" (khi bấm "Tạo QR mới"/"Tạo mã mới" để thử lại).
4. Mỗi dòng lịch sử là bản ghi TĨNH tại thời điểm xảy ra — sửa/xoá dữ liệu đơn sau đó không làm đổi lại các dòng lịch sử cũ.

## System Flow

1. 3 tab trong `OrderDetailDrawer`: `'info'` → "Thông tin đơn", `'status'` → "Lịch sử trạng thái", `'action'` → **"Lịch sử thao tác"**.
2. Tab "Lịch sử thao tác" (`activeTab === 'action'`) render bảng từ `actionDates`/`actionByDate` — nhóm `order.actionHistory` (mảng `ActionHistoryItem[]`) theo ngày, mới nhất lên đầu. Đây là bảng DÙNG CHUNG cho MỌI loại hành động, không riêng thanh toán.
3. Các dòng lịch sử LIÊN QUAN THANH TOÁN được ghi bởi nhiều hàm khác nhau, tại nhiều thời điểm:
   - Lúc tạo đơn (`buildOrder()` trong `CreateOrderDrawer`): seed sẵn "Chọn hình thức thanh toán phí ship" nếu `paymentMethod !== 'cash'`.
   - `handlePaymentPaidInDetail()`: ghi "Xác nhận đã thanh toán" qua `appendActionHistory(...)`.
   - `handlePaymentExpireInDetail()`: ghi "Thanh toán thất bại (hết hạn mã)".
   - `handlePaymentRetryInDetail()`: ghi "Tạo mã thanh toán mới".
4. `appendActionHistory(orderId, operator, action, oldContent, newContent)` (trong `orderStore.ts`) là điểm ghi DUY NHẤT cho mọi hành động SAU KHI đơn đã tồn tại — mỗi lần gọi `unshift` 1 entry mới vào đầu `order.actionHistory`, không sửa/xoá entry cũ.
5. Dòng trạng thái ở tab "Thông tin" (SHOP-ORDER-45) đọc TRỰC TIẾP field hiện tại của `order` (`paymentApprovalStatus`, `paymentApprovedAt`...) — KHÔNG đọc từ `actionHistory`; 2 nguồn dữ liệu độc lập nhau dù mô tả cùng 1 câu chuyện.

## Acceptance Criteria

**AC1:** Tab "Lịch sử thao tác" liệt kê đủ các hành động liên quan thanh toán đã xảy ra với đơn, đúng thứ tự thời gian (mới nhất lên đầu), nhóm theo ngày.

**AC2:** Mỗi dòng lịch sử hiện đủ: Thời gian, Người thao tác, Hành động, Nội dung cũ, Nội dung mới.

**AC3:** "Xác nhận đã thanh toán" xuất hiện đúng 1 lần mỗi khi Shop/modal xác nhận thanh toán thành công (kể cả xác nhận lại sau khi bị từ chối).

**AC4:** "Tạo mã thanh toán mới" xuất hiện đúng 1 lần mỗi khi bấm "Tạo QR mới"/"Tạo mã mới".

**AC5:** "Thanh toán thất bại (hết hạn mã)" xuất hiện đúng 1 lần mỗi khi đếm ngược 15 phút hết mà chưa xác nhận.

**AC6:** Lịch sử là bản ghi TĨNH — các dòng cũ không tự đổi nội dung khi trạng thái hiện tại của đơn thay đổi sau đó.

**AC7:** Tab "Lịch sử thao tác" không có bộ lọc/tab con riêng cho thanh toán — hiển thị chung với mọi loại hành động khác của đơn (sửa thông tin, huỷ đơn, v.v.).

## Notes

- Đây là TÍNH NĂNG ĐÃ CÓ SẴN (tab "Lịch sử thao tác" là tab dùng chung cho toàn bộ hành động của đơn, không phải tính năng mới riêng cho thanh toán) — story này tách ra để khớp đúng phạm vi ticket Jira AGENCY-1324, tập trung vào GÓC NHÌN thanh toán của tab này.
- Phần "Trạng thái thanh toán" (hiện tại, không phải lịch sử) đã có story riêng chi tiết hơn — xem SHOP-ORDER-45. Story này KHÔNG lặp lại nội dung đó, chỉ bổ sung phần "Lịch sử thao tác".
- Xem thêm SHOP-ORDER-42 (modal) và SHOP-ORDER-43 (gate giữ đơn) để biết chính xác các hàm nào ghi log vào lúc nào.
