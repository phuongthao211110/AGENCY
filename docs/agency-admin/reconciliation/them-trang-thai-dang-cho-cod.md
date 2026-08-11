---
id: AGA-RECON-5
jiraKey: 
platform: agency-admin
section: Đối soát & Chuyển khoản
figma: 
status: reverted
---

# [AGENCY] Đối soát NVC: Improve logic đối soát phiên COD — thêm trạng thái "Đang chờ COD" (ĐÃ HUỶ)

> ⚠️ **Đã huỷ theo yêu cầu trực tiếp của đại lý:** "giữ lại giao diện cũ, ko thêm status đang chờ COD". Toàn bộ thay đổi mô tả dưới đây đã được **revert hoàn toàn** — 15 item mock data trả về đúng `status: "MATCH"` như ban đầu, badge/dropdown "Đang chờ COD" đã gỡ khỏi `ItemRecord.status`, `ITEM_STATUS`, filter dropdown, và công thức "Số lệch" ở cả `AgencyReconciliationDetail.tsx`/`AgencyReconciliation.tsx`. Giữ file này lại làm lịch sử tham khảo (đã thử, không phù hợp nhu cầu thực tế), không xoá.

## User Story

Là Agency Admin (Đại lý), khi xem chi tiết phiên đối soát GHN, tôi muốn phân biệt rõ đơn nào **thật sự sai lệch** với đơn nào **chỉ đang ở giai đoạn giữa vòng đời** (đã trừ phí nhưng chưa giao/hoàn xong nên chưa có COD), để không nhầm lẫn 2 trường hợp này là cùng 1 loại vấn đề.

## User Flow

1. Vào chi tiết 1 "Phiên GHN" — các đơn đang ở trạng thái trung gian (Chờ lấy hàng, Đang trung chuyển, Đang hoàn hàng, Chờ giao lại...) hiện badge **"Đang chờ COD"** (vàng) ở cột Trạng thái, thay vì "Đúng" (xanh) như trước
2. Card "Số lệch" ở đầu trang **không tính** các đơn "Đang chờ COD" vào số lệch — chỉ đếm đơn thật sự Sai/Không tìm thấy
3. Dropdown lọc "Trạng thái" có thêm lựa chọn "Đang chờ COD" để lọc riêng nhóm này

## System Flow

1. Thêm giá trị `'PENDING'` vào type `ItemRecord.status` (`AgencyReconciliationDetail.tsx`, `AgencyReconciliation.tsx`, `AgencyReconciliationShopDetail.tsx`) — trước đây chỉ có `'MATCH' | 'MISMATCH' | 'NOT_FOUND'`
2. Thêm màu badge cho `PENDING` trong `ITEM_STATUS` map: nền `#FFFBEB`, chữ `#B45309`, label "Đang chờ COD"
3. `totalMismatch` ("Số lệch") sửa lại thành `items.filter(i => i.status !== 'MATCH' && i.status !== 'PENDING').length` — áp dụng ở cả 2 nơi tính: `AgencyReconciliationDetail.tsx` (phiên GHN) và `deriveShopSessions()` trong `AgencyReconciliation.tsx` (phiên shop)
4. **Sửa mock data** `carrier-reconciliation-items.json`: 15 item đang có `ghnStatus` thuộc nhóm trạng thái trung gian (Chờ lấy hàng, Đang trung chuyển, Đang hoàn hàng, Chờ giao lại, Giao hàng không thành công) nhưng đang bị gắn nhãn sai `status: "MATCH"` → đổi thành `status: "PENDING"`. Không đổi bất kỳ số tiền nào (COD/phí giữ nguyên, vốn đã đúng = 0 cho COD và có giá trị cho phí) — chỉ sửa đúng NHÃN trạng thái cho khớp bản chất dữ liệu.

## Acceptance Criteria

**AC1:** Đơn có `ghnStatus` thuộc nhóm trung gian (đã xác nhận nghiệp vụ: Lấy hàng thành công, Đang trung chuyển, Nhập kho, Giao hàng không thành công, Chờ xác nhận giao lại, Chuyển hoàn — và các biến thể tương đương trong mock data: Chờ lấy hàng, Đang hoàn hàng, Chờ giao lại) hiển thị badge "Đang chờ COD", không phải "Đúng".

**AC2:** Card "Số lệch" ở phiên GHN và phiên shop đều không tính đơn "Đang chờ COD" vào số lệch.

**AC3:** Dropdown lọc trạng thái có thêm lựa chọn "Đang chờ COD", lọc đúng danh sách khi chọn.

**AC4:** Đơn "Sai" (MISMATCH) và "Không tìm thấy" (NOT_FOUND) không bị ảnh hưởng — giữ nguyên hành vi cũ.

**AC5:** Tổng tiền hiển thị (Tổng COD, Tổng phí DV, Thực nhận, Lợi nhuận ĐL) không đổi so với trước khi sửa — chỉ đổi nhãn trạng thái, không đổi số liệu.

## Notes

- Đây là 1 phần trong scope MVP đã thống nhất (qua `/project-lead`) cho task "Improve logic đối soát phiên COD" — **không** bao gồm: parse file GHN thật (modal upload vẫn đang giả lập `Math.random()`), ledger cộng dồn xuyên phiên theo `orderCode` thật (do items trong prototype này không có nhiều phiên nối tiếp cho cùng 1 đơn để demo), hay bảng giá vốn/margin GHN (đã từ chối trước đó, không fabricate số).
- Cơ sở nghiệp vụ đầy đủ (bảng mapping 8 trạng thái GHN → nhóm xử lý, đã xác nhận trực tiếp với đại lý) xem tại [mapping-trang-thai-doi-soat-ghn.md](./mapping-trang-thai-doi-soat-ghn.md) (AGA-RECON-4).
- `order.status` (tracking hiển thị đại lý) không được dùng ở đây — toàn bộ logic dựa đúng vào `item.ghnStatus` của từng dòng trong dữ liệu đối soát, theo đúng nguyên tắc đã thống nhất.
