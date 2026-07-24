---
docType: SRS
id: SRS-AGA-RECON-SHOP-SPLIT
platform: agency-admin, shop
section: Đối soát & Chuyển khoản
relatedStories: [AGA-RECON-1, AGA-RECON-3]
status: draft
version: 1.0
---

# SRS — Tách phiên shop từ phiên đối soát GHN (Agency Admin)

## 1. Giới thiệu

### 1.1 Mục đích

Tài liệu này đặc tả yêu cầu phần mềm cho chức năng **tự động tách phiên đối soát GHN (phiên NVC) thành các phiên đối soát riêng theo từng shop** ("phiên shop"), phục vụ việc đại lý thanh toán COD lại cho từng shop sau khi đã nhận tiền từ nhà vận chuyển (GHN/247Express).

### 1.2 Phạm vi

- **Trong phạm vi:** logic tách phiên shop (`deriveShopSessions()`), hiển thị danh sách + chi tiết phiên shop ở Agency Admin, hiển thị phiên đối soát tương ứng ở Web Shop.
- **Ngoài phạm vi:** luồng xác nhận thanh toán/chuyển khoản thực tế giữa đại lý và shop (chưa implement — xem mục 8.1), tích hợp API GHN thật (hiện là upload file thủ công, không parse nội dung).

### 1.3 Định nghĩa, từ viết tắt

| Thuật ngữ | Ý nghĩa |
|---|---|
| Phiên NVC / Phiên GHN | Phiên đối soát giữa đại lý và nhà vận chuyển (GHN hoặc 247Express), tạo ra khi upload file đối soát. Kiểu dữ liệu `CarrierSession`. |
| Phiên shop | Phiên đối soát COD giữa đại lý và 1 shop cụ thể, **được suy ra (derive)**, không lưu trữ độc lập. Kiểu dữ liệu `ShopSession`. |
| Item / dòng đối soát | 1 dòng ứng với 1 đơn hàng trong phiên NVC. Kiểu dữ liệu `ItemRecord`. |
| COD | Cash On Delivery — tiền thu hộ khi giao hàng. |
| MATCH / MISMATCH / NOT_FOUND | Trạng thái so khớp giữa dữ liệu GHN gửi về và dữ liệu hệ thống đại lý, ở cấp độ từng đơn hàng. |

### 1.4 Tài liệu tham chiếu

- [tao-phien-doi-soat-ghn.md](./tao-phien-doi-soat-ghn.md) — tạo phiên NVC
- [xac-nhan-phien-tach-phien-shop.md](./xac-nhan-phien-tach-phien-shop.md) — user story xác nhận phiên + tách phiên shop
- [phien-shop.md](./phien-shop.md) — hướng dẫn sử dụng tab Phiên shop

---

## 2. Mô tả tổng quan

### 2.1 Bối cảnh nghiệp vụ

Một đại lý (agency) quản lý nhiều shop. Khi GHN giao hàng xong cho các đơn của nhiều shop khác nhau, GHN gộp COD của **toàn bộ đại lý** vào 1 lần chuyển khoản, xuất ra 1 file "Biên bản đối soát" duy nhất (1 "Phiên", 1 "Ngày" thanh toán — xem mục 7 về giới hạn dữ liệu ngày). Đại lý cần biết, **trong số tiền GHN vừa chuyển, phần nào là của shop nào** để hoàn trả lại đúng — đó là lý do cần tách "phiên GHN" (1 lần chuyển khoản của GHN) thành nhiều "phiên shop" (phần COD riêng cho từng shop).

### 2.2 Đối tượng sử dụng

| Vai trò | Platform | Quyền |
|---|---|---|
| Agency Admin | Agency Admin | Xem, lọc, xác nhận phiên NVC; xem danh sách + chi tiết phiên shop (chưa xác nhận được — xem gap 8.1) |
| Chủ shop | Web Shop | Chỉ xem phiên đối soát của shop mình, không có quyền xác nhận |

### 2.3 Giả định và ràng buộc

- Đây là prototype dùng mock data JSON tĩnh, không có backend/API thật.
- Không có cơ chế transaction/lock dữ liệu — "tách phiên shop" chạy lại (recompute) mỗi lần trang render, không lưu bảng riêng.
- 1 đại lý (`AGN001`) được hardcode làm agency đang đăng nhập ở Agency Admin; 1 shop (`SHP001`) hardcode làm shop đang đăng nhập ở Web Shop.

---

## 3. Mô hình dữ liệu

```
CarrierSession (phiên NVC)  1 ──── N  ItemRecord (dòng đối soát)
        │                                    │
        │ status === 'confirmed'             │ group by (sessionId, shopId)
        ▼                                    ▼
                  ShopSession (phiên shop) — KHÔNG lưu trữ, chỉ derive runtime
```

### 3.1 `CarrierSession`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `id` | string | VD `GHN001`, `247_001` |
| `agencyId` | string | Agency sở hữu phiên — Agency Admin chỉ hiển thị `agencyId === 'AGN001'` |
| `carrier` | string | `'GHN'` \| `'247Express'` |
| `paymentDate` | string (date) | Ngày GHN thanh toán — **trường ngày duy nhất có căn cứ từ file thật** |
| `periodStart?` / `periodEnd?` | string (date) | Optional — chỉ tồn tại ở data mẫu (seed), **không được set** khi tạo phiên qua upload thật (xem mục 7) |
| `totalOrders`, `totalCOD`, `totalFee`, `totalMismatch` | number | Số tổng hợp toàn phiên, phải khớp với tổng tính từ `ItemRecord` con |
| `status` | `'pending' \| 'confirmed'` | Chỉ phiên `'confirmed'` mới được tách thành phiên shop |

### 3.2 `ItemRecord`

| Field | Kiểu | Ghi chú |
|---|---|---|
| `sessionId` | string | FK → `CarrierSession.id` |
| `orderCode` | string | Mã đơn GHN — dùng để tra ngược `orders.json` (xem mục 4.2) |
| `shopId` | string | **Field tĩnh** gán sẵn, dùng làm fallback nếu không tra được đơn |
| `ghnCOD`, `systemCOD` | number | COD theo GHN báo về / theo hệ thống đại lý |
| `ghnFee`, `systemFee` | number | Phí dịch vụ theo GHN / theo hệ thống đại lý |
| `status` | `'MATCH' \| 'MISMATCH' \| 'NOT_FOUND'` | Kết quả so khớp COD + phí cấp đơn hàng |

### 3.3 `ShopSession` (derived, không lưu)

| Field | Công thức |
|---|---|
| `id` | `` `COD_SHOP_${paymentDate không dấu gạch}${idx 4 số}_${shopId}` `` — **xem cảnh báo mục 6.1: idx không ổn định** |
| `shopId` | `resolveShopId(item)` — xem mục 4.2 |
| `totalOrders` | `groupItems.length` |
| `totalCOD` | `Σ ghnCOD` |
| `feeShop` | `Σ systemFee` |
| `feeGHN` | `Σ ghnFee` |
| `profit` | `feeShop − feeGHN` |
| `totalMismatch` | đếm item có `status !== 'MATCH'` |
| `status` | `'confirmed'` nếu `id ∈ confirmedShopIds`, ngược lại `'pending'` — **`confirmedShopIds` không có setter, luôn rỗng** (gap 8.1) |

---

## 4. Yêu cầu chức năng

### FR-1: Điều kiện kích hoạt tách phiên shop

Chỉ `CarrierSession` có `status === 'confirmed'` mới được đưa vào tách phiên shop. Phiên `'pending'` bị bỏ qua hoàn toàn — không tạo phiên shop nào, kể cả nháp/xem trước.

*Nguồn:* `deriveShopSessions()`, `AgencyReconciliation.tsx:189-191`.

### FR-2: Xác định shop của từng dòng đối soát — `resolveShopId()`

1. Tra `item.orderCode` trong `orders.json`, so khớp với `trackingCode` hoặc `id` của đơn hàng.
2. Nếu tìm thấy → dùng `order.shopId` (nguồn xác thực — đơn hàng thật thuộc shop nào).
3. Nếu không tìm thấy → dùng `item.shopId` (field tĩnh trên dòng đối soát) làm phương án dự phòng.

*Nguồn:* `AgencyReconciliation.tsx:184-190`, dùng lại ở `AgencyReconciliationShopDetail.tsx`.

> ⚠️ **Không đồng nhất giữa platform:** Web Shop (`Reconciliation.tsx: buildShopSessions()`) **không gọi `resolveShopId()`** — chỉ lọc trực tiếp `item.shopId === MY_SHOP_ID`. Xem gap 8.5.

### FR-3: Gom nhóm và sinh phiên shop

- Gom `ItemRecord` (thuộc phiên `confirmed`) theo cặp `(sessionId, shopId đã resolve)`.
- Mỗi nhóm sinh đúng 1 `ShopSession`. Số phiên shop = số cặp `(phiên GHN, shop)` khác nhau — **không phải** 1 phiên GHN = 1 phiên shop, cũng **không phải** 1 đơn = 1 phiên shop.
- Mã phiên: `COD_SHOP_{paymentDate}{idx 4 số}_{shopId}`, `idx` tăng dần theo thứ tự duyệt nhóm.

### FR-4: Tính số liệu tổng hợp

Xem công thức tại bảng 3.3. Bắt buộc: `Σ feeShop` các phiên shop con của 1 phiên GHN phải bằng `totalFee` của phiên GHN đó (ràng buộc toàn vẹn nội bộ, hiện **không có unit test** kiểm tra tự động).

### FR-5: Hiển thị danh sách phiên shop (Agency Admin — tab "Phiên shop")

- Điều kiện hiển thị: có ít nhất 1 phiên GHN `confirmed`; nếu không → trạng thái rỗng "Phiên shop được tạo tự động sau khi xác nhận phiên GHN".
- Cột: Mã phiên shop, Tên shop, Phiên GHN nguồn, Thời gian, Số đơn, Tổng COD, Tổng phí DV (shop), Tổng phí DV (GHN), Lợi nhuận ĐL (`feeShop − feeGHN`, xanh nếu dương/đỏ nếu âm), Trạng thái.
- Bộ lọc: Trạng thái (Tất cả/Chưa chuyển khoản/Đã chuyển khoản), Shop, Ngày trong kỳ. Có nút **"Xoá lọc"**, chỉ hiện khi có ≥1 filter đang áp dụng.
- 3 thẻ thống kê nhanh: Tổng phiên shop, Đã chuyển khoản, Chưa chuyển khoản.
- Cột "Số lệch" (`totalMismatch`) được tính sẵn nhưng **không render** trong bảng (gap 8.4).

### FR-6: Chi tiết phiên shop (Agency Admin)

Trang `AgencyReconciliationShopDetail.tsx` — lọc đơn thuộc phiên shop bằng `resolveShopId(item) === session.shopId` (cùng logic FR-2, đảm bảo nhất quán với danh sách). Hiển thị 4 thẻ tổng hợp (Số đơn, Tổng COD, Tổng phí DV, Nhận về) + bảng chi tiết từng đơn (COD, các loại phí theo trạng thái GHN).

### FR-7: Liên thông Web Shop

Sau khi Agency Admin xác nhận phiên GHN, shop tương ứng thấy ngay phiên đối soát của mình ở trang "Đối soát" (Web Shop), trạng thái "Chờ thanh toán", cùng cơ chế tính runtime (nhưng dùng hàm derive riêng — xem gap 8.5).

### FR-8: Xác nhận phiên shop *(GAP — chưa hoạt động, đặc tả cho tương lai)*

Mong muốn nghiệp vụ: đại lý tick chọn 1 hoặc nhiều phiên shop "Chưa chuyển khoản" → bấm "Xác nhận phiên đã chọn" → phiên chuyển "Đã chuyển khoản", nghĩa là đại lý đã thanh toán COD cho shop. **Chưa có code nào triển khai** — xem gap 8.1.

---

## 5. Yêu cầu phi chức năng

| Loại | Yêu cầu |
|---|---|
| Hiệu năng | Tách phiên shop chạy lại mỗi lần render — với data mẫu hiện tại (32 item) không đáng kể; cần đánh giá lại nếu số lượng đơn thật lên hàng chục nghìn (nên cân nhắc memoize hoặc tính sẵn khi xác nhận phiên GHN thay vì derive runtime). |
| Toàn vẹn dữ liệu | Mã phiên shop phải là định danh ổn định để dùng làm khoá tra cứu/xác nhận — **hiện KHÔNG đảm bảo** (xem gap 8.2, nghiêm trọng). |
| Nhất quán đa nền tảng | Cùng 1 phiên shop phải hiển thị cùng số liệu (COD, phí, trạng thái) dù xem từ Agency Admin hay Web Shop. |
| Khả năng kiểm thử | Không có test tự động cho `deriveShopSessions()`/`resolveShopId()`/`buildShopSessions()`. |

---

## 6. Use case minh hoạ (dữ liệu thật trong hệ thống)

**Đầu vào:** phiên GHN `GHN001` (`COD_202403150001_4872823`, `paymentDate: 2024-03-15`, `confirmed`), có 6 dòng đối soát thuộc 3 shop khác nhau (`SHP001`, `SHP003`, `SHP004`).

**Kết quả tách:** đúng 3 phiên shop, mỗi phiên gộp 2 dòng của cùng 1 shop:

| Mã phiên shop | Shop | Số đơn | Tổng COD | Tổng phí GHN |
|---|---|---|---|---|
| `COD_SHOP_202403150001_SHP001` | Shop Thời Trang Minh Anh | 2 | 250.000 | 50.000 |
| `COD_SHOP_202403150002_SHP003` | Mỹ Phẩm Hương Thơm | 2 | 180.000 | 45.000 |
| `COD_SHOP_202403150003_SHP004` | Giày Dép Thiên Phú | 2 | 620.000 | 65.000 |

### 6.1 ⚠️ Minh chứng bug: mã phiên shop KHÔNG ổn định giữa 2 platform

Cùng 1 cặp `(GHN007, SHP001)`, chạy 2 hàm derive độc lập trên **cùng 1 bộ data hiện tại** cho ra 2 mã khác nhau:

| Platform | Hàm | Mã sinh ra |
|---|---|---|
| Agency Admin | `deriveShopSessions()` | `COD_SHOP_202404090020_SHP001` |
| Web Shop | `buildShopSessions()` | `COD_SHOP_202404090004_SHP001` |

**Nguyên nhân:** mỗi hàm dùng biến đếm `idx` cục bộ, bắt đầu từ 1 và tăng theo thứ tự duyệt `Map` của riêng nó — Agency Admin duyệt toàn bộ shop của toàn bộ đại lý (idx lớn dần theo nhiều shop), Web Shop chỉ duyệt các phiên có `SHP001` (idx nhỏ vì ít phần tử hơn). **Hệ quả:** không thể dùng mã phiên shop làm khoá tra cứu xuyên platform (VD: đại lý xác nhận phiên `COD_SHOP_...020...`, nhưng shop nhìn thấy mã `...004...` cho đúng phiên đó — không thể đối chiếu qua điện thoại/support).

---

## 7. Giới hạn dữ liệu ngày (đã xác minh với file GHN thật)

File "Biên bản đối soát" thật từ GHN (`GHN_Phien_Chuyen_Tien_...xlsx`) chỉ có **1 dòng "Ngày"** duy nhất ở phần header (VD `02/06/2026`) — không có khái niệm "kỳ"/khoảng ngày. Mỗi dòng đơn có "Ngày tạo"/"Ngày giao trả" riêng nhưng bản thân phiên chỉ có 1 mốc.

- 7/11 phiên NVC seed trong `carrier-reconciliation.json` có `periodStart`/`periodEnd` (khoảng nửa tháng) — đây là **dữ liệu giả định của mock, không có căn cứ từ file thật**.
- Khi tạo phiên mới qua `UploadModal` (upload thật), `newSession` **không set** `periodStart`/`periodEnd` (`AgencyReconciliation.tsx:492-509`) — đúng với thực tế file chỉ có 1 ngày.
- Cột "Thời gian" ở bảng Phiên shop hiển thị khoảng ngày chỉ vì kế thừa nguyên `periodStart`/`periodEnd` của phiên GHN cha (nếu có) — không phải giá trị tính riêng cho phiên shop.

---

## 8. Known Issues / Gaps (đã xác nhận qua code, ưu tiên xử lý)

### 8.1 [Cao] Xác nhận phiên shop chưa hoạt động

`confirmedShopIds` (`AgencyReconciliation.tsx:1051`) là `useState<Set<string>>(new Set())` **không có setter** — không có cách nào để `ShopSession.status` chuyển sang `'confirmed'`. Toàn bộ luồng "checkbox + bulk action xác nhận" mô tả trong `phien-shop.md` chưa được nối logic. Cần story riêng.

### 8.2 [Cao] Mã phiên shop không ổn định — không dùng được làm khoá xuyên platform

Xem minh chứng mục 6.1. Đề xuất: mã phiên shop nên sinh từ `(sessionId, shopId)` trực tiếp (VD `COD_SHOP_{sessionId}_{shopId}`) thay vì số thứ tự cục bộ theo lượt duyệt, để đảm bảo cùng 1 cặp luôn ra cùng 1 mã bất kể platform/thời điểm tính.

### 8.3 [Trung bình] Bất nhất `agencyId` trong data mẫu

Chỉ 9/32 đơn trong `orders.json` thực sự thuộc shop của `AGN001` (`SHP001`, `SHP002`); phần còn lại của item tham chiếu shop thuộc agency khác (`SHP003`–`SHP015`). Chấp nhận có chủ đích để không làm nghèo dữ liệu demo — cần sửa nếu dùng để kiểm thử logic multi-tenant.

### 8.4 [Thấp] Cột "Số lệch" không hiển thị

`totalMismatch` đã tính sẵn trong `ShopSession` nhưng không render ở bảng `TabShop` (Agency Admin). Cần bổ sung cột hoặc xác nhận với BA đây có phải cố ý ẩn.

### 8.5 [Trung bình] Web Shop không dùng `resolveShopId()`

`buildShopSessions()` (`shop/pages/Reconciliation.tsx:77-117`) lọc trực tiếp `item.shopId === MY_SHOP_ID`, bỏ qua bước tra `orders.json`. Nếu tương lai dữ liệu thật có trường hợp `item.shopId` sai nhưng `orderCode` tra ra đúng shop, Web Shop sẽ hiển thị SAI trong khi Agency Admin hiển thị ĐÚNG — hai platform lệch nhau về cùng 1 đơn hàng.

---

## 9. Ma trận truy vết (Requirement → Code)

| Yêu cầu | File | Vị trí |
|---|---|---|
| FR-1, FR-2, FR-3, FR-4 | `AgencyReconciliation.tsx` | `resolveShopId()` dòng 184-190, `deriveShopSessions()` dòng 192-240 |
| FR-5 | `AgencyReconciliation.tsx` | `TabShop()` dòng 795+ |
| FR-6 | `AgencyReconciliationShopDetail.tsx` | toàn file |
| FR-7, gap 8.5 | `shop/pages/Reconciliation.tsx` | `buildShopSessions()` dòng 77-117 |
| Data nguồn | `src/mock-data/carrier-reconciliation.json`, `carrier-reconciliation-items.json`, `orders.json`, `shops.json` | — |
