---
id: GSA-ROUTE-9
jiraKey: 
platform: super-admin
section: Vùng & Tuyến
figma: https://www.figma.com/design/G33IlXebyXXGxZbbYbKECr/-GSA--GHN-SUPER-ADMIN?node-id=2-449
status: draft
---

# [GSA] Vùng & Tuyến: Thiết lập lại

## User Story

Là GHN Super Admin, tôi muốn có nút "Thiết lập lại" ở nhiều vị trí thuận tiện trên trang "Vùng & Tuyến" để nhanh chóng quay về dữ liệu mẫu gốc khi đang thử nghiệm cấu hình mà không muốn giữ lại thay đổi.

## User Flow

1. Bấm nút "↻ Thiết lập lại" ở góc phải tiêu đề trang (luôn hiển thị, không phụ thuộc trạng thái nào) → trang tải lại toàn bộ ngay lập tức.
2. Hoặc bấm nút "↻ Thiết lập lại" thứ 2 trong thanh hành động cuối khối "Cấu hình nội & ngoại thành" (nằm giữa "✕ Huỷ bỏ" và "💾 Lưu thay đổi") → cùng hành vi y hệt, tải lại toàn bộ trang.
3. Sau khi trang tải lại, MỌI thay đổi trong phiên hiện tại ở cả 3 khối (Cấu hình vùng miền, Cấu hình tuyến, Cấu hình nội & ngoại thành — kể cả phần Nội/Ngoại thành đã bấm "Lưu thay đổi") đều mất, trang trở về đúng dữ liệu mẫu gốc lúc mới mở ứng dụng.
4. Không có bước xác nhận ("Bạn có chắc chắn...?") trước khi tải lại — bấm là mất ngay.

## System Flow

1. Cả 2 nút gọi chung 1 hành động duy nhất: `onClick={() => window.location.reload()}` — không có logic riêng, không phân biệt vị trí bấm.
2. Vì `window.location.reload()` tải lại toàn bộ trang (fresh page load), mọi state React (`localRegions`, `localMatrix`, `routeNames`, `localUrbanConfigs`, `urbanDraft`, v.v.) bị huỷ hoàn toàn; module `routeConfig.ts` được re-import từ đầu, khôi phục lại các hằng số seed ban đầu (`regions`, `routeMatrix`, `urbanConfigs`) — vì đây là module-level in-memory store, không phải localStorage/API, nên không có gì "còn sót lại" sau reload.
3. Nút ở góc phải tiêu đề trang: `title="Tải lại toàn bộ dữ liệu về trạng thái mẫu ban đầu (mất mọi thay đổi trong phiên này)"` — luôn enabled, không disable trong bất kỳ trường hợp nào (khác nút "Huỷ bỏ"/"Lưu thay đổi" chỉ enable khi `hasUrbanChanges`).
4. Nút trong thanh hành động Nội & Ngoại thành dùng cùng `title`, và cũng LUÔN enabled bất kể `hasUrbanChanges` — không có gate theo trạng thái nháp.
5. Vì đây là reload TOÀN TRANG (không chỉ riêng khối Nội & Ngoại thành), bấm nút này ở đây vẫn xoá luôn cả thay đổi (nếu có) ở 2 khối Vùng miền/Tuyến phía trên, dù nút này nằm trong khối Nội & Ngoại thành.

## Acceptance Criteria

**AC1:** Nút "↻ Thiết lập lại" ở góc phải tiêu đề trang luôn hiển thị và luôn bấm được (không phụ thuộc trạng thái bất kỳ khối nào).

**AC2:** Nút "↻ Thiết lập lại" thứ 2 nằm trong thanh hành động cuối khối "Cấu hình nội & ngoại thành" (giữa "Huỷ bỏ" và "Lưu thay đổi") — cũng luôn bấm được, không bị disable dù `hasUrbanChanges` là `false`.

**AC3:** Bấm 1 trong 2 nút → gọi `window.location.reload()` ngay lập tức, không có bước xác nhận, không có toast/thông báo trước khi reload.

**AC4:** Sau khi trang tải lại, TOÀN BỘ thay đổi trong phiên trước đó ở CẢ 3 khối (Cấu hình vùng miền, Cấu hình tuyến, Cấu hình nội & ngoại thành) đều mất — kể cả các thay đổi Nội/Ngoại thành ĐÃ bấm "Lưu thay đổi" trước đó, vì store chỉ tồn tại trong bộ nhớ của phiên trình duyệt hiện tại (không phải localStorage/API).

**AC5:** Hover vào nút hiện tooltip (thuộc tính `title`) đúng nguyên văn: "Tải lại toàn bộ dữ liệu về trạng thái mẫu ban đầu (mất mọi thay đổi trong phiên này)" — giống nhau ở cả 2 vị trí.

**AC6:** Bấm nút này KHÔNG chỉ reset riêng khối chứa nó — dù nút thứ 2 nằm trong khối "Nội & Ngoại thành", bấm nó vẫn xoá luôn thay đổi (nếu có) ở khối "Vùng miền"/"Tuyến" phía trên, vì hành động là reload TOÀN TRANG.

## Notes

- Story tách riêng nút "Thiết lập lại" (xuất hiện Ở 2 VỊ TRÍ trên trang: đầu trang và cuối khối Nội & Ngoại thành) ra khỏi GSA-ROUTE-1 (chỉ nhắc gọn ở AC4) và GSA-ROUTE-4 (chỉ nhắc gọn ở System Flow) — để làm rõ đây là CÙNG 1 hành động duy nhất, không phải 2 tính năng riêng biệt.
- Vì prototype không có backend/localStorage thật (xem GSA-ROUTE-5), "Thiết lập lại" là cách DUY NHẤT để quay về dữ liệu mẫu gốc trong phiên hiện tại — không có cơ chế "hoàn tác" (undo) từng bước cho các thao tác Vùng miền/Tuyến (những thao tác đó ghi thẳng vào store ngay lập tức, không qua nháp, khác với khối Nội & Ngoại thành).
- **Rủi ro đã biết**: vì không có bước xác nhận, đây là 1 hành động CÓ RỦI RO MẤT DỮ LIỆU — nếu Super Admin đã cấu hình nhiều thay đổi (kể cả đã "Lưu thay đổi" ở Nội & Ngoại thành) mà lỡ bấm nhầm nút này, mọi thứ mất ngay không hồi phục được. Đây là hành vi CHỦ Ý của prototype (môi trường demo/thử nghiệm); cần cân nhắc thêm bước xác nhận (ví dụ modal "Bạn có chắc chắn muốn xoá mọi thay đổi?") nếu đưa tính năng này lên production thật với dữ liệu có backend.
