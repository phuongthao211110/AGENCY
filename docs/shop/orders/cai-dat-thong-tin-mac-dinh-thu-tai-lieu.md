---
id: SHOP-ORDER-31
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [WEB SHOP] Cài đặt đơn hàng - Thông tin mặc định: Thư tài liệu (tổng quan)

## User Story

Là chủ shop, tôi muốn cấu hình thông tin mặc định riêng cho đơn Thư tài liệu, để giảm thao tác nhập lại khi tạo đơn Thư mới.

## User Flow

1. Vào "Cài đặt đơn hàng" → tab "Thông tin mặc định".
2. Bấm sub-tab **Thư tài liệu** (mặc định là Hàng hoá).
3. Thấy 2 nhóm: **Sản phẩm** và **Thông tin thư, tài liệu** — chi tiết từng field xem các story con SHOP-ORDER-32/33/34.

## System Flow

1. Component `LetterDefaultSettings` nhận đúng 2 prop tương tác: `weightDefault: boolean` (toggle) và `contentDefault: string` (textarea).
2. Mục "Trả hàng" (Địa chỉ trả hàng) render bên ngoài cả 2 component — cố định, không đổi theo sub-tab.

## Acceptance Criteria

**AC1:** Sub-tab Thư tài liệu hiện đúng 2 nhóm: **Sản phẩm** (toggle Khối lượng đơn hàng) và **Thông tin thư, tài liệu** (textarea Nội dung thư, tài liệu + dòng Ghi chú xem hàng).

**AC2:** Sub-tab Thư tài liệu KHÔNG hiện: Ca lấy hàng, Kích thước đơn hàng, Khai giá trị hàng, Giao/Trả 1 phần, Giao thất bại thu tiền, Tự động yêu cầu giao lại, Phí ship, Thu ship khách hàng.

## Notes

- Story con: [SHOP-ORDER-32 Khối lượng đơn hàng mặc định](thong-tin-mac-dinh-thu-khoi-luong.md) | [SHOP-ORDER-33 Nội dung thư, tài liệu mặc định](thong-tin-mac-dinh-thu-noi-dung.md) | [SHOP-ORDER-34 Ghi chú xem hàng](thong-tin-mac-dinh-thu-ghi-chu-xem-hang.md).
- Mục "Trả hàng" (Địa chỉ trả hàng) render bên ngoài cả 2 sub-tab, là `SelectCtrl` tĩnh chưa implement — field áp dụng cho cả 2 loại đơn (đích đến đều là địa chỉ trả hàng đã đăng ký) nhưng cơ chế giao chặng cuối khác nhau (NVC giao thẳng vs đại lý giao lại) — chi tiết xem [SHOP-ORDER-36](dia-chi-tra-hang-chua-implement-ap-dung-ca-2-loai-don.md).
- Tách ra từ SHOP-ORDER-12 (story tổng quan về cơ chế 2 sub-tab Hàng hoá/Thư tài liệu).
