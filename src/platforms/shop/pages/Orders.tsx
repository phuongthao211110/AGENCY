import { useState, useEffect } from 'react'
import { ConfigProvider } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { shopTheme } from '../../../theme/platforms'
import allOrders from '../../../mock-data/orders.json'
import allShops from '../../../mock-data/shops.json'
import allPricing from '../../../mock-data/pricing.json'
import letterPricingTable from '../../../mock-data/pricing-letter-247.json'
import roadFreightPricingTable from '../../../mock-data/pricing-roadfreight-247.json'
import { servicesList, type AgencyService } from '../../agency-admin/serviceStore'
import { clientHubs247 } from '../../super-admin/agencyStore'

// ── Design tokens (hoisted above module-scope consts that reference them) ──
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_BODY      = '#050505'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_ACTION         = '#FF5200'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// ── Fee calculation helpers ──────────────────────────────────
type ShopFeeTier = { id: string; fromValue: string; toValue: string; fixedFee: string; percentFee: string }
type ShopPricingSurcharges = {
  partialDelivery?: { value: string; unit: string }
  insurance?:       ShopFeeTier[]
  deliveryFailFee?: { value: string; unit: string }
  codFee?:          ShopFeeTier[]
}
function shopCalcTierFee(amount: number, tiers: ShopFeeTier[]): number {
  if (!tiers || tiers.length === 0 || amount <= 0) return 0
  const tier = tiers.find(t => amount >= parseFloat(t.fromValue) && amount <= parseFloat(t.toValue))
  if (!tier) return 0
  return Math.round(amount * parseFloat(tier.percentFee) / 100 + parseFloat(tier.fixedFee))
}

// 10 tỉnh đủ để demo (không phải danh sách 63 tỉnh thật) — dùng đúng token 'TP.HCM' như
// zones trong pricing.json (GHN) để match được theo tuyến, khác với 'TP. Hồ Chí Minh' ở
// ServiceDetail.tsx (agency-admin, chỉ hiển thị, không cần khớp dữ liệu bảng giá).
const PROVINCES = [
  'Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Bình Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu', 'Quảng Ninh', 'Nghệ An',
]

// "Cho thử hàng" bị bỏ theo yêu cầu — 247Express Thư/tài liệu không hỗ trợ cho thử.
const VIEW_GOODS_OPTIONS: { value: 'none' | 'view_no_try'; label: string }[] = [
  { value: 'none',         label: 'Không cho xem hàng' },
  { value: 'view_no_try',  label: 'Cho xem hàng không thử' },
]

// Dùng để ước lượng vùng cho 247Express (không có from/to như GHN, tính theo miền)
const PROVINCE_REGION: Record<string, 'bac' | 'trung' | 'nam'> = {
  'Hà Nội': 'bac', 'Hải Phòng': 'bac', 'Quảng Ninh': 'bac',
  'Đà Nẵng': 'trung', 'Nghệ An': 'trung',
  'TP.HCM': 'nam', 'Bình Dương': 'nam', 'Đồng Nai': 'nam', 'Bà Rịa - Vũng Tàu': 'nam', 'Cần Thơ': 'nam',
}

function parseProvince(address: string): string {
  const parts = address.split(',')
  return parts[parts.length - 1].trim()
}

// clientHubs247 dùng tên tỉnh đầy đủ theo API 247Express (VD "TP. Hồ Chí Minh"), trong khi
// PROVINCE_REGION/PROVINCES ở trên dùng tên rút gọn cho demo (VD "TP.HCM") — quy đổi để tra vùng đúng.
function hubProvinceLabel(provinceName: string): string {
  return provinceName === 'TP. Hồ Chí Minh' ? 'TP.HCM' : provinceName
}

// GHN: zones có {from,to,label} cố định theo tuyến, có zone "Khác" làm fallback.
// 247Express: zones chỉ có {label} (Nội tỉnh/Liên tỉnh gần/xa/Quốc tế) vì tính theo
// ClientHubID + khoảng cách thật qua API — ở đây ước lượng vùng theo miền cho demo.
function resolveZoneIndex(priceTable: any, fromProvince: string, toProvince: string): number {
  const zones: any[] = priceTable.zones ?? []
  const isRouteBased = zones.length > 0 && 'from' in zones[0]
  if (isRouteBased) {
    let idx = zones.findIndex(z => z.from === fromProvince && z.to === toProvince)
    if (idx === -1) idx = zones.findIndex(z => z.from === fromProvince && z.to === 'Khác')
    return idx === -1 ? 0 : idx
  }
  if (fromProvince === toProvince) return 0
  return PROVINCE_REGION[fromProvince] === PROVINCE_REGION[toProvince] ? 1 : 2
}

// Phí ship = tra theo bảng giá (zones × weight) của dịch vụ, đúng theo tuyến gửi → nhận.
function shopFeeFromPriceTable(service: AgencyService, weightGram: number, fromProvince: string, toProvince: string): number {
  const priceTable = service.priceTableId ? (allPricing as any[]).find(p => p.id === service.priceTableId) : null
  if (!priceTable) return 0
  const weights: { max: number }[] = priceTable.weights ?? []
  const weightIndex = weights.findIndex(w => weightGram <= w.max)
  const row = priceTable.prices?.[weightIndex === -1 ? weights.length - 1 : weightIndex]
  const zoneIndex = resolveZoneIndex(priceTable, fromProvince, toProvince)
  return row?.[zoneIndex] ?? row?.[0] ?? 0
}

// ── Icons (Tabler-style SVG) ─────────────────────────────────
const IC = '#6B7280' // icon stroke color
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
function IcReceipt() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/></svg>
}
function IcChevronDown({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
}
function IcChevronRight({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>
}
function IcSearch() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
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
function IcStar({ active = false }: { active?: boolean }) {
  const c = active ? '#FF5200' : IC
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}
function IcMapPin() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 017 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 017-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
}
function IcPrinter() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
}
function IcSettings() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
}
function IcArrowReturn() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={IC} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14l-4-4 4-4"/><path d="M5 10h11a4 4 0 010 8h-1"/></svg>
}

// ── Checkbox (blue when checked – per Figma design tokens) ───
function CheckboxBlue({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 20, height: 20, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
        border: checked ? 'none' : '1.5px solid #E5E7EB',
        background: checked ? '#3B82F6' : '#fff',
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

// ── 1 dòng dịch vụ gia tăng (DVGT) đơn giản: tick chọn + phí tự tính, không sửa số.
// disabledReason (nếu có) thay thế note bằng lý do không đủ điều kiện (ví dụ sai khoảng cân nặng)
// và chặn tick — dùng cho các DVGT có điều kiện theo hợp đồng (ví dụ "chỉ áp dụng TL ≤ 2kg").
// Popup DVGT chỉ hiển thị tên dịch vụ — không hiển thị giá tiền (kể cả trong mô tả/note gốc,
// vì các note đó có chứa số tiền theo hợp đồng, VD "5.000đ/vận đơn"). disabledReason vẫn hiển thị
// vì đó là điều kiện áp dụng (không phải giá tiền), giúp người dùng hiểu vì sao không tick được.
function VasCheckboxRow({ checked, onChange, label, disabledReason, extra }: {
  checked: boolean; onChange: () => void; label: string; disabledReason?: string; extra?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minHeight: 32, padding: '6px 0', opacity: disabledReason ? 0.5 : 1 }}>
      <div style={{ paddingTop: 2 }}><CheckboxBlue checked={checked && !disabledReason} onChange={disabledReason ? () => {} : onChange} /></div>
      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap', paddingTop: 1 }}>{label}</span>
      {disabledReason && (
        <span style={{ flex: 1, fontSize: 12, color: C_TEXT_SECONDARY, lineHeight: '16px', paddingTop: 3 }}>{disabledReason}</span>
      )}
      {!disabledReason && <span style={{ flex: 1 }} />}
      {extra}
    </div>
  )
}

// ── Toggle ───────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', background: on ? '#FF5200' : '#E5E7EB', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: 8, background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  )
}

// ── OrderSettingsModal ────────────────────────────────────────
function OrderSettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'default' | 'pickup' | 'print'>('default')
  const [weightDefault, setWeightDefault] = useState(false)
  const [sizeDefault, setSizeDefault] = useState(false)
  const [settingsDeclare, setSettingsDeclare] = useState(false)
  const [settingsPartial, setSettingsPartial] = useState(false)
  const [settingsCollectFail, setSettingsCollectFail] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [autoRedeliver, setAutoRedeliver] = useState(false)
  const [collectShipFee, setCollectShipFee] = useState(0)

  if (!open) return null

  function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
      <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 12, padding: 12, width: '100%', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {icon}
          <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{title}</span>
        </div>
        {children}
      </div>
    )
  }

  function SettingRow({ label, desc, control }: { label: string; desc: string; control: React.ReactNode }) {
    return (
      <div style={{ display: 'flex', gap: 32, alignItems: 'center', paddingTop: 6, paddingBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{label}</span>
          <span style={{ fontSize: 14, color: '#4B5563', lineHeight: '20px' }}>{desc}</span>
        </div>
        {control}
      </div>
    )
  }

  function SelectCtrl({ value, flex1 }: { value: string; flex1?: boolean }) {
    return (
      <div style={{ ...(flex1 ? { flex: 1, minWidth: 0 } : { width: 240, flexShrink: 0 }), background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
        <IcChevronDown size={20} />
      </div>
    )
  }

  const sidebarItems: { key: 'default' | 'pickup' | 'print'; label: string; icon: React.ReactNode }[] = [
    { key: 'default', label: 'Thông tin mặc định', icon: <IcStar active={activeTab === 'default'} /> },
    { key: 'pickup', label: 'Địa chỉ lấy hàng', icon: <IcMapPin /> },
    { key: 'print', label: 'In đơn hàng', icon: <IcPrinter /> },
  ]

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 209 }} />
      <div style={{ position: 'fixed', top: 16, left: 16, right: 16, bottom: 16, background: '#fff', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.06)', zIndex: 210, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Cài đặt đơn hàng</span>
          <div onClick={onClose} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}><IcX /></div>
        </div>
        <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />
        {/* Body */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Sidebar */}
          <div style={{ width: 240, borderRight: `1px solid ${C_BORDER}`, display: 'flex', flexDirection: 'column', paddingTop: 10, paddingBottom: 16, paddingLeft: 16, paddingRight: 16, flexShrink: 0, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ padding: '4px 8px' }}>
                <span style={{ fontSize: 12, color: '#4B5563', lineHeight: '16px', textTransform: 'uppercase' }}>Cài đặt đơn hàng</span>
              </div>
              {sidebarItems.map(item => (
                <div key={item.key} onClick={() => setActiveTab(item.key)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8, borderRadius: 6, cursor: 'pointer', background: activeTab === item.key ? '#FFF4ED' : 'transparent' }}>
                  {item.icon}
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, lineHeight: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: activeTab === item.key ? '#FF5200' : '#4B5563' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Form */}
          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', background: '#fff' }}>
            {activeTab === 'default' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: 1024, padding: '24px 80px', flexShrink: 0 }}>
                  <span style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '28px' }}>Thông tin mặc định</span>
                </div>
                <div style={{ width: '100%', maxWidth: 1024, padding: '0 80px 80px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <SectionCard icon={<IcStore />} title="Bên gửi">
                    <SettingRow label="Ca lấy hàng" desc="Thiết lập ca lấy hàng mặc định khi tạo đơn" control={<SelectCtrl value="Tự chọn ca lấy hàng sau" />} />
                  </SectionCard>
                  <SectionCard icon={<IcCube />} title="Sản phẩm">
                    <SettingRow label="Khối lượng đơn hàng" desc="Thiết lập khối lượng đơn hàng mặc định khi tạo đơn" control={<Toggle on={weightDefault} onChange={() => setWeightDefault(v => !v)} />} />
                    <SettingRow label="Kích thước đơn hàng" desc="Thiết lập kích thước đơn hàng mặc định khi tạo đơn" control={<Toggle on={sizeDefault} onChange={() => setSizeDefault(v => !v)} />} />
                  </SectionCard>
                  <SectionCard icon={<IcClipboard />} title="Thông tin đơn hàng">
                    <SettingRow label="Khai giá trị hàng" desc="Thiết lập khai giá mặc định khi tạo đơn" control={<Toggle on={settingsDeclare} onChange={() => setSettingsDeclare(v => !v)} />} />
                    <SettingRow label="Giao / Trả 1 phần" desc="Thiết lập giao / trả 1 phần mặc định khi tạo đơn" control={<Toggle on={settingsPartial} onChange={() => setSettingsPartial(v => !v)} />} />
                    <SettingRow label="Giao thất bại thu tiền" desc="Giao thất bại thu tiền giúp khách hàng thu thêm khoản phụ phí cho shop khi người nhận không nhận hàng. Khoản phí này Chotdon.AI không cam đoan sẽ thu được 100% mà phụ thuộc vào trao đổi thống nhất giữa shop và bên mua" control={<Toggle on={settingsCollectFail} onChange={() => setSettingsCollectFail(v => !v)} />} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 6, paddingBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Ghi chú đơn hàng</span>
                      <span style={{ fontSize: 14, color: '#4B5563', lineHeight: '20px' }}>Thiết lập ghi chú đơn hàng mặc định khi tạo đơn</span>
                      <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 12px' }}>
                        <textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} placeholder="Ghi chú đơn hàng" style={{ width: '100%', minHeight: 80, border: 'none', outline: 'none', resize: 'vertical', fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', background: 'transparent', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <SettingRow label="Ghi chú xem hàng" desc="Thiết lập ghi chú đơn hàng mặc định khi tạo đơn" control={<SelectCtrl value="Cho xem hàng không thử" />} />
                    <SettingRow label="Tự động yêu cầu giao lại" desc='Khi đơn hàng giao không thành công hoàn hàng với các lý do: "Không liên lạc được", "Khách không có nhà" sẽ tự động yêu cầu nhà vận chuyển giao hàng lại' control={<Toggle on={autoRedeliver} onChange={() => setAutoRedeliver(v => !v)} />} />
                  </SectionCard>
                  <SectionCard icon={<IcTruck />} title="Dịch vụ">
                    <SettingRow label="Phí ship" desc="Thiết lập người trả phí ship mặc định khi tạo đơn" control={<SelectCtrl value="Khách trả phí shop" />} />
                    <SettingRow label="Thu ship khách hàng" desc="Thiết lập thu ship khách hàng mặc định khi tạo đơn" control={
                      <div style={{ width: 240, flexShrink: 0, border: `1px solid ${C_BORDER}`, borderRadius: 6, height: 32, display: 'flex', alignItems: 'center', paddingLeft: 12, overflow: 'hidden' }}>
                        <input type="number" value={collectShipFee} onChange={e => setCollectShipFee(parseFloat(e.target.value) || 0)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, textAlign: 'right', background: 'transparent', lineHeight: '20px', minWidth: 0 }} />
                        <div style={{ background: '#F3F4F6', borderLeft: `1px solid ${C_BORDER}`, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>đ</span>
                        </div>
                      </div>
                    } />
                  </SectionCard>
                  <SectionCard icon={<IcArrowReturn />} title="Trả hàng">
                    <SettingRow label="Địa chỉ trả hàng" desc="Khi đơn hàng giao không thành công, hoàn hàng đơn hàng sẽ được chuyển hoàn về địa chỉ mặc định này" control={<SelectCtrl value="Chọn địa chỉ lấy hàng làm địa chỉ trả hàng" flex1 />} />
                  </SectionCard>
                </div>
              </div>
            )}
            {activeTab === 'pickup' && (
              <div style={{ padding: '40px 80px' }}>
                <span style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '28px' }}>Địa chỉ lấy hàng</span>
              </div>
            )}
            {activeTab === 'print' && (
              <div style={{ padding: '40px 80px' }}>
                <span style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '28px' }}>In đơn hàng</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ── Shared sub-components (defined outside to keep stable references across renders) ──
function NumericWithUnit({ value, onChange, unit, width, flex1, disabled, readOnly }: {
  value: number; onChange?: (v: number) => void; unit: string; width?: number; flex1?: boolean; disabled?: boolean; readOnly?: boolean
}) {
  return (
    <div style={{ background: disabled ? '#F3F4F6' : '#F9FAFB', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 8, opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto', ...(flex1 ? { flex: 1, minWidth: 0 } : { width: width ?? 180, flexShrink: 0 }) }}>
      {readOnly ? (
        <span style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY, textAlign: 'right', lineHeight: '20px', minWidth: 0 }}>
          {value.toLocaleString('en-US')}
        </span>
      ) : (
        <input
          value={value === 0 ? '0' : value.toLocaleString('en-US')}
          onChange={(e) => onChange?.(parseFloat(e.target.value.replace(/,/g, '')) || 0)}
          type="text" disabled={disabled}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, textAlign: 'right', background: 'transparent', lineHeight: '20px', minWidth: 0 }}
        />
      )}
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

// ── Drawer card/field building blocks (shared by CreateOrderDrawer + CreateLetterDrawer) ──
const drawerCard: React.CSSProperties = {
  background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
  display: 'flex', flexDirection: 'column', width: '100%',
}
function CardHeader({ icon, label, right }: { icon: React.ReactNode; label: string; right?: React.ReactNode }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
        {icon}
        <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{label}</span>
        {right}
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
function FieldSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 12, width: '100%', position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', border: 'none', outline: 'none', background: 'transparent', appearance: 'none', cursor: 'pointer' }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <div style={{ pointerEvents: 'none' }}><IcChevronDown size={20} /></div>
    </div>
  )
}
function LinkText({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 14, color: C_LINK, lineHeight: '20px', cursor: 'pointer', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>{children}</span>
}

// ── 247Express "Thư" (letter) pricing model — mirrors Hợp đồng 1231/2026/HĐDV-247, dịch vụ
// Chuyển phát nhanh. Zone/khoảng cách thật giữa các tỉnh không có trong data demo (chỉ có
// PROVINCE_REGION theo miền) nên "Đến 300km"/"Trên 300km" được suy ra từ cùng-miền/khác-miền,
// và mốc "Đến 100KM" của bảng dịch vụ gia tăng nhanh không bao giờ được chọn tới — đây là
// giới hạn đã biết của dữ liệu demo, không phải thiếu sót khi đọc hợp đồng.
const LETTER_HUB_PROVINCE = 'TP.HCM'
const LETTER_TABLE = letterPricingTable as any

function isSameUnorderedPair(a: string, b: string, pair: [string, string]): boolean {
  return (a === pair[0] && b === pair[1]) || (a === pair[1] && b === pair[0])
}
function resolveLetterMainZone(from: string, to: string): number {
  if (from === to) return from === LETTER_HUB_PROVINCE ? 0 : 1
  if (isSameUnorderedPair(from, to, ['TP.HCM', 'Hà Nội'])) return 5
  if (isSameUnorderedPair(from, to, ['TP.HCM', 'Đà Nẵng']) || isSameUnorderedPair(from, to, ['Đà Nẵng', 'Hà Nội'])) return 4
  return PROVINCE_REGION[from] === PROVINCE_REGION[to] ? 2 : 3
}
function letterMainFee(zoneIdx: number, weightGram: number): number {
  const brackets: number[] = LETTER_TABLE.weightBracketsGram
  if (weightGram <= brackets[brackets.length - 1]) {
    const rowIdx = brackets.findIndex(b => weightGram <= b)
    return LETTER_TABLE.prices[rowIdx === -1 ? brackets.length - 1 : rowIdx][zoneIdx]
  }
  let fee = LETTER_TABLE.prices[brackets.length - 1][zoneIdx]
  let currentWeight = brackets[brackets.length - 1]
  const steps = Math.ceil((weightGram - currentWeight) / 500)
  for (let i = 0; i < steps; i++) {
    currentWeight += 500
    const rate = currentWeight <= 10000
      ? LETTER_TABLE.overweightPer500g.from2to10kg[zoneIdx]
      : LETTER_TABLE.overweightPer500g.over10kg[zoneIdx]
    fee += rate
  }
  return fee
}
function letterKhaiGiaFee(goodsValue: number): number {
  const { percent, minFee } = LETTER_TABLE.surcharges.insuranceFlat
  return Math.max(parseInt(minFee, 10), Math.round(goodsValue * percent / 100))
}
function letterDongKiemFee(units: number): number {
  return Math.max(20000, units * 1000)
}
function letterDongLanhFee(weightGram: number): number {
  return Math.round((weightGram / 1000) * 15000)
}
function letterBaoPhatFee(): number {
  return parseInt(LETTER_TABLE.surcharges.baoPhat.fee, 10)
}
function letterChupHinhFee(photoCount: number): number {
  const { feePerPhoto, minFee, maxPhotos } = LETTER_TABLE.surcharges.chupHinh
  const count = Math.min(photoCount, maxPhotos)
  return Math.max(parseInt(minFee, 10), count * parseInt(feePerPhoto, 10))
}
function letterPhatHangSieuThiFee(units: number): number {
  const { baseFee, feePerUnit } = LETTER_TABLE.surcharges.phatHangSieuThi
  return parseInt(baseFee, 10) + units * parseInt(feePerUnit, 10)
}
function letterPhiAnNinhFee(weightGram: number): number {
  const { feePerKg, minFee } = LETTER_TABLE.surcharges.phiAnNinh
  return Math.max(parseInt(minFee, 10), Math.round((weightGram / 1000) * parseInt(feePerKg, 10)))
}
function letterHangVunFee(weightGram: number): number {
  const { feePerKg, minFee } = LETTER_TABLE.surcharges.hangVun
  return Math.max(parseInt(minFee, 10), Math.round((weightGram / 1000) * parseInt(feePerKg, 10)))
}
function letterSmsFee(messageCount: number): number {
  return messageCount * parseInt(LETTER_TABLE.surcharges.sms.feePerMessage, 10)
}
function letterFloorFee(weightGram: number, key: 'giaoHangLenTang' | 'nhanHangLenTang'): number {
  return Math.round((weightGram / 1000) * parseInt(LETTER_TABLE.surcharges[key].feePerKg, 10))
}
function letterHangExpressFee(weightGram: number): number {
  return Math.round((weightGram / 1000) * parseInt(LETTER_TABLE.surcharges.hangExpress.feePerKg, 10))
}
function letterHoSoThauFee(weightGram: number): number {
  const { baseFee, perKgOver2kg } = LETTER_TABLE.surcharges.hoSoThau
  const extraKg = Math.max(0, Math.ceil((weightGram - 2000) / 1000))
  return parseInt(baseFee, 10) + extraKg * parseInt(perKgOver2kg, 10)
}
function letterFlatFee(key: 'layIdCaNhan' | 'nguoiNhanThanhToan' | 'ngoaiGioHanhChinh' | 'phatHangTanTay' | 'phatUuTien' | 'thongTinDayDu' | 'thuKyKhachHang'): number {
  return parseInt(LETTER_TABLE.surcharges[key].fee, 10)
}

// ── 247Express "Chuyển phát đường bộ" — dịch vụ thứ 2 bên cạnh Chuyển phát nhanh, dùng
// cùng hợp đồng 1231/2026/HĐDV-247. Cước chính tính theo kg (không theo gram như Thư), 5 vùng
// khác với 6 vùng của Chuyển phát nhanh (không có tuyến HCM-ĐN/HN riêng). Các DVGT dùng chung
// số tiền giống Chuyển phát nhanh (Báo phát, Chụp hình, Khai giá, Đồng kiểm, Lấy ID cá nhân...)
// nên tái dùng thẳng các hàm letterXFee() ở trên — chỉ thêm hàm riêng cho phần khác biệt
// (cước chính theo kg, Hàng quá khổ, xe nâng, phí đóng gói). Phụ phí ngoại thành/nhiên liệu
// của dịch vụ này CHƯA có số liệu hợp đồng (để 0 trong JSON) — chờ bổ sung khi có ảnh đầy đủ.
const ROAD_TABLE = roadFreightPricingTable as any

function resolveRoadZone(from: string, to: string): number {
  if (from === to) return from === LETTER_HUB_PROVINCE ? 0 : 1
  const regionA = PROVINCE_REGION[from]
  const regionB = PROVINCE_REGION[to]
  if (regionA === regionB) return 2
  const isBacNam = (regionA === 'bac' && regionB === 'nam') || (regionA === 'nam' && regionB === 'bac')
  return isBacNam ? 4 : 3
}
function roadFreightTierRate(zoneIdx: number, weightKg: number): number {
  const tiers: { uptoKg: number | null; rates: number[] }[] = ROAD_TABLE.perKgTiers
  const tier = tiers.find(t => t.uptoKg === null || weightKg <= t.uptoKg) ?? tiers[tiers.length - 1]
  return tier.rates[zoneIdx]
}
function roadFreightMainFee(zoneIdx: number, weightKg: number): number {
  const base = ROAD_TABLE.baseFeeUpTo5kg[zoneIdx]
  if (weightKg <= 5) return base
  const w = Math.ceil(weightKg)
  const tiers: { uptoKg: number | null; rates: number[] }[] = ROAD_TABLE.perKgTiers
  let fee = base
  let prevBoundary = 5
  for (const tier of tiers) {
    const tierTop = tier.uptoKg === null ? w : Math.min(w, tier.uptoKg)
    if (tierTop > prevBoundary) {
      fee += (tierTop - prevBoundary) * tier.rates[zoneIdx]
      prevBoundary = tierTop
    }
    if (tier.uptoKg !== null && w <= tier.uptoKg) break
  }
  return fee
}
function roadFreightHangQuaKhoFee(zoneIdx: number, weightKg: number): number {
  const rate = roadFreightTierRate(zoneIdx, weightKg)
  if (weightKg < 15) return Math.round((15 - weightKg) * rate)
  return Math.round(weightKg * (ROAD_TABLE.surcharges.hangQuaKhoPercent / 100) * rate)
}
function roadFreightXeNangFee(lanCount: number): number {
  return lanCount * parseInt(ROAD_TABLE.surcharges.xeNang.feePerLan, 10)
}
function roadFreightDongGoiFee(materialId: string, weightKg: number): number {
  const material = ROAD_TABLE.dongGoi.find((m: any) => m.id === materialId)
  if (!material) return 0
  if (material.feePerKien) return parseInt(material.feePerKien, 10)
  const extraKg = Math.max(0, Math.ceil((weightKg - 1) / 5))
  return parseInt(material.upTo1kg, 10) + extraKg * parseInt(material.per5kg, 10)
}

// ── CreateOrderDrawer ────────────────────────────────────────
function CreateOrderDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  // ── State ──
  const [pickupType, setPickupType]             = useState<'home' | 'post'>('home')
  const [rcvName, setRcvName]                   = useState('Nguyễn Văn An')
  const [rcvPhone, setRcvPhone]                 = useState('0909888999')
  const [rcvStreet, setRcvStreet]               = useState('123 Thành Thái')
  const [rcvProvince, setRcvProvince]           = useState(() => parseProvince(allShops.find(s => s.id === 'SHP001')!.address))
  const [productName, setProductName]           = useState('')
  const [qty, setQty]                           = useState(1)
  const [price, setPrice]                       = useState(0)
  const [weight, setWeight]                     = useState(0.2)
  const [dimD, setDimD]                         = useState(10)
  const [dimR, setDimR]                         = useState(10)
  const [dimC, setDimC]                         = useState(10)
  const [cod, setCod]                           = useState(0)
  const [discount, setDiscount]                 = useState(0)
  const [shipCollect, setShipCollect]           = useState(0)
  const [goodsValue, setGoodsValue]             = useState(0)
  const [shopCode, setShopCode]                 = useState('')
  const [declareValue, setDeclareValue]         = useState(false)
  const [partialDeliver, setPartialDeliver]     = useState(false)
  const [collectOnFail, setCollectOnFail]       = useState(true)
  const [collectOnFailAmt, setCollectOnFailAmt] = useState(0)

  const currentShop = allShops.find(s => s.id === 'SHP001')!
  const shopConnectionId = (currentShop as any).connectionId as string | undefined
  const convertedWeight = Math.max(weight, (dimD * dimR * dimC) / 5000).toFixed(1)
  const weightGram = Number(convertedWeight) * 1000
  const fromProvince = parseProvince(currentShop.address)

  // Dịch vụ hiển thị cho shop = dịch vụ đại lý đang bật (Mặc định) và có gán Shop ID này —
  // carrier không hiển thị ra đây, đúng nguyên tắc shop không biết nhà vận chuyển nào xử lý đơn.
  const availableServices = servicesList.filter(
    s => s.enabled && !!shopConnectionId && s.shopConnectionIds.includes(shopConnectionId)
  )
  // Nhiều carrier có thể cùng cung cấp 1 dịch vụ trùng tên (VD "Giao nhanh" ở cả GHN và
  // 247Express) — gộp lại theo tên để shop chỉ thấy 1 lựa chọn duy nhất, hệ thống tự chọn
  // carrier rẻ nhất theo khối lượng đơn hiện tại, tránh hiện 2 dòng giống nhau gây khó hiểu.
  const serviceGroups = Object.values(
    availableServices.reduce((acc, s) => {
      (acc[s.name] ??= []).push(s)
      return acc
    }, {} as Record<string, AgencyService[]>)
  )
  const cheapestInGroup = (group: AgencyService[]) =>
    group.reduce((min, s) =>
      shopFeeFromPriceTable(s, weightGram, fromProvince, rcvProvince) < shopFeeFromPriceTable(min, weightGram, fromProvince, rcvProvince) ? s : min
    )

  const [selectedServiceName, setSelectedServiceName] = useState<string>(serviceGroups[0]?.[0]?.name ?? '')
  const [feePayer, setFeePayer] = useState<'sender' | 'receiver'>('sender')

  const now = new Date()
  const createdAt = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} - ${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`

  // ── Fee calculations ──────────────────────────────────────
  const selectedGroup   = serviceGroups.find(g => g[0]?.name === selectedServiceName)
  const selectedService = selectedGroup ? cheapestInGroup(selectedGroup) : undefined
  const priceTable       = selectedService?.priceTableId
    ? (allPricing as any[]).find(p => p.id === selectedService.priceTableId)
    : null
  const surcharges       = (priceTable?.surcharges ?? {}) as ShopPricingSurcharges

  const feeShipping = selectedService ? shopFeeFromPriceTable(selectedService, weightGram, fromProvince, rcvProvince) : 0
  const feeInsurance     = declareValue && goodsValue > 0
    ? shopCalcTierFee(goodsValue, surcharges.insurance ?? [])
    : 0
  const feePartial       = partialDeliver
    ? parseInt(surcharges.partialDelivery?.value ?? '0', 10)
    : 0
  const feeDeliveryFail  = collectOnFail
    ? parseInt(surcharges.deliveryFailFee?.value ?? '0', 10)
    : 0
  const feeCod           = cod > 0
    ? shopCalcTierFee(cod, surcharges.codFee ?? [])
    : 0
  const totalShipping    = feeShipping + feeInsurance + feePartial + feeDeliveryFail + feeCod
  const totalCollect     = feePayer === 'sender'
    ? cod + (shipCollect > 0 ? shipCollect : 0)
    : cod + feeShipping

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Tạo đơn hàng</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <IcX />
          </button>
        </div>
        <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

        {/* ── Body: gray bg, 6px gap & padding ───────────────── */}
        <div style={{
          flex: 1, display: 'flex', gap: 6, padding: 6,
          background: '#F3F4F6', overflow: 'hidden',
          alignItems: 'flex-start',
        }}>

          {/* ════ LEFT COLUMN ════════════════════════════════ */}
          <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>

            {/* ── Bên gửi card ── */}
            <div style={drawerCard}>
              <CardHeader icon={<IcStore />} label="Bên gửi" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                {/* Sender address selector */}
                <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', display: 'flex', gap: 12, cursor: 'pointer', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', overflow: 'hidden' }}>
                    <div>An An - 0909000000</div>
                    <div style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>268 Lý Thường Kiệt, Phường 14, Quận 10, Hồ Chí Minh</div>
                  </div>
                  <div style={{ paddingTop: 2, flexShrink: 0 }}><IcChevronDown /></div>
                </div>

                {/* Radio: pickup type */}
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

                {/* Pickup time dropdown */}
                <FieldDropdown placeholder="Chọn ca lấy hàng (Tuỳ chọn)" />
              </div>
            </div>

            {/* ── Bên nhận card ── */}
            <div style={drawerCard}>
              <CardHeader icon={<IcUser />} label="Bên nhận" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                {/* Name + Phone row */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {/* Name */}
                  <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 6, padding: '6px 12px' }}>
                    <input
                      value={rcvName} onChange={(e) => setRcvName(e.target.value)}
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
                    />
                  </div>
                  {/* Phone + TLHH badge */}
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

                {/* Street */}
                <FieldInput value={rcvStreet} onChange={setRcvStreet} placeholder="Số nhà, tên đường" />

                {/* City dropdown */}
                <FieldSelect value={rcvProvince} onChange={setRcvProvince} options={PROVINCES} />
              </div>
            </div>

            {/* ── Sản phẩm card ── */}
            <div style={{ ...drawerCard, flex: 1 }}>
              <CardHeader icon={<IcCube />} label="Sản phẩm" />

              {/* Product table — flex-ROWS so every cell in a row shares the same height */}
              <div style={{ padding: 8 }}>
                <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, overflow: 'hidden' }}>

                  {/* ── Header row ── */}
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

                  {/* ── Data row 1 ── */}
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
                    {/* KL/KT: opacity-0 until product name filled (per Figma) */}
                    <div style={{ width: 96, flexShrink: 0, padding: 6, display: 'flex', flexDirection: 'column', justifyContent: 'center', fontSize: 12, color: C_TEXT_PRIMARY, lineHeight: '16px', textAlign: 'right', whiteSpace: 'nowrap', opacity: productName ? 1 : 0 }}>
                      <span>{weight}kg</span>
                      <span>{dimD}x{dimR}x{dimC}cm</span>
                    </div>
                  </div>

                  {/* ── Ghost row 2 (opacity-0 — placeholder for 2nd product slot) ── */}
                  <div style={{ display: 'flex', alignItems: 'stretch', opacity: 0, pointerEvents: 'none' }}>
                    <div style={{ flex: 1, minWidth: 0, padding: 6 }}>
                      <div style={{ background: '#F9FAFB', borderRadius: 6, height: 32 }} />
                    </div>
                    <div style={{ width: 56, flexShrink: 0, padding: 6 }}>
                      <div style={{ background: '#F9FAFB', borderRadius: 6, height: 32 }} />
                    </div>
                    <div style={{ width: 104, flexShrink: 0, padding: 6 }}>
                      <div style={{ background: '#F9FAFB', borderRadius: 6, height: 32 }} />
                    </div>
                    <div style={{ width: 96, flexShrink: 0, padding: 6, display: 'flex', flexDirection: 'column', justifyContent: 'center', fontSize: 12, lineHeight: '16px', textAlign: 'right' }}>
                      <span>0.02kg</span>
                      <span>10x10x10cm</span>
                    </div>
                  </div>

                </div>
              </div>

              <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

              {/* Weight & dimensions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                {/* Khối lượng */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', width: 72, flexShrink: 0 }}>Khối lượng</span>
                  <NumericWithUnit value={weight} onChange={setWeight} unit="kg" flex1 />
                </div>
                {/* Kích thước */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', width: 72, flexShrink: 0 }}>Kích thước</span>
                  {/* gap-[2px] between the 3 dimension fields — matches Figma spec */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 2 }}>
                    {([['D', dimD, setDimD], ['R', dimR, setDimR], ['C', dimC, setDimC]] as const).map(([lbl, val, set]) => (
                      <div key={lbl} style={{ flex: 1, minWidth: 0, background: '#F9FAFB', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                        {/* label: flexShrink-0 so "D:" only takes its natural text width */}
                        <span style={{ flexShrink: 0, fontSize: 14, color: '#9CA3AF', lineHeight: '20px', whiteSpace: 'nowrap' }}>{lbl}:</span>
                        {/* value: flex-1, right-aligned, fills remaining space */}
                        <input
                          value={val} onChange={(e) => (set as (v: number) => void)(parseFloat(e.target.value) || 0)} type="number"
                          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, textAlign: 'right', background: 'transparent', lineHeight: '20px', padding: '0 8px' }}
                        />
                        {/* unit badge: flush right, rounded right corners only */}
                        <div style={{ background: '#F3F4F6', width: 32, height: 32, borderRadius: '0 6px 6px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>cm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Converted weight */}
                <div style={{ paddingLeft: 84, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Khối lượng quy đổi: {convertedWeight}kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* ════ RIGHT COLUMN (w-400px) ═════════════════════ */}
          <div style={{ width: 400, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>

            {/* ── Thông tin đơn hàng card ── */}
            <div style={{ ...drawerCard, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, flexShrink: 0 }}>
                <IcClipboard />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Thông tin đơn hàng</span>
                <span style={{ fontSize: 14, color: '#4B5563', lineHeight: '20px', whiteSpace: 'nowrap' }}>Tạo lúc {createdAt}</span>
              </div>
              <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

              {/* Scrollable fields */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Order detail fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                  {/* Mã đơn shop */}
                  <InfoRow label="Mã đơn shop">
                    <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', width: 180, flexShrink: 0 }}>
                      <input
                        value={shopCode} onChange={(e) => setShopCode(e.target.value)}
                        placeholder="Mã đơn shop"
                        style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: '#9CA3AF', background: 'transparent', lineHeight: '20px' }}
                      />
                    </div>
                  </InfoRow>
                  {/* COD */}
                  <InfoRow label="COD">
                    <NumericWithUnit value={cod} onChange={setCod} unit="đ" />
                  </InfoRow>
                  {/* Giảm giá */}
                  <InfoRow label="Giảm giá">
                    <NumericWithUnit value={discount} onChange={setDiscount} unit="đ" />
                  </InfoRow>
                  {/* Thu ship khách hàng */}
                  <InfoRow label="Thu ship khách hàng" hint>
                    <NumericWithUnit value={shipCollect} onChange={setShipCollect} unit="đ" disabled={feePayer === 'receiver'} />
                  </InfoRow>
                  {/* Giá trị hàng */}
                  <InfoRow label="Giá trị hàng">
                    <NumericWithUnit value={goodsValue} onChange={setGoodsValue} unit="đ" />
                  </InfoRow>

                  {/* Checkbox: Khai giá trị hàng */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32 }}>
                    <CheckboxBlue checked={declareValue} onChange={() => setDeclareValue(!declareValue)} />
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap' }}>Khai giá trị hàng</span>
                  </div>
                  {/* Checkbox: Giao / Trả 1 phần */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32 }}>
                    <CheckboxBlue checked={partialDeliver} onChange={() => setPartialDeliver(!partialDeliver)} />
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap' }}>Giao / Trả 1 phần</span>
                  </div>
                  {/* Checkbox: Giao thất bại thu tiền */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckboxBlue checked={collectOnFail} onChange={() => setCollectOnFail(!collectOnFail)} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap' }}>Giao thất bại thu tiền</span>
                      <IcHelp />
                    </div>
                    {/* amount input with bordered đ badge (per Figma) */}
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

                <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

                {/* Notes & misc */}
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
                      <LinkText>{link}</LinkText>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Dịch vụ card ── */}
            <div style={{ ...drawerCard, flexShrink: 0 }}>
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
                {serviceGroups.length === 0 ? (
                  <div style={{ padding: '12px 4px', fontSize: 13, color: C_TEXT_SECONDARY }}>
                    Shop chưa được gán dịch vụ nào — liên hệ đại lý để được thêm dịch vụ.
                  </div>
                ) : serviceGroups.map((group) => {
                  const name = group[0].name
                  const selected = selectedServiceName === name
                  const fee = shopFeeFromPriceTable(cheapestInGroup(group), weightGram, fromProvince, rcvProvince)
                  return (
                    <div
                      key={name}
                      onClick={() => setSelectedServiceName(name)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                        border: `1px solid ${selected ? '#111827' : C_BORDER}`,
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${selected ? '#111827' : C_BORDER}`,
                        background: selected ? '#111827' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selected && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, color: '#4B5563', lineHeight: '16px' }}>Dịch vụ</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{name}</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#4B5563', lineHeight: '16px', flexShrink: 0 }}>Phí ship:</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {fee.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Action card ── */}
            {/* ── Danh sách phí card ── */}
            <div style={{ ...drawerCard, flexShrink: 0 }}>
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
            <div style={{ ...drawerCard, flexShrink: 0, gap: 8, padding: 8 }}>
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
                <button
                  style={{ flex: 1, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}
                >
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

// ── CreateLetterDrawer ("Tạo thư, tài liệu") ────────
// Cùng khung layout với CreateOrderDrawer (theo yêu cầu "giữ nguyên layout giống tạo đơn hàng
// GHN"), nhưng phần Dịch vụ/Phụ phí đọc đúng theo LETTER_TABLE (khớp Hợp đồng 1231/2026/HĐDV-247,
// dịch vụ Chuyển phát nhanh) thay vì bảng giá generic dùng chung của CreateOrderDrawer.
// Hợp đồng chỉ có 1 bảng cước cho dịch vụ Chuyển phát nhanh — dùng chung 1 layout cho mọi loại
// (thư/bưu phẩm/bưu kiện), không tách tab/pill theo loại. Không còn mặc định cân nặng 0.2kg kiểu
// "thư nhẹ" — để 0 cho shop tự nhập đúng cân nặng thực tế. Hỗ trợ nhiều sản phẩm trong 1 lần gửi
// (bảng "Sản phẩm" có nút "+ Thêm sản phẩm", khác với ghost-row trang trí không chức năng của
// CreateOrderDrawer gốc).
function CreateLetterDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rcvName, setRcvName]           = useState('Nguyễn Văn An')
  const [rcvPhone, setRcvPhone]         = useState('0909888999')
  const [rcvStreet, setRcvStreet]       = useState('123 Thành Thái')
  const [rcvProvince, setRcvProvince]   = useState(() => parseProvince(allShops.find(s => s.id === 'SHP001')!.address))
  const [weight, setWeight]             = useState(0.2)
  const [dimD, setDimD]                 = useState(10)
  const [dimR, setDimR]                 = useState(10)
  const [dimC, setDimC]                 = useState(10)
  const [otherCollectValue, setOtherCollectValue] = useState(0)
  const [goodsValue, setGoodsValue]     = useState(0)
  const [shopCode, setShopCode]         = useState('')
  const [letterContent, setLetterContent] = useState('')
  const [viewGoodsPolicy, setViewGoodsPolicy] = useState<'none' | 'view_no_try'>('none')
  const [viewGoodsPickerOpen, setViewGoodsPickerOpen] = useState(false)
  const [declareValue, setDeclareValue] = useState(false)
  const [ngoaiThanh, setNgoaiThanh]     = useState(false)
  const [dongKiem, setDongKiem]         = useState(false)
  const [dongKiemUnits, setDongKiemUnits] = useState(1)
  const [dongLanh, setDongLanh]         = useState(false)
  const [baoPhat, setBaoPhat]           = useState(false)
  const [chupHinh, setChupHinh]         = useState(false)
  const [chupHinhCount, setChupHinhCount] = useState(1)
  const [layIdCaNhan, setLayIdCaNhan]   = useState(false)
  const [nguoiNhanThanhToan, setNguoiNhanThanhToan] = useState(false)
  const [ngoaiGioHanhChinh, setNgoaiGioHanhChinh]   = useState(false)
  const [phatHangSieuThi, setPhatHangSieuThi]       = useState(false)
  const [phatHangSieuThiUnits, setPhatHangSieuThiUnits] = useState(1)
  const [phatHangTanTay, setPhatHangTanTay] = useState(false)
  const [phatUuTien, setPhatUuTien]     = useState(false)
  const [phiAnNinh, setPhiAnNinh]       = useState(false)
  const [thongTinDayDu, setThongTinDayDu] = useState(false)
  const [thuKyKhachHang, setThuKyKhachHang] = useState(false)
  const [smsOn, setSmsOn]               = useState(false)
  const [smsCount, setSmsCount]         = useState(1)
  const [giaoHangLenTang, setGiaoHangLenTang] = useState(false)
  const [nhanHangLenTang, setNhanHangLenTang] = useState(false)
  const [hangExpress, setHangExpress]   = useState(false)
  const [hangVun, setHangVun]           = useState(false)
  const [hoSoThau, setHoSoThau]         = useState(false)
  const [letterService, setLetterService] = useState<'nhanh' | 'duongbo'>('nhanh')
  const [xeNang, setXeNang]             = useState(false)
  const [xeNangCount, setXeNangCount]   = useState(1)
  const [hangQuaKho, setHangQuaKho]     = useState(false)
  const [dongGoiMaterial, setDongGoiMaterial] = useState<string>('none')
  const [vasModalOpen, setVasModalOpen] = useState(false)
  const [vasSearch, setVasSearch]       = useState('')

  const currentShop = allShops.find(s => s.id === 'SHP001')!
  // 247Express bắt buộc lấy hàng tại 1 địa điểm gửi hàng (ClientHubID) cố định — mỗi dịch
  // vụ 247Express (ServiceDetail.tsx, mục "Chọn địa điểm gửi hàng") chỉ gắn ĐÚNG 1 hub, nên
  // lấy thẳng hub của dịch vụ 247Express đang bật đầu tiên của đại lý, không cần suy đoán
  // qua tỉnh của shop nữa — luôn chính xác vì hub đã được đại lý gán cố định cho dịch vụ.
  // Shop không cần biết/thấy hub này (UI vẫn hiển thị địa chỉ shop bình thường).
  const primary247Service = servicesList.find(
    s => s.agencyId === currentShop.agencyId && s.carrier === '247Express' && s.enabled && (s.hubIds?.length ?? 0) > 0
  )
  const selectedHub = clientHubs247.find(h => h.id === primary247Service?.hubIds?.[0])

  useEffect(() => {
    if (!viewGoodsPickerOpen) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-view-goods-menu]')) setViewGoodsPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [viewGoodsPickerOpen])

  const convertedWeight = Math.max(weight, (dimD * dimR * dimC) / 5000).toFixed(1)
  const weightGram = Number(convertedWeight) * 1000
  const fromProvince = selectedHub ? hubProvinceLabel(selectedHub.provinceName) : parseProvince(currentShop.address)

  const now = new Date()
  const createdAt = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} - ${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`

  // ── Fee calculations (theo đúng công thức hợp đồng) ──
  // API tạo đơn CustomerAPICreateOrder không có field nào để client gửi số tiền phụ phí —
  // client chỉ gửi InformFee (giá trị khai) + ExtraServices (mã dịch vụ, không kèm amount);
  // 247Express tự tính phí và trả lại trong response. Vì vậy toàn bộ các dòng phụ phí dưới đây
  // là SỐ TỰ TÍNH, không cho shop tự ghi đè (không có khái niệm "custom amount" khớp với API).
  const isNhanh = letterService === 'nhanh'
  const isDuongBo = letterService === 'duongbo'
  const activeTable = isNhanh ? LETTER_TABLE : ROAD_TABLE
  const weightKg = weightGram / 1000

  const mainZoneIdx = resolveLetterMainZone(fromProvince, rcvProvince)
  const roadZoneIdx = resolveRoadZone(fromProvince, rcvProvince)
  const feeMain = isNhanh ? letterMainFee(mainZoneIdx, weightGram) : roadFreightMainFee(roadZoneIdx, weightKg)

  const feeNgoaiThanh = ngoaiThanh ? Math.round(feeMain * activeTable.surcharges.ngoaiThanhPercent / 100) : 0

  const feeKhaiGia = declareValue && goodsValue > 0 ? letterKhaiGiaFee(goodsValue) : 0

  const feeDongKiem = dongKiem ? letterDongKiemFee(dongKiemUnits) : 0

  const feeDongLanh = dongLanh && isNhanh ? letterDongLanhFee(weightGram) : 0

  const feeBaoPhat = baoPhat ? letterBaoPhatFee() : 0

  const feeChupHinh = chupHinh ? letterChupHinhFee(chupHinhCount) : 0
  const feeLayIdCaNhan = layIdCaNhan ? letterFlatFee('layIdCaNhan') : 0
  const feeNguoiNhanThanhToan = nguoiNhanThanhToan ? letterFlatFee('nguoiNhanThanhToan') : 0
  const feeNgoaiGioHanhChinh = ngoaiGioHanhChinh ? letterFlatFee('ngoaiGioHanhChinh') : 0
  const feePhatHangSieuThi = phatHangSieuThi ? letterPhatHangSieuThiFee(phatHangSieuThiUnits) : 0
  const feePhatHangTanTay = phatHangTanTay ? letterFlatFee('phatHangTanTay') : 0
  const phatUuTienEligible = weightGram <= LETTER_TABLE.surcharges.phatUuTien.maxWeightGram
  const feePhatUuTien = phatUuTien && phatUuTienEligible && isNhanh ? letterFlatFee('phatUuTien') : 0
  const feePhiAnNinh = phiAnNinh && isNhanh ? letterPhiAnNinhFee(weightGram) : 0
  const feeThongTinDayDu = thongTinDayDu ? letterFlatFee('thongTinDayDu') : 0
  const feeThuKyKhachHang = thuKyKhachHang ? letterFlatFee('thuKyKhachHang') : 0
  const feeSms = smsOn ? letterSmsFee(smsCount) : 0
  const floorEligible = weightGram >= LETTER_TABLE.surcharges.giaoHangLenTang.minWeightGram
  const feeGiaoHangLenTang = giaoHangLenTang && floorEligible ? letterFloorFee(weightGram, 'giaoHangLenTang') : 0
  const feeNhanHangLenTang = nhanHangLenTang && floorEligible ? letterFloorFee(weightGram, 'nhanHangLenTang') : 0
  const hangExpressEligible = weightGram > LETTER_TABLE.surcharges.hangExpress.minWeightGram
  const feeHangExpress = hangExpress && hangExpressEligible && !hoSoThau && isNhanh ? letterHangExpressFee(weightGram) : 0
  const feeHangVun = hangVun && isNhanh ? letterHangVunFee(weightGram) : 0
  const feeHoSoThau = hoSoThau && isNhanh ? letterHoSoThauFee(weightGram) : 0

  const feeHangQuaKho = hangQuaKho && isDuongBo ? roadFreightHangQuaKhoFee(roadZoneIdx, weightKg) : 0
  const feeXeNang = xeNang && isDuongBo ? roadFreightXeNangFee(xeNangCount) : 0
  const feeDongGoi = isDuongBo && dongGoiMaterial !== 'none' ? roadFreightDongGoiFee(dongGoiMaterial, weightKg) : 0

  const totalShipping = feeMain + feeNgoaiThanh + feeKhaiGia + feeDongKiem + feeDongLanh
    + feeBaoPhat + feeChupHinh + feeLayIdCaNhan + feeNguoiNhanThanhToan + feeNgoaiGioHanhChinh + feePhatHangSieuThi
    + feePhatHangTanTay + feePhatUuTien + feePhiAnNinh + feeThongTinDayDu + feeThuKyKhachHang + feeSms
    + feeGiaoHangLenTang + feeNhanHangLenTang + feeHangExpress + feeHangVun + feeHoSoThau
    + feeHangQuaKho + feeXeNang + feeDongGoi
  // Hợp đồng 247Express (pricing-letter-247.json / pricing-roadfreight-247.json) chưa có mục
  // thuế/VAT — dùng mức VAT phổ biến hiện hành (8%) trên tổng cước + DVGT, chỉ mang tính demo.
  const feeVat = Math.round(totalShipping * 0.08)
  const grandTotal = totalShipping + feeVat

  // ── Dịch vụ gia tăng (DVGT) — gộp về 1 modal tìm-kiếm-được vì hợp đồng có rất nhiều dịch vụ
  // (24+ mục), thay vì list dài cố định trong card "Dịch vụ" như trước. Mỗi item vẫn giữ đúng
  // state/công thức phí cũ — modal chỉ đổi lớp hiển thị + cách chọn.
  const vasItems: { key: string; label: string; note?: string; checked: boolean; toggle: () => void; disabledReason?: string; fee: number; extra?: React.ReactNode }[] = [
    { key: 'declareValue', label: 'Khai giá trị hàng', note: '0,75% giá trị khai, tối thiểu 20.000đ', checked: declareValue, toggle: () => setDeclareValue(v => !v), fee: feeKhaiGia },
    { key: 'ngoaiThanh', label: 'Địa chỉ ngoại thành', note: '+20% cước', checked: ngoaiThanh, toggle: () => setNgoaiThanh(v => !v), fee: feeNgoaiThanh },
    {
      key: 'dongKiem', label: 'Đồng kiểm vận đơn', checked: dongKiem, toggle: () => setDongKiem(v => !v), fee: feeDongKiem,
      extra: dongKiem ? <NumericWithUnit value={dongKiemUnits} onChange={setDongKiemUnits} unit="đơn vị" width={140} /> : undefined,
    },
    ...(isNhanh ? [{ key: 'dongLanh', label: 'Hàng đông lạnh', note: '15.000đ/kg, không tính phí Express nếu có', checked: dongLanh, toggle: () => setDongLanh(v => !v), fee: feeDongLanh }] : []),
    { key: 'baoPhat', label: 'Báo phát', note: '5.000đ/vận đơn, miễn phí nếu thất lạc', checked: baoPhat, toggle: () => setBaoPhat(v => !v), fee: feeBaoPhat },
    {
      key: 'chupHinh', label: 'Chụp hình', note: '2.000đ/hình, tối thiểu 5.000đ, tối đa 10 hình', checked: chupHinh, toggle: () => setChupHinh(v => !v), fee: feeChupHinh,
      extra: chupHinh ? <NumericWithUnit value={chupHinhCount} onChange={(v) => setChupHinhCount(Math.min(10, Math.max(1, v)))} unit="hình" width={140} /> : undefined,
    },
    {
      key: 'phatHangSieuThi', label: 'Phát hàng siêu thị', note: '100.000đ + 1.000đ/đơn vị kiểm đếm', checked: phatHangSieuThi, toggle: () => setPhatHangSieuThi(v => !v), fee: feePhatHangSieuThi,
      extra: phatHangSieuThi ? <NumericWithUnit value={phatHangSieuThiUnits} onChange={setPhatHangSieuThiUnits} unit="đơn vị" width={140} /> : undefined,
    },
    {
      key: 'sms', label: 'Dịch vụ tin nhắn SMS', note: '1.000đ/tin, tối đa 160 ký tự/tin', checked: smsOn, toggle: () => setSmsOn(v => !v), fee: feeSms,
      extra: smsOn ? <NumericWithUnit value={smsCount} onChange={setSmsCount} unit="tin" width={140} /> : undefined,
    },
    { key: 'layIdCaNhan', label: 'Lấy ID cá nhân', note: '10.000đ/vận đơn, miễn phí nếu thất lạc', checked: layIdCaNhan, toggle: () => setLayIdCaNhan(v => !v), fee: feeLayIdCaNhan },
    { key: 'nguoiNhanThanhToan', label: 'Người nhận thanh toán', note: '20.000đ/vận đơn', checked: nguoiNhanThanhToan, toggle: () => setNguoiNhanThanhToan(v => !v), fee: feeNguoiNhanThanhToan },
    { key: 'ngoaiGioHanhChinh', label: 'Ngoài giờ hành chánh', note: '50.000đ/vận đơn, miễn phí nếu thất lạc', checked: ngoaiGioHanhChinh, toggle: () => setNgoaiGioHanhChinh(v => !v), fee: feeNgoaiGioHanhChinh },
    { key: 'phatHangTanTay', label: 'Phát hàng tận tay', note: '10.000đ/vận đơn, miễn phí nếu thất lạc', checked: phatHangTanTay, toggle: () => setPhatHangTanTay(v => !v), fee: feePhatHangTanTay },
    { key: 'thongTinDayDu', label: 'Thông tin đầy đủ', note: '5.000đ/vận đơn, miễn phí nếu thất lạc', checked: thongTinDayDu, toggle: () => setThongTinDayDu(v => !v), fee: feeThongTinDayDu },
    { key: 'thuKyKhachHang', label: 'Thư ký khách hàng', note: '50.000đ/vận đơn, miễn phí nếu thất lạc', checked: thuKyKhachHang, toggle: () => setThuKyKhachHang(v => !v), fee: feeThuKyKhachHang },
    {
      key: 'giaoHangLenTang', label: 'Giao hàng lên/xuống tầng (đầu nhận)', note: '250đ/kg, chỉ áp dụng đơn ≥ 50kg', checked: giaoHangLenTang, toggle: () => setGiaoHangLenTang(v => !v), fee: feeGiaoHangLenTang,
      disabledReason: floorEligible ? undefined : 'Chỉ áp dụng đơn hàng có trọng lượng từ 50kg trở lên',
    },
    {
      key: 'nhanHangLenTang', label: 'Nhận hàng lên/xuống tầng (đầu gửi)', note: '250đ/kg, chỉ áp dụng đơn ≥ 50kg', checked: nhanHangLenTang, toggle: () => setNhanHangLenTang(v => !v), fee: feeNhanHangLenTang,
      disabledReason: floorEligible ? undefined : 'Chỉ áp dụng đơn hàng có trọng lượng từ 50kg trở lên',
    },
    ...(isNhanh ? [
      {
        key: 'phatUuTien', label: 'Phát ưu tiên', note: '30.000đ/vận đơn, chỉ áp dụng TL ≤ 2kg', checked: phatUuTien, toggle: () => setPhatUuTien(v => !v), fee: feePhatUuTien,
        disabledReason: phatUuTienEligible ? undefined : 'Chỉ áp dụng vận đơn có TL ≤ 2kg — cân nặng hiện tại vượt mức',
      },
      { key: 'phiAnNinh', label: 'Phí an ninh', note: '12.000đ/kg, tối thiểu 200.000đ/vận đơn', checked: phiAnNinh, toggle: () => setPhiAnNinh(v => !v), fee: feePhiAnNinh },
      {
        key: 'hangExpress', label: 'Hàng Express', note: '10.000đ/kg, áp dụng cho vận đơn > 2kg', checked: hangExpress, toggle: () => setHangExpress(v => !v), fee: feeHangExpress,
        disabledReason: !hangExpressEligible ? 'Chỉ áp dụng vận đơn > 2kg' : hoSoThau ? 'Không tính phí Express khi đã chọn Hồ sơ thầu' : undefined,
      },
      { key: 'hangVun', label: 'Hàng VUN', note: '12.000đ/kg, tối thiểu 200.000đ/vận đơn', checked: hangVun, toggle: () => setHangVun(v => !v), fee: feeHangVun },
      { key: 'hoSoThau', label: 'Hồ sơ thầu', note: '200.000đ + 15.000đ/kg trên 2kg — không tính phí Phát hẹn giờ/trong ngày, Express', checked: hoSoThau, toggle: () => setHoSoThau(v => !v), fee: feeHoSoThau },
    ] : []),
    ...(isDuongBo ? [
      { key: 'hangQuaKho', label: 'Hàng quá khổ', note: '10%, tính theo nấc cước + công thức TL so với 15kg', checked: hangQuaKho, toggle: () => setHangQuaKho(v => !v), fee: feeHangQuaKho },
      {
        key: 'xeNang', label: 'Phụ phí thuê xe nâng', note: '625.000đ/lần phát sinh', checked: xeNang, toggle: () => setXeNang(v => !v), fee: feeXeNang,
        extra: xeNang ? <NumericWithUnit value={xeNangCount} onChange={setXeNangCount} unit="lần" width={140} /> : undefined,
      },
      ...ROAD_TABLE.dongGoi.map((m: any) => ({
        key: `dongGoi_${m.id}`, label: m.label, checked: dongGoiMaterial === m.id,
        toggle: () => setDongGoiMaterial(v => v === m.id ? 'none' : m.id),
        fee: dongGoiMaterial === m.id ? feeDongGoi : 0,
      })),
    ] : []),
  ]
  const vasFiltered = vasItems.filter(i => i.label.toLowerCase().includes(vasSearch.trim().toLowerCase()))
  const vasSelected = vasItems.filter(i => i.checked)

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 200,
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: 980, height: '100vh',
        background: '#fff', boxShadow: '0 0 20px rgba(0,0,0,0.2)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Tạo thư, tài liệu</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <IcX />
          </button>
        </div>
        <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

        <div style={{ flex: 1, display: 'flex', gap: 6, padding: 6, background: '#F3F4F6', overflow: 'hidden', alignItems: 'flex-start' }}>

          {/* ════ LEFT COLUMN ════ */}
          <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>

            <div style={drawerCard}>
              <CardHeader icon={<IcStore />} label="Bên gửi" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 110, flexShrink: 0, fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Địa chỉ KH</span>
                  {/* Hiển thị địa chỉ shop như đơn GHN bình thường — không lộ việc điểm lấy
                      hàng thực tế là kho/hub của 247Express (senderHub tính ngầm ở trên) */}
                  <div style={{ flex: 1, minWidth: 0, background: '#F9FAFB', borderRadius: 6, padding: '6px 12px' }}>
                    <div style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{currentShop.ownerName} - {currentShop.phone}</div>
                    <div style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{currentShop.address}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={drawerCard}>
              <CardHeader icon={<IcUser />} label="Bên nhận" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <div style={{ flex: 1, background: '#F9FAFB', borderRadius: 6, padding: '6px 12px' }}>
                    <input
                      value={rcvName} onChange={(e) => setRcvName(e.target.value)}
                      style={{ width: '100%', border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 200, background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
                    <input
                      value={rcvPhone} onChange={(e) => setRcvPhone(e.target.value)}
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
                    />
                  </div>
                </div>
                <FieldInput value={rcvStreet} onChange={setRcvStreet} placeholder="Số nhà, tên đường" />
                <FieldSelect value={rcvProvince} onChange={setRcvProvince} options={PROVINCES} />
              </div>
            </div>

            {/* ── Sản phẩm card — thư/tài liệu không có khái niệm tên hàng/giá bán như đơn
                hàng GHN, chỉ cần khối lượng + kích thước để tính phí theo hợp đồng. Tab
                "Hàng hoá" disabled vì drawer này chỉ tạo được vận đơn Tài liệu — gửi hàng hoá
                dùng "Tạo đơn hàng" (CreateOrderDrawer). ── */}
            <div style={{ ...drawerCard, flex: 1 }}>
              <CardHeader icon={<IcCube />} label="Sản phẩm" right={
                <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 6, padding: 2, flexShrink: 0 }}>
                  <div style={{ padding: '4px 12px', borderRadius: 4, background: '#111827', color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: '18px' }}>
                    Tài liệu
                  </div>
                  <div style={{ padding: '4px 12px', borderRadius: 4, color: '#9CA3AF', fontSize: 13, fontWeight: 600, lineHeight: '18px', cursor: 'not-allowed' }}>
                    Hàng hoá
                  </div>
                </div>
              } />

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

          {/* ════ RIGHT COLUMN ════ */}
          <div style={{ width: 400, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>

            {/* Toàn bộ 3 card dưới đây cuộn CÙNG NHAU trong 1 vùng — tránh trường hợp 1 card bị
                giới hạn chiều cao khiến nội dung cuối (checkbox phụ phí, ghi chú) bị khuất mà
                không có dấu hiệu cuộn rõ ràng. Action card (Lưu nháp/Tạo đơn) đứng ngoài, cố định. */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>

            <div style={{ ...drawerCard, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, flexShrink: 0 }}>
                <IcClipboard />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Thông tin thư</span>
                <span style={{ fontSize: 14, color: '#4B5563', lineHeight: '20px', whiteSpace: 'nowrap' }}>Tạo lúc {createdAt}</span>
              </div>
              <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />
              <div>
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
                  <InfoRow label="Giá trị hàng hoá">
                    <NumericWithUnit value={goodsValue} onChange={setGoodsValue} unit="đ" />
                  </InfoRow>
                  <InfoRow label="Giá trị thu khác">
                    <NumericWithUnit value={otherCollectValue} onChange={setOtherCollectValue} unit="đ" />
                  </InfoRow>
                </div>

                <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

                {/* DVGT — hợp đồng có 24+ dịch vụ gia tăng nên gộp vào 1 modal tìm-kiếm-được
                    thay vì list dài trong card "Dịch vụ", đưa lên Thông tin thư cho dễ thấy. */}
                <div style={{ padding: 8 }}>
                  <div
                    onClick={() => setVasModalOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', minHeight: 32 }}
                  >
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>DVGT</span>
                    {vasSelected.length === 0 ? (
                      <span style={{ flex: 1, fontSize: 14, color: '#9CA3AF', lineHeight: '20px' }}>Chọn dịch vụ gia tăng</span>
                    ) : (
                      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {vasSelected.map(item => (
                          <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', borderRadius: 6, padding: '4px 8px' }}>
                            <span style={{ fontSize: 13, color: C_TEXT_PRIMARY, lineHeight: '16px' }}>{item.label}</span>
                            <span
                              onClick={(e) => { e.stopPropagation(); item.toggle() }}
                              style={{ cursor: 'pointer', color: '#9CA3AF', fontSize: 14, lineHeight: '16px' }}
                            >×</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ flexShrink: 0, display: 'flex' }}><IcChevronRight /></div>
                  </div>
                </div>

                <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, fontSize: 14, lineHeight: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '2px 0' }}>
                    <span style={{ color: C_TEXT_PRIMARY }}>
                      Nội dung <span style={{ color: '#EF4444' }}>*</span>
                    </span>
                    <div style={{ background: '#F9FAFB', borderRadius: 6, border: `1px solid ${letterContent ? C_BORDER : '#FCA5A5'}`, padding: '6px 12px' }}>
                      <textarea
                        value={letterContent} onChange={(e) => setLetterContent(e.target.value)}
                        placeholder="Nhập nội dung thư, tài liệu (bắt buộc)"
                        required
                        style={{ width: '100%', minHeight: 60, border: 'none', outline: 'none', resize: 'vertical', fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', background: 'transparent', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  {[{ label: 'Ghi chú thu khác', link: 'Thêm ghi chú' }].map(({ label, link }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0' }}>
                      <span style={{ color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
                      <LinkText>{link}</LinkText>
                    </div>
                  ))}
                  <div style={{ position: 'relative' }} data-view-goods-menu>
                    <div
                      onClick={() => setViewGoodsPickerOpen(v => !v)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0', cursor: 'pointer' }}
                    >
                      <span style={{ color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>Ghi chú xem hàng</span>
                      <LinkText>{VIEW_GOODS_OPTIONS.find(o => o.value === viewGoodsPolicy)?.label}</LinkText>
                    </div>
                    {viewGoodsPickerOpen && (
                      <div style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 240,
                        background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 8,
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 20, overflow: 'hidden', padding: 4,
                      }}>
                        {VIEW_GOODS_OPTIONS.map(opt => {
                          const active = opt.value === viewGoodsPolicy
                          return (
                            <div
                              key={opt.value}
                              onClick={() => { setViewGoodsPolicy(opt.value); setViewGoodsPickerOpen(false) }}
                              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 6, cursor: 'pointer' }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{
                                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                border: `2px solid ${active ? '#111827' : C_BORDER}`,
                                background: active ? '#111827' : '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                              </div>
                              <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{opt.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  {[{ label: 'Nguồn tạo', link: 'Facebook' }].map(({ label, link }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0' }}>
                      <span style={{ color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
                      <LinkText>{link}</LinkText>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Dịch vụ card ── */}
            <div style={{ ...drawerCard, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
                <IcTruck />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Phí vận chuyển</span>
              </div>
              <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                {([
                  ['nhanh', 'Chuyển phát nhanh (Thư, tài liệu)'],
                  ['duongbo', 'Chuyển phát đường bộ'],
                ] as const).map(([key, label]) => (
                  <div
                    key={key}
                    onClick={() => setLetterService(key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${letterService === key ? '#111827' : C_BORDER}`,
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `2px solid ${letterService === key ? '#111827' : C_BORDER}`,
                      background: letterService === key ? '#111827' : '#fff',
                    }}>
                      {letterService === key && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 12, color: '#4B5563', lineHeight: '16px' }}>Dịch vụ</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{label} — 247Express</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#4B5563', lineHeight: '16px', flexShrink: 0 }}>Phí ship:</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {(letterService === key ? feeMain : (key === 'nhanh' ? letterMainFee(mainZoneIdx, weightGram) : roadFreightMainFee(roadZoneIdx, weightKg))).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                ))}
                {isDuongBo && (
                  <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, lineHeight: '16px' }}>
                    Thời gian giao dự kiến: {ROAD_TABLE.deliveryTimeDays[roadZoneIdx]} ngày
                  </span>
                )}

              </div>
            </div>

            {/* ── Phụ phí card — liệt kê từng DVGT đã chọn + thuế, tương tự bố cục "Phụ phí"
                tham khảo. Chỉ hiện dòng cho dịch vụ đang được chọn (24+ DVGT nên không liệt kê
                hết, tránh danh sách toàn 0đ). Nằm trong vùng cuộn chung với Thông tin thư/Phí
                vận chuyển ở trên — chỉ Action card đứng ngoài, cố định. ── */}
            <div style={drawerCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
                <IcReceipt />
                <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Phụ phí</span>
              </div>
              <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                {vasSelected.length === 0 ? (
                  <span style={{ fontSize: 14, color: '#9CA3AF', lineHeight: '20px' }}>Chưa chọn dịch vụ gia tăng nào</span>
                ) : vasSelected.map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{item.label}</span>
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{item.fee.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>Thuế VAT (8%)</span>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{feeVat.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            </div>

            {/* ── Action card ── */}
            <div style={{ ...drawerCard, flexShrink: 0, gap: 8, padding: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#F9FAFB', borderRadius: 6, padding: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>Tổng phí vận chuyển</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
                    {grandTotal.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  style={{ flex: 1, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}
                >
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

      {vasModalOpen && (
        <>
          <div onClick={() => setVasModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 600, maxHeight: '80vh', background: '#fff', borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 301, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '20px 48px 12px' }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: C_ACTION, lineHeight: '28px' }}>Dịch vụ gia tăng</span>
              <button onClick={() => setVasModalOpen(false)} style={{ position: 'absolute', right: 16, top: 16, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <IcX />
              </button>
            </div>
            <div style={{ padding: '0 16px 12px' }}>
              <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <IcSearch />
                <input
                  value={vasSearch} onChange={(e) => setVasSearch(e.target.value)}
                  placeholder="Tìm kiếm"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}
                />
              </div>
            </div>
            <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px' }}>
              {vasFiltered.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>Không tìm thấy dịch vụ phù hợp</div>
              ) : vasFiltered.map(item => (
                <VasCheckboxRow
                  key={item.key} checked={item.checked} onChange={item.toggle} label={item.label}
                  disabledReason={item.disabledReason} extra={item.extra}
                />
              ))}
            </div>
            <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 16, flexShrink: 0 }}>
              <button
                onClick={() => setVasModalOpen(false)}
                style={{ padding: '8px 20px', borderRadius: 6, border: `1px solid ${C_ACTION}`, background: '#fff', color: C_ACTION, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Huỷ
              </button>
              <button
                onClick={() => setVasModalOpen(false)}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: C_ACTION, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Chọn
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ── Data ─────────────────────────────────────────────────────
const myOrders = allOrders.filter((o) => o.shopId === 'SHP001')

// Derive fake product lists per order
const SAMPLE_PRODUCTS = [
  ['Giày Thể Thao Nam - SL: 2'],
  ['Áo Thun Cotton Nam - Oversize - Màu Ngẫu Nhiên - SL: 2', 'Bình Giữ Nhiệt Cao Cấp - SL: 1'],
  ['Áo Thun Trơn Cổ Tròn Thoáng Khí - SL: 10'],
  ['Quần Jean Nam Slim Fit - SL: 1', 'Áo Polo Cổ Bẻ - SL: 2'],
]
const orderProducts: Record<string, string[]> = {}
myOrders.forEach((o, i) => {
  orderProducts[o.id] = SAMPLE_PRODUCTS[i % SAMPLE_PRODUCTS.length]
})

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
      {flexCell('Khách hàng',      300)}
      {flexCell('Sản phẩm',        300)}
      {flexCell('Khối lượng (kg)', 120, 'right')}
      {flexCell('COD (đ)',         120, 'right')}
      {flexCell('Phí ship (đ)',    120, 'right')}
      {flexCell('GTB - TT (đ)',    120, 'right')}
      {flexCell('Người tạo',       200)}
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
type Order = typeof myOrders[0] & {
  log?: GHNLogEntry[]
  num_deliver?: number
  num_pick?: number
  num_return?: number
  actionHistory?: ActionHistoryItem[]
}

function isReturnEligible(order: Order): boolean {
  const lastAction = order.log?.[0]?.action
  return order.status === 'redelivery'
    || lastAction === 'DELIVERY_FAIL'
    || lastAction === 'WAITING_TO_RETURN'
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

  // Group: date → time → items
  const actionByDate = actionHistory.reduce<Record<string, Record<string, ActionHistoryItem[]>>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = {}
    if (!acc[item.date][item.time]) acc[item.date][item.time] = []
    acc[item.date][item.time].push(item)
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
    DELIVER_IN_TRIP:  '#D1FAE5',
    DELIVERY_FAIL:    '#FEE2E2',
    WAITING_TO_RETURN:'#FEF3C7',
    RETURN_IN_TRIP:   '#FEF3C7',
    RETURNED:         '#F3F4F6',
    CANCEL:           '#FEE2E2',
    READY_TO_PICK:    '#EFF6FF',
    PICK_IN_TRIP:     '#EFF6FF',
    HUB_IN:           '#F3F4F6',
    HUB_OUT:          '#F3F4F6',
    HUB_DELIVERY_IN:  '#F3F4F6',
  }

  const ACTION_TEXT_COLOR: Record<string, string> = {
    DELIVER_IN_TRIP:  '#065F46',
    DELIVERY_FAIL:    '#991B1B',
    WAITING_TO_RETURN:'#92400E',
    RETURN_IN_TRIP:   '#92400E',
    RETURNED:         '#374151',
    CANCEL:           '#991B1B',
    READY_TO_PICK:    '#1D4ED8',
    PICK_IN_TRIP:     '#1D4ED8',
    HUB_IN:           '#374151',
    HUB_OUT:          '#374151',
    HUB_DELIVERY_IN:  '#374151',
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
          background: '#F3F4F6', overflow: 'hidden',
          alignItems: 'flex-start',
        }}>

          {/* ════ LEFT COLUMN ════════════════════════════════ */}
          <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>

            {/* ── Bên gửi card ── */}
            <div style={card}>
              <CardHeader icon={<IcStore />} label="Bên gửi" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', fontWeight: 600 }}>
                    {order.senderName} - {order.senderPhone}
                  </div>
                  <div style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
                    268 Lý Thường Kiệt, Phường 14, Quận 10, Hồ Chí Minh
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

          {/* ════ RIGHT COLUMN (w-400px) ═════════════════════ */}
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
                {isReturnEligible(order) && (
                  <button
                    style={{ flex: 1, padding: '8px 12px', background: '#FFF4ED', border: `1px solid #FECBA1`, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C_ACTION, lineHeight: '20px' }}
                  >
                    Hoàn hàng
                  </button>
                )}
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
            {/* Table header */}
            <div style={{ display: 'flex', background: '#F3F4F6', padding: '6px 12px', borderRadius: 4, gap: 8, marginBottom: 2 }}>
              <span style={{ width: 90, fontSize: 13, fontWeight: 600, color: '#374151', flexShrink: 0 }}>Thời gian</span>
              <span style={{ width: 120, fontSize: 13, fontWeight: 600, color: '#374151', flexShrink: 0 }}>Người thao tác</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151' }}>Hành động</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151' }}>Nội dung cũ</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#374151' }}>Nội dung mới</span>
            </div>

            {actionDates.length === 0 && (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>Chưa có lịch sử thao tác</div>
            )}

            {actionDates.map(date => {
              const timeGroups = actionByDate[date]
              const sortedTimes = Object.keys(timeGroups).sort((a, b) => b.localeCompare(a))
              return (
                <div key={date}>
                  {/* Date header */}
                  <div style={{ padding: '6px 12px', fontSize: 13, fontWeight: 700, color: '#111827', background: '#FAFAFA', borderTop: `1px solid ${C_BORDER}`, borderBottom: `1px solid ${C_BORDER}`, marginTop: 4 }}>
                    {new Date(date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                  </div>

                  {sortedTimes.map((time, tIdx) => {
                    const items = timeGroups[time]
                    const isBatch = items.length > 1
                    const isLastGroup = tIdx === sortedTimes.length - 1
                    return (
                      <div key={time} style={{ display: 'flex', background: isBatch ? '#FAFAFA' : '#fff', borderBottom: isLastGroup ? 'none' : `1px solid ${C_BORDER}` }}>

                        {/* Time column — spans full height of group */}
                        <div style={{
                          width: 90, flexShrink: 0,
                          padding: '10px 12px',
                          display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                          borderRight: isBatch ? '2px solid #FF5200' : 'none',
                          alignSelf: 'stretch',
                        }}>
                          <span style={{ fontSize: 13, color: '#374151', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{time}</span>
                          {isBatch && (
                            <span style={{
                              fontSize: 11, fontWeight: 700, color: '#FF5200',
                              background: '#FFF4ED', border: '1px solid #FECBA1',
                              borderRadius: 10, padding: '1px 6px', whiteSpace: 'nowrap',
                            }}>
                              {items.length} TĐ
                            </span>
                          )}
                        </div>

                        {/* Rows stacked */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          {items.map((item: ActionHistoryItem, rowIdx: number) => (
                            <div key={rowIdx}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                                <span style={{ width: 120, fontSize: 13, color: '#374151', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.operator}</span>
                                <span style={{ flex: 1, fontSize: 13, color: '#374151' }}>{item.action}</span>
                                <span style={{ flex: 1, fontSize: 13, color: item.oldContent === '-' ? '#9CA3AF' : '#6B7280', fontStyle: item.oldContent === '-' ? 'italic' : 'normal' }}>{item.oldContent}</span>
                                <span style={{ flex: 1, fontSize: 13, color: item.newContent === '-' ? '#9CA3AF' : '#111827', fontWeight: item.newContent !== '-' ? 500 : 400, fontStyle: item.newContent === '-' ? 'italic' : 'normal' }}>{item.newContent}</span>
                              </div>
                              {rowIdx < items.length - 1 && (
                                <div style={{ height: 1, background: C_BORDER, marginLeft: 12 }} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

// ── Table row ─────────────────────────────────────────────────
function TRow({ order, checked, onToggle, onSelect, onReturn }: { order: Order; checked: boolean; onToggle: () => void; onSelect: () => void; onReturn?: () => void }) {
  const [hover, setHover] = useState(false)
  const products = orderProducts[order.id] || ['Sản phẩm - SL: 1']
  const weightKg = (order.weight / 1000).toFixed(1)
  const feeType = parseInt(order.id.replace('ORD', '')) % 2 === 0 ? 'Shop trả' : 'Khách trả'

  return (
    <div
      style={{
        display: 'flex', alignItems: 'stretch', cursor: 'pointer',
        background: hover ? '#FAFAFA' : '#fff',
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
        {/* Khách hàng */}
        <div style={{ flex: '1 0 0', minWidth: 300, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
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
          <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px' }}>
            {order.receiverAddress}
          </span>
        </div>
        {/* Sản phẩm */}
        <div style={{ flex: '1 0 0', minWidth: 300, padding: '6px 8px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
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
        <div style={{ flex: '1 0 0', minWidth: 200, padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.senderName}
          </span>
          <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Tạo lúc {order.createdAt}
          </span>
          {isReturnEligible(order) && (
            <button
              onClick={(e) => { e.stopPropagation(); onReturn?.() }}
              style={{ marginTop: 4, padding: '2px 8px', background: '#FFF4ED', border: `1px solid #FECBA1`, borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: C_ACTION, whiteSpace: 'nowrap', alignSelf: 'flex-start', lineHeight: '18px' }}
            >
              Hoàn hàng
            </button>
          )}
        </div>
    </div>
  )
}

// ── Pagination ─────────────────────────────────────────────────
function Pagination({ page, total, pageSize, onPageChange, onPageSizeChange }: {
  page: number; total: number; pageSize: number;
  onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void;
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
        onClick={() => onPageChange(p)}
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
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px',
          border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', flexShrink: 0, width: 82,
        }}
        onClick={() => onPageSizeChange(pageSize === 50 ? 100 : 50)}
      >
        <span style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY }}>{pageSize}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5l5 5 5-5" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <span style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY }}>mỗi trang</span>

      {/* Page numbers */}
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
export default function ShopOrders() {
  const [activeTab, setActiveTab]   = useState('draft')
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [page, setPage]             = useState(1)
  const [pageSize, setPageSize]     = useState(50)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [letterDrawerOpen, setLetterDrawerOpen] = useState(false)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!createMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-create-order-menu]')) setCreateMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [createMenuOpen])

  const ordersByTab: Record<string, typeof myOrders> = {
    draft:         myOrders.filter((o) => o.status === 'pending'),
    pickup:        myOrders.filter((o) => o.status === 'pickup'),
    in_transit:    myOrders.filter((o) => o.status === 'in_transit'),
    returning:     myOrders.filter((o) => o.status === 'returning'),
    redelivery:    myOrders.filter((o) => o.status === 'redelivery'),
    completed:     myOrders.filter((o) => o.status === 'delivered'),
    cancelled:     myOrders.filter((o) => o.status === 'cancelled' || o.status === 'failed'),
    lost_damaged:  myOrders.filter((o) => o.status === 'lost' || o.status === 'damaged'),
  }
  const tabOrders = ordersByTab[activeTab] ?? []

  const filtered = tabOrders.filter((o) =>
    o.trackingCode.toLowerCase().includes(search.toLowerCase()) ||
    o.receiverName.toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allChecked = paginated.length > 0 && paginated.every((o) => selected.has(o.id))

  const toggleAll = () => {
    const next = new Set(selected)
    if (allChecked) paginated.forEach((o) => next.delete(o.id))
    else            paginated.forEach((o) => next.add(o.id))
    setSelected(next)
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const TABS = [
    { key: 'draft',        label: 'Đơn nháp',                        count: ordersByTab.draft.length,        countColor: '#F59E0B' },
    { key: 'pickup',       label: 'Chờ bàn giao',                    count: ordersByTab.pickup.length,       countColor: '#3B82F6' },
    { key: 'in_transit',   label: 'Đã bàn giao - Đang giao',         count: ordersByTab.in_transit.length,   countColor: '#3B82F6' },
    { key: 'returning',    label: 'Đã bàn giao - Đang hoàn hàng',    count: ordersByTab.returning.length,    countColor: '#F59E0B' },
    { key: 'redelivery',   label: 'Chờ xác nhận giao lại',           count: ordersByTab.redelivery.length,   countColor: '#F59E0B' },
    { key: 'completed',    label: 'Hoàn tất',                        count: ordersByTab.completed.length,    countColor: '#10B981' },
    { key: 'cancelled',    label: 'Đơn huỷ',                         count: ordersByTab.cancelled.length,    countColor: '#EF4444' },
    { key: 'lost_damaged', label: 'Hàng thất lạc - hư hỏng',        count: ordersByTab.lost_damaged.length, countColor: '#EF4444' },
  ]

  return (
    <ConfigProvider theme={shopTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff', overflow: 'hidden' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
              Đơn hàng
            </h1>
            <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
              Tạo, chỉnh sửa và quản lý đơn hàng
            </p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
              background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <IcSettings />
            <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap' }}>Cài đặt đơn hàng</span>
          </button>
          <div style={{ position: 'relative', flexShrink: 0 }} data-create-order-menu>
            <button
              onClick={() => setCreateMenuOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
                background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer',
              }}
            >
              <PlusOutlined style={{ color: '#fff', fontSize: 16 }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Tạo đơn hàng</span>
              <IcChevronDown size={16} />
            </button>
            {createMenuOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 220,
                background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 20, overflow: 'hidden',
              }}>
                {[
                  { label: 'Tạo đơn hàng', onClick: () => setDrawerOpen(true) },
                  { label: 'Tạo thư, tài liệu', onClick: () => setLetterDrawerOpen(true) },
                ].map(item => (
                  <div
                    key={item.label}
                    onClick={() => { item.onClick(); setCreateMenuOpen(false) }}
                    style={{ padding: '8px 12px', fontSize: 14, color: C_TEXT_PRIMARY, cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 16px', borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map((tab) => {
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
                <span style={{ fontSize: 14, fontWeight: 600, color: active ? '#fff' : C_TEXT_PRIMARY }}>
                  {tab.label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: active ? tab.countColor : '#3B82F6' }}>
                  {tab.count}
                </span>
              </div>
            )
          })}
        </div>

        {/* Search */}
        <div style={{ padding: '8px 16px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
            background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
          }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm kiếm"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: '1 0 0', overflow: 'hidden', padding: '0 16px' }}>
          <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
          <div style={{ minWidth: 1470 }}>
            <THead allChecked={allChecked} onToggleAll={toggleAll} />
            <div style={{ height: 1, background: C_BORDER }} />
            {paginated.map((order) => (
              <TRow
                key={order.id}
                order={order as Order}
                checked={selected.has(order.id)}
                onToggle={() => toggleOne(order.id)}
                onSelect={() => { setSelectedOrder(order as Order); setDetailOpen(true) }}
                onReturn={() => { setSelectedOrder(order as Order); setDetailOpen(true) }}
              />
            ))}
            {paginated.length === 0 && (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                Không có đơn hàng
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Pagination */}
        <div style={{ borderTop: `1px solid ${C_BORDER}` }}>
          <Pagination
            page={page}
            total={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        </div>
      </div>

      {/* Create Order Drawer */}
      <CreateOrderDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <CreateLetterDrawer open={letterDrawerOpen} onClose={() => setLetterDrawerOpen(false)} />
      <OrderSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {/* Order Detail Drawer */}
      <OrderDetailDrawer order={selectedOrder} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </ConfigProvider>
  )
}
