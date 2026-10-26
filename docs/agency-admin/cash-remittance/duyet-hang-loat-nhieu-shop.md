---
id: AGA-PAYMENT-7
jiraKey: 
platform: agency-admin
section: Duyệt thanh toán tiền mặt
figma: 
status: draft
---

# [AGA] Duyệt thanh toán tiền mặt: Duyệt hàng loạt nhiều shop đã chọn

## Bối cảnh

Tách từ bản AGA-PAYMENT-2 gộp trước đó (cách 2 trong 3 cách duyệt) — ghép cặp với AGA-PAYMENT-5 (cơ chế tick chọn). Story này CHỈ mô tả điều gì xảy ra khi bấm nút "✓ Duyệt N shop đã chọn".

## User Story

Là Agency Admin, khi đã thực nhận tiền mặt từ NHIỀU shop cùng lúc, tôi muốn tick chọn hàng loạt rồi duyệt 1 lần thay vì bấm từng shop một, để xử lý nhanh khi đại lý quản lý nhiều shop.

## User Flow

1. Sau khi tick ≥1 checkbox (xem AGA-PAYMENT-5), nút xanh **"✓ Duyệt N shop đã chọn"** hiện ra cạnh ô tìm kiếm.
2. Bấm vào → ĐÚNG 1 `window.confirm` DUY NHẤT, nêu TỔNG SỐ ĐƠN gộp của TẤT CẢ shop đã chọn (không hỏi lại từng shop riêng lẻ).
3. Xác nhận → mọi shop đã chọn duyệt xong CÙNG LÚC, rời tab "Chờ xác nhận" sang "Đã xác nhận"; lựa chọn (checkbox) tự xoá sạch.
4. Huỷ `window.confirm` → không có gì thay đổi, lựa chọn (checkbox) VẪN GIỮ NGUYÊN (không bị xoá khi huỷ).
5. Shop KHÔNG được tick (dù đang hiện cùng trang/cùng tab) hoàn toàn không bị ảnh hưởng.
6. **Hệ quả tức thì bên Web Shop**: mỗi shop vừa được duyệt, nếu đang bị tự động khoá tạo đơn, đều được MỞ LẠI NGAY lập tức — độc lập cho từng shop trong nhóm vừa duyệt.
7. Không có cách chọn lọc duyệt RIÊNG 1 vài đơn trong CÙNG 1 shop qua cách này — luôn áp dụng cho TẤT CẢ đơn `pending_review` của MỌI shop đã chọn.

## System Flow

1. `handleApproveSelected()` (component cha `CashRemittance`): lọc `pendingShops.filter(s => selectedShopIds.has(s.shop.id) && s.pending.length > 0)`, cộng dồn tổng số đơn của TẤT CẢ shop đã chọn vào ĐÚNG 1 `window.confirm` (khác với `approveShop()` ở AGA-PAYMENT-2/8 — không tái dùng được vì cần gộp nhiều shop vào 1 câu hỏi duy nhất).
2. Nếu xác nhận: lặp lồng 2 tầng (từng shop đã chọn → từng đơn `pending` của shop đó) gọi `approveOrderPayment(o.id, CURRENT_AGENT)` (hàm dùng chung, `orderStore.ts` — xem AGA-PAYMENT-2).
3. Xong: `setSelectedShopIds(new Set())` (xoá sạch lựa chọn) + `refresh()` (re-render lại `allStats`/`pendingShops`/`confirmedShops`).
4. `shopCashOverdueDays(shopId)` tính RIÊNG từng shop — duyệt gộp nhiều shop không làm thay đổi cách tính của shop khác chưa nằm trong nhóm vừa duyệt.

## Acceptance Criteria

**AC1:** Tick ≥2 checkbox → hiện nút "✓ Duyệt N shop đã chọn" với N đúng.

**AC2:** Bấm nút → ĐÚNG 1 `window.confirm` gộp tổng số đơn của TẤT CẢ shop đã chọn (không hỏi lại từng shop).

**AC3:** Xác nhận → TẤT CẢ shop đã chọn chuyển sang tab "Đã xác nhận" cùng lúc, lựa chọn (checkbox) tự xoá sạch.

**AC4:** Shop KHÔNG được tick giữ nguyên dù đang hiện cùng trang/cùng tab.

**AC5:** Huỷ `window.confirm` → không có đơn nào bị đổi trạng thái, lựa chọn (checkbox) KHÔNG bị xoá.

**AC6:** Mỗi shop trong nhóm vừa duyệt, nếu đang bị khoá tạo đơn, đều được mở lại NGAY (độc lập, không phụ thuộc shop khác trong cùng nhóm).

**AC7:** Không có cách chọn lọc duyệt RIÊNG 1 vài đơn trong cùng 1 shop qua cách này — luôn áp dụng cho TẤT CẢ đơn `pending_review` của MỌI shop đã chọn.

## Notes

- Tách từ bản AGA-PAYMENT-2 gộp trước đó (cách 2/3) — hành vi KHÔNG đổi, chỉ tách ra thành story riêng.
- Cách này KHÔNG phải quay lại hành vi v1 (1 nút "Duyệt tất cả đơn chờ" cho TOÀN ĐẠI LÝ, không chọn được shop nào) — ở đây Agency Admin TỰ CHỌN chính xác những shop nào muốn gộp duyệt, các shop khác (dù cùng thoả điều kiện "có đơn chờ") không bị đụng tới nếu không tick.
- Xem AGA-PAYMENT-5 (cơ chế tick chọn — điều kiện để nút này xuất hiện); AGA-PAYMENT-1 (bảng danh sách chính); AGA-PAYMENT-2 (duyệt 1 dòng — dùng hàm `approveShop()` khác với hàm `handleApproveSelected()` ở đây); AGA-PAYMENT-8 (duyệt từ màn "Chi tiết").
