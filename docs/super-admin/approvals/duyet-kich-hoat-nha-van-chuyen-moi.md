---
id: GSA-APV-2
jiraKey: 
platform: super-admin
section: Duyệt yêu cầu
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Duyệt yêu cầu: Duyệt kích hoạt nhà vận chuyển mới (247Express)

## User Story

Là GHN Super Admin, tôi muốn xem và xử lý các yêu cầu kích hoạt nhà vận chuyển mới (ví dụ: 247Express) từ đại lý và khi duyệt, gán ClientHubID (Mã điểm lấy hàng) cho đại lý đó để đại lý có thể sử dụng nhà vận chuyển trong hệ thống.

## User Flow

1. Super Admin vào trang Approvals → lọc loại "Kích hoạt nhà vận chuyển"
2. Hệ thống hiển thị danh sách yêu cầu kích hoạt NVC đang chờ
3. Super Admin xem chi tiết yêu cầu: tên đại lý, NVC muốn kích hoạt, ghi chú của đại lý
4. Super Admin click "Duyệt" → hệ thống hiển thị bước bổ sung: chọn ClientHubID từ danh sách hub khả dụng
5. Super Admin chọn ClientHubID → xác nhận duyệt → đại lý được kích hoạt NVC 247Express với hub đã gán
6. Hoặc Super Admin click "Từ chối" → nhập lý do → gửi

## System Flow

1. Khi Agency Admin submit yêu cầu kích hoạt NVC mới trong tab "Kết nối" (kèm ghi chú), hệ thống tạo pending request loại "carrier-activation"
2. Khi Super Admin duyệt và chọn ClientHubID: hệ thống gán ClientHubID cho agency_id tương ứng, kích hoạt NVC 247Express trong tài khoản đại lý
3. Sau khi approved: Agency Admin thấy 247Express "Đã kích hoạt" cùng ClientHubID trong tab "Kết nối" của Thiết lập NVC, và có thể bắt đầu tạo dịch vụ và bảng giá 247Express
4. Khi từ chối: status request chuyển "rejected", lý do được lưu

## Tác động đa nền tảng

| Platform | Thay đổi |
|---|---|
| **Agency Admin** — Thiết lập NVC / tab Kết nối | Sau khi được duyệt, 247Express hiển thị trạng thái "Đã kích hoạt" cùng ClientHubID được gán. Agency Admin có thể tạo dịch vụ và bảng giá 247Express. |

## Acceptance Criteria

**AC1:** Trong danh sách Approvals, mỗi yêu cầu kích hoạt NVC hiển thị: Tên đại lý (mã đại lý), Nhà vận chuyển yêu cầu kích hoạt, Ghi chú của đại lý, Ngày yêu cầu.

**AC2:** Khi Super Admin click "Duyệt" yêu cầu kích hoạt 247Express, hệ thống hiển thị bước bổ sung: dropdown chọn ClientHubID (Mã điểm lấy hàng) *(bắt buộc)* từ danh sách hub khả dụng. Không thể xác nhận duyệt khi chưa chọn ClientHubID.

**AC3:** Sau khi duyệt thành công, Agency Admin được kích hoạt NVC 247Express và được gán ClientHubID tương ứng. Agency Admin có thể tạo dịch vụ 247Express và bảng giá 247Express.

**AC4:** Super Admin có thể từ chối yêu cầu → bắt buộc nhập lý do từ chối *(bắt buộc)*: tối đa 500 ký tự; Agency Admin thấy trạng thái "Bị từ chối" kèm lý do trong tab "Kết nối".

**AC5:** Super Admin có thể xem lịch sử các yêu cầu đã xử lý (approved / rejected) bên cạnh danh sách chờ duyệt hiện tại, với thông tin người xử lý và thời gian.
