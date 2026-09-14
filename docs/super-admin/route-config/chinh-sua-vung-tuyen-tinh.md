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

1. **Chỉnh sửa vùng** (khối "Cấu hình vùng miền"): gõ trực tiếp vào ô tên của 1 vùng đã có để đổi tên (validate trùng tên — xem GSA-ROUTE-2); bấm X trên chip tỉnh để gỡ tỉnh khỏi vùng; chọn tỉnh khác từ dropdown "Chọn Tỉnh/Thành" để gán thêm — tỉnh tự động chuyển từ vùng cũ sang vùng mới nếu đang thuộc vùng khác.
2. **Chỉnh sửa tuyến** (khối "Cấu hình tuyến"): gõ trực tiếp vào ô tên của 1 tuyến thường (không áp dụng cho "Nội Tỉnh" — xem GSA-ROUTE-3) để đổi tên (validate tối thiểu 2 ký tự); bấm chip cặp vùng miền để tick vào tuyến này hoặc bỏ tick — cặp đang thuộc tuyến khác tự động chuyển sang, không cảnh báo.
3. **Chỉnh sửa tỉnh** (khối "Cấu hình nội & ngoại thành"): chọn 1 tỉnh trong sidebar, tick checkbox 1 xã/phường ở cột "Nội thành" hoặc "Ngoại thành" để đổi phân loại (tự động bỏ tick ở cột kia); tick "Tất cả" để đổi cả tỉnh về 1 phân loại; bấm X trên dòng tỉnh trong sidebar để gỡ hẳn tỉnh đó khỏi danh sách phân biệt.
4. Với khối "Nội & Ngoại thành", mọi chỉnh sửa chỉ ảnh hưởng bản nháp cho tới khi bấm "Lưu thay đổi"; với 2 khối "Vùng miền" và "Tuyến", chỉnh sửa có hiệu lực NGAY LẬP TỨC, không qua nháp.

## System Flow

1. **Chỉnh sửa vùng**: `handleRenameRegion(id, name)` → `renameRegion(id, name)`; `handleRemoveProvince`/`handleAssignProvince` → `removeProvinceFromRegion`/`assignProvinceToRegion` — tất cả ghi thẳng vào store dùng chung `routeConfig.ts` ngay khi gọi, không qua state nháp (xem GSA-ROUTE-2).
2. **Chỉnh sửa tuyến**: `handleRenameTuyen(oldName, newName)` → `renameRouteName` — cập nhật MỌI cặp miền đang dùng `oldName` vì tên tuyến là khoá lưu trữ duy nhất; `handleToggleChip` → `setRouteName`/`clearRouteName` — cũng ghi thẳng ngay lập tức (xem GSA-ROUTE-3). Riêng "Nội Tỉnh" không đổi tên được (`if (name === 'Nội Tỉnh') return`).
3. **Chỉnh sửa tỉnh**: `handleToggleUrbanWardDraft`/`handleSelectAllUrbanWards`/`handleRemoveUrbanProvinceDraft` chỉ sửa `urbanDraft` (state cục bộ) — không ghi vào store dùng chung `urbanConfigs` cho tới khi `commitUrbanDraft()` chạy (bấm "Lưu thay đổi", xem GSA-ROUTE-4). Đây là ĐIỂM KHÁC BIỆT quan trọng so với Chỉnh sửa vùng/tuyến (ghi thẳng ngay lập tức, không có bước lưu riêng).
4. Vì 2 khối Vùng miền/Tuyến chia sẻ chung 1 module-level store (không có nháp), chỉnh sửa ở khối này ảnh hưởng NGAY tới khối kia trong cùng lần render — ví dụ đổi tên 1 vùng cập nhật ngay nhãn chip hiển thị ở khối "Cấu hình tuyến" mà không cần thao tác gì thêm.

## Acceptance Criteria

**AC1:** Đổi tên 1 vùng đã có (khối "Cấu hình vùng miền") → tên mới hiển thị NGAY LẬP TỨC ở mọi chip tham chiếu vùng đó trong khối "Cấu hình tuyến", không cần lưu hay thao tác gì thêm.

**AC2:** Gỡ 1 tỉnh khỏi vùng (bấm X trên chip) → tỉnh đó ngay lập tức xuất hiện trở lại trong dropdown "Chọn Tỉnh/Thành" ở MỌI dòng vùng khác (không chỉ dòng vừa gỡ).

**AC3:** Gán 1 tỉnh đang thuộc vùng A sang vùng B (qua dropdown) → tỉnh tự động biến mất khỏi vùng A ngay khi vừa chọn ở vùng B, không cần thao tác gỡ thủ công trước.

**AC4:** Đổi tên 1 tuyến thường (không phải "Nội Tỉnh") → cập nhật tên hiển thị cho MỌI cặp miền đang gán tuyến đó cùng lúc, vì tên tuyến là khoá lưu trữ duy nhất (không phải ID riêng).

**AC5:** Bấm chip 1 cặp miền đang thuộc tuyến X trong dòng tuyến Y (X ≠ Y) → cặp đó ngay lập tức CHUYỂN sang tuyến Y (mất tick ở X, có tick ở Y), không cảnh báo, không giới hạn số lần chuyển qua lại.

**AC6:** Trong khối "Cấu hình nội & ngoại thành", tick đổi phân loại 1 xã/phường → thay đổi CHỈ nằm trong bản nháp, KHÔNG ảnh hưởng dữ liệu Agency Admin đang đọc cho tới khi bấm "Lưu thay đổi" — khác hẳn hành vi tức thời của Chỉnh sửa vùng/tuyến.

**AC7:** Chỉnh sửa vùng và Chỉnh sửa tuyến KHÔNG có nút "Huỷ bỏ" hay bước xác nhận — mọi thay đổi có hiệu lực ngay khi thao tác; cách duy nhất để hoàn tác hàng loạt là bấm "Thiết lập lại" (reload toàn trang, xem GSA-ROUTE-9), khi đó MẤT TẤT CẢ thay đổi trong phiên (kể cả những phần không liên quan).

**AC8:** Xoá 1 tỉnh khỏi sidebar "Nội & Ngoại thành" (bấm X) trong lúc đang chọn xem tỉnh đó → panel chính tự động chuyển sang hiển thị tỉnh đầu tiên còn lại trong danh sách nháp (hoặc màn hình trống nếu hết tỉnh) — vẫn chỉ là thay đổi nháp, có thể hoàn tác bằng "Huỷ bỏ" trước khi lưu.

## Notes

- Story này KHÔNG lặp lại toàn bộ nội dung GSA-ROUTE-2/3/4 — chỉ tập trung vào góc nhìn "chỉnh sửa" (đổi tên, gán lại, đổi phân loại, gỡ) và làm rõ SỰ KHÁC BIỆT quan trọng nhất giữa 2 khối Vùng miền/Tuyến (ghi thẳng ngay lập tức, không có "Huỷ bỏ") và khối Nội & Ngoại thành (qua nháp, có "Huỷ bỏ"/"Lưu thay đổi"). Xem chi tiết đầy đủ từng khối tại GSA-ROUTE-2 (Cấu hình vùng miền), GSA-ROUTE-3 (Cấu hình tuyến), GSA-ROUTE-4 (Cấu hình nội & ngoại thành).
- Đối lập với các story GSA-ROUTE-6/7/8 ("Thêm vùng"/"Thêm tuyến"/"Thêm tỉnh" — tạo MỚI 1 đối tượng), story này tập trung vào chỉnh sửa đối tượng ĐÃ TỒN TẠI.
- "Chỉnh sửa tỉnh" ở đây nghĩa là chỉnh sửa PHÂN LOẠI (Nội/Ngoại thành) và DANH SÁCH tỉnh trong khối Nội & Ngoại thành — KHÔNG phải đổi tên tỉnh (tên tỉnh là dữ liệu địa lý cố định, không sửa được ở bất kỳ đâu trên trang này).
- Vì Chỉnh sửa vùng/tuyến không có bước xác nhận và ghi thẳng ngay lập tức, đây cũng là 1 rủi ro tương tự "Thiết lập lại" (GSA-ROUTE-9) nhưng ở quy mô nhỏ hơn (từng thao tác đơn lẻ thay vì mất toàn bộ phiên) — không có cách "hoàn tác 1 bước" (Ctrl+Z) cho các thao tác này.
