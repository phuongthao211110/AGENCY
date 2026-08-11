---
id: WS-LOGIN-1
jiraKey:
platform: shop
section: Login / Logout
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Đăng ký shop mới (self-service)

## User Story

Là chủ shop chưa có tài khoản, tôi muốn tự đăng ký shop và chọn đại lý mình muốn hợp tác, để có thể bắt đầu dùng hệ thống ngay mà không cần đại lý tạo tài khoản hộ.

## User Flow

1. Ở trang Đăng nhập (`/shop/login`), bấm link "Chưa có tài khoản? Đăng ký ngay" → sang `/shop/register`.
2. Điền form: Tên shop, Họ tên chủ shop, Số điện thoại, Địa chỉ, chọn 1 đại lý trong dropdown "Đại lý hợp tác", Tên đăng nhập, Mật khẩu, Xác nhận mật khẩu.
3. Bấm "Đăng ký" → tài khoản active ngay, vào thẳng `/shop/orders` (không có bước chờ duyệt).
4. Từ trang đăng ký, có link "Đã có tài khoản? Đăng nhập" → quay lại `/shop/login`.

## System Flow

1. Dropdown "Đại lý hợp tác" chỉ liệt kê đại lý có `status === 'active'` trong `agencies.json` — không cho chọn đại lý `inactive`/`pending`.
2. Submit gọi `addShop()` ([shopStore.ts](../../../src/mock-data/shopStore.ts)) — tạo `Shop` mới: `id` sinh theo `SHOP${Date.now().slice(-6)}`, `status: 'active'` ngay, `configuredServices: []` (đại lý cần tự cấu hình dịch vụ/bảng giá sau — cho tới lúc đó mọi dịch vụ hiện "Dịch vụ không khả dụng", đúng quy tắc đã có ở [AGA-SHOP-3](../../agency-admin/shops/tao-moi-shop-cau-hinh-dich-vu.md)).
3. Shop được lưu qua `localStorage` (cùng cơ chế `orderStore.ts`) — sống qua reload, thấy được từ cả phía Agency Admin (xem [AGA-SHOP-9](../../agency-admin/shops/nhan-dien-shop-tu-dang-ky.md)).
4. Validate SĐT dùng chung `isValidVNPhone()` ([phoneValidation.ts](../../../src/mock-data/phoneValidation.ts)) — xem chi tiết đầu số hợp lệ ở [AGA-HT-1](../../agency-admin/he-thong/cap-nhat-dau-so-dien-thoai.md).
5. Validate username: đối chiếu `loadShops()` — chặn submit nếu đã tồn tại username trùng.

## Acceptance Criteria

**AC1:** Dropdown "Đại lý hợp tác" chỉ hiện đại lý `status === 'active'`.

**AC2:** Số điện thoại phải đúng 10 số và đầu số hợp lệ theo config GHN thực tế — sai đầu số thì chặn submit + hiện lỗi "Số điện thoại không hợp lệ".

**AC3:** Tên đăng nhập trùng với shop đã có (bất kỳ đại lý nào) → chặn submit + hiện lỗi "Tên đăng nhập đã được sử dụng, vui lòng chọn tên khác".

**AC4:** Mật khẩu và Xác nhận mật khẩu không khớp → chặn submit + hiện lỗi ngay tại field Xác nhận mật khẩu.

**AC5:** Đăng ký thành công → shop `status: 'active'` ngay, không cần đại lý duyệt, vào thẳng `/shop/orders`.

**AC6:** Shop vừa đăng ký xuất hiện đúng trong danh sách shop của ĐÚNG đại lý đã chọn ở Agency Admin (không lẫn qua đại lý khác).

## Notes

- Quyết định "chọn đại lý trong form + active ngay" (không qua bước duyệt) đã chốt trực tiếp với người dùng — khác với luồng carrier-connection request hiện có (`CarrierSetup.tsx`) vốn có bước chờ duyệt 1–2 ngày.
- Web Shop hiện **không có khái niệm "shop đang đăng nhập" động** — toàn bộ `Orders.tsx`/`Pricing.tsx`/`BankAccounts.tsx` hardcode `'SHP001'`. Nghĩa là sau khi đăng ký, dù data shop đã lưu đúng và Agency Admin thấy đúng, chính chủ shop khi vào `/shop/orders` vẫn thấy dữ liệu demo của SHP001, chưa phải dữ liệu (rỗng) của chính mình — gap còn lại, chưa làm.
- Không có bước xác thực SĐT/email (OTP) trước khi active — đánh đổi đã chọn để tối ưu demo, không phải hành vi production-ready.
