import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
import { agenciesList, shopConnections, carrierRequests } from '../agencyStore'
import AgencyRequestsView from '../components/AgencyRequestsView'
import { Pagination } from '../components/ApprovalWidgets'

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
      {cell('Yêu cầu',      '0 0 160px', 160)}
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────
type Agency = (typeof agenciesList[0]) & { cod: number; revenue: number }
function TRow({ agency, onClick, pendingCount, onQuickApprove }: {
  agency: Agency; onClick: () => void; pendingCount: number; onQuickApprove: () => void
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
      {/* Đại lý */}
      <div style={{ flex: '1 0 0', minWidth: 240, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {pendingCount > 0 && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px' }}>{agency.name}</span>
        </div>
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
      {/* Yêu cầu */}
      <div style={{ flex: '0 0 160px', minWidth: 160, padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
        {pendingCount > 0 ? (
          <button
            onClick={e => { e.stopPropagation(); onQuickApprove() }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', padding: 0,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C_LINK }}>Xem yêu cầu</span>
          </button>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onQuickApprove() }}
            style={{
              background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
              padding: '4px 10px', fontSize: 12, fontWeight: 500, color: C_TEXT_SECONDARY,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            Xem yêu cầu
          </button>
        )}
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
  const [modalAgency, setModalAgency] = useState<{ id: string; name: string } | null>(null)
  const [tick, setTick]           = useState(0)
  const [requestFilter, setRequestFilter] = useState<'all' | 'has' | 'none'>('all')

  const agencies = agenciesList.map((a) => ({
    ...a,
    cod:     a.totalOrders * 35_000,
    revenue: Math.round(a.totalOrders * 35_000 * 0.028),
  }))

  // Tính lại mỗi khi tick đổi (sau khi duyệt/từ chối trong modal)
  const pendingByAgency = useMemo(() => {
    const map: Record<string, number> = {}
    shopConnections.filter(s => s.status === 'pending' && s.carrier === 'GHN').forEach(s => {
      map[s.agencyId] = (map[s.agencyId] || 0) + 1
    })
    carrierRequests.filter(r => r.status === 'pending').forEach(r => {
      map[r.agencyId] = (map[r.agencyId] || 0) + 1
    })
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  const filtered = agencies.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
    const hasPending = (pendingByAgency[a.id] ?? 0) > 0
    const matchesRequestFilter =
      requestFilter === 'all' ? true : requestFilter === 'has' ? hasPending : !hasPending
    return matchesSearch && matchesRequestFilter
  })
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', flexShrink: 0 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
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
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, flexShrink: 0,
          }}>
            <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>Yêu cầu:</span>
            <select
              value={requestFilter}
              onChange={(e) => { setRequestFilter(e.target.value as typeof requestFilter); setPage(1) }}
              style={{
                border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY,
                background: 'transparent', cursor: 'pointer',
              }}
            >
              <option value="all">Tất cả</option>
              <option value="has">Có yêu cầu</option>
              <option value="none">Không có yêu cầu</option>
            </select>
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
                  pendingCount={pendingByAgency[agency.id] ?? 0}
                  onQuickApprove={() => setModalAgency({ id: agency.id, name: agency.name })}
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

      {modalAgency && (
        <AgencyRequestsView
          agencyId={modalAgency.id}
          agencyName={modalAgency.name}
          onClose={() => setModalAgency(null)}
          onUpdate={() => setTick(t => t + 1)}
        />
      )}
    </ConfigProvider>
  )
}
