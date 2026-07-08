import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
import {
  agenciesList, shopConnections, carrierRequests, clientHubs247,
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

// ── Carrier badge ──────────────────────────────────────────────
function CarrierBadge({ carrier }: { carrier: string }) {
  const map: Record<string, string> = { GHN: '#EF4444', '247Express': '#8B5CF6' }
  const color = map[carrier] ?? C_TEXT_SECONDARY
  return (
    <span style={{
      background: color + '18', color,
      border: `1px solid ${color}40`,
      borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, flexShrink: 0,
    }}>
      {carrier}
    </span>
  )
}

// ── Reject reason input — bắt buộc nhập lý do, tối đa 500 ký tự ────────────────
function RejectInput({ onConfirm, onCancel }: { onConfirm: (r: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  const trimmed = reason.trim()
  return (
    <div style={{ padding: '8px 12px', background: '#FFF9F9', borderTop: `1px solid #FCA5A5`, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={reason}
          onChange={e => setReason(e.target.value.slice(0, 500))}
          placeholder="Nhập lý do từ chối (bắt buộc)..."
          autoFocus
          style={{ flex: 1, border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '5px 10px', fontSize: 13, outline: 'none', color: C_TEXT_PRIMARY }}
        />
        <button
          onClick={() => trimmed && onConfirm(trimmed)}
          disabled={!trimmed}
          style={{ background: trimmed ? '#EF4444' : '#D1D5DB', border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: trimmed ? 'pointer' : 'not-allowed', flexShrink: 0 }}
        >
          Xác nhận
        </button>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '5px 10px', fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer', flexShrink: 0 }}
        >
          Huỷ
        </button>
      </div>
      <span style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>{reason.length}/500</span>
    </div>
  )
}

// ── Chọn ClientHubID khi duyệt kích hoạt/cấp thêm 247Express ───────────────────
// 247Express hiện chỉ còn 1 dịch vụ (DE — Chuyển phát nhanh) nên bỏ bước chọn dịch
// vụ, duyệt luôn thẳng vào chọn địa điểm gửi hàng.
function CarrierApprovalForm({ agencyName, excludeHubIds, requestedHubIds, onConfirm, onReject, onCancel }: {
  agencyName: string
  excludeHubIds?: string[]
  requestedHubIds?: string[]
  onConfirm: (hubIds: string[], serviceIds: string[]) => void
  onReject: () => void
  onCancel: () => void
}) {
  const [selectedHubs, setSelectedHubs] = useState<string[]>(requestedHubIds ?? [])

  const availableHubs = clientHubs247.filter(h => !(excludeHubIds ?? []).includes(h.id))

  const toggleHub = (id: string) =>
    setSelectedHubs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const CheckRow = ({ label, sub, checked, onToggle, mono }: {
    label: string; sub?: string; checked: boolean; onToggle: () => void; mono?: boolean
  }) => (
    <div
      onClick={onToggle}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', cursor: 'pointer', background: checked ? '#EDE9FE' : '#fff', borderBottom: `1px solid #F3F4F6` }}
    >
      <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: checked ? 'none' : `1.5px solid #C4B5FD`, background: checked ? '#8B5CF6' : '#fff' }}>
        {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 3.5L3.8 6.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: checked ? 600 : 400, color: mono ? '#7C3AED' : C_TEXT_PRIMARY, fontFamily: mono ? 'monospace' : 'inherit' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C_TEXT_SECONDARY, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )

  return (
    <div style={{ padding: '12px 12px 10px', background: '#F5F3FF', borderTop: `1px solid #C4B5FD` }}>
      <div style={{ fontSize: 13, color: '#5B21B6', fontWeight: 600, marginBottom: 10 }}>
        {requestedHubIds ? 'Chọn địa điểm gửi hàng cho' : 'Chọn Địa điểm gửi hàng cho'} <span style={{ color: C_LINK }}>{agencyName}</span>
      </div>
      <div style={{ maxHeight: 220, overflowY: 'auto', border: `1px solid #C4B5FD`, borderRadius: 8, background: '#fff', marginBottom: 10 }}>
        {availableHubs.length === 0 ? (
          <div style={{ padding: '14px', textAlign: 'center', fontSize: 12, color: C_TEXT_SECONDARY }}>Đại lý đã được cấp toàn bộ Hub hiện có.</div>
        ) : availableHubs.map(hub => (
          <CheckRow key={hub.id} label={hub.id} sub={`${hub.name} — 📍 ${hub.location}`} checked={selectedHubs.includes(hub.id)} onToggle={() => toggleHub(hub.id)} mono />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onReject} style={{ padding: '6px 14px', background: 'none', border: `1px solid #FCA5A5`, borderRadius: 6, fontSize: 12, color: '#DC2626', cursor: 'pointer' }}>Từ chối</button>
        <button onClick={onCancel} style={{ padding: '6px 14px', background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer' }}>Huỷ</button>
        <button
          onClick={() => selectedHubs.length > 0 && onConfirm(selectedHubs, ['DE'])}
          disabled={selectedHubs.length === 0}
          style={{ padding: '6px 18px', background: selectedHubs.length > 0 ? '#8B5CF6' : '#D1D5DB', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#fff', cursor: selectedHubs.length > 0 ? 'pointer' : 'not-allowed' }}
        >
          Duyệt ({selectedHubs.length} hub)
        </button>
      </div>
    </div>
  )
}

// ── Duyệt nhanh modal — gộp toàn bộ yêu cầu (Shop ID GHN + 247Express) của 1 đại lý ──
function QuickApproveModal({ agencyId, agencyName, onClose, onUpdate }: {
  agencyId: string; agencyName: string; onClose: () => void; onUpdate: () => void
}) {
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const agency = agenciesList.find(a => a.id === agencyId)
  const pendingShops    = shopConnections.filter(s => s.agencyId === agencyId && s.status === 'pending' && s.carrier === 'GHN')
  const pendingCarriers = carrierRequests.filter(r => r.agencyId === agencyId && r.status === 'pending')
  const totalPending    = pendingShops.length + pendingCarriers.length

  const handleApproveShop = (id: string) => { approveShopConnection(id); onUpdate() }
  const handleRejectShop = (id: string, reason: string) => { rejectShopConnection(id, reason); setRejectingId(null); onUpdate() }
  const handleApproveCarrier = (id: string, hubIds: string[], serviceIds: string[]) => { approveCarrierRequest(id, hubIds, serviceIds); setApprovingId(null); onUpdate() }
  const handleRejectCarrier = (id: string, reason: string) => { rejectCarrierRequest(id, reason); setRejectingId(null); onUpdate() }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 8, width: 620, maxHeight: '82vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY, flex: 1 }}>Duyệt nhanh</span>
          <span style={{ fontSize: 14, color: C_LINK, fontWeight: 700 }}>{agencyName}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: C_TEXT_SECONDARY, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {totalPending === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
              Không còn mục nào chờ duyệt
            </div>
          ) : (
            <>
              {pendingShops.length > 0 && (
                <div>
                  <div style={{ padding: '8px 20px 4px', fontSize: 12, fontWeight: 600, color: C_TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Kết nối Shop ID GHN ({pendingShops.length})
                  </div>
                  {pendingShops.map(s => {
                    const isRejecting = rejectingId === s.id
                    return (
                      <div key={s.id} style={{ padding: '10px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <CarrierBadge carrier={s.carrier} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>ID: {s.shopId} · {s.requestedAt}</div>
                          </div>
                          {!isRejecting && (
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              <button onClick={() => handleApproveShop(s.id)} style={{ background: C_ACTION, border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Duyệt</button>
                              <button onClick={() => setRejectingId(s.id)} style={{ background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '4px 10px', fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer' }}>Từ chối</button>
                            </div>
                          )}
                        </div>
                        {isRejecting && <RejectInput onConfirm={r => handleRejectShop(s.id, r)} onCancel={() => setRejectingId(null)} />}
                      </div>
                    )
                  })}
                </div>
              )}

              {pendingCarriers.length > 0 && (
                <div>
                  <div style={{ padding: '8px 20px 4px', fontSize: 12, fontWeight: 600, color: C_TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Yêu cầu 247Express ({pendingCarriers.length})
                  </div>
                  {pendingCarriers.map(r => {
                    const isRejecting = rejectingId === r.id
                    const isApproving = approvingId === r.id
                    return (
                      <div key={r.id} style={{ padding: '10px 20px', borderBottom: `1px solid ${C_BORDER}`, background: isApproving ? '#FAFAFF' : 'transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <CarrierBadge carrier={r.carrier} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>Kích hoạt / cấp thêm hub {r.carrier}</div>
                            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>{r.requestedAt}{r.note ? ` · ${r.note}` : ''}</div>
                            {r.requestedHubIds && r.requestedHubIds.length > 0 && (
                              <div style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>
                                Địa điểm được yêu cầu: {r.requestedHubIds.map(id => clientHubs247.find(h => h.id === id)?.name ?? id).join(', ')}
                              </div>
                            )}
                          </div>
                          {!isRejecting && !isApproving && (
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              <button onClick={() => setApprovingId(r.id)} style={{ background: '#8B5CF6', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Duyệt</button>
                              <button onClick={() => setRejectingId(r.id)} style={{ background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '4px 10px', fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer' }}>Từ chối</button>
                            </div>
                          )}
                        </div>
                        {isApproving && (
                          <CarrierApprovalForm
                            agencyName={agency?.name ?? r.agencyId}
                            excludeHubIds={agency?.clientHubIds}
                            requestedHubIds={r.requestedHubIds}
                            onConfirm={(hubIds, serviceIds) => handleApproveCarrier(r.id, hubIds, serviceIds)}
                            onReject={() => { setApprovingId(null); setRejectingId(r.id) }}
                            onCancel={() => setApprovingId(null)}
                          />
                        )}
                        {isRejecting && <RejectInput onConfirm={reason => handleRejectCarrier(r.id, reason)} onCancel={() => setRejectingId(null)} />}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${C_BORDER}`, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '7px 16px', fontSize: 14, color: C_TEXT_PRIMARY, cursor: 'pointer' }}>Đóng</button>
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
              Duyệt nhanh
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
