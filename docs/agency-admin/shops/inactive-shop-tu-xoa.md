---
id: AGA-SHOP-7
jiraKey: AGENCY-611
platform: agency-admin
section: Quản lý Shop
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
---

# [AGA] Shop - Danh sách shop: Hiển thị Inactive khi shop tự xoá tài khoản

## User Story

Là Agency Admin (Đại lý), tôi muốn nhận biết ngay shop nào đã tự xoá tài khoản từ danh sách shop, và có thể kích hoạt lại nếu shop muốn quay trở lại, để tôi nắm được tình trạng thực tế mà không cần xử lý thêm.

## User Flow

**Luồng 1 — Xem danh sách shop:**
1. Agency Admin vào **Quản lý shop**
2. Shop đã tự xoá tài khoản hiển thị trong danh sách với:
   - Tên shop màu xám `#9CA3AF` (thay vì xanh)
   - Badge **"Inactive"** kế bên tên (nền `#F3F4F6`, viền `#D1D5DB`, text `#6B7280`)
   - Ghi chú dưới mã shop: `SHP016 · Tự xoá DD/MM/YYYY`
3. Agency Admin có thể click vào row để xem chi tiết

**Luồng 2 — Xem chi tiết shop Inactive:**
1. Agency Admin click vào shop Inactive → vào trang **Chi tiết shop**
2. Tab "Thông tin cơ bản" hiển thị banner thông báo (nền amber `#FFF7ED`) với:
   - Tiêu đề: "Shop đã tự xoá tài khoản"
   - Ngày xoá: DD/MM/YYYY
   - Lý do xoá (nếu có)
   - Ghi chú của shop (nếu có)
   - Lưu ý: "Dữ liệu lịch sử (đơn hàng, đối soát) vẫn được lưu trữ để tra cứu."
3. Nút **"Kích hoạt lại tài khoản"** (xanh lá `#16A34A`) + caption "Chỉ dùng nếu shop đổi ý và liên hệ lại."
4. Nút "Chỉnh sửa" và "Xoá" **không hiển thị** khi shop ở trạng thái Inactive

## Acceptance Criteria

**AC1:** Row shop Inactive trong danh sách hiển thị tên màu xám `#9CA3AF`, badge "Inactive", và ghi chú "· Tự xoá DD/MM/YYYY" dưới mã shop. Phân biệt rõ với row shop Active (tên xanh, không badge).

**AC2:** Shop Inactive vẫn hiển thị đầy đủ trong danh sách và clickable — Agency Admin có thể vào xem chi tiết bình thường.

**AC3:** Trang chi tiết shop Inactive hiển thị banner amber ở đầu tab "Thông tin cơ bản" với: tiêu đề "Shop đã tự xoá tài khoản", ngày xoá, lý do xoá, ghi chú (nếu có).

**AC4:** Banner ghi rõ: "Dữ liệu lịch sử (đơn hàng, đối soát) vẫn được lưu trữ để tra cứu."

**AC5:** Nút "Kích hoạt lại tài khoản" (màu xanh lá `#16A34A`) hiển thị bên trong banner kèm caption "Chỉ dùng nếu shop đổi ý và liên hệ lại."

**AC6:** Nút "Chỉnh sửa" và "Xoá" không hiển thị khi shop ở trạng thái Inactive.
