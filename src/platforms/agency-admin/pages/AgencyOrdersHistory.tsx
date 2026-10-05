import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { agencyAdminTheme } from '../../../theme/platforms'
import allShops from '../../../mock-data/shops.json'
import { loadOrders } from '../../../mock-data/orderStore'
import { Pagination } from './AgencyOrders'

// ── Design tokens ────────────────────────────────────────────
const C_LINK           = '#3B82F6'
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

const CURRENT_AGENCY_ID = 'AGN001'
const agencyShops = allShops.filter((s) => s.agencyId === CURRENT_AGENCY_ID)
const agencyShopIds = new Set(agencyShops.map((s) => s.id))

type ActionHistoryItem = { date: string; time: string; operator: string; action: string; oldContent: string; newContent: string }
type HistoryRow = ActionHistoryItem & { orderId: string; trackingCode: string; shopId: string }

const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

// ── Lịch sử đơn hàng — nhật ký TOÀN BỘ thao tác trên MỌI đơn hàng của đại lý, gộp từ
// `order.actionHistory` của từng đơn — KHÁC với tab "Lịch sử trạng thái"/"Lịch sử thao tác" đã có
// sẵn trong màn chi tiết 1 đơn (chỉ xem được đúng 1 đơn tại 1 thời điểm). Trang này cho phép nhìn
// xuyên suốt nhiều đơn/nhiều shop cùng lúc — ai đổi gì, lúc nào, trên đơn nào. ───────────────────
export default function AgencyOrdersHistory() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [shopFilter, setShopFilter] = useState('all')
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const shopMap = Object.fromEntries(agencyShops.map((s) => [s.id, s.name]))

  // Gộp actionHistory của MỌI đơn thuộc đại lý thành 1 danh sách dòng phẳng, sắp mới nhất lên đầu.
  const allRows: HistoryRow[] = loadOrders()
    .filter((o) => agencyShopIds.has(o.shopId))
    .flatMap((o) => (o.actionHistory ?? []).map((item) => ({ ...item, orderId: o.id, trackingCode: o.trackingCode, shopId: o.shopId })))
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))

  const q = search.trim().toLowerCase()
  const filteredRows = allRows.filter((r) => {
    if (shopFilter !== 'all' && r.shopId !== shopFilter) return false
    if (!q) return true
    return (
      r.trackingCode.toLowerCase().includes(q) ||
      (shopMap[r.shopId] ?? '').toLowerCase().includes(q) ||
      r.operator.toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q)
    )
  })

  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  // Bấm mã đơn → điều hướng sang "Danh sách đơn hàng", tự điền sẵn ô tìm kiếm + tự chuyển đúng
  // tab chứa đơn đó (xem effect đọc `location.state.searchQuery` trong AgencyOrders.tsx).
  const goToOrder = (trackingCode: string) => {
    navigate('/agency-admin/orders', { state: { searchQuery: trackingCode } })
  }

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', width: '100%', background: '#fff', overflow: 'hidden' }}>

        {/* Page header */}
        <div style={{ padding: '12px 16px', flexShrink: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
            Lịch sử đơn hàng
          </h1>
          <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: '4px 0 0', lineHeight: '20px' }}>
            Nhật ký mọi thao tác trên mọi đơn hàng của các shop thuộc đại lý — ai đổi gì, lúc nào.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 12px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', flex: 1,
            background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
          }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm theo mã đơn, tên shop, người thực hiện, hoặc thao tác"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent' }}
            />
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }} data-shop-filter>
            <button
              onClick={() => setShopDropdownOpen((v) => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 12px',
                background: '#fff', cursor: 'pointer', minWidth: 220,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>Shop</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {shopFilter === 'all' ? 'Tất cả' : (shopMap[shopFilter] ?? 'Tất cả')}
                </span>
              </span>
              <span style={{ fontSize: 10, color: C_TEXT_SECONDARY }}>▼</span>
            </button>
            {shopDropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 260, maxHeight: 320, overflowY: 'auto',
                background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 20,
              }}>
                {[{ id: 'all', name: `Tất cả shop (${agencyShops.length})` }, ...agencyShops].map((s) => {
                  const active = shopFilter === s.id
                  return (
                    <div
                      key={s.id}
                      onClick={() => { setShopFilter(s.id); setPage(1); setShopDropdownOpen(false) }}
                      style={{
                        padding: '8px 12px', fontSize: 14, cursor: 'pointer',
                        background: active ? '#FFF4ED' : 'transparent',
                        color: active ? '#FF5200' : C_TEXT_PRIMARY, fontWeight: active ? 600 : 400,
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#F9FAFB' }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                    >
                      {s.name}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', padding: '10px 12px', background: C_BG_HEADER, fontSize: 12.5, fontWeight: 600, color: C_TEXT_SECONDARY }}>
              <div style={{ width: 130, flexShrink: 0 }}>Thời gian</div>
              <div style={{ width: 160, flexShrink: 0 }}>Mã đơn hàng</div>
              <div style={{ width: 180, flexShrink: 0 }}>Shop</div>
              <div style={{ width: 170, flexShrink: 0 }}>Thao tác</div>
              <div style={{ flex: '1 0 0', minWidth: 220 }}>Nội dung thay đổi</div>
              <div style={{ width: 130, flexShrink: 0 }}>Người thực hiện</div>
            </div>

            {pageRows.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: C_TEXT_SECONDARY }}>
                {q || shopFilter !== 'all' ? 'Không tìm thấy thao tác nào phù hợp.' : 'Chưa có thao tác nào được ghi nhận.'}
              </div>
            )}

            {pageRows.map((r, i) => {
              const hasChange = !(r.oldContent === '-' && r.newContent === '-')
              return (
                <div
                  key={`${r.orderId}-${r.date}-${r.time}-${i}`}
                  style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderTop: i === 0 ? 'none' : `1px solid ${C_BORDER}` }}
                >
                  <div style={{ width: 130, flexShrink: 0, fontSize: 13, color: C_TEXT_PRIMARY }}>
                    {fmtDate(r.date)} {r.time}
                  </div>
                  <div style={{ width: 160, flexShrink: 0 }}>
                    <span
                      onClick={() => goToOrder(r.trackingCode)}
                      style={{ fontSize: 13, fontWeight: 700, color: C_LINK, cursor: 'pointer' }}
                    >
                      {r.trackingCode}
                    </span>
                  </div>
                  <div style={{ width: 180, flexShrink: 0, fontSize: 13, color: C_TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {shopMap[r.shopId] ?? r.shopId}
                  </div>
                  <div style={{ width: 170, flexShrink: 0, fontSize: 13, color: C_TEXT_PRIMARY }}>
                    {r.action}
                  </div>
                  <div style={{ flex: '1 0 0', minWidth: 220, fontSize: 13, color: C_TEXT_SECONDARY }}>
                    {hasChange ? (
                      r.oldContent === '-'
                        ? <span>→ <b style={{ color: C_TEXT_PRIMARY, fontWeight: 600 }}>{r.newContent}</b></span>
                        : <span>{r.oldContent} → <b style={{ color: C_TEXT_PRIMARY, fontWeight: 600 }}>{r.newContent}</b></span>
                    ) : '—'}
                  </div>
                  <div style={{ width: 130, flexShrink: 0, fontSize: 13, color: C_TEXT_PRIMARY }}>
                    {r.operator}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <Pagination
          page={page}
          total={filteredRows.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        />
      </div>
    </ConfigProvider>
  )
}
