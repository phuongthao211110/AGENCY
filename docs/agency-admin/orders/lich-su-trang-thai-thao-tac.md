---
id: AGA-ORDER-11
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Chi tiết: Xem lịch sử trạng thái và lịch sử thao tác

## User Story

Là Agency Admin (Đại lý), tôi muốn xem toàn bộ lịch sử thay đổi trạng thái vận chuyển và lịch sử thao tác chỉnh sửa của 1 đơn, để tra soát khi có khiếu nại hoặc cần biết đơn đã qua những bước nào.

## User Flow

1. Trong drawer chi tiết đơn, bấm tab "Lịch sử trạng thái" → xem thống kê Số lần lấy/giao/hoàn + danh sách lịch sử theo ngày
2. Bấm tab "Lịch sử thao tác" → xem bảng ai đã sửa gì, từ giá trị cũ sang giá trị mới, theo từng ngày

## System Flow

1. Tab "Lịch sử trạng thái": 3 counter từ `order.num_pick`/`num_deliver`/`num_return`; `order.log[]` nhóm theo ngày (mới nhất lên trước), mỗi dòng hiện trạng thái, hành động (map màu qua `ACTION_LABEL`/`ACTION_COLOR`), tag "BKK" nếu `is_force_majeure`, ghi chú, kho hàng, giờ. Dòng log mới nhất tô nền `#F0F9FF`
2. Tab "Lịch sử thao tác": `order.actionHistory[]` nhóm theo ngày, mỗi dòng hiện giờ/người thực hiện/hành động/giá trị cũ/giá trị mới

## Acceptance Criteria

**AC1:** Tab "Lịch sử trạng thái" hiện đúng 3 số liệu Số lần lấy/giao/hoàn theo đơn đang xem.

**AC2:** Danh sách lịch sử trạng thái nhóm đúng theo ngày, sắp xếp ngày mới nhất lên đầu; dòng mới nhất được tô nền nổi bật.

**AC3:** Đơn không có `log` → hiện "Chưa có lịch sử trạng thái", không lỗi.

**AC4:** Tab "Lịch sử thao tác" hiện đúng bảng thời gian/người thực hiện/hành động/giá trị cũ → mới, nhóm theo ngày.

**AC5:** Đơn không có `actionHistory` → hiện "Chưa có lịch sử thao tác", không lỗi.

## Notes

- 2 tab này thuần hiển thị dữ liệu có sẵn trên `order.log`/`order.actionHistory` — không có thao tác chỉnh sửa nào ở đây.
