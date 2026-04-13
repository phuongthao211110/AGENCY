import { useNavigate, useLocation } from 'react-router-dom'
import { Dropdown, Button } from 'antd'
import { DownOutlined, AppstoreOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { SHADOW_FLOAT } from '../theme/tokens'

const PLATFORMS = [
  { key: 'super-admin', label: 'Super Admin', color: '#F05521', path: '/super-admin/agencies' },
  { key: 'agency-admin', label: 'Agency Admin', color: '#F05521', path: '/agency-admin/dashboard' },
  { key: 'shop', label: 'Shop Portal', color: '#F05521', path: '/shop/orders' },
]

export default function PlatformSwitcher() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentPlatform =
    PLATFORMS.find((p) => location.pathname.startsWith(`/${p.key}`)) || PLATFORMS[0]

  const items: MenuProps['items'] = PLATFORMS.map((platform) => ({
    key: platform.key,
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
        <span style={{ color: platform.color, fontSize: 10 }}>●</span>
        {platform.label}
      </span>
    ),
    onClick: () => navigate(platform.path),
  }))

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Button
        icon={<AppstoreOutlined />}
        size="small"
        style={{
          borderColor: '#d9d9d9',
          color: '#555',
          fontWeight: 500,
          background: '#fff',
          boxShadow: SHADOW_FLOAT,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={{ color: currentPlatform.color, fontSize: 9 }}>●</span>
        {currentPlatform.label}
        <DownOutlined style={{ fontSize: 10 }} />
      </Button>
    </Dropdown>
  )
}
