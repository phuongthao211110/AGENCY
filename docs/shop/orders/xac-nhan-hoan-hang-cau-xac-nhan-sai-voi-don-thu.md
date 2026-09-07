---
id: SHOP-ORDER-35
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW/-SHOP--WEB-SHOP?node-id=2-449
status: draft
---

# [SHOP] Đơn hàng - Chi tiết: Câu xác nhận hoàn hàng dùng sai chủ ngữ cho đơn Thư

## User Story

Là Shop, khi bấm "Hoàn hàng" cho đơn Thư ở trạng thái chờ xác nhận giao lại, tôi muốn thấy câu xác nhận đúng với cách hàng thực sự được hoàn — câu hiện tại dùng chủ ngữ "nhà vận chuyển" không chính xác với đơn Thư vì người giao chặng cuối là đại lý, không phải NVC trực tiếp.

## User Flow

1. Đơn Thư (`sendKind: 'letter'`) đang ở status `redelivery` hoặc có log cuối `DELIVERY_FAIL`/`WAITING_TO_RETURN` → `isReturnEligible` đúng → nút "Hoàn hàng" xuất hiện ở chi tiết đơn.
2. Bấm "Hoàn hàng" → hiện khối xác nhận cam với câu hiện tại: *"Bạn chắc chắn muốn yêu cầu hoàn hàng đơn này? Đơn sẽ chuyển sang trạng thái 'Đang hoàn hàng' — nhà vận chuyển sẽ chuyển hoàn về địa chỉ trả hàng đã đăng ký."*
3. Câu này sai ở CHỦ NGỮ với đơn Thư: đích đến "địa chỉ trả hàng đã đăng ký" vẫn đúng cho cả 2 loại đơn, nhưng người thực hiện giao chặng cuối là ĐẠI LÝ — NVC (247Express) giao về đại lý trước (xem SHOP-ORDER-8, field `returnHandoverAt`), đại lý sau đó tự giao lại hàng cho shop tại địa chỉ trả hàng đã đăng ký.
4. Câu xác nhận đề xuất (dùng chung cho cả 2 loại, bỏ hẳn chủ ngữ): *"Đơn sẽ chuyển sang trạng thái 'Đang hoàn hàng' — hàng sẽ được hoàn về địa chỉ trả hàng đã đăng ký."*

## System Flow

1. `isReturnEligible(order)` (`Orders.tsx` dòng 2047–2052): kiểm tra `status === 'redelivery'` hoặc `log[0].action ∈ {'DELIVERY_FAIL','WAITING_TO_RETURN'}` — **không kiểm tra `sendKind`**, tức áp dụng cho cả đơn Thư và Hàng hoá.
2. `isLetterReturnCase(order)` yêu cầu `status ∈ {'returning','cancelled','failed'}` — không bao gồm `redelivery` — nên đơn Thư ở `redelivery` vẫn qua được `isReturnEligible` và thấy nút "Hoàn hàng".
3. Câu xác nhận cứng duy nhất (`Orders.tsx` dòng 2706) không phân nhánh theo `sendKind`. Gap: chủ ngữ "nhà vận chuyển" không đúng với đơn Thư — người giao chặng cuối là đại lý. Đích đến "địa chỉ trả hàng đã đăng ký" đúng cho cả 2 loại.
4. Field "Địa chỉ trả hàng" trong Cài đặt đơn hàng (`Orders.tsx` dòng 825): `SelectCtrl` tĩnh — không `onClick`, không `onChange`, không lưu giá trị thật. Gap riêng, xem SHOP-ORDER-36.
5. Fix đề xuất: dùng câu trung tính bỏ hẳn chủ ngữ — áp dụng chung cho cả 2 loại: *"Đơn sẽ chuyển sang trạng thái 'Đang hoàn hàng' — hàng sẽ được hoàn về địa chỉ trả hàng đã đăng ký."* Không cần phân nhánh theo `sendKind`.

## Acceptance Criteria

**AC1:** Đơn Thư (`sendKind: 'letter'`) ở status `redelivery` — `isReturnEligible` đúng, `isLetterReturnCase` chưa đúng (status chưa trong nhóm `returning`/`failed`) → nút "Hoàn hàng" hiện đúng ở chi tiết đơn. *(Hành vi hiện tại đúng, giữ nguyên.)*

**AC2:** Bấm "Hoàn hàng" trên đơn Thư → câu xác nhận hiện tại dùng chủ ngữ "nhà vận chuyển" cho cả 2 loại đơn, không phân nhánh theo `sendKind`. Sai với đơn Thư vì người giao chặng cuối là đại lý, không phải NVC. Đích đến "địa chỉ trả hàng đã đăng ký" đúng cho cả 2 loại. *(Gap xác nhận tại code dòng 2706, chưa fix.)*

**AC3 *(đề xuất)*:** Sau khi fix, câu xác nhận dùng chung cho cả 2 loại đơn, bỏ hẳn chủ ngữ: *"Đơn sẽ chuyển sang trạng thái 'Đang hoàn hàng' — hàng sẽ được hoàn về địa chỉ trả hàng đã đăng ký."*

**AC4 *(đề xuất)*:** Câu xác nhận không chứa từ "đại lý" hoặc "NVC" — giữ đúng nguyên tắc đã áp dụng ở SHOP-ORDER-8 AC5.

## Notes

- **Gap phát hiện:** `isReturnEligible` và câu xác nhận tại `Orders.tsx` dòng 2704–2708 không phân biệt `sendKind` — đơn Thư thấy cùng câu xác nhận với Hàng hoá. Gap duy nhất là chủ ngữ "nhà vận chuyển" không đúng với đơn Thư; đích đến "địa chỉ trả hàng đã đăng ký" đúng cho cả 2 loại.
- **Câu xác nhận Hàng hoá**: cũng dùng chủ ngữ "nhà vận chuyển" — đúng với Hàng hoá (NVC GHN giao thẳng về địa chỉ lấy hàng shop). Câu trung tính không nêu chủ ngữ vẫn đúng cho Hàng hoá và khớp nghiệp vụ của Thư.
- **Khoảng hở với SHOP-ORDER-10 AC5**: AC5 của story đó nói đơn Thư "không bị ảnh hưởng" vì `isLetterReturnCase` chặn nút sau khi đã `returning`. Đúng — nhưng AC5 chỉ bảo vệ giai đoạn SAU khi đã xác nhận; câu xác nhận sai xảy ra TRƯỚC khi bấm xác nhận, ở giai đoạn `redelivery` (chưa phải `returning`). Xem note được thêm vào SHOP-ORDER-10.
- **Story này ở mức "phát hiện + đề xuất"** — chưa implement. Fix thực tế không cần phân nhánh `sendKind`, chỉ cần đổi câu xác nhận sang dạng trung tính dùng chung.
- Xem thêm: [SHOP-ORDER-8](xem-trang-thai-don-thu-hoan-hang.md) — toàn bộ luồng hoàn hàng Thư, `returnHandoverAt`; [SHOP-ORDER-10](xac-nhan-hoan-hang-tu-shop.md) — luồng xác nhận hoàn hàng chung; [SHOP-ORDER-36](dia-chi-tra-hang-chua-implement-ap-dung-ca-2-loai-don.md) — field Địa chỉ trả hàng tại Cài đặt đơn hàng (gap riêng: chưa implement).
