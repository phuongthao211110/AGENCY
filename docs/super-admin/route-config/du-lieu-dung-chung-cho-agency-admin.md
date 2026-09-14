---
id: GSA-ROUTE-5
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Dữ liệu dùng chung cho Agency Admin

## User Story

Là GHN Super Admin, tôi muốn đảm bảo cấu hình Vùng & Tuyến tôi định nghĩa tại `/super-admin/route-config` được tiêu thụ đúng đắn trên Agency Admin — dropdown tuyến khi tạo bảng giá phản ánh danh sách tuyến hiện tại, công cụ kiểm tra tuyến trả ra đúng kết quả, và modal "Bảng mô tả tuyến dịch vụ" hiển thị đúng dữ liệu miền/tuyến/Nội-Ngoại thành — để đại lý không cần cấu hình lại vùng, tuyến hay Nội/Ngoại thành cho từng bảng giá.

## User Flow

1. Super Admin cấu hình miền, tuyến (bao gồm cả "Nội Tỉnh" — xem GSA-ROUTE-3), Nội/Ngoại thành tại trang "Vùng & Tuyến".
2. (Không cần bước lưu hay deploy riêng cho Miền/Tuyến — riêng Nội/Ngoại thành cần bấm "Lưu thay đổi", xem GSA-ROUTE-4) Agency Admin chuyển sang trang tạo bảng giá hoặc công cụ kiểm tra tuyến trong cùng phiên trình duyệt.
3. Dropdown "Tuyến" trong form tạo bảng giá hiển thị đúng danh sách tên tuyến Super Admin vừa cấu hình (bao gồm cả "Nội Tỉnh" nếu còn miền nào đang dùng tên đó).
4. Công cụ "Kiểm tra tuyến" (`RouteCheck.tsx`) của Agency Admin tra ra đúng tên tuyến cho cặp tỉnh đi/đến.
5. Bấm "Xem bảng mô tả tuyến dịch vụ" trong trang tạo bảng giá → modal hiện đủ 3 phần: định nghĩa miền/vùng, bảng tuyến theo cặp miền, và định nghĩa Nội thành/Ngoại thành theo từng tỉnh Super Admin đã cấu hình.

## System Flow

1. Toàn bộ dữ liệu Vùng & Tuyến lưu trong module-level mutable object `routeConfig.ts` — không có backend, không có localStorage; thay đổi Miền/Tuyến có hiệu lực ngay trong phiên SPA hiện tại mà không cần reload trang (Nội/Ngoại thành cần bấm "Lưu thay đổi" ở `RouteConfig.tsx` trước khi Agency Admin thấy được, vì khối đó sửa trên draft riêng — xem GSA-ROUTE-4).
2. **Dropdown tuyến khi tạo bảng giá** (`PricingCreate.tsx`, Agency Admin): gọi `listRouteNames()` từ `routeConfig.ts` để lấy danh sách tên tuyến duy nhất hiện có — Super Admin thêm/xoá/đổi tên tuyến sẽ phản ánh ngay trong dropdown này mà không cần đại lý cấu hình lại. Toggle "Tách Nội thành/Ngoại thành" chỉ hiện khi `!isSameProvinceRouteName(route.routeName)` — không áp dụng cho tuyến "Nội Tỉnh".
3. **Công cụ kiểm tra tuyến** (`RouteCheck.tsx`, Agency Admin): gọi `resolveRouteName()` — logic tra cứu: 2 tỉnh giống nhau → tra miền của tỉnh đó → đọc trực tiếp `routeMatrix[pairKey(regionId, regionId)]` (mặc định `'Nội Tỉnh'`, nhưng Super Admin có thể tách riêng từng miền sang tên khác qua chip — xem GSA-ROUTE-3); khác tỉnh → tra miền của mỗi tỉnh → tra cặp miền trong `routeMatrix` → ra tên tuyến; trả `null` nếu tỉnh chưa gán miền hoặc cặp miền chưa có tên tuyến.
4. **Modal "Bảng mô tả tuyến dịch vụ"** (`ZoneGuideModal` trong `PricingCreate.tsx`) — 1 modal DUY NHẤT gồm 3 khối: "Định nghĩa miền/vùng" (đếm số tỉnh mỗi miền), bảng "Tuyến | Cặp miền áp dụng" (dùng `listRouteNames()` + `isSameProvinceRouteName()`/`describeSameProvinceRoutePairs()` để gom các cặp "cùng miền" đang dùng chung 1 tên vào cùng 1 dòng, còn lại duyệt `routeMatrix` để gom cặp khác-miền theo tên tuyến), và "Định nghĩa Nội thành/Ngoại thành" (duyệt trực tiếp `urbanConfigs`). Agency Admin chỉ xem, không cấu hình được ở đây.
5. Reload trang thật (F5) sẽ reset toàn bộ về dữ liệu seed ban đầu vì không có backend thật.

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Agency Admin** — Tạo bảng giá (`PricingCreate.tsx`) | Dropdown "Tuyến" đọc `listRouteNames()` từ `routeConfig.ts` — danh sách tuyến phản ánh đúng cấu hình Super Admin hiện tại, không hardcode. Toggle "Tách Nội thành/Ngoại thành" trên 1 tuyến (ẩn với tuyến "Nội Tỉnh") cho phép nhập 2 mức giá `basePriceUrban`/`basePriceRural`. |
| **Agency Admin** — Kiểm tra tuyến (`RouteCheck.tsx`) | Công cụ tra cứu tuyến gọi `resolveRouteName()` — kết quả phụ thuộc trực tiếp vào miền và tuyến Super Admin đã cấu hình, bao gồm cả tên tuyến "cùng miền" mà Super Admin có thể tách riêng theo từng miền qua chip. Tỉnh chưa gán miền hoặc cặp miền chưa có tuyến → công cụ báo đúng nguyên văn "Không thể xác định tuyến. Vui lòng kiểm tra lại thông tin địa điểm — có thể tỉnh này chưa được Super Admin gán vào miền nào, hoặc cặp miền này chưa được đặt tên tuyến." (`RouteCheck.tsx` dòng 422). |
| **Agency Admin** — Modal "Bảng mô tả tuyến dịch vụ" (`ZoneGuideModal`) | Hiển thị định nghĩa miền, bảng tuyến theo cặp miền (gồm cả cặp cùng miền), và danh sách xã/phường Nội/Ngoại thành Super Admin cấu hình để đại lý tham chiếu khi thiết lập bảng giá. Agency Admin không có trang cấu hình riêng cho dữ liệu này. |

## Acceptance Criteria

**AC1:** Sau khi Super Admin thêm hoặc đổi tên tuyến tại "Vùng & Tuyến", chuyển sang Agency Admin (không reload trang) → dropdown "Tuyến" trong form tạo bảng giá hiển thị đúng tên tuyến mới ngay lập tức.

**AC2:** Sau khi Super Admin xoá tuyến, tên tuyến đó không còn xuất hiện trong dropdown "Tuyến" của Agency Admin.

**AC3:** Công cụ "Kiểm tra tuyến" của Agency Admin (`RouteCheck.tsx`) tra ra đúng tên tuyến cho cặp tỉnh đi/đến theo miền và ma trận cặp miền Super Admin đã cấu hình, bao gồm đúng tên "cùng miền" khi 2 tỉnh giống nhau — kể cả khi Super Admin đã tách 1 miền cụ thể sang 1 tên tuyến khác "Nội Tỉnh".

**AC4:** Nếu tỉnh đi hoặc đến chưa được gán miền, hoặc cặp miền tương ứng chưa có tên tuyến, công cụ kiểm tra tuyến báo đúng nguyên văn "Không thể xác định tuyến. Vui lòng kiểm tra lại thông tin địa điểm — có thể tỉnh này chưa được Super Admin gán vào miền nào, hoặc cặp miền này chưa được đặt tên tuyến." thay vì trả về tuyến sai.

**AC5:** Modal "Bảng mô tả tuyến dịch vụ" trong trang tạo bảng giá hiển thị đúng: số tỉnh mỗi miền, bảng cặp miền theo từng tuyến (gồm cả cặp cùng miền), và danh sách xã/phường + phân loại Nội/Ngoại thành Super Admin đã lưu (chỉ phản ánh dữ liệu đã "Lưu thay đổi", không phản ánh draft chưa lưu).

**AC6:** Toggle "Tách Nội thành/Ngoại thành" trong form tạo bảng giá chỉ hiện với tuyến KHÔNG PHẢI "Nội Tỉnh" — tuyến nội tỉnh luôn dùng 1 mức giá.

**AC7:** Agency Admin không có giao diện để sửa danh sách miền, tuyến, hoặc xã/phường Nội/Ngoại thành — chỉ đọc dữ liệu do Super Admin định nghĩa.

## Notes

- Store `routeConfig.ts` là module-level mutable object (không phải localStorage hay API) — điều hướng client-side (SPA, PlatformSwitcher) giữa Super Admin và Agency Admin trong cùng phiên trình duyệt sẽ thấy thay đổi Miền/Tuyến ngay lập tức; Nội/Ngoại thành cần Super Admin bấm "Lưu thay đổi" trước (cơ chế draft riêng, xem GSA-ROUTE-4). Reload trang thật (F5) reset về seed ban đầu vì không có backend thật.
- **Cập nhật theo redesign "Nội Tỉnh" (xem GSA-ROUTE-3)**: trước đây mỗi miền có 1 tên "cùng tỉnh" lưu riêng trong 1 dict (`sameProvinceRouteByRegion`), tách biệt hoàn toàn với ma trận cặp miền. Nay đã gộp lại — cặp "đường chéo" (cùng miền) của mỗi miền chính là 1 entry bình thường trong `routeMatrix` (seed mặc định `'Nội Tỉnh'`), tra cứu qua đúng 1 hàm `resolveRouteName()` duy nhất. Hành vi Agency Admin nhìn thấy (dropdown, kiểm tra tuyến, modal hướng dẫn) không đổi — đây là thay đổi nội bộ ở tầng dữ liệu Super Admin.
- Bảng tuyến trong `ZoneGuideModal` và bảng "N Tuyến hiện tại" ở `RouteCheck.tsx` đều gọi `isSameProvinceRouteName()` + `describeSameProvinceRoutePairs()` để tách dòng "cùng miền" thành nhiều dòng con — mỗi miền đang dùng 1 tên cho cặp đường chéo của nó liệt kê 1 dòng riêng (vd "Hà Nội ↔ Hà Nội", "Cùng 1 tỉnh trong Miền Nam (Vùng 1)"); nếu 2 miền đang dùng tên khác nhau cho cặp đường chéo của chúng, chúng tách thành 2 mục riêng trong danh sách tuyến thay vì gộp chung 1 dòng.
- Đổi số từ GSA-ROUTE-6 (cũ) thành GSA-ROUTE-5 sau khi xoá story "Điền nhanh theo khoảng tỉnh" (GSA-ROUTE-3 cũ).
