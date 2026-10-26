---
id: GSA-PAYMENT-CONFIG-1
jiraKey: 
platform: super-admin
section: Cài đặt - Quy tắc thanh toán tiền mặt
figma: 
status: draft
---

# [GSA] Cài đặt: Cấu hình ngưỡng cảnh báo & khoá tạo đơn theo thanh toán tiền mặt (riêng từng đại lý)

## User Story

Là GHN Super Admin, tôi muốn cấu hình được số ngày trễ chuyển tiền mặt để hiện cảnh báo và số ngày để tự động khoá tạo đơn, RIÊNG CHO TỪNG ĐẠI LÝ (mỗi đại lý tự đặt mức tin tưởng/khắt khe khác nhau với shop của mình), thay vì các ngưỡng này bị cố định cứng trong code hoặc dùng chung 1 mức cho toàn hệ thống, để có thể điều chỉnh chính sách thu hồi công nợ tiền mặt linh hoạt theo từng đại lý khi cần mà không cần sửa code.

## User Flow

1. Vào Super Admin → sidebar "Cài đặt" → mục con **"Quy tắc thanh toán tiền mặt"** → route `/super-admin/settings/cash-remittance-rules`.
2. Đầu trang mô tả ngắn: Shop thu hộ tiền mặt phí ship phải chuyển lại cho Agency; 2 ngưỡng dưới đây quyết định khi nào Web Shop cảnh báo và khi nào tự động khoá tạo đơn, tính theo ngày lịch từ đơn tiền mặt chưa duyệt cũ nhất của shop — **cấu hình RIÊNG cho từng đại lý**.
3. Ngay dưới mô tả: dropdown **"Đại lý:"** liệt kê toàn bộ đại lý trong hệ thống (tên + mã), mặc định chọn đại lý đầu tiên.
4. Form gồm 2 ô nhập số nguyên (đơn vị "ngày") CỦA ĐÚNG đại lý đang chọn:
   - **"Số ngày hiện cảnh báo"** (mặc định 1 nếu đại lý chưa từng cấu hình) — kèm chú thích: Shop trễ từ số ngày này trở lên sẽ thấy cảnh báo khi bấm "Tạo đơn hàng", vẫn tạo đơn được.
   - **"Số ngày khoá tạo đơn"** (mặc định 3 nếu đại lý chưa từng cấu hình) — kèm chú thích: Shop trễ từ số ngày này trở lên sẽ bị tự động khoá, không tạo được đơn mới cho tới khi Agency duyệt bớt nợ.
5. Đổi dropdown sang đại lý KHÁC → form NẠP LẠI ngay đúng 2 giá trị của đại lý mới chọn (hoặc mặc định 1/3 nếu đại lý đó chưa từng được cấu hình) — KHÔNG giữ lại giá trị đang gõ dở của đại lý trước.
6. Nếu "Số ngày khoá tạo đơn" ≤ "Số ngày hiện cảnh báo" → hiện lỗi đỏ "Số ngày khoá tạo đơn phải LỚN HƠN số ngày cảnh báo.", nút "Lưu thay đổi" bị disabled.
7. Hợp lệ → bấm "Lưu thay đổi" → hiện dòng xác nhận xanh "✓ Đã lưu — áp dụng ngay cho Web Shop & Agency Admin của đại lý này" (tự ẩn sau ~2.5s) — CHỈ áp dụng cho đại lý đang chọn, không ảnh hưởng đại lý khác.
8. Giá trị lưu được giữ qua lần reload trang VÀ qua lần đổi dropdown (đọc lại từ localStorage theo đúng `agencyId` mỗi lần chọn).
9. Thay đổi có hiệu lực NGAY LẬP TỨC cho đại lý đó — không cần deploy lại hay restart app — vì Web Shop (đọc theo `agencyId` của shop) và Agency Admin (đọc theo đại lý đang đăng nhập) đều đọc config này trực tiếp mỗi lần render.

## System Flow

1. `src/platforms/super-admin/pages/settings/CashRemittanceRules.tsx`, route lồng trong `settings` của Super Admin (`App.tsx`), nav item trong `SuperAdminLayout`/`Settings.tsx` (`SETTINGS_NAV`). Component `AgencyRulesForm({ agencyId })` tách riêng, được gọi với `key={agencyId}` từ component cha — đổi `agencyId` làm React tự remount, tự nạp lại local state `warningDays`/`blockDays`, không cần `useEffect` đồng bộ thủ công.
2. `CashRemittanceConfig` (`orderStore.ts`): `{ warningDays: number; blockDays: number }` — vẫn là shape trả về khi ĐỌC (không đổi để không phải sửa lại toàn bộ call site cũ), nhưng lưu trữ bên trong giờ là RIÊNG TỪNG ĐẠI LÝ.
3. `loadRemittanceConfig(agencyId)`/`saveRemittanceConfig(agencyId, config)` (`orderStore.ts`, ĐỔI CHỮ KÝ — nhận thêm `agencyId`): đọc/ghi `localStorage` key `ghn_cash_remittance_config_v2`, lưu dạng 1 mảng DÙNG CHUNG `{ agencyId, warningDays, blockDays }[]` — cùng convention với `PriceTable` (`pricingStore.ts`, cũng gắn `agencyId` trong 1 mảng chung thay vì tách key riêng từng đại lý). Đại lý chưa từng được lưu (hoặc giá trị hỏng/không hợp lệ) → trả về mặc định `{ warningDays: 1, blockDays: 3 }`, giữ nguyên hành vi hệ thống trước khi có tính năng này.
4. `isOrderCreationBlocked(shopId)` (`orderStore.ts`) GIỮ NGUYÊN chữ ký cũ (chỉ nhận `shopId`, không phải sửa gì ở MỌI call site hiện có) — bên trong tự tra `loadShops().find(s => s.id === shopId)` để lấy `agencyId` của shop đó, rồi `shopCashOverdueDays(shopId) >= loadRemittanceConfig(shop.agencyId).blockDays`.
5. Web Shop (`Orders.tsx`, SHOP-ORDER-43): mọi lời gọi `loadRemittanceConfig(...)` trực tiếp (không qua `isOrderCreationBlocked`) đều truyền đúng `agencyId` của shop đang đăng nhập (`currentShop.agencyId`/`shopForLetterCheck.agencyId`) — `creationBlocked`/`cashOverdueWarning` và các dòng `window.alert()` nhắc số ngày đều đọc đúng ngưỡng của ĐẠI LÝ QUẢN LÝ shop đó, không còn 1 ngưỡng chung.
6. Agency Admin (`CashRemittance.tsx`, AGA-PAYMENT-1): `StatusCell`, `ShopGroup`, và phần tổng hợp đầu trang đều gọi `loadRemittanceConfig(CURRENT_AGENCY_ID)` — `CURRENT_AGENCY_ID = 'AGN001'` (hằng số mô phỏng "đại lý đang đăng nhập" trong prototype), nên Agency Admin chỉ thấy đúng ngưỡng của CHÍNH đại lý mình, không lẫn với đại lý khác.
7. Không có API/backend thật — đây là localStorage THUẦN (PROTOTYPE), nên "áp dụng cho đại lý đó" chỉ đúng trong phạm vi CÙNG trình duyệt/thiết bị đang demo (mọi đại lý đều "chia sẻ" chung 1 trình duyệt khi demo, khác thực tế mỗi đại lý có tài khoản/thiết bị riêng).

## Acceptance Criteria

**AC1:** Mở trang lần đầu → dropdown đại lý hiện đúng toàn bộ đại lý trong hệ thống, mặc định chọn đại lý đầu tiên; đại lý đó chưa từng lưu cấu hình → 2 input hiện đúng mặc định 1 và 3.

**AC2:** Nhập "Số ngày khoá tạo đơn" ≤ "Số ngày hiện cảnh báo" → nút "Lưu thay đổi" disabled, hiện đúng thông báo lỗi; KHÔNG ghi đè được cấu hình cũ bằng giá trị không hợp lệ.

**AC3:** Nhập hợp lệ (khoá > cảnh báo) cho đại lý A, bấm "Lưu thay đổi" → hiện dòng xác nhận đã lưu; reload trang, chọn lại đại lý A → 2 input vẫn giữ đúng giá trị vừa lưu.

**AC4:** Cấu hình đại lý A xong, đổi dropdown sang đại lý B (chưa từng cấu hình) → form hiện đúng mặc định 1/3 của B, KHÔNG dính giá trị của A; cấu hình riêng B rồi đổi lại A → A vẫn giữ đúng giá trị riêng của A, không bị B ghi đè.

**AC5:** Sau khi lưu cấu hình mới cho 1 đại lý, Web Shop (`/shop/orders`) của shop THUỘC đại lý đó áp dụng NGAY ngưỡng mới cho cảnh báo/khoá tạo đơn — không cần reload app hay build lại; shop thuộc đại lý KHÁC không bị ảnh hưởng.

**AC6:** Sau khi lưu cấu hình mới, Agency Admin (`/agency-admin/cash-remittance`) của ĐÚNG đại lý đó hiện đúng badge/chip tổng theo ngưỡng MỚI (mô tả đầu trang, nhãn "⚠ Trễ N ngày"/"🚫 Quá N ngày — đã khoá tạo đơn", 4 chip tổng) — không còn dùng ngưỡng cũ 1/3 cứng, và không lẫn ngưỡng của đại lý khác.

**AC7:** Input chỉ nhận số nguyên dương (tối thiểu 1) — không cho nhập số âm/0/ký tự không phải số.

## Notes

- Tính năng này sinh ra vì AGA-PAYMENT-1/2/3 (Agency Admin) và SHOP-ORDER-43/45 (Web Shop) trước đó đều HARDCODE cứng "1 ngày cảnh báo / 3 ngày khoá" trong code — không ai điều chỉnh được ngoài sửa code trực tiếp.
- **Bản làm lại (v2 — chuyển từ GLOBAL sang PER-AGENCY)**: bản đầu tiên của story này áp dụng CHUNG 1 cặp ngưỡng cho TOÀN HỆ THỐNG (không phân biệt từng đại lý), với ghi chú rõ "nếu sau này cần cấu hình riêng theo từng đại lý, cần thiết kế lại". Đã làm lại đúng theo hướng đó — xem phần System Flow để biết đổi gì (localStorage key đổi từ `ghn_cash_remittance_config_v1` sang `ghn_cash_remittance_config_v2`, dữ liệu cũ dưới key v1 không còn được đọc — coi như mọi đại lý bắt đầu lại từ mặc định 1/3).
- Dropdown chọn đại lý dùng `agenciesList` (`agencyStore.ts`) — cùng nguồn dữ liệu đại lý với `AgencyDetail.tsx` (nơi Super Admin cấu hình `orderFormComponents`/`allowedCarriers`/`allowedServices247` riêng từng đại lý) — tuy nhiên tính năng này KHÔNG gắn vào trang `AgencyDetail.tsx`, vẫn giữ là 1 trang Cài đặt riêng có route/nav mục riêng, chỉ thêm dropdown chọn đại lý ngay trong trang đó.
- Xem AGA-PAYMENT-1/2/3 (Agency Admin — nơi hiển thị/duyệt theo ngưỡng này) và SHOP-ORDER-43/45/55 (Web Shop — nơi cảnh báo/khoá tạo đơn và khai chuyển tiền theo ngưỡng này).
