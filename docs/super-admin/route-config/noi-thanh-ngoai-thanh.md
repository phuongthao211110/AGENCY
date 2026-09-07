---
id: GSA-ROUTE-5
jiraKey: 
platform: super-admin
section: Cấu hình Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Cấu hình Vùng & Tuyến: Nội thành / Ngoại thành

## User Story

Là GHN Super Admin, tôi muốn cấu hình danh sách xã/phường Nội thành và Ngoại thành theo từng tỉnh/thành phố để các đại lý có thể tách giá Nội/Ngoại thành khi tạo bảng giá.

## User Flow

1. Super Admin cuộn đến khối "Nội thành / Ngoại thành" trong trang Cấu hình Vùng & Tuyến
2. Nhập tên tỉnh/thành mới vào ô input + bấm "Thêm tỉnh"
3. Card tỉnh mới xuất hiện, ban đầu chưa có xã/phường nào
4. Super Admin nhập tên xã/phường vào ô "+ Thêm xã/phường (Enter)" → nhấn Enter (xã/phường mới mặc định là Ngoại thành)
5. Bấm chip xã/phường để đổi phân loại Nội ↔ Ngoại thành
6. Bấm X trên chip để xoá xã/phường khỏi tỉnh
7. Bấm X đầu card để xoá cả tỉnh khỏi danh sách phân biệt

## System Flow

1. `RouteConfig.tsx` dòng 456–539 render khối Nội thành / Ngoại thành — khối này độc lập với phần Miền/Tuyến ở trên
2. `handleAddUrbanProvince` — thêm tỉnh mới vào `urbanConfigs` trong `routeConfig.ts`, ban đầu chưa có xã/phường nào
3. `handleAddUrbanWard` — thêm xã/phường mới vào tỉnh, mặc định `isUrban: false` (Ngoại thành)
4. `handleToggleUrbanWard` — bấm chip để đổi phân loại: chip cam = Nội thành (`isUrban: true`), chip xám = Ngoại thành (`isUrban: false`)
5. `handleRemoveUrbanWard` — xoá xã/phường khỏi tỉnh (bấm X trên chip)
6. `handleRemoveUrbanProvince` — xoá cả tỉnh khỏi `urbanConfigs`
7. Dữ liệu `urbanConfigs` được đọc bởi Agency Admin qua `resolveUrbanArea()` khi tạo bảng giá có toggle "Tách khu vực", và xem qua `UrbanGuideModal` trong `PricingCreate.tsx`

## Acceptance Criteria

**AC1:** Khối "Nội thành / Ngoại thành" có ô nhập tên tỉnh/thành và nút "Thêm tỉnh"; nếu chưa thêm tỉnh nào, hiển thị "Chưa có tỉnh nào cấu hình Nội/Ngoại thành."

**AC2:** Mỗi card tỉnh gồm: tên tỉnh, dải chip xã/phường (chip cam = Nội thành, chip xám = Ngoại thành), ô input "+ Thêm xã/phường (Enter)" cuối dải chip, và nút X đầu card để xoá cả tỉnh.

**AC3:** Xã/phường mới thêm vào mặc định là Ngoại thành (chip xám) — phải bấm chip để đổi thành Nội thành (chip cam) sau.

**AC4:** Bấm chip xã/phường để đổi phân loại Nội ↔ Ngoại thành; bấm X trên chip để xoá hẳn xã/phường đó.

**AC5:** Mô tả trong giao diện: "Theo xã/phường (địa giới mới sau sáp nhập 2025, cấp quận/huyện không còn) — chỉ vài thành phố có phân biệt giá Nội/Ngoại thành, dùng cho toggle 'Tách khu vực' khi tạo bảng giá. Dữ liệu demo minh hoạ, chưa đầy đủ toàn bộ xã/phường thật."

**AC6:** Khối này hoàn toàn độc lập với phần Miền/Tuyến — thay đổi Nội/Ngoại thành không ảnh hưởng đến miền hay tuyến, và ngược lại.

**AC7:** Agency Admin không có trang cấu hình Nội/Ngoại thành riêng — chỉ xem qua modal `UrbanGuideModal` trong trang tạo bảng giá (`PricingCreate.tsx`) khi bật toggle "Tách khu vực".
