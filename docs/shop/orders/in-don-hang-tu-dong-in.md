---
id: SHOP-ORDER-16
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Cài đặt đơn hàng - In đơn hàng: Tự động in vận đơn

## User Story

Là chủ shop, tôi muốn hệ thống tự mở phiếu in ngay khi vận đơn có thể in được, để không phải quay lại danh sách đơn tìm và in tay từng đơn.

## User Flow

1. Ở tab "In đơn hàng", mục "In vận đơn" có toggle "Tự động in..." — bật/tắt được.
2. **Sub-tab Hàng hoá:** bật → tự mở phiếu in ngay khi tạo đơn thành công (đơn có mã vận đơn thật ngay lúc này).
3. **Sub-tab Thư tài liệu:** bật → tự mở phiếu in ngay khi đơn chuyển sang trạng thái đã dispatch cho nhà vận chuyển (đơn CHỈ có mã vận đơn thật từ lúc này, không phải lúc tạo đơn — xem [SHOP-ORDER-20](./in-don-hang-thong-tin-hien-thi-thu.md)).

## System Flow

1. State riêng theo loại đơn: `goodsAutoPrint`/`letterAutoPrint`, mặc định `true` cho cả 2.
2. Nhãn toggle đổi theo loại đơn — không dùng chung 1 câu, vì thời điểm trigger khác nhau:
   - Hàng hoá: "Tự động in khi tạo đơn"
   - Thư tài liệu: "Tự động in khi đại lý đã gửi hàng cho nhà vận chuyển" (KHÔNG nêu tên NVC/247Express, đúng nguyên tắc shop không được biết ai xử lý đơn)
3. Đây chỉ là preference UI (toggle bật/tắt) — **chưa nối với hành động in thật hay sự kiện tạo đơn/dispatch thật** (chưa có `window.print()` hay listener theo dõi thay đổi `carrierCode`). Việc thực thi tự động in khi đúng thời điểm là phần chưa làm, thuộc story tương lai khi build tính năng in thật.

## Acceptance Criteria

**AC1:** Toggle "Tự động in..." mặc định ở trạng thái Bật khi mở tab lần đầu, cho cả 2 sub-tab.

**AC2:** Nhãn/mô tả toggle ở sub-tab Hàng hoá nói về thời điểm "tạo đơn thành công"; ở sub-tab Thư tài liệu nói về thời điểm "đại lý đẩy đơn qua 247".

**AC3:** Bật/tắt toggle ở 1 sub-tab không ảnh hưởng trạng thái toggle ở sub-tab kia.

## Notes

- Tách từ [SHOP-ORDER-13](./in-don-hang-hang-hoa.md) và [SHOP-ORDER-14](./in-don-hang-thu-tai-lieu.md).
- **Gap còn lại (vẫn đúng sau thay đổi kiến trúc tháng 9/2026):** toggle `autoPrint` giờ persist qua `printSettingsStore.ts` (xem [SHOP-ORDER-30](./in-don-hang-thu-cau-hinh-ap-dung-van-don-that.md)) thay vì mất khi đóng modal — nhưng KHÔNG có bất kỳ đoạn code nào đọc `autoPrint` để tự mở `PrintOrderModal` khi tạo đơn Hàng hoá hay khi đại lý dispatch đơn Thư. Prototype đã có tính năng in thật (`window.print()` qua `PrintOrderModal` từ SHOP-ORDER-26/27) — điều còn thiếu là trigger tự động (auto-open modal đúng thời điểm). Cần làm riêng khi có yêu cầu.
- **Đính chính:** nhãn toggle Thư tài liệu trước đây ghi nhầm "...qua 247" — đã verify lại code thật (`Orders.tsx`) và sửa đúng thành "...cho nhà vận chuyển", không nêu tên NVC (phát hiện khi viết [SHOP-ORDER-24](./in-don-hang-thu-tai-lieu-in-van-don.md)).
