---
id: GSA-DL-7
jiraKey: AGENCY-17
platform: super-admin
section: Quản lý Đại lý
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
---

# [GSA] Đại lý - Tạo mới đại lý: Cấu hình URL Web shop

## User Story

Là GHN Super Admin, tôi muốn cấu hình URL Web dành cho shop thuộc đại lý để các shop có thể truy cập vào hệ thống bán hàng và tạo đơn trong phạm vi đúng của đại lý đó.

## User Flow

1. Tại màn hình tạo mới Đại lý → bước "Cấu hình URL Web shop"
2. Super Admin nhập slug cho shop
3. Hệ thống hiển thị URL hoàn chỉnh (preview)
4. Super Admin kiểm tra và chỉnh sửa nếu cần
5. Hệ thống validate slug
6. Nếu hợp lệ → lưu URL và gán vào đại lý
7. Shop sử dụng URL này để truy cập hệ thống tạo & quản lý đơn hàng

## Acceptance Criteria

**AC1:** Hệ thống hiển thị trường cấu hình URL Web/App shop gồm:
- Prefix cố định: `https://shop-`
- Trường nhập slug (prefill bằng tên đại lý, viết thường, không dấu cách, nếu trùng slug thì đánh index 1,2,3,...n)
- Domain cố định: `.chotdon.ai`

**AC2:** Super Admin có thể nhập slug để cấu hình URL cho shop.

**AC3:** Hệ thống hiển thị preview URL hoàn chỉnh theo định dạng: `https://shop-[slug].chotdon.ai`.

**AC4:** Slug chỉ cho phép: Chữ thường (a-z), Số (0-9), Dấu gạch ngang (-).

**AC5:** Slug là bắt buộc. Nếu để trống, hệ thống hiển thị lỗi.

**AC6:** Slug phải là duy nhất trong hệ thống. Nếu trùng, hệ thống hiển thị lỗi.

**AC7:** Khi slug không hợp lệ (ký tự đặc biệt, khoảng trắng...), hệ thống hiển thị lỗi validate.

**AC8:** Khi slug hợp lệ, hệ thống cho phép lưu và tiếp tục.

**AC9:** Sau khi lưu, URL được gán cho đại lý và dùng cho các shop thuộc đại lý truy cập Web.

**AC10:** Khi Shop truy cập URL, hệ thống phải resolve đúng tenant (đại lý) tương ứng dựa trên slug.

**AC11:** Shop chỉ có thể truy cập và thao tác dữ liệu trong phạm vi tenant (đại lý) được map từ URL.
