---
id: AGA-RECON-2
jiraKey: 
platform: agency-admin
section: Đối soát & Chuyển khoản
figma: ""
status: draft
---

# [AGA] Đối soát: Mapping chỉ số bảng "Phiên GHN" — nguồn dữ liệu và công thức tính

## User Story

Là Agency Admin và dev team, tôi muốn biết rõ mỗi chỉ số hiển thị trong trang chi tiết "Phiên GHN" (`AgencyReconciliationDetail.tsx`) được lấy từ field nào trong mock data hoặc tính như thế nào tại runtime, để tin tưởng vào kết quả đối soát chênh lệch và xác định được điểm nào hệ thống đang thiếu dữ liệu so với file COD GHN thật (biên bản thanh toán GHN xuất ra).

## Data Mapping

Tài liệu này đối chiếu giữa cột/chỉ số trong file COD GHN thật (`GHN_Phien_Chuyen_Tien_*.xlsx`) và field/công thức tương ứng trong hệ thống. Nguồn dữ liệu: `carrier-reconciliation.json` (session-level) và `carrier-reconciliation-items.json` (item-level).

### Session-level — header và summary cards

| Chỉ số trong file GHN | Field hệ thống | Nguồn | Ghi chú |
|---|---|---|---|
| Phiên (mã phiên) | `session.ghnSessionCode` | JSON field | Hiển thị dạng "Phiên {code}" |
| Khách hàng (mã KH GHN) | `session.ghnShopId` → tra qua `GHN_SHOP_NAMES` | Map cứng trong code | Tên shop hardcode trong `AgencyReconciliationDetail.tsx`, chưa phải dữ liệu động |
| Ngày | `session.paymentDate` | JSON field | |
| Tổng đối soát (1) | `session.totalReconcile` | JSON field | |
| Nợ tồn (2) | `session.outstandingDebt` | JSON field | |
| Phí chuyển khoản COD (3) | `session.transferFee` | JSON field | |
| **Hoàn lại phí chuyển hoàn (4)** | **Không có field tương ứng** | **GAP** | Chưa được model trong schema `CarrierSession` hiện tại |
| Thực nhận | `session.netReceived` | JSON field | Hiển thị màu xanh `#16A34A` |
| **Ghi nợ (Nợ tồn) cho phiên sau** | **Không có field riêng** | **GAP** | `outstandingDebt` là nợ tồn của phiên hiện tại, không phải số ghi nợ chuyển sang phiên kế tiếp — cần field riêng như `carryForwardDebt` |
| Phí dịch vụ (5) | `session.totalFee` | JSON field | Đồng thời được tính lại runtime = `items.reduce(sum ghnFee)` và hiển thị ở card "Tổng phí DV (GHN)" — hai nguồn tính cùng tồn tại |
| Tổng đơn | `items.length` | Tính runtime | JSON có field `totalOrders` nhưng không dùng ở trang detail |
| **Số lệch** | `items.filter(status !== 'MATCH').length` | Tính runtime | **Chỉ số riêng của hệ thống** — không có trong file GHN gốc; giá trị gia tăng của tính năng đối soát chênh lệch |

### Item-level — bảng chi tiết từng đơn hàng

| Cột trong file GHN | Field hệ thống | Điều kiện hiển thị | Ghi chú |
|---|---|---|---|
| Mã đơn GHN | `item.orderCode` | Luôn hiển thị | Link màu xanh `#3B82F6`; màu xám nếu `status = NOT_FOUND` |
| Mã đơn khách hàng | `item.customerOrderCode` | Luôn hiển thị | |
| Cửa hàng | `item.shopName` | **Không hiển thị tại bảng này** | Có trong data nhưng chỉ dùng ở `AgencyReconciliationShopDetail.tsx` |
| **Người nhận** | **Không có field** | **GAP** | |
| **Địa chỉ nhận** | **Không có field** | **GAP** | |
| **Ngày tạo** | **Không có field** | **GAP** | |
| **Ngày giao/trả** | **Không có field** | **GAP** | Hệ thống hiện không model 4 cột hành trình đơn dù có trong file GHN thật |
| Trạng thái | `item.ghnStatus` | Luôn hiển thị | Màu theo nhóm: thành công / thất bại / xám / đang xử lý |
| (1) Tiền COD | `item.ghnCOD` đối chiếu `item.systemCOD` | Khi thành công | Tô đỏ nếu `ghnCOD !== systemCOD` |
| (2) Giao thất bại - thu tiền | `item.failedDeliveryCOD` | Khi thành công | |
| (3) Đã thanh toán trước | `item.prepaid` | Khi thành công | |
| (4) Khuyến mãi | `item.discount` | Khi thành công | |
| (5.1) Phí giao hàng | `item.deliveryFee` | Khi KHÔNG thành công | |
| (5.2) Phí giao lại | `item.redeliveryFee` | Khi thành công | |
| (5.3) Phí khai giá | `item.insuranceFee` | Khi KHÔNG thành công | |
| (5.4) Phí hoàn hàng | `item.returnFee` | Khi thành công | |
| (5) Phí dịch vụ | `item.serviceFee` đối chiếu `item.systemFee` | Luôn hiển thị | Tô đỏ nếu `abs(serviceFee) !== systemFee` |
| (1)+(2)+(3)+(4)+(5) | `item.totalReconcileItem` | Luôn hiển thị | |
| — (không có trong file GHN) | `item.status` (MATCH / MISMATCH / NOT_FOUND) | Luôn hiển thị | **Chỉ số riêng của hệ thống** — kết quả so khớp `ghnCOD` vs `systemCOD` và `serviceFee` vs `systemFee`; đây là giá trị cốt lõi của tính năng đối soát chênh lệch |

## Acceptance Criteria

**AC1:** Các chỉ số session-level map 1:1 từ JSON field (`carrier-reconciliation.json`) hiển thị đúng: `ghnSessionCode` → mã phiên, `paymentDate` → ngày, `totalReconcile` → Tổng đối soát, `outstandingDebt` → Nợ tồn, `transferFee` → Phí chuyển khoản COD, `netReceived` → Thực nhận, `totalFee` → Phí dịch vụ.

**AC2:** Các chỉ số tính runtime (không lưu sẵn trong JSON) được tính đúng: Tổng đơn = `items.length`; Số lệch = số item có `status !== 'MATCH'`; Card "Tổng phí DV (GHN)" = `items.reduce((sum, item) => sum + item.ghnFee, 0)`.

**AC3:** `item.status` (MATCH / MISMATCH / NOT_FOUND) và "Số lệch" là chỉ số riêng của hệ thống — không có trong file GHN gốc. Đây là giá trị gia tăng của tính năng đối soát chênh lệch, được tính dựa trên so sánh `ghnCOD` vs `systemCOD` và `serviceFee` vs `systemFee`.

**AC4:** Màu cảnh báo tô đỏ được áp dụng đúng: cột `ghnCOD` tô đỏ khi `ghnCOD !== systemCOD`; cột `serviceFee` tô đỏ khi `Math.abs(item.serviceFee) !== item.systemFee`. Đơn có `status = NOT_FOUND` hiển thị `orderCode` màu xám thay vì link xanh.

**AC5:** Tên khách hàng GHN được tra qua map cứng `GHN_SHOP_NAMES` trong `AgencyReconciliationDetail.tsx` dựa trên `session.ghnShopId`. Nếu `ghnShopId` không có trong map → hiển thị fallback hoặc để trống.

## Notes

- **GAP — Hoàn lại phí chuyển hoàn (4)**: File GHN thật có dòng "Hoàn lại phí chuyển hoàn" trong phần tổng quan phiên. Schema `CarrierSession` hiện không có field tương ứng. Cần bổ sung khi làm hệ thống thật.
- **GAP — Ghi nợ cho phiên sau**: File GHN thật tách "Ghi nợ (Nợ tồn) cho phiên sau" thành một dòng riêng biệt. `outstandingDebt` hiện tại chỉ phản ánh nợ tồn của phiên đang xem, không phải số tiền ghi nợ chuyển sang phiên kế tiếp — cần thêm field `carryForwardDebt` nếu làm thật.
- **GAP — Cột hành trình đơn**: File GHN thật có 4 cột: Người nhận, Địa chỉ nhận, Ngày tạo, Ngày giao/trả. `ItemRecord` hiện không model các cột này. Cần extend schema khi tích hợp thật.
- **Field thừa chưa dùng**: `item.codFee` và `item.partialDeliveryFee` có trong `carrier-reconciliation-items.json` nhưng không được dùng ở UI hiện tại. Cần confirm với BA: đây là field dự phòng hay đã deprecated?
- **Hai nguồn tính `totalFee`**: `session.totalFee` (lưu sẵn) và `items.reduce(sum ghnFee)` (runtime) đều xuất hiện trong cùng trang detail. Khi làm hệ thống thật cần chọn một source of truth — hiện tại cả hai cùng hiển thị trên hai card riêng biệt.
- **`shopName` không hiển thị ở bảng này**: `item.shopName` có trong data nhưng không render tại `AgencyReconciliationDetail.tsx` — chỉ dùng ở `AgencyReconciliationShopDetail.tsx`. Đây là thiết kế có chủ đích (xem theo phiên NVC ≠ xem theo shop), không phải thiếu sót.
