import { useState } from 'react'
import * as XLSX from 'xlsx'
import { ConfigProvider } from 'antd'
import { DownloadOutlined, InfoCircleOutlined, CloseOutlined, WalletOutlined, ClockCircleOutlined, CheckCircleFilled, CopyOutlined } from '@ant-design/icons'
import { shopTheme } from '../../../theme/platforms'
import { loadOrders, declareCashRemittance, loadRemittanceBatches, type Order, type CashRemittanceBatch } from '../../../mock-data/orderStore'
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
  // order.fee đã CỘNG SẴN feeReturn (xem confirmReturnOrder) — fallback phải TRỪ feeReturn ra trước
  // khi gán cho "Phí giao hàng", nếu không "Phí trả hàng" sẽ bị tính trùng 2 lần trong tổng breakdown.
  const fallbackShipping = order.fee - (order.feeReturn ?? 0)
  return [
    { label: 'Phí giao hàng', amount: -(hasBreakdown ? order.feeShipping! : fallbackShipping) },
    { label: 'Phí bảo hiểm (khai giá)', amount: -(order.feeInsurance ?? 0) },
    { label: 'Phí giao trả 1 phần', amount: -(order.feePartial ?? 0) },
    { label: 'Phí giao thất bại thu tiền', amount: -(order.feeDeliveryFail ?? 0) },
    { label: 'Phí thu hộ', amount: -(order.feeCod ?? 0) },
    { label: 'Phí trả hàng (hoàn hàng)', amount: -(order.feeReturn ?? 0) },
  ]
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

// Modal "Thanh toán hạn mức đã dùng" — mô phỏng đúng 2 cột của UI tham khảo: trái là khoản cần
// thanh toán (Phí giao hàng + Nợ tồn) + xác nhận, phải là Lịch sử thanh toán (các lần Shop đã khai
// trước đó). Đây vẫn CHỈ là lời khai của Shop (xem declareCashRemittance, orderStore.ts) — không
// phải cổng thanh toán thật, không có đếm ngược/hết hạn như OnlinePaymentModal (SHOP-ORDER-42).
function RemittanceModal({ onClose, onDeclared }: { onClose: () => void; onDeclared: () => void }) {
  const [agreed, setAgreed] = useState(false)
  const [justDeclared, setJustDeclared] = useState<CashRemittanceBatch | null>(null)
  const [, tick] = useState(0)
  const refresh = () => tick(n => n + 1)

  const orders = loadOrders().filter(o => o.shopId === MY_SHOP_ID && o.paymentMethod === 'cash')
  // Đơn ĐÃ có cashRemittanceDeclaredAt nghĩa là Shop đã khai lần này rồi, đang chờ Agency đối chiếu
  // (xem declareCashRemittance, orderStore.ts) — phải loại khỏi khoản "cần thanh toán", nếu không
  // Shop có thể bấm "Xác nhận thanh toán" lặp lại vô hạn lần cho cùng 1 lô đơn (bug phát hiện qua UAT).
  const unpaidOrders = orders.filter(o => o.paymentApprovalStatus === 'pending_review' && !o.cashRemittanceDeclaredAt)
  const overdueOrders = orders.filter(o => o.paymentApprovalStatus === 'rejected' && !o.cashRemittanceDeclaredAt)
  const phiGiaoHang = unpaidOrders.reduce((s, o) => s + o.fee, 0)
  const noTon = overdueOrders.reduce((s, o) => s + o.fee, 0)
  const tongTien = phiGiaoHang + noTon
  const batches = loadRemittanceBatches(MY_SHOP_ID)

  function handleExportUnpaid() {
    const headers = ['Mã vận đơn', 'Người nhận', 'Số tiền', 'Trạng thái']
    const rows = [...unpaidOrders, ...overdueOrders].map(o => [
      o.trackingCode, o.receiverName, o.fee, o.paymentApprovalStatus === 'rejected' ? 'Nợ tồn (bị từ chối)' : 'Chờ thanh toán',
    ])
    downloadXlsx(`danh-sach-don-can-thanh-toan-${new Date().toISOString().slice(0, 10)}.xlsx`, headers, rows)
  }

  function handleConfirm() {
    if (tongTien === 0 || !agreed) return
    const shop = allShops.find(s => s.id === MY_SHOP_ID)
    const batch = declareCashRemittance(MY_SHOP_ID, (shop as any)?.ownerName ?? (shop?.name ?? MY_SHOP_ID))
    setJustDeclared(batch)
    setAgreed(false)
    refresh()
    onDeclared()
  }

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
        style={{ width: 920, maxWidth: '100%', maxHeight: '88vh', display: 'flex', gap: 16 }}
      >
        {/* Cột trái — khoản cần thanh toán */}
        <div style={{ flex: '1 0 0', minWidth: 0, background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: C_TEXT_PRIMARY }}>Thanh toán hạn mức đã dùng</span>
            <CloseOutlined onClick={onClose} style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, fontSize: 16 }} />
          </div>

          {justDeclared ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#DCF3E7', color: '#16A34A', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
              <CheckCircleFilled /> Đã gửi yêu cầu thanh toán {fmtMoney(justDeclared.totalAmount)}đ cho đại lý — mã {justDeclared.id}
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F3F4F6', color: C_TEXT_SECONDARY, borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              <ClockCircleOutlined /> {tongTien === 0 ? 'Không có khoản nào' : 'Chưa thanh toán'}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 0' }}>
            <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>
              Phí giao hàng (Đơn hàng đã bàn giao/ Hoàn tất){' '}
              <span onClick={handleExportUnpaid} style={{ color: C_ACTION, textDecoration: 'underline', cursor: 'pointer' }}>Tải danh sách đơn</span>
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap' }}>{fmtMoney(phiGiaoHang)} đ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
            <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>Nợ tồn</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmtMoney(noTon)}</span>
          </div>
          <div style={{ borderTop: `1px solid ${C_BORDER}`, margin: '4px 0 14px' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: C_ACTION }}>Tổng tiền cần thanh toán</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: C_ACTION }}>{fmtMoney(tongTien)} đ</span>
          </div>

          <p style={{ fontSize: 13, color: C_TEXT_SECONDARY, lineHeight: '20px', marginBottom: 12 }}>
            Quý khách vui lòng xem kỹ thông tin về các khoản phí trước khi nhấn vào ô xác nhận bên dưới
          </p>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: C_TEXT_SECONDARY, marginBottom: 16, cursor: tongTien === 0 ? 'not-allowed' : 'pointer' }}>
            <input type="checkbox" checked={agreed} disabled={tongTien === 0} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2 }} />
            Tôi đã đọc, hiểu và chấp nhận <span style={{ textDecoration: 'underline' }}>điều khoản thanh toán</span> của GHN
          </label>

          <button
            onClick={handleConfirm}
            disabled={tongTien === 0 || !agreed}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 6, border: 'none',
              cursor: (tongTien === 0 || !agreed) ? 'not-allowed' : 'pointer',
              background: (tongTien === 0 || !agreed) ? '#D1D5DB' : C_ACTION,
              color: '#fff', fontSize: 15, fontWeight: 700,
            }}
          >
            {tongTien === 0 ? 'Không có khoản nào cần thanh toán' : 'Xác nhận thanh toán'}
          </button>
        </div>

        {/* Cột phải — lịch sử */}
        <div style={{ flex: '1 0 0', minWidth: 0, background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: 24, overflowY: 'auto' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C_TEXT_PRIMARY, marginBottom: 16 }}>Lịch sử thanh toán</div>
          {batches.length === 0 ? (
            <div style={{ color: C_TEXT_SECONDARY, fontSize: 14, textAlign: 'center', padding: '32px 0' }}>
              Chưa có lần thanh toán nào
            </div>
          ) : batches.map(batch => (
            <div key={batch.id} style={{ border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DCF3E7', color: '#16A34A', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                <CheckCircleFilled /> Đã gửi yêu cầu thanh toán
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
                <span style={{ color: C_TEXT_SECONDARY }}>Mã thanh toán:</span>
                <span style={{ color: C_TEXT_PRIMARY, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {batch.id}
                  <CopyOutlined style={{ cursor: 'pointer', color: C_TEXT_SECONDARY }} onClick={() => { try { navigator.clipboard.writeText(batch.id) } catch { /* no clipboard */ } }} />
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
                <span style={{ color: C_TEXT_SECONDARY }}>Thời gian:</span>
                <span style={{ color: C_TEXT_PRIMARY, fontWeight: 600 }}>{formatBatchTime(batch.declaredAt)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, padding: '4px 0 12px' }}>
                <span style={{ color: C_TEXT_SECONDARY }}>Tổng tiền:</span>
                <span style={{ color: C_TEXT_PRIMARY, fontWeight: 700 }}>{fmtMoney(batch.totalAmount)} đ</span>
              </div>
              <button
                onClick={() => handleViewDetail(batch)}
                style={{ width: '100%', padding: '8px 0', borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}
              >
                Xem chi tiết
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CashFlowReport() {
  const [breakdownOrder, setBreakdownOrder] = useState<Order | null>(null)
  const [remittanceModalOpen, setRemittanceModalOpen] = useState(false)
  const [, tick] = useState(0)
  const refresh = () => tick(n => n + 1)
  const orders = loadOrders()
  // Chỉ đơn Shop tự trả ship (feePayer === 'sender') mới có khái niệm "đã/chưa thanh toán phí
  // ship" — đơn Khách trả ship (COD) không áp dụng, GHN tự thu khi giao hàng, không hiện ở đây.
  const relevantOrders = orders
    .filter(o => o.shopId === MY_SHOP_ID && !!o.paymentApprovalStatus)
    .sort((a, b) => (b.paymentPaidAt ?? '').localeCompare(a.paymentPaidAt ?? ''))

  // Quy ước dấu giống bảng đối soát phí thật: Phí dịch vụ luôn ÂM (khoản Shop phải trả); Đã thanh
  // toán DƯƠNG (phần đã khấu trừ xong); Chưa thanh toán ÂM nếu còn nợ, 0 nếu đã xong — 2 cột sau
  // luôn cộng lại đúng bằng Phí dịch vụ.
  function rowAmounts(o: Order) {
    const fee = o.fee
    const paid = o.paymentApprovalStatus === 'confirmed'
    return { phiDichVu: -fee, daThanhToan: paid ? fee : 0, chuaThanhToan: paid ? 0 : -fee }
  }

  const totals = relevantOrders.reduce((acc, o) => {
    const a = rowAmounts(o)
    acc.phiDichVu += a.phiDichVu
    acc.daThanhToan += a.daThanhToan
    acc.chuaThanhToan += a.chuaThanhToan
    return acc
  }, { phiDichVu: 0, daThanhToan: 0, chuaThanhToan: 0 })

  function handleExport() {
    const headers = ['STT', 'Mã đơn', 'Ngày thanh toán', 'Người nhận', 'Trạng thái', 'Phí dịch vụ', 'Đã thanh toán', 'Chưa thanh toán']
    const rows = relevantOrders.map((o, i) => {
      const a = rowAmounts(o)
      return [i + 1, o.trackingCode, formatDate(o.paymentPaidAt).replace('\n', ' '), o.receiverName, methodLabel(o), a.phiDichVu, a.daThanhToan, a.chuaThanhToan]
    })
    downloadXlsx(`phi-dich-vu-${new Date().toISOString().slice(0, 10)}.xlsx`, headers, rows)
  }

  // Shop tự báo "đã chuyển tiền mặt cho đại lý" — áp dụng cho đơn TIỀN MẶT đang pending_review HOẶC
  // rejected ("Nợ tồn", xem RemittanceModal) — MoMo/CK đã tự "Đã nhận" ngay từ lúc tạo, không có gì
  // để báo thêm (xem SHOP-ORDER-43). Đây CHỈ là lời khai, KHÔNG tự xác nhận — Agency Admin vẫn phải
  // tự đối chiếu rồi bấm "Duyệt shop này" (AGA-PAYMENT-2) mới thực sự khớp sổ — xem RemittanceModal
  // + declareCashRemittance() trong orderStore.ts cho chi tiết đầy đủ (modal "Thanh toán hạn mức
  // đã dùng" + "Lịch sử thanh toán").
  const unremittedCashOrders = relevantOrders.filter(o => o.paymentMethod === 'cash' && (o.paymentApprovalStatus === 'pending_review' || o.paymentApprovalStatus === 'rejected') && !o.cashRemittanceDeclaredAt)
  const unremittedCashTotal = unremittedCashOrders.reduce((sum, o) => sum + o.fee, 0)

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
            onClick={() => setRemittanceModalOpen(true)}
            disabled={unremittedCashOrders.length === 0}
            title={unremittedCashOrders.length === 0 ? 'Không có đơn tiền mặt nào cần chuyển' : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 6, border: 'none',
              cursor: unremittedCashOrders.length === 0 ? 'not-allowed' : 'pointer',
              background: unremittedCashOrders.length === 0 ? '#D1D5DB' : '#1E3A8A',
              color: '#fff', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap',
            }}
          >
            <WalletOutlined />
            {unremittedCashOrders.length === 0
              ? 'Không có đơn cần chuyển'
              : `Thanh toán cho đại lý (${unremittedCashTotal.toLocaleString('vi-VN')}đ)`}
          </button>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
            <div style={{ display: 'flex', background: C_BG_HEADER }}>
              {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>STT</span>, '0.4 0 0', 48)}
              {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Mã đơn</span>, '1 0 0', 110)}
              {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Ngày thanh toán</span>, '0.9 0 0', 110)}
              {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Người nhận</span>, '1.2 0 0', 160)}
              {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Trạng thái <InfoCircleOutlined style={{ fontSize: 12 }} /></span>, '0.9 0 0', 110)}
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

            {relevantOrders.length === 0 ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14, borderTop: `1px solid ${C_BORDER}` }}>
                Chưa có đơn nào
              </div>
            ) : relevantOrders.map((order, i) => {
              const a = rowAmounts(order)
              const { phoneTail, city } = maskedReceiver(order)
              const [time, date] = formatDate(order.paymentPaidAt).split('\n')
              return (
                <div key={order.id} style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${C_BORDER}` }}>
                  {cell(<span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>{i + 1}</span>, '0.4 0 0', 48)}
                  {cell(<span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, textDecoration: 'underline' }}>{order.trackingCode}</span>, '1 0 0', 110)}
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
                  {cell(<span style={{ fontSize: 14, color: C_TEXT_PRIMARY, textDecoration: 'underline' }}>{fmtMoney(a.daThanhToan)}</span>, '0.9 0 0', 110, 'right')}
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
      {remittanceModalOpen && (
        <RemittanceModal onClose={() => setRemittanceModalOpen(false)} onDeclared={refresh} />
      )}
    </ConfigProvider>
  )
}
