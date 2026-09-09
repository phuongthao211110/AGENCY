import { useState } from 'react'
import { ConfigProvider } from 'antd'
import { PlusOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
import { VIETNAM_PROVINCES } from '../../../mock-data/vietnam-provinces'
import {
  regions,
  routeMatrix,
  sameProvinceRouteByRegion,
  setSameProvinceRouteForRegion,
  pairKey,
  addRegion,
  renameRegion,
  deleteRegion,
  assignProvinceToRegion,
  removeProvinceFromRegion,
  setRouteName,
  clearRouteName,
  renameRouteName,
  deleteRouteName,
  urbanConfigs,
  addUrbanProvince,
  removeUrbanProvince,
  addUrbanWard,
  removeUrbanWard,
  toggleUrbanWardClassification,
  type RegionDef,
  type UrbanConfig,
} from '../../../mock-data/routeConfig'

const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// Full canonical list — all Vietnam provinces
const ALL_PROVINCES = VIETNAM_PROVINCES.map((p) => p.name)

const cardStyle: React.CSSProperties = {
  background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 10,
  padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 10px',
  fontSize: 14, color: C_TEXT_PRIMARY, outline: 'none',
}

// ── 1 cột "Nội thành" hoặc "Ngoại thành" trong khối Cấu hình nội & ngoại thành ──
// Hiện TOÀN BỘ xã/phường của tỉnh đang chọn — checkbox tick đúng cột theo isUrban hiện tại;
// tick vào ô đang bỏ trống = chuyển xã/phường đó sang loại của cột này (isUrban chỉ có 2 giá
// trị nên "tick cột này" luôn tương đương "bỏ tick cột kia").
function UrbanCategoryColumn({
  label, dotColor, wards, search, onSearchChange, targetIsUrban, onToggleWard, onSelectAll, onRemoveWard,
}: {
  label: string
  dotColor: string
  wards: { ward: string; isUrban: boolean }[]
  search: string
  onSearchChange: (v: string) => void
  targetIsUrban: boolean
  onToggleWard: (ward: string) => void
  onSelectAll: () => void
  onRemoveWard: (ward: string) => void
}) {
  const categoryWards = wards.filter((w) => w.isUrban === targetIsUrban)
  const q = search.trim().toLowerCase()
  const visibleWards = wards.filter((w) => !q || w.ward.toLowerCase().includes(q))
  const allChecked = categoryWards.length > 0 && categoryWards.length === wards.length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: dotColor, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C_TEXT_PRIMARY }}>{label}</span>
        <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>{categoryWards.length} phường/xã</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '5px 8px' }}>
        <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>🔍</span>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: C_TEXT_PRIMARY }}
        />
      </div>
      <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, maxHeight: 280, overflowY: 'auto' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: `1px solid ${C_BORDER}`, background: C_BG_HEADER, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY }}>
          <input type="checkbox" checked={allChecked} onChange={onSelectAll} />
          Tất cả
        </label>
        {visibleWards.length === 0 && (
          <div style={{ padding: '10px 12px', fontSize: 12, color: C_TEXT_SECONDARY }}>Không tìm thấy xã/phường phù hợp.</div>
        )}
        {visibleWards.map((w) => (
          <div key={w.ward} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 13, color: C_TEXT_PRIMARY }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, minWidth: 0 }}>
              <input type="checkbox" checked={w.isUrban === targetIsUrban} onChange={() => onToggleWard(w.ward)} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.ward}</span>
            </label>
            <CloseOutlined
              style={{ fontSize: 10, color: '#EF4444', cursor: 'pointer', flexShrink: 0 }}
              onClick={() => onRemoveWard(w.ward)}
              title="Xoá xã/phường"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RouteConfig() {

  // ── Local state seeded from shared store ──────────────────────────────────
  // Deep-copy so React detects mutations via setState
  const [localRegions, setLocalRegions] = useState<RegionDef[]>(() =>
    regions.map((r) => ({ ...r, provinces: [...r.provinces] }))
  )
  const [localMatrix, setLocalMatrix] = useState<Record<string, string>>(() => ({ ...routeMatrix }))
  const [localSameRouteByRegion, setLocalSameRouteByRegion] = useState<Record<string, string>>(() => ({ ...sameProvinceRouteByRegion }))
  // Danh sách tên tuyến (Bước 2) — độc lập với localMatrix để 1 tuyến mới thêm vẫn hiện
  // được dù chưa tick cặp miền nào (localMatrix chỉ lưu các cặp ĐÃ gán).
  const [routeNames, setRouteNames] = useState<string[]>(() =>
    Array.from(new Set(Object.values(routeMatrix)))
  )
  const [localUrbanConfigs, setLocalUrbanConfigs] = useState<UrbanConfig[]>(() =>
    urbanConfigs.map((u) => ({ ...u, wards: u.wards.map((w) => ({ ...w })) }))
  )
  // Điền nhanh theo khoảng tỉnh (Bước 1) — gán 1 dải tỉnh liên tiếp vào 1 miền cùng lúc,
  // dựa theo thứ tự Bắc → Nam đã có sẵn trong ALL_PROVINCES (3 TP đặc biệt trước, rồi
  // Miền Bắc → Miền Trung → Miền Nam). Không thay thế tick tay — chỉ giảm số lần bấm cho
  // phần lớn tỉnh, ngoại lệ vẫn sửa tay bằng chip như cũ.
  const [rangeRegionId, setRangeRegionId] = useState('')
  const [rangeFrom, setRangeFrom] = useState('')
  const [rangeTo, setRangeTo] = useState('')

  // ── Nội thành / Ngoại thành — chỉnh sửa trên DRAFT riêng, chỉ ghi vào store dùng chung khi
  // bấm "Lưu thay đổi" (khác với Miền/Tuyến ở trên, ghi thẳng vào store mỗi lần đổi). ──
  const [urbanDraft, setUrbanDraft] = useState<UrbanConfig[]>(() =>
    urbanConfigs.map((u) => ({ ...u, wards: u.wards.map((w) => ({ ...w })) }))
  )
  const [selectedUrbanProvince, setSelectedUrbanProvince] = useState<string | null>(
    () => urbanConfigs[0]?.province ?? null
  )
  const [newUrbanProvinceName, setNewUrbanProvinceName] = useState('')
  const [newUrbanWard, setNewUrbanWard] = useState('')
  const [urbanSearchNoi, setUrbanSearchNoi] = useState('')
  const [urbanSearchNgoai, setUrbanSearchNgoai] = useState('')

  const assignedSet    = new Set(localRegions.flatMap((r) => r.provinces))
  const unassignedList = ALL_PROVINCES.filter((p) => !assignedSet.has(p))

  const urbanDraftAssignedSet    = new Set(urbanDraft.map((u) => u.province))
  const availableUrbanProvinces  = ALL_PROVINCES.filter((p) => !urbanDraftAssignedSet.has(p))
  const hasUrbanChanges          = JSON.stringify(urbanDraft) !== JSON.stringify(localUrbanConfigs)
  const selectedUrbanConfig      = urbanDraft.find((u) => u.province === selectedUrbanProvince) ?? null

  // Validate tên vùng miền: rỗng hoặc trùng tên (không phân biệt hoa/thường) với vùng miền khác.
  const regionNameError = (region: RegionDef): string | null => {
    const name = region.name.trim()
    if (!name) return 'Vui lòng nhập tên vùng miền'
    const isDuplicate = localRegions.some(
      (r) => r.id !== region.id && r.name.trim().toLowerCase() === name.toLowerCase()
    )
    return isDuplicate ? 'Tên vùng miền đã tồn tại' : null
  }

  // Validate tên tuyến: tối thiểu 2 ký tự.
  const tuyenNameError = (name: string): string | null =>
    name.trim().length < 2 ? 'Ít nhất 2 ký tự' : null

  // Mọi cặp miền có thể có (kể cả đường chéo = cùng miền, khác tỉnh)
  const allRegionPairs = localRegions.flatMap((a, i) => localRegions.slice(i).map((b) => [a, b] as const))
  const unconfiguredPairs = allRegionPairs.filter(([a, b]) => !localMatrix[pairKey(a.id, b.id)])

  // ── Handlers — mutate store first, then setState ──────────────────────────

  const handleAddRegion = () => {
    const newRegion = addRegion('')
    setLocalRegions((prev) => [...prev, { ...newRegion, provinces: [] }])
    setLocalSameRouteByRegion((prev) => ({ ...prev, [newRegion.id]: sameProvinceRouteByRegion[newRegion.id] }))
  }

  const handleRenameRegion = (id: string, name: string) => {
    renameRegion(id, name)
    setLocalRegions((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)))
  }

  const handleDeleteRegion = (id: string) => {
    deleteRegion(id)
    setLocalRegions((prev) => prev.filter((r) => r.id !== id))
    setLocalMatrix(() => ({ ...routeMatrix }))
    setLocalSameRouteByRegion((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleAssignProvince = (province: string, regionId: string) => {
    assignProvinceToRegion(province, regionId)
    // Re-sync from store (province may have been removed from other regions)
    setLocalRegions(() => regions.map((r) => ({ ...r, provinces: [...r.provinces] })))
  }

  // Gán cả dải tỉnh (theo thứ tự Bắc → Nam trong ALL_PROVINCES) vào 1 miền — điền nhanh
  // thay vì chọn "+ Thêm tỉnh" từng dòng. Tỉnh trong dải đang thuộc miền khác sẽ bị chuyển sang.
  const handleApplyRange = () => {
    if (!rangeRegionId || !rangeFrom || !rangeTo) return
    const idxFrom = ALL_PROVINCES.indexOf(rangeFrom)
    const idxTo   = ALL_PROVINCES.indexOf(rangeTo)
    if (idxFrom === -1 || idxTo === -1) return
    const [lo, hi] = idxFrom <= idxTo ? [idxFrom, idxTo] : [idxTo, idxFrom]
    for (let i = lo; i <= hi; i++) {
      assignProvinceToRegion(ALL_PROVINCES[i], rangeRegionId)
    }
    setLocalRegions(regions.map((r) => ({ ...r, provinces: [...r.provinces] })))
    setRangeFrom('')
    setRangeTo('')
  }

  const handleRemoveProvince = (province: string, regionId: string) => {
    removeProvinceFromRegion(province, regionId)
    setLocalRegions((prev) =>
      prev.map((r) =>
        r.id === regionId ? { ...r, provinces: r.provinces.filter((p) => p !== province) } : r
      )
    )
  }

  const handleSetSameProvinceRoute = (regionId: string, name: string) => {
    setSameProvinceRouteForRegion(regionId, name)
    setLocalSameRouteByRegion((prev) => ({ ...prev, [regionId]: name }))
  }

  const handleAddTuyen = () => {
    // routeNames dedupe qua Set (giữ nguyên hành vi cũ tránh hiện trùng tên) — nếu đã có dòng
    // trống trước đó, thêm khoảng trắng để 2 dòng trống không bị Set gộp làm 1 (trim() vẫn coi
    // là rỗng nên validate "Ít nhất 2 ký tự" không bị ảnh hưởng).
    setRouteNames((prev) => {
      const blankCount = prev.filter((n) => n.trim() === '').length
      return [...prev, ' '.repeat(blankCount)]
    })
  }

  const handleRenameTuyen = (oldName: string, newName: string) => {
    renameRouteName(oldName, newName)
    setLocalMatrix(() => ({ ...routeMatrix }))
    setRouteNames((prev) => prev.map((n) => (n === oldName ? newName : n)))
  }

  const handleDeleteTuyen = (name: string) => {
    deleteRouteName(name)
    setLocalMatrix(() => ({ ...routeMatrix }))
    setRouteNames((prev) => prev.filter((n) => n !== name))
  }

  const handleToggleChip = (routeName: string, regionIdA: string, regionIdB: string) => {
    const key = pairKey(regionIdA, regionIdB)
    if (localMatrix[key] === routeName) {
      clearRouteName(regionIdA, regionIdB)
    } else {
      setRouteName(regionIdA, regionIdB, routeName)
    }
    setLocalMatrix(() => ({ ...routeMatrix }))
  }

  // ── Nội thành / Ngoại thành — mọi thao tác bên dưới chỉ sửa urbanDraft (state cục bộ),
  // KHÔNG đụng tới store dùng chung cho tới khi bấm "Lưu thay đổi" (commitUrbanDraft). ──
  const syncUrbanConfigs = () => {
    setLocalUrbanConfigs(urbanConfigs.map((u) => ({ ...u, wards: u.wards.map((w) => ({ ...w })) })))
  }

  const cloneUrbanConfigs = (list: UrbanConfig[]): UrbanConfig[] =>
    list.map((u) => ({ ...u, wards: u.wards.map((w) => ({ ...w })) }))

  const handleAddUrbanProvinceDraft = () => {
    const name = newUrbanProvinceName.trim()
    if (!name) return
    setUrbanDraft((prev) => (prev.some((u) => u.province === name) ? prev : [...prev, { province: name, wards: [] }]))
    setSelectedUrbanProvince(name)
    setNewUrbanProvinceName('')
  }

  const handleRemoveUrbanProvinceDraft = (province: string) => {
    setUrbanDraft((prev) => prev.filter((u) => u.province !== province))
    setSelectedUrbanProvince((prev) => {
      if (prev !== province) return prev
      const remaining = urbanDraft.filter((u) => u.province !== province)
      return remaining[0]?.province ?? null
    })
  }

  const handleAddUrbanWardDraft = () => {
    const ward = newUrbanWard.trim()
    if (!ward || !selectedUrbanProvince) return
    setUrbanDraft((prev) =>
      prev.map((u) =>
        u.province === selectedUrbanProvince
          ? (u.wards.some((w) => w.ward === ward) ? u : { ...u, wards: [...u.wards, { ward, isUrban: false }] })
          : u
      )
    )
    setNewUrbanWard('')
  }

  const handleRemoveUrbanWardDraft = (province: string, ward: string) => {
    setUrbanDraft((prev) =>
      prev.map((u) => (u.province === province ? { ...u, wards: u.wards.filter((w) => w.ward !== ward) } : u))
    )
  }

  const handleToggleUrbanWardDraft = (province: string, ward: string) => {
    setUrbanDraft((prev) =>
      prev.map((u) =>
        u.province === province
          ? { ...u, wards: u.wards.map((w) => (w.ward === ward ? { ...w, isUrban: !w.isUrban } : w)) }
          : u
      )
    )
  }

  const handleSelectAllUrbanWards = (province: string, isUrban: boolean) => {
    setUrbanDraft((prev) =>
      prev.map((u) => (u.province === province ? { ...u, wards: u.wards.map((w) => ({ ...w, isUrban })) } : u))
    )
  }

  const cancelUrbanDraft = () => {
    setUrbanDraft(cloneUrbanConfigs(localUrbanConfigs))
  }

  // Ghi draft vào store dùng chung — diff từng tỉnh/xã-phường rồi gọi đúng hàm mutate tương ứng
  // (store không có hàm "ghi đè toàn bộ", chỉ có các hàm mutate rời theo từng thay đổi).
  const commitUrbanDraft = () => {
    localUrbanConfigs.forEach((saved) => {
      if (!urbanDraft.some((d) => d.province === saved.province)) removeUrbanProvince(saved.province)
    })
    urbanDraft.forEach((draftCfg) => {
      const saved = localUrbanConfigs.find((u) => u.province === draftCfg.province)
      if (!saved) addUrbanProvince(draftCfg.province)

      ;(saved?.wards ?? []).forEach((w) => {
        if (!draftCfg.wards.some((dw) => dw.ward === w.ward)) removeUrbanWard(draftCfg.province, w.ward)
      })
      draftCfg.wards.forEach((dw) => {
        const savedWard = saved?.wards.find((w) => w.ward === dw.ward)
        if (!savedWard) addUrbanWard(draftCfg.province, dw.ward, dw.isUrban)
        else if (savedWard.isUrban !== dw.isUrban) toggleUrbanWardClassification(draftCfg.province, dw.ward)
      })
    })
    syncUrbanConfigs()
    setUrbanDraft(cloneUrbanConfigs(urbanConfigs))
  }

  return (
    <ConfigProvider theme={superAdminTheme}>
      <div style={{ padding: 20, background: '#fff', minHeight: '100vh' }}>

        {/* Page header */}
        <div style={{ marginBottom: 6, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C_TEXT_PRIMARY, margin: 0 }}>
              Vùng &amp; Tuyến
            </h1>
            <p style={{ fontSize: 12.5, color: C_TEXT_SECONDARY, margin: '2px 0 0' }}>
              Cấu hình vùng, miền và tuyến dùng chung cho mọi đại lý.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            title="Tải lại toàn bộ dữ liệu về trạng thái mẫu ban đầu (mất mọi thay đổi trong phiên này)"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', flexShrink: 0,
              background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
              cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: C_TEXT_PRIMARY,
            }}
          >
            ↻ Thiết lập lại
          </button>
        </div>

        {/* ── Giải thích khái niệm — miền / cặp miền / tuyến ── */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <InfoCircleOutlined style={{ fontSize: 13, color: '#1D4ED8' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8' }}>Cách tuyến được tính ra</span>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C_TEXT_PRIMARY }}>1. Miền</div>
              <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>Nhóm các tỉnh lại — mỗi tỉnh thuộc đúng 1 miền.</div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C_TEXT_PRIMARY }}>2. Cặp miền</div>
              <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>2 miền ghép lại khi có đơn gửi từ tỉnh miền này đến tỉnh miền kia — kể cả gửi trong cùng 1 miền.</div>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C_TEXT_PRIMARY }}>3. Tuyến</div>
              <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>Tên đặt cho 1 hoặc nhiều cặp miền, dùng để tính giá — nhiều cặp có thể chung 1 tên nếu muốn tính cùng giá.</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid #BFDBFE', fontSize: 12.5, color: C_TEXT_SECONDARY }}>
            <span>Ví dụ — đơn gửi từ <b style={{ color: C_TEXT_PRIMARY }}>Hà Nội</b> đến <b style={{ color: C_TEXT_PRIMARY }}>TP. Hồ Chí Minh</b> → cặp miền</span>
            <span style={{ padding: '2px 8px', borderRadius: 10, background: '#fff', border: '1px solid #BFDBFE', color: '#1D4ED8', fontWeight: 600, fontSize: 12 }}>Hà Nội (Đặc biệt)</span>
            <span>↔</span>
            <span style={{ padding: '2px 8px', borderRadius: 10, background: '#fff', border: '1px solid #BFDBFE', color: '#1D4ED8', fontWeight: 600, fontSize: 12 }}>TP. Hồ Chí Minh (Đặc biệt)</span>
            <span>→ tuyến</span>
            <span style={{ padding: '2px 8px', borderRadius: 10, background: '#FFF4ED', border: '1px solid #FDBA74', color: '#FF5200', fontWeight: 700, fontSize: 12 }}>Liên Vùng Đặc Biệt</span>
          </div>
        </div>

        {/* ── Cấu hình vùng miền ── */}
        <div style={{ ...cardStyle, marginTop: 12 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>🗺️ Cấu hình vùng miền</span>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
              Đã điền sẵn theo quy tắc GHN hiện tại — chỉ cần sửa khi có ngoại lệ.
            </div>
          </div>

          {/* Điền nhanh theo khoảng tỉnh — gán 1 dải tỉnh liên tiếp (Bắc→Nam) vào 1 miền */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: C_BG_HEADER, borderRadius: 8, padding: '10px 12px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C_TEXT_SECONDARY, flexShrink: 0 }}>Điền nhanh theo khoảng tỉnh:</span>
            <select
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              style={{ ...inputStyle, fontSize: 12, padding: '4px 6px', cursor: 'pointer' }}
            >
              <option value="">Từ tỉnh...</option>
              {ALL_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>đến</span>
            <select
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              style={{ ...inputStyle, fontSize: 12, padding: '4px 6px', cursor: 'pointer' }}
            >
              <option value="">Đến tỉnh...</option>
              {ALL_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>→ gán vào</span>
            <select
              value={rangeRegionId}
              onChange={(e) => setRangeRegionId(e.target.value)}
              style={{ ...inputStyle, fontSize: 12, padding: '4px 6px', cursor: 'pointer' }}
            >
              <option value="">Chọn miền...</option>
              {localRegions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button
              onClick={handleApplyRange}
              disabled={!rangeRegionId || !rangeFrom || !rangeTo}
              style={{
                padding: '4px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600,
                cursor: (!rangeRegionId || !rangeFrom || !rangeTo) ? 'default' : 'pointer',
                background: (!rangeRegionId || !rangeFrom || !rangeTo) ? '#D1D5DB' : '#FF5200',
                color: '#fff',
              }}
            >
              Áp dụng
            </button>
            <span style={{ fontSize: 11, color: C_TEXT_SECONDARY, width: '100%' }}>
              Dựa theo thứ tự Bắc → Nam có sẵn — tỉnh đang thuộc miền khác sẽ bị chuyển sang miền vừa chọn. Chỉ để điền nhanh hàng loạt; vẫn sửa tay từng tỉnh bằng chip bên dưới cho các ngoại lệ.
            </span>
          </div>

          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
            {/* Header bảng */}
            <div style={{ display: 'flex', background: C_BG_HEADER }}>
              <div style={{ flex: '0 0 220px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Tên vùng miền</div>
              <div style={{ flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Tỉnh/Thành phố</div>
              <div style={{ flex: '0 0 40px' }} />
            </div>

            {localRegions.map((region, i) => {
              const nameError = regionNameError(region)
              const provinceError = region.provinces.length === 0 ? 'Vui lòng chọn Tỉnh/Thành' : null
              return (
                <div
                  key={region.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', padding: '8px 12px', gap: 8,
                    borderTop: i === 0 ? 'none' : `1px solid ${C_BORDER}`,
                  }}
                >
                  <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input
                      value={region.name}
                      onChange={(e) => handleRenameRegion(region.id, e.target.value)}
                      placeholder="Tên vùng miền"
                      style={{
                        ...inputStyle, fontWeight: 700, width: '100%',
                        borderColor: nameError ? '#EF4444' : C_BORDER,
                      }}
                    />
                    {nameError && <span style={{ fontSize: 11, color: '#EF4444' }}>{nameError}</span>}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {region.provinces.map((p) => (
                        <span
                          key={p}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12,
                            background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: 12, fontWeight: 600,
                          }}
                        >
                          {p}
                          <CloseOutlined
                            style={{ fontSize: 10, cursor: 'pointer' }}
                            onClick={() => handleRemoveProvince(p, region.id)}
                          />
                        </span>
                      ))}
                    </div>
                    {unassignedList.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => { if (e.target.value) handleAssignProvince(e.target.value, region.id) }}
                        style={{
                          ...inputStyle, fontSize: 12, padding: '4px 8px', cursor: 'pointer', color: C_TEXT_SECONDARY,
                          width: 180, borderColor: provinceError ? '#EF4444' : C_BORDER,
                        }}
                      >
                        <option value="">Chọn Tỉnh/Thành</option>
                        {unassignedList.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    )}
                    {provinceError && <span style={{ fontSize: 11, color: '#EF4444' }}>{provinceError}</span>}
                  </div>

                  <button
                    onClick={() => handleDeleteRegion(region.id)}
                    style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', flexShrink: 0 }}
                    title="Xoá miền"
                  >
                    <CloseOutlined />
                  </button>
                </div>
              )
            })}
          </div>

          <button
            onClick={handleAddRegion}
            style={{
              alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: '#111827', border: 'none', borderRadius: 6,
              cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff',
            }}
          >
            <PlusOutlined style={{ fontSize: 12 }} /> Thêm vùng miền
          </button>

          {unassignedList.length > 0 && (
            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
              {unassignedList.length} tỉnh chưa được gán vùng miền: {unassignedList.slice(0, 10).join(', ')}{unassignedList.length > 10 ? ` và ${unassignedList.length - 10} tỉnh khác` : ''}
            </span>
          )}
        </div>

        {/* ── Cấu hình tuyến ── */}
        <div style={{ ...cardStyle, marginTop: 12 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>🔀 Cấu hình tuyến</span>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
              Nhiều dòng có thể dùng chung 1 tuyến nếu muốn tính cùng 1 mức giá
            </div>
          </div>

          {localRegions.length === 0 ? (
            <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, padding: 8 }}>Chưa có vùng miền nào — thêm ở khối "Cấu hình vùng miền" trước.</div>
          ) : (
            <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
              {/* Header bảng */}
              <div style={{ display: 'flex', background: C_BG_HEADER }}>
                <div style={{ flex: '0 0 220px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Tên tuyến</div>
                <div style={{ flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Cặp vùng miền</div>
                <div style={{ flex: '0 0 40px' }} />
              </div>

              {/* Nội tỉnh — luật cố định theo TỪNG miền, không tick cặp — luôn hiện làm dòng đầu, không xoá được */}
              <div style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 12px', gap: 8, background: '#FFF4ED' }}>
                <div style={{ flex: '0 0 220px' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: C_TEXT_PRIMARY }}>Nội tỉnh</span>
                  <div style={{ fontSize: 11, color: C_TEXT_SECONDARY, marginTop: 2 }}>Cố định — không cần tick, luôn áp dụng</div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {localRegions.map((region) => (
                    <div key={region.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '4px 8px' }}>
                      <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>{region.name}:</span>
                      <input
                        value={localSameRouteByRegion[region.id] ?? ''}
                        onChange={(e) => handleSetSameProvinceRoute(region.id, e.target.value)}
                        style={{ ...inputStyle, fontSize: 12, fontWeight: 700, padding: '3px 6px', width: 110 }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ flex: '0 0 40px' }} />
              </div>

              {Array.from(new Set(routeNames)).map((name, i) => {
                const nameError = tuyenNameError(name)
                return (
                  <div
                    key={`${name}__${i}`}
                    style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 12px', gap: 8, borderTop: `1px solid ${C_BORDER}` }}
                  >
                    <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <input
                        value={name}
                        onChange={(e) => handleRenameTuyen(name, e.target.value)}
                        placeholder="Tên tuyến"
                        style={{ ...inputStyle, fontWeight: 700, width: '100%', borderColor: nameError ? '#EF4444' : C_BORDER }}
                      />
                      {nameError && <span style={{ fontSize: 11, color: '#EF4444' }}>{nameError}</span>}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {allRegionPairs.map(([a, b]) => {
                        const checked = localMatrix[pairKey(a.id, b.id)] === name
                        return (
                          <button
                            key={pairKey(a.id, b.id)}
                            onClick={() => handleToggleChip(name, a.id, b.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 14,
                              fontSize: 12, fontWeight: checked ? 600 : 400, cursor: 'pointer',
                              background: checked ? '#FFF4ED' : '#F9FAFB',
                              border: `1px solid ${checked ? '#FDBA74' : C_BORDER}`,
                              color: checked ? '#FF5200' : '#9CA3AF',
                            }}
                          >
                            {a.id === b.id ? a.name : `${a.name} ↔ ${b.name}`}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => handleDeleteTuyen(name)}
                      style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', flexShrink: 0 }}
                      title="Xoá tuyến"
                    >
                      <CloseOutlined />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <button
            onClick={handleAddTuyen}
            style={{
              alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              background: '#111827', border: 'none', borderRadius: 6,
              cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff',
            }}
          >
            <PlusOutlined style={{ fontSize: 12 }} /> Thêm tuyến
          </button>

          {unconfiguredPairs.length > 0 && (
            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
              {unconfiguredPairs.length} cặp vùng miền chưa được gán tuyến: {unconfiguredPairs.slice(0, 6).map(([a, b]) => (a.id === b.id ? a.name : `${a.name} ↔ ${b.name}`)).join(', ')}{unconfiguredPairs.length > 6 ? ` và ${unconfiguredPairs.length - 6} cặp khác` : ''}
            </span>
          )}
        </div>

        {/* ── Cấu hình nội & ngoại thành — sidebar chọn tỉnh + 2 cột checklist, sửa trên draft
            riêng (urbanDraft), chỉ ghi vào store dùng chung khi bấm "Lưu thay đổi". ── */}
        <div style={{ ...cardStyle, marginTop: 12, padding: 0, gap: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 12px' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>🏙️ Cấu hình nội &amp; ngoại thành</span>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
              Theo xã/phường (địa giới mới sau sáp nhập 2025, cấp quận/huyện không còn) — chỉ vài
              thành phố có phân biệt giá Nội/Ngoại thành, dùng cho toggle "Tách khu vực" khi tạo
              bảng giá. Dữ liệu demo minh hoạ, chưa đầy đủ toàn bộ xã/phường thật.
            </div>
          </div>

          <div style={{ display: 'flex', borderTop: `1px solid ${C_BORDER}`, minHeight: 360 }}>
            {/* Sidebar chọn tỉnh */}
            <div style={{ flex: '0 0 200px', borderRight: `1px solid ${C_BORDER}`, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 10, borderBottom: `1px solid ${C_BORDER}`, display: 'flex', gap: 6 }}>
                <select
                  value={newUrbanProvinceName}
                  onChange={(e) => setNewUrbanProvinceName(e.target.value)}
                  style={{ ...inputStyle, fontSize: 12, padding: '4px 6px', flex: 1, cursor: 'pointer' }}
                >
                  <option value="">+ Thêm tỉnh</option>
                  {availableUrbanProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <button
                  onClick={handleAddUrbanProvinceDraft}
                  disabled={!newUrbanProvinceName}
                  style={{
                    padding: '4px 8px', borderRadius: 6, border: `1px solid ${C_BORDER}`, fontSize: 12, fontWeight: 600,
                    cursor: newUrbanProvinceName ? 'pointer' : 'default',
                    background: newUrbanProvinceName ? '#111827' : '#F3F4F6',
                    color: newUrbanProvinceName ? '#fff' : C_TEXT_SECONDARY,
                  }}
                >
                  <PlusOutlined style={{ fontSize: 11 }} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {urbanDraft.length === 0 && (
                  <div style={{ padding: 12, fontSize: 12, color: C_TEXT_SECONDARY }}>Chưa có tỉnh nào.</div>
                )}
                {urbanDraft.map((cfg) => {
                  const selected = cfg.province === selectedUrbanProvince
                  return (
                    <div
                      key={cfg.province}
                      onClick={() => setSelectedUrbanProvince(cfg.province)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                        padding: '8px 12px', cursor: 'pointer',
                        background: selected ? '#FFF4ED' : 'transparent',
                        color: selected ? '#FF5200' : C_TEXT_PRIMARY,
                        fontWeight: selected ? 700 : 400, fontSize: 13,
                        borderLeft: `3px solid ${selected ? '#FF5200' : 'transparent'}`,
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cfg.province}</span>
                      <CloseOutlined
                        style={{ fontSize: 10, color: '#EF4444', flexShrink: 0 }}
                        onClick={(e) => { e.stopPropagation(); handleRemoveUrbanProvinceDraft(cfg.province) }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Panel chính — checklist Nội/Ngoại thành của tỉnh đang chọn */}
            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              {!selectedUrbanConfig ? (
                <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, padding: 8 }}>Chọn 1 tỉnh/thành ở danh sách bên trái, hoặc thêm tỉnh mới.</div>
              ) : (
                <>
                  <input
                    value={newUrbanWard}
                    onChange={(e) => setNewUrbanWard(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrbanWardDraft() }}
                    placeholder="+ Thêm xã/phường mới (Enter) — mặc định Ngoại thành"
                    style={{ ...inputStyle, fontSize: 13 }}
                  />
                  <div style={{ display: 'flex', gap: 16 }}>
                    <UrbanCategoryColumn
                      label="Nội thành" dotColor="#16A34A"
                      wards={selectedUrbanConfig.wards}
                      search={urbanSearchNoi} onSearchChange={setUrbanSearchNoi}
                      targetIsUrban={true}
                      onToggleWard={(ward) => handleToggleUrbanWardDraft(selectedUrbanConfig.province, ward)}
                      onSelectAll={() => handleSelectAllUrbanWards(selectedUrbanConfig.province, true)}
                      onRemoveWard={(ward) => handleRemoveUrbanWardDraft(selectedUrbanConfig.province, ward)}
                    />
                    <UrbanCategoryColumn
                      label="Ngoại thành" dotColor="#7C3AED"
                      wards={selectedUrbanConfig.wards}
                      search={urbanSearchNgoai} onSearchChange={setUrbanSearchNgoai}
                      targetIsUrban={false}
                      onToggleWard={(ward) => handleToggleUrbanWardDraft(selectedUrbanConfig.province, ward)}
                      onSelectAll={() => handleSelectAllUrbanWards(selectedUrbanConfig.province, false)}
                      onRemoveWard={(ward) => handleRemoveUrbanWardDraft(selectedUrbanConfig.province, ward)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Thanh hành động — luôn hiện, Huỷ bỏ/Lưu thay đổi disable khi chưa có thay đổi nào */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: `1px solid ${C_BORDER}`, background: C_BG_HEADER }}>
            <button
              onClick={cancelUrbanDraft}
              disabled={!hasUrbanChanges}
              style={{
                padding: '7px 16px', borderRadius: 6, border: `1px solid ${C_BORDER}`, fontSize: 13, fontWeight: 600,
                background: '#fff', color: hasUrbanChanges ? C_TEXT_PRIMARY : C_TEXT_SECONDARY,
                cursor: hasUrbanChanges ? 'pointer' : 'default', opacity: hasUrbanChanges ? 1 : 0.6,
              }}
            >
              ✕ Huỷ bỏ
            </button>
            <button
              onClick={() => window.location.reload()}
              title="Tải lại toàn bộ dữ liệu về trạng thái mẫu ban đầu (mất mọi thay đổi trong phiên này)"
              style={{ padding: '7px 16px', borderRadius: 6, border: `1px solid ${C_BORDER}`, fontSize: 13, fontWeight: 600, background: '#fff', color: C_TEXT_PRIMARY, cursor: 'pointer' }}
            >
              ↻ Thiết lập lại
            </button>
            <button
              onClick={commitUrbanDraft}
              disabled={!hasUrbanChanges}
              style={{
                padding: '7px 16px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, color: '#fff',
                background: hasUrbanChanges ? '#FF5200' : '#D1D5DB', cursor: hasUrbanChanges ? 'pointer' : 'default',
              }}
            >
              💾 Lưu thay đổi
            </button>
          </div>
        </div>

      </div>
    </ConfigProvider>
  )
}
