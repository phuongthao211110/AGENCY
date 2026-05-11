import { useState } from 'react'
import { Select, Button } from 'antd'
import {
  NodeIndexOutlined,
  SwapOutlined,
  EnvironmentOutlined,
  CheckCircleFilled,
  InfoCircleOutlined,
} from '@ant-design/icons'
import {
  VIETNAM_PROVINCES,
  determineRoute,
  ZONE_LABELS,
  ZONE_COLORS,
  type Zone,
} from '../../../mock-data/vietnam-provinces'
import { GHN_ORANGE, COLOR_BORDER } from '../../../theme/tokens'

const ROUTE_ORDER = [
  { name: 'Nội Tỉnh', desc: 'sender == receiver (cùng tỉnh)', color: '#059669' },
  { name: 'Liên Vùng Đặc Biệt', desc: 'HN ↔ ĐN / ĐN ↔ HCM / HCM ↔ HN', color: '#D97706' },
  { name: 'Nội Vùng', desc: 'HN ↔ V3 / ĐN ↔ V2 / HCM ↔ V1', color: '#2563EB' },
  { name: 'Liên Vùng', desc: 'HN ↔ V1/V2 / ĐN ↔ V1/V3 / HCM ↔ V2/V3', color: '#7C3AED' },
  { name: 'Nội Vùng Tỉnh', desc: 'Khác tỉnh, cùng vùng (không phải 3 TP lớn)', color: '#0891B2' },
  { name: 'Liên Vùng Tỉnh', desc: '2 tỉnh thuộc 2 vùng khác nhau', color: '#DC2626' },
]

const ZONE_ORDER: Zone[] = ['HN', 'DN', 'HCM', 'V3', 'V2', 'V1']

export default function RouteCheck() {
  const [fromProvince, setFromProvince] = useState<string | null>(null)
  const [fromDistrict, setFromDistrict] = useState<string | null>(null)
  const [toProvince, setToProvince] = useState<string | null>(null)
  const [toDistrict, setToDistrict] = useState<string | null>(null)
  const [result, setResult] = useState<ReturnType<typeof determineRoute>>(null)
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
    const r = determineRoute(fromProvince, toProvince)
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
          Nhập địa điểm lấy và giao để xác định tuyến trong hệ thống phân vùng GHN
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
              const zone = VIETNAM_PROVINCES.find((p) => p.name === fromProvince)?.zone
              if (!zone) return null
              const zc = ZONE_COLORS[zone]
              return (
                <div
                  style={{
                    marginTop: 8,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: zc.bg,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    color: zc.color,
                    fontWeight: 500,
                  }}
                >
                  <span>{ZONE_LABELS[zone]}</span>
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
              const zone = VIETNAM_PROVINCES.find((p) => p.name === toProvince)?.zone
              if (!zone) return null
              const zc = ZONE_COLORS[zone]
              return (
                <div
                  style={{
                    marginTop: 8,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: zc.bg,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    color: zc.color,
                    fontWeight: 500,
                  }}
                >
                  <span>{ZONE_LABELS[zone]}</span>
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

              {/* Zones */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {[{ label: 'Vùng lấy', zone: result.fromZone }, { label: 'Vùng giao', zone: result.toZone }].map(({ label, zone }) => {
                  const zc = ZONE_COLORS[zone]
                  return (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 10px',
                        borderRadius: 4,
                        background: zc.bg,
                        border: `1px solid ${zc.color}30`,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: '#6B7280' }}>{label}:</span>
                      <span style={{ color: zc.color, fontWeight: 600 }}>{ZONE_LABELS[zone]}</span>
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
          Không thể xác định tuyến. Vui lòng kiểm tra lại thông tin địa điểm.
        </div>
      )}

      {/* Reference tables */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Zone table */}
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
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Phân vùng GHN</span>
          </div>
          <div style={{ padding: 4 }}>
            {ZONE_ORDER.map((zone) => {
              const zc = ZONE_COLORS[zone]
              const provinces = VIETNAM_PROVINCES.filter((p) => p.zone === zone).map((p) => p.name)
              return (
                <div
                  key={zone}
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
                      color: zc.color,
                      background: zc.bg,
                      padding: '2px 8px',
                      borderRadius: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 22,
                    }}
                  >
                    {ZONE_LABELS[zone]}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>
                    {provinces.join(', ')}
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
            <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>6 Tuyến GHN</span>
          </div>
          <div style={{ padding: 8 }}>
            {ROUTE_ORDER.map((r, i) => (
              <div
                key={r.name}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '7px 8px',
                  borderRadius: 6,
                  borderBottom: i < ROUTE_ORDER.length - 1 ? `1px solid #F3F4F6` : 'none',
                }}
              >
                <span
                  style={{
                    minWidth: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: r.color,
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: r.color }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
