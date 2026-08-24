---
id: AGA-ORDER-24
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Danh sách đơn hàng: Thêm filter phân loại hàng

## User Story

Là Agency Admin, tôi muốn lọc danh sách đơn hàng theo loại (Hàng hoá/Thư), để chỉ xem đúng loại đơn mình đang cần xử lý khi danh sách có nhiều đơn từ nhiều shop khác nhau, thay vì phải tự nhìn tag ở từng dòng.

## User Flow

1. Vào trang "Đơn hàng" → thanh filter (cạnh ô search và dropdown "Shop") có thêm dropdown "Loại đơn" (mặc định "Tất cả").
2. Chọn "Hàng hoá" → danh sách chỉ còn đơn Hàng hoá.
3. Chọn "Thư" → danh sách chỉ còn đơn Thư.
4. Filter kết hợp đúng với các filter khác đang có (Shop, search, tab trạng thái) — tất cả điều kiện cùng áp dụng.

## System Flow

1. Thêm state `filterSendKind: 'all' | 'goods' | 'letter'` (mặc định `'all'`).
2. Thêm dropdown UI cùng style với "Shop [Tất cả] ▾" đã có (label xám + value cam tách rời, popover list, click-outside-close) — đặt cạnh dropdown "Shop" trong filter bar, không dùng `<select>` gốc để đồng bộ giao diện.
3. Filter chain chính của danh sách thêm điều kiện: `filterSendKind === 'all' || o.sendKind === filterSendKind`.
4. Không ảnh hưởng cách hiển thị loại đơn hiện tại (dòng thứ 3 trong ô "Mã đơn hàng" — xem [AGA-ORDER-3](./danh-sach-them-phan-loai-hang-hoa.md) bản đã cập nhật) — filter chỉ ẩn/hiện dòng, không đổi cách trình bày.

## Acceptance Criteria

**AC1:** Filter bar có thêm dropdown "Loại đơn", mặc định "Tất cả".

**AC2:** Chọn "Hàng hoá" → chỉ còn đơn `sendKind = 'goods'` trong danh sách.

**AC3:** Chọn "Thư" → chỉ còn đơn `sendKind = 'letter'` trong danh sách.

**AC4:** Filter "Loại đơn" kết hợp đúng với filter Shop, search, và tab trạng thái đang chọn — không cái nào ghi đè cái kia.

**AC5:** Chọn lại "Tất cả" → danh sách trả về đầy đủ theo đúng các filter khác đang áp dụng.

**AC6:** Đổi tab trạng thái → filter "Loại đơn" đang chọn vẫn giữ nguyên, không tự reset về "Tất cả".

## Notes

- Đây là doc SPEC (chưa implement) — viết theo yêu cầu trực tiếp.
- Nên tái sử dụng đúng pattern dropdown custom đã xây cho filter "Shop" (label xám + value cam, popover click-outside-close) để đồng bộ UI, thay vì dùng `<select>` gốc.
- **Đính chính liên quan:** [AGA-ORDER-3](./danh-sach-them-phan-loai-hang-hoa.md) (doc cũ về hiển thị "Loại đơn") mô tả "cột riêng" đã LỖI THỜI — cột "Loại đơn" hiện KHÔNG còn tách riêng, đã gộp vào dòng thứ 3 của ô "Mã đơn hàng" (icon + text) từ lần redesign danh sách trước đó. Đã cập nhật lại AGA-ORDER-3 cho khớp thực tế, tách biệt với story filter này (2 việc khác nhau: hiển thị vs lọc).
