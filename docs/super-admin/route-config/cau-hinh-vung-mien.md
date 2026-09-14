---
id: GSA-ROUTE-2
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Cấu hình vùng miền

## User Story

Là GHN Super Admin, tôi muốn định nghĩa các miền và gán tỉnh/thành vào từng miền theo dạng bảng, có validate tên trùng và tỉnh trống, để hệ thống có nền tảng đúng trước khi đặt tên tuyến.

## User Flow

1. Vào khối "🗺️ Cấu hình vùng miền" trong trang "Vùng & Tuyến".
2. Bảng 2 cột "Tên vùng miền | Tỉnh/Thành phố" — mỗi dòng là 1 miền, đã điền sẵn 6 miền theo quy tắc GHN (Hà Nội, Đà Nẵng, TP. Hồ Chí Minh, Miền Nam/Trung/Bắc theo Vùng 1/2/3).
3. Sửa tên miền bằng cách gõ trực tiếp vào ô tên — gõ trùng tên miền khác sẽ hiện lỗi đỏ ngay dưới ô; để tên trống thì KHÔNG báo lỗi (dòng chưa đặt tên coi như chưa bắt đầu cấu hình).
4. Gỡ 1 tỉnh khỏi miền bằng nút X trên chip tỉnh; gán thêm tỉnh bằng dropdown "Chọn Tỉnh/Thành" cuối danh sách chip (chỉ hiện khi còn tỉnh chưa được gán miền nào).
5. Miền ĐÃ ĐẶT TÊN nhưng chưa có tỉnh nào sẽ hiện lỗi đỏ "Vui lòng chọn Tỉnh/Thành" dưới dropdown; miền CHƯA đặt tên thì không báo lỗi này dù cũng chưa có tỉnh.
6. Bấm nút "+ Thêm vùng miền" ở cuối bảng → thêm 1 dòng miền mới, tên và danh sách tỉnh đều trống, KHÔNG báo lỗi gì cho tới khi Super Admin bắt đầu gõ tên.
7. Xoá hẳn 1 miền bằng nút X cuối dòng.
8. Nếu còn tỉnh chưa được gán miền nào, cuối bảng hiện dòng chữ xám liệt kê tối đa 10 tỉnh đầu + số tỉnh còn lại.

## System Flow

1. `RouteConfig.tsx` — khối "Cấu hình vùng miền" render bảng từ `localRegions` (đồng bộ 2 chiều với `regions` trong `routeConfig.ts`).
2. `regionNameError(region)`: nếu tên (sau trim) rỗng → trả `null` (không báo lỗi, dòng coi như chưa bắt đầu); nếu tên trùng (không phân biệt hoa/thường) với miền khác → trả "Tên vùng miền đã tồn tại"; ngược lại `null`.
3. `provinceError` tính inline tại nơi render: chỉ trả "Vui lòng chọn Tỉnh/Thành" khi `region.name.trim()` khác rỗng VÀ `region.provinces.length === 0` — tức là chỉ validate tỉnh sau khi miền đã có tên.
4. Dropdown "Chọn Tỉnh/Thành" chỉ render khi `unassignedList.length > 0` (còn tỉnh chưa gán miền nào) — chọn 1 tỉnh gọi `assignProvinceToRegion()`, tự động gỡ tỉnh đó khỏi miền cũ nếu đang thuộc miền khác (đảm bảo 1 tỉnh ∈ đúng 1 miền).
5. `handleAddRegion()` gọi `addRegion('')` — tên miền mới luôn là chuỗi rỗng, không tự đặt "Miền mới N"; vì cả 2 lỗi validate đều gate theo "đã có tên", dòng mới thêm hiển thị hoàn toàn im lặng (không lỗi) cho tới khi Super Admin gõ tên.
6. `handleDeleteRegion(id)` — xoá miền khỏi `localRegions`, xoá mọi cặp miền trong `routeMatrix` có tham chiếu tới miền đó (chuyển các cặp này về "chưa cấu hình"), bao gồm cả cặp "đường chéo" (cùng miền) mà miền đó đang đóng góp cho tuyến "Nội Tỉnh" hoặc tuyến khác (xem GSA-ROUTE-3).
7. Thêm miền mới cũng tự động seed 1 cặp "đường chéo" (cùng miền) gán sẵn cho tuyến "Nội Tỉnh" — không cần thao tác gì thêm ở khối Cấu hình tuyến.
8. Footer "N tỉnh chưa được gán vùng miền" là dòng chữ xám đơn giản, chỉ hiện khi `unassignedList.length > 0`.

## Acceptance Criteria

**AC1:** Bảng hiển thị đúng 2 cột "Tên vùng miền" và "Tỉnh/Thành phố", mỗi dòng 1 miền.

**AC2:** Miền CHƯA đặt tên (tên rỗng) không hiện bất kỳ lỗi nào — kể cả khi cũng chưa có tỉnh nào. Miền ĐÃ đặt tên và trùng với miền khác (không phân biệt hoa/thường) → lỗi đỏ "Tên vùng miền đã tồn tại".

**AC3:** Miền ĐÃ đặt tên nhưng không có tỉnh nào → lỗi đỏ "Vui lòng chọn Tỉnh/Thành" hiện dưới dropdown chọn tỉnh; miền chưa đặt tên thì không hiện lỗi này.

**AC4:** Gán 1 tỉnh đang thuộc miền A sang miền B → tỉnh đó tự động biến mất khỏi miền A, chỉ còn ở miền B (1 tỉnh luôn thuộc đúng 1 miền).

**AC5:** Bấm "+ Thêm vùng miền" → thêm 1 dòng miền mới với tên rỗng và không có tỉnh nào — KHÔNG hiện lỗi gì ngay lúc này (khác với hành vi cũ là báo lỗi ngay); lỗi chỉ xuất hiện sau khi Super Admin gõ tên (nếu trùng) hoặc gõ tên mà chưa chọn tỉnh.

**AC6:** Xoá 1 miền → miền biến mất khỏi bảng, mọi cặp miền liên quan trong Cấu hình tuyến chuyển về "chưa cấu hình", bao gồm cả cặp "đường chéo" của miền đó.

**AC7:** Dropdown "Chọn Tỉnh/Thành" chỉ hiện khi còn tỉnh chưa được gán miền nào trong toàn hệ thống — hết tỉnh trống thì ẩn hẳn dropdown ở mọi dòng.

**AC8:** Footer liệt kê tỉnh chưa gán miền chỉ hiện khi có ít nhất 1 tỉnh chưa gán, dạng chữ xám đơn giản (không phải khung cảnh báo).

## Notes

- Đổi tên story từ "Bước 1 — Định nghĩa Miền/Vùng" thành "Cấu hình vùng miền", khớp đúng tên khối trên UI hiện tại.
- **Bỏ hẳn công cụ "Điền nhanh theo khoảng tỉnh"** (trước đây là 1 thanh công cụ nằm trong khối này, cho phép chọn khoảng tỉnh Bắc→Nam rồi gán hàng loạt vào 1 miền) theo yêu cầu đơn giản hoá — story riêng cho tính năng này (GSA-ROUTE-3 cũ) đã bị xoá. Gán tỉnh giờ chỉ còn 1 cách: chọn từng tỉnh qua dropdown "Chọn Tỉnh/Thành" hoặc gỡ qua chip X.
- **Thay đổi validate quan trọng**: trước đây dòng miền mới thêm (tên rỗng, chưa có tỉnh) báo lỗi NGAY LẬP TỨC cho cả 2 điều kiện. Nay đã đổi thành: mọi validate chỉ áp dụng SAU KHI miền đã có tên — một dòng hoàn toàn trống (chưa gõ gì) sẽ không hiện lỗi nào, tránh "doạ" người dùng ngay khi vừa bấm thêm dòng.
