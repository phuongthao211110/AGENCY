---
id: GSA-DL-10
jiraKey: 
platform: super-admin
section: Quản lý Đại lý
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN
status: draft
---

# [GSA] Đại lý - Chi tiết - Đơn hàng: Ràng buộc thành phần Thư theo 247Express & Hub

## User Story

Là GHN Super Admin, tôi muốn LUÔN thấy đủ danh sách thành phần của đơn Thư trong card "Thư, tài liệu", nhưng CHỈ bấm chọn (bật/tắt) được khi đại lý ĐÃ sẵn sàng tạo đơn Thư (đã dùng 247Express VÀ đã có hub gửi hàng), để biết trước đơn Thư sẽ cấu hình được những gì mà không bấm nhầm khi đại lý chưa dùng được.

## User Flow

1. Vào Chi tiết đại lý → tab "Đơn hàng" của 1 đại lý CHƯA kích hoạt 247Express.
2. Card "✉️ Thư, tài liệu" hiện banner cảnh báo màu vàng: "Đại lý chưa dùng 247Express nên chưa có đơn Thư. Bật 247Express bên dưới để thấy đủ." — NGAY BÊN DƯỚI banner, 2 dòng toggle (Nội dung thư/tài liệu, Ghi chú xem hàng) VẪN HIỂN THỊ nhưng mờ đi và KHÔNG bấm chọn được (con trỏ "not-allowed").
3. Với đại lý ĐÃ kích hoạt 247Express nhưng CHƯA được cấp hub gửi hàng nào: banner đổi thành "Đại lý chưa có hub gửi hàng nên chưa có đơn Thư. Cấp hub bên dưới để thấy đủ." — 2 dòng toggle vẫn hiện mờ, vẫn không bấm chọn được.
4. Với đại lý ĐÃ có cả 247Express VÀ ít nhất 1 hub: không còn banner, 2 dòng toggle trở lại bình thường (rõ, bấm chọn được).
5. Card "📦 Hàng hoá" KHÔNG bị ảnh hưởng bởi điều kiện 247Express/hub — 8 dòng trong card này luôn rõ và bấm chọn được, bất kể đại lý đã sẵn sàng đơn Thư hay chưa (kể cả dòng "Ghi chú xem hàng" — chỉ bản sao của dòng này bên card "Thư, tài liệu" mới bị mờ/khoá khi chưa sẵn sàng).

## System Flow

1. `has247 = (agency.allowedCarriers ?? ['GHN']).includes('247Express')`, `hasHub = (agency.clientHubIds ?? []).length > 0`, `letterReady = has247 && hasHub` (`AgencyDetail.tsx`) — CẢ 2 điều kiện đều cần, chỉ bật carrier thôi CHƯA đủ vì thiếu hub thì `CreateLetterDrawerAgency` không có "Bên gửi" để chọn, chưa tạo được đơn Thư thật sự.
2. `renderRow(key, i, disabled = false)` nhận thêm tham số `disabled` — khi `true`: cả dòng giảm `opacity: 0.5`, toggle đổi `cursor: 'not-allowed'`, nền toggle LUÔN xám `#D1D5DB` (bỏ qua trạng thái bật/tắt thật để tránh gây cảm giác "vẫn đang bật" dù không chỉnh được), `onClick={undefined}` (không gọi `toggleOrderFormComponent`), `title` đổi thành "Đại lý chưa đủ điều kiện đơn Thư — xem banner phía trên".
3. Card "Thư, tài liệu": banner (`!letterReady &&`) và danh sách toggle (`letterKeys.map((key, i) => renderRow(key, i, !letterReady))`) giờ LUÔN RENDER CẢ HAI — khác bản trước đó (chặn hẳn phần toggle bằng `!letterReady ? banner : toggles`, chỉ hiện 1 trong 2). Bản này hiện banner NHƯ MỘT CẢNH BÁO BỔ SUNG phía trên, danh sách toggle vẫn luôn ở đó (chỉ đổi trạng thái disabled).
4. Card "Hàng hoá" (`goodsKeys`) KHÔNG truyền `disabled` khi gọi `renderRow` (mặc định `false`) — không phụ thuộc `letterReady` dưới bất kỳ hình thức nào.
5. Giá trị lưu trong `orderFormComponents` (`current[key]`) KHÔNG bị xoá hay reset khi disabled — nếu đại lý từng được bật `letterContent`/`viewGoodsNote` trước khi mất điều kiện (ví dụ Super Admin thu hồi hub), giá trị `true` vẫn giữ nguyên trong dữ liệu, chỉ UI hiện disabled; khi đại lý đủ điều kiện trở lại, toggle hiện đúng lại trạng thái đã lưu trước đó (không tự động về `false`).

## Acceptance Criteria

**AC1:** Đại lý CHƯA kích hoạt 247Express → card "Thư, tài liệu" hiện banner vàng "Đại lý chưa dùng 247Express nên chưa có đơn Thư. Bật 247Express bên dưới để thấy đủ." VÀ vẫn hiện đủ 2 dòng toggle bên dưới, nhưng cả 2 dòng đều mờ (opacity 0.5) và không bấm chọn được.

**AC2:** Đại lý ĐÃ kích hoạt 247Express nhưng CHƯA có hub gửi hàng nào (`clientHubIds` rỗng) → banner đổi thành "Đại lý chưa có hub gửi hàng nên chưa có đơn Thư. Cấp hub bên dưới để thấy đủ."; 2 dòng toggle vẫn mờ và không bấm chọn được.

**AC3:** Đại lý có ĐỦ CẢ 2 điều kiện (đã kích hoạt 247Express VÀ có ít nhất 1 hub) → card "Thư, tài liệu" không còn banner, 2 dòng toggle trở lại rõ và bấm chọn được bình thường.

**AC4:** Khi 2 dòng toggle của card "Thư, tài liệu" đang ở trạng thái disabled, bấm vào toggle KHÔNG có tác dụng gì (không gọi hàm bật/tắt); hover vào hiện tooltip "Đại lý chưa đủ điều kiện đơn Thư — xem banner phía trên".

**AC5:** Card "📦 Hàng hoá" luôn hiển thị đủ 8 dòng RÕ và bấm chọn được, KHÔNG phụ thuộc `letterReady` — kể cả khi đại lý hoàn toàn chưa sẵn sàng đơn Thư.

**AC6:** Bật 247Express + cấp hub cho 1 đại lý đang ở trạng thái disabled → 2 dòng toggle của card "Thư, tài liệu" cập nhật NGAY LẬP TỨC về trạng thái rõ, bấm chọn được (không cần reload trang), giữ nguyên đúng giá trị bật/tắt đã lưu trước đó (không bị reset về mặc định).

## Notes

- **Thay đổi hành vi theo phản hồi trực tiếp của user**: bản trước (`!letterReady ? banner : toggles`) ẨN HẲN 2 dòng toggle khi chưa đủ điều kiện — chỉ còn banner, không thấy được 2 field này tồn tại. Bản này đổi sang LUÔN HIỆN 2 dòng (kèm banner ở trên), chỉ khoá tương tác (disabled) — đúng yêu cầu "chỉ khi nào đại lý bật thì mới được chọn các option liên quan đến thư" (tức là option vẫn hiện diện, chỉ không chọn được, chứ không phải ẩn biến mất).
- Card "Hàng hoá" không có khái niệm disabled tương tự — 6 field phạm vi Hàng hoá thuần tuý và cả field "cả 2" (`goodsValue`, `viewGoodsNote`) ở card này LUÔN bấm chọn được vì không phụ thuộc điều kiện 247Express/hub.
- Do bỏ hẳn badge phạm vi (xem GSA-DL-9), KHÔNG còn khái niệm `scopeLabel` động ("Hàng hoá" ↔ "Hàng hoá & Thư") như bản thiết kế cũ hơn — thay vào đó trạng thái sẵn sàng của Thư giờ thể hiện qua disabled/opacity trên chính 2 dòng toggle của card "Thư, tài liệu".
- Câu banner giữ nguyên nội dung đơn giản, gần gũi đã chốt trước đó — không dùng thuật ngữ kỹ thuật (ClientHubID, 247Express API...).
