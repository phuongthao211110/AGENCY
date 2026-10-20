---
id: SHOP-ORDER-50
jiraKey: AGENCY-1320
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Tạo đơn hàng: Phương thức thanh toán chuyển khoản ngân hàng

## User Story

Là chủ shop chọn thanh toán phí ship qua chuyển khoản ngân hàng, tôi muốn thấy đầy đủ thông tin tài khoản nhận tiền, số tiền, và nội dung chuyển khoản cần ghi đúng, để chuyển tiền chính xác và GHN có thể đối chiếu được giao dịch.

## User Flow

1. Shop chọn pill "Chuyển khoản ngân hàng" (xem SHOP-ORDER-41) rồi bấm "Tạo đơn"/"Lưu thay đổi" → modal `OnlinePaymentModal` mở với `method="bank_transfer"`.
2. Modal hiện dòng "Mã đơn tham chiếu" ở đầu (dùng chung với MoMo — xem SHOP-ORDER-49).
3. Ngay dưới là bảng 5 dòng: **Ngân hàng** / **Số tài khoản** / **Chủ tài khoản** / **Số tiền** / **Nội dung chuyển khoản**.
4. Dòng "Số tiền" và "Nội dung chuyển khoản" in đậm, màu xanh `#3B82F6` để Shop dễ nhận ra 2 thông tin quan trọng nhất cần copy đúng.
5. "Nội dung chuyển khoản" = chính "Mã đơn tham chiếu" ở trên — Shop cần ghi ĐÚNG chuỗi này vào ô nội dung khi chuyển khoản thật, để sau này đối chiếu được (xem AGA-PAYMENT-1, Agency Admin).
6. Phần đếm ngược/tự-xác-nhận/hết hạn dùng chung với MoMo — xem SHOP-ORDER-42.

## System Flow

1. `method === 'bank_transfer'` trong `OnlinePaymentModal` → render `<BankTransferInfo amount={amount} orderRef={orderRef} />`, bọc trong `<div style={{ opacity: expired ? 0.4 : 1 }}>`.
2. `BankTransferInfo({ amount, orderRef })`: render 5 dòng cố định từ `DEMO_BANK_INFO` (`bankName: 'Vietcombank'`, `accountNumber: '0071000123456'`, `accountHolder: 'CTY TNHH GHN AGENCY DEMO'`) + `amount` (dòng "Số tiền") + `orderRef` (dòng "Nội dung chuyển khoản") — 2 dòng cuối có `highlight: true`, đổi màu chữ sang `C_LINK` (`#3B82F6`).
3. Mỗi dòng là 1 cặp label/value trong khung viền `C_BORDER`, các dòng cách nhau bởi `borderTop`.

## Acceptance Criteria

**AC1:** Modal "Thanh toán phí ship qua chuyển khoản ngân hàng" hiện đủ 5 dòng: Ngân hàng / Số tài khoản / Chủ tài khoản / Số tiền / Nội dung chuyển khoản.

**AC2:** Dòng "Số tiền" và "Nội dung chuyển khoản" in đậm, màu `#3B82F6`; 3 dòng còn lại màu chữ thường.

**AC3:** Giá trị "Nội dung chuyển khoản" đúng bằng "Mã đơn tham chiếu" hiển thị ở đầu modal (cùng giá trị `orderRef`).

**AC4:** Toàn bộ bảng mờ đi (opacity 0.4) khi hết hạn 15 phút — đồng bộ với nhánh MoMo (mờ QR, opacity 0.3).

**AC5:** Toàn bộ cơ chế đếm ngược/tự-xác-nhận sau 3–6 giây/hết hạn áp dụng giống hệt MoMo — xem SHOP-ORDER-42 để biết chi tiết, không lặp lại ở đây.

## Notes

- Tách riêng khỏi SHOP-ORDER-42 (cơ chế dùng chung) để mô tả đúng phần hiển thị ĐẶC THÙ của kênh Chuyển khoản ngân hàng — khớp đúng ticket Jira AGENCY-1320.
- **PROTOTYPE THUẦN** — `DEMO_BANK_INFO` là dữ liệu giả lập cố định, không phải tài khoản ngân hàng thật của GHN.
- Xem SHOP-ORDER-49 cho nội dung tương ứng của kênh MoMo.
