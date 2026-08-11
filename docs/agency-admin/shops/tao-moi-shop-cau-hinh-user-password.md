---
id: AGA-SHOP-4
jiraKey: AGENCY-46
platform: agency-admin
section: Quản lý Shop
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
---

# [AGA] Shop - Tạo mới shop: Cấu hình User/Password cho chủ shop đăng nhập Web/App shop

## User Story

Là Agency Admin (Đại lý), tôi muốn cấu hình tài khoản đăng nhập (username/password) cho shop để chủ shop có thể đăng nhập vào hệ thống Web/App và sử dụng dịch vụ.

## Acceptance Criteria

**AC1:** Hệ thống hiển thị section cấu hình tài khoản đăng nhập trong màn hình tạo shop.

**AC2:** Username shop được cấu thành theo format: `username = shop_id + "-" + {username do Agency Admin nhập}`.
- `shop_id` do hệ thống generate (6 ký tự: 3 chữ in hoa + 3 số)
- Phần suffix được prefill sẵn bằng số điện thoại chủ shop, Agency Admin có thể edit lại

**AC3:** Agency Admin không được chỉnh sửa phần shop_id trong username. Chỉ được nhập phần phía sau dấu "-".

**AC4:** Username là bắt buộc, không chứa ký tự đặc biệt (chỉ a-z, 0-9), unique toàn hệ thống.

**AC5:** Khi username bị trùng: Hệ thống hiển thị lỗi "Tên đăng nhập đã tồn tại", không cho phép lưu.

**AC6:** Password là bắt buộc, tối thiểu 8 ký tự, ít nhất 1 ký tự viết hoa, 1 ký tự viết thường, 1 ký tự số và 1 ký tự đặc biệt.

**AC7:** Hệ thống hỗ trợ: Ẩn/hiện mật khẩu, Sao chép username, Sao chép mật khẩu.

**AC8:** Khi submit hợp lệ, hệ thống lưu username, password mapping với shop_id và agency_id.

**AC9:** Đảm bảo tenant isolation: Shop chỉ đăng nhập được vào hệ thống thuộc agency_id của mình.

**AC10:** Khi dữ liệu không hợp lệ: Hiển thị lỗi tại từng field, không cho submit.

**AC11:** Sau khi tạo thành công, tài khoản shop có thể sử dụng để đăng nhập Web shop (AGENCY-78) và App shop (AGENCY-79).

## Notes

**⚠️ Trạng thái thật khác với "✅" đã đánh dấu trước đây trong README — cùng tình trạng với [AGA-SHOP-3](./tao-moi-shop-thong-tin-co-ban.md):** section hiển thị đủ UI nhưng nút "Tạo mới" không lưu gì, không validate gì.

**Đã fix một phần** (theo yêu cầu trực tiếp "validate required + nối persist thật"):
- ✅ AC1 (hiển thị section), AC7 (ẩn/hiện password, copy — đã có từ trước), AC8 (lưu username/password mapping với `agencyId` qua `addShop()`), AC9 (tenant isolation), AC10 (hiện lỗi từng field, không cho submit) — đã implement.
- ✅ AC5 gần đúng: username trùng bị chặn + hiện lỗi (đối chiếu `loadShops()` — unique **toàn hệ thống**, rộng hơn cả yêu cầu spec), nhưng message text khác spec ("Tên đăng nhập đã được sử dụng, vui lòng chọn tên khác" thay vì "Tên đăng nhập đã tồn tại").
- ❌ **Chưa làm AC2/AC3** — username KHÔNG tự động ghép `shop_id + "-" + input`, Agency Admin nhập tự do toàn bộ chuỗi, không có phần prefix bị khoá.
- ❌ **Chưa làm AC4 (một phần)** — chỉ check không-để-trống, **chưa check** ký tự đặc biệt (spec yêu cầu chỉ `a-z, 0-9`).
- ❌ **Chưa làm AC6** — Password chỉ check không-để-trống, **chưa check** độ dài ≥8 hay yêu cầu hoa/thường/số/ký tự đặc biệt.
- **AC11 chưa verify được** — `Login.tsx` (Web Shop) hiện chỉ là stub `navigate('/shop/orders')`, không thật sự đối chiếu username/password nào cả, nên không thể xác nhận tài khoản vừa tạo "đăng nhập được" theo đúng nghĩa.
