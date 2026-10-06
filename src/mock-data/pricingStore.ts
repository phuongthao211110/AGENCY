// ── Shared pricing-table store ──────────────────────────────────────────────
// Trước đây "Tạo bảng giá" (PricingCreate.tsx, Agency Admin) chỉ điều hướng đi mà KHÔNG lưu gì
// cả — mọi bảng giá Web Shop/Agency Admin đọc được đều là dữ liệu tĩnh seed sẵn trong
// pricing.json, không có cách nào tạo thêm bảng giá thật qua UI. Store này lấp khoảng trống đó:
// "Persistence" qua localStorage — prototype only, no real backend — cùng convention với
// orderStore.ts/shopStore.ts.
import basePricing from './pricing.json'

export type FeeUnit = '%' | 'vnd'
export type SurchargeFee = { value: string; unit: FeeUnit }
export type FeeTier = {
  id: string
  fromValue: string
  toValue: string
  fixedFee: string
  percentFee: string
  maxFee?: string
}
export type AddressChangeFee = {
  sameWardFee: string
  sameProvinceFee: string
  interProvincePercent: string
}
export type PriceSurcharges = {
  partialDelivery: SurchargeFee
  insurance: FeeTier[]
  codFee: FeeTier[]
  deliveryFailFee: SurchargeFee
  addressChange?: AddressChangeFee
}

// `routeName` (mới) = tên tuyến THẬT đang sống trong routeConfig.ts (Super Admin quản lý) tại
// thời điểm tạo bảng giá — cầu nối để 3 platform (Super Admin/Agency Admin/Web Shop) cùng nhận
// diện 1 tuyến theo đúng 1 tên duy nhất. Zone tạo TRƯỚC khi có cầu nối này (dữ liệu seed cũ) sẽ
// không có field này — vẫn hoạt động bình thường, chỉ là không kiểm tra được tuyến gốc còn tồn
// tại hay không.
export type PriceZone = { from?: string; to?: string; label: string; routeName?: string }
export type PriceWeight = { max: number; label: string }

export interface PriceTable {
  id: string
  name: string
  agencyId: string
  nvc: string
  isDefault: boolean
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  // Truy vết bộ tuyến (RouteConfigVersion) đã chọn lúc tạo bảng giá này — THUẦN HIỂN THỊ/TRUY VẾT,
  // KHÔNG dùng để tính phí (fee vẫn match theo zones[].from/to như cũ, xem pricingCalc.ts). Lưu cả
  // id lẫn label vì routeConfigVersions bất biến sau khi tạo (label không bao giờ đổi) — không cần
  // tra cứu lại lúc hiển thị nếu không muốn. Bảng giá tạo TRƯỚC khi có field này sẽ không có —
  // vẫn hoạt động bình thường, chỉ là không truy vết được nguồn gốc bộ tuyến.
  routeBundleId?: string
  routeBundleLabel?: string
  zones: PriceZone[]
  weights: PriceWeight[]
  prices: number[][]
  surcharges: PriceSurcharges
}

const STORAGE_KEY = 'ghn_pricing_v1'

export function loadPricing(): PriceTable[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw) as PriceTable[]
      // Backfill: bảng giá mới thêm vào pricing.json sau khi browser đã có localStorage cũ
      // không tự xuất hiện — bù thêm bảng còn thiếu theo id, không đụng bảng đã có.
      const storedIds = new Set(stored.map((p) => p.id))
      const missing = (basePricing as unknown as PriceTable[]).filter((p) => !storedIds.has(p.id))
      if (missing.length > 0) {
        const merged = [...stored, ...missing]
        savePricing(merged)
        return merged
      }
      return stored
    }
  } catch {
    // localStorage lỗi/không khả dụng → rơi về seed gốc, không throw
  }
  return basePricing as unknown as PriceTable[]
}

export function savePricing(list: PriceTable[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // Ghi thất bại (VD private browsing chặn localStorage) — bỏ qua, không throw để không vỡ UI.
  }
}

export function addPricingTable(table: PriceTable): PriceTable[] {
  const list = [...loadPricing(), table]
  savePricing(list)
  return list
}
