---
id: AGA-SHOP-7
jiraKey: AGENCY-159
platform: agency-admin
section: Quản lý Shop
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGA] Shop - Chỉnh sửa shop: Chỉnh sửa dịch vụ / bảng giá áp dụng cho shop

## User Story

Là Agency Admin (Đại lý), tôi muốn chỉnh sửa cấu hình dịch vụ và bảng giá
của shop sau khi đã tạo để thay đổi bảng giá áp dụng hoặc thêm/bỏ dịch vụ
phù hợp với từng thời điểm.

## User Flow

1. Agency Admin vào trang **Thông tin shop** → nhấn **Chỉnh sửa**
2. Hệ thống chuyển sang chế độ edit toàn trang
3. Tại section **Cấu hình dịch vụ**, Agency Admin có thể:
   - Thay đổi bảng giá của từng dịch vụ qua dropdown
   - Thêm dịch vụ mới (nhấn **+ Thêm dịch vụ**)
   - Xoá dịch vụ không dùng nữa (nhấn X trên dòng dịch vụ)
4. Nhấn **Lưu thay đổi** để lưu

## System Flow

1. Load cấu hình dịch vụ hiện tại của shop (`shop ↔ service ↔ priceTable`)
2. Validate khi submit: không có lỗi bắt buộc với section này
3. Lưu lại mapping mới `shop → [{ serviceId, priceTableId }]`
4. Thay đổi có hiệu lực ngay — shop tạo đơn tiếp theo sẽ thấy
   danh sách dịch vụ và giá mới

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Web Shop** — Tạo đơn | Dịch vụ bị xoá hoặc không có bảng giá → ẩn khỏi danh sách ngay sau khi lưu. Dịch vụ mới thêm hoặc đổi bảng giá → áp dụng ngay cho đơn tiếp theo. |

## Acceptance Criteria

**AC1:** Trang **Thông tin shop** (view mode) hiển thị section
**Cấu hình dịch vụ** dạng bảng read-only 2 cột: tên dịch vụ + mô tả |
tên bảng giá đang áp dụng.

**AC2:** Nhấn **Chỉnh sửa** → toàn trang chuyển sang edit mode. Section
**Cấu hình dịch vụ** hiển thị dropdown bảng giá cho từng dịch vụ.

**AC3:** Dropdown bảng giá mỗi dịch vụ:
- Hiển thị bảng giá đang chọn (có badge `Mặc định` nếu là bảng giá mặc
  định của dịch vụ)
- Cho phép chọn bảng giá khác từ danh sách bảng giá thuộc đại lý

**AC4:** Nhấn **+ Thêm dịch vụ** → hiển thị danh sách dịch vụ đang kích
hoạt của đại lý chưa có trong cấu hình shop, Agency Admin chọn để thêm.

**AC5:** Nhấn **X** trên dịch vụ → xoá dịch vụ đó khỏi cấu hình shop.

**AC6:** Nhấn **Lưu thay đổi** → lưu toàn bộ thay đổi (thông tin cơ bản
+ cấu hình dịch vụ), hiển thị lại trang view mode với data mới.

**AC7:** Thay đổi có hiệu lực ngay — shop tạo đơn tiếp theo áp dụng
cấu hình mới.

**AC8:** Danh sách dịch vụ và bảng giá chỉ bao gồm data thuộc đại lý
đang đăng nhập (tenant isolation).

## Notes

- Chỉnh sửa cấu hình dịch vụ không ảnh hưởng đơn hàng đã tạo trước đó —
  chỉ áp dụng cho đơn mới
- Dịch vụ đang tắt (disabled) không xuất hiện trong **+ Thêm dịch vụ**
