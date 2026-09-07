---
id: SHOP-RECON-6
jiraKey: 
platform: shop
section: Đối soát
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [WEB SHOP] Đối soát - Danh sách phiên: Search phiên

## User Story

Là chủ shop, tôi muốn tìm nhanh 1 phiên đối soát theo mã phiên hoặc mã phiên GHN, để không phải cuộn tìm thủ công khi danh sách có nhiều phiên.

## User Flow

1. Vào trang "Đối soát" (`/shop/reconciliation`), bên dưới 4 stat card có 1 ô tìm kiếm.
2. Gõ từ khoá vào ô — bảng danh sách phiên lọc ngay theo thời gian thực, không cần bấm Enter hay nút tìm.
3. Từ khoá khớp với Mã phiên HOẶC Phiên GHN của bất kỳ dòng nào → dòng đó hiện.
4. Xoá hết từ khoá → bảng trở lại đầy đủ danh sách gốc.
5. Gõ từ khoá không khớp phiên nào → bảng hiện thông báo "Không tìm thấy phiên phù hợp".

## System Flow

1. `Reconciliation.tsx`: state `const [search, setSearch] = useState('')`.
2. `filteredSessions = mySessions.filter(s => { const q = search.trim().toLowerCase(); if (!q) return true; return s.id.toLowerCase().includes(q) || s.nvcSessionCode.toLowerCase().includes(q) })` — so khớp substring, không phân biệt hoa/thường, khớp 1 trong 2 field (`id` HOẶC `nvcSessionCode`) là đủ để hiện dòng.
3. Ô tìm kiếm dùng chung style với ô search đã có ở trang "Đơn hàng" (`SearchOutlined` + input nền trong suốt, viền `C_BORDER`, placeholder "Tìm theo mã phiên hoặc phiên GHN") — không tạo pattern UI mới.
4. Bảng render `filteredSessions.map(...)` thay vì `mySessions.map(...)` trực tiếp — nhưng 4 stat card phía trên vẫn tính từ `mySessions` gốc (KHÔNG đổi theo kết quả tìm kiếm).
5. 2 nhánh empty-state tách biệt: `mySessions.length === 0` → "Chưa có phiên đối soát nào" (không có phiên nào từ đầu); `mySessions.length > 0 && filteredSessions.length === 0` → "Không tìm thấy phiên phù hợp" (có phiên nhưng search không khớp).

## Acceptance Criteria

**AC1:** Ô tìm kiếm hiện ngay dưới 4 stat card, phía trên bảng danh sách phiên.

**AC2:** Gõ từ khoá → bảng lọc realtime, không cần bấm Enter hay nút tìm kiếm riêng.

**AC3:** Tìm kiếm khớp theo Mã phiên HOẶC Phiên GHN, không phân biệt hoa/thường, so khớp substring (không cần gõ đủ chính xác từ đầu).

**AC4:** Xoá hết từ khoá trong ô tìm kiếm → bảng hiện lại đầy đủ danh sách gốc.

**AC5:** Không có phiên nào khớp từ khoá đang gõ → hiện "Không tìm thấy phiên phù hợp" — khác thông báo với trường hợp danh sách gốc rỗng ("Chưa có phiên đối soát nào").

**AC6:** 4 stat card (Tổng phiên, Tổng nhận về, Chờ thanh toán, Đơn lệch) không thay đổi theo kết quả tìm kiếm — luôn phản ánh toàn bộ danh sách phiên của shop, bất kể đang lọc gì.

## Notes

- Tách ra từ SHOP-RECON-1 (story tổng quan danh sách phiên) — SHOP-RECON-1 đã cập nhật để trỏ sang story này cho chi tiết phần search, tránh lặp nội dung ở 2 nơi.
- Cùng pattern search đã dùng ở Agency Admin cho các danh sách phiên đối soát tương tự (AGA-RECON-10/11/12 — "Thêm search cho danh sách/chi tiết phiên GHN/shop") — không phải tính năng phát minh riêng cho Web Shop.
