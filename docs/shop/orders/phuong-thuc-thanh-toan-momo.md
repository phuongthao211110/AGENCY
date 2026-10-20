---
id: SHOP-ORDER-49
jiraKey: AGENCY-1319
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Tạo đơn hàng: Phương thức thanh toán MoMo

## User Story

Là chủ shop chọn thanh toán phí ship qua MoMo, tôi muốn thấy ngay mã QR và số tiền cần chuyển một cách rõ ràng, dễ quét, để thanh toán nhanh mà không phải tìm thông tin ở đâu khác.

## User Flow

1. Shop chọn pill "Thanh toán qua MoMo" (xem SHOP-ORDER-41) rồi bấm "Tạo đơn"/"Lưu thay đổi" → modal `OnlinePaymentModal` mở với `method="momo"`.
2. Modal hiện dòng "Mã đơn tham chiếu" ở đầu — giá trị lấy từ `orderRef` (Mã đơn shop Shop tự nhập, hoặc mã tự sinh dạng `DH + 8 số cuối timestamp` nếu bỏ trống).
3. Ngay dưới là QR giả lập, kích thước 160×160px, nền trắng viền xám.
4. Dưới QR là số tiền phí ship hiển thị lớn, căn giữa (font ≥ 22px).
5. Phần đếm ngược/tự-xác-nhận/hết hạn dùng chung với chuyển khoản — xem SHOP-ORDER-42.

## System Flow

1. `method === 'momo'` trong `OnlinePaymentModal` → render:
   ```jsx
   <div style={{ alignSelf: 'center', padding: 8, border: `1px solid ${C_BORDER}`, borderRadius: 6 }}>
     <FakeMomoQr dim={!expired} />
   </div>
   <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '28px' }}>
     {amount.toLocaleString('vi-VN')}đ
   </div>
   ```
2. `FakeMomoQr`: component SVG 160×160, dựng từ 1 mảng `seed` cố định (0/1) để pattern KHÔNG đổi ngẫu nhiên mỗi lần re-render — chỉ đổi độ mờ (`dim` prop) khi hết hạn.
3. Dòng "Mã đơn tham chiếu" nằm NGOÀI nhánh `method === 'momo'` (dùng chung với chuyển khoản) — hiện `orderRef` truyền từ `CreateOrderDrawer`/`OrderDetailDrawer`.
4. `orderRef` khi tạo đơn mới = `shopCode.trim() || autoOrderRef` (`autoOrderRef` sinh 1 lần khi mở drawer, dạng `DH${Date.now().toString().slice(-8)}`); khi mở lại từ Chi tiết đơn = `order.trackingCode`.

## Acceptance Criteria

**AC1:** Modal "Thanh toán phí ship qua MoMo" hiện đúng QR giả lập 160×160px, viền xám, nền trắng.

**AC2:** Số tiền phí ship hiển thị căn giữa, font ≥ 22px, ngay dưới QR.

**AC3:** Dòng "Mã đơn tham chiếu" hiện phía trên QR, đúng giá trị `orderRef` (mã Shop nhập hoặc mã tự sinh).

**AC4:** QR không đổi hình mỗi lần component re-render (pattern cố định theo seed) — chỉ mờ đi (opacity 0.3) khi hết hạn 15 phút.

**AC5:** Toàn bộ cơ chế đếm ngược/tự-xác-nhận sau 3–6 giây/hết hạn áp dụng giống hệt chuyển khoản — xem SHOP-ORDER-42 để biết chi tiết, không lặp lại ở đây.

## Notes

- Tách riêng khỏi SHOP-ORDER-42 (cơ chế dùng chung) để mô tả đúng phần hiển thị ĐẶC THÙ của kênh MoMo — khớp đúng ticket Jira AGENCY-1319.
- **PROTOTYPE THUẦN** — `FakeMomoQr` là SVG tĩnh giả lập, không phải QR thật từ SDK MoMo, không quét được bằng app MoMo thật.
- Xem SHOP-ORDER-50 cho nội dung tương ứng của kênh Chuyển khoản ngân hàng.
