import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
import { agenciesList } from '../agencyStore'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_ACTION         = '#FF5200'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// ── Data ─────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (n >= 1_000_000)     return Math.round(n / 1_000_000) + 'M'
  return n.toLocaleString()
}

// ── Table header ─────────────────────────────────────────────
function THead() {
  const cell = (label: string, flex = '1 0 0', minWidth = 160, align: 'left' | 'right' = 'left') => (
    <div style={{ display: 'flex', flex, alignItems: 'center', minWidth, padding: '6px 8px' }}>
      <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, textAlign: align, lineHeight: '20px' }}>
        {label}
      </span>
    </div>
  )
  return (
    <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
      {cell('Đại lý',        '1 0 0', 240)}
      {cell('Chủ đại lý',   '1 0 0', 160)}
      {cell('Số shop',       '1 0 0', 160, 'right')}
      {cell('Đơn hàng',     '1 0 0', 160, 'right')}
      {cell('Tổng COD (₫)', '1 0 0', 160, 'right')}
      {cell('Doanh thu (₫)','1 0 0', 160, 'right')}
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────
type Agency = (typeof agenciesList[0]) & { cod: number; revenue: number }
function TRow({ agency, onClick }: { agency: Agency; onClick: () => void }) {
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
        {/* Đại lý */}
        <div style={{ flex: '1 0 0', minWidth: 240, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px' }}>{agency.name}</span>
          <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, lineHeight: '16px' }}>{agency.code}</span>
        </div>
        {/* Chủ đại lý */}
        <div style={{ flex: '1 0 0', minWidth: 160, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{agency.representative}</span>
          <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, lineHeight: '16px' }}>{agency.phone}</span>
        </div>
        {/* Số shop */}
        <div style={{ flex: '1 0 0', minWidth: 160, padding: '6px 8px', textAlign: 'right' }}>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{agency.totalShops.toLocaleString()}</span>
        </div>
        {/* Đơn hàng */}
        <div style={{ flex: '1 0 0', minWidth: 160, padding: '6px 8px', textAlign: 'right' }}>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{agency.totalOrders.toLocaleString()}</span>
        </div>
        {/* Tổng COD */}
        <div style={{ flex: '1 0 0', minWidth: 160, padding: '6px 8px', textAlign: 'right' }}>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{fmt(agency.cod)}</span>
        </div>
        {/* Doanh thu */}
        <div style={{ flex: '1 0 0', minWidth: 160, padding: '6px 8px', textAlign: 'right' }}>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{fmt(agency.revenue)}</span>
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
      {/* Page size */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px',
          border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
        }}
        onClick={() => onPageSizeChange(pageSize === 50 ? 100 : 50)}
      >
        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap' }}>Hiển thị {pageSize}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5l5 5 5-5" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>

      {/* Page numbers */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <NavBtn dir="first" />
        {pages.map((p, i) => <PageBtn key={i} p={p} />)}
        <NavBtn dir="last" />
      </div>

      {/* Go to page */}
      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>Đến trang</span>
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
export default function Agencies() {
  const navigate = useNavigate()
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(50)

  // Compute from store on every mount so newly created agencies appear
  const agencies = agenciesList.map((a) => ({
    ...a,
    cod:     a.totalOrders * 35_000,
    revenue: Math.round(a.totalOrders * 35_000 * 0.028),
  }))

  const filtered = agencies.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <ConfigProvider theme={superAdminTheme}>
<div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
              Đại lý
            </h1>
            <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
              Danh sách quản lý tất cả đại lý
            </p>
          </div>
          <button
            onClick={() => navigate('/super-admin/agencies/create')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
              background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <PlusOutlined style={{ color: '#fff', fontSize: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Tạo đại lý mới</span>
          </button>
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
              style={{
                flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY,
                background: 'transparent', lineHeight: '20px',
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: '1 0 0', overflow: 'hidden', padding: '0 16px' }}>
          <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
            <div style={{ minWidth: 800 }}>
              <THead />
              <div style={{ height: 1, background: C_BORDER }} />
              {paginated.map((agency) => (
                <TRow
                  key={agency.id}
                  agency={agency}
                  onClick={() => navigate(`/super-admin/agencies/${agency.id}`)}
                />
              ))}
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
    </ConfigProvider>
  )
}
