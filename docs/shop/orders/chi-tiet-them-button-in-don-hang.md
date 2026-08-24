---
id: SHOP-ORDER-27
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Đơn hàng - Chi tiết đơn hàng: Thêm button In đơn hàng

## User Story

Là chủ shop đang xem chi tiết 1 đơn hàng, tôi muốn in vận đơn ngay tại đây, để không phải đóng chi tiết quay lại danh sách mới bấm được nút "In đơn hàng".

## User Flow

1. Mở chi tiết 1 đơn hàng đủ điều kiện in (đã có mã vận đơn thật — xem điều kiện ở [SHOP-ORDER-26](./danh-sach-them-button-in-don-hang.md))
2. Ở hàng nút hành động dưới cùng, thấy nút xanh "In đơn hàng" — đứng TRƯỚC "Huỷ đơn"/"Hoàn hàng"/"Cập nhật"
3. Bấm nút → popup "In đơn hàng — {mã vận đơn}" mở ra, giống hệt popup khi in từ danh sách, hiện đúng dữ liệu THẬT của đơn đang xem
4. Bấm "In đơn hàng" trong popup → gọi lệnh in trình duyệt thật, chỉ in đúng khu vực phiếu; bấm "Đóng" → chỉ đóng popup in, chi tiết đơn hàng vẫn mở nguyên
5. Đơn Thư tài liệu CHƯA dispatch, hoặc đơn đang ở trạng thái không hiện hàng nút hành động (case hoàn hàng đặc biệt) → KHÔNG có nút này, nhất quán với danh sách

## System Flow

1. `OrderDetailDrawer` (`Orders.tsx`) thêm state `printOpen` (boolean) — reset về `false` cùng lúc với các state per-order khác (`editMode`, `confirmingCancel`, `confirmingReturn`) trong `useEffect` theo dõi `order?.id`, để đổi qua đơn khác không giữ popup in của đơn cũ
2. Nút "In đơn hàng" thêm vào hàng nút hành động mặc định (nhánh không edit, không đang confirm huỷ/hoàn) — gate bằng đúng helper `isPrintable(order)` đã có từ [SHOP-ORDER-26](./danh-sach-them-button-in-don-hang.md), không viết điều kiện riêng
3. Vì cả hàng nút hành động nằm trong khối `{!isLetterReturnCase(order) && (...)}`, nút In đơn hàng tự động ẩn theo cùng điều kiện đó khi đơn thuộc case hoàn hàng đặc biệt — không cần thêm check riêng
4. `onClick={() => setPrintOpen(true)}`; render `{printOpen && order && <PrintOrderModal orders={[order]} onClose={() => setPrintOpen(false)} />}` ngay trong `OrderDetailDrawer` — TÁI SỬ DỤNG 100% component `PrintOrderModal` đã xây ở SHOP-ORDER-26, không viết thêm 1 modal in riêng cho chi tiết
5. `PrintOrderModal` nhận `orders={[order]}` (mảng 1 phần tử, giống lối in per-row ở danh sách) — cùng field thật, cùng bộ chọn khổ giấy, cùng cơ chế `window.print()` như khi in từ danh sách hoặc in hàng loạt

## Acceptance Criteria

**AC1:** Trong chi tiết đơn hàng (không ở edit mode, không đang confirm huỷ/hoàn), đơn đủ điều kiện in có nút "In đơn hàng" trong hàng nút hành động, đứng trước "Huỷ đơn"/"Hoàn hàng"/"Cập nhật".

**AC2:** Đơn Thư tài liệu CHƯA dispatch → không có nút "In đơn hàng" trong chi tiết, đúng theo `isPrintable` giống danh sách.

**AC3:** Bấm nút → mở đúng `PrintOrderModal` đã dùng ở danh sách, hiện dữ liệu THẬT của chính đơn đang xem chi tiết (không phải dữ liệu mẫu).

**AC4:** Đóng popup in (nút "Đóng" hoặc bấm ra ngoài) → chỉ đóng popup in, chi tiết đơn hàng vẫn mở nguyên, không đóng luôn cả drawer.

**AC5:** Chuyển sang xem chi tiết đơn khác → trạng thái đóng/mở popup in reset về đóng, không giữ lại trạng thái đang mở của đơn trước.

**AC6:** Đơn thuộc case không hiện hàng nút hành động (hoàn hàng đặc biệt) → cũng không có nút "In đơn hàng", nhất quán với việc ẩn toàn bộ hàng nút đó.

## Notes

- Tái sử dụng 100% `PrintOrderModal` và helper `isPrintable` đã xây ở [SHOP-ORDER-26](./danh-sach-them-button-in-don-hang.md) — story này chỉ thêm 1 lối vào thứ 3 (per-row, bulk, và giờ là chi tiết) vào đúng 1 component in đã có, không viết thêm logic in mới.
- Đã implement và verify bằng Playwright: mở chi tiết 1 đơn Hàng hoá đã dispatch → nút hiện đúng vị trí, bấm mở đúng popup với dữ liệu thật (mã vận đơn, người gửi/nhận, sản phẩm...) khớp với đơn đang xem.
- Không test lại nhánh "không đủ điều kiện in" bằng UI thật ở chi tiết vì mock data hiện không có đơn Thư nào ở trạng thái chưa dispatch để mở chi tiết — nhưng logic dùng chung 100% `isPrintable(order)` đã verify ở danh sách ([SHOP-ORDER-26](./danh-sach-them-button-in-don-hang.md) AC2), không phải điều kiện viết riêng cho chi tiết nên không có rủi ro lệch hành vi.
