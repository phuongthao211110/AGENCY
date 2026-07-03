import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  CopyOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  ShopOutlined,
  InboxOutlined,
  DollarOutlined,
  BarChartOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { agenciesList, setAllowedCarriers, shopConnections, approveShopConnection, rejectShopConnection, carrierRequests, approveCarrierRequest, rejectCarrierRequest, clientHubs247, grantAdditionalHub, SERVICE_TYPES_247 } from '../agencyStore'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C_TEXT_PRIMARY = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL = '#4B5563'
const C_BORDER = '#E5E7EB'
const C_BG = '#F9FAFB'
const CARD_SHADOW = '0 1px 2px rgba(0,0,0,0.05)'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtVND = (n: number) => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toLocaleString('vi-VN')
}

const fmtNum = (n: number) => {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon,
  label,
  value,
  iconColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  iconColor: string
}) {
  return (
    <div
      style={{
        flex: 1,
        background: '#fff',
        border: `1px solid ${C_BORDER}`,
        borderRadius: 12,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20, color: iconColor, lineHeight: 1 }}>{icon}</span>
        <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: C_TEXT_PRIMARY }}>{value}</div>
    </div>
  )
}

// ─── Info Row (label + value, 2-col grid) ─────────────────────────────────────
function InfoRow({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '16px 24px' }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: C_TEXT_LABEL }}>{it.label}</span>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, fontWeight: 500 }}>{it.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Copy row (text + copy icon) ──────────────────────────────────────────────
function CopyRow({
  label,
  value,
  onCopy,
}: {
  label: string
  value: string
  onCopy: (text: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: C_TEXT_LABEL }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, fontWeight: 500 }}>{value}</span>
        <CopyOutlined
          style={{ fontSize: 14, color: C_TEXT_SECONDARY, cursor: 'pointer' }}
          onClick={() => onCopy(value)}
        />
      </div>
    </div>
  )
}

// ─── Password row ─────────────────────────────────────────────────────────────
function PasswordRow({ onCopy }: { onCopy: (text: string) => void }) {
  const [visible, setVisible] = useState(false)
  const password = 'Abc@12345'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: C_TEXT_LABEL }}>Mật khẩu</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {visible ? (
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, fontWeight: 500 }}>{password}</span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{ width: 6, height: 6, borderRadius: '50%', background: C_TEXT_PRIMARY }}
              />
            ))}
          </div>
        )}
        <span
          style={{ fontSize: 14, color: C_TEXT_SECONDARY, cursor: 'pointer' }}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
        </span>
        <CopyOutlined
          style={{ fontSize: 14, color: C_TEXT_SECONDARY, cursor: 'pointer' }}
          onClick={() => onCopy(password)}
        />
      </div>
    </div>
  )
}

// ─── Info Card shell ──────────────────────────────────────────────────────────
function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${C_BORDER}`,
        borderRadius: 12,
        boxShadow: CARD_SHADOW,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${C_BORDER}`,
          fontSize: 14,
          fontWeight: 600,
          color: C_TEXT_PRIMARY,
        }}
      >
        {title}
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ visible }: { visible: boolean }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 60,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? 0 : -12}px)`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s, transform 0.2s',
        background: '#4B5563',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: '#fff',
        fontSize: 14,
        zIndex: 9999,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <CheckCircleFilled style={{ color: '#34D399', fontSize: 16 }} />
      Sao chép thành công
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
// ── Duyệt 247Express — 2 bước: (1) chọn dịch vụ, (2) chọn ClientHubID — cả 2 đều multi-select ──
function CarrierApprovalForm({ agencyName, excludeHubIds, excludeServiceIds, onConfirm, onCancel }: {
  agencyName: string
  excludeHubIds?: string[]
  excludeServiceIds?: string[]
  onConfirm: (hubIds: string[], serviceIds: string[]) => void
  onCancel: () => void
}) {
  const [step, setStep] = useState<'services' | 'hubs'>('services')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedHubs, setSelectedHubs] = useState<string[]>([])

  const availableServices = SERVICE_TYPES_247.filter(s => !(excludeServiceIds ?? []).includes(s.id))
  const availableHubs = clientHubs247.filter(h => !(excludeHubIds ?? []).includes(h.id))

  const toggleService = (id: string) =>
    setSelectedServices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleHub = (id: string) =>
    setSelectedHubs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const CheckRow = ({ label, sub, checked, onToggle, mono }: {
    label: string; sub?: string; checked: boolean; onToggle: () => void; mono?: boolean
  }) => (
    <div
      onClick={onToggle}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', cursor: 'pointer', background: checked ? '#EDE9FE' : '#fff', borderBottom: `1px solid #F3F4F6` }}
    >
      <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: checked ? 'none' : `1.5px solid #C4B5FD`, background: checked ? '#8B5CF6' : '#fff' }}>
        {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 3.5L3.8 6.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: checked ? 600 : 400, color: mono ? '#7C3AED' : C_TEXT_PRIMARY, fontFamily: mono ? 'monospace' : 'inherit' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C_TEXT_SECONDARY, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )

  if (step === 'services') {
    return (
      <div style={{ padding: '10px 12px', background: '#F5F3FF', borderTop: `1px solid #C4B5FD` }}>
        <div style={{ fontSize: 12, color: '#5B21B6', fontWeight: 600, marginBottom: 8 }}>
          Bước 1/2 — Chọn dịch vụ 247Express cho <span style={{ color: '#3B82F6' }}>{agencyName}</span>
        </div>
        <div style={{ maxHeight: 200, overflowY: 'auto', border: `1px solid #C4B5FD`, borderRadius: 8, background: '#fff', marginBottom: 8 }}>
          {availableServices.length === 0 ? (
            <div style={{ padding: '14px', textAlign: 'center', fontSize: 12, color: C_TEXT_SECONDARY }}>Đại lý đã được duyệt toàn bộ dịch vụ hiện có.</div>
          ) : availableServices.map(svc => (
            <CheckRow key={svc.id} label={svc.label} checked={selectedServices.includes(svc.id)} onToggle={() => toggleService(svc.id)} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} style={{ padding: '4px 12px', background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer' }}>Huỷ</button>
          <button
            onClick={() => selectedServices.length > 0 && setStep('hubs')}
            disabled={selectedServices.length === 0}
            style={{ padding: '4px 14px', background: selectedServices.length > 0 ? '#8B5CF6' : '#D1D5DB', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#fff', cursor: selectedServices.length > 0 ? 'pointer' : 'not-allowed' }}
          >
            Tiếp tục ({selectedServices.length})
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '10px 12px', background: '#F5F3FF', borderTop: `1px solid #C4B5FD` }}>
      <div style={{ fontSize: 12, color: '#5B21B6', fontWeight: 600, marginBottom: 8 }}>
        Bước 2/2 — Chọn Mã điểm lấy hàng (ClientHubID) cho <span style={{ color: '#3B82F6' }}>{agencyName}</span>
      </div>
      <div style={{ maxHeight: 200, overflowY: 'auto', border: `1px solid #C4B5FD`, borderRadius: 8, background: '#fff', marginBottom: 8 }}>
        {availableHubs.length === 0 ? (
          <div style={{ padding: '14px', textAlign: 'center', fontSize: 12, color: C_TEXT_SECONDARY }}>Đại lý đã được cấp toàn bộ Hub hiện có.</div>
        ) : availableHubs.map(hub => (
          <CheckRow key={hub.id} label={hub.id} sub={`${hub.name} — 📍 ${hub.location}`} checked={selectedHubs.includes(hub.id)} onToggle={() => toggleHub(hub.id)} mono />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={() => setStep('services')} style={{ padding: '4px 12px', background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer' }}>Quay lại</button>
        <button onClick={onCancel} style={{ padding: '4px 12px', background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer' }}>Huỷ</button>
        <button
          onClick={() => selectedHubs.length > 0 && onConfirm(selectedHubs, selectedServices)}
          disabled={selectedHubs.length === 0}
          style={{ padding: '4px 14px', background: selectedHubs.length > 0 ? '#8B5CF6' : '#D1D5DB', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#fff', cursor: selectedHubs.length > 0 ? 'pointer' : 'not-allowed' }}
        >
          Duyệt ({selectedHubs.length} hub)
        </button>
      </div>
    </div>
  )
}

const ALL_CARRIERS: { key: string; label: string; color: string; description: string }[] = [
  { key: 'GHN',        label: 'GHN — Giao Hàng Nhanh', color: '#EE4D2D', description: 'Nhà vận chuyển mặc định, không thể tắt' },
  { key: '247Express', label: '247Express',              color: '#1677FF', description: 'Cho phép đại lý kết nối và đối soát với 247Express' },
]

export default function AgencyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'info' | 'shops' | 'orders'>('info')
  const [toastVisible, setToastVisible] = useState(false)
  const [, forceRender] = useState(0)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingCarrierId, setRejectingCarrierId] = useState<string | null>(null)
  const [rejectCarrierReason, setRejectCarrierReason] = useState('')
  const [approvingCarrierId, setApprovingCarrierId] = useState<string | null>(null)
  const [addingHubFor, setAddingHubFor] = useState<string | null>(null)
  const [newHubId, setNewHubId] = useState('')

  const agency = agenciesList.find((a) => a.id === id)

  const toggleCarrier = (carrierKey: string) => {
    if (!agency) return
    if (carrierKey === 'GHN') return
    const current = agency.allowedCarriers ?? ['GHN']
    const next = current.includes(carrierKey)
      ? current.filter(c => c !== carrierKey)
      : [...current, carrierKey]
    setAllowedCarriers(agency.id, next)
    forceRender(n => n + 1)
  }

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2000)
  }

  if (!agency) {
    return (
      <div style={{ padding: 32, color: C_TEXT_PRIMARY }}>
        Không tìm thấy đại lý.{' '}
        <span
          style={{ color: '#3B82F6', cursor: 'pointer' }}
          onClick={() => navigate('/super-admin/agencies')}
        >
          Quay lại
        </span>
      </div>
    )
  }

  const cod = agency.totalOrders * 35_000
  const revenue = cod * 0.028

  // Address split: everything before first comma = street, rest = ward/city
  const addrParts = agency.address.split(',')
  const street = addrParts[0]?.trim() ?? agency.address
  const wardCity = addrParts.slice(1).join(',').trim()

  const tabs: { key: 'info' | 'shops' | 'orders'; label: string }[] = [
    { key: 'info', label: 'Thông tin đại lý' },
    { key: 'shops', label: 'Danh sách shop' },
    { key: 'orders', label: 'Đơn hàng' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: C_BG }}>
      <Toast visible={toastVisible} />

      {/* Scrollable content */}
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '24px 80px 80px' }}>
        {/* Heading */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <ArrowLeftOutlined
            style={{ fontSize: 18, color: C_TEXT_PRIMARY, cursor: 'pointer' }}
            onClick={() => navigate('/super-admin/agencies')}
          />
          <span style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY }}>Xem chi tiết</span>
        </div>

        {/* KPI section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, marginBottom: 12 }}>
            Thống kê tổng quan
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <KpiCard
              icon={<ShopOutlined />}
              label="Số shop"
              value={agency.totalShops.toString()}
              iconColor="#3B82F6"
            />
            <KpiCard
              icon={<InboxOutlined />}
              label="Đơn hàng"
              value={fmtNum(agency.totalOrders)}
              iconColor="#10B981"
            />
            <KpiCard
              icon={<DollarOutlined />}
              label="Tổng COD (₫)"
              value={fmtVND(cod)}
              iconColor="#F59E0B"
            />
            <KpiCard
              icon={<BarChartOutlined />}
              label="Doanh thu (₫)"
              value={fmtVND(revenue)}
              iconColor="#8B5CF6"
            />
          </div>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${C_BORDER}`,
            padding: '0 16px',
            marginBottom: 16,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <div
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: isActive ? C_TEXT_PRIMARY : C_TEXT_SECONDARY,
                  cursor: 'pointer',
                  background: isActive ? '#fff' : 'transparent',
                  border: isActive ? `1px solid ${C_BORDER}` : '1px solid transparent',
                  borderBottom: isActive ? '1px solid #fff' : '1px solid transparent',
                  borderRadius: '8px 8px 0 0',
                  marginBottom: -1,
                  userSelect: 'none',
                }}
              >
                {tab.label}
              </div>
            )
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Thông tin cơ bản */}
            <InfoCard title="Thông tin cơ bản">
              <InfoRow
                items={[
                  { label: 'Tên đại lý', value: agency.name },
                  { label: 'Mã đại lý', value: agency.code },
                ]}
              />
              <InfoRow items={[{ label: 'Họ tên chủ đại lý', value: agency.representative }]} />
              <InfoRow items={[{ label: 'Số điện thoại', value: agency.phone }]} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: C_TEXT_LABEL }}>Địa chỉ</span>
                <div style={{ fontSize: 14, color: C_TEXT_PRIMARY, fontWeight: 500 }}>
                  {street}
                  {wardCity && (
                    <>
                      <br />
                      {wardCity}
                    </>
                  )}
                </div>
              </div>
            </InfoCard>

            {/* Cấu hình trang quản trị */}
            <InfoCard title="Cấu hình trang quản trị">
              <CopyRow label="URL trang quản trị" value={agency.adminUrl} onCopy={copyText} />
              <CopyRow label="Tên đăng nhập" value={agency.phone} onCopy={copyText} />
              <PasswordRow onCopy={copyText} />
            </InfoCard>

            {/* Cấu hình trang shop */}
            <InfoCard title="Cấu hình trang của shop">
              <CopyRow label="URL trang shop" value={agency.shopUrl} onCopy={copyText} />
            </InfoCard>

            {/* Nhà vận chuyển */}
            {(() => {
              const pendingCarrierReqs = carrierRequests.filter(r => r.agencyId === agency.id && r.status === 'pending')
              const cardTitle = pendingCarrierReqs.length > 0
                ? `Nhà vận chuyển được phép (${pendingCarrierReqs.length} yêu cầu mới)`
                : 'Nhà vận chuyển được phép'
              return (
                <InfoCard title={cardTitle}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {ALL_CARRIERS.map((carrier) => {
                      const enabled = (agency.allowedCarriers ?? ['GHN']).includes(carrier.key)
                      const isLocked = carrier.key === 'GHN'
                      const pendingReq = !enabled ? carrierRequests.find(r => r.agencyId === agency.id && r.carrier === carrier.key && r.status === 'pending') : undefined
                      const rejectedReq = !enabled && carrierRequests.find(r => r.agencyId === agency.id && r.carrier === carrier.key && r.status === 'rejected')
                      return (
                        <div key={carrier.key} style={{ display: 'flex', flexDirection: 'column', gap: 0, border: `1px solid ${enabled ? carrier.color + '40' : (pendingReq ? '#FCD34D' : C_BORDER)}`, borderRadius: 8, overflow: 'hidden', background: enabled ? carrier.color + '08' : (pendingReq ? '#FFFBEB' : '#FAFAFA') }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: enabled ? carrier.color : (pendingReq ? '#FCD34D' : '#D1D5DB'), flexShrink: 0, display: 'inline-block' }} />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{carrier.label}</span>
                                <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>{carrier.description}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {pendingReq ? (
                                <>
                                  <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: '#FEF3C7', color: '#D97706' }}>Chờ duyệt</span>
                                  {approvingCarrierId !== pendingReq.id && (
                                    <button onClick={() => { setApprovingCarrierId(pendingReq.id); setRejectingCarrierId(null) }} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Duyệt</button>
                                  )}
                                  {approvingCarrierId !== pendingReq.id && (
                                    <button onClick={() => { setRejectingCarrierId(pendingReq.id); setRejectCarrierReason('') }} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid #E5E7EB`, background: '#fff', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Từ chối</button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: enabled ? '#F0FDF4' : (rejectedReq ? '#FEF2F2' : '#F3F4F6'), color: enabled ? '#16A34A' : (rejectedReq ? '#DC2626' : '#9CA3AF') }}>
                                    {enabled ? 'Đang hoạt động' : (rejectedReq ? 'Đã từ chối' : 'Chưa kích hoạt')}
                                  </span>
                                  {isLocked ? (
                                    <LockOutlined style={{ fontSize: 14, color: '#9CA3AF' }} />
                                  ) : (
                                    <div onClick={() => toggleCarrier(carrier.key)} title={enabled ? 'Tắt kích hoạt' : 'Kích hoạt'} style={{ width: 36, height: 20, borderRadius: 10, cursor: 'pointer', flexShrink: 0, background: enabled ? carrier.color : '#D1D5DB', position: 'relative', transition: 'background 0.2s' }}>
                                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, transition: 'left 0.2s', left: enabled ? 18 : 2, boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          {/* Pending request detail */}
                          {pendingReq?.note && (
                            <div style={{ padding: '8px 12px', borderTop: '1px solid #FDE68A', background: '#FFFDF0', fontSize: 12, color: '#92400E' }}>
                              <span style={{ fontWeight: 600 }}>Ghi chú từ đại lý: </span>{pendingReq.note}
                            </div>
                          )}
                          {/* Duyệt form 2 bước: chọn dịch vụ trước, ClientHubID sau — cả 2 multi-select */}
                          {approvingCarrierId === pendingReq?.id && (
                            <CarrierApprovalForm
                              agencyName={agency.name}
                              excludeHubIds={agency.clientHubIds}
                              excludeServiceIds={agency.allowedServices247}
                              onConfirm={(hubIds, serviceIds) => {
                                approveCarrierRequest(pendingReq!.id, hubIds, serviceIds)
                                setApprovingCarrierId(null)
                                forceRender(n => n + 1)
                              }}
                              onCancel={() => setApprovingCarrierId(null)}
                            />
                          )}
                          {/* Reject form inline */}
                          {rejectingCarrierId === pendingReq?.id && (
                            <div style={{ padding: '10px 12px', borderTop: `1px solid #FCA5A5`, background: '#FFF5F5', display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#DC2626' }}>Lý do từ chối</span>
                              <input
                                autoFocus
                                value={rejectCarrierReason}
                                onChange={e => setRejectCarrierReason(e.target.value)}
                                placeholder="Nhập lý do từ chối yêu cầu..."
                                style={{ padding: '6px 10px', border: `1px solid #FCA5A5`, borderRadius: 6, fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' as const }}
                              />
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button onClick={() => setRejectingCarrierId(null)} style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#fff', fontSize: 12, cursor: 'pointer', color: C_TEXT_SECONDARY }}>Huỷ</button>
                                <button
                                  onClick={() => { rejectCarrierRequest(rejectingCarrierId!, rejectCarrierReason); setRejectingCarrierId(null); forceRender(n => n + 1) }}
                                  disabled={!rejectCarrierReason.trim()}
                                  style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: rejectCarrierReason.trim() ? '#DC2626' : '#D1D5DB', color: '#fff', fontSize: 12, fontWeight: 700, cursor: rejectCarrierReason.trim() ? 'pointer' : 'not-allowed' }}>
                                  Xác nhận từ chối
                                </button>
                              </div>
                            </div>
                          )}
                          {/* Danh sách ClientHubID đã cấp + cấp thêm — chỉ áp dụng 247Express đã kích hoạt */}
                          {carrier.key === '247Express' && enabled && (
                            <div style={{ padding: '10px 12px', borderTop: `1px solid ${carrier.color}20` }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>
                                  ClientHubID đã cấp ({(agency.clientHubIds ?? []).length})
                                </span>
                                {addingHubFor !== carrier.key && (
                                  <button
                                    onClick={() => { setAddingHubFor(carrier.key); setNewHubId('') }}
                                    style={{ padding: '3px 10px', borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#fff', color: carrier.color, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    + Cấp thêm Hub
                                  </button>
                                )}
                              </div>

                              {(agency.clientHubIds ?? []).length === 0 ? (
                                <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Chưa cấp ClientHubID nào.</div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {(agency.clientHubIds ?? []).map(hubId => {
                                    const hubInfo = clientHubs247.find(h => h.id === hubId)
                                    return (
                                      <div key={hubId} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: carrier.color }}>{hubId}</span>
                                        <span style={{ color: C_TEXT_SECONDARY }}>{hubInfo?.name ?? '(không rõ hub)'}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {addingHubFor === carrier.key && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                  <select
                                    value={newHubId}
                                    onChange={e => setNewHubId(e.target.value)}
                                    style={{ flex: 1, padding: '5px 8px', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 12, color: C_TEXT_PRIMARY }}
                                  >
                                    <option value="">— Chọn ClientHubID —</option>
                                    {clientHubs247.filter(h => !(agency.clientHubIds ?? []).includes(h.id)).map(h => (
                                      <option key={h.id} value={h.id}>{h.id} — {h.name}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => setAddingHubFor(null)}
                                    style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#fff', fontSize: 12, cursor: 'pointer', color: C_TEXT_SECONDARY }}
                                  >
                                    Huỷ
                                  </button>
                                  <button
                                    onClick={() => { grantAdditionalHub(agency.id, newHubId); setAddingHubFor(null); forceRender(n => n + 1) }}
                                    disabled={!newHubId}
                                    style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: newHubId ? carrier.color : '#D1D5DB', color: '#fff', fontSize: 12, fontWeight: 700, cursor: newHubId ? 'pointer' : 'not-allowed' }}
                                  >
                                    Cấp
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </InfoCard>
              )
            })()}

            {/* Yêu cầu kết nối Shop ID */}
            {(() => {
              const agencyConns = shopConnections.filter(s => s.agencyId === agency.id)
              const pendingConns = agencyConns.filter(s => s.status === 'pending')
              const cardTitle = pendingConns.length > 0
                ? `Yêu cầu kết nối Shop ID (${pendingConns.length} chờ duyệt)`
                : 'Yêu cầu kết nối Shop ID'
              const colStyle = (flex: string, minWidth: number): React.CSSProperties => ({
                display: 'flex', flex, minWidth, padding: '6px 8px', alignItems: 'center',
              })
              return (
                <InfoCard title={cardTitle}>
                  {agencyConns.length === 0 ? (
                    <div style={{ textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14, padding: '4px 0' }}>
                      Chưa có kết nối Shop ID nào
                    </div>
                  ) : (
                    <div style={{ margin: '0 -16px -16px' }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', background: '#F3F4F6' }}>
                        {[
                          { label: 'NVC',         flex: '0 0 90px',  minWidth: 90 },
                          { label: 'Shop ID',      flex: '0 0 100px', minWidth: 100 },
                          { label: 'Tên cửa hàng', flex: '2 0 0',    minWidth: 160 },
                          { label: 'SĐT',          flex: '0 0 120px', minWidth: 120 },
                          { label: 'Ngày gửi',     flex: '0 0 100px', minWidth: 100 },
                          { label: 'Trạng thái',   flex: '0 0 130px', minWidth: 130 },
                          { label: '',             flex: '0 0 160px', minWidth: 160 },
                        ].map((col, i) => (
                          <div key={i} style={{ ...colStyle(col.flex, col.minWidth) }}>
                            <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{col.label}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ height: 1, background: C_BORDER }} />

                      {agencyConns.map((conn) => {
                        const isPending  = conn.status === 'pending'
                        const isRejected = conn.status === 'rejected'
                        const rowBg = isPending ? '#FFFBEB' : isRejected ? '#FFF5F5' : '#fff'
                        return (
                          <div key={conn.id}>
                            <div style={{ display: 'flex', background: rowBg }}>
                              <div style={colStyle('0 0 90px', 90)}>
                                <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: conn.carrier === 'GHN' ? '#FFEDE8' : '#EFF6FF', color: conn.carrier === 'GHN' ? '#EE4D2D' : '#1677FF' }}>{conn.carrier}</span>
                              </div>
                              <div style={colStyle('0 0 100px', 100)}>
                                <span style={{ fontSize: 13, fontFamily: 'monospace', color: C_TEXT_SECONDARY }}>{conn.shopId}</span>
                              </div>
                              <div style={colStyle('2 0 0', 160)}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: isRejected ? '#9CA3AF' : '#111827' }}>{conn.name}</span>
                              </div>
                              <div style={colStyle('0 0 120px', 120)}>
                                <span style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>{conn.phone}</span>
                              </div>
                              <div style={colStyle('0 0 100px', 100)}>
                                <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>{conn.requestedAt}</span>
                              </div>
                              <div style={colStyle('0 0 130px', 130)}>
                                {conn.status === 'active'   && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>Đã duyệt</span>}
                                {conn.status === 'pending'  && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>Chờ duyệt</span>}
                                {conn.status === 'rejected' && <span title={conn.rejectionReason} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#FFF5F5', color: '#EF4444', border: '1px solid #FCA5A5', cursor: conn.rejectionReason ? 'help' : 'default' }}>Đã từ chối</span>}
                              </div>
                              <div style={{ ...colStyle('0 0 160px', 160), gap: 6, justifyContent: 'flex-end', paddingRight: 12 }}>
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => { approveShopConnection(conn.id); forceRender(n => n + 1) }}
                                      style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                    >Duyệt</button>
                                    <button
                                      onClick={() => { setRejectingId(conn.id); setRejectReason('') }}
                                      style={{ padding: '4px 12px', fontSize: 12, fontWeight: 600, background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                                    >Từ chối</button>
                                  </>
                                )}
                              </div>
                            </div>
                            <div style={{ height: 1, background: C_BORDER }} />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </InfoCard>
              )
            })()}

            {/* Reject reason modal */}
            {rejectingId && (
              <div
                onClick={() => setRejectingId(null)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{ background: '#fff', borderRadius: 12, padding: 32, width: 440, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: C_TEXT_PRIMARY, marginBottom: 16 }}>Lý do từ chối</div>
                  <textarea
                    autoFocus
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do từ chối kết nối này..."
                    rows={4}
                    style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '8px 12px', fontSize: 14, color: C_TEXT_PRIMARY, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button onClick={() => setRejectingId(null)} style={{ padding: '8px 16px', fontSize: 14, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', color: C_TEXT_PRIMARY }}>
                      Huỷ
                    </button>
                    <button
                      disabled={!rejectReason.trim()}
                      onClick={() => {
                        rejectShopConnection(rejectingId, rejectReason.trim())
                        setRejectingId(null)
                        forceRender(n => n + 1)
                      }}
                      style={{ padding: '8px 16px', fontSize: 14, fontWeight: 600, background: rejectReason.trim() ? '#EF4444' : '#FCA5A5', border: 'none', borderRadius: 6, cursor: rejectReason.trim() ? 'pointer' : 'default', color: '#fff' }}
                    >
                      Xác nhận từ chối
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '8px 0' }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: C_TEXT_PRIMARY,
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <EditOutlined />
                Chỉnh sửa
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: '#EF4444',
                  border: 'none',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <DeleteOutlined />
                Xoá
              </button>
            </div>
          </div>
        )}

        {activeTab === 'shops' && (
          <div
            style={{
              background: '#fff',
              border: `1px solid ${C_BORDER}`,
              borderRadius: 12,
              padding: 24,
              color: C_TEXT_SECONDARY,
              textAlign: 'center',
            }}
          >
            Danh sách shop — sẽ implement ở sprint tiếp theo
          </div>
        )}

        {activeTab === 'orders' && (
          <div
            style={{
              background: '#fff',
              border: `1px solid ${C_BORDER}`,
              borderRadius: 12,
              padding: 24,
              color: C_TEXT_SECONDARY,
              textAlign: 'center',
            }}
          >
            Đơn hàng — sẽ implement ở sprint tiếp theo
          </div>
        )}
      </div>
    </div>
  )
}
