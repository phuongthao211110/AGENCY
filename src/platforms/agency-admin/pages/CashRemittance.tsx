import { useState, useEffect } from 'react'
import { ConfigProvider } from 'antd'
import { CheckOutlined, EyeOutlined, SearchOutlined, DownOutlined, ArrowLeftOutlined, CloseOutlined } from '@ant-design/icons'
import { agencyAdminTheme } from '../../../theme/platforms'
import { loadOrders, approveOrderPayment, confirmFeeRefund, confirmCancelRefund, loadRemittanceConfig, type Order } from '../../../mock-data/orderStore'
import { loadShops, type Shop } from '../../../mock-data/shopStore'
import { Pagination } from './AgencyOrders'

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

const cell = (children: React.ReactNode, flex = '1 0 0', minWidth = 100, align: 'left' | 'right' = 'left') => (
  <div style={{ flex, minWidth, padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
    {children}
  </div>
)

// Gộp số liệu đối soát của 1 shop — tính lại mỗi lần render (không cache) để luôn khớp dữ liệu mới
// nhất sau mỗi lần duyệt. `blocked` dùng ĐÚNG công thức isOrderCreationBlocked (orderStore.ts):
// có đơn chờ duyệt VÀ đơn cũ nhất đã trễ >= blockDays của đại lý.
interface ShopCashStats {
  shop: Shop
  orders: Order[]
  pending: Order[]
  pendingFeeTotal: number
  maxDays: number
  blocked: boolean
}

function buildShopStats(shop: Shop, relevantOrders: Order[], blockDays: number): ShopCashStats {
  const orders = relevantOrders.filter(o => o.shopId === shop.id)
  const pending = orders.filter(o => o.paymentApprovalStatus === 'pending_review')
  const maxDays = pending.reduce((max, o) => Math.max(max, daysSince(o.paymentPaidAt)), 0)
  const pendingFeeTotal = pending.reduce((sum, o) => sum + o.fee, 0)
  return { shop, orders, pending, pendingFeeTotal, maxDays, blocked: pending.length > 0 && maxDays >= blockDays }
}

function approveShop(stats: ShopCashStats): boolean {
  if (stats.pending.length === 0) return false
  const ok = window.confirm(`Duyệt ${stats.pending.length} đơn tiền mặt đang chờ của shop "${stats.shop.name}"? Thao tác này xác nhận ĐÃ THỰC NHẬN đủ tiền shop chuyển lên — nếu shop đang bị khoá tạo đơn, sẽ được mở lại ngay.`)
  if (!ok) return false
  for (const o of stats.pending) approveOrderPayment(o.id, CURRENT_AGENT)
  return true
}

// Nhãn loại đơn nhỏ dưới mã vận đơn trong bảng Chi tiết — "📦 Hàng hoá" / "✉️ Thư".
function SendKindTag({ order }: { order: Order }) {
  const isLetter = order.sendKind === 'letter'
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600, borderRadius: 4, padding: '1px 6px', marginTop: 2,
      background: isLetter ? '#EDE9FE' : '#FFF4ED', color: isLetter ? '#7C3AED' : '#FF5200',
    }}>
      {isLetter ? '✉️ Thư' : '📦 Hàng hoá'}
    </span>
  )
}

// "Phí dịch vụ hiệu lực" của 1 đơn — ĐÚNG order.fee, TRỪ 1 ngoại lệ: đơn đã huỷ mà chưa xác nhận
// hoàn tiền thì coi như fee hiệu lực = 0 (đơn huỷ không còn nghĩa vụ phí ship nào nữa, toàn bộ số
// đã duyệt trước đó cần hoàn lại). Dùng đúng 1 công thức DUY NHẤT (rowAmounts/OrderStatusLine) cho
// CẢ 2 nguyên nhân cần hoàn tiền (huỷ đơn / phí điều chỉnh giảm) thay vì tách UI riêng — tránh
// người dùng phải học 2 nhãn khác nhau cho cùng 1 khái niệm "đại lý nợ Shop".
function effectiveFee(order: Order): number {
  if (order.status === 'cancelled' && !order.cancelRefundConfirmedAt) return 0
  return order.fee
}

// Gọi đúng hàm xác nhận hoàn tiền tương ứng với NGUYÊN NHÂN thật của đơn — người dùng chỉ thấy 1
// nút "Xác nhận đã hoàn" duy nhất, không cần biết có 2 hàm khác nhau phía sau.
function confirmRefundFor(order: Order, confirmedBy: string): boolean {
  return order.status === 'cancelled'
    ? confirmCancelRefund(order.id, confirmedBy)
    : confirmFeeRefund(order.id, confirmedBy)
}

// Dòng Trạng thái trong bảng Chi tiết — 2 dòng chữ màu thuần (không nền), KHÁC StatusCell (vốn có
// nền pill) để khớp đúng ảnh tham khảo của màn Chi tiết: "Đã thanh toán"/giờ xác nhận (xanh) hoặc
// "Chưa thanh toán"/số ngày trễ (đỏ). Bấm "Chi tiết" mở breakdown giải thích lý do — xem
// OrderFeeBreakdownModal.
function OrderStatusLine({ order, onRefunded }: { order: Order; onRefunded?: () => void }) {
  if (order.paymentApprovalStatus === 'confirmed') {
    const approvedAmount = order.paymentApprovedAmount ?? order.fee
    const extra = effectiveFee(order) - approvedAmount
    // Đơn đã duyệt nhưng fee TĂNG THÊM sau đó (phí hoàn hàng/đổi địa chỉ, xem SHOP-ORDER-56) mà
    // phần tăng chưa được duyệt lại — KHÔNG được ghi "Đã thanh toán" (gây hiểu lầm đơn đã xong hẳn)
    // trong khi cột Chưa thanh toán bên cạnh vẫn đang tô cam báo còn khoản chưa duyệt.
    if (extra > 0) {
      const reason = order.status === 'returning' ? 'Phí hoàn hàng' : (order.feeAddressChange ?? 0) > 0 ? 'Phụ phí đổi địa chỉ' : 'Khoản mới'
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FF5200' }}>Phát sinh thêm</span>
          <span style={{ fontSize: 12, color: '#FF5200' }}>{reason} chưa duyệt</span>
        </div>
      )
    }
    // Chiều NGƯỢC: fee hiệu lực GIẢM xuống dưới số đã duyệt — HOẶC vì phúc tra phát hiện phí thật
    // thấp hơn (đơn còn sống), HOẶC vì đơn đã bị huỷ (fee hiệu lực về 0) — đại lý đã thực nhận
    // NHIỀU HƠN mức đúng, cần chủ động hoàn lại phần chênh lệch cho Shop. Nút "Xác nhận đã hoàn"
    // gọi đúng hàm tương ứng qua confirmRefundFor().
    if (extra < 0) {
      const refundAmount = -extra
      function handleRefund() {
        const reason = order.status === 'cancelled'
          ? 'vì đơn này đã bị huỷ sau khi đã thanh toán'
          : `vì phí ship giảm từ ${approvedAmount.toLocaleString('vi-VN')}đ xuống ${order.fee.toLocaleString('vi-VN')}đ`
        const ok = window.confirm(`Xác nhận đã hoàn ${refundAmount.toLocaleString('vi-VN')}đ cho shop ${reason}?`)
        if (!ok) return
        if (confirmRefundFor(order, CURRENT_AGENT)) onRefunded?.()
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#3B82F6' }}>Cần hoàn tiền Shop</span>
          <span style={{ fontSize: 12, color: '#3B82F6' }}>{refundAmount.toLocaleString('vi-VN')}đ</span>
          <button
            onClick={handleRefund}
            style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, color: '#fff', background: '#3B82F6', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer' }}
          >
            Xác nhận đã hoàn
          </button>
        </div>
      )
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>Đã thanh toán</span>
        <span style={{ fontSize: 12, color: '#16A34A' }}>{formatTime(order.paymentApprovedAt)} {order.paymentApprovedAt ? new Date(order.paymentApprovedAt).toLocaleDateString('vi-VN') : ''}</span>
      </div>
    )
  }
  if (order.paymentApprovalStatus === 'rejected') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>Chưa thanh toán</span>
        <span style={{ fontSize: 12, color: '#DC2626' }}>Bị từ chối: {order.paymentApprovalRejectedReason ?? '—'}</span>
      </div>
    )
  }
  const days = daysSince(order.paymentPaidAt)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>Chưa thanh toán</span>
      {days >= 1 && <span style={{ fontSize: 12, color: '#DC2626' }}>Quá {days} ngày</span>}
    </div>
  )
}

// Tách Phí dịch vụ / Đã thanh toán / Chưa thanh toán THEO TỪNG ĐƠN — DÙNG CHUNG đúng công thức với
// rowAmounts() ở Web Shop (CashFlowReport.tsx) để 2 bên LUÔN khớp số, không lệch cách tính. `fee` có
// thể đổi CẢ 2 CHIỀU sau khi confirmed: TĂNG (phí hoàn hàng/đổi địa chỉ, SHOP-ORDER-56) → chuaThanhToan
// ÂM (Shop còn nợ thêm); GIẢM (phúc tra phát hiện phí thật thấp hơn) → chuaThanhToan DƯƠNG (đại lý
// cần hoàn lại phần chênh lệch cho Shop, xem OrderStatusLine). KHÔNG kẹp về 0 nữa — kẹp sẽ làm mất
// thông tin. Bất biến đúng: `fee = daThanhToan - chuaThanhToan` (dùng được cho cả 2 chiều, vì
// chuaThanhToan = -extra luôn đổi dấu đúng theo extra).
function rowAmounts(order: Order) {
  const fee = effectiveFee(order)
  // `|| 0` chuẩn hoá -0 thành 0 — effectiveFee() trả 0 cho đơn huỷ chưa hoàn, nên -fee ra đúng giá
  // trị -0 (hợp lệ về mặt số học nhưng toLocaleString() hiện thành chuỗi "-0" xấu, gây khó hiểu).
  if (order.paymentApprovalStatus !== 'confirmed') return { phiDichVu: -fee || 0, daThanhToan: 0, chuaThanhToan: -fee || 0 }
  const approvedAmount = order.paymentApprovedAmount ?? fee
  const extra = fee - approvedAmount
  return { phiDichVu: -fee || 0, daThanhToan: approvedAmount, chuaThanhToan: -extra || 0 }
}

// Breakdown phí ship THEO ĐÚNG hạng mục GHN thật — DÙNG CHUNG công thức với Web Shop
// (feeBreakdownRows, CashFlowReport.tsx) để Agency Admin thấy ĐÚNG những gì Shop đã thấy, không bịa
// thêm hạng mục nào riêng cho phía đại lý.
function feeBreakdownRows(order: Order): Array<{ label: string; amount: number }> {
  const hasBreakdown = order.feeShipping !== undefined
  const fallbackShipping = order.fee - (order.feeReturn ?? 0) - (order.feeAddressChange ?? 0)
  return [
    { label: 'Phí giao hàng', amount: -(hasBreakdown ? order.feeShipping! : fallbackShipping) },
    { label: 'Phí bảo hiểm (khai giá)', amount: -(order.feeInsurance ?? 0) },
    { label: 'Phí giao trả 1 phần', amount: -(order.feePartial ?? 0) },
    { label: 'Phí giao thất bại thu tiền', amount: -(order.feeDeliveryFail ?? 0) },
    { label: 'Phí thu hộ', amount: -(order.feeCod ?? 0) },
    { label: 'Phí trả hàng (hoàn hàng)', amount: -(order.feeReturn ?? 0) },
    { label: 'Phụ phí đổi địa chỉ', amount: -(order.feeAddressChange ?? 0) },
  ]
}

// Modal giải thích LÝ DO cụ thể của cột "Chưa thanh toán"/"Cần hoàn tiền Shop" — mở khi bấm "Chi
// tiết" trong OrderStatusLine, giống hệt cách Web Shop giải thích qua FeeBreakdownModal (bấm vào số
// "Phí dịch vụ" ở Báo cáo dòng tiền, SHOP-ORDER-55) — Agency Admin trước đây chỉ có nhãn ngắn gọn
// ("Phát sinh thêm"/"Cần hoàn tiền Shop"), không có nơi nào giải thích rõ RA SAO mà ra số đó.
// Breakdown của cột "Đã thanh toán" — KHÔNG phải breakdown PHÍ (OrderFeeBreakdownModal ở trên), mà
// là breakdown KÊNH THANH TOÁN (tiền trả bằng cách nào) — PORT nguyên vẹn từ Web Shop
// (paymentBreakdownRows/PaymentBreakdownModal, CashFlowReport.tsx) để Agency Admin thấy ĐÚNG những
// gì Shop đã thấy. Prototype chỉ có 1 field `paymentMethod` duy nhất mỗi đơn, nên ĐÚNG 1 dòng khớp
// sẽ bằng toàn bộ số đã thanh toán, 4 dòng còn lại luôn = 0.
function paymentBreakdownRows(order: Order): Array<{ label: string; amount: number }> {
  const paid = order.paymentApprovalStatus === 'confirmed' ? (order.paymentApprovedAmount ?? order.fee) : 0
  return [
    { label: 'Cấn bằng COD', amount: 0 },
    { label: 'Thanh toán qua ví', amount: order.paymentMethod === 'momo' ? paid : 0 },
    { label: 'Tiền mặt thu người nhận', amount: 0 },
    { label: 'Tiền mặt thu người gửi', amount: order.paymentMethod === 'cash' ? paid : 0 },
    { label: 'Thanh toán qua ck ngân hàng', amount: order.paymentMethod === 'bank_transfer' ? paid : 0 },
  ]
}

function PaymentBreakdownModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const paid = order.paymentApprovalStatus === 'confirmed' ? (order.paymentApprovedAmount ?? order.fee) : 0
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 440, maxHeight: '80vh', overflowY: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}
      >
        <div style={{ padding: '16px 24px', background: C_BG_HEADER, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C_TEXT_PRIMARY }}>{order.trackingCode}</span>
          <CloseOutlined onClick={onClose} style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, fontSize: 16 }} />
        </div>

        <div style={{ padding: '16px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_SECONDARY, letterSpacing: 0.5 }}>ĐÃ THANH TOÁN</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: C_TEXT_PRIMARY }}>{paid.toLocaleString('vi-VN')}</span>
        </div>
        <div style={{ margin: '0 24px', borderTop: `2px solid ${C_TEXT_PRIMARY}` }} />

        <div style={{ padding: '4px 24px 8px' }}>
          {paymentBreakdownRows(order).map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px dashed ${C_BORDER}` }}>
              <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{row.label}</span>
              <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{row.amount.toLocaleString('vi-VN')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OrderFeeBreakdownModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const approvedAmount = order.paymentApprovedAmount ?? order.fee
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 440, maxHeight: '80vh', overflowY: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}
      >
        <div style={{ padding: '16px 24px', background: C_BG_HEADER, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C_TEXT_PRIMARY }}>{order.trackingCode}</span>
          <CloseOutlined onClick={onClose} style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, fontSize: 16 }} />
        </div>

        {order.status === 'cancelled' ? (
          <div style={{ margin: 16, padding: 12, borderRadius: 8, background: '#DBEAFE', border: '1px solid #93C5FD' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginBottom: 4 }}>Vì sao cần hoàn tiền?</div>
            <div style={{ fontSize: 13, color: '#1D4ED8' }}>
              Đơn này đã HUỶ, nhưng Shop đã thanh toán {approvedAmount.toLocaleString('vi-VN')}đ trước khi huỷ — đơn huỷ không còn nghĩa vụ phí ship nào, nên đại lý cần hoàn lại toàn bộ số tiền đó cho Shop.
            </div>
          </div>
        ) : order.fee < approvedAmount ? (
          <div style={{ margin: 16, padding: 12, borderRadius: 8, background: '#DBEAFE', border: '1px solid #93C5FD' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', marginBottom: 4 }}>Vì sao cần hoàn tiền?</div>
            <div style={{ fontSize: 13, color: '#1D4ED8' }}>
              Phí ship đã điều chỉnh GIẢM từ {approvedAmount.toLocaleString('vi-VN')}đ (mức đã duyệt trước đó) xuống còn {order.fee.toLocaleString('vi-VN')}đ — đại lý đã thực nhận nhiều hơn mức đúng, cần hoàn lại phần chênh lệch {(approvedAmount - order.fee).toLocaleString('vi-VN')}đ cho Shop.
            </div>
          </div>
        ) : order.fee > approvedAmount ? (
          <div style={{ margin: 16, padding: 12, borderRadius: 8, background: '#FFF4ED', border: '1px solid #FECBA1' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FF5200', marginBottom: 4 }}>Vì sao còn chưa thanh toán?</div>
            <div style={{ fontSize: 13, color: '#FF5200' }}>
              Phí ship đã điều chỉnh TĂNG từ {approvedAmount.toLocaleString('vi-VN')}đ (mức đã duyệt trước đó) lên {order.fee.toLocaleString('vi-VN')}đ (phí hoàn hàng/đổi địa chỉ phát sinh sau khi duyệt) — phần tăng thêm {(order.fee - approvedAmount).toLocaleString('vi-VN')}đ chưa được duyệt lại, Shop còn cần thanh toán thêm khoản này.
            </div>
          </div>
        ) : null}

        <div style={{ padding: '16px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_SECONDARY, letterSpacing: 0.5 }}>PHÍ DỊCH VỤ (hiện tại)</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: C_TEXT_PRIMARY }}>{(-order.fee).toLocaleString('vi-VN')}</span>
        </div>
        <div style={{ margin: '0 24px', borderTop: `2px solid ${C_TEXT_PRIMARY}` }} />

        <div style={{ padding: '4px 24px 16px' }}>
          {feeBreakdownRows(order).map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px dashed ${C_BORDER}` }}>
              <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{row.label}</span>
              <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{row.amount.toLocaleString('vi-VN')}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>Đại lý đã duyệt (snapshot)</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>{approvedAmount.toLocaleString('vi-VN')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

type DetailTab = 'all' | 'unpaid' | 'paid'

// Màn Chi tiết — THAY HẲN modal cũ bằng 1 view full-trang (có nút "←" quay lại), đúng theo ảnh tham
// khảo thật: header + badge trạng thái + nút "Đã nhận", 3 thẻ tổng quan, 3 tab Tất cả/Chưa/Đã thanh
// toán, tìm kiếm theo mã đơn, bảng + phân trang riêng — mô phỏng lại ĐÚNG bố cục trang danh sách bên
// ngoài nhưng thu hẹp phạm vi về 1 shop.
function ShopDetailView({ stats, onBack, onApproved }: { stats: ShopCashStats; onBack: () => void; onApproved: () => void }) {
  const [tab, setTab] = useState<DetailTab>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [breakdownOrder, setBreakdownOrder] = useState<Order | null>(null)
  const [paymentBreakdownOrder, setPaymentBreakdownOrder] = useState<Order | null>(null)

  useEffect(() => { setPage(1) }, [tab, search])

  const confirmed = stats.orders.filter(o => o.paymentApprovalStatus === 'confirmed')
  const unpaid = stats.orders.filter(o => o.paymentApprovalStatus !== 'confirmed')

  function handleApprove() {
    if (approveShop(stats)) {
      onApproved()
      onBack()
    }
  }

  const byTab = tab === 'all' ? stats.orders : tab === 'unpaid' ? unpaid : confirmed
  const q = search.trim().toLowerCase()
  const filtered = q ? byTab.filter(o => o.trackingCode.toLowerCase().includes(q)) : byTab
  const sorted = [...filtered].sort((a, b) => (b.paymentPaidAt ?? '').localeCompare(a.paymentPaidAt ?? ''))
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <>
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
        <ArrowLeftOutlined onClick={onBack} style={{ cursor: 'pointer', fontSize: 18, color: C_TEXT_PRIMARY, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>{stats.shop.name}</h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '2px 10px',
              background: stats.blocked ? '#FEE2E2' : '#DCF3E7', color: stats.blocked ? '#DC2626' : '#16A34A',
            }}>
              {stats.blocked ? '🚫 Đã khoá tạo đơn' : '✓ Cho phép tạo đơn'}
            </span>
          </div>
          <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, marginTop: 2 }}>{stats.shop.id}</div>
        </div>
        <button
          onClick={handleApprove}
          disabled={stats.pending.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6,
            border: 'none', cursor: stats.pending.length === 0 ? 'not-allowed' : 'pointer',
            background: stats.pending.length === 0 ? '#D1D5DB' : '#16A34A', color: '#fff', fontSize: 13, fontWeight: 700,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          <CheckOutlined /> Đã nhận
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, padding: '0 16px 16px', flexShrink: 0 }}>
        <SummaryCard label="Tổng đơn hàng" value={String(stats.orders.length)} />
        <SummaryCard label="Tổng đơn hàng chưa thanh toán" value={String(unpaid.length)} color={unpaid.length > 0 ? '#DC2626' : undefined} />
        <SummaryCard label="Tổng phí ship chưa thanh toán (đ)" value={unpaid.reduce((sum, o) => sum + o.fee, 0).toLocaleString('vi-VN')} color={unpaid.length > 0 ? '#DC2626' : undefined} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '0 16px', flexShrink: 0 }}>
        {([
          { key: 'all' as const, label: 'Tất cả', count: stats.orders.length },
          { key: 'unpaid' as const, label: 'Chưa thanh toán', count: unpaid.length },
          { key: 'paid' as const, label: 'Đã thanh toán', count: confirmed.length },
        ]).map(t => (
          <div
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 6,
              cursor: 'pointer', fontSize: 14, fontWeight: 600,
              background: tab === t.key ? C_TEXT_PRIMARY : 'transparent',
              color: tab === t.key ? '#fff' : C_TEXT_PRIMARY,
            }}
          >
            {t.label}
            <span style={{
              fontSize: 12, fontWeight: 700, borderRadius: 10, padding: '0 6px', minWidth: 18, textAlign: 'center',
              background: tab === t.key ? 'rgba(255,255,255,0.2)' : C_BG_HEADER,
              color: tab === t.key ? '#fff' : C_TEXT_SECONDARY,
            }}>
              {t.count}
            </span>
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: C_BORDER, margin: '8px 16px 0' }} />

      {/* Search */}
      <div style={{ padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, maxWidth: 360, height: 36 }}>
          <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo mã đơn hàng"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', background: C_BG_HEADER }}>
            {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Mã đơn hàng</span>, '1.2 0 0', 150)}
            {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Phí dịch vụ</span>, '0.8 0 0', 110, 'right')}
            {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Đã thanh toán</span>, '0.8 0 0', 110, 'right')}
            {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Chưa thanh toán</span>, '0.8 0 0', 120, 'right')}
            {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Shop khai lúc</span>, '0.8 0 0', 120)}
            {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Trạng thái</span>, '0.9 0 0', 150)}
          </div>
          {paged.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14, borderTop: `1px solid ${C_BORDER}` }}>
              Không có đơn nào
            </div>
          ) : paged.map(order => {
            const a = rowAmounts(order)
            return (
              <div key={order.id} style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${C_BORDER}` }}>
                {cell(
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C_LINK }}>{order.trackingCode}</div>
                    <SendKindTag order={order} />
                  </div>,
                  '1.2 0 0', 150
                )}
                {cell(
                  <span
                    onClick={() => setBreakdownOrder(order)}
                    style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {a.phiDichVu.toLocaleString('vi-VN')}
                  </span>,
                  '0.8 0 0', 110, 'right'
                )}
                {cell(
                  <span
                    onClick={() => setPaymentBreakdownOrder(order)}
                    style={{ fontSize: 14, color: C_TEXT_PRIMARY, textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    {a.daThanhToan.toLocaleString('vi-VN')}
                  </span>,
                  '0.8 0 0', 110, 'right'
                )}
                {cell(
                  a.chuaThanhToan !== 0 ? (
                    <span style={{ display: 'inline-block', fontSize: 13, fontWeight: 700, color: '#fff', background: a.chuaThanhToan < 0 ? '#FF5200' : '#3B82F6', borderRadius: 4, padding: '2px 8px' }}>
                      {a.chuaThanhToan.toLocaleString('vi-VN')}
                    </span>
                  ) : (
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>0</span>
                  ),
                  '0.8 0 0', 120, 'right'
                )}
                {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{formatTime(order.paymentPaidAt)}</span>, '0.8 0 0', 120)}
                {cell(<OrderStatusLine order={order} onRefunded={onApproved} />, '0.9 0 0', 150)}
              </div>
            )
          })}
        </div>
      </div>

      <Pagination
        page={safePage}
        total={sorted.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={s => { setPageSize(s); setPage(1) }}
      />
    </div>
    {breakdownOrder && (
      <OrderFeeBreakdownModal order={breakdownOrder} onClose={() => setBreakdownOrder(null)} />
    )}
    {paymentBreakdownOrder && (
      <PaymentBreakdownModal order={paymentBreakdownOrder} onClose={() => setPaymentBreakdownOrder(null)} />
    )}
    </>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, border: `1px solid ${C_BORDER}`, borderRadius: 8, padding: '14px 16px', background: '#fff' }}>
      <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color ?? C_TEXT_PRIMARY, lineHeight: '32px' }}>{value}</div>
    </div>
  )
}

type StatusFilter = 'all' | 'blocked' | 'allowed'

export default function CashRemittance() {
  const [, tick] = useState(0)
  const refresh = () => tick(n => n + 1)

  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('pending')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [selectedShopIds, setSelectedShopIds] = useState<Set<string>>(new Set())
  const [detailShopId, setDetailShopId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  useEffect(() => { setPage(1) }, [activeTab, search, statusFilter])
  useEffect(() => { setSelectedShopIds(new Set()) }, [activeTab])

  const { blockDays } = loadRemittanceConfig(CURRENT_AGENCY_ID)
  const agencyShops = loadShops().filter(s => s.agencyId === CURRENT_AGENCY_ID)
  const orders = loadOrders()
  // Chỉ TIỀN MẶT — MoMo/Chuyển khoản tự "Đã nhận" ngay lúc tạo đơn (xem SHOP-ORDER-43), không bao
  // giờ còn nằm trong hàng chờ duyệt này.
  const relevantOrders = orders.filter(o => o.paymentMethod === 'cash' && !!o.paymentApprovalStatus)
  const pendingOrders = relevantOrders.filter(o => o.paymentApprovalStatus === 'pending_review')

  // CHỈ hiện shop nào có ít nhất 1 đơn tiền mặt liên quan — shop chưa từng phát sinh đơn tiền mặt
  // không có gì để duyệt, không cần xuất hiện ở đây.
  const allStats = agencyShops
    .map(shop => buildShopStats(shop, relevantOrders, blockDays))
    .filter(s => s.orders.length > 0)

  const pendingShops = allStats.filter(s => s.pending.length > 0)
  const confirmedShops = allStats.filter(s => s.pending.length === 0)
  const blockedShopsCount = pendingShops.filter(s => s.blocked).length

  // Tra lại TỪ allStats (không giữ snapshot cũ trong state) mỗi lần render — sau khi duyệt xong,
  // nếu vẫn đang ở màn Chi tiết (hiếm, chỉ khi duyệt hàng loạt/chọn nhiều không đi qua màn này),
  // số liệu hiện vẫn tự cập nhật đúng ngay, không bị lệch.
  const detailStats = detailShopId ? allStats.find(s => s.shop.id === detailShopId) ?? null : null

  function matchesSearch(shop: Shop): boolean {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return shop.name.toLowerCase().includes(q) || shop.id.toLowerCase().includes(q)
  }

  const filteredPendingShops = pendingShops.filter(s => matchesSearch(s.shop) && (statusFilter === 'all' || (statusFilter === 'blocked' ? s.blocked : !s.blocked)))
  const filteredConfirmedShops = confirmedShops.filter(s => matchesSearch(s.shop))

  const activeRows = activeTab === 'pending' ? filteredPendingShops : filteredConfirmedShops
  const totalPages = Math.max(1, Math.ceil(activeRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedRows = activeRows.slice((safePage - 1) * pageSize, safePage * pageSize)

  function handleApproveShopRow(stats: ShopCashStats) {
    if (approveShop(stats)) refresh()
  }

  function toggleSelect(shopId: string) {
    setSelectedShopIds(prev => {
      const next = new Set(prev)
      if (next.has(shopId)) next.delete(shopId)
      else next.add(shopId)
      return next
    })
  }

  const pagedPendingIds = pagedRows.map(s => s.shop.id)
  const allPagedSelected = pagedPendingIds.length > 0 && pagedPendingIds.every(id => selectedShopIds.has(id))

  function toggleSelectAllPaged() {
    setSelectedShopIds(prev => {
      const next = new Set(prev)
      if (allPagedSelected) pagedPendingIds.forEach(id => next.delete(id))
      else pagedPendingIds.forEach(id => next.add(id))
      return next
    })
  }

  function handleApproveSelected() {
    const targets = pendingShops.filter(s => selectedShopIds.has(s.shop.id) && s.pending.length > 0)
    if (targets.length === 0) return
    const totalOrders = targets.reduce((sum, s) => sum + s.pending.length, 0)
    const ok = window.confirm(`Duyệt tổng cộng ${totalOrders} đơn tiền mặt đang chờ của ${targets.length} shop đã chọn? Thao tác này xác nhận ĐÃ THỰC NHẬN đủ tiền từng shop chuyển lên.`)
    if (!ok) return
    for (const s of targets) for (const o of s.pending) approveOrderPayment(o.id, CURRENT_AGENT)
    setSelectedShopIds(new Set())
    refresh()
  }

  const STATUS_FILTER_LABELS: Record<StatusFilter, string> = { all: 'Tất cả', blocked: 'Đã khoá tạo đơn', allowed: 'Cho phép tạo đơn' }

  // Màn "Chi tiết" THAY HẲN (không phải modal đè lên) danh sách chính khi đang xem 1 shop — đúng
  // theo ảnh tham khảo (có nút "←" quay lại thay vì overlay/X).
  if (detailStats) {
    return (
      <ConfigProvider theme={agencyAdminTheme}>
        <ShopDetailView stats={detailStats} onBack={() => setDetailShopId(null)} onApproved={refresh} />
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>
        {/* Page header */}
        <div style={{ padding: '12px 16px', flexShrink: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
            Duyệt thanh toán
          </h1>
          <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: '4px 0 0', lineHeight: '20px' }}>
            Đối soát và xác nhận phí ship shop phải chuyển cho đại lý
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'flex', gap: 12, padding: '0 16px 16px', flexShrink: 0 }}>
          <SummaryCard label="Tổng đơn hàng chưa thanh toán" value={String(pendingOrders.length)} color={pendingOrders.length > 0 ? '#DC2626' : undefined} />
          <SummaryCard label="Tổng phí ship chưa thanh toán (đ)" value={pendingOrders.reduce((sum, o) => sum + o.fee, 0).toLocaleString('vi-VN')} color={pendingOrders.length > 0 ? '#DC2626' : undefined} />
          <SummaryCard label="Shop bị khoá tạo đơn" value={`${blockedShopsCount} / ${allStats.length}`} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '0 16px', flexShrink: 0 }}>
          {([
            { key: 'pending' as const, label: 'Chờ xác nhận', count: pendingShops.length },
            { key: 'confirmed' as const, label: 'Đã xác nhận', count: confirmedShops.length },
          ]).map(tab => (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 6,
                cursor: 'pointer', fontSize: 14, fontWeight: 600,
                background: activeTab === tab.key ? C_TEXT_PRIMARY : 'transparent',
                color: activeTab === tab.key ? '#fff' : C_TEXT_PRIMARY,
              }}
            >
              {tab.label}
              <span style={{
                fontSize: 12, fontWeight: 700, borderRadius: 10, padding: '0 6px', minWidth: 18, textAlign: 'center',
                background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : C_BG_HEADER,
                color: activeTab === tab.key ? '#fff' : C_TEXT_SECONDARY,
              }}>
                {tab.count}
              </span>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: C_BORDER, margin: '8px 16px 0' }} />

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', flexShrink: 0 }}>
          {activeTab === 'pending' && (
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setStatusDropdownOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer' }}
              >
                <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>Trạng thái</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap' }}>{STATUS_FILTER_LABELS[statusFilter]}</span>
                <DownOutlined style={{ fontSize: 10, color: C_TEXT_SECONDARY }} />
              </div>
              {statusDropdownOpen && (
                <>
                  <div onClick={() => setStatusDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                  <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 11, minWidth: 180 }}>
                    {(['all', 'blocked', 'allowed'] as StatusFilter[]).map(key => (
                      <div
                        key={key}
                        onClick={() => { setStatusFilter(key); setStatusDropdownOpen(false) }}
                        style={{ padding: '8px 12px', fontSize: 14, color: C_TEXT_PRIMARY, cursor: 'pointer', fontWeight: statusFilter === key ? 700 : 400, background: statusFilter === key ? C_BG_HEADER : 'transparent' }}
                      >
                        {STATUS_FILTER_LABELS[key]}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, flex: 1, maxWidth: 360, height: 36 }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo tên shop hoặc mã shop"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent' }}
            />
          </div>

          {activeTab === 'pending' && selectedShopIds.size > 0 && (
            <button
              onClick={handleApproveSelected}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              <CheckOutlined /> Duyệt {selectedShopIds.size} shop đã chọn
            </button>
          )}
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
            {activeTab === 'pending' ? (
              <div style={{ display: 'flex', background: C_BG_HEADER }}>
                {cell(<input type="checkbox" checked={allPagedSelected} onChange={toggleSelectAllPaged} style={{ cursor: 'pointer' }} />, '0.3 0 0', 40)}
                {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Shop</span>, '1.6 0 0', 220)}
                {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Trạng thái</span>, '1 0 0', 150)}
                {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Đơn hàng chưa thanh toán</span>, '1 0 0', 180, 'right')}
                {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Phí ship chưa thanh toán (đ)</span>, '1.1 0 0', 190, 'right')}
                {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Thao tác</span>, '1.3 0 0', 210)}
              </div>
            ) : (
              <div style={{ display: 'flex', background: C_BG_HEADER }}>
                {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Shop</span>, '2 0 0', 220)}
                {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Trạng thái</span>, '1 0 0', 160)}
                {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Thao tác</span>, '1 0 0', 140)}
              </div>
            )}

            {pagedRows.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14, borderTop: `1px solid ${C_BORDER}` }}>
                {activeTab === 'pending' ? 'Không có shop nào đang chờ xác nhận' : 'Không có shop nào đã xác nhận'}
              </div>
            ) : activeTab === 'pending' ? (
              pagedRows.map(stats => (
                <div key={stats.shop.id} style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${C_BORDER}` }}>
                  {cell(<input type="checkbox" checked={selectedShopIds.has(stats.shop.id)} onChange={() => toggleSelect(stats.shop.id)} style={{ cursor: 'pointer' }} />, '0.3 0 0', 40)}
                  {cell(
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>{stats.shop.name}</div>
                      <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>{stats.shop.id}</div>
                    </div>,
                    '1.6 0 0', 220
                  )}
                  {cell(
                    <span style={{ fontSize: 13, fontWeight: 700, color: stats.blocked ? '#DC2626' : '#16A34A' }}>
                      {stats.blocked ? 'Đã khoá tạo đơn' : 'Cho phép tạo đơn'}
                    </span>,
                    '1 0 0', 150
                  )}
                  {cell(<span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{stats.pending.length}</span>, '1 0 0', 180, 'right')}
                  {cell(<span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>{stats.pendingFeeTotal.toLocaleString('vi-VN')}</span>, '1.1 0 0', 190, 'right')}
                  {cell(
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleApproveShopRow(stats)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}
                      >
                        <CheckOutlined /> Đã nhận
                      </button>
                      <button
                        onClick={() => setDetailShopId(stats.shop.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: `1px solid ${C_BORDER}`, cursor: 'pointer', background: '#fff', color: C_TEXT_PRIMARY, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
                      >
                        <EyeOutlined /> Chi tiết
                      </button>
                    </div>,
                    '1.3 0 0', 210
                  )}
                </div>
              ))
            ) : (
              pagedRows.map(stats => (
                <div key={stats.shop.id} style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${C_BORDER}` }}>
                  {cell(
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>{stats.shop.name}</div>
                      <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>{stats.shop.id}</div>
                    </div>,
                    '2 0 0', 220
                  )}
                  {cell(<span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>Cho phép tạo đơn</span>, '1 0 0', 160)}
                  {cell(
                    <button
                      onClick={() => setDetailShopId(stats.shop.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: `1px solid ${C_BORDER}`, cursor: 'pointer', background: '#fff', color: C_TEXT_PRIMARY, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}
                    >
                      <EyeOutlined /> Chi tiết
                    </button>,
                    '1 0 0', 140
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <Pagination
          page={safePage}
          total={activeRows.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={s => { setPageSize(s); setPage(1) }}
        />
      </div>
    </ConfigProvider>
  )
}
