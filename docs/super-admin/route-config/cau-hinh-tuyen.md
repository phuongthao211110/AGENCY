---
id: GSA-ROUTE-3
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Cấu hình tuyến

## User Story

Là GHN Super Admin, tôi muốn đặt tên tuyến theo dạng bảng và tick các cặp miền thuộc từng tuyến — bao gồm cả cặp "cùng miền" (Nội Tỉnh) qua đúng 1 cơ chế chip duy nhất — để hệ thống có thể tra cứu ra đúng tên tuyến khi tính giá cho đơn hàng giữa 2 tỉnh bất kỳ.

## User Flow

1. Cuộn đến khối "🔀 Cấu hình tuyến" trong trang "Vùng & Tuyến".
2. Nếu chưa có miền nào (ở khối "Cấu hình vùng miền"), khối này chỉ hiện dòng chữ "Chưa có vùng miền nào — thêm ở khối 'Cấu hình vùng miền' trước." thay vì bảng.
3. Bảng 2 cột "Tên tuyến | Cặp vùng miền" — dòng đầu tiên LUÔN là "Nội Tỉnh" (hiển thị dạng nhãn/pill màu cam, KHÔNG sửa tên được, KHÔNG xoá được), nền dòng cam nhạt.
4. Các dòng tuyến bên dưới: sửa tên tuyến bằng cách gõ trực tiếp vào ô tên (tối thiểu 2 ký tự, gõ ngắn hơn hiện lỗi đỏ).
5. Mỗi dòng tuyến (kể cả dòng "Nội Tỉnh") hiển thị ĐẦY ĐỦ chip cho MỌI cặp vùng miền có thể có — bao gồm cả chip "cùng miền" (ví dụ "Hà Nội", "Đà Nẵng", "TP. Hồ Chí Minh", "Miền Nam (Vùng 1)"...) lẫn chip "khác miền" (ví dụ "Hà Nội (Đặc biệt) ↔ Đà Nẵng (Đặc biệt)").
6. Bấm 1 chip trong dòng tuyến bất kỳ để tick/bỏ tick cặp đó vào tuyến hiện tại — kể cả chip "cùng miền" trong dòng "Nội Tỉnh": bỏ tick 1 miền khỏi "Nội Tỉnh" rồi tick vào 1 dòng tuyến khác để đặt giá riêng cho miền đó khi gửi trong cùng tỉnh.
7. Bấm nút "+ Thêm tuyến" ở cuối bảng để thêm 1 dòng tuyến trống, chưa tick cặp nào.
8. Xoá hẳn 1 dòng tuyến bằng nút X cuối dòng (không áp dụng cho dòng "Nội Tỉnh" — dòng này không có nút X).
9. Nếu còn cặp vùng miền chưa được gán tuyến nào, cuối bảng hiện dòng chữ xám liệt kê tối đa 6 cặp đầu + số cặp còn lại.

## System Flow

1. `RouteConfig.tsx` render khối "Cấu hình tuyến". `allRegionPairs` là mọi tổ hợp 2 miền có thể có, KỂ CẢ cặp "đường chéo" (`a.id === b.id`, 1 miền ghép với chính nó — đại diện cho MỌI đơn hàng trong phạm vi 1 miền, cả cùng tỉnh lẫn khác tỉnh cùng miền).
2. `routeMatrix` trong `routeConfig.ts` seed sẵn TẤT CẢ 6 cặp đường chéo (`HN|HN`, `DN|DN`, `HCM|HCM`, `V1|V1`, `V2|V2`, `V3|V3`) đều mặc định = `'Nội Tỉnh'`. Đây chỉ là giá trị khởi tạo, KHÔNG phải hằng số đặc biệt trong dữ liệu — về bản chất `'Nội Tỉnh'` chỉ là 1 tên tuyến bình thường như bất kỳ tên nào khác.
3. Trong component, dòng có `name === 'Nội Tỉnh'` (biến `isNoiTinh`) được ĐẨY LÊN ĐẦU danh sách hiển thị (`orderedNames`) và render nhãn tên dưới dạng `<span>` pill cam cố định thay vì `<input>`, ẩn nút xoá X — đây là 2 ĐIỂM KHÁC BIỆT DUY NHẤT so với 1 dòng tuyến bình thường; toàn bộ phần chip vẫn dùng chung đúng 1 đoạn code `allRegionPairs.map(...)` với `handleToggleChip` như mọi dòng khác.
4. Nhãn chip "đường chéo" (`a.id === b.id`) hiển thị rút gọn: `a.name.replace(' (Đặc biệt)', '')` — ví dụ "Hà Nội (Đặc biệt)" hiện thành "Hà Nội"; miền nhiều tỉnh (ví dụ "Miền Nam (Vùng 1)") không có hậu tố này nên giữ nguyên. Chip "khác miền" vẫn hiển thị đầy đủ dạng `A ↔ B`.
5. `tuyenNameError(name)`: trả "Ít nhất 2 ký tự" nếu tên (sau trim) ngắn hơn 2 ký tự — CHỈ áp dụng cho dòng KHÔNG PHẢI "Nội Tỉnh" (`isNoiTinh ? null : tuyenNameError(name)`).
6. `handleRenameTuyen` và `handleDeleteTuyen` đều có guard `if (name === 'Nội Tỉnh') return` ở đầu hàm — chặn đổi tên/xoá dòng này dù có cách nào gọi tới cũng không có tác dụng.
7. `handleToggleChip(routeName, regionIdA, regionIdB)` — nếu cặp đang gán đúng `routeName` này thì gọi `clearRouteName` (bỏ tick), ngược lại gọi `setRouteName` (tick, ghi đè tuyến cũ nếu cặp đang thuộc tuyến khác) — áp dụng ĐỒNG NHẤT cho mọi loại chip (cùng miền lẫn khác miền), không có nhánh xử lý riêng.
8. `resolveRouteName(fromProvince, toProvince)` trong `routeConfig.ts`: khi 2 tỉnh giống nhau, tra miền của tỉnh đó rồi đọc trực tiếp `routeMatrix[pairKey(regionId, regionId)]` — không còn dict riêng lưu tên theo từng miền như bản thiết kế trước.
9. `unconfiguredPairs` là `allRegionPairs` lọc ra các cặp chưa có key trong `localMatrix` — hiển thị ở footer cảnh báo; mặc định luôn rỗng cho các cặp đường chéo vì đã seed sẵn "Nội Tỉnh".

## Acceptance Criteria

**AC1:** Nếu chưa có miền nào, khối hiện đúng dòng "Chưa có vùng miền nào — thêm ở khối 'Cấu hình vùng miền' trước." thay vì bảng.

**AC2:** Dòng đầu tiên của bảng luôn là "Nội Tỉnh" (nhãn pill cam `#FFEAD9`/viền `#FDBA74`/chữ `#FF5200`, nền dòng cam nhạt `#FFF4ED`) — không sửa được tên (không phải ô input), không có nút xoá.

**AC3:** MỌI dòng tuyến (kể cả "Nội Tỉnh") hiển thị đủ chip cho MỌI cặp vùng miền có thể có, bao gồm cả chip "cùng miền" (đường chéo) và chip "khác miền" — dùng chung 1 cơ chế toggle chip duy nhất, không có input riêng theo từng miền.

**AC4:** Chip "cùng miền" hiển thị tên rút gọn (bỏ hậu tố "(Đặc biệt)", ví dụ "Hà Nội" thay vì "Hà Nội (Đặc biệt)"); chip "khác miền" hiển thị đầy đủ dạng "A ↔ B".

**AC5:** Mặc định, mọi chip "cùng miền" (6 miền) đều đang tick ở dòng "Nội Tỉnh"; Super Admin bấm chip đó ở dòng khác để CHUYỂN miền đó sang tuyến khác — chip tự động bỏ tick ở "Nội Tỉnh" và tick ở dòng vừa bấm, không cảnh báo.

**AC6:** Tên tuyến (dòng thường, KHÔNG áp dụng cho "Nội Tỉnh") ngắn hơn 2 ký tự (sau khi trim) → lỗi đỏ "Ít nhất 2 ký tự" hiện ngay dưới ô tên.

**AC7:** Bấm chip đang tick ở tuyến hiện tại → bỏ tick (cặp về "chưa cấu hình"); bấm chip đang tick ở tuyến KHÁC → tự chuyển cặp đó sang tuyến hiện tại, không cảnh báo.

**AC8:** Đổi tên 1 dòng tuyến thường → cập nhật tên hiển thị cho MỌI cặp miền đang gán tuyến đó; thao tác này KHÔNG áp dụng được cho dòng "Nội Tỉnh" (không có ô input để đổi).

**AC9:** Bấm "+ Thêm tuyến" → thêm 1 dòng tuyến mới ở cuối bảng, tên rỗng (lỗi AC6 hiện ngay), chưa tick cặp miền nào.

**AC10:** Bấm X cuối dòng tuyến thường → xoá dòng tuyến; mọi cặp miền đang gán tuyến đó (kể cả cặp cùng miền nếu có) chuyển về "chưa cấu hình". Dòng "Nội Tỉnh" không có nút X nên không xoá được bằng thao tác này.

**AC11:** Nếu có cặp vùng miền chưa được gán tuyến nào, footer hiện dòng chữ xám: liệt kê tối đa 6 cặp đầu + đếm số cặp còn lại; hết cặp trống thì ẩn dòng này.

## Notes

- **Redesign quan trọng**: bản trước có 1 dòng "Nội tỉnh" ĐẶC BIỆT với ô input riêng cho TỪNG miền (đổi tên tuyến "cùng tỉnh" của mỗi miền độc lập, không liên quan tới cơ chế chip). Bản này bỏ hẳn cách đó — "Nội Tỉnh" giờ CHỈ LÀ 1 TÊN TUYẾN BÌNH THƯỜNG được seed sẵn cho mọi cặp đường chéo, dùng chung đúng 1 cơ chế chip với mọi tuyến khác. Muốn đặt giá "cùng tỉnh" riêng cho 1 miền, Super Admin chỉ cần bỏ tick chip miền đó khỏi "Nội Tỉnh" rồi tick vào 1 dòng tuyến khác (có sẵn hoặc mới tạo) — vẫn giữ được khả năng tuỳ biến theo từng miền, nhưng qua đúng 1 UI thống nhất thay vì 2 cơ chế song song.
- Tên tuyến được lưu làm KHOÁ tra cứu trong `routeMatrix` (không phải ID bất biến riêng) — đổi tên cần đồng bộ ở mọi cặp miền đang dùng tên đó. Đây là ràng buộc thiết kế hiện tại của prototype; production cần ID bất biến cho tuyến.
- "Nội Tỉnh" không xoá/đổi tên được nhằm bảo vệ khái niệm mặc định luôn tồn tại trên UI (Super Admin luôn có 1 chỗ để "trả về" các cặp cùng miền chưa cần tách giá riêng) — nhưng KHÔNG có gì ngăn Super Admin di chuyển TẤT CẢ 6 chip cùng miền sang tuyến khác, khiến dòng "Nội Tỉnh" hiển thị không còn chip nào được tick (vẫn hợp lệ, chỉ là không còn miền nào dùng tên này).
- Đổi tên story từ "Bước 2 — Đặt tên tuyến và phạm vi áp dụng" thành "Cấu hình tuyến"; đổi số từ GSA-ROUTE-4 (cũ) thành GSA-ROUTE-3 sau khi xoá story "Điền nhanh theo khoảng tỉnh" (GSA-ROUTE-3 cũ, tính năng đã bị gỡ khỏi UI).
