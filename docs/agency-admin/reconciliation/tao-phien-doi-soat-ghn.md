---
id: AGA-RECON-1
jiraKey: ""
platform: agency-admin
section: Đối soát & Chuyển khoản
figma: ""
status: draft
---

# [AGA] Đối soát: Tạo phiên đối soát GHN

## User Story
Là Agency Admin (Đại lý), tôi muốn tạo một phiên đối soát GHN mới bằng cách upload file
thanh toán do GHN xuất ra, để hệ thống ghi nhận kỳ đối soát và chuẩn bị dữ liệu COD/cước phí
cho việc xác nhận công nợ với GHN.

## User Flow
1. Agency Admin truy cập "Đối soát & Chuyển khoản" → tab "Phiên NVC"
2. Nhấn nút "Tạo phiên [NVC/GHN]" ở góc trên phải danh sách
3. Modal "Upload file đối soát GHN" hiện ra
4. Agency Admin nhấn để chọn file `.xlsx`, `.xls`, hoặc `.csv` xuất từ GHN (bắt buộc)
5. Sau khi chọn, hệ thống hiển thị "Mã phiên GHN" lấy từ tên file (bỏ phần đuôi mở rộng)
6. Agency Admin nhập "Ghi chú" (không bắt buộc)
7. Nhấn "Tải lên" — hệ thống hiển thị tiến trình tải (progress bar); có thể "Dừng tải" giữa lúc đang tải
8. Sau khi tải xong, phiên mới được tạo với ngày thanh toán = ngày hiện tại (hệ thống tự set),
   trạng thái "Chờ xác nhận", và xuất hiện đầu danh sách phiên

## Acceptance Criteria
AC1: Nút "Tạo phiên [NVC/GHN]" hiển thị ở góc trên phải tab "Phiên NVC"; bấm vào mở modal
"Upload file đối soát GHN".
AC2: Modal cho phép chọn 1 file .xlsx/.xls/.csv qua click chọn (chưa hỗ trợ kéo-thả file thật,
dù khung chọn file có kiểu dáng dashed-border gợi ý dropzone).
AC3: Nếu chưa chọn file mà nhấn "Tải lên" → hiển thị lỗi "Vui lòng chọn file đối soát", không cho
tải lên.
AC4: Sau khi chọn file, hệ thống hiển thị "Mã phiên GHN" (lấy từ tên file, bỏ đuôi mở rộng) kèm
ghi chú "Hệ thống sẽ tự động đọc thông tin phiên từ file sau khi tải lên".
AC5: Trường "Ghi chú" là tùy chọn.
AC6: Khi tải lên, hệ thống hiển thị tiến trình dạng % (progress bar); Agency Admin có thể bấm
"Dừng tải" để huỷ giữa chừng.
AC7: Sau khi tải lên hoàn tất, phiên mới được tạo với: mã phiên dạng `GHN{số thứ tự}`, ngày thanh
toán = ngày hiện tại, trạng thái "Chờ xác nhận", và xuất hiện đầu danh sách phiên.
AC8: Phiên ở trạng thái "Chờ xác nhận" chưa bị khoá — vẫn có thể chỉnh sửa/xoá, khác với phiên
đã "Đã xác nhận" (đã khoá dữ liệu).

## Notes
- **Hạn chế đã biết**: ngày thanh toán hiện luôn được hệ thống tự set = ngày upload (hôm nay),
  không đọc từ nội dung file GHN thật — vì đây là mock demo, không parse nội dung file thật.
  Khi lên hệ thống thật cần làm rõ với BA: ngày thanh toán nên lấy từ file GHN hay do Agency Admin
  nhập tay.
- Việc tự động sinh "phiên shop" cho từng shop xảy ra ở bước **xác nhận** phiên (sau khi tạo),
  không phải ngay lúc tạo — xem `phien-shop.md` và story "Xác nhận phiên đối soát GHN" (chưa viết).
- Doc cũ `phien-nha-van-chuyen.md` mô tả sai vài chi tiết (nói có kéo-thả và có ô chọn "Ngày thanh
  toán GHN") — đã đối chiếu lại đúng theo code hiện tại (`AgencyReconciliation.tsx`, `UploadModal`)
  khi viết story này; doc cũ cần được sửa lại ở lượt sau.
