---
id: SHOP-ORDER-1
jiraKey: AGENCY-160
platform: shop
section: Quản lý đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP
status: draft
---

# [WEB SHOP] Đơn hàng - Tạo mới: Tính phí vận chuyển theo Bảng giá

## User Story

Là Shop, tôi muốn hệ thống tự động tính phí vận chuyển dựa trên địa chỉ
gửi/nhận và khối lượng đơn hàng để tôi thấy đúng phí ship cho từng dịch
vụ khi tạo đơn.

## User Flow

1. Shop nhập địa chỉ **Bên gửi** và **Bên nhận**
2. Shop nhập sản phẩm kèm khối lượng và kích thước
3. Hệ thống tự động:
   - Xác định tuyến vận chuyển từ 2 địa chỉ
   - Tính khối lượng quy đổi từ kích thước
   - Lọc và hiển thị dịch vụ khả dụng kèm phí ship
4. Shop chọn dịch vụ phù hợp → nhấn **Tạo đơn**

## System Flow

**B1 — Xác định tuyến:**
- Mapping tỉnh/thành → vùng (Vùng 1 Miền Nam / Vùng 2 Miền Trung /
  Vùng 3 Miền Bắc / 3 TP đặc biệt: HN, ĐN, HCM)
- Áp dụng logic 6 tuyến:

| Tuyến | Điều kiện |
|---|---|
| Nội Tỉnh | Cùng tỉnh/thành |
| Nội Vùng | TP lớn ↔ vùng tương ứng (HN↔V3, ĐN↔V2, HCM↔V1) |
| Nội Vùng Tỉnh | Khác tỉnh, cùng vùng |
| Liên Vùng Đặc Biệt | HN ↔ ĐN ↔ HCM |
| Liên Vùng | TP lớn ↔ vùng khác |
| Liên Vùng Tỉnh | 2 tỉnh khác vùng |

**B2 — Tính khối lượng:**
```
khoi_luong_quy_doi = (D × R × C) / 5000  (cm → kg)
khoi_luong_tinh_phi = max(actual_weight, khoi_luong_quy_doi)
```

**B3 — Filter dịch vụ khả dụng:** Dịch vụ hợp lệ khi:
- Dịch vụ đang kích hoạt
- Shop được cấu hình dùng dịch vụ này và có bảng giá gắn kèm
- Bảng giá có cấu hình cho tuyến đã xác định ở B1

**B4 — Tính phí từng dịch vụ:**
```
extra_weight = max(0, khoi_luong_tinh_phi - base_weight)
extra_step   = ceil(extra_weight / step_weight)
phi_ship     = base_price + (extra_step × step_price)
```

**B5 — Hiển thị:** Danh sách dịch vụ kèm `phi_ship` tương ứng.
Shop chọn 1 dịch vụ → phi_ship được ghi nhận vào đơn.

## Cấu trúc dữ liệu

### Khối lượng quy đổi — ví dụ
Kích thước 10×10×10cm, actual = 0.04kg
→ quy_doi = (10×10×10)/5000 = 0.2kg
→ khoi_luong_tinh_phi = max(0.04, 0.2) = **0.2kg**

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Agency Admin** — Thiết lập NVC | Cấu hình bảng giá, tuyến, vượt cân ảnh hưởng trực tiếp đến phí hiển thị ở đây. Thay đổi bảng giá có hiệu lực ngay với đơn tiếp theo. |

## Acceptance Criteria

**AC1:** Khi shop nhập đủ địa chỉ gửi và nhận → hệ thống tự động xác
định tuyến, không cần shop chọn thủ công.

**AC2:** Hệ thống tính khối lượng quy đổi từ D×R×C (cm) theo công thức
`(D×R×C)/5000`, hiển thị `Khối lượng quy đổi: Xkg` dưới phần sản phẩm.
Khối lượng tính phí = max(thực tế, quy đổi).

**AC3:** Section **Dịch vụ** chỉ hiển thị dịch vụ hợp lệ:
- Dịch vụ đang kích hoạt
- Có bảng giá được gắn cho shop này
- Bảng giá có cấu hình cho tuyến của đơn hàng

**AC4:** Mỗi dịch vụ hiển thị tên và **Phí ship** đã tính theo bảng giá
đại lý. Phí ship cập nhật tự động khi thay đổi địa chỉ hoặc khối lượng.

**AC5:** Không có dịch vụ nào hợp lệ → hiển thị thông báo
`"Không có dịch vụ khả dụng cho tuyến này"`.

**AC6:** Shop chọn 1 dịch vụ → phí ship tương ứng được ghi nhận
vào đơn hàng. Phí ship không thay đổi dù hệ thống sau đó optimize
Shop ID GHN khác để đẩy đơn.

**AC7:** Shop không thấy thông tin Shop ID GHN, gói cước GHN,
hay giá GHN thực tế — chỉ thấy tên dịch vụ đại lý và phí ship.

## Notes

- Phí ship hiển thị là giá đại lý bán cho shop, không phải giá GHN thực tế
- Sau khi shop tạo đơn, hệ thống mới chạy Routing Engine để optimize
  Shop ID GHN (shop không biết, không ảnh hưởng phí)
- GHN fee > giá bán → vẫn cho tạo đơn, hệ thống log margin âm nội bộ
