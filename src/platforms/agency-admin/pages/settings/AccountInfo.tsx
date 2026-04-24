import { useState } from 'react'
import { ConfigProvider } from 'antd'
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { agencyAdminTheme } from '../../../../theme/platforms'
import {
  C_ACTION,
  C_BORDER,
  C_TEXT_PRIMARY,
  C_TEXT_LABEL,
  C_TEXT_DISABLED,
  C_BG_WHITE,
  FONT_SIZE_BASE,
  FONT_SIZE_2XL,
  FONT_WEIGHT_SEMIBOLD,
  FONT_WEIGHT_MEDIUM,
  RADIUS_BASE,
  RADIUS_LG,
  SPACE_2,
  SPACE_3,
  SPACE_4,
  SPACE_6,
  CARD_SHADOW,
} from '../../../../theme/tokens'

interface PasswordFieldProps {
  label: string
  value: string
  onChange: (val: string) => void
}

function PasswordField({ label, value, onChange }: PasswordFieldProps) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_2 }}>
      <label style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_MEDIUM, color: C_TEXT_LABEL }}>
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACE_3,
          border: `1px solid ${focused ? '#FFA274' : C_BORDER}`,
          borderRadius: RADIUS_BASE,
          padding: `6px ${SPACE_3}px`,
          background: C_BG_WHITE,
          transition: 'border-color 0.2s',
        }}
      >
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: FONT_SIZE_BASE,
            color: C_TEXT_PRIMARY,
            background: 'transparent',
          }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            width: 20,
            height: 20,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            color: show ? C_TEXT_LABEL : C_TEXT_DISABLED,
          }}
        >
          {show ? <EyeOutlined style={{ fontSize: 14 }} /> : <EyeInvisibleOutlined style={{ fontSize: 14 }} />}
        </button>
      </div>
    </div>
  )
}

export default function AccountInfo() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = () => {
    console.log('Change password:', { oldPassword, newPassword, confirmPassword })
  }

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      <div style={{ padding: `${SPACE_6}px 80px`, background: '#F9FAFB', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: FONT_SIZE_2XL, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY, margin: `0 0 ${SPACE_6}px`, width: '100%', maxWidth: 560 }}>
          Thông tin tài khoản
        </h2>

        <div
          style={{
            background: C_BG_WHITE,
            border: `1px solid ${C_BORDER}`,
            borderRadius: RADIUS_LG,
            padding: `${SPACE_4}px`,
            boxShadow: CARD_SHADOW,
            maxWidth: 560,
            width: '100%',
          }}
        >
          <h3 style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY, margin: `0 0 ${SPACE_4}px` }}>
            Thay đổi mật khẩu
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_4 }}>
            <PasswordField label="Mật khẩu cũ" value={oldPassword} onChange={setOldPassword} />
            <PasswordField label="Mật khẩu mới" value={newPassword} onChange={setNewPassword} />
            <PasswordField label="Nhập lại mật khẩu mới" value={confirmPassword} onChange={setConfirmPassword} />
          </div>

          <div style={{ marginTop: SPACE_6 }}>
            <button
              onClick={handleSubmit}
              style={{
                background: C_ACTION,
                color: '#fff',
                border: 'none',
                borderRadius: RADIUS_BASE,
                padding: '6px 12px',
                fontSize: FONT_SIZE_BASE,
                fontWeight: FONT_WEIGHT_MEDIUM,
                cursor: 'pointer',
              }}
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}
