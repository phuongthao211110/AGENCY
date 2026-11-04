---
id: SHOP-ORDER-55
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Báo cáo dòng tiền: Bảng phí dịch vụ đã/chưa thanh toán

## Bối cảnh

Story này là PHẦN LÕI của trang "Báo cáo dòng tiền" (route, nhãn, bảng chính, bộ lọc, dòng Tổng, export excel). Bản đầu của story này gộp chung CẢ phần badge cảnh báo trên bảng, 2 màn hình breakdown (Phí dịch vụ/Đã thanh toán), và nút thanh toán cho đại lý — nay tách thành các story nhỏ hơn để dễ review/ước lượng riêng:

- [SHOP-ORDER-57](./bao-cao-dong-tien-badge-canh-bao.md) — badge cảnh báo phát sinh thêm/cần hoàn ngay dưới mã vận đơn.
- [SHOP-ORDER-58](./bao-cao-dong-tien-breakdown-phi-dich-vu.md) — màn hình breakdown "Phí dịch vụ" (click vào số).
- [SHOP-ORDER-59](./bao-cao-dong-tien-breakdown-da-thanh-toan.md) — màn hình breakdown "Đã thanh toán" (kênh thanh toán).
- [SHOP-ORDER-60](./bao-cao-dong-tien-thanh-toan-cho-dai-ly.md) — nút "Thanh toán phí dịch vụ cho đại lý" (QR chuyển khoản).
- [SHOP-ORDER-61](./bao-cao-dong-tien-lich-su-thanh-toan.md) — nút "Lịch sử thanh toán".

5 story trên đều PHỤ THUỘC vào story này (route, bảng, công thức tính phí/đã thanh toán/chưa thanh toán) — làm xong story này trước mới có chỗ gắn badge/breakdown/nút vào.

## User Story

Là chủ shop, tôi muốn có 1 trang riêng dạng bảng đối soát (giống bảng "Phí dịch vụ" thật của GHN) để xem rõ tổng phí ship đã thanh toán và còn nợ bao nhiêu, cùng chi tiết từng đơn, lọc nhanh theo trạng thái/phương thức/thời gian, thay vì phải tự cộng tay hay lướt từng dòng trong danh sách đơn.

## User Flow

1. Vào menu "Báo cáo dòng tiền" trong sidebar Web Shop (icon 💲, giữa "Đơn hàng" và "Đối soát") → route `/shop/cash-flow`.
2. Đầu trang hiện nhãn **"Phí dịch vụ"** (gạch chân cam) — trang chỉ tập trung vào phí ship, không có tab "Tiền thu hộ" nào (COD đã có trang "Đối soát" riêng, không lặp lại ở đây).
3. Góc phải: ghi chú ngắn + nút **"Tải file excel"** (tải thật 1 file dữ liệu chứa đúng những gì đang hiển thị, đã áp dụng bộ lọc) + 2 nút tách biệt **"Lịch sử thanh toán"** và **"Thanh toán phí dịch vụ cho đại lý"** (xem [SHOP-ORDER-60](./bao-cao-dong-tien-thanh-toan-cho-dai-ly.md)/[SHOP-ORDER-61](./bao-cao-dong-tien-lich-su-thanh-toan.md) cho hành vi đầy đủ của 2 nút này).
4. Dưới toolbar là hàng **bộ lọc**: dropdown "Trạng thái" (Tất cả/Chờ duyệt/Đã duyệt/Đại lý từ chối, và tách riêng 2 lựa chọn "Chưa đủ — cần đóng thêm"/"Dư — đại lý cần hoàn" cho đơn đã duyệt nhưng phí sau đó thay đổi), dropdown "Phương thức" (Tất cả/Tiền mặt/MoMo/Chuyển khoản), 2 ô chọn ngày "Từ"/"đến" theo ngày thanh toán, ô "Tìm kiếm" theo mã đơn hoặc tên người nhận, và link "Xoá lọc" chỉ hiện khi đang áp dụng ít nhất 1 điều kiện lọc.
5. Bảng: dòng đầu tiên luôn là **"Tổng"** (nền cam nhạt), cộng dồn 3 cột tiền của các đơn đang khớp bộ lọc hiện tại (không phải toàn bộ đơn nếu đang lọc).
6. Các dòng sau, mỗi dòng 1 đơn: **STT**, **Mã đơn** (gạch chân xanh — có thể kèm badge cảnh báo ngay dưới, xem SHOP-ORDER-57), **Ngày thanh toán** (giờ + ngày), **Người nhận** (tên + SĐT che bớt "xxxx 1234" + tỉnh/thành), **Phương thức** (tên kênh: Tiền mặt/MoMo/Chuyển khoản — KHÔNG hiện trạng thái duyệt ở bảng, xem Notes), **Phí dịch vụ** (số ÂM — toàn bộ phí ship hiệu lực của đơn, có thể bấm vào xem breakdown, xem SHOP-ORDER-58), **Đã thanh toán** (số DƯƠNG nếu đại lý đã xác nhận, 0 nếu chưa, có thể bấm vào xem breakdown kênh, xem SHOP-ORDER-59), **Chưa thanh toán** (số ÂM nếu Shop còn nợ thêm, số DƯƠNG nếu đại lý cần hoàn, 0 nếu đã xong).
7. Không có đơn nào khớp bộ lọc đang chọn (nhưng shop vẫn có đơn khác) → thông báo riêng "Không có đơn nào khớp bộ lọc đã chọn", khác với thông báo "Chưa có đơn nào" khi shop chưa từng có đơn nào thuộc phạm vi trang này.
8. Chỉ hiện đơn Shop TỰ TRẢ SHIP (tiền mặt/MoMo/chuyển khoản) của shop đang đăng nhập — đơn Khách trả ship (COD) không xuất hiện.

## System Flow

1. Trang nằm trong mục "Báo cáo dòng tiền" ở sidebar Web Shop, chỉ hiện đơn của shop đang đăng nhập có ghi nhận trạng thái duyệt thanh toán, sắp xếp theo thời gian thanh toán gần nhất lên đầu — bảng phẳng, không nhóm theo ngày, khớp đúng dạng bảng đối soát thật.
2. Công thức tính 3 cột tiền dùng CHUNG với màn hình "Duyệt thanh toán" bên Agency Admin, để 2 phía luôn nhìn cùng 1 con số cho cùng 1 đơn: đơn huỷ mà chưa được hoàn tiền thì phí hiệu lực = 0 (không còn nghĩa vụ phí ship nào); đơn CHƯA được đại lý duyệt → Phí dịch vụ = Đã thanh toán 0, Chưa thanh toán = âm đúng bằng phí; đơn ĐÃ được duyệt → Đã thanh toán = đúng số tiền đại lý đã duyệt tại thời điểm đó, phần chênh lệch phát sinh SAU KHI duyệt (phí hoàn hàng/đổi địa chỉ, phúc tra, hoặc huỷ đơn) được tách riêng vào cột Chưa thanh toán thay vì gộp nhầm vào Đã thanh toán.
3. Dòng "Tổng" và file xuất Excel luôn tính trên đúng tập đơn đang khớp bộ lọc hiện tại (trạng thái/phương thức/khoảng ngày/từ khoá tìm kiếm) — đổi bộ lọc thì Tổng và file xuất cũng đổi theo tương ứng.
4. Bộ lọc KHÔNG ảnh hưởng đến khoản nợ thật dùng ở nút "Thanh toán phí dịch vụ cho đại lý" — khoản đó luôn tính trên toàn bộ đơn tiền mặt chưa khai, bất kể Shop đang lọc xem gì trên màn hình.
5. Cột "Người nhận" chỉ hiện 4 số cuối số điện thoại và phần cuối cùng của địa chỉ (coi như tỉnh/thành) — không hiện thông tin liên hệ đầy đủ.
6. Không có tab "Tiền thu hộ" nào trong trang này (đã bỏ theo yêu cầu) — COD xem ở trang "Đối soát" riêng.

## Acceptance Criteria

**AC1:** Sidebar Web Shop có mục "Báo cáo dòng tiền", route `/shop/cash-flow` mở đúng trang, không lỗi console.

**AC2:** Trang chỉ hiện nhãn "Phí dịch vụ" (gạch chân cam) — KHÔNG có tab "Tiền thu hộ" nào.

**AC3:** Dòng "Tổng" hiện đúng tổng 3 cột tiền của các đơn đang khớp bộ lọc hiện tại; luôn thoả |Phí dịch vụ| = Đã thanh toán + |Chưa thanh toán|.

**AC4:** Đơn đã được đại lý duyệt → "Đã thanh toán" > 0 (mặc định bằng đúng phí ship nếu chưa từng phát sinh gì sau khi duyệt), "Chưa thanh toán" = 0 — TRỪ KHI đơn có chênh lệch phát sinh sau duyệt (xem [SHOP-ORDER-57](./bao-cao-dong-tien-badge-canh-bao.md) cho đầy đủ 2 chiều phát sinh/hoàn).

**AC5:** Đơn CHƯA được đại lý duyệt (đang chờ duyệt hoặc đã bị từ chối) → "Đã thanh toán" = 0, "Chưa thanh toán" < 0 (đúng bằng phí ship của đơn).

**AC6:** Cột "Phương thức" hiện đúng tên kênh thanh toán (Tiền mặt/MoMo/Chuyển khoản) — bảng KHÔNG hiện badge trạng thái duyệt (Chờ duyệt/Đã duyệt/Đại lý từ chối) cho Shop ở giai đoạn đầu golive (xem Notes).

**AC7:** Cột "Người nhận" hiện SĐT che bớt dạng "xxxx 1234" (chỉ 4 số cuối) + tỉnh/thành — KHÔNG hiện SĐT đầy đủ.

**AC8:** Bộ lọc Trạng thái/Phương thức/Khoảng ngày/Tìm kiếm hoạt động đúng, có thể kết hợp đồng thời; link "Xoá lọc" chỉ hiện khi có ít nhất 1 điều kiện đang áp dụng, bấm vào reset toàn bộ về mặc định.

**AC9:** Dòng "Tổng" và file xuất Excel luôn khớp đúng tập đơn đang hiển thị sau khi lọc — không tính trên toàn bộ đơn khi đang lọc.

**AC10:** Bấm "Tải file excel" → tải thật 1 file đúng dữ liệu đang hiển thị (đã áp dụng bộ lọc), không lỗi.

**AC11:** Đơn Khách trả ship (COD) không xuất hiện trong bảng.

## Notes

- Đây là bản làm lại (v2) sau khi đối chiếu với 1 ảnh UI thật của GHN (bảng "Phí dịch vụ" trong trang đối soát) — bản v1 trước đó (chip tổng + 4 tab lọc + badge theo đơn, nhóm theo ngày) đã bị thay thế hoàn toàn vì không khớp cách trình bày thật.
- **Sửa lỗi cột "Trạng thái" (v3)**: bản trước đó (ghi trong note cũ là "cố tình") thực ra bị NHẦM — cột "Trạng thái" hiện tên kênh thanh toán (MoMo/CK/Tiền mặt) thay vì trạng thái duyệt, trong khi tiêu đề cột rõ ràng nói về trạng thái. Đã sửa (v3): cột này hiện đúng badge trạng thái duyệt (Chờ duyệt/Đã duyệt/Đại lý từ chối), tên kênh thanh toán chuyển xuống thành chữ nhỏ bên dưới badge.
- **Đơn giản hoá cho golive (v4)**: ngay sau khi sửa đúng (v3), quyết định BỎ hẳn badge trạng thái duyệt khỏi bảng này cho giai đoạn đầu golive — đổi cột lại thành "Phương thức" (chỉ hiện tên kênh, không có badge). Lý do: giai đoạn đầu golive nên đơn giản luồng hiển thị cho Shop, 2 cột "Đã thanh toán"/"Chưa thanh toán" đã đủ nói lên đơn nào xong/chưa xong mà không cần thêm badge trạng thái riêng. Đây CHỈ là ẩn ở lớp hiển thị — cơ chế duyệt tiền mặt nền (Agency Admin phải tự xác nhận đã nhận tiền mặt thật) HOÀN TOÀN KHÔNG đổi, 2 cột tiền vẫn tính đúng y như trước; bộ lọc "Trạng thái" vẫn giữ nguyên cho ai cần lọc sâu hơn dù không còn thấy badge trên từng dòng.
- **Thêm bộ lọc (v3)**: trước đây trang không có cách nào lọc/tìm nhanh, phải lướt hết cả bảng. Nay có đủ lọc theo trạng thái duyệt (gồm cả 2 trạng thái con "chưa đủ"/"dư" sau khi phát sinh phí), phương thức, khoảng ngày thanh toán, và tìm theo mã đơn/tên người nhận — kết hợp được nhiều điều kiện cùng lúc.
- Tab "Tiền thu hộ" (có ở bản tham khảo ban đầu) đã bị BỎ theo yêu cầu — trang này giờ CHỈ còn "Phí dịch vụ", không có cơ chế điều hướng/tab nào khác.
- Quy ước dấu (Phí dịch vụ âm, Đã thanh toán dương, Chưa thanh toán âm/dương) và dòng "Tổng" ở đầu bảng là MÔ PHỎNG đúng theo ảnh tham khảo thật — không phải quy ước tự nghĩ ra.
- Trang này THAY THẾ vai trò hiển thị trạng thái thanh toán trước đây nằm ở cột "Phí ship" trong danh sách Đơn hàng — xem SHOP-ORDER-44 (đã bỏ badge khỏi danh sách đơn).
- **PROTOTYPE THUẦN** cho phần số liệu (đọc trực tiếp dữ liệu mẫu) nhưng nút "Tải file excel" xuất file THẬT, không phải nút giả.
- Xem SHOP-ORDER-43 (vì sao MoMo/CK gần như luôn "Đã thanh toán" ngay), SHOP-ORDER-45 (Chi tiết đơn vẫn còn dòng "Trạng thái {kênh}" riêng, không bị ảnh hưởng).
- **Tách story (meta)**: công thức tính 3 cột tiền ở đây là 1 ĐIỂM DUY NHẤT mà SHOP-ORDER-57/58/59/60/61 đều phụ thuộc vào — sửa công thức ở story này (nếu cần) sẽ ảnh hưởng tới cả các story kia, cần test lại toàn bộ khi đổi.
- Xem AGA-PAYMENT-1/6 (Agency Admin) — bảng tương đương bên phía đại lý, dùng chung công thức tính phí/đã thanh toán/chưa thanh toán.
