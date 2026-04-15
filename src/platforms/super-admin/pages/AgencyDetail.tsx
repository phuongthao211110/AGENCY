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
} from '@ant-design/icons'
import { agenciesList } from '../agencyStore'

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
export default function AgencyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'info' | 'shops' | 'orders'>('info')
  const [toastVisible, setToastVisible] = useState(false)

  const agency = agenciesList.find((a) => a.id === id)

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
