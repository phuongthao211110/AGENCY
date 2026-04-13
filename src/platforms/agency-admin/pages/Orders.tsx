import { useState } from 'react'
import { Modal } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import allOrders from '../../../mock-data/orders.json'
import allShops from '../../../mock-data/shops.json'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_ACTION         = '#FF5200'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// ── Data ────────────────────────────────────────────────────
const myShopIds = allShops.filter((s) => s.agencyId === 'AGN001').map((s) => s.id)
const shopNameMap = Object.fromEntries(allShops.map((s) => [s.id, s.name]))
const myOrders = allOrders.filter((o) => myShopIds.includes(o.shopId))

type Order = typeof allOrders[0]

// ── Status badge ─────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  delivered:  { label: 'Đã giao',    bg: '#F0FDF4', color: '#16A34A' },
  in_transit: { label: 'Đang giao',  bg: '#EFF6FF', color: '#2563EB' },
  pending:    { label: 'Chờ lấy',    bg: '#FFF7ED', color: '#EA580C' },
  failed:     { label: 'Thất bại',   bg: '#FEF2F2', color: '#DC2626' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 12,
      background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>{s.label}</span>
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
      {cell('Mã vận đơn',  '0 0 160px', 160)}
      {cell('Shop',        '1 0 0',     160)}
      {cell('Người nhận',  '1 0 0',     160)}
      {cell('Địa chỉ',     '2 0 0',     200)}
      {cell('Trạng thái',  '0 0 120px', 120)}
      {cell('COD',         '0 0 110px', 110, 'right')}
      {cell('Phí ship',    '0 0 90px',  90,  'right')}
      {cell('Ngày tạo',    '0 0 110px', 110)}
      {cell('',            '0 0 72px',  72)}
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────
function TRow({ order, onView }: { order: Order; onView: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <>
      <div
        style={{ display: 'flex', alignItems: 'center', background: hover ? '#FAFAFA' : '#fff', transition: 'background 0.1s' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div style={{ flex: '0 0 160px', minWidth: 160, padding: '6px 8px' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px' }}>{order.trackingCode}</span>
        </div>
        <div style={{ flex: '1 0 0', minWidth: 160, padding: '6px 8px' }}>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
            {shopNameMap[order.shopId] || order.shopId}
          </span>
        </div>
        <div style={{ flex: '1 0 0', minWidth: 160, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{order.receiverName}</span>
          <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, lineHeight: '16px' }}>{order.receiverPhone}</span>
        </div>
        <div style={{ flex: '2 0 0', minWidth: 200, padding: '6px 8px', overflow: 'hidden' }}>
          <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.receiverAddress}
          </span>
        </div>
        <div style={{ flex: '0 0 120px', minWidth: 120, padding: '6px 8px' }}>
          <StatusBadge status={order.status} />
        </div>
        <div style={{ flex: '0 0 110px', minWidth: 110, padding: '6px 8px', textAlign: 'right' }}>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{order.cod.toLocaleString()}đ</span>
        </div>
        <div style={{ flex: '0 0 90px', minWidth: 90, padding: '6px 8px', textAlign: 'right' }}>
          <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{order.fee.toLocaleString()}đ</span>
        </div>
        <div style={{ flex: '0 0 110px', minWidth: 110, padding: '6px 8px' }}>
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{order.createdAt}</span>
        </div>
        <div style={{ flex: '0 0 72px', minWidth: 72, padding: '6px 8px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onView}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: C_ACTION, fontSize: 13, fontWeight: 600, padding: '2px 4px' }}
          >
            <EyeOutlined style={{ fontSize: 14 }} />
            Xem
          </button>
        </div>
      </div>
      <div style={{ height: 1, background: C_BORDER }} />
    </>
  )
}

// ── Detail row ────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: `1px solid ${C_BORDER}` }}>
      <span style={{ flex: '0 0 140px', fontSize: 13, color: C_TEXT_SECONDARY }}>{label}</span>
      <span style={{ flex: 1, fontSize: 13, color: C_TEXT_PRIMARY }}>{value}</span>
    </div>
  )
}

// ── Status filter ─────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: '',           label: 'Tất cả trạng thái' },
  { value: 'delivered',  label: 'Đã giao' },
  { value: 'in_transit', label: 'Đang giao' },
  { value: 'pending',    label: 'Chờ lấy' },
  { value: 'failed',     label: 'Thất bại' },
]

// ── Main ──────────────────────────────────────────────────────
export default function Orders() {
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [page, setPage]               = useState(1)
  const PAGE_SIZE = 15

  const filtered = myOrders.filter((o) => {
    const q = search.toLowerCase()
    const matchSearch = o.trackingCode.toLowerCase().includes(q) || o.receiverName.toLowerCase().includes(q)
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
            Danh sách đơn hàng
          </h1>
          <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
            {filtered.length} đơn hàng từ tất cả shop trực thuộc
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', flexShrink: 0 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
          border: `1px solid ${C_BORDER}`, borderRadius: 6, maxWidth: 360,
        }}>
          <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 15, flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Tìm mã vận đơn, người nhận..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          style={{
            padding: '7px 12px', border: `1px solid ${C_BORDER}`, borderRadius: 6,
            fontSize: 14, color: C_TEXT_PRIMARY, background: '#fff', cursor: 'pointer', outline: 'none',
          }}
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ flex: '1 0 0', overflowY: 'auto', padding: '0 16px' }}>
        <div style={{ minWidth: 1040 }}>
          <THead />
          <div style={{ height: 1, background: C_BORDER }} />
          {paginated.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
              Không có đơn hàng nào
            </div>
          ) : (
            paginated.map((order) => (
              <TRow key={order.id} order={order} onView={() => setSelectedOrder(order)} />
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      <div style={{ borderTop: `1px solid ${C_BORDER}`, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, flex: 1 }}>
          {filtered.length} kết quả
        </span>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            style={{
              width: 28, height: 28, borderRadius: 500, border: 'none', cursor: 'pointer',
              background: p === page ? C_TEXT_PRIMARY : 'transparent',
              color: p === page ? '#fff' : C_TEXT_PRIMARY,
              fontSize: 13, fontWeight: 500,
            }}
          >{p}</button>
        ))}
      </div>

      {/* Detail modal */}
      <Modal
        title={
          <span>Chi tiết đơn: <span style={{ color: C_LINK, fontWeight: 700 }}>{selectedOrder?.trackingCode}</span></span>
        }
        open={!!selectedOrder}
        onCancel={() => setSelectedOrder(null)}
        footer={
          <button onClick={() => setSelectedOrder(null)} style={{ padding: '7px 20px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14, color: C_TEXT_PRIMARY }}>
            Đóng
          </button>
        }
        width={560}
      >
        {selectedOrder && (
          <div style={{ paddingTop: 4 }}>
            <DetailRow label="Mã vận đơn"  value={<span style={{ fontWeight: 700, color: C_LINK }}>{selectedOrder.trackingCode}</span>} />
            <DetailRow label="Người gửi"   value={`${selectedOrder.senderName} — ${selectedOrder.senderPhone}`} />
            <DetailRow label="Người nhận"  value={`${selectedOrder.receiverName} — ${selectedOrder.receiverPhone}`} />
            <DetailRow label="Địa chỉ nhận" value={selectedOrder.receiverAddress} />
            <DetailRow label="Khối lượng"  value={`${selectedOrder.weight.toLocaleString()} g`} />
            <DetailRow label="COD"         value={<span style={{ fontWeight: 600 }}>{selectedOrder.cod.toLocaleString()}đ</span>} />
            <DetailRow label="Phí ship"    value={`${selectedOrder.fee.toLocaleString()}đ`} />
            <DetailRow label="Trạng thái"  value={<StatusBadge status={selectedOrder.status} />} />
            <DetailRow label="Ngày tạo"    value={selectedOrder.createdAt} />
          </div>
        )}
      </Modal>
    </div>
  )
}
