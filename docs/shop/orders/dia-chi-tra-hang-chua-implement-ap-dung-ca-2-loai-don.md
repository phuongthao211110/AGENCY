---
id: SHOP-ORDER-36
jiraKey:
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [WEB SHOP] Cài đặt đơn hàng - Trả hàng: Địa chỉ trả hàng — field tĩnh chưa implement, áp dụng cho cả 2 loại đơn qua 2 cơ chế khác nhau

## User Story

Là chủ shop, khi vào "Cài đặt đơn hàng" tôi thấy mục "Trả hàng" với field "Địa chỉ trả hàng" hiển thị cố định ở cuối trang — field này áp dụng cho cả đơn Hàng hoá lẫn Thư tài liệu (đích đến đều là địa chỉ trả hàng đã đăng ký), nhưng chưa tương tác được, và mô tả chưa làm rõ sự khác biệt về cơ chế giao chặng cuối giữa 2 loại đơn.

## User Flow

1. Vào "Cài đặt đơn hàng" → bất kỳ tab nào (Thông tin mặc định hoặc In đơn hàng) → cuộn xuống cuối trang.
2. Thấy section "Trả hàng" với 1 dòng: "Địa chỉ trả hàng" kèm mô tả "Khi đơn hàng giao không thành công, hoàn hàng đơn hàng sẽ được chuyển hoàn về địa chỉ mặc định này (áp dụng cho cả đơn Hàng hoá và Thư tài liệu)".
3. Control hiển thị "Chọn địa chỉ lấy hàng làm địa chỉ trả hàng" — trông như dropdown có chevron-down.
4. Bấm vào → không mở dropdown, không thay đổi giá trị, không có phản ứng gì.

## System Flow

1. Section "Trả hàng" render bằng `<SectionCard icon={<IcArrowReturn />} title="Trả hàng">` tại `Orders.tsx` dòng 823–825 — nằm NGOÀI cả `DefaultInfoSettings` (sub-tab Hàng hoá) lẫn `LetterDefaultSettings` (sub-tab Thư tài liệu). Không thay đổi khi chuyển sub-tab.
2. `<SettingRow label="Địa chỉ trả hàng" control={<SelectCtrl value="Chọn địa chỉ lấy hàng làm địa chỉ trả hàng" flex1 />}` — `SelectCtrl` (dòng 730–737) là `div + span + icon chevron-down`, không có `onClick`, `onChange`, hay bất kỳ event handler nào. Luôn hiện cứng chuỗi truyền vào `value`, không lưu giá trị.
3. Mô tả "áp dụng cho cả đơn Hàng hoá và Thư tài liệu" ĐÚNG về phạm vi: field này có nghiệp vụ với cả 2 loại đơn — đích đến đều là địa chỉ trả hàng đã đăng ký. Điểm chưa rõ trong mô tả: cơ chế giao chặng cuối khác nhau — Hàng hoá: NVC (GHN) giao thẳng đến địa chỉ này; Thư tài liệu: NVC (247Express) giao về đại lý trước (`returnHandoverAt`, xem SHOP-ORDER-8), đại lý sau đó tự giao lại tới địa chỉ trả hàng đã đăng ký.

## Acceptance Criteria

**AC1:** Section "Trả hàng" (Địa chỉ trả hàng) hiển thị 1 lần duy nhất trong "Cài đặt đơn hàng", nằm ngoài cả 2 sub-tab Hàng hoá/Thư tài liệu — không thay đổi khi chuyển sub-tab đang chọn.

**AC2:** Control "Địa chỉ trả hàng" là `SelectCtrl` tĩnh — luôn hiện cứng "Chọn địa chỉ lấy hàng làm địa chỉ trả hàng", bấm vào không mở dropdown, không thay đổi giá trị, không có sự kiện click nào. *(Gap: field chưa implement.)*

**AC3 *(đề xuất)*:** Mô tả "áp dụng cho cả đơn Hàng hoá và Thư tài liệu" đúng về phạm vi nhưng chưa làm rõ sự khác biệt về cơ chế giao chặng cuối: với Hàng hoá, NVC giao thẳng đến địa chỉ trả hàng; với Thư tài liệu, đại lý giao chặng cuối sau khi nhận hàng từ NVC. *(Đề xuất: bổ sung mô tả hoặc tooltip để phân biệt 2 cơ chế.)*

## Notes

- `SelectCtrl` (dòng 730–737 `Orders.tsx`): `div + span + icon chevron-down`, không có `onClick`, `onChange` hay bất kỳ event handler nào — verify trực tiếp trong code. Pattern placeholder tĩnh giống hệt "Ghi chú xem hàng" đã ghi nhận ở SHOP-ORDER-34.
- **Nghiệp vụ đúng với đơn Thư**: NVC (247Express) giao về đại lý trước (field `returnHandoverAt`, SHOP-ORDER-8), đại lý tự giao lại cho shop tại địa chỉ trả hàng đã đăng ký — đích đến đúng, người thực hiện chặng cuối là đại lý chứ không phải NVC.
- **Phân biệt với SHOP-ORDER-35**: SHOP-ORDER-35 ghi nhận câu xác nhận hoàn hàng ("nhà vận chuyển sẽ chuyển hoàn về địa chỉ trả hàng đã đăng ký") dùng chủ ngữ "nhà vận chuyển" không chính xác với đơn Thư — người giao chặng cuối là đại lý. Story này (SHOP-ORDER-36) ghi nhận chính field đó tại nguồn định nghĩa với 2 điểm: (1) chưa implement; (2) mô tả chưa phân biệt rõ cơ chế giao chặng cuối giữa 2 loại đơn. Hai story bổ sung nhau, không trùng nhau.
