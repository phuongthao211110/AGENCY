---
id: SHOP-ORDER-21
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Đơn hàng: Confirm khi huỷ đơn

## User Story

Là chủ shop, tôi muốn phải xác nhận trước khi huỷ đơn dù huỷ từ nút nhanh trong danh sách hay huỷ hàng loạt nhiều đơn cùng lúc, để không bấm nhầm làm mất đơn ngay lập tức.

## User Flow

1. Ở danh sách đơn (tab "Đơn nháp" hoặc "Chờ xử lý"), mỗi dòng đủ điều kiện huỷ có nút đỏ nhạt "Huỷ đơn" dưới tên người tạo
2. Bấm "Huỷ đơn" → popup xác nhận hiện giữa màn hình (nền mờ phủ toàn trang): tên mã vận đơn + "Thao tác này không thể hoàn tác"
3. Bấm "Không huỷ" → đóng popup, đơn giữ nguyên không đổi gì
4. Bấm "Xác nhận huỷ đơn" → đơn chuyển trạng thái "Đơn huỷ" thật
5. Ngoài ra, tick chọn nhiều đơn (checkbox đầu mỗi dòng) → thanh tối màu "Đã chọn N" nổi cố định ở đáy màn hình, kèm nút X tròn để bỏ chọn
6. Nếu trong lựa chọn có ít nhất 1 đơn đủ điều kiện huỷ → nút "Huỷ đơn" (đỏ nhạt, icon cấm) hiện bên phải thanh
7. Bấm "Huỷ đơn" trên thanh → cùng popup xác nhận (nội dung đổi sang số nhiều "N đơn đã chọn") → xác nhận huỷ tất cả cùng lúc, tự bỏ chọn sau khi xong

## System Flow

1. `isCancellable(o) = o.status === 'pending'` — quyết định nút "Huỷ đơn" nhanh có hiện cho từng dòng hay không, dựa theo TRẠNG THÁI THẬT của đơn thay vì gate cứng theo `activeTab` như trước (trước đây chỉ `activeTab === 'pending_carrier'` mới thấy nút, bỏ sót tab "Đơn nháp")
2. State `cancelOrders: Order[] | null` — dùng chung 1 modal (`CancelOrderModal`) cho cả nút nhanh từng dòng (mảng 1 phần tử) lẫn nút hàng loạt (mảng nhiều phần tử), cùng pattern `dispatchModal` đã có bên Agency Admin cho gửi 247Express
3. `CancelOrderModal` nhận `orders: Order[]`, tự đổi text/nút giữa số ít ("Huỷ đơn hàng", "Xác nhận huỷ đơn") và số nhiều ("Huỷ N đơn hàng", "Xác nhận huỷ N đơn")
4. Xác nhận → `orders.forEach(o => handleCancelOrder(o.id))` (dùng `cancelOrder()` có sẵn từ `orderStore.ts`) cho từng đơn trong mảng; nếu là huỷ hàng loạt thì gọi thêm `setSelected(new Set())` để tự bỏ chọn
5. Thanh "Đã chọn N": `position: fixed, bottom: 0, left: 240` (bằng đúng SIDEBAR_WIDTH) — nổi trên mọi nội dung trang, không cuộn theo bảng; `eligible = selectedOrders.filter(isCancellable)` — đơn không hợp lệ (đã dispatch/đang giao...) tự bị loại khỏi nút bấm, không nằm trong lần huỷ hàng loạt đó
6. Khu vực phân trang được thêm `paddingBottom: 60` khi `selected.size > 0`, tránh bị thanh nổi cố định che mất
7. Checkbox chọn dòng (state `selected: Set<string>`) đã tồn tại sẵn từ trước nhưng trước đây không có action nào đọc giá trị này — lần này là nơi đầu tiên state đó thực sự được dùng

## Acceptance Criteria

**AC1:** Nút "Huỷ đơn" nhanh chỉ hiện cho đơn có `status: 'pending'` — đơn ở trạng thái khác (đã dispatch/đang giao/đã xong...) không có nút này.

**AC2:** Bấm nút → hiện popup xác nhận (nền mờ phủ toàn trang, card trắng giữa màn hình) — KHÔNG huỷ ngay lập tức khi bấm lần đầu.

**AC3:** Bấm "Không huỷ" → đóng popup, đơn giữ nguyên trạng thái, không có gì thay đổi.

**AC4:** Bấm "Xác nhận huỷ đơn" → `order.status` đổi thành `'cancelled'`, đơn chuyển sang tab "Đơn huỷ".

**AC5:** Tick chọn ≥1 đơn (checkbox đầu dòng) → thanh tối màu "Đã chọn N" nổi cố định ở đáy màn hình, kèm nút X tròn để bỏ chọn.

**AC6:** Nếu lựa chọn có ít nhất 1 đơn hợp lệ để huỷ → nút "Huỷ đơn" hiện bên phải thanh; số lượng hợp lệ không hiện trong nhãn nút mà thể hiện qua nội dung popup khi bấm.

**AC7:** Lựa chọn toàn đơn không hợp lệ để huỷ (VD: toàn đơn đang giao) → thanh vẫn hiện "Đã chọn N" nhưng KHÔNG có nút "Huỷ đơn".

**AC8:** Bấm "Huỷ đơn" trên thanh → popup xác nhận đúng nội dung số nhiều, ghi rõ N đơn sẽ bị huỷ.

**AC9:** Xác nhận huỷ hàng loạt → toàn bộ N đơn hợp lệ chuyển `'cancelled'` cùng lúc, thanh "Đã chọn" tự biến mất (lựa chọn tự xoá).

## Notes

- **GAP đã sửa:** trước đây nút huỷ nhanh trong bảng gọi `cancelOrder()` NGAY LẬP TỨC, không qua bất kỳ xác nhận nào — bấm nhầm là mất đơn vĩnh viễn không cách nào cứu lại. Story này thêm popup xác nhận cho đúng chuẩn thao tác phá huỷ dữ liệu (destructive action).
- **GAP đã sửa:** nút huỷ nhanh trước đây chỉ hiện ở tab "Chờ xử lý" (`activeTab === 'pending_carrier'`), bỏ sót hẳn tab "Đơn nháp" — giờ dựa theo trạng thái thật của từng đơn (`isCancellable`) nên đúng cho cả 2 tab.
- Checkbox chọn dòng trong danh sách tồn tại từ trước (state `selected`) nhưng hoàn toàn không gắn hành động nào — dead state. Đây là lần đầu tiên checkbox có tác dụng thật, thông qua thanh "Đã chọn N" + nút huỷ hàng loạt.
- Dùng chung 1 modal cho cả nút nhanh và nút hàng loạt (mảng 1 hoặc nhiều phần tử) thay vì tạo 2 UI riêng biệt — cùng cách tiếp cận với `dispatchModal` bên Agency Admin.
- Drawer chi tiết đơn đã có sẵn cơ chế xác nhận riêng từ trước, không đổi (banner cảnh báo inline, xem [SHOP-ORDER-7](./chi-tiet-huy-cap-nhat-don-hang.md)) — story này chỉ bổ sung 2 lối vào MỚI (nút nhanh trong bảng + nút hàng loạt), dùng popup thay vì banner vì bảng danh sách không có chỗ hiển thị banner cảnh báo dài như trong drawer.
- **REDESIGN** (sau khi story này đã viết lần đầu): thanh "Đã chọn N" đổi từ dạng inline màu xanh nhạt phía trên bảng sang dạng nổi cố định ở đáy màn hình (nền tối, nút X tròn để bỏ chọn thay cho nút chữ "Bỏ chọn", nút hành động dạng button đặc có icon thay vì text-link) — theo đúng yêu cầu "làm giống ảnh tham khảo" (màn Agency Admin thật của GHN). Agency Admin được áp style này trước, Web Shop áp lại y hệt ngay sau đó để 2 platform nhất quán.
- Agency Admin cũng có thanh hành động hàng loạt cùng style (nổi đáy màn hình, nền tối) với 2 nút: "Gửi qua 247Express" (xanh dương) và "Huỷ đơn" (đỏ nhạt) — Agency là platform DUY NHẤT có bulk dispatch vì chỉ đại lý mới thao tác với carrier; Web Shop chỉ có bulk "Huỷ đơn" vì shop không tự chọn carrier.
