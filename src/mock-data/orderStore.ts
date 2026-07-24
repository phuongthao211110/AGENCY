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
}

const STORAGE_KEY = 'ghn_orders_v1'

function migrateOrder(o: typeof baseOrders[number]): Order {
  return {
    ...(o as unknown as Order),
    sendKind: 'goods',
    dispatchStatus: 'dispatched',
    carrierCode: 'GHN',
    dispatchedAt: (o as any).createdAt ?? null,
    dispatchedBy: null,
  }
}

export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as Order[]
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
