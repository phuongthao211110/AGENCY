---
id: AGA-CARRIER-20
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGENCY] Thiết lập NVC - Tạo bảng giá: Thêm tuyến theo cấu hình Super Admin

## User Story

Là Agency Admin (Đại lý), tôi muốn bấm "Thêm tuyến" trong màn Tạo bảng giá để thêm 1 dòng cấu hình giá mới, với tuyến mặc định lấy từ danh sách tuyến do Super Admin định nghĩa, để nhanh chóng bổ sung thêm mức giá cho tuyến khác mà không phải tự gõ hay nhớ chính xác tên tuyến.

## User Flow

1. Mở form Tạo bảng giá → khối "Danh sách tuyến" TỰ ĐỘNG khởi tạo sẵn N dòng (N = số tuyến Super Admin đã cấu hình tại thời điểm mở form), mỗi dòng ứng với đúng 1 tuyến, các field giá còn để trống.
2. Cuối danh sách luôn có nút viền nét đứt "+ Thêm tuyến".
3. Bấm "+ Thêm tuyến" → thêm 1 dòng MỚI vào cuối danh sách; dropdown "Tuyến" của dòng mới mặc định chọn TUYẾN ĐẦU TIÊN trong danh sách Super Admin đã cấu hình — không phải ô trống, không tự gõ tên tuyến.
4. Số đếm "{N} tuyến" ở góc phải tiêu đề khối tự tăng lên ngay khi thêm dòng mới.
5. Đổi dropdown "Tuyến" của dòng mới sang tên tuyến khác bất kỳ trong danh sách Super Admin (xem AGA-CARRIER-19 để biết danh sách tuyến lấy từ đâu) để cấu hình đúng tuyến mong muốn.
6. Không giới hạn số dòng có thể thêm — có thể thêm nhiều dòng hơn số tuyến Super Admin đã định nghĩa, kể cả chọn TRÙNG tên tuyến với 1 dòng đã có sẵn (không có cảnh báo trùng).
7. Xoá 1 dòng bất kỳ bằng nút "✕" ở góc trên bên phải mỗi dòng — không giới hạn xoá tới 0 dòng, khi đó hiện "Chưa có tuyến nào. Thêm tuyến để cấu hình giá." thay cho danh sách.
8. Dòng mới thêm KHÔNG kế thừa bất kỳ giá trị nào từ dòng khác — mọi field (Khối lượng chuẩn, Giá chuẩn, Vượt cân, Phụ phí, Thu hẹp phạm vi, Tách Nội/Ngoại thành) đều ở trạng thái trống/mặc định.

## System Flow

1. `routes` (state, `RouteConfig[]`) khởi tạo LẦN ĐẦU bằng `listRouteNames().map((name, i) => makeEmptyRoute(name, String(i + 1)))` — tự động seed đúng 1 dòng CHO MỖI tên tuyến Super Admin đã cấu hình tại thời điểm mở form (không phải danh sách rỗng ban đầu).
2. `addRoute()`: `setRoutes(prev => [...prev, makeEmptyRoute(listRouteNames()[0] ?? '', Date.now().toString())])` — LUÔN lấy `listRouteNames()[0]` (tuyến ĐẦU TIÊN theo đúng thứ tự khai báo trong `routeMatrix` của Super Admin) làm giá trị mặc định cho dòng mới; KHÔNG có logic tự chọn tuyến "còn thiếu"/"chưa dùng trong form". Nếu `listRouteNames()` rỗng (lý thuyết — `routeMatrix` luôn được seed sẵn nên hiếm khi xảy ra) thì fallback `''`.
3. `makeEmptyRoute(routeName, id)`: tạo `RouteConfig` mới với `routeName` truyền vào; mọi field vị trí (`from`/`to` × `Region`/`Province`/`District`/`Ward`) rỗng; `standardWeight`/`basePrice`/`basePriceUrban`/`basePriceRural` rỗng; `splitUrbanRural: false`; `overweightTiers: []`; `surcharges: makeEmptySurcharges()` — hoàn toàn độc lập với các dòng đã có, không copy giá trị từ dòng nào.
4. `id` của dòng mới dùng `Date.now().toString()` (khác scheme `String(i + 1)` của các dòng seed ban đầu) — chỉ cần duy nhất để dùng làm React `key` và để `updateRoute`/`deleteRoute` xác định đúng dòng, không mang ý nghĩa nghiệp vụ.
5. `routes.length` hiển thị trực tiếp ở góc phải tiêu đề "Danh sách tuyến" dạng "{routes.length} tuyến" — đọc thẳng từ state, không qua bước tính toán riêng.
6. KHÔNG có bước kiểm tra trùng `routeName` giữa các dòng trong `routes` — `addRoute()`, và `handleRouteNameChange` (trong `RouteBlock`, khi đổi tuyến của 1 dòng đang có) đều không so sánh với `routeName` của các dòng khác.
7. `deleteRoute(id)`: `setRoutes(prev => prev.filter(r => r.id !== id))` — xoá đúng 1 dòng theo `id`; các dòng còn lại giữ nguyên vị trí và dữ liệu.
8. Nút "Thêm tuyến" LUÔN bấm được (không có điều kiện `disabled`) — không giới hạn số dòng tối đa.

## Acceptance Criteria

**AC1:** Mở form Tạo bảng giá lần đầu (chưa từng chỉnh sửa) → "Danh sách tuyến" tự động hiện sẵn đúng N dòng (N = số tuyến Super Admin đã cấu hình tại thời điểm đó), mỗi dòng ứng 1 tuyến khác nhau theo đúng thứ tự Super Admin khai báo.

**AC2:** Bấm "+ Thêm tuyến" → thêm đúng 1 dòng mới vào CUỐI danh sách hiện có (không chèn giữa, không thay thế dòng nào).

**AC3:** Dòng mới thêm có dropdown "Tuyến" mặc định chọn TUYẾN ĐẦU TIÊN trong danh sách Super Admin đã cấu hình (`listRouteNames()[0]`) — không phải ô trống, không tự nhập tên tuyến mới.

**AC4:** Mọi field khác của dòng mới (Khối lượng chuẩn, Giá chuẩn, Vượt cân, Phụ phí, Thu hẹp phạm vi, Tách Nội/Ngoại thành) đều ở trạng thái TRỐNG/mặc định ban đầu — không kế thừa giá trị từ bất kỳ dòng nào đã có.

**AC5:** Số đếm "{N} tuyến" ở góc phải tiêu đề khối "Danh sách tuyến" cập nhật ngay = tổng số dòng đang có sau khi thêm/xoá, không cần thao tác thêm.

**AC6:** Có thể thêm nhiều dòng có CÙNG tên tuyến (chọn trùng dropdown "Tuyến" với 1 dòng đã có) — hệ thống không chặn, không cảnh báo trùng.

**AC7:** Nút "+ Thêm tuyến" luôn bấm được, không giới hạn số dòng tối đa có thể thêm.

**AC8:** Xoá hết mọi dòng (còn 0 dòng) → hiện dòng chữ "Chưa có tuyến nào. Thêm tuyến để cấu hình giá." thay cho danh sách trống; nút "+ Thêm tuyến" vẫn còn để thêm lại.

## Notes

- **Known gap**: hệ thống không kiểm tra/cảnh báo khi 2 dòng trong cùng 1 bảng giá trỏ tới CÙNG 1 tên tuyến — 2 dòng "Nội Tỉnh" với 2 mức giá khác nhau đều hợp lệ về mặt UI, có thể gây nhầm lẫn giá nào mới thật sự áp dụng khi tính cước (ngữ nghĩa "2 dòng cùng tuyến" chưa được định nghĩa rõ ở tầng nghiệp vụ) — cần làm rõ nếu đưa lên production.
- Tuyến mặc định của dòng mới LUÔN là `listRouteNames()[0]` bất kể dòng đó đã tồn tại hay chưa trong form — người dùng cần tự đổi dropdown sang đúng tuyến muốn thêm; đây không phải lỗi mà là hành vi chủ ý đơn giản hoá (không cố tính toán "tuyến còn thiếu" để tránh phức tạp thêm logic).
- Xem AGA-CARRIER-19 để biết dropdown "Tuyến" của mỗi dòng lấy danh sách từ đâu và modal "Định nghĩa tuyến" mô tả cấu hình Super Admin ra sao — story này chỉ tập trung vào hành vi nút "+ Thêm tuyến", không lặp lại nội dung đó.
- `routes` chỉ tồn tại trong state cục bộ của form CHO TỚI KHI bấm "Tạo bảng giá" — rời trang giữa chừng (chưa bấm) sẽ mất toàn bộ các dòng đã thêm/chỉnh sửa. Sau khi bấm "Tạo bảng giá", dữ liệu ĐƯỢC LƯU THẬT vào `pricingStore` — xem AGA-CARRIER-21 cho luồng lưu + đồng bộ tuyến với Super Admin/Web Shop (trước đó bấm nút này chỉ điều hướng đi, không lưu gì — đã fix).
