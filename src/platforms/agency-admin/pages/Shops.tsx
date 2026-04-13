import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { agencyAdminTheme } from '../../../theme/platforms'
import allShops from '../../../mock-data/shops.json'

// ── Design tokens (from Figma) ──────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_LINK           = '#3B82F6'   // shop name — blue per Figma
const C_ACTION         = '#FF5200'   // buttons
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'
const C_BG_ACTIVE      = '#FFF4ED'

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
    <>
      <div
        style={{
          display: 'flex', alignItems: 'center', cursor: 'pointer',
          background: hover ? '#FAFAFA' : '#fff',
          transition: 'background 0.1s',
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
          <span style={{ fontSize:14, fontWeight:700, color: C_LINK, lineHeight:'20px' }}>{shop.name}</span>
          <span style={{ fontSize:12, color: C_TEXT_SECONDARY, lineHeight:'16px' }}>{shop.id}</span>
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
      <div style={{ height:1, background: C_BORDER }} />
    </>
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

// ── Main page ─────────────────────────────────────────────────
export default function Shops() {
  const navigate = useNavigate()
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState<Set<string>>(new Set())
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(50)

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
        <div style={{ flex:'1 0 0', overflowY:'auto', paddingLeft:16 }}>
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
    </ConfigProvider>
  )
}
