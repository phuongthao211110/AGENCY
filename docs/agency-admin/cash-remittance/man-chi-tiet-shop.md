---
id: AGA-PAYMENT-6
jiraKey: 
platform: agency-admin
section: Duyệt thanh toán tiền mặt
figma: 
status: draft
---

# [AGA] Duyệt thanh toán tiền mặt: Màn "Chi tiết" shop (full-page)

## Bối cảnh

Tách từ AGA-PAYMENT-1 (bước "Bấm 👁 Chi tiết" của bản gộp trước) — nay thành story riêng vì đây là 1 màn hình/route-nội-bộ hoàn chỉnh (header, thẻ tổng quan, tab, tìm kiếm, bảng, phân trang riêng), không chỉ là 1 hành vi nhỏ của trang danh sách. Nút "✓ Đã nhận" trong header của màn này — hành động duyệt khi bấm — xem AGA-PAYMENT-8.

## User Story

Là Agency Admin, khi cần xem đầy đủ lịch sử đơn tiền mặt của MỘT shop cụ thể (không chỉ số tổng ở bảng danh sách), tôi muốn mở 1 màn hình riêng liệt kê từng đơn kèm trạng thái chi tiết, lọc theo Tất cả/Chưa thanh toán/Đã thanh toán và tìm theo mã đơn, để kiểm tra kỹ trước khi quyết định duyệt cho shop đó.

## User Flow

1. Bấm **"👁 Chi tiết"** ở 1 dòng shop bất kỳ (tab nào, xem AGA-PAYMENT-1) → MỞ MÀN HÌNH RIÊNG full trang (KHÔNG phải modal/popup — thay thế hẳn toàn bộ nội dung bảng/tab danh sách đang xem, không có overlay tối phía sau).
2. **Header**: nút **"←"** quay lại (góc trái) + tên shop (to, đậm) + mã shop (xám, dưới tên) + 1 badge pill tròn cạnh tên ("🚫 Đã khoá tạo đơn" đỏ hoặc "✓ Cho phép tạo đơn" xanh, theo đúng trạng thái của shop) + nút xanh **"✓ Đã nhận"** (góc phải, xám/disabled nếu shop không còn đơn chờ — xem AGA-PAYMENT-8 cho hành động khi bấm).
3. **3 thẻ tổng quan RIÊNG CHO SHOP NÀY**: "Tổng đơn hàng" (mọi đơn tiền mặt của shop, không lọc), "Tổng đơn hàng chưa thanh toán" (đỏ nếu > 0), "Tổng phí ship chưa thanh toán (đ)" (đỏ nếu > 0).
4. **3 tab riêng của màn này**: "Tất cả {n}" (mặc định) / "Chưa thanh toán {n}" (mọi đơn KHÔNG `confirmed`, gồm cả `pending_review` lẫn `rejected`) / "Đã thanh toán {n}" (đơn `confirmed`).
5. **Ô tìm kiếm** "Tìm kiếm theo mã đơn hàng" — lọc bảng theo `trackingCode`, không phân biệt hoa/thường.
6. **Bảng đơn** (sắp theo giờ shop khai mới nhất lên đầu): Mã đơn hàng (chữ xanh đậm + nhãn loại nhỏ "📦 Hàng hoá"/"✉️ Thư" ngay dưới) | **Phí dịch vụ** (số âm, tổng phí của đơn) | **Đã thanh toán** (số dương, phần đại lý đã duyệt) | **Chưa thanh toán** (số âm, tô NỀN CAM đậm `#FF5200` chữ trắng khi khác 0 — dễ nhận ra ngay, giống cách bảng "Phí dịch vụ" bên Web Shop hiển thị) | Shop khai lúc (giờ:phút ngày/tháng) | Trạng thái (2 dòng CHỮ MÀU THUẦN, không nền pill — xem System Flow).
6b. 3 cột tiền (Phí dịch vụ/Đã thanh toán/Chưa thanh toán) tách rõ phần GỐC đã duyệt khỏi phần MỚI PHÁT SINH sau khi duyệt (phí hoàn hàng/phụ phí đổi địa chỉ — xem SHOP-ORDER-56): đơn đã duyệt mà sau đó `fee` tăng thêm → "Đã thanh toán" vẫn giữ đúng số gốc đã duyệt, "Chưa thanh toán" hiện đúng phần tăng thêm (tô cam) — Agency Admin thấy NGAY số tiền cụ thể cần duyệt thêm, không cần tự nhẩm tính từ số liệu rời rạc.
7. **Phân trang RIÊNG** của màn này (không dùng chung state trang với danh sách bên ngoài).
8. Bấm **"←"** → quay lại ĐÚNG danh sách bên ngoài (tab/trang/bộ lọc/tìm kiếm giữ nguyên như trước khi mở Chi tiết), không đổi dữ liệu gì nếu chưa bấm "✓ Đã nhận".
9. Mở màn này (xem/tìm kiếm/đổi tab) THUẦN XEM — không có thao tác nào ở đây làm thay đổi dữ liệu đơn/shop ngoại trừ bấm nút "✓ Đã nhận" (xem AGA-PAYMENT-8).

## System Flow

1. `ShopDetailView({ stats, onBack, onApproved })` (`CashRemittance.tsx`) — component cha render `<ShopDetailView .../>` THAY HẲN cho JSX danh sách chính (`if (detailStats) return <ShopDetailView .../>` — early return, không phải overlay đè lên JSX danh sách) khi `detailShopId` (state, chỉ lưu ID shop) khác `null`; `detailStats = allStats.find(s => s.shop.id === detailShopId)` tính lại MỖI LẦN RENDER nên luôn khớp dữ liệu mới nhất.
2. Bên trong: `confirmed = stats.orders.filter(confirmed)`, `unpaid = stats.orders.filter(!== confirmed)` (gồm cả `pending_review` lẫn `rejected`) → 3 tab `all/unpaid/paid` lọc từ 2 mảng này; `filtered` lọc tiếp theo `search` trên `trackingCode`; `sorted` theo `paymentPaidAt` giảm dần; state `tab`/`search`/`page`/`pageSize` RIÊNG của component này (không chia sẻ với danh sách chính) — `useEffect` reset `page` về 1 khi đổi `tab`/`search`.
3. `SendKindTag({ order })`: badge nhỏ theo `order.sendKind` ('letter' → tím "✉️ Thư", khác → cam "📦 Hàng hoá").
4. `rowAmounts(order)` (hàm MỚI, `CashRemittance.tsx`) — DÙNG CHUNG đúng công thức với `rowAmounts()` ở Web Shop (`CashFlowReport.tsx`) để 2 bên LUÔN khớp số: đơn chưa `confirmed` → `{ phiDichVu: -fee, daThanhToan: 0, chuaThanhToan: -fee }`; đơn đã `confirmed` → `approvedAmount = paymentApprovedAmount ?? fee`, `extra = fee - approvedAmount`, trả `{ phiDichVu: -fee, daThanhToan: approvedAmount, chuaThanhToan: extra > 0 ? -extra : 0 }`. Ô "Chưa thanh toán" chỉ tô nền cam khi `chuaThanhToan !== 0`.
5. `OrderStatusLine({ order })`: 2 dòng CHỮ MÀU THUẦN (không nền pill) — `confirmed` VÀ KHÔNG còn phần chưa duyệt (`fee - approvedAmount <= 0`) → xanh "Đã thanh toán" + giờ/ngày `paymentApprovedAt`; `confirmed` NHƯNG CÒN phần chưa duyệt (`fee - approvedAmount > 0`) → cam "Phát sinh thêm" + "{Phí hoàn hàng | Phụ phí đổi địa chỉ | Khoản mới} chưa duyệt" (xác định loại theo `order.status === 'returning'` hay `feeAddressChange > 0`); `rejected` → đỏ "Chưa thanh toán" + "Bị từ chối: {lý do}"; `pending_review` → đỏ "Chưa thanh toán" + (nếu `daysSince >= 1`) "Quá {N} ngày".
6. Pagination tái dùng `Pagination` đã export sẵn từ `AgencyOrders.tsx` — instance RIÊNG, độc lập với `Pagination` ở danh sách chính.
7. Nút "✓ Đã nhận" trong header — hành vi khi bấm xem AGA-PAYMENT-8 (`handleApprove()`).

## Acceptance Criteria

**AC1:** Bấm "👁 Chi tiết" → MỞ MÀN HÌNH RIÊNG full trang đúng shop (không phải modal, không còn thấy bảng/tab danh sách chính phía sau), có nút "←" + tên shop + mã shop + badge trạng thái + nút "✓ Đã nhận".

**AC2:** 3 thẻ tổng quan hiện đúng số liệu RIÊNG của shop đang xem (không lẫn số liệu đại lý).

**AC3:** 3 tab Tất cả/Chưa thanh toán/Đã thanh toán hiện đúng số đếm; chuyển tab → bảng lọc đúng tập đơn tương ứng.

**AC4:** Gõ vào ô "Tìm kiếm theo mã đơn hàng" → bảng chỉ còn đơn khớp `trackingCode`, không phân biệt hoa/thường; xoá ô tìm kiếm → đủ lại toàn bộ (theo tab đang chọn).

**AC5:** Mỗi dòng bảng có badge loại đơn (📦 Hàng hoá/✉️ Thư) đúng `sendKind`, và 2 dòng trạng thái màu thuần đúng nội dung (Đã thanh toán+giờ xác nhận / Phát sinh thêm+loại khoản mới / Chưa thanh toán+lý do từ chối / Chưa thanh toán+số ngày trễ).

**AC5b:** 3 cột Phí dịch vụ/Đã thanh toán/Chưa thanh toán hiện đúng số theo công thức `rowAmounts()`; luôn thoả `|Phí dịch vụ| = Đã thanh toán + |Chưa thanh toán|`; ô "Chưa thanh toán" tô nền cam `#FF5200` chữ trắng khi khác 0, hiện số thường (không tô) khi bằng 0.

**AC5c:** Đơn đã `confirmed` mà phát sinh thêm phí hoàn hàng/đổi địa chỉ CHƯA được duyệt lại (`fee > paymentApprovedAmount`) → cột "Chưa thanh toán" tô cam đúng số tiền phát sinh, cột "Trạng thái" hiện "Phát sinh thêm" (cam) thay vì "Đã thanh toán" (xanh) — 2 cột này LUÔN khớp nhau (cùng báo có/không còn khoản chưa duyệt), không được mâu thuẫn.

**AC6:** Phân trang của màn này hoạt động độc lập, không ảnh hưởng trang đang xem ở danh sách chính.

**AC7:** Bấm "←" → quay lại ĐÚNG danh sách bên ngoài (tab/trang/bộ lọc/tìm kiếm giữ nguyên), không đổi dữ liệu gì nếu chưa bấm "✓ Đã nhận".

**AC8:** Mở/xem/tìm kiếm/đổi tab ở màn này KHÔNG làm thay đổi `scanCount`-tương-đương nào của đơn/shop — thuần xem, trừ hành động "✓ Đã nhận" (AGA-PAYMENT-8).

## Notes

- **Thêm mới (3 cột tiền + nhãn "Phát sinh thêm")**: trước đây bảng chỉ có 1 cột "Phí ship (đ)" (tổng gộp) — không cho Agency Admin thấy được phần nào đã duyệt, phần nào mới phát sinh (phí hoàn hàng/đổi địa chỉ) chưa duyệt, dù Web Shop đã hiện rõ việc này ở "Báo cáo dòng tiền" (xem SHOP-ORDER-55). Đã thay bằng 3 cột Phí dịch vụ/Đã thanh toán/Chưa thanh toán (dùng CHUNG công thức `rowAmounts()` với Web Shop) + đổi `OrderStatusLine` thêm nhánh "Phát sinh thêm" (cam) để 2 cột Chưa-thanh-toán và Trạng thái luôn nhất quán, không còn trường hợp 1 bên nói "Đã thanh toán" (xanh) trong khi bên kia vẫn tô cam báo còn tiền chưa duyệt.
- **Giới hạn còn lại (chưa xử lý)**: dù giờ đã THẤY RÕ khoản phát sinh, đơn này vẫn tính vào tab "Đã thanh toán" (vì `paymentApprovalStatus` vẫn là `confirmed`) — CHƯA có cách Agency Admin duyệt RIÊNG phần phát sinh đó qua UI (không quay lại tab "Chưa thanh toán"/hàng chờ duyệt của shop ở danh sách ngoài). Đây là quyết định kiến trúc còn để ngỏ, cần chọn 1 trong 2 hướng: (a) coi đơn này vẫn "còn phần chưa duyệt" trong `buildShopStats`/`pendingShops` dù `paymentApprovalStatus === 'confirmed'`, khi duyệt thì set `paymentApprovedAmount = fee`; hoặc (b) tách phụ phí thành bản ghi riêng có trạng thái duyệt độc lập.
- **Lịch sử**: màn này từng là `ShopDetailModal` (overlay + nền tối + nút X, bản v3) rồi được đổi thành full-page `ShopDetailView` (v4, xem AGA-PAYMENT-1/2 bản cũ đã tách) theo đúng 1 UI tham khảo thật mới cung cấp (mobile-app-style: header + badge + nút hành động, thẻ tổng quan, tab, tìm kiếm, bảng). UAT (Playwright, `localhost:2000`) đã xác nhận: màn này là full component-swap thật (JSX danh sách chính không còn render khi đang xem Chi tiết), không có lỗi console.
- Cột "Trạng thái" THEO TỪNG ĐƠN ở đây (dòng phụ "Quá {N} ngày") là nơi DUY NHẤT còn thể hiện mức cảnh báo trung gian — bảng danh sách chính (AGA-PAYMENT-1) chỉ còn 2 mức tổng quát (Đã khoá/Cho phép tạo đơn).
- Xem AGA-PAYMENT-1 (bảng danh sách chính, nơi nút "👁 Chi tiết" nằm); AGA-PAYMENT-8 (hành động duyệt khi bấm "✓ Đã nhận" trong màn này); SHOP-ORDER-55 (Web Shop — nơi 3 cột tiền này được định nghĩa gốc).
