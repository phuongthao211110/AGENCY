---
id: AGA-RECON-4
jiraKey: 
platform: agency-admin
section: Đối soát & Chuyển khoản
figma: 
status: draft
---

# [AGA] Đối soát: Mapping trạng thái GHN → nhóm xử lý ledger theo đơn

## User Story

Là dev team, tôi muốn biết rõ mỗi trạng thái GHN trong file đối soát thật mang ý nghĩa tài chính gì (có phí không, có COD không), để xây đúng logic ledger theo `orderCode` — quyết định khi nào ghi nhận, khi nào bỏ qua, và khi nào chốt so khớp MATCH/MISMATCH.

## Bối cảnh

1 đơn hàng GHN có thể xuất hiện ở **nhiều phiên đối soát khác nhau** (nhiều file, nhiều kỳ thanh toán) trong suốt vòng đời của nó — vì GHN tính phí lúc lấy hàng/trung chuyển (chưa có COD) và trả COD lúc giao hàng xong (không còn phí, vì đã trừ ở kỳ trước). Vì vậy **không thể nhìn 1 dòng/1 file để biết đủ tổng phí + tổng COD của 1 đơn** — hệ thống cần ledger cộng dồn theo `orderCode` xuyên suốt các phiên.

Bảng dưới đối chiếu với dữ liệu thật từ file `GHN_Phien_Chuyen_Tien_02_06_2026_COD_202606020018_4872823.xlsx` (20.703 dòng, quét toàn bộ để lấy phân bổ trạng thái thật).

## Data Mapping — Trạng thái GHN → Nhóm xử lý ledger

| Trạng thái GHN | Số dòng thật (mẫu) | Tiền COD (1) | Phí (5.1-5.4) | Nhóm xử lý | Hành động ledger |
|---|---|---|---|---|---|
| **Lấy hàng thành công** | 49 | 0 | Có (Phí giao hàng, âm) | Trung gian — đã trừ phí | Ghi nhận phí vào ledger của `orderCode`, đánh dấu "đã có phí, chưa có COD" |
| **Đang trung chuyển** | 6.943 | 0 | Có (Phí giao hàng, âm) | Trung gian — đã trừ phí | Giống "Lấy hàng thành công" — cùng nhóm, chỉ là bước sau |
| **Nhập kho** | 4.821 | 0 | Có (Phí giao hàng, âm) | Trung gian — đã trừ phí | Giống trên |
| **Giao hàng thành công** | 8.862 | Có (đầy đủ) | 0 (đã trừ ở dòng trước) | **Kết thúc — chốt so khớp** | Cộng COD vào ledger → nếu ledger đã có phí từ trước → đủ dữ liệu → chấm MATCH/MISMATCH so với `systemCOD`/`systemFee` |
| **Hoàn hàng thành công** | 16 | 0 | 0 | **Kết thúc — chốt so khớp (nhánh hoàn)** | Không có COD hàng, nhưng có thể có "Giao thất bại - thu tiền" (cột 2) nếu có thu tiền lúc giao thất bại trước khi hoàn → cộng vào ledger, chốt so khớp theo nhánh hoàn hàng |
| **Giao hàng không thành công** | 5 | 0 | Có (thực tế luôn tính phí ship, dù mẫu đọc được trong file này ra 0 — xem Notes) | Trung gian — đã trừ phí | Ghi nhận phí vào ledger, đánh dấu "đã có phí, chưa có COD" — giống nhóm Lấy hàng thành công |
| **Chờ xác nhận giao lại** | 5 | 0 | Có (như trên) | Trung gian — đã trừ phí | Giống trên |
| **Chuyển hoàn** | 1 | 0 | Có (như trên) | Trung gian — đã trừ phí | Giống trên |

## Acceptance Criteria

**AC1:** Ledger theo `orderCode` cộng dồn phí từ nhóm "Trung gian — đã trừ phí": Lấy hàng thành công, Đang trung chuyển, Nhập kho, **Giao hàng không thành công, Chờ xác nhận giao lại, Chuyển hoàn** — cả 6 trạng thái này đều tính phí ship trên thực tế.

**AC2:** Không giả định 1 dòng có `ghnFee = 0` nghĩa là trạng thái đó "không tính phí" — cần đối chiếu qua nhiều lần xuất hiện của cùng `orderCode`/nhiều file, vì phí có thể chưa kịp post ở đúng thời điểm 1 file cụ thể được xuất (xem Notes).

**AC3 (điều chỉnh khi implement — xem Notes):** MATCH/MISMATCH ở item nhóm "kết thúc" chỉ được chấm SAI khi ledger của `orderCode` đó đã nhận đủ **cả 2 vế** và tổng KHÔNG khớp `systemFee`/`systemCOD`. Thiếu vế phí (chưa từng thấy đơn ở phiên trung gian nào) → chấm **MATCH** (không ép "Đang chờ" — trạng thái này đã bị huỷ theo yêu cầu trực tiếp của đại lý, không thêm status/badge mới ngoài MATCH/MISMATCH/NOT_FOUND đã có).

**AC4:** Trạng thái `order.status` (tracking hiển thị cho đại lý) **không được dùng** để quyết định logic ledger — chỉ dùng đúng `ghnStatus` của từng dòng trong file đối soát (xem thêm phân tích ở phiên trước: 2 hệ thống này lệch thời điểm là bình thường).

**AC5 (mới, implement):** Item nhóm "trung gian" tự chấm MATCH/MISMATCH ngay bằng cách so `ghnFee` với `systemFee` của chính dòng đó — không cần đợi vế COD, vì phí đã biết chắc ngay lúc này.

## Notes

- Đây là bảng mapping dựa trên **dữ liệu thật** đọc từ 1 file GHN thật cỡ 20K dòng, kết hợp với xác nhận nghiệp vụ trực tiếp từ đại lý. Cần xác nhận lại nếu GHN đổi format file trong tương lai, hoặc có thêm trạng thái khác chưa xuất hiện trong file mẫu này (VD: "Hàng thất lạc", "Hàng hư hỏng", "Đơn huỷ" — có trong danh sách trạng thái màu ở `AgencyReconciliationDetail.tsx` nhưng không có dòng mẫu thật nào trong file này để xác minh pattern tài chính).
- **Đã sửa 1 lần theo xác nhận nghiệp vụ:** mẫu dữ liệu đọc được cho "Giao hàng không thành công"/"Chờ xác nhận giao lại"/"Chuyển hoàn" trong file mẫu (chỉ 1-5 dòng mỗi loại) đều ra phí = 0 — nhưng đại lý xác nhận trên thực tế cả 3 trạng thái này **luôn tính phí ship**. Kết luận: phí có thể chưa kịp post đúng vào đợt file này được xuất (mẫu quá nhỏ, hoặc đúng lúc rơi vào độ trễ ghi nhận), **không được suy ra "trạng thái này không tính phí" chỉ từ 1 file mẫu** — đây là bài học quan trọng khi verify business rule bằng dữ liệu thật: mẫu nhỏ có thể đánh lừa nếu không đối chiếu thêm với người có nghiệp vụ.
- **GAP còn lại:** modal upload file đối soát (`UploadModal` trong `AgencyReconciliation.tsx`) vẫn đang giả lập hoàn toàn — thanh tiến trình chạy bằng `Math.random()`, **không hề đọc nội dung file thật**. Ledger (mục dưới) đã build và áp dụng cho item MOCK sẵn có, nhưng chưa có đường nối từ "upload file thật" → "sinh item mới vào ledger" — khi nào parse file thật mới cần nối 2 phần này lại.
- **✅ Đã implement (không còn là GAP):** ledger cộng dồn theo `orderCode` xuyên phiên — xem `src/mock-data/reconciliationLedger.ts` (`getReconciliationItems()`). Toàn bộ 3 trang đối soát (`AgencyReconciliation.tsx`, `AgencyReconciliationDetail.tsx`, `AgencyReconciliationShopDetail.tsx`) đã đổi sang đọc `status` từ hàm này thay vì field tĩnh trong `carrier-reconciliation-items.json` — số "Số lệch" ở danh sách phiên giờ khớp đúng với chi tiết phiên (trước đây 2 nơi này đọc 2 nguồn khác nhau, có thể lệch số). Có 1 ví dụ thật minh hoạ đúng bối cảnh nêu trên: đơn `GHN00923459` — phí trừ ở phiên `GHN001` ("Lấy hàng thành công"), COD trả ở phiên `GHN002` ("Giao hàng thành công") — ledger cộng đúng, chấm "Đúng".
- Tham chiếu các phần thảo luận trước: gap "giá vốn GHN" (không có bảng giá vốn/công thức margin an toàn), gap "không có lối vào từ đơn → phiên đối soát", và gap "nhãn Phiên GHN hardcode cho cả phiên 247Express".
