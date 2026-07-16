---
id: GSA-APV-1
jiraKey: 
platform: super-admin
section: Duyệt yêu cầu
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Duyệt yêu cầu: Duyệt kết nối Shop ID GHN của đại lý

## User Story

Là GHN Super Admin, tôi muốn xem và xử lý các yêu cầu kết nối Shop ID GHN đang chờ duyệt của một đại lý ngay trong modal "Xem yêu cầu" để kiểm soát Shop ID GHN nào được phép kết nối vào hệ thống của đại lý đó.

## User Flow

1. Super Admin vào danh sách đại lý (hoặc trang chi tiết đại lý) → bấm "Xem yêu cầu"
2. Modal "Xem yêu cầu" mở, mặc định ở tab "Kết nối Shop ID GHN"
3. Hệ thống hiển thị bảng các Shop ID GHN của đại lý: tên cửa hàng + mã Shop ID, số điện thoại, ngày yêu cầu, trạng thái, lý do (nếu bị từ chối) — có thể lọc theo trạng thái (Tất cả / Chờ duyệt / Đã duyệt / Từ chối) và phân trang
4. Với dòng đang "Chờ duyệt", Super Admin bấm "Duyệt" → shop chuyển "Đã duyệt" ngay, không có bước phụ nào khác
5. Hoặc Super Admin bấm "Từ chối" → ô nhập lý do hiện ngay dưới dòng đó (bắt buộc, tối đa 500 ký tự) → "Xác nhận từ chối"
6. Để xử lý nhiều dòng cùng lúc: Super Admin tick chọn nhiều dòng bằng checkbox đầu dòng (hoặc checkbox "chọn tất cả" ở header, áp dụng cho các dòng đang hiển thị trên trang hiện tại)
7. Khi có ít nhất 1 dòng được chọn, thanh hành động hiện cố định ở đáy màn hình: bên trái là icon đóng (bỏ chọn) + "Đã chọn N", bên phải là nút Duyệt / Từ chối
8. Bấm "Duyệt" trên thanh này → toàn bộ dòng đang "Chờ duyệt" trong lựa chọn chuyển "Đã duyệt" ngay lập tức
9. Hoặc bấm "Từ chối" trên thanh này → ô nhập 1 lý do dùng chung hiện phía trên thanh → xác nhận → toàn bộ dòng đang "Chờ duyệt" trong lựa chọn chuyển "Từ chối" với cùng lý do đó

## System Flow

1. Khi Agency Admin hoàn thành OTP kết nối Shop ID GHN, hệ thống tạo `ShopConnection` với `status: 'pending'`
2. Super Admin duyệt (từng dòng hoặc hàng loạt) → `approveShopConnection(id)` gọi cho từng id: `status` chuyển `'active'`
3. Super Admin từ chối (từng dòng hoặc hàng loạt) → `rejectShopConnection(id, reason)` gọi cho từng id: `status` chuyển `'rejected'`, lý do được lưu — khi từ chối hàng loạt, tất cả các id dùng chung 1 `reason`
4. Duyệt/từ chối hàng loạt chỉ áp dụng cho các id đang `status: 'pending'` trong tập đã chọn — id đã `active`/`rejected` bị lọc bỏ trước khi xử lý, không tính vào số lượng
5. Không có bước gán thêm dữ liệu nào khác (khác với 247Express — GHN không có khái niệm ClientHubID)

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Agency Admin** — Thiết lập NVC / tab Kết nối (GHN) | Sau khi duyệt, Shop ID hiển thị trạng thái "Đang hoạt động". Khi bị từ chối, hiển thị "Bị từ chối" kèm lý do. |

## Acceptance Criteria

**AC1:** Modal "Xem yêu cầu" (mở từ danh sách đại lý hoặc trang chi tiết đại lý) có tab "Kết nối Shop ID GHN", hiển thị dạng bảng nhiều dòng — vì một đại lý có thể có nhiều Shop ID GHN ở trạng thái "Chờ duyệt" cùng lúc.

**AC2:** Mỗi dòng hiển thị: Cửa hàng GHN (tên + mã Shop ID), Số điện thoại, Ngày yêu cầu, Trạng thái, Thao tác, Lý do. Có bộ lọc theo Trạng thái (Tất cả / Chờ duyệt / Đã duyệt / Từ chối) và phân trang (chọn số dòng/trang, chuyển trang).

**AC3:** Với dòng "Chờ duyệt", bấm "Duyệt" → shop chuyển "Đã duyệt" (hoạt động) ngay lập tức, không yêu cầu chọn thêm thông tin gì khác.

**AC4:** Bấm "Từ chối" → ô nhập lý do hiện ngay dưới dòng đó, bắt buộc nhập (tối đa 500 ký tự), không có nút Duyệt/Từ chối khác hiện cùng lúc cho dòng đó cho đến khi xác nhận hoặc huỷ.

**AC5:** Khi lọc theo một trạng thái mà không có dòng nào khớp, hiển thị "Không có yêu cầu nào".

**AC6:** Có thể chọn nhiều dòng bằng checkbox đầu mỗi dòng, hoặc checkbox "chọn tất cả" ở header (chỉ áp dụng cho các dòng đang hiển thị trên trang hiện tại theo phân trang).

**AC7:** Khi có ít nhất 1 dòng được chọn, thanh hành động hàng loạt hiện cố định ở đáy màn hình (đè lên nội dung phía dưới), gồm: icon đóng để bỏ chọn, số dòng đã chọn, và nút Duyệt / Từ chối.

**AC8:** Trong số dòng đã chọn, chỉ dòng đang "Chờ duyệt" mới được xử lý hàng loạt — dòng đã "Đã duyệt"/"Từ chối" trong lựa chọn bị bỏ qua, không tính vào số lượng xử lý. Nếu không có dòng "Chờ duyệt" nào trong lựa chọn, thanh hành động hiển thị thông báo thay vì 2 nút Duyệt/Từ chối.

**AC9:** Bấm "Duyệt" trên thanh hành động hàng loạt → toàn bộ dòng đang "Chờ duyệt" trong lựa chọn chuyển "Đã duyệt" ngay lập tức, không cần xác nhận thêm.

**AC10:** Bấm "Từ chối" trên thanh hành động hàng loạt → hiện 1 ô nhập lý do dùng chung (bắt buộc, tối đa 500 ký tự) → xác nhận → toàn bộ dòng đang "Chờ duyệt" trong lựa chọn chuyển "Từ chối" với cùng lý do đó.

**AC11:** Sau khi xử lý hàng loạt (Duyệt hoặc Từ chối) hoặc bấm icon đóng, danh sách đã chọn được xoá và thanh hành động hàng loạt ẩn đi.

**AC12:** Khi chuyển tab (Kết nối Shop ID GHN ↔ Kết nối 247Express), lựa chọn hàng loạt và trạng thái đang nhập lý do từ chối hàng loạt được reset về rỗng.
