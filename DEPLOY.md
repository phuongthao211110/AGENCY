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

> **Quy tắc:**
> - KHÔNG push production nếu chưa có confirm rõ ràng từ user. Mọi feature mới đều vào Pending trước.
> - **Documentation changes (.md, CLAUDE.md) không cần tạo version mới** — chỉ commit + push. Chỉ tạo version khi có code/feature changes (src/, vite.config, mock-data).
> - ⚠️ **BẮT BUỘC khi deploy:** Cập nhật version badge ở **3 file layout** trước khi commit:
>   - `src/platforms/agency-admin/layout/AgencyAdminLayout.tsx`
>   - `src/platforms/super-admin/layout/SuperAdminLayout.tsx`
>   - `src/platforms/shop/layout/ShopLayout.tsx`

---

## Pending Deploy

> Các tính năng đã phát triển local, chưa lên production.

| Version | Tính năng | Author |
|---------|-----------|--------|

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

> Các lần đã deploy lên production. Sắp xếp theo version tăng dần (mới nhất ở cuối).

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
| v0.9.1 | 2026-04-22 | Web Shop: Section Dịch vụ trong drawer Tạo đơn — card "Dịch vụ" radio chọn dịch vụ vận chuyển từ Agency Admin, data từ `configuredServices` trong shops.json, refactor Action card bỏ row "Phí ship". | trannlb |
| v0.10.0 | 2026-04-22 | (1) Agency Admin: ShopDetail thêm Card "Cấu hình dịch vụ" — bảng read-only 3 cột (Dịch vụ / Mã NVC / Bảng giá áp dụng), dịch vụ chưa gắn bảng giá hiển thị cảnh báo amber. (2) Agency Admin: Thêm menu "Đơn hàng", trang danh sách đơn từ các shop thuộc đại lý (2 tab: Tất cả đơn / Đã huỷ), drawer tạo đơn hàng 980px có card "Shop tạo đơn" với dropdown chọn shop, fix scroll ngang. (3) Fix: row divider hiện đúng trên màn hình HiDPI (thay `height:1` bằng `borderBottom` trên row div) — 5 trang danh sách (Agencies, Orders, Reconciliation, Pricing, Shops). | trannlb |
| v0.11.0 | 2026-04-22 | Agency Admin: Đối soát NVC — Sprint 1: menu "Đối soát NVC" (thứ tự Shop→Đơn hàng→Thiết lập NVC→Đối soát NVC), trang 5 tabs (Phiên nhà vận chuyển / Phiên shop / Chuyển khoản / Dự trù / Tách phiên NVC), mock data carrier-reconciliation.json. Sprint 2: Tab Phiên nhà vận chuyển full — stats cards, filter, custom flex table (Số lệch đỏ nếu > 0, Tổng cước, Tổng COD), upload modal drag-drop zone (.xlsx/.xls/.csv) tạo phiên pending, navigate đến detail page placeholder. | trannlb |
| v0.12.0 | 2026-04-23 | Agency Admin: Đối soát NVC Sprint 3 — (1) Multi-select confirm: checkbox column (chỉ enable pending), select-all header, bulk action bar "Xác nhận phiên đã chọn", row highlight #FFF4ED khi chọn. (2) Detail page đầy đủ: breadcrumb, 4 summary cards, filter MATCH/MISMATCH/NOT_FOUND, custom flex table highlight đỏ ô COD/phí lệch, badges Khớp/Lệch/Không tìm thấy. (3) Action buttons pending: "Xoá phiên" + "Xác nhận phiên" với confirm modal, navigate back cập nhật list qua location.state. | trannlb |
| v0.13.0 | 2026-04-23 | Agency Admin — Thiết lập NVC cải tiến: (1) ShopDetail thêm Card "Cấu hình dịch vụ" read-only (Dịch vụ / Mã NVC / Bảng giá áp dụng). (2) Tab Kết nối NVC: expand/collapse từng Shop ID xem danh sách gói cước GHN (TMĐT/CPTT), mock data goiCuoc cho 5 shop. (3) Tạo gói dịch vụ mới: thay dropdown đơn bằng multi-shop connections — mỗi shop chọn 1-2 gói cước GHN bằng checkbox, nút Thêm/Xoá Shop ID. (4) ServiceDetail: đồng bộ logic multi-shop + gói cước ở cả view và edit mode. (5) URL-based tab routing cho CarrierSetup (`/carrier-setup/connect`, `/carrier-setup/services`, `/carrier-setup/pricing`) — back từ ServiceDetail về đúng tab Dịch vụ. | trannlb |
| v0.14.0 | 2026-04-23 | Agency Admin — Thiết lập NVC tiếp: (1) Tab Dịch vụ + Bảng giá thêm title + search bar đồng nhất với tab Kết nối NVC. (2) Tab Dịch vụ bỏ cột Mã NVC; cột Shop ID GHN: 1 shop hiển thị trực tiếp, nhiều shop hiển thị "n Shop ID GHN" text xám + hover tooltip danh sách. (3) Fix divider HiDPI cho TabServices và TabPricing (borderBottom thay height:1). (4) services.json đổi ghnShopId → ghnShopIds array. | trannlb |
| v0.15.0 | 2026-04-23 | Tab Kết nối NVC: thêm cột "Gói cước GHN", đổi tên cột "Cửa hàng GHN", tất cả shops có tối thiểu 1 gói cước. Tab Dịch vụ: đổi tên cột "Dịch vụ" + "Gói cước GHN", cell hiển thị tên nếu 1 / "n gói cước" + hover nếu ≥2. ShopCreate + ShopDetail: bỏ cột Mã NVC khỏi section Cấu hình dịch vụ. | trannlb |
| v0.16.0 | 2026-04-24 | Agency Admin — CarrierSetup refactor: (1) AddShopModal 2-step (form → OTP verify), search + danh sách Shop ID GHN, mỗi shop expand/collapse xem gói cước. (2) CreateServiceModal hỗ trợ multi-shop connections, mỗi shop chọn 1-2 gói cước checkbox, inline validation. (3) Fix vite.config: xoá Tailwind CSS plugin (vi phạm inline-styles rule). | trannlb |
| v0.17.0 | 2026-04-24 | Settings pages cho 3 platform: (1) Super Admin: Settings menu, 3 sub-pages (Account Info, User Management, Permissions). (2) Agency Admin: Settings menu, 3 sub-pages (Account Info, User Management, Permissions). (3) Shop: Settings menu, 2 sub-pages (Account Info, Shop Settings/Pricing). Thêm routes `/settings`, `/settings/account`, `/settings/users`, `/settings/permissions` cho từng platform. | trannlb |
| v0.17.1 | 2026-04-24 | Hotfix: remove unused DollarOutlined import in ShopLayout (TS6133 build error). | trannlb |
| v0.18.0 | 2026-04-24 | Table scroll pattern standardization — 3-level nested flex container (outer `overflow: hidden`, middle `overflowY/X: auto`, inner `minWidth`) cho tất cả 5 trang danh sách (Super Admin: Agencies, Agency Admin: Shops + Orders + AgencyReconciliation 2 tabs, Web Shop: Pricing + Orders). Fix column alignment, minWidth cho các flex columns (TCell component). Horizontal scroll nằm trong table, không ảnh hưởng page scroll. | trannlb |
| v0.19.0 | 2026-04-28 | Sprint 7 — Lịch chuyển khoản COD + Tài khoản ngân hàng: (1) Web Shop Đối soát: section "Lịch nhận COD" trên stat cards + modal đổi lịch 12 options. (2) Web Shop Cài đặt: sub-menu "Tài khoản ngân hàng" — danh sách, form thêm mới, modal chỉnh sửa 2 bước OTP. (3) Agency Admin ShopDetail: tab bar 3 tab (Thông tin cơ bản / Lịch chuyển khoản / Tài khoản ngân hàng) + 3 KPI cards (Đơn hàng / Tổng COD / Doanh thu). (4) Mock data: codSchedule 15 shops + bank-accounts.json. (5) Version badge v0.19.0 dưới nút Đăng xuất ở cả 3 platform. | trannlb |
| v0.20.0 | 2026-05-06 | Rebrand NVC→GHN toàn bộ 3 platform, CarrierSetup bỏ popup tạo dịch vụ, PricingCreate surcharge 4 loại phí per tuyến | trannlb |
| v0.21.0 | 2026-05-06 | Order Drawer: Fee Sections (Phí vận chuyển + Phụ phí 4 dòng + Tổng thu), toggle Shop/Khách trả ship, filter dịch vụ không có bảng giá. ServiceDetail header cleanup + tab bar fix. | trannlb |
| v0.22.0 | 2026-05-06 | CarrierSetup & PricingCreate UX Cleanup: Liên tỉnh luôn mở phạm vi áp dụng, wording "Vượt cân", bỏ cột Gói cước GHN + expand, ServiceDetail bỏ Huỷ + fix wording + mock data 5 shops đủ Hàng nhẹ/nặng, order drawer ẩn "Gửi hàng tại bưu cục" | trannlb |
| v0.23.0 | 2026-05-06 | PricingCreate: 6 route types + ZoneGuideModal + phụ phí giao lại/hoàn hàng + bulk apply đồng giá | trannlb |
| v0.23.1 | 2026-05-07 | Cập nhật định nghĩa tuyến ZoneGuideModal: Nội Vùng (3 TP lớn & vùng tương ứng), Nội Vùng Tỉnh (2 tỉnh cùng miền), Liên Vùng (3 TP lớn & các vùng chéo) | trannlb |
| v0.23.2 | 2026-05-07 | UX: ServiceDetail chip dịch vụ thêm circle indicator + dashed border; PricingCreate vượt cân segmented control đến/trở lên | trannlb |
| v0.24.0 | 2026-05-11 | (1) Web Shop & Agency Admin / Đơn hàng: cập nhật 8 tabs trạng thái đơn hàng (Đơn nháp, Chờ bàn giao, Đã bàn giao - Đang giao, Đã bàn giao - Đang hoàn hàng, Chờ xác nhận giao lại, Hoàn tất, Đơn huỷ, Hàng thất lạc - hư hỏng); hỗ trợ scroll ngang tab bar. (2) Agency Admin / Công cụ — Kiểm tra tuyến: thêm section CÔNG CỤ vào sidebar; trang tra cứu tuyến giao hàng với 63 tỉnh thành + quận huyện đầy đủ, xác định 1 trong 6 tuyến (Nội Tỉnh / Nội Vùng / Nội Vùng Tỉnh / Liên Vùng Đặc Biệt / Liên Vùng / Liên Vùng Tỉnh), badge hiển thị vùng, nút hoán đổi chiều, bảng phân vùng tham khảo; cập nhật zone Quảng Ngãi → Vùng 1 | trannlb |

---

## Tính năng đã có (v0.1.0 — baseline)

### Super Admin
- [x] Login page
- [x] Dashboard (stats tổng quan)
- [x] Danh sách đại lý (`/super-admin/agencies`)
- [x] Tạo đại lý (`/super-admin/agencies/create`)
- [x] Chi tiết đại lý (`/super-admin/agencies/:id`)
- [x] Thiết lập nhà vận chuyển (`/super-admin/carrier-setup`)
- [x] Settings (`/super-admin/settings`)

### Agency Admin
- [x] Login page
- [x] Dashboard
- [x] Danh sách shop (`/agency-admin/shops`)
- [x] Tạo shop (`/agency-admin/shops/create`)
- [x] Chi tiết shop (`/agency-admin/shops/:id`)
- [x] Danh sách đơn hàng (`/agency-admin/orders`)
- [x] Thiết lập nhà vận chuyển (`/agency-admin/carrier-setup`)
- [x] Tạo bảng giá (`/agency-admin/carrier-setup/pricing/create`)
- [x] Đối soát NVC (`/agency-admin/carrier-reconciliation`)
- [x] Settings (`/agency-admin/settings`)

### Web Shop
- [x] Login page
- [x] Danh sách đơn hàng (`/shop/orders`)
- [x] Bảng giá (`/shop/pricing`)
- [x] Đối soát (`/shop/reconciliation`)
- [x] Hỗ trợ (`/shop/support`)
- [x] Settings (`/shop/settings`)

---

## Checklist trước khi deploy

- [ ] `npm run build` pass không lỗi
- [ ] `npm run lint` không có warning nghiêm trọng
- [ ] Test trên Chrome + Safari
- [ ] Test 3 platform login flow
- [ ] Kiểm tra mock data hiển thị đúng
- [ ] Review PENDING list — confirm đủ tính năng muốn ship
- [ ] Cập nhật version badge ở 3 file layout
