---
id: AGA-ORDER-8
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng: Chọn nhiều đơn hàng

## User Story

Là Agency Admin (Đại lý), tôi muốn tick chọn nhiều đơn cùng lúc trong danh sách, để chuẩn bị cho các thao tác hàng loạt sau này.

## User Flow

1. Tick checkbox từng dòng đơn, hoặc tick checkbox ở header để chọn tất cả đơn **đang hiển thị trên trang hiện tại**
2. Khi có ít nhất 1 đơn được chọn, thanh "Đã chọn N đơn" hiện ra phía trên bảng
3. Bấm "Bỏ chọn" trên thanh đó để xoá hết lựa chọn

## System Flow

1. `selected: Set<string>` lưu id các đơn đã tick
2. Checkbox header `allChecked` chỉ tính đúng theo `paginated` (đơn của TRANG HIỆN TẠI) — không phải toàn bộ kết quả đã lọc
3. Lựa chọn giữ nguyên khi đổi trang, đổi filter tìm kiếm/shop — chỉ bị xoá khi đổi TAB
4. "Bỏ chọn" → `setSelected(new Set())`

## Acceptance Criteria

**AC1:** Tick checkbox 1 dòng → dòng đó được đánh dấu chọn (nền đổi màu).

**AC2:** Tick checkbox header → chọn tất cả đơn đang hiển thị trên trang hiện tại (không phải toàn bộ danh sách đã lọc nếu có nhiều trang).

**AC3:** Có ≥1 đơn được chọn → thanh "Đã chọn N đơn" hiện ra, đúng số lượng.

**AC4:** Bấm "Bỏ chọn" → xoá hết lựa chọn, thanh biến mất.

**AC5:** Chuyển sang trang khác trong cùng tab/filter → lựa chọn ở trang cũ vẫn được giữ (không bị mất).

## Notes

- **GAP:** thanh "Đã chọn N đơn" hiện tại **chỉ hiển thị số lượng**, chưa có bất kỳ nút thao tác hàng loạt nào (VD: gửi hàng loạt, huỷ hàng loạt, xuất Excel...) — cần xác nhận với BA nhu cầu thao tác hàng loạt cụ thể trước khi bổ sung.
