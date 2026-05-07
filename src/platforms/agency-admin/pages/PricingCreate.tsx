import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined, InfoCircleOutlined, CloseOutlined } from '@ant-design/icons'

const C_ACTION        = '#FF5200'
const C_LINK          = '#3B82F6'
const C_TEXT_PRIMARY  = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL    = '#4B5563'
const C_BORDER        = '#E5E7EB'
const C_BG_HEADER     = '#F3F4F6'
const C_BG_FORM       = '#F9FAFB'

// ─── Types ───────────────────────────────────────────────────────────────────

type RouteType = 'noi-tinh' | 'noi-vung' | 'lien-vung' | 'noi-vung-tinh' | 'lien-vung-tinh' | 'lien-vung-dac-biet'
type RegionCode = 'vung1' | 'vung2' | 'vung3' | ''

type OverweightTier = {
  id: string
  toGram: string      // gram, rỗng = không giới hạn
  unbounded?: boolean // true = "trở lên" mode, không có upper bound
  stepGram: string    // mỗi Y gram
  increase: string    // tăng X đồng
}

type FeeUnit = '%' | 'vnd'
type SurchargeFee = { value: string; unit: FeeUnit }

type FeeTier = {
  id: string
  fromValue: string
  toValue: string
  fixedFee: string
  percentFee: string
}

// Alias types for clarity
type InsuranceTier = FeeTier
type CodFeeTier    = FeeTier

type Surcharges = {
  partialDelivery:    SurchargeFee    // Giao trả 1 phần
  insurance:          InsuranceTier[] // Phí bảo hiểm (khai giá) — nhiều mức
  codFee:             CodFeeTier[]    // Phí thu hộ — nhiều mức COD
  deliveryFailFee:    SurchargeFee    // Phí giao thất bại thu tiền
  redeliveryFee:      FeeTier[]       // Phí kích hoạt giao lại — theo lần
  returnFee:          FeeTier[]       // Phí hoàn hàng — theo lần
}

type RouteConfig = {
  id: string
  routeType: RouteType
  // Chỉ dùng khi routeType === 'lien-tinh'
  fromRegion: RegionCode
  fromProvince: string
  fromDistrict: string
  fromWard: string
  toRegion: RegionCode
  toProvince: string
  toDistrict: string
  toWard: string
  // Giá theo khối lượng chuẩn
  standardWeight: string  // gram cố định
  basePrice: string       // VND — giá cho gói ≤ standardWeight
  overweightTiers: OverweightTier[]
  surcharges: Surcharges
}

const ROUTE_TYPE_LABELS: Record<RouteType, string> = {
  'noi-tinh':           'Nội tỉnh',
  'noi-vung':           'Nội vùng',
  'noi-vung-tinh':      'Nội vùng tỉnh',
  'lien-vung-dac-biet': 'Liên vùng đặc biệt',
  'lien-vung':          'Liên vùng',
  'lien-vung-tinh':     'Liên vùng tỉnh',
}



const REGION_OPTIONS = [
  { value: '',      label: 'Tất cả' },
  { value: 'vung3', label: 'Vùng 3 — Miền Bắc' },
  { value: 'vung2', label: 'Vùng 2 — Miền Trung' },
  { value: 'vung1', label: 'Vùng 1 — Miền Nam' },
]


const makeEmptySurcharges = (): Surcharges => ({
  partialDelivery:  { value: '', unit: 'vnd' },
  insurance:        [],
  codFee:           [],
  deliveryFailFee:  { value: '', unit: 'vnd' },
  redeliveryFee:    [],
  returnFee:        [],
})

const makeEmptyRoute = (routeType: RouteType, id: string): RouteConfig => ({
  id,
  routeType,
  fromRegion: '', fromProvince: '', fromDistrict: '', fromWard: '',
  toRegion: '', toProvince: '', toDistrict: '', toWard: '',
  standardWeight: '', basePrice: '',
  overweightTiers: [],
  surcharges: makeEmptySurcharges(),
})

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  border: `1px solid ${C_BORDER}`,
  borderRadius: 6,
  padding: '0 10px',
  height: 32,
  fontSize: 13,
  color: C_TEXT_PRIMARY,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: C_TEXT_LABEL,
  marginBottom: 3,
  display: 'block',
}

// ─── Overweight tier row ──────────────────────────────────────────────────────

function OverweightTierRow({
  tier,
  prevLabel,
  onChange,
  onDelete,
}: {
  tier: OverweightTier
  prevLabel: string
  onChange: (updated: OverweightTier) => void
  onDelete: () => void
}) {
  const inlineInput: React.CSSProperties = {
    border: 'none',
    borderBottom: `1px solid ${C_BORDER}`,
    outline: 'none',
    background: 'transparent',
    fontSize: 13,
    fontWeight: 600,
    color: C_TEXT_PRIMARY,
    textAlign: 'center',
    padding: '0 2px',
    width: 60,
  }

  const isUnbounded = !!tier.unbounded

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 0', fontSize: 13, color: C_TEXT_SECONDARY }}>
      <span style={{ color: C_TEXT_SECONDARY, marginRight: 4 }}>•</span>
      <span>{prevLabel}</span>
      {/* Segmented control: đến / trở lên */}
      <div style={{ display: 'inline-flex', gap: 1, background: '#F3F4F6', borderRadius: 6, padding: 2, flexShrink: 0 }}>
        {(['đến', 'trở lên'] as const).map((opt) => {
          const active = opt === 'đến' ? !isUnbounded : isUnbounded
          return (
            <button
              key={opt}
              onClick={() => onChange({ ...tier, unbounded: opt === 'trở lên', toGram: '' })}
              style={{
                fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: active ? '#fff' : 'transparent',
                color: active ? C_TEXT_PRIMARY : C_TEXT_SECONDARY,
                boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {!isUnbounded && (
        <>
          <input
            type="number"
            value={tier.toGram}
            onChange={(e) => onChange({ ...tier, toGram: e.target.value })}
            placeholder="∞"
            style={{ ...inlineInput, width: 70 }}
          />
          <span>g</span>
        </>
      )}
      <span>&nbsp;:&nbsp; Tăng</span>
      <input
        type="number"
        value={tier.increase}
        onChange={(e) => onChange({ ...tier, increase: e.target.value })}
        placeholder="0"
        style={{ ...inlineInput, width: 70 }}
      />
      <span>đ &nbsp; trên mỗi</span>
      <input
        type="number"
        value={tier.stepGram}
        onChange={(e) => onChange({ ...tier, stepGram: e.target.value })}
        placeholder="500"
        style={{ ...inlineInput, width: 50 }}
      />
      <span>g</span>
      <button
        onClick={onDelete}
        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', padding: '0 4px', display: 'flex', alignItems: 'center', flexShrink: 0, marginLeft: 6 }}
        title="Xoá ngưỡng này"
      >
        <DeleteOutlined style={{ fontSize: 13 }} />
      </button>
    </div>
  )
}

// ─── Generic fee tier table ───────────────────────────────────────────────────

const TIER_BTN: React.CSSProperties = {
  height: 30, padding: '0 12px', border: 'none', borderRadius: 6,
  background: '#1E3A5F', color: '#fff', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', whiteSpace: 'nowrap',
}
const TIER_BTN_DISABLED: React.CSSProperties = {
  ...TIER_BTN, background: '#D1D5DB', color: '#9CA3AF', cursor: 'default',
}

function FeeTierTable({
  tiers,
  onChangeTiers,
  colFrom,
  colTo,
  colPercent,
}: {
  tiers: FeeTier[]
  onChangeTiers: (updated: FeeTier[]) => void
  colFrom: string
  colTo: string
  colPercent: string
}) {
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const markTouched = (id: string) => setTouched((s) => new Set([...s, id]))

  const addAfter = (idx: number) => {
    const newTier: FeeTier = { id: Date.now().toString(), fromValue: '', toValue: '', fixedFee: '0', percentFee: '0' }
    const next = [...tiers]
    next.splice(idx + 1, 0, newTier)
    onChangeTiers(next)
  }

  const removeTier = (id: string) => onChangeTiers(tiers.filter((t) => t.id !== id))

  const updateTier = (id: string, field: keyof FeeTier, value: string) =>
    onChangeTiers(tiers.map((t) => t.id === id ? { ...t, [field]: value } : t))

  const colStyle = (flex: number): React.CSSProperties => ({ flex, minWidth: 0 })

  const fieldInput = (tier: FeeTier, field: 'fromValue' | 'toValue' | 'fixedFee' | 'percentFee', required = false, suffix?: string) => {
    const showError = required && tier[field].trim() === '' && touched.has(tier.id)
    const input = (
      <input
        type="number"
        value={tier[field]}
        onChange={(e) => updateTier(tier.id, field, e.target.value)}
        onBlur={() => markTouched(tier.id)}
        onFocus={(e) => (e.currentTarget.style.borderColor = showError ? '#EF4444' : '#FFA274')}
        style={{ ...inputStyle, width: '100%', borderColor: showError ? '#EF4444' : C_BORDER, ...(suffix ? { paddingRight: 26 } : {}) }}
      />
    )
    if (!suffix) return input
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        {input}
        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C_TEXT_SECONDARY, pointerEvents: 'none' }}>{suffix}</span>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 6, marginBottom: 4 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', background: C_BG_HEADER, borderRadius: '6px 6px 0 0', borderBottom: `1px solid ${C_BORDER}` }}>
        <div style={{ ...colStyle(1), fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>{colFrom}</div>
        <div style={{ ...colStyle(1), fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>{colTo}</div>
        <div style={{ ...colStyle(1), fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>Phụ phí (số fix)</div>
        <div style={{ ...colStyle(2), fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>{colPercent}</div>
        <div style={{ width: 110, flexShrink: 0, fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>Thao tác</div>
      </div>

      {/* Rows */}
      {tiers.map((tier, idx) => (
        <div key={tier.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px', background: '#fff', borderBottom: idx < tiers.length - 1 ? `1px solid ${C_BORDER}` : 'none' }}>
          <div style={colStyle(1)}>{fieldInput(tier, 'fromValue', true)}</div>
          <div style={colStyle(1)}>{fieldInput(tier, 'toValue')}</div>
          <div style={colStyle(1)}>{fieldInput(tier, 'fixedFee', false, 'đ')}</div>
          <div style={colStyle(2)}>{fieldInput(tier, 'percentFee', false, '%')}</div>
          <div style={{ width: 110, flexShrink: 0, display: 'flex', gap: 4 }}>
            <button onClick={() => addAfter(idx)} style={TIER_BTN}>Thêm</button>
            <button
              onClick={() => tiers.length > 1 ? removeTier(tier.id) : undefined}
              style={tiers.length > 1 ? TIER_BTN : TIER_BTN_DISABLED}
              disabled={tiers.length <= 1}
            >Xóa</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Surcharge list ───────────────────────────────────────────────────────────


function SurchargeList({ surcharges, onUpdateSurcharges }: {
  surcharges: Surcharges
  onUpdateSurcharges: (updated: Surcharges) => void
}) {
  const [manualOpen, setManualOpen] = useState<Set<keyof Surcharges>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<{ key: keyof Surcharges; label: string } | null>(null)

  const updateSimple = (key: 'partialDelivery' | 'deliveryFailFee', value: string) => {
    onUpdateSurcharges({ ...surcharges, [key]: { ...surcharges[key], value } })
  }

  const updateInsurance = (tiers: InsuranceTier[]) => {
    onUpdateSurcharges({ ...surcharges, insurance: tiers })
  }

  const updateCodFee = (tiers: CodFeeTier[]) => {
    onUpdateSurcharges({ ...surcharges, codFee: tiers })
  }

  const updateRedeliveryFee = (tiers: FeeTier[]) => {
    onUpdateSurcharges({ ...surcharges, redeliveryFee: tiers })
  }

  const updateReturnFee = (tiers: FeeTier[]) => {
    onUpdateSurcharges({ ...surcharges, returnFee: tiers })
  }

  // A fee is "configured" if it already has data
  const isConfigured = (key: keyof Surcharges): boolean => {
    if (key === 'partialDelivery')  return surcharges.partialDelivery.value.trim() !== ''
    if (key === 'insurance')        return surcharges.insurance.length > 0
    if (key === 'codFee')           return surcharges.codFee.length > 0
    if (key === 'deliveryFailFee')  return surcharges.deliveryFailFee.value.trim() !== ''
    if (key === 'redeliveryFee')    return surcharges.redeliveryFee.length > 0
    if (key === 'returnFee')        return surcharges.returnFee.length > 0
    return false
  }

  // Show form if already configured (always) OR manually toggled open
  const isOpen = (key: keyof Surcharges) => isConfigured(key) || manualOpen.has(key)

  const handleAdd = (key: keyof Surcharges) => {
    const emptyTier = { id: Date.now().toString(), fromValue: '', toValue: '', fixedFee: '0', percentFee: '0' }
    if (key === 'insurance'     && surcharges.insurance.length === 0)     updateInsurance([emptyTier])
    if (key === 'codFee'        && surcharges.codFee.length === 0)        updateCodFee([emptyTier])
    if (key === 'redeliveryFee' && surcharges.redeliveryFee.length === 0) updateRedeliveryFee([emptyTier])
    if (key === 'returnFee'     && surcharges.returnFee.length === 0)     updateReturnFee([emptyTier])
    setManualOpen((s) => new Set([...s, key]))
  }

  const handleDeleteConfirmed = () => {
    if (!confirmDelete) return
    const { key } = confirmDelete
    if (key === 'partialDelivery')  onUpdateSurcharges({ ...surcharges, partialDelivery: { value: '', unit: 'vnd' } })
    if (key === 'insurance')        onUpdateSurcharges({ ...surcharges, insurance: [] })
    if (key === 'codFee')           onUpdateSurcharges({ ...surcharges, codFee: [] })
    if (key === 'deliveryFailFee')  onUpdateSurcharges({ ...surcharges, deliveryFailFee: { value: '', unit: 'vnd' } })
    if (key === 'redeliveryFee')    onUpdateSurcharges({ ...surcharges, redeliveryFee: [] })
    if (key === 'returnFee')        onUpdateSurcharges({ ...surcharges, returnFee: [] })
    setManualOpen((s) => { const n = new Set(s); n.delete(key); return n })
    setConfirmDelete(null)
  }

  const allFields: { key: keyof Surcharges; label: string }[] = [
    { key: 'insurance',        label: 'Phí bảo hiểm (khai giá)' },
    { key: 'partialDelivery',  label: 'Giao trả 1 phần' },
    { key: 'deliveryFailFee',  label: 'Phí giao thất bại thu tiền' },
    { key: 'codFee',           label: 'Phí thu hộ' },
    { key: 'redeliveryFee',    label: 'Phí kích hoạt giao lại' },
    { key: 'returnFee',        label: 'Phí hoàn hàng' },
  ]

  return (
    <>
    {/* Confirm delete modal */}
    {confirmDelete && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '28px 32px', width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY, marginBottom: 10 }}>Xoá phụ phí</div>
          <div style={{ fontSize: 14, color: C_TEXT_SECONDARY, marginBottom: 24 }}>
            Bạn có chắc muốn xoá cấu hình <strong style={{ color: C_TEXT_PRIMARY }}>{confirmDelete.label}</strong>? Dữ liệu đã nhập sẽ bị mất.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={() => setConfirmDelete(null)}
              style={{ height: 34, padding: '0 18px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_TEXT_PRIMARY, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >Huỷ</button>
            <button
              onClick={handleDeleteConfirmed}
              style={{ height: 34, padding: '0 18px', border: 'none', borderRadius: 6, background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >Xoá</button>
          </div>
        </div>
      </div>
    )}

    <div style={{ paddingTop: 10 }}>
      {allFields.map(({ key, label }, idx) => (
        <div key={key}>
          {/* Row: bullet + tên phí + nút Thêm hoặc Xoá */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C_TEXT_SECONDARY, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: C_TEXT_PRIMARY, flex: 1 }}>{label}</span>
            {isOpen(key) ? (
              <button
                onClick={() => {
                  if (isConfigured(key)) {
                    setConfirmDelete({ key, label })
                  } else {
                    // Chưa nhập gì → đóng thẳng, không cần confirm
                    setManualOpen((s) => { const n = new Set(s); n.delete(key); return n })
                  }
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: '#EF4444', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '2px 0' }}
              >
                Xoá
              </button>
            ) : (
              <button
                onClick={() => handleAdd(key)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: C_LINK, fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '2px 0' }}
              >
                <PlusOutlined style={{ fontSize: 11 }} />
                Thêm
              </button>
            )}
          </div>

          {/* Form — hiển thị khi đã config hoặc đang mở */}
          {isOpen(key) && (
            <div style={{ padding: '4px 0 10px', marginBottom: 6 }}>
              {(key === 'partialDelivery' || key === 'deliveryFailFee') ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: C_TEXT_LABEL, whiteSpace: 'nowrap' }}>Số tiền / đơn hàng</span>
                  <div style={{ position: 'relative', width: 150 }}>
                    <input
                      type="number"
                      value={surcharges[key].value}
                      onChange={(e) => updateSimple(key, e.target.value)}
                      placeholder="VD: 10000"
                      style={{ ...inputStyle, width: '100%', paddingRight: 26, boxSizing: 'border-box' }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)}
                    />
                    <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C_TEXT_SECONDARY, pointerEvents: 'none' }}>đ</span>
                  </div>
                </div>
              ) : key === 'insurance' ? (
                <FeeTierTable
                  tiers={surcharges.insurance}
                  onChangeTiers={updateInsurance}
                  colFrom="Giá trị khai giá từ"
                  colTo="Giá trị khai giá đến"
                  colPercent="Phụ phí (% trên số tiền khai giá)"
                />
              ) : key === 'codFee' ? (
                <FeeTierTable
                  tiers={surcharges.codFee}
                  onChangeTiers={updateCodFee}
                  colFrom="COD từ"
                  colTo="COD đến"
                  colPercent="Phụ phí (% trên số tiền thu hộ)"
                />
              ) : key === 'redeliveryFee' ? (
                <FeeTierTable
                  tiers={surcharges.redeliveryFee}
                  onChangeTiers={updateRedeliveryFee}
                  colFrom="Từ lần"
                  colTo="Đến lần"
                  colPercent="Phụ phí (% trên giá)"
                />
              ) : key === 'returnFee' ? (
                <FeeTierTable
                  tiers={surcharges.returnFee}
                  onChangeTiers={updateReturnFee}
                  colFrom="Từ lần"
                  colTo="Đến lần"
                  colPercent="Phụ phí (% trên giá)"
                />
              ) : null}
            </div>
          )}

          {idx < allFields.length - 1 && (
            <div style={{ height: 1, background: C_BORDER }} />
          )}
        </div>
      ))}
    </div>
    </>
  )
}

// ─── Route config block ───────────────────────────────────────────────────────

function RouteBlock({
  route,
  onChange,
  onDelete,
}: {
  route: RouteConfig
  onChange: (updated: RouteConfig) => void
  onDelete: () => void
}) {
  const [activeSection, setActiveSection] = useState<null | 'overweight' | 'surcharge'>(null)
  const [weightError, setWeightError] = useState(false)

  const toggleSection = (sec: 'overweight' | 'surcharge') =>
    setActiveSection((v) => (v === sec ? null : sec))
  const isLienTinh         = route.routeType === 'lien-vung-tinh'
  const updateSurcharges = (updated: Surcharges) => {
    onChange({ ...route, surcharges: updated })
  }

  const surchargeCount = (
    (route.surcharges.partialDelivery.value.trim() !== '' ? 1 : 0) +
    route.surcharges.insurance.length +
    route.surcharges.codFee.length +
    (route.surcharges.deliveryFailFee.value.trim() !== '' ? 1 : 0)
  )

  const updateField = <K extends keyof RouteConfig>(key: K, value: RouteConfig[K]) => {
    onChange({ ...route, [key]: value })
  }

  const handleRouteTypeChange = (newType: RouteType) => {
    onChange({
      ...route,
      routeType: newType,
      // reset location fields khi không phải liên tỉnh
      fromRegion: '', fromProvince: '', fromDistrict: '', fromWard: '',
      toRegion: '', toProvince: '', toDistrict: '', toWard: '',
    })
  }

  const addOverweightTier = () => {
    if (!route.standardWeight.trim()) {
      setWeightError(true)
      return
    }
    setWeightError(false)
    const newTier: OverweightTier = { id: Date.now().toString(), toGram: '', stepGram: '', increase: '' }
    onChange({ ...route, overweightTiers: [...route.overweightTiers, newTier] })
  }

  const updateTier = (tierId: string, updated: OverweightTier) => {
    onChange({
      ...route,
      overweightTiers: route.overweightTiers.map((t) => t.id === tierId ? updated : t),
    })
  }

  const deleteTier = (tierId: string) => {
    onChange({ ...route, overweightTiers: route.overweightTiers.filter((t) => t.id !== tierId) })
  }

  // compute prev label for each tier
  const getPrevLabel = (index: number): string => {
    if (index === 0) {
      return route.standardWeight ? `${Number(route.standardWeight) + 1}g` : '...'
    }
    const prev = route.overweightTiers[index - 1]
    return prev.toGram ? `${Number(prev.toGram) + 1}g` : '...'
  }

  return (
    <div style={{ position: 'relative', border: `1px solid ${C_BORDER}`, borderLeft: `4px solid ${C_ACTION}`, borderRadius: 8, padding: '16px', background: '#fff', marginBottom: 12 }}>
      {/* X button — top right corner */}
      <button
        onClick={onDelete}
        title="Xoá tuyến"
        style={{ position: 'absolute', top: 8, right: 8, border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', lineHeight: 1 }}
      >
        ✕
      </button>

      {/* Header row: tuyến + khối lượng + giá */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 14, paddingRight: 24 }}>
        {/* Tuyến */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: C_TEXT_LABEL }}>Tuyến</span>
          <select
            value={route.routeType}
            onChange={(e) => handleRouteTypeChange(e.target.value as RouteType)}
            style={{ ...inputStyle, padding: '6px 10px', fontWeight: 600, cursor: 'pointer', fontSize: 13, width: 190 }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
            onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)}
          >
            {(Object.entries(ROUTE_TYPE_LABELS) as [RouteType, string][]).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Khối lượng chuẩn */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: weightError ? '#EF4444' : C_TEXT_LABEL }}>Khối lượng chuẩn <span style={{ color: '#EF4444' }}>*</span></span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ position: 'relative', width: 130 }}>
              <input
                type="number"
                value={route.standardWeight}
                onChange={(e) => { updateField('standardWeight', e.target.value); if (e.target.value.trim()) setWeightError(false) }}
                placeholder="VD: 500"
                style={{ ...inputStyle, width: '100%', paddingRight: 40, borderColor: weightError ? '#EF4444' : C_BORDER, boxSizing: 'border-box' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = weightError ? '#EF4444' : '#FFA274')}
                onBlur={(e) => (e.currentTarget.style.borderColor = weightError ? '#EF4444' : C_BORDER)}
              />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C_TEXT_SECONDARY, pointerEvents: 'none' }}>gram</span>
            </div>
            {weightError && <span style={{ fontSize: 11, color: '#EF4444' }}>Vui lòng nhập khối lượng chuẩn</span>}
          </div>
        </div>

        {/* Giá chuẩn */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: C_TEXT_LABEL }}>Giá chuẩn <span style={{ color: '#EF4444' }}>*</span></span>
          <div style={{ position: 'relative', width: 140 }}>
            <input
              type="number"
              value={route.basePrice}
              onChange={(e) => updateField('basePrice', e.target.value)}
              placeholder="VD: 20000"
              style={{ ...inputStyle, width: '100%', paddingRight: 28, boxSizing: 'border-box' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
              onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)}
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C_TEXT_SECONDARY, pointerEvents: 'none' }}>đ</span>
          </div>
        </div>

        {/* Buttons ngưỡng vượt cân + phụ phí — căn phải, cùng column structure với các field */}
        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, lineHeight: '16px', visibility: 'hidden', userSelect: 'none' }}>_</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {([
              { key: 'overweight' as const, label: 'Vượt cân', count: route.overweightTiers.length },
              { key: 'surcharge'  as const, label: 'Phụ phí',          count: surchargeCount },
            ]).map(({ key, label, count }) => {
              const isActive = activeSection === key
              return (
                <button key={key} onClick={() => {
                    const isOpening = activeSection !== key
                    toggleSection(key)
                    // Auto-add empty tier khi mở lần đầu (count=0)
                    if (key === 'overweight' && isOpening && route.overweightTiers.length === 0) {
                      const newTier: OverweightTier = { id: Date.now().toString(), toGram: '', stepGram: '', increase: '' }
                      onChange({ ...route, overweightTiers: [newTier] })
                    }
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    height: 32, padding: '0 12px', cursor: 'pointer', borderRadius: 6, fontSize: 13, fontWeight: 500,
                    border: isActive ? `1px solid ${C_ACTION}` : 'none',
                    background: isActive ? '#FFF4ED' : C_BG_HEADER,
                    color: isActive ? C_ACTION : C_TEXT_SECONDARY,
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                  <span style={{
                    fontSize: 11, fontWeight: 600, lineHeight: '16px',
                    padding: '0 5px', borderRadius: 8,
                    background: isActive ? C_ACTION : '#D1D5DB',
                    color: isActive ? '#fff' : '#6B7280',
                    minWidth: 18, textAlign: 'center',
                  }}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Liên tỉnh: location selectors (luôn hiển thị) */}
      {isLienTinh && (
        <div style={{ padding: '12px 14px', background: C_BG_FORM, borderRadius: 6, marginBottom: 14, border: `1px solid ${C_BORDER}` }}>
          {/* Grid: col1=label, col2=Vùng, col3=Tỉnh, col4=Quận, col5=Phường */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 1fr 1fr', gap: '8px 10px', alignItems: 'end' }}>
            {/* Header labels — row 1 */}
            <div />
            <span style={labelStyle}>Vùng</span>
            <span style={labelStyle}>Tỉnh / Thành phố</span>
            <span style={labelStyle}>Quận / Huyện</span>
            <span style={labelStyle}>Phường / Xã</span>

            {/* Từ — row 2 */}
            <span style={{ fontSize: 12, color: C_TEXT_LABEL, fontWeight: 600, paddingBottom: 7 }}>Từ</span>
            <select
              value={route.fromRegion}
              onChange={(e) => updateField('fromRegion', e.target.value as RegionCode)}
              style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
              onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)}
            >
              {REGION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input value={route.fromProvince} onChange={(e) => updateField('fromProvince', e.target.value)} placeholder="Tất cả" style={{ ...inputStyle, width: '100%' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')} onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)} />
            <input value={route.fromDistrict} onChange={(e) => updateField('fromDistrict', e.target.value)} placeholder="Tất cả" style={{ ...inputStyle, width: '100%' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')} onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)} />
            <input value={route.fromWard}     onChange={(e) => updateField('fromWard', e.target.value)}     placeholder="Tất cả" style={{ ...inputStyle, width: '100%' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')} onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)} />

            {/* Đến — row 3 */}
            <span style={{ fontSize: 12, color: C_TEXT_LABEL, fontWeight: 600, paddingBottom: 7 }}>Đến</span>
            <select
              value={route.toRegion}
              onChange={(e) => updateField('toRegion', e.target.value as RegionCode)}
              style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
              onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)}
            >
              {REGION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input value={route.toProvince} onChange={(e) => updateField('toProvince', e.target.value)} placeholder="Tất cả" style={{ ...inputStyle, width: '100%' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')} onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)} />
            <input value={route.toDistrict} onChange={(e) => updateField('toDistrict', e.target.value)} placeholder="Tất cả" style={{ ...inputStyle, width: '100%' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')} onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)} />
            <input value={route.toWard}     onChange={(e) => updateField('toWard', e.target.value)}     placeholder="Tất cả" style={{ ...inputStyle, width: '100%' }} onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')} onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)} />
          </div>
        </div>
      )}


      {/* Tab content: Vượt cân */}
      {activeSection === 'overweight' && (
        <div style={{ padding: '10px 0 4px' }}>
          {route.overweightTiers.map((tier, idx) => (
            <OverweightTierRow
              key={tier.id}
              tier={tier}
              prevLabel={getPrevLabel(idx)}
              onChange={(updated) => updateTier(tier.id, updated)}
              onDelete={() => deleteTier(tier.id)}
            />
          ))}
          <button
            onClick={addOverweightTier}
            style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', color: C_ACTION, fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '4px 0', marginTop: 2 }}
          >
            <PlusOutlined style={{ fontSize: 12 }} />
            Thêm ngưỡng vượt cân
          </button>
        </div>
      )}

      {/* Tab content: Phụ phí */}
      {activeSection === 'surcharge' && (
        <SurchargeList
          surcharges={route.surcharges}
          onUpdateSurcharges={updateSurcharges}
        />
      )}
    </div>
  )
}

// ─── Zone guide modal ─────────────────────────────────────────────────────────

const ZONE_GUIDE_ROWS: { type: string; definition: string; routes: string[] }[] = [
  {
    type: 'Nội Tỉnh',
    definition: 'Là lộ trình giao - nhận hàng hóa chỉ trong khu vực của tỉnh thành đó và nằm trong cùng 1 miền gửi hàng.',
    routes: [
      'Hà Nội <=> Hà Nội',
      'Đà Nẵng <=> Đà Nẵng',
      'Hồ Chí Minh <=> Hồ Chí Minh',
      'Tỉnh X vùng 1 <=> Tỉnh X vùng 1',
      'Tỉnh X vùng 2 <=> Tỉnh X vùng 2',
      'Tỉnh X vùng 3 <=> Tỉnh X vùng 3',
    ],
  },
  {
    type: 'Nội Vùng',
    definition: 'Là lộ trình giao - nhận hàng hoá giữa TP. Hà Nội & Vùng 3, TP. Đà Nẵng & Vùng 2, TP. Hồ Chí Minh & Vùng 1.',
    routes: [
      'Hà Nội <=> Vùng 3',
      'Đà Nẵng <=> Vùng 2',
      'Hồ Chí Minh <=> Vùng 1',
    ],
  },
  {
    type: 'Nội Vùng Tỉnh',
    definition: 'Là lộ trình giao - nhận hàng hóa giữa 2 tỉnh thành chỉ nằm trong cùng 1 miền gửi hàng.',
    routes: [
      'Vùng 3 <=> Vùng 3',
      'Vùng 2 <=> Vùng 2',
      'Vùng 1 <=> Vùng 1',
    ],
  },
  {
    type: 'Liên Vùng Đặc Biệt',
    definition: 'Là lộ trình giao - nhận hàng hóa giữa 3 thành phố lớn Hà Nội, Đà Nẵng và Hồ Chí Minh với nhau.',
    routes: [
      'Hà Nội <=> Đà Nẵng',
      'Đà Nẵng <=> Hồ Chí Minh',
      'Hồ Chí Minh <=> Hà Nội',
    ],
  },
  {
    type: 'Liên Vùng',
    definition: 'Là lộ trình giao - nhận hàng hoá giữa TP. Hà Nội và Vùng 1/Vùng 2, TP. Đà Nẵng & Vùng 1/Vùng 3, TP. HCM & Vùng 2/Vùng 3.',
    routes: [
      'Hà Nội <=> Vùng 1/Vùng 2',
      'Đà Nẵng <=> Vùng 1/Vùng 3',
      'Hồ Chí Minh <=> Vùng 2/Vùng 3',
    ],
  },
  {
    type: 'Liên Vùng Tỉnh',
    definition: 'Là lộ trình giao - nhận hàng hóa giữa các tỉnh thành thuộc 2 vùng địa lý khác nhau, bao gồm cả các tuyến giữa miền Bắc và miền Nam.',
    routes: [
      'Vùng 3 <=> Vùng 1/Vùng 2',
      'Vùng 2 <=> Vùng 1/Vùng 3',
      'Vùng 1 <=> Vùng 2/Vùng 3',
    ],
  },
]

function ZoneGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 900, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Bảng mô tả tuyến dịch vụ</span>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: C_TEXT_SECONDARY, padding: 4, display: 'flex', alignItems: 'center' }}
          >
            <CloseOutlined style={{ fontSize: 16 }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflow: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Định nghĩa vùng */}
          <div style={{ background: C_BG_FORM, border: `1px solid ${C_BORDER}`, borderRadius: 8, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY, marginBottom: 2 }}>Định nghĩa vùng</span>
            {[
              { label: 'Vùng 1', mien: 'Miền Nam',   desc: 'Từ Bình Định trở vào các tỉnh miền Nam' },
              { label: 'Vùng 2', mien: 'Miền Trung', desc: 'Từ Quảng Ngãi ra tới Quảng Bình' },
              { label: 'Vùng 3', mien: 'Miền Bắc',   desc: 'Từ Hà Tĩnh trở ra các tỉnh miền Bắc' },
            ].map(({ label, mien, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 13 }}>
                <span style={{ padding: '1px 8px', borderRadius: 20, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{label}</span>
                <span style={{ color: C_TEXT_SECONDARY }}><strong style={{ color: C_TEXT_PRIMARY }}>{mien}</strong> — {desc}</span>
              </div>
            ))}
            <div style={{ marginTop: 4, fontSize: 12, color: '#D97706', fontStyle: 'italic', fontWeight: 500 }}>
              Lưu ý: 03 thành phố Hà Nội, Đà Nẵng, Hồ Chí Minh không nằm trong 3 phân vùng trên.
            </div>
          </div>

          {/* Bảng tuyến */}
          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 260px', background: C_ACTION }}>
              <div style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#fff', borderRight: '1px solid rgba(255,255,255,0.25)' }}>Tuyến</div>
              <div style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#fff', borderRight: '1px solid rgba(255,255,255,0.25)' }}>Định nghĩa</div>
              <div style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#fff' }}>Ví dụ</div>
            </div>
            {/* Rows */}
            {ZONE_GUIDE_ROWS.map((row, rowIdx) => (
              <div
                key={row.type}
                style={{ display: 'grid', gridTemplateColumns: '160px 1fr 260px', borderTop: `1px solid ${C_BORDER}`, background: rowIdx % 2 === 0 ? '#fff' : C_BG_FORM }}
              >
                <div style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY, borderRight: `1px solid ${C_BORDER}` }}>
                  {row.type}
                </div>
                <div style={{ padding: '10px 16px', fontSize: 13, color: C_TEXT_SECONDARY, borderRight: `1px solid ${C_BORDER}`, lineHeight: '1.5' }}>
                  {row.definition}
                </div>
                <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {row.routes.map((r, i) => (
                    <span key={i} style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{r}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PricingCreate() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [showZoneGuide, setShowZoneGuide] = useState(false)
  const [bulkWeight, setBulkWeight] = useState('')
  const [bulkPrice, setBulkPrice] = useState('')
  const [routes, setRoutes] = useState<RouteConfig[]>([
    makeEmptyRoute('noi-tinh',           '1'),
    makeEmptyRoute('noi-vung',           '2'),
    makeEmptyRoute('noi-vung-tinh',      '3'),
    makeEmptyRoute('lien-vung-dac-biet', '4'),
    makeEmptyRoute('lien-vung',          '5'),
    makeEmptyRoute('lien-vung-tinh',     '6'),
  ])

  const canSubmit = name.trim().length > 0

  const addRoute = () => {
    setRoutes((prev) => [...prev, makeEmptyRoute('noi-tinh', Date.now().toString())])
  }

  const updateRoute = (id: string, updated: RouteConfig) => {
    setRoutes((prev) => {
      const old = prev.find((r) => r.id === id)
      if (old && (old.standardWeight !== updated.standardWeight || old.basePrice !== updated.basePrice)) {
        setBulkWeight('')
        setBulkPrice('')
      }
      return prev.map((r) => r.id === id ? updated : r)
    })
  }

  const deleteRoute = (id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id))
  }

  const applyBulkDefaults = () => {
    setRoutes((prev) => prev.map((r) => ({
      ...r,
      ...(bulkWeight ? { standardWeight: bulkWeight } : {}),
      ...(bulkPrice  ? { basePrice: bulkPrice }       : {}),
    })))
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    navigate('/agency-admin/carrier-setup', { state: { tab: 'pricing' } })
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: `1px solid ${C_BORDER}`,
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)',
  }

  return (
    <div style={{
      background: C_BG_FORM,
      minHeight: 'calc(100vh - 40px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center',
        width: '100%', maxWidth: 1024,
        padding: '24px 80px', boxSizing: 'border-box',
      }}>
        <button
          onClick={() => navigate('/agency-admin/carrier-setup')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeftOutlined style={{ fontSize: 20, color: C_TEXT_PRIMARY }} />
        </button>
        <span style={{ flex: 1, fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '28px' }}>
          Tạo bảng giá mới
        </span>
      </div>

      {/* ── Form sections ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        width: '100%', maxWidth: 1024,
        padding: '0 80px', boxSizing: 'border-box',
      }}>

        {/* Section 1: Thông tin cơ bản */}
        <div style={cardStyle}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
            Thông tin cơ bản
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 14, color: C_TEXT_LABEL, lineHeight: '20px' }}>
              Tên bảng giá <span style={{ color: '#EF4444' }}>*</span>
            </span>
            <div style={{
              background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
              padding: '6px 12px', display: 'flex', alignItems: 'center', maxWidth: 480,
            }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Bảng giá GHN 2025"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 14, color: C_TEXT_LABEL, lineHeight: '20px' }}>Mô tả</span>
            <div style={{
              background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
              padding: '6px 12px', display: 'flex', alignItems: 'flex-start', maxWidth: 480,
            }}>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                placeholder="Mô tả ngắn về bảng giá..."
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Danh sách tuyến */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
                Danh sách tuyến
              </span>
              <button
                onClick={() => setShowZoneGuide(true)}
                title="Xem định nghĩa vùng tuyến"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: `1px solid ${C_BORDER}`, borderRadius: 6, background: C_BG_FORM, color: C_TEXT_SECONDARY, fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: '3px 10px', lineHeight: '18px' }}
              >
                <InfoCircleOutlined style={{ fontSize: 12 }} />
                Định nghĩa tuyến
              </button>
            </div>
            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>{routes.length} tuyến</span>
          </div>
          {showZoneGuide && <ZoneGuideModal onClose={() => setShowZoneGuide(false)} />}

          {/* Nhập nhanh đồng giá */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '8px 12px 8px 20px', background: '#F9FAFB', border: `1px solid ${C_BORDER}`, borderRadius: 8, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap', width: 190, flexShrink: 0 }}>Áp dụng đồng giá:</span>
            <div style={{ position: 'relative', width: 130 }}>
              <input
                type="number"
                value={bulkWeight}
                onChange={(e) => setBulkWeight(e.target.value)}
                placeholder="VD: 2000"
                style={{ ...inputStyle, width: '100%', paddingRight: 40, boxSizing: 'border-box' }}
              />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C_TEXT_SECONDARY, pointerEvents: 'none' }}>gram</span>
            </div>
            <div style={{ position: 'relative', width: 140 }}>
              <input
                type="number"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="VD: 15000"
                style={{ ...inputStyle, width: '100%', paddingRight: 28, boxSizing: 'border-box' }}
              />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C_TEXT_SECONDARY, pointerEvents: 'none' }}>đ</span>
            </div>
            <button
              onClick={applyBulkDefaults}
              disabled={!bulkWeight && !bulkPrice}
              style={{ fontSize: 12, fontWeight: 600, height: 32, padding: '0 14px', border: 'none', borderRadius: 6, cursor: (!bulkWeight && !bulkPrice) ? 'default' : 'pointer', background: (!bulkWeight && !bulkPrice) ? C_BG_HEADER : C_ACTION, color: (!bulkWeight && !bulkPrice) ? C_TEXT_SECONDARY : '#fff', whiteSpace: 'nowrap' }}
            >
              Áp dụng tất cả
            </button>
          </div>

          <div>
            {routes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C_TEXT_SECONDARY, fontSize: 13 }}>
                Chưa có tuyến nào. Thêm tuyến để cấu hình giá.
              </div>
            )}
            {routes.map((route) => (
              <RouteBlock
                key={route.id}
                route={route}
                onChange={(updated) => updateRoute(route.id, updated)}
                onDelete={() => deleteRoute(route.id)}
              />
            ))}
            <button
              onClick={addRoute}
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px dashed ${C_BORDER}`, borderRadius: 8, background: C_BG_FORM, color: C_TEXT_SECONDARY, fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '10px 16px', width: '100%', justifyContent: 'center', marginTop: 4, boxSizing: 'border-box' }}
            >
              <PlusOutlined style={{ fontSize: 13 }} />
              Thêm tuyến
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 16 }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
              background: canSubmit ? C_ACTION : C_BG_HEADER,
              border: 'none', borderRadius: 6,
              padding: '8px 12px', cursor: canSubmit ? 'pointer' : 'default',
            }}
          >
            <PlusOutlined style={{ color: canSubmit ? '#fff' : '#9CA3AF', fontSize: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: canSubmit ? '#fff' : '#9CA3AF', lineHeight: '20px', whiteSpace: 'nowrap' }}>
              Tạo bảng giá
            </span>
          </button>
        </div>

      </div>
    </div>
  )
}
