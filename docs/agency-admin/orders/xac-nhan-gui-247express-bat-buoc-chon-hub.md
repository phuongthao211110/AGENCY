---
id: AGA-ORDER-1
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Xác nhận gửi 247Express: Bắt buộc chọn hub xuất phát

## User Story

Là Agency Admin (Đại lý), khi xác nhận gửi 1 đơn thư sang 247Express, tôi muốn **bắt buộc phải chọn hub xuất phát** trước khi gửi được, để hệ thống biết chắc chắn đơn này xuất phát từ hub nào (vì dịch vụ không còn gắn cứng 1 hub từ trước như trước đây).

## User Flow

Có 2 điểm vào giống nhau, dùng chung 1 modal xác nhận:

1. **Từ danh sách:** Agency Admin vào "Đơn hàng" → tab "Chờ xử lý" → bấm "Gửi qua 247Express" ở cột "Thao tác" của 1 đơn
2. **Từ chi tiết đơn:** Agency Admin bấm vào mã đơn để mở drawer chi tiết → nếu đơn đang chờ xử lý, thấy banner xanh "Đơn thư đang chờ đại lý chọn hub và gửi qua 247Express" cùng nút "Chọn hub & Gửi qua 247Express" ở cuối cột phải (cạnh khối tổng tiền) → bấm nút này
3. Cả 2 cách đều mở modal "Xác nhận gửi qua 247Express", kèm danh sách hub đại lý được cấp (radio chọn 1)
4. Nút "Xác nhận gửi" ở trạng thái **disabled** (xám) cho tới khi chọn 1 hub
5. Chọn 1 hub → nút "Xác nhận gửi" bật lên (xanh dương), bấm để hoàn tất dispatch — nếu đang mở từ drawer chi tiết, drawer tự đóng lại sau khi dispatch thành công (đơn đã chuyển tab, không còn thuộc "Chờ xử lý" nữa)

## System Flow

1. Modal dispatch thêm state `dispatchHubId`, reset về `''` mỗi lần mở modal cho 1 đơn mới
2. Danh sách hub lấy từ `agenciesList.find(a => a.id === CURRENT_AGENCY_ID).clientHubIds` map sang `clientHubs247` (cùng nguồn dữ liệu hub đã dùng ở `ServiceDetail.tsx` trước khi bỏ chọn hub tại đó)
3. Nút "Xác nhận gửi" có `disabled={!dispatchHubId}` — không click được nếu chưa chọn hub
4. Bấm "Xác nhận gửi" → gọi `dispatchOrderToCarrier(order.id, '247EXPRESS', 'Agency Admin', dispatchHubId)` — tham số `dispatchHubId` mới, lưu vào field `dispatchHubId` trên `Order` (`orderStore.ts`)
5. `OrderDetailDrawer` nhận prop `onDispatch247?: () => void` — chỉ truyền vào khi đơn đang mở thoả `isPending247(order)` (`sendKind === 'letter' && dispatchStatus === 'pending_agency'`); bấm nút trong drawer gọi cùng `setDispatchModal(order)` như ở danh sách, tái dùng nguyên modal/state — không có logic chọn hub riêng cho drawer
6. Sau khi xác nhận dispatch thành công, nếu đơn đang xem trong drawer chính là đơn vừa dispatch (`selectedOrder?.id === dispatchModal.id`) → tự đóng drawer (`setDetailOpen(false)`)

## Acceptance Criteria

**AC1:** Modal dispatch hiển thị danh sách hub dạng radio button (tên hub + địa chỉ), lấy đúng theo hub đại lý hiện tại được cấp — giống hệt dù mở từ danh sách hay từ chi tiết đơn.

**AC2:** Nếu đại lý chưa được cấp hub nào → hiển thị "Đại lý chưa được cấp hub 247Express nào — liên hệ Super Admin", không có hub nào để chọn.

**AC3:** Nút "Xác nhận gửi" disabled (nền xám, không click được) khi chưa chọn hub nào.

**AC4:** Chọn 1 hub → nút "Xác nhận gửi" chuyển sang nền xanh dương, bấm được, dispatch thành công lưu đúng `dispatchHubId` đã chọn vào đơn hàng.

**AC5:** Đóng modal (bấm "Huỷ" hoặc mở đơn khác) → lần mở tiếp theo, hub đã chọn trước đó KHÔNG được giữ lại (reset về chưa chọn).

**AC6:** Trong drawer chi tiết đơn, nút "Chọn hub & Gửi qua 247Express" **chỉ hiển thị khi đơn đang ở trạng thái "Chờ xử lý"** (`sendKind === 'letter'` và `dispatchStatus === 'pending_agency'`) — đơn hàng hoá hoặc đơn thư đã dispatch rồi thì không thấy nút này.

**AC7:** Dispatch thành công từ drawer chi tiết → drawer tự đóng, quay về danh sách; đơn đã biến mất khỏi tab "Chờ xử lý" và xuất hiện đúng ở tab "Chờ bàn giao".

## Notes

- Đây là hệ quả trực tiếp của việc bỏ gắn cứng hub vào Dịch vụ (`ServiceDetail.tsx`) — hub giờ chỉ còn được quyết định duy nhất tại bước dispatch này.
- `dispatchHubId` là field mới trên `Order`, optional (`?`), không ảnh hưởng dữ liệu đơn GHN (chỉ dùng khi `carrierCode === '247EXPRESS'`).
- Modal xác nhận + chọn hub là **1 component dùng chung** cho cả 2 điểm vào (danh sách và chi tiết đơn) — không có 2 bản logic riêng biệt, tránh lệch hành vi giữa 2 nơi.
