import { VIETNAM_PROVINCES } from './vietnam-provinces'
import type { Zone } from './vietnam-provinces'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegionDef {
  id: string
  name: string
  provinces: string[]
}

/** 1 xã/phường (theo địa giới mới sau sáp nhập 2025) + phân loại Nội/Ngoại thành. */
export interface UrbanWard {
  ward: string
  isUrban: boolean
}

/** 1 tỉnh/thành (tên mới sau sáp nhập) có phân biệt Nội thành/Ngoại thành — liệt kê rõ
 * từng xã/phường, không suy ra từ quận/huyện cũ nữa (cấp quận/huyện đã bị bỏ từ 2025). */
export interface UrbanConfig {
  province: string
  wards: UrbanWard[]
}

// ─── Internal seed constants ──────────────────────────────────────────────────

const ZONE_NAMES: Record<Zone, string> = {
  HN:  'Hà Nội (Đặc biệt)',
  DN:  'Đà Nẵng (Đặc biệt)',
  HCM: 'TP. Hồ Chí Minh (Đặc biệt)',
  V1:  'Miền Nam (Vùng 1)',
  V2:  'Miền Trung (Vùng 2)',
  V3:  'Miền Bắc (Vùng 3)',
}

const ZONE_ORDER: Zone[] = ['HN', 'DN', 'HCM', 'V1', 'V2', 'V3']

// ─── Utility ──────────────────────────────────────────────────────────────────

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

// ─── Mutable store (module-level, no Zustand) ─────────────────────────────────

/** All regions — seeded once from VIETNAM_PROVINCES, editable at runtime. */
export const regions: RegionDef[] = ZONE_ORDER.map((zone) => ({
  id: zone,
  name: ZONE_NAMES[zone],
  provinces: VIETNAM_PROVINCES.filter((p) => p.zone === zone).map((p) => p.name),
}))

/** Route name for same-province pairs. */
export let sameProvinceRoute = 'Nội Tỉnh'

/** Matrix: pairKey(regionIdA, regionIdB) → route name. */
export const routeMatrix: Record<string, string> = {
  // Nội Vùng — TP đặc biệt ↔ vùng tương ứng
  [pairKey('HN',  'V3')]: 'Nội Vùng',
  [pairKey('DN',  'V2')]: 'Nội Vùng',
  [pairKey('HCM', 'V1')]: 'Nội Vùng',

  // Liên Vùng Đặc Biệt — giữa 3 TP lớn với nhau
  [pairKey('HN',  'DN')]:  'Liên Vùng Đặc Biệt',
  [pairKey('DN',  'HCM')]: 'Liên Vùng Đặc Biệt',
  [pairKey('HCM', 'HN')]:  'Liên Vùng Đặc Biệt',

  // Liên Vùng — TP đặc biệt ↔ vùng không tương ứng
  [pairKey('HN',  'V1')]: 'Liên Vùng',
  [pairKey('HN',  'V2')]: 'Liên Vùng',
  [pairKey('DN',  'V1')]: 'Liên Vùng',
  [pairKey('DN',  'V3')]: 'Liên Vùng',
  [pairKey('HCM', 'V2')]: 'Liên Vùng',
  [pairKey('HCM', 'V3')]: 'Liên Vùng',

  // Liên Vùng Tỉnh — 2 tỉnh khác vùng
  [pairKey('V1', 'V2')]: 'Liên Vùng Tỉnh',
  [pairKey('V1', 'V3')]: 'Liên Vùng Tỉnh',
  [pairKey('V2', 'V3')]: 'Liên Vùng Tỉnh',

  // Nội Vùng Tỉnh — 2 tỉnh khác nhau cùng vùng
  [pairKey('V1', 'V1')]: 'Nội Vùng Tỉnh',
  [pairKey('V2', 'V2')]: 'Nội Vùng Tỉnh',
  [pairKey('V3', 'V3')]: 'Nội Vùng Tỉnh',
}

// Demo — 1 phần xã/phường tiêu biểu theo địa giới MỚI sau sáp nhập 2025 (không phải danh sách
// đầy đủ toàn bộ đơn vị). "Ngoại thành" của TP. Hồ Chí Minh dùng đúng tên xã thật thuộc khu vực
// Bà Rịa - Vũng Tàu (cũ) đã sáp nhập vào TP. Hồ Chí Minh; các nơi khác là tên minh hoạ tương tự
// cách đặt tên thật ("Khu vực ... cũ") — cần đại lý/Super Admin bổ sung đầy đủ khi có dữ liệu chính thức.
export const urbanConfigs: UrbanConfig[] = [
  {
    province: 'Hà Nội',
    wards: [
      { ward: 'Phường Hoàn Kiếm (Khu vực Quận Hoàn Kiếm cũ)', isUrban: true },
      { ward: 'Phường Ba Đình (Khu vực Quận Ba Đình cũ)', isUrban: true },
      { ward: 'Phường Cầu Giấy (Khu vực Quận Cầu Giấy cũ)', isUrban: true },
      { ward: 'Phường Thanh Xuân (Khu vực Quận Thanh Xuân cũ)', isUrban: true },
      { ward: 'Phường Hai Bà Trưng (Khu vực Quận Hai Bà Trưng cũ)', isUrban: true },
      { ward: 'Xã Sóc Sơn (Khu vực Huyện Sóc Sơn cũ)', isUrban: false },
      { ward: 'Xã Ba Vì (Khu vực Huyện Ba Vì cũ)', isUrban: false },
      { ward: 'Xã Chương Mỹ (Khu vực Huyện Chương Mỹ cũ)', isUrban: false },
      { ward: 'Xã Mỹ Đức (Khu vực Huyện Mỹ Đức cũ)', isUrban: false },
      { ward: 'Xã Phú Xuyên (Khu vực Huyện Phú Xuyên cũ)', isUrban: false },
    ],
  },
  {
    province: 'TP. Hồ Chí Minh',
    wards: [
      { ward: 'Phường Sài Gòn (Khu vực Quận 1 cũ)', isUrban: true },
      { ward: 'Phường Bến Thành (Khu vực Quận 1 cũ)', isUrban: true },
      { ward: 'Phường Chợ Lớn (Khu vực Quận 5 cũ)', isUrban: true },
      { ward: 'Phường Thủ Đức (Khu vực TP. Thủ Đức cũ)', isUrban: true },
      { ward: 'Phường Bình Dương (Khu vực TP. Thủ Dầu Một cũ)', isUrban: true },
      { ward: 'Xã Xuyên Mộc (Khu vực Xã Xuyên Mộc cũ)', isUrban: false },
      { ward: 'Xã Long Điền (Khu vực Thị trấn Long Điền cũ)', isUrban: false },
      { ward: 'Xã Đất Đỏ (Khu vực Thị trấn Đất Đỏ cũ)', isUrban: false },
      { ward: 'Xã Bình Châu (Khu vực Xã Bình Châu cũ)', isUrban: false },
      { ward: 'Xã Châu Đức (Khu vực Xã Xà Bang cũ)', isUrban: false },
      { ward: 'Xã Hồ Tràm (Khu vực Xã Phước Thuận cũ)', isUrban: false },
    ],
  },
  {
    province: 'Đà Nẵng',
    wards: [
      { ward: 'Phường Hải Châu (Khu vực Quận Hải Châu cũ)', isUrban: true },
      { ward: 'Phường Thanh Khê (Khu vực Quận Thanh Khê cũ)', isUrban: true },
      { ward: 'Phường Sơn Trà (Khu vực Quận Sơn Trà cũ)', isUrban: true },
      { ward: 'Phường Ngũ Hành Sơn (Khu vực Quận Ngũ Hành Sơn cũ)', isUrban: true },
      { ward: 'Xã Hội An (Khu vực TP. Hội An cũ)', isUrban: false },
      { ward: 'Xã Tam Kỳ (Khu vực TP. Tam Kỳ cũ)', isUrban: false },
      { ward: 'Xã Núi Thành (Khu vực Huyện Núi Thành cũ)', isUrban: false },
      { ward: 'Xã Duy Xuyên (Khu vực Huyện Duy Xuyên cũ)', isUrban: false },
    ],
  },
]

// ─── Setters ──────────────────────────────────────────────────────────────────

export function setSameProvinceRoute(name: string): void {
  sameProvinceRoute = name
}

// ─── Query functions ──────────────────────────────────────────────────────────

export function findRegionOf(province: string): RegionDef | undefined {
  return regions.find((r) => r.provinces.includes(province))
}

/**
 * Resolve the route name for a (fromProvince, toProvince) pair.
 * Returns null if either province is not assigned to any region,
 * or if the region pair has no name in the matrix.
 */
export function resolveRouteName(fromProvince: string, toProvince: string): string | null {
  if (fromProvince === toProvince) return sameProvinceRoute
  const fromReg = findRegionOf(fromProvince)
  const toReg   = findRegionOf(toProvince)
  if (!fromReg || !toReg) return null
  return routeMatrix[pairKey(fromReg.id, toReg.id)] ?? null
}

export function findUrbanConfig(province: string): UrbanConfig | undefined {
  return urbanConfigs.find((u) => u.province === province)
}

/**
 * Resolve Nội thành/Ngoại thành cho 1 xã/phường cụ thể.
 * true = Nội thành, false = Ngoại thành, null = tỉnh này hoặc xã/phường này chưa có phân loại.
 */
export function resolveUrbanArea(province: string, ward: string): boolean | null {
  const config = findUrbanConfig(province)
  if (!config) return null
  const found = config.wards.find((w) => w.ward === ward)
  return found ? found.isUrban : null
}

/**
 * List of all unique route names currently defined,
 * in order of first appearance (sameProvinceRoute first, then matrix values).
 */
export function listRouteNames(): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const name of [sameProvinceRoute, ...Object.values(routeMatrix)]) {
    if (!seen.has(name)) {
      seen.add(name)
      result.push(name)
    }
  }
  return result
}

// ─── Mutate functions ─────────────────────────────────────────────────────────

export function addRegion(name: string): RegionDef {
  const newRegion: RegionDef = { id: `region_${Date.now()}`, name, provinces: [] }
  regions.push(newRegion)
  return newRegion
}

export function renameRegion(id: string, name: string): void {
  const region = regions.find((r) => r.id === id)
  if (region) region.name = name
}

export function deleteRegion(id: string): void {
  const idx = regions.findIndex((r) => r.id === id)
  if (idx !== -1) regions.splice(idx, 1)
  // Remove all matrix entries that reference this region id
  for (const key of Object.keys(routeMatrix)) {
    if (key.split('|').includes(id)) delete routeMatrix[key]
  }
}

/**
 * Assign a province to a region, removing it from its previous region first
 * (ensures 1 province ∈ 1 region at all times).
 */
export function assignProvinceToRegion(province: string, regionId: string): void {
  for (const region of regions) {
    const idx = region.provinces.indexOf(province)
    if (idx !== -1) region.provinces.splice(idx, 1)
  }
  const target = regions.find((r) => r.id === regionId)
  if (target && !target.provinces.includes(province)) target.provinces.push(province)
}

export function removeProvinceFromRegion(province: string, regionId: string): void {
  const region = regions.find((r) => r.id === regionId)
  if (region) {
    const idx = region.provinces.indexOf(province)
    if (idx !== -1) region.provinces.splice(idx, 1)
  }
}

export function setRouteName(regionIdA: string, regionIdB: string, name: string): void {
  routeMatrix[pairKey(regionIdA, regionIdB)] = name
}

/** Un-assign a region pair — it becomes "chưa cấu hình" until assigned to a tuyến again. */
export function clearRouteName(regionIdA: string, regionIdB: string): void {
  delete routeMatrix[pairKey(regionIdA, regionIdB)]
}

/** Rename a tuyến everywhere it's used — every matrix cell pointing to oldName now points to newName. */
export function renameRouteName(oldName: string, newName: string): void {
  for (const key of Object.keys(routeMatrix)) {
    if (routeMatrix[key] === oldName) routeMatrix[key] = newName
  }
}

/** Delete a tuyến — every region pair pointing to it becomes "chưa cấu hình". */
export function deleteRouteName(name: string): void {
  for (const key of Object.keys(routeMatrix)) {
    if (routeMatrix[key] === name) delete routeMatrix[key]
  }
}

/** Thêm 1 tỉnh/thành vào danh sách có phân biệt Nội thành/Ngoại thành, ban đầu chưa có xã/phường nào. */
export function addUrbanProvince(province: string): UrbanConfig {
  const existing = findUrbanConfig(province)
  if (existing) return existing
  const config: UrbanConfig = { province, wards: [] }
  urbanConfigs.push(config)
  return config
}

/** Bỏ hẳn 1 tỉnh khỏi danh sách có Nội/Ngoại thành — tỉnh đó về lại trạng thái không phân biệt. */
export function removeUrbanProvince(province: string): void {
  const idx = urbanConfigs.findIndex((u) => u.province === province)
  if (idx !== -1) urbanConfigs.splice(idx, 1)
}

/** Thêm 1 xã/phường mới vào 1 tỉnh đã có phân biệt Nội/Ngoại thành. */
export function addUrbanWard(province: string, ward: string, isUrban: boolean): void {
  const config = findUrbanConfig(province)
  if (!config) return
  if (config.wards.some((w) => w.ward === ward)) return
  config.wards.push({ ward, isUrban })
}

/** Xoá hẳn 1 xã/phường khỏi danh sách của 1 tỉnh. */
export function removeUrbanWard(province: string, ward: string): void {
  const config = findUrbanConfig(province)
  if (!config) return
  const idx = config.wards.findIndex((w) => w.ward === ward)
  if (idx !== -1) config.wards.splice(idx, 1)
}

/** Đổi phân loại Nội thành ↔ Ngoại thành cho 1 xã/phường đã có trong danh sách. */
export function toggleUrbanWardClassification(province: string, ward: string): void {
  const config = findUrbanConfig(province)
  if (!config) return
  const found = config.wards.find((w) => w.ward === ward)
  if (found) found.isUrban = !found.isUrban
}
