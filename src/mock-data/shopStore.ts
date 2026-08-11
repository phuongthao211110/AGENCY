// ── Shared shop store ────────────────────────────────────────────────────────
// Single source of truth for shop data across Web Shop (đăng ký) và Agency Admin.
// "Persistence" via localStorage — prototype only, no real backend.
// Cùng convention với orderStore.ts.

import baseShops from './shops.json'

export interface ConfiguredService {
  serviceId: string
  demoFee: number
}

export interface Shop {
  id: string
  agencyId: string
  name: string
  ownerName: string
  phone: string
  address: string
  status: string
  username: string
  shopUrl?: string
  createdAt: string
  totalOrders: number
  codSchedule: string
  connectionId?: string
  configuredServices: ConfiguredService[]
  selfDeleteReason?: string
  selfDeleteNote?: string
  selfDeletedAt?: string
}

const STORAGE_KEY = 'ghn_shops_v1'

export function loadShops(): Shop[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw) as Shop[]
      // Backfill: shop mới thêm vào shops.json sau khi browser đã có localStorage cũ không tự
      // xuất hiện vì localStorage không rỗng nên không reseed lại từ đầu — bù thêm shop base còn
      // thiếu theo id, không đụng gì tới shop đã có (giữ nguyên thay đổi/shop tự đăng ký của user).
      const storedIds = new Set(stored.map(s => s.id))
      const missing = (baseShops as unknown as Shop[]).filter(s => !storedIds.has(s.id))
      if (missing.length > 0) {
        const merged = [...stored, ...missing]
        saveShops(merged)
        return merged
      }
      return stored
    }
  } catch {
    /* fall through to reseed */
  }
  const seeded = baseShops as unknown as Shop[]
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)) } catch { /* storage unavailable */ }
  return seeded
}

function saveShops(shops: Shop[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(shops)) } catch { /* storage unavailable */ }
}

export function addShop(shop: Shop): Shop[] {
  const shops = loadShops()
  shops.unshift(shop)
  saveShops(shops)
  return shops
}

export function updateShop(shopId: string, patch: Partial<Shop>): Shop[] {
  const shops = loadShops()
  const idx = shops.findIndex(s => s.id === shopId)
  if (idx !== -1) {
    shops[idx] = { ...shops[idx], ...patch }
    saveShops(shops)
  }
  return shops
}
