---
id: AGA-ORDER-21
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Tạo đơn hàng mới: Import đơn hàng lỗi

## User Story

Là Agency Admin (Đại lý), khi import file Excel có dòng bị lỗi (sai/thiếu dữ liệu), tôi muốn thấy rõ dòng nào lỗi vì sao và sửa được ngay tại chỗ, để không phải sửa file gốc rồi upload lại từ đầu chỉ vì vài dòng sai.

## User Flow

1. Sau khi upload file, nếu có dòng không hợp lệ → tab "Đơn hàng lỗi N" hiện số đếm; bấm vào tab để xem riêng các dòng lỗi
2. Mỗi dòng lỗi có thêm cột "Lỗi" liệt kê đầy đủ lý do (có thể nhiều lỗi cùng lúc trên 1 dòng, ví dụ vừa thiếu SĐT vừa sai Mã shop)
3. Field nào gây lỗi sẽ có viền đỏ để dễ nhận ra ngay trong hàng (Mã shop, Loại đơn, Tên người nhận, Số điện thoại, Địa chỉ)
4. Sửa trực tiếp field bị lỗi ngay trong bảng — không cần rời khỏi màn hình hay tải lại file
5. Sửa xong, đúng dữ liệu → dòng tự biến mất khỏi tab "Đơn hàng lỗi" và xuất hiện ở tab "Đơn hàng hợp lệ", 2 số đếm trên tab tự cập nhật ngay
6. Nếu 1 dòng không muốn sửa (VD: đơn nhập nhầm, không cần thiết) → tick chọn rồi "Xoá N đơn đã chọn", hoặc bấm icon X ngay trên dòng đó để bỏ hẳn khỏi batch import
7. Nút "Nhập N đơn hợp lệ" ở cuối trang chỉ đếm và chỉ tạo đơn cho các dòng đã hợp lệ — dòng còn lỗi không bao giờ bị import nhầm

## System Flow

1. Phân loại dòng dựa trên `r.errors.length`: `validRows = errors.length === 0`, `invalidRows = errors.length > 0` — tính lại mỗi lần `rows` đổi (kể cả sau khi sửa 1 field)
2. `reviewTab` quyết định `visibleRows` hiển thị (valid | invalid); `pagedRows` cắt theo trang hiện tại của `visibleRows`
3. `validateRawRow()` trả về mảng string lỗi — mỗi rule độc lập, 1 dòng có thể có nhiều lỗi cùng lúc: thiếu/sai Mã shop, Loại đơn không nhận ra, thiếu Tên người nhận/SĐT/Địa chỉ, khối lượng không phải số dương hoặc >20.000g, Dài/Rộng/Cao ngoài khoảng 1-200cm (nếu có điền), phí ship âm hoặc không phải số
4. `updateRowField(rowIndex, field, value)` cập nhật đúng field trong `r.raw` rồi gọi lại `validateRawRow(raw)` ngay lập tức — không debounce, không cần bấm nút "Lưu" riêng
5. Vì `validRows`/`invalidRows` tính lại mỗi render dựa trên `rows` mới nhất, dòng tự "nhảy" tab đúng ngay sau khi `setRows()` chạy xong — không cần logic chuyển tab thủ công
6. `removeRows()` lọc bỏ theo `rowIndex` khỏi `rows` và `selectedRows` cùng lúc — dòng biến mất khỏi cả 2 tab vĩnh viễn (không phải ẩn tạm)
7. Field không có lỗi tương ứng (VD: Sản phẩm, Khối lượng khi đã hợp lệ) không hiện viền đỏ — chỉ field đang gây lỗi thật mới có border đỏ, dựa theo field cụ thể chứ không phải toàn dòng

## Acceptance Criteria

**AC1:** Tab "Đơn hàng lỗi N" hiện đúng số dòng có ít nhất 1 lỗi validate.

**AC2:** Bảng ở tab lỗi có thêm cột "Lỗi" liệt kê đủ TẤT CẢ lý do lỗi của dòng đó (không chỉ lỗi đầu tiên).

**AC3:** Field đang gây lỗi có viền đỏ; field không lỗi giữ viền xám bình thường — phân biệt được ngay bằng mắt không cần đọc cột Lỗi.

**AC4:** Sửa 1 field (VD: chọn lại đúng Mã shop từ dropdown) → dòng re-validate ngay, không cần bấm nút xác nhận nào khác.

**AC5:** Dòng hết lỗi sau khi sửa → biến mất khỏi tab "Đơn hàng lỗi", xuất hiện ở tab "Đơn hàng hợp lệ"; số đếm trên cả 2 tab cập nhật ngay lập tức.

**AC6:** Dòng đang hợp lệ mà sửa thành sai (VD: xoá trắng Tên người nhận) → ngược lại, tự chuyển từ tab hợp lệ sang tab lỗi.

**AC7:** Có thể xoá dòng lỗi không muốn sửa — qua tick chọn nhiều dòng + "Xoá N đơn đã chọn", hoặc icon X trên từng dòng riêng lẻ.

**AC8:** Nút "Nhập N đơn hợp lệ" luôn phản ánh đúng số dòng ĐANG hợp lệ tại thời điểm bấm — dòng còn lỗi không bao giờ được tạo thành đơn thật dù đang ở tab nào.

**AC9:** Không có dòng lỗi nào (`invalidRows` rỗng) → tab "Đơn hàng lỗi 0" vẫn hiện nhưng khi bấm vào chỉ thấy thông báo "Không có đơn nào bị lỗi.", không phải màn trắng.

## Notes

- Đi kèm trực tiếp với [AGA-ORDER-14 — Import đơn hàng hợp lệ](./import-don-hang.md) — 2 story mô tả 2 mặt của cùng 1 màn review, tách riêng vì tab lỗi có UI/AC riêng (cột Lỗi, viền đỏ, khả năng sửa) đáng ghi nhận độc lập.
- **Gap đã sửa:** Trước đây, 4 field Mã shop, Tên người nhận, Số điện thoại, Địa chỉ hoàn toàn không có input nào ở bảng review — dòng lỗi vì 1 trong 4 field này bị kẹt vĩnh viễn ở tab lỗi, không có cách nào sửa được ngoài việc sửa file gốc và upload lại từ đầu. Đây chính là gap mà story này mô tả đã được giải quyết.
- COD trên dòng Thư không tính là lỗi (xem note ở AGA-ORDER-14) — do đó không xuất hiện trong cột Lỗi của tab này; giá trị bị tự động bỏ qua thay vì chặn.
- Việc tự chuyển tab (AC5/AC6) là 2 chiều — không chỉ lỗi→hợp lệ mà hợp lệ→lỗi cũng xảy ra nếu người dùng sửa sai đi, cần lưu ý khi viết test không giả định luồng chỉ đi 1 chiều.
