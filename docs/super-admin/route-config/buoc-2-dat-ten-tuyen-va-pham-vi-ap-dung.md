---
id: GSA-ROUTE-4
jiraKey: 
platform: super-admin
section: Cấu hình Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Cấu hình Vùng & Tuyến: Bước 2 — Đặt tên tuyến và phạm vi áp dụng

## User Story

Là GHN Super Admin, tôi muốn đặt tên tuyến và tick các cặp miền thuộc từng tuyến để hệ thống có thể tra cứu ra đúng tên tuyến khi tính giá cho đơn hàng giữa 2 tỉnh bất kỳ.

## User Flow

1. Super Admin cuộn đến khối "Bước 2: Đặt tên tuyến & phạm vi áp dụng" trong trang Cấu hình Vùng & Tuyến
2. Hệ thống hiển thị 1 dòng cố định "Nội Tỉnh" (không có nút xoá) + danh sách các tuyến do Super Admin tạo
3. Super Admin đổi tên tuyến bằng cách nhập trực tiếp vào ô input trên card tuyến
4. Super Admin bấm chip cặp miền để tick/bỏ tick cặp đó vào tuyến hiện tại
5. Super Admin tạo tuyến mới bằng nút "+ Thêm tuyến"
6. Super Admin xoá tuyến bằng nút X trên card tuyến

## System Flow

1. `RouteConfig.tsx` dòng 371–454 render khối Bước 2 — nếu Bước 1 chưa có miền nào, hiển thị "Chưa có miền nào — thêm miền ở Bước 1 trước." thay vì danh sách tuyến
2. Dòng "Nội Tỉnh" là luật cứng: 2 tỉnh giống nhau luôn map vào tuyến này không phụ thuộc miền — không có nút X để xoá, tên đổi được qua ô input
3. `handleRenameTuyen` — đổi tên tuyến: vì hệ thống lưu tên chuỗi làm khoá (không phải ID riêng), đổi tên 1 chỗ áp dụng cho mọi cặp miền đang gán tên tuyến đó
4. `handleToggleChip` — tick/bỏ tick cặp miền vào tuyến hiện tại: 1 cặp miền chỉ thuộc đúng 1 tuyến tại 1 thời điểm; tick cặp đang thuộc tuyến khác sẽ tự chuyển tuyến mà không cảnh báo
5. `handleDeleteTuyen` — xoá tuyến: các cặp miền đang gán tuyến đó chuyển thành "chưa cấu hình"; cặp miền không bị xoá, chỉ mất tên tuyến
6. Cảnh báo vàng cuối khối xuất hiện nếu có cặp miền chưa thuộc tuyến nào: liệt kê tối đa 6 cặp đầu + đếm số còn lại

## Acceptance Criteria

**AC1:** Dòng "Nội Tỉnh" luôn hiển thị cố định ở đầu danh sách, không có nút xoá, kèm mô tả cố định "Phạm vi: cùng 1 tỉnh, bất kỳ miền nào — không cần tick, luôn áp dụng." Tên "Nội Tỉnh" có thể đổi qua ô input.

**AC2:** Mỗi card tuyến gồm: ô input đổi tên tuyến inline, dải chip cặp miền (mỗi chip là 1 cặp miền có thể có — gồm cả cùng miền, ví dụ "Miền Nam (Vùng 1)" ↔ "Miền Nam (Vùng 1)" nghĩa là 2 tỉnh khác nhau cùng thuộc Miền Nam), và nút X để xoá tuyến.

**AC3:** Bấm chip để tick/bỏ tick cặp miền vào tuyến — 1 cặp miền chỉ thuộc đúng 1 tuyến tại 1 thời điểm; tick cặp đang thuộc tuyến khác sẽ tự chuyển tuyến mà không cảnh báo.

**AC4:** Đổi tên tuyến cập nhật tên cho mọi cặp miền đang gán tuyến đó (vì hệ thống lưu tên tuyến làm khoá).

**AC5:** Xoá tuyến (bấm X) khiến các cặp miền đang thuộc tuyến đó chuyển thành "chưa cấu hình" — cặp miền không bị xoá khỏi ma trận, chỉ mất tên tuyến.

**AC6:** Nút "+ Thêm tuyến" tạo 1 card tuyến mới rỗng tên mặc định "Tuyến mới N", chưa tick cặp miền nào.

**AC7:** Nếu Bước 1 chưa có miền nào, khối Bước 2 hiển thị thông báo "Chưa có miền nào — thêm miền ở Bước 1 trước." thay vì danh sách tuyến.

**AC8:** Nếu có cặp miền chưa được gán tuyến nào, hiển thị cảnh báo vàng cuối khối: liệt kê tối đa 6 cặp đầu và đếm số còn lại.

## Notes

- Tên tuyến được lưu làm khoá tra cứu trong store (không phải UUID riêng biệt) — nên khi đổi tên tuyến cần đổi đồng bộ ở mọi cặp miền đang dùng tên đó. Đây là ràng buộc thiết kế hiện tại của prototype; production cần ID bất biến cho tuyến.
