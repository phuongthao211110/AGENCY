---
id: SHOP-ORDER-9
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP][247] Đơn hàng: Chi tiết đơn hàng — nút hành động theo trạng thái

> **Chưa implement** — đây là spec cho hành vi mong muốn, đối chiếu với code hiện tại (`Orders.tsx`, `OrderDetailDrawer`) thì card hành động đang hiện **cùng 1 bộ nút** ("Huỷ đơn"/"Cập nhật", hoặc thêm "Hoàn hàng" nếu đủ điều kiện) cho **mọi tab**, không phân biệt đơn nháp hay đơn đã gửi. Xem mục Notes.

## Bối cảnh

Đơn ở tab **"Đơn nháp"** (`status: 'pending'`, chưa gửi đi đâu cả) và đơn ở tab **"Chờ xử lý"** (`pending_carrier` — đơn Thư đã gửi cho đại lý, đang chờ đại lý chọn hub gửi 247Express) là 2 trạng thái khác bản chất:

- **Đơn nháp** — chưa từng gửi đi, shop còn có thể **chính thức gửi đơn** (hành động "Tạo đơn") ngoài việc sửa/huỷ.
- **Chờ xử lý** — đã gửi cho đại lý rồi, hành động "Tạo đơn"/gửi đơn không còn ý nghĩa (đã gửi), chỉ còn sửa thông tin hoặc huỷ đơn.

Hiện chi tiết đơn không phân biệt 2 trường hợp này — luôn hiện "Huỷ đơn"/"Cập nhật" giống nhau ở mọi tab, khiến đơn nháp thiếu 1 hành động quan trọng (gửi đơn chính thức từ màn chi tiết, không chỉ từ lúc tạo mới).

## User Story

Là Shop, khi mở chi tiết 1 đơn ở tab "Đơn nháp", tôi cần thêm nút **"Tạo đơn"** (bên cạnh "Huỷ"/"Cập nhật") để gửi đơn đi chính thức ngay từ màn chi tiết — không cần quay lại xoá và tạo lại từ đầu. Khi đơn đã chuyển sang "Chờ xử lý" (đã gửi cho đại lý), tôi không cần nút này nữa, chỉ cần "Huỷ"/"Cập nhật" để chỉnh sửa hoặc huỷ đơn đang chờ xử lý.

## User Flow

1. Mở đơn ở tab **"Đơn nháp"** → chi tiết đơn hiện **3 nút**: **"Tạo đơn"** (cam, chính), **"Cập nhật"**, **"Huỷ"**.
2. Bấm **"Tạo đơn"** → đơn được gửi thật (Hàng hoá: dispatch thẳng GHN; Thư: chuyển `dispatchStatus: 'pending_agency'`, gửi cho đại lý) → đơn rời tab "Đơn nháp", xuất hiện ở tab tương ứng ("Chờ bàn giao" cho Hàng hoá, "Chờ xử lý" cho Thư).
3. Mở đơn ở tab **"Chờ xử lý"** (đơn Thư đã gửi cho đại lý, đang chờ đại lý chọn hub) → chi tiết đơn chỉ còn **2 nút**: **"Cập nhật"**, **"Huỷ đơn"** — không có "Tạo đơn" vì đơn đã gửi rồi.

## System Flow (đề xuất)

1. Card hành động trong `OrderDetailDrawer` cần thêm điều kiện theo `order.status`/`dispatchStatus` để quyết định có hiện nút "Tạo đơn" hay không:
   ```ts
   const isDraftOrder = order.status === 'pending' && !isPendingCarrier(order)
   ```
   (dùng đúng logic đã có ở `ordersByTab.draft`, không tạo điều kiện mới).
2. `isDraftOrder === true` → thêm nút **"Tạo đơn"** vào hàng nút, đặt trước "Cập nhật" (giữ "Cập nhật"/"Huỷ" như hiện tại).
3. `isDraftOrder === false` (đơn đã ở `pending_carrier`, hoặc bất kỳ status khác) → giữ nguyên hàng nút hiện tại (không có "Tạo đơn"), không đổi gì.
4. Nút "Tạo đơn" cần 1 hàm submit thật (hiện chưa có) — có thể tái dùng logic dispatch đã có ở `CreateOrderDrawer`/`CreateLetterDrawer` khi bấm "Tạo đơn" lúc tạo mới, áp dụng lại cho đơn đã tồn tại (update `status`/`dispatchStatus` qua `updateOrder()` thay vì `addOrder()`).

## Acceptance Criteria

**AC1:** Đơn ở tab "Đơn nháp" → chi tiết đơn hiện đủ 3 nút: "Tạo đơn", "Cập nhật", "Huỷ".

**AC2:** Đơn ở tab "Chờ xử lý" → chi tiết đơn chỉ hiện 2 nút: "Cập nhật", "Huỷ đơn" — không có "Tạo đơn".

**AC3:** Đơn ở các tab khác (Chờ bàn giao, Đang giao, Đang hoàn hàng, Hoàn tất, Đơn huỷ, Thất lạc - hư hỏng) — không hiện "Tạo đơn" (giữ hành vi hiện tại).

**AC4:** Bấm "Tạo đơn" ở đơn nháp → đơn được gửi thật, chuyển đúng tab, không còn ở "Đơn nháp".

## Notes

- **Đây là spec mới, chưa implement** — hiện tại card hành động trong `OrderDetailDrawer` (`Orders.tsx`) không phân biệt tab, luôn hiện "Huỷ đơn"/"Cập nhật" (+ "Hoàn hàng" nếu `isReturnEligible`) cho mọi trạng thái, không có nút "Tạo đơn" nào ở màn chi tiết.
- Liên quan tới gap đã ghi nhận trước đó: nút "Lưu nháp" trong drawer tạo đơn (`CreateOrderDrawer`/`CreateLetterDrawer`) chưa có `onClick` — feature này (nút "Tạo đơn" ở chi tiết đơn nháp) có thể là hướng bổ sung lối vào thứ 2 để thực sự gửi 1 đơn đã lưu nháp, không phụ thuộc việc sửa gap "Lưu nháp" ở drawer tạo mới.
- Cần xác nhận thêm: nút "Tạo đơn" ở chi tiết đơn Hàng hoá (GHN) có cần bước chọn lại carrier/dịch vụ như lúc tạo mới không, hay dùng luôn thông tin đã lưu trong đơn nháp — chưa có câu trả lời, để ngoài phạm vi AC hiện tại.
