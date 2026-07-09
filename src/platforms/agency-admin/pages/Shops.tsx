import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { PlusOutlined, SearchOutlined, LinkOutlined, CopyOutlined, CheckOutlined, DownloadOutlined, CloseOutlined } from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { agencyAdminTheme } from '../../../theme/platforms'
import allShops from '../../../mock-data/shops.json'
import allOrders from '../../../mock-data/orders.json'

// ── Design tokens (from Figma) ──────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_LINK           = '#3B82F6'   // shop name — blue per Figma
const C_ACTION         = '#FF5200'   // buttons
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// ── Data ────────────────────────────────────────────────────
const RAW = allShops.filter((s) => s.agencyId === 'AGN001')
const OWNER_NAMES = ['Trần Thị Hòa', 'Lê Văn Minh', 'Phạm Thị Hương', 'Đỗ Văn Nam', 'Nguyễn Thị Lan']

function fmt(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (n >= 1_000_000)     return Math.round(n / 1_000_000) + 'M'
  return n.toLocaleString()
}

const shops = RAW.map((s, i) => ({
  ...s,
  ownerName: OWNER_NAMES[i % OWNER_NAMES.length],
  cod:     s.totalOrders * 35_000,
  revenue: Math.round(s.totalOrders * 35_000 * 0.028),
}))

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Đơn nháp',
  pickup: 'Chờ bàn giao',
  in_transit: 'Đang giao',
  returning: 'Đang hoàn hàng',
  redelivery: 'Chờ xác nhận giao lại',
  delivered: 'Hoàn tất',
  cancelled: 'Đơn huỷ',
  failed: 'Đơn huỷ',
  lost: 'Thất lạc',
  damaged: 'Hư hỏng',
}

const STATUS_GROUPS: { key: string; label: string; match: string[] }[] = [
  { key: 'pending',    label: 'Đơn nháp',                     match: ['pending'] },
  { key: 'pickup',     label: 'Chờ bàn giao',                 match: ['pickup'] },
  { key: 'in_transit', label: 'Đang giao',                    match: ['in_transit'] },
  { key: 'returning',  label: 'Đang hoàn hàng',               match: ['returning'] },
  { key: 'redelivery', label: 'Chờ xác nhận giao lại',        match: ['redelivery'] },
  { key: 'delivered',  label: 'Hoàn tất',                     match: ['delivered'] },
  { key: 'cancelled',  label: 'Đơn huỷ',                      match: ['cancelled', 'failed'] },
  { key: 'lost_damaged', label: 'Thất lạc - hư hỏng',         match: ['lost', 'damaged'] },
]

const CARRIER_OPTIONS: { key: string; label: string; prefix: string; fullLabel: string }[] = [
  { key: 'GHN',        label: 'GHN',        prefix: 'GHN', fullLabel: 'Giao hàng nhanh' },
  { key: '247Express', label: '247Express', prefix: '247', fullLabel: '247Express' },
]

// ── Export orders: per-order sample product lines ────────────
const EXPORT_SAMPLE_PRODUCTS: { sku: string; name: string; qty: number; importPrice: number; sellPrice: number; length: number; width: number; height: number }[][] = [
  [{ sku: 'GTN-42', name: 'Giày Thể Thao Nam', qty: 2, importPrice: 250000, sellPrice: 450000, length: 30, width: 20, height: 12 }],
  [
    { sku: 'ATC-OS', name: 'Áo Thun Cotton Nam - Oversize', qty: 2, importPrice: 90000, sellPrice: 180000, length: 30, width: 25, height: 5 },
    { sku: 'BGN-CC', name: 'Bình Giữ Nhiệt Cao Cấp', qty: 1, importPrice: 60000, sellPrice: 120000, length: 10, width: 10, height: 25 },
  ],
  [{ sku: 'ATT-CT', name: 'Áo Thun Trơn Cổ Tròn Thoáng Khí', qty: 10, importPrice: 45000, sellPrice: 89000, length: 35, width: 28, height: 8 }],
  [
    { sku: 'QJN-SF', name: 'Quần Jean Nam Slim Fit', qty: 1, importPrice: 180000, sellPrice: 350000, length: 32, width: 24, height: 6 },
    { sku: 'APC-CB', name: 'Áo Polo Cổ Bẻ', qty: 2, importPrice: 120000, sellPrice: 220000, length: 30, width: 22, height: 4 },
  ],
]
const orderExportLines: Record<string, typeof EXPORT_SAMPLE_PRODUCTS[number]> = {}
allOrders.forEach((o, i) => { orderExportLines[o.id] = EXPORT_SAMPLE_PRODUCTS[i % EXPORT_SAMPLE_PRODUCTS.length] })

const EXPORT_HEADERS = [
  'Mã shop', 'Ngày tạo', 'Mã đơn CDN', 'Mã đơn của shop', 'Mã đơn vận chuyển',
  'Trạng thái', 'Đơn vị vận chuyển', 'Khách hàng', 'Số điện thoại', 'Địa chỉ giao hàng',
  'SKU', 'Sản phẩm', 'Số Lượng', 'Giá Nhập (đ)', 'Giá Bán (đ)', 'Khối lượng (kg)',
  'Dài (cm)', 'Rộng (cm)', 'Cao (cm)', 'Tiền thu hộ COD (đ)', 'Giá trị hàng hoá (đ)',
  'Khai giá', 'Phí ship (đ)', 'Trả ship', 'Ghi chú xem hàng', 'Ghi chú giao hàng',
]

function buildExportRows(orders: typeof allOrders) {
  const rows: (string | number)[][] = []
  orders.forEach((o) => {
    const carrier = CARRIER_OPTIONS.find((c) => o.trackingCode.startsWith(c.prefix))
    const feeType = parseInt(o.id.replace('ORD', '')) % 2 === 0 ? 'Shop trả' : 'Khách trả'
    const [dd, mm, yyyy] = [o.createdAt.slice(8, 10), o.createdAt.slice(5, 7), o.createdAt.slice(0, 4)]
    const lines = orderExportLines[o.id] ?? []
    lines.forEach((line) => {
      rows.push([
        o.shopId,
        `${dd}/${mm}/${yyyy}`,
        o.id,
        '',
        o.trackingCode,
        ORDER_STATUS_LABELS[o.status] ?? o.status,
        carrier?.fullLabel ?? '',
        o.receiverName,
        o.receiverPhone,
        o.receiverAddress,
        line.sku,
        line.name,
        line.qty,
        line.importPrice,
        line.sellPrice,
        +(o.weight / 1000).toFixed(2),
        line.length,
        line.width,
        line.height,
        o.cod,
        o.cod,
        '',
        o.fee,
        feeType,
        '',
        '',
      ])
    })
  })
  return rows
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

// ── Sub-components ──────────────────────────────────────────
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
  const cell = (label: string, flex = '1 0 0', minWidth = 160, align: 'left'|'right' = 'left') => (
    <div style={{ display:'flex', flex, alignItems:'center', minWidth, padding:'6px 8px' }}>
      <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, textAlign: align, lineHeight:'20px' }}>{label}</span>
    </div>
  )
  return (
    <div style={{ display:'flex', background: C_BG_HEADER, alignItems:'center' }}>
      <div style={{ width:32, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', padding:'6px 8px' }}>
        <Checkbox checked={allChecked} onChange={onToggleAll} />
      </div>
      {cell('Shop',          '1 0 0', 240)}
      {cell('Chủ shop',      '1 0 0', 160)}
      {cell('Đơn hàng',     '1 0 0', 160, 'right')}
      {cell('Tổng COD (₫)', '1 0 0', 160, 'right')}
      {cell('Doanh thu (₫)','1 0 0', 160, 'right')}
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────
type Shop = typeof shops[0]
function TRow({ shop, checked, onToggle, onClick }: {
  shop: Shop; checked: boolean; onToggle: () => void; onClick: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', cursor: 'pointer',
        background: hover ? '#FAFAFA' : '#fff',
        transition: 'background 0.1s',
        borderBottom: `1px solid ${C_BORDER}`,
      }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
        {/* Checkbox */}
        <div style={{ width:32, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', alignSelf:'stretch', padding:'6px 8px' }}>
          <Checkbox checked={checked} onChange={onToggle} />
        </div>
        {/* Shop */}
        <div style={{ flex:'1 0 0', minWidth:240, padding:'6px 8px', display:'flex', flexDirection:'column', gap:2 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:14, fontWeight:700, color: shop.status === 'inactive' ? '#9CA3AF' : C_LINK, lineHeight:'20px' }}>{shop.name}</span>
            {shop.status === 'inactive' && (
              <span style={{ fontSize:11, fontWeight:500, color:'#6B7280', background:'#F3F4F6', border:'1px solid #D1D5DB', borderRadius:4, padding:'1px 6px', lineHeight:'16px', whiteSpace:'nowrap' }}>Inactive</span>
            )}
          </div>
          <span style={{ fontSize:12, color: C_TEXT_SECONDARY, lineHeight:'16px' }}>
            {shop.id}
            {shop.status === 'inactive' && (shop as any).selfDeletedAt && (
              <> · Tự xoá {((shop as any).selfDeletedAt as string).split('-').reverse().join('/')}</>
            )}
          </span>
        </div>
        {/* Chủ shop */}
        <div style={{ flex:'1 0 0', minWidth:160, padding:'6px 8px', display:'flex', flexDirection:'column', gap:2 }}>
          <span style={{ fontSize:14, color: C_TEXT_PRIMARY, lineHeight:'20px' }}>{shop.ownerName}</span>
          <span style={{ fontSize:12, color: C_TEXT_SECONDARY, lineHeight:'16px' }}>{shop.phone}</span>
        </div>
        {/* Đơn hàng */}
        <div style={{ flex:'1 0 0', minWidth:160, padding:'6px 8px', textAlign:'right' }}>
          <span style={{ fontSize:14, color: C_TEXT_PRIMARY, lineHeight:'20px' }}>{shop.totalOrders.toLocaleString()}</span>
        </div>
        {/* Tổng COD */}
        <div style={{ flex:'1 0 0', minWidth:160, padding:'6px 8px', textAlign:'right' }}>
          <span style={{ fontSize:14, color: C_TEXT_PRIMARY, lineHeight:'20px' }}>{fmt(shop.cod)}</span>
        </div>
        {/* Doanh thu */}
        <div style={{ flex:'1 0 0', minWidth:160, padding:'6px 8px', textAlign:'right' }}>
          <span style={{ fontSize:14, color: C_TEXT_PRIMARY, lineHeight:'20px' }}>{fmt(shop.revenue)}</span>
        </div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────
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
    if (p === '...') return <span style={{ fontSize:14, color: C_TEXT_PRIMARY }}>...</span>
    const active = p === page
    return (
      <div
        onClick={() => onPageChange(p)}
        style={{
          width: 24, height: 24, borderRadius: 500, display:'flex', alignItems:'center', justifyContent:'center',
          cursor: 'pointer', background: active ? C_TEXT_PRIMARY : 'transparent',
          fontSize:14, color: active ? '#fff' : C_TEXT_PRIMARY, lineHeight:'20px', flexShrink:0,
        }}
      >
        {p}
      </div>
    )
  }

  const NavBtn = ({ dir }: { dir: 'first'|'last' }) => (
    <div
      onClick={() => onPageChange(dir === 'first' ? 1 : totalPages)}
      style={{ width:20, height:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: C_TEXT_LABEL, flexShrink:0 }}
    >
      {dir === 'first'
        ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8 5l-5 5 5 5M4 10h12M13 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 5l5 5-5 5M16 10H4M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      }
    </div>
  )

  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 16px', background:'#fff', flexShrink:0 }}>
      {/* Page size */}
      <div
        style={{
          display:'flex', alignItems:'center', gap:12, padding:'6px 12px',
          border:`1px solid ${C_BORDER}`, borderRadius:6, cursor:'pointer', flexShrink:0,
        }}
        onClick={() => onPageSizeChange(pageSize === 50 ? 100 : 50)}
      >
        <span style={{ fontSize:14, color: C_TEXT_PRIMARY, whiteSpace:'nowrap' }}>Hiển thị {pageSize}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5l5 5 5-5" stroke={C_TEXT_LABEL} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>

      {/* Page numbers */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:24 }}>
        <NavBtn dir="first" />
        {pages.map((p, i) => <PageBtn key={i} p={p} />)}
        <NavBtn dir="last" />
      </div>

      {/* Go to page */}
      <span style={{ fontSize:14, color: C_TEXT_PRIMARY, whiteSpace:'nowrap', flexShrink:0 }}>Đến trang</span>
      <div style={{ border:`1px solid ${C_BORDER}`, borderRadius:6, width:48, padding:'6px 12px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <input
          value={goTo}
          onChange={(e) => setGoTo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const n = parseInt(goTo)
              if (!isNaN(n) && n >= 1 && n <= totalPages) onPageChange(n)
            }
          }}
          style={{ width:'100%', border:'none', outline:'none', textAlign:'center', fontSize:14, color: C_TEXT_PRIMARY, background:'transparent' }}
        />
      </div>
    </div>
  )
}

// ── Export orders modal ─────────────────────────────────────
function ExportOrdersModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const today = new Date()
  const [preset, setPreset] = useState('this_week')
  const [[dateFrom, dateTo], setDateRange] = useState<[string, string]>(
    () => computePresetRange('this_week', today) ?? [fmtDateInput(today), fmtDateInput(today)]
  )
  const [carrierKeys, setCarrierKeys] = useState<Set<string>>(new Set(CARRIER_OPTIONS.map((c) => c.key)))
  const [statusKeys, setStatusKeys] = useState<Set<string>>(new Set(STATUS_GROUPS.map((g) => g.key)))
  const [shopIds, setShopIds] = useState<Set<string>>(new Set(shops.map((s) => s.id)))

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

  const allCarrierKeys = CARRIER_OPTIONS.map((c) => c.key)
  const allStatusKeys = STATUS_GROUPS.map((g) => g.key)
  const allShopIds = shops.map((s) => s.id)

  const handleDownload = () => {
    const selectedRawStatuses = new Set(STATUS_GROUPS.filter((g) => statusKeys.has(g.key)).flatMap((g) => g.match))
    const orders = allOrders.filter((o) => {
      if (!shopIds.has(o.shopId)) return false
      if (dateFrom && o.createdAt < dateFrom) return false
      if (dateTo && o.createdAt > dateTo) return false
      if (!selectedRawStatuses.has(o.status)) return false
      const matchesCarrier = CARRIER_OPTIONS.some((c) => carrierKeys.has(c.key) && o.trackingCode.startsWith(c.prefix))
      if (!matchesCarrier) return false
      return true
    })
    downloadXlsx(`don-hang-${dateFrom}_${dateTo}.xlsx`, EXPORT_HEADERS, buildExportRows(orders))
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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: 560, maxHeight: '90vh', background: '#fff', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C_TEXT_PRIMARY }}>Xuất đơn hàng</span>
          <CloseOutlined style={{ fontSize: 16, color: C_TEXT_SECONDARY, cursor: 'pointer' }} onClick={onClose} />
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Date range */}
          <div>
            <div style={sectionLabelStyle}>Thời gian tạo đơn hàng</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <input type="date" value={dateFrom} onChange={(e) => { setDateRange([e.target.value, dateTo]); setPreset('custom') }} style={dateInputStyle} />
              <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>đến</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateRange([dateFrom, e.target.value]); setPreset('custom') }} style={dateInputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              {[0, 1].map((col) => (
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  {DATE_PRESETS.filter((_, i) => i % 2 === col).map((p) => (
                    <div key={p.key} style={optionRowStyle} onClick={() => selectPreset(p.key)}>
                      <RadioDot checked={preset === p.key} />
                      <span style={optionLabelStyle}>{p.label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Carrier */}
          <div>
            <div style={sectionLabelStyle}>Nhà vận chuyển</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={optionRowStyle} onClick={() => toggleAllIn(allCarrierKeys, carrierKeys, setCarrierKeys)}>
                <Checkbox checked={carrierKeys.size === allCarrierKeys.length} />
                <span style={optionLabelStyle}>Tất cả</span>
              </div>
              {CARRIER_OPTIONS.map((c) => (
                <div key={c.key} style={optionRowStyle} onClick={() => toggleOneIn(carrierKeys, c.key, setCarrierKeys)}>
                  <Checkbox checked={carrierKeys.has(c.key)} />
                  <span style={optionLabelStyle}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <div style={sectionLabelStyle}>Trạng thái đơn hàng</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={optionRowStyle} onClick={() => toggleAllIn(allStatusKeys, statusKeys, setStatusKeys)}>
                <Checkbox checked={statusKeys.size === allStatusKeys.length} />
                <span style={optionLabelStyle}>Tất cả</span>
              </div>
              <div style={{ display: 'flex', gap: 32 }}>
                {[0, 1].map((col) => (
                  <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {STATUS_GROUPS.filter((_, i) => i % 2 === col).map((g) => (
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

          {/* Shop */}
          <div>
            <div style={sectionLabelStyle}>Shop</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={optionRowStyle} onClick={() => toggleAllIn(allShopIds, shopIds, setShopIds)}>
                <Checkbox checked={shopIds.size === allShopIds.length} />
                <span style={optionLabelStyle}>Tất cả ({shops.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 180, overflowY: 'auto' }}>
                {shops.map((s) => (
                  <div key={s.id} style={optionRowStyle} onClick={() => toggleOneIn(shopIds, s.id, setShopIds)}>
                    <Checkbox checked={shopIds.has(s.id)} />
                    <span style={optionLabelStyle}>{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
const SHOP_PORTAL_URL = `${window.location.origin}/shop/login`

export default function Shops() {
  const navigate = useNavigate()
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(50)
  const [copied, setCopied]       = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)

  const copyPortalUrl = () => {
    navigator.clipboard.writeText(SHOP_PORTAL_URL).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = shops.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search)
  )
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allChecked = paginated.length > 0 && paginated.every((s) => selected.has(s.id))

  const toggleAll = () => {
    const next = new Set(selected)
    if (allChecked) paginated.forEach((s) => next.delete(s.id))
    else            paginated.forEach((s) => next.add(s.id))
    setSelected(next)
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 40px)', background:'#fff' }}>

        {/* Page header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', flexShrink:0 }}>
          <div style={{ flex:'1 0 0', display:'flex', flexDirection:'column', gap:4 }}>
            <h1 style={{ fontSize:24, fontWeight:600, color: C_TEXT_PRIMARY, margin:0, lineHeight:'28px' }}>
              Quản lý shop
            </h1>
            <p style={{ fontSize:14, color: C_TEXT_SECONDARY, margin:0, lineHeight:'20px' }}>
              Quản lý tất cả shop trực thuộc đại lý
            </p>
          </div>
          <button
            onClick={() => setExportModalOpen(true)}
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
              background:'#fff', border:`1px solid ${C_BORDER}`, borderRadius:6, cursor:'pointer', flexShrink:0,
            }}
          >
            <DownloadOutlined style={{ color: C_TEXT_PRIMARY, fontSize:16 }} />
            <span style={{ fontSize:14, fontWeight:600, color: C_TEXT_PRIMARY, whiteSpace:'nowrap' }}>Xuất đơn hàng</span>
          </button>
          <button
            onClick={() => navigate('/agency-admin/shops/create')}
            style={{
              display:'flex', alignItems:'center', gap:12, padding:'8px 12px',
              background: C_ACTION, border:'none', borderRadius:6, cursor:'pointer', flexShrink:0,
            }}
          >
            <PlusOutlined style={{ color:'#fff', fontSize:16 }} />
            <span style={{ fontSize:14, fontWeight:600, color:'#fff', whiteSpace:'nowrap' }}>Tạo shop mới</span>
          </button>
        </div>

        {/* Shop portal URL banner */}
        <div style={{
          margin: '0 16px 8px',
          padding: '10px 14px',
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
        }}>
          <LinkOutlined style={{ fontSize: 15, color: '#3B82F6', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#1E40AF', flexShrink: 0 }}>Link đăng nhập shop:</span>
          <a
            href={SHOP_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 13, color: '#3B82F6', fontWeight: 600, textDecoration: 'none', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {SHOP_PORTAL_URL}
          </a>
          <div
            onClick={copyPortalUrl}
            style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', flexShrink: 0, padding: '3px 10px', borderRadius: 5, background: copied ? '#D1FAE5' : '#DBEAFE', border: `1px solid ${copied ? '#6EE7B7' : '#93C5FD'}` }}
          >
            {copied
              ? <CheckOutlined style={{ fontSize: 13, color: '#059669' }} />
              : <CopyOutlined style={{ fontSize: 13, color: '#3B82F6' }} />
            }
            <span style={{ fontSize: 12, fontWeight: 600, color: copied ? '#059669' : '#3B82F6' }}>
              {copied ? 'Đã copy' : 'Copy'}
            </span>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding:'8px 16px', flexShrink:0 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:12, padding:'8px 12px',
            background:'#fff', border:`1px solid ${C_BORDER}`, borderRadius:6,
          }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize:16, flexShrink:0 }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm kiếm"
              style={{ flex:1, border:'none', outline:'none', fontSize:14, color: C_TEXT_PRIMARY,
                background:'transparent', lineHeight:'20px' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ flex:'1 0 0', overflow:'hidden', padding:'0 16px' }}>
          <div style={{ height:'100%', overflowY:'auto', overflowX:'auto' }}>
            <div style={{ minWidth: 800 }}>
              <THead allChecked={allChecked} onToggleAll={toggleAll} />
              <div style={{ height:1, background: C_BORDER }} />
              {paginated.map((shop) => (
                <TRow
                  key={shop.id}
                  shop={shop}
                  checked={selected.has(shop.id)}
                  onToggle={() => toggleOne(shop.id)}
                  onClick={() => navigate(`/agency-admin/shops/${shop.id}`)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div style={{ borderTop:`1px solid ${C_BORDER}` }}>
          <Pagination
            page={page}
            total={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        </div>
      </div>

      <ExportOrdersModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />
    </ConfigProvider>
  )
}
