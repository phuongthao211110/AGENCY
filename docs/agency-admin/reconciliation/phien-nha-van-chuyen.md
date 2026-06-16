---
platform: agency-admin
section: Đối soát & Chuyển khoản
tab: Phiên GHN
status: draft
---

# [AGENCY ADMIN] Đối soát — Phiên GHN

## Mô tả

Phiên GHN là đơn vị đối soát giữa đại lý và GHN. Mỗi phiên tương ứng với một file thanh toán do GHN xuất ra, chứa danh sách đơn hàng kèm COD và cước phí GHN đã thanh toán cho đại lý trong một kỳ.

Sau khi đại lý xác nhận phiên GHN, hệ thống tự động tạo **phiên shop** tương ứng để đại lý thanh toán lại cho từng shop.

---

## Truy cập

**Đối soát & Chuyển khoản → tab Phiên GHN**

---

## Danh sách phiên

### Thông tin hiển thị

| Cột | Mô tả |
|-----|-------|
| Mã phiên | ID phiên, định dạng `GHN001`, `GHN002`… |
| Ngày TT GHN | Ngày GHN thanh toán cho đại lý |
| Tên file | Tên file Excel/CSV đã upload |
| Số đơn | Tổng số đơn trong phiên |
| Số lệch | Số đơn có COD hoặc cước không khớp với hệ thống (hiển thị đỏ đậm nếu > 0) |
| Tổng cước | Tổng phí vận chuyển GHN thu |
| Tổng COD | Tổng tiền COD GHN thanh toán cho đại lý |
| Trạng thái | **Chờ xác nhận** (cam) / **Đã xác nhận** (xanh) |

### Lọc

- Lọc theo trạng thái: Tất cả / Chờ xác nhận / Đã xác nhận

### Thống kê nhanh

3 thẻ số liệu phía trên bảng: **Tổng phiên** · **Đã xác nhận** · **Chờ xác nhận**

---

## Tạo phiên mới — Upload file GHN

1. Nhấn **Upload file GHN** (góc trên phải)
2. Kéo thả hoặc nhấn để chọn file `.xlsx`, `.xls`, hoặc `.csv`
3. Chọn **Ngày thanh toán GHN** (bắt buộc)
4. Nhập **Ghi chú** (không bắt buộc, ví dụ: "Kỳ 1–15/3/2024")
5. Nhấn **Tải lên**

Phiên mới được tạo với trạng thái **Chờ xác nhận** và xuất hiện đầu danh sách.

---

## Xem chi tiết phiên

Nhấn **Xem chi tiết** hoặc click vào dòng bất kỳ để vào trang chi tiết.

### Thông tin chi tiết

- Header: Mã phiên · Ngày TT GHN · Tên file · Ghi chú · Trạng thái
- Thống kê: Tổng đơn · Số lệch · Tổng cước · Tổng COD

### Bảng đơn hàng

| Cột | Mô tả |
|-----|-------|
| Mã đơn GHN | Mã tracking GHN |
| Shop | Tên shop sở hữu đơn |
| COD (GHN) | COD GHN đã thanh toán |
| COD (HT) | COD trong hệ thống đại lý |
| Cước (GHN) | Phí ship GHN |
| Cước (HT) | Phí ship trong hệ thống |
| Trạng thái | **Khớp** / **Lệch** / **Không tìm thấy** |

- Dòng **Lệch**: hiển thị đỏ, kèm giá trị hệ thống bên dưới để so sánh
- Lọc theo trạng thái đơn: Tất cả / Khớp / Lệch / Không tìm thấy

---

## Xác nhận phiên

### Xác nhận từng phiên (trong trang detail)

- Chỉ hiển thị khi phiên đang ở trạng thái **Chờ xác nhận**
- Nhấn **Xác nhận phiên** → phiên chuyển sang **Đã xác nhận**
- Hệ thống tự động tạo phiên shop cho từng shop có đơn trong phiên này

### Xác nhận nhiều phiên (bulk confirm)

1. Tick checkbox vào các phiên có trạng thái **Chờ xác nhận**
2. Thanh bulk action hiện ra: "Đã chọn X phiên"
3. Nhấn **Xác nhận phiên đã chọn**

> Checkbox bị disable với phiên đã xác nhận.

---

## Xoá phiên

- Chỉ xóa được phiên ở trạng thái **Chờ xác nhận**
- Thực hiện trong trang chi tiết
- Phiên đã xác nhận không thể xóa (đã sinh phiên shop)

---

## Luồng liên kết

```
Upload file GHN
    ↓
Phiên NVC (pending) → Xem chi tiết, xem đơn lệch
    ↓
Xác nhận phiên GHN
    ↓
Phiên shop tự động được tạo (tab "Phiên shop")
```

---

## Trạng thái phiên

| Trạng thái | Ý nghĩa | Hành động có thể |
|------------|---------|-----------------|
| Chờ xác nhận | Chưa được xử lý | Xem chi tiết · Xác nhận · Xoá |
| Đã xác nhận | Đã xử lý, đã tạo phiên shop | Xem chi tiết (read-only) |
