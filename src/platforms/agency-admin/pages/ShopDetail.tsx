import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import allShops from '../../../mock-data/shops.json'
import allServices from '../../../mock-data/services.json'
import allPriceTables from '../../../mock-data/pricing.json'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_BORDER         = '#E5E7EB'
const C_BG_PAGE        = '#F9FAFB'
const CARD_SHADOW      = '0 1px 2px rgba(0,0,0,0.05)'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function splitAddress(address: string): [string, string] {
  const idx = address.lastIndexOf(', ')
  if (idx === -1) return [address, '']
  return [address.slice(0, idx), address.slice(idx + 2)]
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function ShopDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

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
          padding: '24px 80px',
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

      {/* ── Content cards ───────────────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          maxWidth: 1024,
          padding: '0 80px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {/* Card 1: Thông tin cơ bản */}
        <SectionCard title="Thông tin cơ bản">
          {/* Row: Tên shop + Mã shop */}
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
                      {/* Dịch vụ */}
                      <div style={{ flex: '2 0 0', minWidth: 160 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{svc.name}</div>
                        <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>{svc.desc}</div>
                      </div>

                      {/* Bảng giá */}
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

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 6,
            padding: 16,
          }}
        >
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#111827',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 14,
              fontWeight: 600,
              lineHeight: '20px',
              cursor: 'pointer',
            }}
          >
            <EditOutlined style={{ fontSize: 16 }} />
            Chỉnh sửa
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#EF4444',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: 14,
              fontWeight: 600,
              lineHeight: '20px',
              cursor: 'pointer',
            }}
          >
            <DeleteOutlined style={{ fontSize: 16 }} />
            Xoá
          </button>
        </div>
      </div>
    </div>
  )
}
