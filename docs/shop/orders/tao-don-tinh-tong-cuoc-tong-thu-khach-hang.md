---
id: SHOP-ORDER-2
jiraKey: AGENCY-252
platform: shop
section: Quản lý đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP
status: draft
---

# [WEB SHOP] Đơn hàng - Tạo mới: Tính tổng cước, tổng thu khách hàng

## User Story

Là Shop, tôi muốn hệ thống tự động tính tổng số tiền thu khách hàng dựa
trên COD, phí ship và giảm giá để tôi biết chính xác cần thu bao nhiêu
khi giao hàng.

## User Flow

1. Shop nhập COD và chọn dịch vụ (có phí ship)
2. Shop chọn ai trả phí ship: **Shop trả** hoặc **Khách hàng trả**
3. Hệ thống tự động tính và hiển thị **Tổng thu khách hàng**
4. Shop xác nhận và nhấn **Tạo đơn**

## System Flow

1. Lấy `phi_ship` từ dịch vụ đã chọn (AGENCY-160)
2. Xác định `thu_ship_kh` theo lựa chọn:
   - Shop trả phí ship → `thu_ship_kh = 0`
   - Khách hàng trả → `thu_ship_kh = phi_ship`
3. Tính tổng:

```
tong_thu_kh = COD + thu_ship_kh - giam_gia
```

4. Cập nhật realtime khi thay đổi bất kỳ input nào

## Acceptance Criteria

**AC1:** Section **Thông tin đơn hàng** hiển thị các dòng:
- **COD** *(nhập tay)*: số nguyên ≥ 0, đơn vị VND
- **Giảm giá** *(nhập tay)*: số nguyên ≥ 0, không được lớn hơn COD
- **Thu ship khách hàng**: tự động tính theo lựa chọn ai trả phí ship

**AC2:** Dropdown **ai trả phí ship** có 2 lựa chọn:
- `Shop trả phí ship` → Thu ship khách hàng = `0đ`
- `Khách hàng trả phí ship` → Thu ship khách hàng = phí ship dịch vụ
  đang chọn

**AC3:** **Tổng thu khách hàng** = COD + Thu ship khách hàng - Giảm giá,
hiển thị màu đỏ, cập nhật realtime khi thay đổi COD / giảm giá /
dịch vụ / ai trả phí ship.

**AC4:** Tổng thu khách hàng không được âm — nếu Giảm giá > COD thì
hiển thị lỗi inline `"Giảm giá không được lớn hơn COD"`.

**AC5:** Khi chưa chọn dịch vụ → Thu ship khách hàng hiển thị `—`,
Tổng thu khách hàng chưa hiển thị hoặc hiển thị `—`.

## Notes

- Tổng thu khách hàng là số tiền shipper thu tại điểm giao hàng
- Phí ship thực tế đại lý thu từ shop được tính riêng trong hệ thống
  đối soát — không hiển thị trên màn tạo đơn
