---
id: AGA-ORDER-19
jiraKey: AGENCY-656
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY][247] Đơn hàng: Chọn nhiều đơn và đẩy qua 247Express

> **Đã implement** — đã verify qua UAT: chọn nhiều đơn hợp lệ ở tab "Chờ xử lý" → nút "Gửi qua 247Express (N)" hiện trong thanh chọn → modal "Đẩy N đơn qua 247Express" → xác nhận → toàn bộ đơn chuyển `dispatched` cùng 1 hub, `selected` reset, danh sách refresh. Luồng gửi từng đơn một (quick action/chi tiết đơn) không bị ảnh hưởng (regression-checked).

## Bối cảnh

Ở tab **"Chờ xử lý"**, mỗi đơn Thư cần đại lý chọn hub rồi gửi qua 247Express. Khi có nhiều đơn cùng chờ, đại lý phải mở từng đơn, chọn hub, xác nhận — lặp lại N lần cho N đơn. Nếu các đơn đó dùng cùng 1 hub xuất phát (thường gặp — cùng 1 đại lý, cùng khu vực), việc lặp lại này tốn thời gian không cần thiết.

## User Story

Là Agency Admin, tôi muốn **tick chọn nhiều đơn Thư cùng lúc** ở tab "Chờ xử lý" và **đẩy tất cả qua 247Express trong 1 lần chọn hub**, để không phải mở từng đơn và chọn hub lặp lại nhiều lần khi có nhiều đơn cần gửi cùng lúc.

## User Flow

1. Ở tab "Chờ xử lý", tick chọn nhiều đơn (checkbox từng dòng, hoặc checkbox đầu bảng để chọn hết trang hiện tại).
2. Thanh "Đã chọn N đơn" hiện thêm nút **"Gửi qua 247Express"** (cam) bên cạnh nút "Bỏ chọn" đã có — chỉ hiện khi trong các đơn đã chọn có ít nhất 1 đơn hợp lệ để gửi (Thư, chưa dispatch).
3. Bấm nút → mở modal chọn hub xuất phát (dùng lại đúng UI modal chọn hub đã có cho luồng 1 đơn) — tiêu đề modal ghi rõ số lượng đơn sẽ bị gửi cùng lúc, VD: *"Đẩy 5 đơn qua 247Express"*.
4. Nếu trong các đơn đã chọn có đơn **không hợp lệ** (đơn Hàng hoá, hoặc đơn Thư đã dispatch rồi) → modal hiện dòng cảnh báo: *"X đơn không hợp lệ sẽ bị bỏ qua"* kèm lý do, chỉ đơn hợp lệ mới được gửi.
5. Chọn hub → bấm xác nhận → toàn bộ đơn hợp lệ trong lựa chọn được gửi qua 247Express cùng hub đó, rời tab "Chờ xử lý", chuyển sang tab dispatch tương ứng.
6. Đóng modal, bỏ chọn hết, danh sách đơn hàng refresh.

## System Flow

1. `dispatchModal` đổi type từ `Order | null` → **`Order[] | null`** — luồng 1 đơn (quick action từng dòng, nút trong chi tiết đơn) giờ truyền `[order]` (mảng 1 phần tử), dùng chung với luồng bulk, không tách modal riêng.
2. Thanh "Đã chọn N đơn": tính `eligible = orders.filter(o => selected.has(o.id)).filter(isPending247)` — nút "Gửi qua 247Express (N)" chỉ hiện khi `eligible.length > 0`. Bấm nút → `setDispatchExcludedCount(selectedOrders.length - eligible.length)` + `setDispatchModal(eligible)`.
3. State mới `dispatchExcludedCount: number` — chỉ > 0 khi mở modal từ bulk action, hiện dòng cảnh báo vàng trong modal khi > 0.
4. Modal tự đổi nội dung theo `dispatchModal.length`: `=== 1` giữ đúng UI/text cũ ("Xác nhận gửi qua 247Express"); `> 1` đổi tiêu đề thành "Đẩy N đơn qua 247Express", mô tả và nút xác nhận cũng đổi theo N.
5. Xác nhận: `dispatchModal.forEach(o => dispatchOrderToCarrier(o.id, '247EXPRESS', 'Agency Admin', dispatchHubId))` — dùng chung hàm `dispatchOrderToCarrier()` đã có, gọi lặp lại cho từng đơn, không cần store function mới.
6. Sau khi gửi xong: `setSelected(new Set())`, đóng modal, `refreshOrders()` — nếu đơn đang mở ở chi tiết (`selectedOrder`) nằm trong batch vừa gửi, tự đóng luôn chi tiết đơn.

## Acceptance Criteria

**AC1:** Chọn ≥ 2 đơn hợp lệ (Thư, chưa dispatch) ở tab "Chờ xử lý" → thanh chọn hiện nút "Gửi qua 247Express".

**AC2:** Chọn toàn đơn không hợp lệ (chỉ đơn Hàng hoá, hoặc Thư đã dispatch) → nút "Gửi qua 247Express" không hiện.

**AC3:** Bấm nút → modal chọn hub hiện đúng số đơn hợp lệ sẽ gửi; nếu có đơn không hợp lệ lẫn trong lựa chọn → hiện rõ số lượng + lý do bị loại.

**AC4:** Xác nhận với 1 hub đã chọn → toàn bộ đơn hợp lệ trong lựa chọn chuyển `dispatchStatus: 'dispatched'`, `carrierCode: '247EXPRESS'`, cùng `dispatchHubId` — không đơn nào bị bỏ sót, không đơn không hợp lệ nào bị gửi nhầm.

**AC5:** Sau khi xác nhận → tất cả đơn đã gửi rời tab "Chờ xử lý", `selected` reset về rỗng, modal đóng, danh sách refresh không cần tải lại trang.

**AC6:** Chọn đơn từ nhiều shop khác nhau trong 1 lần gửi → không bị chặn (hub xuất phát là của đại lý, không phụ thuộc shop nào).

## Notes

- Tham chiếu Jira: [AGENCY-656](https://faboshopteam.atlassian.net/jira/software/projects/AGENCY/boards/152/backlog?selectedIssue=AGENCY-656) — không truy cập được nội dung chi tiết ticket (yêu cầu đăng nhập), implement theo mô tả trực tiếp: "chọn nhiều đơn rồi đẩy đơn qua 247". Cần đối chiếu lại với ticket gốc nếu có chi tiết khác.
- Tái sử dụng tối đa UI/logic đã có cho luồng 1 đơn (modal chọn hub, `dispatchOrderToCarrier()`) — không viết modal riêng, chỉ đổi `dispatchModal` sang kiểu mảng để dùng chung cho cả 1 đơn và nhiều đơn.
- Việc lọc đơn không hợp lệ khỏi batch (AC2-AC4) là điểm quan trọng nhất về an toàn dữ liệu — tránh gửi nhầm đơn Hàng hoá hoặc đơn đã dispatch qua 247Express thêm 1 lần nữa. Đã verify: modal hiện đúng dòng cảnh báo màu vàng khi có đơn bị loại.
- Không đổi luồng gửi từng đơn một hiện có ("Chọn hub & Gửi qua 247Express" trong chi tiết đơn/quick action) — đã regression-check, vẫn hoạt động đúng như trước.
