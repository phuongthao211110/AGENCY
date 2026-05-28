import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Dropdown, Button } from 'antd'
import { DownOutlined, AppstoreOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { SHADOW_FLOAT } from '../theme/tokens'
import { JiraManagerModal } from './JiraManager'

const PLATFORMS = [
  { key: 'super-admin', label: 'Super Admin', color: '#F05521', path: '/super-admin/agencies' },
  { key: 'agency-admin', label: 'Agency Admin', color: '#F05521', path: '/agency-admin/shops' },
  { key: 'shop', label: 'Shop Portal', color: '#F05521', path: '/shop/orders' },
]

export default function PlatformSwitcher() {
  const navigate = useNavigate()
  const location = useLocation()
  const [jiraOpen, setJiraOpen] = useState(false)

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
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Jira button */}
        <Button
          size="small"
          onClick={() => setJiraOpen(true)}
          title="Jira Sprint Manager"
          style={{
            borderColor: '#d9d9d9',
            color: '#2684FF',
            fontWeight: 600,
            background: '#fff',
            boxShadow: SHADOW_FLOAT,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '0 8px',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M11.53 2L2 11.53l4.97 4.97L11.53 12l4.97 4.97L21.47 12 11.53 2z" fill="#2684FF" />
            <path d="M11.53 22l9.53-9.53-4.97-4.97L11.53 12 6.56 7.03 2.07 11.5 11.53 22z" fill="#2684FF" opacity="0.6" />
          </svg>
          Jira
        </Button>

        {/* Platform switcher */}
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
      </div>

      {jiraOpen && <JiraManagerModal onClose={() => setJiraOpen(false)} />}
    </>
  )
}
