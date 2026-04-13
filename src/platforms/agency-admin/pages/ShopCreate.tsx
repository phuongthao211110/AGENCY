import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DownOutlined,
} from '@ant-design/icons'

const C_ACTION         = '#FF5200'
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_LABEL     = '#4B5563'
const C_TEXT_SECONDARY = '#6B7280'
const C_BORDER         = '#E5E7EB'
const C_BG_DISABLED    = '#F3F4F6'
const C_BG_FORM        = '#F9FAFB'
const C_PLACEHOLDER    = '#9CA3AF'

function generateShopCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'SHOP'
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
  return code
}

type FormState = {
  tenShop: string
  hoTen: string
  sdt: string
  soNha: string
  tinhThanh: string
  username: string
  password: string
}

function InputField({
  label, placeholder, value, onChange, disabled = false,
}: {
  label: string; placeholder: string; value: string
  onChange?: (v: string) => void; disabled?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      <span style={{ fontSize: 14, color: C_TEXT_LABEL, lineHeight: '20px' }}>{label}</span>
      <div style={{
        background: disabled ? C_BG_DISABLED : '#fff',
        border: `1px solid ${C_BORDER}`, borderRadius: 6,
        padding: '6px 12px', display: 'flex', alignItems: 'center',
      }}>
        <input
          value={value}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 14,
            color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px',
          }}
        />
      </div>
    </div>
  )
}

export default function ShopCreate() {
  const navigate = useNavigate()
  const [maShop]       = useState(generateShopCode)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState<FormState>({
    tenShop: '', hoTen: '', sdt: '', soNha: '', tinhThanh: '', username: '', password: '',
  })

  const set = (key: keyof FormState) => (v: string) => setForm(f => ({ ...f, [key]: v }))
  const copy = (text: string) => navigator.clipboard.writeText(text).catch(() => {})

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: `1px solid ${C_BORDER}`,
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)',
  }

  const inputBoxStyle: React.CSSProperties = {
    background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
    padding: '6px 12px', display: 'flex', alignItems: 'center',
  }

  const copyBtnStyle: React.CSSProperties = {
    display: 'flex', gap: 8, alignItems: 'center',
    background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
    padding: '6px 12px', cursor: 'pointer', flexShrink: 0,
  }

  const inputStyle: React.CSSProperties = {
    flex: 1, border: 'none', outline: 'none', fontSize: 14,
    color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px',
  }

  return (
    <div style={{
      background: C_BG_FORM,
      minHeight: 'calc(100vh - 40px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center',
        width: '100%', maxWidth: 1024,
        padding: '24px 80px', boxSizing: 'border-box',
      }}>
        <button
          onClick={() => navigate('/agency-admin/shops')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeftOutlined style={{ fontSize: 20, color: C_TEXT_PRIMARY }} />
        </button>
        <span style={{ flex: 1, fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '28px' }}>
          Tạo shop mới
        </span>
      </div>

      {/* ── Form sections ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        width: '100%', maxWidth: 1024,
        padding: '0 80px', boxSizing: 'border-box',
      }}>

        {/* Section 1: Thông tin cơ bản */}
        <div style={cardStyle}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
            Thông tin cơ bản
          </span>

          {/* Tên shop + Mã shop */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, color: C_TEXT_LABEL, lineHeight: '20px' }}>Tên shop</span>
              <div style={inputBoxStyle}>
                <input value={form.tenShop} onChange={e => set('tenShop')(e.target.value)}
                  placeholder="Tên shop" style={inputStyle} />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 14, color: C_TEXT_LABEL, lineHeight: '20px' }}>Mã shop</span>
              <div style={{ ...inputBoxStyle, background: C_BG_DISABLED }}>
                <input value={maShop} disabled style={inputStyle} />
              </div>
            </div>
          </div>

          <InputField label="Họ tên chủ shop" placeholder="Họ tên chủ shop"
            value={form.hoTen} onChange={set('hoTen')} />
          <InputField label="Số điện thoại" placeholder="Số điện thoại"
            value={form.sdt} onChange={set('sdt')} />

          {/* Địa chỉ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 14, color: C_TEXT_LABEL, lineHeight: '20px' }}>Địa chỉ</span>
            <div style={inputBoxStyle}>
              <input value={form.soNha} onChange={e => set('soNha')(e.target.value)}
                placeholder="Số nhà, tên đường" style={inputStyle} />
            </div>
            <div style={{ ...inputBoxStyle, gap: 8, cursor: 'pointer' }}>
              <span style={{
                flex: 1, fontSize: 14, lineHeight: '20px',
                color: form.tinhThanh ? C_TEXT_PRIMARY : C_PLACEHOLDER,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {form.tinhThanh || 'Tỉnh/Thành, Quận/Huyện'}
              </span>
              <DownOutlined style={{ fontSize: 14, color: C_TEXT_SECONDARY, flexShrink: 0 }} />
            </div>
          </div>
        </div>

        {/* Section 2: Cấu hình tài khoản */}
        <div style={cardStyle}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
            Cấu hình tài khoản shop đăng nhập
          </span>

          {/* Tên đăng nhập */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 14, color: C_TEXT_LABEL, lineHeight: '20px' }}>Tên đăng nhập của shop</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <div style={{ ...inputBoxStyle, flex: 1 }}>
                <input value={form.username} onChange={e => set('username')(e.target.value)}
                  placeholder="Tên đăng nhập của shop" style={inputStyle} />
              </div>
              <button onClick={() => copy(form.username)} style={copyBtnStyle}>
                <CopyOutlined style={{ fontSize: 16, color: C_TEXT_PRIMARY }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap' }}>
                  Sao chép
                </span>
              </button>
            </div>
          </div>

          {/* Mật khẩu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 14, color: C_TEXT_LABEL, lineHeight: '20px' }}>Mật khẩu của shop</span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <div style={{ ...inputBoxStyle, flex: 1, gap: 8 }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password')(e.target.value)}
                  placeholder="Mật khẩu của shop"
                  style={inputStyle}
                />
                <button
                  onClick={() => setShowPwd(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}
                >
                  {showPwd
                    ? <EyeOutlined style={{ fontSize: 16, color: C_TEXT_SECONDARY }} />
                    : <EyeInvisibleOutlined style={{ fontSize: 16, color: C_TEXT_SECONDARY }} />
                  }
                </button>
              </div>
              <button onClick={() => copy(form.password)} style={copyBtnStyle}>
                <CopyOutlined style={{ fontSize: 16, color: C_TEXT_PRIMARY }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '20px', whiteSpace: 'nowrap' }}>
                  Sao chép
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 16 }}>
          <button
            onClick={() => navigate('/agency-admin/shops')}
            style={{
              display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center',
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
  )
}
