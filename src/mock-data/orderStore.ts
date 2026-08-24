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
