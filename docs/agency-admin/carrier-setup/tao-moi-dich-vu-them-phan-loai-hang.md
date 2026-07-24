---
id: AGA-CARRIER-12
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: 
status: draft
---

# [AGENCY] Thiết lập NVC - Tạo mới dịch vụ: Thêm phân loại hàng

## User Story

Là Agency Admin (Đại lý), tôi muốn phân loại rõ mỗi dịch vụ đang xử lý **Hàng hoá** hay **Thư, bưu phẩm** ngay khi tạo mới, để biết dịch vụ này áp dụng cho loại đơn nào mà không cần suy đoán qua nhà vận chuyển hay bảng giá đã chọn.

## User Flow

1. Agency Admin vào "Thiết lập NVC" → tab "Dịch vụ" → bấm **Tạo dịch vụ mới**
2. Ở card "Thông tin cơ bản", ngay dưới Tên dịch vụ/Mô tả, thấy mục **Loại đơn** với 2 lựa chọn: **Hàng hoá** / **Thư, bưu phẩm**
3. Khi chọn bảng giá bán cho shop ở card "Cấu hình", hệ thống **tự động gợi ý** Loại đơn tương ứng (bảng giá GHN → Hàng hoá, bảng giá 247Express → Thư, bưu phẩm)
4. Agency Admin có thể **bấm đổi lại** lựa chọn Loại đơn theo ý muốn, không bị khoá theo gợi ý
5. Bấm "Tạo dịch vụ" → Loại đơn được lưu cùng dịch vụ, hiển thị lại đúng khi xem chi tiết dịch vụ vừa tạo

## System Flow

1. `ServiceForm` (state form tạo/sửa dịch vụ trong `ServiceDetail.tsx`) có thêm field `sendKind: 'goods' | 'letter'`, mặc định `'goods'` khi tạo mới
2. Khi `<select>` bảng giá đổi giá trị, `onChange` tra `nvc` của bảng giá vừa chọn trong `pricing.json` và set lại `sendKind` tương ứng (`'247Express' → 'letter'`, còn lại → `'goods'`) — **chỉ áp dụng lúc tạo mới** (`isNewService`), không tự đổi khi sửa dịch vụ đã có
3. Radio button "Hàng hoá"/"Thư, bưu phẩm" đọc/ghi trực tiếp `editForm.sendKind` — bấm vào radio nào thì `setEditForm` cập nhật ngay, ghi đè lên giá trị tự động gợi ý ở bước 2
4. Lúc submit, `handleSave()` truyền `sendKind: editForm.sendKind` vào `addService()` (tạo mới) / `updateService()` (sửa) — lưu vào `AgencyService.sendKind` (field mới, optional để tương thích dữ liệu cũ trong `services.json`)
5. Ở chế độ xem chi tiết dịch vụ (không editing), hiển thị `LabelValue` "Loại đơn": `sendKind === 'letter' ? 'Thư, bưu phẩm' : 'Hàng hoá'`
6. Dữ liệu dịch vụ cũ (tạo trước khi có field này, `sendKind` là `undefined`) suy ra hiển thị theo carrier hiện có: GHN → Hàng hoá, 247Express → Thư, bưu phẩm

## Acceptance Criteria

**AC1:** Card "Thông tin cơ bản" ở cả 2 chế độ (tạo mới, sửa dịch vụ) hiển thị mục "Loại đơn" với đúng 2 radio button: "Hàng hoá" và "Thư, bưu phẩm" (chọn được đúng 1 trong 2, không phải checkbox).

**AC2:** Mặc định khi vào trang tạo dịch vụ mới, radio "Hàng hoá" đang được chọn.

**AC3:** Chọn 1 bảng giá có `nvc = '247Express'` ở card "Cấu hình" → radio tự chuyển sang "Thư, bưu phẩm". Chọn lại bảng giá `nvc = 'GHN'` → radio tự chuyển về "Hàng hoá".

**AC4:** Agency Admin bấm trực tiếp vào radio (bất kỳ lúc nào, trước hoặc sau khi chọn bảng giá) → radio đó được chọn ngay, không bị ghi đè lại bởi lựa chọn bảng giá trước đó.

**AC5:** Tạo dịch vụ thành công → vào lại trang chi tiết dịch vụ, mục "Loại đơn" hiển thị đúng giá trị đã chọn lúc tạo (không phải giá trị mặc định/gợi ý ban đầu nếu Agency Admin đã đổi tay).

**AC6:** Sửa 1 dịch vụ đã có sẵn — Loại đơn hiển thị và sửa được độc lập, KHÔNG tự đổi theo khi Agency Admin đổi bảng giá đang gắn cho dịch vụ đó (chỉ auto-suy theo bảng giá ở bước TẠO MỚI).

**AC7:** Dịch vụ cũ tạo trước tính năng này (chưa có `sendKind` trong data) — khi xem chi tiết vẫn hiển thị đúng "Loại đơn" suy theo carrier hiện có của dịch vụ đó (GHN → Hàng hoá, 247Express → Thư, bưu phẩm), không hiển thị trống/lỗi.

## Notes

- Đây là bước bổ sung sau khi luồng tạo Dịch vụ/Bảng giá GHN-247Express được gộp thành 1 luồng duy nhất (không còn hỏi carrier qua picker trước khi vào form) — "Loại đơn" là cách hiển thị tường minh cho Agency Admin biết dịch vụ dùng cho việc gì, độc lập với việc chọn Shop ID/bảng giá bên dưới.
- Field `sendKind` trên `Order` (`orderStore.ts`) đã tồn tại từ trước (dùng phân biệt `CreateOrderDrawer`/`CreateLetterDrawer` ở Web Shop) — field cùng tên trên `AgencyService` là khái niệm tương tự nhưng độc lập, không có ràng buộc đồng bộ 2 chiều nào giữa Service và Order ở phạm vi task này.
- Chưa có yêu cầu hiển thị "Loại đơn" ở danh sách Dịch vụ (`AgencyServices.tsx`) — phạm vi task này chỉ áp dụng cho trang tạo mới/chi tiết dịch vụ (`ServiceDetail.tsx`).
