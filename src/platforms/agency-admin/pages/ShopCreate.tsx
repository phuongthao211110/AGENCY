import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DownOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import allServices from '../../../mock-data/services.json'
import allPriceTables from '../../../mock-data/pricing.json'

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

  // serviceId → priceTableId (null = chưa chọn)
  const defaultServiceIds = allServices.filter((s) => (s as any).isDefault).map((s) => s.id)
  const [visibleServiceIds, setVisibleServiceIds] = useState<string[]>(defaultServiceIds)
  const [servicePriceTables, setServicePriceTables] = useState<Record<string, string | null>>(
    () => Object.fromEntries(allServices.map((s) => [s.id, (s as any).priceTableId ?? null]))
  )
  const setPriceTable = (serviceId: string, val: string | null) =>
    setServicePriceTables(prev => ({ ...prev, [serviceId]: val }))
  const removeService = (serviceId: string) =>
    setVisibleServiceIds(prev => prev.filter(id => id !== serviceId))

  const [openPriceDropdown, setOpenPriceDropdown] = useState<string | null>(null)

  const [showAddMenu, setShowAddMenu] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setShowAddMenu(false)
      const target = e.target as Node
      const dropdowns = document.querySelectorAll('[data-price-dropdown]')
      let inside = false
      dropdowns.forEach(el => { if (el.contains(target)) inside = true })
      if (!inside) setOpenPriceDropdown(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  const addableServices = allServices.filter((s) => !visibleServiceIds.includes(s.id))

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

        {/* Section 3: Cấu hình dịch vụ */}
        <div style={cardStyle}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>
            Cấu hình dịch vụ
          </span>
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, lineHeight: '18px', marginTop: -8 }}>
            Chọn bảng giá cho từng dịch vụ. Dịch vụ chưa gắn bảng giá sẽ không khả dụng với shop này.
          </span>

          {/* Table */}
          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'flex', background: '#F3F4F6', padding: '6px 12px' }}>
              <div style={{ flex: '2 0 0', minWidth: 160, fontSize: 13, color: C_TEXT_SECONDARY }}>Dịch vụ</div>
              <div style={{ flex: '2 0 0', minWidth: 200, fontSize: 13, color: C_TEXT_SECONDARY }}>Bảng giá áp dụng</div>
              <div style={{ width: 32, flexShrink: 0 }} />
            </div>
            <div style={{ height: 1, background: C_BORDER }} />

            {visibleServiceIds.map((svcId, idx) => {
              const svc = allServices.find(s => s.id === svcId)!
              const selected = servicePriceTables[svc.id]
              return (
                <div key={svc.id}>
                  <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', background: '#fff' }}>
                    <div style={{ flex: '2 0 0', minWidth: 160 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{svc.name}</div>
                      <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>{svc.desc}</div>
                    </div>
                    <div style={{ flex: '2 0 0', minWidth: 200, position: 'relative' }} data-price-dropdown={svc.id}>
                      {/* Trigger */}
                      <div
                        onClick={() => setOpenPriceDropdown(openPriceDropdown === svc.id ? null : svc.id)}
                        style={{ background: '#fff', border: `1px solid ${openPriceDropdown === svc.id ? C_ACTION : C_BORDER}`, borderRadius: 6, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}
                      >
                        <span style={{ flex: 1, fontSize: 13, color: selected ? C_TEXT_PRIMARY : C_PLACEHOLDER, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selected ? allPriceTables.find(pt => pt.id === selected)?.name ?? selected : '— Chưa chọn bảng giá —'}
                        </span>
                        {selected && selected === (svc as any).priceTableId && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 4, padding: '1px 5px', flexShrink: 0, whiteSpace: 'nowrap' }}>Mặc định</span>
                        )}
                        <DownOutlined style={{ fontSize: 10, color: C_TEXT_SECONDARY, flexShrink: 0, transition: 'transform 0.15s', transform: openPriceDropdown === svc.id ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </div>
                      {/* Dropdown menu */}
                      {openPriceDropdown === svc.id && (() => {
                        const openUp = idx >= visibleServiceIds.length - 3
                        return (
                        <div style={{ position: 'absolute', ...(openUp ? { bottom: '100%', marginBottom: 2 } : { top: '100%', marginTop: 2 }), left: 0, right: 0, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden' }}>
                          {!selected && (
                            <div
                              onClick={() => { setPriceTable(svc.id, null); setOpenPriceDropdown(null) }}
                              style={{ display: 'flex', alignItems: 'center', padding: '7px 10px', fontSize: 13, color: C_PLACEHOLDER, cursor: 'pointer', background: '#FFF4ED' }}
                            >
                              — Chưa chọn bảng giá —
                            </div>
                          )}
                          {allPriceTables.map(pt => {
                            const isDefault = pt.id === (svc as any).priceTableId
                            const isSelected = pt.id === selected
                            return (
                              <div
                                key={pt.id}
                                onClick={() => { setPriceTable(svc.id, pt.id); setOpenPriceDropdown(null) }}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', fontSize: 13, color: C_TEXT_PRIMARY, cursor: 'pointer', background: isSelected ? '#FFF4ED' : '#fff' }}
                                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#F9FAFB' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isSelected ? '#FFF4ED' : '#fff' }}
                              >
                                <span style={{ flex: 1 }}>{pt.name}</span>
                                {isDefault && (
                                  <span style={{ fontSize: 10, fontWeight: 600, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 4, padding: '1px 5px', flexShrink: 0, whiteSpace: 'nowrap' }}>Mặc định</span>
                                )}
                                {isSelected && <span style={{ color: C_ACTION, fontSize: 12 }}>✓</span>}
                              </div>
                            )
                          })}
                        </div>
                        )
                      })()}
                      {!selected && (
                        <div style={{ fontSize: 11, color: '#D97706', marginTop: 3 }}>Dịch vụ sẽ không khả dụng</div>
                      )}
                    </div>
                    <div style={{ width: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        onClick={() => removeService(svc.id)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex', alignItems: 'center' }}
                        title="Xoá dịch vụ"
                      >
                        <CloseOutlined style={{ fontSize: 12 }} />
                      </button>
                    </div>
                  </div>
                  {idx < visibleServiceIds.length - 1 && <div style={{ height: 1, background: C_BORDER }} />}
                </div>
              )
            })}
          </div>

          {/* Thêm dịch vụ */}
          {addableServices.length > 0 && (
            <div style={{ position: 'relative' }} ref={addMenuRef}>
              <button
                onClick={() => setShowAddMenu(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px dashed ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_TEXT_SECONDARY, fontSize: 13, cursor: 'pointer', padding: '6px 12px' }}
              >
                <PlusOutlined style={{ fontSize: 12 }} />
                Thêm dịch vụ
              </button>
              {showAddMenu && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: 0, marginBottom: 4, zIndex: 100,
                  background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)', minWidth: 260, overflow: 'hidden',
                }}>
                  {addableServices.map((svc, i) => (
                    <div
                      key={svc.id}
                      onClick={() => { setVisibleServiceIds(prev => [...prev, svc.id]); setShowAddMenu(false) }}
                      style={{
                        padding: '8px 14px', cursor: 'pointer', background: '#fff',
                        borderBottom: i < addableServices.length - 1 ? `1px solid ${C_BORDER}` : 'none',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY }}>{svc.name}</div>
                      <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 1 }}>{svc.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
