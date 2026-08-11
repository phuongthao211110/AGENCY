---
id: AGA-RECON-8
jiraKey: 
platform: agency-admin
section: Đối soát & Chuyển khoản
figma: 
status: reverted
---

# [AGENCY] Đối soát NVC: Badge "Lệch tracking" — so sánh CÙNG THỜI ĐIỂM giữa hệ thống và file (ĐÃ HUỶ)

> ⚠️ **Đã huỷ:** đại lý xem qua bản demo (badge "Lệch tracking" trên đơn GHN00223457) và yêu cầu gỡ bỏ, giữ nguyên giao diện gốc — không còn badge nào ngoài 3 trạng thái Đúng/Sai/Không tìm thấy như trước. Đã revert hoàn toàn: gỡ logic `trackingMismatch`/`asOfLog`, gỡ JSX badge, gỡ import `ordersData` khỏi `AgencyReconciliationDetail.tsx`. Giữ file lại làm lịch sử tham khảo (đã thử theo đúng yêu cầu ban đầu của đại lý, nhưng khi thấy demo thật thì không muốn giữ), không xoá.

## User Story

Là Agency Admin (Đại lý), tôi muốn thấy **ngay trong bảng chi tiết phiên NVC** dòng nào có trạng thái hệ thống — tính đến đúng ngày phiên này được xuất — khác với trạng thái GHN đang báo trong file, để phát hiện đúng lúc GHN báo cáo sai/chậm mà **không bị nhiễu** bởi việc đơn giao SAU ngày phiên (chuyện bình thường).

## User Flow

1. Vào chi tiết 1 "Phiên GHN" — cột "Trạng thái GHN" của đơn có xung đột hiện thêm badge đỏ nhỏ **"Lệch tracking"** ngay cạnh label trạng thái GHN, nền cả ô tô đỏ nhạt
2. Badge hiện ngay khi phát hiện lệch — không chờ ngưỡng số ngày như tab "Quá hạn đối soát"
3. Di chuột vào badge → tooltip nêu rõ mốc thời gian: "Tính đến ngày [ngày phiên], hệ thống đã ghi nhận đơn giao thành công — nhưng file đối soát vẫn báo trạng thái này"

## System Flow — so sánh CÙNG THỜI ĐIỂM (không so với trạng thái sống hiện tại)

**Vấn đề của bản đầu tiên:** so `order.status` (trạng thái SỐNG, luôn là mới nhất) với `ghnStatus` của file → báo lệch cho MỌI đơn giao sau ngày phiên, kể cả khi đó là chuyện hoàn toàn bình thường (file cũ hơn tracking là lẽ tự nhiên).

**Cách sửa — tra lại lịch sử (`order.log[]`) tại đúng thời điểm phiên được xuất:**

1. Lấy `session.paymentDate` (ngày phiên này được xuất) làm mốc thời gian tham chiếu
2. Với mỗi item, tra `orderCode` → tìm đơn tương ứng trong `orders.json`
3. Lọc `order.log[]`, chỉ giữ các mốc có `updated_date <= session.paymentDate` (23:59:59 ngày đó), lấy mốc **mới nhất trong số đó** → đây là "hệ thống biết gì về đơn này, TÍNH ĐẾN đúng ngày phiên" (không phải biết gì NGAY BÂY GIỜ)
4. So `asOfLog.status_name` với `ghnStatus` của file — chỉ báo lệch nếu tại **đúng thời điểm đó**, hệ thống đã ghi nhận giao thành công mà file vẫn chưa
5. Kết quả: đơn giao SAU ngày phiên → tra lịch sử tại ngày phiên sẽ đúng là "chưa giao" → **không báo** (đúng, vì tại thời điểm đó thật sự chưa giao). Đơn giao TRƯỚC ngày phiên mà file vẫn chưa cập nhật → **mới báo** (đúng là GHN sai/chậm thật)
6. Demo: đơn `GHN00223457` (ORD004) — chỉnh lại cho khớp mốc thời gian: tạo đơn 05/03/2024, giao thành công 10/03/2024 — **cả 2 đều TRƯỚC** ngày phiên GHN001 (15/03/2024) — nên tra lịch sử tại 15/03 vẫn thấy "đã giao", trong khi file vẫn báo "Chờ lấy hàng" → lệch thật, badge hiện đúng

## Acceptance Criteria

**AC1:** Tra lịch sử `order.log[]` của đơn tính đến đúng `session.paymentDate` cho ra trạng thái "đã giao thành công", nhưng `ghnStatus` của item KHÔNG thuộc nhóm thành công → hiện badge đỏ "Lệch tracking".

**AC2:** Đơn giao thành công SAU ngày phiên (`updated_date` của mốc giao > `session.paymentDate`) → tra lịch sử tại ngày phiên KHÔNG cho ra "đã giao" → không báo badge, dù trạng thái SỐNG hiện tại của đơn là gì.

**AC3:** Đơn có `ghnStatus` đã thuộc nhóm thành công → không hiện badge dù lịch sử ra sao.

**AC4:** Badge độc lập hoàn toàn với "Trạng thái ĐS" (MATCH/MISMATCH/PENDING/NOT_FOUND) và "Số lệch" — không cộng dồn, không ảnh hưởng lẫn nhau.

**AC5:** Tooltip nêu rõ đúng ngày mốc so sánh (ngày phiên), không chỉ nói chung chung "hiện tại".

## Notes

- Đây là câu trả lời trực tiếp cho câu hỏi "có cách nào so sánh cùng thời điểm để lấy đúng COD/phí không" — **có**: dùng lịch sử `order.log[]` làm "cỗ máy thời gian", tra lại đúng trạng thái hệ thống biết tại thời điểm file được xuất, thay vì so với trạng thái sống hiện tại. Cách này giảm nhiễu đáng kể so với bản đầu tiên mà vẫn giữ được tính "báo ngay, không chờ ngưỡng ngày" mà đại lý yêu cầu.
- Vẫn còn 1 nguồn nhiễu nhỏ: nếu GHN chỉ đơn thuần trễ báo cáo NGAY SÁT ngày phiên (VD hệ thống ghi nhận giao thành công 1-2 ngày trước ngày phiên, file chưa kịp cập nhật) → vẫn có thể báo, dù không nghiêm trọng bằng cách so trạng thái sống. Nếu muốn giảm tiếp, có thể cộng thêm vài ngày đệm vào mốc so sánh (tương tự tinh thần ngưỡng ở tab Quá hạn) — chưa làm vì đại lý chưa yêu cầu.
- Đây là lựa chọn **bổ sung**, không thay thế tab **"Quá hạn đối soát"** (AGA-RECON-6, dùng ngưỡng 30 ngày, nhìn xuyên suốt mọi phiên chứ không chỉ 1 phiên) — cả 2 cùng tồn tại song song, phục vụ 2 mục đích khác nhau.
- Liên quan: [tong-quan-luong-doi-soat.md](./tong-quan-luong-doi-soat.md) (AGA-RECON-7).
