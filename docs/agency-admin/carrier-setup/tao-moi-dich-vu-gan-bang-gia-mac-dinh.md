---
id: AGA-CARRIER-8
jiraKey: AGENCY-149
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGA] Thiết lập GHN - Tạo mới dịch vụ: Gắn bảng giá mặc định cho dịch vụ

## User Story

Là Agency Admin (Đại lý), tôi muốn gắn bảng giá mặc định cho dịch vụ để khi
tạo shop và chọn dịch vụ này, Agency Admin có thể chọn bảng giá áp dụng cho
shop đó.

## User Flow

1. Trong trang chi tiết dịch vụ (sau khi tạo hoặc chỉnh sửa), Agency Admin
   thấy card **Bảng giá mặc định**
2. Nếu chưa gắn → Agency Admin nhấn **Gắn bảng giá**
3. Hệ thống hiển thị danh sách bảng giá của đại lý
4. Agency Admin chọn 1 bảng giá → nhấn **Xác nhận**
5. Card cập nhật hiển thị thông tin bảng giá vừa gắn
6. Nếu muốn đổi → nhấn **Thay đổi**, chọn bảng giá khác

## System Flow

1. Load danh sách bảng giá thuộc `agencyId`
2. Lưu `priceTableId` vào Service
3. Cập nhật card hiển thị thông tin bảng giá đã gắn

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Agency Admin** — Tạo/sửa shop | Khi cấu hình dịch vụ cho shop, dropdown chọn bảng giá chỉ hiển thị bảng giá đã được gắn vào dịch vụ tương ứng |
| **Web Shop** — Tạo đơn | Dịch vụ chưa có bảng giá → không hiển thị trong danh sách dịch vụ khi shop tạo đơn, dù dịch vụ đang kích hoạt |

## Acceptance Criteria

**AC1:** Trang chi tiết dịch vụ, tab **Thông tin** hiển thị card
**Bảng giá mặc định**:
- Chưa gắn → cảnh báo nền vàng nhạt `"Chưa có bảng giá — shop được gắn
  dịch vụ này sẽ không thể sử dụng"` kèm nút **Gắn bảng giá**
- Đã gắn → hiển thị tên bảng giá (xanh, bold), số tuyến, ngày cập nhật,
  nút **Thay đổi**

**AC2:** Nhấn **Gắn bảng giá** hoặc **Thay đổi** → hiển thị danh sách
bảng giá của đại lý để chọn.

**AC3:** Agency Admin chọn đúng 1 bảng giá, không cho chọn nhiều.

**AC4:** Xác nhận → card cập nhật ngay với thông tin bảng giá vừa chọn.

**AC5:** Không bắt buộc gắn bảng giá ngay khi tạo dịch vụ — có thể bổ
sung sau. Dịch vụ chưa có bảng giá vẫn được lưu nhưng không khả dụng
với shop khi tạo đơn.

**AC6:** Danh sách bảng giá chỉ hiển thị bảng giá thuộc đại lý đang đăng
nhập (tenant isolation).

**AC7:** Đại lý chưa có bảng giá nào → danh sách trống, hiển thị hướng
dẫn điều hướng sang tab **Bảng giá** để tạo mới.

## Notes

- Bảng giá gắn ở đây là bảng giá **mặc định của dịch vụ** — được dùng
  làm tùy chọn khi Agency Admin cấu hình bảng giá cho shop (AGA-SHOP-6)
- 1 dịch vụ chỉ có 1 bảng giá mặc định tại một thời điểm
