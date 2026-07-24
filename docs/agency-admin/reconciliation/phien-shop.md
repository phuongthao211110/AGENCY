---
platform: agency-admin, shop
section: Đối soát & Chuyển khoản
tab: Phiên GHN · Phiên shop (Agency Admin) · Đối soát (Web Shop)
status: draft
---

# Phiên shop — Hướng dẫn sử dụng

Phiên shop là đơn vị thanh toán COD giữa **đại lý** và **từng shop**. Hệ thống tự động tổng hợp phiên shop từ phiên GHN đã xác nhận, group theo từng shop có đơn hàng trong phiên đó.

---

## Phía Đại lý (Agency Admin)

### Truy cập

**Đối soát & Chuyển khoản → tab Phiên shop**

### Điều kiện hiển thị

Tab Phiên shop chỉ có dữ liệu khi đã có ít nhất một **phiên GHN đã xác nhận**. Nếu chưa có, trang hiển thị trạng thái rỗng:

> *"Phiên shop được tạo tự động sau khi xác nhận phiên GHN"*

### Cách phiên shop được tạo

Mỗi khi đại lý xác nhận một phiên GHN, hệ thống tự động:

1. Lấy tất cả đơn hàng trong phiên GHN
2. Với mỗi đơn, xác định shop bằng `resolveShopId()`: tra `orderCode` trong `orders.json` (khớp `trackingCode` hoặc `id`) để lấy `shopId` thật của đơn hàng đại lý; nếu không tìm thấy đơn tương ứng, dùng `shopId` tĩnh có sẵn trên dòng đối soát làm phương án dự phòng
3. Group theo từng shop (đã resolve ở bước trên)
4. Tạo một phiên shop cho mỗi nhóm `(phiên GHN × shop)`
5. Mã phiên shop: `COD_SHOP_{ngày thanh toán}{số thứ tự 4 chữ số}_{mã shop}` — ví dụ `COD_SHOP_202403150001_SHP001`

> Ghi chú: dữ liệu mock (`carrier-reconciliation-items.json`) đã được viết lại để `orderCode` khớp 100% với `orders.json`, nên bước 2 giờ đi qua nhánh match thật (không còn luôn fallback). Xem chi tiết tại [xac-nhan-phien-tach-phien-shop.md](./xac-nhan-phien-tach-phien-shop.md).

### Thông tin hiển thị

| Cột | Mô tả |
|-----|-------|
| Mã phiên shop | ID định danh phiên, liên kết với phiên GHN và shop |
| Tên shop | Tên shop |
| Phiên GHN | Mã phiên GHN nguồn |
| Thời gian | Khoảng thời gian của phiên GHN nguồn |
| Số đơn | Số đơn của shop trong phiên GHN |
| Tổng COD | Tổng COD GHN đã nhận cho các đơn của shop này |
| Phí shop | Phí ship theo bảng giá đại lý (shop được báo) |
| Phí GHN | Phí ship thực GHN thu |
| Lợi nhuận ĐL | `Phí shop − Phí GHN` (màu xanh nếu dương, đỏ nếu âm) |
| Trạng thái | **Chờ xác nhận** / **Đã xác nhận** |

> Hệ thống có tính sẵn "Số lệch" (số đơn COD/phí không khớp) cho mỗi phiên shop nhưng **hiện chưa hiển thị** thành cột riêng trong bảng — cần bổ sung hoặc xác nhận với BA đây có phải cố ý ẩn không.

### Lọc

- Theo trạng thái: Tất cả / Chờ xác nhận / Đã xác nhận
- Theo shop: Tất cả shop / chọn shop cụ thể

### Thống kê nhanh

3 thẻ số liệu: **Tổng phiên shop** · **Đã xác nhận** · **Chờ xác nhận**

### Xác nhận phiên shop — CHƯA HOẠT ĐỘNG (gap)

> ⚠️ Trạng thái phiên shop hiện **luôn luôn** là "Chờ xác nhận" — chưa có hành động xác nhận nào được nối logic trong code (không có checkbox, không có thanh bulk action, không có nút xác nhận ở trang chi tiết phiên shop). Phần dưới đây mô tả hành vi **mong muốn**, dùng làm spec cho story implement sau — xem chi tiết gap tại [xac-nhan-phien-tach-phien-shop.md](./xac-nhan-phien-tach-phien-shop.md).

Xác nhận (khi được implement) sẽ có nghĩa là đại lý đã thanh toán COD cho shop.

**Xác nhận từng phiên (dự kiến):**
- Tick checkbox vào phiên muốn xác nhận
- Thanh bulk action hiện ra
- Nhấn **Xác nhận phiên đã chọn**

**Xác nhận nhiều phiên cùng lúc (dự kiến):**
- Tick checkbox ở header để chọn tất cả phiên **Chờ xác nhận** đang hiển thị
- Nhấn **Xác nhận phiên đã chọn**

> Phiên đã xác nhận: checkbox bị disable, không thể chọn lại.

---

## Phía Shop (Web Shop)

### Truy cập

**Menu → Đối soát**

### Mô tả

Shop chỉ xem được phiên của mình, tự động lấy từ các phiên GHN đã xác nhận mà có đơn hàng của shop đó.

### Lịch nhận COD

Phía trên trang hiển thị lịch hiện tại, ví dụ: **Thứ 2, 3, 4, 5, 6**

- Nhấn **Đổi lịch** để chọn ngày nhận COD trong tuần
- Các lựa chọn: Thứ 2–6 hàng ngày, hoặc các ngày cụ thể như Thứ 3 & 5, Thứ 6 hàng tuần…

### Thống kê nhanh

| Thẻ | Nội dung |
|-----|----------|
| Tổng phiên | Số phiên đã có |
| Tổng nhận về | Tổng `COD − Phí ship` tất cả phiên |
| Chờ thanh toán | Số phiên chưa được đại lý thanh toán |
| Đơn lệch | Hiển thị khi có đơn MISMATCH (màu đỏ) |

### Bảng phiên đối soát

| Cột | Mô tả |
|-----|-------|
| Mã phiên | ID phiên shop |
| Phiên GHN | Mã phiên GHN nguồn |
| Ngày | Ngày GHN thanh toán (từ phiên GHN) |
| Số đơn | Số đơn của shop trong phiên |
| Tổng COD | COD GHN đã nhận |
| Phí ship | Phí ship theo bảng giá đại lý |
| Nhận về | `Tổng COD − Phí ship` |
| Trạng thái | Chờ thanh toán |

### Xem chi tiết phiên

Nhấn **Xem** ở cột cuối → mở modal chi tiết:

- Tóm tắt: **Tổng COD** · **Phí ship** · **Nhận về** · **Số lệch** (nếu có)
- Bảng đơn hàng: Mã đơn GHN · COD · Phí ship · Trạng thái đối soát

**Trạng thái từng đơn:**

| Trạng thái | Ý nghĩa |
|------------|---------|
| Khớp | COD và phí ship GHN trùng với hệ thống |
| Lệch | COD hoặc phí ship khác — hiển thị giá trị hệ thống để so sánh |
| Không tìm thấy | Đơn trong file GHN không có trong hệ thống đại lý |

> Shop không có quyền xác nhận phiên — chỉ xem.

---

## Luồng tổng thể

```
[Agency Admin] Upload file GHN
        ↓
[Agency Admin] Phiên GHN → Chờ xác nhận
        ↓
[Agency Admin] Xác nhận phiên GHN
        ↓ (tự động)
[Agency Admin] Phiên shop tạo ra (Chờ xác nhận)
[Web Shop]     Phiên xuất hiện trong trang Đối soát (Chờ thanh toán)
        ↓
[Agency Admin] Xác nhận phiên shop → Đã xác nhận   (⚠️ chưa implement — xem gap ở trên)
```
