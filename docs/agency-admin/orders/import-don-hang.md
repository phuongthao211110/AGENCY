---
id: AGA-ORDER-14
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Import đơn hàng từ Excel

## User Story

Là Agency Admin (Đại lý), tôi muốn import nhiều đơn hàng cùng lúc từ file Excel, để nhập hộ shop số lượng lớn đơn thay vì tạo từng đơn một qua drawer "Tạo đơn hàng".

## User Flow

1. Ở trang "Đơn hàng", bấm nút "Import đơn hàng" (đặt cạnh nút "Xuất đơn hàng", cùng style viền xám nền trắng)
2. Modal "Import đơn hàng" mở ra, đầu modal có banner "Bạn chưa có file mẫu import đơn hàng?" kèm nút "Tải xuống file mẫu" — bấm để tải file `.xlsx` mẫu có sẵn 2 dòng ví dụ (1 Hàng hoá + 1 Thư) và 1 sheet "Danh sách Shop" (mã shop ↔ tên shop) để tra cứu khi điền
3. Bấm vùng upload (khung nét đứt xanh, icon tải lên, chữ "Chọn file từ máy tính. Chọn file"), chọn file `.xlsx`/`.xls`/`.xlsm`
4. Hệ thống đọc và validate từng dòng ngay lập tức, hiện preview: số dòng "Hợp lệ" / "Lỗi", kèm danh sách lý do lỗi theo từng dòng (VD: "Dòng 4: Không tìm thấy shop SHP999")
5. Bấm "Import N đơn hợp lệ" → các dòng hợp lệ được tạo thành đơn hàng thật, dòng lỗi bị bỏ qua
6. Đóng modal, danh sách đơn hàng refresh — đơn "Hàng hoá" xuất hiện ở tab tương ứng theo trạng thái GHN, đơn "Thư" xuất hiện ở tab "Chờ xử lý"

## System Flow

1. Cột bắt buộc theo đúng thứ tự: `Mã shop, Loại đơn, Khách hàng, Số điện thoại, Địa chỉ giao hàng, Sản phẩm, Khối lượng (kg), Tiền thu hộ COD (đ), Phí ship (giá bán shop, đ), Trả ship`
2. Nút "Tải xuống file mẫu" (`downloadImportTemplate()`) sinh workbook 2 sheet: sheet "Import đơn hàng" (header + 2 dòng mẫu) và sheet "Danh sách Shop" (toàn bộ `agencyShops` — mã + tên) để agency tra mã shop ngay trong file mẫu, không cần rời modal
3. Parse thật bằng `XLSX.read()` trên nội dung file upload (không phải progress bar giả) — đọc toàn bộ sheet đầu tiên qua `sheet_to_json({ header: 1 })`, bỏ dòng tiêu đề và dòng trống
4. Validate từng dòng: `Mã shop` phải khớp 1 shop thuộc đại lý hiện tại (`agencyShops`); `Loại đơn` chỉ nhận "Hàng hoá" hoặc "Thư"; các trường bắt buộc (Khách hàng, SĐT, Địa chỉ) không rỗng; Khối lượng phải là số dương; COD nếu có phải là số; Phí ship phải là số không âm
5. Dòng hợp lệ → build `Order` object, set `sendKind` theo Loại đơn:
   - **"Hàng hoá"** → `dispatchStatus: 'dispatched'`, `carrierCode: 'GHN'`, `status: 'pending'` (giống luồng shop tự tạo đơn hàng hoá — coi như đã gửi GHN ngay)
   - **"Thư"** → `dispatchStatus: 'pending_agency'`, `carrierCode: null`, `status: 'pending'` (chờ đại lý xác nhận gửi qua 247Express, giống luồng `CreateLetterDrawer` bên Web Shop)
6. `senderName`/`senderPhone` lấy từ `ownerName`/`phone` của shop tương ứng trong `shops.json`
7. Mỗi dòng hợp lệ gọi `addOrder()` (dùng chung cơ chế với `orderStore.ts`) → `refreshOrders()` load lại danh sách từ store

## Acceptance Criteria

**AC1:** Nút "Import đơn hàng" hiển thị cùng hàng với "Xuất đơn hàng", cùng style (viền xám, nền trắng, icon), khác icon xoay 180° để phân biệt chiều import/export.

**AC2:** Chưa chọn file → nút xác nhận hiện "Chọn file để tiếp tục" và bị khoá (disabled).

**AC3:** Chọn file đúng định dạng → hiện đúng số dòng "Hợp lệ"/"Lỗi", danh sách lỗi liệt kê rõ số dòng + lý do cụ thể (không phải thông báo lỗi chung chung).

**AC4:** Chọn file sai định dạng (không phải Excel) → hiện thông báo lỗi đỏ "File không đúng định dạng — vui lòng dùng đúng template", không crash.

**AC5:** Dòng có `Mã shop` không thuộc đại lý hiện tại → bị coi là lỗi, không được import, không lộ dữ liệu shop ngoài đại lý.

**AC6:** Bấm "Import N đơn hợp lệ" → chỉ N dòng hợp lệ được tạo thành đơn thật trong `orderStore`, dòng lỗi bị bỏ qua hoàn toàn, không tạo đơn rác.

**AC7:** Đơn "Thư" import xong xuất hiện ngay ở tab "Chờ xử lý"; đơn "Hàng hoá" import xong xuất hiện ở tab "Đơn nháp"/trạng thái tương ứng — không lẫn lộn giữa 2 loại.

**AC8:** Sau khi import, danh sách đơn hàng tự refresh mà không cần tải lại trang.

**AC9:** Bấm "Tải xuống file mẫu" → tải về file `.xlsx` gồm đúng 10 cột theo thứ tự chuẩn, có sẵn 2 dòng ví dụ (1 "Hàng hoá", 1 "Thư") và 1 sheet "Danh sách Shop" liệt kê đúng mã + tên các shop thuộc đại lý đang đăng nhập.

## Notes

- Cùng nguyên tắc "làm thật" như tính năng Xuất đơn hàng — không dùng progress bar giả lập như modal upload file đối soát GHN (`AgencyReconciliation.tsx`), mà parse nội dung file thật bằng thư viện `xlsx` đã có sẵn trong dự án.
- Import không phân biệt carrier tường minh (không có cột "NVC") — carrier được **suy ra từ Loại đơn** giống hệt cách Service/Bảng giá đã hợp nhất luồng GHN/247Express trước đó: "Hàng hoá" luôn qua GHN trực tiếp, "Thư" luôn phải qua đại lý dispatch 247Express.
- Đây là 1 trong 2 cách tạo đơn hộ shop (cách kia là drawer "Tạo đơn hàng" — hiện có gap chưa persist, xem [tao-don-hang-thay-shop.md](./tao-don-hang-thay-shop.md)); import dùng chung `addOrder()` nên không bị gap đó.
- Sheet "Danh sách Shop" trong file mẫu giải quyết trực tiếp vấn đề agency không biết "Mã shop" (ID nội bộ, VD `SHP001`) của shop nào — trước đây phải tự qua trang "Shop" để tra, giờ có sẵn ngay trong file mẫu.
