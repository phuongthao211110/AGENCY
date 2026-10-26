---
id: SHOP-SETTINGS-2
jiraKey: 
platform: shop
section: Cài đặt
figma: 
status: draft
---

# [WEB SHOP] Cài đặt: Tem QR — Tạo mới & danh sách

## Bối cảnh

Tách từ story gốc "Tem QR — tạo & quản lý mã QR dẫn tới Tạo đơn hàng" (từng là SHOP-SETTINGS-2 duy nhất, gộp hết mọi thao tác) thành 6 story nhỏ theo từng nhóm hành động, để mỗi story độc lập review/giao việc được. Đây là story NỀN TẢNG — 5 story còn lại (SHOP-SETTINGS-3 đến 7) đều phụ thuộc trang danh sách và `qrStore.ts` đã mô tả ở đây.

## User Story

Là chủ shop, tôi muốn tạo được nhiều "tem QR" (mỗi tem gắn với 1 tên gợi nhớ như "Quầy thịt", "Quầy tươi sống") để in dán ở từng khu vực/quầy vật lý của mình, và xem được danh sách tất cả tem đã tạo (lọc theo trạng thái, tìm kiếm theo tên/mã), để quản lý nhiều điểm bán cùng lúc mà không bị rối.

## User Flow

1. Vào Cài đặt (Web Shop) → mục con **"Tem QR"** (icon mã QR) → route `/shop/settings/qr-codes`.
2. Đầu trang: tiêu đề "Tem QR" + nút **"+ Thêm tem QR"** (cam) góc phải.
3. 3 tab lọc: "Tất cả" / "Đang hoạt động" / "Đã vô hiệu" — bấm đổi tab lọc đúng theo trạng thái bật/tắt của tem; ô tìm kiếm lọc theo tên tem hoặc mã tem.
4. Bảng liệt kê: **Tên tem** (tên + mã tem bên dưới) | **Trạng thái** (toggle bật/tắt + nhãn "Đang hoạt động"/"Đã vô hiệu" — xem SHOP-SETTINGS-5) | **Lượt quét** (`{đã quét}/{giới hạn hoặc "Không giới hạn"}`) | **Hết hạn** (ngày giờ hoặc "Không thời hạn") | **Ghi chú** | **Thao tác** (3 icon: xem tem QR — màn hình riêng cách điệu, SHOP-SETTINGS-3; chỉnh sửa — SHOP-SETTINGS-7; xoá — SHOP-SETTINGS-5).
5. Danh sách rỗng ban đầu (chưa tạo tem nào) → hiện hướng dẫn tạo tem đầu tiên thay vì bảng trống trơn.
6. Bấm **"+ Thêm tem QR"** → modal "Thêm tem QR" với 4 field: "Tên tem" (bắt buộc, placeholder "Ví dụ: Quầy 1"), "Thời điểm hết hạn" (date-time picker, để trống = không thời hạn), "Giới hạn lượt quét" (số, để trống = không giới hạn), "Ghi chú" (textarea, nội bộ) → bấm "Thêm tem QR" để lưu, tem mới mặc định **Đang hoạt động**, 0 lượt quét, xuất hiện ngay trong bảng.

## System Flow

1. `src/mock-data/qrStore.ts` (store mới, localStorage key `ghn_qr_codes_v1`): `QrCode { id, shopId, name, active, scanCount, scanLimit: number|null, expiresAt: string|null, note, createdAt }`. `loadQrCodes(shopId)` trả về mảng tem của đúng shop, sort theo `createdAt` giảm dần.
2. `addQrCode(shopId, input: { name, expiresAt, scanLimit, note })`: sinh `id` mới, `active: true`, `scanCount: 0`, `createdAt: new Date().toISOString()`, `.trim()` cho `name`/`note`.
3. `id` sinh bằng 12 ký tự ngẫu nhiên từ bảng chữ/số đã bỏ ký tự dễ nhầm (`0/O`, `1/I`) — dễ đọc tay nếu cần đối chiếu, dù mục đích chính vẫn là quét QR.
4. Trang `src/platforms/shop/pages/settings/QrCodes.tsx` (route `qr-codes` lồng trong `settings` của Web Shop, `App.tsx`; nav item "Tem QR" icon `QrcodeOutlined` trong `SETTINGS_NAV`, `Settings.tsx`). Bảng dùng flex-table tự viết (không dùng antd Table, đúng quy tắc dự án).
5. `QrFormModal({mode: 'add', onSave, onClose})` — component DÙNG CHUNG với modal Sửa (xem SHOP-SETTINGS-7), ở `mode: 'add'` chỉ render 4 field cơ bản, KHÔNG có khối toggle "Đang hoạt động" (tem mới tạo luôn mặc định bật, không cần hỏi lại lúc Thêm).
6. 3 tab lọc + ô tìm kiếm là state cục bộ của `QrCodes()`, lọc trên mảng `loadQrCodes(shopId)` đã tải, không gọi lại store theo từng tab.

## Acceptance Criteria

**AC1:** Vào `/shop/settings/qr-codes` lần đầu (chưa có tem nào) → hiện hướng dẫn tạo tem đầu tiên, không hiện bảng rỗng trơ trọi.

**AC2:** "+ Thêm tem QR" với "Tên tem" bỏ trống → nút "Thêm tem QR" trong modal disabled, không lưu được.

**AC3:** Tạo tem thành công → xuất hiện ngay trong bảng, mặc định "Đang hoạt động", 0 lượt quét, đúng tên/hết hạn/giới hạn/ghi chú đã nhập.

**AC4:** 3 tab lọc đúng theo trạng thái bật/tắt của từng tem; ô tìm kiếm lọc đúng theo tên HOẶC mã tem, không phân biệt hoa/thường.

## Notes

- Tính năng NET-NEW trong phiên làm việc đã build — trước đó Web Shop chưa có khái niệm "tem QR" nào.
- Xem SHOP-SETTINGS-3 (xem tem QR — màn hình riêng cách điệu), SHOP-SETTINGS-4 (quét tem dẫn tới Tạo đơn hàng), SHOP-SETTINGS-5 (bật/tắt + xoá), SHOP-SETTINGS-6 (chống đếm trùng lượt quét), SHOP-SETTINGS-7 (chỉnh sửa tem) — tất cả đều build trên NỀN đã mô tả ở đây.
- **PROTOTYPE THUẦN** — lưu localStorage, không có backend thật.
