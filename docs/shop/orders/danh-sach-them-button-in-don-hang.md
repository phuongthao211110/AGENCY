---
id: SHOP-ORDER-26
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Đơn hàng - Danh sách đơn hàng: Thêm nút In vận đơn

## User Story

Là chủ shop, tôi muốn có nút "In đơn hàng" ngay trong danh sách đơn (từng dòng, và khi chọn nhiều đơn cùng lúc), để in vận đơn của đúng đơn hàng thật đó — không phải mở modal "Cài đặt đơn hàng" vốn chỉ có phần xem trước bằng dữ liệu mẫu, không in được đơn thật nào.

## User Flow

1. Ở danh sách đơn hàng, mỗi dòng đủ điều kiện in (đã có mã vận đơn thật) có nút xanh "In đơn hàng" — nằm trên nút "Huỷ đơn" (nếu có), cùng cột "Người tạo"
2. Bấm nút → popup "In đơn hàng — {mã vận đơn}" mở ra, hiện phiếu in với đúng dữ liệu THẬT của đơn đó, áp đúng bộ cài đặt đã cấu hình trong Cài đặt đơn hàng cho loại đơn tương ứng (khổ giấy, checklist field hiển thị); bộ chọn khổ giấy (A5/52x70mm/80x80mm) khởi tạo từ cài đặt đã lưu, đổi trong popup chỉ có hiệu lực cho lần in đó
3. Bấm "In đơn hàng" trong popup → gọi lệnh in trình duyệt thật (`window.print()`), CSS in ẩn hết phần chrome/nút bấm, chỉ in đúng khu vực phiếu
4. Tick chọn nhiều đơn đủ điều kiện in (checkbox đầu dòng) → thanh "Đã chọn N" nổi ở đáy màn hình hiện thêm nút "In đơn hàng" (bên trái nút "Huỷ đơn") → in hàng loạt, mỗi đơn 1 phiếu riêng trong cùng 1 lần in
5. Đơn Thư tài liệu CHƯA được đại lý dispatch cho nhà vận chuyển → KHÔNG có nút này (chưa có mã vận đơn thật để in, đúng quy tắc đã có ở [SHOP-ORDER-14](./in-don-hang-thu-tai-lieu.md))

## System Flow

1. Thêm helper `isPrintable(order)` cùng cách tiếp cận với `isCancellable` ([SHOP-ORDER-21](./confirm-huy-don.md)): `sendKind === 'goods' || dispatchStatus === 'dispatched'` — Hàng hoá luôn true, Thư chỉ true sau khi đã dispatch
2. Nút quick-action per-row: thêm vào `TRow`, cùng khối chứa "Hoàn hàng"/"Huỷ đơn" (cột "Người tạo") — chỉ render khi có prop `onPrint`, đặt TRÊN nút "Huỷ đơn" theo đúng thứ tự ưu tiên hành động (in trước, huỷ sau)
3. Nút bulk: thêm vào thanh "Đã chọn N" đã có sẵn từ SHOP-ORDER-21 — 1 nút thứ 2 (`eligiblePrint = selectedOrders.filter(isPrintable)`), đặt bên trái nút "Huỷ đơn" trong cùng thanh
4. `PrintOrderModal({ orders, onClose })` (component mới) — dùng chung cho cả 2 lối vào (mảng 1 hoặc nhiều phần tử), render 1 "vé in" (ticket) riêng cho từng order với ĐÚNG field thật có trên `Order`: `senderName`/`senderPhone`, `trackingCode` (barcode+QR mock), `receiverName`/`receiverPhone`/`receiverAddress`, sản phẩm (qua `orderProducts` lookup — cùng nguồn cosmetic đã dùng sẵn ở `TRow`), `weight` (đổi ra kg), `cod` (chỉ hiện khi `sendKind === 'goods' && cod > 0`), `fee`
5. `PrintOrderModal` đọc cấu hình in từ `printSettings[order.sendKind]` (`printSettingsStore.ts`, persist qua localStorage key `ghn_print_settings_v1`) — với mỗi đơn trong danh sách in, áp đúng bộ cấu hình theo loại: `printSettings.letter` cho đơn Thư, `printSettings.goods` cho đơn Hàng hoá, cho phép in hàng loạt lẫn 2 loại cùng lúc, mỗi đơn áp đúng bộ checklist của loại đó. Khổ giấy khi mở popup lấy từ `printSettings[orders[0]?.sendKind ?? 'goods'].paperSize` — đúng khổ đã cấu hình cho loại đơn đầu tiên, không còn cứng 80x80mm; người dùng vẫn đổi được khổ giấy ngay trong phiên in đó nhưng thay đổi KHÔNG ghi ngược lại store. Xem chi tiết tích hợp ở [SHOP-ORDER-30](./in-don-hang-thu-cau-hinh-ap-dung-van-don-that.md)
6. In thật bằng `window.print()` thật sự — có `<style>{'@media print {...}'}</style>` ẩn toàn bộ trang trừ `#print-order-area`, nên khi bấm in chỉ ra đúng phần phiếu, không in cả trang danh sách phía sau

## Acceptance Criteria

**AC1:** Mỗi dòng đơn Hàng hoá trong danh sách luôn có nút "In đơn hàng" (có mã vận đơn thật ngay từ lúc tạo).

**AC2:** Đơn Thư tài liệu CHƯA dispatch (`dispatchStatus !== 'dispatched'`) → KHÔNG có nút "In đơn hàng".

**AC3:** Đơn Thư tài liệu ĐÃ dispatch → có nút "In đơn hàng" giống đơn Hàng hoá.

**AC4:** Bấm nút → popup hiện đúng dữ liệu THẬT của đơn đó (mã vận đơn, người gửi/nhận, sản phẩm, khối lượng, phí ship) — không phải dữ liệu mẫu.

**AC5:** Đơn Hàng hoá có COD > 0 → phiếu hiện dòng "Thu hộ (COD)"; đơn Thư hoặc COD = 0 → không hiện dòng này.

**AC6:** Popup có bộ chọn khổ giấy (A5/52x70mm/80x80mm), khởi tạo từ khổ đã cấu hình trong Cài đặt đơn hàng cho loại đơn của đơn đầu tiên trong batch; đổi khổ trong popup → độ rộng phiếu đổi theo ngay, nhưng không cập nhật ngược lại cài đặt mặc định.

**AC7:** Tick chọn nhiều đơn → thanh "Đã chọn N" hiện thêm nút "In đơn hàng" nếu có ít nhất 1 đơn đủ điều kiện in trong lựa chọn; mở popup hiện đủ từng phiếu cho mọi đơn hợp lệ đã chọn.

**AC8:** Trong lựa chọn hàng loạt, đơn không đủ điều kiện in (VD Thư chưa dispatch) tự động bị loại khỏi batch in — không chặn hay báo lỗi cho cả thao tác.

**AC9:** Bấm nút "In đơn hàng" trong popup → gọi `window.print()` thật, chỉ in đúng khu vực phiếu (không in cả popup/nút bấm/trang nền).

## Notes

- **ĐÃ IMPLEMENT đầy đủ theo spec** — nút quick-action per-row + nút bulk trên thanh "Đã chọn N" + `PrintOrderModal` với `window.print()` thật. Đã verify bằng Playwright: nút ẩn/hiện đúng theo `isPrintable`, popup hiện đúng dữ liệu thật (không phải mock), in hàng loạt hiện đủ từng phiếu.
- **Cập nhật kiến trúc (xem [SHOP-ORDER-30](./in-don-hang-thu-cau-hinh-ap-dung-van-don-that.md)):** Claim cũ "CỐ Ý KHÔNG đọc" và "state chưa persist" đã LỖI THỜI kể từ khi `printSettingsStore.ts` được giới thiệu. `PrintOrderModal` hiện ĐÃ đọc `printSettings[order.sendKind]` (persist qua localStorage) để áp khổ giấy mặc định và hiển thị/ẩn field theo checklist — cùng nguồn với `OrderSettingsModal`. Claim cũ ghi nhận đúng quyết định tại thời điểm SHOP-ORDER-26 implement (integration là hạng mục chưa làm khi đó) và được giữ lại để bảo tồn lịch sử.
- Sau khi tích hợp `printSettingsStore` ([SHOP-ORDER-30](./in-don-hang-thu-cau-hinh-ap-dung-van-don-that.md)), phiếu in thật áp theo checklist đã cấu hình — KHÔNG còn in cố định 1 bộ field. Ngoại lệ còn lại: `showSize` ("Kích thước đơn hàng") không áp dụng được lên phiếu in thật vì `Order` không có field kích thước — chỉ ảnh hưởng preview mẫu trong Cài đặt đơn hàng. Với đơn Thư, checklist không có `showSize` và `showCOD` (2 field này không tồn tại trong `LetterHandoverSettings`, không phải chỉ ẩn). Field "Sản phẩm" vẫn là lookup cosmetic qua `orderProducts`, không phải field thật lưu trên `Order`.
- Tái sử dụng đúng 2 pattern UI đã có sẵn thay vì tạo mới: nút quick-action per-row (giống "Huỷ đơn", [SHOP-ORDER-21](./confirm-huy-don.md)) và thanh bulk-action nổi đáy màn hình (cũng SHOP-ORDER-21) — chỉ thêm 1 action mới vào 2 chỗ đã tồn tại, không xây UI riêng.
- `isPrintable(order)` cố ý tách biệt với `isCancellable(order)` dù cùng cách tiếp cận (theo trạng thái đơn) — 2 điều kiện khác nhau hoàn toàn: huỷ được khi CHƯA dispatch (`status === 'pending'`), in được khi Hàng hoá luôn true hoặc Thư ĐÃ dispatch — không dùng chung 1 hàm dù pattern code giống nhau.
- Đây là lần ĐẦU TIÊN toàn bộ tính năng "In đơn hàng" (SHOP-ORDER-13 đến 25, vốn chỉ dừng ở cấu hình + preview mẫu) có 1 hành động in THẬT gắn với đơn hàng thật trong danh sách — trước story này, `window.print()` chưa từng được gọi ở đâu trong toàn bộ luồng in.
