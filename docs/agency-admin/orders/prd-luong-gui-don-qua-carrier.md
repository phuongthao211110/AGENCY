---
docType: PRD
id: PRD-AGA-ORDERS-CARRIER-RELAY
platform: agency-admin, shop
section: Đơn hàng
status: draft
version: 0.2
createdAt: 2026-07-17
---

# PRD — Luồng gửi đơn 247Express qua trung gian đại lý

> Trạng thái: **Draft** — chưa được duyệt, chưa code.
> v0.2: viết lại toàn bộ sau khi xác nhận với user — tính năng **chỉ áp dụng cho luồng 247Express (Tạo thư/bưu phẩm/bưu kiện)**, luồng GHN (Tạo đơn hàng) **giữ nguyên không đổi**. Xem [[project-order-flow-ghn-vs-247]] trong memory.
> 1 điểm còn cần xác nhận lại với user — xem mục 7, Q3.

---

## 1. Bối cảnh & vấn đề

### 1.1 Phát hiện quan trọng: hệ thống đã có sẵn 2 luồng tạo đơn tách biệt theo carrier

Đã xác minh trực tiếp trong code (`src/platforms/shop/pages/Orders.tsx`) — đây **không phải giả định**, mà là cấu trúc data model đã tồn tại từ trước:

| Luồng | Component | Filter carrier | Carrier thực tế |
|---|---|---|---|
| **"Tạo đơn hàng"** (hàng hoá) | `CreateOrderDrawer` | `s.shopConnectionIds.includes(shopConnectionId)` | **Chỉ GHN** — 247Express services luôn có `shopConnectionIds: []` (rỗng, dùng `hubIds` thay), không bao giờ match filter này |
| **"Tạo thư, bưu phẩm, bưu kiện"** (`CreateLetterDrawer`, dòng 1119) | dùng `pricing-letter-247.json` | — | **Chỉ 247Express**, tính đúng công thức hợp đồng dịch vụ "Chuyển phát nhanh" |

→ **Kết luận:** không cần tạo cơ chế phân loại "hàng hoá vs thư" mới — nó đã tồn tại sẵn ở tầng UI (2 nút tạo đơn khác nhau trong menu "+ Tạo đơn hàng"). Việc còn thiếu chỉ là: (a) bước kiểm soát của đại lý chèn vào **riêng luồng 247Express**, và (b) cả 2 luồng hiện **chưa persist dữ liệu thật** vào `orders.json`.

### 1.2 Hiện trạng luồng 247Express (phạm vi PRD này)

- Shop tạo "thư/bưu phẩm/bưu kiện" qua `CreateLetterDrawer` → bấm "Tạo đơn" → **không ghi gì vào `orders.json`** (chỉ đóng drawer, mock UI thuần).
- Không có field nào trên `Order` biểu thị "đã gửi sang 247Express chưa", "carrier nào xử lý", hoặc bước duyệt nào của đại lý.
- Carrier đã ẩn khỏi Web Shop theo thiết kế (đúng ý muốn của user), nhưng hiện KHÔNG có điểm kiểm soát nào từ đại lý — vì đơn không thực sự tồn tại (không persist) nên không có gì để đại lý "xử lý".

### 1.3 Luồng GHN — KHÔNG thuộc phạm vi PRD này

`CreateOrderDrawer` ("Tạo đơn hàng") **giữ nguyên hoàn toàn** — không thêm bước trung gian, không đổi trạng thái, shop vẫn tương tác như hiện tại. (Việc `CreateOrderDrawer` cũng chưa persist dữ liệu thật là vấn đề đã biết từ trước, không phải phạm vi mở rộng của PRD này — xem mục 7, Q4.)

### 1.4 Vấn đề kinh doanh

Chủ đại lý muốn **kiểm soát hoàn toàn** việc đơn "thư/bưu phẩm/bưu kiện" được gửi sang 247Express khi nào. Lý do:

1. **Đại lý là bên ký hợp đồng với 247Express** (`ClientHubID`, hợp đồng 1231/2026/HĐDV-247) — shop không có quan hệ hợp đồng trực tiếp, nên shop tự gửi thẳng là không đúng vận hành/pháp lý.
2. **Kiểm soát chất lượng:** đại lý muốn xem lại đơn (địa chỉ, cân nặng, nội dung) trước khi đơn được đẩy sang 247Express.
3. **Shop tuyệt đối không biết carrier** — nguyên tắc thiết kế đã có từ trước, PRD này chỉ hiện thực hoá nó thành 1 bước kiểm soát thật, thay vì chỉ ẩn UI.

### 1.5 Phạm vi thay đổi tổng quát

```
[Trước, luồng 247] Shop tạo thư/bưu phẩm/bưu kiện → không persist gì cả (mock UI)
[Sau,   luồng 247] Shop tạo thư/bưu phẩm/bưu kiện → đơn lưu thật, trạng thái "Chờ đại lý xử lý"
                    → Đại lý xem xét → Đại lý bấm "Gửi qua 247Express" → đơn chuyển "Đã gửi 247Express"

[Luồng GHN — không đổi] Shop tạo đơn hàng → như hiện tại, không có bước đại lý can thiệp
```

---

## 2. Mục tiêu

### 2.1 Luồng mới mong muốn (chỉ áp dụng đơn thư/bưu phẩm/bưu kiện)

```
[Web Shop] Shop tạo "Thư / Bưu phẩm / Bưu kiện" qua CreateLetterDrawer → bấm "Tạo đơn"
                ↓
       Đơn được LƯU THẬT vào orders.json, gắn cờ:
       sendKind = 'letter'          (phân loại: đơn từ CreateLetterDrawer)
       dispatchStatus = 'pending_agency'
       carrierCode = null           (shop không biết, chưa gán)
                ↓
[Agency Admin] Đại lý thấy đơn "thư/bưu phẩm/bưu kiện" mới trong danh sách chờ xử lý
               Đại lý xem xét thông tin đơn
               Đại lý bấm "Gửi qua 247Express" (không cần chọn carrier — chỉ có 1 lựa chọn;
               không cần chọn giữa 3 dịch vụ 247Express — luôn dùng "Chuyển phát nhanh", khớp
               công thức đã implement trong CreateLetterDrawer)
                ↓
       dispatchStatus = 'dispatched'
       carrierCode = '247EXPRESS'
       dispatchedAt, dispatchedBy được ghi lại
                ↓
[Web Shop] Shop thấy đơn chuyển trạng thái giao hàng bình thường — không hiển thị carrier
```

**Đơn "Tạo đơn hàng" (hàng hoá, GHN) không đi qua luồng này** — vẫn dùng `dispatchStatus` mặc định coi như đã "dispatched" ngay khi tạo (xem mục 4.3), để không phá vỡ hành vi hiện tại.

### 2.2 Kết quả kỳ vọng

| Mục tiêu | Đo lường |
|---|---|
| 100% đơn thư/bưu phẩm/bưu kiện phải qua đại lý mới đến 247Express | Không có đơn `sendKind = 'letter'` nào có `carrierCode` được gán nếu đại lý chưa chủ động bấm gửi |
| Luồng GHN (hàng hoá) không bị ảnh hưởng | `CreateOrderDrawer`, `AgencyOrders.tsx` phần hiển thị đơn GHN không đổi hành vi |
| Shop vẫn không biết carrier | Giao diện Web Shop không hiển thị "247Express" ở bất kỳ đâu |
| Đại lý không phải xử lý phức tạp bảng giá 247 khi gửi | Nút "Gửi qua 247Express" không mở màn hình chọn dịch vụ/bảng giá 247 (xem Q3, cần xác nhận) |

---

## 3. Phạm vi ảnh hưởng đa nền tảng

### 3.1 Web Shop

| Màn hình | Thay đổi |
|---|---|
| `CreateLetterDrawer` | Bấm "Tạo đơn" phải **persist thật** vào `orders.json` với `sendKind: 'letter'`, `dispatchStatus: 'pending_agency'`, `carrierCode: null` |
| `CreateOrderDrawer` | Cũng cần persist thật (Q4), nhưng gán `sendKind: 'goods'`, `dispatchStatus: 'dispatched'`, `carrierCode: 'GHN'` ngay khi tạo — **không** đi qua bước chờ đại lý |
| Danh sách đơn hàng | Đơn thư/bưu phẩm/bưu kiện đang `pending_agency` hiển thị nhãn "Chờ xử lý" — không dùng nhãn trạng thái giao hàng thông thường, không hé lộ carrier |
| Huỷ đơn | Shop được huỷ đơn thư khi còn `pending_agency` (trước khi đại lý gửi) |

### 3.2 Agency Admin

| Màn hình / Tính năng | Thay đổi |
|---|---|
| `AgencyOrders.tsx` | Thêm filter/tab riêng cho đơn `sendKind: 'letter'` + `dispatchStatus: 'pending_agency'` — đơn GHN (`sendKind: 'goods'`) không xuất hiện ở đây vì luôn đã `dispatched` |
| Hành động trên đơn | Nút "Gửi qua 247Express" — **không cần modal chọn carrier** (chỉ 1 lựa chọn), **không cần chọn dịch vụ 247** trong 3 dịch vụ đã cấu hình ở `PricingCreate247.tsx` (dùng cố định "Chuyển phát nhanh", khớp `pricing-letter-247.json`) — xem Q3 cần xác nhận thêm |
| Bulk action | Không làm trong v1 — deferred (Q2) |

### 3.3 Super Admin

Không thay đổi trong phạm vi PRD này (Out of Scope — xem mục 8).

---

## 4. Thay đổi data model đề xuất

### 4.1 Nguyên tắc thiết kế

`status` (trạng thái giao hàng vật lý) **giữ nguyên ý nghĩa** — không đổi. Thêm 3 field mới, áp dụng cho **mọi** đơn (goods lẫn letter) nhưng chỉ đơn `letter` mới thực sự trải qua trạng thái `pending_agency`:

| Field | Mô tả | Giá trị |
|---|---|---|
| `sendKind` (MỚI) | Đơn tạo từ drawer nào — quyết định carrier mặc định | `'goods'` (từ `CreateOrderDrawer`) \| `'letter'` (từ `CreateLetterDrawer`) |
| `dispatchStatus` (MỚI) | Đại lý đã gửi đơn sang carrier chưa | `'pending_agency'` \| `'dispatched'` |
| `carrierCode` (MỚI) | Carrier xử lý đơn — ẩn khỏi Web Shop | `'GHN'` \| `'247EXPRESS'` \| `null` |
| `dispatchedAt?` / `dispatchedBy?` (MỚI) | Audit — thời điểm & ai gửi | ISO timestamp / userId đại lý |

### 4.2 Quy tắc gán theo `sendKind`

```typescript
// Khi shop tạo đơn qua CreateOrderDrawer ("Tạo đơn hàng"):
sendKind: 'goods'
dispatchStatus: 'dispatched'     // luôn dispatched ngay — luồng GHN không đổi
carrierCode: 'GHN'
dispatchedAt: <thời điểm tạo>
dispatchedBy: null               // tự động, không phải hành động thủ công của đại lý

// Khi shop tạo đơn qua CreateLetterDrawer ("Tạo thư/bưu phẩm/bưu kiện"):
sendKind: 'letter'
dispatchStatus: 'pending_agency' // chờ đại lý
carrierCode: null
dispatchedAt: null
dispatchedBy: null

// Khi đại lý bấm "Gửi qua 247Express" cho 1 đơn letter đang pending_agency:
dispatchStatus: 'dispatched'
carrierCode: '247EXPRESS'
dispatchedAt: <thời điểm bấm>
dispatchedBy: <userId đại lý>
```

### 4.3 Giá trị mặc định cho dữ liệu hiện có (migration)

Toàn bộ đơn hiện có trong `orders.json` (32 đơn, đều tạo qua flow cũ không phân loại) được gán:

```json
{ "sendKind": "goods", "dispatchStatus": "dispatched", "carrierCode": "GHN" }
```

(Không có đơn `letter` nào trong data hiện tại vì `CreateLetterDrawer` trước giờ chưa persist gì.)

### 4.4 Trạng thái tab "Đơn nháp" ở Web Shop — không đổi (theo Q8)

Theo quyết định của user: **giữ nguyên luồng GHN**. Tab "Đơn nháp" (lọc `status === 'pending'`, `Orders.tsx:2630`) không đổi cách hoạt động cho đơn `sendKind: 'goods'`. Chỉ đơn `sendKind: 'letter'` mới cần 1 cách hiển thị riêng ở trạng thái `pending_agency` — xem mục 3.1 ("Chờ xử lý"), không tái sử dụng tab "Đơn nháp" hiện tại để tránh nhầm với đơn GHN.

---

## 5. User Story, User Flow & System Flow

### 5.1 User Story — Shop tạo thư/bưu phẩm/bưu kiện

```
Là chủ shop / nhân viên shop (Web Shop)
Tôi muốn tạo đơn thư/bưu phẩm/bưu kiện và thấy đơn ở trạng thái "Chờ xử lý"
Để biết đơn đã được ghi nhận, đang chờ đại lý duyệt trước khi chuyển cho 247Express
Tôi KHÔNG cần và KHÔNG được biết carrier nào xử lý đơn của tôi
```

### 5.2 User Story — Đại lý gửi đơn qua 247Express

```
Là Agency Admin (đại lý)
Tôi muốn xem danh sách đơn thư/bưu phẩm/bưu kiện đang chờ xử lý, và bấm "Gửi qua 247Express"
Để kiểm soát hoàn toàn việc đơn nào, khi nào được chuyển sang 247Express —
đơn hàng hoá (GHN) tôi không cần làm gì thêm, vẫn chạy như trước
```

### 5.3 User Flow — Shop

1. Shop vào Web Shop → "Đơn hàng" → menu "+ Tạo đơn hàng" → chọn "Tạo thư, bưu phẩm, bưu kiện"
2. Điền thông tin qua `CreateLetterDrawer` → bấm "Tạo đơn"
3. Đơn được lưu thật, hiển thị trạng thái **"Chờ xử lý"** trong danh sách
4. Shop có thể huỷ đơn trong lúc chờ; không thấy carrier ở bất kỳ đâu
5. Khi đại lý đã gửi 247Express, đơn chuyển sang trạng thái giao hàng bình thường

*(Luồng "Tạo đơn hàng" hàng hoá không đổi — không có bước 3-4 này.)*

### 5.4 User Flow — Đại lý

1. Agency Admin vào "Đơn hàng" → thấy filter/tab riêng cho đơn thư/bưu phẩm/bưu kiện đang chờ
2. Xem xét thông tin đơn (địa chỉ, cân nặng, nội dung)
3. Bấm "Gửi qua 247Express" — không cần chọn carrier (chỉ 1), không cần chọn dịch vụ 247 (cố định "Chuyển phát nhanh" — *cần xác nhận Q3*)
4. Xác nhận → `dispatchStatus = 'dispatched'`, `carrierCode = '247EXPRESS'`, `dispatchedAt`/`dispatchedBy` ghi lại

### 5.5 System Flow

```
[Web Shop] Shop tạo đơn qua CreateLetterDrawer, bấm "Tạo đơn"
    → Ghi Order mới: sendKind='letter', dispatchStatus='pending_agency', carrierCode=null

[Agency Admin] Đại lý bấm "Gửi qua 247Express" cho đơn đã chọn
    → Validate: sendKind === 'letter' && dispatchStatus === 'pending_agency'
    → Ghi: dispatchStatus='dispatched', carrierCode='247EXPRESS', dispatchedAt=now, dispatchedBy=userId
    → (Sản xuất thật: gọi API 247Express GetPriceForCustomerAPI + tạo vận đơn)

[Web Shop] Đơn không còn hiển thị "Chờ xử lý" — chuyển nhãn trạng thái giao hàng thông thường
```

---

## 6. Acceptance Criteria

**AC1:** Khi shop tạo đơn qua `CreateLetterDrawer` và bấm "Tạo đơn", hệ thống phải ghi 1 record mới thật vào `orders.json` với `sendKind='letter'`, `dispatchStatus='pending_agency'`, `carrierCode=null`.

**AC2:** Khi shop tạo đơn qua `CreateOrderDrawer` và bấm "Tạo đơn", hệ thống ghi `sendKind='goods'`, `dispatchStatus='dispatched'`, `carrierCode='GHN'` ngay lập tức — hành vi hiển thị phía shop **không đổi** so với hiện tại.

**AC3:** Web Shop hiển thị nhãn "Chờ xử lý" cho đơn `sendKind='letter'` && `dispatchStatus='pending_agency'` — không hiển thị tên carrier ở bất kỳ trạng thái nào.

**AC4:** Shop được huỷ đơn letter khi còn `pending_agency`. Sau khi `dispatched`, shop không tự huỷ một mình.

**AC5:** Agency Admin có filter/tab riêng hiển thị đúng danh sách đơn `sendKind='letter'` && `dispatchStatus='pending_agency'` — không lẫn đơn `goods`.

**AC6:** Đại lý bấm "Gửi qua 247Express" → hệ thống cập nhật đúng `dispatchStatus='dispatched'`, `carrierCode='247EXPRESS'`, `dispatchedAt`, `dispatchedBy`. Không yêu cầu chọn carrier (auto '247EXPRESS' vì đây là đơn letter) và không yêu cầu chọn dịch vụ 247 (cố định Chuyển phát nhanh — *chờ xác nhận Q3*).

**AC7:** Đại lý không thể gửi đơn đã `dispatched` lần thứ 2 (nút bị disable/ẩn).

**AC8 — Rule cứng, không có ngoại lệ trong v1:** Không cho đổi `carrierCode` sau khi `dispatchStatus='dispatched'` — tránh làm mồ côi dữ liệu đối soát COD (xem [[srs-tach-phien-shop]] mục 10.2 về rủi ro tương tự).

**AC9:** Dữ liệu `orders.json` hiện có (32 đơn) migrate đúng theo mục 4.3 — không có đơn nào bị hiển thị sai trạng thái sau migrate.

**AC10:** Đơn `sendKind='goods'` (GHN) không xuất hiện ở bất kỳ filter/tab "chờ gửi 247Express" nào của Agency Admin.

---

## 7. Câu hỏi mở

### Q2 — Bulk action: làm sau (đã xác nhận)

User: *"Có nhưng làm sau"* — v1 chỉ có nút gửi từng đơn, không cần bulk. Ghi nhận, không cần quyết định gì thêm.

### Q3 — [ĐÃ XÁC NHẬN, PHẠM VI RỘNG HƠN BAN ĐẦU] 247Express dùng thẳng công thức/bảng giá của GHN

User xác nhận rõ (2 lần, sau khi được cảnh báo về xung đột với nguyên tắc "carrier contract fidelity" đã chốt trước đây): **bỏ hẳn cấu trúc 3-dịch-vụ theo hợp đồng riêng của 247Express** (`PricingCreate247.tsx` — Chuyển phát nhanh/Tiết kiệm/Đường bộ) — 247Express dùng thẳng công thức/bảng giá của GHN, không chỉ đổi UI mà đổi cả cách tính giá. Đây là quyết định có chủ đích, đã ghi vào memory `project-order-flow-ghn-vs-247.md`.

> ⚠️ **Đây là thay đổi RỘNG HƠN phạm vi PRD này.** `PricingCreate247.tsx`/`CarrierSetup.tsx` là trang cấu hình bảng giá 247Express **dùng chung cho toàn bộ đại lý** (không riêng luồng "thư/bưu phẩm/bưu kiện" của PRD này) — có lịch sử phát triển riêng theo đúng hợp đồng 1231/2026/HĐDV-247 (xem `project-247express-services.md`). Việc đổi công thức tính giá ở đó là 1 thay đổi khác hẳn về bản chất so với "thêm bước đại lý gửi đơn" (chủ đề chính của PRD này).
>
> **Đề xuất (cần bạn xác nhận):** tách thành 1 PRD/story riêng — "Đơn giản hoá 247Express dùng chung công thức GHN" — vì nó ảnh hưởng `PricingCreate247.tsx`/`CarrierSetup.tsx` độc lập với luồng dispatch đơn hàng. PRD hiện tại (`prd-luong-gui-don-qua-carrier.md`) sẽ giả định: khi đại lý "Gửi qua 247Express" cho 1 đơn thư, hệ thống tính phí theo bảng giá GHN đại lý đã cấu hình (không còn tra `pricing-letter-247.json` riêng nữa) — nhưng việc **sửa trang `PricingCreate247.tsx`/`CarrierSetup.tsx`** để bỏ 3-tab dịch vụ 247 là việc làm riêng, chưa nằm trong AC của PRD này.
>
> **Đã xác nhận: làm cả 2 việc cùng lúc.** Mở rộng AC6 (mục 6) và bổ sung AC11 dưới đây.

**AC11 (mới):** `PricingCreate247.tsx` bỏ selector 3 dịch vụ (nhanh/tiết kiệm/đường bộ) — chỉ còn 1 layout bảng giá duy nhất, cấu trúc/công thức giống `PricingCreate.tsx` (GHN). Khi Agency Admin dispatch 1 đơn letter sang 247Express, phí tính theo bảng giá GHN-style này (qua `priceTableId` của service 247Express, dùng lại `shopFeeFromPriceTable`), không còn tra `pricing-letter-247.json`.

### Q4 — Persist dữ liệu thật (đã xác nhận: CÓ fix)

User: *"Có fix"*. Áp dụng cho **cả 2** drawer (`CreateOrderDrawer` và `CreateLetterDrawer`) — xem mục 4.2, 4.3.

### Q6 — Đại lý từ chối đơn (đã xác nhận: cần, nhưng chưa làm)

User: *"có nhưng chưa làm"* — ghi nhận là tính năng tương lai, không có trong AC của v1 (không thêm trạng thái `rejected` trong bản này).

### Q9 — 100% shop qua đại lý (đã xác nhận, chỉ áp dụng letter)

User: *"100% SHOP ĐỀU QUA ĐẠI LÝ"* — áp dụng cho đơn **letter/247Express**. Đơn goods/GHN không áp dụng (luồng GHN không đổi, vốn đã "qua thẳng" như thiết kế cũ).

---

## 8. Ngoài phạm vi (Out of Scope)

- Luồng GHN (`CreateOrderDrawer`) — không đổi hành vi, chỉ cần persist thật (Q4) như 1 phần kỹ thuật nền, không phải tính năng mới.
- Bulk action gửi nhiều đơn 247Express cùng lúc (Q2 — làm sau).
- Luồng đại lý từ chối/trả đơn cho shop sửa (Q6 — cần nhưng chưa làm).
- Đại lý chọn giữa 3 dịch vụ 247Express khi gửi — cố định dùng Chuyển phát nhanh (chờ xác nhận Q3).
- Tích hợp API thật với 247Express (`GetPriceForCustomerAPI`) — prototype chỉ mock chuyển trạng thái.
- Super Admin dashboard KPI về đơn tồn đọng chờ gửi 247Express.
- Cờ `autoDispatch` theo từng shop (cho shop tự gửi carrier riêng) — không cần vì 100% qua đại lý (Q9).
- **Giá vốn 247Express (chi phí thật đại lý phải trả, khác giá bán cho shop):** `Order.fee` hiện chỉ lưu giá bán cho shop (tính lúc shop tạo đơn qua `shopFeeFromPriceTable()`). Giá vốn thật KHÔNG tính trước qua bảng giá — sẽ do 247Express trả về sau khi đại lý dispatch (cùng cơ chế với đối soát GHN: `ghnFee` trong `carrier-reconciliation-items.json` chỉ có sau khi đại lý upload file đối soát, không tính trước). Modal "Xác nhận gửi qua 247Express" (`AgencyOrders.tsx`) vì vậy không hiển thị/tính lợi nhuận — số đó chỉ biết được khi 247Express có luồng đối soát riêng (tương tự `deriveShopSessions()`/`profit = feeShop − feeGHN` trong `AgencyReconciliation.tsx`, xem `docs/agency-admin/reconciliation/xac-nhan-phien-tach-phien-shop.md`) — chưa có trong scope hiện tại.
- **Phụ phí nhiên liệu 247Express (biến động, không tính trước được):** user xác nhận (2026-07-20) phí này KHÔNG cố định — do 247Express trả về lúc tạo đơn (qua `GetPriceForCustomerAPI` thật, chưa tích hợp), cùng bản chất với "giá vốn" ở trên. Đã quyết định **chưa thêm dòng phụ phí này vào `CreateLetterDrawer`** — model `ShopPricingSurcharges` hiện là 4 field cố định (`partialDelivery`, `insurance`, `deliveryFailFee`, `codFee`), không có chỗ cho giá trị "trả về từ API ngoài". Lý do không mock số giả: màn tạo đơn là nơi shop cần biết chính xác số tiền sẽ bị tính trước khi bấm tạo — hiện số sai còn tệ hơn không hiện, dễ gây tranh chấp khi số thật khác số hiển thị. Làm tiếp khi có API/công thức thật từ 247Express.

---

## 9. Tài liệu tham chiếu

- [[project-order-flow-ghn-vs-247]] — memory ghi lại phát hiện 2 luồng CreateOrderDrawer/CreateLetterDrawer, đọc trước khi code
- [[project-247express-services]] — 3 dịch vụ 247Express, chỉ Chuyển phát nhanh có đủ data hợp đồng
- [[project-247express-multi-hub]] — `clientHubIds[]`, cấp hub
- `src/platforms/shop/pages/Orders.tsx` — `CreateOrderDrawer` (dòng ~580+), `CreateLetterDrawer` (dòng 1119+)
- `src/mock-data/services.json` — `shopConnectionIds` (GHN) vs `hubIds` (247Express)
- `src/mock-data/pricing.json` — bảng giá bán cho shop, dùng chung công thức GHN cho cả 2 carrier (đã bỏ `pricing-letter-247.json`/`PricingCreate247.tsx` sau khi gộp luồng tạo dịch vụ/bảng giá GHN-247Express)
- `src/platforms/agency-admin/pages/AgencyOrders.tsx` — danh sách đơn Agency Admin
- [srs-tach-phien-shop.md](../reconciliation/srs-tach-phien-shop.md) — tham khảo rule "không đổi carrier sau khi gửi" (AC8) tương tự rủi ro mồ côi dữ liệu đối soát

---

## 10. Ghi chú review domain/cross-platform còn giữ lại từ v0.1 (vẫn áp dụng)

- **Rủi ro đổi carrier sau khi gửi:** vẫn giữ nguyên cảnh báo — không cho đổi `carrierCode` sau `dispatched` (AC8), vì dữ liệu đối soát map 1:1 theo `orderCode → sessionId` theo carrier.
- **Nhãn Web Shop:** `pending_agency` → "Chờ xử lý"; sau khi `dispatched`, không cần nhãn riêng nữa, dùng lại nhãn trạng thái giao hàng (`pickup`/`in_transit`/...).
- **Đối soát COD không bị ảnh hưởng:** đơn `pending_agency` chưa từng đến carrier nên không xuất hiện trong file đối soát GHN/247Express — không có rủi ro breaking `AgencyReconciliation.tsx`/`shop/pages/Reconciliation.tsx` trong phạm vi v1.
