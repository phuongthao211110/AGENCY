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

| # | Tính năng | Platform | Mô tả | Ngày thêm |
|---|-----------|----------|-------|-----------|
| 1 | LaunchAgent auto-start dev server | Dev Setup | Tự động chạy `npm run dev` khi login macOS | 2026-04-13 |
| 2 | Đồng bộ table Agency Admin | Agency Admin | Rebuild Orders/Pricing/Reconciliation sang custom flex table; thêm padding page header chuẩn `12px 16px`; fix layout bg `#fff` | 2026-04-13 |
| 3 | Fix padding table CarrierSetup | Agency Admin | Wrap table trong `padding: '0 16px'` cho cả 3 tab (Kết nối NVC, Dịch vụ, Bảng giá); xoá paddingLeft rời trên từng row/header | 2026-04-13 |
| 4 | Đồng bộ padding table toàn bộ 3 platform | All | Fix `paddingLeft: 16` → `padding: '0 16px'` trên 7 table containers; rebuild Shop Pricing + Shop Reconciliation sang custom flex table; fix ServiceDetail bordered-card tables | 2026-04-13 |
| 5 | Fix horizontal overflow Shop Orders | Web Shop | Add `overflow: hidden` + `minWidth: 0` vào ShopLayout main area div và page wrapper — ngăn table 1400px làm scroll toàn bộ trang | 2026-04-13 |

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
