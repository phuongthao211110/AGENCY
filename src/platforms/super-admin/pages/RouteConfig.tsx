import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { PlusOutlined, CloseOutlined, InfoCircleOutlined, LockOutlined } from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
import { VIETNAM_PROVINCES } from '../../../mock-data/vietnam-provinces'
import {
  regions,
  routeMatrix,
  urbanConfigs,
  pairKey,
  commitNewRouteConfigVersion,
  updateActiveVersionLocks,
  getActiveRouteConfigVersion,
  type RegionDef,
  type UrbanConfig,
  type RouteConfigVersion,
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
// trị nên "tick cột này" luôn tương đương "bỏ tick cột kia"). Danh sách xã/phường là CỐ ĐỊNH
// theo địa giới hành chính — Super Admin chỉ phân loại Nội/Ngoại thành, không thêm/xoá xã/phường.
function UrbanCategoryColumn({
  label, dotColor, wards, search, onSearchChange, targetIsUrban, onToggleWard, onSelectAll,
}: {
  label: string
  dotColor: string
  wards: { ward: string; isUrban: boolean }[]
  search: string
  onSearchChange: (v: string) => void
  targetIsUrban: boolean
  onToggleWard: (ward: string) => void
  onSelectAll: () => void
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
          <label key={w.ward} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 13, color: C_TEXT_PRIMARY, cursor: 'pointer' }}>
            <input type="checkbox" checked={w.isUrban === targetIsUrban} onChange={() => onToggleWard(w.ward)} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.ward}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function RouteConfig() {
  const navigate = useNavigate()

  // ── Vùng miền, Tuyến, Nội/Ngoại thành mỗi phần có 1 DRAFT + nút Lưu/Huỷ RIÊNG — lưu phần nào
  // chỉ tạo bộ vùng tuyến mới từ ĐÚNG phần đó + 2 phần còn lại lấy nguyên theo bộ ĐANG ÁP DỤNG
  // (không lẫn thay đổi CHƯA lưu ở phần khác vào cùng 1 bộ) — KHÁC bản trước (gộp cả 3 phần
  // thành 1 draft, 1 nút Lưu duy nhất). Deep-copy để React nhận diện mutation qua setState.
  const [regionsDraft, setRegionsDraft] = useState<RegionDef[]>(() =>
    regions.map((r) => ({ ...r, provinces: [...r.provinces] }))
  )
  const [matrixDraft, setMatrixDraft] = useState<Record<string, string>>(() => ({ ...routeMatrix }))
  // Danh sách tên tuyến (Bước 2) — độc lập với matrixDraft để 1 tuyến mới thêm vẫn hiện được dù
  // chưa tick cặp miền nào (matrixDraft chỉ lưu các cặp ĐÃ gán).
  const [routeNames, setRouteNames] = useState<string[]>(() =>
    Array.from(new Set(Object.values(routeMatrix)))
  )
  // Tên tuyến đang bị khoá THỦ CÔNG trong draft hiện tại — xem field `lockedRouteNames` trên
  // RouteConfigVersion (routeConfig.ts) để biết phạm vi chặn chính xác.
  const [lockedRouteNames, setLockedRouteNames] = useState<Set<string>>(
    () => new Set(getActiveRouteConfigVersion().lockedRouteNames ?? [])
  )
  // Cấp khoá mịn hơn — khoá đúng 1 CẶP vùng miền (pairKey), độc lập với khoá cả tuyến ở trên.
  // Xem field `lockedPairKeys` trên RouteConfigVersion (routeConfig.ts).
  const [lockedPairKeys, setLockedPairKeys] = useState<Set<string>>(
    () => new Set(getActiveRouteConfigVersion().lockedPairKeys ?? [])
  )
  // Modal "Khoá tuyến" — TÁCH RIÊNG khỏi bảng "Cấu hình tuyến" chính: bảng chính chỉ còn HIỂN THỊ
  // trạng thái khoá (input/chip/nút xoá bị disable khi khoá), không còn icon bấm khoá/mở khoá lẫn
  // trong đó nữa — toàn bộ thao tác khoá/mở khoá (cả tuyến lẫn từng cặp) chuyển hết vào đây, lưu
  // bằng 1 nút "Lưu thay đổi" RIÊNG, độc lập với draft Vùng miền/Tuyến/Nội-Ngoại thành đang dở.
  const [lockModalOpen, setLockModalOpen] = useState(false)
  const [lockDraftRouteNames, setLockDraftRouteNames] = useState<Set<string>>(new Set())
  const [lockDraftPairKeys, setLockDraftPairKeys] = useState<Set<string>>(new Set())

  const openLockModal = () => {
    setLockDraftRouteNames(new Set(lockedRouteNames))
    setLockDraftPairKeys(new Set(lockedPairKeys))
    setLockModalOpen(true)
  }

  // Khoá/mở khoá tuyến chỉ sửa lockedRouteNames/lockedPairKeys TẠI CHỖ trên bộ ĐANG ÁP DỤNG —
  // KHÔNG sinh bộ vùng tuyến mới (khác 3 nút Lưu kia, vốn đổi regions/routeMatrix/urbanConfigs nên
  // cần giữ bản cũ trong lịch sử). Xem updateActiveVersionLocks() trong routeConfig.ts.
  const commitLockDraft = () => {
    const updated = updateActiveVersionLocks(Array.from(lockDraftRouteNames), Array.from(lockDraftPairKeys))
    setActiveVersion(updated)
    setLockedRouteNames(new Set(lockDraftRouteNames))
    setLockedPairKeys(new Set(lockDraftPairKeys))
    setLockModalOpen(false)
  }

  const toggleLockDraftRoute = (name: string) => {
    setLockDraftRouteNames((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleLockDraftPair = (key: string) => {
    setLockDraftPairKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  const [urbanDraft, setUrbanDraft] = useState<UrbanConfig[]>(() =>
    urbanConfigs.map((u) => ({ ...u, wards: u.wards.map((w) => ({ ...w })) }))
  )
  // Theo dõi bộ vùng tuyến ĐANG ÁP DỤNG (KHÔNG chắc là bộ tạo gần nhất — Super Admin có thể đã
  // "Đặt làm mặc định" cho 1 bộ cũ hơn ở trang "Danh sách bộ vùng tuyến") — dùng làm mốc so sánh
  // "có thay đổi chưa lưu" cho CẢ 3 draft, và làm nguồn "giữ nguyên" cho 2 phần không lưu khi chỉ
  // lưu 1 phần. Chung 1 state vì cả 3 nút Lưu đều cập nhật nó khi có version mới.
  const [activeVersion, setActiveVersion] = useState<RouteConfigVersion>(() => getActiveRouteConfigVersion())

  const [selectedUrbanProvince, setSelectedUrbanProvince] = useState<string | null>(
    () => urbanConfigs[0]?.province ?? null
  )
  const [addProvinceMenuOpen, setAddProvinceMenuOpen] = useState(false)
  const [urbanSearchNoi, setUrbanSearchNoi] = useState('')
  const [urbanSearchNgoai, setUrbanSearchNgoai] = useState('')

  const assignedSet    = new Set(regionsDraft.flatMap((r) => r.provinces))
  const unassignedList = ALL_PROVINCES.filter((p) => !assignedSet.has(p))

  const urbanDraftAssignedSet   = new Set(urbanDraft.map((u) => u.province))
  const availableUrbanProvinces = ALL_PROVINCES.filter((p) => !urbanDraftAssignedSet.has(p))
  const selectedUrbanConfig     = urbanDraft.find((u) => u.province === selectedUrbanProvince) ?? null

  // 3 cờ "có thay đổi chưa lưu" ĐỘC LẬP — mỗi cụm nút Lưu/Huỷ chỉ nhìn đúng 1 cờ của phần mình.
  const hasRegionChanges = JSON.stringify(regionsDraft) !== JSON.stringify(activeVersion.regions)
  const hasTuyenChanges  = JSON.stringify(matrixDraft) !== JSON.stringify(activeVersion.routeMatrix)
    || JSON.stringify([...lockedRouteNames].sort()) !== JSON.stringify([...(activeVersion.lockedRouteNames ?? [])].sort())
    || JSON.stringify([...lockedPairKeys].sort()) !== JSON.stringify([...(activeVersion.lockedPairKeys ?? [])].sort())
  const hasUrbanChanges  = JSON.stringify(urbanDraft) !== JSON.stringify(activeVersion.urbanConfigs)

  // Validate tên vùng miền: trùng tên (không phân biệt hoa/thường) với vùng miền khác. Dòng chưa
  // đặt tên (vừa bấm "+ Thêm vùng miền", chưa gõ gì) không báo lỗi — chỉ validate khi đã có tên.
  const regionNameError = (region: RegionDef): string | null => {
    const name = region.name.trim()
    if (!name) return null
    const isDuplicate = regionsDraft.some(
      (r) => r.id !== region.id && r.name.trim().toLowerCase() === name.toLowerCase()
    )
    return isDuplicate ? 'Tên vùng miền đã tồn tại' : null
  }

  // Validate tên tuyến: tối thiểu 2 ký tự.
  const tuyenNameError = (name: string): string | null =>
    name.trim().length < 2 ? 'Ít nhất 2 ký tự' : null

  // Mọi cặp miền có thể có (kể cả đường chéo = cùng miền, khác tỉnh) — LƯU Ý: dựa trên
  // `regionsDraft` (có thể có vùng miền vừa thêm/sửa NHƯNG CHƯA LƯU) — nếu lưu "Cấu hình tuyến"
  // trong lúc "Cấu hình vùng miền" còn thay đổi chưa lưu, cặp tick ở đây vẫn tính theo vùng miền
  // NHÁP (chưa lưu) chứ không phải bộ đang áp dụng; xem Notes ở story GSA-ROUTE-14b.
  const allRegionPairs = regionsDraft.flatMap((a, i) => regionsDraft.slice(i).map((b) => [a, b] as const))
  const unconfiguredPairs = allRegionPairs.filter(([a, b]) => !matrixDraft[pairKey(a.id, b.id)])

  // ── Handlers — CHỈ sửa draft cục bộ, không đụng store dùng chung nữa ───────────────────────

  const handleAddRegion = () => {
    const newRegion: RegionDef = { id: `region_${Date.now()}`, name: '', provinces: [] }
    setRegionsDraft((prev) => [...prev, newRegion])
    setMatrixDraft((prev) => ({ ...prev, [pairKey(newRegion.id, newRegion.id)]: 'Nội Tỉnh' }))
  }

  const handleRenameRegion = (id: string, name: string) => {
    setRegionsDraft((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)))
  }

  const handleDeleteRegion = (id: string) => {
    setRegionsDraft((prev) => prev.filter((r) => r.id !== id))
    setMatrixDraft((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (key.split('|').includes(id)) delete next[key]
      }
      return next
    })
  }

  const handleAssignProvince = (province: string, regionId: string) => {
    setRegionsDraft((prev) =>
      prev.map((r) => ({ ...r, provinces: r.provinces.filter((p) => p !== province) }))
        .map((r) => (r.id === regionId ? { ...r, provinces: [...r.provinces, province] } : r))
    )
  }

  const handleRemoveProvince = (province: string, regionId: string) => {
    setRegionsDraft((prev) =>
      prev.map((r) =>
        r.id === regionId ? { ...r, provinces: r.provinces.filter((p) => p !== province) } : r
      )
    )
  }

  const cancelRegionsDraft = () => {
    setRegionsDraft(activeVersion.regions.map((r) => ({ ...r, provinces: [...r.provinces] })))
  }

  // Lưu RIÊNG "Cấu hình vùng miền" — Tuyến/Nội-Ngoại thành lấy nguyên theo bộ đang áp dụng
  // (bỏ qua mọi thay đổi CHƯA lưu ở 2 phần đó, nếu có). Có xác nhận trước khi lưu — hạn chế tạo
  // hàng loạt bộ gần giống hệt nhau nếu Super Admin bấm Lưu nhiều lần liên tiếp cho các chỉnh sửa nhỏ.
  const commitRegionsDraft = () => {
    const ok = window.confirm('Lưu thay đổi Vùng miền sẽ tạo 1 bộ vùng tuyến MỚI (giữ nguyên Tuyến/Nội-Ngoại thành hiện tại). Tiếp tục?')
    if (!ok) return
    const newVersion = commitNewRouteConfigVersion(regionsDraft, activeVersion.routeMatrix, activeVersion.urbanConfigs, undefined, activeVersion.lockedRouteNames, activeVersion.lockedPairKeys)
    setActiveVersion(newVersion)
    setRegionsDraft(regions.map((r) => ({ ...r, provinces: [...r.provinces] })))
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
    if (oldName === 'Nội Tỉnh' || lockedRouteNames.has(oldName)) return
    setMatrixDraft((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (next[key] === oldName) next[key] = newName
      }
      return next
    })
    setRouteNames((prev) => prev.map((n) => (n === oldName ? newName : n)))
  }

  // "Nội Tỉnh" không xoá được — đây là tên gợi ý mặc định cho cặp "đường chéo" (cùng miền) của
  // MỌI miền, Super Admin tách 1 miền sang tên khác bằng cách bấm chip, không xoá cả dòng.
  const handleDeleteTuyen = (name: string) => {
    if (name === 'Nội Tỉnh' || lockedRouteNames.has(name)) return
    // Tuyến đang chứa ít nhất 1 cặp bị khoá RIÊNG (dù bản thân tuyến không bị khoá) — chặn xoá để
    // tránh orphan khoá (xoá tuyến sẽ tự gỡ gán cặp đó khỏi mọi tuyến, phá mất ý nghĩa đã khoá).
    const hasLockedPair = Object.entries(matrixDraft).some(([key, routeName]) => routeName === name && lockedPairKeys.has(key))
    if (hasLockedPair) return
    setMatrixDraft((prev) => {
      const next = { ...prev }
      for (const key of Object.keys(next)) {
        if (next[key] === name) delete next[key]
      }
      return next
    })
    setRouteNames((prev) => prev.filter((n) => n !== name))
  }

  const handleToggleChip = (routeName: string, regionIdA: string, regionIdB: string) => {
    if (lockedRouteNames.has(routeName)) return
    const key = pairKey(regionIdA, regionIdB)
    // Cặp bị khoá RIÊNG (lockedPairKeys) — không cho đổi cặp này sang tuyến khác, bất kể tuyến
    // hiện đang gán/tuyến đích có bị khoá cả tuyến hay không. Đây là cấp khoá mịn hơn, độc lập.
    if (lockedPairKeys.has(key)) return
    // Cặp đang thuộc 1 tuyến KHÁC đang bị khoá CẢ TUYẾN — không cho "giành" cặp đó sang tuyến này,
    // dù bấm chip của tuyến đang mở khoá (routeName) chứ không phải chip của chính tuyến bị khoá.
    const currentOwner = matrixDraft[key]
    if (currentOwner && currentOwner !== routeName && lockedRouteNames.has(currentOwner)) return
    setMatrixDraft((prev) => {
      const next = { ...prev }
      if (next[key] === routeName) delete next[key]
      else next[key] = routeName
      return next
    })
  }


  const cancelTuyenDraft = () => {
    setMatrixDraft({ ...activeVersion.routeMatrix })
    setRouteNames(Array.from(new Set(Object.values(activeVersion.routeMatrix))))
    setLockedRouteNames(new Set(activeVersion.lockedRouteNames ?? []))
    setLockedPairKeys(new Set(activeVersion.lockedPairKeys ?? []))
  }

  // Lưu RIÊNG "Cấu hình tuyến" — Vùng miền/Nội-Ngoại thành lấy nguyên theo bộ đang áp dụng.
  // Có xác nhận trước khi lưu — hạn chế tạo hàng loạt bộ gần giống hệt nhau.
  const commitTuyenDraft = () => {
    const ok = window.confirm('Lưu thay đổi Tuyến sẽ tạo 1 bộ vùng tuyến MỚI (giữ nguyên Vùng miền/Nội-Ngoại thành hiện tại). Tiếp tục?')
    if (!ok) return
    const newVersion = commitNewRouteConfigVersion(activeVersion.regions, matrixDraft, activeVersion.urbanConfigs, undefined, Array.from(lockedRouteNames), Array.from(lockedPairKeys))
    setActiveVersion(newVersion)
    setMatrixDraft({ ...routeMatrix })
    setRouteNames(Array.from(new Set(Object.values(routeMatrix))))
  }

  // ── Nội thành / Ngoại thành — draft + Lưu/Huỷ RIÊNG, độc lập với Vùng miền/Tuyến ở trên. ──

  const handleAddUrbanProvinceDraft = (name: string) => {
    if (!name) return
    setUrbanDraft((prev) => (prev.some((u) => u.province === name) ? prev : [...prev, { province: name, wards: [] }]))
    setSelectedUrbanProvince(name)
    setAddProvinceMenuOpen(false)
  }

  const handleRemoveUrbanProvinceDraft = (province: string) => {
    setUrbanDraft((prev) => prev.filter((u) => u.province !== province))
    setSelectedUrbanProvince((prev) => {
      if (prev !== province) return prev
      const remaining = urbanDraft.filter((u) => u.province !== province)
      return remaining[0]?.province ?? null
    })
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
    setUrbanDraft(activeVersion.urbanConfigs.map((u) => ({ ...u, wards: u.wards.map((w) => ({ ...w })) })))
  }

  // Lưu RIÊNG "Cấu hình nội & ngoại thành" — Vùng miền/Tuyến lấy nguyên theo bộ đang áp dụng.
  // Có xác nhận trước khi lưu — hạn chế tạo hàng loạt bộ gần giống hệt nhau.
  const commitUrbanDraft = () => {
    const ok = window.confirm('Lưu thay đổi Nội & ngoại thành sẽ tạo 1 bộ vùng tuyến MỚI (giữ nguyên Vùng miền/Tuyến hiện tại). Tiếp tục?')
    if (!ok) return
    const newVersion = commitNewRouteConfigVersion(activeVersion.regions, activeVersion.routeMatrix, urbanDraft, undefined, activeVersion.lockedRouteNames, activeVersion.lockedPairKeys)
    setActiveVersion(newVersion)
    setUrbanDraft(urbanConfigs.map((u) => ({ ...u, wards: u.wards.map((w) => ({ ...w })) })))
  }

  // Dữ liệu cho modal "Khoá tuyến" — dựa trên bộ ĐANG ÁP DỤNG (activeVersion), KHÔNG dựa trên
  // matrixDraft/regionsDraft đang dở ở trên, vì modal lưu độc lập (xem commitLockDraft). "Nội
  // Tỉnh" không hiện trong modal — không khoá được (vốn đã luôn áp dụng cho mọi miền, không có gì
  // để "giữ cố định" thêm).
  const lockModalRouteNames = Array.from(new Set(Object.values(activeVersion.routeMatrix))).filter((n) => n !== 'Nội Tỉnh')
  const lockModalRegionPairs = activeVersion.regions.flatMap((a, i) => activeVersion.regions.slice(i).map((b) => [a, b] as const))

  return (
    <ConfigProvider theme={superAdminTheme}>
      <div style={{ padding: 20, background: '#fff', minHeight: '100vh' }}>

        {/* Page header */}
        <div style={{ marginBottom: 6, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <button
              onClick={() => navigate('/super-admin/route-config')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                cursor: 'pointer', padding: 0, marginBottom: 6, fontSize: 12.5, color: C_TEXT_SECONDARY,
              }}
            >
              ← Danh sách bộ vùng tuyến
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C_TEXT_PRIMARY, margin: 0 }}>
              Chỉnh sửa vùng &amp; tuyến
            </h1>
            <p style={{ fontSize: 12.5, color: C_TEXT_SECONDARY, margin: '2px 0 0' }}>
              Đang chỉnh trên bộ vùng tuyến đang áp dụng — bấm "Lưu thay đổi" sẽ tự sinh ra 1 bộ MỚI, bộ hiện tại vẫn giữ nguyên trong lịch sử, không bị sửa đè.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button
              onClick={openLockModal}
              title="Quản lý khoá tuyến/cặp miền — tách riêng khỏi chỉnh sửa vùng & tuyến"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
                cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: C_TEXT_PRIMARY,
              }}
            >
              <LockOutlined style={{ fontSize: 12 }} /> Khoá tuyến
            </button>
            <button
              onClick={() => window.location.reload()}
              title="Tải lại toàn bộ dữ liệu về trạng thái mẫu ban đầu (mất mọi thay đổi trong phiên này)"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
                cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: C_TEXT_PRIMARY,
              }}
            >
              ↻ Thiết lập lại
            </button>
          </div>
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

          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
            {/* Header bảng */}
            <div style={{ display: 'flex', background: C_BG_HEADER }}>
              <div style={{ flex: '0 0 220px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Tên vùng miền</div>
              <div style={{ flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Tỉnh/Thành phố</div>
              <div style={{ flex: '0 0 40px' }} />
            </div>

            {regionsDraft.map((region, i) => {
              const nameError = regionNameError(region)
              // Cũng chỉ validate tỉnh khi đã có tên — dòng mới thêm hoàn toàn trống không báo lỗi.
              const provinceError = region.name.trim() && region.provinces.length === 0 ? 'Vui lòng chọn Tỉnh/Thành' : null
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

          {/* Lưu RIÊNG "Vùng miền" — Tuyến/Nội-Ngoại thành KHÔNG bị ảnh hưởng, vẫn giữ nguyên
              theo bộ đang áp dụng cho tới khi tự lưu riêng ở đúng khối của chúng. */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: `1px solid ${C_BORDER}`, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
              {hasRegionChanges ? 'Có thay đổi chưa lưu ở Vùng miền — bấm "Lưu thay đổi" sẽ tạo 1 bộ vùng tuyến MỚI (chỉ áp dụng phần Vùng miền, giữ nguyên Tuyến/Nội-Ngoại thành hiện tại).' : 'Đã lưu — không có thay đổi nào ở Vùng miền.'}
            </span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={cancelRegionsDraft}
                disabled={!hasRegionChanges}
                style={{
                  padding: '7px 16px', borderRadius: 6, border: `1px solid ${C_BORDER}`, fontSize: 13, fontWeight: 600,
                  background: '#fff', color: hasRegionChanges ? C_TEXT_PRIMARY : C_TEXT_SECONDARY,
                  cursor: hasRegionChanges ? 'pointer' : 'default', opacity: hasRegionChanges ? 1 : 0.6,
                }}
              >
                ✕ Huỷ bỏ
              </button>
              <button
                onClick={commitRegionsDraft}
                disabled={!hasRegionChanges}
                style={{
                  padding: '7px 16px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, color: '#fff',
                  background: hasRegionChanges ? '#FF5200' : '#D1D5DB', cursor: hasRegionChanges ? 'pointer' : 'default',
                }}
              >
                💾 Lưu thay đổi (tạo bộ mới)
              </button>
            </div>
          </div>
        </div>

        {/* ── Cấu hình tuyến ── */}
        <div style={{ ...cardStyle, marginTop: 12 }}>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>🔀 Cấu hình tuyến</span>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
              Nhiều dòng có thể dùng chung 1 tuyến nếu muốn tính cùng 1 mức giá
            </div>
          </div>

          {regionsDraft.length === 0 ? (
            <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, padding: 8 }}>Chưa có vùng miền nào — thêm ở khối "Cấu hình vùng miền" trước.</div>
          ) : (
            <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
              {/* Header bảng */}
              <div style={{ display: 'flex', background: C_BG_HEADER }}>
                <div style={{ flex: '0 0 220px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Tên tuyến</div>
                <div style={{ flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Cặp vùng miền</div>
                <div style={{ flex: '0 0 40px' }} />
              </div>

              {/* "Nội Tỉnh" không còn là hàng đặc biệt riêng — chỉ là 1 tên tuyến bình thường được
                  seed sẵn cho mọi cặp "đường chéo" (cùng miền), luôn hiện đầu danh sách và không
                  xoá được; Super Admin tách 1 miền sang tên khác bằng cách bấm chip như bình thường. */}
              {(() => {
                const uniqueNames = Array.from(new Set(routeNames))
                const orderedNames = uniqueNames.includes('Nội Tỉnh')
                  ? ['Nội Tỉnh', ...uniqueNames.filter((n) => n !== 'Nội Tỉnh')]
                  : uniqueNames
                return orderedNames.map((name, i) => {
                  const isNoiTinh = name === 'Nội Tỉnh'
                  const isLocked = lockedRouteNames.has(name)
                  // Tuyến chứa ít nhất 1 cặp bị khoá RIÊNG — chặn xoá dù bản thân tuyến không khoá
                  // (xem handleDeleteTuyen, tránh orphan khoá khi xoá cả tuyến).
                  const hasLockedPair = Object.entries(matrixDraft).some(([key, routeName]) => routeName === name && lockedPairKeys.has(key))
                  const nameError = isNoiTinh ? null : tuyenNameError(name)
                  return (
                    <div
                      key={`${name}__${i}`}
                      style={{
                        display: 'flex', alignItems: 'flex-start', padding: '8px 12px', gap: 8,
                        borderTop: i === 0 ? 'none' : `1px solid ${C_BORDER}`,
                        background: isNoiTinh ? '#FFF4ED' : isLocked ? '#FEF2F2' : 'transparent',
                      }}
                    >
                      <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {isNoiTinh ? (
                          <span
                            style={{
                              alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 12,
                              fontSize: 13, fontWeight: 700, background: '#FFEAD9', border: '1px solid #FDBA74', color: '#FF5200',
                            }}
                          >
                            Nội Tỉnh
                          </span>
                        ) : (
                          <>
                            <input
                              value={name}
                              onChange={(e) => handleRenameTuyen(name, e.target.value)}
                              placeholder="Tên tuyến"
                              disabled={isLocked}
                              title={isLocked ? 'Tuyến đã khoá — mở khoá để đổi tên' : undefined}
                              style={{
                                ...inputStyle, fontWeight: 700, width: '100%', borderColor: nameError ? '#EF4444' : C_BORDER,
                                background: isLocked ? '#F3F4F6' : '#fff', color: isLocked ? C_TEXT_SECONDARY : C_TEXT_PRIMARY,
                                cursor: isLocked ? 'not-allowed' : 'text',
                              }}
                            />
                            {nameError && <span style={{ fontSize: 11, color: '#EF4444' }}>{nameError}</span>}
                          </>
                        )}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {isNoiTinh ? (
                          /* "Nội Tỉnh" không còn chip bấm được — chỉ hiện 1 CHÚ THÍCH chung DUY NHẤT
                             nêu rõ phạm vi áp dụng ("chỉ phạm vi trong cùng 1 tỉnh"), không liệt kê
                             tên từng miền/tỉnh. Chỉ hiện khi còn ít nhất 1 miền đang gán tuyến này —
                             Super Admin tick hết mọi miền sang tuyến khác thì chú thích tự ẩn. Muốn
                             tách 1 miền ra khỏi đây, tick miền đó vào tuyến khác — routeMatrix chỉ
                             giữ 1 tên/cặp nên miền đó tự động rời khỏi "Nội Tỉnh". */
                          allRegionPairs.some(([a, b]) => a.id === b.id && matrixDraft[pairKey(a.id, b.id)] === name) && (
                            <span style={{ fontSize: 11, color: C_TEXT_SECONDARY }}>
                              Chỉ phạm vi trong cùng 1 tỉnh
                            </span>
                          )
                        ) : (
                          allRegionPairs.map(([a, b]) => {
                            const key = pairKey(a.id, b.id)
                            const checked = matrixDraft[key] === name
                            const owner = matrixDraft[key]
                            const pairLocked = lockedPairKeys.has(key)
                            const blockedByOtherLock = !checked && !!owner && owner !== name && lockedRouteNames.has(owner)
                            const chipDisabled = isLocked || blockedByOtherLock || pairLocked
                            const chipLabel = a.id === b.id ? a.name.replace(' (Đặc biệt)', '') : `${a.name} ↔ ${b.name}`
                            return (
                              <button
                                key={key}
                                onClick={() => handleToggleChip(name, a.id, b.id)}
                                disabled={chipDisabled}
                                title={pairLocked ? `Cặp "${chipLabel}" đã bị khoá riêng — mở khoá ở "Khoá tuyến" để đổi` : blockedByOtherLock ? `Cặp này đang thuộc tuyến "${owner}" đã khoá` : isLocked ? 'Tuyến đã khoá' : undefined}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 14,
                                  fontSize: 12, fontWeight: checked ? 600 : 400, cursor: chipDisabled ? 'not-allowed' : 'pointer',
                                  background: pairLocked ? '#FEF2F2' : checked ? '#FFF4ED' : '#F9FAFB',
                                  border: `1px solid ${pairLocked ? '#FCA5A5' : checked ? '#FDBA74' : C_BORDER}`,
                                  color: pairLocked ? '#DC2626' : checked ? '#FF5200' : '#9CA3AF',
                                  opacity: chipDisabled && !pairLocked ? 0.5 : 1,
                                }}
                              >
                                {chipLabel}
                              </button>
                            )
                          })
                        )}
                      </div>
                      <div style={{ flex: '0 0 28px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {!isNoiTinh && (
                          <button
                            onClick={() => handleDeleteTuyen(name)}
                            disabled={isLocked || hasLockedPair}
                            style={{ border: 'none', background: 'transparent', color: (isLocked || hasLockedPair) ? '#D1D5DB' : '#EF4444', cursor: (isLocked || hasLockedPair) ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                            title={isLocked ? 'Tuyến đã khoá — mở khoá để xoá' : hasLockedPair ? 'Tuyến đang chứa cặp miền bị khoá riêng — mở khoá cặp đó trước khi xoá' : 'Xoá tuyến'}
                          >
                            <CloseOutlined />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
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

          {/* Lưu RIÊNG "Tuyến" — Vùng miền/Nội-Ngoại thành KHÔNG bị ảnh hưởng, vẫn giữ nguyên
              theo bộ đang áp dụng cho tới khi tự lưu riêng ở đúng khối của chúng. */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: `1px solid ${C_BORDER}`, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
              {hasTuyenChanges ? 'Có thay đổi chưa lưu ở Tuyến — bấm "Lưu thay đổi" sẽ tạo 1 bộ vùng tuyến MỚI (chỉ áp dụng phần Tuyến, giữ nguyên Vùng miền/Nội-Ngoại thành hiện tại).' : `Đang áp dụng: ${activeVersion.label}`}
            </span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={cancelTuyenDraft}
                disabled={!hasTuyenChanges}
                style={{
                  padding: '7px 16px', borderRadius: 6, border: `1px solid ${C_BORDER}`, fontSize: 13, fontWeight: 600,
                  background: '#fff', color: hasTuyenChanges ? C_TEXT_PRIMARY : C_TEXT_SECONDARY,
                  cursor: hasTuyenChanges ? 'pointer' : 'default', opacity: hasTuyenChanges ? 1 : 0.6,
                }}
              >
                ✕ Huỷ bỏ
              </button>
              <button
                onClick={commitTuyenDraft}
                disabled={!hasTuyenChanges}
                style={{
                  padding: '7px 16px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, color: '#fff',
                  background: hasTuyenChanges ? '#FF5200' : '#D1D5DB', cursor: hasTuyenChanges ? 'pointer' : 'default',
                }}
              >
                💾 Lưu thay đổi (tạo bộ mới)
              </button>
            </div>
          </div>
        </div>

        {/* ── Cấu hình nội & ngoại thành — sidebar chọn tỉnh + 2 cột checklist, draft + Lưu/Huỷ
            RIÊNG (urbanDraft), độc lập với Vùng miền/Tuyến phía trên. ── */}
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
            {/* Sidebar chọn tỉnh — danh sách tỉnh trước, nút "+ Thêm tỉnh" ở cuối cùng */}
            <div style={{ flex: '0 0 200px', borderRight: `1px solid ${C_BORDER}`, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 12px 6px', fontSize: 12, color: C_TEXT_SECONDARY }}>Tỉnh/Thành</div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {urbanDraft.length === 0 && (
                  <div style={{ padding: '0 12px 12px', fontSize: 12, color: C_TEXT_SECONDARY }}>Chưa có tỉnh nào.</div>
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

              {/* Nút "+ Thêm tỉnh" ở cuối — bấm mở danh sách tỉnh chưa có để chọn thêm */}
              <div style={{ position: 'relative', padding: 10, borderTop: `1px solid ${C_BORDER}` }}>
                <button
                  onClick={() => setAddProvinceMenuOpen((v) => !v)}
                  disabled={availableUrbanProvinces.length === 0}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '7px 10px', borderRadius: 6, border: `1px solid ${C_BORDER}`,
                    background: '#fff', fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY,
                    cursor: availableUrbanProvinces.length === 0 ? 'default' : 'pointer',
                    opacity: availableUrbanProvinces.length === 0 ? 0.5 : 1,
                  }}
                >
                  <PlusOutlined style={{ fontSize: 11 }} /> Thêm tỉnh
                </button>
                {addProvinceMenuOpen && availableUrbanProvinces.length > 0 && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: 10, right: 10, marginBottom: 4,
                    background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 8,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 20, overflow: 'hidden',
                    maxHeight: 220, overflowY: 'auto',
                  }}>
                    {availableUrbanProvinces.map((p) => (
                      <div
                        key={p}
                        onClick={() => handleAddUrbanProvinceDraft(p)}
                        style={{ padding: '8px 12px', fontSize: 13, color: C_TEXT_PRIMARY, cursor: 'pointer' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Panel chính — checklist Nội/Ngoại thành của tỉnh đang chọn */}
            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              {!selectedUrbanConfig ? (
                <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, padding: 8 }}>Chọn 1 tỉnh/thành ở danh sách bên trái, hoặc thêm tỉnh mới.</div>
              ) : (
                <div style={{ display: 'flex', gap: 16 }}>
                  <UrbanCategoryColumn
                    label="Nội thành" dotColor="#16A34A"
                    wards={selectedUrbanConfig.wards}
                    search={urbanSearchNoi} onSearchChange={setUrbanSearchNoi}
                    targetIsUrban={true}
                    onToggleWard={(ward) => handleToggleUrbanWardDraft(selectedUrbanConfig.province, ward)}
                    onSelectAll={() => handleSelectAllUrbanWards(selectedUrbanConfig.province, true)}
                  />
                  <UrbanCategoryColumn
                    label="Ngoại thành" dotColor="#7C3AED"
                    wards={selectedUrbanConfig.wards}
                    search={urbanSearchNgoai} onSearchChange={setUrbanSearchNgoai}
                    targetIsUrban={false}
                    onToggleWard={(ward) => handleToggleUrbanWardDraft(selectedUrbanConfig.province, ward)}
                    onSelectAll={() => handleSelectAllUrbanWards(selectedUrbanConfig.province, false)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Lưu RIÊNG "Nội & ngoại thành" — Vùng miền/Tuyến KHÔNG bị ảnh hưởng, vẫn giữ nguyên
              theo bộ đang áp dụng cho tới khi tự lưu riêng ở đúng khối của chúng. */}
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
              💾 Lưu thay đổi (tạo bộ mới)
            </button>
          </div>
        </div>

      </div>

      {/* ── Modal "Khoá tuyến" — TÁCH RIÊNG khỏi "Cấu hình tuyến" ở trên, lưu bằng 1 nút Lưu
          RIÊNG, độc lập với draft Vùng miền/Tuyến/Nội-Ngoại thành đang dở. ── */}
      {lockModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, width: 'min(900px, 92vw)', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: C_TEXT_PRIMARY }}>Khoá tuyến</span>
              <button
                onClick={() => setLockModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: C_TEXT_SECONDARY, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '10px 20px 0', fontSize: 12.5, color: C_TEXT_SECONDARY }}>
              Đã khoá {lockDraftRouteNames.size + lockDraftPairKeys.size}. Bấm vào tên tuyến để khoá/mở khoá CẢ tuyến, bấm vào 1 cặp vùng miền để khoá/mở khoá riêng cặp đó.
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 20px' }}>
              {lockModalRouteNames.length === 0 ? (
                <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, textAlign: 'center', padding: '24px 0' }}>Chưa có tuyến nào ngoài "Nội Tỉnh" để khoá.</div>
              ) : (
                <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', padding: '8px 12px', background: C_BG_HEADER, fontSize: 12, color: C_TEXT_SECONDARY, fontWeight: 600 }}>
                    <div style={{ flex: '0 0 200px' }}>Tên tuyến</div>
                    <div style={{ flex: 1 }}>Cặp vùng miền</div>
                  </div>
                  {lockModalRouteNames.map((routeName, i) => {
                    const routeLocked = lockDraftRouteNames.has(routeName)
                    const pairs = lockModalRegionPairs.filter(([a, b]) => activeVersion.routeMatrix[pairKey(a.id, b.id)] === routeName)
                    return (
                      <div
                        key={routeName}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderTop: i === 0 ? 'none' : `1px solid ${C_BORDER}` }}
                      >
                        <div style={{ flex: '0 0 200px' }}>
                          <button
                            onClick={() => toggleLockDraftRoute(routeName)}
                            title={routeLocked ? 'Mở khoá cả tuyến này' : 'Khoá cả tuyến — không cho đổi tên hay thêm/bớt cặp miền khỏi tuyến này'}
                            style={{
                              padding: '4px 10px', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              background: routeLocked ? '#FEF2F2' : '#fff',
                              border: `1px solid ${routeLocked ? '#DC2626' : '#FDBA74'}`,
                              color: routeLocked ? '#DC2626' : '#FF5200',
                            }}
                          >
                            {routeName}
                          </button>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {pairs.map(([a, b]) => {
                            const key = pairKey(a.id, b.id)
                            const pairLocked = lockDraftPairKeys.has(key)
                            const label = a.id === b.id ? a.name.replace(' (Đặc biệt)', '') : `${a.name} ↔ ${b.name}`
                            return (
                              <button
                                key={key}
                                onClick={() => toggleLockDraftPair(key)}
                                title={pairLocked ? 'Mở khoá riêng cặp này' : 'Khoá riêng cặp này — không cho đổi sang tuyến khác dù tuyến không bị khoá'}
                                style={{
                                  padding: '4px 10px', borderRadius: 14, fontSize: 12, fontWeight: pairLocked ? 600 : 400, cursor: 'pointer',
                                  background: pairLocked ? '#FEF2F2' : '#fff',
                                  border: `1px solid ${pairLocked ? '#DC2626' : '#93C5FD'}`,
                                  color: pairLocked ? '#DC2626' : '#1D4ED8',
                                }}
                              >
                                {label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px', borderTop: `1px solid ${C_BORDER}` }}>
              <button
                onClick={commitLockDraft}
                style={{ padding: '7px 16px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, color: '#fff', background: '#FF5200', cursor: 'pointer' }}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfigProvider>
  )
}
