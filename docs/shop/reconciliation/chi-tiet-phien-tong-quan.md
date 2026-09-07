---
id: SHOP-RECON-3
jiraKey: 
platform: shop
section: Đối soát
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [SHOP] Đối soát: Chi tiết phiên — tổng quan và summary card

## User Story

Là chủ shop, khi xem chi tiết một phiên đối soát, tôi muốn thấy ngay tổng quan số liệu của phiên đó (số đơn, tổng COD, tổng phí dịch vụ, số tiền sẽ nhận về) mà không thấy các chi phí nội bộ của đại lý — phần tôi cần là "nhận về bao nhiêu", không phải "đại lý trả NVC bao nhiêu" hay "lợi nhuận đại lý bao nhiêu".

## User Flow

1. Từ trang danh sách đối soát, bấm "Xem" ở một phiên → sang trang `/shop/reconciliation/:id`.
2. Header: breadcrumb "← Đối soát / {session.id}", tiêu đề "Phiên {id}", badge trạng thái "Chờ thanh toán".
3. Dòng thông tin phiên: "Phiên GHN: {nvcSessionCode} · {khoảng thời gian} · TT: {ngày thanh toán}".
4. 4 summary card: Số đơn, Tổng COD, Tổng phí DV, Nhận về.
5. Phía dưới: ô tìm kiếm và bảng chi tiết đơn (SHOP-RECON-4).

## System Flow

1. `ReconciliationDetail.tsx` (route `/shop/reconciliation/:id`) đọc `session` từ `location.state?.session` — object đã được build sẵn ở trang danh sách và truyền qua router state khi navigate.
2. Nếu không có `location.state?.session` → hiện dòng "Không tìm thấy phiên đối soát. Quay lại" với link về `/shop/reconciliation`.
3. Items của phiên: `getReconciliationItems().filter(it => it.sessionId === session.nvcSessionId && it.shopId === 'SHP001')` — dùng cùng helper `reconciliationLedger.ts`, không đọc thẳng JSON tĩnh, không cần `resolveShopId` cross-reference qua `orders.json` vì Shop chỉ xem đúng 1 shopId cố định.
4. 4 summary card tính từ filtered items:
   - **Số đơn**: `items.length`
   - **Tổng COD**: `sum(item.systemCOD)`, chỉ tính đơn có `ghnStatus` thuộc nhóm thành công (Giao/Hoàn hàng thành công)
   - **Tổng phí DV**: `sum(item.systemFee)` — cộng thẳng field phí hệ thống có sẵn trên item, KHÔNG phải cộng lại từ công thức breakdown 5 loại phụ phí dùng ở bảng chi tiết đơn (SHOP-RECON-4) — 2 cách tính độc lập, chỉ trùng số vì dữ liệu mock đang khớp nhau
   - **Nhận về**: `totalCOD - totalFee` — màu đổi theo dấu: âm → đỏ `#DC2626`, dương → xanh `#16A34A`
5. **Không hiển thị** 2 card "Tổng phí DV (GHN)" và "Lợi nhuận ĐL" mà Agency Admin có — đây là chi phí đại lý trả NVC và lợi nhuận nội bộ của đại lý, không thuộc phạm vi shop được xem. Quyết định có chủ đích, không phải thiếu sót.
6. Badge trạng thái hardcode "Chờ thanh toán" — khớp với trang danh sách, chưa đọc field trạng thái thật.

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Agency Admin** — Chi tiết đối soát shop (`AgencyReconciliationShopDetail.tsx`) | Cùng nguồn dữ liệu `getReconciliationItems()`, cùng helper `TCell`/`feeCell`/`dual`. Agency Admin hiển thị thêm 2 card "Tổng phí DV (GHN)" và "Lợi nhuận ĐL" — phần Web Shop cố ý không hiện. |

## Acceptance Criteria

**AC1:** Trang chi tiết hiển thị đúng breadcrumb "← Đối soát / {session.id}", tiêu đề "Phiên {id}", badge "Chờ thanh toán".

**AC2:** Dòng thông tin phiên hiện đủ: mã phiên GHN (`nvcSessionCode`), khoảng thời gian (period), ngày thanh toán — theo đúng format "Phiên GHN: {code} · {period} · TT: {date}".

**AC3:** Hiển thị đúng 4 summary card: Số đơn, Tổng COD, Tổng phí DV, Nhận về. Không có card thứ 5 hay thứ 6 nào.

**AC4:** Card "Nhận về" đổi màu theo dấu: giá trị âm → đỏ `#DC2626`; giá trị dương → xanh `#16A34A`.

**AC5:** Trang KHÔNG hiển thị "Tổng phí DV (GHN)" hay "Lợi nhuận ĐL" ở bất kỳ vị trí nào (card, bảng, tooltip, text ẩn).

**AC6:** Nếu truy cập trực tiếp qua URL (không có `location.state`) → hiện thông báo "Không tìm thấy phiên đối soát" kèm link quay lại, không crash trang.

**AC7:** Bấm breadcrumb "← Đối soát" → về đúng trang danh sách `/shop/reconciliation`.

## Notes

- Thiết kế theo đúng mẫu `AgencyReconciliationShopDetail.tsx` — cùng helper `TCell`, `feeCell`, `dual` để hiển thị 2 dòng số (dòng trên = số hệ thống dùng tính tiền thật; dòng dưới, chữ nhỏ xám = số GHN tham chiếu để đối chiếu).
- Ranh giới quyền xem rõ ràng: Shop không cần biết đại lý trả NVC bao nhiêu (chi phí wholesale của đại lý) hay đại lý lời bao nhiêu (margin nội bộ). Việc hiện ra các con số này sẽ lộ pricing strategy của đại lý với shop.
- Xem SHOP-RECON-5 về gap reload trang mất dữ liệu do `session` chỉ đi qua router state.
