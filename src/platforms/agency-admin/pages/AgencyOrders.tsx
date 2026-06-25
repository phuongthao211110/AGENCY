import { useState, useEffect } from 'react'
import { ConfigProvider } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { agencyAdminTheme } from '../../../theme/platforms'
import allOrders from '../../../mock-data/orders.json'
import allShops from '../../../mock-data/shops.json'
import allServices from '../../../mock-data/services.json'
import allPricing from '../../../mock-data/pricing.json'

// ── Design tokens ────────────────────────────────────────────
const C_ACTION         = '#FF5200'
const C_LINK           = '#3B82F6'
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_BODY      = '#050505'
const C_TEXT_SECONDARY = '#6B7280'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'


// ── Fee calculation helpers ──────────────────────────────────
type FeeTier = { id: string; fromValue: string; toValue: string; fixedFee: string; percentFee: string }
type PricingSurcharges = {
  partialDelivery?: { value: string; unit: string }
  insurance?:       FeeTier[]
  deliveryFailFee?: { value: string; unit: string }
  codFee?:          FeeTier[]
}

function calcTierFee(amount: number, tiers: FeeTier[]): number {
  if (!tiers || tiers.length === 0 || amount <= 0) return 0
  const tier = tiers.find(t => amount >= parseFloat(t.fromValue) && amount <= parseFloat(t.toValue))
  if (!tier) return 0
  return Math.round(amount * parseFloat(tier.percentFee) / 100 + parseFloat(tier.fixedFee))
}

// ── Simulated current agency ─────────────────────────────────
const CURRENT_AGENCY_ID = 'AGN001'
const agencyShops = allShops.filter(s => s.agencyId === CURRENT_AGENCY_ID)
const agencyShopIds = new Set(agencyShops.map(s => s.id))
const agencyOrders = allOrders.filter(o => agencyShopIds.has(o.shopId))

// ── Drawer icon helpers ──────────────────────────────────────
const IC = '#6B7280'
function IcX() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
}
function IcStore() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 7v1a3 3 0 006 0V7m0 1a3 3 0 006 0V7m0 1a3 3 0 006 0V7H3l2-4h14l2 4M5 21V10.85M19 21V10.85M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4"/></svg>
}
function IcUser() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></svg>
}
function IcCube() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16.196V8.203a1 1 0 00-.496-.864l-7-4a1 1 0 00-1.008 0l-7 4A1 1 0 004 8.203v7.993a1 1 0 00.496.864l7 4a1 1 0 001.008 0l7-4A1 1 0 0021 16.196z"/><path d="M4 8l8 4m0 0l8-4m-8 4v9"/></svg>
}
function IcClipboard() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><path d="M9 12h6M9 16h4"/></svg>
}
function IcChevronDown({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
}
function IcTruck() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
}
function IcHelp() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="7.5" fill="#9CA3AF"/>
      <path d="M6.7 6.2C6.7 5.4 7.3 5 8 5c.8 0 1.3.5 1.3 1.2 0 .6-.4 1-.9 1.3-.3.2-.4.5-.4.8v.4" stroke="white" strokeWidth="1.1" strokeLinecap="round"/>
      <circle cx="8" cy="10.6" r=".65" fill="white"/>
    </svg>
  )
}

// ── Checkbox (blue, used inside drawer form) ─────────────────
function CheckboxBlue({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 16, height: 16, borderRadius: 3, flexShrink: 0, cursor: 'pointer',
        border: checked ? 'none' : '1.5px solid #E5E7EB',
        background: checked ? '#3B82F6' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 12 9" fill="none">
          <path d="M1 4L4.5 7.5L11 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  )
}

// ── Sample products (mock per order) ─────────────────────────
const SAMPLE_PRODUCTS = [
  ['Giày Thể Thao Nam - SL: 2'],
  ['Áo Thun Cotton Nam - Oversize - SL: 2', 'Bình Giữ Nhiệt Cao Cấp - SL: 1'],
  ['Áo Thun Trơn Cổ Tròn Thoáng Khí - SL: 10'],
  ['Quần Jean Nam Slim Fit - SL: 1', 'Áo Polo Cổ Bẻ - SL: 2'],
]
const orderProducts: Record<string, string[]> = {}
agencyOrders.forEach((o, i) => { orderProducts[o.id] = SAMPLE_PRODUCTS[i % SAMPLE_PRODUCTS.length] })

// ── Checkbox ─────────────────────────────────────────────────
function Checkbox({ checked, onChange }: { checked: boolean; onChange?: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange?.() }}
      style={{
        width: 20, height: 20, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
        border: checked ? 'none' : `1.5px solid ${C_BORDER}`,
        background: checked ? C_ACTION : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {checked && (
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
          <path d="M1 4L4.5 7.5L11 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  )
}

// ── Shared sub-components (defined outside to keep stable references across renders) ──
function NumericWithUnit({ value, onChange, unit, width, flex1, disabled }: {
  value: number; onChange: (v: number) => void; unit: string; width?: number; flex1?: boolean; disabled?: boolean
}) {
  return (
    <div style={{ background: disabled ? '#F3F4F6' : '#F9FAFB', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 8, opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto', ...(flex1 ? { flex: 1, minWidth: 0 } : { width: width ?? 180, flexShrink: 0 }) }}>
      <input
        value={value === 0 ? '0' : value.toLocaleString('en-US')}
        onChange={(e) => onChange(parseFloat(e.target.value.replace(/,/g, '')) || 0)}
        type="text" disabled={disabled}
        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, textAlign: 'right', background: 'transparent', lineHeight: '20px', minWidth: 0 }}
      />
      <div style={{ background: '#F3F4F6', width: 32, height: 32, borderRadius: '0 6px 6px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{unit}</span>
      </div>
    </div>
  )
}

function InfoRow({ label, hint, children }: { label: string; hint?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap' }}>{label}</span>
        {hint && <IcHelp />}
      </div>
      {children}
    </div>
  )
}

// ── CreateOrderDrawer ────────────────────────────────────────
function CreateOrderDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedShopId, setSelectedShopId]         = useState(agencyShops[0]?.id ?? '')
  const [pickupType, setPickupType]                  = useState<'home' | 'post'>('home')
  const [rcvName, setRcvName]                        = useState('Nguyễn Văn An')
  const [rcvPhone, setRcvPhone]                      = useState('0909888999')
  const [rcvStreet, setRcvStreet]                    = useState('123 Thành Thái')
  const [productName, setProductName]                = useState('')
  const [qty, setQty]                                = useState(1)
  const [price, setPrice]                            = useState(0)
  const [weight, setWeight]                          = useState(0.2)
  const [dimD, setDimD]                              = useState(10)
  const [dimR, setDimR]                              = useState(10)
  const [dimC, setDimC]                              = useState(10)
  const [cod, setCod]                                = useState(0)
  const [discount, setDiscount]                      = useState(0)
  const [shipCollect, setShipCollect]                = useState(0)
  const [goodsValue, setGoodsValue]                  = useState(0)
  const [shopCode, setShopCode]                      = useState('')
  const [declareValue, setDeclareValue]              = useState(false)
  const [partialDeliver, setPartialDeliver]          = useState(false)
  const [collectOnFail, setCollectOnFail]            = useState(true)
  const [collectOnFailAmt, setCollectOnFailAmt]      = useState(0)

  const selectedShop = agencyShops.find(s => s.id === selectedShopId) ?? agencyShops[0]
  const shopServices = ((selectedShop as any)?.configuredServices ?? []).map((cs: { serviceId: string; demoFee: number }) => ({
    ...cs,
    service: allServices.find(sv => sv.id === cs.serviceId),
  })).filter((cs: any) => cs.service && cs.service.priceTableId)
  const [selectedServiceId, setSelectedServiceId] = useState<string>(shopServices[0]?.serviceId ?? '')
  const [feePayer, setFeePayer] = useState<'sender' | 'receiver'>('sender')

  const convertedWeight = Math.max(weight, (dimD * dimR * dimC) / 5000).toFixed(1)

  // ── Fee calculations ──────────────────────────────────────
  const selectedService     = allServices.find(s => s.id === selectedServiceId)
  const selectedServiceConf = shopServices.find((cs: any) => cs.serviceId === selectedServiceId)
  const priceTable          = selectedService?.priceTableId
    ? (allPricing as any[]).find(p => p.id === selectedService.priceTableId)
    : null
  const surcharges          = (priceTable?.surcharges ?? {}) as PricingSurcharges

  const feeShipping         = (selectedServiceConf as any)?.demoFee ?? 0
  const feeInsurance     = declareValue && goodsValue > 0
    ? calcTierFee(goodsValue, surcharges.insurance ?? [])
    : 0
  const feePartial       = partialDeliver
    ? parseInt(surcharges.partialDelivery?.value ?? '0', 10)
    : 0
  const feeDeliveryFail  = collectOnFail
    ? parseInt(surcharges.deliveryFailFee?.value ?? '0', 10)
    : 0
  const feeCod           = cod > 0
    ? calcTierFee(cod, surcharges.codFee ?? [])
    : 0
  const totalShipping    = feeShipping + feeInsurance + feePartial + feeDeliveryFail + feeCod
  const totalCollect     = feePayer === 'sender'
    ? cod + (shipCollect > 0 ? shipCollect : 0)
    : cod + feeShipping
  const now = new Date()
  const createdAt = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} - ${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`

  const card: React.CSSProperties = {
    background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
    display: 'flex', flexDirection: 'column', width: '100%',
  }

  function CardHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
          {icon}
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{label}</span>
        </div>
        <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />
      </>
    )
  }

  function FieldInput({ value, onChange, placeholder, style: extra }: {
    value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties
  }) {
    return (
      <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center', ...extra }}>
        <input
          value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
        />
      </div>
    )
  }

  function FieldDropdown({ placeholder, value }: { placeholder?: string; value?: string }) {
    return (
      <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', width: '100%' }}>
        <span style={{ flex: 1, fontSize: 14, color: value ? C_TEXT_PRIMARY : '#9CA3AF', lineHeight: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || placeholder}
        </span>
        <IcChevronDown size={20} />
      </div>
    )
  }

  const currentServices = ((agencyShops.find(s => s.id === selectedShopId) as any)?.configuredServices ?? []).map((cs: { serviceId: string; demoFee: number }) => ({
    ...cs,
    service: allServices.find(sv => sv.id === cs.serviceId),
  })).filter((cs: any) => cs.service && cs.service.priceTableId)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 200,
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: 980, height: '100vh',
        background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.2)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Tạo đơn hàng</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <IcX />
          </button>
        </div>
        <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

        {/* Body */}
        <div style={{
          flex: 1, display: 'flex', gap: 6, padding: 6,
          background: '#F3F4F6', overflow: 'hidden', alignItems: 'flex-start',
        }}>

          {/* ═══ LEFT COLUMN ═══════════════════════════════════ */}
          <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>

            {/* ── Chọn shop card ── */}
            <div style={card}>
              <CardHeader icon={<IcStore />} label="Shop tạo đơn" />
              <div style={{ padding: 8 }}>
                <div style={{
                  background: '#F9FAFB', borderRadius: 6, padding: '6px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <select
                    value={selectedShopId}
                    onChange={e => {
                      setSelectedShopId(e.target.value)
                      const newShop = agencyShops.find(s => s.id === e.target.value)
                      const firstService = ((newShop as any)?.configuredServices ?? [])[0]?.serviceId ?? ''
                      setSelectedServiceId(firstService)
                    }}
                    style={{
                      flex: 1, border: 'none', outline: 'none', fontSize: 14,
                      color: C_TEXT_PRIMARY, background: 'transparent', cursor: 'pointer', lineHeight: '20px',
                    }}
                  >
                    {agencyShops.map(s => (
                      <option key={s.id} value={s.id}>{s.name} — {s.ownerName}</option>
                    ))}
                  </select>
                  <IcChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* ── Bên gửi card ── */}
            <div style={card}>
              <CardHeader icon={<IcStore />} label="Bên gửi" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', display: 'flex', gap: 12, cursor: 'pointer', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', overflow: 'hidden' }}>
                    <div>{selectedShop?.ownerName ?? 'Chủ shop'} - {selectedShop?.phone ?? ''}</div>
                    <div style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{selectedShop?.address ?? ''}</div>
                  </div>
                  <div style={{ paddingTop: 2, flexShrink: 0 }}><IcChevronDown /></div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 40, padding: '6px 12px' }}>
                  {(['home'] as const).map((t) => {
                    const active = pickupType === t
                    const label  = 'Lấy hàng tận nơi'
                    return (
                      <div key={t} onClick={() => setPickupType(t)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${active ? C_ACTION : C_BORDER}`,
                          background: active ? C_ACTION : '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                        </div>
                        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap' }}>{label}</span>
                      </div>
                    )
                  })}
                </div>

                <FieldDropdown placeholder="Chọn ca lấy hàng (Tuỳ chọn)" />
              </div>
            </div>

            {/* ── Bên nhận card ── */}
            <div style={card}>
              <CardHeader icon={<IcUser />} label="Bên nhận" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 6, padding: '6px 12px' }}>
                    <input
                      value={rcvName} onChange={(e) => setRcvName(e.target.value)}
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 200, background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      value={rcvPhone} onChange={(e) => setRcvPhone(e.target.value)}
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px', paddingRight: 70 }}
                    />
                    <div style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', background: '#D9F7E5', height: 22, padding: '0 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, color: C_TEXT_PRIMARY, lineHeight: '22px' }}>TLHH:</span>
                      <span style={{ fontSize: 13, color: '#10B981', lineHeight: '22px' }}>0%</span>
                    </div>
                  </div>
                </div>
                <FieldInput value={rcvStreet} onChange={setRcvStreet} placeholder="Số nhà, tên đường" />
                <FieldDropdown value="Phường Diên Hồng, Hồ Chí Minh" />
              </div>
            </div>

            {/* ── Sản phẩm card ── */}
            <div style={{ ...card, flex: 1 }}>
              <CardHeader icon={<IcCube />} label="Sản phẩm" />

              <div style={{ padding: 8 }}>
                <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', background: '#F3F4F6' }}>
                    <div style={{ flex: 1, minWidth: 0, padding: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Tên sản phẩm</span>
                    </div>
                    <div style={{ width: 56, flexShrink: 0, padding: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', display: 'block', textAlign: 'right' }}>SL: {qty}</span>
                    </div>
                    <div style={{ width: 104, flexShrink: 0, padding: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', display: 'block', textAlign: 'right' }}>Giá bán</span>
                    </div>
                    <div style={{ width: 96, flexShrink: 0, padding: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', display: 'block', textAlign: 'right' }}>KL / KT</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <div style={{ flex: 1, minWidth: 0, padding: 6 }}>
                      <div style={{ background: '#F9FAFB', borderRadius: 6, height: 32, padding: '0 8px', display: 'flex', alignItems: 'center' }}>
                        <input
                          value={productName} onChange={(e) => setProductName(e.target.value)}
                          placeholder="Tên sản phẩm"
                          style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
                        />
                      </div>
                    </div>
                    <div style={{ width: 56, flexShrink: 0, padding: 6 }}>
                      <div style={{ background: '#F9FAFB', borderRadius: 6, height: 32, padding: '0 8px', display: 'flex', alignItems: 'center' }}>
                        <input
                          value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                          type="number" min={1}
                          style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, textAlign: 'right', background: 'transparent', lineHeight: '20px' }}
                        />
                      </div>
                    </div>
                    <div style={{ width: 104, flexShrink: 0, padding: 6 }}>
                      <div style={{ background: '#F9FAFB', borderRadius: 6, height: 32, padding: '0 8px', display: 'flex', alignItems: 'center' }}>
                        <input
                          value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                          type="number" min={0}
                          style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, textAlign: 'right', background: 'transparent', lineHeight: '20px' }}
                        />
                      </div>
                    </div>
                    <div style={{ width: 96, flexShrink: 0, padding: 6, display: 'flex', flexDirection: 'column', justifyContent: 'center', fontSize: 12, color: C_TEXT_PRIMARY, lineHeight: '16px', textAlign: 'right', whiteSpace: 'nowrap', opacity: productName ? 1 : 0 }}>
                      <span>{weight}kg</span>
                      <span>{dimD}x{dimR}x{dimC}cm</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', width: 72, flexShrink: 0 }}>Khối lượng</span>
                  <NumericWithUnit value={weight} onChange={setWeight} unit="kg" flex1 />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', width: 72, flexShrink: 0 }}>Kích thước</span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 2 }}>
                    {([['D', dimD, setDimD], ['R', dimR, setDimR], ['C', dimC, setDimC]] as const).map(([lbl, val, set]) => (
                      <div key={lbl} style={{ flex: 1, minWidth: 0, background: '#F9FAFB', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                        <span style={{ flexShrink: 0, fontSize: 14, color: '#9CA3AF', lineHeight: '20px', whiteSpace: 'nowrap' }}>{lbl}:</span>
                        <input
                          value={val} onChange={(e) => (set as (v: number) => void)(parseFloat(e.target.value) || 0)} type="number"
                          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, textAlign: 'right', background: 'transparent', lineHeight: '20px', padding: '0 8px' }}
                        />
                        <div style={{ background: '#F3F4F6', width: 32, height: 32, borderRadius: '0 6px 6px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>cm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ paddingLeft: 84, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Khối lượng quy đổi: {convertedWeight}kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN (w-400px) ════════════════════════ */}
          <div style={{ width: 400, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>

            {/* ── Thông tin đơn hàng card ── */}
            <div style={{ ...card, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, flexShrink: 0 }}>
                <IcClipboard />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Thông tin đơn hàng</span>
                <span style={{ fontSize: 14, color: '#4B5563', lineHeight: '20px', whiteSpace: 'nowrap' }}>Tạo lúc {createdAt}</span>
              </div>
              <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                  <InfoRow label="Mã đơn shop">
                    <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', width: 180, flexShrink: 0 }}>
                      <input
                        value={shopCode} onChange={(e) => setShopCode(e.target.value)}
                        placeholder="Mã đơn shop"
                        style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: '#9CA3AF', background: 'transparent', lineHeight: '20px' }}
                      />
                    </div>
                  </InfoRow>
                  <InfoRow label="COD">
                    <NumericWithUnit value={cod} onChange={setCod} unit="đ" />
                  </InfoRow>
                  <InfoRow label="Giảm giá">
                    <NumericWithUnit value={discount} onChange={setDiscount} unit="đ" />
                  </InfoRow>
                  <InfoRow label="Thu ship khách hàng" hint>
                    <NumericWithUnit value={shipCollect} onChange={setShipCollect} unit="đ" disabled={feePayer === 'receiver'} />
                  </InfoRow>
                  <InfoRow label="Giá trị hàng">
                    <NumericWithUnit value={goodsValue} onChange={setGoodsValue} unit="đ" />
                  </InfoRow>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32 }}>
                    <CheckboxBlue checked={declareValue} onChange={() => setDeclareValue(!declareValue)} />
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap' }}>Khai giá trị hàng</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32 }}>
                    <CheckboxBlue checked={partialDeliver} onChange={() => setPartialDeliver(!partialDeliver)} />
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap' }}>Giao / Trả 1 phần</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckboxBlue checked={collectOnFail} onChange={() => setCollectOnFail(!collectOnFail)} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap' }}>Giao thất bại thu tiền</span>
                      <IcHelp />
                    </div>
                    <div style={{ background: '#F9FAFB', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 12, height: 32, width: 180, flexShrink: 0 }}>
                      <input
                        value={collectOnFailAmt === 0 ? '0' : collectOnFailAmt.toLocaleString('en-US')}
                        onChange={(e) => setCollectOnFailAmt(parseFloat(e.target.value.replace(/,/g, '')) || 0)} type="text"
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, textAlign: 'right', background: 'transparent', lineHeight: '20px', minWidth: 0 }}
                      />
                      <div style={{ background: '#F3F4F6', border: `1px solid ${C_BORDER}`, width: 32, height: 32, borderRadius: '0 6px 6px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>đ</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: C_BORDER }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, fontSize: 14, lineHeight: '20px' }}>
                  {[
                    { label: 'Ghi chú nội bộ',    link: 'Thêm ghi chú' },
                    { label: 'Ghi chú đơn hàng',   link: 'Thêm ghi chú' },
                    { label: 'Ghi chú xem hàng',   link: 'Cho xem hàng không thử' },
                    { label: 'Thanh toán',          link: 'Thanh toán Tiền mặt (Thu hộ COD)' },
                    { label: 'Nguồn tạo',           link: 'Facebook' },
                  ].map(({ label, link }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0' }}>
                      <span style={{ color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: 14, color: C_LINK, lineHeight: '20px', cursor: 'pointer', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>{link}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Dịch vụ card ── */}
            <div style={{ ...card, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
                <IcTruck />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Phí vận chuyển</span>
                <div style={{ display: 'flex', gap: 1, flexShrink: 0, background: '#F3F4F6', borderRadius: 6, padding: 2 }}>
                  {(['sender', 'receiver'] as const).map((p) => (
                    <button key={p} onClick={() => { setFeePayer(p); if (p === 'receiver') setShipCollect(0) }}
                      style={{ padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, lineHeight: '18px', whiteSpace: 'nowrap',
                        background: feePayer === p ? '#fff' : 'transparent',
                        color: feePayer === p ? C_TEXT_PRIMARY : C_TEXT_SECONDARY,
                        boxShadow: feePayer === p ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                      }}>
                      {p === 'sender' ? 'Shop trả ship' : 'Khách trả ship'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                {currentServices.length === 0 && (
                  <div style={{ padding: '8px 0', fontSize: 13, color: C_TEXT_SECONDARY }}>
                    Shop chưa cấu hình dịch vụ
                  </div>
                )}
                {currentServices.map((cs: any) => {
                  const isSelected = selectedServiceId === cs.serviceId
                  return (
                    <div
                      key={cs.serviceId}
                      onClick={() => setSelectedServiceId(cs.serviceId)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                        border: `1px solid ${isSelected ? '#111827' : C_BORDER}`,
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? '#111827' : C_BORDER}`,
                        background: isSelected ? '#111827' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, color: '#4B5563', lineHeight: '16px' }}>Dịch vụ</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{cs.service.name}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#4B5563', lineHeight: '16px', flexShrink: 0 }}>Phí ship:</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {cs.demoFee.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Danh sách phí card ── */}
            <div style={{ ...card, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Phụ phí</span>
              </div>
              <div style={{ height: 1, background: C_BORDER }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Phí bảo hiểm (khai giá)', value: feeInsurance, active: declareValue && goodsValue > 0 },
                  { label: 'Phí giao trả 1 phần', value: feePartial, active: partialDeliver },
                  { label: 'Phí giao thất bại thu tiền', value: feeDeliveryFail, active: collectOnFail },
                  { label: 'Phí thu hộ', value: feeCod, active: cod > 0 },
                ].map(({ label, value, active }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '5px 10px' }}>
                    <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
                      {(active ? value : 0).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Action card ── */}
            <div style={{ ...card, flexShrink: 0, gap: 8, padding: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#F9FAFB', borderRadius: 6, padding: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>Tổng phí vận chuyển</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
                    {totalShipping.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>Tổng thu khách hàng</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', lineHeight: '20px' }}>
                    {totalCollect.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ flex: 1, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
                  Lưu nháp
                </button>
                <button
                  onClick={onClose}
                  style={{ flex: 1, padding: '8px 12px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: '20px' }}
                >
                  Tạo đơn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Table header ─────────────────────────────────────────────
function THead({ allChecked, onToggleAll }: { allChecked: boolean; onToggleAll: () => void }) {
  const fixedCell = (label: string, width: number, align: 'left' | 'right' = 'left') => (
    <div style={{ width, flexShrink: 0, padding: '6px 8px', background: C_BG_HEADER, display: 'flex', alignItems: 'center' }}>
      <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, textAlign: align, lineHeight: '20px' }}>{label}</span>
    </div>
  )
  const flexCell = (label: string, minWidth: number, align: 'left' | 'right' = 'left') => (
    <div style={{ flex: '1 0 0', minWidth, padding: '6px 8px', background: C_BG_HEADER, display: 'flex', alignItems: 'center' }}>
      <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, textAlign: align, lineHeight: '20px' }}>{label}</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <div style={{ width: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px', background: C_BG_HEADER }}>
        <Checkbox checked={allChecked} onChange={onToggleAll} />
      </div>
      {fixedCell('Mã đơn hàng', 140)}
      {flexCell('Shop',            200)}
      {flexCell('Khách hàng',      260)}
      {flexCell('Sản phẩm',        220)}
      {flexCell('Khối lượng (kg)', 120, 'right')}
      {flexCell('COD (đ)',         120, 'right')}
      {flexCell('Phí ship (đ)',    120, 'right')}
      {flexCell('GTB - TT (đ)',    120, 'right')}
      {flexCell('Người tạo',       180)}
    </div>
  )
}

// ── Order types with history ──────────────────────────────────
type GHNLogEntry = {
  status: string
  status_name: string
  action: string
  updated_date: string
  note: string
  warehouse_id: number | null
  warehouse_name: string
  is_force_majeure: boolean
  force_majeure_msg: string
  is_regulation: boolean
  regulation_msg: string
}
type ActionHistoryItem = { date: string; time: string; operator: string; action: string; oldContent: string; newContent: string }
type Order = typeof allOrders[number] & {
  log?: GHNLogEntry[]
  num_deliver?: number
  num_pick?: number
  num_return?: number
  actionHistory?: ActionHistoryItem[]
}

// ── OrderDetailDrawer ─────────────────────────────────────────
function OrderDetailDrawer({ order, open, onClose }: { order: Order | null; open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'info' | 'status' | 'action'>('info')

  useEffect(() => { if (order) setActiveTab('info') }, [order?.id])

  const log: GHNLogEntry[] = order?.log ?? []
  const actionHistory: ActionHistoryItem[] = order?.actionHistory ?? []

  const logByDate = log.reduce<Record<string, GHNLogEntry[]>>((acc, item) => {
    const dateKey = item.updated_date.slice(0, 10)
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(item)
    return acc
  }, {})
  const logDates = Object.keys(logByDate).sort((a, b) => b.localeCompare(a))

  const actionByDate = actionHistory.reduce<Record<string, ActionHistoryItem[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = []
    acc[item.date].push(item)
    return acc
  }, {})
  const actionDates = Object.keys(actionByDate).sort((a, b) => b.localeCompare(a))

  function formatDateHeader(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function formatTime(isoStr: string) {
    return new Date(isoStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  }

  const ACTION_LABEL: Record<string, string> = {
    READY_TO_PICK:    'Chờ lấy',
    PICK_IN_TRIP:     'Lấy hàng',
    HUB_IN:           'Đến kho',
    HUB_OUT:          'Rời kho',
    HUB_DELIVERY_IN:  'Đến bưu cục',
    DELIVER_IN_TRIP:  'Giao hàng',
    DELIVERY_FAIL:    'Giao thất bại',
    WAITING_TO_RETURN:'Chờ hoàn',
    RETURN_IN_TRIP:   'Đang hoàn',
    RETURNED:         'Hoàn xong',
    CANCEL:           'Huỷ',
  }

  const ACTION_COLOR: Record<string, string> = {
    DELIVER_IN_TRIP:  '#D1FAE5', DELIVERY_FAIL:    '#FEE2E2',
    WAITING_TO_RETURN:'#FEF3C7', RETURN_IN_TRIP:   '#FEF3C7',
    RETURNED:         '#F3F4F6', CANCEL:           '#FEE2E2',
    READY_TO_PICK:    '#EFF6FF', PICK_IN_TRIP:     '#EFF6FF',
    HUB_IN:           '#F3F4F6', HUB_OUT:          '#F3F4F6', HUB_DELIVERY_IN: '#F3F4F6',
  }

  const ACTION_TEXT_COLOR: Record<string, string> = {
    DELIVER_IN_TRIP:  '#065F46', DELIVERY_FAIL:    '#991B1B',
    WAITING_TO_RETURN:'#92400E', RETURN_IN_TRIP:   '#92400E',
    RETURNED:         '#374151', CANCEL:           '#991B1B',
    READY_TO_PICK:    '#1D4ED8', PICK_IN_TRIP:     '#1D4ED8',
    HUB_IN:           '#374151', HUB_OUT:          '#374151', HUB_DELIVERY_IN: '#374151',
  }

  if (!order) return null

  const card: React.CSSProperties = {
    background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
    display: 'flex', flexDirection: 'column', width: '100%',
  }

  function CardHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
          {icon}
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{label}</span>
        </div>
        <div style={{ height: 1, background: C_BORDER }} />
      </>
    )
  }

  const shopForOrder = agencyShops.find(s => s.id === order.shopId)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 200,
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s',
        }}
      />

      {/* Drawer panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: 980, height: '100vh',
        background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.2)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px' }}>{order.trackingCode}</span>
            <span style={{ fontSize: 14, color: '#4B5563', lineHeight: '20px', whiteSpace: 'nowrap' }}>Tạo lúc {order.createdAt}</span>
          </div>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 2, background: '#F3F4F6', borderRadius: 8, padding: 3, marginRight: 12, flexShrink: 0 }}>
            {([
              { key: 'info' as const, label: 'Thông tin đơn' },
              { key: 'status' as const, label: 'Lịch sử trạng thái' },
              { key: 'action' as const, label: 'Lịch sử thao tác' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: activeTab === key ? 600 : 400, lineHeight: '20px', whiteSpace: 'nowrap',
                  background: activeTab === key ? '#fff' : 'transparent',
                  color: activeTab === key ? C_TEXT_PRIMARY : C_TEXT_SECONDARY,
                  boxShadow: activeTab === key ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <IcX />
          </button>
        </div>
        <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

        {/* ── Body: info tab (gray bg, 2-col) ──────────────────── */}
        {activeTab === 'info' && <div style={{
          flex: 1, display: 'flex', gap: 6, padding: 6,
          background: '#F3F4F6', overflow: 'hidden', alignItems: 'flex-start',
        }}>

          {/* ════ LEFT COLUMN ════════════════════════════════ */}
          <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>

            {/* ── Bên gửi card ── */}
            <div style={card}>
              <CardHeader icon={<IcStore />} label="Bên gửi" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', fontWeight: 600 }}>
                    {shopForOrder?.ownerName ?? order.senderName} - {shopForOrder?.phone ?? order.senderPhone}
                  </div>
                  <div style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
                    {shopForOrder?.address ?? '268 Lý Thường Kiệt, Phường 14, Quận 10, Hồ Chí Minh'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 40, padding: '6px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${C_ACTION}`, background: C_ACTION,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
                    </div>
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap' }}>Lấy hàng tận nơi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Bên nhận card ── */}
            <div style={card}>
              <CardHeader icon={<IcUser />} label="Bên nhận" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 6, padding: '6px 12px' }}>
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{order.receiverName}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 200, background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', paddingRight: 70 }}>{order.receiverPhone}</span>
                    <div style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', background: '#D9F7E5', height: 22, padding: '0 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, color: C_TEXT_PRIMARY, lineHeight: '22px' }}>TLHH:</span>
                      <span style={{ fontSize: 13, color: '#10B981', lineHeight: '22px' }}>0%</span>
                    </div>
                  </div>
                </div>
                <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px' }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{order.receiverAddress}</span>
                </div>
              </div>
            </div>

            {/* ── Sản phẩm card ── */}
            <div style={{ ...card, flex: 1 }}>
              <CardHeader icon={<IcCube />} label="Sản phẩm" />

              <div style={{ padding: 8 }}>
                <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, overflow: 'hidden' }}>
                  {/* Table header */}
                  <div style={{ display: 'flex', background: '#F3F4F6' }}>
                    <div style={{ flex: 1, minWidth: 0, padding: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Tên sản phẩm</span>
                    </div>
                    <div style={{ width: 56, flexShrink: 0, padding: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', display: 'block', textAlign: 'right' }}>SL: 1</span>
                    </div>
                    <div style={{ width: 104, flexShrink: 0, padding: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', display: 'block', textAlign: 'right' }}>Giá bán</span>
                    </div>
                    <div style={{ width: 96, flexShrink: 0, padding: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', display: 'block', textAlign: 'right' }}>KL / KT</span>
                    </div>
                  </div>
                  {/* Data row */}
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <div style={{ flex: 1, minWidth: 0, padding: 6 }}>
                      <div style={{ background: '#F9FAFB', borderRadius: 6, height: 32, padding: '0 8px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Sản phẩm</span>
                      </div>
                    </div>
                    <div style={{ width: 56, flexShrink: 0, padding: 6 }}>
                      <div style={{ background: '#F9FAFB', borderRadius: 6, height: 32, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>1</span>
                      </div>
                    </div>
                    <div style={{ width: 104, flexShrink: 0, padding: 6 }}>
                      <div style={{ background: '#F9FAFB', borderRadius: 6, height: 32, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>0</span>
                      </div>
                    </div>
                    <div style={{ width: 96, flexShrink: 0, padding: 6, display: 'flex', flexDirection: 'column', justifyContent: 'center', fontSize: 12, color: C_TEXT_PRIMARY, lineHeight: '16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span>{(order.weight / 1000).toFixed(1)}kg</span>
                      <span>10x10x10cm</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

              {/* Weight & dimensions (read-only) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', width: 72, flexShrink: 0 }}>Khối lượng</span>
                  <div style={{ flex: 1, minWidth: 0, background: '#F9FAFB', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 8, height: 32 }}>
                    <span style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', textAlign: 'right', paddingRight: 8 }}>{(order.weight / 1000).toFixed(1)}</span>
                    <div style={{ background: '#F3F4F6', width: 32, height: 32, borderRadius: '0 6px 6px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>kg</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', width: 72, flexShrink: 0 }}>Kích thước</span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 2 }}>
                    {(['D', 'R', 'C'] as const).map((lbl) => (
                      <div key={lbl} style={{ flex: 1, minWidth: 0, background: '#F9FAFB', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 8, height: 32 }}>
                        <span style={{ flexShrink: 0, fontSize: 14, color: '#9CA3AF', lineHeight: '20px', whiteSpace: 'nowrap' }}>{lbl}:</span>
                        <span style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', textAlign: 'right', padding: '0 8px' }}>10</span>
                        <div style={{ background: '#F3F4F6', width: 32, height: 32, borderRadius: '0 6px 6px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>cm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ paddingLeft: 84, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Khối lượng quy đổi: {(order.weight / 1000).toFixed(1)}kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* ════ RIGHT COLUMN (w-400px) ════════════════════════ */}
          <div style={{ width: 400, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>

            {/* ── Thông tin đơn hàng card ── */}
            <div style={{ ...card, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, flexShrink: 0 }}>
                <IcClipboard />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Thông tin đơn hàng</span>
                <span style={{ fontSize: 14, color: '#4B5563', lineHeight: '20px', whiteSpace: 'nowrap' }}>Tạo lúc {order.createdAt}</span>
              </div>
              <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                  <InfoRow label="Mã đơn shop">
                    <span style={{ fontSize: 14, color: '#9CA3AF' }}>—</span>
                  </InfoRow>
                  <InfoRow label="COD">
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', fontWeight: 600 }}>{order.cod.toLocaleString('vi-VN')} đ</span>
                  </InfoRow>
                  <InfoRow label="Giảm giá">
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>0 đ</span>
                  </InfoRow>
                  <InfoRow label="Thu ship khách hàng">
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>0 đ</span>
                  </InfoRow>
                  <InfoRow label="Giá trị hàng">
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>0 đ</span>
                  </InfoRow>
                  <InfoRow label="Trạng thái">
                    <span style={{ fontSize: 14, color: C_LINK, lineHeight: '20px', fontWeight: 700 }}>{log[0]?.status_name || order.status}</span>
                  </InfoRow>
                </div>

                <div style={{ height: 1, background: C_BORDER }} />

                {/* Notes & misc */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, fontSize: 14, lineHeight: '20px' }}>
                  {[
                    { label: 'Ghi chú đơn hàng',   link: 'Thêm ghi chú' },
                    { label: 'Thanh toán',          link: 'Thanh toán Tiền mặt (Thu hộ COD)' },
                    { label: 'Nguồn tạo',           link: 'Facebook' },
                  ].map(({ label, link }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0' }}>
                      <span style={{ color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: 14, color: C_LINK, lineHeight: '20px', cursor: 'pointer', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>{link}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Dịch vụ card ── */}
            <div style={{ ...card, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
                <IcTruck />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Phí vận chuyển</span>
                {/* Static "Shop trả ship" toggle */}
                <div style={{ display: 'flex', gap: 1, flexShrink: 0, background: '#F3F4F6', borderRadius: 6, padding: 2 }}>
                  <div style={{ padding: '3px 8px', borderRadius: 5, fontSize: 12, fontWeight: 600, lineHeight: '18px', whiteSpace: 'nowrap', background: '#fff', color: C_TEXT_PRIMARY, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
                    Shop trả ship
                  </div>
                  <div style={{ padding: '3px 8px', borderRadius: 5, fontSize: 12, fontWeight: 600, lineHeight: '18px', whiteSpace: 'nowrap', background: 'transparent', color: C_TEXT_SECONDARY }}>
                    Khách trả ship
                  </div>
                </div>
              </div>
              <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                {/* Static service row (selected) */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 12px', borderRadius: 6,
                  border: `1px solid #111827`,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid #111827`, background: '#111827',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 12, color: '#4B5563', lineHeight: '16px' }}>Dịch vụ</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>2 shop 1 nặng 1 nhẹ</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#4B5563', lineHeight: '16px', flexShrink: 0 }}>Phí ship:</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {order.fee.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>

            {/* ── Phụ phí card ── */}
            <div style={{ ...card, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Phụ phí</span>
              </div>
              <div style={{ height: 1, background: C_BORDER }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  'Phí bảo hiểm',
                  'Phí giao trả 1 phần',
                  'Phí giao thất bại thu tiền',
                  'Phí thu hộ',
                ].map((label) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '5px 10px' }}>
                    <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>0đ</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Action card ── */}
            <div style={{ ...card, flexShrink: 0, gap: 8, padding: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#F9FAFB', borderRadius: 6, padding: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>Tổng phí vận chuyển</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
                    {order.fee.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>Tổng thu khách hàng</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', lineHeight: '20px' }}>
                    {order.cod.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  style={{ flex: 1, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}
                >
                  Huỷ đơn
                </button>
                <button
                  style={{ flex: 1, padding: '8px 12px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: '20px' }}
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>}

        {/* ── Body: status history tab (GHN log[]) ─────────────── */}
        {activeTab === 'status' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            {/* Stats bar */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Số lần lấy',  value: order?.num_pick    ?? 0, color: '#1D4ED8', bg: '#EFF6FF' },
                { label: 'Số lần giao', value: order?.num_deliver ?? 0, color: '#065F46', bg: '#D1FAE5' },
                { label: 'Số lần hoàn', value: order?.num_return  ?? 0, color: '#92400E', bg: '#FEF3C7' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, background: s.bg, borderRadius: 6, padding: '4px 12px' }}>
                  <span style={{ fontSize: 13, color: s.color, fontWeight: 700 }}>{s.value}</span>
                  <span style={{ fontSize: 12, color: s.color }}>{s.label}</span>
                </div>
              ))}
            </div>

            {log.length === 0 && (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Chưa có lịch sử trạng thái</div>
            )}

            {log.length > 0 && (
              <>
                {/* Table header */}
                <div style={{ display: 'flex', background: C_BG_HEADER, padding: '6px 12px', borderRadius: 4, marginBottom: 2 }}>
                  <span style={{ width: 200, flexShrink: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>Trạng thái</span>
                  <span style={{ width: 110, flexShrink: 0, fontSize: 13, fontWeight: 600, color: '#374151' }}>Hành động</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151' }}>Ghi chú</span>
                  <span style={{ width: 80, flexShrink: 0, fontSize: 13, fontWeight: 600, color: '#374151', textAlign: 'right' }}>Thời gian</span>
                </div>

                {logDates.map(date => (
                  <div key={date}>
                    {/* Date group header */}
                    <div style={{ padding: '5px 12px', background: '#FAFAFA', borderBottom: `1px solid ${C_BORDER}`, borderTop: `1px solid ${C_BORDER}`, marginTop: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280' }}>{formatDateHeader(date)}</span>
                    </div>

                    {logByDate[date].map((item, idx) => {
                      const isLatest = item === log[0]
                      const actionLabel = ACTION_LABEL[item.action] ?? item.action
                      const badgeBg    = ACTION_COLOR[item.action]     ?? '#F3F4F6'
                      const badgeText  = ACTION_TEXT_COLOR[item.action] ?? '#374151'
                      return (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center',
                          padding: '8px 12px', borderBottom: `1px solid ${C_BORDER}`,
                          background: isLatest ? '#F0F9FF' : '#fff',
                        }}>
                          {/* Trạng thái */}
                          <div style={{ width: 200, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: isLatest ? 700 : 400, color: isLatest ? C_LINK : '#374151', lineHeight: '20px' }}>
                              {item.status_name}
                            </span>
                            {item.is_force_majeure && (
                              <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#FEF3C7', color: '#92400E', fontWeight: 600, flexShrink: 0 }}>BKK</span>
                            )}
                          </div>
                          {/* Hành động */}
                          <div style={{ width: 110, flexShrink: 0 }}>
                            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: badgeBg, color: badgeText, fontWeight: 600 }}>
                              {actionLabel}
                            </span>
                          </div>
                          {/* Ghi chú */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 13, color: '#6B7280', lineHeight: '20px' }}>{item.note || '—'}</span>
                            {item.warehouse_name && (
                              <span style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 8 }}>· {item.warehouse_name}</span>
                            )}
                          </div>
                          {/* Thời gian */}
                          <span style={{ width: 80, flexShrink: 0, fontSize: 13, color: '#6B7280', textAlign: 'right' }}>
                            {formatTime(item.updated_date)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Body: action history tab ──────────────────────────── */}
        {activeTab === 'action' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            <div style={{ display: 'flex', background: '#F3F4F6', padding: '6px 12px', marginTop: 0, borderRadius: 4, gap: 8 }}>
              <span style={{ width: 90, fontSize: 13, fontWeight: 600, color: '#374151', flexShrink: 0 }}>Thời gian</span>
              <span style={{ width: 120, fontSize: 13, fontWeight: 600, color: '#374151', flexShrink: 0 }}>Người thao tác</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151' }}>Hành động</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151' }}>Nội dung cũ</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151' }}>Nội dung sửa</span>
            </div>
            {actionDates.length === 0 && (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Chưa có lịch sử thao tác</div>
            )}
            {actionDates.map(date => (
              <div key={date}>
                <div style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#111827', background: '#FAFAFA', borderBottom: `1px solid ${C_BORDER}` }}>
                  {new Date(date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                </div>
                {actionByDate[date].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', padding: '8px 12px', borderBottom: `1px solid ${C_BORDER}`, alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 90, fontSize: 13, color: '#374151', flexShrink: 0 }}>{item.time}</span>
                    <span style={{ width: 120, fontSize: 13, color: '#374151', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.operator}</span>
                    <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{item.action}</span>
                    <span style={{ flex: 1, fontSize: 13, color: '#6B7280' }}>{item.oldContent}</span>
                    <span style={{ flex: 1, fontSize: 13, color: '#6B7280' }}>{item.newContent}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ── Table row ─────────────────────────────────────────────────
function TRow({
  order, checked, onToggle, shopName, onSelect,
}: {
  order: Order; checked: boolean; onToggle: () => void; shopName: string; onSelect: () => void
}) {
  const [hover, setHover] = useState(false)
  const products = orderProducts[order.id] || ['Sản phẩm - SL: 1']
  const weightKg = (order.weight / 1000).toFixed(1)
  const feeType = parseInt(order.id.replace('ORD', '')) % 2 === 0 ? 'Shop trả' : 'Khách trả'

  return (
    <div
      style={{
        display: 'flex', alignItems: 'stretch', cursor: 'pointer',
        background: checked ? '#FFF4ED' : hover ? '#FAFAFA' : '#fff',
        transition: 'background 0.1s',
        borderBottom: `1px solid ${C_BORDER}`,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Checkbox */}
      <div style={{ width: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px' }}>
        <Checkbox checked={checked} onChange={onToggle} />
      </div>
      {/* Mã đơn hàng */}
      <div style={{ width: 140, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '6px 8px' }}>
        <span
          onClick={(e) => { e.stopPropagation(); onSelect() }}
          style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px', whiteSpace: 'nowrap', cursor: 'pointer' }}
        >
          {order.trackingCode}
        </span>
      </div>
      {/* Shop */}
      <div style={{ flex: '1 0 0', minWidth: 200, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {shopName}
        </span>
      </div>
      {/* Khách hàng */}
      <div style={{ flex: '1 0 0', minWidth: 260, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
        <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {order.receiverName}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', whiteSpace: 'nowrap' }}>
            {order.receiverPhone}
          </span>
          <div style={{ background: '#D9F7E5', padding: '0 6px', height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', flexShrink: 0, gap: 2 }}>
            <span style={{ fontSize: 13, color: C_TEXT_BODY }}>TLHH:</span>
            <span style={{ fontSize: 13, color: '#00C853' }}>0%</span>
          </div>
        </div>
        <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px' }}>{order.receiverAddress}</span>
      </div>
      {/* Sản phẩm */}
      <div style={{ flex: '1 0 0', minWidth: 220, padding: '6px 8px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', width: '100%' }}>
          {products.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>
      {/* Khối lượng */}
      <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px' }}>{weightKg}</span>
      </div>
      {/* COD */}
      <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px' }}>{order.cod.toLocaleString()}</span>
      </div>
      {/* Phí ship */}
      <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
        <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px' }}>{order.fee.toLocaleString()}</span>
        <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px' }}>{feeType}</span>
      </div>
      {/* GTB - TT */}
      <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px' }}>{order.cod.toLocaleString()}</span>
      </div>
      {/* Người tạo */}
      <div style={{ flex: '1 0 0', minWidth: 180, padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {order.senderName}
        </span>
        <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Tạo lúc {order.createdAt}
        </span>
      </div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────
function Pagination({ page, total, pageSize, onPageChange, onPageSizeChange }: {
  page: number; total: number; pageSize: number
  onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void
}) {
  const [goTo, setGoTo] = useState(String(page))
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages)
  }

  const PageBtn = ({ p }: { p: number | '...' }) => {
    if (p === '...') return <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>...</span>
    const active = p === page
    return (
      <div
        onClick={() => onPageChange(p as number)}
        style={{
          width: 24, height: 24, borderRadius: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', background: active ? C_TEXT_PRIMARY : 'transparent',
          fontSize: 14, color: active ? '#fff' : C_TEXT_PRIMARY, lineHeight: '20px', flexShrink: 0,
        }}
      >
        {p}
      </div>
    )
  }

  const NavBtn = ({ dir }: { dir: 'first' | 'last' }) => (
    <div
      onClick={() => onPageChange(dir === 'first' ? 1 : totalPages)}
      style={{ width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563', flexShrink: 0 }}
    >
      {dir === 'first'
        ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8 5l-5 5 5 5M4 10h12M13 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 5l5 5-5 5M16 10H4M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      }
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: '#fff', flexShrink: 0 }}>
      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>Hiển thị</span>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', flexShrink: 0, width: 82 }}
        onClick={() => onPageSizeChange(pageSize === 50 ? 100 : 50)}
      >
        <span style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY }}>{pageSize}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5l5 5 5-5" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <span style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY }}>mỗi trang</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <NavBtn dir="first" />
        {pages.map((p, i) => <PageBtn key={i} p={p} />)}
        <NavBtn dir="last" />
      </div>
      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>Đi đến trang số</span>
      <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, width: 48, padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <input
          value={goTo}
          onChange={(e) => setGoTo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const n = parseInt(goTo)
              if (!isNaN(n) && n >= 1 && n <= totalPages) onPageChange(n)
            }
          }}
          style={{ width: '100%', border: 'none', outline: 'none', textAlign: 'center', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent' }}
        />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function AgencyOrders() {
  const [activeTab, setActiveTab]     = useState('draft')
  const [search, setSearch]           = useState('')
  const [shopFilter, setShopFilter]   = useState('all')
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [page, setPage]               = useState(1)
  const [pageSize, setPageSize]       = useState(50)
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [detailOpen, setDetailOpen]   = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const ordersByTab: Record<string, typeof agencyOrders> = {
    draft:         agencyOrders.filter(o => o.status === 'pending'),
    pickup:        agencyOrders.filter(o => o.status === 'pickup'),
    in_transit:    agencyOrders.filter(o => o.status === 'in_transit'),
    returning:     agencyOrders.filter(o => o.status === 'returning'),
    redelivery:    agencyOrders.filter(o => o.status === 'redelivery'),
    completed:     agencyOrders.filter(o => o.status === 'delivered'),
    cancelled:     agencyOrders.filter(o => o.status === 'cancelled' || o.status === 'failed'),
    lost_damaged:  agencyOrders.filter(o => o.status === 'lost' || o.status === 'damaged'),
  }
  const tabOrders = ordersByTab[activeTab] ?? agencyOrders

  const shopFiltered = shopFilter === 'all' ? tabOrders : tabOrders.filter(o => o.shopId === shopFilter)

  const filtered = shopFiltered.filter(o =>
    o.trackingCode.toLowerCase().includes(search.toLowerCase()) ||
    o.receiverName.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allChecked = paginated.length > 0 && paginated.every(o => selected.has(o.id))

  const toggleAll = () => {
    const next = new Set(selected)
    if (allChecked) paginated.forEach(o => next.delete(o.id))
    else            paginated.forEach(o => next.add(o.id))
    setSelected(next)
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const TABS = [
    { key: 'draft',        label: 'Đơn nháp',                     count: ordersByTab.draft.length,        countColor: '#F59E0B' },
    { key: 'pickup',       label: 'Chờ bàn giao',                 count: ordersByTab.pickup.length,       countColor: '#3B82F6' },
    { key: 'in_transit',   label: 'Đã bàn giao - Đang giao',      count: ordersByTab.in_transit.length,   countColor: '#3B82F6' },
    { key: 'returning',    label: 'Đã bàn giao - Đang hoàn hàng', count: ordersByTab.returning.length,    countColor: '#F59E0B' },
    { key: 'redelivery',   label: 'Chờ xác nhận giao lại',        count: ordersByTab.redelivery.length,   countColor: '#F59E0B' },
    { key: 'completed',    label: 'Hoàn tất',                     count: ordersByTab.completed.length,    countColor: '#10B981' },
    { key: 'cancelled',    label: 'Đơn huỷ',                      count: ordersByTab.cancelled.length,    countColor: '#EF4444' },
    { key: 'lost_damaged', label: 'Hàng thất lạc - hư hỏng',     count: ordersByTab.lost_damaged.length, countColor: '#EF4444' },
  ]

  const shopMap = Object.fromEntries(agencyShops.map(s => [s.id, s.name]))

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', width: '100%', background: '#fff', overflow: 'hidden' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ flex: '1 0 0' }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
              Đơn hàng
            </h1>
            <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: '4px 0 0', lineHeight: '20px' }}>
              Tất cả đơn hàng từ các shop thuộc đại lý
            </p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <PlusOutlined style={{ color: '#fff', fontSize: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Tạo đơn hàng</span>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 16px', borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.key
            return (
              <div
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPage(1); setSelected(new Set()) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  background: active ? C_TEXT_PRIMARY : 'transparent',
                  border: `1px solid ${C_BORDER}`,
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: active ? '#fff' : C_TEXT_PRIMARY }}>{tab.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: active ? tab.countColor : '#3B82F6' }}>{tab.count}</span>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', flex: 1,
            background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
          }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm theo mã đơn hoặc tên khách hàng"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent' }}
            />
          </div>
          <select
            value={shopFilter}
            onChange={e => { setShopFilter(e.target.value); setPage(1) }}
            style={{
              border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 12px',
              fontSize: 14, color: C_TEXT_PRIMARY, background: '#fff', cursor: 'pointer',
              outline: 'none', minWidth: 200,
            }}
          >
            <option value="all">Tất cả shop ({agencyShops.length})</option>
            {agencyShops.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Selected bar */}
        {selected.size > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '6px 16px',
            background: '#EFF6FF', borderBottom: `1px solid #BFDBFE`, flexShrink: 0,
          }}>
            <span style={{ fontSize: 13, color: C_LINK, fontWeight: 600 }}>Đã chọn {selected.size} đơn</span>
            <button
              onClick={() => setSelected(new Set())}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: C_TEXT_SECONDARY }}
            >Bỏ chọn</button>
          </div>
        )}

        {/* Table */}
        <div style={{ flex: '1 0 0', overflow: 'hidden', padding: '0 16px' }}>
          <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
            <div style={{ minWidth: 1600 }}>
              <THead allChecked={allChecked} onToggleAll={toggleAll} />
              <div style={{ height: 1, background: C_BORDER }} />
              {paginated.map(order => (
                <TRow
                  key={order.id}
                  order={order as Order}
                  checked={selected.has(order.id)}
                  onToggle={() => toggleOne(order.id)}
                  shopName={shopMap[order.shopId] ?? order.shopId}
                  onSelect={() => { setSelectedOrder(order as Order); setDetailOpen(true) }}
                />
              ))}
              {paginated.length === 0 && (
                <div style={{ padding: '48px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                  Không có đơn hàng nào
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div style={{ borderTop: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
          <Pagination
            page={page}
            total={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={s => { setPageSize(s); setPage(1) }}
          />
        </div>
      </div>

      {/* Create order drawer */}
      <CreateOrderDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {/* Order Detail Drawer */}
      <OrderDetailDrawer order={selectedOrder} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </ConfigProvider>
  )
}
