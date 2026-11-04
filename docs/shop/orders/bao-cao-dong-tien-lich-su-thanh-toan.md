---
id: SHOP-ORDER-61
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Báo cáo dòng tiền: Lịch sử thanh toán

## Bối cảnh

Tách từ [SHOP-ORDER-60](./bao-cao-dong-tien-thanh-toan-cho-dai-ly.md) (nút "Thanh toán phí dịch vụ cho đại lý") — liệt kê mọi lần Shop đã khai thanh toán tiền mặt trước đó, để Shop tra cứu lại lô nào đã khai, khai lúc nào, gồm những đơn nào. **Cập nhật (v2):** trước đây đây là cột PHẢI nằm chung 1 màn hình với SHOP-ORDER-60 — nay đã tách thành nút **"Lịch sử thanh toán"** + màn hình riêng ĐỘC LẬP, không còn phụ thuộc UI vào màn hình thanh toán (QR) nữa.

## User Story

Là chủ shop, tôi muốn xem lại lịch sử các lần đã khai "đã chuyển tiền mặt" cho đại lý (mã, thời gian, tổng tiền, danh sách đơn), để tra cứu lại khi cần đối chiếu mà không phải nhớ hoặc hỏi lại đại lý.

## User Flow

1. Toolbar "Báo cáo dòng tiền": nút **"Lịch sử thanh toán"** (trắng, viền) tách biệt với nút "Thanh toán phí dịch vụ cho đại lý" (SHOP-ORDER-60) — bấm vào mở màn hình riêng, liệt kê MỌI lần Shop đã khai thanh toán (tự động qua QR, xem SHOP-ORDER-60) trước đó, mới nhất lên đầu.
2. Đầu màn hình có ô **"Tìm kiếm"** theo mã thanh toán. Bên dưới là bảng 3 cột: **Mã thanh toán** (kèm icon copy), **Thời gian**, **Số tiền (đ)**. Không có lần nào từng khai → bảng rỗng "Chưa có lần thanh toán nào"; gõ tìm kiếm mà không khớp lần nào → "Không tìm thấy mã thanh toán phù hợp" (khác thông báo rỗng ở trên).
3. Bấm icon copy cạnh mã thanh toán → copy mã vào clipboard, KHÔNG mở chi tiết.
4. Bấm vào 1 dòng bất kỳ (ngoài icon copy) → hiện danh sách mã vận đơn thuộc lô đó.
5. Vừa khai xong 1 lượt mới ở màn hình QR (SHOP-ORDER-60) rồi mở màn hình này ra → thấy NGAY lượt khai mới ở đầu bảng (danh sách luôn đọc dữ liệu mới nhất mỗi lần mở, không cần giữ trạng thái giữa 2 màn hình vì giờ chúng độc lập).

## System Flow

1. Danh sách lịch sử được đọc lại từ dữ liệu lưu trữ mỗi lần mở màn hình, lọc đúng theo shop hiện tại, sắp xếp mới nhất lên đầu.
2. Mỗi dòng trong bảng hiện đúng thông tin của 1 lượt khai: mã, thời gian khai, số tiền — ĐÂY LÀ LỊCH SỬ LỜI KHAI của Shop, KHÁC với lịch sử đại lý đã duyệt (không phản ánh đại lý đã duyệt hay chưa, chỉ hiện đúng những gì Shop đã khai).
3. Ô tìm kiếm lọc theo mã thanh toán khớp một phần, không phân biệt hoa thường — lọc ngay khi gõ, không cần bấm thêm nút tìm.
4. Bấm vào 1 dòng (ngoài icon copy) tra lại danh sách mã vận đơn thuộc lô đó — PROTOTYPE THUẦN, hiện dưới dạng thông báo đơn giản, không mở màn hình chi tiết riêng.
5. Màn hình "Lịch sử thanh toán" và màn hình "Thanh toán phí dịch vụ cho đại lý" (SHOP-ORDER-60) là 2 màn hình ĐỘC LẬP, mỗi màn hình tự đọc lại dữ liệu lúc mở — không còn chia sẻ trạng thái với nhau như bản v1 (lúc đó 2 story còn là 2 cột chung 1 màn hình). Muốn thấy lượt khai vừa xong, Shop chỉ cần mở màn hình "Lịch sử thanh toán" SAU KHI màn hình QR đã hiện banner xác nhận xong.

## Acceptance Criteria

**AC1:** Màn hình "Lịch sử thanh toán" liệt kê đúng toàn bộ các lần Shop đã khai trước đó, mới nhất lên đầu; shop chưa khai lần nào → danh sách rỗng (không lỗi).

**AC2:** Mỗi dòng trong bảng hiện đúng mã thanh toán, thời gian, số tiền khớp đúng lượt khai tương ứng.

**AC3:** Bấm icon copy → mã thanh toán được copy vào clipboard, KHÔNG mở chi tiết; không phát sinh lỗi (kể cả khi trình duyệt từ chối quyền clipboard).

**AC4:** Bấm vào 1 dòng (ngoài icon copy) → hiện đúng danh sách mã vận đơn thuộc lô đó, không thiếu/thừa đơn nào.

**AC5:** Sau khi khai xong 1 lượt mới ở màn hình QR (SHOP-ORDER-60), mở màn hình "Lịch sử thanh toán" (nút riêng) → dòng tương ứng đã xuất hiện ở đầu bảng (đọc dữ liệu mới nhất mỗi lần mở).

**AC6:** Gõ vào ô tìm kiếm → bảng chỉ còn hiện các lượt khai có mã thanh toán khớp một phần (không phân biệt hoa thường); gõ không khớp lượt nào → hiện "Không tìm thấy mã thanh toán phù hợp", khác với thông báo khi chưa từng khai lần nào.

## Notes

- **Đổi giao diện (v3)**: từ dạng danh sách card (mỗi lượt khai 1 khối riêng, có nút "Xem chi tiết" riêng) sang bảng đơn giản 3 cột + ô tìm kiếm theo mã thanh toán, theo đúng tham khảo thiết kế mới. Hành vi nghiệp vụ (xem chi tiết, copy mã) giữ nguyên, chỉ đổi cách trình bày: giờ bấm vào DÒNG để xem chi tiết thay vì bấm nút riêng.
- **Bug đã phát hiện qua UAT và sửa (phát hiện khi làm SHOP-SETTINGS-3, Tem QR)**: thao tác copy "Mã thanh toán" trước đây bắt lỗi quyền clipboard SAI CÁCH, khiến lỗi bị từ chối quyền không được bắt gọn mà rơi ra ngoài thành lỗi chưa xử lý. Đã sửa để lỗi clipboard luôn được bắt gọn, không còn phát sinh lỗi lạ ở console.
- **PROTOTYPE THUẦN**: xem chi tiết chỉ hiện 1 thông báo đơn giản liệt kê mã vận đơn — không có màn hình chi tiết riêng, không xuất file.
- Dữ liệu này ĐỘC LẬP với trạng thái đại lý đã duyệt hay chưa — 1 lượt khai xong vẫn hiện ở đây dù đại lý sau đó duyệt, từ chối, hay chưa xử lý gì; muốn biết đại lý đã duyệt chưa phải xem lại bảng chính (SHOP-ORDER-55, cột "Đã thanh toán"/"Chưa thanh toán"), không phải ở đây.
- Xem [SHOP-ORDER-60](./bao-cao-dong-tien-thanh-toan-cho-dai-ly.md) (nơi tạo ra các lượt khai mà màn hình này đọc lại), [SHOP-ORDER-55](./bao-cao-dong-tien.md) (bảng chính).
