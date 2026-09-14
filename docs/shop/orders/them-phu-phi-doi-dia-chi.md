---
id: SHOP-ORDER-37
jiraKey: 
platform: shop
section: Đơn hàng
figma: https://www.figma.com/design/MchY3tv6zpA65VTnt5OEhW
status: draft
---

# [WEB SHOP] Đơn hàng - Tạo mới: Thêm phụ phí đổi địa chỉ

## User Story

Là chủ shop (Web Shop), khi tạo đơn hàng mới tôi muốn thấy dòng "Phụ phí đổi địa chỉ" trong card "Phụ phí" (mặc định 0đ, giống các phụ phí khác), để biết trước loại phí này SẼ áp dụng nếu người nhận yêu cầu đổi địa chỉ sau khi đơn đã tạo, mà không bị nhầm là phí đã phát sinh ngay.

## User Flow

1. Mở "Tạo đơn hàng" (`CreateOrderDrawer`) cho đơn Hàng hoá, chọn 1 dịch vụ GHN (mặc định chọn sẵn dịch vụ đầu tiên).
2. Nếu bảng giá gắn với dịch vụ đang chọn có cấu hình "Phụ phí đổi địa chỉ" (do Agency Admin thiết lập ở Tạo bảng giá), 1 dòng "Phụ phí đổi địa chỉ" xuất hiện thêm trong card "Phụ phí" hiện có — ngay dưới các dòng "Phí bảo hiểm", "Phí giao trả 1 phần", "Phí giao thất bại thu tiền", "Phí thu hộ".
3. Dòng này LUÔN hiển thị **0đ** khi tạo đơn — giống hệt cách các dòng phụ phí khác hiện "0đ" khi điều kiện áp dụng (khai giá/giao 1 phần/giao thất bại/thu hộ) chưa xảy ra. Tại thời điểm tạo đơn, CHƯA có yêu cầu đổi địa chỉ nào nên phí luôn là 0đ.
4. Di chuột vào dòng này hiện tooltip liệt kê trước các mức phí sẽ áp dụng NẾU sau này người nhận đổi địa chỉ (Cùng Phường/Xã / Cùng Tỉnh-Thành / Khác Tỉnh-Thành) — chỉ để tham khảo trước, không phải giá trị đang tính.
5. Dòng này không có input/checkbox nào để tương tác — hoàn toàn read-only.
6. Nếu bảng giá KHÔNG cấu hình phụ phí này (cả 3 mức đều trống), dòng không hiện — card "Phụ phí" giữ nguyên 4 dòng như cũ.
7. Đổi sang dịch vụ khác có bảng giá khác → dòng ẩn/hiện lại theo bảng giá mới; giá trị hiển thị vẫn luôn là 0đ, chỉ nội dung tooltip thay đổi theo mức phí của bảng giá mới.

## System Flow

1. `ShopPricingSurcharges` (`Orders.tsx`) mở rộng thêm field `addressChange?: { sameWardFee: string; sameProvinceFee: string; interProvincePercent: string }` — khớp đúng shape `AddressChangeFee` đã định nghĩa ở Agency Admin (`PricingCreate.tsx`).
2. `surcharges` (đã có sẵn trong `CreateOrderDrawer`, đọc từ `priceTable?.surcharges` theo `selectedService.priceTableId`) nay đọc thêm `surcharges.addressChange`.
3. Trong card "Phụ phí", ngay sau `.map()` render 4 dòng chuẩn, thêm 1 IIFE tính `tooltipParts: string[]` — với mỗi mức đã cấu hình (`.trim()` khác rỗng) push chuỗi mô tả kèm nhãn (`Cùng Phường/Xã: Xđ`, `Cùng Tỉnh/Thành: Yđ`, `Khác Tỉnh/Thành: Z%`); nếu `tooltipParts.length === 0` thì `return null` (ẩn hẳn dòng — không cấu hình gì thì không có gì để xem trước).
4. **Giá trị hiển thị LUÔN LÀ CHUỖI CỐ ĐỊNH `"0đ"`** — KHÔNG tính toán từ `surcharges.addressChange` — vì ở bước tạo đơn chưa có sự kiện đổi địa chỉ nào xảy ra để chọn ra 1 mức phí cụ thể trong 3 mức. Đây là điểm khác với 4 dòng phụ phí chuẩn (dùng `active ? value : 0` — có `active` true/false do checkbox trong form quyết định); dòng này không có checkbox nào tương ứng nên luôn ở trạng thái "chưa áp dụng" (0đ) trong ngữ cảnh tạo đơn.
5. `title={`${tooltipParts.join(' · ')} — chỉ áp dụng khi người nhận đổi địa chỉ sau khi đơn đã tạo`}` — tooltip hover là nơi DUY NHẤT hiển thị 3 mức phí cụ thể, giúp shop biết trước mà không gây hiểu nhầm dòng "0đ" là phí đã tính.
6. Dòng này KHÔNG có trong danh sách cộng `feeShipping`/`totalShipping`/`totalCollect` — giá trị luôn 0đ nên về mặt số học cũng không ảnh hưởng, nhưng vẫn giữ tách biệt tường minh khỏi phép cộng để không tạo nhầm lẫn khi đọc code.
7. Dữ liệu demo: đã thêm `addressChange: { sameWardFee: "0", sameProvinceFee: "10000", interProvincePercent: "50" }` vào bảng giá `PRC001` (`src/mock-data/pricing.json`) — bảng giá mặc định (`isDefault: true`) của dịch vụ GHN "Giao nhanh" (`svc-001`), để dòng này xuất hiện sẵn trong demo (kèm tooltip có nội dung) mà không cần tạo bảng giá mới thủ công.

## Acceptance Criteria

**AC1:** Khi dịch vụ đang chọn có bảng giá đã cấu hình ÍT NHẤT 1 trong 3 mức phụ phí đổi địa chỉ, dòng "Phụ phí đổi địa chỉ" xuất hiện trong card "Phụ phí" hiện có (không tạo card riêng), sau 4 dòng chuẩn.

**AC2:** Giá trị hiển thị của dòng này LUÔN LÀ "0đ" khi tạo đơn, bất kể bảng giá cấu hình mức phí bao nhiêu — vì tại thời điểm tạo đơn chưa có yêu cầu đổi địa chỉ nào xảy ra.

**AC3:** Nếu bảng giá của dịch vụ đang chọn không cấu hình bất kỳ mức phí nào trong 3 mức trên (cả 3 đều rỗng), dòng "Phụ phí đổi địa chỉ" không hiện — card "Phụ phí" chỉ còn đúng 4 dòng gốc.

**AC4:** Hover vào dòng "Phụ phí đổi địa chỉ" hiện tooltip liệt kê CÁC MỨC PHÍ ĐÃ CẤU HÌNH kèm nhãn (ví dụ "Cùng Phường/Xã: 0đ · Cùng Tỉnh/Thành: 10.000đ · Khác Tỉnh/Thành: 50%"), kèm câu "chỉ áp dụng khi người nhận đổi địa chỉ sau khi đơn đã tạo" — mức nào không cấu hình thì không xuất hiện trong tooltip.

**AC5:** Dòng này không có input/checkbox nào để tương tác — hoàn toàn read-only.

**AC6:** Đổi dịch vụ đang chọn sang dịch vụ khác gắn bảng giá khác → dòng ẩn/hiện lại NGAY LẬP TỨC theo cấu hình bảng giá mới; giá trị hiển thị vẫn luôn là "0đ", chỉ nội dung tooltip thay đổi theo mức phí của bảng giá mới.

**AC7:** Với bảng giá mẫu "Bảng giá tiêu chuẩn 2024" (`PRC001`, dịch vụ GHN "Giao nhanh" mặc định), dòng "Phụ phí đổi địa chỉ" hiển thị "0đ", tooltip hiện đúng "Cùng Phường/Xã: 0đ · Cùng Tỉnh/Thành: 10.000đ · Khác Tỉnh/Thành: 50% — chỉ áp dụng khi người nhận đổi địa chỉ sau khi đơn đã tạo".

## Notes

- **Redesign lần 2 sau phản hồi của user**: bản đầu tiên tách thành 1 card riêng (3 dòng con hiển thị số liệu thật); bản 2 gộp lại 1 dòng nhưng vẫn hiển thị số liệu thật dạng "0đ / 10.000đ / 50%"; user phản hồi tiếp: phụ phí phải mặc định là 0 (giống các phụ phí khác), chỉ khi nào THỰC SỰ có đổi địa chỉ mới hiện số khác 0 — vì ở bước tạo đơn chưa có sự kiện đổi địa chỉ nào cả. Đã sửa lại đúng theo hướng này: dòng luôn hiện "0đ", 3 mức phí cụ thể chỉ còn xem được qua tooltip.
- **Hệ quả cần lưu ý cho tương lai**: vì hệ thống hiện CHƯA có tính năng thực sự xử lý yêu cầu đổi địa chỉ (không có màn hình "Yêu cầu đổi địa chỉ" ở Chi tiết đơn hàng), dòng "0đ" này sẽ KHÔNG BAO GIỜ đổi thành số khác trong prototype hiện tại — đây là giới hạn đã biết, cần bổ sung 1 story khác (ở màn Chi tiết đơn hàng) để thực sự tính và cộng phụ phí này khi địa chỉ đổi thật.
- Tính năng NET-NEW trong phiên làm việc này — trước đó Agency Admin (`PricingCreate.tsx`) đã có phần cấu hình 3 mức phụ phí đổi địa chỉ, nhưng Web Shop chưa từng đọc/hiển thị dữ liệu này ở bất kỳ đâu trong luồng tạo đơn.
- Chỉ áp dụng cho `CreateOrderDrawer` (đơn Hàng hoá) — KHÔNG áp dụng cho `CreateLetterDrawer` (đơn Thư/tài liệu, qua 247Express).
- Dữ liệu mẫu `addressChange` chỉ được thêm vào `PRC001` — 6 bảng giá còn lại trong `pricing.json` chưa có field này (mặc định `undefined`), nên dòng này sẽ KHÔNG hiện với các dịch vụ dùng bảng giá khác cho tới khi Agency Admin cấu hình thêm ở Tạo bảng giá.
