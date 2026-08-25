import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons'
import { agencyAdminTheme } from '../../../theme/platforms'
import { VIETNAM_PROVINCES } from '../../../mock-data/vietnam-provinces'
import {
  regions,
  routeMatrix,
  sameProvinceRoute,
  setSameProvinceRoute,
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
  type RegionDef,
} from '../../../mock-data/routeConfig'

const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// Full canonical list — all Vietnam provinces
const ALL_PROVINCES = VIETNAM_PROVINCES.map((p) => p.name)

const cardStyle: React.CSSProperties = {
  background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 12,
  padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 10px',
  fontSize: 14, color: C_TEXT_PRIMARY, outline: 'none',
}

export default function RouteConfig() {
  const navigate = useNavigate()

  // ── Local state seeded from shared store ──────────────────────────────────
  // Deep-copy so React detects mutations via setState
  const [localRegions, setLocalRegions] = useState<RegionDef[]>(() =>
    regions.map((r) => ({ ...r, provinces: [...r.provinces] }))
  )
  const [localMatrix, setLocalMatrix] = useState<Record<string, string>>(() => ({ ...routeMatrix }))
  const [localSameRoute, setLocalSameRoute] = useState(sameProvinceRoute)
  // Danh sách tên tuyến (Bước 2) — độc lập với localMatrix để 1 tuyến mới thêm vẫn hiện
  // được dù chưa tick cặp miền nào (localMatrix chỉ lưu các cặp ĐÃ gán).
  const [routeNames, setRouteNames] = useState<string[]>(() =>
    Array.from(new Set(Object.values(routeMatrix)))
  )

  const assignedSet    = new Set(localRegions.flatMap((r) => r.provinces))
  const unassignedList = ALL_PROVINCES.filter((p) => !assignedSet.has(p))

  // Mọi cặp miền có thể có (kể cả đường chéo = cùng miền, khác tỉnh)
  const allRegionPairs = localRegions.flatMap((a, i) => localRegions.slice(i).map((b) => [a, b] as const))
  const unconfiguredPairs = allRegionPairs.filter(([a, b]) => !localMatrix[pairKey(a.id, b.id)])

  // ── Handlers — mutate store first, then setState ──────────────────────────

  const handleAddRegion = () => {
    const newName   = `Miền mới ${localRegions.length + 1}`
    const newRegion = addRegion(newName)
    setLocalRegions((prev) => [...prev, { ...newRegion, provinces: [] }])
  }

  const handleRenameRegion = (id: string, name: string) => {
    renameRegion(id, name)
    setLocalRegions((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)))
  }

  const handleDeleteRegion = (id: string) => {
    deleteRegion(id)
    setLocalRegions((prev) => prev.filter((r) => r.id !== id))
    setLocalMatrix(() => ({ ...routeMatrix }))
  }

  const handleAssignProvince = (province: string, regionId: string) => {
    assignProvinceToRegion(province, regionId)
    // Re-sync from store (province may have been removed from other regions)
    setLocalRegions(() => regions.map((r) => ({ ...r, provinces: [...r.provinces] })))
  }

  const handleRemoveProvince = (province: string, regionId: string) => {
    removeProvinceFromRegion(province, regionId)
    setLocalRegions((prev) =>
      prev.map((r) =>
        r.id === regionId ? { ...r, provinces: r.provinces.filter((p) => p !== province) } : r
      )
    )
  }

  const handleSetSameProvinceRoute = (name: string) => {
    setSameProvinceRoute(name)
    setLocalSameRoute(name)
  }

  const handleAddTuyen = () => {
    setRouteNames((prev) => [...prev, `Tuyến mới ${prev.length + 1}`])
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

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      <div style={{ padding: 24, background: '#fff', minHeight: '100vh', maxWidth: 1100 }}>

        {/* Page header */}
        <div style={{ marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY, margin: 0 }}>
            Cấu hình Vùng &amp; Tuyến
          </h1>
          <p style={{ fontSize: 13, color: C_TEXT_SECONDARY, marginTop: 4 }}>
            Định nghĩa 1 lần, dùng chung cho mọi bảng giá — sửa ở đây áp dụng ngay cho{' '}
            <button
              onClick={() => navigate('/agency-admin/carrier-setup/pricing/create')}
              style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: 13, cursor: 'pointer', padding: 0, fontWeight: 500, textDecoration: 'underline' }}
            >
              Tạo bảng giá
            </button>
            .
          </p>
        </div>

        {/* ── Bước 1: Định nghĩa Miền/Vùng ── */}
        <div style={{ ...cardStyle, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Bước 1 — Định nghĩa Miền / Vùng</span>
              <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
                Đã điền sẵn theo quy tắc GHN hiện tại — chỉ cần sửa khi có ngoại lệ.
              </div>
            </div>
            <button
              onClick={handleAddRegion}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
                cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY,
              }}
            >
              <PlusOutlined style={{ fontSize: 12 }} /> Thêm miền
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {localRegions.map((region) => (
              <div
                key={region.id}
                style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    value={region.name}
                    onChange={(e) => handleRenameRegion(region.id, e.target.value)}
                    style={{ ...inputStyle, fontWeight: 700, flex: '0 0 260px' }}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
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
                    {unassignedList.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => { if (e.target.value) handleAssignProvince(e.target.value, region.id) }}
                        style={{ ...inputStyle, fontSize: 12, padding: '3px 6px', cursor: 'pointer', color: C_TEXT_SECONDARY }}
                      >
                        <option value="">+ Thêm tỉnh</option>
                        {unassignedList.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteRegion(region.id)}
                    style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', flexShrink: 0 }}
                    title="Xoá miền"
                  >
                    <CloseOutlined />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {unassignedList.length > 0 && (
            <div style={{ fontSize: 12, color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6, padding: '6px 10px' }}>
              {unassignedList.length} tỉnh chưa được gán miền: {unassignedList.slice(0, 10).join(', ')}{unassignedList.length > 10 ? ` và ${unassignedList.length - 10} tỉnh khác` : ''} — chưa tra được tuyến cho các tỉnh này.
            </div>
          )}
        </div>

        {/* ── Bước 2: Đặt tên tuyến & phạm vi áp dụng ── */}
        <div style={{ ...cardStyle, marginTop: 16, marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Bước 2 — Đặt tên tuyến &amp; phạm vi áp dụng</span>
            <button
              onClick={handleAddTuyen}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
                cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY,
              }}
            >
              <PlusOutlined style={{ fontSize: 12 }} /> Thêm tuyến
            </button>
          </div>
          <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: -8 }}>
            Mỗi dòng dưới đây = 1 tuyến: đặt tên, rồi tick những cặp miền mà tuyến đó áp dụng. 1 cặp miền chỉ thuộc đúng 1 tuyến; nhiều cặp có thể dùng chung 1 tên nếu muốn tính cùng 1 mức giá.
          </span>

          {/* Nội tỉnh — luật cố định, không nằm trong danh sách tuyến bên dưới */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C_BG_HEADER, borderRadius: 8, padding: '10px 14px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C_TEXT_SECONDARY, background: '#E5E7EB', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>CỐ ĐỊNH</span>
            <input
              value={localSameRoute}
              onChange={(e) => handleSetSameProvinceRoute(e.target.value)}
              style={{ ...inputStyle, fontWeight: 700, width: 160 }}
            />
            <span style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>Phạm vi: cùng 1 tỉnh, bất kỳ miền nào — không cần tick, luôn áp dụng.</span>
          </div>

          {localRegions.length === 0 ? (
            <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, padding: 8 }}>Chưa có miền nào — thêm miền ở Bước 1 trước.</div>
          ) : (
            Array.from(new Set(routeNames)).map((name) => (
              <div key={name} style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    value={name}
                    onChange={(e) => handleRenameTuyen(name, e.target.value)}
                    style={{ ...inputStyle, fontWeight: 700, flex: '0 0 220px' }}
                  />
                  <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, flex: 1 }}>Phạm vi áp dụng — tick cặp miền:</span>
                  <button
                    onClick={() => handleDeleteTuyen(name)}
                    style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', flexShrink: 0 }}
                    title="Xoá tuyến"
                  >
                    <CloseOutlined />
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
              </div>
            ))
          )}

          {unconfiguredPairs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 12px' }}>
              <span style={{ fontSize: 12, color: '#B45309' }}>
                {unconfiguredPairs.length} cặp miền chưa thuộc tuyến nào:{' '}
                {unconfiguredPairs.slice(0, 6).map(([a, b]) => (a.id === b.id ? a.name : `${a.name} ↔ ${b.name}`)).join(', ')}
                {unconfiguredPairs.length > 6 ? ` và ${unconfiguredPairs.length - 6} cặp khác` : ''} — chưa tra được tuyến cho các cặp này.
              </span>
            </div>
          )}
        </div>

      </div>
    </ConfigProvider>
  )
}
