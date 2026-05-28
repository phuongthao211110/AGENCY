---
id: AGA-CARRIER-9
jiraKey: AGENCY-132
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGA] Thiết lập GHN - Tạo mới bảng giá: Cấu hình vượt cân theo khối lượng

## User Story

Là Agency Admin (Đại lý), tôi muốn cấu hình ngưỡng vượt cân cho từng tuyến
trong bảng giá để hệ thống tự động tính đúng phí vận chuyển khi đơn hàng
vượt khối lượng chuẩn.

## User Flow

1. Trong trang tạo mới bảng giá, Agency Admin chọn/thêm một tuyến
2. Nhập **Khối lượng chuẩn** và **Giá chuẩn** cho tuyến
3. Chuyển sang tab **Vượt cân**
4. Nhấn **+ Thêm ngưỡng vượt cân** để thêm bậc
5. Với mỗi bậc, Agency Admin cấu hình:
   - Khoảng khối lượng: chọn `đến` (có giới hạn trên) hoặc `trở lên`
     (không giới hạn)
   - Đơn giá tăng thêm và bước tính (mỗi X gram)
6. Lặp lại để thêm nhiều bậc nếu cần
7. Lưu cùng bảng giá

## System Flow

1. Validate Khối lượng chuẩn và Giá chuẩn khi submit
2. Validate từng bậc vượt cân: các field bắt buộc không được trống
3. Kiểm tra thứ tự bậc hợp lệ: giới hạn trên của bậc sau phải lớn hơn
   bậc trước
4. Lưu cấu hình vượt cân cùng route vào bảng giá
5. Khi shop tạo đơn → áp dụng công thức:
   `total_fee = base_price + ceil((weight - base_weight) / step_weight) * step_price`

## Cấu trúc dữ liệu

### Công thức tính phí vượt cân

```
extra_weight = max(0, actual_weight - base_weight)
extra_step   = ceil(extra_weight / step_weight)
total_fee    = base_price + (extra_step × step_price)
```

**Ví dụ:** base_weight = 1kg, actual_weight = 1.7kg, step_weight = 500g,
step_price = 2.500đ
→ extra_weight = 700g → extra_step = ceil(700/500) = 2
→ total_fee = 21.000 + 2 × 2.500 = **26.000đ**

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Web Shop** — Tạo đơn | Giá hiển thị khi shop chọn dịch vụ được tính theo đúng công thức vượt cân đã cấu hình. Shop không thấy cấu hình nội bộ, chỉ thấy tổng phí. |

## Acceptance Criteria

**AC1:** Mỗi tuyến trong bảng giá có 2 field bắt buộc:
- **Khối lượng chuẩn** *(bắt buộc)*: số nguyên > 0, đơn vị gram
- **Giá chuẩn** *(bắt buộc)*: số nguyên ≥ 0, đơn vị VND

**AC2:** Tab **Vượt cân** hiển thị danh sách các bậc đã thêm và nút
**+ Thêm ngưỡng vượt cân**.

**AC3:** Mỗi bậc vượt cân gồm:
- Toggle `đến` / `trở lên` — chọn `trở lên` thì ẩn field giới hạn trên
- **Giới hạn trên** *(bắt buộc nếu chọn `đến`)*: số nguyên > 0, đơn vị gram,
  phải lớn hơn giới hạn trên của bậc trước
- **Đơn giá tăng** *(bắt buộc)*: số nguyên ≥ 0, đơn vị VND
- **Bước tính** *(bắt buộc)*: số nguyên > 0, đơn vị gram (mỗi X gram tăng
  thêm Y đồng)
- Nút xoá bậc

**AC4:** Bậc cuối cùng phải ở chế độ `trở lên` (không giới hạn trên) —
đảm bảo mọi khối lượng đều có giá.

**AC5:** Field bắt buộc bỏ trống khi submit → hiển thị lỗi inline
`"Vui lòng nhập giá trị"` ngay tại field đó.

**AC6:** Có thể thêm nhiều bậc, xoá từng bậc bằng icon thùng rác.

**AC7:** Không bắt buộc phải cấu hình vượt cân — nếu không có bậc nào,
phí tính theo giá chuẩn cho mọi khối lượng.

## Notes

- Điểm bắt đầu của bậc đầu tiên = `base_weight + 1g` (tự động, không nhập)
- Điểm bắt đầu của bậc tiếp theo = giới hạn trên của bậc trước + 1g
- `step_price = 0` hợp lệ — nghĩa là vượt cân nhưng không tính thêm phí
