---
docType: PRD
id: PRD-AGA-CARRIER-UNIFIED
platform: agency-admin
section: Thiết lập nhà vận chuyển
status: confirmed
version: 0.2
createdAt: 2026-07-17
---

# PRD — Hợp nhất giao diện Dịch vụ & Bảng giá GHN + 247Express

> Trạng thái: **Đã chốt (v0.3)** — user đã xác nhận cả 5 câu hỏi mở (mục 10), và làm rõ thêm Q5 (mục 10, Q5) sau 1 vòng phản hồi: không chỉ gộp UI, mà `CreateLetterDrawer` phải chuyển sang dùng chung cơ chế `services.json`/`pricing.json`/`shopFeeFromPriceTable()` với `CreateOrderDrawer` — xem chi tiết mục 10, Q5 và mục 7 (System Flow) đã cập nhật.
> **Phạm vi thực tế sau khi chốt Q4:** tab Kết nối giữ nguyên, không đổi. Tab Dịch vụ + Bảng giá gộp UI. **Cộng thêm (Q5):** `CreateLetterDrawer` đổi cơ chế tính phí — đây là thay đổi nằm NGOÀI 3 tab CarrierSetup nhưng thuộc phạm vi PRD này vì là điều kiện để 2 luồng thực sự dùng chung 1 hệ thống dịch vụ/giá.

---

## 1. Bối cảnh & vấn đề

### 1.1 Cấu trúc hiện tại của CarrierSetup

`src/platforms/agency-admin/pages/CarrierSetup.tsx` có 3 tab con: **Kết nối**, **Dịch vụ**, **Bảng giá**. Mỗi tab đều có pill chọn carrier "GHN | 247Express" ở trên (component `CarrierSelector`), hiển thị nội dung hoàn toàn khác nhau tuỳ carrier được chọn.

Hai cơ chế kết nối hiện đang song song và tách biệt:

| Cơ chế | GHN | 247Express |
|--------|-----|------------|
| Đơn vị kết nối | Per-shop — mỗi shop có 1 "Shop ID" riêng | Per-agency — toàn đại lý dùng chung "ClientHubID" |
| Lưu trữ | `shopConnections[]` trong `agencyStore.ts` | `agency.clientHubIds[]` |
| Phê duyệt | GHN tự duyệt sau khi agency submit (OTP + "Chờ GHN duyệt") | Super Admin duyệt (flow `carrierRequests`) |
| Dữ liệu trên service | `shopConnectionIds: ["sc-001", ...]` | `hubIds: ["HUB-SGN-001"]`, `serviceTypeId`, `deliveryZones[]` |

### 1.2 Tính năng đang phụ thuộc vào cơ chế này (KHÔNG được phá vỡ)

Tính năng "Luồng gửi đơn carrier" (đã build, đã UAT — xem `docs/agency-admin/orders/prd-luong-gui-don-qua-carrier.md`) dựa vào:

- `CreateOrderDrawer` (Tạo đơn hàng, GHN) filter services bằng:
  ```typescript
  s.shopConnectionIds.includes(shopConnectionId)
  ```
  247Express services có `shopConnectionIds: []` → không bao giờ match → chỉ GHN services lọt qua.

- `CreateLetterDrawer` (Tạo thư/bưu phẩm/bưu kiện) hiện dùng thẳng `pricing-letter-247.json` — **không đụng** `services.json`. **[ĐÃ ĐỔI Ở v0.3 — xem mục 10 Q5]** đây chính là chỗ sẽ đổi: chuyển sang tra `services.json` (carrier 247EXPRESS) + `pricing.json` giống hệt `CreateOrderDrawer`.

Đây là **điểm sống còn**: nếu thay đổi kiến trúc làm cho 247Express services có `shopConnectionIds` khác rỗng, hoặc làm GHN services mất `shopConnectionIds`, thì `CreateOrderDrawer` sẽ phân luồng carrier sai. Việc `CreateLetterDrawer` chuyển sang dùng `services.json` KHÔNG được đụng đến `dispatchStatus`/`sendKind` — ranh giới "Luồng 1 tự động, Luồng 2 phải qua đại lý" chỉ do 2 field này quyết định, hoàn toàn độc lập với việc tính phí lấy từ đâu.

### 1.3 Yêu cầu mới

Bỏ pill "GHN | 247Express" ở cả 3 tab con — gộp thành 1 cơ chế kết nối và dịch vụ thống nhất. Không chỉ gộp giao diện, mà gộp thật cơ chế bên dưới.

---

## 2. Phân tích đánh đổi — Chọn mô hình kết nối thống nhất

### 2.1 Các hướng được xem xét

**(a) Per-shop wins** — 247Express "giả lập" Shop ID theo từng shop

247Express API thật không có khái niệm Shop ID từng shop — họ cấp một `ClientHubID` cho cả đại lý. Mô phỏng Shop ID cho 247Express là sai hoàn toàn về nghiệp vụ và sẽ gây nhầm lẫn cho Agency Admin khi đối chiếu với hệ thống thật. Không khuyến nghị.

**(b) Per-agency wins** — GHN bỏ khái niệm Shop ID riêng từng shop

GHN thật sự vận hành theo Shop ID. Bỏ khái niệm này làm mất dữ liệu kết nối đã có và phá vỡ tính năng "Gói cước" trong `AgencyServices`. Không khuyến nghị.

**(c) Dual data, unified UX** — Giữ 2 cấu trúc dữ liệu riêng ở tầng lưu trữ, hợp nhất trải nghiệm người dùng

`shopConnections[]` và `clientHubIds[]` vẫn tồn tại độc lập, nhưng cả 3 tab không còn pill carrier nữa. Thay vào đó, mỗi tab hiển thị tất cả entries (GHN + 247Express) trong 1 danh sách duy nhất, mỗi dòng có tag carrier nhỏ (`GHN` / `247Express`). Carrier routing cho order dispatch chuyển sang dùng field `carrier` tường minh trên `AgencyService`.

**(d) Unified connection entity với discriminated union**

Tạo 1 store duy nhất `connections[]` với type union:
```typescript
type ConnectionRecord =
  | { type: 'ghn_shop'; carrier: 'GHN'; shopId: string; ... }
  | { type: '247express_hub'; carrier: '247Express'; hubId: string; ... }
```
Về mặt dữ liệu sạch hơn (c), nhưng đòi hỏi migrate `agencyStore.ts` và `agency.clientHubIds` — phức tạp hơn đáng kể, tăng rủi ro với tính năng duyệt hub của Super Admin (`approveCarrierRequest`, `grantAdditionalHub`).

### 2.2 Khuyến nghị: Option (c) — Dual data, unified UX + explicit carrier field

**Lý do chọn (c):**

1. **Zero data loss**: `shopConnectionIds` (GHN) và `hubIds`/`clientHubIds` (247Express) được giữ nguyên — không cần migrate dữ liệu, không vỡ `agencyStore.ts`, không đụng Super Admin approval flow.

2. **Carrier routing tường minh ngay**: Field `carrier` đã tồn tại trên mọi `AgencyService` trong `services.json` (giá trị `"GHN"` hoặc `"247Express"`). Thay vì suy luận carrier gián tiếp qua `shopConnectionIds: []`, `CreateOrderDrawer` filter thẳng bằng `s.carrier === 'GHN'` — rõ ràng hơn, không dễ bị phá vỡ khi ai đó vô tình thêm `shopConnectionIds` cho 247Express service.

3. **UX đơn giản và đúng**: Người dùng thấy 1 danh sách duy nhất, không cần nhớ "GHN ở tab nào, 247Express ở đâu". Carrier badge nhỏ trên mỗi dòng đủ để phân biệt. Không phải thiết kế mới từ đầu — chỉ ghép 2 list đang có thành 1.

4. **Rủi ro có kiểm soát**: Không thay đổi store, không thay đổi approval flow. Có đổi `CreateLetterDrawer` (theo Q5, v0.3) nhưng CHỈ phần tính phí — không đụng `sendKind`/`dispatchStatus`/nút "Tạo đơn" nên hành vi luồng (phải qua đại lý) không đổi.

**Hệ quả trực tiếp:**
- `shopConnectionIds: []` trên 247Express services không còn là cơ chế phân luồng carrier. Ý nghĩa mới: "dịch vụ này chưa có shop ID nào gán trực tiếp" (đúng về nghiệp vụ, vì 247Express không hoạt động theo shop ID).
- `hubIds` trên 247Express services giữ nguyên ý nghĩa: hub(s) xử lý service đó.
- `carrier` field trên `AgencyService` trở thành nguồn sự thật duy nhất cho phân luồng carrier ở cả order dispatch lẫn tab Dịch vụ/Bảng giá.

---

## 3. Mục tiêu & Kết quả kỳ vọng

### 3.1 Mục tiêu

> **[ĐÃ CẬP NHẬT theo Q4 — mục 10]** Tab **Kết nối** ra khỏi phạm vi gộp — giữ nguyên pill "GHN | 247Express" như hiện tại, không đổi. Chỉ 2 tab **Dịch vụ** và **Bảng giá** áp dụng gộp UI dưới đây.

| Mục tiêu | Đo lường |
|----------|----------|
| Bỏ pill "GHN / 247Express" ở tab Dịch vụ và Bảng giá (KHÔNG áp dụng tab Kết nối) | Không còn `CarrierSelector` ở 2 tab này; tab Kết nối vẫn còn `CarrierSelector` như cũ |
| Danh sách Dịch vụ hiển thị cả 2 carrier trong 1 list | `AgencyServices` nhận toàn bộ services, không lọc theo carrier |
| Danh sách Bảng giá hiển thị cả 2 carrier trong 1 list | Rows GHN và 247Express gộp chung, có carrier badge |
| Nút "Tạo dịch vụ mới" / "Tạo bảng giá" gộp thành 1 nút mỗi loại | Không còn 2 nút riêng theo carrier — chọn carrier ở bước đầu trong form/flow |
| [v0.3] `CreateLetterDrawer` dùng chung engine phí với `CreateOrderDrawer` | Cả 2 đọc `services.json`+`pricing.json`, gọi cùng `shopFeeFromPriceTable()` |
| Ranh giới Luồng 1 (GHN, tự động)/Luồng 2 (247Express, qua đại lý) KHÔNG đổi | `sendKind`/`dispatchStatus` giữ nguyên hành vi, độc lập với nguồn tính phí |

### 3.2 Ngoài phạm vi PRD này

- Thay đổi approval flow của Super Admin (247Express hub activation/rejection) — giữ nguyên
- Thay đổi OTP flow kết nối GHN Shop ID — giữ nguyên
- Thay đổi cách tính giá `PricingCreate.tsx` / `PricingCreate247.tsx` — đã có PRD riêng (xem Q3 trong `prd-luong-gui-don-qua-carrier.md`)
- Merge `agencyStore.ts` `shopConnections` với `clientHubIds` thành 1 entity — out of scope (option d, quá phức tạp cho phạm vi này)
- ~~Thay đổi `CreateLetterDrawer`~~ — **[ĐÃ ĐỔI v0.3]** giờ có đụng, xem mục 10 Q5 + mục 7. Chỉ đổi nguồn tính phí, không đổi UI form hay hành vi nút bấm.
- Tạo dịch vụ mới (`ServiceDetail.tsx`) — không đổi logic, chỉ xem xét UI entry point nếu cần

---

## 4. Thay đổi Data Model

### 4.1 Không có thay đổi cấu trúc lưu trữ

Không thêm, bỏ, hay đổi tên field nào trong `services.json`, `agencyStore.ts`, hay `agency.clientHubIds`.

### 4.2 Thay đổi ý nghĩa của `shopConnectionIds` trên 247Express services

Từ: "luôn rỗng, dùng để phân biệt carrier gián tiếp trong `CreateOrderDrawer`"
Thành: "luôn rỗng, vì 247Express không có cơ chế kết nối theo từng shop — không có ý nghĩa phân luồng carrier"

**Không cần sửa data** — không có field nào thay đổi giá trị, chỉ thay đổi cách code đọc field này.

### 4.3 Thay đổi duy nhất trong code: filter trong `CreateOrderDrawer`

```typescript
// TRƯỚC (implicit, dễ vỡ):
const eligible = services.filter(s =>
  s.agencyId === agencyId &&
  s.shopConnectionIds.includes(shopConnectionId)  // ← suy luận carrier gián tiếp
)

// SAU (explicit, tường minh):
const eligible = services.filter(s =>
  s.agencyId === agencyId &&
  s.carrier === 'GHN'                            // ← carrier routing trực tiếp
)
```

**[v0.3]** `CreateLetterDrawer` ĐỔI phần tính phí — xem mục 4.5 dưới đây.

### 4.5 [MỚI, v0.3] `CreateLetterDrawer` chuyển sang dùng chung `services.json`/`pricing.json`

```typescript
// TRƯỚC: đọc riêng pricing-letter-247.json, công thức LETTER_TABLE theo hợp đồng 1231/2026
const fee = letterMainFee(weightGram, zone, isNhanh ...)

// SAU: tra service 247Express của agency (giống hệt cách CreateOrderDrawer tra GHN),
// dùng đúng shopFeeFromPriceTable() — 1 hàm chung cho cả 2 luồng
const service247 = servicesList.find(s => s.carrier === '247EXPRESS' && s.enabled && s.agencyId === agencyId)
const fee = service247 ? shopFeeFromPriceTable(service247, weightGram, fromProvince, rcvProvince) : 0
```

**Xoá bỏ:** `pricing-letter-247.json`, `LETTER_TABLE`, `letterMainFee()`, và các hằng số phụ phí riêng theo hợp đồng 247Express không còn dùng trong `CreateLetterDrawer` (đã chuyển hết sang cơ chế `surcharges` chung trong `pricing.json`, giống GHN).

**KHÔNG đổi:** `sendKind: 'letter'`, `dispatchStatus: 'pending_agency'`, `carrierCode: null` khi shop bấm "Tạo đơn" — toàn bộ UI form (các trường Bên gửi/Bên nhận/Sản phẩm/DVGT) giữ nguyên, chỉ đổi công thức tính con số phí hiển thị.

### 4.4 Migration mock data

Không có migration. Toàn bộ 8 service records trong `services.json` giữ nguyên. Field `carrier` đã có giá trị đúng từ trước.

---

## 5. User Story

### 5.1 Agency Admin — Xem tổng quan kết nối carrier

```
Là Agency Admin
Tôi muốn xem toàn bộ kết nối carrier (cả GHN Shop ID lẫn 247Express Hub) trong 1 danh sách duy nhất
Để không phải nhớ "GHN ở pill này, 247Express ở pill kia" — tôi thấy toàn cảnh ngay khi mở tab Kết nối
```

### 5.2 [HUỶ theo Q4] ~~Agency Admin — Kết nối GHN Shop ID mới~~

Không áp dụng — tab Kết nối giữ nguyên, không đổi entry point.

### 5.3 [HUỶ theo Q4] ~~Agency Admin — Yêu cầu thêm hub 247Express~~

Không áp dụng — tab Kết nối giữ nguyên, không đổi entry point.

### 5.4 Agency Admin — Xem dịch vụ tất cả carrier

```
Là Agency Admin
Tôi muốn xem toàn bộ dịch vụ (GHN và 247Express) trong 1 danh sách
Để so sánh nhanh và quản lý tổng thể, thay vì phải chuyển pill qua lại
```

---

## 6. User Flow

### 6.1–6.3 [HUỶ theo Q4] ~~Tab Kết nối~~

Không áp dụng — tab Kết nối giữ nguyên 100% hành vi hiện tại (pill GHN/247Express, `AddShopModal` OTP flow, `TabConnect247` hub request flow). Không có thay đổi nào ở tab này trong PRD.

### 6.4 Tab Dịch vụ — Danh sách hợp nhất + 1 nút tạo

1. Agency Admin vào tab Dịch vụ — không còn pill carrier
2. Thấy 1 danh sách tất cả services (GHN và 247Express), mỗi row có carrier badge nhỏ
3. Search/filter vẫn hoạt động trên toàn bộ list
4. Bấm nút **"Tạo dịch vụ mới"** (1 nút duy nhất) → chọn carrier ở bước đầu (dropdown/pill nhỏ trong form) → vào đúng luồng `ServiceDetail.tsx` tương ứng carrier đã chọn
5. Click vào tên dịch vụ → vào `ServiceDetail.tsx` như hiện tại

### 6.5 Tab Bảng giá — Danh sách hợp nhất + 1 nút tạo, bỏ banner

1. Agency Admin vào tab Bảng giá — không còn pill carrier
2. Thấy 1 danh sách tất cả price tables (GHN và 247Express), mỗi row có carrier badge nhỏ
3. Bấm nút **"Tạo bảng giá"** (1 nút duy nhất) → chọn carrier ở bước đầu → điều hướng đúng route (`/pricing/create` hoặc `/pricing/create-247`)
4. Không còn banner cảnh báo "chưa có Shop ID"/"chưa kích hoạt 247Express" trong tab này (đã bỏ theo Q3 — user biết tình trạng qua tab Kết nối)

---

## 7. System Flow — Phân luồng carrier cho order dispatch

```
[CreateOrderDrawer — Tạo đơn hàng]
    → Filter services: s.carrier === 'GHN'       ← thay thế s.shopConnectionIds.includes(...)
    → Luôn chỉ thấy GHN services → đơn đi GHN
    → sendKind: 'goods', dispatchStatus: 'dispatched', carrierCode: 'GHN'

[CreateLetterDrawer — Tạo thư/bưu phẩm/bưu kiện]
    → [v0.3] Filter service: s.carrier === '247EXPRESS'   ← thay thế pricing-letter-247.json
    → Tính phí qua shopFeeFromPriceTable() — CÙNG HÀM với CreateOrderDrawer
    → Luôn chỉ đi 247Express (chỉ có 1 service 247Express match filter này)
    → sendKind: 'letter', dispatchStatus: 'pending_agency', carrierCode: null  ← KHÔNG ĐỔI

→ Hành vi "phải qua đại lý hay không" KHÔNG ĐỔI (do sendKind/dispatchStatus quyết định).
→ Nguồn tính phí/dịch vụ giờ THỐNG NHẤT giữa 2 luồng (services.json + pricing.json + shopFeeFromPriceTable()).
→ Cơ chế filter carrier chuyển từ implicit (shopConnectionIds rỗng/không rỗng) sang explicit (field carrier).
```

---

## 8. Acceptance Criteria

**AC1 — [HUỶ theo Q4] ~~Tab Kết nối — Danh sách hợp nhất~~:** Tab Kết nối ra khỏi phạm vi — giữ nguyên pill "GHN | 247Express" và toàn bộ hành vi hiện tại, không đổi gì.

**AC2 — [HUỶ theo Q4] ~~Tab Kết nối — Carrier badge~~:** Không áp dụng — xem AC1.

**AC3 — [HUỶ theo Q4] ~~Tab Kết nối — Entry point GHN~~:** Không áp dụng — `AddShopModal`/OTP flow giữ nguyên đúng như hiện tại, không cần AC riêng vì không đổi gì.

**AC4 — [HUỶ theo Q4] ~~Tab Kết nối — Entry point 247Express~~:** Không áp dụng — `TabConnect247`/hub request flow giữ nguyên đúng như hiện tại.

**AC5 — Không mất tính năng `AgencyServices.tsx` sau khi gộp tab Dịch vụ:** Sau khi gộp danh sách Dịch vụ, flow "Đã được `shopConnectionIds` gán vào service nào" (hiển thị "X shop đang áp dụng dịch vụ") vẫn hoạt động đúng cho GHN services. 247Express services vẫn hiển thị đúng hub(s) trong `ServiceDetail.tsx`.

**AC1b — Tab Dịch vụ — Danh sách hợp nhất + 1 nút tạo (thay AC1, theo Q1/Q4):** `AgencyServices` hiển thị 1 danh sách tất cả services (GHN + 247Express), có carrier badge mỗi row, không còn pill. 1 nút "Tạo dịch vụ mới" duy nhất — chọn carrier ở bước đầu trong form, không phải 2 nút riêng.

**AC2b — Tab Bảng giá — Danh sách hợp nhất + 1 nút tạo + bỏ banner (thay AC2/Q2/Q3, theo Q4):** Danh sách bảng giá gộp chung GHN + 247Express, có carrier badge mỗi row. 1 nút "Tạo bảng giá" duy nhất — chọn carrier ở bước đầu, điều hướng đúng route (`/pricing/create` hoặc `/pricing/create-247`). Không còn banner cảnh báo "chưa có Shop ID"/"chưa kích hoạt 247Express" trong tab này (đã bỏ theo Q3).

**AC6 — Tab Dịch vụ — Danh sách hợp nhất:** `AgencyServices` component hiển thị cả GHN và 247Express services trong 1 list, có carrier badge trên mỗi row. Không có pill carrier. Search/filter tìm kiếm trên toàn bộ list.

**AC7 — Tab Bảng giá — Danh sách hợp nhất:** Tương tự AC6 cho tab Bảng giá: 1 list chung, carrier badge mỗi row, không có pill carrier.

**AC8 — Order dispatch không ảnh hưởng:** Sau khi thay filter `CreateOrderDrawer` từ `s.shopConnectionIds.includes(shopConnectionId)` sang `s.carrier === 'GHN'`:
- Tạo đơn hàng (hàng hoá): chỉ thấy GHN services trong dropdown dịch vụ — hành vi người dùng KHÔNG ĐỔI
- Tạo thư/bưu phẩm/bưu kiện: hoạt động hoàn toàn như trước (không đụng `CreateLetterDrawer`)
- `sendKind`, `dispatchStatus`, `carrierCode` vẫn được gán đúng theo PRD `prd-luong-gui-don-qua-carrier.md`

**AC8b — [MỚI, v0.3] `CreateLetterDrawer` dùng chung engine tính phí:** Phí hiển thị cho shop khi tạo thư/bưu phẩm/bưu kiện được tính qua `shopFeeFromPriceTable()` tra đúng service `carrier === '247EXPRESS'` trong `services.json` — không còn đọc `pricing-letter-247.json`. Form/UI/nút bấm của `CreateLetterDrawer` không đổi. `sendKind: 'letter'`, `dispatchStatus: 'pending_agency'`, `carrierCode: null` khi tạo đơn giữ nguyên y hệt trước.

**AC9 — [ĐÃ SỬA theo Q4] Super Admin approval flow không đổi:** Flow `approveCarrierRequest` / `grantAdditionalHub` / `requestModalCarrier` không thay đổi. Agency Admin vẫn submit yêu cầu qua đúng flow, Super Admin vẫn duyệt qua `CarrierApprovalForm` 2 bước như hiện tại. **Entry point phía Agency Admin cũng KHÔNG đổi** (tab Kết nối giữ nguyên pill "GHN | 247Express" — ra khỏi phạm vi theo Q4).

**AC10 — `allowedCarriers` logic giữ nguyên:** `agency.allowedCarriers` vẫn kiểm soát carrier nào agency được phép dùng. Nếu 247Express chưa trong `allowedCarriers`, entry point "Yêu cầu Hub 247Express" vẫn có cơ chế gửi carrier activation request đến Super Admin — chỉ bỏ pill, không bỏ guard logic.

**AC11 — TypeScript compiles clean:** Sau khi thay đổi, `npx tsc -b` ra 0 errors. Đặc biệt: `AgencyServices` component cần review lại prop `carrier` — nếu trước đây nhận `CarrierKey` để filter, giờ có thể bỏ prop đó và tự lấy toàn bộ services của agency, hoặc giữ prop nhưng truyền `undefined` (không filter theo carrier).

---

## 9. Rủi ro & Ràng buộc

### 9.1 Rủi ro cao — Phá vỡ order dispatch

**Rủi ro:** Nếu implementation dùng cách khác (không phải `s.carrier === 'GHN'`) để filter services trong `CreateOrderDrawer` — ví dụ tình cờ thêm `shopConnectionIds` cho 247Express services khi merge UX — thì 247Express services sẽ lọt vào CreateOrderDrawer, phá vỡ nguyên tắc "Tạo đơn hàng luôn = GHN".

**Giảm thiểu:** AC8 phải là acceptance criteria đầu tiên kiểm tra sau khi implement. Developer phải hiểu rõ `s.carrier === 'GHN'` là thay thế toàn bộ cho `s.shopConnectionIds.includes(...)` — không được giữ cả 2 điều kiện.

### 9.2 [Đã loại bỏ theo Q4] ~~Rủi ro Super Admin approval flow 2-step bị ảnh hưởng~~

Không còn áp dụng — tab Kết nối (nơi chứa `CarrierSelector`/`onRequestCarrier`/`CarrierRequestModal`) giữ nguyên hoàn toàn, không đổi. Rủi ro này chỉ tồn tại nếu Kết nối cũng bị gộp — đã loại khỏi phạm vi.

### 9.3 Rủi ro trung bình — `allowedServices247` không còn visible

**Rủi ro:** `agency.allowedServices247` (list service type IDs 247Express agency được duyệt dùng, xem memory `project-247express-multi-hub`) hiện được filter trong `ServiceDetail.tsx` khi tạo/chỉnh sửa service 247Express. Sau khi gộp danh sách, cần đảm bảo filter này vẫn hoạt động đúng.

**Giảm thiểu:** `ServiceDetail.tsx` không thay đổi trong phạm vi PRD này — chỉ đổi entry point (từ pill → unified list). Filter `allowedServices247` giữ nguyên.

### 9.4 Rủi ro thấp — UX danh sách dài

**Rủi ro:** Nếu agency có nhiều GHN Shop ID (ví dụ 15 shops) lẫn nhiều 247Express hubs, danh sách kết nối hợp nhất có thể dài và khó scan.

**Giảm thiểu:** Thêm filter/search trong tab Kết nối (có thể filter theo carrier bằng checkbox/tag, không cần pill toàn màn hình). Search hiện tại của GHN tab giữ nguyên, mở rộng để search cả hub rows.

### 9.5 Ràng buộc thiết kế quan trọng

- **Carrier badge màu sắc:** "GHN" badge phải dùng `#EE4D2D` (không phải `#FF5200` là màu action button của GHN Agency system), "247Express" badge dùng `#1677FF`. Đây là brand color của carrier, không phải design token của GHN Agency.
- **Inline styles only:** Giữ đúng quy tắc "Inline styles only — KHÔNG dùng Tailwind, KHÔNG dùng CSS modules".
- **Sidebar width = 240px, Header height = 40px, Page background = #fff:** Giữ nguyên, thay đổi này không ảnh hưởng layout tổng thể.

---

## 10. Câu hỏi mở — ĐÃ CHỐT (user xác nhận 2026-07-17)

### Q1 — [ĐÃ CHỐT] Nút "Tạo dịch vụ mới" — Phương án (a), 1 nút chung

Lý do user chốt: 247Express giờ tạo dịch vụ theo cùng luồng như GHN (sau khi đơn giản hoá `PricingCreate247.tsx`) — không còn lý do kỹ thuật để tách 2 nút. **1 nút "Tạo dịch vụ mới"**, chọn carrier ở bước đầu (dropdown hoặc pill nhỏ trong form, không phải pill toàn trang), rồi điều hướng đúng luồng `ServiceDetail.tsx` tương ứng.

### Q2 — [ĐÃ CHỐT, SIẾT LẠI sau phản hồi] Nút "Tạo bảng giá" — 1 nút, VÀ CHỈ 1 LUỒNG/1 TRANG DUY NHẤT, không phải 2 route riêng

User phản hồi thêm sau bản trước (chỉ gộp nút, giữ 2 route `/pricing/create` và `/pricing/create-247`): **"không được phân tách ra"** — yêu cầu rõ: `PricingCreate.tsx` và `PricingCreate247.tsx` phải **gộp thành đúng 1 component/1 route duy nhất**, không phải 2 trang riêng dù giống hệt nhau về layout. Lý do hợp lý: sau AC11 (2 trang đã mirror nhau 100%), giữ 2 file/2 route là dư thừa — tạo cảm giác "vẫn tách" dù giao diện giống nhau.

**Quyết định cuối:** xoá `PricingCreate247.tsx`, gộp vào `PricingCreate.tsx` — route `/pricing/create-247` redirect hoặc bị xoá, chỉ còn `/pricing/create` (nhận `carrier`/`nvc` qua route state giống cách `ServiceDetail.tsx` đã làm cho Dịch vụ — mặc định `'GHN'` nếu không truyền). 1 nút "Tạo bảng giá" duy nhất ở tab Bảng giá → chọn carrier ở bước đầu → luôn vào cùng 1 route/1 component, chỉ khác giá trị `carrier` truyền vào.

### Q3 — [ĐÃ CHỐT] Bỏ hẳn warning banner "chưa kết nối" trong Tab Bảng giá

Phương án (b) — bỏ hẳn, không hiển thị banner cảnh báo "chưa có Shop ID"/"chưa kích hoạt 247Express" trong tab Bảng giá nữa. User biết tình trạng kết nối qua Tab Kết nối rồi, không cần lặp lại cảnh báo ở đây.

### Q4 — [ĐÃ CHỐT] Tab Kết nối GIỮ NGUYÊN phân tách 2 bên

User: *"TAB KẾT NỐI CẦN GIỮ NGUYÊN 2 BÊN"* — **KHÔNG** áp dụng "bỏ pill, gộp flat list" cho riêng tab Kết nối. Lý do đã nêu ở mục 1.2/2.1: GHN (Shop ID, per-shop, GHN tự duyệt) và 247Express (ClientHubID, per-agency, Super Admin duyệt) là 2 cơ chế/API thật sự khác nhau — gộp thành 1 danh sách phẳng sẽ gây nhầm lẫn nghiêm trọng hơn là giúp ích.

→ **Chỉ áp dụng "bỏ pill, gộp list" cho 2 tab Dịch vụ và Bảng giá** (nơi cả 2 carrier giờ đã dùng chung 1 luồng/1 cấu trúc thật sự sau khi đơn giản hoá 247Express). Tab Kết nối giữ nguyên pill "GHN | 247Express" như hiện tại — không đổi gì ở tab này trong phạm vi PRD.

**AC1-AC4 và AC9-AC10 (mục 8) cần điều chỉnh theo quyết định này** — bỏ yêu cầu "danh sách hợp nhất" cho tab Kết nối, giữ nguyên hành vi hiện tại của tab này.

### Q5 — [ĐÃ CHỐT, v0.3 — làm rõ thêm sau phản hồi] Không chỉ UX — `CreateLetterDrawer` phải dùng chung engine tính phí với `CreateOrderDrawer`

User phản hồi bản v0.2 (chỉ merge UX, giữ `CreateLetterDrawer` nguyên vẹn) là **chưa đủ** — "không chỉ UX". Sau khi trao đổi, đã chốt hướng cụ thể:

- Vẫn **giữ Option (c)** ở tầng store kết nối (`shopConnections`/`clientHubIds` không merge — không cần Option d).
- Nhưng **tầng dịch vụ/giá phải merge thật**: `CreateLetterDrawer` bỏ `pricing-letter-247.json` riêng, chuyển sang tra `services.json` (`carrier === '247EXPRESS'`) + tính phí qua `shopFeeFromPriceTable()` — **đúng hàm, đúng cơ chế** `CreateOrderDrawer` đang dùng cho GHN. Xem mục 4.5 (mới).
- Ranh giới nghiệp vụ gốc (Luồng 1 GHN tự động / Luồng 2 247Express phải qua đại lý duyệt) **không đổi** — do `sendKind`/`dispatchStatus` quyết định, hoàn toàn tách biệt khỏi việc lấy phí từ đâu.
- **Kết quả:** sau thay đổi này, "Luồng 1" và "Luồng 2" chỉ còn khác nhau ở (a) nút nào shop bấm, và (b) có cần đại lý duyệt trước khi gán carrier hay không — toàn bộ phần dịch vụ/bảng giá bên dưới dùng chung 1 hệ thống, khớp đúng tinh thần "gộp cơ chế bên dưới, không chỉ gộp giao diện".

---

## 10b. Bug fix phát sinh sau hợp nhất — mất `shopConnectionIds`/`priceTableId` khi sửa dịch vụ 247Express/Thư

**Phát hiện:** đại lý báo "đối với dịch vụ của thư thì không có chọn shop id" — kiểm tra `ServiceDetail.tsx` (`handleSave`, đường sửa dịch vụ ĐÃ CÓ, không phải tạo mới) thấy vẫn còn gate theo `carrier` từ TRƯỚC khi hợp nhất:

```ts
// TRƯỚC (bug) — dù UI đã cho chọn Shop ID/bảng giá giống nhau cho cả 2 carrier
priceTableId: editForm.carrier === 'GHN' ? editForm.priceTableId : undefined,
shopConnectionIds: editForm.carrier === 'GHN' ? editForm.shopConnectionIds : [],
```

→ Với dịch vụ carrier `247Express` (thường là `sendKind: 'letter'`/Thư), mỗi lần bấm "Lưu" ở màn sửa — dù agency vừa chọn Shop ID hay bảng giá gì trong UI — **2 field này đều bị ghi đè về rỗng/undefined** ngay khi lưu. Đây là leftover từ model cũ (trước hợp nhất: chỉ GHN dùng Shop ID, chỉ GHN dùng priceTableId thủ công) không được dọn khi hợp nhất luồng ở Q5.

**Fix:** bỏ gate carrier cho 2 field này — dùng chung `editForm.priceTableId`/`editForm.shopConnectionIds` cho cả 2 carrier, khớp đúng những gì luồng tạo mới (`isNewService`) đã làm đúng từ đầu. Đã verify qua UAT: sửa dịch vụ 247Express (svc-002), chọn 2 Shop ID, lưu → hiển thị lại đúng 2 shop đã chọn, bảng giá không bị mất.

**Chưa đổi (out of scope fix này):** `serviceTypeId`/`deliveryZones`/`hubIds` vẫn gate theo carrier như cũ — các field này thật sự khác biệt hoặc đã không còn dùng (hub chọn ở bước dispatch, không phải ở Service), không phải cùng loại bug.

## 10c. Sửa lại theo phản hồi thêm — bỏ hẳn "Kết nối Shop ID" khỏi dịch vụ Thư/247Express

Sau bản fix 10b, đại lý xem lại UI và yêu cầu: dịch vụ Thư không nên cho gắn theo Shop ID nào — cả ở view và edit.

Đối chiếu lại đúng mục **4.2** của PRD này (đã chốt từ đầu): `shopConnectionIds` trên dịch vụ 247Express "luôn rỗng, vì 247Express không có cơ chế kết nối theo từng shop". Bản hợp nhất UI ở mục 5.4/10b vô tình đi NGƯỢC quyết định này — hiện lại 1 ô chọn Shop ID y hệt GHN cho cả dịch vụ Thư, khiến đại lý hiểu nhầm là phải gắn Shop ID mới dùng được (trong khi `CreateLetterDrawer`/`CreateLetterDrawerAgency` tìm dịch vụ 247Express rẻ nhất của đại lý mà **không** lọc theo `shopConnectionIds` — field này chưa từng có tác dụng thật với luồng Thư).

**Fix (`ServiceDetail.tsx`, `AgencyServices.tsx`):**
- Card "Thông tin cơ bản" (cả view & edit) — với `carrier === '247Express'`, thay khối "Kết nối Shop ID"/Shop count bằng 1 dòng ghi chú tĩnh: "Toàn bộ shop của đại lý — dịch vụ Thư không giới hạn theo Shop ID".
- `canCreate`/thông báo validation khi tạo dịch vụ mới: bỏ yêu cầu chọn Shop ID khi carrier suy ra là `247Express` (`requiresShopId = derivedCarrier !== '247Express'`).
- `handleSave()` (cả tạo mới và sửa): ép `shopConnectionIds: []` khi carrier là `247Express`, khớp đúng ý nghĩa "luôn rỗng" ở mục 4.2.
- Trang danh sách dịch vụ (`AgencyServices.tsx`) — cột "Shop" hiện "Toàn bộ shop của đại lý" cho carrier `247Express` thay vì "N shop đang áp dụng dịch vụ" (vốn luôn là 0, gây hiểu nhầm).

Đã verify qua UAT: tạo dịch vụ mới chọn bảng giá 247Express → không còn ô "Kết nối Shop ID", nút "Tạo dịch vụ" bấm được ngay không cần chọn shop; dịch vụ Thư có sẵn (svc-002) ở cả view/edit đều chỉ hiện dòng ghi chú; dịch vụ GHN (Hàng hoá) không bị ảnh hưởng — vẫn giữ nguyên ô chọn Shop ID bắt buộc.

**Sửa tiếp — thứ tự trường ở màn tạo mới:** ban đầu gate chỉ theo `derivedCarrier` (suy từ bảng giá đã chọn ở card "Cấu hình", nằm DƯỚI), nên nếu đại lý bấm pill "Thư, bưu phẩm" ở card "Thông tin cơ bản" (nằm TRÊN) TRƯỚC khi chọn bảng giá, ô "Kết nối Shop ID" vẫn hiện ra (chưa kịp ẩn) — vì lúc đó chưa có bảng giá nào để suy ra carrier. Fix: thêm `isLetterService = derivedCarrier === '247Express' || editForm.sendKind === 'letter'`, dùng biến này thay cho `derivedCarrier === '247Express'` ở phần gate Shop ID — nhận diện được ngay qua pill, không phải đợi chọn bảng giá.

**Sửa tiếp lần 2 — bỏ hẳn dòng ghi chú thay thế:** bản đầu thay ô "Kết nối Shop ID" bằng 1 dòng ghi chú tĩnh "Shop áp dụng: Toàn bộ shop của đại lý...". Theo phản hồi tiếp, đại lý muốn bỏ hẳn cả dòng ghi chú này — với dịch vụ Thư, card "Thông tin cơ bản" (view & edit) chỉ còn Tên/Mã/Mô tả/Loại đơn, không còn field nào liên quan Shop ở đây nữa (`{!isLetterService && (...)}` / `{serviceData.carrier !== '247Express' && (...)}`, không còn nhánh else render ghi chú).

---

## 11. Tài liệu tham chiếu

- `src/platforms/agency-admin/pages/CarrierSetup.tsx` — trang hiện tại cần refactor
- `src/platforms/agency-admin/pages/AgencyServices.tsx` — component Dịch vụ, nhận prop `carrier`
- `src/mock-data/services.json` — 8 service records với field `carrier` đã có
- `src/platforms/super-admin/agencyStore.ts` — `shopConnections`, `carrierRequests`, `clientHubs247`, `approveCarrierRequest`, `grantAdditionalHub`
- `src/platforms/shop/pages/Orders.tsx` — `CreateOrderDrawer` (filter `shopConnectionIds`), `CreateLetterDrawer`
- `docs/agency-admin/orders/prd-luong-gui-don-qua-carrier.md` — PRD luồng dispatch carrier, AC8 của PRD này phụ thuộc hoàn toàn vào tính đúng đắn của PRD kia
- `docs/super-admin/approvals/duyet-kich-hoat-nha-van-chuyen-moi.md` — Super Admin approval flow
- memory `project-247express-multi-hub.md` — `clientHubIds[]`, 2-step approval, `allowedServices247`
- memory `project-order-flow-ghn-vs-247.md` — lý do 2 drawer tách biệt, cảnh báo về filter `shopConnectionIds`
