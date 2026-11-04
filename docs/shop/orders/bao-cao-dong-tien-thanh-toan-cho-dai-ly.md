---
id: SHOP-ORDER-60
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Báo cáo dòng tiền: Thanh toán phí dịch vụ cho đại lý (QR chuyển khoản)

## Bối cảnh

Tách từ [SHOP-ORDER-55](./bao-cao-dong-tien.md) (bảng chính "Phí dịch vụ") — nút **"Thanh toán phí dịch vụ cho đại lý"** + màn hình QR chuyển khoản, nơi Shop thanh toán gộp khoản nợ phí ship tiền mặt cho đại lý. Bản đầu (v1) nút này mở 1 màn hình 2 cột gộp chung với "Lịch sử thanh toán" ([SHOP-ORDER-61](./bao-cao-dong-tien-lich-su-thanh-toan.md)), có checkbox điều khoản + nút "Xác nhận thanh toán" thủ công. Bản này (v2) tách hẳn thành 2 nút/màn hình độc lập, và đổi giao diện xác nhận sang QR + đếm ngược + tự động xác nhận — giống cảm giác thanh toán online lúc tạo đơn (SHOP-ORDER-42) — nhưng **KHÔNG đổi bản chất nghiệp vụ**: vẫn chỉ là lời khai, đại lý vẫn phải tự đối chiếu rồi duyệt tay.

## User Story

Là chủ shop, sau khi đã chuyển khoản/chuyển tiền mặt phí ship cho đại lý, tôi muốn khai lại trong hệ thống qua màn hình quét QR quen thuộc, để đại lý tiện đối chiếu và để các đơn từng bị từ chối có cơ hội được duyệt lại thay vì kẹt vĩnh viễn.

## User Flow

1. Toolbar góc phải trang: 2 nút TÁCH BIỆT — **"Lịch sử thanh toán"** (trắng, viền, xem SHOP-ORDER-61) và **"Thanh toán phí dịch vụ cho đại lý"** (nền cam) ngay cạnh. Nút thanh toán bị khoá khi không còn đơn tiền mặt nào đang chờ duyệt hoặc đã bị từ chối mà chưa khai, kèm chú thích "Không có đơn tiền mặt nào cần chuyển".
2. Bấm nút → mở màn hình **"Thanh toán phí dịch vụ cho đại lý"**: nếu tổng tiền = 0 → "Không có khoản nào cần thanh toán"; ngược lại hiện: "Phương thức thanh toán: Chuyển khoản ngân hàng" (chữ xanh, CỐ ĐỊNH — chỉ 1 lựa chọn, không cho đổi), "Số tiền: Xđ" (= tổng phí các đơn đang chờ duyệt + đã bị từ chối, chưa khai), QR code bên phải, "Mã QR sẽ hết hạn sau: mm:ss" (đếm ngược từ 15:00), "Quét mã để thanh toán", link "Tải danh sách đơn cần thanh toán" (xuất Excel riêng).
3. Màn hình **TỰ ĐỘNG xác nhận sau vài giây** (mô phỏng ngân hàng báo giao dịch thành công — Shop KHÔNG cần tự bấm "Tôi đã thanh toán") → hiện banner xanh "✓ Đã gửi yêu cầu thanh toán Xđ cho đại lý — mã ..." thay cho nội dung QR; đơn đang bị từ chối ("Nợ tồn") được ĐƯA VỀ trạng thái chờ duyệt để đại lý duyệt lại được (không kẹt mãi).
4. Nếu đếm ngược về 0 TRƯỚC KHI tự xác nhận xong (hiếm) → QR mờ đi, hiện "Mã QR đã hết hạn" + nút "Tạo mã mới" để reset đếm ngược và thử lại.
5. Đóng rồi mở lại màn hình (hoặc nhìn nút ngoài trang): các đơn vừa khai KHÔNG được tính lại vào khoản cần thanh toán nữa — không khai trùng được cùng 1 lô đơn.
6. Nếu đại lý sau đó từ chối lại 1 đơn đã từng khai → đơn quay về "chưa khai", xuất hiện LẠI ở lần mở màn hình tiếp theo để Shop khai lại.
7. Đại lý (trang "Duyệt thanh toán") KHÔNG thấy thêm bất kỳ gợi ý nào về việc Shop đã khai hay chưa — đại lý tự dựa vào số ngày trễ rồi tự đối chiếu sổ quỹ thật trước khi duyệt, không dựa vào lời khai này để tin.

## System Flow

1. Số tiền cần thanh toán được tính lại MỖI LẦN mở màn hình (không dùng số liệu cũ) — luôn khớp đúng thời điểm hiện tại.
2. Đồng hồ đếm ngược 15 phút bắt đầu chạy ngay khi mở màn hình.
3. Sau một khoảng thời gian ngẫu nhiên vài giây (mô phỏng thời gian ngân hàng xử lý giao dịch thật), hệ thống tự động ghi nhận lời khai thanh toán của Shop, không cần thao tác xác nhận thủ công nào thêm.
4. Mã QR hiển thị chỉ là hình minh hoạ, không mã hoá thông tin tài khoản ngân hàng thật.
5. Quy tắc nghiệp vụ nền — ghi nhận lời khai, chuyển đơn bị từ chối về trạng thái chờ duyệt lại, không cho khai trùng cùng 1 lô đơn đang chờ đại lý đối chiếu — GIỮ NGUYÊN hoàn toàn như bản trước; lần đổi này chỉ đổi giao diện và cách kích hoạt hành động, không đổi logic nghiệp vụ nền.
6. Nút "Lịch sử thanh toán" giờ mở một màn hình ĐỘC LẬP, không còn là cột bên cạnh màn hình thanh toán nữa — xem [SHOP-ORDER-61](./bao-cao-dong-tien-lich-su-thanh-toan.md).

## Acceptance Criteria

**AC1:** 2 nút "Lịch sử thanh toán" và "Thanh toán phí dịch vụ cho đại lý" hiện tách biệt trên toolbar, mở 2 màn hình độc lập. Nút thanh toán bị khoá khi không còn đơn tiền mặt đang chờ duyệt/đã bị từ chối mà chưa khai.

**AC2:** Màn hình thanh toán hiện đúng "Chuyển khoản ngân hàng" + Số tiền = tổng phí đơn tiền mặt đang chờ duyệt/đã bị từ chối, chưa khai; tổng = 0 → hiện "Không có khoản nào cần thanh toán", không có QR/đếm ngược.

**AC3:** Đếm ngược chạy đúng từ 15:00 xuống 0; màn hình tự động ghi nhận lời khai sau vài giây mô phỏng — KHÔNG cần Shop bấm bất kỳ nút xác nhận nào.

**AC4:** Sau khi tự xác nhận: banner xanh hiện NGAY trong màn hình (không cần đóng/mở lại); đơn bị từ chối trong lô vừa khai được ĐƯA VỀ trạng thái chờ duyệt (xoá lý do từ chối).

**AC5:** Nếu hết 15 phút mà chưa tự xác nhận xong → QR mờ, hiện "Mã QR đã hết hạn" + nút "Tạo mã mới" reset lại đếm ngược.

**AC6:** Đóng rồi mở lại màn hình (hoặc nhìn nút ngoài trang) SAU KHI đã khai: các đơn vừa khai KHÔNG được tính lại vào tổng tiền nữa — Shop KHÔNG khai trùng được cùng 1 lô đơn.

**AC7:** Sau khi Shop khai, đại lý KHÔNG thấy thêm bất kỳ dòng "Shop báo đã chuyển..." nào — badge trạng thái giữ nguyên như khi chưa khai.

**AC8:** Nếu đại lý từ chối 1 đơn đã từng được Shop khai trước đó → đơn quay về trạng thái "chưa khai", xuất hiện LẠI để Shop khai lại — không bị loại vĩnh viễn.

## Notes

- **Đổi giao diện (v2), KHÔNG đổi bản chất nghiệp vụ**: giao diện đổi từ "checkbox điều khoản + nút Xác nhận thủ công" sang "QR + đếm ngược + tự xác nhận" để nhất quán trải nghiệm với luồng thanh toán online lúc tạo đơn — nhưng hành động xác nhận vẫn chỉ là lời khai một chiều, KHÔNG tích hợp cổng thanh toán ngân hàng thật, KHÔNG tự động chuyển đơn sang trạng thái "đã duyệt" — đại lý vẫn bắt buộc tự đối chiếu sổ quỹ rồi duyệt tay.
- **Tách nút (v2)**: trước đây "Thanh toán cho đại lý" và "Lịch sử thanh toán" là 2 cột trong CÙNG 1 màn hình — nay tách hẳn thành 2 nút + 2 màn hình riêng theo yêu cầu thiết kế mới, không còn phụ thuộc UI vào nhau.
- **"Chuyển khoản ngân hàng" ở đây ≠ "Chuyển khoản" của từng đơn lẻ**: nút này chỉ áp dụng cho khoản nợ TIỀN MẶT gộp lại — MoMo/Chuyển khoản của TỪNG ĐƠN (phí ship Shop trả GHN) tự "Đã nhận" ngay từ lúc tạo đơn (SHOP-ORDER-43), không có gì để Shop "khai" thêm nên không tính vào tổng này. "Chuyển khoản ngân hàng" hiển thị ở đây là kênh Shop NỘP TIỀN CHO ĐẠI LÝ (gộp nợ), khác bản chất với "Chuyển khoản" là phương thức trả phí ship của 1 đơn riêng lẻ — 2 khái niệm trùng tên, dễ nhầm.
- Phương thức "Chuyển khoản ngân hàng" đang CỐ ĐỊNH, chưa gắn với cấu hình kênh nộp tiền nào — nếu sau này có nhiều kênh nộp tiền cho đại lý, cần bổ sung lựa chọn kênh ở bước này.
- Đây là lời khai TỰ NGUYỆN — đại lý vẫn có thể tự chủ động duyệt bất cứ lúc nào mà không cần chờ Shop khai trước.
- Xem AGA-PAYMENT-1/2 (Agency Admin) để biết cách đại lý nhìn thấy và xử lý lời khai này; [SHOP-ORDER-55](./bao-cao-dong-tien.md) (bảng chính nơi nút này nằm); [SHOP-ORDER-61](./bao-cao-dong-tien-lich-su-thanh-toan.md) (Lịch sử thanh toán, nay là màn hình riêng).
