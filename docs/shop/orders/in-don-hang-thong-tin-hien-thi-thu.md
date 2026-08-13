---
id: SHOP-ORDER-20
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Cài đặt đơn hàng - In đơn hàng: Thông tin hiển thị trên phiếu in (Thư tài liệu)

## User Story

Là chủ shop gửi đơn Thư tài liệu, tôi muốn chọn đúng những thông tin cần in lên vận đơn thật (sau khi đại lý đã dispatch qua 247Express), không bị lẫn field chỉ áp dụng cho đơn Hàng hoá.

## User Flow

1. Ở sub-tab "Thư tài liệu" của "In đơn hàng", thấy danh sách 9 mục (ít hơn Hàng hoá 2 mục).
2. 2 mục đầu (Mã vận đơn+Barcode+QR, Người nhận) luôn có tick, không tắt được — giống Hàng hoá.
3. Tick/bỏ tick 7 mục còn lại.

## System Flow

1. Checklist khác Hàng hoá ([SHOP-ORDER-19](./in-don-hang-thong-tin-hien-thi-hang-hoa.md)) ở đúng 2 điểm — bỏ hẳn, không phải ẩn/mặc định tắt:
   - **Không có "Tiền thu hộ (COD)"** — đơn Thư `cod` hardcode `= 0` trong `CreateLetterDrawer`, không có khái niệm thu hộ.
   - **Không có "Kích thước đơn hàng"** — không có field kích thước nào trong luồng tạo đơn Thư thật (hardcode `10x10x10cm` cố định, không cho nhập).
2. 9 mục còn lại: Mã vận đơn+Barcode+QR (luôn), Người nhận (luôn), Người gửi (mặc định on), Nội dung thư, tài liệu (mặc định on), Khối lượng đơn hàng (mặc định off), Phí ship (mặc định on), Ghi chú đơn hàng (mặc định on), Mã đơn shop (mặc định off), Tên/logo shop (mặc định off).
3. State riêng (`letterShowSender`, `letterShowProduct`, `letterShowWeight`, `letterShowShipFee`, `letterShowNote`, `letterShowShopCode`, `letterShowShopLogo`) — độc lập hoàn toàn với Hàng hoá.
4. **Toàn bộ checklist này chỉ có ý nghĩa SAU KHI đại lý đã dispatch đơn qua 247Express** — trước đó chưa có mã vận đơn thật nên chưa in được gì (xem [SHOP-ORDER-14](./in-don-hang-thu-tai-lieu.md) cho đầy đủ bối cảnh + lịch sử quyết định).

## Acceptance Criteria

**AC1:** Hiện đúng 9 mục, KHÔNG có "Tiền thu hộ (COD)" và "Kích thước đơn hàng" (khác Hàng hoá).

**AC2:** 2 mục đầu luôn tick, không tắt được.

**AC3:** Mặc định khi mở tab lần đầu: Người gửi/Nội dung thư/Phí ship/Ghi chú = tick sẵn; Khối lượng/Mã đơn shop/Tên logo shop = chưa tick (khác Hàng hoá — Khối lượng Hàng hoá mặc định ON).

**AC4:** Tick/bỏ tick từng mục → phản ánh ngay trong preview ([SHOP-ORDER-18](./in-don-hang-xem-truoc-phieu-in.md)).

## Notes

- Tách từ [SHOP-ORDER-14](./in-don-hang-thu-tai-lieu.md).
- 2 field bị loại (COD, Kích thước) đã verify trực tiếp trong code `CreateLetterDrawer` (`Orders.tsx`), không suy diễn cảm tính — đây là bài học lặp lại nhiều lần trong quá trình làm story Thư tài liệu (xem lịch sử quyết định ở SHOP-ORDER-14).
