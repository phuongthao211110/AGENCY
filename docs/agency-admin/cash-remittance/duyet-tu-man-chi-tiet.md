---
id: AGA-PAYMENT-8
jiraKey: 
platform: agency-admin
section: Duyệt thanh toán tiền mặt
figma: 
status: draft
---

# [AGA] Duyệt thanh toán tiền mặt: Duyệt từ màn "Chi tiết"

## Bối cảnh

Tách từ bản AGA-PAYMENT-2 gộp trước đó (cách 3 trong 3 cách duyệt) — ghép cặp với AGA-PAYMENT-6 (màn "Chi tiết" full-page). Story này CHỈ mô tả điều gì xảy ra khi bấm nút "✓ Đã nhận" trong header của màn "Chi tiết".

## User Story

Là Agency Admin, sau khi đã xem kỹ toàn bộ lịch sử đơn tiền mặt của 1 shop ở màn "Chi tiết" (đối chiếu sổ quỹ thật), tôi muốn duyệt luôn cho shop đó ngay tại màn đang xem, mà không cần quay lại danh sách rồi tìm đúng dòng để bấm "✓ Đã nhận".

## User Flow

1. Ở màn "Chi tiết" của 1 shop (xem AGA-PAYMENT-6), header có nút xanh **"✓ Đã nhận"** (xám/disabled nếu shop không còn đơn chờ).
2. Bấm vào → `window.confirm` giống hệt nội dung ở AGA-PAYMENT-2 (nêu tên shop + số đơn).
3. Xác nhận → duyệt xong, MÀN "CHI TIẾT" TỰ ĐÓNG LẠI (quay thẳng về danh sách chính, không cần bấm "←" thêm); shop đó đã chuyển sang tab "Đã xác nhận" khi danh sách hiện ra lại.
4. Huỷ `window.confirm` → không có đơn nào bị đổi trạng thái, màn "Chi tiết" KHÔNG tự thoát, vẫn đứng nguyên ở màn đó.
5. **Hệ quả tức thì bên Web Shop**: giống hệt AGA-PAYMENT-2 — shop vừa được duyệt, nếu đang bị tự động khoá tạo đơn, được mở lại tạo đơn NGAY.
6. Không có cách chọn lọc duyệt RIÊNG 1 vài đơn trong CÙNG 1 shop qua nút này — luôn áp dụng cho TẤT CẢ đơn `pending_review` của shop đang xem.

## System Flow

1. `ShopDetailView`'s `handleApprove()` (`CashRemittance.tsx`): gọi `approveShop(stats)` (CÙNG hàm dùng ở AGA-PAYMENT-2, bảng chính), nếu trả `true` thì gọi tiếp CẢ `onApproved()` (= `refresh` ở component cha) VÀ `onBack()` (= `setDetailShopId(null)`, thoát màn "Chi tiết") — khác với nút "✓ Đã nhận" ở bảng chính (chỉ gọi `refresh()`, không có gì để "quay lại" vì vốn đã đang ở danh sách).
2. `approveShop(stats)` giữ nguyên logic đã mô tả ở AGA-PAYMENT-2 (`window.confirm` + lặp `approveOrderPayment()` cho từng đơn `pending` của shop).
3. Vì `detailStats = allStats.find(s => s.shop.id === detailShopId)` tính lại MỖI LẦN RENDER (xem AGA-PAYMENT-6), nếu huỷ `window.confirm` thì màn "Chi tiết" tiếp tục hiển thị ĐÚNG dữ liệu hiện tại của shop, không có gì bị "đứng hình" hay sai lệch.

## Acceptance Criteria

**AC1:** Nút "✓ Đã nhận" trong header màn "Chi tiết" áp dụng đúng N = số đơn tiền mặt "Chờ duyệt" CỦA RIÊNG shop đang xem; N = 0 thì nút xám, disabled, không bấm được.

**AC2:** Bấm nút (N > 0) → hiện `window.confirm` có tên shop + số đơn, giống nội dung ở AGA-PAYMENT-2.

**AC3:** Xác nhận → CHỈ đơn của shop đang xem chuyển `confirmed`; TỰ ĐỘNG quay lại danh sách chính (không cần bấm "←" thêm).

**AC4:** Huỷ `window.confirm` → không có đơn nào bị đổi trạng thái; màn "Chi tiết" KHÔNG tự thoát, vẫn đứng nguyên ở màn đó.

**AC5:** Shop đang bị tự động khoá tạo đơn → sau khi duyệt từ màn này, Web Shop của shop đó MỞ LẠI tạo đơn NGAY.

**AC6:** Không có cách chọn lọc duyệt RIÊNG 1 vài đơn trong cùng 1 shop qua nút này — luôn áp dụng cho TẤT CẢ đơn `pending_review` của shop đang xem.

## Notes

- **Lịch sử**: ở bản v3 (modal "Chi tiết"), nút tương đương tên là "Duyệt shop này (N)" và khi duyệt xong thì "tự đóng modal". Ở bản v4 (full-page, xem AGA-PAYMENT-6), nút đổi tên thành "✓ Đã nhận" (khớp tên với nút ở bảng chính) và hành vi đổi từ "tự đóng modal" thành "tự quay lại danh sách chính" (`onBack()`) — nghiệp vụ duyệt (dùng `approveShop()`) KHÔNG đổi qua các bản.
- Tách từ bản AGA-PAYMENT-2 gộp trước đó (cách 3/3) — hành vi KHÔNG đổi, chỉ tách ra thành story riêng.
- Xem AGA-PAYMENT-6 (màn "Chi tiết", nơi nút này nằm); AGA-PAYMENT-2 (duyệt 1 dòng ở bảng chính — dùng chung hàm `approveShop()`); AGA-PAYMENT-7 (duyệt hàng loạt qua checkbox — dùng hàm khác, `handleApproveSelected()`).
