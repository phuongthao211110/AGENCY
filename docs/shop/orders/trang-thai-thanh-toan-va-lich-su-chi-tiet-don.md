---
id: SHOP-ORDER-52
jiraKey: AGENCY-1324
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW?node-id=2-449
status: draft
---

# [WEB SHOP] Đơn hàng - Chi tiết đơn hàng: Trạng thái thanh toán và lịch sử thao tác

## Bối cảnh

Story này gồm 2 phần, gộp đầy đủ vào 1 chỗ để tự đủ, không cần mở thêm doc khác mới hiểu hết:

- **(A) Trạng thái thanh toán hiện tại** — hiện ngay ở tab "Thông tin" của Chi tiết đơn, gồm cả hành động tự nguyện thanh toán lại khi bị từ chối.
- **(B) Lịch sử thao tác** — tab riêng liệt kê mọi hành động đã xảy ra với đơn, trong đó có các hành động liên quan thanh toán.

Phần (A) trước đây để ở story riêng SHOP-ORDER-45 — nay đưa nguyên nội dung vào đây vì cùng 1 tựa đề, cùng 1 màn hình, tránh người đọc phải nhảy qua lại 2 doc mới ráp được đầy đủ bức tranh.

## User Story

Là chủ shop xem chi tiết 1 đơn hàng, tôi muốn thấy phương thức thanh toán phí ship, trạng thái đại lý đã nhận tiền hay chưa (kèm lý do nếu bị từ chối) NGAY trong tab Thông tin, có cách tự nguyện thanh toán lại nếu bị từ chối, và xem lại được toàn bộ lịch sử các lần thao tác liên quan thanh toán trong 1 tab riêng — để vừa biết tình trạng hiện tại, vừa truy vết lại được chính xác chuyện gì đã xảy ra với đơn này. Việc xem/thao tác này không được làm gián đoạn đơn đã đi vận chuyển bình thường.

## User Flow

### A. Trạng thái thanh toán hiện tại (tab "Thông tin")

1. Mở chi tiết đơn, tab "Thông tin" — dòng "Thanh toán" luôn hiện, cho biết phí ship trả bằng MoMo / chuyển khoản ngân hàng / tiền mặt (thu hộ).
2. Với đơn Shop tự trả ship (mọi phương thức, kể cả tiền mặt): hiện thêm dòng "Trạng thái {kênh}" đúng màu theo đúng badge trạng thái đang dùng chung toàn hệ thống — với MoMo/chuyển khoản, badge này gần như LUÔN là "Đã nhận" ngay từ lúc tạo đơn, trừ khi đại lý hậu kiểm phát hiện bất thường và từ chối.
3. Nếu đại lý **đã xác nhận**: thêm dòng **"Đại lý xác nhận lúc"** — với MoMo/chuyển khoản gần như trùng thời điểm tạo đơn (tự động); với tiền mặt là thời điểm đại lý tự tay bấm duyệt.
4. Nếu đại lý **từ chối** (hiếm — chỉ khi hậu kiểm phát hiện không khớp): thêm dòng **"Lý do đại lý từ chối"** (chữ đỏ).
5. Nếu CHƯA được đại lý xác nhận (gồm cả bị từ chối, hoặc chưa từng được xác nhận) VÀ phương thức là MoMo/chuyển khoản: thêm 1 dòng link **"Thanh toán lại →"** — Shop có thể bấm để tự nguyện mở lại màn hình thanh toán, hoàn toàn TỰ NGUYỆN, không phải điều kiện bắt buộc để đơn đi tiếp (đơn đã đi từ trước rồi).
6. Nếu CHƯA được xác nhận VÀ phương thức là Tiền mặt: KHÔNG có link nào để bấm — tiền mặt không có giao dịch số nào để trả lại qua hệ thống, đại lý sẽ liên hệ Shop xử lý ngoài hệ thống.
7. Chỉnh sửa các thông tin khác của đơn (tên/SĐT/địa chỉ/COD/phí ship/trạng thái vận chuyển) và bấm "Lưu thay đổi" — lưu ngay lập tức, KHÔNG có gì bị chặn bởi trạng thái thanh toán ở bất kỳ giá trị nào.

### B. Lịch sử thao tác (tab riêng)

8. Mở tab **"Lịch sử thao tác"** (1 trong 3 tab của Chi tiết đơn, cạnh "Thông tin đơn" và "Lịch sử trạng thái") → bảng liệt kê mọi hành động đã xảy ra với đơn, nhóm theo ngày, mỗi dòng gồm: Thời gian / Người thao tác / Hành động / Nội dung cũ / Nội dung mới.
9. Các hành động LIÊN QUAN THANH TOÁN xuất hiện trong bảng này cùng với mọi hành động khác (sửa thông tin, huỷ đơn...), KHÔNG có tab/bộ lọc riêng chỉ cho thanh toán:
   - "Chọn hình thức thanh toán phí ship" (ghi lúc tạo đơn, nếu chọn online).
   - "Xác nhận đã thanh toán" (khi hệ thống tự xác nhận hoặc Shop xác nhận lại trong Chi tiết đơn).
   - "Thanh toán thất bại (hết hạn mã)" (khi đếm ngược 15 phút hết mà chưa xác nhận).
   - "Tạo mã thanh toán mới" (khi bấm "Tạo QR mới"/"Tạo mã mới" để thử lại).
10. Mỗi dòng lịch sử là bản ghi TĨNH tại thời điểm xảy ra — sửa/xoá dữ liệu đơn sau đó không làm đổi lại các dòng lịch sử cũ.

## System Flow

### A. Trạng thái thanh toán hiện tại

1. Dòng "Thanh toán" luôn hiện, đọc đúng phương thức và ai là người trả phí ship của đơn.
2. Dòng "Trạng thái {kênh}" hiện cho MỌI phương thức Shop tự trả (tiền mặt/MoMo/chuyển khoản) — dùng chung công thức badge với danh sách đơn.
3. Dòng "Đại lý xác nhận lúc" chỉ hiện khi đã được duyệt — với MoMo/chuyển khoản, thời điểm này được ghi nhận ngay lúc tạo đơn (xem như hệ thống tự xác nhận), không phải lúc đại lý thao tác; với tiền mặt là đúng thời điểm đại lý bấm duyệt tay.
4. Dòng "Lý do đại lý từ chối" hiện khi bị từ chối, màu đỏ.
5. Link "Thanh toán lại" hiện ngay sau dòng lý do từ chối (nếu có), CHỈ khi đơn CHƯA được xác nhận VÀ phương thức là online (MoMo/chuyển khoản) — bấm vào mở lại màn hình thanh toán NGAY, hoạt động độc lập hoàn toàn với việc đơn có đang ở chế độ sửa hay không.
6. Việc lưu thay đổi các thông tin khác của đơn KHÔNG còn bị chặn bởi trạng thái thanh toán — luôn lưu được, bất kể trạng thái thanh toán đang là gì.
7. Thanh toán lại thành công → chuyển thẳng sang trạng thái "đã xác nhận" (không qua bước chờ duyệt trung gian, giống hệt lúc tạo đơn), xoá lý do từ chối cũ.
8. Bấm "Tạo mã mới" bên trong màn hình thanh toán lại → đưa đơn về trạng thái chờ thanh toán mới, xoá lý do từ chối cũ, không liên quan đến việc lưu các thông tin khác của đơn.

### B. Lịch sử thao tác

9. Chi tiết đơn có 3 tab: "Thông tin đơn", "Lịch sử trạng thái", và "Lịch sử thao tác".
10. Tab "Lịch sử thao tác" hiện 1 bảng DÙNG CHUNG cho MỌI loại hành động của đơn (không riêng thanh toán), nhóm theo ngày, mới nhất lên đầu.
11. Các dòng lịch sử LIÊN QUAN THANH TOÁN được ghi tại nhiều thời điểm khác nhau trong vòng đời đơn: lúc tạo đơn (nếu chọn thanh toán online, ghi sẵn "Chọn hình thức thanh toán phí ship"); lúc xác nhận thanh toán thành công; lúc mã thanh toán hết hạn; lúc bấm tạo mã thanh toán mới.
12. Mọi hành động xảy ra SAU KHI đơn đã tồn tại đều đi qua CÙNG MỘT cơ chế ghi lịch sử dùng chung cho toàn hệ thống — mỗi lần có hành động mới, hệ thống thêm đúng 1 dòng mới lên đầu danh sách, không sửa/xoá dòng cũ.
13. Dòng trạng thái thanh toán hiện tại ở tab "Thông tin" (phần A) đọc TRỰC TIẾP dữ liệu hiện tại của đơn — KHÔNG đọc từ lịch sử thao tác; 2 nguồn dữ liệu độc lập nhau dù cùng mô tả 1 câu chuyện.

## Acceptance Criteria

**AC1:** Tab "Thông tin" của mọi đơn đều hiển thị dòng "Thanh toán" với đúng phương thức.

**AC2:** Đơn Shop tự trả ship bằng tiền mặt/MoMo/chuyển khoản → hiện thêm dòng "Trạng thái {kênh}" đúng màu — áp dụng cho CẢ tiền mặt, không chỉ riêng online.

**AC3:** Đã được đại lý xác nhận → hiện thêm dòng "Đại lý xác nhận lúc" với thời điểm đúng; với MoMo/chuyển khoản thời điểm này gần như trùng lúc tạo đơn.

**AC4:** Bị đại lý từ chối → hiện thêm dòng "Lý do đại lý từ chối" (chữ đỏ) với đúng lý do đại lý đã nhập.

**AC5:** Chưa được xác nhận (kể cả bị từ chối, hoặc chưa từng được xác nhận) + phương thức MoMo/chuyển khoản → hiện thêm link "Thanh toán lại →", bấm vào mở màn hình thanh toán NGAY (không cần vào chế độ sửa trước).

**AC6:** Chưa được xác nhận + phương thức Tiền mặt → KHÔNG có link "Thanh toán lại" nào.

**AC7:** Thanh toán lại thành công → chuyển thẳng sang "đã xác nhận" (không qua bước chờ duyệt trung gian), xoá lý do từ chối cũ.

**AC8:** Đổi thông tin khác của đơn (tên/SĐT/địa chỉ/COD/phí ship/trạng thái) và bấm "Lưu thay đổi" → LUÔN lưu thành công ngay, không bị chặn bởi trạng thái thanh toán ở bất kỳ giá trị nào.

**AC9:** Tab "Lịch sử thao tác" liệt kê đủ các hành động liên quan thanh toán đã xảy ra với đơn, đúng thứ tự thời gian (mới nhất lên đầu), nhóm theo ngày.

**AC10:** Mỗi dòng lịch sử hiện đủ: Thời gian, Người thao tác, Hành động, Nội dung cũ, Nội dung mới.

**AC11:** "Xác nhận đã thanh toán" xuất hiện đúng 1 lần mỗi khi Shop/hệ thống xác nhận thanh toán thành công (kể cả xác nhận lại sau khi bị từ chối).

**AC12:** "Tạo mã thanh toán mới" xuất hiện đúng 1 lần mỗi khi bấm "Tạo QR mới"/"Tạo mã mới".

**AC13:** "Thanh toán thất bại (hết hạn mã)" xuất hiện đúng 1 lần mỗi khi đếm ngược 15 phút hết mà chưa xác nhận.

**AC14:** Lịch sử là bản ghi TĨNH — các dòng cũ không tự đổi nội dung khi trạng thái hiện tại của đơn thay đổi sau đó.

**AC15:** Tab "Lịch sử thao tác" không có bộ lọc/tab con riêng cho thanh toán — hiển thị chung với mọi loại hành động khác của đơn (sửa thông tin, huỷ đơn, v.v.).

## Notes

- **Thay đổi lớn so với thiết kế trước**: trước đây bấm "Lưu thay đổi" khi đơn chưa được duyệt sẽ bị CHẶN LƯU. Đã bỏ hẳn chặn này — lưu đơn giờ luôn thành công. Hành động "Thanh toán lại" giờ là TỰ NGUYỆN, truy cập qua link riêng, không còn gắn vào luồng lưu đơn.
- **Điều kiện hiện link "Thanh toán lại" đã MỞ RỘNG**: từ chỗ chỉ hiện khi bị từ chối, giờ hiện bất cứ khi nào đơn CHƯA được xác nhận (gồm cả trường hợp Shop đóng màn hình thanh toán sớm lúc tạo đơn, chưa từng được xác nhận lần nào) — nếu không mở rộng, đơn ở trạng thái "chưa từng xác nhận" sẽ không có cách nào quay lại thanh toán.
- **Bug đã sửa**: dòng "Trạng thái {kênh}" trước đây chỉ hiện cho MoMo/chuyển khoản, thiếu Tiền mặt. Đã sửa để hiện cho mọi phương thức Shop tự trả.
- **Bug đã sửa**: sau khi màn hình thanh toán lúc tạo đơn tự xác nhận xong, Chi tiết đơn không tự cập nhật trạng thái mới (phải tải lại trang). Đã sửa để Chi tiết đơn đang mở tự đồng bộ ngay khi có kết quả mới.
- **PROTOTYPE THUẦN** — không có cổng thanh toán thật. "Đại lý xác nhận/từ chối" với tiền mặt vẫn là thao tác thủ công của đại lý; với MoMo/chuyển khoản là mô phỏng tự động, không có webhook thật.
- Đây là TÍNH NĂNG ĐÃ CÓ SẴN cho phần (B) — tab "Lịch sử thao tác" là tab dùng chung cho toàn bộ hành động của đơn, không phải tính năng mới riêng cho thanh toán; story này tập trung vào GÓC NHÌN thanh toán của tab đó.
- Xem thêm SHOP-ORDER-42 (màn hình thanh toán), SHOP-ORDER-43 (vì sao MoMo/chuyển khoản tự xác nhận ngay còn tiền mặt thì không), SHOP-ORDER-51 (Đổi phương thức thanh toán — khi đổi phương thức, hành động đó cũng ghi vào tab "Lịch sử thao tác" theo đúng cơ chế chung này).
