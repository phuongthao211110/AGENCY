import { useState } from 'react'
import { Modal } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import allReconciliation from '../../../mock-data/reconciliation.json'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_ACTION         = '#FF5200'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

type RecSession = typeof allReconciliation[0]

const myRec = allReconciliation.filter((r) => r.shopId === 'SHP001')

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  completed:  { label: 'Đã thanh toán', bg: '#F0FDF4', color: '#16A34A' },
  processing: { label: 'Đang xử lý',    bg: '#EFF6FF', color: '#2563EB' },
  pending:    { label: 'Chờ xử lý',     bg: '#FFF7ED', color: '#EA580C' },
}

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 12,
      background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>{s.label}</span>
  )
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, color, suffix = '' }: { label: string; value: number; color: string; suffix?: string }) {
  return (
    <div style={{ flex: 1, padding: '12px 16px', border: `1px solid ${C_BORDER}`, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, color }}>
        {suffix ? `${value.toLocaleString()}${suffix}` : value}
      </span>
    </div>
  )
}

// ── Table header ─────────────────────────────────────────────
function THead() {
  const cell = (label: string, flex: string, minWidth: number, align: 'left' | 'right' = 'left') => (
    <div style={{ display: 'flex', flex, alignItems: 'center', minWidth, padding: '6px 8px' }}>
      <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, textAlign: align, lineHeight: '20px' }}>{label}</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
      {cell('Mã phiên',    '0 0 90px',  90)}
      {cell('Kỳ đối soát','0 0 130px', 130)}
      {cell('Số đơn',      '0 0 80px',  80,  'right')}
      {cell('Tổng COD',    '0 0 130px', 130, 'right')}
      {cell('Phí ship',    '0 0 110px', 110, 'right')}
      {cell('Nhận về',     '0 0 130px', 130, 'right')}
      {cell('Trạng thái',  '0 0 130px', 130)}
      {cell('',            '0 0 72px',  72)}
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────
function TRow({ rec, onView }: { rec: RecSession; onView: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', background: hover ? '#FAFAFA' : '#fff', transition: 'background 0.1s', borderBottom: `1px solid ${C_BORDER}` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
        <div style={{ flex: '0 0 90px', minWidth: 90, padding: '6px 8px' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C_LINK }}>{rec.id}</span>
        </div>
        <div style={{ flex: '0 0 130px', minWidth: 130, padding: '6px 8px' }}>
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{rec.period}</span>
        </div>
        <div style={{ flex: '0 0 80px', minWidth: 80, padding: '6px 8px', textAlign: 'right' }}>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{rec.totalOrders}</span>
        </div>
        <div style={{ flex: '0 0 130px', minWidth: 130, padding: '6px 8px', textAlign: 'right' }}>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{rec.totalCOD.toLocaleString()}đ</span>
        </div>
        <div style={{ flex: '0 0 110px', minWidth: 110, padding: '6px 8px', textAlign: 'right' }}>
          <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>{rec.totalFee.toLocaleString()}đ</span>
        </div>
        <div style={{ flex: '0 0 130px', minWidth: 130, padding: '6px 8px', textAlign: 'right' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_ACTION }}>{rec.netAmount.toLocaleString()}đ</span>
        </div>
        <div style={{ flex: '0 0 130px', minWidth: 130, padding: '6px 8px' }}>
          <StatusBadge status={rec.status} />
        </div>
        <div style={{ flex: '0 0 72px', minWidth: 72, padding: '6px 8px', display: 'flex', justifyContent: 'center' }}>
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

// ── Detail row ────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: `1px solid ${C_BORDER}` }}>
      <span style={{ flex: '0 0 160px', fontSize: 13, color: C_TEXT_SECONDARY }}>{label}</span>
      <span style={{ flex: 1, fontSize: 13, color: C_TEXT_PRIMARY }}>{value}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function ShopReconciliation() {
  const [selected, setSelected] = useState<RecSession | null>(null)

  const totalReceived = myRec.filter((r) => r.status === 'completed').reduce((s, r) => s + r.netAmount, 0)
  const pending       = myRec.filter((r) => r.status !== 'completed').length

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

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12, padding: '0 16px 12px', flexShrink: 0 }}>
        <StatCard label="Tổng phiên"        value={myRec.length}   color={C_ACTION} />
        <StatCard label="Đã nhận"           value={totalReceived}  color="#16A34A" suffix="đ" />
        <StatCard label="Chờ thanh toán"    value={pending}        color="#EA580C" suffix=" phiên" />
      </div>

      {/* Table */}
      <div style={{ flex: '1 0 0', overflowY: 'auto', padding: '0 16px' }}>
        <div style={{ minWidth: 873 }}>
          <THead />
          <div style={{ height: 1, background: C_BORDER }} />
          {myRec.map((rec) => (
            <TRow key={rec.id} rec={rec} onView={() => setSelected(rec)} />
          ))}
        </div>
      </div>

      {/* Detail modal */}
      <Modal
        title={<span>Phiên đối soát: <span style={{ color: C_LINK, fontWeight: 700 }}>{selected?.id}</span></span>}
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={
          <button onClick={() => setSelected(null)} style={{ padding: '7px 20px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14, color: C_TEXT_PRIMARY }}>
            Đóng
          </button>
        }
        width={480}
      >
        {selected && (
          <div style={{ paddingTop: 4 }}>
            <div style={{ display: 'flex', gap: 12, padding: '8px 0 16px', borderBottom: `1px solid ${C_BORDER}`, marginBottom: 4 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Tổng COD</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C_TEXT_PRIMARY, marginTop: 2 }}>{selected.totalCOD.toLocaleString()}đ</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Phí ship</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C_TEXT_PRIMARY, marginTop: 2 }}>{selected.totalFee.toLocaleString()}đ</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Nhận về</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C_ACTION, marginTop: 2 }}>{selected.netAmount.toLocaleString()}đ</div>
              </div>
            </div>
            <DetailRow label="Kỳ đối soát"      value={selected.period} />
            <DetailRow label="Số đơn hàng"      value={selected.totalOrders} />
            <DetailRow label="Trạng thái"        value={<StatusBadge status={selected.status} />} />
            {selected.transferDate && (
              <DetailRow label="Ngày chuyển khoản" value={selected.transferDate} />
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
