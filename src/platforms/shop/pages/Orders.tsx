import { useState } from 'react'
import { ConfigProvider } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { shopTheme } from '../../../theme/platforms'
import allOrders from '../../../mock-data/orders.json'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_BODY      = '#050505'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_ACTION         = '#FF5200'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// ── Data ─────────────────────────────────────────────────────
const myOrders = allOrders.filter((o) => o.shopId === 'SHP001')

// Derive fake product lists per order
const SAMPLE_PRODUCTS = [
  ['Giày Thể Thao Nam - SL: 2'],
  ['Áo Thun Cotton Nam - Oversize - Màu Ngẫu Nhiên - SL: 2', 'Bình Giữ Nhiệt Cao Cấp - SL: 1'],
  ['Áo Thun Trơn Cổ Tròn Thoáng Khí - SL: 10'],
  ['Quần Jean Nam Slim Fit - SL: 1', 'Áo Polo Cổ Bẻ - SL: 2'],
]
const orderProducts: Record<string, string[]> = {}
myOrders.forEach((o, i) => {
  orderProducts[o.id] = SAMPLE_PRODUCTS[i % SAMPLE_PRODUCTS.length]
})

// ── Checkbox ─────────────────────────────────────────────────
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
  const fixedCell = (label: string, width: number, align: 'left' | 'right' = 'left') => (
    <div style={{ width, flexShrink: 0, padding: '6px 8px', background: C_BG_HEADER, display: 'flex', alignItems: 'center' }}>
      <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, textAlign: align, lineHeight: '20px' }}>{label}</span>
    </div>
  )
  const flexCell = (label: string, minWidth: number, align: 'left' | 'right' = 'left') => (
    <div style={{ flex: '1 0 0', minWidth, padding: '6px 8px', background: C_BG_HEADER, display: 'flex', alignItems: 'center' }}>
      <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, textAlign: align, lineHeight: '20px' }}>{label}</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <div style={{ width: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px', background: C_BG_HEADER }}>
        <Checkbox checked={allChecked} onChange={onToggleAll} />
      </div>
      {fixedCell('Mã đơn hàng', 140)}
      {flexCell('Khách hàng',      300)}
      {flexCell('Sản phẩm',        300)}
      {flexCell('Khối lượng (kg)', 120, 'right')}
      {flexCell('COD (đ)',         120, 'right')}
      {flexCell('Phí ship (đ)',    120, 'right')}
      {flexCell('GTB - TT (đ)',    120, 'right')}
      {flexCell('Người tạo',       200)}
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────
type Order = typeof myOrders[0]
function TRow({ order, checked, onToggle }: { order: Order; checked: boolean; onToggle: () => void }) {
  const [hover, setHover] = useState(false)
  const products = orderProducts[order.id] || ['Sản phẩm - SL: 1']
  const weightKg = (order.weight / 1000).toFixed(1)
  const feeType = parseInt(order.id.replace('ORD', '')) % 2 === 0 ? 'Shop trả' : 'Khách trả'

  return (
    <>
      <div
        style={{
          display: 'flex', alignItems: 'stretch', cursor: 'pointer',
          background: hover ? '#FAFAFA' : '#fff',
          transition: 'background 0.1s',
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* Checkbox */}
        <div style={{ width: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px' }}>
          <Checkbox checked={checked} onChange={onToggle} />
        </div>
        {/* Mã đơn hàng */}
        <div style={{ width: 140, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '6px 8px' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px', whiteSpace: 'nowrap' }}>
            {order.trackingCode}
          </span>
        </div>
        {/* Khách hàng */}
        <div style={{ flex: '1 0 0', minWidth: 300, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
          <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.receiverName}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', whiteSpace: 'nowrap' }}>
              {order.receiverPhone}
            </span>
            <div style={{ background: '#D9F7E5', padding: '0 6px', height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', flexShrink: 0, gap: 2 }}>
              <span style={{ fontSize: 13, color: C_TEXT_BODY }}>TLHH:</span>
              <span style={{ fontSize: 13, color: '#00C853' }}>0%</span>
            </div>
          </div>
          <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px' }}>
            {order.receiverAddress}
          </span>
        </div>
        {/* Sản phẩm */}
        <div style={{ flex: '1 0 0', minWidth: 300, padding: '6px 8px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', width: '100%' }}>
            {products.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
        {/* Khối lượng */}
        <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px' }}>{weightKg}</span>
        </div>
        {/* COD */}
        <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px' }}>{order.cod.toLocaleString()}</span>
        </div>
        {/* Phí ship */}
        <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
          <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px' }}>{order.fee.toLocaleString()}</span>
          <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px' }}>{feeType}</span>
        </div>
        {/* GTB - TT */}
        <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px' }}>{order.cod.toLocaleString()}</span>
        </div>
        {/* Người tạo */}
        <div style={{ flex: '1 0 0', minWidth: 200, padding: '6px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {order.senderName}
          </span>
          <span style={{ fontSize: 14, color: C_TEXT_BODY, lineHeight: '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Tạo lúc {order.createdAt}
          </span>
        </div>
      </div>
      <div style={{ height: 1, background: C_BORDER }} />
    </>
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
      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>Hiển thị</span>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px',
          border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', flexShrink: 0, width: 82,
        }}
        onClick={() => onPageSizeChange(pageSize === 50 ? 100 : 50)}
      >
        <span style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY }}>{pageSize}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5l5 5 5-5" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <span style={{ flex: 1, fontSize: 14, color: C_TEXT_PRIMARY }}>mỗi trang</span>

      {/* Page numbers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <NavBtn dir="first" />
        {pages.map((p, i) => <PageBtn key={i} p={p} />)}
        <NavBtn dir="last" />
      </div>

      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>Đi đến trang số</span>
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
export default function ShopOrders() {
  const [activeTab, setActiveTab]   = useState('draft')
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [page, setPage]             = useState(1)
  const [pageSize, setPageSize]     = useState(50)

  const draftOrders     = myOrders.filter((o) => o.status !== 'failed')
  const cancelledOrders = myOrders.filter((o) => o.status === 'failed')
  const tabOrders       = activeTab === 'draft' ? draftOrders : cancelledOrders

  const filtered = tabOrders.filter((o) =>
    o.trackingCode.toLowerCase().includes(search.toLowerCase()) ||
    o.receiverName.toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allChecked = paginated.length > 0 && paginated.every((o) => selected.has(o.id))

  const toggleAll = () => {
    const next = new Set(selected)
    if (allChecked) paginated.forEach((o) => next.delete(o.id))
    else            paginated.forEach((o) => next.add(o.id))
    setSelected(next)
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const TABS = [
    { key: 'draft',     label: 'Đơn nháp', count: draftOrders.length,     countColor: '#F59E0B' },
    { key: 'cancelled', label: 'Đã huỷ',   count: cancelledOrders.length, countColor: '#3B82F6' },
  ]

  return (
    <ConfigProvider theme={shopTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
              Đơn hàng
            </h1>
            <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
              Tạo, chỉnh sửa và quản lý đơn hàng
            </p>
          </div>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
              background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <PlusOutlined style={{ color: '#fff', fontSize: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Tạo đơn hàng</span>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 16px', borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key
            return (
              <div
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPage(1); setSelected(new Set()) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                  background: active ? C_TEXT_PRIMARY : 'transparent',
                  border: `1px solid ${C_BORDER}`,
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: active ? '#fff' : C_TEXT_PRIMARY }}>
                  {tab.label}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: active ? tab.countColor : '#3B82F6' }}>
                  {tab.count}
                </span>
              </div>
            )
          })}
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
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: '1 0 0', overflowY: 'auto', overflowX: 'auto', paddingLeft: 16 }}>
          <div style={{ minWidth: 1400 }}>
            <THead allChecked={allChecked} onToggleAll={toggleAll} />
            <div style={{ height: 1, background: C_BORDER }} />
            {paginated.map((order) => (
              <TRow
                key={order.id}
                order={order}
                checked={selected.has(order.id)}
                onToggle={() => toggleOne(order.id)}
              />
            ))}
            {paginated.length === 0 && (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                Không có đơn hàng
              </div>
            )}
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
