---
id: AGA-ORDER-22
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng: Sửa lỗi 2 mũi tên chevron ở dropdown chọn shop/bưu cục

## User Story

Là Agency Admin, khi mở drawer tạo đơn (Hàng hoá hoặc Thư), tôi muốn dropdown "Shop tạo đơn"/"Bên gửi" chỉ hiện đúng 1 mũi tên, để không bị rối mắt và không trông giống lỗi UI khi có 2 mũi tên chồng nhau ở cùng 1 ô.

## User Flow

1. Mở drawer "Tạo đơn hàng" (Hàng hoá) hoặc "Gửi thư, tài liệu" (Thư) từ trang Đơn hàng (Agency Admin).
2. Nhìn vào ô "Shop tạo đơn" (cả 2 drawer) và "Bên gửi" (drawer Thư) → chỉ còn đúng 1 mũi tên chevron xám ở cuối ô, không còn mũi tên thứ 2 của browser chồng lên.

## System Flow

1. 3 chỗ dùng chung 1 pattern: `<select>` custom style + tự vẽ thêm `<IcChevronDown/>` ngay sau — nhưng `<select>` KHÔNG set `appearance: 'none'`, nên browser vẫn tự vẽ mũi tên native của riêng nó, cộng với `IcChevronDown` = 2 mũi tên hiện cùng lúc.
2. Đã thêm `appearance: 'none'` (kèm `WebkitAppearance`/`MozAppearance` cho tương thích Safari/Firefox cũ) vào style của cả 3 `<select>`: "Shop tạo đơn" trong `CreateOrderDrawer` (Hàng hoá), "Shop tạo đơn" trong `CreateLetterDrawerAgency` (Thư), và "Bên gửi" (bưu cục, mới thêm ở [AGA-ORDER-15](./tao-don-thu-thay-shop.md)) trong `CreateLetterDrawerAgency`.
3. Không đổi logic/hành vi chọn gì — chỉ sửa style, browser không còn vẽ mũi tên native nữa, chỉ còn icon tự vẽ.

## Acceptance Criteria

**AC1:** Dropdown "Shop tạo đơn" ở drawer "Tạo đơn hàng" (Hàng hoá) chỉ hiện đúng 1 mũi tên chevron.

**AC2:** Dropdown "Shop tạo đơn" ở drawer "Gửi thư, tài liệu" (Thư) chỉ hiện đúng 1 mũi tên chevron.

**AC3:** Dropdown "Bên gửi" (bưu cục) ở drawer "Gửi thư, tài liệu" chỉ hiện đúng 1 mũi tên chevron.

**AC4:** Chức năng chọn shop/bưu cục ở cả 3 dropdown không đổi gì — vẫn chọn đúng, vẫn cập nhật đúng dữ liệu liên quan (tỉnh Bên nhận, phí ship...).

## Notes

- Lỗi có sẵn từ trước ở 2/3 chỗ ("Shop tạo đơn" cả 2 drawer) — không phải lỗi mới phát sinh, chỉ tình cờ bị phát hiện khi đang làm [AGA-ORDER-15](./tao-don-thu-thay-shop.md) (Bên gửi = bưu cục). Chỗ thứ 3 ("Bên gửi") bị lỗi tương tự ngay từ đầu vì copy đúng y pattern cũ (thiếu `appearance: none`) khi viết AGA-ORDER-15.
- Đã kiểm tra 1 select khác trong cùng file (`LetterFieldSelect`, dùng ở card "Dịch vụ") đã có sẵn `appearance: 'none'` đúng từ trước — không phải lỗi hệ thống ở TẤT CẢ select trong file, chỉ đúng 3 chỗ nêu trên.
- Không quét/sửa toàn bộ các `<select>` khác trong dự án — phạm vi chỉ đúng 3 chỗ đã phát hiện và xác nhận có lỗi.
