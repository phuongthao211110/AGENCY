---
id: AGA-CARRIER-6
jiraKey: AGENCY-250
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
---

# [AGA] Thiết lập NVC: Tạo bảng giá - Cấu hình phụ phí Hoàn hàng

## User Story

Là Agency Admin (Đại lý), tôi muốn cấu hình phụ phí hoàn hàng cho từng tuyến trong bảng giá bằng cách chọn một trong hai hình thức tính phí — số tiền cố định hoặc phần trăm cước phí tuyến — để áp dụng đúng chính sách hoàn hàng của đại lý.

## User Flow

1. Agency Admin đang tạo bảng giá mới, mở section **Phụ phí** của một tuyến
2. Tại mục **Phí hoàn hàng**, click **"Thêm"**
3. Hệ thống hiển thị form với 2 lựa chọn: **Số tiền cố định** và **% cước phí tuyến**
4. Agency Admin chọn một hình thức và nhập giá trị vào ô tương ứng
5. Nếu đổi sang hình thức khác → giá trị cũ bị xoá, nhập lại từ đầu

## Acceptance Criteria

**AC1:** Mục "Phí hoàn hàng" trong section Phụ phí hiển thị 2 radio button trên 2 dòng riêng biệt:
- `○ Số tiền cố định   [_____] đ   / đơn hàng`
- `○ % cước phí tuyến  [_____] %   của cước phí tuyến / đơn hàng`

**AC2:** Mặc định chọn "Số tiền cố định". Chỉ được chọn một trong hai — không thể chọn đồng thời cả hai.

**AC3:** Ô nhập của option không được chọn bị vô hiệu hoá (nền xám, chữ nhạt, không nhập được). Ô nhập của option đang chọn hoạt động bình thường.

**AC4:** Khi Agency Admin chuyển sang option khác → giá trị đang nhập bị xoá, ô nhập mới ở trạng thái rỗng để nhập lại.

**AC5:** Nhãn trailing của từng option hiển thị đúng đơn vị:
- Số tiền cố định: `đ / đơn hàng`
- % cước phí tuyến: `% của cước phí tuyến / đơn hàng`

**AC6:** Giá trị hợp lệ là số dương. Placeholder gợi ý: "VD: 10000" cho số tiền cố định, "VD: 5" cho phần trăm.
