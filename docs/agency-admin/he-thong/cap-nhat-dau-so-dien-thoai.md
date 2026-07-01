---
id: AGA-HT-1
jiraKey: AGENCY-609
platform: all
section: Hệ thống
status: draft
---

# [HỆ THỐNG] Cập nhật danh sách đầu số điện thoại hợp lệ

## User Story

Là người dùng (Shop / Agency Admin / Super Admin), tôi muốn có thể nhập số điện thoại với các đầu số mới và hợp lệ của tất cả nhà mạng Việt Nam để hệ thống không từ chối các SĐT thực tế đang dùng.

## Bối cảnh / Vấn đề

Danh sách đầu số điện thoại hiện tại trong hệ thống bị **thiếu nhiều đầu số hợp lệ** so với config thực tế của GHN (`valid_mobilephone_headers`).

Người dùng nhập SĐT hợp lệ → hệ thống báo lỗi sai → không thể tạo đơn / tạo shop / kết nối GHN.

---

## Danh sách đầu số GHN hỗ trợ (nguồn: `valid_mobilephone_headers`)

> Prefix bên dưới là **3 chữ số đầu (sau khi thêm số 0)**

### Di động — 10 số

| Nhà mạng | Đầu số đầy đủ |
|----------|--------------|
| Viettel | 032, 033, 034, 035, 036, 037, 038, 039, 086, 096, 097, 098, **0868** |
| Vinaphone | 081, 082, 083, 084, 085, 088, 091, 094 |
| MobiFone | **070, 071, 072**, 076, 077, 078, 079, **080**, 089, 090, 093 |
| Vietnamobile | 052, **053, 054, 055**, 056, 057, 058, 092 |
| Gmobile | **051**, 059, 099 |
| Itel | 087 |

> **In đậm** = đầu số hiện tại **đang thiếu** trong prototype

### Di động — Đầu số cũ 11 số (đã chuyển đổi, vẫn cần validate)

| Đầu số cũ | Đầu số mới tương đương |
|-----------|----------------------|
| 0120–0129 | 070–079 (MobiFone) |
| 0161–0169 | 056–058, 059... (Vietnamobile/Gmobile) |
| 0186 | 056 (Vietnamobile) |
| 0188 | 058 (Vietnamobile) |
| 0199 | 059 (Gmobile) |

> Lưu ý: Các số 11 chữ số này đã được Bộ TT&TT yêu cầu chuyển sang 10 số từ 11/2018. Tuy nhiên, GHN vẫn giữ trong config để backward-compatible với dữ liệu cũ.

### Điện thoại cố định (`valid_homephone_headers`)

Đầu số bắt đầu bằng mã vùng (thêm số 0): 024, 028, 0203–0299 (trừ các số không có trong danh sách).

> **Scope task AGENCY-609:** Ưu tiên di động 10 số trước. Điện thoại cố định xử lý riêng nếu cần.

---

## Các field bị ảnh hưởng

| Platform | Màn hình | Field |
|----------|----------|-------|
| **Agency Admin** | Tạo shop mới | SĐT chủ shop |
| **Agency Admin** | Tạo đơn hàng | SĐT người gửi, SĐT người nhận |
| **Agency Admin** | Kết nối GHN (CarrierSetup) | SĐT tài khoản GHN |
| **Agency Admin** | Cài đặt tài khoản | SĐT |
| **Super Admin** | Tạo đại lý mới | SĐT chủ đại lý |
| **Super Admin** | Cài đặt tài khoản | SĐT |
| **Web Shop** | Tạo đơn hàng | SĐT người gửi, SĐT người nhận |
| **Web Shop** | Cài đặt tài khoản | SĐT |

---

## User Flow

1. Người dùng mở bất kỳ form có field SĐT
2. Nhập số điện thoại (10 chữ số)
3. Hệ thống validate khi blur hoặc khi submit:
   - Đủ 10 chữ số ✓
   - 3 chữ số đầu nằm trong danh sách đầu số hợp lệ ✓
4. Nếu hợp lệ → cho phép tiếp tục
5. Nếu không hợp lệ → hiển thị lỗi: _"Số điện thoại không hợp lệ. Vui lòng kiểm tra lại đầu số."_

---

## System Flow / Logic Validate

```ts
const VALID_PREFIXES_10D = [
  // Viettel
  '032','033','034','035','036','037','038','039','086','096','097','098','086',
  // Viettel — bổ sung
  '086',
  // Vinaphone
  '081','082','083','084','085','088','091','094',
  // MobiFone
  '070','071','072','076','077','078','079','080','089','090','093',
  // Vietnamobile
  '052','053','054','055','056','057','058','092',
  // Gmobile
  '051','059','099',
  // Itel
  '087',
  // Viettel đặc biệt
  '086', // 0868 → prefix 086 (đã có)
]

const isValidPhoneVN = (phone: string): boolean => {
  const cleaned = phone.replace(/[\s\-\.]/g, '')
  if (!/^\d{10}$/.test(cleaned)) return false
  const prefix = cleaned.slice(0, 3)
  return VALID_PREFIXES_10D.includes(prefix)
}

const PHONE_ERROR_MSG = 'Số điện thoại không hợp lệ. Vui lòng kiểm tra lại đầu số.'
```

---

## So sánh trước / sau

| | Trước | Sau |
|--|-------|-----|
| Tổng đầu số | 42 | ~55+ |
| Đầu số thiếu | 073, 080, 071, 072, 083*, 085*, 051, 053, 054, 055, 057, 0868 | Không còn thiếu |
| 11 số cũ | Không hỗ trợ | Backward-compatible (TBD) |
| Điện thoại cố định | Không hỗ trợ | TBD — task riêng |

> *083, 085: Vinaphone — kiểm tra lại xem prototype hiện tại có hay không.

---

## Tác động đa nền tảng

| Platform | Thay đổi |
|----------|----------|
| **Agency Admin** | Validate SĐT tại tạo shop, tạo đơn, kết nối GHN, cài đặt |
| **Super Admin** | Validate SĐT tại tạo đại lý, cài đặt |
| **Web Shop** | Validate SĐT tại tạo đơn, cài đặt |

Thay đổi tập trung vào **1 utility function** `isValidPhoneVN()` — các form import và dùng chung. Không ảnh hưởng logic nghiệp vụ.

---

## Acceptance Criteria

**AC1:** Các đầu số sau đây được chấp nhận (trước đây bị từ chối):
`071, 072, 073, 080, 051, 053, 054, 055, 057, 0868`

**AC2:** Các đầu số không tồn tại (ví dụ: `011, 044, 060`) bị từ chối với message: _"Số điện thoại không hợp lệ. Vui lòng kiểm tra lại đầu số."_

**AC3:** Validation áp dụng nhất quán cho **tất cả field SĐT** trên 3 platform — không có field nào dùng rule cũ.

**AC4:** SĐT 9 số, 11 số, hoặc có ký tự đặc biệt đều bị từ chối.

**AC5:** Logic validate được tập trung tại 1 utility function, không hardcode riêng lẻ tại từng form.

**AC6:** Không có regression — các đầu số hiện tại đang hợp lệ vẫn tiếp tục được chấp nhận.

---

## Notes

- Danh sách đầu số chuẩn theo **config GHN** (`valid_mobilephone_headers`) — không phải danh sách Bộ TT&TT vì GHN có thể có rule riêng
- Đầu số `0868` → prefix `086` đã có trong Viettel, nên thực ra không bị thiếu nếu validate 3 số đầu
- Điện thoại cố định (`valid_homephone_headers`) phức tạp hơn (mã vùng 2–4 số) → tách task riêng
- Cần confirm với backend team về format lưu SĐT trong DB: có normalize (bỏ khoảng trắng, dấu gạch) trước khi lưu không?
