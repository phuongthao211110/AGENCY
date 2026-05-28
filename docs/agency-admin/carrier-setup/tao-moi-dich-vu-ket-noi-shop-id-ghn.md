---
id: AGA-CARRIER-7
jiraKey: AGENCY-244
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN
status: draft
---

# [AGA] Thiết lập GHN - Tạo mới dịch vụ: Kết nối Shop ID GHN, Dịch vụ từ GHN

## User Story

Là Agency Admin (Đại lý), tôi muốn chọn Shop ID GHN và gói cước tương ứng
cho dịch vụ để hệ thống biết đẩy đơn qua Shop GHN nào khi shop tạo đơn với
dịch vụ này.

## User Flow

1. Trong trang tạo mới dịch vụ (AGENCY-148), Agency Admin kéo xuống section
   **Kết nối Shop ID GHN**
2. Hệ thống hiển thị danh sách tất cả Shop GHN đã kết nối của đại lý
3. Agency Admin tick chọn Shop GHN muốn kết nối với dịch vụ
4. Với mỗi shop đã chọn, Agency Admin chọn gói cước (`Hàng nhẹ` / `Hàng nặng`)
5. Lưu cùng form tạo dịch vụ (AGENCY-148)

## System Flow

1. Load danh sách Shop GHN theo `agencyId`
2. Khi Agency Admin tick shop → enable chip gói cước của shop đó
3. Lưu mapping `service → [{ shopId, goiCuoc[] }]` khi submit form
4. Sau khi lưu → hệ thống dùng danh sách này để optimize routing khi
   shop tạo đơn với dịch vụ (chọn Shop GHN có giá GHN thấp nhất)

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Web Shop** — Tạo đơn | Khi shop chọn dịch vụ này, hệ thống lấy danh sách Shop GHN được kết nối để tính và so sánh giá → tự động chọn Shop GHN rẻ nhất để đẩy đơn. Shop không thấy thông tin này. |

## Acceptance Criteria

**AC1:** Section **Kết nối Shop ID GHN** hiển thị dạng bảng 2 cột:

- Cột trái **Cửa hàng GHN**: checkbox + tên shop + Shop ID (monospace, màu xám)
- Cột phải **Dịch vụ từ GHN**: chip gói cước `Hàng nhẹ` và `Hàng nặng`

**AC2:** Chip gói cước chỉ thao tác được khi shop tương ứng đã được tick —
nếu shop chưa chọn thì chip mờ (`opacity 0.4`) và không click được.

**AC3:** Khi tick chọn shop → dòng đó highlight nền cam nhạt, viền trái cam
3px. Khi bỏ tick → trở về trạng thái bình thường, các chip gói cước của
shop đó tự động bỏ chọn.

**AC4:** Chip gói cước khi được chọn hiển thị màu theo loại:
- `Hàng nhẹ`: chữ xanh dương, nền xanh nhạt
- `Hàng nặng`: chữ cam vàng, nền vàng nhạt

**AC5:** Agency Admin có thể chọn một hoặc cả hai gói cước cho mỗi shop.

**AC6:** Không bắt buộc phải chọn Shop GHN — có thể bỏ trống, bổ sung
sau ở trang chi tiết dịch vụ.

**AC7:** Danh sách Shop GHN chỉ hiển thị các shop thuộc đại lý đang đăng
nhập (tenant isolation).

## Notes

- 1 dịch vụ có thể kết nối nhiều Shop GHN — hệ thống sẽ optimize chọn
  shop rẻ nhất khi đẩy đơn, Agency Admin không cần quan tâm thứ tự ưu tiên
- Gói cước (`Hàng nhẹ` / `Hàng nặng`) là gói cước thực tế của tài khoản
  GHN — không phải tuyến của bảng giá đại lý
