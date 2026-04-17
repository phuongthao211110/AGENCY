# GHN Agency Prototype — Deploy Tracker

> File này là nguồn sự thật duy nhất cho trạng thái deploy. Claude Code phải đọc và cập nhật file này mỗi khi có tính năng mới hoặc khi deploy lên production.

---

## Deploy Flow

```
1. Phát triển tính năng ở local (npm run dev → localhost:4000)
2. Test kỹ, đảm bảo build pass: npm run build
3. Thêm tính năng vào mục [Pending Deploy] bên dưới
4. Khi muốn deploy: confirm với user → move sang [Deploy History]
5. Deploy: git push → CI/CD hoặc manual upload dist/
```

> **Quy tắc:** KHÔNG push production nếu chưa có confirm rõ ràng từ user. Mọi feature mới đều vào Pending trước.

---

## Pending Deploy

> Các tính năng đã phát triển local, chưa lên production.


---

## Production URL

> Chưa cấu hình — cập nhật khi có hosting.

```
URL:       —
Provider:  —
Branch:    main
Build cmd: npm run build
Dist dir:  dist/
```

---

## Deploy History

> Các lần đã deploy lên production.

| Version | Ngày | Nội dung | Người deploy |
|---------|------|----------|-------------|
| v0.1.0 | — | Initial commit — toàn bộ 3 platform (Super Admin, Agency Admin, Web Shop) | — |
| v0.2.0 | 2026-04-13 | Sync table layout toàn bộ 3 platform: rebuild 5 trang sang custom flex table, fix padding 0 16px, fix responsive Shop Orders, add DEPLOY.md | trannlb |
| v0.3.0 | 2026-04-13 | Web Shop: Drawer Tạo đơn hàng — slide-in 980px full-height, form đầy đủ (người gửi/nhận, sản phẩm, kích thước, dịch vụ vận chuyển, COD, ghi chú), backdrop overlay | trannlb |
| v0.4.0 | 2026-04-13 | (1) Super Admin: bỏ popup tạo đại lý, navigate thẳng vào create page. (2) Agency Admin: rebuild màn hình Tạo shop mới theo Figma (2 section card, Mã shop auto-gen, copy/toggle password). (3) Agency Admin: edit/view mode cho chi tiết gói dịch vụ — tạo gói mở edit mode, Lưu → view-only, Chỉnh sửa → edit mode | trannlb |
| v0.5.0 | 2026-04-15 | (1) Super Admin: bỏ section "Kết nối tài khoản GHN" khỏi trang chi tiết đại lý. (2) Agency Admin: rebuild trang Chi tiết shop theo Figma — 2 card (Thông tin cơ bản, Cấu hình tài khoản), toggle/copy mật khẩu, nút Chỉnh sửa + Xoá. (3) Mock data: thêm ownerName vào shops.json | trannlb |
| v0.6.0 | 2026-04-15 | Document master-detail cho 3 platform: menu Document ở sidebar, nested routes /story/:id + /new/:sectionKey, TOC expand/collapse, Tiptap editor luôn bật (title input + toolbar), lưu localStorage, tạo/xóa story, 9 user stories Super Admin, list-keymap cho nested bullet | trannlb |
| v0.6.1 | 2026-04-16 | Ẩn menu Document trên production — chỉ hiển thị khi hostname === 'localhost' (3 platform) | trannlb |
| v0.7.0 | 2026-04-16 | Dọn dẹp Agency Admin (xoá Dashboard/Orders/Pricing/Reconciliation chưa phát triển, xoá menu Cài đặt), bổ sung story lifecycle (draft→approved→sent-to-tech), thêm 4 user stories Thiết lập NVC, đồng bộ toàn bộ docs/ với JSON | trannlb |
| v0.8.0 | 2026-04-17 | Cấu trúc mới Service–Shop–PriceTable: (1) Tạo services.json với field ghnShopId + priceTableId. (2) CarrierSetup TabServices thêm cột Shop ID GHN, TabPricing đơn giản chỉ còn tên + Chi tiết. (3) ServiceDetail: section Bảng giá 1:1 (gắn/thay đổi). (4) ShopCreate: thêm section Cấu hình dịch vụ — chọn bảng giá cho từng dịch vụ khi tạo shop. | trannlb |
| v0.8.1 | 2026-04-17 | Đổi tên cột "Shop ID" → "Shop ID GHN" trong tab Kết nối NVC (CarrierSetup) để đồng bộ tên cột với tab Dịch vụ. | trannlb |
| v0.9.0 | 2026-04-17 | Agency Admin: trang Tạo bảng giá mới (`/agency-admin/carrier-setup/pricing/create`) — form Tên + Mô tả, danh sách tuyến (4 loại: Nội tỉnh / Nội vùng / Liên vùng / Liên tỉnh), cấu hình phạm vi áp dụng toggle cho Liên tỉnh (Từ/Đến: Vùng, Tỉnh, Quận, Xã), khối lượng chuẩn + giá chuẩn, thêm ngưỡng vượt cân inline. UI đồng nhất với ShopCreate. Tab Bảng giá bỏ cột NVC + Trạng thái. | trannlb |

---

## Tính năng đã có (v0.1.0 — baseline)

### Super Admin
- [x] Login page
- [x] Dashboard (stats tổng quan)
- [x] Danh sách đại lý (`/super-admin/agencies`)
- [x] Tạo đại lý (`/super-admin/agencies/create`)
- [x] Chi tiết đại lý (`/super-admin/agencies/:id`)
- [x] Thiết lập nhà vận chuyển (`/super-admin/carrier-setup`)

### Agency Admin
- [x] Login page
- [x] Dashboard
- [x] Danh sách shop (`/agency-admin/shops`)
- [x] Tạo shop (`/agency-admin/shops/create`)
- [x] Chi tiết shop (`/agency-admin/shops/:id`)
- [x] Danh sách đơn hàng (`/agency-admin/orders`)
- [x] Bảng giá (`/agency-admin/pricing`)
- [x] Chi tiết dịch vụ (`/agency-admin/pricing/:id`)
- [x] Đối soát (`/agency-admin/reconciliation`)

### Web Shop
- [x] Login page
- [x] Danh sách đơn hàng (`/shop/orders`)
- [x] Bảng giá (`/shop/pricing`)
- [x] Đối soát (`/shop/reconciliation`)
- [x] Hỗ trợ (`/shop/support`)

---

## Checklist trước khi deploy

- [ ] `npm run build` pass không lỗi
- [ ] `npm run lint` không có warning nghiêm trọng
- [ ] Test trên Chrome + Safari
- [ ] Test 3 platform login flow
- [ ] Kiểm tra mock data hiển thị đúng
- [ ] Review PENDING list — confirm đủ tính năng muốn ship
