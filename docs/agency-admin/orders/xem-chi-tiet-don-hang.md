---
id: AGA-ORDER-10
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Chi tiết: Xem thông tin đơn hàng

## User Story

Là Agency Admin (Đại lý), tôi muốn bấm vào 1 đơn để xem đầy đủ thông tin bên gửi/nhận, sản phẩm, phí vận chuyển và phụ phí, để kiểm tra chi tiết đơn khi cần đối chiếu với shop hoặc khách hàng.

## User Flow

1. Bấm vào mã đơn hàng (hoặc bấm vào dòng đơn) → drawer chi tiết trượt ra từ phải
2. Tab "Thông tin đơn" (mặc định) hiển thị lần lượt: Bên gửi, Bên nhận, Sản phẩm, Thông tin đơn hàng, Phí vận chuyển, Phụ phí, và khối tổng tiền ở cuối
3. Đóng drawer (nút X) để quay lại danh sách

## System Flow

1. `OrderDetailDrawer` mở khi `selectedOrder` được set (bấm dòng/mã đơn), `activeTab` reset về `'info'` mỗi lần đổi đơn
2. Card **Bên gửi**: tên/SĐT/địa chỉ chủ shop (fallback về `order.senderName/senderPhone` nếu không tìm thấy shop)
3. Card **Bên nhận**: `order.receiverName/receiverPhone/receiverAddress`
4. Card **Sản phẩm**: khối lượng thật (`order.weight`), kích thước hiển thị cố định 10x10x10cm
5. Card **Thông tin đơn hàng**: `order.createdAt`, `order.cod`, trạng thái lấy từ `order.log[0].status_name` (fallback `order.status`)
6. Card **Phí vận chuyển**: `order.fee` (đã đổi nhãn "giá bán shop" ở story riêng)
7. Card **Phụ phí**: 4 dòng phụ phí cố định
8. Khối tổng cuối: Tổng phí vận chuyển + Tổng thu khách hàng (`order.cod`)

## Acceptance Criteria

**AC1:** Bấm vào mã đơn hoặc dòng đơn bất kỳ → drawer chi tiết mở đúng đơn đã bấm.

**AC2:** Card Bên gửi/Bên nhận hiển thị đúng thông tin của đơn đang xem.

**AC3:** Card Thông tin đơn hàng hiển thị đúng ngày tạo, COD, trạng thái mới nhất của đơn.

**AC4:** Đóng drawer → quay lại đúng vị trí danh sách trước đó (tab/trang/filter không đổi).

**AC5:** Mở đơn khác trong khi drawer đang mở → nội dung cập nhật đúng theo đơn mới, tab con quay về "Thông tin đơn".

## Notes

- **GAP đã biết:** một số nội dung trong drawer đang hiển thị **cố định/mẫu**, không phản ánh đúng dữ liệu thật của từng đơn — cụ thể: card Sản phẩm luôn hiện 1 dòng sản phẩm giả ("Sản phẩm", SL 1, giá 0đ) thay vì sản phẩm thật của đơn; card Phí vận chuyển luôn hiện tên dịch vụ cố định "2 shop 1 nặng 1 nhẹ"; card Phụ phí luôn hiện 4 dòng "0đ" bất kể đơn có phụ phí thật hay không; các dòng "Giảm giá"/"Thu ship khách hàng"/"Giá trị hàng" ở card Thông tin đơn hàng luôn "0 đ"; các "link" Ghi chú/Thanh toán/Nguồn tạo không có chức năng. Đây là phần dữ liệu demo/tĩnh, chưa nối với dữ liệu thật của từng đơn — cần xác nhận với BA có cần làm động không.
