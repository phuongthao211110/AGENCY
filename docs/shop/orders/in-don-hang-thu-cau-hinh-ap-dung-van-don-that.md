---
id: SHOP-ORDER-30
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - In đơn hàng - Thư/tài liệu: Khổ giấy & checklist áp dụng lên vận đơn thật

## User Story

Là chủ shop, tôi muốn cấu hình khổ giấy và checklist thông tin hiển thị trong sub-tab "Thư tài liệu" của Cài đặt đơn hàng có hiệu lực thật sự khi tôi bấm in vận đơn đơn Thư, để không phải chỉnh lại mỗi lần in và phiếu in ra đúng với những gì tôi đã cài sẵn.

## User Flow

1. Vào "Cài đặt đơn hàng" → tab "In đơn hàng" → sub-tab "Thư tài liệu".
2. Chọn khổ giấy (VD A5), bật/tắt checklist: Người gửi, Nội dung, Khối lượng, Phí ship, Ghi chú đơn hàng, Mã đơn shop, Tên/logo shop.
3. Đóng Cài đặt đơn hàng.
4. Mở "In đơn hàng" cho bất kỳ đơn Thư nào đã dispatch (từ danh sách, chi tiết, hoặc in hàng loạt — xem [SHOP-ORDER-26](./danh-sach-them-button-in-don-hang.md)/[SHOP-ORDER-27](./chi-tiet-them-button-in-don-hang.md)):
   - Popup mở ra với khổ giấy đã cấu hình ở bước 2 (không còn luôn mặc định 80x80mm).
   - Phiếu in chỉ hiển thị đúng những field đã tick ở bước 2.
5. Có thể đổi khổ giấy ngay trong popup — thay đổi này chỉ có hiệu lực cho lần in đó, không đổi cài đặt mặc định trong Cài đặt đơn hàng.

## System Flow

1. **`printSettingsStore.ts`** (`src/mock-data/printSettingsStore.ts`) — lưu `{ goods: PrintKindConfig, letter: PrintKindConfig }` vào localStorage key `ghn_print_settings_v1`. Export `printSettings` (object sống, được load từ localStorage khi module khởi tạo) và `updatePrintSetting(kind, key, value)` (ghi vào object + persist ngay).
   - `PrintKindConfig` gồm: `autoPrint, paperSize, showSender, showProduct, showWeight, showSize, showCOD, showShipFee, showNote, showShopCode, showShopLogo`.
   - Default letter: `paperSize: '80x80', showSender: true, showProduct: true, showWeight: false, showSize: false, showCOD: false, showShipFee: true, showNote: true, showShopCode: false, showShopLogo: false`.

2. **`usePrintField` hook** (`Orders.tsx` dòng 236) — khởi tạo state từ `printSettings[kind][key]`, mỗi lần đổi gọi `updatePrintSetting(kind, key, value)` để ghi ngược lại store (persist). `OrderSettingsModal` dùng hook này cho toàn bộ field In đơn hàng của cả 2 loại — dòng 283–291 cho letter: `letterAutoPrint`, `letterPaperSize`, `letterShowSender`, `letterShowProduct`, `letterShowWeight`, `letterShowShipFee`, `letterShowNote`, `letterShowShopCode`, `letterShowShopLogo` — thay thế `useState` cục bộ thuần tuý vốn không persist.

3. **`PrintOrderModal`** (`Orders.tsx` dòng 3555) — khi render phiếu in:
   - Khổ giấy state: `printSettings[orders[0]?.sendKind ?? 'goods'].paperSize` (dòng 3557) — đơn đầu tiên quyết định khổ giấy ban đầu của popup, không còn hardcode `'80x80'`.
   - Với mỗi đơn trong `orders.map(order => ...)`: đọc `cfg = printSettings[order.sendKind]` (dòng 3603) — đơn Thư dùng `printSettings.letter`, đơn Hàng hoá dùng `printSettings.goods`; cho phép in hàng loạt lẫn 2 loại cùng lúc, mỗi đơn áp đúng bộ checklist của loại đó.
   - Field áp theo `cfg`: `showShopLogo` → tên shop thật (`currentShop.name`); `showShopCode && order.shopOrderCode` → "Mã đơn shop: {order.shopOrderCode}"; `showSender` → "Người gửi: ..."; `showProduct` → label "Nội dung" (Thư) hoặc "Sản phẩm" (Hàng hoá) + nội dung; `showWeight` → "Khối lượng: {kg}"; `isGoods && showCOD && order.cod > 0` → "Thu hộ (COD): ...đ"; `showShipFee` → "Phí ship: ...đ"; `showNote && order.orderNote` → "Ghi chú: {order.orderNote}".
   - Người nhận (`receiverName`, `receiverPhone`, `receiverAddress`) và mã vận đơn+barcode+QR luôn hiển thị, không gate bởi checklist.
   - Khổ giấy trong popup vẫn cho đổi tự do (dòng 3595) — thay đổi KHÔNG gọi `updatePrintSetting`, không ghi ngược lại store.

4. **`showSize` không áp dụng được lên phiếu in thật** — `PrintKindConfig.showSize` có trong interface nhưng `PrintOrderModal` không dùng đến, vì `Order` (orderStore.ts) không có field kích thước nào. `showSize` chỉ ảnh hưởng preview mẫu trong `OrderSettingsModal`. Với đơn Thư, `showSize` và `showCOD` thậm chí không có toggle UI tương ứng trong `LetterHandoverSettings` — 2 field này không tồn tại như lựa chọn với người dùng (chỉ là field trong interface, không phải chỉ ẩn đi).

5. **Preview mẫu và phiếu in thật cùng đọc 1 nguồn, render 2 giao diện độc lập** — `LetterHandoverSettings` (dòng 581) render preview với dữ liệu mẫu cố định (mã `VC00987654`, nội dung "Hợp đồng lao động", tên shop giả "SHOP THỜI TRANG MINH ANH"); `PrintOrderModal` render phiếu in với dữ liệu thật (`order.trackingCode`, `order.orderNote`, `currentShop.name`). Cả 2 cùng đọc `printSettings.letter` — nhưng đây là 2 khái niệm khác nhau: cấu hình mặc định vs thực thi in.

## Acceptance Criteria

**AC1:** Cấu hình khổ giấy A5 trong sub-tab Thư tài liệu → đóng Cài đặt → mở "In đơn hàng" cho 1 đơn Thư đã dispatch → popup mở với khổ giấy A5 (không phải 80x80mm).

**AC2:** Tắt tick "Người gửi" trong sub-tab Thư tài liệu → mở "In đơn hàng" cho 1 đơn Thư → phiếu in không có dòng "Người gửi: ...".

**AC3:** Bật tick "Tên/logo shop" → phiếu in Thư hiện tên shop thật (`currentShop.name`) ở đầu phiếu; tắt tick → không có dòng đó.

**AC4:** Bật tick "Ghi chú đơn hàng" → phiếu in hiện "Ghi chú: {order.orderNote}" nếu đơn có ghi chú; nếu `order.orderNote` rỗng/undefined → không hiện dòng Ghi chú dù tick đang bật.

**AC5:** Cài đặt persist qua reload trang — reload → Cài đặt đơn hàng vẫn hiện đúng các tick đã chọn; mở "In đơn hàng" → áp đúng cài đặt đó (không reset về mặc định).

**AC6:** In hàng loạt lẫn đơn Thư và đơn Hàng hoá → đơn Thư áp `printSettings.letter`, đơn Hàng hoá áp `printSettings.goods` — không bị lẫn cài đặt giữa 2 loại trong cùng batch.

**AC7:** Đổi khổ giấy trong popup "In đơn hàng" (VD từ A5 sang 80x80mm) → in xong, đóng popup → mở lại Cài đặt đơn hàng → khổ giấy sub-tab Thư vẫn là A5 (thay đổi trong popup không persist).

**AC8:** "Kích thước đơn hàng" (showSize) ảnh hưởng preview mẫu trong Cài đặt đơn hàng bình thường — nhưng không có dòng kích thước nào xuất hiện trên phiếu in đơn Thư thật.

## Notes

- **Thay đổi kiến trúc cốt lõi:** Trước story này, toàn bộ state "In đơn hàng" trong `OrderSettingsModal` là `useState` cục bộ thuần tuý — không persist, không share, đóng modal là mất. `PrintOrderModal` (SHOP-ORDER-26) vì thế "CỐ Ý KHÔNG đọc" state đó và dùng khổ giấy cứng 80x80mm. Story này document chính xác thay đổi: giới thiệu `printSettingsStore.ts` làm shared persisted store, nối `OrderSettingsModal` và `PrintOrderModal` qua cùng 1 nguồn.
- **autoPrint vẫn chưa có trigger thật** — toggle `autoPrint` giờ persist qua store nhưng không có bất kỳ đoạn code nào đọc nó để tự mở `PrintOrderModal` khi tạo đơn hay khi đại lý dispatch. Đây vẫn là preference UI thuần tuý (xem [SHOP-ORDER-16](./in-don-hang-tu-dong-in.md)). Không document behavior tự động in như đã hoạt động.
- **`showSize` là gap vĩnh viễn với thực tế `Order`** — interface `PrintKindConfig` có field `showSize` nhưng `PrintOrderModal` không đọc vì `Order` (orderStore.ts) không có field kích thước. Comment code tại `printSettingsStore.ts` dòng 12–14 ghi nhận rõ điều này. Với đơn Thư, `DEFAULT_LETTER.showSize = false` và không có toggle UI tương ứng trong `LetterHandoverSettings`.
- **File liên quan:** `src/mock-data/printSettingsStore.ts` (store mới), `src/platforms/shop/pages/Orders.tsx` dòng 236 (`usePrintField` hook), dòng 3555 (`PrintOrderModal`).
