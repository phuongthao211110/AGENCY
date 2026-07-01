import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  shopConnections, carrierRequests, agenciesList, clientHubs247,
  approveShopConnection, rejectShopConnection,
  approveCarrierRequest, rejectCarrierRequest,
} from '../agencyStore'

const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_ACTION         = '#FF5200'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// ─── Shared sub-components ────────────────────────────────────────────────────

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

function RejectInput({ onConfirm, onCancel }: { onConfirm: (r: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  return (
    <div style={{ padding: '8px 12px', background: '#FFF9F9', borderTop: `1px solid #FCA5A5`, display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Nhập lý do từ chối..."
        autoFocus
        style={{ flex: 1, border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '5px 10px', fontSize: 13, outline: 'none', color: C_TEXT_PRIMARY }}
      />
      <button
        onClick={() => onConfirm(reason)}
        style={{ background: '#EF4444', border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', flexShrink: 0 }}
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
  )
}

// Inline form chọn clientHubId từ danh sách có sẵn khi duyệt 247Express
function ClientHubIdForm({ agencyName, onConfirm, onCancel }: {
  agencyName: string
  onConfirm: (clientHubId: string) => void
  onCancel: () => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? clientHubs247.find(h => h.id === selectedId) : null

  return (
    <div style={{ padding: '12px 12px 10px', background: '#F5F3FF', borderTop: `1px solid #C4B5FD` }}>
      <div style={{ fontSize: 13, color: '#5B21B6', fontWeight: 600, marginBottom: 10 }}>
        Chọn Mã điểm lấy hàng (Client Hub ID) cho <span style={{ color: C_LINK }}>{agencyName}</span>
      </div>

      {/* Scrollable hub list */}
      <div style={{ maxHeight: 280, overflowY: 'auto', border: `1px solid #C4B5FD`, borderRadius: 8, background: '#fff', marginBottom: 10 }}>
        {clientHubs247.map((hub, idx) => {
          const isSelected = selectedId === hub.id
          return (
            <div
              key={hub.id}
              onClick={() => setSelectedId(hub.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px',
                cursor: 'pointer',
                background: isSelected ? '#EDE9FE' : '#fff',
                borderBottom: idx < clientHubs247.length - 1 ? `1px solid #E5E7EB` : 'none',
                transition: 'background 0.1s',
              }}
            >
              {/* Radio dot */}
              <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: isSelected ? 'none' : `1.5px solid #C4B5FD`, background: isSelected ? '#8B5CF6' : '#fff' }}>
                {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
              </div>
              {/* Hub ID */}
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#7C3AED', flexShrink: 0, minWidth: 116 }}>
                {hub.id}
              </span>
              {/* Name + Location stacked */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: C_TEXT_PRIMARY }}>
                  {hub.name}
                </div>
                <div style={{ fontSize: 11, color: C_TEXT_SECONDARY, marginTop: 1 }}>
                  📍 {hub.location}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {selected && (
          <span style={{ fontSize: 12, color: '#7C3AED', marginRight: 8 }}>
            Đã chọn: <strong style={{ fontFamily: 'monospace' }}>{selected.id}</strong> — {selected.location}
          </span>
        )}
        <button
          onClick={onCancel}
          style={{ padding: '6px 14px', background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer' }}
        >
          Huỷ
        </button>
        <button
          onClick={() => { if (selectedId) onConfirm(selectedId) }}
          disabled={!selectedId}
          style={{ padding: '6px 18px', background: selectedId ? '#8B5CF6' : '#D1D5DB', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#fff', cursor: selectedId ? 'pointer' : 'not-allowed' }}
        >
          Kích hoạt 247Express
        </button>
      </div>
    </div>
  )
}

// ─── Tab 1: Kết nối GHN (Shop ID) ────────────────────────────────────────────

function TabShopConnections({ onUpdate }: { onUpdate: () => void }) {
  const navigate = useNavigate()
  const [filterAgency, setFilterAgency] = useState('all')
  const [rejectingId, setRejectingId]   = useState<string | null>(null)

  const allPending = shopConnections.filter(s => s.status === 'pending' && s.carrier === 'GHN')
  const agencyIds  = [...new Set(allPending.map(s => s.agencyId))]
  const filtered   = allPending.filter(s => filterAgency === 'all' || s.agencyId === filterAgency)

  const handleApprove = (id: string) => {
    approveShopConnection(id)
    onUpdate()
  }

  const handleReject = (id: string, reason: string) => {
    rejectShopConnection(id, reason)
    setRejectingId(null)
    onUpdate()
  }

  const COLS = [
    { label: 'Đại lý',       flex: '2 0 0',    minW: 200 },
    { label: 'Tên cửa hàng', flex: '2 0 0',    minW: 200 },
    { label: 'Shop ID',      flex: '0 0 110px', minW: 110 },
    { label: 'SĐT',          flex: '0 0 130px', minW: 130 },
    { label: 'Ngày gửi',     flex: '0 0 100px', minW: 100 },
    { label: 'Thao tác',     flex: '0 0 170px', minW: 170 },
  ]

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px 8px', flexShrink: 0 }}>
        <div style={{ padding: '10px 16px', border: `1px solid ${allPending.length > 0 ? '#EF444440' : C_BORDER}`, borderRadius: 8, background: allPending.length > 0 ? '#EF444406' : '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CarrierBadge carrier="GHN" />
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Chờ duyệt:</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: allPending.length > 0 ? '#EF4444' : C_TEXT_SECONDARY }}>{allPending.length}</span>
        </div>
        <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, fontStyle: 'italic' }}>
          Duyệt kết nối Shop ID GHN của cửa hàng với đại lý
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 10px', flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Đại lý:</span>
        <select value={filterAgency} onChange={e => setFilterAgency(e.target.value)}
          style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '5px 10px', fontSize: 13, background: '#fff', outline: 'none', cursor: 'pointer', color: C_TEXT_PRIMARY }}>
          <option value="all">Tất cả</option>
          {agencyIds.map(id => {
            const a = agenciesList.find(x => x.id === id)
            return <option key={id} value={id}>{a?.name ?? id}</option>
          })}
        </select>
      </div>

      {/* Table */}
      <div style={{ flex: '1 0 0', overflow: 'hidden', padding: '0 16px' }}>
        <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
          <div style={{ minWidth: 800 }}>
            <div style={{ display: 'flex', background: C_BG_HEADER }}>
              {COLS.map((col, i) => (
                <div key={i} style={{ flex: col.flex, minWidth: col.minW, padding: '6px 10px', fontSize: 13, color: C_TEXT_SECONDARY }}>
                  {col.label}
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: C_BORDER }} />

            {filtered.length === 0 ? (
              <div style={{ padding: '56px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                Không có yêu cầu kết nối GHN nào chờ duyệt
              </div>
            ) : filtered.map(conn => {
              const agency      = agenciesList.find(a => a.id === conn.agencyId)
              const isRejecting = rejectingId === conn.id
              return (
                <div key={conn.id}>
                  <div style={{ display: 'flex', alignItems: 'center', background: '#fff' }}>
                    <div style={{ flex: '2 0 0', minWidth: 200, padding: '10px 10px' }}>
                      <span onClick={() => navigate(`/super-admin/agencies/${conn.agencyId}`)}
                        style={{ fontSize: 14, fontWeight: 700, color: C_LINK, cursor: 'pointer' }}>
                        {agency?.name ?? conn.agencyId}
                      </span>
                      <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 1 }}>{conn.agencyId}</div>
                    </div>
                    <div style={{ flex: '2 0 0', minWidth: 200, padding: '10px 10px', fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conn.name}
                    </div>
                    <div style={{ flex: '0 0 110px', minWidth: 110, padding: '10px 10px', fontFamily: 'monospace', fontSize: 13, color: C_TEXT_SECONDARY }}>
                      {conn.shopId}
                    </div>
                    <div style={{ flex: '0 0 130px', minWidth: 130, padding: '10px 10px', fontSize: 13, color: C_TEXT_PRIMARY }}>
                      {conn.phone}
                    </div>
                    <div style={{ flex: '0 0 100px', minWidth: 100, padding: '10px 10px', fontSize: 12, color: C_TEXT_SECONDARY }}>
                      {conn.requestedAt}
                    </div>
                    <div style={{ flex: '0 0 170px', minWidth: 170, padding: '10px 10px', display: 'flex', gap: 6 }}>
                      {!isRejecting && (
                        <>
                          <button onClick={() => handleApprove(conn.id)}
                            style={{ padding: '5px 14px', background: C_ACTION, border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                            Duyệt
                          </button>
                          <button onClick={() => setRejectingId(conn.id)}
                            style={{ padding: '5px 10px', background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 5, fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer' }}>
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {isRejecting && (
                    <RejectInput
                      onConfirm={r => handleReject(conn.id, r)}
                      onCancel={() => setRejectingId(null)}
                    />
                  )}
                  <div style={{ height: 1, background: C_BORDER }} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Tab 2: Kích hoạt 247Express (cần phân clientHubId cho agency) ───────────

function TabCarrierRequests({ onUpdate }: { onUpdate: () => void }) {
  const navigate = useNavigate()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const pending = carrierRequests.filter(r => r.status === 'pending')

  const handleApprove247 = (id: string, clientHubId: string) => {
    approveCarrierRequest(id, clientHubId)
    setApprovingId(null)
    onUpdate()
  }

  const handleReject = (id: string, reason: string) => {
    rejectCarrierRequest(id, reason)
    setRejectingId(null)
    onUpdate()
  }

  const COLS = [
    { label: 'Đại lý',   flex: '2 0 0',    minW: 200 },
    { label: 'NVC',      flex: '0 0 120px', minW: 120 },
    { label: 'Ghi chú',  flex: '3 0 0',    minW: 220 },
    { label: 'Ngày gửi', flex: '0 0 100px', minW: 100 },
    { label: 'Thao tác', flex: '0 0 170px', minW: 170 },
  ]

  return (
    <>
      {/* Info banner */}
      <div style={{ margin: '12px 16px 2px', padding: '10px 14px', background: '#F5F3FF', border: '1px solid #C4B5FD', borderRadius: 8, display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 16, lineHeight: '22px', flexShrink: 0 }}>💡</span>
        <div style={{ fontSize: 13, color: '#5B21B6', lineHeight: '20px' }}>
          Khi duyệt kích hoạt 247Express cho đại lý, cần phân <strong>Mã điểm lấy hàng (Client Hub ID)</strong> cho đại lý đó. Mã này xác định hub thu gom hàng 247Express tương ứng với khu vực hoạt động của đại lý.
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: '1 0 0', overflow: 'hidden', padding: '8px 16px 0' }}>
        <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
          <div style={{ minWidth: 750 }}>
            <div style={{ display: 'flex', background: C_BG_HEADER }}>
              {COLS.map((col, i) => (
                <div key={i} style={{ flex: col.flex, minWidth: col.minW, padding: '6px 10px', fontSize: 13, color: C_TEXT_SECONDARY }}>
                  {col.label}
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: C_BORDER }} />

            {pending.length === 0 ? (
              <div style={{ padding: '56px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                Không có yêu cầu kích hoạt nào chờ duyệt
              </div>
            ) : pending.map(req => {
              const agency      = agenciesList.find(a => a.id === req.agencyId)
              const isRejecting = rejectingId === req.id
              const isApproving = approvingId === req.id
              return (
                <div key={req.id}>
                  <div style={{ display: 'flex', alignItems: 'center', background: isApproving ? '#FAFAFF' : '#fff' }}>
                    <div style={{ flex: '2 0 0', minWidth: 200, padding: '10px 10px' }}>
                      <span onClick={() => navigate(`/super-admin/agencies/${req.agencyId}`)}
                        style={{ fontSize: 14, fontWeight: 700, color: C_LINK, cursor: 'pointer' }}>
                        {agency?.name ?? req.agencyId}
                      </span>
                      <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 1 }}>{req.agencyId}</div>
                    </div>
                    <div style={{ flex: '0 0 120px', minWidth: 120, padding: '10px 10px' }}>
                      <CarrierBadge carrier={req.carrier} />
                    </div>
                    <div style={{ flex: '3 0 0', minWidth: 220, padding: '10px 10px', fontSize: 13, color: req.note ? C_TEXT_PRIMARY : C_TEXT_SECONDARY, fontStyle: req.note ? 'normal' : 'italic' }}>
                      {req.note || '(Không có ghi chú)'}
                    </div>
                    <div style={{ flex: '0 0 100px', minWidth: 100, padding: '10px 10px', fontSize: 12, color: C_TEXT_SECONDARY }}>
                      {req.requestedAt}
                    </div>
                    <div style={{ flex: '0 0 170px', minWidth: 170, padding: '10px 10px', display: 'flex', gap: 6 }}>
                      {!isRejecting && !isApproving && (
                        <>
                          <button
                            onClick={() => setApprovingId(req.id)}
                            style={{ padding: '5px 14px', background: '#8B5CF6', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                          >
                            Duyệt
                          </button>
                          <button onClick={() => setRejectingId(req.id)}
                            style={{ padding: '5px 10px', background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 5, fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer' }}>
                            Từ chối
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Inline form phân clientHubId */}
                  {isApproving && (
                    <ClientHubIdForm
                      agencyName={agency?.name ?? req.agencyId}
                      onConfirm={hubId => handleApprove247(req.id, hubId)}
                      onCancel={() => setApprovingId(null)}
                    />
                  )}

                  {isRejecting && (
                    <RejectInput
                      onConfirm={r => handleReject(req.id, r)}
                      onCancel={() => setRejectingId(null)}
                    />
                  )}
                  <div style={{ height: 1, background: C_BORDER }} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Approvals() {
  const [activeTab, setActiveTab] = useState<'connections' | 'carriers'>('connections')
  const [tick, setTick] = useState(0)

  const onUpdate = () => setTick(t => t + 1)

  const pendingGHN     = shopConnections.filter(s => s.status === 'pending' && s.carrier === 'GHN').length
  const pendingCarrier = carrierRequests.filter(r => r.status === 'pending').length
  const totalPending   = pendingGHN + pendingCarrier

  const TABS = [
    { key: 'connections' as const, label: 'Kết nối GHN',         count: pendingGHN },
    { key: 'carriers'   as const, label: 'Kích hoạt 247Express', count: pendingCarrier },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
              Duyệt yêu cầu
            </h1>
            {totalPending > 0 && (
              <span style={{ background: '#FFF4ED', color: C_ACTION, border: '1px solid #FFD5BB', borderRadius: 100, padding: '2px 10px', fontSize: 13, fontWeight: 700 }}>
                {totalPending}
              </span>
            )}
          </div>
          <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: '4px 0 0', lineHeight: '20px' }}>
            Duyệt kết nối Shop ID GHN và kích hoạt 247Express (phân Client Hub ID) cho đại lý
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C_BORDER}`, padding: '0 16px', flexShrink: 0 }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          return (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', fontSize: 14, fontWeight: 600,
                color: isActive ? C_ACTION : C_TEXT_SECONDARY,
                cursor: 'pointer',
                borderBottom: isActive ? `2px solid ${C_ACTION}` : '2px solid transparent',
                marginBottom: -1, userSelect: 'none',
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{ background: '#FFF4ED', color: C_ACTION, border: '1px solid #FFD5BB', borderRadius: 100, padding: '1px 7px', fontSize: 12, fontWeight: 700 }}>
                  {tab.count}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} key={tick}>
        {activeTab === 'connections' && <TabShopConnections onUpdate={onUpdate} />}
        {activeTab === 'carriers'    && <TabCarrierRequests onUpdate={onUpdate} />}
      </div>
    </div>
  )
}
