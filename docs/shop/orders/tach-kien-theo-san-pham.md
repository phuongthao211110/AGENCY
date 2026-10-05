---
id: SHOP-ORDER-38
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - In đơn hàng: Tách kiện theo sản phẩm

## User Story

Là chủ shop có đơn hàng nhiều sản phẩm (ví dụ đơn trên 20kg gồm 2 loại hàng), tôi muốn tách bản in thành nhiều thẻ vận đơn riêng — mỗi sản phẩm 1 kiện — để dán mã lên từng thùng khi đóng gói, mà không cần tạo đơn mới thật trong hệ thống.

## User Flow

1. Mở modal "In đơn hàng" (nút In nhanh ở 1 dòng trong danh sách, hoặc chọn nhiều đơn rồi bấm "In vận đơn" — xem [SHOP-ORDER-26](./danh-sach-them-button-in-don-hang.md) / [SHOP-ORDER-27](./chi-tiet-them-button-in-don-hang.md))
2. Nếu trong batch sắp in có ít nhất 1 đơn có ≥2 sản phẩm, modal hiện thêm khối "Tách kiện theo sản phẩm" ngay trên vùng xem trước thẻ in
3. Mỗi đơn đủ điều kiện có 1 dòng "{mã đơn} — {N} sản phẩm" kèm toggle bật/tắt riêng; có dòng ghi chú giải thích "chỉ ảnh hưởng bản in, không tạo đơn mới"
4. Bật toggle cho 1 đơn → vùng xem trước và đếm số đơn cập nhật ngay: đơn đó nở thành N thẻ ("Kiện 1/N", "Kiện 2/N"...), mỗi thẻ hiện đúng 1 sản phẩm tương ứng + khối lượng/COD/phí đã chia đều theo số kiện; thẻ có thêm nhãn cam ghi "Kiện {i}/{N}"
5. Tắt toggle → thẻ gộp lại thành 1, thông tin trở về nguyên như ban đầu
6. Bấm "In" → in đúng số thẻ đang thấy trong preview (bao gồm cả các kiện đã tách)

## System Flow

1. `splitEvenly(total: number, parts: number): number[]` — hàm module-scope trong `src/platforms/shop/pages/Orders.tsx`, khai báo ngay trước `function PrintOrderModal`: chia 1 số nguyên thành `parts` phần, tổng luôn bằng đúng `total` — phần dư gán cho các phần ĐẦU (tránh lỗi làm tròn kiểu 250.000÷3 → 3×83.333 = 249.999 ≠ 250.000)
2. `type PrintUnit` — module-scope, cùng file: đại diện cho 1 "thẻ in thực tế"; field: `key: string, order: Order, trackingCode: string, kienLabel: string | null, productLine: string | null, weightGram: number, cod: number, fee: number`
3. `splitOrderIds: Set<string>` — state cục bộ trong `PrintOrderModal`, mặc định `new Set()`, reset mỗi lần mở modal, KHÔNG persist qua `printSettingsStore` hoặc `localStorage`
4. `multiProductOrders = orders.filter(o => (orderProducts[o.id]?.length ?? 1) > 1)` — danh sách đơn đủ điều kiện hiện toggle (có ≥2 sản phẩm trong `orderProducts`)
5. Khối UI "Tách kiện theo sản phẩm" render ngay trên `#print-order-area`, chỉ khi `multiProductOrders.length > 0`; với mỗi order đủ điều kiện render 1 dòng toggle riêng
6. `printUnits: PrintUnit[]` = `orders.flatMap(o => ...)`: đơn có ≤1 sản phẩm HOẶC toggle chưa bật (`!splitOrderIds.has(o.id)`) → 1 unit, `trackingCode` gốc, `kienLabel: null`; đơn có ≥2 sản phẩm VÀ toggle đang bật → N units, mỗi unit: `trackingCode = "${o.trackingCode}-K${i+1}"`, `kienLabel = "Kiện ${i+1}/${N}"`, `productLine = orderProducts[o.id][i]`, `weightGram/cod/fee` = phần tử tương ứng từ `splitEvenly`
7. Toàn bộ phần render thẻ in đổi từ `orders.map(order => ...)` sang `printUnits.map(unit => ...)` — dùng `unit.order` cho field không đổi theo kiện (người gửi, người nhận, ghi chú, mã đơn shop, cfg `sendKind`); dùng `unit.trackingCode / productLine / weightGram / cod / fee` cho phần số liệu đổi theo kiện; render thêm dòng nhãn cam `unit.kienLabel` khi khác `null`
8. Header modal và nút "In" dùng `printUnits.length` thay vì `orders.length` — ví dụ bật tách 1 đơn 2 sản phẩm trong batch 3 đơn → header "In 4 đơn hàng"
9. Barcode/QR trên thẻ tách kiện dùng `unit.trackingCode` (đã có hậu tố `-K{i}`) — xem [SHOP-ORDER-28](./in-don-hang-ma-van-don-barcode-qr-tren-mau-in.md)

## Acceptance Criteria

**AC1:** Khối "Tách kiện theo sản phẩm" chỉ hiện trong modal In đơn hàng khi có ≥1 đơn trong batch sắp in có ≥2 sản phẩm — không hiện khi tất cả đơn đều chỉ có 1 sản phẩm.

**AC2:** Mỗi đơn đủ điều kiện có 1 toggle riêng kèm dòng "{mã đơn} — {N} sản phẩm"; bật/tắt từng đơn độc lập nhau — bật đơn này không ảnh hưởng đơn khác.

**AC3:** Toggle mặc định TẮT cho mọi đơn mỗi khi mở modal — không persist giữa các lần mở.

**AC4:** Bật toggle đơn có N sản phẩm → modal hiện đúng N thẻ riêng, mỗi thẻ có nhãn cam "Kiện {i}/{N}", mã vận đơn dạng `{mã gốc}-K{i}`, đúng 1 sản phẩm tương ứng của kiện đó.

**AC5:** Khối lượng/COD/phí ship được chia đều theo số kiện — tổng các kiện bằng đúng giá trị đơn gốc (không sai lệch do làm tròn: phần dư gán cho kiện đầu).

**AC6:** Tắt toggle lại → 1 thẻ gốc được khôi phục ngay, mã vận đơn trở về mã gốc (không có hậu tố `-K{i}`).

**AC7:** Header modal và nút "In" hiển thị đúng tổng số thẻ sẽ in (tính cả kiện đã tách), không cố định theo số đơn ban đầu.

**AC8:** Tách kiện KHÔNG tạo đơn mới thật trong hệ thống, KHÔNG thay đổi dữ liệu đơn gốc trong danh sách, KHÔNG ảnh hưởng đối soát hoặc COD — chỉ ảnh hưởng bản in lần đó.

**AC9:** Dòng ghi chú "chỉ ảnh hưởng bản in, không tạo đơn mới" hiện trong khối toggle.

## Notes

- Tính năng chỉ chia đều vì data model `orderProducts` là `Record<string, string[]>` — mảng chuỗi hiển thị, không có field số liệu riêng từng sản phẩm (khối lượng, giá). Nếu 2 sản phẩm nặng khác nhau thực tế (VD áo 0,1kg + giày 2kg), bản in chia đều sẽ sai tỷ lệ thật — trade-off đã được xác nhận với người dùng khi được hỏi rõ.
- Toggle không persist là cố ý: nhiều đơn có nhiều sản phẩm vẫn đóng chung 1 thùng (không cần tách kiện), nên không mặc định bật trong Cài đặt đơn hàng để tránh tách nhầm mỗi lần in.
- UAT bằng Playwright trên đơn GHN00123461 (2 sản phẩm: Quần Jean + Áo Polo, khối lượng 0,4kg, COD 175.000đ): bật toggle → ra đúng 2 thẻ "Kiện 1/2"/"Kiện 2/2", mã `-K1`/`-K2`, khối lượng 0,2kg/0,2kg, COD 87.500đ/87.500đ. Test thêm với khối lượng 22kg → chia đúng 11kg/11kg.
- Bug fix đồng thời: bug cắt nội dung khi in nhiều đơn ([SHOP-ORDER-39](./fix-noi-dung-bi-cat-khi-in-nhieu-don.md)) phải được fix cùng phiên — nếu không, tách 2+ kiện sẽ ngay lập tức bị compound bug đó cắt mất kiện sau kiện đầu tiên.
- Liên quan: [SHOP-ORDER-22](./in-don-hang-hang-hoa-in-van-don.md) (In vận đơn tổng quan), [SHOP-ORDER-28](./in-don-hang-ma-van-don-barcode-qr-tren-mau-in.md) (mã vận đơn/barcode/QR trên mẫu in).
