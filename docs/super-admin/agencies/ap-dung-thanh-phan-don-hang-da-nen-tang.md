---
id: GSA-DL-11
jiraKey: 
platform: super-admin
section: Quản lý Đại lý
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN
status: draft
---

# [GSA] Đại lý - Chi tiết - Đơn hàng: Áp dụng thành phần đơn hàng ở Web Shop & Agency Admin

## User Story

Là GHN Super Admin, tôi muốn cấu hình "Thành phần đơn hàng" tôi thiết lập cho 1 đại lý được áp dụng THỰC SỰ vào form tạo đơn ở CẢ Web Shop lẫn Agency Admin của đại lý đó, để không phải cấu hình lặp lại ở từng platform.

## User Flow

1. Super Admin tắt 1 thành phần (ví dụ "COD (thu hộ)") cho 1 đại lý ở Chi tiết đại lý (xem GSA-DL-9).
2. Chủ shop thuộc đại lý đó mở "Tạo đơn hàng" ở Web Shop → field "COD" biến mất khỏi form, không cần đăng nhập lại hay refresh gì đặc biệt (chỉ cần điều hướng lại trang trong cùng phiên SPA).
3. Nhân viên đại lý mở "Tạo đơn hàng" ở Agency Admin (tạo đơn hộ shop) → field "COD" cũng biến mất tương tự, đồng bộ với Web Shop.
4. Với đơn Thư (CreateLetterDrawer/CreateLetterDrawerAgency): chỉ 3 trong 9 thành phần áp dụng (Giá trị hàng, Nội dung thư/tài liệu, Ghi chú xem hàng) — các thành phần thuộc phạm vi "Hàng hoá" (COD, Giảm giá, Thu ship khách hàng, Khai giá trị hàng, Giao/Trả 1 phần, Giao thất bại thu tiền) không hiện ở form Thư dù có bật hay tắt.
5. Bật lại thành phần đó → field xuất hiện trở lại ở cả 2 platform, cả loại đơn tương ứng.
6. Riêng "COD" có 1 ràng buộc BỔ SUNG: khi tắt "COD", nút "Khách trả ship" (trong toggle "Ai trả phí ship" ở card "Phí vận chuyển") biến mất khỏi form, CHỈ còn "Shop trả ship" — vì chọn "Khách trả ship" khiến GHN thu hộ CHÍNH phí ship từ người nhận khi giao, tương đương phát sinh 1 khoản thu hộ khi giao hàng dù không đi qua ô "COD" nhập tay. Nếu vẫn cho chọn "Khách trả ship" trong khi COD đã bị tắt, đơn hàng vẫn phát sinh thu hộ trên thực tế — sai với ý định "đại lý này không dùng COD" của Super Admin.

## System Flow

1. `Orders.tsx` (Web Shop) — `CreateOrderDrawer`: `formComponents = agenciesList.find(a => a.id === currentShop.agencyId)?.orderFormComponents ?? DEFAULT_ORDER_FORM_COMPONENTS` — tra theo `agencyId` của SHOP hiện tại (không phải theo shop). Bọc 7 field Hàng hoá bằng `formComponents.X &&` và 1 dòng trong mảng ghi chú bằng spread có điều kiện (`formComponents.viewGoodsNote ? [...] : []`).
2. `Orders.tsx` — `CreateLetterDrawer` (đơn Thư): cùng biến `formComponents` (tính lại theo agencyId), chỉ bọc 3 field áp dụng cho Thư: `goodsValue`, `letterContent`, `viewGoodsNote` — 6 field còn lại (phạm vi thuần Hàng hoá) không tồn tại trong JSX của `CreateLetterDrawer` nên không cần gate.
3. `AgencyOrders.tsx` (Agency Admin) — `CreateOrderDrawer`: `formComponents = agenciesList.find(a => a.id === CURRENT_AGENCY_ID)?.orderFormComponents ?? DEFAULT_ORDER_FORM_COMPONENTS` — tra theo agency đang đăng nhập (`CURRENT_AGENCY_ID`, hằng số demo). Bọc cùng 7 field y hệt cấu trúc Web Shop.
4. `AgencyOrders.tsx` — `CreateLetterDrawerAgency`: `formComponents = agency?.orderFormComponents ?? DEFAULT_ORDER_FORM_COMPONENTS`, bọc `goodsValue`, `letterContent`, `viewGoodsNote`.
5. Vì `agenciesList` là module-level mutable store dùng chung (không phải API riêng từng platform), thay đổi từ Super Admin có hiệu lực NGAY khi Web Shop/Agency Admin đọc lại `agenciesList` ở lần render kế tiếp — không cần bước đồng bộ/deploy riêng, miễn còn trong cùng phiên trình duyệt (SPA).
6. Trước khi thêm tính năng này, `CreateLetterDrawerAgency` (Agency Admin, đơn Thư) THIẾU HẲN field "Ghi chú xem hàng" — đây là bug có thật được phát hiện khi build tính năng (khác biệt với Web Shop vốn đã có field này), đã được bổ sung đầy đủ (state, effect đóng khi click ra ngoài, UI) để 2 platform khớp nhau trước khi gate theo `formComponents.viewGoodsNote`.
7. **Ràng buộc "COD" ↔ "Khách trả ship" (cả 2 platform, `Orders.tsx` và `AgencyOrders.tsx`)**: thêm biến `effectiveFeePayer = formComponents.cod ? feePayer : 'sender'` — dùng biến này (thay vì `feePayer` thô) ở MỌI nơi tính tiền thu hộ (`totalCollect = effectiveFeePayer === 'sender' ? cod + shipCollect : cod + feeShipping`) và khi lưu đơn (`feePayer: effectiveFeePayer` trong `newOrder`, chỉ áp dụng ở Web Shop vì `CreateOrderDrawer` của Agency Admin hiện CHƯA thực sự gọi `addOrder()` khi bấm "Tạo đơn" — giới hạn có sẵn của prototype, không liên quan tới fix này). Nút "Khách trả ship" trong toggle "Ai trả phí ship" bị LỌC BỎ khỏi UI (`.filter((p) => p === 'sender' || formComponents.cod)`) khi `formComponents.cod` là `false` — không chỉ disable mà ẩn hẳn, tránh Super Admin/shop hiểu nhầm vẫn chọn được. Field "Thu ship khách hàng" (`shipCollect`) cũng đổi điều kiện `disabled` từ `feePayer === 'receiver'` sang `effectiveFeePayer === 'receiver'` để nhất quán.

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Web Shop** — Tạo đơn Hàng hoá (`CreateOrderDrawer`, `Orders.tsx`) | Đọc `orderFormComponents` theo `currentShop.agencyId`; ẩn/hiện 7 field phạm vi Hàng hoá theo đúng cấu hình Super Admin đã thiết lập cho đại lý của shop. |
| **Web Shop** — Tạo đơn Thư (`CreateLetterDrawer`, `Orders.tsx`) | Đọc cùng `orderFormComponents`; chỉ ẩn/hiện 3 field áp dụng cho Thư (Giá trị hàng, Nội dung thư/tài liệu, Ghi chú xem hàng). |
| **Agency Admin** — Tạo đơn Hàng hoá (`CreateOrderDrawer`, `AgencyOrders.tsx`) | Đọc `orderFormComponents` theo agency đang đăng nhập; cấu trúc gate y hệt Web Shop, đảm bảo 2 platform luôn đồng bộ hành vi ẩn/hiện field. |
| **Agency Admin** — Tạo đơn Thư (`CreateLetterDrawerAgency`, `AgencyOrders.tsx`) | Bổ sung field "Ghi chú xem hàng" (trước đây thiếu so với Web Shop) rồi gate theo `formComponents.viewGoodsNote`, cùng `goodsValue`/`letterContent`. |

## Acceptance Criteria

**AC1:** Tắt 1 thành phần phạm vi "Hàng hoá" (ví dụ COD) cho 1 đại lý → field đó biến mất khỏi `CreateOrderDrawer` ở CẢ Web Shop (theo `currentShop.agencyId`) lẫn Agency Admin (theo `CURRENT_AGENCY_ID`) của đại lý đó.

**AC2:** Tắt 1 thành phần phạm vi "cả 2" hoặc "Thư" (Giá trị hàng / Nội dung thư, tài liệu / Ghi chú xem hàng) → field tương ứng biến mất khỏi `CreateLetterDrawer` (Web Shop) VÀ `CreateLetterDrawerAgency` (Agency Admin) đồng thời.

**AC3:** 6 thành phần phạm vi thuần "Hàng hoá" (COD, Giảm giá, Thu ship khách hàng, Khai giá trị hàng, Giao/Trả 1 phần, Giao thất bại thu tiền) không xuất hiện ở form tạo đơn Thư (`CreateLetterDrawer`/`CreateLetterDrawerAgency`) dù bật hay tắt ở Super Admin — không có gate nào cho các field này trong 2 component đó vì chúng vốn không tồn tại ở form Thư.

**AC4:** Thay đổi từ Super Admin có hiệu lực ngay khi platform khác điều hướng lại trang (không cần reload F5, không cần đợi deploy) trong cùng phiên trình duyệt.

**AC5:** `CreateLetterDrawerAgency` (Agency Admin, đơn Thư) có đủ field "Ghi chú xem hàng" tương đương Web Shop — bao gồm dropdown chọn chính sách xem hàng, đóng khi click ra ngoài — gate đúng theo `formComponents.viewGoodsNote` giống Web Shop.

**AC6:** Đại lý khác nhau có cấu hình `orderFormComponents` độc lập — form tạo đơn của đại lý A không bị ảnh hưởng bởi cấu hình của đại lý B.

**AC7:** Khi `formComponents.cod` là `false`, nút "Khách trả ship" biến mất khỏi toggle "Ai trả phí ship" ở CẢ Web Shop lẫn Agency Admin — chỉ còn "Shop trả ship" hiển thị (không phải dạng disabled còn nhìn thấy, mà ẩn hẳn khỏi UI).

**AC8:** Với `formComponents.cod = false`, tổng tiền thu hộ khi giao (`totalCollect`) KHÔNG được cộng thêm phí ship vào cho dù state `feePayer` cũ (nếu có) từng là `'receiver'` — hệ thống luôn tính theo `effectiveFeePayer = 'sender'` bất kể giá trị `feePayer` thô đang lưu là gì.

**AC9:** Đơn hàng lưu lại (Web Shop) khi `formComponents.cod = false` phải ghi nhận `feePayer: 'sender'` — không được lưu `'receiver'` dù bằng cách nào đó UI cũ còn cho phép chọn (phòng hờ dữ liệu cũ/race condition).

## Notes

- 2 nơi tra `formComponents` theo agency khác cách nhau: Web Shop tra qua `currentShop.agencyId` (vì Web Shop không biết trực tiếp mình thuộc đại lý nào ngoài qua shop), Agency Admin tra trực tiếp qua agency đang đăng nhập — cùng đọc từ 1 nguồn `agenciesList.orderFormComponents`.
- Phát hiện và sửa 1 bug thật trong lúc build tính năng: `CreateLetterDrawerAgency` (Agency Admin) thiếu field "Ghi chú xem hàng" so với Web Shop — đã bổ sung để đồng bộ trước khi gate theo cấu hình Super Admin (nếu không sửa, dù Super Admin bật `viewGoodsNote`, Agency Admin vẫn không có field này để hiện).
- **Sửa bug nghiệp vụ thật (phát hiện sau khi feature đã lên demo)**: tắt "COD" trước đó CHỈ ẩn ô nhập "COD" — không ngăn được việc chọn "Khách trả ship", khiến GHN vẫn thu hộ phí ship từ người nhận khi giao (`totalCollect = cod + feeShipping` khi `feePayer === 'receiver'`, với `cod = 0` thì vẫn còn `feeShipping > 0`). Đã vá bằng `effectiveFeePayer` — ép về `'sender'` và ẩn hẳn nút "Khách trả ship" khi COD bị tắt, áp dụng đồng thời ở cả `Orders.tsx` (Web Shop) và `AgencyOrders.tsx` (Agency Admin).
- **Giới hạn đã biết, KHÔNG liên quan tới fix này**: `CreateOrderDrawer` (đơn Hàng hoá) ở Agency Admin hiện chưa thực sự gọi `addOrder()` khi bấm "Tạo đơn" (nút chỉ đóng drawer) — nên `feePayer: effectiveFeePayer` mới chỉ áp dụng khi LƯU đơn ở Web Shop; ở Agency Admin, fix chỉ có tác dụng trên UI (ẩn nút, tính đúng `totalCollect` hiển thị) vì chưa có bước lưu thật để kiểm chứng.
- Xem GSA-DL-9 cho UI bật/tắt trên Super Admin, GSA-DL-10 cho ràng buộc riêng của các field phạm vi Thư.
