---
id: SHOP-RECON-5
jiraKey: 
platform: shop
section: Đối soát
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [SHOP] Đối soát: Gap — reload trang chi tiết mất dữ liệu phiên

## Mục tiêu

Ghi nhận giới hạn kỹ thuật hiện tại: trang chi tiết phiên đối soát nhận dữ liệu qua `location.state` (router state), không fetch lại theo `:id` trong URL. Reload trang mất toàn bộ dữ liệu phiên vì router state không tồn tại sau khi reload.

## User Story

Là chủ shop, khi tôi bookmark hoặc chia sẻ link trang chi tiết phiên đối soát (ví dụ `/shop/reconciliation/COD_SHOP_20260101001_SHP001`), hoặc đơn giản là refresh trình duyệt đang xem, tôi mong đợi vẫn thấy đúng nội dung phiên đó — không phải trang lỗi trắng "Không tìm thấy phiên đối soát".

## User Flow

**Hiện tại (có bug):**
1. Từ danh sách → bấm "Xem" → trang chi tiết hiển thị bình thường.
2. Nhấn F5 (reload) hoặc mở lại link từ bookmark → trang hiện "Không tìm thấy phiên đối soát. Quay lại".

**Mong đợi (sau khi fix):**
1. Truy cập URL `/shop/reconciliation/:id` bằng bất kỳ cách nào → trang tự fetch/build dữ liệu phiên từ `:id`, hiển thị đúng nội dung.

## System Flow

**Nguyên nhân hiện tại:**
1. `ReconciliationDetail.tsx` đọc dữ liệu bằng `const session = location.state?.session` (router state).
2. `location.state` chỉ tồn tại khi navigate từ cùng phiên trình duyệt đang mở — bị xóa khi reload, không có ở tab mới, bookmark, hay chia sẻ link.
3. Khi `location.state?.session` là `undefined` → component hiện fallback "Không tìm thấy phiên đối soát".

**Hướng fix:**
1. Đọc `:id` từ URL (`useParams().id`).
2. Gọi lại `buildShopSessions()` (đã có sẵn, `Reconciliation.tsx` dùng để build danh sách) → tìm session khớp `id`.
3. Nếu không tìm được session → hiện fallback như hiện tại.
4. Có thể giữ `location.state?.session` làm fast-path (không cần build lại khi navigate từ danh sách), chỉ dùng `buildShopSessions()` khi state không có.

## Acceptance Criteria

**AC1 (gap hiện tại):** Reload trang chi tiết phiên → hiện "Không tìm thấy phiên đối soát" dù phiên đó tồn tại. Đây là hành vi hiện tại cần ghi nhận, chưa phải sau fix.

**AC2 (after fix):** Truy cập `/shop/reconciliation/:id` trực tiếp (bookmark, chia sẻ link, tab mới, reload) → trang tự build lại dữ liệu từ `:id`, hiển thị đúng nội dung phiên.

**AC3 (after fix):** Navigate từ danh sách (có `location.state`) → trang vẫn hiển thị ngay, không bị chậm thêm do build lại.

**AC4 (after fix):** `:id` không khớp phiên nào của shop → hiện fallback "Không tìm thấy phiên đối soát" với link quay lại, không crash.

## Notes

- Gap này tương đồng với nhiều trang detail khác trong prototype đang dùng router state thay vì URL params để truyền dữ liệu — pattern không bền vững cho production.
- `buildShopSessions()` hiện tại chỉ lọc `shopId === 'SHP001'` hardcode — khi fix cũng cần đảm bảo không lộ phiên của shop khác nếu `shopId` được đọc động.
- Fix này không thay đổi URL format, không ảnh hưởng routing — chỉ thay đổi cách `ReconciliationDetail.tsx` lấy dữ liệu.
