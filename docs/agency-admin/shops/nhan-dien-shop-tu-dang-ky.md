---
id: AGA-SHOP-9
jiraKey:
platform: agency-admin
section: Quản lý Shop
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGENCY] Shop - Danh sách shop: Nhận diện shop tự đăng ký

## User Story

Là Agency Admin (Đại lý), tôi muốn thấy ngay shop vừa tự đăng ký (chọn đại lý mình) trong danh sách shop, để biết và cấu hình dịch vụ/bảng giá cho shop đó mà không cần ai báo thủ công.

## User Flow

1. Shop tự đăng ký ở Web Shop, chọn đúng đại lý của tôi (xem [WS-LOGIN-1](../../shop/login-logout/dang-ky-shop-moi.md)).
2. Vào "Quản lý shop" (`/agency-admin/shops`) → thấy shop mới ở đầu danh sách, tab "Đang hoạt động", đủ SĐT/địa chỉ đã đăng ký.
3. Click vào shop → trang chi tiết hiện đúng thông tin đã đăng ký; mục "Cấu hình dịch vụ" hiện toàn bộ dịch vụ ở trạng thái "Dịch vụ không khả dụng" (vì shop tự đăng ký chưa có `configuredServices`) → tôi bấm "Chỉnh sửa" để gắn bảng giá.

## System Flow

1. [shopStore.ts](../../../src/mock-data/shopStore.ts) (mới) — store dùng chung qua `localStorage` (cùng cơ chế `orderStore.ts`): `addShop()`, `updateShop()`, `loadShops()` (tự backfill shop base thiếu theo id, không đụng shop đã có/đã sửa).
2. `Shops.tsx` (danh sách) và `ShopDetail.tsx` (chi tiết) đọc từ `loadShops()` thay vì import tĩnh `shops.json`.
3. **Bug đã fix trong lúc làm:** danh sách shop từng tính ở module-level (`const RAW = ...`, chạy đúng 1 lần lúc app load do `App.tsx` import tĩnh toàn bộ trang) — nghĩa là shop tự đăng ký sau đó **không bao giờ xuất hiện** khi điều hướng bằng SPA routing (menu/PlatformSwitcher, không reload trang), chỉ thấy được sau khi F5. Đã chuyển thành `buildShops()` — hàm được gọi lại **mỗi lần trang render**, luôn đọc đúng dữ liệu mới nhất kể cả khi điều hướng nội bộ không reload.
4. Nút Kích hoạt/Ngừng hoạt động: đổi từ mutate trực tiếp object JSON import (`raw.status = ...`) sang ghi qua `updateShop()` — persist qua reload thật, không chỉ sống trong session.

## Acceptance Criteria

**AC1:** Shop tự đăng ký chọn đúng đại lý hiện tại → xuất hiện trong danh sách shop của đại lý đó ngay sau khi đăng ký, không cần F5/mở tab mới.

**AC2:** Shop tự đăng ký chọn đại lý KHÁC → không xuất hiện trong danh sách của đại lý hiện tại (đúng multi-tenant isolation theo `agencyId`, không phải bug).

**AC3:** Click vào shop tự đăng ký → trang chi tiết hiện đúng tên shop, chủ shop, SĐT, địa chỉ, username đã đăng ký.

**AC4:** Shop tự đăng ký chưa có `configuredServices` → mọi dịch vụ ở tab "Cấu hình dịch vụ" hiện "Dịch vụ không khả dụng" (đúng quy tắc chung, không phải lỗi riêng cho shop tự đăng ký).

**AC5:** Kích hoạt/Ngừng hoạt động shop (cả tự đăng ký và shop cũ) → trạng thái giữ đúng qua F5 (persist qua `localStorage`, không chỉ sống trong session).

**AC6:** Modal "Xuất đơn hàng" (chọn shop để xuất) liệt kê đúng và đủ shop, gồm cả shop tự đăng ký.

## Notes

- Đây là phần "kết nối" của luồng đăng ký self-service — trước khi làm, `Register.tsx` chỉ là UI stub, không lưu gì cả (giống cách `ShopCreate.tsx` bên Agency Admin cũng không thật sự persist khi bấm "Tạo mới").
- Root cause của lỗi "vừa đăng ký nhưng không thấy trong danh sách" ban đầu người dùng báo: không phải do chưa lưu dữ liệu (dữ liệu đã lưu đúng vào `localStorage`), mà do trang danh sách tính dữ liệu 1 lần duy nhất ở module-level — bug kinh điển khi trộn "hằng số tính 1 lần lúc import module" với dữ liệu cần refresh theo mỗi lần vào trang trong 1 SPA.
