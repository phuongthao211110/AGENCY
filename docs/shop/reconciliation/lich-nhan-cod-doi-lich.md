---
id: SHOP-RECON-2
jiraKey: 
platform: shop
section: Đối soát
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [SHOP] Đối soát: Lịch nhận COD và đổi lịch

## User Story

Là chủ shop, tôi muốn xem lịch nhận COD hiện tại của mình và có thể đổi sang lịch phù hợp hơn (ví dụ mỗi ngày thay vì hằng tuần), để chủ động biết khi nào tiền COD về tài khoản.

## User Flow

1. Vào trang "Đối soát" → phía trên bảng danh sách phiên có section "Lịch nhận COD" hiển thị lịch hiện tại, ví dụ "Thứ 2, 3, 4, 5, 6".
2. Bấm nút "Đổi lịch" → modal "Đổi lịch nhận COD" mở ra.
3. Modal hiển thị danh sách 12 option cố định (radio), option đang chọn được pre-select.
4. Chọn 1 option khác → bấm "Xác nhận" → modal đóng, lịch cập nhật ngay trong section.
5. Bấm "Huỷ" hoặc đóng modal → không thay đổi lịch.

## System Flow

1. `ScheduleSection` (Reconciliation.tsx) đọc `myShop.codSchedule` từ `shops.json` làm giá trị khởi tạo, lưu vào state `codSchedule`.
2. Nút "Đổi lịch" mở `ScheduleModal` — modal hiển thị mảng `SCHEDULE_OPTIONS` (12 option cố định, ví dụ: "Thứ 2, 3, 4, 5, 6", "Thứ 6", "Thứ 2, 4, 6", "Hằng ngày"...).
3. Khi xác nhận: `setCodSchedule(selectedOption)` — chỉ cập nhật state local trong component, không ghi ngược lại `shops.json` hay bất kỳ store/localStorage nào.
4. Hậu quả: thay đổi lịch mất hoàn toàn khi reload trang, lần mở trang kế tiếp sẽ đọc lại `myShop.codSchedule` gốc từ `shops.json`.

## Acceptance Criteria

**AC1:** Section "Lịch nhận COD" hiển thị đầu trang Đối soát, phía trên bảng danh sách phiên.

**AC2:** Lịch nhận COD hiện tại được hiển thị rõ (ví dụ "Thứ 2, 3, 4, 5, 6").

**AC3:** Bấm "Đổi lịch" → modal mở, hiện đúng 12 option cố định dạng radio, option hiện tại được pre-select.

**AC4:** Chọn option khác → bấm "Xác nhận" → modal đóng, section cập nhật hiển thị lịch mới trong cùng phiên trình duyệt.

**AC5:** Bấm "Huỷ" hoặc đóng modal mà chưa bấm "Xác nhận" → lịch không thay đổi.

**AC6 (gap):** Sau khi đổi lịch thành công, nếu reload trang → lịch quay về giá trị gốc từ `shops.json`, thay đổi không được giữ lại. Hành vi này cần ghi nhận rõ trong UI (tooltip hoặc chú thích) hoặc fix bằng cách persist vào localStorage/API.

## Notes

- Đây là gap được ghi nhận có chủ đích: `setCodSchedule` chỉ set local state, khác với các field placeholder hoàn toàn tĩnh (như `SelectCtrl` không có onClick). Ở đây người dùng CÓ thể chọn và thấy thay đổi trong phiên, nhưng không persist qua reload.
- Khi implement thật cần persist lịch nhận COD: gọi API cập nhật lịch về backend, hoặc tối thiểu lưu vào localStorage với key theo `shopId`.
- 12 option trong `SCHEDULE_OPTIONS` là danh sách cố định trong code — nếu muốn linh hoạt hơn (đại lý cấu hình lịch cho shop), cần xem lại thiết kế data model.
