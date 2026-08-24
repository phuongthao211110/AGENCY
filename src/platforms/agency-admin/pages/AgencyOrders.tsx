import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import {
  PlusOutlined, SearchOutlined, InfoCircleOutlined, DownloadOutlined, CloseOutlined, TruckOutlined, StopOutlined,
  MailOutlined, InboxOutlined, FileOutlined, SyncOutlined, ClockCircleOutlined, RollbackOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { agencyAdminTheme } from '../../../theme/platforms'
import { loadOrders, addOrder, dispatchOrderToCarrier, updateOrder, cancelOrder, type Order } from '../../../mock-data/orderStore'
import allShops from '../../../mock-data/shops.json'
import allServices from '../../../mock-data/services.json'
import allPricing from '../../../mock-data/pricing.json'
import { agenciesList, clientHubs247 } from '../../super-admin/agencyStore'

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

// ── Xuất đơn hàng (giống hệt pattern đã có ở Shops.tsx) ───────
// Khác với bản ở Shops.tsx (đọc orders.json tĩnh), bản này đọc từ orderStore.ts
// (kho dữ liệu live) để không bỏ sót đơn tạo mới trong phiên.
const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Đơn nháp',
  pickup: 'Chờ bàn giao',
  in_transit: 'Đang giao',
  returning: 'Đang hoàn hàng',
  redelivery: 'Chờ xác nhận giao lại',
  delivered: 'Hoàn tất',
  // 'failed' = giao hàng không thành công → hoàn hàng thành công — theo mapping GHN thật
  // (AGA-RECON-4) đây là 1 nhánh KẾT THÚC/hoàn tất (giống "Giao hàng thành công"), không phải
  // huỷ đơn — nên nhãn và nhóm tab khác với 'cancelled'.
  failed: 'Đã hoàn hàng',
  cancelled: 'Đơn huỷ',
  lost: 'Thất lạc',
  damaged: 'Hư hỏng',
}

const STATUS_GROUPS: { key: string; label: string; match: string[] }[] = [
  { key: 'pending',      label: 'Đơn nháp',              match: ['pending'] },
  { key: 'pickup',       label: 'Chờ bàn giao',          match: ['pickup'] },
  { key: 'in_transit',   label: 'Đang giao',             match: ['in_transit'] },
  { key: 'returning',    label: 'Đang hoàn hàng',        match: ['returning'] },
  { key: 'redelivery',   label: 'Chờ xác nhận giao lại', match: ['redelivery'] },
  { key: 'delivered',    label: 'Hoàn tất',              match: ['delivered', 'failed'] },
  { key: 'cancelled',    label: 'Đơn huỷ',               match: ['cancelled'] },
  { key: 'lost_damaged', label: 'Thất lạc - hư hỏng',    match: ['lost', 'damaged'] },
]

// Đơn Thư đại lý gửi hộ qua 247Express, khi hoàn hàng thì hàng vật lý về đại lý trước — đại lý
// phải giao lại cho shop (khác đơn GHN Hàng hoá, shop tự gửi nên hoàn hàng về thẳng shop luôn).
// Dùng để hiện badge + action "Xác nhận đã giao hoàn cho shop" ở bảng và chi tiết đơn.
function isLetterReturnCase(o: Order): boolean {
  return o.sendKind === 'letter' && o.dispatchStatus === 'dispatched'
    && (o.status === 'returning' || o.status === 'cancelled' || o.status === 'failed')
}

// Chỉ cho huỷ đơn ở 2 tab "Đơn nháp" và "Chờ xử lý" — cả 2 đều là status 'pending' (Hàng hoá
// nháp chưa dispatch, hoặc Thư đang chờ đại lý chọn hub) — đơn đã dispatch/đang giao/đã xong
// không cho huỷ theo cách này nữa.
function isCancellable(o: Order): boolean {
  return o.status === 'pending'
}

// Trạng thái hiển thị ngay dưới mã đơn trong bảng — mỗi dòng tự hiện trạng thái, không chỉ
// dựa vào tab đang xem. Nhãn "Chờ lấy hàng" theo đúng cách gọi thật của GHN cho status 'pickup'
// (khác "Chờ bàn giao" ở tên tab — cùng 1 status, chỉ khác góc nhìn diễn đạt).
const ROW_STATUS_STYLE: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Đơn nháp',              color: '#6B7280' },
  pickup:     { label: 'Chờ lấy hàng',          color: '#10B981' },
  in_transit: { label: 'Đang giao',             color: '#3B82F6' },
  returning:  { label: 'Đang hoàn hàng',        color: '#F59E0B' },
  redelivery: { label: 'Chờ xác nhận giao lại', color: '#F59E0B' },
  delivered:  { label: 'Giao thành công',       color: '#10B981' },
  cancelled:  { label: 'Đã huỷ',                color: '#EF4444' },
  failed:     { label: 'Đã hoàn hàng',          color: '#10B981' },
  lost:       { label: 'Thất lạc',              color: '#EF4444' },
  damaged:    { label: 'Hư hỏng',               color: '#EF4444' },
}

function rowStatus(order: Order): { label: string; color: string } {
  if (order.sendKind === 'letter' && order.dispatchStatus === 'pending_agency') {
    return { label: 'Chờ xử lý', color: '#F59E0B' }
  }
  return ROW_STATUS_STYLE[order.status] ?? { label: order.status, color: '#6B7280' }
}

const EXPORT_CARRIER_LABEL: Record<string, string> = { GHN: 'Giao hàng nhanh', '247EXPRESS': '247Express' }

const EXPORT_HEADERS = [
  'Mã shop', 'Ngày tạo', 'Mã đơn CDN', 'Loại đơn', 'Mã đơn vận chuyển',
  'Trạng thái', 'Đơn vị vận chuyển', 'Khách hàng', 'Số điện thoại', 'Địa chỉ giao hàng',
  'Sản phẩm', 'Khối lượng (kg)', 'Tiền thu hộ COD (đ)', 'Phí ship (giá bán shop, đ)', 'Trả ship',
]

// Sản phẩm mẫu — demo, không phải sản phẩm thật của đơn (cùng hạn chế đã ghi nhận ở Shops.tsx)
const EXPORT_SAMPLE_PRODUCTS = [
  'Giày Thể Thao Nam - SL: 2',
  'Áo Thun Cotton Nam - Oversize - SL: 2, Bình Giữ Nhiệt Cao Cấp - SL: 1',
  'Áo Thun Trơn Cổ Tròn Thoáng Khí - SL: 10',
  'Quần Jean Nam Slim Fit - SL: 1, Áo Polo Cổ Bẻ - SL: 2',
]
function sampleProductFor(orderId: string) {
  let hash = 0
  for (let i = 0; i < orderId.length; i++) hash = (hash * 31 + orderId.charCodeAt(i)) >>> 0
  return EXPORT_SAMPLE_PRODUCTS[hash % EXPORT_SAMPLE_PRODUCTS.length]
}

function buildExportRows(orders: Order[]) {
  return orders.map((o) => {
    const feeType = o.feePayer === 'receiver' ? 'Khách trả' : 'Shop trả'
    const [dd, mm, yyyy] = [o.createdAt.slice(8, 10), o.createdAt.slice(5, 7), o.createdAt.slice(0, 4)]
    return [
      o.shopId,
      `${dd}/${mm}/${yyyy}`,
      o.id,
      o.sendKind === 'letter' ? 'Thư' : 'Hàng hoá',
      o.trackingCode,
      ORDER_STATUS_LABELS[o.status] ?? o.status,
      o.carrierCode ? (EXPORT_CARRIER_LABEL[o.carrierCode] ?? o.carrierCode) : '—',
      o.receiverName,
      o.receiverPhone,
      o.receiverAddress,
      sampleProductFor(o.id),
      +(o.weight / 1000).toFixed(2),
      o.cod,
      o.fee,
      feeType,
    ]
  })
}

const DATE_PRESETS: { key: string; label: string }[] = [
  { key: 'custom',     label: 'Tùy chỉnh' },
  { key: 'this_week',  label: 'Tuần này' },
  { key: 'last_week',  label: 'Tuần trước' },
  { key: 'this_month', label: 'Tháng này' },
  { key: 'last_month', label: 'Tháng trước' },
  { key: '30d',        label: '30 ngày trước' },
  { key: '90d',        label: '90 ngày trước' },
]

function fmtDateInput(d: Date) {
  return d.toISOString().slice(0, 10)
}

function computePresetRange(preset: string, today: Date): [string, string] | null {
  const base = new Date(today)
  base.setHours(0, 0, 0, 0)
  if (preset === 'custom') return null
  if (preset === 'this_week' || preset === 'last_week') {
    const day = base.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(base)
    monday.setDate(base.getDate() + diffToMonday + (preset === 'last_week' ? -7 : 0))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return [fmtDateInput(monday), fmtDateInput(sunday)]
  }
  if (preset === 'this_month' || preset === 'last_month') {
    const monthOffset = preset === 'last_month' ? -1 : 0
    const first = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1)
    const last = new Date(base.getFullYear(), base.getMonth() + monthOffset + 1, 0)
    return [fmtDateInput(first), fmtDateInput(last)]
  }
  if (preset === '30d') {
    const from = new Date(base)
    from.setDate(base.getDate() - 29)
    return [fmtDateInput(from), fmtDateInput(base)]
  }
  if (preset === '90d') {
    const from = new Date(base)
    from.setDate(base.getDate() - 89)
    return [fmtDateInput(from), fmtDateInput(base)]
  }
  return null
}

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
      border: `1.5px solid ${checked ? C_ACTION : C_BORDER}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {checked && <div style={{ width: 10, height: 10, borderRadius: '50%', background: C_ACTION }} />}
    </div>
  )
}

function downloadXlsx(filename: string, headers: string[], rows: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(12, h.length + 2) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Xuất đơn hàng')
  XLSX.writeFile(wb, filename)
}

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
loadOrders().filter(o => agencyShopIds.has(o.shopId)).forEach((o, i) => {
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
                      appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
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

// ── Fee helpers cho đơn Thư (247Express) — trùng cơ chế đã dùng ở CreateLetterDrawer
// bên Web Shop (Orders.tsx), copy lại vì 2 file không share function ──────────────
const LETTER_PROVINCES = [
  'Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Bình Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu', 'Quảng Ninh', 'Nghệ An',
]

const LETTER_PROVINCE_REGION: Record<string, 'bac' | 'trung' | 'nam'> = {
  'Hà Nội': 'bac', 'Hải Phòng': 'bac', 'Quảng Ninh': 'bac',
  'Đà Nẵng': 'trung', 'Nghệ An': 'trung',
  'TP.HCM': 'nam', 'Bình Dương': 'nam', 'Đồng Nai': 'nam', 'Bà Rịa - Vũng Tàu': 'nam', 'Cần Thơ': 'nam',
}

function letterParseProvince(address: string): string {
  const parts = address.split(',')
  return parts[parts.length - 1].trim()
}

function letterResolveZoneIndex(priceTable: any, fromProvince: string, toProvince: string): number {
  const zones: any[] = priceTable.zones ?? []
  const isRouteBased = zones.length > 0 && 'from' in zones[0]
  if (isRouteBased) {
    let idx = zones.findIndex((z: any) => z.from === fromProvince && z.to === toProvince)
    if (idx === -1) idx = zones.findIndex((z: any) => z.from === fromProvince && z.to === 'Khác')
    return idx === -1 ? 0 : idx
  }
  if (fromProvince === toProvince) return 0
  return LETTER_PROVINCE_REGION[fromProvince] === LETTER_PROVINCE_REGION[toProvince] ? 1 : 2
}

function letterFeeFromPriceTable(service: any, weightGram: number, fromProvince: string, toProvince: string): number {
  const priceTable = service.priceTableId ? (allPricing as any[]).find(p => p.id === service.priceTableId) : null
  if (!priceTable) return 0
  const weights: { max: number }[] = priceTable.weights ?? []
  const weightIndex = weights.findIndex(w => weightGram <= w.max)
  const row = priceTable.prices?.[weightIndex === -1 ? weights.length - 1 : weightIndex]
  const zoneIndex = letterResolveZoneIndex(priceTable, fromProvince, toProvince)
  return row?.[zoneIndex] ?? row?.[0] ?? 0
}

function IcReceipt() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/></svg>
}

function LetterFieldInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
      />
    </div>
  )
}

function LetterFieldSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
      <select
        value={value} onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', border: 'none', outline: 'none', background: 'transparent', appearance: 'none', cursor: 'pointer' }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <div style={{ pointerEvents: 'none' }}><IcChevronDown size={20} /></div>
    </div>
  )
}

function LetterLinkText({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 14, color: C_LINK, lineHeight: '20px', cursor: 'pointer', textAlign: 'right', whiteSpace: 'nowrap', flexShrink: 0 }}>{children}</span>
}

// ── CreateLetterDrawer (Agency — tạo đơn thư thay shop) ───────
function CreateLetterDrawerAgency({ open, onClose }: { open: boolean; onClose: () => void }) {
  // Đơn Thư do đại lý tạo hộ đi qua 247Express từ 1 bưu cục (hub) của đại lý, KHÔNG phải từ
  // địa chỉ nhà riêng của shop — "Bên gửi" phải là bưu cục thật đại lý sẽ giao hàng đi, không
  // phải thông tin shop (khác hẳn CreateLetterDrawer bên Web Shop, nơi shop tự gửi từ chính mình).
  const agency = agenciesList.find(a => a.id === CURRENT_AGENCY_ID)
  const agencyHubs = (agency?.clientHubIds ?? []).map(id => clientHubs247.find(h => h.id === id)).filter((h): h is NonNullable<typeof h> => !!h)

  const [selectedShopId, setSelectedShopId] = useState(agencyShops[0]?.id ?? '')
  const [selectedHubId, setSelectedHubId] = useState(agencyHubs[0]?.id ?? '')
  const [rcvName, setRcvName]     = useState('Nguyễn Văn An')
  const [rcvPhone, setRcvPhone]   = useState('0909888999')
  const [rcvStreet, setRcvStreet] = useState('123 Thành Thái')
  const [rcvProvince, setRcvProvince] = useState(() => letterParseProvince(agencyShops[0]?.address ?? 'Hà Nội'))
  const [weight, setWeight]       = useState(0.2)
  const [goodsValue, setGoodsValue] = useState(0)
  const [shopCode, setShopCode]   = useState('')
  const [letterContent, setLetterContent] = useState('')

  const selectedShop = agencyShops.find(s => s.id === selectedShopId) ?? agencyShops[0]
  const selectedHub = agencyHubs.find(h => h.id === selectedHubId) ?? agencyHubs[0]
  const weightGram = weight * 1000
  // fromProvince tính theo bưu cục (nơi hàng thật sự xuất phát đi 247Express), không phải tỉnh
  // của shop — ảnh hưởng trực tiếp tới zone/giá cước tính bên dưới.
  const fromProvince = letterParseProvince(selectedHub?.provinceName ?? 'Hà Nội')

  const now = new Date()
  const createdAt = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')} - ${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`

  const available247Services = (allServices as any[]).filter(
    s => s.carrier === '247Express' && s.enabled && s.agencyId === CURRENT_AGENCY_ID
  )
  const selectedService247 = available247Services.length > 0
    ? available247Services.reduce((min, s) =>
        letterFeeFromPriceTable(s, weightGram, fromProvince, rcvProvince) <
        letterFeeFromPriceTable(min, weightGram, fromProvince, rcvProvince) ? s : min
      )
    : undefined
  const feeShipping = selectedService247 ? letterFeeFromPriceTable(selectedService247, weightGram, fromProvince, rcvProvince) : 0
  const totalShipping = feeShipping

  function handleCreate() {
    if (!selectedShop || !selectedHub) return
    const now = new Date()
    addOrder({
      id: `ORD_${now.getTime()}`,
      shopId: selectedShop.id,
      trackingCode: `SHOP_${now.getTime()}`,
      senderName: selectedHub.contactName,
      senderPhone: selectedHub.contactPhone,
      senderAddress: selectedHub.location,
      receiverName: rcvName,
      receiverPhone: rcvPhone,
      receiverAddress: `${rcvStreet}, ${rcvProvince}`,
      weight: weightGram,
      cod: 0,
      fee: totalShipping,
      // Đơn Thư không có toggle "ai trả ship" — luôn Shop trả, giống CreateLetterDrawer bên Web Shop.
      feePayer: 'sender',
      status: 'pending',
      createdAt: now.toISOString().split('T')[0],
      actionHistory: [],
      sendKind: 'letter',
      dispatchStatus: 'pending_agency',
      carrierCode: null,
      dispatchedAt: null,
      dispatchedBy: null,
    })
    onClose()
  }

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
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Gửi thư, tài liệu</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <IcX />
          </button>
        </div>
        <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

        <div style={{ flex: 1, display: 'flex', gap: 6, padding: 6, background: '#F3F4F6', overflow: 'hidden', alignItems: 'flex-start' }}>

          {/* ═══ LEFT COLUMN ═══ */}
          <div style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>

            {/* ── Chọn shop card ── */}
            <div style={card}>
              <CardHeader icon={<IcStore />} label="Shop tạo đơn" />
              <div style={{ padding: 8 }}>
                <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={selectedShopId}
                    onChange={e => {
                      setSelectedShopId(e.target.value)
                      const newShop = agencyShops.find(s => s.id === e.target.value)
                      setRcvProvince(letterParseProvince((newShop as any)?.address ?? 'Hà Nội'))
                    }}
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', cursor: 'pointer', lineHeight: '20px', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    {agencyShops.map(s => (
                      <option key={s.id} value={s.id}>{s.name} — {(s as any).ownerName}</option>
                    ))}
                  </select>
                  <IcChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* ── Bên gửi card — chọn bưu cục, KHÔNG phải địa chỉ shop (xem ghi chú ở đầu component) ── */}
            <div style={card}>
              <CardHeader icon={<IcStore />} label="Bên gửi" />
              <div style={{ padding: 8 }}>
                {agencyHubs.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#9CA3AF', padding: '6px 4px' }}>
                    Đại lý chưa được cấp bưu cục 247Express nào — liên hệ Super Admin.
                  </div>
                ) : (
                  <>
                    <div style={{ background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <select
                        value={selectedHubId}
                        onChange={e => setSelectedHubId(e.target.value)}
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', cursor: 'pointer', lineHeight: '20px', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' }}
                      >
                        {agencyHubs.map(h => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                      <IcChevronDown size={18} />
                    </div>
                    {selectedHub && (
                      <div style={{ padding: '6px 12px', fontSize: 13, color: C_TEXT_SECONDARY, lineHeight: '18px' }}>
                        {selectedHub.contactName} - {selectedHub.contactPhone}<br />
                        {selectedHub.location}
                      </div>
                    )}
                  </>
                )}
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
                  <div style={{ flex: 1, minWidth: 200, background: '#F9FAFB', borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
                    <input
                      value={rcvPhone} onChange={(e) => setRcvPhone(e.target.value)}
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
                    />
                  </div>
                </div>
                <LetterFieldInput value={rcvStreet} onChange={setRcvStreet} placeholder="Số nhà, tên đường" />
                <LetterFieldSelect value={rcvProvince} onChange={setRcvProvince} options={LETTER_PROVINCES} />
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
                      <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', display: 'block', textAlign: 'right' }}>SL: 1</span>
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
                        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Thư, tài liệu</span>
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
                      <span>{weight.toFixed(2)}kg</span>
                      <span>10x10x10cm</span>
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
              </div>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div style={{ width: 400, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>

              {/* ── Thông tin thư ── */}
              <div style={{ ...card, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, flexShrink: 0 }}>
                  <IcClipboard />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Thông tin thư, tài liệu</span>
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
                    <InfoRow label="Giá trị hàng">
                      <NumericWithUnit value={goodsValue} onChange={setGoodsValue} unit="đ" />
                    </InfoRow>
                  </div>
                  <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8, fontSize: 14, lineHeight: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '2px 0' }}>
                      <span style={{ color: C_TEXT_PRIMARY }}>Nội dung thư, tài liệu</span>
                      <div style={{ background: '#F9FAFB', borderRadius: 6, border: `1px solid ${C_BORDER}`, padding: '6px 12px' }}>
                        <textarea
                          value={letterContent} onChange={(e) => setLetterContent(e.target.value)}
                          placeholder="Nội dung thư, tài liệu"
                          style={{ width: '100%', minHeight: 60, border: 'none', outline: 'none', resize: 'vertical', fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', background: 'transparent', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0' }}>
                      <span style={{ color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>Ghi chú thu khác</span>
                      <LetterLinkText>Thêm ghi chú</LetterLinkText>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0' }}>
                      <span style={{ color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>Nguồn tạo</span>
                      <LetterLinkText>Facebook</LetterLinkText>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Dịch vụ card ── */}
              <div style={{ ...card, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
                  <IcTruck />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Dịch vụ</span>
                </div>
                <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                  {selectedService247 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#FAFAFA' }}>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{selectedService247.name}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: '#4B5563', lineHeight: '16px' }}>Phí ship</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{feeShipping.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 14, color: '#9CA3AF', lineHeight: '20px', padding: '4px 0' }}>
                      Không có dịch vụ khả dụng
                    </span>
                  )}
                </div>
              </div>

              {/* ── Phụ phí card ── */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
                  <IcReceipt />
                  <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Phụ phí</span>
                </div>
                <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                  <span style={{ fontSize: 14, color: '#9CA3AF', lineHeight: '20px' }}>Không có phụ phí</span>
                </div>
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
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  style={{ flex: 1, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}
                >
                  Lưu nháp
                </button>
                <button
                  onClick={handleCreate}
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
      {fixedCell('Mã đơn hàng', 160)}
      {flexCell('Shop',            220)}
      {flexCell('Khách hàng',      260)}
      {flexCell('Sản phẩm',        220)}
      {flexCell('Khối lượng (kg)', 120, 'right')}
      {flexCell('COD (đ)',         120, 'right')}
      {/* Phí ship — LUÔN là giá bán cho shop, không phải giá vốn NVC thật (chưa có trong hệ thống) */}
      <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px', background: C_BG_HEADER, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
        <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, textAlign: 'right', lineHeight: '20px' }}>Phí ship (đ)</span>
        <InfoCircleOutlined
          style={{ fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'help', flexShrink: 0 }}
          title="Đây là giá bán cho shop (đã gồm chênh lệch đại lý) — không phải giá vốn thực tế NVC tính cho đại lý. Giá vốn chỉ có sau khi đối soát với NVC."
        />
      </div>
      {flexCell('GTB - TT (đ)',    120, 'right')}
      {flexCell('Người tạo',       180)}
      {fixedCell('Thao tác', 160)}
    </div>
  )
}

// ── Local type aliases (Order is imported from orderStore) ────
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

// ── OrderDetailDrawer ─────────────────────────────────────────
type OrderDraft = {
  receiverName: string; receiverPhone: string; receiverAddress: string
  weightKg: string; cod: string; fee: string
  status: string; carrierCode: string
}

function draftFromOrder(order: Order): OrderDraft {
  return {
    receiverName: order.receiverName,
    receiverPhone: order.receiverPhone,
    receiverAddress: order.receiverAddress,
    weightKg: (order.weight / 1000).toString(),
    cod: order.cod.toString(),
    fee: order.fee.toString(),
    status: order.status,
    carrierCode: order.carrierCode ?? '',
  }
}

const EDIT_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'pending',    label: 'Đơn nháp' },
  { value: 'pickup',     label: 'Chờ bàn giao' },
  { value: 'in_transit', label: 'Đang giao' },
  { value: 'returning',  label: 'Đang hoàn hàng' },
  { value: 'redelivery', label: 'Chờ xác nhận giao lại' },
  { value: 'delivered',  label: 'Hoàn tất' },
  { value: 'cancelled',  label: 'Đơn huỷ' },
  { value: 'lost',       label: 'Thất lạc' },
  { value: 'damaged',    label: 'Hư hỏng' },
]

const EDIT_CARRIER_OPTIONS: { value: string; label: string }[] = [
  { value: '',           label: 'Chưa gửi NVC' },
  { value: 'GHN',        label: 'Giao hàng nhanh' },
  { value: '247EXPRESS', label: '247Express' },
]

function EditableInput({ value, onChange, textAlign, suffix }: {
  value: string; onChange: (v: string) => void; textAlign?: 'left' | 'right'; suffix?: string
}) {
  return (
    <div style={{ flex: 1, background: '#fff', border: `1px solid ${C_LINK}`, borderRadius: 6, display: 'flex', alignItems: 'center', height: 32, paddingLeft: 8 }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px',
          textAlign: textAlign ?? 'left', background: 'transparent', padding: 0, minWidth: 0,
        }}
      />
      {suffix && <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, paddingRight: 8, flexShrink: 0 }}>{suffix}</span>}
    </div>
  )
}

function EditableSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        flex: 1, height: 32, borderRadius: 6, border: `1px solid ${C_LINK}`, background: '#fff',
        fontSize: 14, color: C_TEXT_PRIMARY, padding: '0 8px', cursor: 'pointer',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function OrderDetailDrawer({ order, open, onClose, onDispatch247, onUpdated }: { order: Order | null; open: boolean; onClose: () => void; onDispatch247?: () => void; onUpdated?: () => void }) {
  const [activeTab, setActiveTab] = useState<'info' | 'status' | 'action'>('info')
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState<OrderDraft | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  useEffect(() => { if (order) { setActiveTab('info'); setEditMode(false); setDraft(null); setConfirmingCancel(false) } }, [order?.id])

  function startEdit() {
    if (!order) return
    setDraft(draftFromOrder(order))
    setEditMode(true)
  }

  function cancelEdit() {
    setEditMode(false)
    setDraft(null)
  }

  function saveEdit() {
    if (!order || !draft) return
    updateOrder(order.id, {
      receiverName: draft.receiverName,
      receiverPhone: draft.receiverPhone,
      receiverAddress: draft.receiverAddress,
      weight: Math.round((Number(draft.weightKg) || 0) * 1000),
      cod: Number(draft.cod) || 0,
      fee: Number(draft.fee) || 0,
      status: draft.status,
      carrierCode: draft.carrierCode ? (draft.carrierCode as 'GHN' | '247EXPRESS') : null,
    })
    setEditMode(false)
    setDraft(null)
    onUpdated?.()
  }

  function confirmReturnHandover() {
    if (!order) return
    updateOrder(order.id, { returnHandoverAt: new Date().toISOString() })
    onUpdated?.()
  }

  function confirmCancelOrder() {
    if (!order) return
    cancelOrder(order.id)
    setConfirmingCancel(false)
    onUpdated?.()
    onClose()
  }

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
                {editMode && draft ? (
                  <>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <EditableInput value={draft.receiverName} onChange={v => setDraft({ ...draft, receiverName: v })} />
                      <EditableInput value={draft.receiverPhone} onChange={v => setDraft({ ...draft, receiverPhone: v })} />
                    </div>
                    <EditableInput value={draft.receiverAddress} onChange={v => setDraft({ ...draft, receiverAddress: v })} />
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
                        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{order.sendKind === 'letter' ? 'Thư, tài liệu' : 'Sản phẩm'}</span>
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
                      {order.sendKind !== 'letter' && <span>10x10x10cm</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

              {/* Weight & dimensions (read-only) — Kích thước/quy đổi chỉ áp dụng cho Hàng hoá,
                  đơn Thư chỉ cần Khối lượng (khớp CreateLetterDrawer bên Web Shop) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', width: 72, flexShrink: 0 }}>Khối lượng</span>
                  {editMode && draft ? (
                    <EditableInput value={draft.weightKg} onChange={v => setDraft({ ...draft, weightKg: v })} textAlign="right" suffix="kg" />
                  ) : (
                    <div style={{ flex: 1, minWidth: 0, background: '#F9FAFB', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 8, height: 32 }}>
                      <span style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', textAlign: 'right', paddingRight: 8 }}>{(order.weight / 1000).toFixed(1)}</span>
                      <div style={{ background: '#F3F4F6', width: 32, height: 32, borderRadius: '0 6px 6px 0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>kg</span>
                      </div>
                    </div>
                  )}
                </div>
                {order.sendKind !== 'letter' && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ════ RIGHT COLUMN (w-400px) ════════════════════════ */}
          <div style={{ width: 400, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>

            {/* ── Thông tin đơn hàng card ── */}
            <div style={{ ...card, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8, flexShrink: 0 }}>
                <IcClipboard />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{order.sendKind === 'letter' ? 'Thông tin thư, tài liệu' : 'Thông tin đơn hàng'}</span>
                <span style={{ fontSize: 14, color: '#4B5563', lineHeight: '20px', whiteSpace: 'nowrap' }}>Tạo lúc {order.createdAt}</span>
              </div>
              <div style={{ height: 1, background: C_BORDER, flexShrink: 0 }} />

              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 8 }}>
                  <InfoRow label="Mã đơn shop">
                    <span style={{ fontSize: 14, color: '#9CA3AF' }}>—</span>
                  </InfoRow>
                  <InfoRow label="COD">
                    {editMode && draft ? (
                      <EditableInput value={draft.cod} onChange={v => setDraft({ ...draft, cod: v })} textAlign="right" suffix="đ" />
                    ) : (
                      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', fontWeight: 600 }}>{order.cod.toLocaleString('vi-VN')} đ</span>
                    )}
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
                    {editMode && draft ? (
                      <EditableSelect value={draft.status} onChange={v => setDraft({ ...draft, status: v })} options={EDIT_STATUS_OPTIONS} />
                    ) : (
                      <span style={{ fontSize: 14, color: C_LINK, lineHeight: '20px', fontWeight: 700 }}>{log[0]?.status_name || order.status}</span>
                    )}
                  </InfoRow>
                  <InfoRow label="Đơn vị vận chuyển">
                    {editMode && draft ? (
                      <EditableSelect value={draft.carrierCode} onChange={v => setDraft({ ...draft, carrierCode: v })} options={EDIT_CARRIER_OPTIONS} />
                    ) : (
                      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
                        {order.carrierCode === 'GHN' ? 'Giao hàng nhanh' : order.carrierCode === '247EXPRESS' ? '247Express' : 'Chưa gửi NVC'}
                      </span>
                    )}
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
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{order.sendKind === 'letter' ? 'Dịch vụ' : 'Phí vận chuyển'}</span>
                {/* 2 dòng tách biệt: lựa chọn THẬT của shop (dùng để đối soát Shop↔Đại lý) vs
                    giá trị luôn cố định khi ghi nhận với GHN (Đại lý↔GHN — GHN chỉ biết thu cước
                    từ bên gửi, không có khái niệm thu từ người nhận). Chỉ áp dụng Hàng hoá, khớp
                    CreateLetterDrawer không có lựa chọn này (Thư luôn Shop trả, không cần hiện). */}
                {order.sendKind !== 'letter' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, lineHeight: '16px' }}>
                      Shop cấu hình: <strong style={{ color: C_TEXT_PRIMARY, fontWeight: 600 }}>{order.feePayer === 'receiver' ? 'Khách trả ship' : 'Shop trả ship'}</strong>
                    </span>
                    <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, lineHeight: '16px' }}>
                      Ghi nhận với GHN: <strong style={{ color: C_TEXT_PRIMARY, fontWeight: 600 }}>Shop trả ship</strong>
                    </span>
                  </div>
                )}
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
                  <span style={{ fontSize: 12, color: '#4B5563', lineHeight: '16px', flexShrink: 0 }}>Phí ship (giá bán shop):</span>
                  {editMode && draft ? (
                    <div style={{ width: 120, flexShrink: 0 }}>
                      <EditableInput value={draft.fee} onChange={v => setDraft({ ...draft, fee: v })} textAlign="right" suffix="đ" />
                    </div>
                  ) : (
                    <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {order.fee.toLocaleString('vi-VN')}đ
                    </span>
                  )}
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
                  <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>Tổng phí vận chuyển (giá bán shop)</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
                    {(editMode && draft ? Number(draft.fee) || 0 : order.fee).toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>Tổng thu khách hàng</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#EF4444', lineHeight: '20px' }}>
                    {(editMode && draft ? Number(draft.cod) || 0 : order.cod).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              {editMode && (
                <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, background: '#FFF9F7', border: '1px solid #FECBA1', borderRadius: 6, padding: '8px 10px' }}>
                  Đang sửa thông tin đơn — các trường viền xanh có thể chỉnh. Bấm "Lưu thay đổi" để áp dụng.
                </div>
              )}

              {!editMode && onDispatch247 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: 10 }}>
                  <span style={{ fontSize: 13, color: '#1D4ED8' }}>Đơn thư đang chờ đại lý chọn hub và gửi qua 247Express.</span>
                  <button
                    onClick={onDispatch247}
                    style={{ padding: '8px 12px', background: '#1D4ED8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: '20px' }}
                  >
                    Chọn hub &amp; Gửi qua 247Express
                  </button>
                </div>
              )}

              {/* Đơn Thư hoàn hàng — hàng vật lý về đại lý trước (đại lý là người trực tiếp gửi
                  qua 247Express), KHÔNG tự về thẳng shop như đơn GHN Hàng hoá. Trạng thái đơn
                  ("Đơn huỷ"/"Đang hoàn hàng") không đồng nghĩa hàng đã về tay shop — cần đại lý
                  xác nhận thêm bước giao hoàn vật lý này. */}
              {!editMode && order && isLetterReturnCase(order) && (
                order.returnHandoverAt ? (
                  <div style={{ fontSize: 13, color: '#065F46', background: '#D1FAE5', border: '1px solid #A7F3D0', borderRadius: 6, padding: 10 }}>
                    Đại lý đã giao hoàn hàng cho shop lúc {new Date(order.returnHandoverAt).toLocaleString('vi-VN')}.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6, padding: 10 }}>
                    <span style={{ fontSize: 13, color: '#B45309' }}>
                      Đơn thư đã chuyển hoàn — hàng đang ở đại lý, <strong>chưa về tay shop</strong>. Đại lý cần trực tiếp giao lại hàng cho shop rồi bấm xác nhận.
                    </span>
                    <button
                      onClick={confirmReturnHandover}
                      style={{ padding: '8px 12px', background: '#B45309', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: '20px' }}
                    >
                      Xác nhận đã giao hoàn cho shop
                    </button>
                  </div>
                )
              )}

              {/* Chỉ cho huỷ đơn ở "Đơn nháp"/"Chờ xử lý" (isCancellable) — đơn đã dispatch/đang
                  giao không cho huỷ theo cách này nữa. */}
              {confirmingCancel && !editMode && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: 10 }}>
                  <span style={{ fontSize: 13, color: '#991B1B' }}>Bạn chắc chắn muốn huỷ đơn này? Thao tác này không thể hoàn tác.</span>
                </div>
              )}

              {/* Đơn Thư đã dispatch và đang trong luồng hoàn hàng — "Huỷ đơn"/"Cập nhật" không
                  còn hợp lý về nghiệp vụ (hàng đã ra khỏi đại lý, đang hoàn hoặc đã hoàn xong),
                  nên bỏ hẳn 2 nút này cho case isLetterReturnCase, chỉ giữ nút xác nhận giao hoàn. */}
              {!isLetterReturnCase(order) && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {editMode ? (
                    <>
                      <button
                        onClick={cancelEdit}
                        style={{ flex: 1, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}
                      >
                        Huỷ
                      </button>
                      <button
                        onClick={saveEdit}
                        style={{ flex: 1, padding: '8px 12px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: '20px' }}
                      >
                        Lưu thay đổi
                      </button>
                    </>
                  ) : confirmingCancel ? (
                    <>
                      <button
                        onClick={() => setConfirmingCancel(false)}
                        style={{ flex: 1, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}
                      >
                        Không huỷ
                      </button>
                      <button
                        onClick={confirmCancelOrder}
                        style={{ flex: 1, padding: '8px 12px', background: '#DC2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: '20px' }}
                      >
                        Xác nhận huỷ đơn
                      </button>
                    </>
                  ) : (
                    <>
                      {isCancellable(order) && (
                        <button
                          onClick={() => setConfirmingCancel(true)}
                          style={{ flex: 1, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}
                        >
                          Huỷ đơn
                        </button>
                      )}
                      <button
                        onClick={startEdit}
                        style={{ flex: 1, padding: '8px 12px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: '20px' }}
                      >
                        Cập nhật
                      </button>
                    </>
                  )}
                </div>
              )}
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
  order, checked, onToggle, shopName, shopAddress, onSelect, onDispatch247, onCancel,
}: {
  order: Order; checked: boolean; onToggle: () => void; shopName: string; shopAddress?: string; onSelect: () => void; onDispatch247?: () => void; onCancel?: () => void
}) {
  const [hover, setHover] = useState(false)
  const products = orderProducts[order.id] || ['Sản phẩm - SL: 1']
  const weightKg = (order.weight / 1000).toFixed(1)
  const feeType = order.feePayer === 'receiver' ? 'Khách trả' : 'Shop trả'

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
      {/* Mã đơn hàng — kèm trạng thái ngay dưới mã, khớp UI thật (mỗi dòng tự hiện trạng thái,
          không chỉ dựa vào tab đang xem). Loại đơn (Hàng hoá/Thư) gộp làm dòng thứ 3 ngay dưới,
          icon + text đơn giản, không còn tách riêng thành 1 cột pill. */}
      <div style={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 8px', justifyContent: 'center' }}>
        <span
          onClick={(e) => { e.stopPropagation(); onSelect() }}
          style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px', whiteSpace: 'nowrap', cursor: 'pointer' }}
        >
          {order.trackingCode}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: rowStatus(order).color, lineHeight: '18px', whiteSpace: 'nowrap' }}>
          {rowStatus(order).label}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C_TEXT_SECONDARY, lineHeight: '16px', whiteSpace: 'nowrap' }}>
          {order.sendKind === 'letter' ? <MailOutlined /> : <InboxOutlined />}
          {order.sendKind === 'letter' ? 'Thư, tài liệu' : 'Hàng hoá'}
        </span>
      </div>
      {/* Shop — kèm địa chỉ gửi (địa chỉ shop) để phân biệt điểm lấy hàng khi nhiều shop trùng tên */}
      <div style={{ flex: '1 0 0', minWidth: 200, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
        <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {shopName}
        </span>
        {shopAddress && (
          <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, lineHeight: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shopAddress}
          </span>
        )}
        {/* Đơn Thư hoàn hàng — hàng đang ở đại lý, PHẢI phân biệt rõ với "đã về tay shop" để
            shop không hiểu lầm khi thấy order.status là "Đơn huỷ"/"Đang hoàn hàng". */}
        {isLetterReturnCase(order) && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 8, whiteSpace: 'nowrap', alignSelf: 'flex-start',
            background: order.returnHandoverAt ? '#D1FAE5' : '#FEF3C7',
            color: order.returnHandoverAt ? '#065F46' : '#B45309',
          }}>
            {order.returnHandoverAt ? 'Đã giao hoàn cho shop' : 'Hàng hoàn đang ở đại lý'}
          </span>
        )}
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
      <div style={{ flex: '1 0 0', minWidth: 180, padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
        <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {order.senderName}
        </span>
        <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Tạo lúc {order.createdAt}
        </span>
      </div>
      {/* Thao tác */}
      <div style={{ width: 160, flexShrink: 0, padding: '6px 8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        {onDispatch247 && (
          <button
            onClick={(e) => { e.stopPropagation(); onDispatch247() }}
            style={{ padding: '4px 10px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#1D4ED8', whiteSpace: 'nowrap', lineHeight: '18px' }}
          >
            Gửi qua 247Express
          </button>
        )}
        {onCancel && (
          <button
            onClick={(e) => { e.stopPropagation(); onCancel() }}
            style={{ padding: '4px 10px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#DC2626', whiteSpace: 'nowrap', lineHeight: '18px' }}
          >
            Huỷ đơn
          </button>
        )}
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

// ── Export orders modal — cùng pattern với Shops.tsx, đọc từ orderStore live ──
function ExportOrdersModal({ open, onClose, orders }: { open: boolean; onClose: () => void; orders: Order[] }) {
  const today = new Date()
  const [preset, setPreset] = useState('this_week')
  const [[dateFrom, dateTo], setDateRange] = useState<[string, string]>(
    () => computePresetRange('this_week', today) ?? [fmtDateInput(today), fmtDateInput(today)]
  )
  const carrierOptions = [
    { key: 'GHN', label: 'GHN' },
    { key: '247EXPRESS', label: '247Express' },
  ]
  const [carrierKeys, setCarrierKeys] = useState<Set<string>>(new Set(carrierOptions.map(c => c.key)))
  const [statusKeys, setStatusKeys] = useState<Set<string>>(new Set(STATUS_GROUPS.map(g => g.key)))
  const [shopIds, setShopIds] = useState<Set<string>>(new Set(agencyShops.map(s => s.id)))

  if (!open) return null

  const selectPreset = (key: string) => {
    setPreset(key)
    const range = computePresetRange(key, today)
    if (range) setDateRange(range)
  }

  const toggleAllIn = (all: string[], current: Set<string>, setter: (s: Set<string>) => void) => {
    setter(current.size === all.length ? new Set() : new Set(all))
  }
  const toggleOneIn = (current: Set<string>, value: string, setter: (s: Set<string>) => void) => {
    const next = new Set(current)
    next.has(value) ? next.delete(value) : next.add(value)
    setter(next)
  }

  const allCarrierKeys = carrierOptions.map(c => c.key)
  const allStatusKeys = STATUS_GROUPS.map(g => g.key)
  const allShopIds = agencyShops.map(s => s.id)

  const handleDownload = () => {
    const selectedRawStatuses = new Set(STATUS_GROUPS.filter(g => statusKeys.has(g.key)).flatMap(g => g.match))
    const filtered = orders.filter(o => {
      if (!shopIds.has(o.shopId)) return false
      if (dateFrom && o.createdAt < dateFrom) return false
      if (dateTo && o.createdAt > dateTo) return false
      if (!selectedRawStatuses.has(o.status)) return false
      if (o.carrierCode && !carrierKeys.has(o.carrierCode)) return false
      return true
    })
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    downloadXlsx(`don-hang-${dateFrom}_${dateTo}_${timestamp}.xlsx`, EXPORT_HEADERS, buildExportRows(filtered))
    onClose()
  }

  const sectionLabelStyle = { fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, marginBottom: 12 }
  const optionRowStyle = { display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }
  const optionLabelStyle = { fontSize: 14, color: C_TEXT_PRIMARY }
  const dateInputStyle = {
    flex: 1, border: `1px solid ${C_BORDER}`, borderRadius: 8, padding: '10px 12px',
    fontSize: 14, color: C_TEXT_PRIMARY, outline: 'none',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: 560, maxHeight: '90vh', background: '#fff', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C_TEXT_PRIMARY }}>Xuất đơn hàng</span>
          <CloseOutlined style={{ fontSize: 16, color: C_TEXT_SECONDARY, cursor: 'pointer' }} onClick={onClose} />
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={sectionLabelStyle}>Thời gian tạo đơn hàng</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <input type="date" value={dateFrom} onChange={(e) => { setDateRange([e.target.value, dateTo]); setPreset('custom') }} style={dateInputStyle} />
              <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>đến</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateRange([dateFrom, e.target.value]); setPreset('custom') }} style={dateInputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              {[0, 1].map(col => (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  {DATE_PRESETS.filter((_, i) => i % 2 === col).map(p => (
                    <div key={p.key} style={optionRowStyle} onClick={() => selectPreset(p.key)}>
                      <RadioDot checked={preset === p.key} />
                      <span style={optionLabelStyle}>{p.label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={sectionLabelStyle}>Nhà vận chuyển</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={optionRowStyle} onClick={() => toggleAllIn(allCarrierKeys, carrierKeys, setCarrierKeys)}>
                <Checkbox checked={carrierKeys.size === allCarrierKeys.length} />
                <span style={optionLabelStyle}>Tất cả</span>
              </div>
              {carrierOptions.map(c => (
                <div key={c.key} style={optionRowStyle} onClick={() => toggleOneIn(carrierKeys, c.key, setCarrierKeys)}>
                  <Checkbox checked={carrierKeys.has(c.key)} />
                  <span style={optionLabelStyle}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={sectionLabelStyle}>Trạng thái đơn hàng</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={optionRowStyle} onClick={() => toggleAllIn(allStatusKeys, statusKeys, setStatusKeys)}>
                <Checkbox checked={statusKeys.size === allStatusKeys.length} />
                <span style={optionLabelStyle}>Tất cả</span>
              </div>
              <div style={{ display: 'flex', gap: 32 }}>
                {[0, 1].map(col => (
                  <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {STATUS_GROUPS.filter((_, i) => i % 2 === col).map(g => (
                      <div key={g.key} style={optionRowStyle} onClick={() => toggleOneIn(statusKeys, g.key, setStatusKeys)}>
                        <Checkbox checked={statusKeys.has(g.key)} />
                        <span style={optionLabelStyle}>{g.label}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={sectionLabelStyle}>Shop</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={optionRowStyle} onClick={() => toggleAllIn(allShopIds, shopIds, setShopIds)}>
                <Checkbox checked={shopIds.size === allShopIds.length} />
                <span style={optionLabelStyle}>Tất cả ({agencyShops.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 180, overflowY: 'auto' }}>
                {agencyShops.map(s => (
                  <div key={s.id} style={optionRowStyle} onClick={() => toggleOneIn(shopIds, s.id, setShopIds)}>
                    <Checkbox checked={shopIds.has(s.id)} />
                    <span style={optionLabelStyle}>{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
          <button
            onClick={handleDownload}
            style={{
              width: '100%', padding: '12px', background: C_ACTION, border: 'none', borderRadius: 8,
              cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#fff',
            }}
          >
            Tải xuống
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function AgencyOrders() {
  const navigate = useNavigate()
  const [orders, setOrders]           = useState<Order[]>(() => loadOrders().filter(o => agencyShopIds.has(o.shopId)))
  const [activeTab, setActiveTab]     = useState('draft')
  const [search, setSearch]           = useState('')
  const [shopFilter, setShopFilter]   = useState('all')
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false)
  const [filterSendKind, setFilterSendKind] = useState<'all' | 'goods' | 'letter'>('all')
  const [sendKindDropdownOpen, setSendKindDropdownOpen] = useState(false)
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [page, setPage]               = useState(1)
  const [pageSize, setPageSize]       = useState(50)
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [letterDrawerOpen, setLetterDrawerOpen] = useState(false)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [detailOpen, setDetailOpen]   = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  // Luôn là 1 mảng — 1 đơn (quick action từng dòng / chi tiết đơn) truyền vào mảng 1 phần tử,
  // nhiều đơn (thanh "Đã chọn N đơn") truyền cả mảng — dùng chung 1 modal, không tách riêng.
  const [dispatchModal, setDispatchModal] = useState<Order[] | null>(null)
  // Số đơn đã chọn nhưng KHÔNG hợp lệ để gửi 247 (đơn Hàng hoá, hoặc Thư đã dispatch) — chỉ có
  // giá trị > 0 khi mở modal từ thanh chọn hàng loạt, dùng để cảnh báo rõ trong modal.
  const [dispatchExcludedCount, setDispatchExcludedCount] = useState(0)
  // Hub xuất phát phải được đại lý xác nhận ngay lúc gửi — Service không còn gắn cứng 1 hub
  // nữa (xem ServiceDetail.tsx), nên hub chỉ quyết định ở bước dispatch này.
  const [dispatchHubId, setDispatchHubId] = useState<string>('')
  // Huỷ đơn — dùng chung 1 modal cho cả nút nhanh từng dòng (mảng 1 phần tử) và nút hàng loạt
  // trên thanh "Đã chọn N" (mảng nhiều phần tử), giống pattern dispatchModal. Popup tách khỏi
  // drawer chi tiết vì bảng không có chỗ cho banner cảnh báo inline.
  const [cancelOrders, setCancelOrders] = useState<Order[] | null>(null)
  const agency = agenciesList.find(a => a.id === CURRENT_AGENCY_ID)
  const agencyHubs = (agency?.clientHubIds ?? []).map(id => clientHubs247.find(h => h.id === id)).filter((h): h is NonNullable<typeof h> => !!h)

  function refreshOrders() {
    setOrders(loadOrders().filter(o => agencyShopIds.has(o.shopId)))
  }

  useEffect(() => {
    if (!createMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-create-order-menu]')) setCreateMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [createMenuOpen])

  useEffect(() => {
    if (!shopDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-shop-filter]')) setShopDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [shopDropdownOpen])

  useEffect(() => {
    if (!sendKindDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-sendkind-filter]')) setSendKindDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sendKindDropdownOpen])

  const isPending247 = (o: Order) => o.sendKind === 'letter' && o.dispatchStatus === 'pending_agency'

  const ordersByTab: Record<string, Order[]> = {
    pending_247:   orders.filter(isPending247),
    draft:         orders.filter(o => o.status === 'pending' && !isPending247(o)),
    pickup:        orders.filter(o => o.status === 'pickup'),
    in_transit:    orders.filter(o => o.status === 'in_transit'),
    returning:     orders.filter(o => o.status === 'returning'),
    redelivery:    orders.filter(o => o.status === 'redelivery'),
    // 'failed' = giao hàng không thành công → hoàn hàng thành công — theo mapping GHN thật
    // (AGA-RECON-4), đây là 1 nhánh KẾT THÚC/hoàn tất, không phải huỷ đơn — chỉ 'cancelled'
    // (đại lý/shop chủ động huỷ) mới thuộc tab "Đơn huỷ".
    completed:     orders.filter(o => o.status === 'delivered' || o.status === 'failed'),
    cancelled:     orders.filter(o => o.status === 'cancelled'),
    lost_damaged:  orders.filter(o => o.status === 'lost' || o.status === 'damaged'),
  }
  const tabOrders = ordersByTab[activeTab] ?? orders

  const shopFiltered = shopFilter === 'all' ? tabOrders : tabOrders.filter(o => o.shopId === shopFilter)
  const sendKindFiltered = filterSendKind === 'all' ? shopFiltered : shopFiltered.filter(o => o.sendKind === filterSendKind)

  const filtered = sendKindFiltered.filter(o =>
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
    { key: 'draft',        label: 'Đơn nháp',                     count: ordersByTab.draft.length,        countColor: '#F59E0B', icon: <FileOutlined /> },
    { key: 'pending_247',  label: 'Chờ xử lý',                     count: ordersByTab.pending_247.length,  countColor: '#F59E0B', icon: <SyncOutlined /> },
    { key: 'pickup',       label: 'Chờ bàn giao',                 count: ordersByTab.pickup.length,       countColor: '#3B82F6', icon: <ClockCircleOutlined /> },
    { key: 'in_transit',   label: 'Đã bàn giao - Đang giao',      count: ordersByTab.in_transit.length,   countColor: '#3B82F6', icon: <TruckOutlined /> },
    { key: 'returning',    label: 'Đã bàn giao - Đang hoàn hàng', count: ordersByTab.returning.length,    countColor: '#F59E0B', icon: <RollbackOutlined /> },
    { key: 'redelivery',   label: 'Chờ xác nhận giao lại',        count: ordersByTab.redelivery.length,   countColor: '#F59E0B', icon: <ExclamationCircleOutlined /> },
    { key: 'completed',    label: 'Hoàn tất',                     count: ordersByTab.completed.length,    countColor: '#10B981', icon: <CheckCircleOutlined /> },
    { key: 'cancelled',    label: 'Đơn huỷ',                      count: ordersByTab.cancelled.length,    countColor: '#EF4444', icon: <CloseCircleOutlined /> },
    { key: 'lost_damaged', label: 'Hàng thất lạc - hư hỏng',     count: ordersByTab.lost_damaged.length, countColor: '#EF4444', icon: <WarningOutlined /> },
  ]

  const shopMap = Object.fromEntries(agencyShops.map(s => [s.id, s.name]))
  const shopAddressMap = Object.fromEntries(agencyShops.map(s => [s.id, (s as any).address as string | undefined]))

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
            onClick={() => setExportModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <DownloadOutlined style={{ color: C_TEXT_PRIMARY, fontSize: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap' }}>Xuất đơn hàng</span>
          </button>
          <button
            onClick={() => navigate('/agency-admin/orders/import')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
              background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <DownloadOutlined style={{ color: C_TEXT_PRIMARY, fontSize: 16, transform: 'rotate(180deg)' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap' }}>Nhập đơn hàng</span>
          </button>
          <div style={{ position: 'relative', flexShrink: 0 }} data-create-order-menu>
            <button
              onClick={() => setCreateMenuOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
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
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: active ? '#fff' : C_TEXT_SECONDARY }}>{tab.icon}</span>
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
          <div style={{ position: 'relative', flexShrink: 0 }} data-shop-filter>
            <button
              onClick={() => setShopDropdownOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 12px',
                background: '#fff', cursor: 'pointer', minWidth: 200,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>Shop</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C_ACTION, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {shopFilter === 'all' ? 'Tất cả' : (shopMap[shopFilter] ?? 'Tất cả')}
                </span>
              </span>
              <IcChevronDown size={14} />
            </button>
            {shopDropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 240, maxHeight: 320, overflowY: 'auto',
                background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 20,
              }}>
                {[{ id: 'all', name: `Tất cả shop (${agencyShops.length})` }, ...agencyShops].map(s => {
                  const active = shopFilter === s.id
                  return (
                    <div
                      key={s.id}
                      onClick={() => { setShopFilter(s.id); setPage(1); setShopDropdownOpen(false) }}
                      style={{
                        padding: '8px 12px', fontSize: 14, cursor: 'pointer',
                        background: active ? '#FFF4ED' : 'transparent',
                        color: active ? C_ACTION : C_TEXT_PRIMARY, fontWeight: active ? 600 : 400,
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F9FAFB' }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      {s.name}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }} data-sendkind-filter>
            <button
              onClick={() => setSendKindDropdownOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 12px',
                background: '#fff', cursor: 'pointer', minWidth: 170,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>Loại đơn</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C_ACTION, whiteSpace: 'nowrap' }}>
                  {filterSendKind === 'all' ? 'Tất cả' : filterSendKind === 'goods' ? 'Hàng hoá' : 'Thư'}
                </span>
              </span>
              <IcChevronDown size={14} />
            </button>
            {sendKindDropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 160,
                background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 20,
              }}>
                {([
                  { key: 'all' as const, label: 'Tất cả' },
                  { key: 'goods' as const, label: 'Hàng hoá' },
                  { key: 'letter' as const, label: 'Thư' },
                ]).map(opt => {
                  const active = filterSendKind === opt.key
                  return (
                    <div
                      key={opt.key}
                      onClick={() => { setFilterSendKind(opt.key); setPage(1); setSendKindDropdownOpen(false) }}
                      style={{
                        padding: '8px 12px', fontSize: 14, cursor: 'pointer',
                        background: active ? '#FFF4ED' : 'transparent',
                        color: active ? C_ACTION : C_TEXT_PRIMARY, fontWeight: active ? 600 : 400,
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F9FAFB' }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      {opt.label}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Thanh hành động hàng loạt — nổi cố định ở đáy màn hình (không cuộn theo bảng), giống
            đúng bố cục thật của GHN: nút X + số lượng đã chọn bên trái, các hành động hàng loạt
            bên phải. "Gửi qua 247Express" gửi tất cả đơn Thư chưa dispatch trong lựa chọn cùng
            1 hub; "Huỷ đơn" huỷ tất cả đơn đang ở Đơn nháp/Chờ xử lý trong lựa chọn. Đơn không
            hợp lệ cho từng hành động tự bị loại khỏi batch tương ứng. */}
        {selected.size > 0 && (() => {
          const selectedOrders = orders.filter(o => selected.has(o.id))
          const eligibleDispatch = selectedOrders.filter(isPending247)
          const eligibleCancel = selectedOrders.filter(isCancellable)
          return (
          <div style={{
            position: 'fixed', bottom: 0, left: 240, right: 0, zIndex: 250,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px', background: '#111827', boxShadow: '0 -2px 12px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setSelected(new Set())}
                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <CloseOutlined style={{ fontSize: 13 }} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Đã chọn {selected.size}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {eligibleDispatch.length > 0 && (
                <button
                  onClick={() => {
                    setDispatchHubId('')
                    setDispatchExcludedCount(selectedOrders.length - eligibleDispatch.length)
                    setDispatchModal(eligibleDispatch)
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#1D4ED8', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}
                >
                  <TruckOutlined style={{ fontSize: 15 }} />
                  Gửi qua 247Express
                </button>
              )}
              {eligibleCancel.length > 0 && (
                <button
                  onClick={() => setCancelOrders(eligibleCancel)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(220,38,38,0.16)', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#F87171', whiteSpace: 'nowrap' }}
                >
                  <StopOutlined style={{ fontSize: 15 }} />
                  Huỷ đơn
                </button>
              )}
            </div>
          </div>
          )
        })()}

        {/* Table */}
        <div style={{ flex: '1 0 0', overflow: 'hidden', padding: '0 16px' }}>
          <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
            <div style={{ minWidth: 1520 }}>
              <THead allChecked={allChecked} onToggleAll={toggleAll} />
              <div style={{ height: 1, background: C_BORDER }} />
              {paginated.map(order => (
                <TRow
                  key={order.id}
                  order={order}
                  checked={selected.has(order.id)}
                  onToggle={() => toggleOne(order.id)}
                  shopName={shopMap[order.shopId] ?? order.shopId}
                  shopAddress={shopAddressMap[order.shopId]}
                  onSelect={() => { setSelectedOrder(order); setDetailOpen(true) }}
                  onDispatch247={activeTab === 'pending_247' ? () => { setDispatchHubId(''); setDispatchExcludedCount(0); setDispatchModal([order]) } : undefined}
                  onCancel={isCancellable(order) ? () => setCancelOrders([order]) : undefined}
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

        {/* Pagination — chừa khoảng trống dưới khi thanh hành động hàng loạt đang nổi cố định
            ở đáy màn hình, tránh bị che mất phần điều hướng trang. */}
        <div style={{ borderTop: `1px solid ${C_BORDER}`, flexShrink: 0, paddingBottom: selected.size > 0 ? 60 : 0 }}>
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
      <CreateOrderDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); refreshOrders() }} />
      <CreateLetterDrawerAgency open={letterDrawerOpen} onClose={() => { setLetterDrawerOpen(false); refreshOrders() }} />
      {/* Export orders modal */}
      <ExportOrdersModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} orders={orders} />
      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onDispatch247={selectedOrder && isPending247(selectedOrder) ? () => { setDispatchHubId(''); setDispatchExcludedCount(0); setDispatchModal([selectedOrder]) } : undefined}
        onUpdated={() => {
          const fresh = loadOrders().find(o => o.id === selectedOrder?.id)
          if (fresh) setSelectedOrder(fresh)
          refreshOrders()
        }}
      />

      {/* Dispatch 247Express confirm modal */}
      {dispatchModal && (
        <>
          <div
            onClick={() => setDispatchModal(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300 }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: 8, padding: 24, zIndex: 301,
            width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: '24px' }}>
              {dispatchModal.length === 1 ? 'Xác nhận gửi qua 247Express' : `Đẩy ${dispatchModal.length} đơn qua 247Express`}
            </div>
            {dispatchModal.length === 1 ? (
              <div style={{ fontSize: 14, color: '#374151', lineHeight: '22px' }}>
                Đơn <span style={{ fontWeight: 700, color: '#3B82F6' }}>{dispatchModal[0].trackingCode}</span> sẽ được đẩy sang 247Express để giao hàng. Thao tác này không thể hoàn tác.
              </div>
            ) : (
              <div style={{ fontSize: 14, color: '#374151', lineHeight: '22px' }}>
                <span style={{ fontWeight: 700, color: '#3B82F6' }}>{dispatchModal.length} đơn</span> hợp lệ sẽ được đẩy sang 247Express cùng 1 hub xuất phát. Thao tác này không thể hoàn tác.
              </div>
            )}
            {dispatchExcludedCount > 0 && (
              <div style={{ fontSize: 13, color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 10px' }}>
                {dispatchExcludedCount} đơn đã chọn không hợp lệ (đơn Hàng hoá, hoặc đơn Thư đã gửi rồi) sẽ bị bỏ qua, không nằm trong lần gửi này.
              </div>
            )}

            {/* Bắt buộc xác nhận hub xuất phát trước khi gửi được — dịch vụ không còn gắn
                cứng 1 hub nữa nên phải chọn ở đây */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                Chọn hub xuất phát <span style={{ color: '#EF4444' }}>*</span>
              </span>
              {agencyHubs.length === 0 ? (
                <div style={{ fontSize: 13, color: '#9CA3AF', padding: '8px 0' }}>
                  Đại lý chưa được cấp hub 247Express nào — liên hệ Super Admin.
                </div>
              ) : (
                <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                  {agencyHubs.map((hub, i) => {
                    const isSelected = dispatchHubId === hub.id
                    return (
                      <div key={hub.id}>
                        <div
                          onClick={() => setDispatchHubId(hub.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer',
                            background: isSelected ? '#FFF9F7' : '#fff',
                            borderLeft: isSelected ? '3px solid #FF5200' : '3px solid transparent',
                          }}
                        >
                          <div style={{
                            width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                            border: isSelected ? '5px solid #FF5200' : '1.5px solid #D1D5DB',
                          }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{hub.name}</span>
                            <span style={{ fontSize: 12, color: '#6B7280' }}>{hub.location}</span>
                          </div>
                        </div>
                        {i < agencyHubs.length - 1 && <div style={{ height: 1, background: '#F5F5F5' }} />}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDispatchModal(null)}
                style={{ padding: '8px 20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151' }}
              >
                Huỷ
              </button>
              <button
                disabled={!dispatchHubId}
                onClick={() => {
                  if (!dispatchHubId) return
                  dispatchModal.forEach(o => dispatchOrderToCarrier(o.id, '247EXPRESS', 'Agency Admin', dispatchHubId))
                  if (selectedOrder && dispatchModal.some(o => o.id === selectedOrder.id)) setDetailOpen(false)
                  setSelected(new Set())
                  setDispatchModal(null)
                  refreshOrders()
                }}
                style={{
                  padding: '8px 20px', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, color: '#fff',
                  background: dispatchHubId ? '#1D4ED8' : '#9CA3AF', cursor: dispatchHubId ? 'pointer' : 'not-allowed',
                }}
              >
                {dispatchModal.length === 1 ? 'Xác nhận gửi' : `Xác nhận gửi ${dispatchModal.length} đơn`}
              </button>
            </div>
          </div>
        </>
      )}

      {cancelOrders && (
        <CancelOrderModal
          orders={cancelOrders}
          onClose={() => setCancelOrders(null)}
          onConfirm={() => {
            cancelOrders.forEach(o => cancelOrder(o.id))
            setSelected(new Set())
            setCancelOrders(null)
            refreshOrders()
          }}
        />
      )}
    </ConfigProvider>
  )
}

// ── Popup xác nhận huỷ đơn — dùng chung cho cả nút nhanh từng dòng (1 phần tử) và nút hàng
// loạt trên thanh "Đã chọn N" (nhiều phần tử). Drawer chi tiết dùng banner inline riêng. ──
function CancelOrderModal({ orders, onClose, onConfirm }: { orders: Order[]; onClose: () => void; onConfirm: () => void }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 300 }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: '#fff', borderRadius: 8, padding: 24, zIndex: 301,
        width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', lineHeight: '24px' }}>
          {orders.length === 1 ? 'Huỷ đơn hàng' : `Huỷ ${orders.length} đơn hàng`}
        </div>
        <div style={{ fontSize: 14, color: '#374151', lineHeight: '22px' }}>
          {orders.length === 1 ? (
            <>Bạn chắc chắn muốn huỷ đơn <span style={{ fontWeight: 700, color: '#3B82F6' }}>{orders[0].trackingCode}</span>? Thao tác này không thể hoàn tác.</>
          ) : (
            <>Bạn chắc chắn muốn huỷ <span style={{ fontWeight: 700, color: '#3B82F6' }}>{orders.length} đơn</span> đã chọn? Thao tác này không thể hoàn tác.</>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ padding: '8px 20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#374151' }}
          >
            Không huỷ
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: '8px 20px', background: '#DC2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff' }}
          >
            {orders.length === 1 ? 'Xác nhận huỷ đơn' : `Xác nhận huỷ ${orders.length} đơn`}
          </button>
        </div>
      </div>
    </>
  )
}
