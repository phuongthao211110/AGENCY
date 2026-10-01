---
id: GSA-ROUTE-12
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Danh sách bộ vùng tuyến

## User Story

Là GHN Super Admin, tôi muốn xem lại TOÀN BỘ lịch sử các bộ vùng tuyến đã từng tạo — bộ nào đang áp dụng, bộ nào đã khoá — và xem chi tiết nội dung từng bộ, để đối chiếu/khôi phục lại cấu hình cũ khi cần mà không phải nhớ hoặc dựng lại thủ công.

## User Flow

1. Vào menu "Cấu hình vùng & tuyến" trong sidebar Super Admin → mặc định vào thẳng trang "Danh sách bộ vùng tuyến" (route `/super-admin/route-config`).
2. Tiêu đề "Danh sách bộ vùng tuyến" + mô tả ngắn; góc phải có nút cam "✎ Chỉnh sửa vùng & tuyến" → sang trang chỉnh sửa (GSA-ROUTE-14).
3. Danh sách liệt kê MỌI bộ đã tạo, MỚI NHẤT lên đầu — mỗi dòng hiện: tên bộ ("Bộ mặc định"/"Bộ #N"), toggle "Mặc định" (bật = đang áp dụng — xem GSA-ROUTE-13), thời gian tạo, số vùng miền/số tuyến/số tỉnh có Nội-Ngoại thành, nút "▼ Xem chi tiết".
4. Bấm vào 1 dòng (hoặc nút "Xem chi tiết") → mở rộng hiện đủ 3 khối read-only: "Vùng miền" (badge tên vùng + số tỉnh), "Tuyến" (badge tên tuyến + số cặp), "Nội/Ngoại thành" (badge tên tỉnh + tỷ lệ nội thành/tổng xã-phường) — của ĐÚNG bộ đó, không phải bộ đang áp dụng.
5. Bấm lại dòng đang mở → thu gọn lại.

## System Flow

1. `RouteConfigList()` — seed 1 lần `useState(() => [...routeConfigVersions])` lúc mount, và `useState(() => getActiveRouteConfigVersion())` cho bộ active — mỗi lần điều hướng tới trang (route đổi → remount) tự đọc lại dữ liệu mới nhất từ store, không cần cơ chế subscribe riêng.
2. Render `[...versions].reverse()` để mới nhất lên đầu — KHÔNG đổi thứ tự gốc của `routeConfigVersions` (mảng gốc vẫn theo đúng thứ tự tạo).
3. Mỗi dòng: `routeNameCount = new Set(Object.values(v.routeMatrix)).size` (đếm tên tuyến duy nhất); phần chi tiết Tuyến tính thêm `pairCount` = số cặp vùng miền dùng chung 1 tên tuyến đó.
4. Phần chi tiết Nội/Ngoại thành: mỗi tỉnh hiện `urbanCount = u.wards.filter(w => w.isUrban).length` trên tổng `u.wards.length`.
5. `expandedVersionId` (state) lưu id bộ đang mở rộng — chỉ 1 bộ mở tại 1 thời điểm (bấm dòng khác tự đóng dòng cũ).

## Acceptance Criteria

**AC1:** Danh sách hiện ĐỦ mọi bộ trong `routeConfigVersions`, sắp MỚI NHẤT lên đầu.

**AC2:** Đúng 1 dòng có badge "Đang áp dụng" (tương ứng `getActiveRouteConfigVersion()`), các dòng còn lại đều "Đã khoá".

**AC3:** Mỗi dòng hiện đủ: tên bộ, thời gian tạo (định dạng `vi-VN`), số vùng miền, số tuyến (đếm tên DUY NHẤT), số tỉnh có Nội/Ngoại thành.

**AC4:** Bấm vào 1 dòng → mở rộng hiện đủ 3 khối chi tiết (Vùng miền/Tuyến/Nội-Ngoại thành) của ĐÚNG bộ đó — không lẫn dữ liệu bộ khác; bấm lại → thu gọn.

**AC5:** Bấm nút "Chỉnh sửa vùng & tuyến" → điều hướng đúng sang trang GSA-ROUTE-14 (`/super-admin/route-config/edit`).

**AC6:** Bộ chưa có tỉnh nào phân biệt Nội/Ngoại thành → khối chi tiết hiện "Chưa có tỉnh nào phân biệt Nội/Ngoại thành." thay vì để trống.

## Notes

- Trang này THAY THẾ vị trí route cũ `/super-admin/route-config` (trước đây route này LÀ trang chỉnh sửa trực tiếp) — trang chỉnh sửa giờ chuyển sang route riêng `/super-admin/route-config/edit` (xem GSA-ROUTE-14).
- Chỉ đọc dữ liệu, KHÔNG sửa được gì ở trang này, kể cả bộ đang áp dụng — muốn sửa phải qua trang GSA-ROUTE-14 (tạo bộ mới) hoặc đặt 1 bộ cũ làm mặc định qua GSA-ROUTE-13.
- Toggle bật/tắt mặc định xử lý chi tiết ở GSA-ROUTE-13 (story riêng vì có luồng xác nhận + ảnh hưởng dữ liệu thật toàn app).
- Không có "known gap" nào về nguồn dữ liệu — toàn bộ là dữ liệu Super Admin nhập thật, không dùng công thức demo cố định.
