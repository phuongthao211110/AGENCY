---
id: SHOP-ORDER-15
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Cài đặt đơn hàng - In đơn hàng: Chọn khổ giấy in

## User Story

Là chủ shop, tôi muốn chọn đúng khổ giấy khớp với máy in đang dùng, để phiếu in ra không bị lệch/cắt chữ.

## User Flow

1. Ở tab "In đơn hàng" (cả sub-tab Hàng hoá và Thư tài liệu), thấy mục "Khổ giấy in" với 3 nút bấm dạng pill.
2. Bấm 1 nút để chọn khổ giấy — nút đang chọn đổi màu nền xanh đậm, chữ trắng.
3. Lựa chọn áp dụng ngay cho phần "Xem trước phiếu in" ngay dưới.

## System Flow

1. `PAPER_SIZES`: 3 lựa chọn cố định — `A5`, `52x70` ("52 x 70 mm"), `80x80` ("80 x 80 mm").
2. Component `PaperSizePicker({ value, onChange })` — render 3 `<button>` dạng pill (`border-radius: 20px`), nút đang chọn (`value === p.value`) nền `#1E4C7A` chữ trắng, còn lại nền `#F3F4F6` chữ `#4B5563`. Nhãn hiện dạng "In khổ {label}".
3. Dùng chung 1 component cho cả 2 sub-tab Hàng hoá/Thư tài liệu — mỗi tab giữ state `paperSize` riêng (`goodsPaperSize`/`letterPaperSize`), không chia sẻ giá trị.
4. `PAPER_PREVIEW_WIDTH`: map `paperSize` → độ rộng khung preview mô phỏng (A5 rộng nhất 420px, 52x70mm hẹp nhất 200px, 80x80mm 280px) — dùng ở [SHOP-ORDER-18](./in-don-hang-xem-truoc-phieu-in.md).

## Acceptance Criteria

**AC1:** Hiện đúng 3 nút: "In khổ A5", "In khổ 52 x 70 mm", "In khổ 80 x 80 mm".

**AC2:** Nút đang chọn có nền `#1E4C7A`, chữ trắng; các nút khác nền `#F3F4F6`, chữ `#4B5563`.

**AC3:** Bấm 1 nút → chọn đúng nút đó, các nút khác quay lại trạng thái chưa chọn (chỉ 1 lựa chọn tại 1 thời điểm).

**AC4:** Mặc định chọn "80 x 80 mm" khi mở tab lần đầu.

**AC5:** Đổi khổ giấy ở sub-tab Hàng hoá không ảnh hưởng khổ giấy đang chọn ở sub-tab Thư tài liệu.

## Notes

- Tách từ [SHOP-ORDER-13](./in-don-hang-hang-hoa.md) và [SHOP-ORDER-14](./in-don-hang-thu-tai-lieu.md) theo yêu cầu trực tiếp — đây là 1 trong các mảnh nhỏ của "In đơn hàng".
- Ban đầu dùng dropdown `<select>` với 4 khổ khác (K80/A6/A5/A4) — đã đổi hoàn toàn sang 3 khổ + giao diện pill button theo đúng ảnh tham khảo người dùng gửi.
