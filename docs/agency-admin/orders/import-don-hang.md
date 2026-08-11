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
2. Modal mở ra, **màn đầu tiên là chọn loại đơn** — 2 thẻ **"Hàng hoá"** (có COD, sản phẩm) và **"Thư, tài liệu"** (không COD, vào tab "Chờ xử lý") — chưa thấy khu vực upload nào ở bước này
3. Chọn 1 loại → chuyển sang màn upload **riêng cho loại đó**: tiêu đề modal đổi thành "Import đơn hàng — Hàng hoá"/"— Thư", banner tải file mẫu và dòng "Thứ tự cột" đổi theo đúng cột của loại đã chọn, có link **"← Đổi loại đơn"** để quay lại màn chọn nếu bấm nhầm
4. Bấm vùng upload (khung nét đứt xanh), chọn file `.xlsx`/`.xls`/`.xlsm` đúng template của loại đã chọn
5. Hệ thống đọc và validate từng dòng ngay lập tức, hiện preview: số dòng "Hợp lệ" / "Lỗi", kèm danh sách lý do lỗi theo từng dòng (VD: "Dòng 4: Không tìm thấy shop SHP999")
6. Bấm "Import N đơn hợp lệ" → các dòng hợp lệ được tạo thành đơn hàng thật (đều cùng loại đã chọn ở bước 2), dòng lỗi bị bỏ qua
7. Đóng modal, danh sách đơn hàng refresh — đơn "Hàng hoá" xuất hiện ở tab tương ứng theo trạng thái GHN, đơn "Thư" xuất hiện ở tab "Chờ xử lý"

## System Flow

1. **Tách 2 bộ cột riêng theo loại** (không còn cột "Loại đơn" chung, vì loại đã chọn trước ở màn đầu modal):
   - `IMPORT_HEADERS_GOODS`: `Mã shop, Khách hàng, Số điện thoại, Địa chỉ giao hàng, Sản phẩm, Khối lượng (kg), Tiền thu hộ COD (đ), Phí ship (giá bán shop, đ), Trả ship`
   - `IMPORT_HEADERS_LETTER`: `Mã shop, Khách hàng, Số điện thoại, Địa chỉ giao hàng, Nội dung thư, Khối lượng (kg), Phí ship (giá bán shop, đ), Trả ship` — **không có cột COD** (đơn Thư luôn `cod: 0`), "Sản phẩm" đổi tên "Nội dung thư"
2. State `kind: 'goods' | 'letter' | null` trong `ImportOrdersModal` — `null` = đang ở màn chọn loại; chọn xong mới hiện khu vực tải template/upload, tương ứng đúng `kind`
3. Nút "Tải xuống file mẫu" (`downloadImportTemplate(kind)`) sinh workbook 2 sheet theo đúng `kind`: sheet import (header + 2 dòng mẫu của riêng loại đó) và sheet "Danh sách Shop" (toàn bộ `agencyShops`) — tên file cũng khác nhau (`mau-import-don-hang-hoa.xlsx` / `mau-import-don-thu.xlsx`)
4. Parse thật bằng `XLSX.read()` (`parseImportSheet(file, kind)`) — đọc theo đúng số cột/thứ tự của `kind`, không đọc cột "Loại đơn" nữa vì `kind` đã cố định từ trước
5. Validate từng dòng: `Mã shop` phải khớp 1 shop thuộc đại lý hiện tại; các trường bắt buộc (Khách hàng, SĐT, Địa chỉ) không rỗng; Khối lượng phải là số dương; COD (chỉ validate khi `kind==='goods'`) nếu có phải là số; Phí ship phải là số không âm
6. Dòng hợp lệ → build `Order` object, `sendKind = kind` (không còn suy từ text cột "Loại đơn"):
   - **`kind: 'goods'`** → `dispatchStatus: 'dispatched'`, `carrierCode: 'GHN'`, `status: 'pending'`
   - **`kind: 'letter'`** → `dispatchStatus: 'pending_agency'`, `carrierCode: null`, `status: 'pending'`, `cod: 0` cố định
7. `senderName`/`senderPhone` lấy từ `ownerName`/`phone` của shop tương ứng trong `shops.json`
8. Mỗi dòng hợp lệ gọi `addOrder()` (dùng chung cơ chế với `orderStore.ts`) → `refreshOrders()` load lại danh sách từ store

## Acceptance Criteria

**AC1:** Nút "Import đơn hàng" hiển thị cùng hàng với "Xuất đơn hàng", cùng style (viền xám, nền trắng, icon), khác icon xoay 180° để phân biệt chiều import/export.

**AC2:** Chưa chọn file → nút xác nhận hiện "Chọn file để tiếp tục" và bị khoá (disabled).

**AC3:** Chọn file đúng định dạng → hiện đúng số dòng "Hợp lệ"/"Lỗi", danh sách lỗi liệt kê rõ số dòng + lý do cụ thể (không phải thông báo lỗi chung chung).

**AC4:** Chọn file sai định dạng (không phải Excel) → hiện thông báo lỗi đỏ "File không đúng định dạng — vui lòng dùng đúng template", không crash.

**AC5:** Dòng có `Mã shop` không thuộc đại lý hiện tại → bị coi là lỗi, không được import, không lộ dữ liệu shop ngoài đại lý.

**AC6:** Bấm "Import N đơn hợp lệ" → chỉ N dòng hợp lệ được tạo thành đơn thật trong `orderStore`, dòng lỗi bị bỏ qua hoàn toàn, không tạo đơn rác.

**AC7:** Đơn "Thư" import xong xuất hiện ngay ở tab "Chờ xử lý"; đơn "Hàng hoá" import xong xuất hiện ở tab "Đơn nháp"/trạng thái tương ứng — không lẫn lộn giữa 2 loại.

**AC8:** Sau khi import, danh sách đơn hàng tự refresh mà không cần tải lại trang.

**AC9:** Bấm "Tải xuống file mẫu" → tải về file `.xlsx` gồm đúng số cột theo `kind` đã chọn (9 cột cho Hàng hoá, 8 cột cho Thư — không có COD), có sẵn 2 dòng ví dụ và 1 sheet "Danh sách Shop" liệt kê đúng mã + tên các shop thuộc đại lý đang đăng nhập.

**AC10:** Màn đầu tiên của modal luôn là chọn loại đơn (2 thẻ Hàng hoá/Thư) — chưa chọn thì không thấy banner tải file mẫu, khung upload, hay nút xác nhận nào.

**AC11:** Sau khi chọn 1 loại và đang ở màn upload, bấm "← Đổi loại đơn" → quay lại màn chọn loại, xoá hết file/kết quả parse đã có (không giữ lại preview của loại cũ).

## Notes

- Cùng nguyên tắc "làm thật" như tính năng Xuất đơn hàng — không dùng progress bar giả lập như modal upload file đối soát GHN (`AgencyReconciliation.tsx`), mà parse nội dung file thật bằng thư viện `xlsx` đã có sẵn trong dự án.
- **Tách 2 luồng theo yêu cầu trực tiếp:** ban đầu 1 file/1 template chung có cột "Loại đơn" để phân biệt; đại lý phản hồi muốn tách riêng — đổi sang chọn loại TRƯỚC (vẫn 1 nút, 1 modal, chỉ thêm 1 bước chọn), mỗi loại có template/cột bắt buộc phù hợp hơn (Thư không cần cột COD vốn luôn bằng 0).
- Đây là 1 trong 2 cách tạo đơn hộ shop (cách kia là drawer "Tạo đơn hàng" — hiện có gap chưa persist, xem [tao-don-hang-thay-shop.md](./tao-don-hang-thay-shop.md)); import dùng chung `addOrder()` nên không bị gap đó.
- Sheet "Danh sách Shop" trong file mẫu giải quyết trực tiếp vấn đề agency không biết "Mã shop" (ID nội bộ, VD `SHP001`) của shop nào — trước đây phải tự qua trang "Shop" để tra, giờ có sẵn ngay trong file mẫu.
- **Gap có sẵn (chưa sửa, ngoài phạm vi lần này):** cột "Trả ship" được parse nhưng không được dùng ở đâu cả — `Order` không có field fee-payer, UI hiển thị nhãn "Shop trả"/"Khách trả" giả lập từ hash ID đơn (giống `AgencyOrders.tsx`/`Orders.tsx` ở nơi khác), không đọc theo giá trị đã import. Cột này cũng không được validate giá trị hợp lệ.
- **Gap có sẵn:** import lại đúng file 2 lần sẽ tạo đơn trùng — không có cơ chế chặn theo trùng số điện thoại/địa chỉ hay bất kỳ khoá nào.
