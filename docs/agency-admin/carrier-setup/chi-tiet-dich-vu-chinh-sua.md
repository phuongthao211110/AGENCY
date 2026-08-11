---
id: AGA-CARRIER-15
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: 
status: draft
---

# [AGENCY] Thiết lập NVC - Chi tiết dịch vụ: chỉnh sửa

## User Story

Là Agency Admin, khi sửa 1 dịch vụ đã có (GHN "Hàng hoá" hoặc 247Express "Thư"), tôi cần các trường tôi chỉnh — bảng giá, Shop ID, loại đơn — được lưu đúng như tôi đã chọn, không bị âm thầm xoá trắng sau khi bấm "Lưu"; và với dịch vụ Thư, tôi không cần thấy/chọn Shop ID vì dịch vụ này áp dụng cho toàn bộ shop của đại lý.

## User Flow

1. Vào Thiết lập NVC → tab "Dịch vụ" → bấm vào tên 1 dịch vụ đã có → trang "Thông tin dịch vụ" (view mode).
2. Bấm nút cam **"Chỉnh sửa"** (nằm cuối card "Cấu hình") → toàn trang chuyển sang edit mode: Tên dịch vụ, Mô tả, Loại đơn, bảng giá, và (nếu là GHN) Kết nối Shop ID đều sửa được.
3. Với dịch vụ **GHN (Hàng hoá)**: card "Thông tin cơ bản" hiện ô **"Kết nối Shop ID"** — tick chọn/bỏ chọn shop, bắt buộc chọn ít nhất 1.
4. Với dịch vụ **247Express (Thư)**: card "Thông tin cơ bản" **không hiện ô Shop ID nào** — chỉ còn Tên/Mã/Mô tả/Loại đơn; card "Cấu hình" cho sửa Mã dịch vụ (ServiceTypeID) và bảng giá.
5. Bấm **"Lưu"** → mọi thay đổi (bảng giá, Shop ID đã chọn, loại đơn) được lưu đúng, trang quay về view mode hiện đúng giá trị mới.

## System Flow

1. **Bug fix (`handleSave`, sửa dịch vụ đã có)** — trước hợp nhất luồng GHN/247Express, `priceTableId`/`shopConnectionIds` bị gate theo `carrier === 'GHN'`:
   ```ts
   // TRƯỚC (bug)
   priceTableId: editForm.carrier === 'GHN' ? editForm.priceTableId : undefined,
   shopConnectionIds: editForm.carrier === 'GHN' ? editForm.shopConnectionIds : [],
   ```
   → dịch vụ 247Express/Thư mỗi lần "Lưu" đều bị xoá trắng bảng giá + Shop ID đã chọn, dù UI cho chọn y hệt GHN. **Fix:** dùng chung `editForm.priceTableId`/`editForm.shopConnectionIds` cho cả 2 carrier — khớp đúng những gì luồng tạo mới đã làm đúng từ đầu.
2. **Ẩn Shop ID cho dịch vụ Thư** — biến `isLetterService = derivedCarrier === '247Express' || editForm.sendKind === 'letter'` (tính cả 2 điều kiện vì khi tạo mới, `derivedCarrier` chỉ xác định được SAU khi chọn bảng giá ở card "Cấu hình" nằm dưới, còn pill "Loại đơn" ở card "Thông tin cơ bản" nằm trên — cần nhận diện ngay qua `sendKind`, không đợi chọn bảng giá).
3. Card "Thông tin cơ bản" (cả edit & view mode): `{!isLetterService && (<Kết nối Shop ID .../>)}` — với dịch vụ Thư, không render field này, không thay bằng ghi chú nào (đã bỏ hẳn theo phản hồi, không chỉ ẩn UI chọn mà cả câu ghi chú thay thế).
4. `requiresShopId = !isLetterService` — dùng cho validation `canCreate` (tạo mới) và thông báo lỗi ("Chọn ít nhất 1 Shop ID") — dịch vụ Thư không bị chặn tạo/lưu vì thiếu Shop ID.
5. `handleSave` ép `shopConnectionIds: []` khi carrier là 247Express (cả tạo mới và sửa) — khớp đúng ý nghĩa "247Express không có cơ chế kết nối theo từng shop" đã chốt từ đầu dự án (mục 4.2, PRD hợp nhất GHN/247Express).

## Acceptance Criteria

**AC1:** Sửa dịch vụ 247Express (Thư) đã có, chọn 2 Shop ID (giả sử UI còn cho chọn), đổi bảng giá, bấm "Lưu" → cả 2 giá trị được giữ đúng sau khi lưu — không bị xoá trắng.

**AC2:** Card "Thông tin cơ bản" của dịch vụ Thư (cả view và edit mode) không hiện field "Kết nối Shop ID" hay ghi chú thay thế nào — chỉ còn Tên/Mã/Mô tả/Loại đơn.

**AC3:** Card "Thông tin cơ bản" của dịch vụ GHN (Hàng hoá) không đổi gì — vẫn hiện ô "Kết nối Shop ID" bắt buộc chọn ở cả view/edit mode.

**AC4:** Tạo dịch vụ mới, bấm pill "Thư, bưu phẩm" TRƯỚC khi chọn bảng giá → ô "Kết nối Shop ID" ẩn ngay, không cần chờ chọn bảng giá.

**AC5:** Sửa dịch vụ Thư và bấm "Lưu" → `shopConnectionIds` luôn được ghi `[]`, không giữ giá trị cũ (nếu có) từ mock data.

## Notes

- Bug ở AC1 được phát hiện qua báo cáo thực tế của đại lý: "đối với dịch vụ của thư thì không có chọn shop id" — hoá ra là do bug xoá trắng khi lưu, không phải do thiếu UI.
- Sau khi fix bug, đại lý xem lại UI và phản hồi tiếp: dịch vụ Thư **không nên** cho gắn Shop ID nào cả (đúng bản chất 247Express không kết nối theo shop) — nên đổi từ "sửa bug hiển thị" sang "bỏ hẳn field này cho dịch vụ Thư".
- Ban đầu thay ô Shop ID bằng 1 dòng ghi chú "Toàn bộ shop của đại lý…", sau đó đại lý yêu cầu bỏ luôn cả dòng ghi chú — card "Thông tin cơ bản" của dịch vụ Thư giờ ngắn hơn hẳn dịch vụ GHN.
- `EDIT_STATUS_OPTIONS`/`serviceTypeId`/`deliveryZones`/`hubIds` không nằm trong phạm vi các fix này — giữ nguyên gate theo carrier như cũ vì là field thật sự khác biệt giữa 2 carrier.
- Chi tiết kỹ thuật đầy đủ (trước khi tách thành story riêng này) nằm ở mục 10b/10c của [prd-hop-nhat-ket-noi-ghn-247.md](./prd-hop-nhat-ket-noi-ghn-247.md).
