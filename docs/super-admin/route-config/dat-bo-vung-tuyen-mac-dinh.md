---
id: GSA-ROUTE-13
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Đặt bộ vùng tuyến làm mặc định

## User Story

Là GHN Super Admin, tôi muốn có thể áp dụng lại 1 bộ vùng tuyến CŨ bất kỳ trong lịch sử làm mặc định (không cần tạo bộ mới trùng y hệt nội dung), để khôi phục nhanh khi cấu hình mới có vấn đề hoặc muốn quay lại 1 mốc trước đó.

## User Flow

1. Ở trang "Danh sách bộ vùng tuyến" (GSA-ROUTE-12), mỗi dòng có 1 toggle "Mặc định" (pill bật/tắt) ở góc phải.
2. Bộ đang áp dụng: toggle LUÔN bật (xanh lá), không bấm được (con trỏ "not-allowed", hover hiện tooltip giải thích không thể tự tắt).
3. Bộ khác (đã khoá): toggle tắt (xám) — bấm vào → hiện hộp thoại xác nhận: "Đặt '[tên bộ]' làm bộ vùng tuyến MẶC ĐỊNH? Toàn bộ ứng dụng (bảng giá, tạo đơn, kiểm tra tuyến...) sẽ dùng ngay dữ liệu của bộ này thay cho bộ đang áp dụng hiện tại."
4. Xác nhận → bộ đó lập tức trở thành "đang áp dụng" (toggle của nó bật lên, toggle của bộ cũ tự tắt) — KHÔNG cần tải lại trang, không tạo thêm bộ mới nào.
5. Huỷ hộp thoại → không có gì thay đổi.

## System Flow

1. `handleSetDefault(versionId, label)` — gọi `window.confirm(...)` trước, chỉ tiếp tục nếu xác nhận.
2. `setActiveRouteConfigVersion(versionId)` — tìm đúng bộ theo `id` trong `routeConfigVersions`, gọi `applyVersionToStore(version)` (đồng bộ `regions`/`routeMatrix`/`urbanConfigs` + cập nhật `activeVersionId`) — KHÔNG tạo phần tử mới trong `routeConfigVersions`, chỉ đổi con trỏ và nội dung store.
3. Sau khi áp dụng thành công, `RouteConfigList` cập nhật lại state `activeVersion` cục bộ (`setActiveVersionState(applied)`) để UI phản ánh ngay, không cần điều hướng lại trang.
4. Toggle dùng chung 1 style pill 36×20 với toggle "bật/tắt thành phần đơn hàng" ở `AgencyDetail.tsx` (đồng bộ visual convention toàn app).

## Acceptance Criteria

**AC1:** Toggle của bộ ĐANG áp dụng luôn ở trạng thái bật, không tương tác được (không có `onClick` hiệu lực).

**AC2:** Toggle của bộ KHÔNG phải đang áp dụng ở trạng thái tắt; bấm vào → luôn hiện hộp thoại xác nhận trước, không áp dụng ngay lập tức khi chưa xác nhận.

**AC3:** Xác nhận → đúng 1 bộ được chọn trở thành "đang áp dụng" (toggle của nó bật), bộ cũ tự động chuyển về tắt — tại MỌI thời điểm chỉ có đúng 1 bộ đang áp dụng.

**AC4:** Huỷ hộp thoại xác nhận (Cancel) → không có gì thay đổi, trạng thái áp dụng giữ nguyên như trước khi bấm.

**AC5:** Đặt 1 bộ CŨ hơn bộ đang áp dụng làm mặc định → KHÔNG tạo thêm bộ mới nào trong `routeConfigVersions` (tổng số bộ trong danh sách không đổi).

**AC6:** Sau khi đặt mặc định, mọi nơi khác trong app đọc `regions`/`routeMatrix`/`urbanConfigs` đều thấy đúng dữ liệu của bộ vừa được đặt mặc định, ngay lập tức không cần tải lại trang.

## Notes

- Hành động này ẢNH HƯỞNG THẬT tới toàn bộ ứng dụng (bảng giá, tạo đơn, kiểm tra tuyến ở Agency Admin/Web Shop đều đọc theo bộ đang áp dụng) — vì vậy bắt buộc có bước xác nhận trước khi áp dụng, không cho phép undo sau khi đã xác nhận (muốn quay lại thì đặt mặc định lại bộ cũ).
- Dùng `window.confirm()` (không phải modal tự vẽ) — đơn giản, phù hợp quy mô prototype; nếu lên production nên thay bằng modal có thiết kế nhất quán hơn với hệ thống.
- Không có "known gap" — dữ liệu áp dụng luôn là dữ liệu thật đã lưu trong `routeConfigVersions`.
