---
id: AGA-ORDER-5
jiraKey: 
platform: agency-admin
section: Quản lý đơn hàng
figma: 
status: draft
---

# [AGENCY] Đơn hàng - Danh sách & Chi tiết: Làm rõ nhãn giá ship là giá bán cho shop

## User Story

Là Agency Admin (Đại lý), tôi muốn nhãn hiển thị số tiền phí ship trên đơn hàng **ghi rõ đây là giá bán cho shop**, để không nhầm lẫn với giá vốn thật nhà vận chuyển (NVC) tính cho đại lý (2 con số khác nhau, hệ thống hiện chỉ có giá bán).

## User Flow

1. Agency Admin vào "Đơn hàng" → danh sách, di chuột vào icon ⓘ cạnh header "Phí ship (đ)" → thấy chú thích rõ đây là giá bán cho shop, không phải giá vốn
2. Mở chi tiết 1 đơn → nhãn "Phí ship:" đổi thành **"Phí ship (giá bán shop):"**, "Tổng phí vận chuyển" đổi thành **"Tổng phí vận chuyển (giá bán shop)"**

## System Flow

1. `AgencyOrders.tsx` → header cột "Phí ship (đ)" (`THead`) thêm icon `InfoCircleOutlined`, `title` = *"Đây là giá bán cho shop (đã gồm chênh lệch đại lý) — không phải giá vốn thực tế NVC tính cho đại lý. Giá vốn chỉ có sau khi đối soát với NVC."*
2. Drawer chi tiết đơn (`OrderDetailDrawer`): 2 label đổi chữ — "Phí ship:" → "Phí ship (giá bán shop):"; "Tổng phí vận chuyển" → "Tổng phí vận chuyển (giá bán shop)"
3. Không đổi giá trị hiển thị (`order.fee`) — chỉ đổi nhãn/chú thích

## Acceptance Criteria

**AC1:** Header "Phí ship (đ)" trong danh sách có icon ⓘ, hover hiện đúng nội dung giải thích đây là giá bán cho shop.

**AC2:** Drawer chi tiết đơn hiển thị đúng 2 label mới: "Phí ship (giá bán shop):" và "Tổng phí vận chuyển (giá bán shop)".

**AC3:** Giá trị số hiển thị (`order.fee`) không đổi ở bất kỳ đâu — chỉ đổi chữ nhãn.

## Notes

- Xuất phát từ việc làm rõ: hệ thống hiện **không có** giá vốn thật từ NVC (chưa tích hợp API thật, chưa có luồng đối soát 247Express) — nên mọi nơi hiển thị phí ship trên đơn đều đang là giá bán cho shop, cần ghi rõ để tránh đại lý hiểu nhầm đây là chi phí thật phải trả NVC.
- Nếu sau này có API thật hoặc luồng đối soát 247Express, cần thêm 1 số/nhãn riêng cho "giá vốn" bên cạnh, không thay thế label này.
