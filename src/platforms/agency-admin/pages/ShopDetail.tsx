import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  EditOutlined,
  StopOutlined,
  CalendarOutlined,
  InboxOutlined,
  DollarOutlined,
  BarChartOutlined,
  SwapRightOutlined,
} from '@ant-design/icons'
import allShops from '../../../mock-data/shops.json'
import allServices from '../../../mock-data/services.json'
import allPriceTables from '../../../mock-data/pricing.json'
import allBankAccounts from '../../../mock-data/bank-accounts.json'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_BORDER         = '#E5E7EB'
const C_BG_PAGE        = '#F9FAFB'
const C_ACTION         = '#FF5200'
const CARD_SHADOW      = '0 1px 2px rgba(0,0,0,0.05)'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtNum = (n: number) => n.toLocaleString('vi-VN')
const fmtVND = (n: number) => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.0', '') + ' tỷ'
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1).replace('.0', '') + ' tr'
  return n.toLocaleString('vi-VN') + ' ₫'
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, iconColor }: {
  icon: React.ReactNode; label: string; value: string; iconColor: string
}) {
  return (
    <div style={{
      flex: 1, background: '#fff', border: `1px solid ${C_BORDER}`,
      borderRadius: 12, padding: 12,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20, color: iconColor, lineHeight: 1 }}>{icon}</span>
        <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: C_TEXT_PRIMARY }}>{value}</div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function splitAddress(address: string): [string, string] {
  const idx = address.lastIndexOf(', ')
  if (idx === -1) return [address, '']
  return [address.slice(0, idx), address.slice(idx + 2)]
}

function parseDays(schedule: string): string[] {
  // "Thứ 2, 3, 4, 5, 6" → ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6"]
  const parts = schedule.split(', ')
  return parts.map((p, i) => (i === 0 ? p : `Thứ ${p}`))
}

// ─── InfoField: label + plain-text value ──────────────────────────────────────
function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 14, color: C_TEXT_LABEL, lineHeight: '20px' }}>{label}</span>
      <div style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{children}</div>
    </div>
  )
}

// ─── CopyField: value + copy icon ─────────────────────────────────────────────
function CopyField({
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
      <span style={{ fontSize: 14, color: C_TEXT_LABEL, lineHeight: '20px' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{value}</span>
        <CopyOutlined
          style={{ fontSize: 16, color: C_TEXT_LABEL, cursor: 'pointer' }}
          onClick={() => onCopy(value)}
        />
      </div>
    </div>
  )
}

// ─── PasswordField: masked value + toggle + copy ──────────────────────────────
function PasswordField({
  label,
  onCopy,
}: {
  label: string
  onCopy: (text: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const PASSWORD = 'ghn@2024'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 14, color: C_TEXT_LABEL, lineHeight: '20px' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {visible ? (
            <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{PASSWORD}</span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: C_TEXT_PRIMARY,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
              ))}
            </span>
          )}
          {visible ? (
            <EyeOutlined
              style={{ fontSize: 16, color: C_TEXT_LABEL, cursor: 'pointer', marginLeft: 4 }}
              onClick={() => setVisible(false)}
            />
          ) : (
            <EyeInvisibleOutlined
              style={{ fontSize: 16, color: C_TEXT_LABEL, cursor: 'pointer', marginLeft: 4 }}
              onClick={() => setVisible(true)}
            />
          )}
        </div>
        <CopyOutlined
          style={{ fontSize: 16, color: C_TEXT_LABEL, cursor: 'pointer' }}
          onClick={() => onCopy(PASSWORD)}
        />
      </div>
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${C_BORDER}`,
        borderRadius: 12,
        boxShadow: CARD_SHADOW,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
        {title}
      </span>
      {children}
    </div>
  )
}

// ─── Tab types ────────────────────────────────────────────────────────────────
type TabKey = 'info' | 'schedule' | 'bank' | 'history'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info',     label: 'Thông tin cơ bản' },
  { key: 'schedule', label: 'Lịch chuyển khoản' },
  { key: 'bank',     label: 'Tài khoản ngân hàng' },
  { key: 'history',  label: 'Lịch sử chỉnh sửa' },
]

// ─── Edit history mock data ───────────────────────────────────────────────────
type EditHistoryItem = {
  id: string; date: string; time: string
  operator: string; field: string; oldValue: string; newValue: string
}

const SHOP_HISTORY: EditHistoryItem[] = [
  // 10/04 15:20 — 1 thay đổi đơn
  { id: '1',  date: '2024-04-10', time: '15:20', operator: 'Admin Đại lý', field: 'Trạng thái',                    oldValue: 'Tắt',                       newValue: 'Hoạt động' },
  // 10/04 14:05 — cùng lúc sửa 4 trường thông tin cơ bản
  { id: '2a', date: '2024-04-10', time: '14:05', operator: 'Admin Đại lý', field: 'Tên shop',                      oldValue: 'Shop Thời Trang',            newValue: 'Shop Thời Trang ABC' },
  { id: '2b', date: '2024-04-10', time: '14:05', operator: 'Admin Đại lý', field: 'Địa chỉ',                       oldValue: '12 Lê Lợi, Q.1',             newValue: '15 Nguyễn Huệ, Q.1, TP.HCM' },
  { id: '2c', date: '2024-04-10', time: '14:05', operator: 'Admin Đại lý', field: 'Số điện thoại',                 oldValue: '0901234567',                 newValue: '0909123456' },
  { id: '2d', date: '2024-04-10', time: '14:05', operator: 'Admin Đại lý', field: 'Họ tên chủ shop',               oldValue: 'Nguyễn Văn A',               newValue: 'Trần Minh Anh' },
  // 22/03 11:30 — cùng lúc cấu hình 3 dịch vụ + 3 bảng giá
  { id: '3a', date: '2024-03-22', time: '11:30', operator: 'Admin Đại lý', field: 'Thêm dịch vụ',                  oldValue: '',                           newValue: 'Giao hàng nhanh' },
  { id: '3b', date: '2024-03-22', time: '11:30', operator: 'Admin Đại lý', field: 'Thêm dịch vụ',                  oldValue: '',                           newValue: 'Giao hàng tiết kiệm' },
  { id: '3c', date: '2024-03-22', time: '11:30', operator: 'Admin Đại lý', field: 'Thêm dịch vụ',                  oldValue: '',                           newValue: 'Giao hàng hàng nặng' },
  { id: '3d', date: '2024-03-22', time: '11:30', operator: 'Admin Đại lý', field: 'Bảng giá — Giao hàng nhanh',    oldValue: 'Chưa có',                    newValue: 'Bảng giá tiêu chuẩn 2024' },
  { id: '3e', date: '2024-03-22', time: '11:30', operator: 'Admin Đại lý', field: 'Bảng giá — Giao hàng tiết kiệm',oldValue: 'Chưa có',                    newValue: 'Bảng giá tiêu chuẩn 2024' },
  { id: '3f', date: '2024-03-22', time: '11:30', operator: 'Admin Đại lý', field: 'Bảng giá — Giao hàng hàng nặng',oldValue: 'Chưa có',                    newValue: 'Bảng giá tiêu chuẩn 2024' },
  // 28/02 16:10 — 1 thay đổi đơn
  { id: '6',  date: '2024-02-28', time: '16:10', operator: 'Admin Đại lý', field: 'Lịch chuyển khoản',             oldValue: 'Thứ 2 & Thứ 5',             newValue: 'Thứ 2, Thứ 4 & Thứ 6' },
  // 10/02 10:30 — cùng lúc xoá 1 dịch vụ + cập nhật 2 bảng giá
  { id: '7a', date: '2024-02-10', time: '10:30', operator: 'Admin Đại lý', field: 'Xoá dịch vụ',                   oldValue: 'Giao hàng hoả tốc',          newValue: '' },
  { id: '7b', date: '2024-02-10', time: '10:30', operator: 'Admin Đại lý', field: 'Bảng giá — Giao hàng nhanh',    oldValue: 'Bảng giá cũ 2023',           newValue: 'Bảng giá tiêu chuẩn 2024' },
  { id: '7c', date: '2024-02-10', time: '10:30', operator: 'Admin Đại lý', field: 'Bảng giá — Giao hàng tiết kiệm',oldValue: 'Bảng giá cũ 2023',           newValue: 'Bảng giá tiêu chuẩn 2024' },
  // 15/01 10:00 — 1 thay đổi đơn
  { id: '9',  date: '2024-01-15', time: '10:00', operator: 'Admin Đại lý', field: 'Trạng thái',                    oldValue: 'Chờ duyệt',                  newValue: 'Hoạt động' },
]

// ─── Main component ───────────────────────────────────────────────────────────
export default function ShopDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Must be before any early returns (React hook rule)
  const [activeTab, setActiveTab] = useState<TabKey>('info')
  const [shopStatus, setShopStatus] = useState<string>(() => allShops.find((s) => s.id === id)?.status ?? 'active')
  const [deactivatedByAgency, setDeactivatedByAgency] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [editHistory, setEditHistory] = useState<EditHistoryItem[]>(SHOP_HISTORY)

  const handleDeactivate = () => {
    setShopStatus('inactive')
    setDeactivatedByAgency(true)
    setShowDeactivateModal(false)
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const timeStr = now.toTimeString().slice(0, 5)
    setEditHistory((prev) => [
      { id: Date.now().toString(), date: dateStr, time: timeStr, operator: 'Admin Đại lý', field: 'Trạng thái', oldValue: 'Hoạt động', newValue: 'Ngưng hoạt động' },
      ...prev,
    ])
  }

  const handleReactivate = () => {
    setShopStatus('active')
    setDeactivatedByAgency(false)
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const timeStr = now.toTimeString().slice(0, 5)
    setEditHistory((prev) => [
      { id: Date.now().toString(), date: dateStr, time: timeStr, operator: 'Admin Đại lý', field: 'Trạng thái', oldValue: 'Ngưng hoạt động', newValue: 'Hoạt động' },
      ...prev,
    ])
  }

  const shop = allShops.find((s) => s.id === id)

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
  }

  if (!shop) {
    return (
      <div style={{ padding: 24, color: '#ef4444' }}>
        Không tìm thấy shop.{' '}
        <span
          style={{ color: '#3B82F6', cursor: 'pointer' }}
          onClick={() => navigate('/agency-admin/shops')}
        >
          Quay lại
        </span>
      </div>
    )
  }

  const [street, city] = splitAddress(shop.address)
  const codSchedule = (shop as any).codSchedule as string | undefined

  const totalOrders = shop.totalOrders
  const totalCOD    = totalOrders * 35_000
  const revenue     = totalCOD * 0.028

  return (
    <div
      style={{
        background: C_BG_PAGE,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* ── Page header row ─────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: 1024,
          padding: '24px 80px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <ArrowLeftOutlined
          style={{ fontSize: 20, color: C_TEXT_PRIMARY, cursor: 'pointer', flexShrink: 0 }}
          onClick={() => navigate('/agency-admin/shops')}
        />
        <span style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '28px' }}>
          Thông tin shop
        </span>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: 1024, padding: '16px 80px 0' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, marginBottom: 10 }}>
          Thống kê tổng quan
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <KpiCard icon={<InboxOutlined />}    label="Đơn hàng"    value={fmtNum(totalOrders)} iconColor="#10B981" />
          <KpiCard icon={<DollarOutlined />}   label="Tổng COD"    value={fmtVND(totalCOD)}   iconColor="#F59E0B" />
          <KpiCard icon={<BarChartOutlined />} label="Doanh thu"   value={fmtVND(revenue)}    iconColor="#8B5CF6" />
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: 1024, padding: '16px 80px 0' }}>
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${C_BORDER}`,
          }}
        >
          {TABS.map((tab) => {
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
      </div>

      {/* ── Tab content ─────────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: 1024,
          padding: '16px 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >

        {/* ──── Tab: Thông tin cơ bản ──────────────────────────────── */}
        {activeTab === 'info' && (
          <>
            {/* Inactive notice banner — agency deactivated */}
            {shopStatus === 'inactive' && deactivatedByAgency && (
              <div style={{ background: '#F9FAFB', border: `1px solid ${C_BORDER}`, borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>Shop đã bị ngưng hoạt động</span>
                  <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Shop không thể đăng nhập hoặc tạo đơn mới trong thời gian này.</span>
                  <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 4 }}>Dữ liệu lịch sử (đơn hàng, đối soát) vẫn được lưu trữ để tra cứu.</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                  <button onClick={handleReactivate} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 14, fontWeight: 600, lineHeight: '20px', cursor: 'pointer' }}>
                    Kích hoạt lại
                  </button>
                </div>
              </div>
            )}

            {/* Inactive notice banner — self deleted */}
            {shopStatus === 'inactive' && !deactivatedByAgency && (shop as any).selfDeletedAt && (
              <div style={{ background: '#FFF7ED', border: '1px solid #FECBA1', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#92400E', lineHeight: '20px' }}>Shop đã tự xoá tài khoản</span>
                  {(shop as any).selfDeletedAt && (
                    <span style={{ fontSize: 13, color: '#92400E' }}>Ngày xoá: {((shop as any).selfDeletedAt as string).split('-').reverse().join('/')}</span>
                  )}
                  {(shop as any).selfDeleteReason && (
                    <span style={{ fontSize: 13, color: '#92400E' }}>Lý do: {(shop as any).selfDeleteReason}</span>
                  )}
                  {(shop as any).selfDeleteNote && (
                    <span style={{ fontSize: 13, color: '#92400E' }}>Ghi chú: {(shop as any).selfDeleteNote}</span>
                  )}
                  <span style={{ fontSize: 12, color: '#78350F', marginTop: 4 }}>Dữ liệu lịch sử (đơn hàng, đối soát) vẫn được lưu trữ để tra cứu.</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                  <button onClick={handleReactivate} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontSize: 14, fontWeight: 600, lineHeight: '20px', cursor: 'pointer' }}>
                    Kích hoạt lại tài khoản
                  </button>
                  <span style={{ fontSize: 11, color: '#92400E' }}>Chỉ dùng nếu shop đổi ý và liên hệ lại.</span>
                </div>
              </div>
            )}

            {/* Card 1: Thông tin cơ bản */}
            <SectionCard title="Thông tin cơ bản">
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <InfoField label="Tên shop">{shop.name}</InfoField>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <InfoField label="Mã shop">{shop.id}</InfoField>
                </div>
              </div>

              <InfoField label="Họ tên chủ shop">{shop.ownerName}</InfoField>

              <InfoField label="Số điện thoại">{shop.phone}</InfoField>

              <InfoField label="Địa chỉ">
                <div>{street}</div>
                {city && <div>{city}</div>}
              </InfoField>
            </SectionCard>

            {/* Card 2: Cấu hình tài khoản shop đăng nhập */}
            <SectionCard title="Cấu hình tài khoản shop đăng nhập">
              <CopyField label="Tên đăng nhập của shop" value={shop.username} onCopy={copyText} />
              <PasswordField label="Mật khẩu của shop" onCopy={copyText} />
            </SectionCard>

            {/* Card 3: Cấu hình dịch vụ */}
            <SectionCard title="Cấu hình dịch vụ">
              <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, lineHeight: '18px', marginTop: -8 }}>
                Bảng giá áp dụng cho từng dịch vụ. Dịch vụ chưa gắn bảng giá sẽ không khả dụng với shop này.
              </span>
              <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ display: 'flex', background: '#F3F4F6', padding: '6px 12px' }}>
                  <div style={{ flex: '2 0 0', minWidth: 160, fontSize: 13, color: C_TEXT_SECONDARY }}>Dịch vụ</div>
                  <div style={{ flex: '2 0 0', minWidth: 200, fontSize: 13, color: C_TEXT_SECONDARY }}>Bảng giá áp dụng</div>
                </div>
                <div style={{ height: 1, background: C_BORDER }} />

                {(() => {
                  const configuredIds = new Set(shop.configuredServices.map((cs) => cs.serviceId))
                  return allServices.map((svc, idx) => {
                    const isConfigured = configuredIds.has(svc.id)
                    const priceTable = svc.priceTableId
                      ? allPriceTables.find((pt) => pt.id === svc.priceTableId)
                      : null
                    return (
                      <div key={svc.id}>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', background: '#fff' }}>
                          <div style={{ flex: '2 0 0', minWidth: 160 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{svc.name}</div>
                            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>{svc.desc}</div>
                          </div>
                          <div style={{ flex: '2 0 0', minWidth: 200 }}>
                            {isConfigured && priceTable ? (
                              <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{priceTable.name}</span>
                            ) : isConfigured ? (
                              <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>—</span>
                            ) : (
                              <span style={{ fontSize: 13, color: '#D97706' }}>Dịch vụ không khả dụng</span>
                            )}
                          </div>
                        </div>
                        {idx < allServices.length - 1 && <div style={{ height: 1, background: C_BORDER }} />}
                      </div>
                    )
                  })
                })()}
              </div>
            </SectionCard>

            {/* Action buttons — hidden when shop is inactive */}
            {shopStatus !== 'inactive' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, padding: 16 }}>
                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#111827', color: '#fff', border: 'none',
                    borderRadius: 6, padding: '8px 12px',
                    fontSize: 14, fontWeight: 600, lineHeight: '20px', cursor: 'pointer',
                  }}
                >
                  <EditOutlined style={{ fontSize: 16 }} />
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#fff', color: '#374151',
                    border: `1px solid ${C_BORDER}`,
                    borderRadius: 6, padding: '8px 12px',
                    fontSize: 14, fontWeight: 600, lineHeight: '20px', cursor: 'pointer',
                  }}
                >
                  <StopOutlined style={{ fontSize: 16 }} />
                  Ngưng hoạt động
                </button>
              </div>
            )}

            {/* Confirm deactivate modal */}
            {showDeactivateModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: '28px 32px', width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C_TEXT_PRIMARY, marginBottom: 8 }}>Ngưng hoạt động shop</div>
                  <div style={{ fontSize: 14, color: C_TEXT_SECONDARY, marginBottom: 24, lineHeight: '22px' }}>
                    Shop <strong style={{ color: C_TEXT_PRIMARY }}>{shop.name}</strong> sẽ bị ngưng hoạt động. Shop sẽ không thể đăng nhập hoặc tạo đơn mới. Dữ liệu lịch sử vẫn được giữ nguyên.
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      onClick={() => setShowDeactivateModal(false)}
                      style={{ height: 36, padding: '0 18px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_TEXT_PRIMARY, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                    >
                      Huỷ
                    </button>
                    <button
                      onClick={handleDeactivate}
                      style={{ height: 36, padding: '0 18px', border: 'none', borderRadius: 6, background: '#374151', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Xác nhận ngưng
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ──── Tab: Lịch chuyển khoản ─────────────────────────────── */}
        {activeTab === 'schedule' && (
          <SectionCard title="Lịch chuyển khoản COD">
            {codSchedule ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Description */}
                <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, lineHeight: '18px', marginTop: -8 }}>
                  Các ngày trong tuần đại lý sẽ chuyển khoản COD về tài khoản shop.
                </span>

                {/* Schedule display */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    background: '#FAFAFA', border: `1px solid ${C_BORDER}`, borderRadius: 8,
                  }}
                >
                  <CalendarOutlined style={{ fontSize: 20, color: C_ACTION, flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Lịch nhận tiền</span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {parseDays(codSchedule).map((day) => (
                        <span
                          key={day}
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 600,
                            background: '#FFF4ED',
                            color: C_ACTION,
                            border: `1px solid #FECBA1`,
                          }}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              /* Empty state */
              <div
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '48px 24px', gap: 12,
                }}
              >
                <div
                  style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <CalendarOutlined style={{ fontSize: 24, color: C_TEXT_SECONDARY }} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: C_TEXT_PRIMARY }}>
                  Chưa cấu hình lịch chuyển khoản
                </span>
                <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, textAlign: 'center', maxWidth: 320, lineHeight: '20px' }}>
                  Shop chưa thiết lập lịch nhận COD. Shop có thể cấu hình trong mục Đối soát trên Web Shop portal.
                </span>
              </div>
            )}
          </SectionCard>
        )}

        {/* ──── Tab: Tài khoản ngân hàng ───────────────────────── */}
        {activeTab === 'bank' && (() => {
          const bankAccounts = (allBankAccounts as any[]).filter(a => a.shopId === shop.id)
          return (
            <SectionCard title="Tài khoản ngân hàng">
              {bankAccounts.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '48px 24px', gap: 12,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', background: '#F3F4F6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 24, lineHeight: 1 }}>🏦</span>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: C_TEXT_PRIMARY }}>
                    Chưa có tài khoản ngân hàng
                  </span>
                  <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, textAlign: 'center', maxWidth: 320, lineHeight: '20px' }}>
                    Shop chưa đăng ký tài khoản nhận tiền. Shop có thể thêm trong mục Cài đặt trên Web Shop portal.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {bankAccounts.map((acc: any, idx: number) => (
                    <div key={acc.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
                        {/* Bank icon */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 8, background: '#F3F4F6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, fontSize: 18,
                        }}>
                          🏦
                        </div>
                        {/* Account info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#3B82F6', lineHeight: '20px' }}>
                            {acc.accountName} – {acc.accountNumber}
                          </div>
                          <div style={{ fontSize: 13, color: '#3B82F6', lineHeight: '18px', marginTop: 2 }}>
                            {acc.bankShortName}
                          </div>
                        </div>
                        {/* Status badge */}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          background: acc.isActive ? '#F0FDF4' : '#F9FAFB',
                          color: acc.isActive ? '#16A34A' : C_TEXT_SECONDARY,
                          border: `1px solid ${acc.isActive ? '#BBF7D0' : C_BORDER}`,
                          flexShrink: 0,
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: acc.isActive ? '#16A34A' : '#D1D5DB',
                            display: 'inline-block', flexShrink: 0,
                          }} />
                          {acc.isActive ? 'Đang dùng' : 'Tạm ngưng'}
                        </span>
                      </div>
                      {idx < bankAccounts.length - 1 && (
                        <div style={{ height: 1, background: C_BORDER }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )
        })()}

        {/* ──── Tab: Lịch sử chỉnh sửa ─────────────────────────── */}
        {activeTab === 'history' && (
          <div style={{ padding: '0 0 16px' }}>
            {(() => {
              // Group: date → time → items
              const byDate: Record<string, Record<string, EditHistoryItem[]>> = {}
              editHistory.forEach(item => {
                if (!byDate[item.date]) byDate[item.date] = {}
                if (!byDate[item.date][item.time]) byDate[item.date][item.time] = []
                byDate[item.date][item.time].push(item)
              })
              const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

              return (
                <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                  {/* Table header */}
                  <div style={{ display: 'flex', background: '#F3F4F6' }}>
                    <div style={{ width: 72, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, flexShrink: 0 }}>Giờ</div>
                    <div style={{ flex: '1 0 0', minWidth: 140, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Người thực hiện</div>
                    <div style={{ flex: '1 0 0', minWidth: 160, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Trường thay đổi</div>
                    <div style={{ flex: '3 0 0', minWidth: 220, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Nội dung thay đổi</div>
                  </div>
                  <div style={{ height: 1, background: C_BORDER }} />

                  {sortedDates.map((date, dateIdx) => {
                    const [y, m, d] = date.split('-')
                    const dateLabel = `${d}/${m}/${y}`
                    const timeGroups = byDate[date]
                    const sortedTimes = Object.keys(timeGroups).sort((a, b) => b.localeCompare(a))

                    return (
                      <div key={date}>
                        {/* Date header */}
                        <div style={{ background: '#F3F4F6', padding: '6px 12px', fontSize: 13, fontWeight: 700, color: C_TEXT_PRIMARY, borderBottom: `1px solid ${C_BORDER}` }}>
                          {dateLabel}
                        </div>

                        {sortedTimes.map((time, tIdx) => {
                          const items = timeGroups[time]
                          const isBatch = items.length > 1
                          const isLastTimeGroup = tIdx === sortedTimes.length - 1

                          return (
                            <div key={time}>
                              {/* Time group */}
                              <div style={{ display: 'flex', background: isBatch ? '#FAFAFA' : '#fff' }}>

                                {/* Time column — spans all rows in this group */}
                                <div style={{
                                  width: 72, flexShrink: 0,
                                  padding: '10px 12px',
                                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                                  borderRight: isBatch ? `2px solid #FF5200` : 'none',
                                  alignSelf: 'stretch',
                                }}>
                                  <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, fontVariantNumeric: 'tabular-nums' }}>{time}</span>
                                  {isBatch && (
                                    <span style={{
                                      fontSize: 11, fontWeight: 700, color: C_ACTION,
                                      background: '#FFF4ED', border: '1px solid #FECBA1',
                                      borderRadius: 10, padding: '1px 6px', whiteSpace: 'nowrap',
                                    }}>
                                      {items.length} TĐ
                                    </span>
                                  )}
                                </div>

                                {/* Rows stacked vertically */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                  {items.map((item, rowIdx) => {
                                    const isLastRow = rowIdx === items.length - 1
                                    return (
                                      <div key={item.id}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                          <div style={{ flex: '1 0 0', minWidth: 140, padding: '10px 12px', fontSize: 13, color: C_TEXT_PRIMARY }}>{item.operator}</div>
                                          <div style={{ flex: '1 0 0', minWidth: 160, padding: '10px 12px', fontSize: 13, color: C_TEXT_PRIMARY }}>{item.field}</div>
                                          <div style={{ flex: '3 0 0', minWidth: 220, padding: '10px 12px', fontSize: 13, color: C_TEXT_PRIMARY, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                            {item.oldValue === '' ? (
                                              <span style={{ color: C_TEXT_SECONDARY, fontStyle: 'italic' }}>(Chưa có)</span>
                                            ) : (
                                              <span style={{ color: C_TEXT_SECONDARY }}>{item.oldValue}</span>
                                            )}
                                            <SwapRightOutlined style={{ fontSize: 12, color: C_TEXT_SECONDARY, flexShrink: 0 }} />
                                            {item.newValue === '' ? (
                                              <span style={{ color: '#EF4444', fontStyle: 'italic' }}>(Đã xoá)</span>
                                            ) : (
                                              <span style={{ color: C_TEXT_PRIMARY, fontWeight: 500 }}>{item.newValue}</span>
                                            )}
                                          </div>
                                        </div>
                                        {!isLastRow && <div style={{ height: 1, background: C_BORDER, marginLeft: 0 }} />}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              {!isLastTimeGroup && <div style={{ height: 1, background: C_BORDER }} />}
                            </div>
                          )
                        })}

                        {dateIdx < sortedDates.length - 1 && <div style={{ height: 1, background: C_BORDER }} />}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

      </div>
    </div>
  )
}
