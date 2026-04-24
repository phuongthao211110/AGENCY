import React, { useState } from 'react'
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
} from '@ant-design/icons'
import { agencyAdminTheme } from '../../../theme/platforms'
import carrierSessionsData from '../../../mock-data/carrier-reconciliation.json'
import allItemsData from '../../../mock-data/carrier-reconciliation-items.json'

// ─── Types ────────────────────────────────────────────────────────────────────
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

type ShopSession = {
  id: string
  nvcSessionId: string
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

// ─── Design tokens ────────────────────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_BORDER         = '#E5E7EB'
const C_ACTION         = '#FF5200'
const C_BG_HEADER      = '#F3F4F6'

// ─── Tab types ────────────────────────────────────────────────────────────────
type TabKey = 'carrier' | 'shop' | 'transfer' | 'forecast' | 'split'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'carrier',  label: 'Phiên nhà vận chuyển', icon: <FileTextOutlined /> },
  { key: 'shop',     label: 'Phiên shop',           icon: <ShopOutlined /> },
  { key: 'transfer', label: 'Chuyển khoản',         icon: <BankOutlined /> },
  { key: 'forecast', label: 'Dự trù',               icon: <BarChartOutlined /> },
  { key: 'split',    label: 'Tách phiên NVC',       icon: <ScissorOutlined /> },
]

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
  const bg    = isConfirmed ? '#F0FDF4' : '#FFF7ED'
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
    const key = `${item.sessionId}::${item.shopId}`
    if (!groups.has(key)) {
      const session = sessions.find(s => s.id === item.sessionId)!
      groups.set(key, { items: [], session })
    }
    groups.get(key)!.items.push(item)
  })

  const result: ShopSession[] = []
  groups.forEach(({ items: groupItems, session }, key) => {
    const sep     = key.indexOf('::')
    const nvcId   = key.substring(0, sep)
    const shopId  = key.substring(sep + 2)
    const id      = `SHOP-${nvcId}-${shopId}`
    const totalCOD    = groupItems.reduce((sum, i) => sum + i.ghnCOD, 0)
    const feeShop     = groupItems.reduce((sum, i) => sum + i.systemFee, 0)
    const feeGHN      = groupItems.reduce((sum, i) => sum + i.ghnFee, 0)
    const totalMismatch = groupItems.filter(i => i.status !== 'MATCH').length

    result.push({
      id,
      nvcSessionId: nvcId,
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
    })
  })

  return result.sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
}

// ─── Tab: Phiên nhà vận chuyển ────────────────────────────────────────────────
function TabCarrier({
  sessions,
  onConfirmMultiple,
  onAddSession,
}: {
  sessions: CarrierSession[]
  onConfirmMultiple: (ids: string[]) => void
  onAddSession: (session: CarrierSession) => void
}) {
  const navigate = useNavigate()
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const total     = sessions.length
  const confirmed = sessions.filter(s => s.status === 'confirmed').length
  const pending   = sessions.filter(s => s.status === 'pending').length

  const filteredSessions = sessions.filter(s =>
    filterStatus === 'all' ? true : s.status === filterStatus
  )

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
          Upload file GHN
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexShrink: 0 }}>
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
          <div style={{ minWidth: 900 }}>
            <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
              <div style={{ width: 40, flexShrink: 0, padding: '6px 8px', background: C_BG_HEADER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Checkbox checked={allPendingSelected} onChange={toggleSelectAll} />
              </div>
              <TCell width={120} isHeader>Mã phiên</TCell>
              <TCell width={120} isHeader>Ngày TT GHN</TCell>
              <TCell flex='1 0 0' minWidth={220} isHeader>Tên file</TCell>
              <TCell width={80}  align='right' isHeader>Số đơn</TCell>
              <TCell width={90}  align='right' isHeader>Số lệch</TCell>
              <TCell width={150} align='right' isHeader>Tổng cước</TCell>
              <TCell width={160} align='right' isHeader>Tổng COD</TCell>
              <TCell width={150} align='center' isHeader>Trạng thái</TCell>
              <TCell width={100} align='center' isHeader>Action</TCell>
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
              />
            ))}
          </div>
        </div>
      </div>

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSubmit={(file, date, note) => {
            const newSession: CarrierSession = {
              id: `NVC${String(sessions.length + 100).padStart(3, '0')}`,
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
            }
            onAddSession(newSession)
            setShowUploadModal(false)
          }}
        />
      )}
    </div>
  )
}

function SessionRow({ session: s, onNavigate, selected, onToggle }: {
  session: CarrierSession
  onNavigate: () => void
  selected: boolean
  onToggle: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onNavigate}
      style={{
        display: 'flex', alignItems: 'center', cursor: 'pointer',
        background: selected ? '#FFF4ED' : hover ? '#FAFAFA' : '#fff',
        borderBottom: `1px solid ${C_BORDER}`,
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
      <TCell width={120}>
        <span style={{ color: C_LINK, fontWeight: 600 }}>{s.id}</span>
      </TCell>
      <TCell width={120}>{fmtDate(s.paymentDate)}</TCell>
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
      <TCell width={150} align='right'>{fmt(s.totalFee)}</TCell>
      <TCell width={160} align='right'>
        <span style={{ fontWeight: 600 }}>{fmt(s.totalCOD)}</span>
      </TCell>
      <TCell width={150} align='center'>
        <StatusBadge status={s.status} />
      </TCell>
      <TCell width={100} align='center'>
        <span
          onClick={e => { e.stopPropagation(); onNavigate() }}
          style={{ color: C_LINK, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
        >
          Xem chi tiết
        </span>
      </TCell>
    </div>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onSubmit }: {
  onClose: () => void
  onSubmit: (file: File, date: string, note: string) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!file) { setError('Vui lòng chọn file đối soát'); return }
    if (!date) { setError('Vui lòng chọn ngày thanh toán GHN'); return }
    setError('')
    onSubmit(file, date, note)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', border: `1px solid ${C_BORDER}`, borderRadius: 6,
    padding: '7px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 480, background: '#fff', borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: `1px solid ${C_BORDER}` }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY }}>Upload file đối soát GHN</div>
          <span onClick={onClose} style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, fontSize: 16 }}>
            <CloseOutlined />
          </span>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C_TEXT_PRIMARY, marginBottom: 6 }}>
              File đối soát <span style={{ color: '#DC2626' }}>*</span>
            </div>
            <label style={{ display: 'block', cursor: 'pointer' }}>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
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
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C_TEXT_PRIMARY, marginBottom: 6 }}>
              Ngày thanh toán GHN <span style={{ color: '#DC2626' }}>*</span>
            </div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C_TEXT_PRIMARY, marginBottom: 6 }}>Ghi chú</div>
            <textarea
              rows={2} value={note} onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú (không bắt buộc)"
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {error && <div style={{ fontSize: 13, color: '#DC2626' }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 24px', borderTop: `1px solid ${C_BORDER}` }}>
          <button onClick={onClose} style={{ padding: '7px 16px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 14, fontWeight: 500, color: C_TEXT_PRIMARY, cursor: 'pointer' }}>
            Huỷ
          </button>
          <button onClick={handleSubmit} style={{ padding: '7px 16px', background: C_ACTION, border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
            Tải lên
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Phiên shop ──────────────────────────────────────────────────────────
function TabShop({
  sessions,
  confirmedShopIds,
  onConfirmShopSessions,
}: {
  sessions: CarrierSession[]
  confirmedShopIds: Set<string>
  onConfirmShopSessions: (ids: string[]) => void
}) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed'>('all')
  const [filterShop, setFilterShop] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const shopSessions = deriveShopSessions(
    sessions,
    allItemsData as ItemRecord[],
    confirmedShopIds
  )

  const hasConfirmedNVC = sessions.some(s => s.status === 'confirmed')

  const uniqueShops = Array.from(
    new Map(shopSessions.map(s => [s.shopId, s.shopName])).entries()
  )

  const filtered = shopSessions.filter(s => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    const matchShop   = filterShop === 'all' || s.shopId === filterShop
    return matchStatus && matchShop
  })

  const pendingIds = filtered.filter(s => s.status === 'pending').map(s => s.id)
  const allPendingSelected = pendingIds.length > 0 && pendingIds.every(id => selectedIds.has(id))

  const toggleSelectAll = () => {
    if (allPendingSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(pendingIds))
  }

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleConfirm = () => {
    onConfirmShopSessions(Array.from(selectedIds))
    setSelectedIds(new Set())
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
          Phiên shop được tạo tự động sau khi xác nhận phiên nhà vận chuyển
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
      {/* Header */}
      <div style={{ padding: '12px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>
          Danh sách phiên đối soát theo từng shop — tổng hợp từ phiên NVC đã xác nhận
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexShrink: 0 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 4 }}>Tổng phiên shop</div>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Trạng thái:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as 'all' | 'pending' | 'confirmed')}
            style={{
              border: `1px solid ${C_BORDER}`, borderRadius: 6,
              padding: '7px 12px', fontSize: 14, background: '#fff',
              color: C_TEXT_PRIMARY, outline: 'none', cursor: 'pointer', minWidth: 160,
            }}
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
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
          <div style={{ minWidth: 1100 }}>
            <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
              <div style={{ width: 40, flexShrink: 0, padding: '6px 8px', background: C_BG_HEADER, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Checkbox checked={allPendingSelected} onChange={toggleSelectAll} />
              </div>
              <TCell width={200} isHeader>Mã phiên shop</TCell>
              <TCell flex='1 0 0' minWidth={180} isHeader>Tên shop</TCell>
              <TCell width={120} isHeader>Phiên NVC</TCell>
              <TCell width={70}  align='right' isHeader>Số đơn</TCell>
              <TCell width={140} align='right' isHeader>Tổng COD</TCell>
              <TCell width={120} align='right' isHeader>Phí shop</TCell>
              <TCell width={110} align='right' isHeader>Phí GHN</TCell>
              <TCell width={130} align='right' isHeader>Lợi nhuận ĐL</TCell>
              <TCell width={80}  align='right' isHeader>Số lệch</TCell>
              <TCell width={140} align='center' isHeader>Trạng thái</TCell>
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
                selected={selectedIds.has(s.id)}
                onToggle={() => toggleOne(s.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ShopSessionRow({ session: s, selected, onToggle }: {
  session: ShopSession
  selected: boolean
  onToggle: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center',
        background: selected ? '#FFF4ED' : hover ? '#FAFAFA' : '#fff',
        borderBottom: `1px solid ${C_BORDER}`,
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
      <TCell width={200}>
        <span style={{ color: C_LINK, fontWeight: 600, fontSize: 13 }}>{s.id}</span>
      </TCell>
      <TCell flex='1 0 0' minWidth={180}>
        <span style={{ fontWeight: 500 }}>{s.shopName}</span>
      </TCell>
      <TCell width={120}>
        <span style={{ color: C_LINK, fontSize: 13 }}>{s.nvcSessionId}</span>
      </TCell>
      <TCell width={70} align='right'>{s.totalOrders}</TCell>
      <TCell width={140} align='right'>
        <span style={{ fontWeight: 600 }}>{fmt(s.totalCOD)}</span>
      </TCell>
      <TCell width={120} align='right'>{fmt(s.feeShop)}</TCell>
      <TCell width={110} align='right'>{fmt(s.feeGHN)}</TCell>
      <TCell width={130} align='right'>
        <span style={{
          fontWeight: 600,
          color: s.profit > 0 ? C_ACTION : s.profit < 0 ? '#DC2626' : C_TEXT_SECONDARY,
        }}>
          {s.profit > 0 ? '+' : ''}{fmt(s.profit)}
        </span>
      </TCell>
      <TCell width={80} align='right'>
        <span style={{ color: s.totalMismatch > 0 ? '#DC2626' : C_TEXT_SECONDARY, fontWeight: s.totalMismatch > 0 ? 700 : 400 }}>
          {s.totalMismatch > 0 ? s.totalMismatch : '—'}
        </span>
      </TCell>
      <TCell width={140} align='center'>
        <StatusBadge status={s.status} />
      </TCell>
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
    return s
  })

  const [confirmedShopIds, setConfirmedShopIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<TabKey>('carrier')

  const handleConfirmNVC = (ids: string[]) => {
    setSessions(prev => prev.map(s =>
      ids.includes(s.id) ? { ...s, status: 'confirmed' as const } : s
    ))
  }

  const handleAddSession = (session: CarrierSession) => {
    setSessions(prev => [session, ...prev])
  }

  const handleConfirmShop = (ids: string[]) => {
    setConfirmedShopIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
      return next
    })
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
            />
          )}
          {activeTab === 'shop' && (
            <TabShop
              sessions={sessions}
              confirmedShopIds={confirmedShopIds}
              onConfirmShopSessions={handleConfirmShop}
            />
          )}
          {activeTab === 'transfer' && <TabComingSoon />}
          {activeTab === 'forecast' && <TabComingSoon />}
          {activeTab === 'split'    && <TabComingSoon />}
        </div>
      </div>
    </ConfigProvider>
  )
}
