---
id: AGA-ORDER-23
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY][247] Đơn hàng: Thêm huỷ đơn ở trạng thái đã tiếp nhận (danh sách + chi tiết đơn hàng)

## User Story

Là Agency Admin, tôi muốn huỷ được đơn Thư đã gửi qua 247Express nhưng NVC chưa đến lấy hàng (trạng thái "đã tiếp nhận"/Chờ bàn giao), để có thể chủ động dừng đơn khi shop đổi ý hoặc nhập sai, thay vì phải chờ đơn tự trôi qua các bước tiếp theo mới có cách xử lý.

## User Flow

1. Đơn Thư đã được đại lý gửi qua 247Express (chọn hub, xác nhận gửi) → chuyển sang tab "Chờ bàn giao" (trạng thái "Đã tiếp nhận" theo cách gọi của 247Express — NVC đã nhận đơn vào hệ thống nhưng chưa đến lấy hàng thật).
2. Ở danh sách đơn hàng, dòng đơn này có thêm nút "Huỷ đơn" (trước đây không có — trước khi mở rộng, chỉ đơn chưa dispatch mới được huỷ).
3. Chọn nhiều đơn cùng đang "Chờ bàn giao" → thanh bulk-action ở đáy màn hình cũng hiện nút "Huỷ đơn" cho các đơn hợp lệ trong lựa chọn.
4. Mở chi tiết 1 đơn đang "Chờ bàn giao" → nút "Huỷ đơn" xuất hiện cạnh "Cập nhật", giống hệt cách hiện có ở đơn "Đơn nháp"/"Chờ xử lý".
5. Bấm "Huỷ đơn" → xác nhận → đơn chuyển sang "Đơn huỷ", dùng đúng cơ chế huỷ đã có.

## System Flow

1. `isCancellable(o)` (dùng chung cho cả danh sách, bulk-bar, và chi tiết — 1 nguồn duy nhất) hiện chỉ cho phép `o.status === 'pending'` — cần mở rộng thêm điều kiện: `o.sendKind === 'letter' && o.carrierCode === '247EXPRESS' && o.status === 'pickup'` (đơn Thư đã dispatch qua 247Express, đang ở "Chờ bàn giao" — tương ứng trạng thái `DATIEPNHAN` thật của 247Express).
2. KHÔNG mở rộng cho đơn Hàng hoá (GHN) ở status `'pickup'` — phạm vi chỉ đúng đơn Thư/247Express theo đúng tiêu đề "[247]" của story này.
3. Cơ chế huỷ dùng lại nguyên `cancelOrder()` đã có (chỉ set `status: 'cancelled'`) — không cần thêm logic gọi API/thông báo carrier nào khác cho prototype này.
4. Vì `isCancellable` là 1 hàm dùng chung cho cả 3 nơi (row quick-action, bulk-bar `eligibleCancel`, nút trong chi tiết `OrderDetailDrawer`), chỉ cần sửa đúng 1 chỗ là cả "danh sách" và "chi tiết đơn hàng" đều tự động có nút Huỷ đơn ở trạng thái mới này — đúng yêu cầu "danh sách + chi tiết" trong tiêu đề.

## Acceptance Criteria

**AC1:** Đơn Thư đã gửi 247Express, đang ở trạng thái "Chờ bàn giao" (`status: 'pickup'`, `carrierCode: '247EXPRESS'`) → có nút "Huỷ đơn" ở dòng trong danh sách.

**AC2:** Cùng đơn đó, mở chi tiết → có nút "Huỷ đơn" cạnh "Cập nhật", giống hệt UI đã có ở "Đơn nháp"/"Chờ xử lý".

**AC3:** Chọn nhiều đơn Thư 247Express đang "Chờ bàn giao" → thanh bulk-action hiện nút "Huỷ đơn" cho các đơn hợp lệ.

**AC4:** Đơn Hàng hoá (GHN) đang ở "Chờ bàn giao" → KHÔNG có nút "Huỷ đơn" (không mở rộng ngoài phạm vi 247Express).

**AC5:** Đơn Thư 247Express đã qua khỏi "Chờ bàn giao" (đang giao/đã hoàn tất/đã huỷ) → không còn nút "Huỷ đơn" (giữ nguyên giới hạn cũ, chỉ mở rộng thêm đúng 1 trạng thái).

**AC6:** Bấm "Huỷ đơn" và xác nhận → đơn chuyển đúng sang "Đơn huỷ", không lỗi.

## Notes

- "Đã tiếp nhận" trong tiêu đề tương ứng với status thật `DATIEPNHAN` của 247Express (247Express đã nhận đơn vào hệ thống nhưng NVC CHƯA đến lấy hàng) — trong hệ thống hiện tại, khoảnh khắc này được thể hiện qua `status: 'pickup'` (tab "Chờ bàn giao") kết hợp `carrierCode: '247EXPRESS'`, KHÔNG phải giá trị status riêng `'pending'` như bảng mapping đầy đủ ở [AGA-ORDER-18](./mapping-trang-thai-247express.md) mô tả — vì `dispatchOrderToCarrier()` hiện tại set thẳng `status: 'pickup'` ngay khi dispatch, bỏ qua trạng thái trung gian DATIEPNHAN riêng biệt. Đây là suy luận hợp lý dựa theo mapping đã ghi nhận trước đó trong codebase, cần đại lý xác nhận lại đúng ý trước khi implement thật.
- Vì `isCancellable()` được dùng chung cho danh sách (row + bulk) và chi tiết, sửa đúng 1 hàm này là đủ cho toàn bộ story — không cần sửa riêng từng nơi.
- Chưa làm cho đơn Hàng hoá (GHN) — nếu sau này cần mở rộng tương tự cho GHN ở 'pickup', cần story riêng vì phạm vi/rủi ro nghiệp vụ có thể khác (GHN có cơ chế huỷ đơn khác 247Express).
- Đây là doc SPEC (chưa implement) — viết theo yêu cầu trực tiếp, dựa trên khớp nối với `isCancellable()`/mapping trạng thái đã có sẵn trong codebase.
