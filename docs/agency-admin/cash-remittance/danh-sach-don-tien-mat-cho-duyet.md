---
id: AGA-PAYMENT-1
jiraKey: 
platform: agency-admin
section: Duyệt thanh toán tiền mặt
figma: 
status: draft
---

# [AGA] Duyệt thanh toán tiền mặt: Danh sách shop theo tab Chờ/Đã xác nhận

## Bối cảnh

Tách nhỏ (lần 2) từ bản AGA-PAYMENT-1 gộp trước đó (từng gồm cả bộ lọc/tìm kiếm/chọn nhiều/màn Chi tiết trong cùng 1 story) — nay CHỈ còn phạm vi: trang danh sách chính (header, 3 thẻ tổng quan, 2 tab, bảng cơ bản, phân trang). Các năng lực khác đã tách thành story riêng: AGA-PAYMENT-4 (lọc + tìm kiếm), AGA-PAYMENT-5 (chọn nhiều shop), AGA-PAYMENT-6 (màn "Chi tiết" full-page), AGA-PAYMENT-2 (duyệt 1 dòng), AGA-PAYMENT-7 (duyệt hàng loạt), AGA-PAYMENT-8 (duyệt từ màn Chi tiết).

## User Story

Là Agency Admin, tôi muốn xem danh sách SHOP (bưu cục) thuộc đại lý mình đang nợ tiền mặt phí ship, tách riêng 2 tab "Chờ xác nhận"/"Đã xác nhận" kèm 3 thẻ tổng quan đầu trang, để nắm nhanh tình hình công nợ tiền mặt của toàn đại lý mà không phải cuộn qua từng khối shop một như thiết kế cũ.

## User Flow

1. Vào menu "Duyệt thanh toán" trong sidebar Agency Admin → route `/agency-admin/cash-remittance`.
2. Đầu trang: tiêu đề "Duyệt thanh toán" + mô tả ngắn "Đối soát và xác nhận phí ship shop phải chuyển cho đại lý".
3. 3 thẻ tổng quan: **"Tổng đơn hàng chưa thanh toán"** (đỏ, đếm mọi đơn `pending_review` của đại lý), **"Tổng phí ship chưa thanh toán (đ)"** (đỏ, cộng dồn phí các đơn đó), **"Shop bị khoá tạo đơn"** dạng "X / Y" (X = số shop đang bị tự động khoá tạo đơn, Y = tổng số shop CÓ phát sinh đơn tiền mặt — không phải tổng toàn bộ shop của đại lý).
4. 2 tab: **"Chờ xác nhận {n}"** (mặc định, nền đen) / **"Đã xác nhận {m}"** — n = số shop còn ≥1 đơn `pending_review`; m = số shop có đơn tiền mặt nhưng HIỆN KHÔNG còn đơn nào `pending_review` (đã duyệt hết). 1 shop CHỈ thuộc đúng 1 trong 2 tab tại 1 thời điểm.
5. **Bảng tab "Chờ xác nhận"**: Shop (tên đậm + mã shop xám bên dưới) | Trạng thái ("Đã khoá tạo đơn" đỏ / "Cho phép tạo đơn" xanh — chữ màu thuần, không nền) | Đơn hàng chưa thanh toán (số đơn `pending_review` của shop đó) | Phí ship chưa thanh toán (đ) | Thao tác: nút xanh "✓ Đã nhận" (xem AGA-PAYMENT-2) + nút viền "👁 Chi tiết" (xem AGA-PAYMENT-6).
6. **Bảng tab "Đã xác nhận"**: chỉ còn Shop | Trạng thái (luôn "Cho phép tạo đơn" xanh) | Thao tác (chỉ còn "👁 Chi tiết").
7. Bấm "✓ Đã nhận" hoặc duyệt hàng loạt (xem AGA-PAYMENT-2/7) → sau khi xác nhận, (các) shop đó NGAY LẬP TỨC biến mất khỏi tab "Chờ xác nhận" và xuất hiện ở tab "Đã xác nhận"; 2 số đếm trên tab và 3 thẻ tổng quan đầu trang cập nhật theo.
8. Cuối trang: thanh phân trang thật (không phải số trang giả) — "Hiển thị {50|100}" + dãy số trang + ô "Đến trang" nhảy thẳng.
9. KHÔNG hiện bất kỳ dòng "Shop báo đã chuyển..." nào ở đây dù Shop đã bấm "Thanh toán cho đại lý" ở Báo cáo dòng tiền (Web Shop — xem SHOP-ORDER-55) hay chưa — Agency KHÔNG dựa vào "lời khai" của Shop để tin, chỉ dựa vào số ngày trễ (hệ thống tự track) rồi tự đối chiếu sổ quỹ thật trước khi duyệt.

## System Flow

1. Route `/agency-admin/cash-remittance` (`CashRemittance.tsx`), nav item trong `AgencyAdminLayout.tsx` với badge `countPendingCashApprovals()` = đếm đơn `paymentMethod === 'cash' && paymentApprovalStatus === 'pending_review'` của các shop có `agencyId === CURRENT_AGENCY_ID` ('AGN001').
2. `buildShopStats(shop, relevantOrders, blockDays)`: trả về `{ shop, orders, pending, pendingFeeTotal, maxDays, blocked }` cho 1 shop — `blocked = pending.length > 0 && maxDays >= blockDays`, ĐÚNG công thức `isOrderCreationBlocked()` (`orderStore.ts`) để "Trạng thái" ở đây LUÔN khớp với việc Web Shop của shop đó có đang bị khoá tạo đơn thật hay không.
3. `allStats = agencyShops.map(shop => buildShopStats(...)).filter(s => s.orders.length > 0)` — chỉ giữ shop CÓ ít nhất 1 đơn tiền mặt liên quan.
4. `pendingShops = allStats.filter(s => s.pending.length > 0)`; `confirmedShops = allStats.filter(s => s.pending.length === 0)` — tương ứng đúng 2 tab, không chồng lấn.
5. `blockedShopsCount = pendingShops.filter(s => s.blocked).length` — tử số thẻ "Shop bị khoá tạo đơn"; mẫu số = `allStats.length`.
6. `activeRows` (sau khi áp bộ lọc/tìm kiếm — xem AGA-PAYMENT-4) cắt trang bằng `pageSize`/`page` qua component `Pagination` (tái dùng NGUYÊN hàm `export function Pagination` đã có sẵn ở `AgencyOrders.tsx`).
7. `refresh()` (tick state ở component cha) được gọi sau mỗi lần duyệt (bất kỳ cách nào) — re-render lại `allStats`/`pendingShops`/`confirmedShops`, khiến shop vừa duyệt tự "nhảy" từ mảng này sang mảng kia ở lần render kế tiếp.

## Acceptance Criteria

**AC1:** Sidebar Agency Admin có mục "Duyệt thanh toán" với badge đỏ hiện đúng số đơn `pending_review` của CÁC SHOP THUỘC AGENCY MÌNH; route mở đúng trang.

**AC2:** 3 thẻ tổng quan hiện đúng số liệu tính trên TOÀN BỘ đại lý (không phụ thuộc tab/trang/bộ lọc đang chọn); "Shop bị khoá tạo đơn" hiện đúng dạng "X / Y" với Y = số shop CÓ đơn tiền mặt (không phải tổng số shop của đại lý).

**AC3:** 1 shop chỉ xuất hiện ở ĐÚNG 1 tab tại 1 thời điểm — "Chờ xác nhận" nếu còn ≥1 đơn `pending_review`, "Đã xác nhận" nếu có đơn tiền mặt nhưng hiện không còn đơn nào `pending_review`; shop chưa từng phát sinh đơn tiền mặt không xuất hiện ở tab nào.

**AC4:** Sau khi 1 shop được duyệt hết đơn chờ (bất kỳ cách nào), shop đó rời tab "Chờ xác nhận" sang "Đã xác nhận" NGAY, đếm 2 tab + 3 thẻ tổng quan cập nhật theo, không cần F5.

**AC5:** Cuối trang luôn hiện thanh phân trang thật (kể cả khi dữ liệu demo chỉ đủ 1 trang).

**AC6:** Dù đơn có `cashRemittanceDeclaredAt` (Shop đã tự khai bên Web Shop) hay không, không có bất kỳ dòng/nhãn "Shop báo đã chuyển" nào khác biệt ở bảng danh sách chính.

## Notes

- **Lịch sử tách story**: bản gốc AGA-PAYMENT-1 (v3) gộp CẢ bộ lọc/tìm kiếm, chọn nhiều + duyệt hàng loạt, và mô tả chi tiết màn "Chi tiết" (modal rồi full-page) trong CÙNG 1 story. Nay tách thành 6 story riêng (xem Bối cảnh) để mỗi năng lực ước lượng/triển khai/test độc lập được — tổng thể tính năng KHÔNG đổi, chỉ đổi cách chia nhỏ tài liệu.
- Tính năng này đã THAY THẾ HOÀN TOÀN trang "Duyệt thanh toán phí ship" cũ của Super Admin (GSA-PAYMENT-1/2/3, đã XOÁ) — lý do nghiệp vụ: Shop (bưu cục) thu hộ tiền mặt phải chuyển lại cho ĐẠI LÝ quản lý mình, không phải chuyển thẳng cho GHN, nên Agency Admin mới đúng vai trò duyệt.
- Cột "Trạng thái" ở bảng chính CHỈ có 2 mức (Đã khoá tạo đơn / Cho phép tạo đơn) — mức cảnh báo trung gian (còn bao nhiêu ngày trễ) nằm ở TỪNG ĐƠN trong màn "Chi tiết" (xem AGA-PAYMENT-6), không phải ở đây.
- Xem AGA-PAYMENT-4 (bộ lọc trạng thái + tìm kiếm); AGA-PAYMENT-5 (chọn nhiều shop); AGA-PAYMENT-6 (màn Chi tiết full-page); AGA-PAYMENT-2/7/8 (3 cách duyệt); AGA-PAYMENT-3 (cảnh báo/khoá tự động phía Web Shop); GSA-PAYMENT-CONFIG-1 (Super Admin — nơi cấu hình ngưỡng, riêng từng đại lý).
- `rejectOrderPayment()` (`orderStore.ts`) vẫn chưa có nút gọi nào trong UI — đơn `rejected` trong hệ thống hiện chỉ có thể đến từ seed data demo.
