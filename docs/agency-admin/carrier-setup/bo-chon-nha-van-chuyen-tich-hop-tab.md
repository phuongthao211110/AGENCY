---
id: AGA-CARRIER-7
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Thiết lập NVC: Bộ chọn nhà vận chuyển tích hợp trong từng tab

## User Story

Là Agency Admin, tôi muốn thấy bộ chọn nhà vận chuyển ngay bên trong từng tab (Kết nối, Dịch vụ, Bảng giá) thay vì một selector chung ở trên tất cả tab để tương tác rõ ràng hơn với dữ liệu của từng NVC trong mỗi ngữ cảnh.

## User Flow

1. Agency Admin truy cập menu "Thiết lập NVC"
2. Mỗi tab (Kết nối / Dịch vụ / Bảng giá) hiển thị bộ chọn NVC "Nhà vận chuyển: GHN | 247Express" ở đầu nội dung tab
3. Agency Admin chọn NVC tại một tab → nội dung tab lọc theo NVC được chọn
4. Agency Admin chuyển sang tab khác → NVC đã chọn được giữ nguyên

## System Flow

1. Khi trang CarrierSetup khởi tạo, `selectedCarrier` mặc định là "GHN"
2. Component `CarrierSelector` được embed vào nội dung của cả 3 tab, đọc và ghi cùng một state duy nhất
3. Khi user chọn NVC khác, `selectedCarrier` cập nhật → tất cả 3 tab tự re-render nội dung tương ứng
4. Tab "Bảng giá" không còn bị disabled khi NVC chưa có Shop ID / ClientHubID; thay vào đó hiển thị banner cảnh báo nếu NVC chưa sẵn sàng

## Acceptance Criteria

**AC1:** Mỗi tab (Kết nối / Dịch vụ / Bảng giá) hiển thị component CarrierSelector riêng với label "Nhà vận chuyển:" và 2 nút: "GHN" | "247Express" ở đầu nội dung tab, bên dưới tiêu đề tab.

**AC2:** Khi Agency Admin chọn NVC trong bất kỳ tab nào, nội dung của tab đó lọc theo NVC được chọn.

**AC3:** Trạng thái NVC đang chọn được chia sẻ giữa các tab (shared state) — chuyển tab không reset lại về GHN.

**AC4:** Tab "Bảng giá" luôn có thể click bất kể NVC đã có Shop ID / ClientHubID hay chưa — không còn bị disabled.

**AC5:** Khi NVC chưa sẵn sàng (GHN chưa có Shop ID kết nối, hoặc 247Express chưa được kích hoạt / chưa có ClientHubID), tab "Bảng giá" hiển thị banner cảnh báo thay vì chặn truy cập.

**AC6:** `CarrierSelector` là một component tái sử dụng, được embed vào cả 3 tab từ cùng một implementation — không duplicate code selector.
