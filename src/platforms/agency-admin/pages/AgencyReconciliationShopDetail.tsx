import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { agencyAdminTheme } from '../../../theme/platforms'
import allItemsData from '../../../mock-data/carrier-reconciliation-items.json'
import allSessions from '../../../mock-data/carrier-reconciliation.json'

const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

const fmtDate = (d: string) => {
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`
}

type ShopSession = {
  id: string
  nvcSessionId: string
  nvcSessionCode: string
  shopId: string
  shopName: string
  totalOrders: number
  totalCOD: number
  feeShop: number
  feeGHN: number
  profit: number
  totalMismatch: number
  status: 'pending' | 'confirmed'
  paymentDate: string
}

type ItemRecord = {
  id: string
  sessionId: string
  orderCode: string
  shopId: string
  shopName: string
  ghnCOD: number
  systemCOD: number
  ghnFee: number
  systemFee: number
  status: 'MATCH' | 'MISMATCH' | 'NOT_FOUND'
  customerOrderCode: string
  ghnStatus: string
  deliveryFee: number
  redeliveryFee: number
  insuranceFee: number
  returnFee: number
  failedDeliveryCOD: number
  failedDeliveryCollect: number
  codFee: number
  partialDeliveryFee: number
  prepaid: number
  discount: number
  serviceFee: number
  totalReconcileItem: number
}

const SUCCESS_STATUSES = ['Giao hàng thành công', 'Hoàn hàng thành công']

const C_GHN = '#9CA3AF'
const FONT_GHN = 11

function TCell({ children, width, flex = '0 0 auto', align = 'left', isHeader = false, bg, color, minWidth }: {
  children: React.ReactNode
  width?: number
  flex?: string
  align?: 'left' | 'right' | 'center'
  isHeader?: boolean
  bg?: string
  color?: string
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
      color: color ?? (isHeader ? C_TEXT_SECONDARY : undefined),
      background: bg ?? (isHeader ? C_BG_HEADER : undefined),
      ...(!isHeader ? { borderBottom: `1px solid ${C_BORDER}` } : {}),
    }}>
      {children}
    </div>
  )
}


export default function AgencyReconciliationShopDetail() {
  const navigate = useNavigate()
  const location = useLocation()

  const session: ShopSession | undefined = location.state?.session

  if (!session) {
    return (
      <ConfigProvider theme={agencyAdminTheme}>
        <div style={{ padding: 24, color: C_TEXT_SECONDARY }}>
          Không tìm thấy phiên shop. <span style={{ color: C_LINK, cursor: 'pointer' }} onClick={() => navigate(-1)}>Quay lại</span>
        </div>
      </ConfigProvider>
    )
  }

  const nvcSession = (allSessions as any[]).find(s => s.id === session.nvcSessionId)

  const items = (allItemsData as ItemRecord[]).filter(
    it => it.sessionId === session.nvcSessionId && it.shopId === session.shopId
  )

  const filteredItems = items

  const totalCOD = items.filter(it => SUCCESS_STATUSES.includes(it.ghnStatus)).reduce((s, i) => s + i.systemCOD, 0)
  const totalFee = items.reduce((s, i) => s + i.systemFee, 0)

  const ghnStatusColor = (status: string) => {
    const SUCCESS = ['Giao hàng thành công', 'Hoàn hàng thành công']
    const FAILED  = ['Giao hàng không thành công', 'Hoàn hàng không thành công', 'Hàng thất lạc', 'Hàng hư hỏng', 'Đơn huỷ']
    const GREY    = ['Không có trong hệ thống', 'Chờ lấy hàng', 'Đang lấy hàng', 'Đang tương tác với người gửi']
    if (SUCCESS.includes(status)) return '#16A34A'
    if (FAILED.includes(status))  return '#DC2626'
    if (GREY.includes(status))    return '#9CA3AF'
    return '#C2410C'
  }

  const cardStyle: React.CSSProperties = {
    flex: 1, padding: '14px 16px', border: `1px solid ${C_BORDER}`, borderRadius: 8, background: '#fff',
  }

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>

        {/* Breadcrumb + Title */}
        <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C_TEXT_SECONDARY, marginBottom: 8 }}>
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => navigate('/agency-admin/reconciliation', { state: { tab: 'shop' } })}>
              <ArrowLeftOutlined style={{ fontSize: 12 }} /> Đối soát GHN
            </span>
            <span style={{ color: C_BORDER }}>/</span>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/agency-admin/reconciliation', { state: { tab: 'shop' } })}>
              Phiên Shop
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
              background: session.status === 'confirmed' ? '#F0FDF4' : '#FFF7ED',
              color: session.status === 'confirmed' ? '#16A34A' : '#C2410C',
            }}>
              {session.status === 'confirmed' ? 'Đã chuyển khoản' : 'Chưa chuyển khoản'}
            </span>
            {nvcSession && (
              <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>
                Phiên GHN: <span style={{ color: C_LINK, fontWeight: 600 }}>{session.nvcSessionCode}</span>
                {' · '}{fmtDate(session.paymentDate)}
              </span>
            )}
          </div>
        </div>

        {/* Info row */}
        <div style={{ display: 'flex', gap: 24, padding: '6px 16px 12px', flexShrink: 0, fontSize: 13, flexWrap: 'wrap' }}>
          <span style={{ color: C_TEXT_SECONDARY }}>
            Shop: <strong style={{ color: C_TEXT_PRIMARY }}>{session.shopName}</strong>
            <span style={{ color: C_TEXT_SECONDARY }}> · {session.shopId}</span>
          </span>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'flex', gap: 12, padding: '0 16px 16px', flexShrink: 0 }}>
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
            <div style={{ fontSize: 22, fontWeight: 700, color: '#16A34A' }}>{fmt(totalCOD - totalFee)}</div>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: '1 0 0', overflow: 'hidden', padding: '0 16px' }}>
          <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
            <div style={{ minWidth: 1520 }}>
              {/* Header */}
              <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center', position: 'sticky', top: 0, zIndex: 2 }}>
                <TCell width={120} isHeader>Mã đơn GHN</TCell>
                <TCell width={140} isHeader>Mã đơn KH</TCell>
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

                const sysCOD          = Math.abs(it.systemCOD)
                const ghnCOD          = Math.abs(it.ghnCOD)
                const deliveryFee           = Math.abs(it.deliveryFee)
                const insuranceFee          = Math.abs(it.insuranceFee)
                const partialDelivery       = Math.abs(it.partialDeliveryFee)
                const failedDelivery        = Math.abs(it.failedDeliveryCOD)
                const failedDeliveryCollect = Math.abs(it.failedDeliveryCollect)
                const codFee                = Math.abs(it.codFee)
                const redeliveryFee   = Math.abs(it.redeliveryFee)
                const returnFee       = Math.abs(it.returnFee)
                // Phí DV = tổng các phí hiển thị theo nhóm trạng thái
                const sysFee = isSuccess
                  ? partialDelivery + failedDelivery + codFee + redeliveryFee + returnFee
                  : deliveryFee + insuranceFee
                const ghnFee = sysFee  // same source data in this prototype
                const sysNet = (isSuccess ? sysCOD : 0) - sysFee
                const ghnNet = (isSuccess ? ghnCOD : 0) - ghnFee

                // 2 lines: top = agency (bảng giá), bottom = GHN ref
                const fmtSigned = (v: number) => v < 0 ? `−${fmt(Math.abs(v))}` : fmt(v)

                // applies = column is relevant for this status group; always 2 lines; fees show with − prefix
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

                const dual = (sysVal: number | null, ghnVal: number | null, opts?: { sysColor?: string; bold?: boolean }) => {
                  const topColor = sysVal === null ? C_GHN : (opts?.sysColor ?? C_TEXT_PRIMARY)
                  const topText  = sysVal === null ? '—' : fmtSigned(sysVal)
                  const botText  = ghnVal === null ? '—' : fmtSigned(ghnVal)
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <span style={{ color: topColor, fontWeight: opts?.bold ? 600 : undefined }}>{topText}</span>
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

                    {/* COD — chỉ khi giao/hoàn thành công */}
                    <TCell width={120} align='right'>
                      {dual(isSuccess ? sysCOD : null, isSuccess ? ghnCOD : null)}
                    </TCell>

                    {/* Giao TT thu sau — khi có option giao thất bại thu tiền */}
                    <TCell width={120} align='right'>
                      {dual(
                        failedDeliveryCollect > 0 ? failedDeliveryCollect : null,
                        failedDeliveryCollect > 0 ? failedDeliveryCollect : null
                      )}
                    </TCell>

                    {/* Phí giao hàng + Phí bảo hiểm — trạng thái không phải thành công */}
                    <TCell width={110} align='right'>{feeCell(deliveryFee,  !isSuccess)}</TCell>
                    <TCell width={100} align='right'>{feeCell(insuranceFee, !isSuccess)}</TCell>

                    {/* Phụ phí đặc biệt — chỉ khi thành công */}
                    <TCell width={110} align='right'>{feeCell(partialDelivery, isSuccess)}</TCell>
                    <TCell width={120} align='right'>{feeCell(failedDelivery,  isSuccess)}</TCell>
                    <TCell width={100} align='right'>{feeCell(codFee,          isSuccess)}</TCell>
                    <TCell width={110} align='right'>{feeCell(redeliveryFee,   isSuccess)}</TCell>
                    <TCell width={100} align='right'>{feeCell(returnFee,       isSuccess)}</TCell>

                    {/* Phí DV + Tổng đối soát — luôn hiện */}
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
