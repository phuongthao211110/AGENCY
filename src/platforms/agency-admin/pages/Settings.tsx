import { ConfigProvider } from 'antd'
import { UserOutlined, TeamOutlined, SafetyOutlined } from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { agencyAdminTheme } from '../../../theme/platforms'
import {
  C_ACTION,
  C_BORDER,
  C_TEXT_LABEL,
  C_BG_ACTIVE,
  SIDER_WIDTH,
  HEADER_HEIGHT,
  FONT_SIZE_BASE,
  FONT_WEIGHT_SEMIBOLD,
  SPACE_2,
  SPACE_3,
} from '../../../theme/tokens'

const SETTINGS_NAV = [
  { key: '/agency-admin/settings/account', icon: <UserOutlined />, label: 'Thông tin tài khoản' },
  { key: '/agency-admin/settings/users', icon: <TeamOutlined />, label: 'Quản lý người dùng' },
  { key: '/agency-admin/settings/permissions', icon: <SafetyOutlined />, label: 'Phân quyền' },
]

export default function Settings() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (key: string) => location.pathname === key || location.pathname.startsWith(key + '/')

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      {/* Secondary sidebar */}
      <nav
        style={{
          position: 'fixed',
          left: SIDER_WIDTH,
          right: 'auto',
          top: HEADER_HEIGHT,
          width: SIDER_WIDTH,
          bottom: 0,
          background: '#F9FAFB',
          borderRight: `1px solid ${C_BORDER}`,
          zIndex: 9,
          padding: `${SPACE_3}px 0`,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {SETTINGS_NAV.map(item => {
          const active = isActive(item.key)
          return (
            <div
              key={item.key}
              onClick={() => navigate(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACE_3,
                padding: `${SPACE_2 + 2}px 16px`,
                cursor: 'pointer',
                background: active ? C_BG_ACTIVE : 'transparent',
                color: active ? C_ACTION : C_TEXT_LABEL,
                fontWeight: active ? FONT_WEIGHT_SEMIBOLD : 400,
                fontSize: FONT_SIZE_BASE,
              }}
            >
              <span style={{ fontSize: 16, display: 'flex', color: active ? C_ACTION : C_TEXT_LABEL }}>
                {item.icon}
              </span>
              {item.label}
            </div>
          )
        })}
      </nav>

      {/* Content area pushed right of secondary sidebar only (primary sidebar handled by parent layout) */}
      <div
        style={{
          marginLeft: SIDER_WIDTH,
          background: '#F9FAFB',
          minHeight: '100%',
        }}
      >
        <Outlet />
      </div>
    </ConfigProvider>
  )
}
