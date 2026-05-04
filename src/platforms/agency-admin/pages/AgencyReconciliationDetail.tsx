import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { ArrowLeftOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { agencyAdminTheme } from '../../../theme/platforms'
import allSessions from '../../../mock-data/carrier-reconciliation.json'
import allItems from '../../../mock-data/carrier-reconciliation-items.json'

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
  MATCH:     { bg: '#F0FDF4', color: '#16A34A', label: 'Khớp' },
  MISMATCH:  { bg: '#FEF2F2', color: '#DC2626', label: 'Lệch' },
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
function TCell({ children, width, flex = '0 0 auto', align = 'left', isHeader = false, bg, color }: {
  children: React.ReactNode
  width?: number
  flex?: string
  align?: 'left' | 'right' | 'center'
  isHeader?: boolean
  bg?: string
  color?: string
}) {
  return (
    <div style={{
      width, flex, flexShrink: 0, padding: '6px 8px',
      display: 'flex', alignItems: 'center',
      justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
      fontSize: 14,
      color: color ?? (isHeader ? C_TEXT_SECONDARY : undefined),
      background: bg ?? (isHeader ? C_BG_HEADER : undefined),
    }}>
      {children}
    </div>
  )
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
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AgencyReconciliationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState<'all' | 'MATCH' | 'MISMATCH' | 'NOT_FOUND'>('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const session = allSessions.find(s => s.id === id)

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
            <span style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>{id}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0 }}>
              Phiên {session.id}
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
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Tổng cước (GHN)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmt(totalFee)}</div>
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
            <option value="MATCH">Khớp</option>
            <option value="MISMATCH">Lệch</option>
            <option value="NOT_FOUND">Không tìm thấy</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ flex: '1 0 0', overflowY: 'auto', padding: '0 16px' }}>
          <div style={{ minWidth: 1000 }}>
            {/* Header */}
            <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
              <TCell flex='1 0 0' isHeader>Mã đơn GHN</TCell>
              <TCell width={180} isHeader>Shop</TCell>
              <TCell width={130} align='right' isHeader>COD GHN</TCell>
              <TCell width={130} align='right' isHeader>COD hệ thống</TCell>
              <TCell width={110} align='right' isHeader>Phí GHN</TCell>
              <TCell width={110} align='right' isHeader>Phí hệ thống</TCell>
              <TCell width={140} align='center' isHeader>Trạng thái</TCell>
            </div>
            <div style={{ height: 1, background: C_BORDER }} />

            {filteredItems.length === 0 && (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                Không có đơn nào
              </div>
            )}

            {filteredItems.map((it) => {
              const isNotFound = it.status === 'NOT_FOUND'
              const codMismatch = it.ghnCOD !== it.systemCOD
              const feeMismatch = it.ghnFee !== it.systemFee
              const baseColor = isNotFound ? '#9CA3AF' : undefined
              return (
                <div
                  key={it.id}
                  style={{
                    display: 'flex', alignItems: 'center',
                    borderBottom: `1px solid ${C_BORDER}`,
                  }}
                >
                  <TCell flex='1 0 0'>
                    <span style={{
                      color: isNotFound ? '#9CA3AF' : C_LINK,
                      fontWeight: 600,
                    }}>
                      {it.orderCode}
                    </span>
                  </TCell>
                  <TCell width={180}>
                    <span style={{
                      color: isNotFound ? '#9CA3AF' : C_TEXT_PRIMARY,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {it.shopName}
                    </span>
                  </TCell>
                  <TCell
                    width={130}
                    align='right'
                    bg={codMismatch ? '#FEF2F2' : undefined}
                    color={codMismatch ? '#DC2626' : baseColor}
                  >
                    {fmt(it.ghnCOD)}
                  </TCell>
                  <TCell width={130} align='right' color={baseColor}>
                    {fmt(it.systemCOD)}
                  </TCell>
                  <TCell
                    width={110}
                    align='right'
                    bg={feeMismatch ? '#FEF2F2' : undefined}
                    color={feeMismatch ? '#DC2626' : baseColor}
                  >
                    {fmt(it.ghnFee)}
                  </TCell>
                  <TCell width={110} align='right' color={baseColor}>
                    {fmt(it.systemFee)}
                  </TCell>
                  <TCell width={140} align='center'>
                    <ItemStatusBadge status={it.status} />
                  </TCell>
                </div>
              )
            })}
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
              <div style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY }}>Xoá phiên vận chuyển</div>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <p style={{ fontSize: 14, color: C_TEXT_PRIMARY, margin: '0 0 4px' }}>
                Bạn có chắc muốn xoá phiên <strong style={{ color: C_TEXT_PRIMARY }}>{session.id}</strong>?
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
              <div style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY }}>Xác nhận phiên vận chuyển</div>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <p style={{ fontSize: 14, color: C_TEXT_PRIMARY, margin: '0 0 4px' }}>
                Xác nhận phiên <strong style={{ color: C_TEXT_PRIMARY }}>{session.id}</strong>?
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
