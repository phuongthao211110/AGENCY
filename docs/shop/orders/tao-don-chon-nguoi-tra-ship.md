---
id: SHOP-ORDER-3
jiraKey: AGENCY-161
platform: shop
section: Quản lý đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP
status: draft
---

# [WEB SHOP] Đơn hàng - Tạo mới: Chọn Người gửi / Người nhận trả ship

## User Story

Là Shop, tôi muốn chọn ai sẽ trả phí ship (shop hoặc khách hàng) khi tạo
đơn để phản ánh đúng thoả thuận với khách và tính đúng số tiền cần thu khi
giao hàng.

## User Flow

1. Trong form tạo đơn, tại section **Dịch vụ**, Shop nhìn thấy dropdown
   **ai trả phí ship** (mặc định: Shop trả)
2. Shop chọn `Shop trả phí ship` hoặc `Khách hàng trả phí ship`
3. Hệ thống cập nhật ngay dòng **Thu ship khách hàng** và
   **Tổng thu khách hàng** (AGENCY-252)

## System Flow

1. Ghi nhận lựa chọn `freight_payer = shop | customer`
2. Tính lại `thu_ship_kh`:
   - `shop` → `thu_ship_kh = 0`
   - `customer` → `thu_ship_kh = phi_ship` (từ dịch vụ đang chọn)
3. Trigger recalculate `tong_thu_kh` (AGENCY-252)
4. Lưu `freight_payer` vào đơn hàng khi submit

## Acceptance Criteria

**AC1:** Section **Dịch vụ** hiển thị dropdown chọn ai trả phí ship với
2 lựa chọn: `Shop trả phí ship` và `Khách hàng trả phí ship`.

**AC2:** Mặc định khi mở form tạo đơn: `Shop trả phí ship`.

**AC3:** Chọn `Shop trả phí ship`:
- Dòng **Thu ship khách hàng** = `0đ`
- Khách hàng không bị tính thêm phí ship vào tổng thu

**AC4:** Chọn `Khách hàng trả phí ship`:
- Dòng **Thu ship khách hàng** = phí ship của dịch vụ đang chọn
- Tổng thu khách hàng tăng thêm đúng bằng phí ship

**AC5:** Khi thay đổi dịch vụ sau khi đã chọn `Khách hàng trả` →
Thu ship khách hàng tự động cập nhật theo phí ship dịch vụ mới.

**AC6:** Khi chưa chọn dịch vụ và đang ở chế độ `Khách hàng trả` →
Thu ship khách hàng hiển thị `—`.

**AC7:** Lựa chọn ai trả phí ship được lưu vào đơn hàng và hiển thị
lại khi xem chi tiết đơn.

## Notes

- Lựa chọn này chỉ ảnh hưởng đến số tiền thu khách tại điểm giao —
  không ảnh hưởng đến phí ship đại lý thu từ shop (tính riêng
  trong đối soát)
