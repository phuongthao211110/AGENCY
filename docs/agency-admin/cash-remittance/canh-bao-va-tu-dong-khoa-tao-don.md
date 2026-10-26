---
id: AGA-PAYMENT-3
jiraKey: 
platform: agency-admin
section: Duyệt thanh toán tiền mặt
figma: 
status: draft
---

# [AGA] Duyệt thanh toán tiền mặt: Cảnh báo trễ 1 ngày, tự động khoá tạo đơn sau 3 ngày

## User Story

Là Agency Admin, tôi muốn hệ thống TỰ ĐỘNG nhắc nhở rồi khoá tạo đơn của riêng từng Shop (bưu cục) nếu Shop đó chậm chuyển tiền mặt thu hộ về cho đại lý quá lâu, để tôi không phải tự theo dõi thủ công và Shop có động lực chuyển tiền đúng hạn.

## User Flow

1. Shop (bưu cục) tạo 1 đơn Tiền mặt (Shop trả ship) bình thường — đơn đi vận hành ngay (xem SHOP-ORDER-43), `paymentApprovalStatus: 'pending_review'`.
2. **Qua ngày hôm sau (trễ 1-2 ngày) mà Agency Admin chưa duyệt**: ngay khi vào trang "Đơn hàng" (Web Shop), 1 BANNER VÀNG hiện LIÊN TỤC ngay dưới tiêu đề trang: "⚠️ Shop còn N ngày chưa chuyển tiền mặt đã thu cho đại lý. Vui lòng chuyển sớm — quá 3 ngày hệ thống sẽ tự động khoá tạo đơn mới." — banner hiện SUỐT trong lúc Shop còn ở ngưỡng cảnh báo (không cần bấm gì để thấy, không tự ẩn), Shop vẫn bấm "+ Tạo đơn hàng" → "Tạo đơn hàng" bình thường, KHÔNG có popup nào chặn thêm.
3. **Quá 3 ngày mà vẫn chưa được Agency Admin duyệt**: nút "+ Tạo đơn hàng" ở Web Shop TỰ ĐỘNG chuyển xám, đổi label "Tạm chặn tạo đơn", không bấm được, hover hiện tooltip giải thích — áp dụng cho CẢ 2 loại đơn (Hàng hoá GHN lẫn Thư/tài liệu 247Express) của RIÊNG shop này, các Shop khác (kể cả cùng đại lý) không bị ảnh hưởng.
4. Đơn đã tạo TRƯỚC khi bị khoá hoàn toàn không bị ảnh hưởng gì — vẫn xem/sửa/huỷ/in bình thường, chỉ việc TẠO ĐƠN MỚI là bị chặn.
5. Agency Admin vào "Duyệt thanh toán tiền mặt" bấm "Duyệt shop này" (xem AGA-PAYMENT-2) → Shop được MỞ LẠI tạo đơn ngay lập tức, không cần chờ gì thêm.

## System Flow

1. `shopCashOverdueDays(shopId)` (`orderStore.ts`): lọc đơn `o.shopId === shopId && o.paymentMethod === 'cash' && o.paymentApprovalStatus === 'pending_review' && o.paymentPaidAt`; nếu rỗng → trả `0`; nếu có → lấy `paymentPaidAt` CŨ NHẤT, gọi `daysSinceCalendar()` tính SỐ NGÀY LỊCH chênh lệch (so ngày dương lịch, KHÔNG phải số giờ trôi qua chia 24) — đơn tạo lúc 23h50 hôm nay đã tính "trễ 1 ngày" ngay khi sang 00h01 hôm sau, không cần đợi đủ 24 giờ, vì Shop gộp tất cả đơn phát sinh trong 1 ngày thành 1 đợt cần chuyển.
2. `isOrderCreationBlocked(shopId)`: trả về `shopCashOverdueDays(shopId) >= loadRemittanceConfig(shop.agencyId).blockDays` (tự tra `agencyId` của shop qua `loadShops()`) — THAY THẾ HOÀN TOÀN công tắc thủ công cũ (`setOrderCreationBlocked`/`ghn_order_creation_blocked` trong `localStorage`, đã xoá) — không còn lưu trạng thái gì, tính TOÀN BỘ từ dữ liệu đơn hiện có mỗi lần gọi. Ngưỡng `blockDays` (và `warningDays`) nay đọc RIÊNG THEO TỪNG ĐẠI LÝ từ `loadRemittanceConfig(agencyId)` — Super Admin cấu hình được ở `/super-admin/settings/cash-remittance-rules` (xem GSA-PAYMENT-CONFIG-1), mặc định `{ warningDays: 1, blockDays: 3 }` cho đại lý nào chưa từng cấu hình riêng.
3. `Orders.tsx` (Web Shop): `remittanceConfig = loadRemittanceConfig()`; `cashOverdueDays = shopCashOverdueDays('SHP001')`; `creationBlocked = cashOverdueDays >= remittanceConfig.blockDays`; `cashOverdueWarning = cashOverdueDays >= remittanceConfig.warningDays && cashOverdueDays < remittanceConfig.blockDays`.
4. Nút "+ Tạo đơn hàng" dùng `creationBlocked` để disable/đổi label/tooltip — giống hệt cách UI cũ phản ứng với công tắc thủ công, chỉ khác NGUỒN của biến `creationBlocked`.
5. Banner cảnh báo (JSX ngay dưới "Page header", TRƯỚC khối "Tabs" trong `Orders.tsx`): `{cashOverdueWarning && (<div>...</div>)}` — nền `#FEF3C7`, chữ `#92400E`, full-width, render MỖI LẦN trang re-render (không phải 1 lần duy nhất) nên LUÔN khớp đúng `cashOverdueDays` hiện tại. Menu con "Tạo đơn hàng" (mở `CreateOrderDrawer`) KHÔNG còn gọi `window.alert(...)` nữa — `onClick` chỉ còn `setDrawerOpen(true)`.
6. `handleCreate()` trong CẢ `CreateOrderDrawer` (đơn Hàng hoá) và `CreateLetterDrawer` (đơn Thư) đều guard `if (isOrderCreationBlocked('SHP001')) { window.alert(...); return }` ngay đầu hàm — phòng trường hợp drawer đã mở sẵn trước khi quá hạn 3 ngày.

## Acceptance Criteria

**AC1:** Shop có đơn tiền mặt `pending_review` với `paymentPaidAt` cách đây 0 ngày (hôm nay) → không cảnh báo, không khoá gì.

**AC2:** Shop có đơn tiền mặt `pending_review` trễ 1-2 ngày → banner vàng hiện LIÊN TỤC ngay dưới tiêu đề trang "Đơn hàng" với đúng số ngày trễ (không cần bấm gì), và bấm "Tạo đơn hàng" vẫn mở form bình thường, không có popup nào xen vào.

**AC3:** Shop có đơn tiền mặt `pending_review` trễ ≥3 ngày → nút "+ Tạo đơn hàng" chuyển xám, label "Tạm chặn tạo đơn", không bấm được — áp dụng cho CẢ Hàng hoá lẫn Thư/tài liệu.

**AC4:** Đơn đã tạo TRƯỚC khi bị khoá không bị ảnh hưởng gì — vẫn thao tác (xem/sửa/huỷ/in) bình thường.

**AC5:** Việc khoá/cảnh báo tính RIÊNG theo từng shop — Shop A bị khoá không ảnh hưởng gì tới Shop B, kể cả khi 2 shop cùng thuộc 1 đại lý.

**AC6:** Agency Admin bấm "Duyệt shop này" (AGA-PAYMENT-2) cho shop đang bị khoá → Shop đó MỞ LẠI tạo đơn ngay (F5 trang Web Shop là thấy, không cần thao tác gì thêm).

**AC7:** Đơn MoMo/Chuyển khoản KHÔNG BAO GIỜ tính vào `shopCashOverdueDays()` (chỉ lọc `paymentMethod === 'cash'`) — 2 kênh online không ảnh hưởng gì tới việc khoá/cảnh báo tạo đơn của shop.

## Notes

- **Thay đổi lớn**: thay thế hoàn toàn công tắc thủ công "Chặn tạo đơn mới" của GHN Super Admin (GSA-PAYMENT-3, đã xoá — vốn là 1 cờ boolean TOÀN HỆ THỐNG, bật/tắt tay) bằng cơ chế TỰ ĐỘNG, tính TOÀN BỘ từ dữ liệu, áp dụng RIÊNG từng shop theo số ngày trễ thực tế — không cần ai bấm nút "bật chặn" nữa.
- **Cập nhật**: ngưỡng 1 ngày (cảnh báo)/3 ngày (khoá) KHÔNG còn hardcode — Super Admin cấu hình được ở `/super-admin/settings/cash-remittance-rules` (xem GSA-PAYMENT-CONFIG-1), RIÊNG TỪNG ĐẠI LÝ (mỗi đại lý tự đặt mức của mình, không còn dùng chung 1 cặp ngưỡng cho toàn hệ thống như bản đầu).
- **Sửa quan trọng**: cách đếm số ngày trễ đổi từ "24 giờ trôi qua kể từ đúng giờ phút tạo đơn" sang "NGÀY LỊCH chênh lệch" (`daysSinceCalendar()`) — khớp đúng mô hình Shop gộp TẤT CẢ đơn phát sinh trong 1 ngày thành 1 đợt cần chuyển cho Agency; đơn tạo cuối ngày hôm nay vẫn tính "trễ 1 ngày" ngay khi sang ngày mai, không cần đợi đủ 24 giờ.
- **PROTOTYPE THUẦN** — không có cơ chế nhắc qua email/SMS/push notification nào, chỉ có banner vàng ngay trên trang khi Shop đang mở Web Shop.
- **Thay đổi (banner thay cho alert)**: bản đầu dùng `window.alert` hiện 1 LẦN mỗi khi Shop bấm "Tạo đơn hàng" lúc đang trong ngưỡng cảnh báo — dễ bị bỏ sót (Shop tắt alert rồi quên luôn) và gây gián đoạn thao tác. Đã đổi sang banner vàng full-width hiện LIÊN TỤC ngay dưới tiêu đề trang "Đơn hàng" trong suốt thời gian Shop còn ở ngưỡng cảnh báo — không cần bấm gì để thấy, không tự ẩn, và không còn `window.alert` nào ở bước này nữa (guard `window.alert` trong `handleCreate()` khi THỰC SỰ đã bị khoá — xem điểm 6 — KHÔNG đổi).
- Xem AGA-PAYMENT-1 (danh sách đơn chờ duyệt, phía Agency Admin), AGA-PAYMENT-2 (hành động "Duyệt shop này", theo từng shop), SHOP-ORDER-43 (vì sao đơn tiền mặt luôn ở `pending_review` cho tới khi được duyệt, trong khi MoMo/CK tự "Đã nhận" ngay), GSA-PAYMENT-CONFIG-1 (Super Admin — nơi cấu hình 2 ngưỡng này).
