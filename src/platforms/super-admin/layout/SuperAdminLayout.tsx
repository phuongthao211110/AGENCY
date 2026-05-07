import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Avatar, ConfigProvider, Badge } from 'antd'
import {
  MenuOutlined,
  BellOutlined,
  UserOutlined,
  BankOutlined,
  SettingOutlined,
  LogoutOutlined,
  RightOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
import { GHN_ORANGE, COLOR_BORDER } from '../../../theme/tokens'
import PlatformSwitcher from '../../../components/PlatformSwitcher'

const NAV_ITEMS = [
  { key: '/super-admin/agencies', icon: <BankOutlined />, label: 'Đại lý' },
]

const SETTINGS_ITEM = { key: '/super-admin/settings', icon: <SettingOutlined />, label: 'Cài đặt' }

export default function SuperAdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (key: string) => location.pathname.startsWith(key)

  return (
    <ConfigProvider theme={superAdminTheme}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside
          style={{
            width: collapsed ? 0 : 240,
            minWidth: collapsed ? 0 : 240,
            background: '#fff',
            borderRight: `1px solid ${COLOR_BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.2s, min-width 0.2s',
            position: 'fixed',
            top: 40,
            bottom: 0,
            left: 0,
            zIndex: 10,
          }}
        >
          {/* QUẢN LÝ section */}
          <div style={{ padding: '10px 16px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: 0.5, marginBottom: 6 }}>
              QUẢN LÝ
            </div>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.key)
              return (
                <div
                  key={item.key}
                  onClick={() => navigate(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '5px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: active ? '#FFF3EE' : 'transparent',
                    color: active ? GHN_ORANGE : '#333',
                    fontWeight: active ? 600 : 400,
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontSize: 20, display: 'flex', color: active ? GHN_ORANGE : '#555' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </div>
              )
            })}
          </div>

          <div style={{ height: 1, background: COLOR_BORDER, margin: '10px 16px' }} />

          {/* CÀI ĐẶT section */}
          <div style={{ padding: '0 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: 0.5, marginBottom: 6 }}>
              CÀI ĐẶT
            </div>
            {(() => {
              const active = isActive(SETTINGS_ITEM.key)
              return (
                <div
                  onClick={() => navigate(SETTINGS_ITEM.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '5px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: active ? '#FFF3EE' : 'transparent',
                    color: active ? GHN_ORANGE : '#333',
                    fontWeight: active ? 600 : 400,
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontSize: 20, display: 'flex', color: active ? GHN_ORANGE : '#555' }}>
                    {SETTINGS_ITEM.icon}
                  </span>
                  <span style={{ flex: 1 }}>{SETTINGS_ITEM.label}</span>
                  <RightOutlined style={{ fontSize: 12, color: active ? GHN_ORANGE : '#999' }} />
                </div>
              )
            })()}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Document — localhost only */}
          {window.location.hostname === 'localhost' && (
          <div style={{ padding: '0 16px 4px' }}>
            {(() => {
              const active = isActive('/super-admin/document')
              return (
                <div
                  onClick={() => navigate('/super-admin/document')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '5px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: active ? '#FFF3EE' : 'transparent',
                    color: active ? GHN_ORANGE : '#333',
                    fontWeight: active ? 600 : 400,
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontSize: 20, display: 'flex', color: active ? GHN_ORANGE : '#555' }}>
                    <FileTextOutlined />
                  </span>
                  Document
                </div>
              )
            })()}
          </div>
          )}

          <div style={{ height: 1, background: COLOR_BORDER, margin: '0 16px' }} />

          {/* Đăng xuất */}
          <div style={{ padding: '10px 16px' }}>
            <div
              onClick={() => navigate('/super-admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '5px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                color: '#333',
                fontSize: 14,
              }}
            >
              <span style={{ fontSize: 20, display: 'flex', color: '#555' }}><LogoutOutlined /></span>
              Đăng xuất
            </div>
          </div>

          {/* Version */}
          <div style={{ padding: '0 16px 10px', textAlign: 'center' }}>
            <span style={{ fontSize: 11, color: '#C4C4C4', letterSpacing: 0.3 }}>v0.23.1</span>
          </div>
        </aside>

        {/* ── Main area ─────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: collapsed ? 0 : 240, transition: 'margin-left 0.2s' }}>
          {/* Top header bar */}
          <header
            style={{
              height: 40,
              background: '#fff',
              borderBottom: `1px solid ${COLOR_BORDER}`,
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 20,
            }}
          >
            {/* Hamburger */}
            <MenuOutlined
              style={{ fontSize: 18, cursor: 'pointer', color: '#555', marginRight: 12 }}
              onClick={() => setCollapsed(!collapsed)}
            />

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 17,
                  height: 16,
                  background: GHN_ORANGE,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 8 }}>G</span>
              </div>
              <span style={{ color: GHN_ORANGE, fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
                GHN SUPER ADMIN
              </span>
            </div>

            {/* Right: platform switcher + bell + avatar */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
              <PlatformSwitcher />
              <Badge count={3} size="small">
                <BellOutlined style={{ fontSize: 18, color: '#555', cursor: 'pointer' }} />
              </Badge>
              <Avatar
                size={24}
                style={{ background: GHN_ORANGE, cursor: 'pointer' }}
                icon={<UserOutlined style={{ fontSize: 13 }} />}
              />
            </div>
          </header>

          {/* Page content */}
          <main style={{ marginTop: 40, flex: 1, background: '#f5f5f5', minHeight: 'calc(100vh - 40px)' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </ConfigProvider>
  )
}
