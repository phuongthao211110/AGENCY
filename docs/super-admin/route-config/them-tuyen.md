---
id: GSA-ROUTE-7
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Thêm tuyến

## User Story

Là GHN Super Admin, tôi muốn tạo 1 tuyến mới hoàn toàn trống (chưa gán cặp vùng miền nào) từ khối "Cấu hình tuyến" để tự đặt tên và tick các cặp vùng miền muốn tính chung 1 mức giá.

## User Flow

1. Trong khối "🔀 Cấu hình tuyến", bấm nút "+ Thêm tuyến" ở cuối bảng.
2. 1 dòng tuyến mới xuất hiện ở CUỐI bảng (dưới mọi tuyến hiện có, kể cả các tuyến do Super Admin tự tạo trước đó — dòng "Nội Tỉnh" vẫn luôn ở đầu) — tên trống, CHƯA tick cặp vùng miền nào.
3. Ngay khi vừa thêm, ô tên đã hiện lỗi đỏ "Ít nhất 2 ký tự" — khác với hành vi thêm vùng miền (xem GSA-ROUTE-6), nơi dòng mới không báo lỗi cho tới khi gõ tên.
4. Gõ tên tuyến (tối thiểu 2 ký tự sau khi trim) để hết lỗi.
5. Bấm các chip cặp vùng miền muốn gán vào tuyến mới — nếu 1 cặp đang thuộc tuyến khác, nó tự động chuyển sang tuyến mới, không cảnh báo.
6. Nếu bấm "+ Thêm tuyến" nhiều lần liên tiếp mà chưa đặt tên cho dòng trước, mỗi lần vẫn tạo ra 1 dòng riêng biệt (không bị gộp lại), mỗi dòng đều báo lỗi "Ít nhất 2 ký tự" độc lập cho tới khi được đặt tên khác nhau.
7. Xoá dòng tuyến vừa thêm (nếu đổi ý) bằng nút X cuối dòng — không có cặp vùng miền nào bị ảnh hưởng vì tuyến mới chưa tick cặp nào.

## System Flow

1. `handleAddTuyen()` (`RouteConfig.tsx`): thêm 1 tên rỗng vào state `routeNames` — nếu đã có N dòng tên rỗng khác, tên mới được đệm N dấu cách (`' '.repeat(blankCount)`) để mỗi dòng trống là 1 giá trị string riêng biệt, tránh bị `Set()` (dùng khi dedupe hiển thị) gộp làm 1 dòng.
2. Dòng mới KHÔNG ghi gì vào `routeMatrix` (khác với `addRegion()` tự seed cặp "Nội Tỉnh" cho vùng mới — xem GSA-ROUTE-6) — tuyến mới hoàn toàn trống, không có cặp vùng miền nào cho tới khi Super Admin chủ động bấm chip.
3. `tuyenNameError(name)`: trả "Ít nhất 2 ký tự" khi `name.trim().length < 2` — ÁP DỤNG NGAY cho dòng vừa thêm, không gate theo "đã có tên" như `regionNameError`/`provinceError` ở bảng Vùng miền (GSA-ROUTE-2/6). Đây là 2 hành vi validate KHÁC NHAU giữa 2 bảng tương tự nhau trên cùng 1 trang.
4. `orderedNames` (logic hiển thị) luôn đẩy `'Nội Tỉnh'` lên đầu, phần còn lại giữ nguyên thứ tự xuất hiện trong `routeNames`; vì tên mới luôn được `push` vào CUỐI mảng, dòng mới luôn hiện ở CUỐI bảng, dưới mọi tuyến khác.
5. `handleToggleChip(routeName, regionIdA, regionIdB)` hoạt động y hệt cho tuyến mới như mọi tuyến khác — không có nhánh xử lý riêng cho tuyến vừa tạo.
6. `handleRenameTuyen(oldName, newName)` đổi tên tuyến mới giống bất kỳ tuyến thường nào (không phải `'Nội Tỉnh'`) — cập nhật cả `routeNames` và mọi entry `routeMatrix` đang trỏ tới `oldName` (ban đầu rỗng vì chưa có cặp nào được tick).
7. `handleDeleteTuyen(name)` xoá dòng khỏi `routeNames` và mọi cặp đang gán tên đó trong `routeMatrix` (rỗng nếu tuyến chưa được tick cặp nào).

## Acceptance Criteria

**AC1:** Bấm "+ Thêm tuyến" → thêm 1 dòng tuyến mới ở CUỐI bảng "Cấu hình tuyến" (dưới mọi tuyến hiện có) — tên rỗng, chưa tick cặp vùng miền nào.

**AC2:** Ngay sau khi thêm, dòng mới hiện lỗi đỏ "Ít nhất 2 ký tự" dưới ô tên — khác với hành vi thêm vùng miền (GSA-ROUTE-6), nơi dòng mới không báo lỗi cho tới khi gõ tên.

**AC3:** Gõ tên hợp lệ (≥2 ký tự sau khi trim) → lỗi biến mất ngay lập tức, không cần rời focus khỏi ô.

**AC4:** Bấm "+ Thêm tuyến" nhiều lần liên tiếp mà không đặt tên cho các dòng trước → mỗi lần tạo ra 1 dòng RIÊNG BIỆT (không gộp lại thành 1), mỗi dòng đều báo lỗi "Ít nhất 2 ký tự" độc lập.

**AC5:** Tuyến mới hiển thị đủ chip cho MỌI cặp vùng miền có thể có (giống mọi tuyến khác, bao gồm cả chip "cùng vùng") — ban đầu KHÔNG chip nào được tick.

**AC6:** Bấm 1 chip đang thuộc tuyến khác trong dòng tuyến mới → cặp đó tự động chuyển sang tuyến mới (bỏ tick ở tuyến cũ, tick ở tuyến mới), không cảnh báo.

**AC7:** Xoá dòng tuyến mới (bấm X) trước khi tick chip nào → dòng biến mất khỏi bảng, không có cặp vùng miền nào bị ảnh hưởng vì chưa có cặp nào được gán cho tuyến đó.

**AC8:** Sau khi đặt tên hợp lệ, tuyến mới xuất hiện ngay trong dropdown "Tuyến" khi tạo bảng giá ở Agency Admin (qua `listRouteNames()`, xem GSA-ROUTE-5) mà không cần đại lý làm gì thêm — kể cả khi tuyến đó chưa tick cặp vùng miền nào.

## Notes

- Story tách riêng khỏi GSA-ROUTE-3 (Cấu hình tuyến) để tập trung mô tả riêng nút "+ Thêm tuyến", tương tự cách GSA-ROUTE-6 tách "Thêm vùng" khỏi GSA-ROUTE-2.
- **Known inconsistency (đã biết, chưa xử lý)**: khác với "Thêm vùng miền" (GSA-ROUTE-6) — nơi dòng mới hoàn toàn im lặng cho tới khi gõ tên — "Thêm tuyến" báo lỗi "Ít nhất 2 ký tự" NGAY LẬP TỨC dù chưa gõ gì. Đây là 2 hành vi validate khác nhau giữa 2 bảng tương tự nhau trên cùng 1 trang; cần cân nhắc đồng bộ ở sprint sau nếu muốn trải nghiệm nhất quán giữa "Cấu hình vùng miền" và "Cấu hình tuyến".
- Tuyến mới không tự động seed cặp nào (khác vùng miền mới luôn tự seed sẵn cặp "Nội Tỉnh") — vì tuyến không có khái niệm "mặc định áp dụng" tương tự khái niệm "cùng vùng" của vùng miền.
- Đặt tên trùng với 1 tuyến đã có (kể cả "Nội Tỉnh") hiện KHÔNG bị chặn bởi `tuyenNameError` (hàm này chỉ kiểm tra độ dài, không kiểm tra trùng tên) — nếu Super Admin đặt trùng tên 1 tuyến khác, 2 dòng sẽ cùng tồn tại trong `routeNames` nhưng về mặt logic đều tham chiếu chung 1 "tên tuyến" khi tick chip (`handleToggleChip` dùng tên làm khoá) — đây là hành vi hiện tại, chưa có validate chống trùng tên tuyến giống như đã có cho tên vùng miền (GSA-ROUTE-2).
