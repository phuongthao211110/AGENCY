---
id: WS-SETTINGS-1
jiraKey: AGENCY-610
platform: shop
section: Cài đặt - Thông tin tài khoản
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP
status: draft
---

# [WEB SHOP] Cài đặt - Xoá tài khoản

## User Story

Là Shop, tôi muốn có thể xoá tài khoản của mình khi không còn muốn sử dụng dịch vụ để tôi chủ động kết thúc hợp tác mà không cần phải liên hệ Agency.

## User Flow

1. Shop vào **Cài đặt → Thông tin tài khoản**
2. Cuộn xuống cuối trang, thấy section **"Vùng nguy hiểm"** (nền đỏ nhạt, viền đỏ)
3. Nhấn **"Xoá tài khoản"** → chuyển sang màn chọn lý do
4. Chọn 1 lý do (bắt buộc), điền ghi chú thêm (không bắt buộc) → nhấn **"Tiếp tục"**
5. Màn xác nhận hiện cụm từ **XACNHAN** cần nhập
6. Shop nhập cụm từ vào input → nhấn **"Xác nhận xoá tài khoản"**
7. Hệ thống validate: nếu khớp → xoá tài khoản, hiển thị màn thành công + gửi email xác nhận
8. Shop bị đăng xuất, không thể đăng nhập lại

## System Flow

**B1 — Validate input "XACNHAN":**
- So sánh không phân biệt hoa/thường: `input.trim().toUpperCase() === 'XACNHAN'`
- Validate chỉ khi nhấn nút "Xác nhận xoá tài khoản" — không real-time trên input

**B2 — Xoá tài khoản:**
- Đánh dấu shop `status = 'inactive'`, ghi nhận `deletedAt`, `deleteReason`, `deleteNote`
- Huỷ session hiện tại → redirect về màn hình thành công (không login được nữa)

**B3 — Thông báo:**
- Gửi email xác nhận đến địa chỉ email của shop
- Hệ thống tự động cập nhật trạng thái shop bên Agency Admin thành **Inactive** (xem AGENCY-611)

## Màn hình

### Màn 1 — Cài đặt tài khoản (thêm Danger Zone)
- Phần thông tin hiện có: Tên shop, Email, SĐT, Mật khẩu (giữ nguyên)
- Thêm section **"Vùng nguy hiểm"** phía dưới cùng:
  - Nền `#FFF5F5`, viền `1px solid #FECACA`, border-radius 8px
  - Tiêu đề: `⚠ Vùng nguy hiểm` (đỏ `#DC2626`, bold)
  - Mô tả: _"Xoá tài khoản sẽ dừng toàn bộ hoạt động. Không thể hoàn tác."_ (8px, xám)
  - Nút: **"Xoá tài khoản"** — outline đỏ (border `#DC2626`, text đỏ, bg trắng)

### Màn 2 — Lý do xoá tài khoản
- Header: "Lý do xoá tài khoản" + nút ← Quay lại
- Danh sách radio (bắt buộc chọn 1):
  1. Chuyển sang đơn vị vận chuyển khác
  2. Ngừng kinh doanh
  3. Chi phí vận chuyển cao
  4. Chất lượng dịch vụ kém
  5. Lý do khác
- Textarea: "Ghi chú thêm (không bắt buộc)"
- Nút: **"Tiếp tục"** (đỏ `#DC2626`) — chỉ active khi đã chọn lý do

### Màn 3 — Xác nhận xoá
- Icon thùng rác (nền `#FEE2E2`)
- Tiêu đề: "Xác nhận lần cuối"
- Mô tả: _"Hành động này không thể hoàn tác. Nhập cụm từ bên dưới để xác nhận."_
- Box xám hiển thị cụm từ cần nhập: **XACNHAN** (đỏ, monospace, letter-spacing)
- Input text: placeholder "Nhập cụm từ xác nhận..." — không có real-time validate
- Nút: **"Xác nhận xoá tài khoản"** (đỏ) + **"Huỷ"** (xám)

### Màn 4 — Thành công
- Icon ✅ (nền xanh lá nhạt)
- Tiêu đề: "Tài khoản đã xoá"
- Mô tả: "Cảm ơn bạn đã sử dụng dịch vụ."
- Info card: Ngày xoá, Trạng thái = "Đã xoá"
- Ghi chú: "Email xác nhận gửi về [email]"
- Nút: **"Đóng"**

## Tác động đa nền tảng

| Platform | Thay đổi |
|----------|----------|
| **Agency Admin** — Quản lý shop | Shop tự xoá → Agency thấy trạng thái chuyển sang Inactive tự động. Xem chi tiết tại AGENCY-611. |

## Acceptance Criteria

**AC1:** Trang Cài đặt tài khoản có section "Vùng nguy hiểm" ở cuối trang với nút "Xoá tài khoản" outline đỏ.

**AC2:** Màn chọn lý do bắt buộc chọn ít nhất 1 radio option trước khi nhấn "Tiếp tục". Nút "Tiếp tục" bị disable nếu chưa chọn.

**AC3:** Màn xác nhận hiển thị cụm từ `XACNHAN` rõ ràng. Input không có real-time validate — chỉ validate khi nhấn nút.

**AC4:** Validate không phân biệt hoa/thường (`xacnhan`, `XACNHAN`, `XacNhan` đều hợp lệ). Nếu sai → không xoá, không có thông báo lỗi trên UI.

**AC5:** Sau khi xoá thành công → session bị huỷ, shop không thể đăng nhập lại bằng tài khoản cũ.

**AC6:** Email xác nhận được gửi tới địa chỉ email đã đăng ký của shop.

**AC7:** Lý do xoá và ghi chú được lưu vào hệ thống để phân tích churn rate.

## Notes

- Không block xoá dựa trên COD tồn đọng hay đơn đang giao — Agency Admin chịu trách nhiệm xử lý phần còn lại sau khi shop xoá
- Dữ liệu lịch sử (đơn hàng, đối soát) được giữ lại theo chính sách lưu trữ, không xoá theo tài khoản
- "XACNHAN" không có dấu — lưu ý khi triển khai input trên mobile (bàn phím có thể tự thêm dấu)
