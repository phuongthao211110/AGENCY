---
id: AGA-CARRIER-13
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: 
status: draft
---

# [AGENCY] Thiết lập NVC - Chi tiết dịch vụ: Thêm phân loại hàng hoá

## User Story

Là Agency Admin (Đại lý), tôi muốn xem và sửa được **Loại đơn** (Hàng hoá / Thư, bưu phẩm) ngay ở trang **chi tiết dịch vụ** (không chỉ lúc tạo mới), để biết và điều chỉnh dịch vụ đang áp dụng cho loại đơn nào bất cứ lúc nào cần, không phải xoá tạo lại dịch vụ.

## User Flow

1. Agency Admin vào "Thiết lập NVC" → tab "Dịch vụ" → mở 1 dịch vụ đã có sẵn
2. Ở chế độ xem (chưa bấm Chỉnh sửa), thấy field **"Loại đơn"** hiển thị đúng giá trị hiện tại của dịch vụ: **Hàng hoá** hoặc **Thư, bưu phẩm**
3. Bấm **"Chỉnh sửa"** → field "Loại đơn" chuyển thành 2 radio button chọn được, y hệt cách hiển thị ở màn tạo dịch vụ mới
4. Agency Admin bấm đổi radio nếu muốn phân loại lại dịch vụ
5. Bấm **"Lưu"** → Loại đơn mới được ghi lại, quay về chế độ xem hiển thị đúng giá trị vừa đổi

## System Flow

1. Ở chế độ xem, `ServiceDetail.tsx` hiển thị `LabelValue` "Loại đơn": `serviceData.sendKind === 'letter' ? 'Thư, bưu phẩm' : 'Hàng hoá'` — dịch vụ cũ chưa có field `sendKind` trong data suy ra theo carrier hiện có (GHN → Hàng hoá, 247Express → Thư, bưu phẩm)
2. Ở chế độ sửa, cùng 1 cặp radio button "Hàng hoá"/"Thư, bưu phẩm" y hệt màn tạo mới — đọc/ghi trực tiếp `editForm.sendKind` qua `setEditForm`
3. Bấm "Lưu" → `updateService(id, { ..., sendKind: editForm.sendKind })` ghi giá trị mới vào `AgencyService.sendKind`, sau đó `setServiceData(editForm)` cập nhật lại view mode
4. **Khác với lúc tạo mới** (nơi `sendKind` tự gợi ý lại theo bảng giá vừa chọn) — ở chi tiết dịch vụ đã có sẵn, đổi bảng giá đang gắn cho dịch vụ **không** tự đổi Loại đơn; Loại đơn chỉ đổi khi Agency Admin bấm trực tiếp vào radio

## Acceptance Criteria

**AC1 — Hiển thị đúng ở chế độ xem:**
- Field "Loại đơn" xuất hiện trong card "Thông tin cơ bản", ngay dưới "Mô tả" và trên "Shop"/"Kết nối Shop ID".
- Đây là text tĩnh (`LabelValue`), không phải nút/pill bấm được — chế độ xem không cho sửa trực tiếp tại đây.
- Giá trị hiển thị đúng 1 trong 2: **"Hàng hoá"** (khi `sendKind === 'goods'`) hoặc **"Thư, bưu phẩm"** (khi `sendKind === 'letter'`) — không hiển thị giá trị nào khác, không để trống.

**AC2 — Chuyển sang radio button khi bấm "Chỉnh sửa":**
- Bấm nút "Chỉnh sửa" ở góc dưới trang → field "Loại đơn" đổi từ text tĩnh sang 2 radio button đặt cạnh nhau (cách nhau 20px): "Hàng hoá" và "Thư, bưu phẩm".
- Radio đang chọn (đúng giá trị `sendKind` hiện tại của dịch vụ) là vòng tròn viền cam đậm `#FF5200` (dạng "nút radio đã chọn", viền dày 5px tạo hiệu ứng chấm đặc ở giữa) kèm quầng sáng nhẹ `rgba(255,82,0,0.12)`, label đi kèm chữ đậm màu đen; radio chưa chọn là vòng tròn viền xám mỏng `#D1D5DB`, label chữ thường màu xám.
- Bấm sang radio khác → radio đó được chọn ngay lập tức (đổi kiểu viền/label), radio cũ bỏ chọn — không cần bấm thêm nút nào khác để "chọn" (không phải checkbox, chỉ chọn được đúng 1 trong 2).
- Layout/kiểu radio giống hệt màn "Dịch vụ mới" (không tạo giao diện riêng cho màn sửa).

**AC3 — Lưu đúng giá trị mới:**
- Sau khi đổi radio, bấm "Lưu" → gọi `updateService(id, { sendKind: <giá trị radio đang chọn> })`.
- Trang chuyển về chế độ xem (`isEditing = false`), field "Loại đơn" hiển thị **đúng giá trị vừa chọn** — không hiển thị giá trị cũ trước khi sửa, không cần tải lại trang mới thấy đúng.
- Giá trị mới phải giữ nguyên nếu Agency Admin rời trang rồi mở lại dịch vụ đó (đã ghi vào `servicesList`, không phải state tạm mất khi unmount).

**AC4 — Đổi bảng giá không ảnh hưởng Loại đơn (khác lúc tạo mới):**
- Điều kiện: đang ở chế độ sửa 1 dịch vụ **đã có sẵn** (không phải tạo mới), Loại đơn hiện tại đang là "Hàng hoá" hoặc "Thư, bưu phẩm" bất kỳ.
- Hành động: đổi giá trị dropdown "Bảng giá (Mặc định)" / "Bảng giá bán cho shop (Mặc định)" ở card "Cấu hình" sang 1 bảng giá khác.
- Kết quả bắt buộc: radio "Loại đơn" **giữ nguyên** lựa chọn trước đó, không tự nhảy sang radio khác — hành vi này khác với màn **tạo mới**, nơi đổi bảng giá sẽ tự set lại Loại đơn theo `nvc` của bảng giá vừa chọn.

**AC5 — Dữ liệu cũ không có `sendKind`:**
- Áp dụng cho dịch vụ có sẵn trong `services.json` từ trước, chưa từng có field `sendKind` (giá trị `undefined`).
- Chế độ xem vẫn hiển thị đúng: dịch vụ carrier `GHN` → "Hàng hoá"; carrier `247Express` → "Thư, bưu phẩm".
- Không hiện chữ "undefined", không để trống, không có lỗi console khi mở trang chi tiết dịch vụ này.

**AC6 — Huỷ không giữ thay đổi tạm:**
- Đang ở chế độ sửa, đã bấm đổi radio (chưa bấm "Lưu") → bấm nút **"Huỷ"**.
- Trang quay về chế độ xem, field "Loại đơn" hiển thị **đúng giá trị đã lưu trước đó** (giá trị trước khi bấm "Chỉnh sửa"), KHÔNG giữ lại lựa chọn radio vừa đổi tạm.
- Mở lại "Chỉnh sửa" lần sau → radio được chọn lại đúng giá trị gốc, không phải giá trị đã bấm rồi huỷ.

## Notes

- Đây là phần bổ sung cho **AGA-CARRIER-12** (chỉ mô tả luồng lúc **tạo mới** dịch vụ) — task này ghi nhận đúng phạm vi **chi tiết/sửa dịch vụ đã có sẵn**.
- Về code: "Loại đơn" ở 2 chế độ (xem: `LabelValue`, sửa: radio button) đã được implement cùng lúc với AGA-CARRIER-12 (chung 1 lần sửa `ServiceDetail.tsx`) — task này không phải code mới, mà là tách story đúng theo phạm vi màn hình để dễ theo dõi/duyệt riêng.
- **[Cập nhật]** UI chọn Loại đơn ban đầu làm dạng pill (nền màu khi active) — đã đổi sang **radio button** (vòng tròn chọn kiểu radio, style tái dùng từ `HubIdTable` cũ) theo yêu cầu chỉnh lại giao diện, áp dụng đồng thời cho cả màn tạo mới (AGA-CARRIER-12) và chi tiết/sửa dịch vụ (story này) vì dùng chung 1 khối JSX.
- Không liên quan đến việc bỏ Hub khỏi Chi tiết dịch vụ (đó là 1 thay đổi khác, không thuộc phạm vi "phân loại hàng" — nếu cần story cho phần đó, viết riêng).
