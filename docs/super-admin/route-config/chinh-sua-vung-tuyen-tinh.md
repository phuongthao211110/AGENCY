---
id: GSA-ROUTE-10
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Chỉnh sửa vùng/ tuyến/ tỉnh

## User Story

Là GHN Super Admin, tôi muốn chỉnh sửa các vùng miền, tuyến và tỉnh/thành ĐÃ CÓ (đổi tên, gán lại tỉnh, tick/bỏ tick cặp miền, đổi phân loại Nội/Ngoại thành) trực tiếp trên trang "Vùng & Tuyến" mà không cần xoá đi tạo lại, để việc điều chỉnh cấu hình luôn nhanh và không làm gián đoạn dữ liệu đang dùng.

## User Flow

1. **Chỉnh sửa vùng** (khối "Cấu hình vùng miền"): trước tiên phải bấm "✏️ Chỉnh sửa" ở header khối để vào chế độ Sửa (chỉ có khi bộ là Nháp) — sau đó gõ vào ô tên để đổi tên (validate trùng tên — xem GSA-ROUTE-2); bấm X trên chip tỉnh để gỡ tỉnh; chọn tỉnh từ dropdown để gán thêm — tỉnh tự động chuyển từ vùng cũ sang vùng mới nếu đang thuộc vùng khác.
2. **Chỉnh sửa tuyến** (khối "Cấu hình tuyến"): trước tiên phải bấm "✏️ Chỉnh sửa" ở header khối để vào chế độ Sửa (chỉ có khi bộ là Nháp) — sau đó gõ vào ô tên tuyến thường để đổi tên (không áp dụng cho "Nội Tỉnh" — xem GSA-ROUTE-3); bấm chip cặp vùng miền để tick/bỏ tick — cặp đang thuộc tuyến khác tự động chuyển sang, không cảnh báo.
3. **Chỉnh sửa tỉnh** (khối "Cấu hình nội & ngoại thành"): bấm "✏️ Chỉnh sửa" ở header khối (sửa được ở CẢ bộ Nháp lẫn Hoạt động) — sau đó chọn 1 tỉnh trong sidebar, tick checkbox 1 xã/phường ở cột "Nội thành" hoặc "Ngoại thành" (tự động bỏ tick ở cột kia); tick "Tất cả" để đổi cả tỉnh; bấm X trên dòng tỉnh để gỡ hẳn tỉnh đó.
4. Bộ Nháp: khối "Vùng miền" và "Tuyến" có bản nháp cục bộ sau khi vào chế độ Sửa, cần bấm "Lưu thay đổi" riêng cho từng khối để ghi TẠI CHỖ qua `updateDraftStructure`. Bộ Hoạt động: nút "✏️ Chỉnh sửa" của 2 khối này ẩn hoàn toàn. Khối "Nội & Ngoại thành" cũng qua nháp + Lưu riêng, nhưng sửa được ở CẢ 2 trạng thái.

## System Flow

1. **Chỉnh sửa vùng (Nháp)**: `handleRenameRegion(id, name)`, `handleRemoveProvince`, `handleAssignProvince` — chỉ cập nhật `regionsDraft` (state cục bộ), không ghi ngay vào store. Bấm "Lưu thay đổi vùng miền" → `updateDraftStructure(bundle.id, regionsDraft, matrixDraft)` ghi TẠI CHỖ. Bộ Hoạt động: mọi handler đều `if (isPublished) return`, input/chip disabled.
2. **Chỉnh sửa tuyến (Nháp)**: `handleRenameTuyen(oldName, newName)`, `handleToggleChip` — chỉ cập nhật `matrixDraft` (state cục bộ). Bấm "Lưu thay đổi tuyến" → `updateDraftStructure(bundle.id, bundle.regions, matrixDraft)` ghi TẠI CHỖ. Riêng "Nội Tỉnh" không đổi tên được (`if (name === 'Nội Tỉnh') return`). Bộ Hoạt động: mọi handler đều bị guard, input/chip disabled.
3. **Chỉnh sửa tỉnh**: `handleToggleUrbanWardDraft`/`handleSelectAllUrbanWards`/`handleRemoveUrbanProvinceDraft` chỉ sửa `urbanDraft` (state cục bộ) — không ghi vào store dùng chung `urbanConfigs` cho tới khi `commitUrbanDraft()` chạy (bấm "Lưu thay đổi", xem GSA-ROUTE-4). Đây là ĐIỂM KHÁC BIỆT quan trọng so với Chỉnh sửa vùng/tuyến (ghi thẳng ngay lập tức, không có bước lưu riêng).
4. Vì 2 khối Vùng miền/Tuyến chia sẻ chung 1 module-level store (không có nháp), chỉnh sửa ở khối này ảnh hưởng NGAY tới khối kia trong cùng lần render — ví dụ đổi tên 1 vùng cập nhật ngay nhãn chip hiển thị ở khối "Cấu hình tuyến" mà không cần thao tác gì thêm.

## Acceptance Criteria

**AC1:** Đổi tên 1 vùng đã có (khối "Cấu hình vùng miền") → tên mới hiển thị NGAY LẬP TỨC ở mọi chip tham chiếu vùng đó trong khối "Cấu hình tuyến", không cần lưu hay thao tác gì thêm.

**AC2:** Gỡ 1 tỉnh khỏi vùng (bấm X trên chip) → tỉnh đó ngay lập tức xuất hiện trở lại trong dropdown "Chọn Tỉnh/Thành" ở MỌI dòng vùng khác (không chỉ dòng vừa gỡ).

**AC3:** Gán 1 tỉnh đang thuộc vùng A sang vùng B (qua dropdown) → tỉnh tự động biến mất khỏi vùng A ngay khi vừa chọn ở vùng B, không cần thao tác gỡ thủ công trước.

**AC4:** Đổi tên 1 tuyến thường (không phải "Nội Tỉnh") → cập nhật tên hiển thị cho MỌI cặp miền đang gán tuyến đó cùng lúc, vì tên tuyến là khoá lưu trữ duy nhất (không phải ID riêng).

**AC5:** Bấm chip 1 cặp miền đang thuộc tuyến X trong dòng tuyến Y (X ≠ Y) → cặp đó ngay lập tức CHUYỂN sang tuyến Y (mất tick ở X, có tick ở Y), không cảnh báo, không giới hạn số lần chuyển qua lại.

**AC6:** Trong khối "Cấu hình nội & ngoại thành", tick đổi phân loại 1 xã/phường → thay đổi CHỈ nằm trong bản nháp, KHÔNG ảnh hưởng dữ liệu Agency Admin đang đọc cho tới khi bấm "Lưu thay đổi" — khác hẳn hành vi tức thời của Chỉnh sửa vùng/tuyến.

**AC7:** Chỉnh sửa vùng và chỉnh sửa tuyến trên bộ Nháp có nút "Huỷ bỏ" riêng cho từng khối — bấm Huỷ bỏ trước khi Lưu sẽ reset draft về dữ liệu đã lưu gần nhất. Bộ Hoạt động: nút "✏️ Chỉnh sửa" ẩn, không thể vào chế độ Sửa cho 2 khối Vùng miền/Tuyến.

**AC8:** Chỉnh sửa Vùng miền + Tuyến chỉ hợp lệ khi bộ đang là Nháp — `updateDraftStructure` trả `null` nếu gọi với bộ Hoạt động (guard phía store). Muốn thay đổi cấu trúc của bộ Hoạt động → nhân bản ra bộ Nháp mới (xem GSA-ROUTE-16).

**AC9:** Xoá 1 tỉnh khỏi sidebar "Nội & Ngoại thành" (bấm X) trong lúc đang chọn xem tỉnh đó → panel chính tự động chuyển sang hiển thị tỉnh đầu tiên còn lại trong danh sách nháp (hoặc màn hình trống nếu hết tỉnh) — vẫn chỉ là thay đổi nháp, có thể hoàn tác bằng "Huỷ bỏ" trước khi lưu.

## Notes

- Story này KHÔNG lặp lại toàn bộ nội dung GSA-ROUTE-2/3/4 — chỉ tập trung vào góc nhìn "chỉnh sửa" (đổi tên, gán lại, đổi phân loại, gỡ) và làm rõ sự khác biệt quyền thao tác theo trạng thái Nháp/Hoạt động. Xem chi tiết đầy đủ từng khối tại GSA-ROUTE-2 (Cấu hình vùng miền), GSA-ROUTE-3 (Cấu hình tuyến), GSA-ROUTE-4 (Cấu hình nội & ngoại thành).
- Đối lập với các story GSA-ROUTE-6/7/8 ("Thêm vùng"/"Thêm tuyến"/"Thêm tỉnh" — tạo MỚI 1 đối tượng), story này tập trung vào chỉnh sửa đối tượng ĐÃ TỒN TẠI.
- "Chỉnh sửa tỉnh" ở đây nghĩa là chỉnh sửa PHÂN LOẠI (Nội/Ngoại thành) và DANH SÁCH tỉnh trong khối Nội & Ngoại thành — KHÔNG phải đổi tên tỉnh (tên tỉnh là dữ liệu địa lý cố định, không sửa được ở bất kỳ đâu trên trang này).
- Chỉnh sửa vùng/tuyến giờ qua draft + Lưu riêng: có thể Huỷ bỏ trước khi lưu. Sau khi đã Lưu (ghi TẠI CHỖ qua updateDraftStructure), không có cách hoàn tác từng bước — chỉ có thể nhân bản bộ cũ hơn nếu muốn quay lại.
- Story này cập nhật từ 2 bản cũ: bản đầu mô tả "ghi thẳng vào store ngay lập tức" cho Vùng miền/Tuyến; bản thứ hai có nút Lưu/Huỷ nhưng luôn hiện input khi Nháp — bản hiện tại bổ sung cơ chế Xem/Sửa (phải bấm "✏️ Chỉnh sửa" trước khi sửa được). Xem GSA-ROUTE-14 cho mô tả đầy đủ cơ chế này.
