import React, { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  PlusOutlined,
  ApiOutlined,
  AppstoreOutlined,
  DollarOutlined,
  SearchOutlined,
  DisconnectOutlined,
  CloseOutlined,
  RightOutlined,
} from '@ant-design/icons'
import allServices from '../../../mock-data/services.json'
import allPriceTables from '../../../mock-data/pricing.json'

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
  { key: 'connect',  label: 'Kết nối GHN', icon: <ApiOutlined /> },
  { key: 'services', label: 'Dịch vụ',     icon: <AppstoreOutlined /> },
  { key: 'pricing',  label: 'Bảng giá',    icon: <DollarOutlined /> },
]


// ─── Tab: Kết nối GHN ─────────────────────────────────────────────────────────
type GoiCuoc = { loai: string; id: string; ten: string }

const GHN_SHOPS: { shopId: string; name: string; phone: string; connectedAt: string; goiCuoc: GoiCuoc[] }[] = [
  { shopId: '5148899', name: 'Shop Thời Trang ABC',   phone: '0901234567', connectedAt: '10/01/2025', goiCuoc: [{ loai: 'Hàng nhẹ', id: '380', ten: 'CAM KẾT TỪ 2,000 ĐƠN - 17,500Đ CHO ĐƠN TỪ 1KG' }, { loai: 'Hàng nặng', id: '150', ten: 'Bảng giá Hàng nặng XIAOMI for a Chính' }] },
  { shopId: '5148900', name: 'Shop Điện Tử XYZ',      phone: '0912345678', connectedAt: '15/01/2025', goiCuoc: [{ loai: 'Hàng nhẹ', id: '412', ten: 'CAM KẾT TỪ 1,000 ĐƠN - 20,000Đ CHO ĐƠN TỪ 1KG' }, { loai: 'Hàng nặng', id: '162', ten: 'Bảng giá Hàng nặng Điện Tử Standard' }] },
  { shopId: '5148901', name: 'Shop Mỹ Phẩm Hà Nội',  phone: '0923456789', connectedAt: '20/02/2025', goiCuoc: [{ loai: 'Hàng nặng', id: '201', ten: 'Bảng giá Hàng nặng Mỹ Phẩm Standard' }, { loai: 'Hàng nhẹ', id: '395', ten: 'CAM KẾT TỪ 500 ĐƠN - 22,000Đ CHO ĐƠN TỪ 1KG' }] },
  { shopId: '5148902', name: 'Shop Giày Dép Fashion', phone: '0934567890', connectedAt: '05/03/2025', goiCuoc: [{ loai: 'Hàng nhẹ', id: '367', ten: 'CAM KẾT TỪ 3,000 ĐƠN - 15,000Đ CHO ĐƠN TỪ 1KG' }, { loai: 'Hàng nặng', id: '178', ten: 'Bảng giá Hàng nặng Giày Dép Standard' }] },
  { shopId: '5148903', name: 'Shop Đồ Gia Dụng 365',  phone: '0945678901', connectedAt: '12/03/2025', goiCuoc: [{ loai: 'Hàng nhẹ', id: '421', ten: 'CAM KẾT TỪ 500 ĐƠN - 19,500Đ CHO ĐƠN TỪ 1KG' }, { loai: 'Hàng nặng', id: '195', ten: 'Bảng giá Hàng nặng Gia Dụng Standard' }] },
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

// ─── Tab: Kết nối GHN ─────────────────────────────────────────────────────────
function TabConnect() {
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [hovered, setHovered]     = useState<string | null>(null)
  const [expanded, setExpanded]   = useState<Set<string>>(new Set())

  const toggleExpand = (shopId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(shopId) ? next.delete(shopId) : next.add(shopId)
      return next
    })
  }

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
            { label: '',             flex: '0 0 32px', minWidth: 32 },
            { label: 'Cửa hàng GHN',  flex: '2 0 0',   minWidth: 200 },
            { label: 'Gói cước GHN', flex: '1 0 0',   minWidth: 100 },
            { label: 'Shop ID GHN',  flex: '1 0 0',   minWidth: 120 },
            { label: 'Số điện thoại',flex: '1 0 0',   minWidth: 140 },
            { label: 'Ngày kết nối', flex: '1 0 0',   minWidth: 120 },
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
          filtered.map((s) => {
            const goiCuoc = s.goiCuoc
            const isExpanded = expanded.has(s.shopId)
            const hasGoiCuoc = goiCuoc.length > 0

            return (
              <React.Fragment key={s.shopId}>
                {/* Main row */}
                <div
                  style={{ display: 'flex', alignItems: 'center', background: hovered === s.shopId ? '#FAFAFA' : '#fff', transition: 'background 0.1s' }}
                  onMouseEnter={() => setHovered(s.shopId)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Expand toggle */}
                  <div style={{ flex: '0 0 32px', minWidth: 32, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button
                      onClick={() => toggleExpand(s.shopId)}
                      title={isExpanded ? 'Thu gọn' : 'Xem gói cước'}
                      style={{ width: 20, height: 20, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: C_TEXT_SECONDARY, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >
                      <RightOutlined style={{ fontSize: 11 }} />
                    </button>
                  </div>
                  <div style={{ flex: '2 0 0', minWidth: 200, padding: '6px 8px' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px' }}>{s.name}</span>
                  </div>
                  <div style={{ flex: '1 0 0', minWidth: 100, padding: '6px 8px' }}>
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
                      {goiCuoc.length} gói cước
                    </span>
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

                {/* Expanded: gói cước list */}
                {isExpanded && hasGoiCuoc && (
                  <div>
                    {goiCuoc.map((gc: GoiCuoc) => (
                      <div
                        key={gc.id}
                        style={{ padding: '7px 8px 7px 40px' }}
                      >
                        <div style={{ fontSize: 11, color: C_TEXT_SECONDARY, marginBottom: 2 }}>{gc.loai}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY }}>{gc.id} — {gc.ten}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ height: 1, background: C_BORDER }} />
              </React.Fragment>
            )
          })
        )}
      </div>{/* /Table */}
    </>
  )
}

// ─── Tab: Dịch vụ ─────────────────────────────────────────────────────────────

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <div style={{ width: 36, height: 20, borderRadius: 10, background: enabled ? C_ACTION : '#D1D5DB', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: enabled ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
    </div>
  )
}



function TabServices() {
  const navigate = useNavigate()
  const [hovered, setHovered]     = useState<string | null>(null)
  const [shopHover, setShopHover] = useState<string | null>(null)
  const [search, setSearch]       = useState('')

  const filtered = allServices.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  )

  const cols = [
    { label: 'Dịch vụ',      flex: '2 0 0',    minWidth: 200 },
    { label: 'Gói cước GHN', flex: '2 0 0',    minWidth: 200 },
    { label: 'Kích hoạt',   flex: '0 0 90px', minWidth: 90  },
  ]

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>
          Danh sách dịch vụ ({filtered.length})
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6 }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm"
              style={{ border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px', width: 200 }} />
          </div>
          <button onClick={() => navigate('/agency-admin/carrier-setup/services/new', { state: { isNew: true } })}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}>
            <PlusOutlined style={{ color: '#fff', fontSize: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Tạo mới dịch vụ</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
          {cols.map((col, i) => (
            <div key={i} style={{ display: 'flex', flex: col.flex, alignItems: 'center', minWidth: col.minWidth, padding: '6px 8px' }}>
              <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{col.label}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: C_BORDER }} />

        {filtered.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>Không tìm thấy kết quả</div>
        ) : filtered.map((s) => {
          const shopIds: string[] = (s as any).ghnShopIds ?? []
          const allGoiCuoc = shopIds.flatMap(id => GHN_SHOPS.find(sh => sh.shopId === id)?.goiCuoc ?? [])
          return (
            <React.Fragment key={s.id}>
              <div
                onClick={() => navigate(`/agency-admin/carrier-setup/services/${s.id}`)}
                style={{ display: 'flex', alignItems: 'center', background: hovered === s.id ? '#FAFAFA' : '#fff', transition: 'background 0.1s', cursor: 'pointer', borderBottom: `1px solid ${C_BORDER}` }}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <div style={{ flex: '2 0 0', minWidth: 200, padding: '6px 8px' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px' }}>{s.name}</span>
                </div>

                {/* Gói cước GHN cell */}
                <div style={{ flex: '2 0 0', minWidth: 200, padding: '6px 8px', position: 'relative' }}
                  onMouseEnter={(e) => { e.stopPropagation(); setShopHover(s.id) }}
                  onMouseLeave={(e) => { e.stopPropagation(); setShopHover(null) }}
                >
                  {allGoiCuoc.length === 0 ? (
                    <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>—</span>
                  ) : allGoiCuoc.length === 1 ? (
                    <span style={{ fontSize: 13, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{allGoiCuoc[0].ten}</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 13, color: C_TEXT_PRIMARY, cursor: 'default' }}>
                        {allGoiCuoc.length} gói cước
                      </span>
                      {shopHover === s.id && (
                        <div style={{
                          position: 'absolute', top: '100%', left: 0, zIndex: 100,
                          background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 8,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.12)', padding: '6px 0', minWidth: 260,
                        }}>
                          {allGoiCuoc.map((gc, i) => (
                            <div key={i} style={{ padding: '6px 14px' }}>
                              <div style={{ fontSize: 11, color: C_TEXT_SECONDARY, marginBottom: 1 }}>{gc.loai}</div>
                              <div style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>{gc.ten}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div style={{ flex: '0 0 90px', minWidth: 90, padding: '6px 8px' }}>
                  <Toggle enabled={s.enabled} />
                </div>
              </div>
            </React.Fragment>
          )
        })}
      </div>
    </>
  )
}

// ─── Tab: Bảng giá ───────────────────────────────────────────────────────────
function TabPricing() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const [search, setSearch]   = useState('')

  const filtered = allPriceTables.filter(
    (pt) => pt.name.toLowerCase().includes(search.toLowerCase()) || (pt.description ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const cols = [
    { label: 'Tên bảng giá', flex: '2 0 0', minWidth: 200 },
    { label: 'Ngày tạo',     flex: '1 0 0', minWidth: 110 },
    { label: 'Mô tả',        flex: '3 0 0', minWidth: 180 },
  ]

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>
          Danh sách bảng giá ({filtered.length})
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6 }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm"
              style={{ border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px', width: 200 }} />
          </div>
          <button
            onClick={() => navigate('/agency-admin/carrier-setup/pricing/create')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}>
            <PlusOutlined style={{ color: '#fff', fontSize: 14 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Tạo bảng giá</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
          {cols.map((col, i) => (
            <div key={i} style={{ display: 'flex', flex: col.flex, alignItems: 'center', minWidth: col.minWidth, padding: '6px 8px' }}>
              <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{col.label}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: C_BORDER }} />

        {filtered.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>Không tìm thấy kết quả</div>
        ) : filtered.map((pt: any) => (
          <React.Fragment key={pt.id}>
            <div
              style={{ display: 'flex', alignItems: 'center', background: hovered === pt.id ? '#FAFAFA' : '#fff', transition: 'background 0.1s', borderBottom: `1px solid ${C_BORDER}` }}
              onMouseEnter={() => setHovered(pt.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ flex: '2 0 0', minWidth: 200, padding: '6px 8px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px' }}>{pt.name}</div>
              </div>
              <div style={{ flex: '1 0 0', minWidth: 110, padding: '6px 8px' }}>
                <span style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>
                  {pt.createdAt ? pt.createdAt.split('-').reverse().join('/') : '—'}
                </span>
              </div>
              <div style={{ flex: '3 0 0', minWidth: 180, padding: '6px 8px', overflow: 'hidden' }}>
                <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pt.description || ''}
                </span>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CarrierSetup() {
  const { tab } = useParams<{ tab?: string }>()
  const navigate = useNavigate()
  const activeTab: Tab = (tab === 'services' || tab === 'pricing') ? tab : 'connect'
  const setActiveTab = (t: Tab) => navigate(`/agency-admin/carrier-setup/${t}`, { replace: true })

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
