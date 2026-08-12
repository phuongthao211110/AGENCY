---
id: WS-LOGIN-1
jiraKey:
platform: shop
section: Login / Logout
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Đăng ký shop mới (self-service)

## User Story

Là chủ shop chưa có tài khoản, tôi muốn tự đăng ký shop bằng mã đại lý được cung cấp riêng, để có thể bắt đầu dùng hệ thống ngay mà không cần đại lý tạo tài khoản hộ, và đại lý không phải lộ danh sách đối tác của mình cho người ngoài.

## User Flow

1. Ở trang Đăng nhập (`/shop/login`), bấm link "Chưa có tài khoản? Đăng ký ngay" → sang `/shop/register`.
2. Điền form: Tên shop, Họ tên chủ shop, Số điện thoại, Địa chỉ, **Mã đại lý** (do đại lý muốn hợp tác cung cấp riêng, không phải chọn từ danh sách công khai), Tên đăng nhập, Mật khẩu, Xác nhận mật khẩu.
3. Bấm "Đăng ký" → tài khoản active ngay, vào thẳng `/shop/orders` (không có bước chờ duyệt).
4. Từ trang đăng ký, có link "Đã có tài khoản? Đăng nhập" → quay lại `/shop/login`.

## System Flow

1. **Không hiện danh sách/dropdown tên đại lý công khai** — thay bằng 1 ô nhập text "Mã đại lý", đối chiếu với `agency.code` (field có sẵn, VD `HNC` cho AGN001) trong số các đại lý `status === 'active'`, so khớp không phân biệt hoa/thường.
2. Mã sai/không khớp bất kỳ đại lý active nào → lỗi chung **"Mã đại lý không hợp lệ"** — không gợi ý tên đại lý, không cho biết mã có tồn tại nhưng đại lý đang `inactive` hay không (tránh dò được thông tin đại lý qua thử sai).
3. Submit gọi `addShop()` ([shopStore.ts](../../../src/mock-data/shopStore.ts)) — tạo `Shop` mới: `id` sinh theo `SHOP${Date.now().slice(-6)}`, `agencyId` lấy từ đại lý khớp mã, `status: 'active'` ngay, `configuredServices: []` (đại lý cần tự cấu hình dịch vụ/bảng giá sau — cho tới lúc đó mọi dịch vụ hiện "Dịch vụ không khả dụng", đúng quy tắc đã có ở [AGA-SHOP-3](../../agency-admin/shops/tao-moi-shop-cau-hinh-dich-vu.md)).
4. Shop được lưu qua `localStorage` (cùng cơ chế `orderStore.ts`) — sống qua reload, thấy được từ cả phía Agency Admin (xem [AGA-SHOP-9](../../agency-admin/shops/nhan-dien-shop-tu-dang-ky.md)).
5. Validate SĐT dùng chung `isValidVNPhone()` ([phoneValidation.ts](../../../src/mock-data/phoneValidation.ts)) — xem chi tiết đầu số hợp lệ ở [AGA-HT-1](../../agency-admin/he-thong/cap-nhat-dau-so-dien-thoai.md).
6. Validate username: đối chiếu `loadShops()` — chặn submit nếu đã tồn tại username trùng.

## Acceptance Criteria

**AC1:** Trang đăng ký **không hiển thị** tên/danh sách đại lý nào ở bất kỳ đâu trong DOM (kể cả ẩn) — chỉ có 1 ô nhập "Mã đại lý".

**AC2:** Nhập mã đại lý đúng (không phân biệt hoa/thường) của 1 đại lý `active` → cho phép submit, gán đúng `agencyId` của đại lý đó.

**AC3:** Nhập mã sai/không tồn tại/thuộc đại lý không active → chặn submit + hiện đúng 1 message chung "Mã đại lý không hợp lệ", không phân biệt các trường hợp sai khác nhau.

**AC4:** Số điện thoại phải đúng 10 số và đầu số hợp lệ theo config GHN thực tế — sai đầu số thì chặn submit + hiện lỗi "Số điện thoại không hợp lệ".

**AC5:** Tên đăng nhập trùng với shop đã có (bất kỳ đại lý nào) → chặn submit + hiện lỗi "Tên đăng nhập đã được sử dụng, vui lòng chọn tên khác".

**AC6:** Mật khẩu và Xác nhận mật khẩu không khớp → chặn submit + hiện lỗi ngay tại field Xác nhận mật khẩu.

**AC7:** Đăng ký thành công → shop `status: 'active'` ngay, không cần đại lý duyệt, vào thẳng `/shop/orders`.

**AC8:** Shop vừa đăng ký xuất hiện đúng trong danh sách shop của ĐÚNG đại lý ứng với mã đã nhập ở Agency Admin (không lẫn qua đại lý khác).

## Notes

- **Đổi từ dropdown chọn đại lý sang nhập mã đại lý** theo yêu cầu trực tiếp: dropdown công khai liệt kê tên toàn bộ đại lý active lộ thông tin đối tác/quy mô cho bất kỳ ai vào trang đăng ký, kể cả người không phải shop thật (đối thủ, người tò mò...). Mã đại lý do chính đại lý tự gửi riêng cho shop mình muốn mời — không public ở đâu cả.
- Tái sử dụng field `agency.code` có sẵn (VD `HNC`) làm mã mời, không thêm field mới — đơn giản cho prototype. Nếu triển khai thật, nên tách riêng 1 mã mời độc lập (rotate được) khỏi mã kỹ thuật `code`, để đại lý có thể đổi mã mời nếu bị lộ mà không ảnh hưởng `code` dùng ở nơi khác.
- **Đã thảo luận nhưng KHÔNG chọn:** phương án link đăng ký riêng theo đại lý (VD `/shop/register?agency=AGN001`) — về lý thuyết UX tốt hơn (khỏi nhập gì), nhưng không hoạt động tốt trên app native nếu shop mở app "nguội" từ màn hình chính (không qua link nào thì không có param nào để biết đại lý) và cần Universal Links/App Links cấu hình riêng nếu muốn hoạt động khi app chưa cài — phức tạp hơn nhiều so với 1 ô nhập mã dùng được ở mọi nơi. Dự án hiện chưa có app native nên không thể build/test phần deep-link này.
- Quyết định "active ngay, không qua bước duyệt" giữ nguyên như trước — khác với luồng carrier-connection request hiện có (`CarrierSetup.tsx`) vốn có bước chờ duyệt 1–2 ngày.
- Web Shop hiện **không có khái niệm "shop đang đăng nhập" động** — toàn bộ `Orders.tsx`/`Pricing.tsx`/`BankAccounts.tsx` hardcode `'SHP001'`. Nghĩa là sau khi đăng ký, dù data shop đã lưu đúng và Agency Admin thấy đúng, chính chủ shop khi vào `/shop/orders` vẫn thấy dữ liệu demo của SHP001, chưa phải dữ liệu (rỗng) của chính mình — gap còn lại, chưa làm.
- Không có bước xác thực SĐT/email (OTP) trước khi active — đánh đổi đã chọn để tối ưu demo, không phải hành vi production-ready.
