import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { ArrowLeftOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { agencyAdminTheme } from '../../../theme/platforms'
import allSessions from '../../../mock-data/carrier-reconciliation.json'
import allItems from '../../../mock-data/carrier-reconciliation-items.json'

// ─── GHN shop lookup (mirrors CarrierSetup GHN_SHOPS) ────────────────────────
const GHN_SHOP_NAMES: Record<string, string> = {
  '5148899': 'Shop Thời Trang ABC',
  '5148900': 'Shop Điện Tử XYZ',
  '5148901': 'Shop Mỹ Phẩm Hà Nội',
  '5148902': 'Shop Giày Dép Fashion',
  '5148903': 'Shop Đồ Gia Dụng 365',
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

const fmtDate = (d: string) => {
  const dt = new Date(d)
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const yy = dt.getFullYear()
  return `${dd}/${mm}/${yy}`
}

function StatusBadge({ status }: { status: string }) {
  const isConfirmed = status === 'confirmed'
  const bg = isConfirmed ? '#F0FDF4' : '#FFF7ED'
  const color = isConfirmed ? '#16A34A' : '#C2410C'
  const label = isConfirmed ? 'Đã xác nhận' : 'Chờ xác nhận'
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 10,
      background: bg, color, fontSize: 12, fontWeight: 600,
    }}>
      {label}
    </span>
  )
}

const ITEM_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  MATCH:     { bg: '#F0FDF4', color: '#16A34A', label: 'Đúng' },
  MISMATCH:  { bg: '#FEF2F2', color: '#DC2626', label: 'Sai' },
  NOT_FOUND: { bg: '#F9FAFB', color: '#6B7280', label: 'Không tìm thấy' },
}

function ItemStatusBadge({ status }: { status: string }) {
  const cfg = ITEM_STATUS[status] ?? ITEM_STATUS.MATCH
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 10,
      background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 600,
    }}>
      {cfg.label}
    </span>
  )
}

// ─── Table cell helper ────────────────────────────────────────────────────────
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
      width, flex, flexShrink: 0, padding: '6px 8px', minWidth,
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

type CarrierSession = {
  id: string
  agencyId: string
  carrier: string
  paymentDate: string
  totalOrders: number
  totalCOD: number
  totalFee: number
  totalMismatch: number
  status: 'pending' | 'confirmed'
  fileName: string
  note: string
  createdAt: string
  ghnSessionCode: string
  ghnShopId: string
  totalReconcile: number
  outstandingDebt: number
  transferFee: number
  netReceived: number
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
  prepaid: number
  discount: number
  serviceFee: number
  totalReconcileItem: number
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AgencyReconciliationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState<'all' | 'MATCH' | 'MISMATCH' | 'NOT_FOUND'>('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const session = (allSessions as CarrierSession[]).find(s => s.id === id)

  if (!session) {
    return (
      <ConfigProvider theme={agencyAdminTheme}>
        <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 40px)' }}>
          <div
            onClick={() => navigate('/agency-admin/reconciliation')}
            style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, marginBottom: 16 }}
          >
            <ArrowLeftOutlined /> Đối soát GHN
          </div>
          <div style={{ fontSize: 16, color: C_TEXT_PRIMARY }}>Không tìm thấy phiên</div>
        </div>
      </ConfigProvider>
    )
  }

  const items = (allItems as ItemRecord[]).filter(i => i.sessionId === id)
  const totalMismatch = items.filter(i => i.status !== 'MATCH').length
  const totalCOD = items.reduce((s, i) => s + i.ghnCOD, 0)
  const totalFee = items.reduce((s, i) => s + i.ghnFee, 0)

  const filteredItems = items.filter(i =>
    filterStatus === 'all' ? true : i.status === filterStatus
  )

  const cardStyle: React.CSSProperties = {
    flex: 1, padding: '14px 16px', border: `1px solid ${C_BORDER}`,
    borderRadius: 8, background: '#fff',
  }

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: 'calc(100vh - 40px)', width: '100%',
        background: '#fff', overflow: 'hidden',
      }}>
        {/* Breadcrumb + header */}
        <div style={{ padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              onClick={() => navigate('/agency-admin/reconciliation')}
              style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
            >
              <ArrowLeftOutlined /> Đối soát GHN
            </span>
            <span style={{ color: C_BORDER }}>/</span>
            <span
              onClick={() => navigate('/agency-admin/reconciliation')}
              style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, fontSize: 13 }}
            >
              Phiên GHN
            </span>
            <span style={{ color: C_BORDER }}>/</span>
            <span style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>{session.ghnSessionCode}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0 }}>
              Phiên {session.ghnSessionCode}
            </h1>
            <StatusBadge status={session.status} />
            <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, marginLeft: 4 }}>
              {session.fileName} · {fmtDate(session.paymentDate)}
            </span>
            {session.status === 'pending' && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', background: '#fff',
                    border: '1px solid #FCA5A5', borderRadius: 6,
                    color: '#DC2626', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  <DeleteOutlined /> Xoá phiên
                </button>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', background: '#FF5200',
                    border: 'none', borderRadius: 6,
                    color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <CheckCircleOutlined /> Xác nhận phiên
                </button>
              </div>
            )}
          </div>
        </div>

        {/* GHN session info row */}
        <div style={{ display: 'flex', gap: 24, padding: '0 16px 12px', flexShrink: 0, fontSize: 13, flexWrap: 'wrap' }}>
          <span style={{ color: C_TEXT_SECONDARY }}>
            Mã phiên GHN: <strong style={{ color: C_TEXT_PRIMARY }}>{session.ghnSessionCode}</strong>
          </span>
          <span style={{ color: C_TEXT_SECONDARY }}>
            Cửa hàng GHN: <strong style={{ color: C_TEXT_PRIMARY }}>{GHN_SHOP_NAMES[session.ghnShopId] ?? session.ghnShopId}</strong>
            <strong style={{ color: C_TEXT_PRIMARY }}> · {session.ghnShopId}</strong>
          </span>
          <span style={{ color: C_TEXT_SECONDARY }}>
            Nợ tồn: <strong style={{ color: session.outstandingDebt > 0 ? '#DC2626' : C_TEXT_PRIMARY }}>{fmt(session.outstandingDebt)}</strong>
          </span>
          <span style={{ color: C_TEXT_SECONDARY }}>
            Phí CK COD: <strong style={{ color: C_TEXT_PRIMARY }}>{fmt(session.transferFee)}</strong>
          </span>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'flex', gap: 12, padding: '0 16px 16px', flexShrink: 0 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Tổng đơn</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY }}>{items.length}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Tổng COD (GHN)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmt(totalCOD)}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Tổng phí DV (GHN)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmt(totalFee)}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Thực nhận</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#16A34A' }}>{fmt(session.netReceived)}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Số lệch</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: totalMismatch > 0 ? '#DC2626' : C_TEXT_PRIMARY }}>
              {totalMismatch}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px 12px', flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'MATCH' | 'MISMATCH' | 'NOT_FOUND')}
            style={{
              border: `1px solid ${C_BORDER}`, borderRadius: 6,
              padding: '7px 12px', fontSize: 14, background: '#fff',
              color: C_TEXT_PRIMARY, outline: 'none', cursor: 'pointer',
              minWidth: 180,
            }}
          >
            <option value="all">Tất cả</option>
            <option value="MATCH">Đúng</option>
            <option value="MISMATCH">Sai</option>
            <option value="NOT_FOUND">Không tìm thấy</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ flex: '1 0 0', overflow: 'hidden', padding: '0 16px' }}>
          <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
            <div style={{ minWidth: 1800 }}>
              {/* Header */}
              <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center', position: 'sticky', top: 0, zIndex: 2 }}>
                <TCell width={120} isHeader>Mã đơn GHN</TCell>
                <TCell width={140} isHeader>Mã đơn KH</TCell>
                <TCell width={220} isHeader>Trạng thái GHN</TCell>
                <TCell width={120} align='right' isHeader>Tiền COD</TCell>
                <TCell width={130} align='right' isHeader>Giao TT - thu</TCell>
                <TCell width={120} align='right' isHeader>Đã TT trước</TCell>
                <TCell width={100} align='right' isHeader>KM</TCell>
                <TCell width={170} align='right' isHeader>Phí giao hàng (GHN)</TCell>
                <TCell width={160} align='right' isHeader>Phí giao lại (GHN)</TCell>
                <TCell width={160} align='right' isHeader>Phí khai giá (GHN)</TCell>
                <TCell width={150} align='right' isHeader>Phí hoàn (GHN)</TCell>
                <TCell width={140} align='right' isHeader>Phí DV (GHN)</TCell>
                <TCell width={130} align='right' isHeader>Tổng đối soát</TCell>
                <TCell width={130} align='center' isHeader>Trạng thái ĐS</TCell>
              </div>
              <div style={{ height: 1, background: C_BORDER }} />

              {filteredItems.length === 0 && (
                <div style={{ padding: '48px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                  Không có đơn nào
                </div>
              )}

              {filteredItems.map((it) => {
                const isNotFound  = it.status === 'NOT_FOUND'
                const isMismatch  = it.status === 'MISMATCH'
                const codMismatch = isMismatch && it.ghnCOD !== it.systemCOD
                const feeMismatch = isMismatch && Math.abs(it.serviceFee) !== it.systemFee
                const baseColor   = isNotFound ? '#9CA3AF' : undefined

                const SUCCESS_STATUSES = ['Giao hàng thành công', 'Hoàn hàng thành công']
                const isSuccess = SUCCESS_STATUSES.includes(it.ghnStatus)

                const ghnStatusColor = (() => {
                  const FAILED  = ['Giao hàng không thành công', 'Hoàn hàng không thành công', 'Hàng thất lạc', 'Hàng hư hỏng', 'Đơn huỷ']
                  const GREY    = ['Không có trong hệ thống', 'Chờ lấy hàng', 'Đang lấy hàng', 'Đang tương tác với người gửi']
                  if (SUCCESS_STATUSES.includes(it.ghnStatus)) return '#16A34A'
                  if (FAILED.includes(it.ghnStatus))  return '#DC2626'
                  if (GREY.includes(it.ghnStatus))    return '#9CA3AF'
                  return '#C2410C'  // in-progress statuses
                })()

                const fmtFee = (n: number) => n !== 0 ? fmt(n) : '—'
                const showCell = (val: number, applies: boolean) => applies ? fmtFee(val) : '—'

                return (
                  <div
                    key={it.id}
                    style={{
                      display: 'flex', alignItems: 'stretch', minWidth: 1800,
                    }}
                  >
                    <TCell width={120}>
                      <span style={{ color: isNotFound ? '#9CA3AF' : C_LINK, fontWeight: 600 }}>
                        {it.orderCode}
                      </span>
                    </TCell>
                    <TCell width={140}>
                      <span style={{ color: isNotFound ? '#9CA3AF' : C_TEXT_SECONDARY, fontSize: 13 }}>
                        {it.customerOrderCode || '—'}
                      </span>
                    </TCell>
                    <TCell width={220}>
                      <span style={{ color: ghnStatusColor, fontSize: 13, whiteSpace: 'nowrap' }}>
                        {it.ghnStatus}
                      </span>
                    </TCell>
                    {/* (1) Tiền COD — chỉ hiện khi isSuccess */}
                    <TCell width={120} align='right'
                      bg={codMismatch ? '#FEF2F2' : undefined}
                      color={codMismatch ? '#DC2626' : baseColor}
                    >
                      {isSuccess ? fmt(it.ghnCOD) : '—'}
                    </TCell>
                    {/* (2) Giao thất bại - thu tiền — chỉ hiện khi isSuccess */}
                    <TCell width={130} align='right' color={baseColor}>
                      {showCell(it.failedDeliveryCOD, isSuccess)}
                    </TCell>
                    {/* (3) Đã thanh toán trước — chỉ hiện khi isSuccess */}
                    <TCell width={120} align='right' color={baseColor}>
                      {showCell(it.prepaid, isSuccess)}
                    </TCell>
                    {/* (4) Khuyến mãi — chỉ hiện khi isSuccess */}
                    <TCell width={100} align='right' color={baseColor}>
                      {showCell(it.discount, isSuccess)}
                    </TCell>
                    {/* (5.1) Phí giao hàng — chỉ hiện khi !isSuccess */}
                    <TCell width={170} align='right'
                      bg={feeMismatch && !isSuccess ? '#FEF2F2' : undefined}
                      color={feeMismatch && !isSuccess ? '#DC2626' : baseColor}
                    >
                      {showCell(it.deliveryFee, !isSuccess)}
                    </TCell>
                    {/* (5.2) Phí giao lại — chỉ hiện khi isSuccess */}
                    <TCell width={160} align='right' color={baseColor}>
                      {showCell(it.redeliveryFee, isSuccess)}
                    </TCell>
                    {/* (5.3) Phí khai giá — chỉ hiện khi !isSuccess */}
                    <TCell width={160} align='right' color={baseColor}>
                      {showCell(it.insuranceFee, !isSuccess)}
                    </TCell>
                    {/* (5.4) Phí hoàn — chỉ hiện khi isSuccess */}
                    <TCell width={150} align='right' color={baseColor}>
                      {showCell(it.returnFee, isSuccess)}
                    </TCell>
                    {/* (5) Phí dịch vụ */}
                    <TCell width={140} align='right' color={baseColor}>
                      {fmt(it.serviceFee)}
                    </TCell>
                    {/* Tổng đối soát */}
                    <TCell width={130} align='right' color={baseColor}>
                      <span style={{ fontWeight: 600 }}>{fmt(it.totalReconcileItem)}</span>
                    </TCell>
                    <TCell width={130} align='center'>
                      <ItemStatusBadge status={it.status} />
                    </TCell>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal xoá phiên */}
      {showDeleteModal && (
        <div
          onClick={() => setShowDeleteModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: 420, background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY }}>Xoá phiên GHN</div>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <p style={{ fontSize: 14, color: C_TEXT_PRIMARY, margin: '0 0 4px' }}>
                Bạn có chắc muốn xoá phiên <strong style={{ color: C_TEXT_PRIMARY }}>{session.ghnSessionCode}</strong>?
              </p>
              <p style={{ fontSize: 13, color: C_TEXT_SECONDARY, margin: 0 }}>
                Hành động này không thể hoàn tác. Toàn bộ dữ liệu của phiên sẽ bị xoá.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 24px' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ padding: '7px 16px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 14, color: C_TEXT_PRIMARY, cursor: 'pointer' }}
              >
                Huỷ
              </button>
              <button
                onClick={() => navigate('/agency-admin/reconciliation', { state: { deletedId: id } })}
                style={{ padding: '7px 16px', background: '#DC2626', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                Xoá phiên
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận phiên */}
      {showConfirmModal && (
        <div
          onClick={() => setShowConfirmModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: 420, background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY }}>Xác nhận phiên GHN</div>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <p style={{ fontSize: 14, color: C_TEXT_PRIMARY, margin: '0 0 4px' }}>
                Xác nhận phiên <strong style={{ color: C_TEXT_PRIMARY }}>{session.ghnSessionCode}</strong>?
              </p>
              <p style={{ fontSize: 13, color: C_TEXT_SECONDARY, margin: 0 }}>
                Sau khi xác nhận, hệ thống sẽ tự động tạo phiên đối soát cho từng shop thuộc đại lý. Dữ liệu phiên sẽ bị khoá, không thể chỉnh sửa.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 24px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{ padding: '7px 16px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 14, color: C_TEXT_PRIMARY, cursor: 'pointer' }}
              >
                Huỷ
              </button>
              <button
                onClick={() => navigate('/agency-admin/reconciliation', { state: { confirmedId: id } })}
                style={{ padding: '7px 16px', background: '#FF5200', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                Xác nhận phiên
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfigProvider>
  )
}
