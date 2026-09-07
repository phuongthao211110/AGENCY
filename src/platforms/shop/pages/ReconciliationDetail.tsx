import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons'
import { shopTheme } from '../../../theme/platforms'
import { getReconciliationItems } from '../../../mock-data/reconciliationLedger'

const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

const MY_SHOP_ID = 'SHP001'

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

const fmtDate = (d: string) => {
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
}

const fmtPeriod = (start?: string, end?: string) => {
  if (!start || !end) return null
  const dt = (s: string) => new Date(s)
  const dd = (s: string) => String(dt(s).getDate()).padStart(2, '0')
  const mm = (s: string) => String(dt(s).getMonth() + 1).padStart(2, '0')
  const yy = (s: string) => dt(s).getFullYear()
  if (start === end) return `${dd(start)}/${mm(start)}/${yy(start)}`
  return `${dd(start)}/${mm(start)} – ${dd(end)}/${mm(end)}/${yy(end)}`
}

// Session shape truyền qua route state — khớp đúng ShopSession dựng ở Reconciliation.tsx
// (buildShopSessions()), không định nghĩa lại field khác.
type ShopSession = {
  id: string
  nvcSessionId: string
  nvcSessionCode: string
  paymentDate: string
  periodStart?: string
  periodEnd?: string
  totalOrders: number
  totalCOD: number
  feeShop: number
  netAmount: number
  totalMismatch: number
}

// Cùng danh sách trạng thái "kết thúc" dùng để xác định có COD hay không — khớp
// reconciliationLedger.ts (ENDING_GHN_STATUSES), không định nghĩa lại logic riêng.
const SUCCESS_STATUSES = ['Giao hàng thành công', 'Hoàn hàng thành công']

const C_GHN = '#9CA3AF'
const FONT_GHN = 11

function TCell({ children, width, flex = '0 0 auto', align = 'left', isHeader = false, minWidth }: {
  children: React.ReactNode
  width?: number
  flex?: string
  align?: 'left' | 'right' | 'center'
  isHeader?: boolean
  minWidth?: number
}) {
  return (
    <div style={{
      width, flex, flexShrink: 0, padding: '8px 8px', minWidth,
      display: 'flex', alignItems: 'center',
      justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
      fontSize: 14,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      color: isHeader ? C_TEXT_SECONDARY : undefined,
      background: isHeader ? C_BG_HEADER : undefined,
      ...(!isHeader ? { borderBottom: `1px solid ${C_BORDER}` } : {}),
    }}>
      {children}
    </div>
  )
}

const ghnStatusColor = (status: string) => {
  const SUCCESS = ['Giao hàng thành công', 'Hoàn hàng thành công']
  const FAILED  = ['Giao hàng không thành công', 'Hoàn hàng không thành công', 'Hàng thất lạc', 'Hàng hư hỏng', 'Đơn huỷ']
  const GREY    = ['Không có trong hệ thống', 'Chờ lấy hàng', 'Đang lấy hàng', 'Đang tương tác với người gửi']
  if (SUCCESS.includes(status)) return '#16A34A'
  if (FAILED.includes(status))  return '#DC2626'
  if (GREY.includes(status))    return '#9CA3AF'
  return '#C2410C'
}

export default function ShopReconciliationDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState('')

  const session: ShopSession | undefined = location.state?.session

  if (!session) {
    return (
      <ConfigProvider theme={shopTheme}>
        <div style={{ padding: 24, color: C_TEXT_SECONDARY }}>
          Không tìm thấy phiên đối soát. <span style={{ color: C_LINK, cursor: 'pointer' }} onClick={() => navigate('/shop/reconciliation')}>Quay lại</span>
        </div>
      </ConfigProvider>
    )
  }

  // Đọc qua getReconciliationItems() (reconciliationLedger.ts) — status ở đây đã cộng dồn theo
  // orderCode xuyên nhiều phiên GHN, không phải field tĩnh đọc thẳng từ JSON (khớp cách
  // AgencyReconciliationShopDetail.tsx đang làm, tránh Shop thấy trạng thái Đúng/Sai lệch với
  // Agency Admin do 2 nơi tính khác công thức).
  const items = getReconciliationItems().filter(
    it => it.sessionId === session.nvcSessionId && it.shopId === MY_SHOP_ID
  )

  const filteredItems = items.filter(i => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return i.orderCode.toLowerCase().includes(q) || (i.customerOrderCode ?? '').toLowerCase().includes(q)
  })

  const totalCOD = items.filter(it => SUCCESS_STATUSES.includes(it.ghnStatus)).reduce((s, i) => s + i.systemCOD, 0)
  const totalFee = items.reduce((s, i) => s + i.systemFee, 0)

  const cardStyle: React.CSSProperties = {
    flex: 1, padding: '14px 16px', border: `1px solid ${C_BORDER}`, borderRadius: 8, background: '#fff',
  }

  return (
    <ConfigProvider theme={shopTheme}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>

        {/* Breadcrumb + Title */}
        <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C_TEXT_SECONDARY, marginBottom: 8 }}>
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => navigate('/shop/reconciliation')}>
              <ArrowLeftOutlined style={{ fontSize: 12 }} /> Đối soát
            </span>
            <span style={{ color: C_BORDER }}>/</span>
            <span style={{ color: C_TEXT_PRIMARY }}>{session.id}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C_TEXT_PRIMARY }}>
              Phiên {session.id}
            </h1>
            <span style={{
              display: 'inline-block', padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
              background: '#FFF7ED', color: '#EA580C',
            }}>
              Chờ thanh toán
            </span>
            <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>
              Phiên GHN: <span style={{ color: C_LINK, fontWeight: 600 }}>{session.nvcSessionCode}</span>
              {fmtPeriod(session.periodStart, session.periodEnd) && (
                <> · <span style={{ color: C_TEXT_PRIMARY, fontWeight: 500 }}>{fmtPeriod(session.periodStart, session.periodEnd)}</span></>
              )}
              {' · TT: '}{fmtDate(session.paymentDate)}
            </span>
          </div>
        </div>

        {/* Summary cards — CHỈ số liệu của shop (không hiện phí NVC trả đại lý / lợi nhuận đại lý,
            đó là thông tin nội bộ đại lý, không thuộc phạm vi shop được xem). */}
        <div style={{ display: 'flex', gap: 12, padding: '16px 16px', flexShrink: 0 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Số đơn</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY }}>{items.length}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Tổng COD</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmt(totalCOD)}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Tổng phí DV</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmt(totalFee)}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Nhận về</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: (totalCOD - totalFee) < 0 ? '#DC2626' : '#16A34A' }}>{fmt(totalCOD - totalFee)}</div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px 12px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', flex: 1, maxWidth: 320,
            background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
          }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo mã đơn GHN hoặc mã đơn của bạn"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: '1 0 0', overflow: 'hidden', padding: '0 16px' }}>
          <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
            <div style={{ minWidth: 1400 }}>
              {/* Header */}
              <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center', position: 'sticky', top: 0, zIndex: 2 }}>
                <TCell width={120} isHeader>Mã đơn GHN</TCell>
                <TCell width={140} isHeader>Mã đơn của bạn</TCell>
                <TCell width={200} isHeader>Trạng thái GHN</TCell>
                <TCell width={120} align='right' isHeader>Tiền COD</TCell>
                <TCell width={120} align='right' isHeader>Giao TT thu sau</TCell>
                <TCell width={110} align='right' isHeader>Phí giao hàng</TCell>
                <TCell width={100} align='right' isHeader>Phí bảo hiểm</TCell>
                <TCell width={110} align='right' isHeader>Giao trả 1 phần</TCell>
                <TCell width={120} align='right' isHeader>Phí giao thất bại</TCell>
                <TCell width={100} align='right' isHeader>Phí thu hộ</TCell>
                <TCell width={110} align='right' isHeader>Phí kích hoạt giao lại</TCell>
                <TCell width={100} align='right' isHeader>Phí hoàn</TCell>
                <TCell width={110} align='right' isHeader>Phí DV</TCell>
                <TCell width={140} align='right' isHeader>Tổng đối soát</TCell>
              </div>
              <div style={{ height: 1, background: C_BORDER }} />

              {filteredItems.length === 0 && (
                <div style={{ padding: '48px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                  Không có đơn nào
                </div>
              )}

              {filteredItems.map(it => {
                const isSuccess = SUCCESS_STATUSES.includes(it.ghnStatus)

                const sysCOD                = Math.abs(it.systemCOD)
                const ghnCOD                 = Math.abs(it.ghnCOD)
                const deliveryFee            = Math.abs(it.deliveryFee)
                const insuranceFee           = Math.abs(it.insuranceFee)
                const partialDelivery        = Math.abs(it.partialDeliveryFee)
                const failedDelivery         = Math.abs(it.failedDeliveryCOD)
                const failedDeliveryCollect  = Math.abs(it.failedDeliveryCollect)
                const codFee                 = Math.abs(it.codFee)
                const redeliveryFee          = Math.abs(it.redeliveryFee)
                const returnFee              = Math.abs(it.returnFee)
                // Phí DV = tổng các phí hiển thị theo nhóm trạng thái — cùng công thức
                // AgencyReconciliationShopDetail.tsx, không tự tính công thức khác.
                const sysFee = isSuccess
                  ? partialDelivery + failedDelivery + codFee + redeliveryFee + returnFee
                  : deliveryFee + insuranceFee
                const ghnFee = sysFee // cùng nguồn dữ liệu trong prototype này
                const sysNet = (isSuccess ? sysCOD : 0) - sysFee
                const ghnNet = (isSuccess ? ghnCOD : 0) - ghnFee

                const fmtSigned = (v: number) => v < 0 ? `−${fmt(Math.abs(v))}` : fmt(v)

                const feeCell = (val: number, applies: boolean) => (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span style={{ color: applies && val > 0 ? C_TEXT_PRIMARY : C_GHN }}>
                      {applies && val > 0 ? `−${fmt(val)}` : '—'}
                    </span>
                    <span style={{ fontSize: FONT_GHN, color: C_GHN }}>
                      {applies ? (val > 0 ? `−${fmt(val)}` : fmt(val)) : '—'}
                    </span>
                  </div>
                )

                const dual = (sysVal: number | null, ghnVal: number | null, opts?: { bold?: boolean }) => {
                  const topText = sysVal === null ? '—' : fmtSigned(sysVal)
                  const botText = ghnVal === null ? '—' : fmtSigned(ghnVal)
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <span style={{ color: sysVal === null ? C_GHN : C_TEXT_PRIMARY, fontWeight: opts?.bold ? 600 : undefined }}>{topText}</span>
                      <span style={{ fontSize: FONT_GHN, color: C_GHN }}>{botText}</span>
                    </div>
                  )
                }

                return (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'stretch', minWidth: 1400 }}>
                    <TCell width={120}>
                      <span style={{ color: C_LINK, fontWeight: 600 }}>{it.orderCode}</span>
                    </TCell>
                    <TCell width={140}>
                      <span style={{ color: C_TEXT_SECONDARY, fontSize: 13 }}>{it.customerOrderCode || '—'}</span>
                    </TCell>
                    <TCell width={200}>
                      <span style={{ color: ghnStatusColor(it.ghnStatus), fontSize: 13 }}>{it.ghnStatus}</span>
                    </TCell>

                    <TCell width={120} align='right'>
                      {dual(isSuccess ? sysCOD : null, isSuccess ? ghnCOD : null)}
                    </TCell>

                    <TCell width={120} align='right'>
                      {dual(
                        failedDeliveryCollect > 0 ? failedDeliveryCollect : null,
                        failedDeliveryCollect > 0 ? failedDeliveryCollect : null
                      )}
                    </TCell>

                    <TCell width={110} align='right'>{feeCell(deliveryFee,  !isSuccess)}</TCell>
                    <TCell width={100} align='right'>{feeCell(insuranceFee, !isSuccess)}</TCell>

                    <TCell width={110} align='right'>{feeCell(partialDelivery, isSuccess)}</TCell>
                    <TCell width={120} align='right'>{feeCell(failedDelivery,  isSuccess)}</TCell>
                    <TCell width={100} align='right'>{feeCell(codFee,          isSuccess)}</TCell>
                    <TCell width={110} align='right'>{feeCell(redeliveryFee,   isSuccess)}</TCell>
                    <TCell width={100} align='right'>{feeCell(returnFee,       isSuccess)}</TCell>

                    <TCell width={110} align='right'>{dual(sysFee > 0 ? -sysFee : null, ghnFee > 0 ? -ghnFee : null)}</TCell>
                    <TCell width={140} align='right'>
                      {dual(sysNet, ghnNet, { bold: true })}
                    </TCell>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </ConfigProvider>
  )
}
