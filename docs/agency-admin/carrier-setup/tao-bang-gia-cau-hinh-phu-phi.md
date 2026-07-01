---
id: AGA-CARRIER-5
jiraKey: 
platform: agency-admin
section: Thiết lập NVC
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
---

# [AGA] Thiết lập NVC: Tạo bảng giá - Cấu hình phụ phí

## User Story

Là Agency Admin (Đại lý), tôi muốn cấu hình phụ phí cho từng tuyến trong bảng giá để xác định các khoản phí phát sinh ngoài cước phí cơ bản khi giao hàng.

## User Flow

1. Agency Admin đang tạo bảng giá mới, tại một tuyến bất kỳ
2. Agency Admin click nút **"Phụ phí"** trên thanh header của tuyến đó
3. Hệ thống mở section phụ phí bên dưới, hiển thị danh sách 6 loại phụ phí — mặc định thu gọn
4. Agency Admin click **"Thêm"** bên cạnh loại phụ phí muốn cấu hình → form tương ứng mở ra
5. Agency Admin nhập giá trị → phụ phí được lưu vào tuyến đó
6. Nếu muốn xoá phụ phí đã cấu hình → click **"Xoá"** → xác nhận trong modal

## Acceptance Criteria

**AC1:** Mỗi tuyến trong bảng giá có nút **"Phụ phí"** ở góc phải header. Nút hiển thị badge số lượng loại phụ phí đã cấu hình. Click để mở/đóng section phụ phí của tuyến đó.

**AC2:** Section phụ phí hiển thị đúng 6 loại theo thứ tự:
1. Phí bảo hiểm (khai giá)
2. Giao trả 1 phần
3. Phí giao thất bại thu tiền
4. Phí thu hộ
5. Phí kích hoạt giao lại
6. Phí hoàn hàng

**AC3:** Mặc định tất cả 6 loại thu gọn. Mỗi loại hiển thị: dấu chấm bullet + tên phụ phí + nút **"Thêm"** (xanh). Khi đã cấu hình: thay nút "Thêm" bằng nút **"Xoá"** (đỏ) và form mở ra.

**AC4:** Cấu trúc form theo từng loại phụ phí:

- **Giao trả 1 phần** và **Phí giao thất bại thu tiền**: nhập một ô "Số tiền / đơn hàng" (đơn vị đồng)
- **Phí hoàn hàng**: 2 radio button — "Số tiền cố định" và "% cước phí tuyến". Mỗi option có ô nhập riêng ngay cạnh. Ô của option không được chọn bị disable (xám). Chọn option mới → reset giá trị về rỗng
- **Phí bảo hiểm (khai giá)**, **Phí thu hộ**, **Phí kích hoạt giao lại**: bảng nhiều mức (xem AC5)

**AC5:** Bảng nhiều mức có cấu trúc cột:

| Loại phụ phí | Cột Từ | Cột Đến | Cột % |
|---|---|---|---|
| Phí bảo hiểm | Giá trị khai giá từ | Giá trị khai giá đến | Phụ phí (% trên số tiền khai giá) |
| Phí thu hộ | COD từ | COD đến | Phụ phí (% trên số tiền thu hộ) |
| Phí kích hoạt giao lại | Từ lần | Đến lần | Phụ phí (% trên giá) |

Cột cố định gồm: Từ / Đến / Phụ phí (số fix) / Phụ phí (%) / Thao tác.

**AC6:** Quy tắc nhập trong bảng nhiều mức:
- "Phụ phí số fix" và "Phụ phí %" loại trừ nhau: khi một trường đã có giá trị → trường còn lại bị vô hiệu hoá (disable)
- Khi dùng %: xuất hiện thêm ô **"Tối đa X đ"** (không bắt buộc, bỏ trống = không giới hạn)
- Cột "Từ" của dòng thứ 2 trở đi tự động điền = giá trị "Đến" của dòng liền trước + 1, không được chỉnh sửa thủ công
- Mỗi bảng có tối thiểu 1 dòng. Nút **"Thêm"** thêm dòng mới ngay phía dưới dòng hiện tại. Nút **"Xoá"** xoá dòng đó (không hoạt động nếu chỉ còn 1 dòng)

**AC7:** Click **"Xoá"** phụ phí đã có dữ liệu → hiện modal xác nhận: _"Bạn có chắc muốn xoá cấu hình [tên phụ phí]? Dữ liệu đã nhập sẽ bị mất."_ với nút "Huỷ" và "Xoá". Click **"Xoá"** khi chưa nhập dữ liệu → thu gọn form trực tiếp, không cần xác nhận.
