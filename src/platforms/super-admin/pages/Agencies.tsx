import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
import {
  agenciesList,
  shopConnections, carrierRequests,
  approveShopConnection, rejectShopConnection,
  approveCarrierRequest, rejectCarrierRequest,
} from '../agencyStore'

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

const CARRIER_COLOR: Record<string, string> = {
  GHN: '#EF4444',
  '247Express': '#8B5CF6',
}

const SERVICES_247 = [
  { code: 'CPN247',   name: 'Chuyển phát nhanh' },
  { code: 'CPDB247',  name: 'Chuyển phát đường bộ' },
  { code: 'CP55H247', name: 'Chuyển phát 55h' },
  { code: 'CPNQT247', name: 'Chuyển phát nhanh quốc tế' },
  { code: 'CPTQT247', name: 'Chuyển phát tiết kiệm quốc tế' },
]

// ── Quick Approve Modal ───────────────────────────────────────
function QuickApproveModal({ agencyId, agencyName, onClose, onUpdate }: {
  agencyId: string; agencyName: string; onClose: () => void; onUpdate: () => void
}) {
  const [rejectingId, setRejectingId]           = useState<string | null>(null)
  const [rejectReason, setRejectReason]         = useState('')
  const [selectingServicesId, setSelectingServicesId] = useState<string | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>(SERVICES_247.map(s => s.code))

  const pendingShops    = shopConnections.filter(s => s.agencyId === agencyId && s.status === 'pending')
  const pendingCarriers = carrierRequests.filter(r => r.agencyId === agencyId && r.status === 'pending')
  const totalPending    = pendingShops.length + pendingCarriers.length

  function startReject(id: string) { setRejectingId(id); setRejectReason(''); setSelectingServicesId(null) }
  function cancelReject()          { setRejectingId(null); setRejectReason('') }

  function startSelectServices(id: string) {
    setSelectingServicesId(id)
    setSelectedServices(SERVICES_247.map(s => s.code))
    setRejectingId(null)
  }
  function cancelSelectServices() { setSelectingServicesId(null) }

  function toggleService(code: string) {
    setSelectedServices(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  function doApproveShop(id: string, carrier: string) {
    if (carrier === '247Express') {
      startSelectServices(id)
    } else {
      approveShopConnection(id)
      onUpdate()
    }
  }
  function doConfirmApproveShop247(id: string) {
    const services = SERVICES_247.filter(s => selectedServices.includes(s.code))
    approveShopConnection(id, services)
    setSelectingServicesId(null)
    onUpdate()
  }
  function doRejectShop(id: string) {
    rejectShopConnection(id, rejectReason); cancelReject(); onUpdate()
  }
  function doApproveCarrier(id: string) {
    approveCarrierRequest(id); onUpdate()
  }
  function doRejectCarrier(id: string) {
    rejectCarrierRequest(id, rejectReason); cancelReject(); onUpdate()
  }

  function CarrierBadge({ carrier }: { carrier: string }) {
    const color = CARRIER_COLOR[carrier] ?? C_TEXT_SECONDARY
    return (
      <span style={{
        background: color + '18', color,
        border: `1px solid ${color}40`,
        borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>
        {carrier}
      </span>
    )
  }

  function ActionButtons({ onApprove, onReject }: { onApprove: () => void; onReject: () => void }) {
    return (
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button
          onClick={onReject}
          style={{ background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '4px 10px', fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer' }}
        >
          Từ chối
        </button>
        <button
          onClick={onApprove}
          style={{ background: C_ACTION, border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
        >
          Duyệt
        </button>
      </div>
    )
  }

  function RejectInput({ onConfirm }: { onConfirm: () => void }) {
    return (
      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <input
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          placeholder="Lý do từ chối..."
          autoFocus
          style={{
            flex: 1, border: `1px solid ${C_BORDER}`, borderRadius: 4,
            padding: '6px 10px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none',
          }}
        />
        <button
          onClick={onConfirm}
          style={{ background: '#EF4444', border: 'none', borderRadius: 4, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', flexShrink: 0 }}
        >
          Xác nhận
        </button>
        <button
          onClick={cancelReject}
          style={{ background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '6px 10px', fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer', flexShrink: 0 }}
        >
          Hủy
        </button>
      </div>
    )
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 8, width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY, flex: 1 }}>Duyệt nhanh</span>
          <span style={{ fontSize: 14, color: C_LINK, fontWeight: 700 }}>{agencyName}</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C_TEXT_SECONDARY, lineHeight: 1, padding: '0 4px' }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {totalPending === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
              Không còn mục nào chờ duyệt
            </div>
          ) : (
            <>
              {/* Shop connections */}
              {pendingShops.length > 0 && (
                <div>
                  <div style={{ padding: '8px 20px 4px', fontSize: 12, fontWeight: 600, color: C_TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Kết nối Shop ({pendingShops.length})
                  </div>
                  {pendingShops.map(s => (
                    <div key={s.id} style={{ padding: '10px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CarrierBadge carrier={s.carrier} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {s.name}
                          </div>
                          <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
                            ID: {s.shopId} · {s.requestedAt}
                          </div>
                        </div>
                        {rejectingId === s.id || selectingServicesId === s.id
                          ? <button
                              onClick={() => rejectingId === s.id ? cancelReject() : cancelSelectServices()}
                              style={{ background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '4px 10px', fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer', flexShrink: 0 }}
                            >Hủy</button>
                          : <ActionButtons onApprove={() => doApproveShop(s.id, s.carrier)} onReject={() => startReject(s.id)} />
                        }
                      </div>

                      {/* Rejection input */}
                      {rejectingId === s.id && <RejectInput onConfirm={() => doRejectShop(s.id)} />}

                      {/* 247Express service selection */}
                      {selectingServicesId === s.id && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${C_BORDER}` }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C_TEXT_SECONDARY, marginBottom: 8 }}>
                            Chọn dịch vụ được phép sử dụng:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                            {SERVICES_247.map(svc => (
                              <label key={svc.code} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: C_TEXT_PRIMARY }}>
                                <input
                                  type="checkbox"
                                  checked={selectedServices.includes(svc.code)}
                                  onChange={() => toggleService(svc.code)}
                                  style={{ width: 14, height: 14, accentColor: C_ACTION, cursor: 'pointer' }}
                                />
                                {svc.name}
                              </label>
                            ))}
                          </div>
                          <button
                            onClick={() => doConfirmApproveShop247(s.id)}
                            disabled={selectedServices.length === 0}
                            style={{
                              background: selectedServices.length > 0 ? C_ACTION : '#D1D5DB',
                              border: 'none', borderRadius: 4, padding: '6px 14px',
                              fontSize: 12, fontWeight: 600, color: '#fff',
                              cursor: selectedServices.length > 0 ? 'pointer' : 'not-allowed',
                            }}
                          >
                            Duyệt {selectedServices.length} dịch vụ
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Carrier activation requests */}
              {pendingCarriers.length > 0 && (
                <div>
                  <div style={{ padding: '8px 20px 4px', fontSize: 12, fontWeight: 600, color: C_TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Kích hoạt ĐVVC ({pendingCarriers.length})
                  </div>
                  {pendingCarriers.map(r => (
                    <div key={r.id} style={{ padding: '10px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CarrierBadge carrier={r.carrier} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>
                            Kích hoạt {r.carrier}
                          </div>
                          <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
                            {r.requestedAt}{r.note ? ` · ${r.note}` : ''}
                          </div>
                        </div>
                        {rejectingId === r.id
                          ? null
                          : <ActionButtons onApprove={() => doApproveCarrier(r.id)} onReject={() => startReject(r.id)} />
                        }
                      </div>
                      {rejectingId === r.id && <RejectInput onConfirm={() => doRejectCarrier(r.id)} />}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${C_BORDER}`, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{ background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '7px 16px', fontSize: 14, color: C_TEXT_PRIMARY, cursor: 'pointer' }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
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
      {cell('Chờ duyệt',    '0 0 160px', 160)}
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
      {/* Chờ duyệt */}
      <div style={{ flex: '0 0 160px', minWidth: 160, padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {pendingCount > 0 ? (
          <>
            <span style={{
              background: '#FFF4ED', color: C_ACTION,
              border: '1px solid #FFD5BB',
              borderRadius: 100, padding: '2px 8px',
              fontSize: 12, fontWeight: 600, flexShrink: 0,
            }}>
              {pendingCount}
            </span>
            <button
              onClick={e => { e.stopPropagation(); onQuickApprove() }}
              style={{
                background: C_ACTION, border: 'none', borderRadius: 4,
                padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#fff',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              Duyệt
            </button>
          </>
        ) : (
          <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>—</span>
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
  const [modalAgency, setModalAgency] = useState<{ id: string; name: string } | null>(null)
  const [tick, setTick]           = useState(0)

  const agencies = agenciesList.map((a) => ({
    ...a,
    cod:     a.totalOrders * 35_000,
    revenue: Math.round(a.totalOrders * 35_000 * 0.028),
  }))

  // Recomputes whenever tick changes (after approve/reject mutations)
  const pendingByAgency = useMemo(() => {
    const map: Record<string, number> = {}
    shopConnections.filter(s => s.status === 'pending').forEach(s => {
      map[s.agencyId] = (map[s.agencyId] || 0) + 1
    })
    carrierRequests.filter(r => r.status === 'pending').forEach(r => {
      map[r.agencyId] = (map[r.agencyId] || 0) + 1
    })
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

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

      {/* Quick Approve Modal */}
      {modalAgency && (
        <QuickApproveModal
          agencyId={modalAgency.id}
          agencyName={modalAgency.name}
          onClose={() => setModalAgency(null)}
          onUpdate={() => setTick(t => t + 1)}
        />
      )}
    </ConfigProvider>
  )
}
