---
id: AGA-REPORT-3
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Bảng "COD & phí theo shop"

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn xem bảng xếp hạng các shop theo tổng phí dịch vụ, gồm số đơn/COD/tổng phí/% đóng góp của từng shop, để biết shop nào đang đóng góp nhiều nhất vào doanh số đại lý và bấm vào để xem chi tiết ngay.

## User Flow

1. Cuộn xuống cuối trang "Báo cáo" tới khối "COD & phí theo shop".
2. Bảng liệt kê MỌI shop thuộc đại lý, SẮP XẾP theo "Tổng phí" giảm dần.
3. Mỗi dòng gồm: Tên shop (link xanh), Trạng thái (Đang hoạt động/Ngừng hoạt động), Số đơn, COD, Tổng phí, thanh % đóng góp (thanh cam + số %).
4. Bấm vào 1 dòng bất kỳ (không chỉ riêng tên shop) → điều hướng sang trang Chi tiết shop tương ứng.
5. Đại lý chưa có shop nào → bảng hiện "Chưa có shop nào." thay vì header + hàng trống.

## System Flow

1. `ranked = [...shops].sort((a,b) => b.totalFee - a.totalFee)` — sắp xếp giảm dần theo `totalFee` (= `getShopServiceFeeTotal(shopId)`, phí dịch vụ GỘP, KHÔNG phải margin/lợi nhuận).
2. `pct = totalFeeAll > 0 ? (s.totalFee / totalFeeAll) * 100 : 0` — % đóng góp của shop = tổng phí shop đó ÷ tổng phí TOÀN đại lý; nếu tổng đại lý = 0 thì mọi shop hiện 0%.
3. Cột "Trạng thái": `isInactive = s.status === 'inactive'` → "Ngừng hoạt động" (đỏ) hoặc "Đang hoạt động" (xanh lá).
4. Toàn bộ dòng (`onClick`) điều hướng `navigate(/agency-admin/shops/${s.id})` — bấm vào BẤT KỲ ĐÂU trên dòng đều chuyển trang, không chỉ riêng tên shop.
5. Thanh % đóng góp: `width: Math.min(100, pct)%` — chặn tối đa 100% dù về lý thuyết `pct` luôn ≤ 100 (vì tử số ≤ mẫu số).
6. Không có phân trang — hiện TOÀN BỘ shop của đại lý trong 1 bảng cuộn dọc theo trang.

## Acceptance Criteria

**AC1:** Bảng có 6 cột: Shop, Trạng thái, Số đơn, COD, Tổng phí, % đóng góp.

**AC2:** Dòng shop sắp xếp theo "Tổng phí" GIẢM DẦN (shop đóng góp nhiều nhất luôn ở trên).

**AC3:** Bấm vào bất kỳ đâu trên 1 dòng → điều hướng sang trang Chi tiết shop (`/agency-admin/shops/:id`) của đúng shop đó.

**AC4:** "% đóng góp" = tổng phí của shop ÷ tổng phí của TOÀN đại lý — tổng % của mọi shop cộng lại xấp xỉ 100% (làm tròn).

**AC5:** Đại lý không có shop nào → bảng hiện dòng "Chưa có shop nào." thay vì header trống.

**AC6:** Shop chưa phát sinh đơn nào (COD, Tổng phí = 0) vẫn xuất hiện trong bảng với dòng đầy đủ (0 đơn, 0đ COD, 0đ phí, 0.0% đóng góp) — không bị ẩn khỏi bảng.

**AC7:** "Tổng phí" hiển thị ở đây là phí GỘP (`getShopServiceFeeTotal`), KHÔNG phải doanh thu/lợi nhuận ròng (khác `getShopMargin` dùng ở "Doanh thu" tại `ShopDetail.tsx`, AGA-SHOP-12).

## Notes

- Cùng nguồn dữ liệu (`getShopCodTotal`, `getShopServiceFeeTotal`) với KPI "COD" ở AGA-REPORT-1 — tổng COD/tổng phí của mọi dòng trong bảng này CỘNG LẠI phải đúng bằng 2 KPI tương ứng ở đầu trang.
- Không có ô tìm kiếm/lọc riêng cho bảng này — chỉ có sắp xếp cố định theo Tổng phí giảm dần, không đổi được tiêu chí sắp xếp qua UI.
