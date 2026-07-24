---
id: AGA-CARRIER-14
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: 
status: draft
---

# [AGENCY] Thiết lập NVC - Danh sách dịch vụ: Thêm phân loại hàng hoá

## User Story

Là Agency Admin (Đại lý), tôi muốn thấy được **Loại đơn** (Hàng hoá / Thư, bưu phẩm) của từng dịch vụ ngay tại danh sách "Dịch vụ", để nhanh chóng phân biệt dịch vụ nào dùng cho loại đơn gì mà không cần mở chi tiết từng dịch vụ.

## User Flow

1. Agency Admin vào "Thiết lập NVC" → tab "Dịch vụ"
2. Ở mỗi dòng dịch vụ trong danh sách, cạnh tên dịch vụ hiện thêm 1 tag **"Loại đơn"**: **Hàng hoá** hoặc **Thư, bưu phẩm**
3. Agency Admin nhìn danh sách là biết ngay dịch vụ nào xử lý loại đơn gì, không cần bấm vào từng dịch vụ để xem chi tiết

## System Flow

1. `AgencyServices.tsx` → component `ServiceRow` (cột "Dịch vụ đại lý") thêm 1 tag ngay cạnh `svc.name`, đọc `svc.sendKind`
2. Dữ liệu dịch vụ cũ chưa có field `sendKind` (giá trị `undefined`) — suy ra hiển thị theo carrier hiện có: `GHN` → Hàng hoá, `247Express` → Thư, bưu phẩm (cùng quy tắc fallback đã dùng ở `ServiceDetail.tsx`/`ShopCreate.tsx`/`ShopDetail.tsx`)
3. Style tag tái sử dụng đúng pattern `SendKindTag` đã làm ở `ShopCreate.tsx`/`ShopDetail.tsx`: "Thư" nền tím nhạt `#F5F3FF`, chữ/viền tím `#7C3AED`/`#DDD6FE`; "Hàng hoá" nền xám `#F3F4F6`, chữ/viền xám `#4B5563`/`#E5E7EB`
4. Không thêm cột header mới — tag đặt trong cột "Dịch vụ đại lý" hiện có (cùng dòng với tên dịch vụ), giữ nguyên các cột khác: "Gói kết nối", "Shop", "Bật/Tắt"

## Acceptance Criteria

**AC1 — Tag hiển thị đúng vị trí và giá trị:**
- Mỗi dòng trong danh sách "Dịch vụ" hiện tag "Loại đơn" ngay cạnh tên dịch vụ (cùng hàng với tên, phía trên mã dịch vụ).
- Giá trị tag đúng 1 trong 2: **"Hàng hoá"** (`sendKind === 'goods'`, tag nền/chữ xám) hoặc **"Thư, bưu phẩm"** (`sendKind === 'letter'`, tag nền/chữ tím) — không có giá trị nào khác.

**AC2 — Dữ liệu cũ không lỗi:**
- Dịch vụ có sẵn trong `services.json` chưa từng có field `sendKind` vẫn hiển thị đúng tag, suy theo carrier hiện có (GHN → Hàng hoá, 247Express → Thư, bưu phẩm).
- Không hiện "undefined", không để trống, không lỗi console khi tải danh sách.

**AC3 — Không ảnh hưởng nội dung khác trong danh sách:**
- Cột "Gói kết nối" (đếm gói cước GHN), "Shop" (số shop đang áp dụng), "Bật/Tắt" (toggle enabled) giữ nguyên hành vi và vị trí như trước khi thêm tag này.
- Việc thêm tag không làm đổi thứ tự cột, không đẩy layout lệch giữa các dòng dịch vụ.

**AC4 — Tìm kiếm không đổi hành vi:**
- Ô "Tìm kiếm" ở đầu trang vẫn lọc theo tên/mã dịch vụ như cũ, không lọc/gợi ý theo "Loại đơn".

## Notes

- Đây là phần còn thiếu đã được ghi chú trước trong **AGA-CARRIER-12**: *"Chưa có yêu cầu hiển thị 'Loại đơn' ở danh sách Dịch vụ (`AgencyServices.tsx`) — phạm vi task đó chỉ áp dụng cho trang tạo mới/chi tiết dịch vụ."* Task này bổ sung đúng phần còn thiếu đó.
- **[Cập nhật] Đã implement.** Thêm `SendKindTag` (tag tĩnh, không phải radio) ngay trong `ServiceRow` (`AgencyServices.tsx`), cạnh `svc.name` — đúng như spec ban đầu, dùng chung style với `SendKindTag` ở `ShopCreate.tsx`/`ShopDetail.tsx`. Không thêm cột header mới, không đổi các cột "Gói kết nối"/"Shop"/"Bật/Tắt". Đã verify qua trình duyệt: tag hiển thị đúng cho cả dịch vụ đã có `sendKind` lẫn dữ liệu cũ suy theo carrier.
- Từng có badge carrier (GHN/247Express) ở vị trí tương tự trong danh sách này trước đây, đã bị bỏ theo yêu cầu "bỏ nhãn carrier ở màn hình dịch vụ" — tag "Loại đơn" ở đây đóng vai trò thay thế thông tin phân loại đó, không phải khôi phục lại carrier badge.
