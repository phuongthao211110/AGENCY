import { useState } from 'react'
import { ConfigProvider } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { shopTheme } from '../../../../theme/platforms'
import {
  C_ACTION,
  C_LINK,
  C_BORDER,
  C_TEXT_PRIMARY,
  C_TEXT_SECONDARY,
  C_TEXT_LABEL,
  C_BG_WHITE,
  FONT_SIZE_BASE,
  FONT_SIZE_SM,
  FONT_SIZE_2XL,
  FONT_WEIGHT_SEMIBOLD,
  FONT_WEIGHT_MEDIUM,
  FONT_WEIGHT_BOLD,
  RADIUS_BASE,
  RADIUS_LG,
  SPACE_2,
  SPACE_3,
  SPACE_4,
  SPACE_6,
  CARD_SHADOW,
} from '../../../../theme/tokens'
import allBankAccounts from '../../../../mock-data/bank-accounts.json'

// ── Types ─────────────────────────────────────────────────────
type BankAccount = {
  id: string
  shopId: string
  bankCode: string
  bankName: string
  bankShortName: string
  accountName: string
  accountNumber: string
  isActive: boolean
  createdAt: string
}

// ── Constants ─────────────────────────────────────────────────
const MY_SHOP_ID = 'SHP001'
const SHOP_PHONE = '090 xxx xx11' // masked for OTP display

const BANKS = [
  { code: 'VCB',  name: 'Vietcombank - Ngân hàng TMCP Ngoại thương Việt Nam' },
  { code: 'BIDV', name: 'BIDV - Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { code: 'CTG',  name: 'VietinBank - Ngân hàng TMCP Công thương Việt Nam' },
  { code: 'TCB',  name: 'Techcombank - Ngân hàng TMCP Kỹ thương Việt Nam' },
  { code: 'MBB',  name: 'MBBank - Ngân hàng TMCP Quân đội' },
  { code: 'ACB',  name: 'ACB - Ngân hàng TMCP Á Châu' },
  { code: 'VPB',  name: 'VPBank - Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { code: 'TPB',  name: 'Tien Phong Bank - Ngân hàng TMCP Tiên Phong' },
  { code: 'STB',  name: 'Sacombank - Ngân hàng TMCP Sài Gòn Thương Tín' },
  { code: 'HDB',  name: 'HDBank - Ngân hàng TMCP Phát triển TP.HCM' },
  { code: 'EIB',  name: 'Eximbank - Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
  { code: 'SHB',  name: 'SHB - Ngân hàng TMCP Sài Gòn - Hà Nội' },
]

// ── Toggle ────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? C_ACTION : '#D1D5DB',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2,
        left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

// ── Text input ────────────────────────────────────────────────
function TextInput({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_2 }}>
      <label style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_MEDIUM, color: C_TEXT_LABEL }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '10px 14px',
          border: `1px solid ${focused ? '#FFA274' : C_BORDER}`,
          borderRadius: RADIUS_BASE,
          fontSize: FONT_SIZE_BASE, color: C_TEXT_PRIMARY,
          outline: 'none', background: C_BG_WHITE,
          transition: 'border-color 0.2s',
        }}
      />
    </div>
  )
}

// ── Bank select ───────────────────────────────────────────────
function BankSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_2 }}>
      <label style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_MEDIUM, color: C_TEXT_LABEL }}>
        Ngân hàng
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '10px 14px',
          border: `1px solid ${focused ? '#FFA274' : C_BORDER}`,
          borderRadius: RADIUS_BASE,
          fontSize: FONT_SIZE_BASE, color: value ? C_TEXT_PRIMARY : '#9CA3AF',
          outline: 'none', background: C_BG_WHITE,
          cursor: 'pointer', appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          paddingRight: 36,
          transition: 'border-color 0.2s',
        }}
      >
        <option value="">Chọn ngân hàng</option>
        {BANKS.map(b => (
          <option key={b.code} value={b.code}>{b.name}</option>
        ))}
      </select>
    </div>
  )
}

// ── Edit / Add Modal ──────────────────────────────────────────
type ModalMode = 'add' | 'edit'
type ModalStep = 'form' | 'otp'

function BankModal({
  mode,
  initial,
  onSave,
  onClose,
}: {
  mode: ModalMode
  initial?: BankAccount
  onSave: (data: Omit<BankAccount, 'id' | 'shopId' | 'createdAt' | 'isActive'>) => void
  onClose: () => void
}) {
  const [step, setStep] = useState<ModalStep>('form')
  const [bankCode, setBankCode] = useState(initial?.bankCode ?? '')
  const [accountName, setAccountName] = useState(initial?.accountName ?? '')
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? '')
  const [otp, setOtp] = useState('')
  const [otpFocused, setOtpFocused] = useState(false)

  const bankName = BANKS.find(b => b.code === bankCode)?.name ?? ''
  const bankShortName = bankName.split(' - ')[0] ?? bankCode

  const canSubmitForm = bankCode && accountName.trim() && accountNumber.trim()

  const handleFormConfirm = () => {
    if (!canSubmitForm) return
    if (mode === 'edit') {
      setStep('otp') // edit requires OTP
    } else {
      onSave({ bankCode, bankName, bankShortName, accountName: accountName.trim().toUpperCase(), accountNumber: accountNumber.trim() })
      onClose()
    }
  }

  const handleOtpConfirm = () => {
    if (otp.length < 4) return
    onSave({ bankCode, bankName, bankShortName, accountName: accountName.trim().toUpperCase(), accountNumber: accountNumber.trim() })
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 480, background: C_BG_WHITE, borderRadius: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,0.18)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 0', textAlign: 'center' }}>
          <h3 style={{
            fontSize: FONT_SIZE_2XL, fontWeight: FONT_WEIGHT_BOLD,
            color: C_LINK, margin: 0,
          }}>
            {mode === 'add' ? 'Thêm tài khoản ngân hàng' : 'Cập nhật tài khoản ngân hàng'}
          </h3>
        </div>

        {/* Body */}
        <div style={{ padding: `${SPACE_6}px 24px` }}>
          {step === 'form' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_4 }}>
              <BankSelect value={bankCode} onChange={setBankCode} />
              <TextInput
                label="Tên tài khoản"
                value={accountName}
                onChange={setAccountName}
                placeholder="Nhập đầy đủ họ tên không dấu"
              />
              <TextInput
                label="Số tài khoản"
                value={accountNumber}
                onChange={setAccountNumber}
                placeholder="Nhập số tài khoản"
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_4, alignItems: 'center' }}>
              <p style={{ fontSize: FONT_SIZE_BASE, color: C_TEXT_SECONDARY, textAlign: 'center', margin: 0 }}>
                Nhập mã OTP đã được gửi về số điện thoại
                <br />
                <strong style={{ color: C_TEXT_PRIMARY }}>{SHOP_PHONE}</strong>
              </p>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Nhập mã OTP"
                maxLength={6}
                onFocus={() => setOtpFocused(true)}
                onBlur={() => setOtpFocused(false)}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: `1px solid ${otpFocused ? '#FFA274' : C_BORDER}`,
                  borderRadius: RADIUS_BASE, fontSize: 20, fontWeight: FONT_WEIGHT_BOLD,
                  color: C_TEXT_PRIMARY, textAlign: 'center', letterSpacing: 8,
                  outline: 'none', background: C_BG_WHITE, boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: `0 24px ${SPACE_6}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: SPACE_3 }}>
          <button
            onClick={step === 'form' ? handleFormConfirm : handleOtpConfirm}
            disabled={step === 'form' ? !canSubmitForm : otp.length < 4}
            style={{
              width: '100%', padding: '9px 0',
              background: C_ACTION,
              color: '#fff', border: 'none',
              borderRadius: RADIUS_BASE, fontSize: FONT_SIZE_BASE,
              fontWeight: FONT_WEIGHT_SEMIBOLD, cursor: 'pointer',
              opacity: (step === 'form' ? canSubmitForm : otp.length >= 4) ? 1 : 0.45,
              transition: 'opacity 0.2s',
            }}
          >
            Xác nhận
          </button>
          {step === 'otp' && (
            <p style={{ fontSize: FONT_SIZE_SM, color: '#EF4444', textAlign: 'center', margin: 0, lineHeight: '20px' }}>
              Lưu ý: Một mã OTP sẽ được gửi về số điện thoại của bạn để<br />xác thực đổi tài khoản ngân hàng
            </p>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: FONT_SIZE_BASE, color: C_TEXT_SECONDARY, padding: 0,
            }}
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function BankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>(
    (allBankAccounts as BankAccount[]).filter(a => a.shopId === MY_SHOP_ID)
  )
  const [editTarget, setEditTarget] = useState<BankAccount | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Add new bank form state
  const [addBank, setAddBank] = useState('')
  const [addName, setAddName] = useState('')
  const [addNumber, setAddNumber] = useState('')

  const handleToggle = (id: string, val: boolean) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, isActive: val } : a))
  }

  const handleAddSave = (data: Omit<BankAccount, 'id' | 'shopId' | 'createdAt' | 'isActive'>) => {
    const newAccount: BankAccount = {
      id: `BA${String(Date.now()).slice(-4)}`,
      shopId: MY_SHOP_ID,
      ...data,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setAccounts(prev => [...prev, newAccount])
    setAddBank(''); setAddName(''); setAddNumber('')
  }

  const handleEditSave = (data: Omit<BankAccount, 'id' | 'shopId' | 'createdAt' | 'isActive'>) => {
    if (!editTarget) return
    setAccounts(prev => prev.map(a => a.id === editTarget.id ? { ...a, ...data } : a))
    setEditTarget(null)
  }

  // Add form inline submit
  const canAddInline = addBank && addName.trim() && addNumber.trim()
  const handleAddInline = () => {
    if (!canAddInline) return
    const bankObj = BANKS.find(b => b.code === addBank)!
    handleAddSave({
      bankCode: addBank,
      bankName: bankObj.name,
      bankShortName: bankObj.name.split(' - ')[0],
      accountName: addName.trim().toUpperCase(),
      accountNumber: addNumber.trim(),
    })
  }

  return (
    <ConfigProvider theme={shopTheme}>
      <div style={{
        padding: `${SPACE_6}px 80px`,
        background: '#F9FAFB', minHeight: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <h2 style={{
          fontSize: FONT_SIZE_2XL, fontWeight: FONT_WEIGHT_SEMIBOLD,
          color: C_TEXT_PRIMARY, margin: `0 0 ${SPACE_6}px`,
          width: '100%', maxWidth: 560,
        }}>
          Tài khoản ngân hàng
        </h2>

        <div style={{
          background: C_BG_WHITE, border: `1px solid ${C_BORDER}`,
          borderRadius: RADIUS_LG, boxShadow: CARD_SHADOW,
          maxWidth: 560, width: '100%',
          padding: `${SPACE_4}px`,
        }}>

          {/* ── Existing accounts ────────────────────────────── */}
          {accounts.length > 0 && (
            <>
              {accounts.map((acc, idx) => (
                <div key={acc.id}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: SPACE_3,
                    padding: `${SPACE_3}px 0`,
                  }}>
                    {/* Account info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_BOLD,
                        color: C_LINK, lineHeight: '22px',
                      }}>
                        {acc.accountName} – {acc.accountNumber}
                      </div>
                      <div style={{
                        fontSize: FONT_SIZE_BASE, color: C_LINK,
                        fontWeight: FONT_WEIGHT_MEDIUM, lineHeight: '20px',
                      }}>
                        {acc.bankShortName}
                      </div>
                    </div>
                    {/* Toggle */}
                    <Toggle checked={acc.isActive} onChange={v => handleToggle(acc.id, v)} />
                    {/* Edit */}
                    <button
                      onClick={() => setEditTarget(acc)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, border: 'none', background: 'none',
                        cursor: 'pointer', color: '#9CA3AF', padding: 0,
                        borderRadius: RADIUS_BASE,
                      }}
                    >
                      <EditOutlined style={{ fontSize: 16 }} />
                    </button>
                  </div>
                  {idx < accounts.length - 1 && (
                    <div style={{ height: 1, background: C_BORDER }} />
                  )}
                </div>
              ))}
              {/* Divider before form */}
              <div style={{ height: 1, background: C_BORDER, margin: `${SPACE_3}px 0` }} />
            </>
          )}

          {/* ── Add new account form ─────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_4 }}>
            <BankSelect value={addBank} onChange={setAddBank} />
            <TextInput
              label="Tên tài khoản"
              value={addName}
              onChange={setAddName}
              placeholder="Nhập đầy đủ họ tên không dấu"
            />
            <TextInput
              label="Số tài khoản"
              value={addNumber}
              onChange={setAddNumber}
              placeholder="Nhập số tài khoản"
            />
            <button
              onClick={handleAddInline}
              disabled={!canAddInline}
              style={{
                alignSelf: 'flex-start',
                padding: '7px 20px',
                background: C_ACTION,
                color: '#fff', border: 'none',
                borderRadius: RADIUS_BASE,
                fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_SEMIBOLD,
                cursor: canAddInline ? 'pointer' : 'default',
                opacity: canAddInline ? 1 : 0.45,
                transition: 'opacity 0.2s',
              }}
            >
              Thêm tài khoản
            </button>
          </div>

        </div>
      </div>

      {/* Edit modal */}
      {editTarget && (
        <BankModal
          mode="edit"
          initial={editTarget}
          onSave={handleEditSave}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Add modal (unused — using inline form instead, kept for future) */}
      {showAddModal && (
        <BankModal
          mode="add"
          onSave={handleAddSave}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </ConfigProvider>
  )
}
