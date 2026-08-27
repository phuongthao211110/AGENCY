import { useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { PlusOutlined, CloseOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
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
  background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 12,
  padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 10px',
  fontSize: 14, color: C_TEXT_PRIMARY, outline: 'none',
}

// Cách hiển thị mới — bảng danh sách theo cặp miền (thay cho danh sách tuyến + tick chip
// ở trang /super-admin/route-config). Cùng đọc/ghi 1 store routeConfig.ts nên 2 trang luôn
// khớp dữ liệu, chỉ khác cách trình bày Bước 2.
export default function RouteConfigTable() {
  const navigate = useNavigate()

  const [localRegions, setLocalRegions] = useState<RegionDef[]>(() =>
    regions.map((r) => ({ ...r, provinces: [...r.provinces] }))
  )
  const [localMatrix, setLocalMatrix] = useState<Record<string, string>>(() => ({ ...routeMatrix }))
  const [localSameRoute, setLocalSameRoute] = useState(sameProvinceRoute)
  const [localUrbanConfigs, setLocalUrbanConfigs] = useState<UrbanConfig[]>(() =>
    urbanConfigs.map((u) => ({ ...u, wards: u.wards.map((w) => ({ ...w })) }))
  )
  const [newProvinceName, setNewProvinceName] = useState('')
  const [newWardInputs, setNewWardInputs] = useState<Record<string, string>>({})

  const assignedSet    = new Set(localRegions.flatMap((r) => r.provinces))
  const unassignedList = ALL_PROVINCES.filter((p) => !assignedSet.has(p))

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

  const handleSetRow = (regionIdA: string, regionIdB: string, value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      clearRouteName(regionIdA, regionIdB)
    } else {
      setRouteName(regionIdA, regionIdB, trimmed)
    }
    setLocalMatrix(() => ({ ...routeMatrix }))
  }

  const syncUrbanConfigs = () => {
    setLocalUrbanConfigs(urbanConfigs.map((u) => ({ ...u, wards: u.wards.map((w) => ({ ...w })) })))
  }

  const handleAddUrbanProvince = () => {
    const name = newProvinceName.trim()
    if (!name) return
    addUrbanProvince(name)
    syncUrbanConfigs()
    setNewProvinceName('')
  }

  const handleRemoveUrbanProvince = (province: string) => {
    removeUrbanProvince(province)
    setLocalUrbanConfigs((prev) => prev.filter((u) => u.province !== province))
  }

  const handleAddUrbanWard = (province: string) => {
    const ward = (newWardInputs[province] ?? '').trim()
    if (!ward) return
    addUrbanWard(province, ward, false)
    syncUrbanConfigs()
    setNewWardInputs((prev) => ({ ...prev, [province]: '' }))
  }

  const handleRemoveUrbanWard = (province: string, ward: string) => {
    removeUrbanWard(province, ward)
    syncUrbanConfigs()
  }

  const handleToggleUrbanWard = (province: string, ward: string) => {
    toggleUrbanWardClassification(province, ward)
    syncUrbanConfigs()
  }

  return (
    <ConfigProvider theme={superAdminTheme}>
      <div style={{ padding: 24, background: '#fff', minHeight: '100vh', maxWidth: 1100 }}>

        {/* Page header */}
        <div style={{ marginBottom: 8 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY, margin: 0 }}>
            Cấu hình Vùng &amp; Tuyến — dạng bảng
          </h1>
          <p style={{ fontSize: 13, color: C_TEXT_SECONDARY, marginTop: 4 }}>
            Cùng dữ liệu với trang{' '}
            <button
              onClick={() => navigate('/super-admin/route-config')}
              style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: 13, cursor: 'pointer', padding: 0, fontWeight: 500, textDecoration: 'underline' }}
            >
              Cấu hình Vùng &amp; Tuyến
            </button>
            {' '}— chỉ khác cách trình bày phần đặt tên tuyến (bảng danh sách thay vì tick chip).
          </p>
        </div>

        {/* ── Giải thích khái niệm — miền / cặp miền / tuyến ── */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
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

        {/* ── Định nghĩa Miền/Vùng ── */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Định nghĩa Miền / Vùng</span>
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
                style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}
              >
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
            ))}
          </div>

          {unassignedList.length > 0 && (
            <div style={{ fontSize: 12, color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6, padding: '6px 10px' }}>
              {unassignedList.length} tỉnh chưa được gán miền: {unassignedList.slice(0, 10).join(', ')}{unassignedList.length > 10 ? ` và ${unassignedList.length - 10} tỉnh khác` : ''} — chưa tra được tuyến cho các tỉnh này.
            </div>
          )}
        </div>

        {/* ── Bảng danh sách theo cặp miền ── */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Đặt tên tuyến — theo cặp miền</span>
          <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: -8 }}>
            Mỗi dòng = 1 cặp miền. Nhiều dòng có thể dùng chung 1 tên tuyến nếu muốn tính cùng 1 mức giá; để trống = chưa cấu hình.
          </span>

          {/* Nội tỉnh — luật cố định */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C_BG_HEADER, borderRadius: 8, padding: '10px 14px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: C_TEXT_SECONDARY, background: '#E5E7EB', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>CỐ ĐỊNH</span>
            <input
              value={localSameRoute}
              onChange={(e) => handleSetSameProvinceRoute(e.target.value)}
              style={{ ...inputStyle, fontWeight: 700, width: 160 }}
            />
            <span style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>Phạm vi: cùng 1 tỉnh, bất kỳ miền nào — không cần cấu hình, luôn áp dụng.</span>
          </div>

          {localRegions.length === 0 ? (
            <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, padding: 8 }}>Chưa có miền nào — thêm miền ở trên trước.</div>
          ) : (
            <div style={{ overflowX: 'auto', border: `1px solid ${C_BORDER}`, borderRadius: 8 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
                <thead>
                  <tr>
                    <th style={{ background: C_BG_HEADER, textAlign: 'left', padding: '8px 12px', fontSize: 12, color: C_TEXT_SECONDARY, borderBottom: `1px solid ${C_BORDER}` }}>Miền A</th>
                    <th style={{ background: C_BG_HEADER, textAlign: 'left', padding: '8px 12px', fontSize: 12, color: C_TEXT_SECONDARY, borderBottom: `1px solid ${C_BORDER}` }}>Miền B</th>
                    <th style={{ background: C_BG_HEADER, textAlign: 'left', padding: '8px 12px', fontSize: 12, color: C_TEXT_SECONDARY, borderBottom: `1px solid ${C_BORDER}` }}>Tên tuyến</th>
                  </tr>
                </thead>
                <tbody>
                  {allRegionPairs.map(([a, b]) => {
                    const key = pairKey(a.id, b.id)
                    const value = localMatrix[key] ?? ''
                    return (
                      <tr key={key}>
                        <td style={{ padding: '8px 12px', borderBottom: `1px solid ${C_BORDER}`, whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>
                            {a.name}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', borderBottom: `1px solid ${C_BORDER}`, whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>
                            {b.name}
                          </span>
                        </td>
                        <td style={{ padding: '6px 12px', borderBottom: `1px solid ${C_BORDER}` }}>
                          <input
                            value={value}
                            onChange={(e) => handleSetRow(a.id, b.id, e.target.value)}
                            placeholder="— chưa cấu hình —"
                            style={{
                              ...inputStyle, width: 220, fontSize: 13, fontWeight: value ? 600 : 400, boxSizing: 'border-box',
                              background: value ? '#FFF4ED' : '#fff',
                              borderColor: value ? '#FDBA74' : C_BORDER,
                              color: value ? '#FF5200' : C_TEXT_SECONDARY,
                            }}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {unconfiguredPairs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 12px' }}>
              <span style={{ fontSize: 12, color: '#B45309' }}>
                {unconfiguredPairs.length} cặp miền chưa thuộc tuyến nào — xem cột "Tên tuyến" để trống ở trên.
              </span>
            </div>
          )}
        </div>

        {/* ── Nội thành / Ngoại thành — tách biệt với vùng/tuyến ở trên, chỉ vài thành phố cần ── */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Nội thành / Ngoại thành</span>
              <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
                Theo xã/phường (địa giới mới sau sáp nhập 2025, cấp quận/huyện không còn) — chỉ vài
                thành phố có phân biệt giá Nội/Ngoại thành, dùng cho toggle "Tách khu vực" khi tạo
                bảng giá. Dữ liệu demo minh hoạ, chưa đầy đủ toàn bộ xã/phường thật.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={newProvinceName}
                onChange={(e) => setNewProvinceName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrbanProvince() }}
                placeholder="Tên tỉnh/thành mới..."
                style={{ ...inputStyle, fontSize: 13, width: 200 }}
              />
              <button
                onClick={handleAddUrbanProvince}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY }}
              >
                <PlusOutlined style={{ fontSize: 12 }} /> Thêm tỉnh
              </button>
            </div>
          </div>

          {localUrbanConfigs.length === 0 ? (
            <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, padding: 8 }}>Chưa có tỉnh nào cấu hình Nội/Ngoại thành.</div>
          ) : (
            <div style={{ overflowX: 'auto', border: `1px solid ${C_BORDER}`, borderRadius: 8 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 560 }}>
                <thead>
                  <tr>
                    <th style={{ background: C_BG_HEADER, textAlign: 'left', padding: '8px 12px', fontSize: 12, color: C_TEXT_SECONDARY, borderBottom: `1px solid ${C_BORDER}` }}>Xã / Phường mới</th>
                    <th style={{ background: C_BG_HEADER, textAlign: 'left', padding: '8px 12px', fontSize: 12, color: C_TEXT_SECONDARY, borderBottom: `1px solid ${C_BORDER}` }}>Tỉnh mới</th>
                    <th style={{ background: C_BG_HEADER, textAlign: 'left', padding: '8px 12px', fontSize: 12, color: C_TEXT_SECONDARY, borderBottom: `1px solid ${C_BORDER}` }}>Phân loại</th>
                    <th style={{ background: C_BG_HEADER, padding: '8px 12px', borderBottom: `1px solid ${C_BORDER}` }} />
                  </tr>
                </thead>
                <tbody>
                  {localUrbanConfigs.map((config) => (
                    <Fragment key={config.province}>
                      {config.wards.map((w, idx) => (
                        <tr key={`${config.province}-${w.ward}`}>
                          <td style={{ padding: '7px 12px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 13, color: C_TEXT_PRIMARY }}>{w.ward}</td>
                          <td style={{ padding: '7px 12px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 13, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>{config.province}</td>
                          <td style={{ padding: '6px 12px', borderBottom: `1px solid ${C_BORDER}` }}>
                            <button
                              onClick={() => handleToggleUrbanWard(config.province, w.ward)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 12,
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                background: w.isUrban ? '#FFF4ED' : '#F9FAFB',
                                border: `1px solid ${w.isUrban ? '#FDBA74' : C_BORDER}`,
                                color: w.isUrban ? '#FF5200' : C_TEXT_SECONDARY,
                              }}
                            >
                              {w.isUrban ? 'Nội thành' : 'Ngoại thành'}
                            </button>
                          </td>
                          <td style={{ padding: '6px 12px', borderBottom: `1px solid ${C_BORDER}`, textAlign: 'right' }}>
                            <button
                              onClick={() => handleRemoveUrbanWard(config.province, w.ward)}
                              style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                              title="Xoá xã/phường này"
                            >
                              <CloseOutlined style={{ fontSize: 12 }} />
                            </button>
                            {idx === 0 && (
                              <button
                                onClick={() => handleRemoveUrbanProvince(config.province)}
                                style={{ border: 'none', background: 'transparent', color: '#9CA3AF', cursor: 'pointer', marginLeft: 8, fontSize: 11 }}
                                title={`Bỏ phân biệt Nội/Ngoại thành cho ${config.province}`}
                              >
                                bỏ tỉnh
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr key={`${config.province}-add`}>
                        <td colSpan={4} style={{ padding: '8px 12px', borderBottom: `1px solid ${C_BORDER}`, background: '#F9FAFB' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              value={newWardInputs[config.province] ?? ''}
                              onChange={(e) => setNewWardInputs((prev) => ({ ...prev, [config.province]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleAddUrbanWard(config.province) }}
                              placeholder={`Thêm xã/phường mới cho ${config.province}...`}
                              style={{ ...inputStyle, fontSize: 12, width: 280 }}
                            />
                            <button
                              onClick={() => handleAddUrbanWard(config.province)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C_TEXT_PRIMARY }}
                            >
                              <PlusOutlined style={{ fontSize: 10 }} /> Thêm
                            </button>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, marginBottom: 40 }}>
          <button
            onClick={() => navigate('/super-admin/route-config')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: '#3B82F6', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '6px 14px' }}
          >
            Xem dạng tick chip (cách cũ) →
          </button>
        </div>

      </div>
    </ConfigProvider>
  )
}
