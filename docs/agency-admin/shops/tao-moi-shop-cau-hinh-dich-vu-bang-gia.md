---
id: AGA-SHOP-6
jiraKey: AGENCY-158
platform: agency-admin
section: Quản lý Shop
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGA] Shop - Tạo mới shop: Cấu hình dịch vụ / bảng giá áp dụng cho shop

## User Story

Là Agency Admin (Đại lý), tôi muốn cấu hình dịch vụ và bảng giá áp dụng
cho shop ngay khi tạo mới để xác định shop đó được dùng những dịch vụ nào
và tính phí theo bảng giá nào.

## User Flow

1. Trong trang **Tạo shop mới**, Agency Admin kéo xuống section
   **Cấu hình dịch vụ** (sau Thông tin cơ bản và Cấu hình tài khoản)
2. Hệ thống hiển thị danh sách dịch vụ của đại lý, mỗi dòng kèm
   dropdown chọn bảng giá
3. Với mỗi dịch vụ, Agency Admin chọn bảng giá áp dụng từ dropdown
4. Agency Admin có thể xoá dịch vụ không muốn áp dụng cho shop (nhấn X)
5. Agency Admin có thể thêm lại dịch vụ đã xoá (nhấn **+ Thêm dịch vụ**)
6. Nhấn **+ Tạo mới** để hoàn tất tạo shop

## System Flow

1. Load danh sách dịch vụ đang kích hoạt thuộc `agencyId`
2. Với mỗi dịch vụ, load danh sách bảng giá khả dụng — tự động chọn
   bảng giá mặc định của dịch vụ nếu có
3. Khi submit: lưu mapping `shop → [{ serviceId, priceTableId }]`
4. Dịch vụ bị xoá khỏi list hoặc không có bảng giá → không khả dụng
   với shop khi tạo đơn

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Web Shop** — Tạo đơn | Chỉ hiển thị dịch vụ có bảng giá trong cấu hình của shop. Giá tính theo bảng giá được gắn, không phải bảng giá GHN. |

## Acceptance Criteria

**AC1:** Section **Cấu hình dịch vụ** hiển thị bảng 2 cột: **Dịch vụ**
(tên + mô tả ngắn) và **Bảng giá** (dropdown chọn bảng giá).

**AC2:** Dropdown bảng giá của mỗi dịch vụ:
- Chỉ liệt kê bảng giá thuộc đại lý hiện tại
- Tự động chọn bảng giá mặc định của dịch vụ (nếu có), hiển thị badge
  `Mặc định` kèm theo tên bảng giá
- Agency Admin có thể chọn bảng giá khác thay vì mặc định

**AC3:** Dịch vụ không có bảng giá mặc định → dropdown để trống,
Agency Admin phải chọn thủ công.

**AC4:** Nhấn **X** trên một dịch vụ → xoá dịch vụ đó khỏi danh sách.
Dịch vụ bị xoá sẽ không khả dụng với shop khi tạo đơn.

**AC5:** Nhấn **+ Thêm dịch vụ** → hiển thị danh sách dịch vụ chưa được
thêm để chọn bổ sung.

**AC6:** Không bắt buộc phải chọn bảng giá cho tất cả dịch vụ — dịch vụ
không có bảng giá vẫn được lưu nhưng không xuất hiện khi shop tạo đơn.

**AC7:** Sau khi tạo shop thành công, hệ thống lưu đúng mapping
`shop ↔ service ↔ priceTable` cho từng dịch vụ.

**AC8:** Danh sách dịch vụ và bảng giá chỉ bao gồm data thuộc đại lý
đang đăng nhập (tenant isolation).

## Notes

- Section này là bước 3 trong form tạo shop, sau **Thông tin cơ bản**
  (AGENCY-45) và **Cấu hình tài khoản** (AGENCY-46)
- Dịch vụ đang tắt (disabled) không hiển thị — chỉ hiển thị dịch vụ
  đang kích hoạt
- Cấu hình này có thể chỉnh sửa lại sau khi shop đã được tạo (AGENCY-159)
