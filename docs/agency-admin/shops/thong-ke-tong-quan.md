---
id: AGA-SHOP-12
jiraKey: 
platform: agency-admin
section: Quản lý Shop
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Shop - Chi tiết shop: Thống kê tổng quan

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn xem nhanh 3 chỉ số tổng quan (Đơn hàng, Tổng COD, Doanh thu) ngay đầu trang Chi tiết shop — với công thức tính rõ ràng, áp dụng như nhau cho MỌI shop — để nắm được hiệu quả kinh doanh của bất kỳ shop nào mà không cần vào từng tab.

## User Flow

1. Vào "Quản lý Shop" → bấm 1 shop bất kỳ để mở trang "Thông tin shop" (Chi tiết shop).
2. Ngay dưới tiêu đề "Thông tin shop", trước tab bar, hiện tiêu đề nhỏ "Thống kê tổng quan" và 3 thẻ KPI xếp ngang: Đơn hàng, Tổng COD, Doanh thu.
3. Mỗi thẻ gồm icon màu riêng + nhãn xám nhỏ ở trên, số liệu lớn đậm bên dưới.
4. Cả 3 số đều tính trực tiếp theo ĐÚNG shop đang xem — chuyển sang xem shop khác thì cả 3 số đổi theo dữ liệu shop đó.

## System Flow

`ShopDetail.tsx` render khối KPI ngay dưới header "Thông tin shop", trước tab bar — dùng `KpiCard` (icon, label, value, iconColor) ĐỊNH NGHĨA RIÊNG trong file này (không phải import chung với `AgencyDetail.tsx` bên Super Admin, dù cùng tên component/layout).

| KPI | Công thức | Thành phần đầu vào |
|---|---|---|
| **Đơn hàng** | `fmtNum(shop.totalOrders)` | `totalOrders = shop.totalOrders` — 1 field đếm sẵn của CHÍNH shop đang xem. |
| **Tổng COD** | `fmtVND(totalOrders × 35.000)` | Hằng số GIẢ ĐỊNH `35.000` (COD trung bình/đơn, demo — giống hệt công thức "Tổng COD" ở Super Admin `AgencyDetail.tsx` và ở `AgencyReport.tsx` cấp đại lý) nhân với `totalOrders` của shop này — KHÔNG lấy từ COD thật đã đối soát. |
| **Doanh thu** | `fmtVND(getShopMargin(shop.id))` | `getShopMargin(shopId)` (từ `reconciliationLedger.ts`) = Σ `(shopServiceFee − ghnFee)` trên mọi dòng đối soát của shop này — đây là CHÊNH LỆCH PHÍ VẬN CHUYỂN thật (phí bán cho shop trừ phí NVC), KHÔNG phải % trên COD. |

Chi tiết bổ sung:

1. `fmtNum`/`fmtVND` ở `ShopDetail.tsx` là 2 HÀM KHÁC HẲN với `fmtNum`/`fmtVND` ở `AgencyDetail.tsx` (Super Admin) dù trùng tên gọi:
   - `fmtNum` (ShopDetail) = `n.toLocaleString('vi-VN')` — KHÔNG rút gọn thành "k" như bản Super Admin, chỉ thêm dấu chấm ngăn cách hàng nghìn (ví dụ 15800 → "15.800", không phải "15.8k").
   - `fmtVND` (ShopDetail): ≥ 1 tỷ → `"X tỷ"`, ≥ 1 triệu → `"X tr"` (chữ Việt, bỏ `.0` nếu tròn số), còn lại → số đầy đủ + `" ₫"` — khác hẳn cách viết `"X.XB"`/`"X.XM"`/`"XK"` (chữ cái tiếng Anh, không có `₫`) của bản Super Admin.
2. "Doanh thu" ở đây dùng ĐÚNG tên gọi khớp với BẢN CHẤT phép tính (`getShopMargin` = chênh lệch phí, đúng nghĩa doanh thu/lợi nhuận gộp của đại lý từ shop này) — KHÁC với "Tổng phí ship" ở Super Admin `AgencyDetail.tsx` (dùng `getShopServiceFeeTotal`, tổng phí GỘP CHƯA trừ phí NVC). 2 khái niệm này KHÔNG PHẢI cùng 1 con số dù cùng dựa trên dữ liệu đối soát của shop — xem Notes.
3. "Tổng COD" vẫn dùng công thức demo cố định (`totalOrders × 35.000`), CHƯA đổi sang COD thật đã đối soát (`getShopCodTotal(shopId)`, hàm có sẵn trong `reconciliationLedger.ts` nhưng chưa được gọi ở đây) — cùng khoảng trống đã ghi nhận ở GSA-DL-12 (Super Admin).

## Acceptance Criteria

**AC1:** Khối "Thống kê tổng quan" hiện ngay dưới header "Thông tin shop", TRƯỚC tab bar — luôn hiển thị cho MỌI shop, không phụ thuộc tab đang chọn.

**AC2:** Hiện đúng 3 thẻ theo thứ tự: "Đơn hàng" (icon `InboxOutlined`, `#10B981`), "Tổng COD" (icon `DollarOutlined`, `#F59E0B`), "Doanh thu" (icon `BarChartOutlined`, `#8B5CF6`).

**AC3:** "Đơn hàng" = `shop.totalOrders` của ĐÚNG shop đang xem, hiển thị dạng số nguyên có dấu chấm ngăn cách hàng nghìn (KHÔNG rút gọn "k" như bên Super Admin).

**AC4:** "Tổng COD" = `shop.totalOrders × 35.000` — LUÔN dùng đúng `totalOrders` của shop đang xem, hiển thị dạng "X tỷ" / "X tr" / số đầy đủ kèm "₫" tuỳ độ lớn.

**AC5:** "Doanh thu" = `getShopMargin(shop.id)` — tổng chênh lệch (`shopServiceFee − ghnFee`) trên mọi dòng đối soát của shop này; KHÔNG được tính bằng % của COD hay bất kỳ hằng số cố định nào.

**AC6:** Đổi sang xem shop khác → cả 3 số cập nhật đúng theo dữ liệu shop mới, không giữ lại số của shop trước.

**AC7:** Shop chưa có dòng đối soát nào → "Doanh thu" hiện "0 ₫" (không lỗi, không `NaN`).

**AC8:** Shop có 0 đơn hàng (`totalOrders = 0`) → "Đơn hàng" hiện "0", "Tổng COD" hiện "0 ₫".

## Notes

- Story mô tả khối "Thống kê tổng quan" ở trang Chi tiết shop (Agency Admin) — CÙNG TÊN TIÊU ĐỀ với khối tương tự ở Chi tiết đại lý (Super Admin, xem GSA-DL-12), nhưng đây là 2 trang/2 platform khác nhau, dùng 2 bộ hàm format RIÊNG BIỆT (xem System Flow điểm 1) — không dùng chung code.
- **KHÔNG NHẦM LẪN**: "Doanh thu" ở đây (`getShopMargin` — phí gộp ĐÃ trừ phí NVC, tức lợi nhuận) khác với "Tổng phí ship" ở Super Admin `AgencyDetail.tsx` (`getShopServiceFeeTotal` — phí gộp CHƯA trừ). 2 con số này sẽ KHÁC NHAU cho cùng 1 shop, đừng nhầm là cùng 1 chỉ số hiển thị ở 2 nơi.
- Agency Admin còn 1 khối thống kê KHÁC ở trang "Báo cáo" (`AgencyReport.tsx`) — không có tiêu đề "Thống kê tổng quan" (chỉ có subtitle "Tổng quan số lượng shop, COD và sản lượng đơn của đại lý"), với 4 KPI card ở CẤP CẢ ĐẠI LÝ (không phải từng shop): "Số lượng shop", "COD", "Sản lượng đơn", "Đơn TB / shop" — CHƯA được viết thành story riêng, cần xác nhận thêm nếu muốn tài liệu hoá luôn khối này.
- **Known inconsistency (đã biết, chưa xử lý)**: "Tổng COD" vẫn dùng công thức demo cố định — chưa đổi sang `getShopCodTotal(shopId)` (COD thật đã đối soát) như đã làm cho "Doanh thu" — cùng khoảng trống đã ghi nhận ở GSA-DL-12 phía Super Admin.
