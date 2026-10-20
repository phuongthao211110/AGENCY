import { useState } from 'react'
import { ConfigProvider } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { agencyAdminTheme } from '../../../theme/platforms'
import { loadOrders, approveOrderPayment, loadRemittanceConfig, type Order } from '../../../mock-data/orderStore'
import { loadShops } from '../../../mock-data/shopStore'

const CURRENT_AGENCY_ID = 'AGN001'
const CURRENT_AGENT = 'Agency Admin'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

function formatTime(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
}

// Tính theo NGÀY LỊCH (so khác biệt ngày dương lịch), KHÔNG phải 24 giờ trôi qua — CÙNG CÔNG THỨC
// với daysSinceCalendar() trong orderStore.ts (shopCashOverdueDays) để số ngày hiện ở đây LUÔN
// khớp đúng với ngưỡng cảnh báo/khoá tạo đơn bên Web Shop.
function daysSince(iso?: string): number {
  if (!iso) return 0
  const now = new Date()
  const then = new Date(iso)
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const utcThen = Date.UTC(then.getFullYear(), then.getMonth(), then.getDate())
  return Math.floor((utcNow - utcThen) / (24 * 60 * 60 * 1000))
}

// Dòng chỉ HIỂN THỊ — hành động duyệt nằm ở cấp SHOP (xem ShopGroup), không duyệt/từ chối riêng
// từng dòng. Đơn "Chờ duyệt" tô màu theo đúng mức độ quá hạn (0/1-2/>=3 ngày) để khớp trực quan
// với ngưỡng cảnh báo/khoá tạo đơn bên Web Shop (xem orderStore.shopCashOverdueDays).
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
  // rejected — hiếm (xem AGA-PAYMENT-3 Notes), nhưng vẫn phải hiển thị KHÁC hẳn pending_review để
  // Agency biết đã từng kiểm tra và xác nhận KHÔNG nhận được tiền, không phải "chưa kịp duyệt".
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
  const days = daysSince(order.paymentPaidAt)
  // Ngưỡng cảnh báo/khoá do Super Admin cấu hình (Cài đặt → Quy tắc thanh toán tiền mặt) — đọc lại
  // MỖI LẦN render để luôn khớp cấu hình mới nhất, không cache.
  const { warningDays, blockDays } = loadRemittanceConfig()
  // KHÔNG hiện "Shop báo đã chuyển lúc..." ở đây — Agency không cần một thông báo kiểu "Shop tự
  // khai" để tin; Agency chỉ dựa vào số ngày trễ (tự track trên hệ thống) rồi tự đối chiếu/duyệt,
  // bất kể Shop có bấm "Thanh toán cho đại lý" bên Web Shop hay chưa (xem SHOP-ORDER-55).
  if (days >= blockDays) {
    return (
      <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', borderRadius: 4, padding: '2px 8px', width: 'fit-content' }}>
        🚫 Quá {days} ngày — đã khoá tạo đơn
      </span>
    )
  }
  if (days >= warningDays) {
    return (
      <span style={{ fontSize: 12, fontWeight: 700, color: '#B45309', background: '#FEF3C7', borderRadius: 4, padding: '2px 8px', width: 'fit-content' }}>
        ⚠ Chờ duyệt — trễ {days} ngày
      </span>
    )
  }
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: '#B45309', background: '#FEF3C7', borderRadius: 4, padding: '2px 8px', width: 'fit-content' }}>
      Chờ duyệt
    </span>
  )
}

const cell = (children: React.ReactNode, flex = '1 0 0', minWidth = 100) => (
  <div style={{ flex, minWidth, padding: '10px 8px', display: 'flex', alignItems: 'center' }}>{children}</div>
)

// Mỗi Shop 1 khối riêng: tên shop + trạng thái tổng quát của shop đó (OK/cảnh báo/đã khoá) + bảng
// đơn của RIÊNG shop này + nút "Duyệt" chỉ áp dụng cho shop này — KHÔNG ảnh hưởng tới shop khác.
function ShopGroup({ shopDisplayName, orders, onApproved }: { shopDisplayName: string; orders: Order[]; onApproved: () => void }) {
  const { warningDays, blockDays } = loadRemittanceConfig()
  const pending = orders.filter(o => o.paymentApprovalStatus === 'pending_review')
  const maxDays = pending.reduce((max, o) => Math.max(max, daysSince(o.paymentPaidAt)), 0)
  const sorted = [...orders].sort((a, b) => (b.paymentPaidAt ?? '').localeCompare(a.paymentPaidAt ?? ''))

  function handleApproveShop() {
    if (pending.length === 0) return
    const ok = window.confirm(`Duyệt ${pending.length} đơn tiền mặt đang chờ của shop "${shopDisplayName}"? Thao tác này xác nhận ĐÃ THỰC NHẬN đủ tiền shop chuyển lên — nếu shop đang bị khoá tạo đơn, sẽ được mở lại ngay.`)
    if (!ok) return
    for (const o of pending) approveOrderPayment(o.id, CURRENT_AGENT)
    onApproved()
  }

  const shopBadge = pending.length === 0
    ? <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', background: '#DCF3E7', borderRadius: 4, padding: '2px 8px' }}>Không có đơn chờ</span>
    : maxDays >= blockDays
      ? <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', borderRadius: 4, padding: '2px 8px' }}>🚫 Đang bị khoá tạo đơn</span>
      : maxDays >= warningDays
        ? <span style={{ fontSize: 12, fontWeight: 700, color: '#B45309', background: '#FEF3C7', borderRadius: 4, padding: '2px 8px' }}>⚠ Trễ {maxDays} ngày</span>
        : <span style={{ fontSize: 12, fontWeight: 700, color: '#B45309', background: '#FEF3C7', borderRadius: 4, padding: '2px 8px' }}>Có đơn chờ duyệt</span>

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>{shopDisplayName}</span>
        {shopBadge}
        <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{orders.length} đơn tiền mặt</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleApproveShop}
          disabled={pending.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6,
            border: 'none', cursor: pending.length === 0 ? 'not-allowed' : 'pointer',
            background: pending.length === 0 ? '#D1D5DB' : '#16A34A', color: '#fff', fontSize: 13, fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          <CheckOutlined /> Duyệt shop này ({pending.length})
        </button>
      </div>
      <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', background: C_BG_HEADER }}>
          {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Mã vận đơn</span>, '1.2 0 0', 150)}
          {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Số tiền</span>, '0.8 0 0', 100)}
          {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Shop khai lúc</span>, '0.9 0 0', 120)}
          {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Trạng thái</span>, '1.8 0 0', 240)}
        </div>
        {sorted.map(order => (
          <div key={order.id} style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${C_BORDER}` }}>
            {cell(<span style={{ fontSize: 14, fontWeight: 700, color: C_LINK }}>{order.trackingCode}</span>, '1.2 0 0', 150)}
            {cell(<span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>{order.fee.toLocaleString('vi-VN')}đ</span>, '0.8 0 0', 100)}
            {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{formatTime(order.paymentPaidAt)}</span>, '0.9 0 0', 120)}
            {cell(<StatusCell order={order} />, '1.8 0 0', 240)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CashRemittance() {
  const [, tick] = useState(0)
  const refresh = () => tick(n => n + 1)

  const { warningDays, blockDays } = loadRemittanceConfig()
  const agencyShops = loadShops().filter(s => s.agencyId === CURRENT_AGENCY_ID)
  const orders = loadOrders()
  // Chỉ TIỀN MẶT — MoMo/Chuyển khoản tự "Đã nhận" ngay lúc tạo đơn (xem SHOP-ORDER-43), không bao
  // giờ còn nằm trong hàng chờ duyệt này.
  const relevantOrders = orders.filter(o => o.paymentMethod === 'cash' && !!o.paymentApprovalStatus)
  const pendingOrders = relevantOrders.filter(o => o.paymentApprovalStatus === 'pending_review')
  const warningOrders = pendingOrders.filter(o => { const d = daysSince(o.paymentPaidAt); return d >= warningDays && d < blockDays })
  const blockedOrders = pendingOrders.filter(o => daysSince(o.paymentPaidAt) >= blockDays)
  const confirmedCount = relevantOrders.filter(o => o.paymentApprovalStatus === 'confirmed').length

  // Nhóm theo shop — CHỈ hiện shop nào có ít nhất 1 đơn tiền mặt; mỗi shop duyệt riêng (xem ShopGroup).
  const shopsWithOrders = agencyShops
    .map(shop => ({ shop, orders: relevantOrders.filter(o => o.shopId === shop.id) }))
    .filter(g => g.orders.length > 0)

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>
        {/* Page header */}
        <div style={{ padding: '12px 16px', flexShrink: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
            Duyệt thanh toán
          </h1>
          <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: '4px 0 0', lineHeight: '20px' }}>
            Shop (bưu cục) thu hộ tiền mặt phí ship phải chuyển lại cho Agency — đối chiếu rồi bấm
            "Duyệt shop này" ở từng shop để xác nhận đã nhận đủ. Quá {warningDays} ngày chưa duyệt: Shop vẫn tạo
            đơn được nhưng bị nhắc; quá {blockDays} ngày: Shop đó tự động bị khoá tạo đơn mới cho tới khi duyệt xong.
            (Ngưỡng do Super Admin cấu hình ở Cài đặt → Quy tắc thanh toán tiền mặt.)
          </p>
        </div>

        {/* Summary counts */}
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#B45309', background: '#FEF3C7', borderRadius: 6, padding: '4px 12px' }}>
            {pendingOrders.length} chờ duyệt
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#B45309', background: '#FEF3C7', borderRadius: 6, padding: '4px 12px' }}>
            {warningOrders.length} trễ {warningDays === blockDays - 1 ? `${warningDays}` : `${warningDays}-${blockDays - 1}`} ngày
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626', background: '#FEE2E2', borderRadius: 6, padding: '4px 12px' }}>
            {blockedOrders.length} đã khoá tạo đơn (≥{blockDays} ngày)
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', background: '#DCF3E7', borderRadius: 6, padding: '4px 12px' }}>
            {confirmedCount} đã nhận tiền
          </span>
        </div>

        {/* Danh sách theo TỪNG SHOP */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          {shopsWithOrders.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
              Chưa có đơn tiền mặt nào của các shop thuộc đại lý
            </div>
          ) : shopsWithOrders.map(({ shop, orders }) => (
            <ShopGroup key={shop.id} shopDisplayName={shop.name} orders={orders} onApproved={refresh} />
          ))}
        </div>
      </div>
    </ConfigProvider>
  )
}
