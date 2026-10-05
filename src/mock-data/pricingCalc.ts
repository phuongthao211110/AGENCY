// ── Tính phí ship theo bảng giá (weight × zone) — logic DÙNG CHUNG, trước đây lặp lại ở
// Web Shop (Orders.tsx) và luồng Thư 247Express (AgencyOrders.tsx). Trích ra đây làm nguồn
// DUY NHẤT để nơi mới (import đơn hàng bulk) không tạo thêm 1 bản sao thứ 4. Các nơi cũ
// (Orders.tsx, AgencyOrders.tsx) vẫn giữ nguyên bản local riêng — không đụng vào luồng đã
// chạy ổn định chỉ để dedupe, chỉ nơi MỚI dùng module này.

import { loadPricing } from './pricingStore'

// 10 tỉnh đủ để demo (không phải danh sách 63 tỉnh thật) — dùng để ước lượng vùng khi bảng
// giá không phải route-based (VD 247Express tính theo miền thay vì tuyến cố định).
const PROVINCE_REGION: Record<string, 'bac' | 'trung' | 'nam'> = {
  'Hà Nội': 'bac', 'Hải Phòng': 'bac', 'Quảng Ninh': 'bac',
  'Đà Nẵng': 'trung', 'Nghệ An': 'trung',
  'TP.HCM': 'nam', 'Bình Dương': 'nam', 'Đồng Nai': 'nam', 'Bà Rịa - Vũng Tàu': 'nam', 'Cần Thơ': 'nam',
}

/** Tách tên tỉnh/thành từ 1 chuỗi địa chỉ đầy đủ — lấy phần cuối cùng sau dấu phẩy. */
export function parseProvinceFromAddress(address: string): string {
  const parts = address.split(',')
  return parts[parts.length - 1].trim()
}

/** GHN: zones có {from,to,label} cố định theo tuyến, có zone "Khác" làm fallback.
 * 247Express: zones chỉ có {label} — ước lượng vùng theo miền cho demo. */
export function resolveZoneIndex(priceTable: any, fromProvince: string, toProvince: string): number {
  const zones: any[] = priceTable.zones ?? []
  const isRouteBased = zones.length > 0 && 'from' in zones[0]
  if (isRouteBased) {
    let idx = zones.findIndex((z) => z.from === fromProvince && z.to === toProvince)
    if (idx === -1) idx = zones.findIndex((z) => z.from === fromProvince && z.to === 'Khác')
    return idx === -1 ? 0 : idx
  }
  if (fromProvince === toProvince) return 0
  return PROVINCE_REGION[fromProvince] === PROVINCE_REGION[toProvince] ? 1 : 2
}

/** Phí ship = tra theo bảng giá (zones × weight) của 1 priceTableId cụ thể, đúng theo tuyến
 * gửi → nhận. Không tìm thấy bảng giá (chưa cấu hình dịch vụ/priceTableId) → trả về 0, KHÔNG
 * báo lỗi — đúng quy ước chung toàn hệ thống khi thiếu service/bảng giá (xem Orders.tsx). */
export function feeFromPriceTable(priceTableId: string | undefined, weightGram: number, fromProvince: string, toProvince: string): number {
  const priceTable = priceTableId ? (loadPricing() as any[]).find((p) => p.id === priceTableId) : null
  if (!priceTable) return 0
  const weights: { max: number }[] = priceTable.weights ?? []
  const weightIndex = weights.findIndex((w) => weightGram <= w.max)
  const row = priceTable.prices?.[weightIndex === -1 ? weights.length - 1 : weightIndex]
  const zoneIndex = resolveZoneIndex(priceTable, fromProvince, toProvince)
  return row?.[zoneIndex] ?? row?.[0] ?? 0
}
