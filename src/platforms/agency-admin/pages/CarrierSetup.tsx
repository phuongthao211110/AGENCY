import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusOutlined,
  ApiOutlined,
  AppstoreOutlined,
  DollarOutlined,
  SearchOutlined,
  DisconnectOutlined,
  CloseOutlined,
} from '@ant-design/icons'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_LINK           = '#3B82F6'
const C_BORDER         = '#E5E7EB'
const C_ACTION         = '#FF5200'
const C_BG_HEADER      = '#F3F4F6'

// ─── Tab bar ──────────────────────────────────────────────────────────────────
type Tab = 'connect' | 'services' | 'pricing'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'connect',  label: 'Kết nối NVC', icon: <ApiOutlined /> },
  { key: 'services', label: 'Dịch vụ',     icon: <AppstoreOutlined /> },
  { key: 'pricing',  label: 'Bảng giá',    icon: <DollarOutlined /> },
]


// ─── Tab: Kết nối NVC ─────────────────────────────────────────────────────────
const GHN_SHOPS = [
  { shopId: '5148899', name: 'Shop Thời Trang ABC',   phone: '0901234567', connectedAt: '10/01/2025' },
  { shopId: '5148900', name: 'Shop Điện Tử XYZ',      phone: '0912345678', connectedAt: '15/01/2025' },
  { shopId: '5148901', name: 'Shop Mỹ Phẩm Hà Nội',  phone: '0923456789', connectedAt: '20/02/2025' },
  { shopId: '5148902', name: 'Shop Giày Dép Fashion', phone: '0934567890', connectedAt: '05/03/2025' },
  { shopId: '5148903', name: 'Shop Đồ Gia Dụng 365', phone: '0945678901', connectedAt: '12/03/2025' },
]

// ─── Add Shop ID Modal (2 steps) ─────────────────────────────────────────────
const OTP_LENGTH     = 6
const RESEND_SECONDS = 600

function AddShopModal({ onClose }: { onClose: () => void }) {
  const [step, setStep]       = useState<'form' | 'otp'>('form')
  const [phone, setPhone]     = useState('')
  const [clientId, setClientId] = useState('')
  const [otp, setOtp]         = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const otpRefs = useRef<(HTMLInputElement | null)[]>(Array(OTP_LENGTH).fill(null))

  const startCountdown = () => {
    setCountdown(RESEND_SECONDS)
    const interval = setInterval(() => {
      setCountdown((c) => { if (c <= 1) { clearInterval(interval); return 0 } return c - 1 })
    }, 1000)
  }

  const handleConnect = () => {
    setStep('otp')
    startCountdown()
    setTimeout(() => otpRefs.current[0]?.focus(), 50)
  }

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]; next[index] = digit; setOtp(next)
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  const fmtCountdown = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')} phút` : `${sec} giây`
  }

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 12px',
    fontSize: 14, color: C_TEXT_PRIMARY, outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -3px rgba(0,0,0,0.04)', padding: 40, width: 480, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C_TEXT_SECONDARY, fontSize: 14, borderRadius: 4 }}>
          <CloseOutlined />
        </button>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 22, fontWeight: 600, color: C_TEXT_PRIMARY }}>Kết nối tài khoản </span>
          <span style={{ fontSize: 22, fontWeight: 600, color: C_ACTION }}>Giao Hàng Nhanh</span>
        </div>

        {step === 'form' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 14, color: C_TEXT_LABEL }}>SĐT tài khoản GHN</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="SĐT tài khoản GHN" style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
                onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 14, color: C_TEXT_LABEL }}>Client ID GHN</label>
              <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Client ID GHN" style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
                onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)} />
            </div>
            <button onClick={handleConnect} style={{ width: '100%', padding: '9px 12px', background: C_ACTION, border: 'none', borderRadius: 6, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
              Kết nối
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ textAlign: 'center', fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
              <div>Vui lòng nhập mã OTP đã được gửi về số điện thoại</div>
              <div>
                <span>{phone || '0909000999'} </span>
                <span onClick={() => setStep('form')} style={{ fontWeight: 600, color: C_ACTION, cursor: 'pointer' }}>Thay đổi số điện thoại</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              {otp.map((digit, i) => (
                <input key={i} ref={(el) => { otpRefs.current[i] = el }} value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  maxLength={1} inputMode="numeric"
                  style={{ width: 56, height: 56, border: `1px solid ${digit ? '#FFA274' : C_BORDER}`, borderRadius: 6, textAlign: 'center', fontSize: 20, fontWeight: 600, color: C_TEXT_PRIMARY, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = digit ? '#FFA274' : C_BORDER)} />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button style={{ width: '100%', padding: '9px 12px', background: C_ACTION, border: 'none', borderRadius: 6, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Xác nhận</button>
              <button disabled={countdown > 0} onClick={() => countdown === 0 && startCountdown()}
                style={{ width: '100%', padding: '9px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, color: countdown > 0 ? '#9CA3AF' : C_TEXT_PRIMARY, fontSize: 14, fontWeight: 600, cursor: countdown > 0 ? 'default' : 'pointer' }}>
                {countdown > 0 ? `Gửi lại mã OTP (Sau ${fmtCountdown(countdown)})` : 'Gửi lại mã OTP'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Kết nối NVC ─────────────────────────────────────────────────────────
function TabConnect() {
  const [search, setSearch]     = useState('')
  const [showModal, setShowModal] = useState(false)
  const [hovered, setHovered]   = useState<string | null>(null)

  const filtered = GHN_SHOPS.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.shopId.includes(search) || s.phone.includes(search)
  )

  return (
    <>
      {showModal && <AddShopModal onClose={() => setShowModal(false)} />}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>
          Danh sách Shop ID ({GHN_SHOPS.length})
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6 }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm"
              style={{ border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px', width: 200 }} />
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}>
            <PlusOutlined style={{ color: '#fff', fontSize: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Thêm Shop ID</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '0 16px' }}>
      {/* Table header */}
      <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
        {[
          { label: 'Tên cửa hàng', flex: '2 0 0', minWidth: 200 },
          { label: 'Shop ID',      flex: '1 0 0', minWidth: 120 },
          { label: 'Số điện thoại', flex: '1 0 0', minWidth: 140 },
          { label: 'Ngày kết nối', flex: '1 0 0', minWidth: 120 },
          { label: '',             flex: '0 0 60px', minWidth: 60 },
        ].map((col, i) => (
          <div key={i} style={{ display: 'flex', flex: col.flex, alignItems: 'center', minWidth: col.minWidth, padding: '6px 8px' }}>
            <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{col.label}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: C_BORDER }} />

      {/* Rows */}
      {filtered.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>Không tìm thấy kết quả</div>
      ) : (
        filtered.map((s) => (
          <React.Fragment key={s.shopId}>
            <div
              style={{ display: 'flex', alignItems: 'center', background: hovered === s.shopId ? '#FAFAFA' : '#fff', transition: 'background 0.1s' }}
              onMouseEnter={() => setHovered(s.shopId)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ flex: '2 0 0', minWidth: 200, padding: '6px 8px' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px' }}>{s.name}</span>
              </div>
              <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px' }}>
                <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, fontFamily: 'monospace', lineHeight: '20px' }}>{s.shopId}</span>
              </div>
              <div style={{ flex: '1 0 0', minWidth: 140, padding: '6px 8px' }}>
                <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{s.phone}</span>
              </div>
              <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px' }}>
                <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{s.connectedAt}</span>
              </div>
              <div style={{ flex: '0 0 60px', minWidth: 60, padding: '6px 8px' }}>
                <button title="Ngắt kết nối" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: '1px solid #FCA5A5', borderRadius: 6, background: '#FFF5F5', color: '#EF4444', fontSize: 14, cursor: 'pointer' }}>
                  <DisconnectOutlined />
                </button>
              </div>
            </div>
            <div style={{ height: 1, background: C_BORDER }} />
          </React.Fragment>
        ))
      )}
      </div>{/* /Table */}
    </>
  )
}

// ─── Tab: Dịch vụ ─────────────────────────────────────────────────────────────
const SERVICE_PACKAGES = [
  { id: 'ghn-express',  name: 'Giao hàng nhanh',     nvcCode: 'CHUYENNHANH', carrier: 'GHN', maxWeight: '20 kg', deliveryZones: 'Toàn quốc', enabled: true  },
  { id: 'ghn-standard', name: 'Giao hàng tiêu chuẩn', nvcCode: 'TIETKIEM',   carrier: 'GHN', maxWeight: '30 kg', deliveryZones: 'Toàn quốc', enabled: true  },
  { id: 'ghn-bulky',    name: 'Hàng cồng kềnh',       nvcCode: 'HANGCANANG', carrier: 'GHN', maxWeight: '50 kg', deliveryZones: 'HCM, HN',   enabled: false },
]

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <div style={{ width: 36, height: 20, borderRadius: 10, background: enabled ? C_ACTION : '#D1D5DB', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: enabled ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
    </div>
  )
}

function NvcCodeBadge({ code }: { code: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, background: '#F3F4F6', color: C_TEXT_PRIMARY, fontSize: 12, fontFamily: 'monospace', fontWeight: 500, letterSpacing: 0.3 }}>
      {code}
    </span>
  )
}

// ─── Create Service Modal ─────────────────────────────────────────────────────
type NewServiceData = { code: string; name: string; desc: string; shopId: string }

function CreateServiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: (data: NewServiceData) => void }) {
  const [code, setCode]         = useState('')
  const [name, setName]         = useState('')
  const [desc, setDesc]         = useState('')
  const [shopId, setShopId]     = useState(GHN_SHOPS[0].shopId)

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 12px',
    fontSize: 14, color: C_TEXT_PRIMARY, outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  const handleSubmit = () => {
    if (!code.trim() || !name.trim()) return
    onCreated({ code: code.trim(), name: name.trim(), desc, shopId })
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -3px rgba(0,0,0,0.04)', width: 480, position: 'relative', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY }}>Tạo gói dịch vụ mới</span>
          <button onClick={onClose} style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C_TEXT_SECONDARY, fontSize: 14, borderRadius: 4 }}>
            <CloseOutlined />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 14, color: C_TEXT_LABEL }}>Mã gói <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="VD: GHN_EXPRESS" style={{ ...inputStyle, fontFamily: 'monospace' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
                onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 14, color: C_TEXT_LABEL }}>Tên gói <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Giao hàng nhanh" style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
                onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 14, color: C_TEXT_LABEL }}>Mô tả</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả ngắn về gói dịch vụ..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '20px' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#FFA274')}
              onBlur={(e) => (e.currentTarget.style.borderColor = C_BORDER)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 14, color: C_TEXT_LABEL }}>Kết nối Shop ID GHN</label>
            <select value={shopId} onChange={(e) => setShopId(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer', background: '#fff' }}>
              {GHN_SHOPS.map((s) => (
                <option key={s.shopId} value={s.shopId}>
                  {s.shopId} — {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: `1px solid ${C_BORDER}` }}>
          <button onClick={onClose}
            style={{ padding: '8px 16px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_TEXT_PRIMARY, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Huỷ
          </button>
          <button onClick={handleSubmit} disabled={!code.trim() || !name.trim()}
            style={{ padding: '8px 16px', border: 'none', borderRadius: 6, background: !code.trim() || !name.trim() ? '#F3F4F6' : C_ACTION, color: !code.trim() || !name.trim() ? '#9CA3AF' : '#fff', fontSize: 14, fontWeight: 600, cursor: !code.trim() || !name.trim() ? 'default' : 'pointer' }}>
            Tạo gói dịch vụ
          </button>
        </div>
      </div>
    </div>
  )
}

function TabServices() {
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const cols = [
    { label: 'Gói dịch vụ',    flex: '2 0 0', minWidth: 180 },
    { label: 'Mã dịch vụ NVC', flex: '1.5 0 0', minWidth: 150 },
    { label: 'NVC',            flex: '1 0 0', minWidth: 80  },
    { label: 'Tải trọng',      flex: '1 0 0', minWidth: 100 },
    { label: 'Vùng giao',      flex: '1 0 0', minWidth: 120 },
    { label: 'Kích hoạt',      flex: '0 0 80px', minWidth: 80 },
  ]

  return (
    <>
      {showCreateModal && (
        <CreateServiceModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(data) => {
            setShowCreateModal(false)
            navigate(`/agency-admin/carrier-setup/services/${data.code}`, { state: { isNew: true, ...data } })
          }}
        />
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 16px', flexShrink: 0 }}>
        <button onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}>
          <PlusOutlined style={{ color: '#fff', fontSize: 14 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Tạo mới dịch vụ</span>
        </button>
      </div>

      {/* Table */}
      <div style={{ padding: '0 16px' }}>
      {/* Table header */}
      <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
        {cols.map((col, i) => (
          <div key={i} style={{ display: 'flex', flex: col.flex, alignItems: 'center', minWidth: col.minWidth, padding: '6px 8px' }}>
            <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{col.label}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: C_BORDER }} />

      {/* Rows */}
      {SERVICE_PACKAGES.map((s) => (
        <React.Fragment key={s.id}>
          <div
            onClick={() => navigate(`/agency-admin/carrier-setup/services/${s.id}`)}
            style={{ display: 'flex', alignItems: 'center', background: hovered === s.id ? '#FAFAFA' : '#fff', transition: 'background 0.1s', cursor: 'pointer' }}
            onMouseEnter={() => setHovered(s.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ flex: '2 0 0', minWidth: 180, padding: '6px 8px' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px' }}>{s.name}</span>
            </div>
            <div style={{ flex: '1.5 0 0', minWidth: 150, padding: '6px 8px' }}>
              <NvcCodeBadge code={s.nvcCode} />
            </div>
            <div style={{ flex: '1 0 0', minWidth: 80, padding: '6px 8px' }}>
              <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{s.carrier}</span>
            </div>
            <div style={{ flex: '1 0 0', minWidth: 100, padding: '6px 8px' }}>
              <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{s.maxWeight}</span>
            </div>
            <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px' }}>
              <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{s.deliveryZones}</span>
            </div>
            <div style={{ flex: '0 0 80px', minWidth: 80, padding: '6px 8px' }}>
              <Toggle enabled={s.enabled} />
            </div>
          </div>
          <div style={{ height: 1, background: C_BORDER }} />
        </React.Fragment>
      ))}
      </div>{/* /Table */}
    </>
  )
}

// ─── Tab: Bảng giá ────────────────────────────────────────────────────────────
const SERVICE_PACKAGE_NAMES = ['Giao hàng nhanh', 'Giao hàng tiêu chuẩn', 'Hàng cồng kềnh']

const PRICE_CONFIGS = [
  { id: 'pc-1', servicePackage: 'Giao hàng nhanh',     route: 'Nội tỉnh',  zone: 'Nội thành',  baseWeight: 0.5, basePrice: 15000, overageTierCount: 3, surchargeCount: 3 },
  { id: 'pc-2', servicePackage: 'Giao hàng nhanh',     route: 'Nội tỉnh',  zone: 'Ngoại thành', baseWeight: 0.5, basePrice: 20000, overageTierCount: 3, surchargeCount: 3 },
  { id: 'pc-3', servicePackage: 'Giao hàng nhanh',     route: 'Liên tỉnh', zone: 'Cùng vùng',  baseWeight: 0.5, basePrice: 25000, overageTierCount: 4, surchargeCount: 3 },
  { id: 'pc-4', servicePackage: 'Giao hàng nhanh',     route: 'Liên tỉnh', zone: 'Khác vùng',  baseWeight: 0.5, basePrice: 30000, overageTierCount: 4, surchargeCount: 3 },
  { id: 'pc-5', servicePackage: 'Giao hàng tiêu chuẩn', route: 'Nội tỉnh', zone: 'Nội thành',  baseWeight: 0.5, basePrice: 12000, overageTierCount: 3, surchargeCount: 3 },
  { id: 'pc-6', servicePackage: 'Giao hàng tiêu chuẩn', route: 'Liên tỉnh', zone: 'Cùng vùng', baseWeight: 0.5, basePrice: 20000, overageTierCount: 3, surchargeCount: 3 },
  { id: 'pc-7', servicePackage: 'Hàng cồng kềnh',      route: 'Nội tỉnh',  zone: 'Nội thành',  baseWeight: 1,   basePrice: 25000, overageTierCount: 2, surchargeCount: 2 },
]

function CountBadge({ count, color }: { count: number; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 22, height: 22, borderRadius: 11, background: color + '1A', color, fontSize: 12, fontWeight: 600, padding: '0 6px' }}>
      {count}
    </span>
  )
}

const fmtVND = (n: number) => n.toLocaleString('vi-VN') + ' đ'

function TabPricing() {
  const [selectedPackage, setSelectedPackage] = useState(SERVICE_PACKAGE_NAMES[0])
  const [hovered, setHovered] = useState<string | null>(null)

  const filtered = PRICE_CONFIGS.filter((c) => c.servicePackage === selectedPackage)

  const cols = [
    { label: 'Tuyến',         flex: '1 0 0',    minWidth: 100 },
    { label: 'Khu vực',       flex: '1.2 0 0',  minWidth: 120 },
    { label: 'TL cơ bản',     flex: '1 0 0',    minWidth: 100 },
    { label: 'Giá cơ bản',    flex: '1 0 0',    minWidth: 110 },
    { label: 'Vượt cân',      flex: '0 0 80px', minWidth: 80  },
    { label: 'Phụ phí',       flex: '0 0 80px', minWidth: 80  },
    { label: '',              flex: '0 0 80px', minWidth: 80  },
  ]

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 0, border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
          {SERVICE_PACKAGE_NAMES.map((pkg) => (
            <div key={pkg} onClick={() => setSelectedPackage(pkg)}
              style={{ padding: '6px 14px', fontSize: 13, fontWeight: selectedPackage === pkg ? 600 : 400, color: selectedPackage === pkg ? C_ACTION : C_TEXT_SECONDARY, background: selectedPackage === pkg ? '#FFF4ED' : '#fff', cursor: 'pointer', borderRight: `1px solid ${C_BORDER}`, userSelect: 'none', transition: 'background 0.15s, color 0.15s' }}>
              {pkg}
            </div>
          ))}
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          <PlusOutlined style={{ color: '#fff', fontSize: 14 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Thêm cấu hình giá</span>
        </button>
      </div>

      {/* Table */}
      <div style={{ padding: '0 16px' }}>
      {/* Table header */}
      <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
        {cols.map((col, i) => (
          <div key={i} style={{ display: 'flex', flex: col.flex, alignItems: 'center', minWidth: col.minWidth, padding: '6px 8px' }}>
            <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{col.label}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 1, background: C_BORDER }} />

      {/* Rows */}
      {filtered.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>Chưa có cấu hình giá</div>
      ) : (
        filtered.map((cfg) => (
          <React.Fragment key={cfg.id}>
            <div
              style={{ display: 'flex', alignItems: 'center', background: hovered === cfg.id ? '#FAFAFA' : '#fff', transition: 'background 0.1s' }}
              onMouseEnter={() => setHovered(cfg.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ flex: '1 0 0', minWidth: 100, padding: '6px 8px' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px' }}>{cfg.route}</span>
              </div>
              <div style={{ flex: '1.2 0 0', minWidth: 120, padding: '6px 8px' }}>
                <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{cfg.zone}</span>
              </div>
              <div style={{ flex: '1 0 0', minWidth: 100, padding: '6px 8px' }}>
                <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{cfg.baseWeight} kg</span>
              </div>
              <div style={{ flex: '1 0 0', minWidth: 110, padding: '6px 8px' }}>
                <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{fmtVND(cfg.basePrice)}</span>
              </div>
              <div style={{ flex: '0 0 80px', minWidth: 80, padding: '6px 8px' }}>
                <CountBadge count={cfg.overageTierCount} color="#3B82F6" />
              </div>
              <div style={{ flex: '0 0 80px', minWidth: 80, padding: '6px 8px' }}>
                <CountBadge count={cfg.surchargeCount} color="#F59E0B" />
              </div>
              <div style={{ flex: '0 0 80px', minWidth: 80, padding: '6px 8px' }}>
                <button style={{ padding: '4px 10px', borderRadius: 5, border: `1px solid ${C_BORDER}`, background: '#fff', color: C_TEXT_PRIMARY, fontSize: 12, cursor: 'pointer' }}>Chi tiết</button>
              </div>
            </div>
            <div style={{ height: 1, background: C_BORDER }} />
          </React.Fragment>
        ))
      )}
      </div>{/* /Table */}
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CarrierSetup() {
  const [activeTab, setActiveTab] = useState<Tab>('connect')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
            Thiết lập nhà vận chuyển
          </h1>
          <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
            Kết nối và cấu hình các nhà vận chuyển cho đại lý
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C_BORDER}`, padding: '0 16px', flexShrink: 0 }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <div key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 14, fontWeight: 600, color: isActive ? C_ACTION : C_TEXT_SECONDARY, cursor: 'pointer', borderBottom: isActive ? `2px solid ${C_ACTION}` : '2px solid transparent', marginBottom: -1, userSelect: 'none', transition: 'color 0.15s' }}>
              <span style={{ fontSize: 15 }}>{tab.icon}</span>
              {tab.label}
            </div>
          )
        })}
      </div>

      {/* Tab content — scrollable */}
      <div style={{ flex: '1 0 0', overflowY: 'auto' }}>
        {activeTab === 'connect'  && <TabConnect />}
        {activeTab === 'services' && <TabServices />}
        {activeTab === 'pricing'  && <TabPricing />}
      </div>
    </div>
  )
}
