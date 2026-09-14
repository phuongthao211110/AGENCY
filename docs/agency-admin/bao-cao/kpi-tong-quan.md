---
id: AGA-REPORT-1
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: KPI tổng quan

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn xem 4 chỉ số tổng quan hoạt động của TOÀN đại lý (không phải từng shop) ngay đầu trang "Báo cáo", để nắm được quy mô kinh doanh chung mà không cần cộng dồn thủ công từ từng shop.

## User Flow

1. Vào menu "Báo cáo" (Agency Admin).
2. Ngay dưới tiêu đề "Báo cáo" và mô tả "Tổng quan số lượng shop, COD và sản lượng đơn của đại lý", hiện 4 thẻ KPI: Số lượng shop, COD, Sản lượng đơn, Đơn TB / shop.
3. "Số lượng shop" hiện kèm số shop đang hoạt động trong ngoặc, ví dụ "7 (6 hoạt động)".
4. 3 số còn lại đều CỘNG DỒN từ TẤT CẢ shop thuộc đại lý (không phải chỉ shop đang hoạt động).

## System Flow

`AgencyReport.tsx` — `buildShopStats()` lọc `loadShops()` theo `agencyId === CURRENT_AGENCY_ID`, với mỗi shop gọi `getShopCodTotal(s.id)` và `getShopServiceFeeTotal(s.id)` (từ `reconciliationLedger.ts`) để lấy COD/phí THẬT theo dữ liệu đối soát.

| KPI | Công thức | Thành phần đầu vào |
|---|---|---|
| **Số lượng shop** | `` `${totalShops} (${activeShops} hoạt động)` `` | `totalShops = shops.length` (đếm TẤT CẢ shop thuộc đại lý, kể cả ngừng hoạt động); `activeShops = shops.filter(s => s.status !== 'inactive').length`. |
| **COD** | `fmtVND(totalCod)` | `totalCod = Σ shops.cod`, với `cod` của MỖI shop = `getShopCodTotal(shopId)` (Σ `ghnCOD` trên mọi dòng đối soát của shop đó) — DỮ LIỆU THẬT, không phải `totalOrders × 35.000`. |
| **Sản lượng đơn** | `fmtNum(totalOrders)` | `totalOrders = Σ shops.totalOrders` — cộng dồn field đếm sẵn của TỪNG shop (không phải dữ liệu đối soát). |
| **Đơn TB / shop** | `fmtNum(avgOrdersPerShop)` | `avgOrdersPerShop = totalOrders / totalShops` (làm tròn) — chia cho TỔNG SỐ SHOP (kể cả ngừng hoạt động), không chỉ shop đang hoạt động; nếu `totalShops = 0` thì trả về 0 (tránh chia 0). |

Chi tiết bổ sung:

1. `fmtNum(n) = n.toLocaleString('vi-VN')` — chỉ thêm dấu chấm ngăn cách hàng nghìn, KHÔNG rút gọn "k"/"K" như bên Super Admin.
2. `fmtVND(n)`: ≥ 1 tỷ → `"X tỷ"`, ≥ 1 triệu → `"X tr"` (bỏ `.0` nếu tròn số), còn lại → số đầy đủ + `" ₫"` — CÙNG CÔNG THỨC với `ShopDetail.tsx` (xem AGA-SHOP-12), khác hẳn `fmtVND` bên Super Admin (dùng B/M/K tiếng Anh, không có `₫`).
3. `CURRENT_AGENCY_ID = 'AGN001'` là hằng số demo (giả lập agency đang đăng nhập) — không đọc từ session/auth thật.
4. "COD" ở trang Báo cáo này khác cách tính với "Tổng COD" ở `ShopDetail.tsx` (AGA-SHOP-12): trang Báo cáo dùng `getShopCodTotal` (COD thật đã đối soát), còn `ShopDetail.tsx` vẫn dùng công thức demo `totalOrders × 35.000` — 2 nơi tính COD theo 2 cách KHÁC NHAU cho cùng 1 shop.

## Acceptance Criteria

**AC1:** Khối KPI hiện ngay dưới tiêu đề trang "Báo cáo", trước phần "Xu hướng tổng phí ship theo shop" (xem AGA-REPORT-2).

**AC2:** Đủ 4 thẻ đúng thứ tự: "Số lượng shop", "COD", "Sản lượng đơn", "Đơn TB / shop".

**AC3:** "Số lượng shop" hiện dạng "N (M hoạt động)" — N = tổng số shop (mọi trạng thái), M = số shop đang hoạt động (`status !== 'inactive'`).

**AC4:** "COD" = tổng COD THẬT (`getShopCodTotal`) cộng dồn từ mọi shop thuộc đại lý — không phải công thức demo `totalOrders × 35.000`.

**AC5:** "Sản lượng đơn" = tổng `totalOrders` cộng dồn từ mọi shop thuộc đại lý.

**AC6:** "Đơn TB / shop" = Sản lượng đơn ÷ Số lượng shop (làm tròn) — chia cho TỔNG số shop kể cả ngừng hoạt động; đại lý có 0 shop → hiện "0", không lỗi chia 0.

**AC7:** Shop chưa từng phát sinh đơn đối soát → shop đó đóng góp 0 vào "COD" nhưng vẫn được tính vào "Số lượng shop" và mẫu số của "Đơn TB / shop".

## Notes

- Story tách từ trang "Báo cáo" (`AgencyReport.tsx`) — trang này CHƯA có mục nào trong hệ thống Document trước đây. Viết 3 story mới cho 3 khối của trang: KPI (story này), "Xu hướng tổng phí ship theo shop" (AGA-REPORT-2), "COD & phí theo shop" (AGA-REPORT-3).
- Phân biệt với AGA-SHOP-12 (Chi tiết shop): trang này là KPI CẤP ĐẠI LÝ (cộng dồn nhiều shop), còn AGA-SHOP-12 là KPI CẤP 1 SHOP — cùng tên "COD"/"Đơn hàng" nhưng phạm vi tính khác nhau.
- **Known inconsistency (đã biết, chưa xử lý)**: "COD" ở đây dùng dữ liệu đối soát thật, trong khi "Tổng COD" ở `ShopDetail.tsx` (AGA-SHOP-12) và "Tổng COD (₫)" ở Super Admin `AgencyDetail.tsx` (GSA-DL-12) đều dùng công thức demo cố định — 3 nơi tính COD theo 3 cách khác nhau trong cùng hệ thống, cần thống nhất nếu đưa lên production.
