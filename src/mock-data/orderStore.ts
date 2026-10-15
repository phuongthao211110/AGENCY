// ── Shared order store ───────────────────────────────────────────────────────
// Single source of truth for order data across Web Shop and Agency Admin.
// "Persistence" via localStorage — prototype only, no real backend.
// Both platforms are SPA routes so localStorage gives cross-page consistency.

import baseOrders from './orders.json'

export type DispatchStatus = 'pending_agency' | 'dispatched'
export type SendKind = 'goods' | 'letter'
export type CarrierCode = 'GHN' | '247EXPRESS'

// Explicit interface — avoids TypeScript typeof-inference conflicts across files.
export interface Order {
  id: string
  shopId: string
  trackingCode: string
  senderName: string
  senderPhone: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  weight: number
  cod: number
  fee: number
  // Lựa chọn THẬT của shop lúc tạo đơn — 'sender' = Shop trả ship, 'receiver' = Khách trả ship.
  // Khác với giá trị luôn cố định "Shop trả ship" khi đối soát với GHN (GHN chỉ biết thu cước
  // từ bên gửi/đại lý, không có khái niệm thu từ người nhận) — 2 giá trị này KHÁC NHAU có chủ đích.
  feePayer: 'sender' | 'receiver'
  // Phương thức thanh toán PHÍ SHIP khi feePayer === 'sender' (Shop trả ship) — chỉ có ý nghĩa
  // trong trường hợp đó, mặc định 'cash' (trừ vào kỳ đối soát như trước giờ). 'momo' = shop thanh
  // toán phí ship ngay lúc tạo/xác nhận đơn qua QR MoMo (mô phỏng UI, không có SDK/backend thật).
  // 'bank_transfer' = tương tự nhưng qua chuyển khoản ngân hàng (cũng mô phỏng UI thuần).
  paymentMethod?: 'cash' | 'momo' | 'bank_transfer'
  // Chỉ có ý nghĩa khi paymentMethod === 'momo' | 'bank_transfer'. 'not_required' = trả tiền mặt
  // (mặc định, không qua luồng thanh toán online). 'pending' = đã tạo mã/QR, chờ thanh toán.
  // 'paid' = Shop đã bấm "Tôi đã thanh toán" (TỰ KHAI — xem `paymentApprovalStatus` để biết GHN
  // đã thực sự xác nhận nhận được tiền hay chưa).
  // 'failed' = QR hết hạn (15 phút) mà chưa thanh toán, HOẶC GHN từ chối xác nhận — phải tạo mã
  // mới/thanh toán lại để thử lại.
  paymentStatus?: 'not_required' | 'pending' | 'paid' | 'failed'
  // ISO timestamp lúc bấm "Tôi đã thanh toán" — chỉ set khi paymentStatus chuyển sang 'paid'.
  paymentPaidAt?: string
  // Lớp DUYỆT của Super Admin (GHN) — ngăn Shop tự khai "đã thanh toán" (paymentStatus='paid')
  // nhưng thực tế chưa chuyển tiền. Chỉ phát sinh khi paymentMethod là 'momo'/'bank_transfer'.
  // 'pending_review' = Shop đã bấm "Tôi đã thanh toán", đơn bị GIỮ ở status 'pending' (đơn nháp),
  // KHÔNG được gửi NVC cho tới khi Super Admin xác nhận. 'confirmed' = Super Admin đã xác nhận
  // nhận được tiền — đơn tự động được đẩy đi tiếp (xem `approveOrderPayment`). 'rejected' = Super
  // Admin xác nhận KHÔNG nhận được tiền — Shop phải thanh toán lại từ đầu.
  paymentApprovalStatus?: 'pending_review' | 'confirmed' | 'rejected'
  // Lý do từ chối — bắt buộc nhập khi Super Admin bấm "Từ chối" (theo đúng pattern RejectInput
  // của AgencyRequestsView.tsx).
  paymentApprovalRejectedReason?: string
  paymentApprovedAt?: string
  paymentApprovedBy?: string | null
  status: string
  createdAt: string
  // Optional fields present in some JSON entries
  actionHistory?: Array<{
    date: string
    time: string
    operator: string
    action: string
    oldContent: string
    newContent: string
  }>
  num_deliver?: number
  num_pick?: number
  num_return?: number
  log?: Array<{
    status: string
    status_name: string
    action: string
    updated_date: string
    note: string
    warehouse_id: number | null
    warehouse_name: string
    is_force_majeure: boolean
    force_majeure_msg: string
    is_regulation: boolean
    regulation_msg: string
  }>
  // New dispatch-tracking fields (required, with defaults for migrated orders)
  sendKind: SendKind
  dispatchStatus: DispatchStatus
  carrierCode: CarrierCode | null
  dispatchedAt: string | null
  dispatchedBy: string | null
  // Hub 247Express xuất phát — xác nhận lúc dispatch (Service không còn gắn cứng hub nữa),
  // null cho tới khi dispatch, không áp dụng với carrier GHN
  dispatchHubId?: string | null
  // Đơn Thư (sendKind: 'letter') do đại lý gửi hộ qua 247Express — khi hoàn hàng, hàng vật lý
  // về tay ĐẠI LÝ trước (không về thẳng shop như đơn GHN Hàng hoá tự gửi). Field này đánh dấu
  // thời điểm đại lý xác nhận đã giao lại hàng hoàn cho shop — null nghĩa là hàng đang ở đại lý,
  // CHƯA về tay shop, dù order.status đã là 'returning'/'cancelled'/'failed'.
  returnHandoverAt?: string | null
  // Các field mở rộng từ màn "Nhập đơn hàng" (import) — optional vì các luồng tạo đơn khác
  // (CreateOrderDrawer, CreateLetterDrawer...) chưa thu thập các field này.
  senderAddress?: string       // địa chỉ Bên gửi thật sự dùng cho đơn (có thể khác địa chỉ mặc định của shop)
  shopOrderCode?: string       // Mã đơn shop tự đặt — chỉ để đối chiếu, không phải mã vận đơn
  declaredValue?: number       // Giá trị hàng khai giá (0 = không khai giá)
  viewGoodsPolicy?: string     // Ghi chú xem hàng — VD "Không cho xem hàng", "Cho xem không thử"
  orderNote?: string           // Ghi chú đơn hàng
  pickupShift?: string         // Ca lấy hàng
  codFailureFee?: number       // Phí thu tiền khi giao thất bại
}

const STORAGE_KEY = 'ghn_orders_v1'

function migrateOrder(o: typeof baseOrders[number]): Order {
  // Giữ nguyên sendKind/dispatchStatus/carrierCode nếu seed data đã khai báo sẵn (đơn Thư/
  // 247Express) — chỉ áp mặc định "Hàng hoá qua GHN, đã dispatch" cho các đơn cũ chưa có field
  // này (toàn bộ seed gốc trước khi có luồng 247Express).
  const raw = o as any
  return {
    ...(o as unknown as Order),
    sendKind: raw.sendKind ?? 'goods',
    dispatchStatus: raw.dispatchStatus ?? 'dispatched',
    carrierCode: raw.carrierCode ?? 'GHN',
    dispatchedAt: raw.dispatchedAt ?? raw.createdAt ?? null,
    dispatchedBy: raw.dispatchedBy ?? null,
    feePayer: raw.feePayer ?? 'sender',
  }
}

export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw) as Order[]
      // Backfill: đơn mới thêm vào orders.json sau khi browser đã có localStorage cũ (VD:
      // ORD034 cho luồng hoàn hàng đơn Thư) không tự xuất hiện vì localStorage không rỗng nên
      // không reseed lại từ đầu. Bù thêm các đơn base còn thiếu theo id, KHÔNG đụng gì tới đơn
      // đã có (giữ nguyên mọi thay đổi/đơn tạo mới của người dùng trong session).
      const storedIds = new Set(stored.map(o => o.id))
      const missing = (baseOrders as unknown[])
        .map(o => migrateOrder(o as typeof baseOrders[number]))
        .filter(o => !storedIds.has(o.id))
      if (missing.length > 0) {
        const merged = [...stored, ...missing]
        saveOrders(merged)
        return merged
      }
      return stored
    }
  } catch {
    /* fall through to reseed */
  }
  const seeded = (baseOrders as unknown[]).map(o => migrateOrder(o as typeof baseOrders[number]))
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)) } catch { /* storage unavailable */ }
  return seeded
}

function saveOrders(orders: Order[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)) } catch { /* storage unavailable */ }
  // Báo cho các component KHÔNG trực tiếp gọi hàm này (VD: badge số đơn chờ duyệt trên sidebar
  // SuperAdminLayout) biết dữ liệu đơn hàng vừa đổi, để tự re-render mà không cần điều hướng trang —
  // mọi hàm ghi (addOrder, updateOrder, approveOrderPayment...) đều đi qua đây nên phát 1 chỗ là đủ.
  try { window.dispatchEvent(new Event('ghn-orders-changed')) } catch { /* no window (SSR/test) */ }
}

export function addOrder(order: Order): Order[] {
  const orders = loadOrders()
  orders.unshift(order)
  saveOrders(orders)
  return orders
}

export function dispatchOrderToCarrier(
  orderId: string,
  carrierCode: CarrierCode,
  dispatchedBy: string,
  dispatchHubId?: string,
): Order[] {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx !== -1) {
    orders[idx] = {
      ...orders[idx],
      status: 'pickup', // đại lý đã gửi NVC — đơn không còn là "Đơn nháp" (status: 'pending')
      dispatchStatus: 'dispatched',
      carrierCode,
      dispatchedAt: new Date().toISOString(),
      dispatchedBy,
      dispatchHubId: dispatchHubId ?? null,
    }
    saveOrders(orders)
  }
  return orders
}

export function cancelOrder(orderId: string): Order[] {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], status: 'cancelled' }
    saveOrders(orders)
  }
  return orders
}

export function updateOrder(orderId: string, patch: Partial<Order>): Order[] {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...patch }
    saveOrders(orders)
  }
  return orders
}

// Super Admin xác nhận đã THỰC SỰ nhận được tiền từ Shop (phí ship thanh toán qua MoMo/chuyển
// khoản) — chỉ hợp lệ khi đơn đang 'pending_review'. Đơn đang bị giữ ở status 'pending' (đơn
// nháp) do gate phía Web Shop (xem SHOP-ORDER-43/saveEdit) sẽ được TỰ ĐỘNG đẩy sang 'pickup'
// ngay khi duyệt — Shop không cần quay lại bấm gì thêm.
export function approveOrderPayment(orderId: string, approvedBy: string): Order[] {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx !== -1 && orders[idx].paymentApprovalStatus === 'pending_review') {
    orders[idx] = {
      ...orders[idx],
      paymentApprovalStatus: 'confirmed',
      paymentApprovedAt: new Date().toISOString(),
      paymentApprovedBy: approvedBy,
      status: orders[idx].status === 'pending' ? 'pickup' : orders[idx].status,
    }
    saveOrders(orders)
    appendActionHistory(orderId, approvedBy, 'GHN xác nhận đã nhận thanh toán', '-', 'Đã duyệt — đơn chuyển sang chờ bàn giao')
  }
  return orders
}

// Super Admin xác nhận KHÔNG nhận được tiền — Shop phải thanh toán lại từ đầu (`paymentStatus`
// lùi về 'failed', giống hành vi hết hạn QR, để tái dùng đúng luồng "Tạo mã mới"/"Thanh toán lại"
// đã có sẵn). Đơn vẫn giữ nguyên status 'pending' (đơn nháp) — không tự xoá/huỷ đơn.
export function rejectOrderPayment(orderId: string, rejectedBy: string, reason: string): Order[] {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx !== -1 && orders[idx].paymentApprovalStatus === 'pending_review') {
    orders[idx] = {
      ...orders[idx],
      paymentApprovalStatus: 'rejected',
      paymentApprovalRejectedReason: reason,
      paymentStatus: 'failed',
      paymentApprovedBy: rejectedBy,
    }
    saveOrders(orders)
    appendActionHistory(orderId, rejectedBy, 'GHN từ chối xác nhận thanh toán', '-', reason)
  }
  return orders
}

// Ghi 1 dòng vào "Lịch sử thao tác" (tab action của OrderDetailDrawer) — trước đây actionHistory
// chỉ được seed 1 LẦN lúc tạo đơn rồi không bao giờ được thêm nữa (mọi cập nhật sau đó qua
// updateOrder() đều bỏ qua field này), khiến tab Lịch sử thao tác mãi trống/không phản ánh thao
// tác thật của shop (sửa thông tin, thanh toán, huỷ đơn...). Hàm này là điểm ghi DUY NHẤT dùng
// chung cho mọi thao tác xảy ra SAU khi đơn đã tồn tại trong store.
export function appendActionHistory(
  orderId: string,
  operator: string,
  action: string,
  oldContent = '-',
  newContent = '-',
): Order[] {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx !== -1) {
    const now = new Date()
    const entry = {
      date: now.toISOString().slice(0, 10),
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`,
      operator,
      action,
      oldContent,
      newContent,
    }
    orders[idx] = { ...orders[idx], actionHistory: [entry, ...(orders[idx].actionHistory ?? [])] }
    saveOrders(orders)
  }
  return orders
}

// ── Công tắc tổng: tạm chặn Shop tạo đơn mới ─────────────────────────────────
// Super Admin dùng khi phát hiện bất thường (nhiều đơn tự khai thanh toán nhưng chưa xác minh
// được, nghi ngờ gian lận...) và muốn dừng dòng đơn mới đổ vào trong lúc xử lý — KHÔNG ảnh hưởng
// đơn đã tạo trước đó (đơn cũ vẫn tiếp tục xử lý/duyệt bình thường, chỉ chặn tạo đơn MỚI).
const CREATION_BLOCKED_KEY = 'ghn_order_creation_blocked'

export function isOrderCreationBlocked(): boolean {
  try { return localStorage.getItem(CREATION_BLOCKED_KEY) === '1' } catch { return false }
}

export function setOrderCreationBlocked(blocked: boolean): void {
  try { localStorage.setItem(CREATION_BLOCKED_KEY, blocked ? '1' : '0') } catch { /* storage unavailable */ }
  // Dùng chung sự kiện với saveOrders() — mọi nơi đang lắng nghe 'ghn-orders-changed' (VD badge
  // sidebar Super Admin) đều tự re-render ngay khi công tắc này đổi, không cần thêm event riêng.
  try { window.dispatchEvent(new Event('ghn-orders-changed')) } catch { /* no window (SSR/test) */ }
}
