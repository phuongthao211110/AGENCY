---
id: WS-LOGIN-2
jiraKey: 
platform: shop
section: Login / Logout
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Màn hình đăng ký

## User Story

Là chủ shop truy cập trang đăng ký lần đầu, tôi muốn nhập mã đại lý TRƯỚC để biết chắc mình đang đăng ký đúng đại lý muốn hợp tác, rồi mới điền tiếp form thông tin đầy đủ — tránh trường hợp điền hết 7-8 trường xong mới phát hiện mã đại lý sai ở field áp cuối.

## User Flow

1. Truy cập `/shop/register` — nền tối (`#0D0D18`), logo "WEB SHOP" (khối cam GHN + chữ) cố định góc trên trái, giống hệt bố cục trang Đăng nhập.
2. **Bước 1 — Nhập mã đại lý**: card trắng chỉ có đúng 1 ô "Mã đại lý" (kèm dòng phụ chú giải thích cách lấy mã) + nút "Tiếp tục" full-width. Không hiện field nào khác của form đăng ký.
3. Nhập mã sai → lỗi "Mã đại lý không hợp lệ" hiện ngay dưới ô, không chuyển sang bước 2, giá trị đã gõ không bị mất.
4. Nhập mã đúng → chuyển sang **Bước 2 — Form đăng ký đầy đủ**: banner xanh nhạt đầu form xác nhận "Đăng ký dưới đại lý: **{tên đại lý}**", kèm link "Đổi mã đại lý" ở góc phải banner.
5. Bấm "Đổi mã đại lý" → quay lại bước 1, ô mã đại lý giữ nguyên giá trị cũ (sửa nhanh, không phải gõ lại từ đầu).
6. Form bước 2 theo đúng thứ tự: Tên shop → Họ tên chủ shop → Số điện thoại → Địa chỉ → Tên đăng nhập → Mật khẩu → Xác nhận mật khẩu — KHÔNG còn field "Mã đại lý" (đã xác nhận ở bước 1).
7. Nút "Đăng ký" cam full-width, cuối form.
8. Chân card (hiện ở cả 2 bước): "Đã có tài khoản? Đăng nhập" — bấm "Đăng nhập" quay lại `/shop/login`.

## System Flow

1. `Register.tsx` quản lý bước bằng state cục bộ `step: 'code' | 'form'` — cố ý KHÔNG tách route riêng (VD `/shop/register/code`), vì luồng chỉ 2 bước, không cần back/forward qua URL hay refresh giữa chừng.
2. Bước 1 dùng antd `Form` với 1 `Form.Item` custom (`validateStatus`/`help` set thủ công qua state `codeError`, không dùng `rules` antd) — vì cần validate mã ngay khi bấm "Tiếp tục", trước khi bất kỳ field nào của bước 2 tồn tại trong DOM. Mã hợp lệ → lưu cả object agency thật vào state `resolvedAgency` (không chỉ lưu string mã).
3. Bước 2 tái sử dụng gần như nguyên vẹn `Form` cũ (trước khi tách bước) — chỉ bỏ `Form.Item name="agencyCode"`, thêm banner đọc trực tiếp `resolvedAgency.name` (từ state, không phải field form nào).
4. `changeAgencyCode()` (nút "Đổi mã đại lý"): reset `step` về `'code'`, xoá `resolvedAgency` và `codeError`, nhưng **KHÔNG xoá** `agencyCodeInput` — giữ nguyên giá trị đã gõ trước đó để người dùng sửa nhanh.
5. Submit form bước 2 (`onFinish`) dùng đúng `resolvedAgency.id` làm `agencyId` khi gọi `addShop()` — không đọc lại mã đại lý từ form vì field đó không còn tồn tại ở bước này.
6. Toàn bộ business logic khác (đối chiếu mã đại lý với `agency.code`, validate SĐT/username, `addShop()`) không đổi so với trước khi tách bước — xem đầy đủ ở [WS-LOGIN-1](./dang-ky-shop-moi.md).

## Acceptance Criteria

**AC1:** Vào `/shop/register` lần đầu → chỉ thấy đúng 1 ô "Mã đại lý" + nút "Tiếp tục", không thấy field nào khác của form đăng ký.

**AC2:** Nhập mã sai → lỗi "Mã đại lý không hợp lệ" hiện ngay dưới ô, không chuyển sang bước 2, không mất giá trị đã gõ.

**AC3:** Nhập mã đúng (không phân biệt hoa/thường) → chuyển sang bước 2, hiện banner xanh đúng tên đại lý khớp mã.

**AC4:** Ở bước 2, form không còn field "Mã đại lý" — đã xác nhận xong ở bước 1.

**AC5:** Bấm "Đổi mã đại lý" ở bước 2 → quay lại bước 1, ô mã đại lý vẫn giữ giá trị cũ, không bị xoá trắng.

**AC6:** Submit thành công ở bước 2 → shop được tạo với đúng `agencyId` của đại lý đã xác nhận ở bước 1.

**AC7:** Nền tối, logo, card trắng 640px căn giữa cả 2 chiều — giữ đồng bộ với `Login.tsx` ở cả 2 bước.

**AC8:** Chân card "Đã có tài khoản? Đăng nhập" hiện ở cả 2 bước, điều hướng đúng về `/shop/login`.

## Notes

- **Đây là bản viết lại toàn bộ** sau khi đổi từ luồng "1 form duy nhất, Mã đại lý là 1 field nằm giữa form" sang "2 bước tách biệt" — theo yêu cầu trực tiếp: đăng ký shop phải cho nhập mã đại lý rồi mới đến màn hình đăng ký. Lý do: tránh chủ shop điền hết 7-8 field xong mới phát hiện mã đại lý sai ở field áp cuối, phải sửa và điền lại; tách riêng giúp phát hiện lỗi sớm nhất (ngay bước đầu), UX cũng rõ ràng hơn: "xác nhận đối tác" trước, "điền thông tin của mình" sau.
- Không tách thành 2 route riêng — cố ý giữ 1 route, quản lý bước bằng state cục bộ vì luồng ngắn.
- Đã implement và verify bằng Playwright: mã sai → lỗi đúng chỗ, không qua được bước 2; mã đúng (`HNC`) → qua bước 2, banner đúng tên "Đại lý Hà Nội Central"; bấm "Đổi mã đại lý" → quay lại bước 1, giữ đúng giá trị đã nhập trước đó.
- [WS-LOGIN-1](./dang-ky-shop-moi.md) có phần User Flow cũ ghi "Điền form: ... Mã đại lý ..." như đang cùng 1 form — đã cập nhật lại ở đó để khớp đúng 2 bước, không lặp lại chi tiết trình bày màn hình (đã có đủ ở đây).
