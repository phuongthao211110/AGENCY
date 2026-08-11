---
id: AGA-ORDER-18
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Mapping trạng thái 247Express thật → `order.status`

## User Story

Là dev team, tôi muốn biết rõ `order.status` trong hệ thống ánh xạ đúng thế nào với trạng thái thật do 247Express trả về, để **không tự bịa thêm trạng thái mới ở phía Agency** — `order.status` phải luôn là 1 phép chiếu trực tiếp (đôi khi gộp thô hơn) của status 247Express trả về, không phải 1 model độc lập.

## Data Mapping — 247Express thật → `order.status`

| Status 247Express | Mô tả thật (247Express) | `order.status` | Tab hiển thị |
|---|---|---|---|
| `DATIEPNHAN` | Đơn hàng vừa tạo qua API hoặc web khách hàng | `pending` | Đơn nháp / Chờ xử lý |
| `DALAYHANG` | Đơn hàng đã được nhân viên giao nhận của 247Express tới lấy hàng | `pickup` | Chờ bàn giao |
| `DANGVANCHUYEN` | Đơn hàng đang được vận chuyển bởi 247 | `in_transit` | Đã bàn giao - Đang giao |
| `DANGDIPHAT` | Đơn hàng đang phát | `in_transit` (gộp chung với trên, không tách thêm) | Đã bàn giao - Đang giao |
| `PHATTHANHCONG` | Đơn hàng đã được phát thành công | `delivered` | Hoàn tất |
| `CHOXULY` | Đơn hàng phát chưa thành công, đang chờ xử lý | `redelivery` | Chờ xác nhận giao lại |
| `CHOCHUYENHOAN` | Đơn hàng **đang được** chuyển hoàn lại cho khách hàng (khách hàng ở đây = API client tạo đơn, tức **đại lý** — không phải người nhận) | `returning` | Đã bàn giao - Đang hoàn hàng |
| `DACHUYENHOAN` | Đơn hàng **đã được** chuyển hoàn lại cho khách hàng (đại lý) | `failed` | Hoàn tất *(xem [AGA-ORDER-17](./hoan-hang-thanh-cong-vao-tab-hoan-tat.md) — trước đây gộp nhầm vào "Đơn huỷ")* |
| `THATLAC` | Đơn hàng bị thất lạc | `lost` | Thất lạc - hư hỏng |
| `HUY` | Đơn hàng đã bị huỷ | `cancelled` | Đơn huỷ |
| `TICHTHU` | Đơn hàng bị tịch thu bởi cơ quan chức năng do vi phạm loại hàng hoá | **Chưa có mapping** | — |

## Acceptance Criteria

**AC1:** `order.status` không có giá trị nào nằm ngoài 10 status kể trên (`pending/pickup/in_transit/returning/redelivery/delivered/cancelled/failed/lost/damaged`) — không tự thêm status mới ở phía Agency chỉ để phân biệt sắc thái (VD: không tách `returning` thành "đang trên đường về" vs "đã tới nơi chờ giao" — 247Express không có 2 status riêng cho việc này, nên Agency cũng không tự thêm).

**AC2:** `CHOCHUYENHOAN` → `returning` và `DACHUYENHOAN` → `failed` là 2 status **khác nhau**, ứng với 2 giai đoạn thật khác nhau (đang hoàn vs đã hoàn xong) — không gộp chung, không tách thêm.

**AC3:** Badge/action "giao hoàn cho shop" (AGA-ORDER-16, `isLetterReturnCase()`) áp dụng cho cả `returning` và `failed` vì cả 2 đều thuộc nhánh hoàn hàng — nhưng **không phải bug cần sửa gấp** nếu wording giống nhau giữa 2 status này, vì bản thân 247Express cũng không cung cấp thêm chi tiết để phân biệt sắc thái "hàng đã tới đại lý hay chưa" trong giai đoạn `CHOCHUYENHOAN`.

## Notes

- Xuất phát từ bảng mô tả status API thật do đại lý gửi (10 status: `DATIEPNHAN, DALAYHANG, DANGVANCHUYEN, DANGDIPHAT, PHATTHANHCONG, CHOXULY, CHOCHUYENHOAN, DACHUYENHOAN, THATLAC, HUY, TICHTHU`), đối chiếu với state machine flowchart 247Express (Start → ACCEPTED → PICKED_UP → IN_TRANSIT → DELIVERING → {DELIVERED | PENDING_FOR_PROCEED → DELIVERING | PENDING_FOR_RETURN → RETURNED | LOST/CONFISCATED | CANCEL} → End).
- **`TICHTHU` (tịch thu) hiện chưa có mapping** — không map vào `lost`/`damaged`/status nào khác vì bản chất khác hẳn (bị cơ quan chức năng tịch thu do vi phạm, không phải thất lạc do vận chuyển). Đây là gap có sẵn, **không tự tạo status mới để lấp gap này** theo đúng yêu cầu — cần đại lý xác nhận hướng xử lý trước khi thêm bất kỳ thay đổi nào.
- Nguyên tắc chung rút ra từ phản hồi trực tiếp: **`order.status` ở Agency phải luôn bắt nguồn từ status carrier thật trả về** (247Express cho đơn Thư, tương tự GHN cho đơn Hàng hoá — xem [AGA-RECON-4](../reconciliation/mapping-trang-thai-doi-soat-ghn.md) cho mapping GHN) — không tự phát sinh thêm trạng thái trung gian ở tầng Agency chỉ để UI mượt hơn.
