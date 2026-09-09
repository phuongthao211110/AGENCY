---
id: AGA-CARRIER-19
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGA] Thiết lập NVC - Tạo bảng giá: Dùng chung cấu hình vùng & tuyến

## ℹ️ Đã cập nhật lại cho đúng code hiện tại (2026)

Story này KHÔNG bị lỗi thời như AGA-CARRIER-17/18 — trang "Tạo bảng giá" (`PricingCreate.tsx`) vẫn nằm ở Agency Admin, dropdown "Tuyến"/"Vùng" vẫn đọc động từ cấu hình dùng chung. Nhưng nội dung cũ có 2 điểm SAI cần sửa: (1) tên modal thật là **"Bảng mô tả tuyến dịch vụ"**, không phải "Định nghĩa tuyến" (đó là tên NÚT bấm để mở modal, không phải tên modal); (2) modal **KHÔNG có link "Chỉnh sửa cấu hình vùng & tuyến →"** nào cả — đây là quyết định có chủ đích sau khi đổi hướng thiết kế (xem Notes). Đã sửa lại đầy đủ bên dưới, đồng thời bổ sung phần Nội thành/Ngoại thành mới thêm vào cùng modal. Xem thêm **GSA-ROUTE-6** (`docs/super-admin/route-config/du-lieu-dung-chung-cho-agency-admin.md`) — góc nhìn từ phía Super Admin của cùng mối quan hệ dữ liệu này.

## User Story

Là Agency Admin (Đại lý), tôi muốn dropdown "Tuyến" và "Vùng" trong màn Tạo bảng giá
tự động phản ánh cấu hình Miền/Vùng & Tuyến do Super Admin thiết lập — thay vì bị cố định
6 tuyến hardcode như trước — để mọi bảng giá (GHN, 247Express, NVC khác) đều dùng
chung 1 định nghĩa tuyến nhất quán, không cần sửa code khi thêm/bớt tuyến.

## User Flow

1. Agency Admin vào màn **Tạo bảng giá** (Thiết lập NVC → tab Bảng giá → Thêm bảng giá)
2. Trong phần "Danh sách tuyến", bấm nút **"Định nghĩa tuyến"** (nút bấm, không phải tên modal) → modal **"Bảng mô tả tuyến dịch vụ"** mở ra, gồm 3 khối: Định nghĩa miền/vùng (chip miền + số tỉnh/thành mỗi miền), Bảng tuyến (2 cột: Tuyến | Cặp miền áp dụng), và Định nghĩa Nội thành/Ngoại thành (chip xã/phường theo tỉnh, cam = Nội thành/xám = Ngoại thành)
3. Modal chỉ để XEM — không có link chỉnh sửa nào; dòng chú thích cuối modal ghi rõ "Cấu hình vùng & tuyến do Super Admin quản lý tập trung, dùng chung cho mọi đại lý."
4. Với mỗi dòng tuyến trong form, nếu bật toggle "Tách Nội thành/Ngoại thành" → xuất hiện icon (i) cạnh toggle, bấm vào cũng mở CÙNG modal "Bảng mô tả tuyến dịch vụ" ở trên (không phải modal riêng)
5. Bấm "Thêm tuyến" → dropdown "Tuyến" liệt kê tên tuyến động từ cấu hình Bước 2 bên Super Admin (xem GSA-ROUTE-4)
6. Phần thu hẹp phạm vi Tỉnh/Quận/Phường hiển thị cho tất cả tuyến, trừ tuyến có tên trùng 1 trong các luật "Nội Tỉnh" (mỗi miền có thể đặt tên nội tỉnh riêng — xem GSA-ROUTE-4)
7. Dropdown "Vùng" trong phần thu hẹp phạm vi lấy danh sách tên miền động từ cấu hình Bước 1 bên Super Admin (xem GSA-ROUTE-2)

## System Flow

1. `PricingCreate.tsx` import danh sách tuyến và miền từ `routeConfig.ts` (store dùng chung với Super Admin) thay vì mảng hardcode
2. Dropdown "Tuyến" render danh sách options từ `listRouteNames()` — thêm/xoá/đổi tên tuyến ở Super Admin phản ánh ngay khi mở lại form Tạo bảng giá (cùng phiên trình duyệt, không cần reload)
3. Dropdown "Vùng" trong phần thu hẹp phạm vi render từ mảng `regions` (export trực tiếp từ `routeConfig.ts`) thay vì ["Vùng 1", "Vùng 2", "Vùng 3"] hardcode
4. Kiểm tra `isSameProvinceRouteName(routeName)` — true nếu tên tuyến khớp tên nội tỉnh của BẤT KỲ miền nào (`sameProvinceRouteByRegion`, mỗi miền 1 tên riêng): nếu khớp → ẩn section thu hẹp phạm vi Tỉnh/Quận/Phường cho tuyến đó
5. Component `ZoneGuideModal` (`PricingCreate.tsx`) tự tính toán trực tiếp từ `routeMatrix` + `routeRegions` + `sameProvinceRouteByRegion` + `urbanConfigs` qua helper `isSameProvinceRouteName()`/`describeSameProvinceRoutePairs()` — render 3 khối: "Định nghĩa miền / vùng" (mỗi miền là 1 chip + số tỉnh/thành), "Bảng tuyến" (grid 2 cột, mỗi tuyến liệt kê các cặp miền áp dụng; tuyến trùng tên nội tỉnh của 1 hay nhiều miền hiện 1 dòng con cho MỖI miền đang dùng tên đó, ví dụ "Hà Nội ↔ Hà Nội" / "Cùng 1 tỉnh trong Miền Nam (Vùng 1)" — 2 miền đặt tên khác nhau sẽ tách thành 2 mục tuyến riêng), "Định nghĩa Nội thành / Ngoại thành" (mỗi tỉnh trong `urbanConfigs` là 1 card, chip xã/phường màu theo `isUrban`)
6. `ZoneGuideModal` được mở từ 2 nơi: nút "Định nghĩa tuyến" ở đầu "Danh sách tuyến" (`setShowZoneGuide(true)`), và icon (i) cạnh toggle "Tách Nội thành/Ngoại thành" của mỗi dòng tuyến (`onOpenZoneGuide` truyền xuống `RouteBlock`) — cả 2 đều mở CHUNG 1 modal, không phải 2 modal riêng
7. Modal KHÔNG chứa bất kỳ link/nút điều hướng nào sang trang cấu hình — Agency Admin chỉ đọc, không sửa được miền/tuyến/Nội-Ngoại thành

## Acceptance Criteria

**AC1:** Dropdown "Tuyến" trong form Tạo bảng giá lấy danh sách tên tuyến động từ cấu hình Super Admin — không còn hardcode 6 tuyến cố định.

**AC2:** Super Admin thêm/đổi tên/xoá tuyến → dropdown "Tuyến" trong form Tạo bảng giá phản ánh thay đổi ngay khi mở lại form (cùng phiên trình duyệt), không cần sửa code.

**AC3:** Dropdown "Vùng" trong phần thu hẹp phạm vi Từ/Đến của mỗi dòng tuyến lấy danh sách tên miền động từ cấu hình Super Admin — không còn hardcode "Vùng 1/2/3".

**AC4:** Tuyến có tên trùng tên nội tỉnh của bất kỳ miền nào → phần thu hẹp phạm vi Tỉnh/Quận/Phường bị ẩn cho tuyến đó; tất cả tuyến khác vẫn hiển thị phần thu hẹp phạm vi bình thường.

**AC5:** Nút "Định nghĩa tuyến" mở modal "Bảng mô tả tuyến dịch vụ" gồm đúng 3 khối: Định nghĩa miền/vùng, Bảng tuyến (Tuyến | Cặp miền áp dụng — tuyến nội tỉnh liệt kê 1 dòng con cho mỗi miền đang dùng tên đó, ví dụ "Hà Nội ↔ Hà Nội", "Cùng 1 tỉnh trong Miền Nam (Vùng 1)"), và Định nghĩa Nội thành/Ngoại thành.

**AC6:** Modal "Bảng mô tả tuyến dịch vụ" KHÔNG có bất kỳ link hay nút điều hướng nào sang trang cấu hình khác — chỉ có dòng chú thích tĩnh "Cấu hình vùng & tuyến do Super Admin quản lý tập trung, dùng chung cho mọi đại lý."

**AC7:** Icon (i) cạnh toggle "Tách Nội thành/Ngoại thành" (khi bật) mở đúng modal "Bảng mô tả tuyến dịch vụ" ở trên — không phải modal riêng cho Nội/Ngoại thành.

**AC8:** Cấu hình vùng & tuyến dùng chung cho mọi bảng giá (GHN, 247Express, và NVC khác trong tương lai) — không phải cấu hình riêng per bảng giá, và không phải cấu hình riêng per đại lý.

## Notes

- **Lịch sử quyết định:** Ban đầu có xây 1 trang chi tiết chỉ-xem (`RouteConfigView.tsx`) cho Agency Admin để "thấy những gì Super Admin đã cấu hình", kèm link điều hướng từ modal sang đó — sau đó bị huỷ theo phản hồi trực tiếp: *"ý tôi là trên agency ko cần thấy trang cấu hình vùng/tuyến mà xem định nghĩa tuyến trong bảng giá như cũ"*. Trang `RouteConfigView.tsx` đã bị xoá, modal quay lại dạng thông tin thuần tuý như hiện tại — đây là lý do AC6 khẳng định modal không có link điều hướng nào.
- ~~Trang "Kiểm tra tuyến" (`RouteCheck.tsx`) hiện CHƯA được nối vào cấu hình dùng chung này~~ — **đã fix**, `RouteCheck.tsx` giờ đọc `resolveRouteName()`/`listRouteNames()`/`regions` trực tiếp từ `routeConfig.ts`, đã verify bằng Playwright (đổi tên tuyến ở Super Admin thấy ngay ở Agency Admin, không cần reload).
- Toàn bộ dữ liệu (miền, tuyến, Nội/Ngoại thành) lưu ở bộ nhớ trong phiên (module-level state trong `routeConfig.ts`), KHÔNG có backend/persistence thật — reload lại toàn trang (F5, tab mới) sẽ trả về đúng dữ liệu seed ban đầu.
- Xem **GSA-ROUTE-6** để có bảng "Tác động đa nền tảng" đầy đủ từ góc nhìn Super Admin (bên cấu hình), bổ sung cho story này (bên tiêu thụ).
- Trước đây "Nội Tỉnh" là 1 tên tuyến DUY NHẤT dùng chung cho mọi miền (`sameProvinceRoute`, hằng số toàn cục) — đã đổi thành mỗi miền tự đặt tên/giá nội tỉnh riêng (`sameProvinceRouteByRegion`, key theo `regionId`) để Super Admin (và qua đó Agency Admin) tính được giá nội tỉnh khác nhau theo từng miền, ví dụ Hà Nội khác Miền Nam (Vùng 1). Chi tiết xem GSA-ROUTE-4.
