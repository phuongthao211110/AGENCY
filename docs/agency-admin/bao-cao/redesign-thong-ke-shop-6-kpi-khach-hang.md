---
id: AGA-REPORT-7
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Redesign "Thống kê Shop trên Agency" — khung trang tổng thể

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn trang "Báo cáo" có bố cục tổng thể rõ ràng, nhất quán (header → 6 KPI → 2 card song song → bảng chi tiết theo shop) và 1 bộ lọc kỳ DUY NHẤT ở đầu trang, để dễ định hướng khi xem số liệu mà không phải đoán thứ tự thông tin hay tìm bộ lọc nằm rải rác.

## User Flow

1. Vào menu "Báo cáo" (Agency Admin) — tiêu đề trang là "Báo cáo"; ngay dưới là 1 dòng mô tả gộp chung: "Doanh thu, sản lượng và khách hàng theo từng shop. Cập nhật lúc HH:mm - DD/MM/YYYY" (giờ thật lúc tải trang; hover vào cụm "Cập nhật lúc..." hiện tooltip giải thích mốc "hiện tại" dùng ngày có đơn gần nhất của đại lý).
2. Góc phải header là bộ lọc kỳ duy nhất của trang: nhãn "Thời gian" + dropdown chọn Ngày/Tuần/Tháng — điều khiển 6 KPI (AGA-REPORT-10) và bảng "Chi tiết theo shop" (AGA-REPORT-13); KHÔNG còn đặt ở card "Xu hướng..." như bản trước.
3. Bên dưới header, đúng thứ tự từ trên xuống: khối 6 thẻ KPI (xem AGA-REPORT-10) → 2 card song song "Xu hướng doanh thu & sản lượng" (xem AGA-REPORT-12) và "Khách hàng" (xem AGA-REPORT-11) → bảng "Chi tiết theo shop" (xem AGA-REPORT-13).

## System Flow

1. `anchorDate` = ngày có `createdAt` gần nhất trong toàn bộ đơn của đại lý (`Math.max` trên timestamp) — vì dữ liệu đơn hàng demo là ngày cố định trong quá khứ, không dùng ngày hệ thống thật. Dùng CHUNG cho mọi khối trên trang (AGA-REPORT-10/11/12/13 đều dựa vào giá trị này).
2. State `period` (`useState<PeriodKey>`) khai báo ở component `AgencyReport()` (khung trang này) — điều khiển qua `<select>` ở header, không còn là 3 nút bấm đặt trong card "Xu hướng..." như bản trước; mọi khối con đọc CHUNG 1 state này, không có state `period` riêng ở đâu khác.
3. Toàn bộ trang là 1 component `AgencyReport()` duy nhất (`AgencyReport.tsx`) — các khối con (KPI, chart, card khách hàng, bảng) chỉ là các đoạn JSX/hàm phụ trong CÙNG file, không phải component/route riêng.

## Acceptance Criteria

**AC1:** Trang hiện đúng thứ tự từ trên xuống: header (tiêu đề "Báo cáo" + mô tả gộp "Cập nhật lúc...") → khối 6 KPI (AGA-REPORT-10) → 2 card song song (AGA-REPORT-12 | AGA-REPORT-11) → bảng "Chi tiết theo shop" (AGA-REPORT-13).

**AC2:** Header KHÔNG còn eyebrow "ĐẠI LÝ · VẬN HÀNH SHOP"; dòng mô tả và "Cập nhật lúc..." nằm CHUNG 1 dòng (không tách 2 dòng như bản trước).

**AC3:** Dropdown "Thời gian" ở góc phải header là NƠI DUY NHẤT chọn Ngày/Tuần/Tháng trên toàn trang — không còn bộ chọn kỳ nào khác (kể cả trong card "Xu hướng...").

**AC4:** "Cập nhật lúc" luôn hiện đúng giờ/ngày THẬT tại thời điểm tải trang (không phải giờ cố định); hover vào hiện tooltip giải thích mốc `anchorDate`.

## Notes

- **Redesign lần 2 (2026-09-27)**: gộp eyebrow + mô tả + "Cập nhật lúc" thành 1 dòng, chuyển bộ lọc Ngày/Tuần/Tháng từ card "Xu hướng..." (AGA-REPORT-12) lên dropdown ở header trang này, đổi tiêu đề trang từ "Thống kê Shop trên Agency" về lại "Báo cáo" — theo đúng ảnh mockup UI thật do người yêu cầu cung cấp (khác ảnh mockup layout tham khảo ban đầu dùng để dựng bản đầu tiên).
- **Sau khi tách chi tiết, story này (AGA-REPORT-7) chỉ còn giữ khung trang tổng thể (header, bộ lọc kỳ, thứ tự các khối)** — mọi nội dung chi tiết đã tách hết sang story riêng: AGA-REPORT-10 (khối 6 KPI), AGA-REPORT-11 (card "Khách hàng"), AGA-REPORT-12 (biểu đồ "Xu hướng doanh thu & sản lượng"), AGA-REPORT-13 (bảng "Chi tiết theo shop"). Định nghĩa 2 chỉ số khách hàng nằm ở AGA-REPORT-8/AGA-REPORT-9.
- **Nguồn gốc yêu cầu**: dựa theo mockup dashboard "Thống kê shop trên Agency" (ảnh do người yêu cầu cung cấp) — đã xác nhận qua 2 vòng hỏi lại trước khi implement lần đầu: (1) "BC" trong mockup gốc (ví dụ tên cột "BC Cầu Giấy") vẫn nghĩa là **Shop** — ảnh chỉ dùng để tham khảo LAYOUT, không phải dữ liệu thật; (2) "KH" trong bảng chi tiết theo shop = **KHÁCH HÀNG CUỐI của shop** (người mua/nhận hàng, nhận diện qua `receiverPhone`) — KHÔNG PHẢI đếm số shop như cách hiểu ban đầu ở AGA-REPORT-6.
- **Story này (cùng AGA-REPORT-8 đến 13) THAY THẾ hoàn toàn phần UI mô tả trong AGA-REPORT-2 (biểu đồ cột stacked theo shop), AGA-REPORT-3 (bảng "COD & phí theo shop"), AGA-REPORT-4 (gộp shop dư vào "Khác"), AGA-REPORT-5 (tìm kiếm trong dropdown Shop) và AGA-REPORT-6 (AOV/KH Onboard/KH Re-active tính theo SHOP, không phải theo khách hàng cuối).** Toàn bộ UI/logic mô tả trong 5 story đó đã bị gỡ khỏi `AgencyReport.tsx`. **5 story cũ hiện KHÔNG còn khớp code** — cần cập nhật/đánh dấu "Đã thay thế" khi rà lại, chưa xử lý trong phạm vi các story này.
