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

/**
 * Matrix: pairKey(regionIdA, regionIdB) → route name. Cặp "đường chéo" (pairKey(id, id)) đại diện
 * cho MỌI đơn hàng trong phạm vi 1 miền — cả trường hợp cùng 1 tỉnh lẫn khác tỉnh cùng miền — nên
 * mặc định TẤT CẢ đường chéo đều dùng chung tên 'Nội Tỉnh'. Đây là tên gợi ý ban đầu, không phải
 * hằng số đặc biệt: Super Admin có thể bấm chip để tách riêng 1 miền sang tên tuyến khác bất kỳ lúc
 * nào, y hệt cách tick/bỏ tick các cặp miền khác — không còn cơ chế lưu tên riêng theo từng miền.
 */
export const routeMatrix: Record<string, string> = {
  // Nội Tỉnh — mặc định mọi miền dùng chung 1 tên (đường chéo = cùng miền)
  [pairKey('HN',  'HN')]:  'Nội Tỉnh',
  [pairKey('DN',  'DN')]:  'Nội Tỉnh',
  [pairKey('HCM', 'HCM')]: 'Nội Tỉnh',
  [pairKey('V1',  'V1')]:  'Nội Tỉnh',
  [pairKey('V2',  'V2')]:  'Nội Tỉnh',
  [pairKey('V3',  'V3')]:  'Nội Tỉnh',

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

/** true nếu `name` hiện đang được gán cho ÍT NHẤT 1 cặp "đường chéo" (pairKey(id, id)) — dùng để
 * nhận diện những tên tuyến đang đóng vai trò "nội tỉnh" cho 1 hay nhiều miền, dù tên tuyến không
 * còn là 1 hằng số cố định nữa (Super Admin có thể tách 1 miền sang tên khác qua chip bất kỳ lúc nào). */
export function isSameProvinceRouteName(name: string): boolean {
  return regions.some((r) => routeMatrix[pairKey(r.id, r.id)] === name)
}

/** Mô tả phạm vi áp dụng của 1 tên tuyến "nội tỉnh" — liệt kê từng miền đang dùng tên này cho cặp đường chéo. */
export function describeSameProvinceRoutePairs(routeName: string): string[] {
  return regions
    .filter((r) => routeMatrix[pairKey(r.id, r.id)] === routeName)
    .map((r) => (r.provinces.length === 1 ? `${r.provinces[0]} ↔ ${r.provinces[0]}` : `Cùng 1 tỉnh trong ${r.name}`))
}

// ─── Versioning — "Danh sách bộ vùng tuyến" ────────────────────────────────────
// 1 "bộ vùng tuyến" = Vùng miền + Tuyến + Nội/Ngoại thành GỘP CHUNG thành 1 khối BẤT BIẾN: mỗi
// lần Super Admin bấm "Lưu thay đổi" ở RouteConfig.tsx (dù sửa ở phần nào trong 3 phần trên),
// KHÔNG sửa đè lên bộ đang dùng — tạo hẳn 1 bộ MỚI, đẩy vào routeConfigVersions, rồi biến bộ mới
// thành bộ "đang áp dụng". Bộ cũ giữ nguyên vĩnh viễn, chỉ xem lại được (read-only) trong "Danh
// sách bộ vùng tuyến" — nhưng CÓ THỂ bấm "Đặt làm mặc định" ở đó để áp dụng LẠI 1 bộ cũ bất kỳ
// (không cần tạo bộ mới trùng nội dung) — xem `setActiveRouteConfigVersion()`. "Bộ đang áp dụng"
// vì vậy KHÔNG còn đồng nghĩa với "bộ tạo gần nhất" nữa — theo dõi qua `activeVersionId` riêng,
// không suy ra từ vị trí cuối mảng.

export interface RouteConfigVersion {
  id: string
  version: number
  label: string
  createdAt: string
  regions: RegionDef[]
  routeMatrix: Record<string, string>
  urbanConfigs: UrbanConfig[]
  // Tên các TUYẾN (giá trị trong routeMatrix) đang bị Super Admin khoá THỦ CÔNG trong bộ này —
  // khoá 1 tuyến = không cho đổi tên tuyến đó, không cho thêm/bớt cặp miền khỏi/vào tuyến đó (dù
  // thao tác từ chip của CHÍNH tuyến đó hay từ chip của 1 tuyến KHÁC đang cố "giành" cặp miền đi),
  // không cho xoá tuyến đó. KHÁC với tính năng khoá CẢ BỘ đã bỏ — đây khoá TỪNG TUYẾN riêng lẻ bên
  // trong 1 bộ, không ảnh hưởng gì tới việc đặt bộ này làm mặc định. Carry-forward sang bộ mới khi
  // lưu phần Vùng miền/Nội-Ngoại thành (không đụng Tuyến) để không bị mất khoá ngoài ý muốn.
  lockedRouteNames?: string[]
}

function cloneRegions(list: RegionDef[]): RegionDef[] {
  return list.map((r) => ({ ...r, provinces: [...r.provinces] }))
}

function cloneUrbanConfigs(list: UrbanConfig[]): UrbanConfig[] {
  return list.map((u) => ({ ...u, wards: u.wards.map((w) => ({ ...w })) }))
}

/** Lịch sử đầy đủ mọi bộ vùng tuyến đã từng tạo, theo đúng thứ tự tạo — KHÔNG suy ra bộ đang áp
 * dụng từ vị trí trong mảng này nữa, dùng `getActiveRouteConfigVersion()`. */
export const routeConfigVersions: RouteConfigVersion[] = [
  {
    id: 'rcv_seed',
    version: 1,
    label: 'Bộ mặc định',
    createdAt: '2026-01-01T00:00:00.000Z',
    regions: cloneRegions(regions),
    routeMatrix: { ...routeMatrix },
    urbanConfigs: cloneUrbanConfigs(urbanConfigs),
  },
]

let activeVersionId: string = routeConfigVersions[0].id

/** Đồng bộ nội dung 1 bộ vào `regions`/`routeMatrix`/`urbanConfigs` (3 biến export dùng chung
 * toàn app) — GIỮ NGUYÊN identity mảng/object (chỉ đổi nội dung bên trong qua
 * .length = 0/.push()/Object.assign) để mọi nơi đang import trực tiếp 3 biến này (CarrierSetup,
 * PricingCreate, Web Shop Orders, RouteCheck...) tự thấy dữ liệu mới nhất ngay lập tức. */
function applyVersionToStore(version: RouteConfigVersion): void {
  regions.length = 0
  regions.push(...cloneRegions(version.regions))
  for (const key of Object.keys(routeMatrix)) delete routeMatrix[key]
  Object.assign(routeMatrix, version.routeMatrix)
  urbanConfigs.length = 0
  urbanConfigs.push(...cloneUrbanConfigs(version.urbanConfigs))
  activeVersionId = version.id
}

/**
 * Tạo 1 bộ vùng tuyến MỚI từ draft (regions + routeMatrix + urbanConfigs) Super Admin vừa chỉnh
 * trên RouteConfig.tsx, đẩy vào routeConfigVersions, rồi áp dụng NGAY làm bộ đang dùng.
 */
export function commitNewRouteConfigVersion(
  draftRegions: RegionDef[],
  draftRouteMatrix: Record<string, string>,
  draftUrbanConfigs: UrbanConfig[],
  label?: string,
  lockedRouteNames?: string[],
): RouteConfigVersion {
  const version: RouteConfigVersion = {
    id: `rcv_${Date.now()}`,
    version: routeConfigVersions.length + 1,
    label: label?.trim() || `Bộ #${routeConfigVersions.length + 1}`,
    createdAt: new Date().toISOString(),
    regions: cloneRegions(draftRegions),
    routeMatrix: { ...draftRouteMatrix },
    urbanConfigs: cloneUrbanConfigs(draftUrbanConfigs),
    lockedRouteNames: lockedRouteNames ? [...lockedRouteNames] : [],
  }
  routeConfigVersions.push(version)
  applyVersionToStore(version)
  return version
}

/** "Bật mặc định" 1 bộ ĐÃ CÓ SẴN trong lịch sử (kể cả bộ cũ hơn bộ đang áp dụng) — không tạo bộ
 * mới, chỉ đổi con trỏ `activeVersionId` và đồng bộ dữ liệu bộ đó vào store dùng chung. */
export function setActiveRouteConfigVersion(versionId: string): RouteConfigVersion | null {
  const version = routeConfigVersions.find((v) => v.id === versionId)
  if (!version) return null
  applyVersionToStore(version)
  return version
}

export function getActiveRouteConfigVersion(): RouteConfigVersion {
  return routeConfigVersions.find((v) => v.id === activeVersionId) ?? routeConfigVersions[routeConfigVersions.length - 1]
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
  if (fromProvince === toProvince) {
    const reg = findRegionOf(fromProvince)
    return reg ? (routeMatrix[pairKey(reg.id, reg.id)] ?? null) : null
  }
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
 * List of all unique route names currently defined, in order of first appearance in routeMatrix.
 * RouteConfig.tsx ("Cấu hình tuyến") tự ghim tên 'Nội Tỉnh' lên đầu danh sách khi hiển thị (bất kể
 * thứ tự khai báo ở đây) — xem `orderedNames` trong component đó, không dựa vào thứ tự hàm này trả về.
 */
export function listRouteNames(): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const name of Object.values(routeMatrix)) {
    if (!seen.has(name)) {
      seen.add(name)
      result.push(name)
    }
  }
  return result
}

// ─── Mutate functions ─────────────────────────────────────────────────────────
// Vùng miền/Tuyến/Nội-Ngoại thành KHÔNG còn có hàm mutate rời sửa đè trực tiếp — RouteConfig.tsx
// giờ chỉnh cả 3 phần trên draft cục bộ, chỉ ghi vào store dùng chung qua
// `commitNewRouteConfigVersion()` (tạo bộ MỚI, xem phần "Versioning" phía trên) — không có cách
// nào sửa đè lên bộ đang áp dụng nữa.
