import { useState } from 'react'
import { EyeOutlined, CheckCircleOutlined, WarningOutlined, CalendarOutlined } from '@ant-design/icons'
import allCarrierSessions from '../../../mock-data/carrier-reconciliation.json'
import allItemsData from '../../../mock-data/carrier-reconciliation-items.json'
import allShops from '../../../mock-data/shops.json'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_ACTION         = '#FF5200'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// ── Types ────────────────────────────────────────────────────
type NVCSession = {
  id: string
  agencyId: string
  paymentDate: string
  status: 'pending' | 'confirmed'
  note: string
  ghnSessionCode: string
}

type ItemRecord = {
  id: string
  sessionId: string
  orderCode: string
  shopId: string
  shopName: string
  ghnCOD: number
  systemCOD: number
  ghnFee: number
  systemFee: number
  status: 'MATCH' | 'MISMATCH' | 'NOT_FOUND'
}

type ShopSession = {
  id: string
  nvcSessionId: string
  nvcSessionCode: string
  paymentDate: string
  totalOrders: number
  totalCOD: number
  feeShop: number
  netAmount: number
  totalMismatch: number
  items: ItemRecord[]
}

// ── Shop data ─────────────────────────────────────────────────
const MY_SHOP_ID = 'SHP001'
const myShop = (allShops as any[]).find(s => s.id === MY_SHOP_ID)

// ── COD Schedule options ──────────────────────────────────────
const SCHEDULE_OPTIONS = [
  'Thứ 2, 3, 4, 5, 6',
  'Thứ 6',
  'Thứ 5',
  'Thứ 4',
  'Thứ 3',
  'Thứ 2',
  'Thứ 3, 5',
  'Thứ 3, 5, 6',
  'Thứ 3, 4, 6',
  'Thứ 2, 4, 6',
  'Thứ 2, 5',
  'Thứ 2, 4',
]

// ── Derive shop sessions từ confirmed NVC sessions ────────────

function buildShopSessions(): ShopSession[] {
  const confirmedIds = new Set(
    (allCarrierSessions as NVCSession[])
      .filter(s => s.status === 'confirmed')
      .map(s => s.id)
  )

  const groups = new Map<string, { items: ItemRecord[]; session: NVCSession }>()
  ;(allItemsData as ItemRecord[]).forEach(item => {
    if (item.shopId !== MY_SHOP_ID) return
    if (!confirmedIds.has(item.sessionId)) return
    if (!groups.has(item.sessionId)) {
      const session = (allCarrierSessions as NVCSession[]).find(s => s.id === item.sessionId)!
      groups.set(item.sessionId, { items: [], session })
    }
    groups.get(item.sessionId)!.items.push(item)
  })

  const result: ShopSession[] = []
  let idx = 1
  groups.forEach(({ items, session }) => {
    const totalCOD  = items.reduce((s, i) => s + i.ghnCOD, 0)
    const feeShop   = items.reduce((s, i) => s + i.systemFee, 0)
    const datePart  = session.paymentDate.replace(/-/g, '')
    result.push({
      id: `COD_SHOP_${datePart}${String(idx++).padStart(4, '0')}_${MY_SHOP_ID}`,
      nvcSessionId: session.id,
      nvcSessionCode: session.ghnSessionCode,
      paymentDate: session.paymentDate,
      totalOrders: items.length,
      totalCOD,
      feeShop,
      netAmount: totalCOD - feeShop,
      totalMismatch: items.filter(i => i.status !== 'MATCH').length,
      items,
    })
  })
  return result.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
}

const mySessions = buildShopSessions()

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'
const fmtDate = (d: string) => {
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
}

const ITEM_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  MATCH:     { label: 'Đúng',           color: '#16A34A', bg: '#F0FDF4' },
  MISMATCH:  { label: 'Sai',            color: '#DC2626', bg: '#FEF2F2' },
  NOT_FOUND: { label: 'Không tìm thấy', color: '#6B7280', bg: '#F9FAFB' },
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ flex: 1, padding: '12px 16px', border: `1px solid ${C_BORDER}`, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color }}>{value}</span>
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────
function TRow({ session, onView }: { session: ShopSession; onView: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', background: hover ? '#FAFAFA' : '#fff', transition: 'background 0.1s', borderBottom: `1px solid ${C_BORDER}`, cursor: 'default' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ flex: '1 0 0', minWidth: 200, padding: '10px 8px' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C_LINK }}>{session.id}</span>
      </div>
      <div style={{ flex: '0 0 240px', minWidth: 240, padding: '10px 8px' }}>
        <span style={{ fontSize: 13, color: C_LINK }}>{session.nvcSessionCode}</span>
      </div>
      <div style={{ flex: '0 0 110px', minWidth: 110, padding: '10px 8px' }}>
        <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{fmtDate(session.paymentDate)}</span>
      </div>
      <div style={{ flex: '0 0 70px', minWidth: 70, padding: '10px 8px', textAlign: 'right' }}>
        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{session.totalOrders}</span>
      </div>
      <div style={{ flex: '0 0 150px', minWidth: 150, padding: '10px 8px', textAlign: 'right' }}>
        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{fmt(session.totalCOD)}</span>
      </div>
      <div style={{ flex: '0 0 160px', minWidth: 160, padding: '10px 8px', textAlign: 'right' }}>
        <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>{fmt(session.feeShop)}</span>
      </div>
      <div style={{ flex: '0 0 130px', minWidth: 130, padding: '10px 8px', textAlign: 'right' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C_ACTION }}>{fmt(session.netAmount)}</span>
      </div>
      <div style={{ flex: '0 0 140px', minWidth: 140, padding: '10px 8px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
          background: '#FFF7ED', color: '#EA580C',
        }}>
          Chờ thanh toán
        </span>
      </div>
      <div style={{ flex: '0 0 72px', minWidth: 72, padding: '10px 8px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onView}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: C_ACTION, fontSize: 13, fontWeight: 600 }}
        >
          <EyeOutlined style={{ fontSize: 14 }} />
          Xem
        </button>
      </div>
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────────
function DetailModal({ session, onClose }: { session: ShopSession; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 640, maxHeight: '80vh', background: '#fff', borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY }}>
              Phiên đối soát:{' '}
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C_LINK }}>{session.id}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>
              Phiên GHN: <span style={{ color: C_LINK, fontWeight: 600 }}>{session.nvcSessionCode}</span>
            </span>
            <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>·</span>
            <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{fmtDate(session.paymentDate)}</span>
            <button
              onClick={onClose}
              style={{ marginLeft: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: C_TEXT_SECONDARY, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Summary mini-cards */}
        <div style={{ display: 'flex', gap: 12, padding: '16px 24px', flexShrink: 0 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '10px 8px', border: `1px solid ${C_BORDER}`, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 2 }}>Tổng COD (shop)</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmt(session.totalCOD)}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '10px 8px', border: `1px solid ${C_BORDER}`, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 2 }}>Tổng phí DV (shop)</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmt(session.feeShop)}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '10px 8px', border: `1px solid ${C_BORDER}`, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 2 }}>Nhận về</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C_ACTION }}>{fmt(session.netAmount)}</div>
          </div>
          {session.totalMismatch > 0 && (
            <div style={{ flex: 1, textAlign: 'center', padding: '10px 8px', border: '1px solid #FCA5A5', borderRadius: 8, background: '#FEF2F2' }}>
              <div style={{ fontSize: 12, color: '#DC2626', marginBottom: 2 }}>Số lệch</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626' }}>{session.totalMismatch}</div>
            </div>
          )}
        </div>

        {/* Orders table */}
        <div style={{ maxHeight: 300, overflowY: 'auto', padding: '0 24px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY, marginBottom: 8 }}>
            Danh sách đơn hàng ({session.totalOrders} đơn)
          </div>
          <div style={{ minWidth: 540 }}>
            {/* Table header */}
            <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center', borderRadius: '6px 6px 0 0' }}>
              <div style={{ flex: '1 0 0', padding: '6px 8px', fontSize: 13, color: C_TEXT_SECONDARY }}>Mã đơn GHN</div>
              <div style={{ width: 120, flexShrink: 0, padding: '6px 8px', fontSize: 13, color: C_TEXT_SECONDARY, textAlign: 'right' }}>COD</div>
              <div style={{ width: 100, flexShrink: 0, padding: '6px 8px', fontSize: 13, color: C_TEXT_SECONDARY, textAlign: 'right' }}>Phí ship</div>
              <div style={{ width: 130, flexShrink: 0, padding: '6px 8px', fontSize: 13, color: C_TEXT_SECONDARY, textAlign: 'center' }}>Trạng thái</div>
            </div>
            <div style={{ height: 1, background: C_BORDER }} />
            {session.items.map(item => {
              const st = ITEM_STATUS[item.status]
              const hasCODDiff = item.ghnCOD !== item.systemCOD
              const hasFeeDiff = item.ghnFee !== item.systemFee
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${C_BORDER}` }}>
                  <div style={{ flex: '1 0 0', padding: '8px 8px' }}>
                    <span style={{ fontSize: 13, color: C_LINK, fontWeight: 500 }}>{item.orderCode}</span>
                  </div>
                  <div style={{ width: 120, flexShrink: 0, padding: '8px 8px', textAlign: 'right' }}>
                    <span style={{ fontSize: 13, color: hasCODDiff ? '#DC2626' : C_TEXT_PRIMARY, fontWeight: hasCODDiff ? 600 : 400 }}>
                      {fmt(item.ghnCOD)}
                    </span>
                    {hasCODDiff && (
                      <div style={{ fontSize: 11, color: C_TEXT_SECONDARY }}>
                        HT: {fmt(item.systemCOD)}
                      </div>
                    )}
                  </div>
                  <div style={{ width: 100, flexShrink: 0, padding: '8px 8px', textAlign: 'right' }}>
                    <span style={{ fontSize: 13, color: hasFeeDiff ? '#DC2626' : C_TEXT_SECONDARY, fontWeight: hasFeeDiff ? 600 : 400 }}>
                      {fmt(item.ghnFee)}
                    </span>
                    {hasFeeDiff && (
                      <div style={{ fontSize: 11, color: C_TEXT_SECONDARY }}>
                        HT: {fmt(item.systemFee)}
                      </div>
                    )}
                  </div>
                  <div style={{ width: 130, flexShrink: 0, padding: '8px 8px', display: 'flex', justifyContent: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: st.bg, color: st.color,
                    }}>
                      {item.status === 'MATCH' ? <CheckCircleOutlined /> : <WarningOutlined />}
                      {st.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: `1px solid ${C_BORDER}`, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ padding: '7px 20px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14, color: C_TEXT_PRIMARY }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Schedule Modal ────────────────────────────────────────────
function ScheduleModal({ current, onSave, onClose }: {
  current: string
  onSave: (v: string) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState(current)

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 400, background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY }}>Đổi lịch nhận COD</span>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: C_TEXT_SECONDARY, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <label style={{ fontSize: 13, color: C_TEXT_SECONDARY, display: 'block', marginBottom: 8 }}>
            Chọn ngày nhận tiền COD trong tuần
          </label>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', fontSize: 14, color: C_TEXT_PRIMARY,
              border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff',
              cursor: 'pointer', outline: 'none',
            }}
          >
            {SCHEDULE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: `1px solid ${C_BORDER}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{ padding: '7px 18px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14, color: C_TEXT_PRIMARY }}
          >
            Huỷ
          </button>
          <button
            onClick={() => { onSave(selected); onClose() }}
            style={{ padding: '7px 18px', border: 'none', borderRadius: 6, background: C_ACTION, cursor: 'pointer', fontSize: 14, color: '#fff', fontWeight: 600 }}
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Schedule Section ──────────────────────────────────────────
function ScheduleSection({ schedule, onEdit }: { schedule: string; onEdit: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      margin: '0 16px 12px', padding: '12px 16px',
      border: `1px solid ${C_BORDER}`, borderRadius: 8, background: '#FAFAFA',
      flexShrink: 0,
    }}>
      <CalendarOutlined style={{ fontSize: 18, color: C_TEXT_SECONDARY, flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Lịch nhận COD</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>{schedule}</span>
      <div style={{ flex: 1 }} />
      <button
        onClick={onEdit}
        style={{
          padding: '7px 16px', border: 'none',
          borderRadius: 6, background: C_ACTION, cursor: 'pointer',
          fontSize: 14, color: '#fff', fontWeight: 600,
        }}
      >
        Đổi lịch
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function ShopReconciliation() {
  const [selected, setSelected] = useState<ShopSession | null>(null)
  const [codSchedule, setCodSchedule] = useState<string>(myShop?.codSchedule ?? 'Thứ 2, 3, 4, 5, 6')
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  const totalNetAmount = mySessions.reduce((s, r) => s + r.netAmount, 0)
  const totalMismatch  = mySessions.reduce((s, r) => s + r.totalMismatch, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>Đối soát</h1>
          <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
            Lịch sử thanh toán COD từ đại lý
          </p>
        </div>
      </div>

      {/* COD Schedule */}
      <ScheduleSection schedule={codSchedule} onEdit={() => setShowScheduleModal(true)} />

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12, padding: '0 16px 12px', flexShrink: 0 }}>
        <StatCard label="Tổng phiên"     value={mySessions.length}                   color={C_ACTION} />
        <StatCard label="Tổng nhận về"   value={fmt(totalNetAmount)}                 color="#16A34A" />
        <StatCard label="Chờ thanh toán" value={`${mySessions.length} phiên`}        color="#EA580C" />
        {totalMismatch > 0 && (
          <StatCard label="Đơn lệch"     value={`${totalMismatch} đơn`}              color="#DC2626" />
        )}
      </div>

      {/* Table */}
      <div style={{ flex: '1 0 0', overflow: 'hidden', padding: '0 16px' }}>
        <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
          <div style={{ minWidth: 1200 }}>
            {/* Header */}
            <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
              <div style={{ flex: '1 0 0', minWidth: 200, padding: '6px 8px', fontSize: 14, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>Mã phiên</div>
              <div style={{ flex: '0 0 240px', minWidth: 240, padding: '6px 8px', fontSize: 14, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>Phiên GHN</div>
              <div style={{ flex: '0 0 110px', minWidth: 110, padding: '6px 8px', fontSize: 14, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>Ngày</div>
              <div style={{ flex: '0 0 70px', minWidth: 70, padding: '6px 8px', fontSize: 14, color: C_TEXT_SECONDARY, textAlign: 'right', whiteSpace: 'nowrap' }}>Số đơn</div>
              <div style={{ flex: '0 0 150px', minWidth: 150, padding: '6px 8px', fontSize: 14, color: C_TEXT_SECONDARY, textAlign: 'right', whiteSpace: 'nowrap' }}>Tổng COD (shop)</div>
              <div style={{ flex: '0 0 160px', minWidth: 160, padding: '6px 8px', fontSize: 14, color: C_TEXT_SECONDARY, textAlign: 'right', whiteSpace: 'nowrap' }}>Tổng phí DV (shop)</div>
              <div style={{ flex: '0 0 130px', minWidth: 130, padding: '6px 8px', fontSize: 14, color: C_TEXT_SECONDARY, textAlign: 'right', whiteSpace: 'nowrap' }}>Nhận về</div>
              <div style={{ flex: '0 0 140px', minWidth: 140, padding: '6px 8px', fontSize: 14, color: C_TEXT_SECONDARY }}>Trạng thái</div>
              <div style={{ flex: '0 0 72px', minWidth: 72 }} />
            </div>
            <div style={{ height: 1, background: C_BORDER }} />

            {mySessions.length === 0 && (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                Chưa có phiên đối soát nào
              </div>
            )}

            {mySessions.map(s => (
              <TRow key={s.id} session={s} onView={() => setSelected(s)} />
            ))}
          </div>
        </div>
      </div>

      {selected && <DetailModal session={selected} onClose={() => setSelected(null)} />}

      {showScheduleModal && (
        <ScheduleModal
          current={codSchedule}
          onSave={v => setCodSchedule(v)}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  )
}
