import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
import { addAgency } from '../agencyStore'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY  = '#111827'
const C_TEXT_LABEL    = '#4B5563'
const C_TEXT_DISABLED = '#9CA3AF'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK          = '#3B82F6'
const C_ACTION        = '#FF5200'
const C_BORDER        = '#E5E7EB'
const C_BG_DISABLED   = '#F3F4F6'
const CARD_SHADOW     = '0px 1px 2px 0px rgba(0,0,0,0.05)'

// ── Utils ────────────────────────────────────────────────────
function slugify(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

function genCode(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 8)
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

// ── Shared primitives ─────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 14, color: C_TEXT_LABEL, lineHeight: '20px' }}>
      {children}
    </span>
  )
}

function TextInput({
  value, onChange, placeholder, disabled,
}: {
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div style={{
      background: disabled ? C_BG_DISABLED : '#fff',
      border: `1px solid ${C_BORDER}`, borderRadius: 6,
      padding: '6px 12px', display: 'flex', alignItems: 'center',
    }}>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1, border: 'none', outline: 'none', fontSize: 14,
          color: disabled ? C_TEXT_DISABLED : C_TEXT_PRIMARY,
          background: 'transparent', lineHeight: '20px',
          cursor: disabled ? 'not-allowed' : 'text',
          width: '100%',
        }}
      />
    </div>
  )
}

function InputField({
  label, value, onChange, placeholder, disabled,
}: {
  label: string; value: string; onChange?: (v: string) => void; placeholder?: string; disabled?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      <FieldLabel>{label}</FieldLabel>
      <TextInput value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} />
    </div>
  )
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 12,
      boxShadow: CARD_SHADOW, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
        {title}
      </span>
      {children}
    </div>
  )
}

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    copyText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
        padding: '6px 12px', cursor: 'pointer',
        fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap',
      }}
    >
      <CopyOutlined style={{ fontSize: 14 }} />
      {copied ? 'Đã sao chép' : 'Sao chép'}
    </button>
  )
}

// ── URL field ─────────────────────────────────────────────────
function UrlField({
  label, prefix, slug, onSlugChange, suffix,
}: {
  label: string; prefix: string; slug: string; onSlugChange: (v: string) => void; suffix: string
}) {
  const fullUrl = `${prefix}${slug}${suffix}`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {/* Prefix — disabled */}
        <div style={{
          background: C_BG_DISABLED, border: `1px solid ${C_BORDER}`, borderRadius: 6,
          padding: '6px 12px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap' }}>
            {prefix}
          </span>
        </div>
        {/* Slug — editable */}
        <div style={{
          flex: 1, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
          padding: '6px 12px', display: 'flex', alignItems: 'center', minWidth: 0,
        }}>
          <input
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 14,
              color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px', minWidth: 0,
            }}
          />
        </div>
        {/* Suffix — disabled */}
        <div style={{
          background: C_BG_DISABLED, border: `1px solid ${C_BORDER}`, borderRadius: 6,
          padding: '6px 12px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap' }}>
            {suffix}
          </span>
        </div>
        <CopyBtn value={fullUrl} />
      </div>
      {/* Preview URL */}
      <div style={{ padding: '6px 0' }}>
        <span style={{ fontSize: 14, lineHeight: '20px' }}>
          <span style={{ color: C_TEXT_LABEL }}>Xem trước URL: </span>
          <a
            href={fullUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: C_LINK, textDecoration: 'underline' }}
          >
            {fullUrl}
          </a>
        </span>
      </div>
    </div>
  )
}

// ── Password field ────────────────────────────────────────────
function PasswordField({
  label, value, onChange,
}: {
  label: string; value: string; onChange: (v: string) => void
}) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{
          flex: 1, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
          padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Mật khẩu của đại lý"
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 14,
              color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px',
            }}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            {show
              ? <EyeOutlined style={{ fontSize: 16, color: C_TEXT_SECONDARY }} />
              : <EyeInvisibleOutlined style={{ fontSize: 16, color: C_TEXT_SECONDARY }} />
            }
          </button>
        </div>
        <CopyBtn value={value} />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
interface InitialData {
  tenDaiLy?: string
  hoTen?: string
  sdt?: string
  soNha?: string
  tinhThanh?: string
}

export default function AgencyCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const init = (location.state || {}) as InitialData

  const [tenDaiLy,   setTenDaiLy]   = useState(init.tenDaiLy  || '')
  const [hoTen,      setHoTen]      = useState(init.hoTen      || '')
  const [sdt,        setSdt]        = useState(init.sdt        || '')
  const [soNha,      setSoNha]      = useState(init.soNha      || '')
  const [tinhThanh,  setTinhThanh]  = useState(init.tinhThanh || '')
  const [matKhau,    setMatKhau]    = useState('')
  const [adminSlug,  setAdminSlug]  = useState(() => slugify(init.tenDaiLy || ''))
  const [shopSlug,   setShopSlug]   = useState(() => slugify(init.tenDaiLy || ''))

  const maDaiLy = genCode(tenDaiLy)

  const handleCreate = () => {
    addAgency({
      id:             `AGN${Date.now().toString().slice(-5)}`,
      name:           tenDaiLy,
      code:           maDaiLy,
      status:         'active',
      ghnAccount:     adminSlug,
      adminUrl:       `admin-${adminSlug}.chotdon.ai`,
      shopUrl:        `shop-${shopSlug}.chotdon.ai`,
      createdAt:      new Date().toISOString().slice(0, 10),
      totalShops:     0,
      totalOrders:    0,
      representative: hoTen,
      phone:          sdt,
      address:        [soNha, tinhThanh].filter(Boolean).join(', '),
      email:          '',
    })
    navigate('/super-admin/agencies')
  }

  return (
    <ConfigProvider theme={superAdminTheme}>
      <div style={{ background: '#F9FAFB', minHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto', padding: '0 80px' }}>

          {/* Page heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 0' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, padding: 0, flexShrink: 0,
              }}
            >
              <ArrowLeftOutlined style={{ fontSize: 20, color: C_TEXT_PRIMARY }} />
            </button>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
              Tạo đại lý mới
            </h1>
          </div>

          {/* Form cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 24 }}>

            {/* ── Section 1: Thông tin cơ bản ── */}
            <FormCard title="Thông tin cơ bản">
              {/* Row: tên đại lý + mã đại lý */}
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <FieldLabel>Tên đại lý</FieldLabel>
                  <TextInput value={tenDaiLy} onChange={setTenDaiLy} placeholder="Tên đại lý" />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <FieldLabel>Mã đại lý</FieldLabel>
                  <TextInput value={maDaiLy || '—'} disabled />
                </div>
              </div>

              <InputField
                label="Họ tên chủ đại lý"
                value={hoTen}
                onChange={setHoTen}
                placeholder="Họ tên chủ đại lý"
              />
              <InputField
                label="Số điện thoại"
                value={sdt}
                onChange={setSdt}
                placeholder="Số điện thoại"
              />

              {/* Địa chỉ — 2 sub-inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <FieldLabel>Địa chỉ</FieldLabel>
                <TextInput value={soNha} onChange={setSoNha} placeholder="Số nhà, tên đường" />
                <div style={{
                  background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
                  padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <input
                    value={tinhThanh}
                    onChange={(e) => setTinhThanh(e.target.value)}
                    placeholder="Tỉnh/Thành, Phường/Xã"
                    style={{
                      flex: 1, border: 'none', outline: 'none', fontSize: 14,
                      color: tinhThanh ? C_TEXT_PRIMARY : C_TEXT_DISABLED,
                      background: 'transparent', lineHeight: '20px',
                    }}
                  />
                  <DownOutlined style={{ fontSize: 12, color: C_TEXT_SECONDARY, flexShrink: 0 }} />
                </div>
              </div>
            </FormCard>

            {/* ── Section 2: Cấu hình trang quản trị ── */}
            <FormCard title="Cấu hình trang quản trị của đại lý">
              <UrlField
                label="URL trang quản trị của đại lý"
                prefix="https://admin-"
                slug={adminSlug}
                onSlugChange={setAdminSlug}
                suffix=".chotdon.ai"
              />

              {/* Tên đăng nhập — read-only (= SĐT) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <FieldLabel>Tên đăng nhập của đại lý</FieldLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    flex: 1, background: '#fff', border: `1px solid ${C_BORDER}`,
                    borderRadius: 6, padding: '6px 12px',
                  }}>
                    <span style={{ fontSize: 14, color: sdt ? C_TEXT_PRIMARY : C_TEXT_DISABLED, lineHeight: '20px' }}>
                      {sdt || 'Chưa nhập số điện thoại'}
                    </span>
                  </div>
                  <CopyBtn value={sdt} />
                </div>
              </div>

              <PasswordField
                label="Mật khẩu của đại lý"
                value={matKhau}
                onChange={setMatKhau}
              />
            </FormCard>

            {/* ── Section 3: Cấu hình trang shop ── */}
            <FormCard title="Cấu hình trang của shop">
              <UrlField
                label="URL trang của shop"
                prefix="https://shop-"
                slug={shopSlug}
                onSlugChange={setShopSlug}
                suffix=".chotdon.ai"
              />
            </FormCard>

            {/* Action row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 16 }}>
              <button
                onClick={handleCreate}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: C_ACTION, border: 'none', borderRadius: 6,
                  padding: '8px 12px', cursor: 'pointer',
                }}
              >
                <PlusOutlined style={{ color: '#fff', fontSize: 16 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: '20px', whiteSpace: 'nowrap' }}>
                  Tạo mới
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}
