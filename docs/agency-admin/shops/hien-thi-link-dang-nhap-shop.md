---
id: AGA-SHOP-8
jiraKey: AGENCY-608
platform: agency-admin
section: Quản lý Shop
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
---

# [AGA] Shop - Danh sách shop: Hiển thị link đăng nhập shop portal

## User Story

Là Agency Admin (Đại lý), tôi muốn thấy link đăng nhập shop portal ngay trên trang danh sách shop để tôi có thể dễ dàng sao chép và chia sẻ cho chủ shop mà không cần tìm ở nơi khác.

## User Flow

1. Agency Admin truy cập màn "Quản lý shop"
2. Hệ thống hiển thị banner "Link đăng nhập shop" phía trên danh sách
3. Agency Admin nhấn "Copy" để sao chép URL vào clipboard
4. Agency Admin chia sẻ URL cho chủ shop để đăng nhập

## Acceptance Criteria

**AC1:** Hệ thống hiển thị banner "Link đăng nhập shop" cố định ở đầu trang "Quản lý shop", phía dưới tiêu đề trang và phía trên thanh tìm kiếm. Banner luôn hiển thị bất kể trạng thái tìm kiếm hay danh sách shop.

**AC2:** Banner hiển thị đầy đủ các thành phần:
- Label: "Link đăng nhập shop:"
- URL shop portal dạng link, click mở tab mới
- Nút "Copy" ở phía phải banner

**AC3:** URL trong banner là URL shop portal dùng chung của đại lý — không phải URL riêng per shop. Tất cả shop thuộc cùng đại lý đều đăng nhập qua một URL duy nhất.

**AC4:** Agency Admin nhấn "Copy" → URL được sao chép toàn bộ vào clipboard. Nút hiển thị trạng thái "Đã copy" trong 2 giây rồi tự reset về "Copy".

**AC5:** Agency Admin click vào URL trong banner → hệ thống mở trang đăng nhập shop trong tab mới.
