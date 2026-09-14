---
id: GSA-ROUTE-4
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Cấu hình nội & ngoại thành

## User Story

Là GHN Super Admin, tôi muốn phân loại xã/phường Nội thành và Ngoại thành cho từng tỉnh/thành phố theo dạng sidebar + checklist 2 cột, với cơ chế nháp/lưu rõ ràng, để các đại lý có thể tách giá Nội/Ngoại thành khi tạo bảng giá mà không sợ mỗi lần tick nhầm là ảnh hưởng ngay dữ liệu dùng chung.

## User Flow

1. Cuộn đến khối "🏙️ Cấu hình nội & ngoại thành" trong trang "Vùng & Tuyến".
2. Sidebar bên trái liệt kê các tỉnh/thành đã cấu hình; bấm 1 tỉnh để chọn (dòng chọn tô cam, có viền trái cam).
3. Panel bên phải hiện 2 cột "Nội thành" và "Ngoại thành" của tỉnh đang chọn — mỗi cột là 1 checklist TOÀN BỘ xã/phường của tỉnh đó, có ô tìm kiếm riêng và checkbox "Tất cả" ở đầu danh sách.
4. Tick checkbox 1 xã/phường ở cột "Nội thành" → xã/phường đó chuyển sang Nội thành (tự động bỏ tick ở cột "Ngoại thành", vì 1 xã/phường chỉ ở đúng 1 cột).
5. Tick "Tất cả" ở 1 cột → toàn bộ xã/phường của tỉnh chuyển về cột đó.
6. Gõ vào ô tìm kiếm của 1 cột để lọc xã/phường theo tên (không ảnh hưởng tick chọn, chỉ ẩn/hiện dòng).
7. Bấm "+ Thêm tỉnh" ở cuối sidebar → mở danh sách thả lên (phía trên nút) gồm các tỉnh chưa có trong sidebar — bấm chọn 1 tỉnh để thêm (tỉnh mới chưa có xã/phường nào).
8. Bấm X trên 1 dòng tỉnh trong sidebar để bỏ tỉnh đó khỏi danh sách phân biệt Nội/Ngoại thành.
9. Mọi thao tác ở bước 4–8 chỉ sửa bản nháp — thanh hành động cuối khối có 3 nút: "✕ Huỷ bỏ" (bỏ hết thay đổi nháp, quay về dữ liệu đã lưu — disable khi chưa có gì thay đổi), "↻ Thiết lập lại" (tải lại toàn bộ trang, reset về dữ liệu mẫu gốc, luôn bấm được), "💾 Lưu thay đổi" (ghi nháp vào dữ liệu dùng chung thật — disable khi chưa có gì thay đổi).

## System Flow

1. `RouteConfig.tsx` dòng 645–786 render khối "Cấu hình nội & ngoại thành" — khối này độc lập với phần Miền/Tuyến ở trên, và dùng cơ chế DRAFT riêng (`urbanDraft`) thay vì ghi thẳng vào store như 2 khối kia.
2. `UrbanCategoryColumn` (dòng 54–104) — nhận toàn bộ `wards` của tỉnh đang chọn, tự lọc `categoryWards = wards.filter(w => w.isUrban === targetIsUrban)` để đếm số lượng, và `visibleWards` theo ô tìm kiếm cục bộ (`search`, không ảnh hưởng dữ liệu). Mỗi dòng xã/phường là 1 `<label>` chứa checkbox (`checked = w.isUrban === targetIsUrban`) — KHÔNG có nút xoá, KHÔNG có ô thêm xã/phường tự do; danh sách xã/phường là cố định theo địa giới, Super Admin chỉ đổi phân loại.
3. `handleToggleUrbanWardDraft(province, ward)` lật `isUrban` của đúng 1 xã/phường trong `urbanDraft` — vì `isUrban` chỉ có 2 giá trị, tick vào cột này luôn tương đương bỏ tick ở cột kia (không cần thao tác 2 lần).
4. `handleSelectAllUrbanWards(province, isUrban)` — set toàn bộ `wards` của tỉnh về 1 giá trị `isUrban` (dùng cho checkbox "Tất cả" ở đầu mỗi cột).
5. Sidebar: `urbanDraft.map(...)` render từng tỉnh, `onClick` set `selectedUrbanProvince`; nút X gọi `handleRemoveUrbanProvinceDraft(province)` (dòng 277–284, `e.stopPropagation()` để không kích hoạt chọn tỉnh).
6. "+ Thêm tỉnh" (`addProvinceMenuOpen`, dòng 690–725) — nút nằm Ở CUỐI sidebar, bấm mở danh sách thả LÊN TRÊN (`position: absolute; bottom: 100%`) liệt kê `availableUrbanProvinces` (63 tỉnh trừ các tỉnh đã có trong `urbanDraft`); chọn 1 tỉnh gọi `handleAddUrbanProvinceDraft(name)` (dòng 270–275) — thêm vào `urbanDraft` với `wards: []` (KHÔNG có cơ chế nào để thêm xã/phường cho tỉnh mới này sau đó), auto-chọn tỉnh vừa thêm, đóng menu. Nút disable khi hết tỉnh khả dụng.
7. `hasUrbanChanges = JSON.stringify(urbanDraft) !== JSON.stringify(localUrbanConfigs)` (dòng 148) — gate cho nút "Huỷ bỏ" và "Lưu thay đổi".
8. `cancelUrbanDraft` — reset `urbanDraft` về bản sao sâu của `localUrbanConfigs` (dữ liệu đã lưu gần nhất).
9. `commitUrbanDraft` (dòng 308–327) — diff từng tỉnh và từng xã/phường giữa `urbanDraft` và `localUrbanConfigs`, gọi đúng hàm mutate tương ứng của store dùng chung (`addUrbanProvince`/`removeUrbanProvince`/`addUrbanWard`/`removeUrbanWard`/`toggleUrbanWardClassification` trong `routeConfig.ts`) vì store không có hàm "ghi đè toàn bộ"; sau đó đồng bộ lại `localUrbanConfigs` từ store và reset `urbanDraft` theo dữ liệu vừa lưu.
10. Nút "↻ Thiết lập lại" trong thanh hành động gọi `window.location.reload()` — giống nút ở đầu trang, luôn bấm được kể cả khi chưa có thay đổi nháp.

## Acceptance Criteria

**AC1:** Sidebar liệt kê các tỉnh trong `urbanDraft`; chưa có tỉnh nào → hiện "Chưa có tỉnh nào." trong sidebar và "Chọn 1 tỉnh/thành ở danh sách bên trái, hoặc thêm tỉnh mới." ở panel chính.

**AC2:** Chọn 1 tỉnh trong sidebar → panel chính hiện đúng 2 cột "Nội thành" (chấm xanh lá) và "Ngoại thành" (chấm tím), mỗi cột hiện đúng số lượng xã/phường thuộc phân loại đó và checklist toàn bộ xã/phường của tỉnh.

**AC3:** Tick checkbox 1 xã/phường ở cột A → xã/phường đó chuyển sang phân loại của cột A, tự động bỏ tick ở cột kia (không cần 2 thao tác).

**AC4:** Tick checkbox "Tất cả" ở đầu 1 cột → toàn bộ xã/phường của tỉnh đang chọn chuyển về phân loại của cột đó.

**AC5:** Gõ vào ô tìm kiếm của 1 cột → chỉ lọc hiển thị theo tên, không thay đổi phân loại của bất kỳ xã/phường nào.

**AC6:** Xã/phường KHÔNG có nút xoá và KHÔNG có ô nhập để thêm xã/phường mới tự do — danh sách xã/phường của 1 tỉnh chỉ có thể được xác lập khi tỉnh đó được thêm (hiện tại luôn rỗng, chưa có cơ chế nạp thêm qua UI).

**AC7:** Nút "+ Thêm tỉnh" ở CUỐI sidebar (dưới danh sách tỉnh), bấm mở danh sách các tỉnh chưa có (thả lên trên) — chọn 1 tỉnh sẽ thêm tỉnh đó (với danh sách xã/phường rỗng) vào sidebar và tự động chọn tỉnh đó; nút disable khi mọi tỉnh đã được thêm hết.

**AC8:** Bấm X trên 1 dòng tỉnh trong sidebar → bỏ tỉnh đó khỏi bản nháp (không cần xác nhận thêm); nếu tỉnh đang bị xoá đang được chọn, tự động chuyển sang chọn tỉnh đầu tiên còn lại (hoặc không chọn tỉnh nào nếu hết).

**AC9:** Mọi thay đổi ở AC3, AC4, AC7, AC8 chỉ ảnh hưởng bản nháp — dữ liệu dùng chung (đọc bởi Agency Admin) không đổi cho đến khi bấm "Lưu thay đổi".

**AC10:** Nút "✕ Huỷ bỏ" và "💾 Lưu thay đổi" disable khi bản nháp giống hệt dữ liệu đã lưu; "Huỷ bỏ" khôi phục nháp về dữ liệu đã lưu, "Lưu thay đổi" ghi nháp vào dữ liệu dùng chung thật.

**AC11:** Nút "↻ Thiết lập lại" trong thanh hành động luôn bấm được (không phụ thuộc `hasUrbanChanges`), tải lại toàn bộ trang và reset mọi thay đổi trong phiên (Miền, Tuyến, Nội/Ngoại thành) về dữ liệu mẫu gốc.

**AC12:** Khối này hoàn toàn độc lập với phần Miền/Tuyến — thay đổi Nội/Ngoại thành không ảnh hưởng đến miền hay tuyến, và ngược lại.

**AC13:** Agency Admin không có trang cấu hình Nội/Ngoại thành riêng — chỉ xem qua modal hướng dẫn trong trang tạo bảng giá khi bật toggle "Tách Nội thành/Ngoại thành" (xem GSA-ROUTE-5).

## Notes

- **Redesign hoàn toàn** so với bản trước (danh sách card theo chiều dọc, mỗi card 1 tỉnh với dải chip xã/phường + ô nhập tự do) — chuyển sang layout sidebar (danh sách tỉnh) + panel 2 cột checklist, theo đúng mockup người dùng cung cấp.
- **Thay đổi hành vi quan trọng**: xã/phường không còn thêm/xoá tự do được qua UI nữa — chỉ tick chọn phân loại Nội/Ngoại thành cho các xã/phường ĐÃ có sẵn trong dữ liệu seed. Đây là quyết định rõ ràng của Super Admin: "các dòng phường xã đều không có nút huỷ, không được tự ý thêm vào".
- **Hệ quả đã biết, chưa xử lý**: tỉnh mới thêm qua "+ Thêm tỉnh" sẽ có danh sách xã/phường rỗng vĩnh viễn — hiện chưa có cơ chế nào (kể cả nháp) để nạp xã/phường cho tỉnh mới. Cần bổ sung ở sprint sau nếu muốn tỉnh mới thêm hữu dụng thật sự (ví dụ: seed từ 1 danh sách xã/phường chuẩn theo tỉnh).
- **Ghi chú khác biệt ranh giới hành chính (đã biết, chưa cần xử lý)**: "Cấu hình vùng miền" (GSA-ROUTE-2) dùng danh sách 63 tỉnh theo ranh giới CŨ (trước sáp nhập 2025), trong khi khối này dùng tên tỉnh/xã theo ranh giới MỚI (sau sáp nhập 2025) — 2 khối hiện không tham chiếu chéo lẫn nhau nên không phát sinh lỗi, nhưng là điểm cần đồng bộ khi có dữ liệu hành chính chính thức.
- Cơ chế nháp/lưu (`urbanDraft` vs `localUrbanConfigs`/store) khác với 2 khối Miền và Tuyến ở trên — 2 khối đó ghi thẳng vào store dùng chung ngay khi thao tác, không có bước "Lưu thay đổi" riêng.
