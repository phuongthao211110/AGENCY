import { useState } from 'react'
import { ConfigProvider } from 'antd'
import { CheckOutlined, StopOutlined } from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
import {
  loadOrders, approveOrderPayment, isOrderCreationBlocked, setOrderCreationBlocked, type Order,
} from '../../../mock-data/orderStore'
import { agenciesList } from '../agencyStore'
import allShops from '../../../mock-data/shops.json'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// Người thao tác ghi vào Lịch sử thao tác của đơn — prototype chưa có phiên đăng nhập thật nên
// dùng tên cố định, giống cách các trang Super Admin khác chưa gắn operator theo user thật.
const CURRENT_ADMIN = 'GHN Super Admin'

function shopAndAgencyName(shopId: string): { shopName: string; agencyName: string } {
  const shop = allShops.find(s => s.id === shopId)
  const agency = shop ? agenciesList.find(a => a.id === shop.agencyId) : undefined
  return { shopName: shop?.name ?? shopId, agencyName: agency?.name ?? '—' }
}

function methodLabel(order: Order): string {
  return order.paymentMethod === 'momo' ? 'MoMo'
    : order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản'
    : order.paymentMethod === 'cash' ? 'Tiền mặt'
    : '—'
}

function formatTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// Nhóm theo ngày Shop khai thanh toán (paymentPaidAt) — nếu thiếu (không nên xảy ra vì mọi đơn
// vào trang này đều đi qua luồng thanh toán online) thì gom vào nhóm "Không rõ ngày" ở cuối.
function dateKey(order: Order): string {
  return order.paymentPaidAt ? order.paymentPaidAt.slice(0, 10) : 'unknown'
}

function dateLabel(key: string): string {
  if (key === 'unknown') return 'Không rõ ngày'
  const [y, m, d] = key.split('-')
  return `${d}/${m}/${y}`
}

function groupByDate(orders: Order[]): Array<{ key: string; orders: Order[] }> {
  const map = new Map<string, Order[]>()
  for (const o of orders) {
    const key = dateKey(o)
    const list = map.get(key)
    if (list) list.push(o)
    else map.set(key, [o])
  }
  for (const list of map.values()) {
    list.sort((a, b) => (b.paymentPaidAt ?? '').localeCompare(a.paymentPaidAt ?? ''))
  }
  return Array.from(map.entries())
    .sort(([keyA], [keyB]) => (keyA === 'unknown' ? 1 : keyB === 'unknown' ? -1 : keyB.localeCompare(keyA)))
    .map(([key, orders]) => ({ key, orders }))
}

// Dòng chỉ HIỂN THỊ trạng thái — không còn nút Duyệt/Từ chối riêng từng đơn. Việc cho đơn đi tiếp
// (chuyển sang pickup) là 1 QUYẾT ĐỊNH TỔNG, thực hiện qua nút "Duyệt tất cả" duy nhất ở đầu trang
// (xem handleApproveAll) — không thao tác được ở cấp từng dòng/từng ngày nữa. Đơn nghi ngờ phải
// được xử lý NGOÀI hệ thống (liên hệ Shop, huỷ đơn ở Agency Admin...) trước khi bấm nút tổng.
function StatusCell({ order }: { order: Order }) {
  if (order.paymentApprovalStatus === 'confirmed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', background: '#DCF3E7', borderRadius: 4, padding: '2px 8px', width: 'fit-content' }}>
          ✓ Đã nhận tiền
        </span>
        <span style={{ fontSize: 11, color: C_TEXT_SECONDARY }}>
          lúc {formatTime(order.paymentApprovedAt)} — {order.paymentApprovedBy ?? 'không rõ nguồn'}
        </span>
      </div>
    )
  }
  if (order.paymentApprovalStatus === 'rejected') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', borderRadius: 4, padding: '2px 8px', width: 'fit-content' }}>
          ✕ Chưa nhận tiền
        </span>
        <span style={{ fontSize: 11, color: C_TEXT_SECONDARY }}>
          Lý do: {order.paymentApprovalRejectedReason ?? '—'} — {order.paymentApprovedBy ?? 'không rõ nguồn'}
        </span>
      </div>
    )
  }
  // pending_review — thuần hiển thị, không có action nào ở đây
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: '#B45309', background: '#FEF3C7', borderRadius: 4, padding: '2px 8px', width: 'fit-content' }}>
      Chờ duyệt
    </span>
  )
}

const cell = (children: React.ReactNode, flex = '1 0 0', minWidth = 140) => (
  <div style={{ flex, minWidth, padding: '10px 8px', display: 'flex', alignItems: 'center' }}>{children}</div>
)

export default function PaymentApprovals() {
  const [, tick] = useState(0)
  const refresh = () => tick(n => n + 1)

  const orders = loadOrders()
  const relevantOrders = orders.filter(o => !!o.paymentApprovalStatus)
  const pendingOrders = relevantOrders.filter(o => o.paymentApprovalStatus === 'pending_review')
  const pendingCount = pendingOrders.length
  const confirmedCount = relevantOrders.filter(o => o.paymentApprovalStatus === 'confirmed').length
  const rejectedCount = relevantOrders.filter(o => o.paymentApprovalStatus === 'rejected').length
  const groups = groupByDate(relevantOrders)

  const creationBlocked = isOrderCreationBlocked()

  // Nút tổng DUY NHẤT — duyệt hàng loạt TOÀN BỘ đơn đang "Chờ duyệt" trên cả trang (mọi ngày, mọi
  // shop/đại lý) trong 1 lần bấm. Không còn thao tác ở cấp từng dòng/từng ngày.
  function handleApproveAll() {
    if (pendingOrders.length === 0) return
    const ok = window.confirm(`Duyệt toàn bộ ${pendingOrders.length} đơn đang chờ duyệt (tất cả các ngày)? Các đơn này sẽ được xác nhận đã nhận tiền và chuyển tiếp xử lý. Đơn nào còn nghi ngờ thì xử lý trước khi bấm nút này.`)
    if (!ok) return
    for (const o of pendingOrders) approveOrderPayment(o.id, CURRENT_ADMIN)
    refresh()
  }

  // Công tắc tổng — tạm dừng Shop tạo đơn mới (mọi nền tảng) khi đang xử lý bất thường về thanh
  // toán. KHÔNG ảnh hưởng đơn đã có sẵn — chỉ chặn đơn MỚI từ lúc bật tới lúc tắt.
  function handleToggleCreationBlock() {
    const next = !creationBlocked
    const ok = window.confirm(
      next
        ? 'Chặn Shop tạo đơn mới trên TOÀN HỆ THỐNG? Đơn đã tạo trước đó không bị ảnh hưởng — chỉ chặn đơn mới cho tới khi bạn mở lại.'
        : 'Mở lại cho Shop tạo đơn mới bình thường?'
    )
    if (!ok) return
    setOrderCreationBlocked(next)
    refresh()
  }

  return (
    <ConfigProvider theme={superAdminTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>
        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
              Duyệt thanh toán phí ship
            </h1>
            <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
              Danh sách bên dưới chỉ để XEM trạng thái từng đơn — đối chiếu "Mã tham chiếu" với sao kê
              MoMo Business/ngân hàng thật trước. Bấm nút "Duyệt tất cả đơn chờ" để cho TOÀN BỘ đơn đang
              chờ duyệt đi tiếp (sang "chờ lấy hàng"); prototype chưa tích hợp cổng thanh toán nên không có
              xác nhận tự động.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleApproveAll}
              disabled={pendingCount === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 6,
                border: 'none', cursor: pendingCount === 0 ? 'not-allowed' : 'pointer',
                background: pendingCount === 0 ? '#D1D5DB' : '#16A34A', color: '#fff', fontSize: 14, fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <CheckOutlined /> Duyệt tất cả đơn chờ ({pendingCount})
            </button>
            <button
              onClick={handleToggleCreationBlock}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 6,
                border: creationBlocked ? 'none' : `1px solid #DC2626`, cursor: 'pointer',
                background: creationBlocked ? '#DC2626' : '#fff',
                color: creationBlocked ? '#fff' : '#DC2626', fontSize: 14, fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              <StopOutlined /> {creationBlocked ? 'Đang chặn — Mở lại tạo đơn' : 'Chặn tạo đơn mới'}
            </button>
          </div>
        </div>

        {creationBlocked && (
          <div style={{
            margin: '0 16px 12px', padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FCA5A5',
            borderRadius: 6, color: '#991B1B', fontSize: 13, fontWeight: 600, flexShrink: 0,
          }}>
            🚫 Đang chặn Shop tạo đơn mới trên toàn hệ thống — đơn đã tạo trước đó không bị ảnh hưởng. Bấm "Mở lại tạo đơn" ở trên khi xử lý xong.
          </div>
        )}

        {/* Summary counts */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#B45309', background: '#FEF3C7', borderRadius: 6, padding: '4px 12px' }}>
            {pendingCount} chờ duyệt
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', background: '#DCF3E7', borderRadius: 6, padding: '4px 12px' }}>
            {confirmedCount} đã nhận tiền
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', background: '#FEE2E2', borderRadius: 6, padding: '4px 12px' }}>
            {rejectedCount} chưa nhận tiền
          </span>
        </div>

        {/* Groups by date — thuần hiển thị */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          {groups.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
              Chưa có đơn thanh toán online nào
            </div>
          ) : groups.map(group => (
            <div key={group.key} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, padding: '10px 4px' }}>
                {dateLabel(group.key)}
                <span style={{ fontWeight: 400, color: C_TEXT_SECONDARY, marginLeft: 8 }}>
                  {group.orders.length} đơn
                </span>
              </div>
              <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ display: 'flex', background: C_BG_HEADER }}>
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Mã vận đơn</span>, '1.1 0 0', 150)}
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Shop</span>, '1.3 0 0', 170)}
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Đại lý</span>, '1.2 0 0', 160)}
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Kênh</span>, '0.7 0 0', 90)}
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Mã tham chiếu</span>, '1 0 0', 150)}
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Số tiền</span>, '0.8 0 0', 100)}
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Shop khai lúc</span>, '0.6 0 0', 80)}
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Trạng thái</span>, '1.6 0 0', 220)}
                </div>
                {group.orders.map(order => {
                  const { shopName, agencyName } = shopAndAgencyName(order.shopId)
                  return (
                    <div key={order.id} style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${C_BORDER}` }}>
                      {cell(<span style={{ fontSize: 14, fontWeight: 700, color: C_LINK }}>{order.trackingCode}</span>, '1.1 0 0', 150)}
                      {cell(<span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{shopName}</span>, '1.3 0 0', 170)}
                      {cell(<span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{agencyName}</span>, '1.2 0 0', 160)}
                      {cell(<span style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY }}>{methodLabel(order)}</span>, '0.7 0 0', 90)}
                      {cell(
                        order.paymentMethod === 'cash'
                          ? <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>—</span>
                          : order.shopOrderCode
                            ? <span style={{ fontSize: 13, fontFamily: 'monospace', color: C_TEXT_PRIMARY }}>{order.shopOrderCode}</span>
                            : <span style={{ fontSize: 12, color: '#DC2626', fontStyle: 'italic' }}>Shop chưa nhập — đối chiếu theo SĐT/tên Shop + số tiền + giờ khai</span>,
                        '1 0 0', 150
                      )}
                      {cell(<span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>{order.fee.toLocaleString('vi-VN')}đ</span>, '0.8 0 0', 100)}
                      {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{formatTime(order.paymentPaidAt)}</span>, '0.6 0 0', 80)}
                      {cell(<StatusCell order={order} />, '1.6 0 0', 220)}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ConfigProvider>
  )
}
