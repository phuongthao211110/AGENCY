---
id: SHOP-ORDER-5
jiraKey: 
platform: shop
section: Quản lý đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Danh sách đơn hàng: Thêm phân loại hàng

## User Story

Là Shop, tôi muốn nhìn thấy ngay **đơn nào là Hàng hoá, đơn nào là Thư/bưu phẩm** trong danh sách đơn hàng — không cần mở từng đơn mới biết — để dễ rà soát và xử lý đúng loại đơn.

## User Flow

1. Shop vào menu "Đơn hàng"
2. Ngay bên phải mã đơn (ở cột "Mã đơn hàng"), mỗi dòng hiện thêm 1 tag nhỏ: **"Hàng hoá"** hoặc **"Thư"**
3. Shop lướt danh sách là phân biệt được ngay, không cần bấm mở chi tiết đơn
4. Áp dụng ở mọi tab trạng thái đơn hàng (Chờ xử lý, Đơn nháp, Chờ bàn giao, Hoàn tất...) — không phải chỉ 1 tab

## System Flow

**Vị trí:** Tag nằm **chung trong ô "Mã đơn hàng"**, ngay cạnh mã vận đơn — **không phải cột riêng**.

1. `Orders.tsx` (Web Shop) → `TRow`: thêm tag ngay sau `order.trackingCode`, cùng 1 ô, đọc field có sẵn `order.sendKind`
2. Nới cột "Mã đơn hàng" từ 140px → 180px để đủ chỗ cho mã đơn + tag
3. Quy tắc hiển thị: `sendKind === 'letter'` → tag **"Thư"** (nền tím `#EDE9FE`, chữ `#7C3AED`); ngược lại → tag **"Hàng hoá"** (nền xám `#F3F4F6`, chữ `#4B5563`)
4. `THead`/`TRow` dùng chung cho mọi tab trạng thái → sửa 1 chỗ, áp dụng toàn bộ danh sách, không cần lặp lại cho từng tab

## Acceptance Criteria

**AC1:** Mỗi dòng đơn có tag "Hàng hoá" hoặc "Thư" nằm **cùng ô với mã đơn hàng** — bảng **không có** cột header "Loại đơn" tách riêng.

**AC2:** `sendKind = 'letter'` → hiện tag "Thư" (tím). `sendKind = 'goods'` (hoặc giá trị khác) → hiện tag "Hàng hoá" (xám).

**AC3:** Tag hiện đúng ở toàn bộ 9 tab trạng thái: Chờ xử lý, Đơn nháp, Chờ bàn giao, Đã bàn giao - Đang giao, Đã bàn giao - Đang hoàn hàng, Chờ xác nhận giao lại, Hoàn tất, Đơn huỷ, Hàng thất lạc - hư hỏng.

**AC4:** Các cột còn lại (Khách hàng, Sản phẩm, Khối lượng, COD, Phí ship, GTB - TT, Người tạo) không đổi vị trí, không đổi nội dung.

## Notes

- Tương ứng với "Loại đơn" đã có ở Agency Admin (`AGA-CARRIER-12`/`13`/`14`) — **cùng field `sendKind`, cùng bảng màu tag**, chỉ khác cách đặt: bên Web Shop gộp vào ô mã đơn, bên Agency Admin (`AgencyOrders.tsx`) vẫn để cột riêng "Loại đơn". Đây là khác biệt có chủ đích giữa 2 màn hình, không phải thiếu đồng bộ.
