import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import {
  FileTextOutlined,
  ShopOutlined,
  BankOutlined,
  BarChartOutlined,
  ScissorOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  CloseOutlined,
  DeleteOutlined,
  WarningOutlined,
  SearchOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { agencyAdminTheme } from '../../../theme/platforms'
import carrierSessionsData from '../../../mock-data/carrier-reconciliation.json'
import { getReconciliationItems } from '../../../mock-data/reconciliationLedger'
import ordersData from '../../../mock-data/orders.json'
import allShopsData from '../../../mock-data/shops.json'

// ─── Types ────────────────────────────────────────────────────────────────────
type CarrierSession = {
  id: string
  agencyId: string
  carrier: string
  paymentDate: string
  periodStart?: string
  periodEnd?: string
  totalOrders: number
  totalCOD: number
  totalFee: number
  totalMismatch: number
  status: 'pending' | 'confirmed'
  fileName: string
  note: string
  createdAt: string
  ghnSessionCode: string
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
  returnFee: number
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
  periodStart?: string
  periodEnd?: string
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_BORDER         = '#E5E7EB'
const C_ACTION         = '#FF5200'
const C_BG_HEADER      = '#F3F4F6'

// ─── Date-range preset filter — cùng pattern với AgencyOrders.tsx/Shops.tsx (modal Xuất đơn
// hàng), thêm preset "Tất cả" làm mặc định vì đây là filter danh sách (không filter = xem hết),
// khác bối cảnh modal xuất file (luôn cần 1 khoảng ngày cụ thể). ─────────────────────────────
const DATE_PRESETS: { key: string; label: string }[] = [
  { key: 'all',        label: 'Tất cả' },
  { key: 'custom',     label: 'Tuỳ chỉnh' },
  { key: 'this_week',  label: 'Tuần này' },
  { key: 'last_week',  label: 'Tuần trước' },
  { key: 'this_month', label: 'Tháng này' },
  { key: 'last_month', label: 'Tháng trước' },
  { key: '30d',        label: '30 ngày trước' },
  { key: '90d',        label: '90 ngày trước' },
]

function fmtDateInput(d: Date) {
  return d.toISOString().slice(0, 10)
}

function fmtDisplayDate(iso: string): string {
  if (!iso) return '--/--/----'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function computePresetRange(preset: string, today: Date): [string, string] | null {
  const base = new Date(today)
  base.setHours(0, 0, 0, 0)
  if (preset === 'all' || preset === 'custom') return null
  if (preset === 'this_week' || preset === 'last_week') {
    const day = base.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(base)
    monday.setDate(base.getDate() + diffToMonday + (preset === 'last_week' ? -7 : 0))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return [fmtDateInput(monday), fmtDateInput(sunday)]
  }
  if (preset === 'this_month' || preset === 'last_month') {
    const monthOffset = preset === 'last_month' ? -1 : 0
    const first = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1)
    const last = new Date(base.getFullYear(), base.getMonth() + monthOffset + 1, 0)
    return [fmtDateInput(first), fmtDateInput(last)]
  }
  if (preset === '30d') {
    const from = new Date(base)
    from.setDate(base.getDate() - 29)
    return [fmtDateInput(from), fmtDateInput(base)]
  }
  if (preset === '90d') {
    const from = new Date(base)
    from.setDate(base.getDate() - 89)
    return [fmtDateInput(from), fmtDateInput(base)]
  }
  return null
}

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
      border: `1.5px solid ${checked ? C_ACTION : C_BORDER}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {checked && <div style={{ width: 9, height: 9, borderRadius: '50%', background: C_ACTION }} />}
    </div>
  )
}

// ─── Tab types ────────────────────────────────────────────────────────────────
type TabKey = 'carrier' | 'shop' | 'transfer' | 'forecast' | 'split' | 'overdue'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'carrier',  label: 'Phiên NVC',     icon: <FileTextOutlined /> },
  { key: 'shop',     label: 'Phiên shop',    icon: <ShopOutlined /> },
  { key: 'transfer', label: 'Chuyển khoản', icon: <BankOutlined /> },
  { key: 'forecast', label: 'Dự trù',       icon: <BarChartOutlined /> },
  { key: 'split',    label: 'Tách phiên',   icon: <ScissorOutlined /> },
  { key: 'overdue',  label: 'Quá hạn đối soát', icon: <WarningOutlined /> },
]

// Số ngày tối đa cho phép trễ giữa lúc đơn "Giao hàng thành công" trên hệ thống và lúc
// GHN thật sự đưa đơn đó vào 1 file đối soát nào — vượt ngưỡng này mới coi là bất thường
// thật sự cần cảnh báo (khớp GHN chu kỳ thanh toán ~15 ngày, cho dư 1 kỳ để tránh báo giả)
const OVERDUE_THRESHOLD_DAYS = 30

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

const fmtPeriod = (start?: string, end?: string) => {
  if (!start || !end) return null
  const dt = (s: string) => new Date(s)
  const dd = (s: string) => String(dt(s).getDate()).padStart(2, '0')
  const mm = (s: string) => String(dt(s).getMonth() + 1).padStart(2, '0')
  const yy = (s: string) => dt(s).getFullYear()
  if (start === end) return `${dd(start)}/${mm(start)}/${yy(start)}`
  return `${dd(start)}/${mm(start)} – ${dd(end)}/${mm(end)}/${yy(end)}`
}

const fmtDate = (d: string) => {
  const dt = new Date(d)
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const yy = dt.getFullYear()
  return `${dd}/${mm}/${yy}`
}

function StatusBadge({ status, confirmedLabel = 'Đã xác nhận', pendingLabel = 'Chờ xác nhận' }: { status: string; confirmedLabel?: string; pendingLabel?: string }) {
  const isConfirmed = status === 'confirmed'
  const bg    = isConfirmed ? '#F0FDF4' : '#FFF7ED'
  const color = isConfirmed ? '#16A34A' : '#C2410C'
  const label = isConfirmed ? confirmedLabel : pendingLabel
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 10,
      background: bg, color, fontSize: 12, fontWeight: 600,
    }}>
      {label}
    </span>
  )
}

// ─── Table cell helper ────────────────────────────────────────────────────────
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
      width, flex, minWidth, flexShrink: 0, padding: '6px 8px',
      display: 'flex', alignItems: 'center',
      justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
      fontSize: 14,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      color: isHeader ? C_TEXT_SECONDARY : undefined,
      background: isHeader ? C_BG_HEADER : undefined,
    }}>
      {children}
    </div>
  )
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
function Checkbox({ checked, disabled, onChange }: {
  checked: boolean; disabled?: boolean; onChange?: () => void
}) {
  return (
    <div
      onClick={() => !disabled && onChange?.()}
      style={{
        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: checked ? 'none' : `1.5px solid ${disabled ? '#D1D5DB' : C_BORDER}`,
        background: checked ? C_ACTION : disabled ? '#F9FAFB' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 12 9" fill="none">
          <path d="M1 4L4.5 7.5L11 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  )
}

// Đơn GHN (orderCode) trong file đối soát về nguyên tắc phải tra ngược đơn hàng
// đại lý để biết thuộc shop nào. Ưu tiên tra orders.json (trackingCode/id) —
// nếu không tìm thấy (VD: đơn đối soát chưa có trong orders.json ở prototype
// này) thì dùng shopId tĩnh có sẵn trên item làm phương án dự phòng.
function resolveShopId(item: { orderCode: string; shopId: string }): string {
  const order = (ordersData as Array<{ id: string; trackingCode?: string; shopId: string }>)
    .find(o => o.trackingCode === item.orderCode || o.id === item.orderCode)
  return order?.shopId ?? item.shopId
}

// ─── Derive shop sessions từ confirmed NVC sessions ───────────────────────────
function deriveShopSessions(
  sessions: CarrierSession[],
  items: ItemRecord[],
  confirmedShopIds: Set<string>
): ShopSession[] {
  const confirmedNVCIds = new Set(
    sessions.filter(s => s.status === 'confirmed').map(s => s.id)
  )

  const groups = new Map<string, { items: ItemRecord[]; session: CarrierSession }>()
  items.forEach(item => {
    if (!confirmedNVCIds.has(item.sessionId)) return
    const shopId = resolveShopId(item)
    const key = `${item.sessionId}::${shopId}`
    if (!groups.has(key)) {
      const session = sessions.find(s => s.id === item.sessionId)!
      groups.set(key, { items: [], session })
    }
    groups.get(key)!.items.push(item)
  })

  const result: ShopSession[] = []
  let idx = 1
  groups.forEach(({ items: groupItems, session }, key) => {
    const sep     = key.indexOf('::')
    const nvcId   = key.substring(0, sep)
    const shopId  = key.substring(sep + 2)
    const datePart = session.paymentDate.replace(/-/g, '')
    const id      = `COD_SHOP_${datePart}${String(idx).padStart(4, '0')}_${shopId}`
    idx++
    const totalCOD    = groupItems.reduce((sum, i) => sum + i.ghnCOD, 0)
    const feeShop     = groupItems.reduce((sum, i) => sum + i.systemFee, 0)
    const feeGHN      = groupItems.reduce((sum, i) => sum + i.ghnFee, 0)
    const totalMismatch = groupItems.filter(i => i.status !== 'MATCH').length

    const raw = (carrierSessionsData as Array<{ id: string; periodStart?: string; periodEnd?: string }>)
      .find(r => r.id === nvcId)
    result.push({
      id,
      nvcSessionId: nvcId,
      nvcSessionCode: session.ghnSessionCode,
      shopId,
      shopName: groupItems[0].shopName,
      totalOrders: groupItems.length,
      totalCOD,
      feeShop,
      feeGHN,
      profit: feeShop - feeGHN,
      totalMismatch,
      status: confirmedShopIds.has(id) ? 'confirmed' : 'pending',
      paymentDate: session.paymentDate,
      periodStart: raw?.periodStart ?? session.periodStart,
      periodEnd:   raw?.periodEnd   ?? session.periodEnd,
    })
  })

  return result.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
}

// ─── Tab: Phiên nhà vận chuyển ────────────────────────────────────────────────
function TabCarrier({
  sessions,
  onConfirmMultiple,
  onAddSession,
  onDeleteSession,
}: {
  sessions: CarrierSession[]
  onConfirmMultiple: (ids: string[]) => void
  onAddSession: (session: CarrierSession) => void
  onDeleteSession: (id: string) => void
}) {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus]   = useState<'all' | 'pending' | 'confirmed'>('all')
  const [filterCarrier, setFilterCarrier] = useState<'all' | 'GHN' | '247Express'>('all')
  const [search, setSearch] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const handleDeleteSession = (id: string) => {
    onDeleteSession(id)
    setDeleteConfirmId(null)
  }

  const carrierSessions = sessions.filter(s =>
    filterCarrier === 'all' ? true : s.carrier === filterCarrier
  )

  const total     = carrierSessions.length
  const confirmed = carrierSessions.filter(s => s.status === 'confirmed').length
  const pending   = carrierSessions.filter(s => s.status === 'pending').length

  const filteredSessions = carrierSessions
    .filter(s => filterStatus === 'all' ? true : s.status === filterStatus)
    .filter(s => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return s.ghnSessionCode.toLowerCase().includes(q) || s.fileName.toLowerCase().includes(q)
    })

  const pendingIds = filteredSessions.filter(s => s.status === 'pending').map(s => s.id)
  const allPendingSelected = pendingIds.length > 0 && pendingIds.every(id => selectedIds.has(id))

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingIds))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleConfirm = () => {
    onConfirmMultiple(Array.from(selectedIds))
    setSelectedIds(new Set())
  }

  const cardStyle: React.CSSProperties = {
    flex: 1, padding: '14px 16px', border: `1px solid ${C_BORDER}`,
    borderRadius: 8, background: '#fff',
  }

  return (
    <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
      {/* Header actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>
          Danh sách phiên đối soát từ nhà vận chuyển
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', background: C_ACTION, border: 'none',
            borderRadius: 6, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <UploadOutlined />
          Tạo phiên {filterCarrier === 'all' ? 'NVC' : filterCarrier}
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexShrink: 0 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Tổng phiên</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY }}>{total}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Đã xác nhận</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#16A34A' }}>{confirmed}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Chờ xác nhận</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#C2410C' }}>{pending}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>NVC:</span>
          <select
            value={filterCarrier}
            onChange={e => { setFilterCarrier(e.target.value as 'all' | 'GHN' | '247Express'); setSelectedIds(new Set()) }}
            style={{
              border: `1px solid ${C_BORDER}`, borderRadius: 6,
              padding: '7px 12px', fontSize: 14, background: '#fff',
              color: C_TEXT_PRIMARY, outline: 'none', cursor: 'pointer',
              minWidth: 140,
            }}
          >
            <option value="all">Tất cả</option>
            <option value="GHN">GHN</option>
            <option value="247Express">247Express</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Trạng thái:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as 'all' | 'pending' | 'confirmed')}
            style={{
              border: `1px solid ${C_BORDER}`, borderRadius: 6,
              padding: '7px 12px', fontSize: 14, background: '#fff',
              color: C_TEXT_PRIMARY, outline: 'none', cursor: 'pointer',
              minWidth: 160,
            }}
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
          </select>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', flex: 1, minWidth: 220,
          background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
        }}>
          <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo mã phiên GHN hoặc tên file"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent' }}
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', marginBottom: 8,
          background: '#FFF4ED', borderRadius: 8, border: '1px solid #FDBA74', flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>
            Đã chọn <strong>{selectedIds.size}</strong> phiên
          </span>
          <button
            onClick={handleConfirm}
            style={{
              padding: '6px 16px', background: C_ACTION, border: 'none',
              borderRadius: 6, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Xác nhận phiên đã chọn
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ flex: '1 0 0', overflow: 'hidden' }}>
        <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
          <div style={{ minWidth: 1500 }}>
            <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
              <div style={{ width: 40, flexShrink: 0, padding: '6px 8px', background: C_BG_HEADER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Checkbox checked={allPendingSelected} onChange={toggleSelectAll} />
              </div>
              <TCell width={220} isHeader>Mã phiên GHN</TCell>
              <TCell width={120} isHeader>Ngày TT GHN</TCell>
              <TCell width={120} isHeader>Ngày upload file</TCell>
              <TCell flex='1 0 0' minWidth={220} isHeader>Tên file</TCell>
              <TCell width={80}  align='right' isHeader>Số đơn</TCell>
              <TCell width={90}  align='right' isHeader>Số lệch</TCell>
              <TCell width={150} align='right' isHeader>Tổng COD (GHN)</TCell>
              <TCell width={150} align='right' isHeader>Tổng phí DV (GHN)</TCell>
              <TCell width={160} align='right' isHeader>Thực nhận</TCell>
              <TCell width={200} align='center' isHeader>Trạng thái</TCell>
              <TCell width={48} isHeader>{null}</TCell>
            </div>
            <div style={{ height: 1, background: C_BORDER }} />

            {filteredSessions.length === 0 && (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                Chưa có phiên nào
              </div>
            )}

            {filteredSessions.map(s => (
              <SessionRow
                key={s.id}
                session={s}
                onNavigate={() => navigate(`/agency-admin/reconciliation/${s.id}`)}
                selected={selectedIds.has(s.id)}
                onToggle={() => toggleOne(s.id)}
                onDelete={() => setDeleteConfirmId(s.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {deleteConfirmId && (
        <div
          onClick={() => setDeleteConfirmId(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: 400, background: '#fff', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '20px 24px 0' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY }}>Xoá phiên GHN</div>
            </div>
            <div style={{ padding: '16px 24px' }}>
              <p style={{ fontSize: 14, color: C_TEXT_PRIMARY, margin: '0 0 4px' }}>
                Bạn có chắc muốn xoá phiên <strong>{sessions.find(s => s.id === deleteConfirmId)?.ghnSessionCode}</strong>?
              </p>
              <p style={{ fontSize: 13, color: C_TEXT_SECONDARY, margin: 0 }}>
                Hành động này không thể hoàn tác.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 24px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{ padding: '7px 16px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 14, color: C_TEXT_PRIMARY, cursor: 'pointer' }}
              >
                Huỷ
              </button>
              <button
                onClick={() => handleDeleteSession(deleteConfirmId)}
                style={{ padding: '7px 16px', background: '#DC2626', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                Xoá phiên
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSubmit={(file, date, note) => {
            const newSession: CarrierSession = {
              id: `GHN${String(sessions.length + 100).padStart(3, '0')}`,
              agencyId: 'AGN001',
              carrier: 'GHN',
              paymentDate: date,
              totalOrders: 0,
              totalCOD: 0,
              totalFee: 0,
              totalMismatch: 0,
              status: 'pending',
              fileName: file.name,
              note,
              createdAt: new Date().toISOString(),
              ghnSessionCode: file.name.replace(/\.[^.]+$/, ''),
              totalReconcile: 0,
              outstandingDebt: 0,
              transferFee: -5500,
              netReceived: 0,
            }
            onAddSession(newSession)
            setShowUploadModal(false)
          }}
        />
      )}
    </div>
  )
}

function SessionRow({ session: s, onNavigate, selected, onToggle, onDelete }: {
  session: CarrierSession
  onNavigate: () => void
  selected: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const [hover, setHover] = useState(false)
  const [deleteHover, setDeleteHover] = useState(false)
  return (
    <div
      onClick={onNavigate}
      style={{
        display: 'flex', alignItems: 'center', cursor: 'pointer', minWidth: 1620,
        background: selected ? '#FFF4ED' : hover ? '#FAFAFA' : '#fff',
        boxShadow: `inset 0 -1px 0 ${C_BORDER}`,
        transition: 'background 0.1s',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        style={{ width: 40, flexShrink: 0, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={e => e.stopPropagation()}
      >
        <Checkbox
          checked={selected}
          disabled={s.status !== 'pending'}
          onChange={onToggle}
        />
      </div>
      <TCell width={220}>
        <span style={{ color: C_LINK, fontWeight: 600 }}>{s.ghnSessionCode}</span>
      </TCell>
      <TCell width={120}>{fmtDate(s.paymentDate)}</TCell>
      <TCell width={120}>
        <span style={{ color: C_TEXT_SECONDARY }}>{fmtDate(s.createdAt)}</span>
      </TCell>
      <TCell flex='1 0 0' minWidth={220}>
        <span style={{ color: C_TEXT_SECONDARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {s.fileName}
        </span>
      </TCell>
      <TCell width={80} align='right'>{s.totalOrders}</TCell>
      <TCell width={90} align='right'>
        <span style={{ color: s.totalMismatch > 0 ? '#DC2626' : C_TEXT_SECONDARY, fontWeight: s.totalMismatch > 0 ? 700 : 400 }}>
          {s.totalMismatch > 0 ? s.totalMismatch : '—'}
        </span>
      </TCell>
      <TCell width={150} align='right'>{fmt(s.totalCOD)}</TCell>
      <TCell width={150} align='right'>{fmt(s.totalFee)}</TCell>
      <TCell width={160} align='right'>
        <span style={{ fontWeight: 600 }}>{fmt(s.netReceived)}</span>
      </TCell>
      <TCell width={200} align='center'>
        <StatusBadge status={s.status} />
      </TCell>
      <TCell width={48} align='center'>
        {s.status === 'pending' && (
          <div
            onClick={e => { e.stopPropagation(); onDelete() }}
            onMouseEnter={() => setDeleteHover(true)}
            onMouseLeave={() => setDeleteHover(false)}
            style={{ color: deleteHover ? '#DC2626' : '#9CA3AF', cursor: 'pointer', transition: 'color 0.15s', fontSize: 15, lineHeight: 1 }}
          >
            <DeleteOutlined />
          </div>
        )}
      </TCell>
    </div>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onSubmit }: {
  onClose: () => void
  onSubmit: (file: File, date: string, note: string) => void
}) {
  const [file, setFile]           = useState<File | null>(null)
  const [note, setNote]           = useState('')
  const [error, setError]         = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const abortRef                  = useRef(false)
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null)

  const fileBaseName = file ? file.name.replace(/\.[^.]+$/, '') : ''

  const handleSubmit = () => {
    if (!file) { setError('Vui lòng chọn file đối soát'); return }
    setError('')
    setUploading(true)
    setProgress(0)
    abortRef.current = false

    let pct = 0
    intervalRef.current = setInterval(() => {
      if (abortRef.current) {
        clearInterval(intervalRef.current!)
        setUploading(false)
        setProgress(0)
        return
      }
      pct += Math.random() * 12 + 6
      if (pct >= 100) {
        pct = 100
        setProgress(100)
        clearInterval(intervalRef.current!)
        setTimeout(() => {
          setUploading(false)
          const today = new Date()
          const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
          onSubmit(file, date, note)
        }, 400)
        return
      }
      setProgress(Math.round(pct))
    }, 180)
  }

  const handleAbort = () => {
    abortRef.current = true
  }

  // Clicking backdrop or X during upload → cancel + close
  const handleClose = () => {
    if (uploading) abortRef.current = true
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: `1px solid ${C_BORDER}`, borderRadius: 6,
    padding: '7px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 480, background: '#fff', borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${C_BORDER}` }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY }}>
            {uploading ? 'Đang tải file lên...' : 'Upload file đối soát GHN'}
          </div>
          <span onClick={handleClose} style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, fontSize: 16 }}>
            <CloseOutlined />
          </span>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Uploading state ── */}
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* File info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F9FAFB', borderRadius: 8, border: `1px solid ${C_BORDER}` }}>
                <UploadOutlined style={{ fontSize: 20, color: C_ACTION, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file?.name}</div>
                  <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
                    {progress < 100 ? `Đang tải lên... ${progress}%` : 'Hoàn tất — đang xử lý...'}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Tiến trình</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: progress < 100 ? C_ACTION : '#16A34A' }}>{progress}%</span>
                </div>
                <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: progress < 100 ? C_ACTION : '#16A34A',
                    width: `${progress}%`,
                    transition: 'width 0.15s ease, background 0.3s',
                  }} />
                </div>
              </div>

              {/* Cancel hint */}
              {progress < 100 && (
                <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, textAlign: 'center' }}>
                  Bạn có thể dừng tải và thoát bất cứ lúc nào
                </div>
              )}
            </div>
          ) : (
            /* ── Normal state ── */
            <>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C_TEXT_PRIMARY, marginBottom: 6 }}>
                  File đối soát <span style={{ color: '#DC2626' }}>*</span>
                </div>
                <label style={{ display: 'block', cursor: 'pointer' }}>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={e => { setFile(e.target.files?.[0] ?? null); setError('') }} style={{ display: 'none' }} />
                  <div style={{
                    border: `2px dashed ${file ? C_ACTION : C_BORDER}`,
                    borderRadius: 8, padding: '20px 16px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    background: file ? '#FFF4ED' : '#FAFAFA',
                  }}>
                    <UploadOutlined style={{ fontSize: 28, color: file ? C_ACTION : C_TEXT_SECONDARY }} />
                    {file ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C_ACTION }}>{file.name}</div>
                        <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Nhấn để thay đổi file</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY }}>Nhấn để chọn file</div>
                        <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Hỗ trợ .xlsx, .xls, .csv</div>
                      </>
                    )}
                  </div>
                </label>
                {file && (
                  <div style={{ marginTop: 8, padding: '8px 12px', background: '#F9FAFB', borderRadius: 6, border: `1px solid ${C_BORDER}`, fontSize: 12, color: C_TEXT_SECONDARY, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div><span>Mã phiên GHN: </span><strong style={{ color: C_TEXT_PRIMARY }}>{fileBaseName}</strong></div>
                    <div style={{ fontStyle: 'italic' }}>Hệ thống sẽ tự động đọc thông tin phiên từ file sau khi tải lên</div>
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C_TEXT_PRIMARY, marginBottom: 6 }}>Ghi chú</div>
                <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (không bắt buộc)" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

              {error && <div style={{ fontSize: 13, color: '#DC2626' }}>{error}</div>}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 24px', borderTop: `1px solid ${C_BORDER}` }}>
          {uploading ? (
            // During upload: only show "Dừng tải" button
            <button
              onClick={handleAbort}
              disabled={progress >= 100}
              style={{
                padding: '7px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: progress >= 100 ? 'default' : 'pointer',
                background: progress >= 100 ? '#F3F4F6' : '#FEE2E2',
                color: progress >= 100 ? C_TEXT_SECONDARY : '#DC2626',
                border: `1px solid ${progress >= 100 ? C_BORDER : '#FECACA'}`,
                opacity: progress >= 100 ? 0.6 : 1,
              }}
            >
              Dừng tải
            </button>
          ) : (
            <>
              <button onClick={handleClose} style={{ padding: '7px 16px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 14, fontWeight: 500, color: C_TEXT_PRIMARY, cursor: 'pointer' }}>
                Huỷ
              </button>
              <button onClick={handleSubmit} style={{ padding: '7px 16px', background: C_ACTION, border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                Tải lên
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Phiên shop ──────────────────────────────────────────────────────────
function TabShop({
  sessions,
  confirmedShopIds,
}: {
  sessions: CarrierSession[]
  confirmedShopIds: Set<string>
}) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed'>('all')
  const [filterShop, setFilterShop]     = useState<string>('all')
  const [search, setSearch]             = useState('')
  const today = new Date()
  const [datePreset, setDatePreset] = useState('all')
  const [[dateFrom, dateTo], setDateRange] = useState<[string, string]>(['', ''])
  const [dateFilterOpen, setDateFilterOpen] = useState(false)
  const dateFilterRef = useRef<HTMLDivElement>(null)

  const selectDatePreset = (key: string) => {
    setDatePreset(key)
    if (key === 'all') { setDateRange(['', '']); return }
    const range = computePresetRange(key, today)
    if (range) setDateRange(range)
  }

  useEffect(() => {
    if (!dateFilterOpen) return
    const handler = (e: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(e.target as Node)) setDateFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dateFilterOpen])

  const shopSessions = deriveShopSessions(
    sessions,
    getReconciliationItems(),
    confirmedShopIds
  )

  const hasConfirmedNVC = sessions.some(s => s.status === 'confirmed')

  const uniqueShops = Array.from(
    new Map(shopSessions.map(s => [s.shopId, s.shopName])).entries()
  )

  const filtered = shopSessions.filter(s => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    const matchShop   = filterShop === 'all' || s.shopId === filterShop
    const periodStart = s.periodStart ?? s.paymentDate
    const periodEnd   = s.periodEnd ?? s.paymentDate
    const matchDate   = (!dateFrom || dateFrom <= periodEnd) && (!dateTo || dateTo >= periodStart)
    const q = search.trim().toLowerCase()
    const matchSearch = !q
      || s.shopName.toLowerCase().includes(q)
      || s.id.toLowerCase().includes(q)
      || s.nvcSessionCode.toLowerCase().includes(q)
    return matchStatus && matchShop && matchDate && matchSearch
  })

  const hasActiveFilter = filterStatus !== 'all' || filterShop !== 'all' || datePreset !== 'all' || !!search
  const clearFilters = () => {
    setFilterStatus('all'); setFilterShop('all'); setSearch('')
    setDatePreset('all'); setDateRange(['', ''])
  }

  const total     = shopSessions.length
  const confirmed = shopSessions.filter(s => s.status === 'confirmed').length
  const pending   = shopSessions.filter(s => s.status === 'pending').length

  const cardStyle: React.CSSProperties = {
    flex: 1, padding: '14px 16px', border: `1px solid ${C_BORDER}`,
    borderRadius: 8, background: '#fff',
  }

  if (!hasConfirmedNVC) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: C_TEXT_SECONDARY }}>
        <ShopOutlined style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>Chưa có phiên shop nào</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          Phiên shop được tạo tự động sau khi xác nhận phiên GHN
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ padding: '12px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>
          Danh sách phiên đối soát theo từng shop — tổng hợp từ phiên GHN đã xác nhận
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexShrink: 0 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Tổng phiên shop</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY }}>{total}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Đã chuyển khoản</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#16A34A' }}>{confirmed}</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Chưa chuyển khoản</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#C2410C' }}>{pending}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Trạng thái:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as 'all' | 'pending' | 'confirmed')}
            style={{
              border: `1px solid ${C_BORDER}`, borderRadius: 6,
              padding: '7px 12px', fontSize: 14, background: '#fff',
              color: C_TEXT_PRIMARY, outline: 'none', cursor: 'pointer', minWidth: 180,
            }}
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chưa chuyển khoản</option>
            <option value="confirmed">Đã chuyển khoản</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Shop:</span>
          <select
            value={filterShop}
            onChange={e => setFilterShop(e.target.value)}
            style={{
              border: `1px solid ${C_BORDER}`, borderRadius: 6,
              padding: '7px 12px', fontSize: 14, background: '#fff',
              color: C_TEXT_PRIMARY, outline: 'none', cursor: 'pointer', minWidth: 200,
            }}
          >
            <option value="all">Tất cả shop</option>
            {uniqueShops.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        <div ref={dateFilterRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setDateFilterOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              border: `1px solid ${datePreset !== 'all' ? C_ACTION : C_BORDER}`, borderRadius: 6,
              padding: '7px 12px', background: '#fff',
            }}
          >
            <CalendarOutlined style={{ fontSize: 14, color: datePreset !== 'all' ? C_ACTION : C_TEXT_SECONDARY }} />
            <span style={{ fontSize: 13, color: datePreset !== 'all' ? C_ACTION : C_TEXT_PRIMARY, fontWeight: datePreset !== 'all' ? 600 : 400, whiteSpace: 'nowrap' }}>
              {datePreset === 'all' ? 'Thời gian: Tất cả' : `${fmtDisplayDate(dateFrom)} — ${fmtDisplayDate(dateTo)}`}
            </span>
          </div>

          {dateFilterOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
              background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 16, width: 420,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <input
                  type="date" value={dateFrom}
                  onChange={e => { setDateRange([e.target.value, dateTo]); setDatePreset('custom') }}
                  style={{ flex: 1, border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none' }}
                />
                <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>đến</span>
                <input
                  type="date" value={dateTo}
                  onChange={e => { setDateRange([dateFrom, e.target.value]); setDatePreset('custom') }}
                  style={{ flex: 1, border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '8px 10px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                {[0, 1].map(col => (
                  <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                    {DATE_PRESETS.filter((_, i) => i % 2 === col).map(p => (
                      <div key={p.key} onClick={() => selectDatePreset(p.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <RadioDot checked={datePreset === p.key} />
                        <span style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>{p.label}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', flex: 1, minWidth: 220,
          background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
        }}>
          <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo mã phiên, tên shop hoặc phiên GHN"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent' }}
          />
        </div>
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            style={{
              padding: '7px 12px', background: '#fff', border: `1px solid ${C_BORDER}`,
              borderRadius: 6, fontSize: 13, color: C_TEXT_SECONDARY, cursor: 'pointer',
            }}
          >
            Xoá lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: '1 0 0', overflow: 'hidden' }}>
        <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
          <div style={{ minWidth: 1530 }}>
            <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
              <TCell width={200} isHeader>Mã phiên shop</TCell>
              <TCell flex='1 0 0' minWidth={180} isHeader>Tên shop</TCell>
              <TCell width={240} isHeader>Phiên GHN</TCell>
              <TCell width={130} isHeader>Thời gian</TCell>
              <TCell width={70}  align='right' isHeader>Số đơn</TCell>
              <TCell width={160} align='right' isHeader>Tổng COD (shop)</TCell>
              <TCell width={160} align='right' isHeader>Tổng phí DV (shop)</TCell>
              <TCell width={160} align='right' isHeader>Tổng phí DV (GHN)</TCell>
              <TCell width={130} align='right' isHeader>Lợi nhuận ĐL</TCell>
              <TCell width={160} align='center' isHeader>Trạng thái</TCell>
            </div>
            <div style={{ height: 1, background: C_BORDER }} />

            {filtered.length === 0 && (
              <div style={{ padding: '48px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                Không có phiên nào
              </div>
            )}

            {filtered.map(s => (
              <ShopSessionRow
                key={s.id}
                session={s}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ShopSessionRow({ session: s }: { session: ShopSession }) {
  const navigate = useNavigate()
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={() => navigate(`/agency-admin/reconciliation/shop/${encodeURIComponent(s.id)}`, { state: { session: s } })}
      style={{
        display: 'flex', alignItems: 'center', minWidth: 1530,
        background: hover ? '#FAFAFA' : '#fff',
        boxShadow: `inset 0 -1px 0 ${C_BORDER}`,
        transition: 'background 0.1s',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <TCell width={200}>
        <span style={{ color: C_LINK, fontWeight: 600, fontSize: 13 }}>{s.id}</span>
      </TCell>
      <TCell flex='1 0 0' minWidth={180}>
        <span style={{ fontWeight: 500 }}>{s.shopName}</span>
      </TCell>
      <TCell width={240}>
        <span style={{ color: C_LINK, fontSize: 13 }}>{s.nvcSessionCode}</span>
      </TCell>
      <TCell width={130}>
        {fmtPeriod(s.periodStart, s.periodEnd)
          ? <span style={{ fontSize: 13, color: C_TEXT_PRIMARY, fontWeight: 500 }}>{fmtPeriod(s.periodStart, s.periodEnd)}</span>
          : <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>—</span>
        }
      </TCell>
      <TCell width={70} align='right'>{s.totalOrders}</TCell>
      <TCell width={160} align='right'>
        <span style={{ fontWeight: 600 }}>{fmt(s.totalCOD)}</span>
      </TCell>
      <TCell width={160} align='right'>{fmt(s.feeShop)}</TCell>
      <TCell width={160} align='right'>{fmt(s.feeGHN)}</TCell>
      <TCell width={130} align='right'>
        <span style={{
          fontWeight: 600,
          color: s.profit > 0 ? '#16A34A' : s.profit < 0 ? '#DC2626' : C_TEXT_SECONDARY,
        }}>
          {s.profit > 0 ? '+' : ''}{fmt(s.profit)}
        </span>
      </TCell>
      <TCell width={160} align='center'>
        <StatusBadge status={s.status} confirmedLabel='Đã chuyển khoản' pendingLabel='Chưa chuyển khoản' />
      </TCell>
    </div>
  )
}

// ─── Tab: Quá hạn đối soát ─────────────────────────────────────────────────────
// So sánh CÓ Ý NGHĨA giữa tracking hệ thống và dữ liệu đối soát GHN: không so trạng thái
// tức thời (luôn lệch vì GHN báo theo kỳ), mà so CÓ NGƯỠNG THỜI GIAN — chỉ coi là bất
// thường khi đơn đã giao xong quá lâu mà chưa từng thấy trong bất kỳ file đối soát nào.
type OverdueOrder = {
  orderId: string
  trackingCode: string
  shopId: string
  shopName: string
  deliveredAt: string
  daysOverdue: number
}

function computeOverdueOrders(): OverdueOrder[] {
  const agencyShopIds = new Set(
    (allShopsData as Array<{ id: string; agencyId: string; name: string }>)
      .filter(s => s.agencyId === 'AGN001')
      .map(s => s.id)
  )
  const shopNameOf = (id: string) =>
    (allShopsData as Array<{ id: string; name: string }>).find(s => s.id === id)?.name ?? id

  const reconciledCodes = new Set(getReconciliationItems().map(i => i.orderCode))

  const now = new Date()

  return (ordersData as Array<{
    id: string; trackingCode: string; shopId: string; status: string
    log?: Array<{ status: string; updated_date: string }>
  }>)
    .filter(o => agencyShopIds.has(o.shopId) && o.status === 'delivered')
    .filter(o => !reconciledCodes.has(o.trackingCode))
    .map(o => {
      const deliveredLog = o.log?.find(l => l.status === 'delivered')
      const deliveredAt = deliveredLog?.updated_date ?? ''
      const daysOverdue = deliveredAt
        ? Math.floor((now.getTime() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0
      return {
        orderId: o.id,
        trackingCode: o.trackingCode,
        shopId: o.shopId,
        shopName: shopNameOf(o.shopId),
        deliveredAt,
        daysOverdue,
      }
    })
    .filter(o => o.daysOverdue > OVERDUE_THRESHOLD_DAYS)
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
}

function TabOverdue() {
  const navigate = useNavigate()
  const overdueOrders = computeOverdueOrders()

  const cardStyle: React.CSSProperties = {
    flex: 1, padding: '14px 16px', border: `1px solid ${C_BORDER}`,
    borderRadius: 8, background: '#fff',
  }

  if (overdueOrders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: C_TEXT_SECONDARY }}>
        <WarningOutlined style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }} />
        <div style={{ fontSize: 14, fontWeight: 500 }}>Không có đơn nào quá hạn đối soát</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          Tất cả đơn đã giao thành công quá {OVERDUE_THRESHOLD_DAYS} ngày đều đã có trong ít nhất 1 file đối soát GHN
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', padding: '0 16px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, marginBottom: 12 }}>
          Đơn đã "Giao hàng thành công" trên hệ thống quá {OVERDUE_THRESHOLD_DAYS} ngày nhưng{' '}
          <strong style={{ color: C_TEXT_PRIMARY }}>chưa từng xuất hiện</strong> trong bất kỳ file đối soát GHN nào đã upload —
          không phải do độ trễ báo cáo bình thường (GHN báo theo kỳ ~15 ngày), mà là dấu hiệu GHN có thể đã bỏ sót đơn.
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Số đơn quá hạn</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#DC2626' }}>{overdueOrders.length}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: '1 0 0', overflow: 'hidden' }}>
        <div style={{ height: '100%', overflowY: 'auto' }}>
          <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
            <TCell width={160} isHeader>Mã đơn GHN</TCell>
            <TCell flex='1 0 0' minWidth={180} isHeader>Shop</TCell>
            <TCell width={140} isHeader>Ngày giao thành công</TCell>
            <TCell width={140} align='right' isHeader>Số ngày quá hạn</TCell>
            <TCell width={140} align='center' isHeader>Thao tác</TCell>
          </div>
          <div style={{ height: 1, background: C_BORDER }} />
          {overdueOrders.map(o => (
            <div key={o.orderId} style={{ display: 'flex', alignItems: 'stretch' }}>
              <TCell width={160}>
                <span style={{ color: C_LINK, fontWeight: 600 }}>{o.trackingCode}</span>
              </TCell>
              <TCell flex='1 0 0' minWidth={180}>{o.shopName}</TCell>
              <TCell width={140}>{o.deliveredAt ? fmtDate(o.deliveredAt) : '—'}</TCell>
              <TCell width={140} align='right'>
                <span style={{ color: '#DC2626', fontWeight: 700 }}>{o.daysOverdue} ngày</span>
              </TCell>
              <TCell width={140} align='center'>
                <span
                  onClick={() => navigate('/agency-admin/orders')}
                  style={{ color: C_LINK, cursor: 'pointer', fontSize: 13 }}
                >
                  Xem đơn hàng
                </span>
              </TCell>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Placeholder (đang phát triển) ───────────────────────────────────────
function TabComingSoon() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: C_TEXT_SECONDARY }}>
      <ClockCircleOutlined style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }} />
      <div style={{ fontSize: 14, fontWeight: 500 }}>Tính năng đang phát triển</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>Tính năng này sẽ sớm được ra mắt</div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AgencyReconciliation() {
  const location = useLocation()
  const navState = location.state as { deletedId?: string; confirmedId?: string } | null

  const [sessions, setSessions] = useState<CarrierSession[]>(() => {
    let s = (carrierSessionsData as CarrierSession[]).filter(s => s.agencyId === 'AGN001')
    if (navState?.deletedId)   s = s.filter(x => x.id !== navState.deletedId)
    if (navState?.confirmedId) s = s.map(x => x.id === navState.confirmedId ? { ...x, status: 'confirmed' as const } : x)
    // "Số đơn"/"Số lệch" ở danh sách phải khớp đúng với chi tiết phiên — tính live từ ledger
    // items (reconciliationLedger.ts), không dùng field tĩnh totalOrders/totalMismatch có sẵn
    // trong mock (2 nguồn này từng lệch nhau, xem AGA-RECON-4).
    const ledgerItems = getReconciliationItems()
    return s.map(session => {
      const items = ledgerItems.filter(i => i.sessionId === session.id)
      return { ...session, totalOrders: items.length, totalMismatch: items.filter(i => i.status !== 'MATCH').length }
    })
  })

  const [confirmedShopIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<TabKey>('carrier')

  const handleConfirmNVC = (ids: string[]) => {
    setSessions(prev => prev.map(s =>
      ids.includes(s.id) ? { ...s, status: 'confirmed' as const } : s
    ))
  }

  const handleAddSession = (session: CarrierSession) => {
    setSessions(prev => [session, ...prev])
  }

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', width: '100%', background: '#fff', overflow: 'hidden' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
              Đối soát & Chuyển khoản
            </h1>
            <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
              Quản lý phiên đối soát, chuyển khoản và dự trù dòng tiền
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C_BORDER}`, padding: '0 16px', flexShrink: 0 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <div
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', fontSize: 14, fontWeight: 600,
                  color: isActive ? C_ACTION : C_TEXT_SECONDARY,
                  cursor: 'pointer',
                  borderBottom: isActive ? `2px solid ${C_ACTION}` : '2px solid transparent',
                  marginBottom: -1, userSelect: 'none', transition: 'color 0.15s',
                }}
              >
                <span style={{ fontSize: 15 }}>{tab.icon}</span>
                {tab.label}
              </div>
            )
          })}
        </div>

        {/* Tab content */}
        <div style={{ flex: '1 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'carrier'  && (
            <TabCarrier
              sessions={sessions}
              onConfirmMultiple={handleConfirmNVC}
              onAddSession={handleAddSession}
              onDeleteSession={handleDeleteSession}
            />
          )}
          {activeTab === 'shop' && (
            <TabShop
              sessions={sessions}
              confirmedShopIds={confirmedShopIds}
            />
          )}
          {activeTab === 'transfer' && <TabComingSoon />}
          {activeTab === 'forecast' && <TabComingSoon />}
          {activeTab === 'split'    && <TabComingSoon />}
          {activeTab === 'overdue' && <TabOverdue />}
        </div>
      </div>
    </ConfigProvider>
  )
}
