---
id: AGA-ORDER-14
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Tạo đơn hàng mới : Import đơn hàng hợp lệ

## User Story

Là Agency Admin (Đại lý), tôi muốn import nhiều đơn hàng cùng lúc từ một file Excel duy nhất — hỗ trợ cả đơn Hàng hoá lẫn đơn Thư trong cùng một file — để nhập hộ shop số lượng lớn đơn mà không cần tạo từng đơn một, đồng thời có thể xem và sửa lỗi ngay trên màn review trước khi xác nhận.

## User Flow

1. Truy cập trang "Nhập đơn hàng" từ sidebar (mục con dưới "Đơn hàng") hoặc bấm nút "Import đơn hàng" trên trang danh sách đơn — cả hai đều điều hướng đến trang `/agency-admin/orders/import` (không còn là modal)
2. Bấm "Tải xuống file mẫu" nếu chưa có file — nhận file `mau-import-don-hang.xlsx` gồm 2 sheet: "Nhập đơn hàng" (13 cột, 2 dòng ví dụ — 1 Hàng hoá, 1 Thư) và "Danh sách Shop"
3. Điền dữ liệu vào file theo thứ tự cột; cột "Loại đơn" phân biệt từng dòng là Hàng hoá hay Thư
4. Upload file: kéo thả vào vùng dấu chấm lửng (có feedback đổi màu khi kéo qua) hoặc bấm "chọn file từ máy tính"; hỗ trợ `.xlsx`, `.xls`, `.xlsm`
5. Hệ thống parse file ngay lập tức và chuyển sang màn review (upload zone ẩn hẳn):
   - Header đổi thành icon Excel + tên file + nút đỏ "Huỷ"
   - Card "Địa chỉ lấy hàng & Nhà vận chuyển" tóm tắt file (địa chỉ shop, carrier tương ứng)
   - Tab "Đơn hàng hợp lệ N" / "Đơn hàng lỗi N" dạng pill đen
   - Bảng hiển thị từng dòng theo tab đang chọn, mọi field đều sửa được trực tiếp
6. Xem và sửa lỗi ngay trên bảng: sửa bất kỳ field nào → hệ thống re-validate dòng đó ngay lập tức → dòng tự chuyển tab (Lỗi ↔ Hợp lệ) theo kết quả validate mới
7. Xoá đơn không muốn import: tick checkbox nhiều dòng → "Xoá N đơn đã chọn", hoặc bấm icon X trên từng dòng
8. Bấm "Nhập N đơn hợp lệ" (disabled khi không có đơn hợp lệ nào) → xác nhận import

## System Flow

1. Người dùng chọn file (click hoặc kéo thả) — `handleFile()` gọi `parseImportSheet()` đọc sheet đầu tiên của workbook bằng `XLSX.read()`
2. Với mỗi dòng dữ liệu không trống: các cột số (Khối lượng, Dài/Rộng/Cao, COD, Phí ship) strip dấu chấm/phẩy phân cách hàng nghìn trước khi parse (`getNum = col => get(col).replace(/[.,\s]/g, '')`); Dài/Rộng/Cao để trống mặc định 10cm
3. `validateRawRow()` kiểm tra từng dòng: `shopId` phải thuộc danh sách shop của đại lý; `orderKindRaw` phải là "Hàng hoá" hoặc "Thư"; `receiverName`, `receiverPhone`, `receiverAddress` không rỗng; `weight` là số dương ≤ 20.000g; các chiều 1–200cm; `cod` chỉ validate khi loại đơn là Hàng hoá; `fee` là số không âm. Dòng Thư có COD khác 0 không bị báo lỗi — giá trị bị bỏ qua tự động
4. State chuyển sang review mode (`isReview = !!rows`): upload zone ẩn hẳn, header đổi thành tên file + nút đỏ Huỷ
5. Card "Địa chỉ lấy hàng & Nhà vận chuyển" tự thích nghi: 1 shop → hiện tên/SĐT/địa chỉ shop đó; nhiều shop → hiện "N shop khác nhau — mỗi dòng lấy đúng địa chỉ theo Mã shop". Carrier: GHN cho Hàng hoá (dispatch ngay), 247Express cho Thư (chờ xử lý), tóm tắt tỷ lệ nếu file có cả 2 loại
6. Inline editing: `updateRowField()` cập nhật `r.raw` rồi gọi lại `validateRawRow()` — dòng tự chuyển tab hợp lệ/lỗi theo kết quả re-validate mà không cần thao tác thêm
7. Confirm: `handleConfirm()` duyệt `validRows` (dòng có `errors.length === 0`), với mỗi dòng lấy `senderName`/`senderPhone` từ `shop.ownerName`/`shop.phone`, rồi gọi `addOrder()`. Hàng hoá → `dispatchStatus: 'dispatched'`, `carrierCode: 'GHN'`; Thư → `dispatchStatus: 'pending_agency'`, `carrierCode: null`, `cod = 0` bất kể giá trị trong file
8. Toast "Đã nhập thành công N đơn hàng (X Hàng hoá · Y Thư)" hiện top-center (dark pill + green checkmark) → sau ~1,4 giây tự điều hướng về `/agency-admin/orders`

## Acceptance Criteria

**AC1:** Trang "Nhập đơn hàng" là trang riêng tại `/agency-admin/orders/import`, truy cập được từ sidebar (mục con "Nhập đơn hàng" dưới "Đơn hàng") và từ nút "Import đơn hàng" trên trang danh sách đơn hàng.

**AC2:** Bấm "Tải xuống file mẫu" → tải về `mau-import-don-hang.xlsx` gồm 2 sheet: sheet "Nhập đơn hàng" với 13 cột theo thứ tự chuẩn + 2 dòng ví dụ (1 Hàng hoá, 1 Thư), và sheet "Danh sách Shop" liệt kê mã + tên tất cả shop thuộc đại lý đang đăng nhập.

**AC3:** Vùng upload nhận file bằng cả hai cách: click để duyệt file và kéo thả trực tiếp. Trong lúc kéo file vào vùng, vùng upload đổi nền + viền sang màu cam để báo hiệu sẵn sàng nhận.

**AC4:** Chỉ nhận file Excel (`.xlsx`, `.xls`, `.xlsm`). File sai định dạng hoặc không đọc được → hiện lỗi đỏ "File không đúng định dạng — vui lòng dùng đúng template", không crash.

**AC5:** Sau khi file được parse thành công, toàn bộ upload zone ẩn hẳn. Header trang đổi thành icon Excel xanh lá + tên file + nút đỏ "Huỷ". Bấm "Huỷ" → điều hướng về trang danh sách đơn hàng.

**AC6:** Card "Địa chỉ lấy hàng & Nhà vận chuyển" hiển thị đúng theo nội dung file:
- 1 shop trong file: hiện tên shop, số điện thoại, địa chỉ pickup của shop đó
- Nhiều shop: hiện "N shop khác nhau — mỗi dòng lấy đúng địa chỉ của shop tương ứng theo Mã shop"
- Carrier: tóm tắt GHN (Hàng hoá, tự dispatch ngay) và/hoặc 247Express (Thư, vào Chờ xử lý) theo tỷ lệ thực tế trong file

**AC7:** Bảng review hiển thị 2 tab "Đơn hàng hợp lệ N" / "Đơn hàng lỗi N". Tab "Lỗi" có thêm cột "Lỗi" liệt kê rõ lý do lỗi của từng dòng.

**AC8:** Mọi field có thể gây lỗi đều có input sửa được trực tiếp trên bảng:
- **Mã shop** *(bắt buộc)*: dropdown danh sách shop của đại lý; viền đỏ + nền đỏ nhạt nếu mã không tồn tại
- **Loại đơn** *(bắt buộc)*: dropdown "Hàng hoá" / "Thư"; viền đỏ nếu không nhận ra giá trị
- **Số điện thoại** *(bắt buộc)*: text input; viền đỏ nếu rỗng
- **Tên người nhận** *(bắt buộc)*: text input; viền đỏ nếu rỗng
- **Địa chỉ** *(bắt buộc)*: text input; viền đỏ nếu rỗng
- **COD**: input số cho đơn Hàng hoá; badge xám "Không áp dụng" (không editable) cho đơn Thư — nếu file có COD khác 0 cho dòng Thư thì badge thêm "— đã bỏ qua" với tooltip hiện giá trị bị bỏ qua
- **Phí ship**: dropdown "Shop trả"/"Khách trả" + input số tiền phí
- **Khối lượng** *(bắt buộc)*: input số (gram, dương, tối đa 20.000g); **Dài / Rộng / Cao**: 3 input cm, mặc định 10cm nếu trống, tối đa 200cm mỗi chiều
- **Sản phẩm**: bấm icon bút chì để mở input inline; Enter hoặc blur để đóng

**AC9:** Sau mỗi lần sửa field, hệ thống re-validate dòng đó ngay lập tức. Nếu dòng từ lỗi được sửa hết lỗi, nó tự chuyển sang tab "Hợp lệ" — và ngược lại — mà không cần thao tác thêm.

**AC10:** Có thể xoá đơn khỏi batch trước khi import: tick checkbox nhiều dòng → "Xoá N đơn đã chọn" (hiện ở đầu bảng khi có chọn), hoặc bấm icon X trên từng dòng. Checkbox header cho phép chọn/bỏ chọn toàn bộ trang hiện tại.

**AC11:** Bảng có phân trang: dropdown chọn số dòng/trang (10/20/50), nút trang trước/sau, input nhảy trực tiếp đến số trang bất kỳ.

**AC12:** Nút "Nhập N đơn hợp lệ" bị disabled (màu xám) khi không có đơn hợp lệ nào. Khi bấm xác nhận:
- Chỉ các dòng hợp lệ được tạo đơn thật qua `addOrder()`; dòng lỗi không được import
- Đơn Hàng hoá: `dispatchStatus: 'dispatched'`, `carrierCode: 'GHN'` → xuất hiện trong các tab theo trạng thái GHN
- Đơn Thư: `dispatchStatus: 'pending_agency'`, `carrierCode: null`, `cod = 0` → xuất hiện ở tab "Chờ xử lý"
- `senderName`/`senderPhone` tự động lấy từ `ownerName`/`phone` của shop trong hồ sơ đăng ký, không nhập tay trong file

**AC13:** Sau khi import thành công, toast "Đã nhập thành công N đơn hàng (X Hàng hoá · Y Thư)" hiện ở giữa trên cùng trang (dark pill, green checkmark, fixed top-center). Sau ~1,4 giây hệ thống tự điều hướng về trang danh sách đơn hàng.

**AC14:** Dòng có Mã shop không thuộc đại lý hiện tại → bị báo lỗi, không được import — không lộ dữ liệu shop của đại lý khác.

## Notes

- **Rewrite hoàn toàn so với thiết kế cũ:** phiên bản cũ dùng modal với màn chọn loại đơn trước, 2 template riêng (9 cột Hàng hoá / 8 cột Thư), không có drag-and-drop, không có inline editing, không có toast feedback, không có phân trang. Phiên bản mới: trang riêng (route thay modal), 1 template hợp nhất 13 cột (phân biệt Hàng hoá/Thư qua cột "Loại đơn" theo từng dòng), toàn bộ review table có inline editing, drag-and-drop, phân trang, và toast xác nhận.
- **Parse số kiểu VN:** cột số tự strip dấu chấm/phẩy phân cách hàng nghìn trước khi parse — người dùng gõ "25.000" hay "5.000.000" vào file Excel không bị JS's `Number()` parse sai thành 25 hoặc NaN.
- **COD cho đơn Thư:** dùng chung cột COD trong file với đơn Hàng hoá — thay vì báo lỗi (gây phiền khi đại lý dùng cùng một file cho cả 2 loại), giá trị COD của dòng Thư bị bỏ qua tự động, badge "Không áp dụng" hiện trên review. Khi import, `cod` của đơn Thư luôn = 0 bất kể file ghi gì.
- **Gap còn lại (chưa sửa):** `product` (tên sản phẩm), `length`/`width`/`height` (kích thước), và `feeType` (Trả ship — Shop/Khách) được capture và hiển thị trong review UI nhưng không được lưu vào `Order` — `Order` type trong `orderStore.ts` không có các field này. Đây là gap có sẵn của codebase, không phải do lần rewrite này giới thiệu.
- TLHH (tỷ lệ hoàn hàng) hiển thị kèm số điện thoại người nhận là badge tĩnh "0%" — chưa có dữ liệu thật để tính.
- Import trùng file 2 lần vẫn tạo đơn trùng — không có cơ chế chặn theo trùng số điện thoại/địa chỉ.
- Đây là 1 trong 2 cách tạo đơn hộ shop (cách kia là drawer "Tạo đơn hàng" — xem [tao-don-hang-thay-shop.md](./tao-don-hang-thay-shop.md)); cả hai dùng chung `addOrder()` từ `orderStore`.
