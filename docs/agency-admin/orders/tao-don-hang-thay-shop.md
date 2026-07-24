---
id: AGA-ORDER-13
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Tạo đơn hàng thay shop

## User Story

Là Agency Admin (Đại lý), tôi muốn tự tạo 1 đơn hàng hoá thay cho shop (chọn shop, nhập thông tin người nhận, sản phẩm, dịch vụ vận chuyển), để hỗ trợ shop khi cần nhập đơn hộ.

## User Flow

1. Bấm "Tạo đơn hàng" ở trang "Đơn hàng" → drawer tạo đơn mở ra
2. Chọn Shop tạo đơn ở đầu drawer — chọn shop nào thì dịch vụ mặc định của shop đó tự chọn theo
3. Điền thông tin người nhận (tên, SĐT, địa chỉ), thông tin sản phẩm (tên, SL, giá, khối lượng, kích thước)
4. Điền thông tin đơn hàng (COD, giảm giá, khai giá trị hàng...), chọn ai trả phí ship (Shop/Khách), chọn dịch vụ vận chuyển
5. Xem phụ phí tự tính theo lựa chọn, xem tổng phí vận chuyển + tổng thu khách hàng
6. Bấm "Tạo đơn" hoặc "Lưu nháp"

## System Flow

1. Chọn Shop → `selectedShopId` đổi, tự set `selectedServiceId` về dịch vụ đầu tiên có cấu hình bảng giá của shop đó (`currentServices`)
2. Sản phẩm: tính "Khối lượng quy đổi" = `max(cân nặng nhập, D×R×C/5000)`
3. Chọn dịch vụ → phụ phí tính live theo bảng giá dịch vụ đó: phí bảo hiểm (tiered theo giá trị hàng, chỉ tính nếu tick "Khai giá trị hàng"), phí giao 1 phần, phí giao thất bại thu tiền, phí thu hộ (tiered theo COD)
4. Toggle "Khách trả ship" → tự reset "Thu ship khách hàng" về 0
5. Tổng phí vận chuyển = phí ship + tổng phụ phí đang active; Tổng thu khách hàng tính khác nhau tuỳ ai trả ship

## Acceptance Criteria

**AC1:** Chọn Shop khác → dịch vụ mặc định tự đổi theo đúng shop vừa chọn.

**AC2:** Nhập khối lượng/kích thước → "Khối lượng quy đổi" tự tính đúng công thức (lấy số lớn hơn giữa cân thật và quy đổi thể tích).

**AC3:** Tick "Khai giá trị hàng" và nhập giá trị hàng → phí bảo hiểm tự tính hiện ra theo đúng bậc giá trị.

**AC4:** Chọn "Khách trả ship" → ô "Thu ship khách hàng" tự về 0 và bị khoá.

**AC5:** Tổng phí vận chuyển và Tổng thu khách hàng hiển thị đúng theo công thức, cập nhật ngay khi đổi bất kỳ input liên quan.

**AC6:** Shop chưa cấu hình dịch vụ nào → hiện "Shop chưa cấu hình dịch vụ", không cho chọn dịch vụ.

## Notes

- **GAP quan trọng:** nút **"Tạo đơn" hiện chỉ đóng drawer, KHÔNG thực sự tạo/lưu đơn hàng mới** vào `orderStore` — đơn nhập vào sẽ mất hết khi đóng drawer. Nút **"Lưu nháp" không có `onClick` nào cả**, bấm không có phản ứng gì.
- Đây là gap nghiêm trọng nhất trong toàn bộ trang "Đơn hàng" — cần ưu tiên implement thật (persist đơn mới vào `orderStore.ts`, dùng chung cơ chế `addOrder()` đã có sẵn cho luồng Web Shop) trước khi tính năng này dùng được thật sự.
- Nhiều phần trong drawer mang tính trang trí/tĩnh (VD: "Chọn ca lấy hàng", các dòng "link" Ghi chú/Thanh toán/Nguồn tạo, dropdown phường/xã cố định) — không có chức năng thật, giống pattern đã ghi nhận ở `OrderDetailDrawer`.
