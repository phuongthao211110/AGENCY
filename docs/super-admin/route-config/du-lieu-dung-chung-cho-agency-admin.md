---
id: GSA-ROUTE-6
jiraKey: 
platform: super-admin
section: Cấu hình Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Cấu hình Vùng & Tuyến: Dữ liệu dùng chung cho Agency Admin

## User Story

Là GHN Super Admin, tôi muốn đảm bảo cấu hình Vùng & Tuyến tôi định nghĩa tại Super Admin được tiêu thụ đúng đắn trên Agency Admin — dropdown tuyến khi tạo bảng giá phản ánh danh sách tuyến hiện tại, công cụ kiểm tra tuyến trả ra đúng kết quả, và modal hướng dẫn Nội/Ngoại thành hiển thị đúng dữ liệu — để đại lý không cần cấu hình tuyến riêng cho từng bảng giá.

## User Flow

1. Super Admin cấu hình miền, tuyến, Nội/Ngoại thành tại `/super-admin/route-config`
2. (Không cần bước lưu hay deploy riêng) Agency Admin chuyển sang trang tạo bảng giá hoặc công cụ kiểm tra tuyến trong cùng phiên trình duyệt
3. Dropdown "Tuyến" trong form tạo bảng giá hiển thị đúng danh sách tên tuyến Super Admin vừa cấu hình
4. Công cụ "Kiểm tra tuyến" của Agency Admin tra ra đúng tên tuyến cho cặp tỉnh đi/đến
5. Modal "Hướng dẫn Nội/Ngoại thành" trong tạo bảng giá hiển thị đúng danh sách xã/phường Super Admin cấu hình

## System Flow

1. Toàn bộ dữ liệu Vùng & Tuyến lưu trong module-level mutable object `routeConfig.ts` — không có backend, không có localStorage; thay đổi có hiệu lực ngay trong phiên SPA hiện tại mà không cần reload trang
2. **Dropdown tuyến khi tạo bảng giá** (`PricingCreate.tsx`, Agency Admin): gọi `listRouteNames()` từ `routeConfig.ts` để lấy danh sách tên tuyến duy nhất hiện có — Super Admin thêm/xoá/đổi tên tuyến sẽ phản ánh ngay trong dropdown này mà không cần đại lý cấu hình lại
3. **Công cụ kiểm tra tuyến** (`RouteCheck.tsx`, Agency Admin): gọi `resolveRouteName()` và `listRouteNames()` từ cùng store — logic tra cứu: 2 tỉnh giống nhau → tra miền của tỉnh đó → trả tên "Nội Tỉnh" RIÊNG của miền đó (`sameProvinceRouteByRegion[regionId]`, mỗi miền có thể đặt tên/giá khác nhau); khác tỉnh → tra miền của mỗi tỉnh → tra cặp miền trong ma trận → ra tên tuyến; trả `null` nếu tỉnh chưa gán miền hoặc cặp miền chưa có tên tuyến
4. **Modal Nội/Ngoại thành** (`UrbanGuideModal` trong `PricingCreate.tsx`, Agency Admin): đọc `urbanConfigs` và `resolveUrbanArea()` từ `routeConfig.ts` — Agency Admin chỉ xem, không cấu hình
5. Reload trang thật (F5) sẽ reset toàn bộ về dữ liệu seed ban đầu vì không có backend thật

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Agency Admin** — Tạo bảng giá (`PricingCreate.tsx`) | Dropdown "Tuyến" đọc `listRouteNames()` từ `routeConfig.ts` — danh sách tuyến phản ánh đúng cấu hình Super Admin hiện tại, không hardcode. Toggle "Tách khu vực" dùng `urbanConfigs` để hiện 2 mức giá Nội/Ngoại thành theo xã/phường. |
| **Agency Admin** — Kiểm tra tuyến (`RouteCheck.tsx`) | Công cụ tra cứu tuyến gọi `resolveRouteName()` và đọc `regions` từ cùng store — kết quả phụ thuộc trực tiếp vào miền và tuyến Super Admin đã cấu hình. Tỉnh chưa gán miền hoặc cặp miền chưa có tuyến → công cụ báo đúng nguyên văn "Không thể xác định tuyến. Vui lòng kiểm tra lại thông tin địa điểm — có thể tỉnh này chưa được Super Admin gán vào miền nào, hoặc cặp miền này chưa được đặt tên tuyến." (`RouteCheck.tsx` dòng 421). |
| **Agency Admin** — Modal hướng dẫn Nội/Ngoại thành (`UrbanGuideModal`) | Hiển thị danh sách xã/phường Nội/Ngoại thành Super Admin cấu hình để đại lý tham chiếu khi thiết lập bảng giá. Agency Admin không có trang cấu hình riêng cho dữ liệu này. |

## Acceptance Criteria

**AC1:** Sau khi Super Admin thêm hoặc đổi tên tuyến tại `/super-admin/route-config`, chuyển sang Agency Admin (không reload trang) → dropdown "Tuyến" trong form tạo bảng giá hiển thị đúng tên tuyến mới ngay lập tức.

**AC2:** Sau khi Super Admin xoá tuyến, tên tuyến đó không còn xuất hiện trong dropdown "Tuyến" của Agency Admin.

**AC3:** Công cụ "Kiểm tra tuyến" của Agency Admin (`RouteCheck.tsx`) tra ra đúng tên tuyến cho cặp tỉnh đi/đến theo miền và ma trận cặp miền Super Admin đã cấu hình.

**AC4:** Nếu tỉnh đi hoặc đến chưa được gán miền, hoặc cặp miền tương ứng chưa có tên tuyến, công cụ kiểm tra tuyến báo đúng nguyên văn "Không thể xác định tuyến. Vui lòng kiểm tra lại thông tin địa điểm — có thể tỉnh này chưa được Super Admin gán vào miền nào, hoặc cặp miền này chưa được đặt tên tuyến." (`RouteCheck.tsx` dòng 421) thay vì trả về tuyến sai.

**AC5:** Modal hướng dẫn Nội/Ngoại thành trong trang tạo bảng giá hiển thị đúng danh sách xã/phường và phân loại Nội/Ngoại thành Super Admin đã cấu hình.

**AC6:** Agency Admin không có giao diện để sửa danh sách miền, tuyến, hoặc xã/phường Nội/Ngoại thành — chỉ đọc dữ liệu do Super Admin định nghĩa.

## Notes

- Store `routeConfig.ts` là module-level mutable object (không phải localStorage hay API) — điều hướng client-side (SPA, PlatformSwitcher) giữa Super Admin và Agency Admin trong cùng phiên trình duyệt sẽ thấy thay đổi ngay; reload trang thật (F5) reset về seed ban đầu vì không có backend thật.
- Bảng "N Tuyến hiện tại" ở `RouteCheck.tsx` và bảng tuyến trong `ZoneGuideModal` (`PricingCreate.tsx`) đều gọi `isSameProvinceRouteName()` + `describeSameProvinceRoutePairs()` để tách dòng "Nội Tỉnh" thành nhiều dòng con — mỗi miền đang dùng tên đó liệt kê 1 dòng riêng (vd "Hà Nội ↔ Hà Nội", "Cùng 1 tỉnh trong Miền Nam (Vùng 1)"); nếu 2 miền đổi sang 2 tên khác nhau, chúng tách thành 2 mục riêng trong danh sách tuyến thay vì gộp chung 1 dòng "Nội Tỉnh" như trước.
