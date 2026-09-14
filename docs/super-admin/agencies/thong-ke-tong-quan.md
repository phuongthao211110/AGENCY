---
id: GSA-DL-12
jiraKey: 
platform: super-admin
section: Quản lý Đại lý
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN
status: draft
---

# [GSA] Đại lý - Chi tiết: Thống kê tổng quan

## User Story

Là GHN Super Admin, tôi muốn xem nhanh 4 chỉ số tổng quan (số shop, số đơn hàng, tổng COD, tổng phí ship) ngay đầu trang Chi tiết đại lý — với công thức tính RÕ RÀNG, áp dụng ĐÚNG NHƯ NHAU cho MỌI đại lý (không riêng đại lý nào) — để nắm được quy mô hoạt động của bất kỳ đại lý nào mà không cần vào từng tab.

## User Flow

1. Vào Chi tiết đại lý bất kỳ (bấm tên đại lý từ danh sách đại lý).
2. Ngay dưới tiêu đề "Xem chi tiết", trước phần tab (Thông tin đại lý / Danh sách shop / Đơn hàng), hiện tiêu đề nhỏ "Thống kê tổng quan" và 4 thẻ KPI xếp ngang: Số shop, Đơn hàng, Tổng COD (đ), Tổng phí ship (đ).
3. Mỗi thẻ gồm: icon màu riêng + nhãn xám nhỏ ở trên, số liệu lớn đậm bên dưới.
4. Cả 4 công thức đều tính TRỰC TIẾP từ dữ liệu của CHÍNH đại lý đang xem (không hardcode theo 1 đại lý cụ thể nào) — đổi sang xem đại lý khác thì cả 4 số đổi theo đúng dữ liệu đại lý đó.
5. Số liệu lớn của "Đơn hàng", "Tổng COD", "Tổng phí ship" được rút gọn nếu đủ lớn (ví dụ "15.8k" đơn, "553.7M" đồng, "308K" đồng) — riêng "Số shop" luôn hiện số nguyên đầy đủ, không rút gọn.

## System Flow

`AgencyDetail.tsx` render khối "KPI section" ngay sau header trang, trước tab bar — dùng chung component `KpiCard` (icon, label, value, iconColor). Cả 4 công thức dưới đây đều nhận `agency` (đại lý đang xem trang Chi tiết) làm đầu vào — thay `agency` bằng bất kỳ đại lý nào, công thức áp dụng y hệt:

| KPI | Công thức | Thành phần đầu vào |
|---|---|---|
| **Số shop** | `agency.totalShops` | 1 con số ĐẾM SẴN trong dữ liệu đại lý (không tính lại từ danh sách shop mỗi lần render) — là tổng số shop có `agencyId` bằng đại lý này. |
| **Đơn hàng** | `agency.totalOrders` | 1 con số ĐẾM SẴN trong dữ liệu đại lý — là tổng số đơn hàng CỘNG DỒN từ mọi shop thuộc đại lý này (không phải đếm lại từ bảng đơn hàng mỗi lần render). |
| **Tổng COD (₫)** | `agency.totalOrders × 35.000` | 2 thành phần: **(1)** `totalOrders` — CÙNG con số "Đơn hàng" ở trên (dùng lại, không tính riêng); **(2)** `35.000` — hằng số GIẢ ĐỊNH (COD trung bình/đơn), CỐ ĐỊNH cho mọi đại lý, KHÔNG lấy từ COD thật của từng đơn. |
| **Tổng phí ship (₫)** | `Σ (với mỗi shop s có s.agencyId = agency.id) getShopServiceFeeTotal(s.id)` | 2 bước: **(1)** Lọc ra danh sách shop thuộc đại lý này (`allShops.filter(s => s.agencyId === agency.id)`); **(2)** Với TỪNG shop trong danh sách đó, gọi `getShopServiceFeeTotal(shopId)` — cộng dồn trường `shopServiceFee` (phí dịch vụ GỘP đại lý bán cho shop, CHƯA trừ phí NVC) của mọi dòng dữ liệu đối soát (`carrier-reconciliation-items.json`) có `shopId` khớp — rồi CỘNG TỔNG kết quả của tất cả shop lại thành 1 số duy nhất cho cả đại lý. |

Chi tiết bổ sung:

1. `cod` và `totalFeeShip` được tính lại (`const cod = ...`, `const totalFeeShip = ...`) ngay trong `AgencyDetail.tsx` mỗi khi trang render — dùng đúng `agency` đang xem, không có biến toàn cục hay hardcode theo agency ID cụ thể nào.
2. `getShopServiceFeeTotal()` (định nghĩa tại `reconciliationLedger.ts`) là hàm DÙNG CHUNG — cùng 1 hàm này cũng được `AgencyReport.tsx` (Agency Admin, cột "Tổng phí" theo shop) gọi, đảm bảo con số ở Super Admin và Agency Admin luôn khớp nhau cho cùng 1 shop.
3. Lưu ý phân biệt: `getShopServiceFeeTotal()` trả về phí GỘP (`shopServiceFee`), KHÁC với `getShopMargin()` (đã trừ `ghnFee`, ra lời thật của đại lý) — "Tổng phí ship" ở đây là DOANH SỐ dịch vụ đại lý bán ra, không phải lợi nhuận ròng.
4. Shop chưa có dòng đối soát nào (mới tạo, chưa phát sinh đơn) → đóng góp `0` vào tổng — không gây lỗi hay `NaN`.
5. `fmtVND(n)`: rút gọn theo ngưỡng — ≥ 1 tỷ → `"X.XB"`, ≥ 1 triệu → `"X.XM"`, ≥ 1 nghìn → `"XK"` (làm tròn, không thập phân), dưới 1 nghìn → số nguyên định dạng `vi-VN` (dấu chấm ngăn cách hàng nghìn). Dùng cho "Tổng COD" và "Tổng phí ship".
6. `fmtNum(n)`: chỉ có 1 ngưỡng — ≥ 1000 → `"X.Xk"` (chữ "k" thường, khác chữ "K" hoa của `fmtVND`), dưới 1000 → số nguyên. Dùng cho "Đơn hàng".
7. Icon + màu cố định theo thứ tự: "Số shop" → `ShopOutlined` xanh dương `#3B82F6`; "Đơn hàng" → `InboxOutlined` xanh lá `#10B981`; "Tổng COD (₫)" → `DollarOutlined` cam `#F59E0B`; "Tổng phí ship (₫)" → `BarChartOutlined` tím `#8B5CF6`.

## Acceptance Criteria

**AC1:** Khối "Thống kê tổng quan" hiện ngay dưới header trang, TRƯỚC tab bar — không phụ thuộc tab đang chọn, luôn hiển thị, cho MỌI đại lý (không riêng đại lý nào).

**AC2:** Hiện đúng 4 thẻ theo thứ tự: "Số shop", "Đơn hàng", "Tổng COD (₫)", "Tổng phí ship (₫)" — mỗi thẻ có icon riêng, màu khác nhau (xanh dương, xanh lá, cam, tím).

**AC3:** "Số shop" = `agency.totalShops` của ĐÚNG đại lý đang xem — luôn hiện số nguyên đầy đủ, không rút gọn K/M/B.

**AC4:** "Đơn hàng" = `agency.totalOrders` của ĐÚNG đại lý đang xem, rút gọn theo `fmtNum` (ví dụ 15.800 đơn hiện "15.8k").

**AC5:** "Tổng COD (₫)" = `agency.totalOrders × 35.000` — LUÔN dùng đúng `totalOrders` của đại lý đang xem (không phải số cố định), nhân với hằng số `35.000` giống nhau cho mọi đại lý; kết quả rút gọn theo `fmtVND`.

**AC6:** "Tổng phí ship (₫)" = tổng `getShopServiceFeeTotal(shopId)` của TẤT CẢ shop có `agencyId` bằng đại lý đang xem — đổi đại lý thì danh sách shop lọc ra khác, kết quả khác theo đúng dữ liệu thật; KHÔNG được suy ra từ COD hay từ bất kỳ hằng số cố định nào.

**AC7:** Với 1 đại lý cụ thể có N shop, tổng "Tổng phí ship" của đại lý đó phải BẰNG đúng tổng cộng "Tổng phí" của N shop đó khi xem riêng từng shop ở Agency Admin (`AgencyReport.tsx`) — 2 nơi dùng chung 1 hàm `getShopServiceFeeTotal()` nên không được lệch nhau.

**AC8:** Đại lý không có shop nào, hoặc các shop chưa có dòng đối soát nào → "Tổng phí ship (₫)" hiện "0" (không lỗi, không `NaN`).

**AC9:** Đại lý có 0 đơn hàng (`totalOrders = 0`) → "Đơn hàng" hiện "0" và "Tổng COD (₫)" hiện "0" (không phải hiện trống hay lỗi).

## Notes

- Story tách riêng khối "Thống kê tổng quan" khỏi GSA-DL-8 ("View thông tin chi tiết đại lý") để mô tả sâu chi tiết công thức/thành phần của từng KPI theo cách TỔNG QUÁT (áp dụng mọi đại lý) thay vì chỉ minh hoạ bằng số của 1 đại lý cụ thể.
- Đã đồng bộ sửa AC1 của GSA-DL-8 (trước đây ghi "Doanh thu (₫)" — tên cũ) thành "Tổng phí ship (₫)" cho khớp code hiện tại.
- "Tổng phí ship (₫)" từng mang tên "Doanh thu (₫)" với công thức demo `cod × 2.8%` — đã đổi tên + công thức thật (dựa trên dữ liệu đối soát, tổng hợp theo TỪNG shop rồi cộng dồn) ở 1 lần sửa trước đó trong phiên, theo đúng bản chất nghiệp vụ: doanh số dịch vụ đại lý = tổng phí dịch vụ đã bán cho shop, không phải % COD.
- **Known inconsistency (đã biết, chưa xử lý)**: "Tổng COD (₫)" VẪN dùng công thức demo cố định (`totalOrders × 35.000`, hằng số giả định cho MỌI đại lý) — chưa đổi sang cộng dồn COD thật từng shop (`getShopCodTotal()`, hàm đã có sẵn trong `reconciliationLedger.ts` nhưng CHƯA được gọi ở đây) như đã làm cho "Tổng phí ship". Nếu muốn "Tổng COD" cũng chính xác theo TỪNG đại lý dựa trên dữ liệu thật, chỉ cần đổi công thức sang `Σ getShopCodTotal(shopId)` tương tự "Tổng phí ship" — đây là việc cần làm ở sprint sau, chưa nằm trong phạm vi story này.
- Ví dụ minh hoạ cụ thể (1 đại lý mẫu, KHÔNG phải công thức riêng cho đại lý đó): Số shop = 24, Đơn hàng = 15.8k, Tổng COD (₫) = 553.7M, Tổng phí ship (₫) = 308K — cùng 4 công thức trên áp dụng cho đại lý khác sẽ ra 4 số khác tương ứng với dữ liệu thật của đại lý đó.
