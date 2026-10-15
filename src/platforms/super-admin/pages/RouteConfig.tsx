import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { PlusOutlined, CloseOutlined, InfoCircleOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
import { VIETNAM_PROVINCES } from '../../../mock-data/vietnam-provinces'
import {
  routeConfigVersions,
  pairKey,
  updateDraftStructure,
  updateVersionUrbanConfigs,
  updateVersionLocks,
  renameRouteConfigVersion,
  duplicateRouteConfigVersion,
  deleteDraftVersion,
  setActiveRouteConfigVersion,
  publishAndApplyRouteConfigVersion,
  getActiveRouteConfigVersion,
  type RegionDef,
  type UrbanConfig,
  type RouteConfigVersion,
} from '../../../mock-data/routeConfig'

const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'
const C_LINK           = '#3B82F6'
const C_PUB            = '#12784A'
const C_PUB_BG         = '#DCF3E7'
const C_DRAFT          = '#8A6100'
const C_DRAFT_BG       = '#FDF3D9'

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
  const { id } = useParams<{ id: string }>()

  // Bộ đang xem/sửa — xác định qua :id trên URL (KHÁC bản trước luôn sửa "bộ đang áp dụng"). Nếu
  // không tìm thấy (id sai/đã xoá), fallback bộ đầu tiên để không crash trang.
  const [bundle, setBundle] = useState<RouteConfigVersion>(
    () => routeConfigVersions.find((v) => v.id === id) ?? routeConfigVersions[0]
  )
  const isPublished = bundle.status === 'published'
  const isActive = bundle.id === getActiveRouteConfigVersion().id

  // Mỗi khối (Vùng miền/Tuyến/Nội-Ngoại thành) mặc định hiện DẠNG XEM (pill, không phải ô nhập) —
  // bấm "✏️ Chỉnh sửa" mới chuyển sang ô nhập. Vùng miền/Tuyến: nút Chỉnh sửa chỉ hiện khi bộ còn
  // Nháp (Đã phát hành thì khoá vĩnh viễn, không có đường vào edit mode). Nội-Ngoại thành: nút luôn
  // hiện bất kể trạng thái.
  const [regionsEditing, setRegionsEditing] = useState(false)
  const [tuyenEditing, setTuyenEditing] = useState(false)
  const [urbanEditing, setUrbanEditing] = useState(false)

  // ── Vùng miền, Tuyến, Nội/Ngoại thành mỗi phần có 1 DRAFT + nút Lưu/Huỷ RIÊNG — lưu phần nào
  // chỉ sửa TẠI CHỖ đúng phần đó trên CHÍNH bộ đang xem (không sinh bộ mới nữa — khác bản trước).
  // Deep-copy để React nhận diện mutation qua setState.
  const [regionsDraft, setRegionsDraft] = useState<RegionDef[]>(() =>
    bundle.regions.map((r) => ({ ...r, provinces: [...r.provinces] }))
  )
  const [matrixDraft, setMatrixDraft] = useState<Record<string, string>>(() => ({ ...bundle.routeMatrix }))
  // Danh sách tên tuyến (Bước 2) — độc lập với matrixDraft để 1 tuyến mới thêm vẫn hiện được dù
  // chưa tick cặp miền nào (matrixDraft chỉ lưu các cặp ĐÃ gán).
  const [routeNames, setRouteNames] = useState<string[]>(() =>
    Array.from(new Set(Object.values(bundle.routeMatrix)))
  )
  // Khoá đúng 1 CẶP vùng miền (pairKey) — KHÔNG có khoá "cả tuyến" (cố ý bỏ, chỉ giữ khoá mịn theo
  // từng cặp). Bấm trực tiếp icon khoá cạnh mỗi chip cặp ĐÃ GÁN (checked) trong bảng "Cấu hình tuyến".
  const [lockedPairKeys, setLockedPairKeys] = useState<Set<string>>(
    () => new Set(bundle.lockedPairKeys ?? [])
  )
  const [toast, setToast] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 2000)
  }
  const [urbanDraft, setUrbanDraft] = useState<UrbanConfig[]>(() =>
    bundle.urbanConfigs.map((u) => ({ ...u, wards: u.wards.map((w) => ({ ...w })) }))
  )

  // Khoá/mở khoá riêng 1 cặp vùng miền LƯU NGAY trên CHÍNH bộ đang xem — cho phép ở cả Nháp lẫn Đã
  // phát hành (xem bảng quyền thao tác), không đụng Vùng miền/Tuyến nên không bị chặn bởi isPublished.
  // Gọi trực tiếp từ icon khoá cạnh mỗi chip cặp đã gán.
  const togglePairLock = (key: string) => {
    const next = new Set(lockedPairKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    const updated = updateVersionLocks(bundle.id, Array.from(next))
    if (updated) setBundle(updated)
    setLockedPairKeys(next)
    showToast('Lưu thay đổi thành công')
  }

  const [selectedUrbanProvince, setSelectedUrbanProvince] = useState<string | null>(
    () => bundle.urbanConfigs[0]?.province ?? null
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
  const hasRegionChanges = JSON.stringify(regionsDraft) !== JSON.stringify(bundle.regions)
  const hasTuyenChanges  = JSON.stringify(matrixDraft) !== JSON.stringify(bundle.routeMatrix)
  const hasUrbanChanges  = JSON.stringify(urbanDraft) !== JSON.stringify(bundle.urbanConfigs)

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

  // Mọi cặp miền có thể có (kể cả đường chéo = cùng miền, khác tỉnh) — dựa trên `regionsDraft`
  // (có thể có vùng miền vừa thêm/sửa NHƯNG CHƯA LƯU).
  const allRegionPairs = regionsDraft.flatMap((a, i) => regionsDraft.slice(i).map((b) => [a, b] as const))
  const unconfiguredPairs = allRegionPairs.filter(([a, b]) => !matrixDraft[pairKey(a.id, b.id)])
  // "Nội Tỉnh" luôn lên đầu danh sách tên tuyến — dùng chung cho cả render từng dòng tuyến lẫn
  // dropdown "Gán vào tuyến..." ở khối cặp miền chưa gán.
  const uniqueRouteNames = Array.from(new Set(routeNames))
  const orderedNames = uniqueRouteNames.includes('Nội Tỉnh')
    ? ['Nội Tỉnh', ...uniqueRouteNames.filter((n) => n !== 'Nội Tỉnh')]
    : uniqueRouteNames

  // ── Handlers — CHỈ sửa draft cục bộ; Vùng miền/Tuyến bị chặn hẳn khi bộ đã phát hành (cấu trúc
  // khoá vĩnh viễn, muốn sửa phải Nhân bản ra bộ nháp mới ở "Danh sách bộ vùng tuyến"). ──────────

  const handleAddRegion = () => {
    if (isPublished) return
    const newRegion: RegionDef = { id: `region_${Date.now()}`, name: '', provinces: [] }
    setRegionsDraft((prev) => [...prev, newRegion])
    setMatrixDraft((prev) => ({ ...prev, [pairKey(newRegion.id, newRegion.id)]: 'Nội Tỉnh' }))
  }

  const handleRenameRegion = (id: string, name: string) => {
    if (isPublished) return
    setRegionsDraft((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)))
  }

  const handleDeleteRegion = (id: string) => {
    if (isPublished) return
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
    if (isPublished) return
    setRegionsDraft((prev) =>
      prev.map((r) => ({ ...r, provinces: r.provinces.filter((p) => p !== province) }))
        .map((r) => (r.id === regionId ? { ...r, provinces: [...r.provinces, province] } : r))
    )
  }

  const handleRemoveProvince = (province: string, regionId: string) => {
    if (isPublished) return
    setRegionsDraft((prev) =>
      prev.map((r) =>
        r.id === regionId ? { ...r, provinces: r.provinces.filter((p) => p !== province) } : r
      )
    )
  }

  const cancelRegionsDraft = () => {
    setRegionsDraft(bundle.regions.map((r) => ({ ...r, provinces: [...r.provinces] })))
    setRegionsEditing(false)
  }

  // Lưu RIÊNG "Cấu hình vùng miền" TẠI CHỖ trên CHÍNH bộ đang xem — Tuyến ở cùng bước lưu (2 phần
  // này dùng chung 1 hàm updateDraftStructure vì routeMatrix phụ thuộc regions). Nội-Ngoại thành
  // không bị ảnh hưởng. KHÔNG còn tạo bộ mới — chỉ còn gọi được khi bundle đang là Nháp.
  const commitRegionsDraft = () => {
    const updated = updateDraftStructure(bundle.id, regionsDraft, matrixDraft)
    if (!updated) return
    setBundle(updated)
    setRegionsEditing(false)
    showToast('Lưu thay đổi thành công')
  }

  const handleAddTuyen = () => {
    if (isPublished) return
    // routeNames dedupe qua Set (giữ nguyên hành vi cũ tránh hiện trùng tên) — nếu đã có dòng
    // trống trước đó, thêm khoảng trắng để 2 dòng trống không bị Set gộp làm 1 (trim() vẫn coi
    // là rỗng nên validate "Ít nhất 2 ký tự" không bị ảnh hưởng).
    setRouteNames((prev) => {
      const blankCount = prev.filter((n) => n.trim() === '').length
      return [...prev, ' '.repeat(blankCount)]
    })
  }

  const handleRenameTuyen = (oldName: string, newName: string) => {
    if (isPublished || oldName === 'Nội Tỉnh') return
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
    if (isPublished || name === 'Nội Tỉnh') return
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
    if (isPublished) return
    const key = pairKey(regionIdA, regionIdB)
    // Cặp bị khoá RIÊNG (lockedPairKeys) — không cho đổi cặp này sang tuyến khác.
    if (lockedPairKeys.has(key)) return
    setMatrixDraft((prev) => {
      const next = { ...prev }
      if (next[key] === routeName) delete next[key]
      else next[key] = routeName
      return next
    })
  }

  const cancelTuyenDraft = () => {
    setMatrixDraft({ ...bundle.routeMatrix })
    setRouteNames(Array.from(new Set(Object.values(bundle.routeMatrix))))
    setTuyenEditing(false)
  }

  // Lưu RIÊNG "Cấu hình tuyến" TẠI CHỖ — dùng chung updateDraftStructure với Vùng miền (routeMatrix
  // phụ thuộc đúng bộ regions hiện tại của bundle, không phải regionsDraft có thể đang dở ở trên).
  const commitTuyenDraft = () => {
    const updated = updateDraftStructure(bundle.id, bundle.regions, matrixDraft)
    if (!updated) return
    setBundle(updated)
    setTuyenEditing(false)
    showToast('Lưu thay đổi thành công')
  }

  // ── Nội thành / Ngoại thành — draft + Lưu/Huỷ RIÊNG, cho phép ở CẢ Nháp lẫn Đã phát hành. ──

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
    setUrbanDraft(bundle.urbanConfigs.map((u) => ({ ...u, wards: u.wards.map((w) => ({ ...w })) })))
    setUrbanEditing(false)
  }

  // Lưu RIÊNG "Cấu hình nội & ngoại thành" TẠI CHỖ — cho phép bất kể Nháp hay Đã phát hành.
  const commitUrbanDraft = () => {
    const updated = updateVersionUrbanConfigs(bundle.id, urbanDraft)
    if (!updated) return
    setBundle(updated)
    setUrbanEditing(false)
    showToast('Lưu thay đổi thành công')
  }

  // Gộp "Phát hành" + "Áp dụng cho toàn hệ thống" thành 1 hành động duy nhất cho bộ Nháp (không còn
  // nút Phát hành riêng) — xác nhận 1 lần, sau đó bộ vừa khoá cấu trúc vừa trở thành mặc định toàn
  // hệ thống luôn. Với bộ Đã phát hành nhưng chưa active, hành động chỉ còn là "Áp dụng" (như cũ).
  const handleApplySystemWide = () => {
    if (isActive) return
    if (!isPublished) {
      if (hasRegionChanges || hasTuyenChanges) {
        window.alert('Bạn đang có thay đổi Vùng miền/Tuyến chưa lưu — hãy Lưu hoặc Huỷ bỏ trước khi phát hành.')
        return
      }
      const ok = window.confirm(`Phát hành và áp dụng bộ "${bundle.label}" cho TOÀN HỆ THỐNG? Vùng miền/Tuyến sẽ khoá vĩnh viễn (không sửa lại được), và toàn bộ ứng dụng sẽ dùng ngay dữ liệu của bộ này. Hành động không có đường quay lại.`)
      if (!ok) return
      const result = publishAndApplyRouteConfigVersion(bundle.id)
      if (!result.ok) {
        window.alert(result.error)
        return
      }
      setBundle(result.version)
      // Vùng miền/Tuyến khoá vĩnh viễn sau khi phát hành — thoát hẳn chế độ sửa của 2 khối này,
      // không để lại UI sửa/Lưu thay đổi cho 1 bộ đã không còn sửa được nữa.
      setRegionsEditing(false)
      setTuyenEditing(false)
      showToast('Đã phát hành và áp dụng cho toàn hệ thống')
      return
    }
    const ok = window.confirm(`Áp dụng "${bundle.label}" cho TOÀN HỆ THỐNG? Toàn bộ ứng dụng (bảng giá, tạo đơn, kiểm tra tuyến...) sẽ dùng ngay dữ liệu của bộ này thay cho bộ đang áp dụng hiện tại.`)
    if (!ok) return
    const updated = setActiveRouteConfigVersion(bundle.id)
    if (!updated) return
    setBundle(updated)
    showToast('Đã áp dụng cho toàn hệ thống')
  }

  const handleRename = () => {
    const next = window.prompt('Đổi tên bộ vùng tuyến:', bundle.label)
    if (next === null) return
    const updated = renameRouteConfigVersion(bundle.id, next)
    if (!updated) return
    setBundle(updated)
    showToast('Đã đổi tên')
  }

  const handleDuplicate = () => {
    const name = window.prompt('Tên bộ mới:', `${bundle.label} (bản sao)`)
    if (name === null) return
    const created = duplicateRouteConfigVersion(bundle.id, name)
    if (!created) return
    navigate(`/super-admin/route-config/edit/${created.id}`)
  }

  const handleDeleteDraft = () => {
    const ok = window.confirm(`Xoá hẳn bộ Nháp "${bundle.label}"? Không thể khôi phục lại.`)
    if (!ok) return
    const deleted = deleteDraftVersion(bundle.id)
    if (!deleted) return
    navigate('/super-admin/route-config')
  }

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: C_TEXT_PRIMARY, margin: 0 }}>
                Chỉnh sửa: {bundle.label}
              </h1>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10,
                color: isPublished ? C_PUB : C_DRAFT,
                background: isPublished ? C_PUB_BG : C_DRAFT_BG,
              }}>
                {isPublished ? 'Hoạt động' : 'Nháp'}
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: C_TEXT_SECONDARY, margin: '2px 0 0' }}>
              {isPublished
                ? 'Bộ đã phát hành — Vùng miền/Tuyến bị khoá vĩnh viễn. Vẫn sửa được Nội-Ngoại thành và khoá/mở từng tuyến.'
                : 'Bộ Nháp — mọi thay đổi lưu TẠI CHỖ trên chính bộ này, không sinh bộ mới. Bấm "Áp dụng toàn bộ hệ thống" khi đã sửa xong.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            {/* Toggle "Hiển thị mặc định" — giống hệt pattern ở trang danh sách (GSA-ROUTE-13):
                bộ đang active thì bật+disabled; bộ Đã phát hành chưa active thì tắt, bấm vào Áp
                dụng ngay; bộ Nháp thì tắt+disabled (không bao giờ áp dụng trực tiếp qua toggle). */}
            <div
              onClick={() => { if (isPublished && !isActive) handleApplySystemWide() }}
              title={
                isActive ? 'Bộ đang áp dụng — không thể tự tắt, muốn đổi thì bật mặc định cho 1 bộ khác'
                  : !isPublished ? 'Bộ Nháp chưa phát hành — không áp dụng được'
                  : 'Bật để áp dụng bộ này cho toàn hệ thống'
              }
              style={{
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                cursor: isActive || !isPublished ? 'not-allowed' : 'pointer',
              }}
            >
              <div style={{
                width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                background: isActive ? '#16A34A' : '#D1D5DB',
                opacity: !isPublished && !isActive ? 0.4 : 1,
                position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, transition: 'left 0.2s', left: isActive ? 18 : 2, boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize: 12.5, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>Hiển thị mặc định</span>
            </div>

            {!isPublished && (
              <button
                onClick={handleApplySystemWide}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                  background: '#111827', border: 'none', borderRadius: 6,
                  cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
                }}
              >
                ⚡ Áp dụng toàn bộ hệ thống
              </button>
            )}
            {!isPublished && (
              <button
                onClick={handleDeleteDraft}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
                  cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#EF4444', whiteSpace: 'nowrap',
                }}
              >
                🗑 Xoá
              </button>
            )}
            <button
              onClick={handleRename}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
                cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap',
              }}
            >
              ✏️ Đổi tên
            </button>
            <button
              onClick={handleDuplicate}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
                cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap',
              }}
            >
              📋 Nhân bản
            </button>
            <button
              onClick={() => window.location.reload()}
              title="Tải lại toàn bộ dữ liệu về trạng thái mẫu ban đầu (mất mọi thay đổi trong phiên này)"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
                cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap',
              }}
            >
              ↻ Thiết lập lại
            </button>
          </div>
        </div>

        {/* ── Banner "đã khoá cấu trúc" khi bộ đã phát hành ── */}
        {isPublished && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C_PUB_BG, color: C_TEXT_PRIMARY, borderRadius: 8, padding: '12px 14px', fontSize: 13.5, marginTop: 10 }}>
            <span>🔒</span>
            <span>
              <b style={{ color: C_PUB }}>Bộ đã phát hành.</b> Không sửa được Vùng miền và Tuyến. Bạn vẫn có thể khoá/mở tuyến và chỉnh Nội/Ngoại thành. Muốn thay đổi cấu trúc thì nhân bản bộ này ở "Danh sách bộ vùng tuyến".
            </span>
          </div>
        )}

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
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>🗺️ Cấu hình vùng miền</span>
              <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
                {isPublished ? 'Đã khoá — bộ đã phát hành.' : regionsEditing ? 'Đã điền sẵn theo quy tắc GHN hiện tại — chỉ cần sửa khi có ngoại lệ.' : 'Bấm "Chỉnh sửa" để thêm/sửa vùng miền và tỉnh/thành.'}
              </div>
            </div>
            {!isPublished && !regionsEditing && (
              <button
                onClick={() => setRegionsEditing(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', flexShrink: 0,
                  background: '#111827', border: 'none', borderRadius: 6,
                  cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#fff',
                }}
              >
                ✏️ Chỉnh sửa
              </button>
            )}
          </div>

          {!regionsEditing ? (
            /* ── Dạng XEM — pill, không có input/nút thao tác nào ── */
            <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', background: C_BG_HEADER }}>
                <div style={{ flex: '0 0 220px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Tên vùng miền</div>
                <div style={{ flex: 1, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Tỉnh/Thành phố</div>
              </div>
              {bundle.regions.map((region, i) => (
                <div
                  key={region.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', padding: '8px 12px', gap: 8,
                    borderTop: i === 0 ? 'none' : `1px solid ${C_BORDER}`,
                  }}
                >
                  <div style={{ flex: '0 0 220px' }}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: 13, fontWeight: 700 }}>
                      {region.name || '(chưa đặt tên)'}
                    </span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {region.provinces.map((p) => (
                      <span key={p} style={{ padding: '3px 8px', borderRadius: 12, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: 12, fontWeight: 600 }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
                      disabled={isPublished}
                      style={{
                        ...inputStyle, fontWeight: 700, width: '100%',
                        borderColor: nameError ? '#EF4444' : C_BORDER,
                        background: isPublished ? '#F3F4F6' : '#fff',
                        cursor: isPublished ? 'not-allowed' : 'text',
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
                          {!isPublished && (
                            <CloseOutlined
                              style={{ fontSize: 10, cursor: 'pointer' }}
                              onClick={() => handleRemoveProvince(p, region.id)}
                            />
                          )}
                        </span>
                      ))}
                    </div>
                    {!isPublished && unassignedList.length > 0 && (
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

                  {!isPublished && (
                    <button
                      onClick={() => handleDeleteRegion(region.id)}
                      style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', flexShrink: 0 }}
                      title="Xoá miền"
                    >
                      <CloseOutlined />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          )}

          {regionsEditing && (
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
          )}

          {unassignedList.length > 0 && (
            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
              {unassignedList.length} tỉnh chưa được gán vùng miền: {unassignedList.slice(0, 10).join(', ')}{unassignedList.length > 10 ? ` và ${unassignedList.length - 10} tỉnh khác` : ''}
            </span>
          )}

          {regionsEditing && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: `1px solid ${C_BORDER}`, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
                {hasRegionChanges ? 'Có thay đổi chưa lưu ở Vùng miền.' : 'Đã lưu — không có thay đổi nào ở Vùng miền.'}
              </span>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={cancelRegionsDraft}
                  style={{
                    padding: '7px 16px', borderRadius: 6, border: `1px solid ${C_BORDER}`, fontSize: 13, fontWeight: 600,
                    background: '#fff', color: C_TEXT_PRIMARY, cursor: 'pointer',
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
                  💾 Lưu thay đổi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Cấu hình tuyến ── */}
        <div style={{ ...cardStyle, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>🔀 Cấu hình tuyến</span>
              <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
                {isPublished ? 'Gán cặp miền đã khoá — chỉ còn icon khoá/mở khoá tuyến dùng được.' : tuyenEditing ? 'Nhiều dòng có thể dùng chung 1 tuyến nếu muốn tính cùng 1 mức giá.' : 'Bấm "Chỉnh sửa" để thêm/sửa tuyến và gán cặp vùng miền. Icon khoá luôn dùng được kể cả khi không ở chế độ sửa.'}
              </div>
            </div>
            {!isPublished && !tuyenEditing && (
              <button
                onClick={() => setTuyenEditing(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', flexShrink: 0,
                  background: '#111827', border: 'none', borderRadius: 6,
                  cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#fff',
                }}
              >
                ✏️ Chỉnh sửa
              </button>
            )}
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
                // Chỉ cho sửa tên/thêm/bớt cặp/xoá tuyến khi bộ Nháp VÀ đang ở chế độ Chỉnh sửa —
                // icon khoá/mở khoá riêng cặp thì KHÔNG bị chi phối bởi cờ này (luôn dùng được).
                const tuyenReadOnly = isPublished || !tuyenEditing
                return orderedNames.map((name, i) => {
                  const isNoiTinh = name === 'Nội Tỉnh'
                  // Tuyến chứa ít nhất 1 cặp bị khoá RIÊNG — chặn xoá tuyến (xem handleDeleteTuyen,
                  // tránh orphan khoá).
                  const hasLockedPair = Object.entries(matrixDraft).some(([key, routeName]) => routeName === name && lockedPairKeys.has(key))
                  const nameError = isNoiTinh ? null : tuyenNameError(name)
                  return (
                    <div
                      key={`${name}__${i}`}
                      style={{
                        display: 'flex', alignItems: 'flex-start', padding: '8px 12px', gap: 8,
                        borderTop: i === 0 ? 'none' : `1px solid ${C_BORDER}`,
                        background: isNoiTinh ? '#FFF4ED' : 'transparent',
                      }}
                    >
                      <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {isNoiTinh || tuyenReadOnly ? (
                          <span
                            style={{
                              alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 12,
                              fontSize: 13, fontWeight: 700, background: '#FFEAD9', border: '1px solid #FDBA74', color: '#FF5200',
                            }}
                          >
                            {isNoiTinh ? 'Nội Tỉnh' : name}
                          </span>
                        ) : (
                          <>
                            <input
                              value={name}
                              onChange={(e) => handleRenameTuyen(name, e.target.value)}
                              placeholder="Tên tuyến"
                              style={{
                                ...inputStyle, fontWeight: 700, width: '100%', borderColor: nameError ? '#EF4444' : C_BORDER,
                                background: '#fff', color: C_TEXT_PRIMARY, cursor: 'text',
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
                          // Chỉ hiện chip cho cặp ĐÃ GÁN tuyến này (checked) — cặp chưa gán không còn
                          // vẽ la liệt trên mọi dòng tuyến (rối mắt), mà gộp vào khối "chưa được gán
                          // tuyến" ở cuối bảng, gán qua dropdown tại đó (xem unconfiguredPairs bên dưới).
                          (() => {
                            const assignedPairs = allRegionPairs.filter(([a, b]) => matrixDraft[pairKey(a.id, b.id)] === name)
                            if (assignedPairs.length === 0) {
                              return <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, fontStyle: 'italic' }}>Chưa có cặp vùng miền nào</span>
                            }
                            return assignedPairs.map(([a, b]) => {
                              const key = pairKey(a.id, b.id)
                              const pairLocked = lockedPairKeys.has(key)
                              const chipDisabled = tuyenReadOnly
                              const chipLabel = a.id === b.id ? a.name.replace(' (Đặc biệt)', '') : `${a.name} ↔ ${b.name}`
                              return (
                                <div
                                  key={key}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', borderRadius: 14, overflow: 'hidden',
                                    border: `1px solid ${pairLocked ? '#FCA5A5' : '#BFDBFE'}`,
                                  }}
                                >
                                  {/* Icon khoá riêng cặp này — luôn hiện vì chip ở đây đã chắc chắn được
                                      gán, dùng được bất kể isPublished. */}
                                  <button
                                    onClick={() => togglePairLock(key)}
                                    title={pairLocked ? 'Mở khoá riêng cặp này' : 'Khoá riêng cặp này — không cho đổi sang tuyến khác dù tuyến không bị khoá'}
                                    style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, alignSelf: 'stretch',
                                      border: 'none', borderRight: `1px solid ${pairLocked ? '#FCA5A5' : '#BFDBFE'}`, cursor: 'pointer',
                                      background: pairLocked ? '#FEE2E2' : '#EFF6FF', color: pairLocked ? '#DC2626' : C_LINK, fontSize: 11,
                                    }}
                                  >
                                    {pairLocked ? <LockOutlined /> : <UnlockOutlined />}
                                  </button>
                                  <button
                                    onClick={() => handleToggleChip(name, a.id, b.id)}
                                    disabled={chipDisabled || pairLocked}
                                    title={pairLocked ? `Cặp "${chipLabel}" đã bị khoá riêng — bấm icon khoá cạnh chip để mở` : isPublished ? 'Bộ đã phát hành — không sửa được' : !tuyenEditing ? 'Bấm "Chỉnh sửa" để gỡ cặp này khỏi tuyến' : 'Bấm để gỡ cặp này khỏi tuyến'}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', border: 'none',
                                      fontSize: 12, fontWeight: 600, cursor: (chipDisabled || pairLocked) ? 'not-allowed' : 'pointer',
                                      background: pairLocked ? '#FEF2F2' : '#EFF6FF', color: pairLocked ? '#DC2626' : C_LINK,
                                    }}
                                  >
                                    {chipLabel}
                                  </button>
                                </div>
                              )
                            })
                          })()
                        )}
                      </div>
                      <div style={{ flex: '0 0 28px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {!isNoiTinh && !tuyenReadOnly && (
                          <button
                            onClick={() => handleDeleteTuyen(name)}
                            disabled={hasLockedPair}
                            style={{ border: 'none', background: 'transparent', color: hasLockedPair ? '#D1D5DB' : '#EF4444', cursor: hasLockedPair ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                            title={hasLockedPair ? 'Tuyến đang chứa cặp miền bị khoá riêng — mở khoá cặp đó trước khi xoá' : 'Xoá tuyến'}
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

          {tuyenEditing && (
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
          )}

          {unconfiguredPairs.length > 0 && (
            !tuyenEditing ? (
              <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
                {unconfiguredPairs.length} cặp vùng miền chưa được gán tuyến: {unconfiguredPairs.slice(0, 6).map(([a, b]) => (a.id === b.id ? a.name : `${a.name} ↔ ${b.name}`)).join(', ')}{unconfiguredPairs.length > 6 ? ` và ${unconfiguredPairs.length - 6} cặp khác` : ''}
              </span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', background: '#F9FAFB', border: `1px solid ${C_BORDER}`, borderRadius: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C_TEXT_SECONDARY }}>
                  {unconfiguredPairs.length} cặp vùng miền chưa được gán tuyến
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {unconfiguredPairs.map(([a, b]) => {
                    const key = pairKey(a.id, b.id)
                    const label = a.id === b.id ? a.name : `${a.name} ↔ ${b.name}`
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 14 }}>
                        <span style={{ fontSize: 12, color: C_TEXT_PRIMARY }}>{label}</span>
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) handleToggleChip(e.target.value, a.id, b.id) }}
                          style={{ fontSize: 11, fontWeight: 600, border: 'none', background: 'transparent', color: C_LINK, cursor: 'pointer', outline: 'none' }}
                        >
                          <option value="" disabled>Gán vào tuyến...</option>
                          {orderedNames.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          )}

          {tuyenEditing && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: `1px solid ${C_BORDER}`, marginTop: 4 }}>
              <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
                {hasTuyenChanges ? 'Có thay đổi chưa lưu ở Tuyến.' : `Đang sửa: ${bundle.label}`}
              </span>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={cancelTuyenDraft}
                  style={{
                    padding: '7px 16px', borderRadius: 6, border: `1px solid ${C_BORDER}`, fontSize: 13, fontWeight: 600,
                    background: '#fff', color: C_TEXT_PRIMARY, cursor: 'pointer',
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
                  💾 Lưu thay đổi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Cấu hình nội & ngoại thành — sidebar chọn tỉnh + 2 cột checklist, draft + Lưu/Huỷ
            RIÊNG (urbanDraft). Luôn sửa được kể cả khi bộ đã phát hành — nút Chỉnh sửa luôn hiện
            bất kể trạng thái Nháp/Đã phát hành (khác Vùng miền/Tuyến). ── */}
        <div style={{ ...cardStyle, marginTop: 12, padding: 0, gap: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>🏙️ Cấu hình nội &amp; ngoại thành</span>
              <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
                Theo xã/phường (địa giới mới sau sáp nhập 2025, cấp quận/huyện không còn) — chỉ vài
                thành phố có phân biệt giá Nội/Ngoại thành, dùng cho toggle "Tách khu vực" khi tạo
                bảng giá. Dữ liệu demo minh hoạ, chưa đầy đủ toàn bộ xã/phường thật.
              </div>
            </div>
            {!urbanEditing && (
              <button
                onClick={() => setUrbanEditing(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', flexShrink: 0,
                  background: '#111827', border: 'none', borderRadius: 6,
                  cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#fff',
                }}
              >
                ✏️ Chỉnh sửa
              </button>
            )}
          </div>

          {!urbanEditing ? (
            /* ── Dạng XEM — sidebar tỉnh (chỉ xem) + danh sách xã/phường theo Nội/Ngoại thành ── */
            <div style={{ display: 'flex', borderTop: `1px solid ${C_BORDER}`, minHeight: 240 }}>
              <div style={{ flex: '0 0 200px', borderRight: `1px solid ${C_BORDER}` }}>
                <div style={{ padding: '10px 12px 6px', fontSize: 12, color: C_TEXT_SECONDARY }}>Tỉnh/Thành</div>
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
                        padding: '8px 12px', cursor: 'pointer',
                        background: selected ? '#FFF4ED' : 'transparent',
                        color: selected ? '#FF5200' : C_TEXT_PRIMARY,
                        fontWeight: selected ? 700 : 400, fontSize: 13,
                        borderLeft: `3px solid ${selected ? '#FF5200' : 'transparent'}`,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}
                    >
                      {cfg.province}
                    </div>
                  )
                })}
              </div>
              <div style={{ flex: 1, padding: 16, minWidth: 0 }}>
                {!selectedUrbanConfig ? (
                  <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, padding: 8 }}>Chọn 1 tỉnh/thành ở danh sách bên trái.</div>
                ) : (
                  <div style={{ display: 'flex', gap: 16 }}>
                    {([
                      { label: 'Nội thành', dot: '#16A34A', isUrban: true },
                      { label: 'Ngoại thành', dot: '#7C3AED', isUrban: false },
                    ] as const).map((col) => {
                      const wards = selectedUrbanConfig.wards.filter((w) => w.isUrban === col.isUrban)
                      return (
                        <div key={col.label} style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: 4, background: col.dot, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: C_TEXT_PRIMARY }}>{col.label}</span>
                            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>{wards.length} phường/xã</span>
                          </div>
                          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, maxHeight: 280, overflowY: 'auto' }}>
                            {wards.length === 0 && (
                              <div style={{ padding: '10px 12px', fontSize: 12, color: C_TEXT_SECONDARY }}>Không có phường/xã nào.</div>
                            )}
                            {wards.map((w) => (
                              <div key={w.ward} style={{ padding: '6px 10px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 13, color: C_TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {w.ward}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
          <>
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

          {/* Lưu RIÊNG "Nội & ngoại thành" — Vùng miền/Tuyến KHÔNG bị ảnh hưởng. */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: `1px solid ${C_BORDER}`, background: C_BG_HEADER }}>
            <button
              onClick={cancelUrbanDraft}
              style={{
                padding: '7px 16px', borderRadius: 6, border: `1px solid ${C_BORDER}`, fontSize: 13, fontWeight: 600,
                background: '#fff', color: C_TEXT_PRIMARY, cursor: 'pointer',
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
          </>
          )}
        </div>

      </div>

      {/* Toast "Lưu thay đổi thành công" — hiện khi khoá/mở khoá tuyến hoặc phát hành, tự ẩn sau 2s. */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8,
          background: '#111827', color: '#fff', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          ✅ {toast}
        </div>
      )}
    </ConfigProvider>
  )
}
