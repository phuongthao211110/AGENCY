import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { ConfigProvider } from 'antd'
import { DownloadOutlined, CloseOutlined, WalletOutlined, ClockCircleOutlined, CheckCircleFilled, CopyOutlined, DownOutlined, SearchOutlined } from '@ant-design/icons'
import { shopTheme } from '../../../theme/platforms'
import { loadOrders, confirmCashRemittance, loadRemittanceBatches, type Order, type CashRemittanceBatch } from '../../../mock-data/orderStore'
import allShops from '../../../mock-data/shops.json'

const MY_SHOP_ID = 'SHP001'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_ACTION         = '#FF5200'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'
const C_BG_TOTAL       = '#FFF4ED'

function methodLabel(order: Order): string {
  return order.paymentMethod === 'momo' ? 'MoMo'
    : order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản'
    : order.paymentMethod === 'cash' ? 'Tiền mặt'
    : '—'
}

// Bảng KHÔNG hiện badge trạng thái duyệt (Chờ duyệt/Đã duyệt/Từ chối) cho Shop ở giai đoạn đầu
// golive — đơn giản hoá luồng, chỉ còn cột "Phương thức" + 2 cột Đã/Chưa thanh toán đã nói lên đủ
// thông tin cần thiết. Cơ chế duyệt tiền mặt nền (Agency Admin) KHÔNG đổi gì — chỉ ẩn khỏi UI này.
// Bộ lọc "Trạng thái" bên dưới vẫn giữ nguyên cho ai cần tra cứu sâu hơn.
type StatusFilter = 'all' | 'pending_review' | 'confirmed' | 'rejected' | 'surcharge_pending' | 'refund_pending'
const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'Tất cả', pending_review: 'Chờ duyệt', confirmed: 'Đã duyệt', rejected: 'Đại lý từ chối',
  // 2 dòng dưới là trạng thái con của "Đã duyệt" — fee đổi khác paymentApprovedAmount SAU khi đã
  // duyệt (xem pendingSurchargeLabel) — tách riêng ra bộ lọc vì đây là thứ Shop hay cần tra cứu
  // nhất (đơn nào mình còn nợ thêm / đơn nào đại lý còn nợ lại mình).
  surcharge_pending: 'Chưa đủ — cần đóng thêm', refund_pending: 'Dư — đại lý cần hoàn',
}
const METHOD_FILTER_LABELS: Record<'all' | 'cash' | 'momo' | 'bank_transfer', string> = {
  all: 'Tất cả', cash: 'Tiền mặt', momo: 'MoMo', bank_transfer: 'Chuyển khoản',
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}\n${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

// Che bớt SĐT người nhận (chỉ còn 4 số cuối) + rút gọn địa chỉ về tỉnh/thành — khớp cách hiển thị
// quen thuộc trên các bảng đối soát thật của GHN, tránh lộ hết thông tin cá nhân khách hàng.
function maskedReceiver(order: Order): { phoneTail: string; city: string } {
  const phoneTail = order.receiverPhone.slice(-4)
  const parts = order.receiverAddress.split(',').map(s => s.trim())
  const city = parts[parts.length - 1] ?? order.receiverAddress
  return { phoneTail, city }
}

function fmtMoney(n: number): string {
  return n.toLocaleString('vi-VN')
}

// "Phí dịch vụ hiệu lực" của 1 đơn — ĐÚNG order.fee, TRỪ 1 ngoại lệ: đơn đã huỷ mà chưa xác nhận
// hoàn tiền thì coi fee hiệu lực = 0 (đơn huỷ không còn nghĩa vụ phí ship nào, toàn bộ số đã duyệt
// trước đó cần hoàn lại). CÙNG CÔNG THỨC với Agency Admin (CashRemittance.tsx) để 2 platform LUÔN
// khớp số — Shop và Agency không được nhìn thấy 2 câu chuyện khác nhau cho cùng 1 đơn.
function effectiveFee(order: Order): number {
  if (order.status === 'cancelled' && !order.cancelRefundConfirmedAt) return 0
  return order.fee
}

// Đơn đã `confirmed` (đại lý đã duyệt) mà fee HIỆU LỰC sau đó đổi khác số đã duyệt thì phần chênh
// lệch đó CHƯA được xử lý xong, dù cả đơn vẫn hiện "đã thanh toán" phần gốc. Badge này báo ngay
// trên bảng chính để Shop không phải bấm vào breakdown từng đơn mới biết. 3 nguyên nhân khác nhau:
// `fee` TĂNG (phí hoàn hàng/đổi địa chỉ phát sinh — xem confirmReturnOrder/confirmAddressChangeOrder,
// Orders.tsx) = Shop còn nợ thêm (tone cảnh báo, vàng); `fee` GIẢM do phúc tra = đại lý cần hoàn lại
// phần chênh lệch (tone thông tin, xanh dương); đơn HUỶ (fee hiệu lực về 0) = đại lý cần hoàn lại
// TOÀN BỘ (cùng tone thông tin, xanh dương — dùng chung nhãn với trường hợp phúc tra, không tách
// riêng) — Shop chỉ xem, không có hành động nào ở cả 2 chiều hoàn tiền.
function pendingSurchargeLabel(order: Order): { label: string; tone: 'warn' | 'info' } | null {
  if (order.paymentApprovalStatus !== 'confirmed') return null
  const approvedAmount = order.paymentApprovedAmount ?? order.fee
  const extra = effectiveFee(order) - approvedAmount
  if (extra === 0) return null
  if (extra > 0) {
    if (order.status === 'returning') return { label: 'Phí hoàn hàng chưa duyệt', tone: 'warn' }
    if ((order.feeAddressChange ?? 0) > 0) return { label: 'Phụ phí đổi địa chỉ chưa duyệt', tone: 'warn' }
    return { label: 'Phát sinh thêm chưa duyệt', tone: 'warn' }
  }
  return { label: `Đại lý sẽ hoàn ${(-extra).toLocaleString('vi-VN')}đ`, tone: 'info' }
}

function downloadXlsx(filename: string, headers: string[], rows: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = headers.map(h => ({ wch: Math.max(12, h.length + 2) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Phí dịch vụ')
  XLSX.writeFile(wb, filename)
}

const cell = (children: React.ReactNode, flex = '1 0 0', minWidth = 100, align: 'left' | 'right' = 'left') => (
  <div style={{ flex, minWidth, padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start', textAlign: align }}>
    {children}
  </div>
)

// "Phí dịch vụ" = tổng phí ship + phụ phí phát sinh, ĐÚNG theo các hạng mục phí GHN thật đã tính
// trong CreateOrderDrawer (Phí bảo hiểm/khai giá, Phí giao trả 1 phần, Phí giao thất bại thu tiền,
// Phí thu hộ) — không phải danh sách phụ phí tự bịa. Đơn tạo TRƯỚC khi các field này tồn tại (dữ
// liệu cũ) sẽ không có feeShipping/feeInsurance/... → fallback Phí giao hàng = order.fee, 4 phụ phí
// còn lại = 0 (đúng thực tế: đơn đó chưa từng tách riêng được khoản nào). "Phí trả hàng" KHÁC 4 phụ
// phí kia — chỉ phát sinh SAU khi đơn thực sự bị hoàn (xem confirmReturnOrder, Orders.tsx), nên vẫn
// = 0 cho tuyệt đại đa số đơn chưa từng bị hoàn.
function feeBreakdownRows(order: Order): Array<{ label: string; amount: number }> {
  const hasBreakdown = order.feeShipping !== undefined
  // order.fee đã CỘNG SẴN feeReturn/feeAddressChange (xem confirmReturnOrder/confirmAddressChangeOrder,
  // Orders.tsx) — fallback phải TRỪ cả 2 ra trước khi gán cho "Phí giao hàng", nếu không sẽ bị tính
  // trùng 2 lần trong tổng breakdown.
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

// Breakdown của cột "Đã thanh toán" — KHÔNG phải breakdown PHÍ (cấu thành từ đâu), mà là breakdown
// KÊNH THANH TOÁN (tiền trả bằng cách nào) — đúng mô phỏng theo 1 popup thật của GHN: "Cấn bằng COD"
// (bù trừ từ COD thu hộ), "Thanh toán qua ví" (MoMo), "Tiền mặt thu người nhận"/"Tiền mặt thu người
// gửi" (ai là người đưa tiền mặt), "Thanh toán qua ck ngân hàng". Prototype chỉ có 1 field
// `paymentMethod` duy nhất mỗi đơn (không mô phỏng thanh toán 1 phần qua nhiều kênh cùng lúc như hệ
// thống GHN thật) — nên ĐÚNG 1 dòng khớp `paymentMethod` sẽ bằng toàn bộ số đã thanh toán, 4 dòng
// còn lại luôn = 0. "Cấn bằng COD"/"Tiền mặt thu người nhận" KHÔNG ánh xạ được vào field nào hiện có
// (prototype không có khái niệm thu hộ COD bù trừ phí ship, hay người NHẬN trả tiền mặt phí ship)
// nên LUÔN = 0.
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
  const { phoneTail, city } = maskedReceiver(order)
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

        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C_BORDER}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, marginBottom: 4 }}>Người nhận</div>
          <div style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>
            {order.receiverName} - xxxx {phoneTail} - {city}
          </div>
        </div>

        <div style={{ padding: '16px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_SECONDARY, letterSpacing: 0.5 }}>ĐÃ THANH TOÁN</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmtMoney(paid)}</span>
        </div>
        <div style={{ margin: '0 24px', borderTop: `2px solid ${C_TEXT_PRIMARY}` }} />

        <div style={{ padding: '4px 24px 8px' }}>
          {paymentBreakdownRows(order).map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px dashed ${C_BORDER}` }}>
              <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{row.label}</span>
              <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{fmtMoney(row.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FeeBreakdownModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const { phoneTail, city } = maskedReceiver(order)
  const [time, date] = formatDate(order.paymentPaidAt).split('\n')

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 440, maxHeight: '80vh', overflowY: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 24px', background: C_BG_HEADER, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C_TEXT_PRIMARY }}>{order.trackingCode}</span>
          <CloseOutlined onClick={onClose} style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, fontSize: 16 }} />
        </div>

        {/* Người nhận */}
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C_BORDER}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, marginBottom: 4 }}>Người nhận</div>
          <div style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>
            {order.receiverName} {date} {time} - xxxx {phoneTail} - {city}
          </div>
        </div>

        {/* Tổng phí dịch vụ */}
        <div style={{ padding: '16px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_SECONDARY, letterSpacing: 0.5 }}>PHÍ DỊCH VỤ</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmtMoney(-order.fee)}</span>
        </div>
        <div style={{ margin: '0 24px', borderTop: `2px solid ${C_TEXT_PRIMARY}` }} />

        {/* Breakdown */}
        <div style={{ padding: '4px 24px 8px' }}>
          {feeBreakdownRows(order).map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px dashed ${C_BORDER}` }}>
              <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{row.label}</span>
              <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{fmtMoney(row.amount)}</span>
            </div>
          ))}
          <div style={{ padding: '12px 0 4px', fontSize: 13, fontStyle: 'italic', color: C_TEXT_SECONDARY }}>
            Phụ phí (bảo hiểm/giao trả 1 phần/giao thất bại thu tiền/thu hộ) chỉ phát sinh khi Shop bật tuỳ chọn tương ứng lúc tạo đơn.
          </div>
        </div>
      </div>
    </div>
  )
}

function formatBatchTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

// QR giả lập dùng chung visual pattern với FakeMomoQr (Orders.tsx) — seed cố định để không
// "nhấp nháy" đổi hình khi re-render.
function FakeBankQr({ dim = true }: { dim?: boolean }) {
  const cells: React.ReactNode[] = []
  const seed = [1,0,1,1,0,0,1,0,1,1,0,1,0,0,1,1,0,1,0,1,1,0,0,1,0,1,1,0,1,0,1,1,0,0,1,1,0,1,0,1,1,0,1,0,0,1,1,0,1,0,1,1,0,1,0,0,1,1,0,1,0,1,1,0]
  const size = 8
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const on = seed[(r * size + c) % seed.length] === 1
      const corner = (r < 2 && c < 2) || (r < 2 && c > size - 3) || (r > size - 3 && c < 2)
      cells.push(
        <rect key={`${r}-${c}`} x={c * 20} y={r * 20} width={18} height={18} rx={2}
          fill={corner || on ? '#111827' : '#fff'} />
      )
    }
  }
  return (
    <svg width={160} height={160} viewBox={`0 0 ${size * 20} ${size * 20}`} style={{ opacity: dim ? 1 : 0.3, borderRadius: 8 }}>
      <rect x={0} y={0} width={size * 20} height={size * 20} fill="#fff" />
      {cells}
    </svg>
  )
}

// Modal "Thanh toán phí dịch vụ cho đại lý" — QR chuyển khoản ngân hàng, cùng cơ chế đếm ngược +
// tự xác nhận (webhook giả lập) như OnlinePaymentModal lúc tạo đơn (SHOP-ORDER-42, xem Orders.tsx)
// để nhất quán trải nghiệm. Xác nhận xong gọi confirmCashRemittance() — chuyển khoản ngân hàng giờ
// được hệ thống TỰ XÁC NHẬN NGAY, Agency Admin không cần duyệt tay nữa (khác tiền mặt trao tay
// trước đây — kênh đó đã bỏ, chỉ còn chuyển khoản).
function QrRemittanceModal({ onClose, onDeclared }: { onClose: () => void; onDeclared: () => void }) {
  const COUNTDOWN_SECONDS = 15 * 60
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS)
  const [expired, setExpired] = useState(false)
  const [justDeclared, setJustDeclared] = useState<CashRemittanceBatch | null>(null)

  const orders = loadOrders().filter(o => o.shopId === MY_SHOP_ID && o.paymentMethod === 'cash')
  // Đơn ĐÃ có cashRemittanceDeclaredAt nghĩa là Shop đã nộp lần này rồi (đã confirmed luôn, xem
  // confirmCashRemittance, orderStore.ts) — phải loại khỏi khoản "cần thanh toán".
  const unpaidOrders = orders.filter(o => o.paymentApprovalStatus === 'pending_review' && !o.cashRemittanceDeclaredAt)
  const overdueOrders = orders.filter(o => o.paymentApprovalStatus === 'rejected' && !o.cashRemittanceDeclaredAt)
  const tongTien = unpaidOrders.reduce((s, o) => s + o.fee, 0) + overdueOrders.reduce((s, o) => s + o.fee, 0)

  useEffect(() => {
    if (expired || justDeclared || tongTien === 0) return
    const timer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { setExpired(true); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [expired, justDeclared, tongTien])

  useEffect(() => {
    if (expired || justDeclared || tongTien === 0) return
    const delay = 3000 + Math.random() * 3000
    const timer = setTimeout(() => {
      const shop = allShops.find(s => s.id === MY_SHOP_ID)
      const batch = confirmCashRemittance(MY_SHOP_ID, (shop as any)?.ownerName ?? (shop?.name ?? MY_SHOP_ID))
      setJustDeclared(batch)
      onDeclared()
    }, delay)
    return () => clearTimeout(timer)
  }, [expired, justDeclared, tongTien])

  function handleExportUnpaid() {
    const headers = ['Mã vận đơn', 'Người nhận', 'Số tiền', 'Trạng thái']
    const rows = [...unpaidOrders, ...overdueOrders].map(o => [
      o.trackingCode, o.receiverName, o.fee, o.paymentApprovalStatus === 'rejected' ? 'Nợ tồn (bị từ chối)' : 'Chờ thanh toán',
    ])
    downloadXlsx(`danh-sach-don-can-thanh-toan-${new Date().toISOString().slice(0, 10)}.xlsx`, headers, rows)
  }

  function regenerateCode() {
    setSecondsLeft(COUNTDOWN_SECONDS)
    setExpired(false)
  }

  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
  const ss = (secondsLeft % 60).toString().padStart(2, '0')

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 460, maxWidth: '100%', background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C_TEXT_PRIMARY }}>Thanh toán phí dịch vụ cho đại lý</span>
          <CloseOutlined onClick={onClose} style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, fontSize: 16 }} />
        </div>

        {justDeclared ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#DCF3E7', color: '#16A34A', borderRadius: 6, padding: '12px 14px', fontSize: 14, fontWeight: 600 }}>
            <CheckCircleFilled /> Đã thanh toán {fmtMoney(justDeclared.totalAmount)}đ cho đại lý — mã {justDeclared.id}
          </div>
        ) : tongTien === 0 ? (
          <div style={{ textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14, padding: '24px 0' }}>
            Không có khoản nào cần thanh toán
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Phương thức thanh toán:</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK }}>Chuyển khoản ngân hàng</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Số tiền:</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmtMoney(tongTien)}đ</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {expired ? (
                  <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>Mã QR đã hết hạn</span>
                ) : (
                  <>
                    <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Mã QR sẽ hết hạn sau:</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: C_ACTION, fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</span>
                  </>
                )}
              </div>
              <span onClick={handleExportUnpaid} style={{ fontSize: 13, color: C_ACTION, textDecoration: 'underline', cursor: 'pointer', width: 'fit-content' }}>
                Tải danh sách đơn cần thanh toán
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ padding: 8, border: `1px solid ${C_BORDER}`, borderRadius: 6 }}>
                <FakeBankQr dim={!expired} />
              </div>
              <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, textAlign: 'center' }}>
                {expired ? 'Mã QR đã hết hạn' : 'Quét mã để thanh toán'}
              </span>
              {expired && (
                <button
                  onClick={regenerateCode}
                  style={{ padding: '6px 14px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff' }}
                >
                  Tạo mã mới
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Modal "Lịch sử thanh toán" — tách riêng khỏi QrRemittanceModal theo yêu cầu, chỉ còn liệt kê các
// lần Shop đã chuyển khoản nộp tiền trước đó (confirmCashRemittance, orderStore.ts).
function PaymentHistoryModal({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('')
  const batches = loadRemittanceBatches(MY_SHOP_ID)
  const filtered = search.trim()
    ? batches.filter(b => b.id.toLowerCase().includes(search.trim().toLowerCase()))
    : batches

  function handleViewDetail(batch: CashRemittanceBatch) {
    const names = batch.orderIds.map(id => loadOrders().find(o => o.id === id)?.trackingCode ?? id)
    window.alert(`Mã thanh toán ${batch.id}\n${names.length} đơn:\n${names.join('\n')}`)
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 760, maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: 24 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: C_TEXT_PRIMARY }}>Lịch sử thanh toán</span>
          <CloseOutlined onClick={onClose} style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, fontSize: 16 }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, height: 36, marginBottom: 16, flexShrink: 0 }}>
          <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', border: `1px solid ${C_BORDER}`, borderRadius: 8 }}>
          <div style={{ display: 'flex', background: C_BG_HEADER, position: 'sticky', top: 0 }}>
            {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Mã thanh toán</span>, '1.3 0 0', 160)}
            {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Thời gian</span>, '1 0 0', 140)}
            {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Số tiền (đ)</span>, '1 0 0', 120, 'right')}
          </div>

          {filtered.length === 0 ? (
            <div style={{ color: C_TEXT_SECONDARY, fontSize: 14, textAlign: 'center', padding: '32px 0', borderTop: `1px solid ${C_BORDER}` }}>
              {batches.length === 0 ? 'Chưa có lần thanh toán nào' : 'Không tìm thấy mã thanh toán phù hợp'}
            </div>
          ) : filtered.map(batch => (
            <div
              key={batch.id}
              onClick={() => handleViewDetail(batch)}
              style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${C_BORDER}`, cursor: 'pointer' }}
            >
              {cell(
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>
                  {batch.id}
                  <CopyOutlined
                    style={{ cursor: 'pointer', color: C_TEXT_SECONDARY }}
                    onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(batch.id).catch(() => { /* no clipboard */ }) }}
                  />
                </span>,
                '1.3 0 0', 160
              )}
              {cell(<span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{formatBatchTime(batch.declaredAt)}</span>, '1 0 0', 140)}
              {cell(<span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{fmtMoney(batch.totalAmount)}</span>, '1 0 0', 120, 'right')}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CashFlowReport() {
  const [breakdownOrder, setBreakdownOrder] = useState<Order | null>(null)
  const [paymentBreakdownOrder, setPaymentBreakdownOrder] = useState<Order | null>(null)
  const [remittanceModalOpen, setRemittanceModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [methodFilter, setMethodFilter] = useState<'all' | 'cash' | 'momo' | 'bank_transfer'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false)
  const [, tick] = useState(0)
  const refresh = () => tick(n => n + 1)
  const orders = loadOrders()
  // Chỉ đơn Shop tự trả ship (feePayer === 'sender') mới có khái niệm "đã/chưa thanh toán phí
  // ship" — đơn Khách trả ship (COD) không áp dụng, GHN tự thu khi giao hàng, không hiện ở đây.
  const relevantOrders = orders
    .filter(o => o.shopId === MY_SHOP_ID && !!o.paymentApprovalStatus)
    .sort((a, b) => (b.paymentPaidAt ?? '').localeCompare(a.paymentPaidAt ?? ''))

  // Bộ lọc chỉ áp dụng cho PHẦN HIỂN THỊ (bảng/tổng/export) — `relevantOrders` gốc giữ nguyên cho
  // unremittedCashOrders/unremittedCashTotal bên dưới, vì nút "Thanh toán cho đại lý" phải luôn
  // phản ánh ĐÚNG khoản nợ thật, không phụ thuộc Shop đang lọc xem gì trên màn hình.
  const filteredOrders = relevantOrders.filter(o => {
    if (statusFilter === 'surcharge_pending' && pendingSurchargeLabel(o)?.tone !== 'warn') return false
    if (statusFilter === 'refund_pending' && pendingSurchargeLabel(o)?.tone !== 'info') return false
    if (!['all', 'surcharge_pending', 'refund_pending'].includes(statusFilter) && (o.paymentApprovalStatus ?? 'pending_review') !== statusFilter) return false
    if (methodFilter !== 'all' && o.paymentMethod !== methodFilter) return false
    const payDate = (o.paymentPaidAt ?? '').slice(0, 10)
    if (dateFrom && payDate < dateFrom) return false
    if (dateTo && payDate > dateTo) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      if (!o.trackingCode.toLowerCase().includes(q) && !o.receiverName.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Quy ước dấu giống bảng đối soát phí thật: Phí dịch vụ luôn ÂM (khoản Shop phải trả); Đã thanh
  // toán DƯƠNG (phần đã khấu trừ xong); Chưa thanh toán ÂM nếu còn nợ, DƯƠNG nếu đại lý cần hoàn lại
  // (xem Notes), 0 nếu đã xong — 2 cột sau luôn cộng lại đúng bằng Phí dịch vụ.
  // `fee` có thể đổi CẢ 2 CHIỀU sau khi đại lý đã duyệt (`paymentApprovalStatus === 'confirmed'`):
  // TĂNG (phí hoàn hàng/đổi địa chỉ phát sinh, xem confirmReturnOrder/confirmAddressChangeOrder) →
  // Shop còn nợ thêm; GIẢM (phúc tra phát hiện phí thật thấp hơn lúc duyệt) → đại lý thực nhận nhiều
  // hơn mức đúng, cần hoàn lại phần chênh lệch — `paymentApprovedAmount` lưu đúng số đại lý đã duyệt
  // TẠI THỜI ĐIỂM đó, phần chênh lệch sau đó (dù tăng hay giảm) đều hiện ở cột Chưa thanh toán thay
  // vì ngộ nhận gộp cả vào Đã thanh toán chỉ vì đơn đang ở trạng thái confirmed. KHÔNG kẹp về 0 khi
  // dương nữa — kẹp sẽ làm mất thông tin. Bất biến đúng: `fee = daThanhToan - chuaThanhToan` (thử
  // với extra<0: daThanhToan = approvedAmount, chuaThanhToan = -extra = approvedAmount - fee đảo dấu
  // → approvedAmount - (approvedAmount - fee) = fee, khớp).
  function rowAmounts(o: Order) {
    const fee = effectiveFee(o)
    const paid = o.paymentApprovalStatus === 'confirmed'
    // `|| 0` chuẩn hoá -0 thành 0 — effectiveFee() trả 0 cho đơn huỷ chưa hoàn, nên -fee ra đúng
    // giá trị -0 (hợp lệ về mặt số học nhưng toLocaleString() hiện thành chuỗi "-0" xấu).
    if (!paid) return { phiDichVu: -fee || 0, daThanhToan: 0, chuaThanhToan: -fee || 0 }
    const approvedAmount = o.paymentApprovedAmount ?? fee
    const extra = fee - approvedAmount
    return { phiDichVu: -fee || 0, daThanhToan: approvedAmount, chuaThanhToan: -extra || 0 }
  }

  const totals = filteredOrders.reduce((acc, o) => {
    const a = rowAmounts(o)
    acc.phiDichVu += a.phiDichVu
    acc.daThanhToan += a.daThanhToan
    acc.chuaThanhToan += a.chuaThanhToan
    return acc
  }, { phiDichVu: 0, daThanhToan: 0, chuaThanhToan: 0 })

  function handleExport() {
    const headers = ['STT', 'Mã đơn', 'Ngày thanh toán', 'Người nhận', 'Phương thức', 'Phí dịch vụ', 'Đã thanh toán', 'Chưa thanh toán']
    const rows = filteredOrders.map((o, i) => {
      const a = rowAmounts(o)
      return [i + 1, o.trackingCode, formatDate(o.paymentPaidAt).replace('\n', ' '), o.receiverName, methodLabel(o), a.phiDichVu, a.daThanhToan, a.chuaThanhToan]
    })
    downloadXlsx(`phi-dich-vu-${new Date().toISOString().slice(0, 10)}.xlsx`, headers, rows)
  }

  // Shop chuyển khoản ngân hàng cho đại lý — áp dụng cho đơn TIỀN MẶT đang pending_review HOẶC
  // rejected ("Nợ tồn", xem QrRemittanceModal) — MoMo/CK đã tự "Đã nhận" ngay từ lúc tạo, không có
  // gì để nộp thêm (xem SHOP-ORDER-43). Chuyển khoản xong là hệ thống tự xác nhận NGAY, không qua
  // bước Agency Admin duyệt tay — xem QrRemittanceModal/PaymentHistoryModal + confirmCashRemittance()
  // trong orderStore.ts.
  const unremittedCashOrders = relevantOrders.filter(o => o.paymentMethod === 'cash' && (o.paymentApprovalStatus === 'pending_review' || o.paymentApprovalStatus === 'rejected') && !o.cashRemittanceDeclaredAt)

  return (
    <ConfigProvider theme={shopTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>
        {/* Page header */}
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
            Báo cáo dòng tiền
          </h1>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '12px 16px', borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C_ACTION, borderBottom: `2px solid ${C_ACTION}`, paddingBottom: 8 }}>
            Phí dịch vụ
          </div>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>
            (*) Phí ship chỉ tính cho đơn Shop tự trả, dựa trên trạng thái đại lý xác nhận thanh toán
          </span>
          <div
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: C_ACTION, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}
          >
            <DownloadOutlined /> Tải file excel
          </div>
          <button
            onClick={() => setHistoryModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 6,
              border: `1px solid ${C_BORDER}`, cursor: 'pointer', background: '#fff',
              color: C_TEXT_PRIMARY, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap',
            }}
          >
            <ClockCircleOutlined /> Lịch sử thanh toán
          </button>
          <button
            onClick={() => setRemittanceModalOpen(true)}
            disabled={unremittedCashOrders.length === 0}
            title={unremittedCashOrders.length === 0 ? 'Không có đơn tiền mặt nào cần chuyển' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 6, border: 'none',
              cursor: unremittedCashOrders.length === 0 ? 'not-allowed' : 'pointer',
              background: unremittedCashOrders.length === 0 ? '#D1D5DB' : C_ACTION,
              color: '#fff', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap',
            }}
          >
            <WalletOutlined /> Thanh toán phí dịch vụ cho đại lý
          </button>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => { setStatusDropdownOpen(v => !v); setMethodDropdownOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer' }}
            >
              <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>Trạng thái</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap' }}>{STATUS_FILTER_LABELS[statusFilter]}</span>
              <DownOutlined style={{ fontSize: 10, color: C_TEXT_SECONDARY }} />
            </div>
            {statusDropdownOpen && (
              <>
                <div onClick={() => setStatusDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 11, minWidth: 200 }}>
                  {(['all', 'pending_review', 'confirmed', 'rejected'] as const).map(key => (
                    <div
                      key={key}
                      onClick={() => { setStatusFilter(key); setStatusDropdownOpen(false) }}
                      style={{ padding: '8px 12px', fontSize: 14, color: C_TEXT_PRIMARY, cursor: 'pointer', fontWeight: statusFilter === key ? 700 : 400, background: statusFilter === key ? C_BG_HEADER : 'transparent' }}
                    >
                      {STATUS_FILTER_LABELS[key]}
                    </div>
                  ))}
                  <div style={{ height: 1, background: C_BORDER, margin: '4px 0' }} />
                  {(['surcharge_pending', 'refund_pending'] as const).map(key => (
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

          <div style={{ position: 'relative' }}>
            <div
              onClick={() => { setMethodDropdownOpen(v => !v); setStatusDropdownOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer' }}
            >
              <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>Phương thức</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap' }}>{METHOD_FILTER_LABELS[methodFilter]}</span>
              <DownOutlined style={{ fontSize: 10, color: C_TEXT_SECONDARY }} />
            </div>
            {methodDropdownOpen && (
              <>
                <div onClick={() => setMethodDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 11, minWidth: 160 }}>
                  {(['all', 'cash', 'momo', 'bank_transfer'] as const).map(key => (
                    <div
                      key={key}
                      onClick={() => { setMethodFilter(key); setMethodDropdownOpen(false) }}
                      style={{ padding: '8px 12px', fontSize: 14, color: C_TEXT_PRIMARY, cursor: 'pointer', fontWeight: methodFilter === key ? 700 : 400, background: methodFilter === key ? C_BG_HEADER : 'transparent' }}
                    >
                      {METHOD_FILTER_LABELS[key]}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>Từ</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '7px 8px', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 13, color: C_TEXT_PRIMARY }}
            />
            <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>đến</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{ padding: '7px 8px', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 13, color: C_TEXT_PRIMARY }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, flex: 1, minWidth: 220, maxWidth: 320, height: 36 }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo mã đơn hoặc tên người nhận"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent' }}
            />
          </div>

          {(statusFilter !== 'all' || methodFilter !== 'all' || dateFrom || dateTo || search) && (
            <span
              onClick={() => { setStatusFilter('all'); setMethodFilter('all'); setDateFrom(''); setDateTo(''); setSearch('') }}
              style={{ fontSize: 13, color: C_ACTION, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Xoá lọc
            </span>
          )}
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
            <div style={{ display: 'flex', background: C_BG_HEADER }}>
              {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>STT</span>, '0.4 0 0', 48)}
              {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Mã đơn</span>, '1 0 0', 110)}
              {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Ngày thanh toán</span>, '0.9 0 0', 110)}
              {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Người nhận</span>, '1.2 0 0', 160)}
              {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Phương thức</span>, '0.9 0 0', 110)}
              {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Phí dịch vụ</span>, '0.9 0 0', 110, 'right')}
              {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Đã thanh toán</span>, '0.9 0 0', 110, 'right')}
              {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Chưa thanh toán</span>, '0.9 0 0', 110, 'right')}
            </div>

            {/* Tổng */}
            <div style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${C_BORDER}`, background: C_BG_TOTAL }}>
              {cell(null, '0.4 0 0', 48)}
              {cell(<span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>Tổng</span>, '1 0 0', 110)}
              {cell(null, '0.9 0 0', 110)}
              {cell(null, '1.2 0 0', 160)}
              {cell(null, '0.9 0 0', 110)}
              {cell(<span style={{ fontSize: 14, fontWeight: 700, color: C_ACTION }}>{fmtMoney(totals.phiDichVu)}</span>, '0.9 0 0', 110, 'right')}
              {cell(<span style={{ fontSize: 14, fontWeight: 700, color: C_ACTION }}>{fmtMoney(totals.daThanhToan)}</span>, '0.9 0 0', 110, 'right')}
              {cell(<span style={{ fontSize: 14, fontWeight: 700, color: C_ACTION }}>{fmtMoney(totals.chuaThanhToan)}</span>, '0.9 0 0', 110, 'right')}
            </div>

            {filteredOrders.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14, borderTop: `1px solid ${C_BORDER}` }}>
                {relevantOrders.length === 0 ? 'Chưa có đơn nào' : 'Không có đơn nào khớp bộ lọc đã chọn'}
              </div>
            ) : filteredOrders.map((order, i) => {
              const a = rowAmounts(order)
              const { phoneTail, city } = maskedReceiver(order)
              const [time, date] = formatDate(order.paymentPaidAt).split('\n')
              const surchargeLabel = pendingSurchargeLabel(order)
              return (
                <div key={order.id} style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${C_BORDER}` }}>
                  {cell(<span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>{i + 1}</span>, '0.4 0 0', 48)}
                  {cell(
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, textDecoration: 'underline' }}>{order.trackingCode}</span>
                      {surchargeLabel && (
                        <div style={{ marginTop: 2 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, borderRadius: 4, padding: '1px 6px', whiteSpace: 'nowrap',
                            background: surchargeLabel.tone === 'warn' ? '#FEF3C7' : '#DBEAFE',
                            color: surchargeLabel.tone === 'warn' ? '#92400E' : '#1D4ED8',
                          }}>
                            {surchargeLabel.tone === 'warn' ? '⚠️' : '💙'} {surchargeLabel.label}
                          </span>
                        </div>
                      )}
                    </div>,
                    '1 0 0', 110
                  )}
                  {cell(
                    <span style={{ fontSize: 13, color: C_TEXT_PRIMARY, lineHeight: '18px' }}>{time}<br />{date}</span>,
                    '0.9 0 0', 110
                  )}
                  {cell(
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '18px' }}>
                      {order.receiverName}<br />
                      <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>xxxx {phoneTail} - {city}</span>
                    </span>,
                    '1.2 0 0', 160
                  )}
                  {cell(<span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{methodLabel(order)}</span>, '0.9 0 0', 110)}
                  {cell(
                    <span
                      onClick={() => setBreakdownOrder(order)}
                      style={{ fontSize: 14, color: C_TEXT_PRIMARY, textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {fmtMoney(a.phiDichVu)}
                    </span>,
                    '0.9 0 0', 110, 'right'
                  )}
                  {cell(
                    <span
                      onClick={() => setPaymentBreakdownOrder(order)}
                      style={{ fontSize: 14, color: C_TEXT_PRIMARY, textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      {fmtMoney(a.daThanhToan)}
                    </span>,
                    '0.9 0 0', 110, 'right'
                  )}
                  {cell(<span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{fmtMoney(a.chuaThanhToan)}</span>, '0.9 0 0', 110, 'right')}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {breakdownOrder && (
        <FeeBreakdownModal order={breakdownOrder} onClose={() => setBreakdownOrder(null)} />
      )}
      {paymentBreakdownOrder && (
        <PaymentBreakdownModal order={paymentBreakdownOrder} onClose={() => setPaymentBreakdownOrder(null)} />
      )}
      {remittanceModalOpen && (
        <QrRemittanceModal onClose={() => setRemittanceModalOpen(false)} onDeclared={refresh} />
      )}
      {historyModalOpen && (
        <PaymentHistoryModal onClose={() => setHistoryModalOpen(false)} />
      )}
    </ConfigProvider>
  )
}
