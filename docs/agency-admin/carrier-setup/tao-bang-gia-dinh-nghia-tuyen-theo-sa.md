---
id: AGA-CARRIER-19
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGENCY] Thiết lập NVC - Tạo bảng giá: Định nghĩa tuyến theo cấu hình Super Admin

## User Story

Là Agency Admin (Đại lý), tôi muốn danh sách "Tuyến" và "Vùng" khi tạo bảng giá được lấy tự động từ cấu hình Vùng & Tuyến do Super Admin quản lý tập trung, để không phải tự định nghĩa lại tuyến và mọi bảng giá (của mọi đại lý, mọi NVC) đều dùng chung 1 định nghĩa tuyến nhất quán.

## User Flow

1. Vào "Thiết lập NVC" → tab Bảng giá → "Thêm bảng giá" (hoặc bấm "Thêm tuyến" trong khối "Danh sách tuyến").
2. Mỗi dòng tuyến có dropdown "Tuyến" — danh sách tên tuyến LẤY TỪ cấu hình Super Admin (ví dụ "Nội Tỉnh", "Nội Vùng", "Liên Vùng Đặc Biệt", "Liên Vùng", "Liên Vùng Tỉnh", hoặc bất kỳ tên tuyến nào Super Admin đã đặt/đổi) — không tự gõ tên tuyến mới được.
3. Bấm nút "Định nghĩa tuyến" (đầu khối "Danh sách tuyến") → mở modal "Bảng mô tả tuyến dịch vụ", gồm 3 khối: "Định nghĩa miền / vùng" (chip tên miền + số tỉnh/thành mỗi miền), "Bảng tuyến" (2 cột: Tuyến | Cặp miền áp dụng), "Định nghĩa Nội thành / Ngoại thành" (chip xã/phường theo tỉnh, cam = Nội thành, xám = Ngoại thành). Cuối modal có dòng "Cấu hình vùng & tuyến do Super Admin quản lý tập trung, dùng chung cho mọi đại lý."
4. Modal chỉ để XEM — không có nút chỉnh sửa/link điều hướng nào sang trang cấu hình khác.
5. Với mỗi dòng tuyến, nếu bật toggle "Tách Nội thành/Ngoại thành" → xuất hiện icon (i) cạnh toggle, bấm vào cũng mở CÙNG modal "Bảng mô tả tuyến dịch vụ" ở trên (không phải modal riêng).
6. Phần "Thu hẹp phạm vi" (chọn Vùng/Tỉnh/Quận/Phường cho Từ - Đến) hiển thị cho MỌI tuyến, TRỪ tuyến đang là "tuyến nội tỉnh" của bất kỳ miền nào (ví dụ mặc định "Nội Tỉnh").
7. Đổi tuyến ở dropdown "Tuyến" → phần "Thu hẹp phạm vi" của đúng dòng đó reset về "Tất cả" cho cả 4 ô Vùng/Tỉnh/Quận/Phường (Từ và Đến).
8. Dropdown "Vùng" trong phần "Thu hẹp phạm vi" cũng lấy danh sách tên miền động từ cấu hình Super Admin.

## System Flow

1. `PricingCreate.tsx` import trực tiếp `regions`, `routeMatrix`, `isSameProvinceRouteName`, `describeSameProvinceRoutePairs`, `listRouteNames`, `urbanConfigs` từ `../../../mock-data/routeConfig.ts` — cùng module store mà Super Admin dùng để cấu hình Vùng & Tuyến (`RouteConfig.tsx`), không có bản sao/hardcode riêng cho Agency Admin.
2. Dropdown "Tuyến" (mỗi `RouteBlock`) render `listRouteNames().map(name => <option>)` — hàm này (trong `routeConfig.ts`) duyệt `Object.values(routeMatrix)`, khử trùng lặp, trả về danh sách tên tuyến DUY NHẤT theo đúng thứ tự khai báo trong `routeMatrix`.
3. `handleRouteNameChange(newRouteName)`: đổi `route.routeName` VÀ reset đồng thời cả 8 field `fromRegion/fromProvince/fromDistrict/fromWard/toRegion/toProvince/toDistrict/toWard` về rỗng — tránh giữ lại phạm vi thu hẹp của tuyến cũ khi đổi sang tuyến khác.
4. `showLocationScoping = !isSameProvinceRouteName(route.routeName)` — `isSameProvinceRouteName(name)` kiểm tra `regions.some(r => routeMatrix[pairKey(r.id, r.id)] === name)`, tức tên tuyến có khớp giá trị nằm trên ĐƯỜNG CHÉO của ma trận tuyến (cặp cùng 1 miền) hay không, với BẤT KỲ miền nào — diagonal value nằm ngay trong `routeMatrix` như mọi cặp khác, Super Admin có thể đổi tên độc lập từng miền qua đúng cơ chế chip toggle dùng chung với mọi tuyến khác.
5. `showLocationScoping === false` → ẩn hẳn khối "Thu hẹp phạm vi" (không render).
6. Nút "Định nghĩa tuyến" (đầu "Danh sách tuyến") và icon (i) cạnh toggle "Tách Nội thành/Ngoại thành" của MỖI dòng tuyến (khi bật) đều gọi chung `setShowZoneGuide(true)` (state ở component cha `PricingCreate`) → mở 1 modal `ZoneGuideModal` DUY NHẤT, không phải 2 modal riêng.
7. `ZoneGuideModal`: khối "Bảng tuyến" build từ `guideRows = listRouteNames().map(routeName => ...)` — với mỗi `routeName`, nếu `isSameProvinceRouteName(routeName)` thì `pairs = describeSameProvinceRoutePairs(routeName)` (liệt kê MỖI miền đang dùng tên đó, dạng "{tỉnh} ↔ {tỉnh}" nếu miền chỉ có 1 tỉnh, hoặc "Cùng 1 tỉnh trong {tên miền}" nếu miền có nhiều tỉnh); ngược lại duyệt `Object.entries(routeMatrix)` lấy mọi cặp `(regionA, regionB)` map sang đúng `routeName`, hiển thị dạng "{Tên miền A} ↔ {Tên miền B}".
8. Khối "Định nghĩa Nội thành / Ngoại thành" trong modal render trực tiếp từ `urbanConfigs` (cũng import từ `routeConfig.ts`) — mỗi tỉnh 1 card, chip xã/phường tô màu theo `w.isUrban` (cam = Nội thành, xám = Ngoại thành).
9. Modal KHÔNG chứa bất kỳ nút/link điều hướng nào sang trang khác — chỉ đọc dữ liệu tĩnh, không có `onClick` điều hướng route nào trong toàn bộ `ZoneGuideModal`.
10. Dữ liệu Vùng & Tuyến (`regions`, `routeMatrix`, `urbanConfigs`) lưu ở module-level state trong `routeConfig.ts` (không phải React Context/Zustand, không persist backend), dùng CHUNG giữa Super Admin và Agency Admin trong cùng phiên trình duyệt — Super Admin sửa ở `RouteConfig.tsx` thì `PricingCreate.tsx` thấy thay đổi ngay khi mở lại form, không cần reload trang.

## Acceptance Criteria

**AC1:** Dropdown "Tuyến" của mỗi dòng trong "Danh sách tuyến" lấy danh sách tên tuyến ĐỘNG từ `listRouteNames()` (cấu hình Super Admin) — không hardcode danh sách tuyến cố định trong `PricingCreate.tsx`.

**AC2:** Super Admin thêm/đổi tên/xoá tuyến ở `RouteConfig.tsx` → mở lại (hoặc đang mở sẵn) form Tạo bảng giá thấy đúng danh sách tuyến mới, không cần sửa code, không cần reload nếu component re-render.

**AC3:** Đổi tuyến ở dropdown "Tuyến" của 1 dòng → 8 field phạm vi (Từ/Đến × Vùng/Tỉnh/Quận/Phường) của ĐÚNG dòng đó reset về rỗng ("Tất cả"); các dòng tuyến khác không bị ảnh hưởng.

**AC4:** Tuyến đang là tuyến nội tỉnh của bất kỳ miền nào (`isSameProvinceRouteName === true`) → ẩn hẳn khối "Thu hẹp phạm vi" cho dòng đó; mọi tuyến khác luôn hiện khối này.

**AC5:** Nút "Định nghĩa tuyến" (đầu khối "Danh sách tuyến") mở modal "Bảng mô tả tuyến dịch vụ" gồm đúng 3 khối theo thứ tự: Định nghĩa miền/vùng, Bảng tuyến, Định nghĩa Nội thành/Ngoại thành.

**AC6:** Icon (i) cạnh toggle "Tách Nội thành/Ngoại thành" (chỉ xuất hiện khi toggle đang BẬT) mở ĐÚNG modal "Bảng mô tả tuyến dịch vụ" ở AC5 — không phải modal riêng.

**AC7:** Modal "Bảng mô tả tuyến dịch vụ" KHÔNG có bất kỳ nút/link điều hướng nào sang trang cấu hình khác — chỉ có dòng chú thích tĩnh cuối modal "Cấu hình vùng & tuyến do Super Admin quản lý tập trung, dùng chung cho mọi đại lý."

**AC8:** Trong "Bảng tuyến" của modal, 1 tuyến đang là tuyến nội tỉnh của NHIỀU miền khác nhau → liệt kê MỖI miền đó thành 1 dòng con riêng (không gộp chung 1 dòng) — ví dụ tên "Nội Tỉnh" đang dùng mặc định cho 6 miền thì hiện đủ 6 dòng con.

**AC9:** Cấu hình Vùng & Tuyến dùng CHUNG cho mọi bảng giá (không phân biệt NVC GHN/247Express/khác trong tương lai) và mọi đại lý — không phải cấu hình riêng theo từng bảng giá hay từng đại lý.

## Notes

- Story này viết lại từ đầu để khớp code HIỆN TẠI, thay cho nội dung cũ đã LỖI THỜI trong hệ thống Document: bản cũ mô tả cơ chế "mỗi miền tự đặt 1 tên nội tỉnh riêng" qua biến `sameProvinceRouteByRegion` — biến này ĐÃ BỊ GỠ BỎ hoàn toàn khỏi `routeConfig.ts` trong lần redesign gần nhất (xem GSA-ROUTE-3). Nay "Nội Tỉnh" chỉ là 1 tên GỢI Ý mặc định cho mọi đường chéo `routeMatrix`, Super Admin có thể tách riêng từng miền sang tên khác bất kỳ lúc nào qua đúng cơ chế chip/toggle dùng chung với mọi tuyến khác — không còn UI đặc biệt riêng cho "Nội Tỉnh" (xem GSA-ROUTE-3, phần "Cấu hình tuyến").
- Xem GSA-ROUTE-3 (Cấu hình tuyến, phía Super Admin) để hiểu cơ chế chip toggle gán tuyến cho từng cặp miền — đây là NGUỒN dữ liệu mà story này tiêu thụ (đọc), không mô tả lại cách cấu hình.
- Toàn bộ dữ liệu Vùng & Tuyến lưu ở bộ nhớ trong phiên (module-level state, không backend) — reload toàn trang (F5, tab mới) sẽ về lại dữ liệu seed ban đầu, mọi thay đổi Super Admin đã làm trong phiên trước đó sẽ mất.
- **Khoảng trống tài liệu đã biết (nay đã lấp)**: `agency-admin.json` đã có sẵn story ID `AGA-CARRIER-19` từ trước (tên cũ "Dùng chung cấu hình vùng & tuyến") nhưng CHƯA từng có file `.md` tương ứng và CHƯA xuất hiện trong `docs/agency-admin/README.md` — story này thay thế nội dung cũ, đổi tên theo đúng yêu cầu, và bổ sung file `.md` + dòng README còn thiếu.
- Không nhầm với AGA-CARRIER-16 ("Tách giá Nội thành/Ngoại thành theo tuyến" — mô tả toggle `splitUrbanRural` và 2 ô nhập GIÁ `basePriceUrban`/`basePriceRural`): story đó tập trung vào GIÁ theo khu vực, còn story này tập trung vào ĐỊNH NGHĨA tuyến/miền lấy từ đâu.
