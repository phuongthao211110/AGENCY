---
id: AGA-REPORT-5
jiraKey: 
platform: agency-admin
section: Báo cáo
figma: https://www.figma.com/design/264Gc7s2XLHjBZsr2HnBEe/-AGA--AGENCY-ADMIN?node-id=2-449
status: draft
---

# [AGA] Báo cáo: Tìm kiếm shop trong bộ lọc dropdown

## User Story

Là nhân viên đại lý (Agency Admin), tôi muốn gõ tìm shop theo tên hoặc mã trong dropdown "Shop" ở khối "Xu hướng tổng phí ship theo shop", để chọn nhanh đúng shop cần xem dù đại lý có hàng chục/hàng trăm shop, thay vì phải cuộn qua danh sách dài.

## User Flow

1. Bấm vào ô "Shop" (mặc định hiện "Tất cả shop") → mở panel bên dưới gồm ô tìm kiếm (tự động focus) + danh sách shop cuộn được.
2. Gõ tên hoặc mã shop vào ô tìm kiếm → danh sách bên dưới lọc ngay theo thời gian thực, chỉ còn shop có tên HOẶC mã chứa đúng chuỗi đã gõ (không phân biệt hoa/thường, không cần gõ đúng từ đầu).
3. Dòng "Tất cả shop" luôn ở đầu danh sách, không bị lọc mất dù đang gõ tìm kiếm gì.
4. Không có shop nào khớp → hiện dòng "Không tìm thấy shop phù hợp." thay cho danh sách trống.
5. Bấm vào 1 dòng shop (hoặc "Tất cả shop") → chọn ngay, đóng panel, xoá chuỗi đã gõ, ô "Shop" cập nhật hiện đúng lựa chọn mới.
6. Bấm ra ngoài panel mà không chọn gì → đóng panel, giữ nguyên lựa chọn cũ trước đó.

## System Flow

1. `ShopFilterDropdown` — component tự viết thay cho `<select>` native, nhận `shops`, `value` (shopId đang chọn, `''` = "Tất cả shop"), `onChange`.
2. State nội bộ: `open` (đóng/mở panel), `search` (chuỗi đang gõ). Panel chỉ render khi `open === true`.
3. Đóng khi click ra ngoài: `useRef<HTMLDivElement>` bọc cả trigger + panel, `useEffect` gắn listener `mousedown` trên `document` khi `open`, kiểm tra `!rootRef.current.contains(e.target)` → `setOpen(false)`. Gỡ listener khi đóng/unmount. Cùng pattern đã dùng ở bộ lọc "Thời gian" trong `AgencyReconciliation.tsx`.
4. Lọc: `q = search.trim().toLowerCase()`; nếu rỗng → hiện đủ `shops`; ngược lại → `shops.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))`.
5. Dòng "Tất cả shop" render CỨNG ở đầu danh sách, tách biệt khỏi mảng `filtered` — không bị lọc theo `q`.
6. Chọn 1 dòng → gọi `onChange(shopId)`, rồi `setOpen(false)` + `setSearch('')` (reset ô tìm kiếm cho lần mở sau).
7. Trigger hiện label: nếu `value` khớp 1 shop trong danh sách → `${shop.id} - ${shop.name}`; nếu `value === ''` → "Tất cả shop".

## Acceptance Criteria

**AC1:** Bấm vào ô "Shop" → mở panel có ô tìm kiếm tự động focus (gõ được ngay, không cần bấm thêm lần nữa vào ô tìm kiếm) + danh sách shop.

**AC2:** Gõ vào ô tìm kiếm → danh sách lọc theo tên HOẶC mã shop chứa chuỗi đã gõ, không phân biệt hoa/thường, cập nhật ngay theo thời gian thực (không cần bấm Enter/nút tìm).

**AC3:** Dòng "Tất cả shop" luôn hiện ở đầu danh sách bất kể đang gõ tìm kiếm gì, không bao giờ bị lọc mất.

**AC4:** Gõ chuỗi không khớp shop nào → hiện "Không tìm thấy shop phù hợp." thay vì danh sách trống không rõ nghĩa.

**AC5:** Bấm chọn 1 dòng → panel đóng ngay, ô "Shop" cập nhật hiện đúng lựa chọn, ô tìm kiếm được xoá trắng (lần mở sau không còn chuỗi tìm kiếm cũ).

**AC6:** Bấm ra ngoài panel (không chọn dòng nào) → panel đóng, lựa chọn "Shop" giữ nguyên như trước khi mở.

**AC7:** Dropdown hoạt động đúng với danh sách vài shop lẫn danh sách hàng trăm shop — không giới hạn số lượng hiển thị, danh sách cuộn được trong khung cao tối đa 280px.

## Notes

- Thay hẳn `<select>` native vì native chỉ hỗ trợ nhảy theo ký tự ĐẦU của option khi gõ phím (không tìm được theo từ giữa chuỗi, ví dụ gõ "Đà Nẵng" sẽ không nhảy tới shop có "Đà Nẵng" ở giữa tên) — với đại lý nhiều shop, trải nghiệm rất kém.
- Component này chỉ dùng nội bộ ở khối "Xu hướng tổng phí ship theo shop" hiện tại — chưa phải shared component dùng chung toàn hệ thống (dự án chưa có thư mục component dùng chung, xem ghi chú tương tự ở AGA-REPORT-4).
- Dữ liệu demo hiện có 105 shop cho `AGN001` để kiểm chứng trực tiếp việc tìm kiếm hoạt động đúng với danh sách dài.
