---
id: GSA-ROUTE-6
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Thêm vùng

## User Story

Là GHN Super Admin, tôi muốn thêm 1 vùng miền mới từ khối "Cấu hình vùng miền" và có ngay giá "cùng tỉnh" mặc định cho vùng đó (không cần thao tác thêm ở khối Tuyến), để vùng mới có thể dùng để tính giá càng sớm càng tốt sau khi tạo.

## User Flow

1. Trong khối "🗺️ Cấu hình vùng miền", bấm nút "+ Thêm vùng miền" ở cuối bảng.
2. 1 dòng vùng mới xuất hiện ở cuối bảng — tên trống, chưa có tỉnh nào, KHÔNG hiện lỗi gì (theo hành vi validate của GSA-ROUTE-2: chỉ báo lỗi sau khi đã đặt tên).
3. Gõ tên vào ô tên — nếu trùng với tên 1 vùng khác (không phân biệt hoa/thường), lỗi đỏ "Tên vùng miền đã tồn tại" hiện ngay; nếu hợp lệ thì hết lỗi.
4. Chọn tỉnh từ dropdown "Chọn Tỉnh/Thành" (chỉ liệt kê tỉnh chưa thuộc vùng nào) để gán vào vùng mới — có thể chọn nhiều tỉnh liên tiếp, mỗi lần 1 tỉnh.
5. Nếu đã đặt tên nhưng chưa chọn tỉnh nào, lỗi đỏ "Vui lòng chọn Tỉnh/Thành" hiện dưới dropdown.
6. Chuyển sang khối "🔀 Cấu hình tuyến": vùng mới đã tự động có mặt trong dòng "Nội Tỉnh" — cặp "cùng vùng" của vùng mới đã được tick sẵn vào tuyến này, không cần thao tác gì thêm để vùng mới có giá "gửi trong cùng tỉnh".
7. Vẫn trong khối "Cấu hình tuyến": mọi cặp GIỮA vùng mới và các vùng đã có từ trước đều ở trạng thái "chưa cấu hình" — Super Admin cần chủ động bấm chip để gán các cặp này vào 1 tuyến phù hợp (có sẵn hoặc tạo mới), nếu không chúng sẽ hiện trong dòng cảnh báo cuối khối.

## System Flow

1. `handleAddRegion()` trong `RouteConfig.tsx` gọi `addRegion('')` từ `routeConfig.ts` — tạo `RegionDef` mới với `id: region_${Date.now()}`, `name: ''`, `provinces: []`; đồng thời `addRegion()` tự động seed `routeMatrix[pairKey(newId, newId)] = 'Nội Tỉnh'` (xem GSA-ROUTE-3) — đây là bước duy nhất khiến vùng mới có ngay giá "cùng tỉnh" mặc định.
2. Sau khi gọi `addRegion`, component `setLocalRegions` thêm vùng mới vào state cục bộ và `setLocalMatrix(() => ({ ...routeMatrix }))` để đồng bộ lại, lấy luôn entry "Nội Tỉnh" vừa seed cho vùng mới.
3. Vùng mới ngay lập tức được tính vào `allRegionPairs` (dùng chung bởi khối "Cấu hình tuyến") — với N vùng đã có từ trước, vùng mới sinh ra N cặp CHÉO (khác vùng) + 1 cặp đường chéo (cùng vùng, đã seed "Nội Tỉnh"). N cặp chéo này đều CHƯA có key trong `routeMatrix` nên được tính vào `unconfiguredPairs`.
4. `handleRenameRegion(id, name)` gọi `renameRegion(id, name)` — cập nhật tên ngay theo từng ký tự gõ (không debounce), `regionNameError(region)` (xem GSA-ROUTE-2) chạy lại mỗi lần render để xác định có lỗi trùng tên hay không.
5. `handleAssignProvince(province, regionId)` gọi `assignProvinceToRegion(province, regionId)` — dropdown "Chọn Tỉnh/Thành" chỉ liệt kê tỉnh có trong `unassignedList` (tỉnh chưa thuộc vùng nào); `provinceError` (xem GSA-ROUTE-2) chỉ hiện khi vùng đã có tên nhưng `provinces.length === 0`.
6. Vì `routeNames` (danh sách tên tuyến hiển thị ở khối Cấu hình tuyến) không đổi khi thêm vùng (chỉ `routeMatrix`/`allRegionPairs` đổi), dòng "Nội Tỉnh" và mọi dòng tuyến khác hiển thị NGAY chip mới cho vùng vừa thêm mà không cần thao tác refresh nào.

## Acceptance Criteria

**AC1:** Bấm "+ Thêm vùng miền" → thêm 1 dòng vùng mới ở cuối bảng "Cấu hình vùng miền" — tên rỗng, chưa có tỉnh nào, KHÔNG hiện lỗi gì ngay lúc này.

**AC2:** Ngay khi vùng mới được tạo (trước cả khi đặt tên), cặp "cùng vùng" (đường chéo) của vùng đó đã được gán sẵn vào tuyến "Nội Tỉnh" ở khối "Cấu hình tuyến" — hiện dưới dạng chip đã tick (cam đậm) trong dòng "Nội Tỉnh", không cần Super Admin thao tác gì thêm.

**AC3:** Mọi cặp GIỮA vùng mới và các vùng đã có từ trước đều ở trạng thái "chưa cấu hình" ngay sau khi tạo — các cặp này được cộng thêm vào số đếm ở dòng cảnh báo cuối khối "Cấu hình tuyến" ("N cặp vùng miền chưa được gán tuyến").

**AC4:** Gõ tên trùng với 1 vùng khác (không phân biệt hoa/thường) → lỗi đỏ "Tên vùng miền đã tồn tại" hiện ngay dưới ô tên; sửa thành tên không trùng → lỗi biến mất ngay, không cần submit hay rời focus khỏi ô.

**AC5:** Vùng đã đặt tên nhưng chưa chọn tỉnh nào → lỗi đỏ "Vui lòng chọn Tỉnh/Thành" hiện dưới dropdown chọn tỉnh; vùng chưa đặt tên thì không hiện lỗi này (theo GSA-ROUTE-2).

**AC6:** Chọn 1 tỉnh từ dropdown "Chọn Tỉnh/Thành" → tỉnh đó được gán vào vùng mới và biến mất khỏi danh sách tỉnh khả dụng ở MỌI dòng khác trong bảng (không chỉ dòng vừa thêm).

**AC7:** Sau khi tạo vùng mới, chip đại diện cho vùng đó (cả chip "cùng vùng" lẫn chip "khác vùng" với các vùng có sẵn) xuất hiện ngay trong TẤT CẢ các dòng tuyến ở khối "Cấu hình tuyến" (kể cả các tuyến do Super Admin tự tạo trước đó) mà không cần reload trang.

**AC8:** Xoá vùng vừa thêm (bấm X cuối dòng) trước khi đặt tên/gán tỉnh → vùng biến mất khỏi bảng, cặp "Nội Tỉnh" đã seed cho vùng đó cũng bị xoá khỏi `routeMatrix`, không để lại dữ liệu mồ côi.

## Notes

- Story này tách riêng phần "Thêm vùng" (nút "+ Thêm vùng miền") ra khỏi GSA-ROUTE-2 để mô tả sâu hơn tác động DÂY CHUYỀN của thao tác này sang khối "Cấu hình tuyến" (GSA-ROUTE-3) — điều mà GSA-ROUTE-2 chỉ nhắc ngắn gọn ở 1 dòng System Flow.
- Điểm quan trọng nhất: thêm vùng mới KHÔNG chỉ là 1 thao tác cục bộ trong bảng "Cấu hình vùng miền" — nó tự động sinh thêm N cặp mới trong ma trận tuyến (1 cặp đã có sẵn tên "Nội Tỉnh", N cặp còn lại ở trạng thái "chưa cấu hình"), nên Super Admin luôn cần ghé qua khối "Cấu hình tuyến" sau khi thêm vùng để xử lý các cặp chéo còn thiếu, nếu không muốn hệ thống báo "không thể xác định tuyến" khi tính giá giữa vùng mới và vùng cũ (xem GSA-ROUTE-5, AC4).
- Vùng mới không có tên mặc định (khác hành vi cũ đặt sẵn "Miền mới N") — xem lý do ở GSA-ROUTE-2.
