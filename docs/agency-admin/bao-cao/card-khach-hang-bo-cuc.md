---
id: AGA-REPORT-11
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Card "Khách hàng" — bố cục 2 khối chỉ số khách hàng

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn có 1 khu vực riêng gọi là "Khách hàng" nằm cạnh biểu đồ xu hướng, gom đủ 2 chỉ số khách hàng (Khách hàng mới, Khách quay lại) theo đúng thứ tự cố định, để xem nhanh sức khoẻ khách hàng mà không phải tìm rải rác trên trang.

## User Flow

1. Card "Khách hàng" nằm bên PHẢI, cùng hàng với card "Xu hướng doanh thu & sản lượng" (bên trái, xem AGA-REPORT-12) — 2 card chia theo tỉ lệ khoảng 2:1 (Xu hướng rộng hơn).
2. Đầu card là tiêu đề "Khách hàng" (đậm, 15px).
3. Bên dưới là 2 khối xếp DỌC theo thứ tự cố định: "Khách hàng mới" (trên, chấm xanh lá) rồi "Khách quay lại" (dưới, chấm tím) — không đổi thứ tự theo tab hay bộ lọc nào.
4. Mỗi khối tự chứa đủ: chấm màu + nhãn + badge %, dòng định nghĩa, số lớn, sparkline 7 cột — nội dung/logic chi tiết từng khối xem AGA-REPORT-8 (khối trên) và AGA-REPORT-9 (khối dưới).
5. Màn hình hẹp → card "Khách hàng" tự xuống dưới card "Xu hướng..." (wrap toàn card, không co hẹp lẫn nhau).

## System Flow

1. Card dùng `flex: '1 1 260px'`, viền `1px solid #E5E7EB`, bo góc 10px, padding 16px, `display: flex; flexDirection: column; gap: 18px` — 2 khối con xếp theo đúng thứ tự khai báo trong JSX (không sort động theo giá trị).
2. Card "Xu hướng..." dùng `flex: '2 1 480px'` — cùng hàng flex-wrap với card này, tỉ lệ ~2:1 khi đủ rộng, tự xuống dòng khi màn hình hẹp.
3. Mỗi khối con là 1 `<div>` tự viết (không tách component riêng) — bố cục: dòng đầu `justify-content: space-between` (chấm + nhãn bên trái, badge % bên phải), rồi dòng định nghĩa nhỏ (11.5px, xám), số lớn (24px đậm), sparkline.
4. `MiniBarSparkline({values, color})` — component dùng CHUNG cho cả 2 khối, chỉ khác `color` (`#0D9488` cho Khách hàng mới, `#7C3AED` cho Khách quay lại) và mảng `values` (7 số — logic tính riêng theo từng khối, xem AGA-REPORT-8/AGA-REPORT-9); cột cuối cùng (hôm nay) luôn tô màu đậm 100%, 6 cột trước tô nhạt hơn (alpha ~33%).

## Acceptance Criteria

**AC1:** Card "Khách hàng" nằm bên phải, cùng hàng với card "Xu hướng doanh thu & sản lượng" khi màn hình đủ rộng.

**AC2:** Đúng 2 khối theo thứ tự cố định: "Khách hàng mới" trên, "Khách quay lại" dưới — không đổi thứ tự trong bất kỳ trạng thái nào (kể cả khi giá trị bằng nhau hoặc bằng 0).

**AC3:** Mỗi khối tự đủ 5 phần: chấm màu, nhãn, badge %, dòng định nghĩa, số lớn, sparkline 7 cột (nội dung đúng theo AGA-REPORT-8/AGA-REPORT-9).

**AC4:** Màn hình hẹp (dưới ~900px) → card "Khách hàng" xuống dưới card "Xu hướng...", không bị bóp méo hay tràn nội dung.

**AC5:** 2 sparkline dùng đúng 2 màu cố định: `#0D9488` (Khách hàng mới), `#7C3AED` (Khách quay lại) — không đổi màu theo trạng thái nào khác.

## Notes

- **Tách ra từ AGA-REPORT-7** (redesign tổng thể trang "Báo cáo") theo yêu cầu quản lý riêng từng phần của trang.
- Story này CHỈ mô tả CONTAINER/BỐ CỤC của card — định nghĩa, công thức và AC chi tiết của từng chỉ số bên trong xem [AGA-REPORT-8](./khach-hang-moi.md) (Khách hàng mới) và [AGA-REPORT-9](./khach-quay-lai.md) (Khách quay lại).
- Trong ảnh mockup gốc, khối "Khách hàng" có thêm vài chỉ số phụ khác; bản hiện tại CHỈ có đúng 2 khối theo phạm vi đã xác nhận với người yêu cầu ("KH" = khách hàng cuối của shop, chỉ tính Onboard mới và Re-active).
