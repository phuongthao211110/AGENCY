---
id: SHOP-ORDER-56
jiraKey: 
platform: shop
section: Đơn hàng
figma: 
status: draft
---

# [WEB SHOP] Đơn hàng - Chi tiết: Yêu cầu đổi địa chỉ phát sinh phụ phí

## Bối cảnh

SHOP-ORDER-37 đã thêm dòng "Phụ phí đổi địa chỉ" (luôn 0đ) vào card "Phụ phí" lúc tạo đơn (`CreateOrderDrawer`), với ghi chú rõ: tại thời điểm tạo đơn CHƯA có yêu cầu đổi địa chỉ nào xảy ra nên luôn là 0đ, và hệ thống CHƯA có màn hình nào để thực sự xử lý sự kiện đổi địa chỉ SAU khi đơn đã tạo. Story này lấp đúng khoảng trống đó — mô phỏng theo đúng pattern "Hoàn hàng" (`confirmReturnOrder`, SHOP-ORDER-10) đã có sẵn: 1 nút hành động ở Chi tiết đơn hàng, chọn mức áp dụng, tính và cộng phụ phí thật vào đơn.

Đồng thời phát hiện và sửa 1 lỗi hiển thị liên quan ở Báo cáo dòng tiền (SHOP-ORDER-55): đơn ĐÃ được đại lý duyệt thanh toán (`paymentApprovalStatus === 'confirmed'`) mà SAU ĐÓ phát sinh thêm phí (hoàn hàng hoặc đổi địa chỉ) bị cột "Đã thanh toán" ngộ nhận gộp luôn cả phần mới phát sinh — dù đại lý chưa hề duyệt phần đó.

## User Story

Là chủ shop, khi người nhận yêu cầu đổi địa chỉ giao hàng sau khi đơn đã tạo, tôi muốn vào Chi tiết đơn hàng, chọn mức phí tương ứng (Cùng Phường/Xã · Cùng Tỉnh/Thành · Khác Tỉnh/Thành) và xác nhận, để địa chỉ được cập nhật và phụ phí được tính đúng cộng thêm vào đơn — thay vì dòng "Phụ phí đổi địa chỉ" mãi mãi là 0đ không bao giờ phản ánh đúng thực tế.

## User Flow

1. Mở Chi tiết 1 đơn Hàng hoá đang còn "đi" (Đơn nháp/Chờ lấy hàng/Đang giao/Chờ xác nhận giao lại — chưa huỷ/giao xong/đang hoàn/đã hoàn), dùng dịch vụ có bảng giá đã cấu hình ít nhất 1 trong 3 mức phụ phí đổi địa chỉ → card hành động có thêm nút **"Đổi địa chỉ"** (cam nhạt, cạnh "Hoàn hàng"/"Huỷ đơn"/"Cập nhật").
2. Bấm "Đổi địa chỉ" → hiện khối cam: ô nhập "Địa chỉ giao hàng mới" (prefill địa chỉ hiện tại) + 3 lựa chọn mức phí (radio), mỗi mức hiện sẵn số tiền sẽ áp dụng (đọc từ bảng giá mặc định của shop).
3. Chọn 1 mức, sửa địa chỉ (hoặc giữ nguyên), bấm **"Xác nhận đổi địa chỉ"** → `receiverAddress` cập nhật theo địa chỉ mới, phụ phí theo mức đã chọn CỘNG THÊM vào `fee` của đơn, đơn đóng lại.
4. Chưa chọn mức, hoặc địa chỉ trống → nút "Xác nhận đổi địa chỉ" bị disabled, không bấm được.
5. Bấm **"Không đổi"** → đóng khối cam, không đổi gì, quay lại card hành động bình thường.
6. Mở lại Chi tiết đơn → "Phí ship" đã tăng đúng bằng phụ phí vừa chọn; tab "Lịch sử thao tác" có 2 dòng mới: "Cập nhật địa chỉ giao hàng" (địa chỉ cũ → mới) và "Phát sinh phí đổi địa chỉ" (0 → Xđ, chỉ ghi khi phí > 0).
7. Nếu đơn đã được đại lý duyệt thanh toán từ trước (`paymentApprovalStatus === 'confirmed'`), việc đổi địa chỉ KHÔNG đổi trạng thái duyệt đó — xem mục Báo cáo dòng tiền bên dưới để biết phần phí mới này hiển thị thế nào.
8. Vào "Báo cáo dòng tiền" (`/shop/cash-flow`), với đơn vừa đổi địa chỉ (nếu đã `confirmed` từ trước): cột "Đã thanh toán" giữ nguyên số đại lý đã duyệt TRƯỚC khi đổi địa chỉ; cột "Chưa thanh toán" hiện đúng bằng phụ phí đổi địa chỉ vừa cộng thêm (số âm) — KHÔNG bị gộp ngầm vào "Đã thanh toán". Bấm vào số tiền "Phí dịch vụ" của đơn đó → modal breakdown có thêm dòng "Phụ phí đổi địa chỉ".

## System Flow

1. `isAddressChangeEligible(order)` (`Orders.tsx`, cạnh `isReturnEligible`): `true` khi `order.status` ∈ `{pending, pickup, in_transit, redelivery}` VÀ bảng giá mặc định của shop (`currentShopAddressChangeSurcharges()`) có ít nhất 1 trong 3 mức (`sameWardFee`/`sameProvinceFee`/`interProvincePercent`) khác rỗng.
2. `currentShopAddressChangeFee(tier, baseShippingFee)`: đọc `surcharges.addressChange` từ bảng giá `isDefault` (giống cách `currentShopReturnFee()` đọc `returnFee`, cùng giới hạn đã biết — không truy vết được bảng giá CŨ nếu Agency đã đổi bảng giá mặc định sau khi đơn được tạo). `tier === 'same_ward'` → `sameWardFee`; `'same_province'` → `sameProvinceFee`; `'inter_province'` → `Math.round(baseShippingFee * interProvincePercent / 100)` — tính trên `order.feeShipping` (phí giao hàng gốc, đúng nghĩa "% cước phí tuyến/lần" đã định nghĩa ở `PricingCreate.tsx`), KHÔNG tính trên `order.fee` (đã gồm cả phụ phí khác không liên quan tới tuyến).
3. `OrderDetailDrawer` thêm 3 state: `confirmingAddressChange`, `newAddressInput` (prefill `order.receiverAddress` lúc mở), `addressChangeTier: 'same_ward' | 'same_province' | 'inter_province' | null` — reset khi đổi đơn, giống các state `confirming*` khác.
4. `confirmAddressChangeOrder()`: ghi 2 dòng lịch sử thao tác ("Cập nhật địa chỉ giao hàng", và "Phát sinh phí đổi địa chỉ" nếu phí > 0) rồi `updateOrder(order.id, { receiverAddress, feeAddressChange: (order.feeAddressChange ?? 0) + fee, fee: order.fee + fee })` — cộng dồn (không ghi đè) `feeAddressChange` để hỗ trợ trường hợp đổi địa chỉ nhiều lần trên cùng 1 đơn, giống cách `feeReturn` được cộng thêm ở `confirmReturnOrder()`.
5. Nút "Đổi địa chỉ" trong card hành động (view mode) → `onClick={() => { setConfirmingAddressChange(true); setNewAddressInput(order.receiverAddress) }}`. Nhánh nút `confirmingAddressChange` (song song `confirmingReturn`): "Không đổi" (outline) / "Xác nhận đổi địa chỉ" (cam đặc, disabled khi chưa chọn mức hoặc địa chỉ trống).
6. `Order` (`orderStore.ts`) thêm 2 field mới:
   - `feeAddressChange?: number` — cùng nhóm với `feeReturn`, lưu riêng phần phụ phí đổi địa chỉ đã cộng vào `fee`.
   - `paymentApprovedAmount?: number` — snapshot `fee` NGAY TẠI THỜI ĐIỂM `paymentApprovalStatus` chuyển `'confirmed'`. Set ở MỌI nơi set `paymentApprovalStatus: 'confirmed'`: `approveOrderPayment()` (orderStore.ts), `buildOrder()` (lúc tạo đơn online tự xác nhận ngay), `handlePaymentPaid()` (CreateOrderDrawer), `handlePaymentPaidInDetail()` (OrderDetailDrawer).
7. `CashFlowReport.tsx`:
   - `feeBreakdownRows()`: thêm dòng thứ 7 `{ label: 'Phụ phí đổi địa chỉ', amount: -(order.feeAddressChange ?? 0) }`; fallback "Phí giao hàng" cho đơn cũ (`feeShipping === undefined`) trừ thêm `feeAddressChange` ngoài `feeReturn` để không đếm trùng.
   - `rowAmounts(order)`: SỬA LẠI — nếu `paymentApprovalStatus !== 'confirmed'`, giữ nguyên nhị phân cũ (`daThanhToan: 0`, `chuaThanhToan: -fee`). Nếu `confirmed`: `daThanhToan = order.paymentApprovedAmount ?? order.fee` (phần đại lý ĐÃ DUYỆT), `extra = order.fee - daThanhToan` (phần phát sinh SAU khi duyệt — hoàn hàng/đổi địa chỉ), `chuaThanhToan = extra > 0 ? -extra : 0`. Đơn chưa từng phát sinh gì thêm sau duyệt có `paymentApprovedAmount === fee` → `extra = 0`, hành vi giống hệt bản cũ.
8. Không áp dụng cho `CreateLetterDrawer` (đơn Thư/tài liệu qua 247Express) — giống đúng giới hạn phạm vi đã nêu ở SHOP-ORDER-37.

## Acceptance Criteria

**AC1:** Đơn thoả `isAddressChangeEligible` → nút "Đổi địa chỉ" xuất hiện trong card hành động ở Chi tiết đơn hàng.

**AC2:** Đơn KHÔNG thoả (đã huỷ/giao xong/đang hoàn/đã hoàn, HOẶC bảng giá không cấu hình mức phí nào) → không hiện nút.

**AC3:** Bấm "Đổi địa chỉ" → hiện ô nhập địa chỉ (prefill đúng địa chỉ hiện tại) + 3 radio mức phí, mỗi mức hiện đúng số tiền tính từ bảng giá mặc định của shop.

**AC4:** Chưa chọn mức HOẶC địa chỉ trống → nút "Xác nhận đổi địa chỉ" disabled.

**AC5:** Chọn mức + nhập địa chỉ hợp lệ, bấm "Xác nhận đổi địa chỉ" → `order.receiverAddress` đổi đúng giá trị mới, `order.fee` tăng đúng bằng phí của mức đã chọn, `order.feeAddressChange` lưu đúng số đó, drawer đóng lại.

**AC6:** Mức "Khác Tỉnh/Thành" tính đúng `Math.round(feeShipping * interProvincePercent / 100)` — không tính trên `fee` tổng.

**AC7:** Sau khi xác nhận, tab "Lịch sử thao tác" có đúng 2 dòng mới (hoặc 1 dòng nếu phí = 0, bỏ dòng "Phát sinh phí đổi địa chỉ").

**AC8:** Bấm "Không đổi" → không đổi gì trên đơn, quay lại card hành động bình thường.

**AC9:** Đơn `paymentApprovalStatus === 'confirmed'` TRƯỚC khi đổi địa chỉ: sau khi đổi, ở Báo cáo dòng tiền — "Đã thanh toán" GIỮ NGUYÊN số đã duyệt trước đó (không tăng theo phụ phí mới), "Chưa thanh toán" hiện đúng bằng `-(phụ phí đổi địa chỉ vừa cộng)`.

**AC10:** Đơn CHƯA `confirmed`: sau khi đổi địa chỉ, "Chưa thanh toán" vẫn hiện đúng `-order.fee` (đã gồm phụ phí mới) — hành vi không đổi so với trước.

**AC11:** Modal breakdown (Báo cáo dòng tiền) của đơn đã đổi địa chỉ có thêm dòng "Phụ phí đổi địa chỉ" đúng số tiền, cộng dồn 7 dòng luôn khớp đúng 100% tổng "PHÍ DỊCH VỤ".

**AC12:** Đổi địa chỉ nhiều lần trên cùng 1 đơn → `feeAddressChange` cộng dồn đúng tổng các lần, `fee` tăng đúng từng lần (không ghi đè lần trước).

## Notes

- Mô phỏng THEO ĐÚNG pattern `confirmReturnOrder()`/"Hoàn hàng" đã có sẵn (SHOP-ORDER-10) — không phát minh cơ chế mới, chỉ thêm input chọn mức (return không cần chọn vì chỉ có 1 mức phí).
- Hệ thống KHÔNG lưu dữ liệu phường/xã của địa chỉ (chỉ lưu chuỗi tự do `"{đường}, {tỉnh/thành}"`) nên KHÔNG tự động so khớp địa chỉ cũ/mới để suy ra đúng mức — Shop phải TỰ CHỌN mức áp dụng dựa trên biết thực tế của đơn (giống cách người vận hành thật biết rõ khoảng cách đổi địa chỉ, không cần hệ thống suy luận).
- Phát hiện kèm theo (không phải mục tiêu ban đầu của story, nhưng BẮT BUỘC sửa cùng lúc vì cùng 1 cơ chế "fee tăng sau khi confirmed"): lỗi hiển thị "Đã thanh toán" ở Báo cáo dòng tiền (SHOP-ORDER-55) khi đơn đã duyệt mà phát sinh thêm phí — xem AC4 (bản cũ) đã sửa thành AC4 (bản mới, có nhắc `paymentApprovedAmount`) ở [bao-cao-dong-tien.md](bao-cao-dong-tien.md). Lỗi này tồn tại SẴN cho cả `feeReturn` (Hoàn hàng) từ trước story này — đã sửa chung 1 lần cho cả 2 loại phụ phí, không chỉ riêng đổi địa chỉ.
- Đóng hẳn khoảng hở đã ghi chú ở [SHOP-ORDER-37](them-phu-phi-doi-dia-chi.md) Notes ("cần bổ sung 1 story khác... để thực sự tính và cộng phụ phí này khi địa chỉ đổi thật").
- Chưa xử lý: cho phép Shop "huỷ" 1 lần đổi địa chỉ đã xác nhận (hoàn lại phí) — ngoài phạm vi, giống `confirmReturnOrder()` cũng không có cơ chế hoàn tác.
- Chưa xử lý: luồng để Shop/đại lý tự nguyện "thanh toán bù" riêng phần `extra` phát sinh sau khi đã khai/chuyển tiền mặt cho đại lý (modal "Thanh toán hạn mức đã dùng", SHOP-ORDER-55 chỉ xét đơn `pending_review`/`rejected`, không xét đơn `confirmed` có `extra` mới) — hiện tại "Chưa thanh toán" chỉ là CON SỐ HIỂN THỊ đúng thực tế, chưa có action nào để Shop chủ động khai nộp riêng phần đó. Giới hạn đã biết, cần 1 story khác nếu nghiệp vụ yêu cầu.
