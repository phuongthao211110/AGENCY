---
id: SHOP-ORDER-38
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - In vận đơn: Tách kiện theo sản phẩm

## User Story

Là chủ shop có đơn hàng nhiều sản phẩm (ví dụ đơn gồm 2 loại hàng), tôi muốn bật 1 lựa chọn DUY NHẤT để tách bản in thành nhiều thẻ vận đơn riêng — mỗi sản phẩm 1 kiện — rồi bấm thẳng khổ giấy là in ngay, để dán mã lên từng thùng khi đóng gói mà không cần tạo đơn mới thật trong hệ thống và không phải thao tác qua nhiều bước.

## User Flow

1. Mở modal "In vận đơn" (nút In nhanh ở 1 dòng trong danh sách, hoặc chọn nhiều đơn rồi bấm "In vận đơn" — xem [SHOP-ORDER-26](./danh-sach-them-button-in-don-hang.md) / [SHOP-ORDER-27](./chi-tiet-them-button-in-don-hang.md)).
2. Dòng đầu modal luôn hiện "Vui lòng chọn khổ giấy để in vận đơn".
3. Nếu trong batch sắp in có ít nhất 1 đơn có ≥2 sản phẩm, modal hiện thêm 1 checkbox DUY NHẤT "Mỗi phiếu in chỉ có 1 sản phẩm" (kèm mô tả "Khi bật, mỗi sản phẩm sẽ được in trên một phiếu in vận đơn riêng.") — áp dụng chung cho TOÀN BỘ đơn đủ điều kiện trong batch, không có toggle riêng theo từng đơn.
4. Bật checkbox → vùng xem trước cập nhật ngay: mọi đơn ≥2 sản phẩm trong batch đều nở thành N thẻ ("Kiện 1/N", "Kiện 2/N"...), mỗi thẻ hiện đúng 1 sản phẩm tương ứng + khối lượng/COD/phí đã chia đều theo số kiện; thẻ có thêm nhãn cam ghi "Kiện {i}/{N}". Đơn chỉ có 1 sản phẩm không bị ảnh hưởng.
5. Tắt checkbox → mọi thẻ đã tách gộp lại thành 1, thông tin trở về nguyên như ban đầu.
6. Bấm thẳng 1 trong 3 nút khổ giấy ("In khổ A5" / "In khổ 52 × 70 mm" / "In khổ 80 × 80 mm") → in LUÔN đúng số thẻ đang thấy trong preview tại thời điểm đó (bao gồm cả các kiện đã tách nếu checkbox đang bật) — không còn bước "chọn khổ giấy" rồi bấm thêm nút "In" riêng.

## System Flow

1. `splitEvenly(total: number, parts: number): number[]` — hàm module-scope trong `src/platforms/shop/pages/Orders.tsx`, khai báo ngay trước `function PrintOrderModal`: chia 1 số nguyên thành `parts` phần, tổng luôn bằng đúng `total` — phần dư gán cho các phần ĐẦU (tránh lỗi làm tròn kiểu 250.000÷3 → 3×83.333 = 249.999 ≠ 250.000).
2. `type PrintUnit` — module-scope, cùng file: đại diện cho 1 "thẻ in thực tế"; field: `key: string, order: Order, trackingCode: string, kienLabel: string | null, productLine: string | null, weightGram: number, cod: number, fee: number`.
3. `splitAllProducts: boolean` (dòng 4089) — state cục bộ DUY NHẤT trong `PrintOrderModal`, mặc định `false`, reset mỗi lần mở modal, KHÔNG persist qua `printSettingsStore` hoặc `localStorage`. Thay thế hoàn toàn `Set<string>` theo từng đơn của bản trước.
4. `multiProductOrders = orders.filter(o => (orderProducts[o.id]?.length ?? 1) > 1)` (dòng 4108) — chỉ dùng để quyết định CÓ HIỆN checkbox hay không (ẩn khi không đơn nào đủ điều kiện), không còn dùng để render danh sách toggle riêng từng đơn.
5. `printUnits: PrintUnit[]` (dòng 4110-4126) = `orders.flatMap(order => ...)`: đơn có ≤1 sản phẩm HOẶC `!splitAllProducts` → 1 unit, `trackingCode` gốc, `kienLabel: null`; đơn có ≥2 sản phẩm VÀ `splitAllProducts === true` → N units, mỗi unit: `trackingCode = "${order.trackingCode}-K${i+1}"`, `kienLabel = "Kiện ${i+1}/${n}"`, `productLine = products[i]`, `weightGram/cod/fee` = phần tử tương ứng từ `splitEvenly`.
6. Toàn bộ phần render thẻ in dùng `printUnits.map(unit => ...)` (dòng 4193+) — `unit.order` cho field không đổi theo kiện (người gửi, người nhận, ghi chú, mã đơn shop, cfg `sendKind`); `unit.trackingCode / productLine / weightGram / cod / fee` cho phần số liệu đổi theo kiện; render thêm dòng nhãn cam `unit.kienLabel` khi khác `null`.
7. Header modal dùng `printUnits.length` thay vì `orders.length` (dòng 4148) — ví dụ bật tách 1 đơn 2 sản phẩm trong batch 3 đơn → header "In 4 đơn hàng".
8. `handlePrintWithSize(size: string)` (dòng 4094-4097): `setPaperSize(size)` rồi gọi `window.print()` sau 2 lần `requestAnimationFrame` lồng nhau — đợi React re-render xong `previewWidth` mới (đổi theo `paperSize`) trước khi in, tránh in nhầm khổ giấy cũ do `setState` bất đồng bộ. Gắn trực tiếp vào `onClick` của mỗi nút trong `PAPER_SIZES.map(...)` (dòng 4176-4187) — không còn `PaperSizePicker` (chọn rồi chờ bấm nút "In" riêng) và không còn nút "In đơn hàng"/"In N đơn" ở cuối modal.
9. Barcode/QR trên thẻ tách kiện dùng `unit.trackingCode` (đã có hậu tố `-K{i}`) — xem [SHOP-ORDER-28](./in-don-hang-ma-van-don-barcode-qr-tren-mau-in.md).

## Acceptance Criteria

**AC1:** Checkbox "Mỗi phiếu in chỉ có 1 sản phẩm" chỉ hiện trong modal In vận đơn khi có ≥1 đơn trong batch sắp in có ≥2 sản phẩm — không hiện khi tất cả đơn đều chỉ có 1 sản phẩm.

**AC2:** Checkbox là 1 lựa chọn DUY NHẤT áp dụng cho TOÀN BỘ đơn đủ điều kiện (≥2 sản phẩm) trong batch — không có toggle riêng theo từng đơn, không có cách bật tách kiện cho đơn A mà giữ nguyên đơn B trong cùng 1 lượt in.

**AC3:** Checkbox mặc định TẮT mỗi khi mở modal — không persist giữa các lần mở.

**AC4:** Bật checkbox khi batch có đơn N sản phẩm → modal hiện đúng N thẻ riêng cho đơn đó, mỗi thẻ có nhãn cam "Kiện {i}/{N}", mã vận đơn dạng `{mã gốc}-K{i}`, đúng 1 sản phẩm tương ứng của kiện đó; đơn chỉ 1 sản phẩm trong cùng batch không bị tách.

**AC5:** Khối lượng/COD/phí ship được chia đều theo số kiện — tổng các kiện bằng đúng giá trị đơn gốc (không sai lệch do làm tròn: phần dư gán cho kiện đầu).

**AC6:** Tắt checkbox lại → mọi thẻ đã tách được gộp về 1 thẻ gốc ngay, mã vận đơn trở về mã gốc (không có hậu tố `-K{i}`).

**AC7:** Header modal hiển thị đúng tổng số thẻ sẽ in (tính cả kiện đã tách), không cố định theo số đơn ban đầu.

**AC8:** Tách kiện KHÔNG tạo đơn mới thật trong hệ thống, KHÔNG thay đổi dữ liệu đơn gốc trong danh sách, KHÔNG ảnh hưởng đối soát hoặc COD — chỉ ảnh hưởng bản in lần đó.

**AC9:** Mô tả "Khi bật, mỗi sản phẩm sẽ được in trên một phiếu in vận đơn riêng." hiện ngay dưới tiêu đề checkbox.

**AC10:** Bấm 1 trong 3 nút khổ giấy ("In khổ A5" / "In khổ 52 × 70 mm" / "In khổ 80 × 80 mm") kích hoạt in NGAY LẬP TỨC với đúng trạng thái tách kiện (bật/tắt) và đúng khổ giấy vừa bấm tại thời điểm đó — không cần thao tác xác nhận nào thêm, không còn nút "In đơn hàng"/"In N đơn" riêng ở cuối modal.

## Notes

- **Redesign từ bản trước**: bản gốc dùng danh sách toggle RIÊNG TỪNG ĐƠN ("{mã đơn} — {N} sản phẩm" + Toggle) và khổ giấy là 1 picker chọn-rồi-bấm-nút-"In"-riêng. Bản này đơn giản hoá thành 1 checkbox global (khớp thiết kế Figma) + 3 nút khổ giấy bấm-là-in-luôn — đổi lại mất khả năng tách kiện CHỌN LỌC từng đơn trong 1 lượt in nhiều đơn (giờ là tất-cả-hoặc-không-gì cho mọi đơn ≥2 sản phẩm cùng batch).
- Tính năng chỉ chia đều vì data model `orderProducts` là `Record<string, string[]>` — mảng chuỗi hiển thị, không có field số liệu riêng từng sản phẩm (khối lượng, giá). Nếu 2 sản phẩm nặng khác nhau thực tế (VD áo 0,1kg + giày 2kg), bản in chia đều sẽ sai tỷ lệ thật — trade-off đã được xác nhận với người dùng khi được hỏi rõ (giữ nguyên từ bản trước).
- Checkbox không persist là cố ý: nhiều đơn có nhiều sản phẩm vẫn đóng chung 1 thùng (không cần tách kiện), nên không mặc định bật trong Cài đặt đơn hàng để tránh tách nhầm mỗi lần in.
- Bug fix đi kèm trước đó: bug cắt nội dung khi in nhiều đơn ([SHOP-ORDER-39](./fix-noi-dung-bi-cat-khi-in-nhieu-don.md)) đã fix cùng phiên với bản gốc — nếu không, tách 2+ kiện sẽ ngay lập tức bị compound bug đó cắt mất kiện sau kiện đầu tiên.
- Không liên quan tới card "In vận đơn" ở "Cài đặt đơn hàng" ([SHOP-ORDER-22](./in-don-hang-hang-hoa-in-van-don.md)) — đó là màn CẤU HÌNH mặc định (khổ giấy mặc định + tự động in), hoàn toàn tách biệt khỏi modal hành động nhanh "In vận đơn" mà story này mô tả.
- Liên quan: [SHOP-ORDER-28](./in-don-hang-ma-van-don-barcode-qr-tren-mau-in.md) (mã vận đơn/barcode/QR trên mẫu in).
