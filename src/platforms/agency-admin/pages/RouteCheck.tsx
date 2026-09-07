import { useState } from 'react'
import { Select, Button } from 'antd'
import {
  NodeIndexOutlined,
  SwapOutlined,
  EnvironmentOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { VIETNAM_PROVINCES } from '../../../mock-data/vietnam-provinces'
import {
  regions,
  routeMatrix,
  sameProvinceRoute,
  listRouteNames,
  findRegionOf,
  resolveRouteName,
  type RegionDef,
} from '../../../mock-data/routeConfig'
import { GHN_ORANGE, COLOR_BORDER } from '../../../theme/tokens'

// Bảng màu ổn định theo id/tên — không phụ thuộc 6 vùng cố định, tự thích ứng khi
// Super Admin thêm/sửa miền hoặc tuyến ở "Cấu hình vùng & tuyến".
const PALETTE = [
  { color: '#059669', bg: '#ECFDF5' },
  { color: '#D97706', bg: '#FFFBEB' },
  { color: '#2563EB', bg: '#EFF6FF' },
  { color: '#7C3AED', bg: '#F5F3FF' },
  { color: '#0891B2', bg: '#ECFEFF' },
  { color: '#DC2626', bg: '#FEF2F2' },
  { color: '#DB2777', bg: '#FDF2F8' },
  { color: '#65A30D', bg: '#F7FEE7' },
]

function colorForKey(key: string): { color: string; bg: string } {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

type RouteCheckResult = {
  route: string
  description: string
  color: string
  bgColor: string
  fromRegion?: RegionDef
  toRegion?: RegionDef
} | null

function buildResult(fromProvince: string, toProvince: string): RouteCheckResult {
  const routeName = resolveRouteName(fromProvince, toProvince)
  if (!routeName) return null
  const fromRegion = findRegionOf(fromProvince)
  const toRegion = findRegionOf(toProvince)
  const { color, bg } = colorForKey(routeName)
  const description = fromProvince === toProvince
    ? `Giao hàng trong cùng tỉnh/thành phố — ${fromProvince}`
    : `Giao hàng giữa ${fromRegion?.name ?? '—'} và ${toRegion?.name ?? '—'}`
  return { route: routeName, description, color, bgColor: bg, fromRegion, toRegion }
}

// Danh sách tuyến kèm cặp miền áp dụng — dựa trên routeMatrix hiện tại (dynamic).
type GuideRow = { name: string; pairs: string[] }
function buildGuideRows(): GuideRow[] {
  return listRouteNames().map((routeName) => {
    if (routeName === sameProvinceRoute) {
      return { name: routeName, pairs: ['Cùng tỉnh, bất kỳ miền nào'] }
    }
    const pairs: string[] = []
    const seen = new Set<string>()
    for (const [key, name] of Object.entries(routeMatrix)) {
      if (name !== routeName || seen.has(key)) continue
      seen.add(key)
      const [idA, idB] = key.split('|')
      const regA = regions.find((r) => r.id === idA)
      const regB = regions.find((r) => r.id === idB)
      pairs.push(`${regA?.name ?? idA} ↔ ${regB?.name ?? idB}`)
    }
    return { name: routeName, pairs }
  })
}

export default function RouteCheck() {
  const [fromProvince, setFromProvince] = useState<string | null>(null)
  const [fromDistrict, setFromDistrict] = useState<string | null>(null)
  const [toProvince, setToProvince] = useState<string | null>(null)
  const [toDistrict, setToDistrict] = useState<string | null>(null)
  const [result, setResult] = useState<RouteCheckResult>(null)
  const [checked, setChecked] = useState(false)

  const fromDistrictOptions =
    VIETNAM_PROVINCES.find((p) => p.name === fromProvince)?.districts.map((d) => ({
      value: d.name,
      label: d.name,
    })) ?? []

  const toDistrictOptions =
    VIETNAM_PROVINCES.find((p) => p.name === toProvince)?.districts.map((d) => ({
      value: d.name,
      label: d.name,
    })) ?? []

  const provinceOptions = VIETNAM_PROVINCES.map((p) => ({ value: p.name, label: p.name }))
  const guideRows = buildGuideRows()

  const handleSwap = () => {
    const tmpP = fromProvince
    const tmpD = fromDistrict
    setFromProvince(toProvince)
    setFromDistrict(toDistrict)
    setToProvince(tmpP)
    setToDistrict(tmpD)
    setChecked(false)
    setResult(null)
  }

  const handleCheck = () => {
    if (!fromProvince || !toProvince) return
    const r = buildResult(fromProvince, toProvince)
    setResult(r)
    setChecked(true)
  }

  const canCheck = !!fromProvince && !!toProvince

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <NodeIndexOutlined style={{ fontSize: 22, color: GHN_ORANGE }} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
            Kiểm tra tuyến giao hàng
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
          Nhập địa điểm lấy và giao để xác định tuyến theo cấu hình vùng &amp; tuyến hiện tại (do Super Admin quản lý)
        </p>
      </div>

      {/* Form card */}
      <div
        style={{
          background: '#fff',
          border: `1px solid ${COLOR_BORDER}`,
          borderRadius: 10,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {/* From */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: `2px solid ${GHN_ORANGE}`,
              }}
            >
              <EnvironmentOutlined style={{ color: GHN_ORANGE, fontSize: 14 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: GHN_ORANGE }}>Lấy hàng</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Tỉnh / Thành phố</div>
              <Select
                showSearch
                placeholder="Chọn tỉnh/thành phố"
                options={provinceOptions}
                value={fromProvince}
                onChange={(v) => { setFromProvince(v); setFromDistrict(null); setChecked(false); setResult(null) }}
                style={{ width: '100%' }}
                filterOption={(input, opt) =>
                  (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Quận / Huyện</div>
              <Select
                showSearch
                placeholder="Chọn quận/huyện"
                options={fromDistrictOptions}
                value={fromDistrict}
                onChange={(v) => setFromDistrict(v)}
                disabled={!fromProvince}
                style={{ width: '100%' }}
                filterOption={(input, opt) =>
                  (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
            {fromProvince && (() => {
              const region = findRegionOf(fromProvince)
              if (!region) return null
              const c = colorForKey(region.id)
              return (
                <div
                  style={{
                    marginTop: 8,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: c.bg,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    color: c.color,
                    fontWeight: 500,
                  }}
                >
                  <span>{region.name}</span>
                </div>
              )
            })()}
          </div>

          {/* Swap button */}
          <div style={{ paddingTop: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <button
              onClick={handleSwap}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: `1px solid ${COLOR_BORDER}`,
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
                fontSize: 16,
                transition: 'all 0.15s',
              }}
              title="Đổi chiều"
            >
              <SwapOutlined />
            </button>
          </div>

          {/* To */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: `2px solid #3B82F6`,
              }}
            >
              <EnvironmentOutlined style={{ color: '#3B82F6', fontSize: 14 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#3B82F6' }}>Giao hàng</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Tỉnh / Thành phố</div>
              <Select
                showSearch
                placeholder="Chọn tỉnh/thành phố"
                options={provinceOptions}
                value={toProvince}
                onChange={(v) => { setToProvince(v); setToDistrict(null); setChecked(false); setResult(null) }}
                style={{ width: '100%' }}
                filterOption={(input, opt) =>
                  (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Quận / Huyện</div>
              <Select
                showSearch
                placeholder="Chọn quận/huyện"
                options={toDistrictOptions}
                value={toDistrict}
                onChange={(v) => setToDistrict(v)}
                disabled={!toProvince}
                style={{ width: '100%' }}
                filterOption={(input, opt) =>
                  (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
            {toProvince && (() => {
              const region = findRegionOf(toProvince)
              if (!region) return null
              const c = colorForKey(region.id)
              return (
                <div
                  style={{
                    marginTop: 8,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: c.bg,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    color: c.color,
                    fontWeight: 500,
                  }}
                >
                  <span>{region.name}</span>
                </div>
              )
            })()}
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <Button
            type="primary"
            onClick={handleCheck}
            disabled={!canCheck}
            style={{
              background: canCheck ? GHN_ORANGE : undefined,
              borderColor: canCheck ? GHN_ORANGE : undefined,
              height: 38,
              paddingInline: 32,
              fontWeight: 600,
              fontSize: 14,
            }}
            icon={<NodeIndexOutlined />}
          >
            Kiểm tra tuyến
          </Button>
        </div>
      </div>

      {/* Result */}
      {checked && result && (
        <div
          style={{
            background: result.bgColor,
            border: `1.5px solid ${result.color}`,
            borderRadius: 10,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <CheckCircleFilled style={{ fontSize: 24, color: result.color, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>Kết quả phân loại tuyến</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: result.color, marginBottom: 4 }}>
                {result.route}
              </div>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>{result.description}</div>

              {/* Route path */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#fff',
                  border: `1px solid ${COLOR_BORDER}`,
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 600, color: '#111827' }}>
                  {fromProvince}
                  {fromDistrict && <span style={{ fontWeight: 400, color: '#6B7280' }}> ({fromDistrict})</span>}
                </span>
                <span style={{ color: result.color, fontWeight: 700 }}>→</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>
                  {toProvince}
                  {toDistrict && <span style={{ fontWeight: 400, color: '#6B7280' }}> ({toDistrict})</span>}
                </span>
              </div>

              {/* Regions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {[{ label: 'Miền lấy', region: result.fromRegion }, { label: 'Miền giao', region: result.toRegion }].map(({ label, region }) => {
                  if (!region) return null
                  const c = colorForKey(region.id)
                  return (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 10px',
                        borderRadius: 4,
                        background: c.bg,
                        border: `1px solid ${c.color}30`,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: '#6B7280' }}>{label}:</span>
                      <span style={{ color: c.color, fontWeight: 600 }}>{region.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {checked && !result && (
        <div
          style={{
            background: '#FEF2F2',
            border: `1px solid #FCA5A5`,
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
            fontSize: 13,
            color: '#DC2626',
          }}
        >
          Không thể xác định tuyến. Vui lòng kiểm tra lại thông tin địa điểm — có thể tỉnh này chưa được Super Admin gán vào miền nào, hoặc cặp miền này chưa được đặt tên tuyến.
        </div>
      )}

      {/* Reference tables */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Region table */}
        <div
          style={{
            flex: 1,
            background: '#fff',
            border: `1px solid ${COLOR_BORDER}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 16px',
              borderBottom: `1px solid ${COLOR_BORDER}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <InfoCircleOutlined style={{ color: '#6B7280', fontSize: 13 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Định nghĩa miền / vùng</span>
          </div>
          <div style={{ padding: 4 }}>
            {regions.map((region) => {
              const c = colorForKey(region.id)
              return (
                <div
                  key={region.id}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 6,
                    marginBottom: 2,
                  }}
                >
                  <div
                    style={{
                      minWidth: 120,
                      fontSize: 12,
                      fontWeight: 600,
                      color: c.color,
                      background: c.bg,
                      padding: '2px 8px',
                      borderRadius: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 22,
                      flexShrink: 0,
                    }}
                  >
                    {region.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>
                    {region.provinces.length > 0 ? region.provinces.join(', ') : 'Chưa có tỉnh'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Route logic table */}
        <div
          style={{
            width: 320,
            background: '#fff',
            border: `1px solid ${COLOR_BORDER}`,
            borderRadius: 10,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '10px 16px',
              borderBottom: `1px solid ${COLOR_BORDER}`,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <NodeIndexOutlined style={{ color: '#6B7280', fontSize: 13 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{guideRows.length} Tuyến hiện tại</span>
          </div>
          <div style={{ padding: 8 }}>
            {guideRows.map((row, i) => {
              const c = colorForKey(row.name)
              return (
                <div
                  key={row.name}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '7px 8px',
                    borderRadius: 6,
                    borderBottom: i < guideRows.length - 1 ? `1px solid #F3F4F6` : 'none',
                  }}
                >
                  <span
                    style={{
                      minWidth: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: c.color,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.color }}>{row.name}</div>
                    {row.pairs.map((p, pi) => (
                      <div key={pi} style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{p}</div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
        Cấu hình miền &amp; tuyến do Super Admin quản lý tập trung, dùng chung cho mọi đại lý.
      </div>
    </div>
  )
}
