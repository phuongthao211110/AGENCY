---
id: SHOP-ORDER-12
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Cài đặt đơn hàng - Thông tin mặc định: tách theo loại đơn

## User Story

Là chủ shop, tôi muốn cấu hình thông tin mặc định riêng cho đơn Hàng hoá và đơn Thư tài liệu, vì 2 loại đơn có field khác nhau — cấu hình chung 1 form dễ gây nhầm lẫn khi field không áp dụng cho loại đơn đó vẫn hiện ra.

## User Flow

1. Vào "Cài đặt đơn hàng" → tab "Thông tin mặc định" (mặc định active).
2. Thấy 2 sub-tab: **Hàng hoá** / **Thư tài liệu** — mặc định ở Hàng hoá.
3. Chỉnh sửa các mặc định trong tab đang xem — mỗi tab có bộ giá trị độc lập, đổi tab không ảnh hưởng tab kia.
4. Mục "Trả hàng" (Địa chỉ trả hàng) hiện chung, không đổi theo tab — vì đây là 1 địa điểm vật lý, không phụ thuộc loại đơn.

## System Flow

1. Sub-tab bar 2 lựa chọn `defaultTab: 'goods' | 'letter'`, mỗi lựa chọn map tới component riêng: `DefaultInfoSettings` (goods) / `LetterDefaultSettings` (letter) — 2 component tách biệt, không dùng chung 1 component với nhiều nhánh `if` vì field khác nhau đủ nhiều.
2. **Tab Hàng hoá** giữ đủ 4 nhóm: Bên gửi (Ca lấy hàng), Sản phẩm (Khối lượng, Kích thước), Thông tin đơn hàng (Khai giá trị hàng, Giao/Trả 1 phần, Giao thất bại thu tiền, Ghi chú đơn hàng, Ghi chú xem hàng, Tự động yêu cầu giao lại), Dịch vụ (Phí ship, Thu ship khách hàng).
3. **Tab Thư tài liệu** bám sát đúng field thật có trong `CreateLetterDrawer` (luồng "Gửi thư, tài liệu") — không suy diễn từ Hàng hoá:
   - **Không có "Bên gửi/Ca lấy hàng"** — điểm lấy hàng suy ra từ hub 247Express của dịch vụ, shop không tự chọn ca.
   - **Không có "Kích thước"** — luồng thật hardcode `10x10x10cm`, không có field nhập.
   - **Không có "Khai giá trị hàng"/"Giao Trả 1 phần"/"Giao thất bại thu tiền"** (dạng toggle) — luồng thật hiện các dòng phí này nhưng đều hardcode `= 0`, không có checkbox bật/tắt tương ứng.
   - **Không có "Tự động yêu cầu giao lại"** — không có trong luồng thật.
   - **"Giá trị hàng"** ban đầu định thêm dạng input số nhưng đã **bỏ hẳn** theo yêu cầu trực tiếp — không áp dụng cho Thư.
   - **"Ghi chú đơn hàng"** đổi tên thành **"Nội dung thư, tài liệu"** — đúng theo field thật (`letterContent`).
   - **"Ghi chú xem hàng"** chỉ còn 2 option đơn giản: "Cho xem hàng" / "Không cho xem hàng" — bỏ chữ "không thử" (chỉ hợp lý với hàng hoá vật lý, không hợp với thư/tài liệu). Sửa tại nguồn `VIEW_GOODS_OPTIONS` — cùng constant cấp dữ liệu cho dropdown thật trong `CreateLetterDrawer`.
   - Giữ: Khối lượng đơn hàng (field thật có).

## Acceptance Criteria

**AC1:** Tab "Thông tin mặc định" hiện đúng 2 sub-tab Hàng hoá/Thư tài liệu, mặc định ở Hàng hoá.

**AC2:** Đổi giá trị ở tab Hàng hoá không ảnh hưởng giá trị đang lưu ở tab Thư tài liệu và ngược lại (2 bộ state độc lập).

**AC3:** Tab Thư tài liệu KHÔNG hiện: Ca lấy hàng, Kích thước đơn hàng, Khai giá trị hàng, Giao/Trả 1 phần, Giao thất bại thu tiền, Tự động yêu cầu giao lại.

**AC4:** Tab Thư tài liệu hiện đúng 3 field: Khối lượng đơn hàng (toggle), Nội dung thư, tài liệu (textarea), Ghi chú xem hàng (chỉ 2 option: Cho xem hàng / Không cho xem hàng).

**AC5:** Mục "Trả hàng" (Địa chỉ trả hàng) hiện 1 lần duy nhất, không đổi theo sub-tab đang chọn.

## Notes

- Tách ra từ [WS-ORDER-1](./cai-dat-don-hang-mac-dinh.md) (story gốc của toàn bộ popup "Cài đặt đơn hàng") — WS-ORDER-1 đã cập nhật ghi chú trỏ sang story này.
- Quyết định tách theo field thật (không phải rút gọn cảm tính) — mỗi lần nghi ngờ 1 field có áp dụng cho Thư không đều verify trực tiếp trong code `CreateLetterDrawer`, phát hiện nhiều field tưởng như dùng chung (Khai giá, Giao 1 phần...) thực ra chỉ hiện dòng phí tĩnh, không có control tương tác.
