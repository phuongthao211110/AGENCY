---
id: SHOP-ORDER-14
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Cài đặt đơn hàng - In đơn hàng: Thư tài liệu chỉ in được sau khi đại lý dispatch qua 247Express

## User Story

Là chủ shop gửi đơn Thư tài liệu, tôi muốn biết rõ khi nào mình in được vận đơn thật, để không in nhầm 1 mã tạm không dùng để theo dõi được — vì đơn Thư phải qua đại lý trước khi tới tay 247Express, không giống đơn Hàng hoá gửi trực tiếp.

## Bối cảnh / Vấn đề

Lúc shop tạo đơn Thư (`CreateLetterDrawer`), đơn ở trạng thái `dispatchStatus: 'pending_agency'`, `carrierCode: null` — **chưa có mã vận đơn thật của 247Express**. `trackingCode` sinh lúc này chỉ là mã tạm do hệ thống tự đặt (`SHOP_${timestamp}`), không phải mã carrier dùng để quét/theo dõi. Mã vận đơn thật chỉ sinh ra khi **đại lý dispatch** đơn qua 247Express (`carrierCode` đổi từ `null` → `'247EXPRESS'`).

In barcode/QR ngay lúc tạo đơn (như đơn Hàng hoá) sẽ in ra 1 mã vô nghĩa với carrier — không quét theo dõi được gì.

## User Flow

1. Vào "Cài đặt đơn hàng" → tab "In đơn hàng" → sub-tab "Thư tài liệu".
2. Đọc ghi chú đầu trang: chỉ in được **sau khi đại lý đã đẩy đơn qua 247Express**.
3. Cấu hình giống hệt sub-tab Hàng hoá (khổ giấy, checklist, preview) — áp dụng cho lúc in vận đơn thật, tức sau khi đại lý dispatch.

## System Flow

1. Đã cân nhắc và **loại bỏ** phương án ban đầu "Phiếu giao nhận" (không barcode/QR, chỉ có Mã đơn shop làm định danh, dùng làm giấy kèm hàng khi shop chuyển vật lý cho đại lý) — quyết định cuối: **không làm phiếu giao nhận**, chỉ cho in vận đơn thật, đúng ở giai đoạn đã dispatch.
2. Cấu trúc component `LetterHandoverSettings` cuối cùng **giống hệt** `PrintKindSettings` (bên Hàng hoá) — cùng "Mã vận đơn + Barcode + QR code" luôn hiển thị, cùng cơ chế `PaperSizePicker`, cùng preview có barcode+QR — chỉ khác:
   - Ghi chú đầu trang giải thích rõ điều kiện thời điểm (chỉ dùng được sau dispatch).
   - Label toggle đổi thành "Tự động in khi đại lý đẩy đơn qua 247" (khớp đúng trigger thật, không phải "khi tạo đơn").
   - Không có "Tiền thu hộ (COD)" và "Kích thước đơn hàng" trong checklist — 2 field này không áp dụng cho đơn Thư (COD hardcode `= 0`, không có field kích thước trong `CreateLetterDrawer`).
   - Preview dùng mã mẫu dạng `247EX00987654` (mã 247Express thật) thay vì `SPX...` (mã Hàng hoá).

## Acceptance Criteria

**AC1:** Đầu sub-tab "Thư tài liệu" hiện rõ ghi chú: chỉ in được sau khi đại lý đã dispatch qua 247Express, trước đó chưa có gì để in.

**AC2:** Checklist "Thông tin hiển thị trên phiếu in" ở sub-tab Thư tài liệu **không có** mục "Tiền thu hộ (COD)" và "Kích thước đơn hàng" — khác với sub-tab Hàng hoá.

**AC3:** "Mã vận đơn + Barcode + QR code" và "Người nhận" luôn hiển thị, không tắt được — giống Hàng hoá.

**AC4:** Preview hiện đúng barcode + QR, mã mẫu dạng `247EX...` (không phải `SPX...`).

**AC5:** Nhãn toggle tự động in là "Tự động in khi đại lý đẩy đơn qua 247" (không phải "khi tạo đơn").

**AC6:** Cấu hình độc lập hoàn toàn với sub-tab "Hàng hoá".

## Notes

- **Đã tách thành các story con nhỏ hơn theo yêu cầu trực tiếp** — story này giữ vai trò tổng quan + toàn bộ bối cảnh/lịch sử quyết định, chi tiết cấu hình nằm ở:
  - [SHOP-ORDER-15](./in-don-hang-chon-kho-giay.md) — Chọn khổ giấy in (dùng chung với Hàng hoá)
  - [SHOP-ORDER-16](./in-don-hang-tu-dong-in.md) — Tự động in vận đơn
  - [SHOP-ORDER-17](./in-don-hang-barcode-qr.md) — Mã vận đơn: Barcode + QR code
  - [SHOP-ORDER-18](./in-don-hang-xem-truoc-phieu-in.md) — Xem trước phiếu in
  - [SHOP-ORDER-20](./in-don-hang-thong-tin-hien-thi-thu.md) — Thông tin hiển thị trên phiếu in (Thư tài liệu)
- **Lịch sử quyết định (đổi hướng 2 lần trong cùng story):**
  1. Ban đầu: cấu trúc giống Hàng hoá (có barcode/QR ngay lúc tạo đơn) — **sai**, vì chưa có mã vận đơn thật.
  2. Đổi sang "Phiếu giao nhận" (không barcode/QR, chỉ Mã đơn shop + thông tin cơ bản, dùng kèm hàng khi giao cho đại lý) — theo yêu cầu trực tiếp sau khi phát hiện vấn đề #1.
  3. **Quyết định cuối:** bỏ hẳn phiếu giao nhận, quay lại cấu trúc như Hàng hoá (barcode+QR) nhưng **gắn điều kiện thời điểm rõ ràng** — chỉ dùng được sau khi đại lý dispatch, không phải lúc tạo đơn.
- Đây là ví dụ cụ thể cho việc verify field theo đúng code thật (`CreateLetterDrawer`, `handleCreate()` trong `Orders.tsx`) trước khi thiết kế UI — nếu chỉ suy diễn theo cảm tính (đơn Thư "giống" đơn Hàng hoá nhưng đơn giản hơn) sẽ ra 1 tính năng sai hoàn toàn về nghiệp vụ.
- Liên quan trực tiếp tới luồng dispatch bên Agency Admin (`dispatchOrderToCarrier()`) — đó là nơi thật sự sinh `carrierCode`/mã vận đơn 247Express, story này chỉ dừng ở phía Web Shop.
