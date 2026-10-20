---
id: GSA-PAYMENT-CONFIG-1
jiraKey: 
platform: super-admin
section: Cài đặt - Quy tắc thanh toán tiền mặt
figma: 
status: draft
---

# [GSA] Cài đặt: Cấu hình ngưỡng cảnh báo & khoá tạo đơn theo thanh toán tiền mặt

## User Story

Là GHN Super Admin, tôi muốn cấu hình được số ngày trễ chuyển tiền mặt để hiện cảnh báo và số ngày để tự động khoá tạo đơn, thay vì các ngưỡng này bị cố định cứng trong code, để có thể điều chỉnh chính sách thu hồi công nợ tiền mặt cho toàn hệ thống khi cần mà không cần sửa code.

## User Flow

1. Vào Super Admin → sidebar "Cài đặt" → mục con **"Quy tắc thanh toán tiền mặt"** → route `/super-admin/settings/cash-remittance-rules`.
2. Đầu trang mô tả ngắn: Shop thu hộ tiền mặt phí ship phải chuyển lại cho Agency; 2 ngưỡng dưới đây quyết định khi nào Web Shop cảnh báo và khi nào tự động khoá tạo đơn, tính theo ngày lịch từ đơn tiền mặt chưa duyệt cũ nhất của shop.
3. Form gồm 2 ô nhập số nguyên (đơn vị "ngày"):
   - **"Số ngày hiện cảnh báo"** (mặc định 1) — kèm chú thích: Shop trễ từ số ngày này trở lên sẽ thấy cảnh báo khi bấm "Tạo đơn hàng", vẫn tạo đơn được.
   - **"Số ngày khoá tạo đơn"** (mặc định 3) — kèm chú thích: Shop trễ từ số ngày này trở lên sẽ bị tự động khoá, không tạo được đơn mới cho tới khi Agency duyệt bớt nợ.
4. Nếu "Số ngày khoá tạo đơn" ≤ "Số ngày hiện cảnh báo" → hiện lỗi đỏ "Số ngày khoá tạo đơn phải LỚN HƠN số ngày cảnh báo.", nút "Lưu thay đổi" bị disabled.
5. Hợp lệ → bấm "Lưu thay đổi" → hiện dòng xác nhận xanh "✓ Đã lưu — áp dụng ngay cho Web Shop & Agency Admin" (tự ẩn sau ~2.5s).
6. Giá trị lưu được giữ qua lần reload trang (đọc lại từ localStorage khi mở form).
7. Thay đổi có hiệu lực NGAY LẬP TỨC — không cần deploy lại hay restart app — vì Web Shop và Agency Admin đều đọc config này trực tiếp mỗi lần render.

## System Flow

1. `src/platforms/super-admin/pages/settings/CashRemittanceRules.tsx`, route lồng trong `settings` của Super Admin (`App.tsx`), nav item trong `SuperAdminLayout`/`Settings.tsx` (`SETTINGS_NAV`).
2. `CashRemittanceConfig` (kiểu MỚI, `orderStore.ts`): `{ warningDays: number; blockDays: number }` — áp dụng CHUNG cho toàn hệ thống (mọi đại lý/shop), không cấu hình riêng từng đại lý.
3. `loadRemittanceConfig()`/`saveRemittanceConfig()` (`orderStore.ts`): đọc/ghi `localStorage` key `ghn_cash_remittance_config_v1`. Khi chưa từng lưu (hoặc giá trị hỏng/không hợp lệ) → trả về mặc định `{ warningDays: 1, blockDays: 3 }`, giữ nguyên hành vi hệ thống trước khi có tính năng này.
4. `isOrderCreationBlocked(shopId)` (`orderStore.ts`) đổi từ hardcode `>= 3` sang `shopCashOverdueDays(shopId) >= loadRemittanceConfig().blockDays`.
5. Web Shop (`Orders.tsx`, SHOP-ORDER-43): `creationBlocked`/`cashOverdueWarning` và các dòng `window.alert()` nhắc số ngày đều đọc `loadRemittanceConfig()` thay vì hardcode "3 ngày"/"1 ngày".
6. Agency Admin (`CashRemittance.tsx`, AGA-PAYMENT-1): `StatusCell`, `ShopGroup`, và phần tổng hợp đầu trang (mô tả + 4 chip + danh sách `warningOrders`/`blockedOrders`) đều đọc `loadRemittanceConfig()` thay vì hardcode `>= 1`/`>= 3`.
7. Không có API/backend thật — đây là localStorage THUẦN (PROTOTYPE), nên "áp dụng toàn hệ thống" chỉ đúng trong phạm vi CÙNG trình duyệt/thiết bị đang demo.

## Acceptance Criteria

**AC1:** Mở form lần đầu (chưa từng lưu cấu hình) → 2 input hiện đúng mặc định 1 và 3.

**AC2:** Nhập "Số ngày khoá tạo đơn" ≤ "Số ngày hiện cảnh báo" → nút "Lưu thay đổi" disabled, hiện đúng thông báo lỗi; KHÔNG ghi đè được cấu hình cũ bằng giá trị không hợp lệ.

**AC3:** Nhập hợp lệ (khoá > cảnh báo) → bấm "Lưu thay đổi" → hiện dòng xác nhận đã lưu; reload trang → 2 input vẫn giữ đúng giá trị vừa lưu.

**AC4:** Sau khi lưu cấu hình mới, Web Shop (`/shop/orders`) áp dụng NGAY ngưỡng mới cho cảnh báo/khoá tạo đơn — không cần reload app hay build lại.

**AC5:** Sau khi lưu cấu hình mới, Agency Admin (`/agency-admin/cash-remittance`) hiện đúng badge/chip tổng theo ngưỡng MỚI (mô tả đầu trang, nhãn "⚠ Trễ N ngày"/"🚫 Quá N ngày — đã khoá tạo đơn", 4 chip tổng) — không còn dùng ngưỡng cũ 1/3 cứng.

**AC6:** Input chỉ nhận số nguyên dương (tối thiểu 1) — không cho nhập số âm/0/ký tự không phải số.

## Notes

- Tính năng này sinh ra vì AGA-PAYMENT-1/2/3 (Agency Admin) và SHOP-ORDER-43/45 (Web Shop) trước đó đều HARDCODE cứng "1 ngày cảnh báo / 3 ngày khoá" trong code — không ai điều chỉnh được ngoài sửa code trực tiếp.
- Áp dụng CHUNG 1 cặp ngưỡng cho TOÀN HỆ THỐNG (không phân biệt từng đại lý) — nếu sau này cần cấu hình RIÊNG theo từng đại lý, cần thiết kế lại `CashRemittanceConfig` (ví dụ map theo `agencyId`), ngoài phạm vi lần làm này.
- Xem AGA-PAYMENT-1/2/3 (Agency Admin — nơi hiển thị/duyệt theo ngưỡng này) và SHOP-ORDER-43/45/55 (Web Shop — nơi cảnh báo/khoá tạo đơn và khai chuyển tiền theo ngưỡng này).
