---
id: AGA-CARRIER-18
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: superseded
---

# [AGA] Thiết lập NVC - Cấu hình vùng & tuyến: Đặt tên tuyến & phạm vi áp dụng (ĐÃ CHUYỂN SANG SUPER ADMIN)

## ⚠️ Story này đã lỗi thời — không còn khớp code hiện tại

Cùng lý do với **AGA-CARRIER-17**: toàn bộ "Cấu hình vùng & tuyến" (gồm cả Bước 2 mô tả ở story này) đã **chuyển hẳn lên Super Admin, bỏ hẳn khỏi Agency Admin**. Agency Admin không còn trang này, menu CÔNG CỤ chỉ còn "Kiểm tra tuyến".

Hiện tại:
- Trang thật (card "Bước 2 — Đặt tên tuyến & phạm vi áp dụng" như mô tả ở story này) nằm ở Super Admin, route `/super-admin/route-config` (`RouteConfig.tsx`).
- Toàn bộ nội dung User Flow/System Flow/AC bên dưới **đã được viết lại chính xác cho đúng platform** tại **GSA-ROUTE-4** (`docs/super-admin/route-config/buoc-2-dat-ten-tuyen-va-pham-vi-ap-dung.md`) — đọc file đó để có tài liệu đúng, đầy đủ và cập nhật nhất.
- Ghi chú cũ về `RouteCheck.tsx` "hiện CHƯA được nối vào cấu hình dùng chung" **cũng đã lỗi thời** — gap đó đã được fix (`RouteCheck.tsx` giờ đọc `resolveRouteName()`/`listRouteNames()`/`regions` trực tiếp từ `routeConfig.ts`, đã verify bằng Playwright).

Giữ lại file này (không xoá) để lưu lịch sử — không dùng làm tài liệu tham chiếu cho việc implement hay QA nữa.

---

## Nội dung gốc (đã lỗi thời, chỉ lưu tham khảo lịch sử)

### User Story

Là Agency Admin (Đại lý), tôi muốn đặt tên tuyến và chỉ định các cặp miền áp dụng cho
từng tuyến để hệ thống biết cặp gửi/nhận nào được gọi là tuyến nào — từ đó dropdown
"Tuyến" trong màn Tạo bảng giá phản ánh đúng cấu trúc giá cước thực tế của đại lý.

### User Flow

1. Agency Admin ở trang **Cấu hình vùng & tuyến**, cuộn xuống phía dưới card Bước 1
2. Card **Bước 2 — Đặt tên tuyến & phạm vi áp dụng** hiển thị với dòng "Nội Tỉnh" (badge **CỐ ĐỊNH**) luôn ở đầu
3. Agency Admin có thể đổi tên hiển thị của luật Nội Tỉnh qua input; không cần tick phạm vi vì tự áp dụng mọi cặp cùng tỉnh
4. Bấm **+ Thêm tuyến** → tuyến mới tên "Tuyến mới N" xuất hiện, chưa có phạm vi nào
5. Với mỗi tuyến: đổi tên qua input, sau đó bấm chip cặp miền để bật/tắt phạm vi áp dụng (chip cam = đang thuộc tuyến này, chip xám = chưa thuộc)
6. Để xoá tuyến: bấm nút X bên phải dòng tuyến → các cặp miền của tuyến đó trở về "chưa cấu hình"
7. Nếu có cặp miền nào chưa thuộc tuyến nào → banner cảnh báo vàng tự động hiển thị

### System Flow

1. Bước 2 đọc danh sách miền từ cùng store `routeConfig.ts`, tự tính toán tất cả cặp miền hợp lệ (bao gồm cả cặp cùng miền — 2 tỉnh khác nhau cùng miền)
2. Bấm chip cặp miền để assign: nếu cặp đó đã thuộc tuyến khác → tự rút khỏi tuyến cũ rồi gán vào tuyến mới; không cho phép 1 cặp thuộc 2 tuyến cùng lúc
3. Đổi tên tuyến → áp dụng ngay cho tất cả cặp miền đang dùng tên đó (đổi hàng loạt); tên tuyến là identifier duy nhất, không có ID riêng
4. Xoá tuyến → các cặp miền thuộc tuyến đó trở về "chưa cấu hình" (chip xám); không bị gán nhầm sang tuyến khác
5. Hệ thống kiểm tra toàn bộ cặp miền: nếu có cặp chưa thuộc tuyến nào → hiển thị banner vàng cảnh báo
6. Danh sách tên tuyến từ Bước 2 được export sang `PricingCreate.tsx` và cập nhật theo thời gian thực khi admin thay đổi cấu hình

### Acceptance Criteria (gốc — xem GSA-ROUTE-4 để có AC đúng hiện tại)

**AC1:** Card "Bước 2 — Đặt tên tuyến & phạm vi áp dụng" nằm ngay dưới card Bước 1 trên cùng trang.

**AC2:** Dòng "Nội Tỉnh" (badge **CỐ ĐỊNH**) luôn hiển thị đầu tiên; tên hiển thị có thể đổi qua input, không có dãy chip cặp miền để tick — luật Nội Tỉnh tự động áp dụng cho mọi cặp gửi/nhận cùng 1 tỉnh bất kể thuộc miền nào.

**AC3:** Nút "+ Thêm tuyến" tạo tuyến mới tên mặc định "Tuyến mới N", chưa gán phạm vi nào; tên tuyến có thể đổi qua input.

**AC4:** Mỗi tuyến hiển thị dãy chip cặp miền — chip cam = cặp miền đang thuộc tuyến này, chip xám = chưa thuộc; chip thể hiện cả cặp cùng miền ("Tên miền ↔ Tên miền") và cặp khác miền ("Miền A ↔ Miền B").

**AC5:** Bấm chip cặp miền ở tuyến B khi cặp đó đang thuộc tuyến A → cặp tự động rút khỏi tuyến A và gán vào tuyến B; 1 cặp miền chỉ thuộc đúng 1 tuyến tại 1 thời điểm.

**AC6:** Đổi tên tuyến → tên mới áp dụng ngay cho tất cả cặp miền đang dùng tên đó (đổi hàng loạt), không tạo tuyến trùng hay cắt đứt liên kết.

**AC7:** Nút X xoá tuyến → các cặp miền thuộc tuyến đó trở về trạng thái "chưa cấu hình" (chip xám); không bị gán nhầm sang tuyến khác.

**AC8:** Khi có ít nhất 1 cặp miền chưa thuộc tuyến nào → banner cảnh báo màu vàng hiển thị, liệt kê các cặp đó (tối đa 6 cặp, còn lại ghi "và N cặp khác") kèm ghi chú "chưa tra được tuyến cho các cặp này".

**AC9:** Danh sách tên tuyến từ Bước 2 xuất hiện trong dropdown "Tuyến" tại màn Tạo bảng giá — thêm/xoá/đổi tên tuyến phản ánh ngay khi mở lại màn Tạo bảng giá.

## Notes (gốc — mục 1 đã lỗi thời, xem cảnh báo đầu file)

- ~~Trang "Kiểm tra tuyến" hiện CHƯA được nối vào cấu hình dùng chung này...~~ **Đã fix** — xem cảnh báo đầu file.
- Toàn bộ dữ liệu tuyến lưu ở bộ nhớ trong phiên (module-level state trong `routeConfig.ts`), KHÔNG có backend/persistence thật. *(Vẫn đúng ở Super Admin — xem GSA-ROUTE-6.)*
- Nhiều cặp miền có thể dùng chung 1 tên tuyến (để định giá giống nhau) — đây là thiết kế có chủ đích, không phải lỗi trùng lặp. *(Vẫn đúng.)*
