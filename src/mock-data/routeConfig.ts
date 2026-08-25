import { VIETNAM_PROVINCES } from './vietnam-provinces'
import type { Zone } from './vietnam-provinces'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegionDef {
  id: string
  name: string
  provinces: string[]
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
