---
id: AGA-ORDER-3
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Danh sách: Thêm phân loại hàng hoá

## User Story

Là Agency Admin (Đại lý), tôi muốn thấy được **đơn nào là Hàng hoá, đơn nào là Thư/bưu phẩm** ngay trong danh sách "Đơn hàng", để phân biệt nhanh loại đơn khi xử lý số lượng lớn từ nhiều shop.

## User Flow

1. Agency Admin vào "Đơn hàng"
2. Ô "Mã đơn hàng" của mỗi dòng hiện 3 dòng xếp dọc: mã vận đơn, trạng thái, rồi đến **icon + tag loại đơn** (**Hàng hoá** hoặc **Thư**)
3. Áp dụng cho mọi tab trạng thái (Chờ xử lý, Đơn nháp, Chờ bàn giao...)

## System Flow

1. `AgencyOrders.tsx` → `SRow` (dòng trong danh sách) hiện icon + text loại đơn ngay trong ô "Mã đơn hàng" (dòng thứ 3, dưới mã vận đơn và trạng thái) — KHÔNG còn là cột `THead` riêng như bản đầu.
2. Icon + màu: `sendKind === 'letter'` → icon `MailOutlined` + text "Thư, tài liệu"; ngược lại → icon `InboxOutlined` + text "Hàng hoá" — màu chữ dùng chung `C_TEXT_SECONDARY`, không còn nền pill riêng như bản đầu.
3. Web Shop cũng dùng đúng cách trình bày này (gộp vào ô mã đơn) — 2 platform giờ ĐỒNG NHẤT cách hiển thị, khác với ghi chú cũ ("khác Web Shop, Agency Admin tách cột riêng").

## Acceptance Criteria

**AC1:** Ô "Mã đơn hàng" của mỗi dòng có đủ 3 dòng: mã vận đơn, trạng thái, và icon + text loại đơn — không có cột "Loại đơn" tách riêng nào khác trong header.

**AC2:** `sendKind = 'letter'` → icon thư + text "Thư, tài liệu". `sendKind = 'goods'` (hoặc không có giá trị) → icon hộp + text "Hàng hoá".

**AC3:** Hiển thị đúng ở toàn bộ tab trạng thái, không chỉ riêng "Chờ xử lý".

**AC4:** Không ảnh hưởng vị trí/nội dung các cột khác (Shop, Khách hàng, Sản phẩm, Khối lượng, COD, Phí ship, GTB - TT, Người tạo, Thao tác).

## Notes

- **Đính chính:** bản đầu của story này mô tả "Loại đơn" là 1 cột `THead` riêng (100px, giữa "Mã đơn hàng" và "Shop"), có nền pill riêng (`#EDE9FE`/`#F3F4F6`). Sau đó danh sách được redesign lại theo 1 tham chiếu UI mới — cột riêng này bị BỎ, gộp vào ô "Mã đơn hàng" làm dòng thứ 3 (giống hệt cách Web Shop đã làm) để đồng bộ giao diện 2 platform và rút gọn số cột trên 1 dòng. Đã cập nhật lại User Flow/System Flow/AC ở trên cho khớp thực tế hiện tại.
- Cùng khái niệm `sendKind` đã áp dụng ở Thiết lập NVC (`AGA-CARRIER-12/13/14`) và danh sách đơn hàng Web Shop (`SHOP-ORDER-5`) — nhiều nơi dùng chung 1 field, giờ đồng nhất luôn cách trình bày (gộp vào ô mã đơn) thay vì mỗi nơi 1 kiểu như trước.
- Muốn LỌC theo loại đơn (không chỉ hiển thị) → xem story riêng "Thêm filter phân loại hàng".
