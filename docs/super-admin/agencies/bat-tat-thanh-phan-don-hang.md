---
id: GSA-DL-9
jiraKey: 
platform: super-admin
section: Quản lý Đại lý
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN
status: draft
---

# [GSA] Đại lý - Chi tiết - Đơn hàng: Bật/tắt thành phần đơn hàng

## User Story

Là GHN Super Admin, tôi muốn bật/tắt riêng từng thành phần phụ trong form tạo đơn hàng THEO TỪNG ĐẠI LÝ — tách rõ theo 2 nhóm "Hàng hoá" và "Thư, tài liệu" — để kiểm soát đại lý nào được dùng field nào mà không cần sửa code hay áp dụng chung cho toàn hệ thống.

## User Flow

1. Vào Chi tiết đại lý → tab "Đơn hàng".
2. Trang hiển thị 2 card riêng biệt: "📦 Hàng hoá" và "✉️ Thư, tài liệu" — mỗi card có dòng phụ đề in nghiêng giải thích phạm vi ("Chọn các trường mà đại lý được phép thiết lập khi tạo đơn hàng hoá" / "...khi tạo đơn thư, tài liệu").
3. Card "Hàng hoá" liệt kê 8 dòng: COD (Thu hộ), Giảm giá, Thu ship khách hàng, Giá trị hàng, Khai giá trị hàng, Giao / Trả 1 phần, Giao thất bại thu tiền, Ghi chú xem hàng — mỗi dòng chỉ gồm tên field + 1 toggle switch (không còn nhãn phạm vi nhỏ bên cạnh như bản trước).
4. Card "Thư, tài liệu" luôn liệt kê 2 dòng: Nội dung thư, tài liệu và Ghi chú xem hàng — bấm chọn được khi đại lý đã sẵn sàng đơn Thư, hoặc hiện mờ/khoá kèm banner cảnh báo nếu chưa (xem GSA-DL-10).
5. Bấm vào toggle ở BẤT KỲ card nào để bật/tắt ngay lập tức — không cần nút Lưu riêng.
6. Tắt 1 thành phần sẽ ẩn field đó khỏi form tạo đơn mới của đại lý này (ở cả Web Shop và Agency Admin) — không ảnh hưởng tới đơn ĐÃ tạo trước đó (chỉ gate lúc tạo mới).

## System Flow

1. `AgencyDetail.tsx` tab "orders" render 2 `InfoCard` riêng: `"📦 Hàng hoá"` và `"✉️ Thư, tài liệu"` (redesign từ 1 `InfoCard title="Thành phần đơn hàng"` duy nhất trước đây).
2. `goodsKeys = (Object.keys(ORDER_FORM_COMPONENT_LABELS) as (keyof OrderFormComponents)[]).filter((key) => ORDER_FORM_COMPONENT_SCOPE[key] !== 'letter')` — lấy toàn bộ 8 field scope `'goods'` hoặc `'both'`, giữ đúng thứ tự khai báo (cod, discount, shipCollect, goodsValue, declareValue, partialDeliver, collectOnFail, viewGoodsNote).
3. `letterKeys: (keyof OrderFormComponents)[] = ['letterContent', 'viewGoodsNote']` — khai báo TƯỜNG MINH (không suy ra từ `ORDER_FORM_COMPONENT_SCOPE`) vì `goodsValue` cũng có scope `'both'` nhưng KHÔNG hiện toggle ở card này (xem GSA-DL-10 cho lý do).
4. `renderRow(key, i)` là hàm render dùng chung cho cả 2 card — chỉ còn tên field (`ORDER_FORM_COMPONENT_LABELS[key]`) + toggle switch, KHÔNG còn badge phạm vi nhỏ (`scopeLabel`) như bản trước — vì bản thân card (Hàng hoá / Thư, tài liệu) đã nói rõ phạm vi, badge trên từng dòng trở thành thừa.
5. `ORDER_FORM_COMPONENT_LABELS`, `DEFAULT_ORDER_FORM_COMPONENTS`, `toggleOrderFormComponent(key)` (gọi `setOrderFormComponent(agency.id, key, !current[key])`, ghi thẳng vào `agenciesList`) giữ nguyên không đổi so với bản trước.
6. Toggle switch vẫn render bằng `<div>` tự vẽ (không dùng antd Switch) — nền xanh lá `#16A34A` khi bật, xám `#D1D5DB` khi tắt.

## Acceptance Criteria

**AC1:** Tab "Đơn hàng" của Chi tiết đại lý hiển thị 2 card riêng: "📦 Hàng hoá" và "✉️ Thư, tài liệu" — không còn 1 card gộp chung như bản trước.

**AC2:** Card "Hàng hoá" luôn hiển thị đủ 8 dòng theo đúng thứ tự: COD (Thu hộ), Giảm giá, Thu ship khách hàng, Giá trị hàng, Khai giá trị hàng, Giao / Trả 1 phần, Giao thất bại thu tiền, Ghi chú xem hàng — mỗi dòng chỉ gồm tên field + toggle, không có nhãn phạm vi nhỏ bên cạnh.

**AC3:** Mỗi card có 1 dòng phụ đề in nghiêng ngay dưới tiêu đề, đúng nguyên văn: "Chọn các trường mà đại lý được phép thiết lập khi tạo đơn hàng hoá" (card Hàng hoá) / "Chọn các trường mà đại lý được phép thiết lập khi tạo đơn thư, tài liệu" (card Thư, tài liệu).

**AC4:** Bấm vào toggle ở card bất kỳ → đổi trạng thái bật/tắt NGAY LẬP TỨC, không cần nút Lưu riêng, không có bước xác nhận.

**AC5:** Đại lý mới (seed cũ chưa có `orderFormComponents`) mặc định TẤT CẢ thành phần ở cả 2 card đều BẬT.

**AC6:** Tắt 1 thành phần → field tương ứng biến mất khỏi form tạo đơn MỚI của đại lý đó (không ảnh hưởng đơn đã tạo trước khi tắt).

**AC7:** Cấu hình này áp dụng riêng theo TỪNG đại lý — bật/tắt ở đại lý A không ảnh hưởng đại lý B.

## Notes

- **Redesign theo mockup người dùng cung cấp**: bản trước hiển thị 1 card "Thành phần đơn hàng" duy nhất, mỗi dòng kèm 1 badge nhỏ ghi phạm vi (Hàng hoá / Thư / Hàng hoá & Thư). Bản này tách thành 2 card riêng theo đúng loại đơn, bỏ hẳn badge phạm vi vì bản thân card đã nói rõ.
- "Ghi chú xem hàng" (`viewGoodsNote`) xuất hiện Ở CẢ 2 CARD vì áp dụng cho cả 2 loại đơn — cùng chung 1 giá trị `orderFormComponents.viewGoodsNote`, bật/tắt ở card nào cũng ảnh hưởng card kia (đổi ở "Hàng hoá" thì "Thư, tài liệu" cũng đổi theo và ngược lại).
- "Giá trị hàng" (`goodsValue`) tuy về mặt kỹ thuật cũng áp dụng cho cả 2 loại đơn (`CreateLetterDrawer` vẫn đọc `formComponents.goodsValue` để hiện field "Giá trị hàng" ở form Thư — xem GSA-DL-11) nhưng CHỈ có toggle ở card "Hàng hoá" — card "Thư, tài liệu" không hiện toggle riêng cho field này. Đây là lựa chọn đơn giản hoá theo đúng mockup, không phải do field này thực sự không áp dụng cho đơn Thư.
- Đặt ở Super Admin (không phải Agency Admin hay Web Shop) theo quyết định rõ ràng của Super Admin trong phiên trước: "sẽ cho phép đại lý nào được dùng field nào" — giống mô hình cấp quyền carrier/hub đã có.
- Xem GSA-DL-10 cho ràng buộc riêng của card "Thư, tài liệu" (điều kiện 247Express + hub), và GSA-DL-11 cho chi tiết cách 2 platform (Web Shop, Agency Admin) đọc và áp dụng cấu hình này.
