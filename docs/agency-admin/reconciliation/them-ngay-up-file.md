---
id: AGA-RECON-9
jiraKey: 
platform: agency-admin
section: Đối soát & Chuyển khoản
figma: 
status: draft
---

# [AGENCY] Đối soát - Danh sách phiên GHN: Thêm ngày up file

## User Story

Là Agency Admin (Đại lý), tôi muốn thấy ngày file đối soát được upload lên hệ thống ngay trong danh sách phiên GHN, để phân biệt được thời điểm tôi thực sự nộp file so với ngày thanh toán GHN ghi trong file — 2 mốc thời gian khác nhau nhưng trước đây chỉ thấy 1.

## User Flow

1. Vào "Đối soát NVC" → tab "Phiên NVC"
2. Bảng danh sách phiên GHN có thêm cột "Ngày upload file", nằm ngay sau cột "Ngày TT GHN" và trước "Tên file"
3. Cột hiện đúng ngày (định dạng dd/mm/yyyy) thời điểm phiên được tạo trong hệ thống — khác với "Ngày TT GHN" là ngày thanh toán do người dùng chọn khi tạo phiên

## System Flow

1. Dùng thẳng field `createdAt` có sẵn trên `CarrierSession` (được set = `new Date().toISOString()` ngay tại thời điểm tạo phiên trong `UploadModal`'s `onSubmit`) — không cần thêm field mới vào data model
2. `fmtDate()` format `createdAt` giống hệt cách đang format `paymentDate`, chỉ khác field nguồn
3. Cột chèn giữa "Ngày TT GHN" và "Tên file" trong cả header (`TCell isHeader`) và `SessionRow` — width 120px cố định, cùng style với cột ngày kế bên
4. Tăng `minWidth` của bảng (container + mỗi row) từ 1500 lên 1620 để chứa thêm cột mà không vỡ layout ngang

## Acceptance Criteria

**AC1:** Header bảng phiên GHN có thêm cột "Ngày upload file", đúng vị trí giữa "Ngày TT GHN" và "Tên file".

**AC2:** Mỗi dòng hiện đúng giá trị `createdAt` của phiên đó, định dạng dd/mm/yyyy, không lẫn với "Ngày TT GHN".

**AC3:** Tạo phiên GHN mới qua "Tạo phiên NVC" với ngày thanh toán khác ngày hôm nay → 2 cột hiện khác nhau đúng thực tế (TT GHN = ngày người dùng chọn, Upload file = ngày/giờ tạo phiên thật).

**AC4:** Bảng không bị vỡ layout ngang sau khi thêm cột — vẫn cuộn ngang mượt trong vùng bảng như trước.

## Notes

- Dữ liệu mock có sẵn (10 phiên seed trong `carrier-reconciliation.json`) vô tình có `createdAt` trùng ngày với `paymentDate` (chỉ khác giờ trong ngày, bị cắt khi format chỉ-ngày) — nên trong demo với data cũ, 2 cột nhìn giống hệt nhau ở mọi dòng. Đây là đặc điểm của dữ liệu seed, không phải lỗi code — phiên tạo mới sau này sẽ hiện đúng 2 giá trị khác nhau nếu ngày thanh toán khác ngày tạo.
- Không đổi field data model, không đổi logic filter/search hiện có (search vẫn theo mã phiên GHN + tên file, không mở rộng qua cột mới này).
