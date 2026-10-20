---
id: AGA-PAYMENT-1
jiraKey: 
platform: agency-admin
section: Duyệt thanh toán tiền mặt
figma: 
status: draft
---

# [AGA] Duyệt thanh toán tiền mặt: Danh sách đơn chờ duyệt theo từng Shop

## User Story

Là Agency Admin, tôi muốn xem danh sách đơn tiền mặt NHÓM THEO TỪNG SHOP (bưu cục) thuộc đại lý mình, kèm số ngày đã trễ chưa chuyển tiền về cho đại lý, để biết Shop nào cần nhắc và Shop nào đã bị hệ thống tự khoá tạo đơn — và duyệt được RIÊNG cho từng shop thay vì gộp chung.

## User Flow

1. Vào menu "Duyệt thanh toán" trong sidebar Agency Admin (icon ví tiền, có badge đỏ số đơn đang "Chờ duyệt") → route `/agency-admin/cash-remittance`.
2. Đầu trang hiện tiêu đề + mô tả ngắn giải thích cơ chế: Shop thu hộ tiền mặt phải chuyển lại cho Agency; trễ 1-2 ngày chỉ bị nhắc, trễ từ 3 ngày Shop tự động bị khoá tạo đơn mới.
3. 4 chip tổng (tính trên TOÀN BỘ đại lý): "N chờ duyệt" (vàng), "N trễ 1-2 ngày" (vàng), "N đã khoá tạo đơn (≥3 ngày)" (đỏ), "N đã nhận tiền" (xanh).
4. Bên dưới là DANH SÁCH THEO TỪNG SHOP — mỗi shop CÓ ĐƠN TIỀN MẶT (shop không có đơn tiền mặt nào thì không hiện khối) là 1 khối riêng, gồm:
   - Tên shop + badge trạng thái TỔNG QUÁT của shop đó: "Không có đơn chờ" (xanh) / "Có đơn chờ duyệt" (vàng) / "⚠ Trễ N ngày" (vàng) / "🚫 Đang bị khoá tạo đơn" (đỏ).
   - Số đơn tiền mặt của shop đó.
   - Nút **"Duyệt shop này (N)"** — N là số đơn CHỜ DUYỆT của RIÊNG shop này.
   - Bảng con liệt kê từng đơn của shop đó: Mã vận đơn, Số tiền, Shop khai lúc, Trạng thái.
5. Trạng thái từng dòng đơn CHỈ HIỂN THỊ, không bấm được gì ở cấp từng dòng: Chờ duyệt (vàng, chưa trễ) / ⚠ Chờ duyệt — trễ N ngày (vàng, 1-2 ngày) / 🚫 Quá N ngày — đã khoá tạo đơn (đỏ, ≥3 ngày) / ✓ Đã nhận tiền (xanh, kèm giờ + nguồn duyệt) / **✕ Chưa nhận tiền** (đỏ, kèm lý do từ chối + nguồn — HIẾM, chỉ khi Agency đã từng kiểm tra và xác nhận KHÔNG nhận được tiền qua `rejectOrderPayment()`).
6. KHÔNG hiện bất kỳ dòng "Shop báo đã chuyển..." nào ở đây dù Shop đã bấm "Thanh toán cho đại lý" ở Báo cáo dòng tiền (Web Shop — xem SHOP-ORDER-55) hay chưa — Agency KHÔNG dựa vào "lời khai" của Shop để tin, chỉ dựa vào số ngày trễ (hệ thống tự track) rồi tự đối chiếu sổ quỹ thật trước khi bấm "Duyệt shop này".

## System Flow

1. Route `/agency-admin/cash-remittance` (`CashRemittance.tsx`), nav item trong `AgencyAdminLayout.tsx` với badge `countPendingCashApprovals()` = đếm đơn `paymentMethod === 'cash' && paymentApprovalStatus === 'pending_review'` của các shop có `agencyId === CURRENT_AGENCY_ID` ('AGN001').
2. `agencyShops = loadShops().filter(s => s.agencyId === CURRENT_AGENCY_ID)` — toàn bộ shop thuộc đại lý mình (kể cả shop chưa có đơn tiền mặt nào — bị lọc bỏ ở bước sau).
3. `relevantOrders = orders.filter(o => o.paymentMethod === 'cash' && !!o.paymentApprovalStatus)` — tính SẴN trên toàn bộ đơn tiền mặt (không giới hạn agency ở bước này, vì bước gán vào từng shop ở dưới đã tự đảm bảo chỉ hiện shop thuộc đại lý mình).
4. `shopsWithOrders = agencyShops.map(shop => ({ shop, orders: relevantOrders.filter(o => o.shopId === shop.id) })).filter(g => g.orders.length > 0)` — mỗi phần tử là 1 khối `ShopGroup`, chỉ giữ shop CÓ ít nhất 1 đơn tiền mặt.
5. `ShopGroup({ shopDisplayName, orders, onApproved })`: tự tính `pending`/`maxDays` RIÊNG cho shop này (không dùng biến toàn trang) để quyết định badge trạng thái + số N trên nút "Duyệt shop này".
6. `daysSince(order.paymentPaidAt)` CÙNG CÔNG THỨC với `shopCashOverdueDays()` (`orderStore.ts`) mà Web Shop dùng để quyết định khoá tạo đơn, để 2 phía luôn khớp số ngày.

## Acceptance Criteria

**AC1:** Sidebar Agency Admin có mục "Duyệt thanh toán" với badge đỏ hiện đúng số đơn `pending_review` của CÁC SHOP THUỘC AGENCY MÌNH; route mở đúng trang.

**AC2:** 4 chip tổng đầu trang hiện đúng số lượng theo từng trạng thái, tính trên TOÀN BỘ đại lý (cộng dồn mọi shop).

**AC3:** Mỗi shop CÓ đơn tiền mặt hiện đúng 1 khối riêng — shop KHÔNG có đơn tiền mặt nào thì KHÔNG hiện khối (không hiện khối rỗng).

**AC4:** Badge trạng thái tổng quát của từng shop phản ánh đúng mức độ trễ NẶNG NHẤT trong các đơn `pending_review` của RIÊNG shop đó.

**AC5:** Đơn trễ 1-2 ngày → nhãn dòng "⚠ Chờ duyệt — trễ N ngày" (vàng); đơn trễ ≥3 ngày → nhãn dòng "🚫 Quá N ngày — đã khoá tạo đơn" (đỏ).

**AC6:** Dòng đơn trong bảng con THUẦN HIỂN THỊ — không có nút Duyệt/Từ chối riêng ở cấp từng dòng (hành động nằm ở cấp SHOP, xem AGA-PAYMENT-2).

**AC7:** Đơn `paymentApprovalStatus === 'rejected'` → hiện ĐÚNG "✕ Chưa nhận tiền" (đỏ) kèm lý do + nguồn từ chối — KHÔNG được rơi vào nhánh tính ngày trễ (bug đã phát hiện qua UAT: thiếu nhánh `rejected` khiến đơn này hiện sai thành "🚫 Quá N ngày — đã khoá tạo đơn").

**AC8:** Đơn `rejected` KHÔNG được tính vào số N trên nút "Duyệt shop này (N)" — `approveOrderPayment()` chỉ áp dụng cho đơn đang `pending_review`.

**AC9:** Dù đơn có `cashRemittanceDeclaredAt` (Shop đã tự khai bên Web Shop) hay không, `StatusCell` ở đây hiện ĐÚNG Y HỆT nhau — không có bất kỳ dòng/nhãn "Shop báo đã chuyển" nào khác biệt.

## Notes

- **Thay đổi lớn (v2 — nhóm theo shop)**: bản đầu (v1) là 1 bảng phẳng chung cho toàn đại lý + 1 nút "Duyệt tất cả" áp dụng hết — đã đổi sang nhóm RIÊNG theo từng shop để Agency Admin kiểm soát/duyệt chính xác từng shop một, không bị gộp nhầm.
- Tính năng này THAY THẾ HOÀN TOÀN trang "Duyệt thanh toán phí ship" cũ của Super Admin (GSA-PAYMENT-1/2/3, đã XOÁ) — lý do nghiệp vụ: Shop (bưu cục) thu hộ tiền mặt phải chuyển lại cho ĐẠI LÝ quản lý mình, không phải chuyển thẳng cho GHN, nên Agency Admin mới đúng vai trò duyệt.
- Số ngày trễ tính từ `paymentPaidAt` CŨ NHẤT còn `pending_review` của shop đó (xem `shopCashOverdueDays()`, `orderStore.ts`) — không phải trung bình hay theo từng đơn riêng lẻ.
- Xem AGA-PAYMENT-2 (nút "Duyệt shop này" — hành động nay ở CẤP SHOP, không còn là 1 nút tổng cho cả đại lý); AGA-PAYMENT-3 (phía Web Shop — cảnh báo/tự động khoá tạo đơn theo ngưỡng cấu hình).
- Ngưỡng "1-2 ngày"/"≥3 ngày" hiện trong mô tả đầu trang và nhãn các dòng KHÔNG còn hardcode — đọc từ `loadRemittanceConfig()` (`warningDays`/`blockDays`), Super Admin cấu hình ở `/super-admin/settings/cash-remittance-rules` (xem GSA-PAYMENT-CONFIG-1); 1/3 chỉ còn là giá trị MẶC ĐỊNH.
- **Bug đã sửa**: `StatusCell` ban đầu KHÔNG có nhánh `rejected` (chỉ check `confirmed` rồi rơi thẳng vào tính ngày trễ) — phát hiện khi thêm dữ liệu demo có đơn `rejected` thật. Đã thêm nhánh `rejected` ngay sau `confirmed`, trước khi tính `days`.
- `rejectOrderPayment()` (`orderStore.ts`) vẫn chưa có nút gọi nào trong UI (kế thừa hạn chế từ thiết kế cũ) — đơn `rejected` trong hệ thống hiện chỉ có thể đến từ seed data demo, không tạo được qua thao tác Agency Admin thật.
- **Thay đổi (bỏ hint "Shop báo đã chuyển")**: `StatusCell` từng hiện thêm 1 dòng "💬 Shop báo đã chuyển lúc..." khi đơn có `cashRemittanceDeclaredAt` — đã BỎ theo yêu cầu: Agency không cần một "thông báo" kiểu Shop tự khai để tin, mà tự dựa vào số ngày trễ do hệ thống tự track rồi tự đối chiếu sổ quỹ thật. `cashRemittanceDeclaredAt` vẫn tồn tại trên `Order` và vẫn được set bởi `declareCashRemittance()` (Shop vẫn bấm "Thanh toán cho đại lý" được bình thường, xem SHOP-ORDER-55) — chỉ KHÔNG còn hiển thị gì ở phía Agency Admin.
- Tên mục sidebar/tiêu đề trang đã đổi từ "Duyệt thanh toán tiền mặt" thành **"Duyệt thanh toán"** (ngắn gọn hơn) — `id`/tên file tài liệu vẫn giữ nguyên để không phá liên kết, chỉ UI text đổi.
