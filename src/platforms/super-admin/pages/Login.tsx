import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, ConfigProvider } from 'antd'
import { superAdminTheme } from '../../../theme/platforms'
import { GHN_ORANGE } from '../../../theme/tokens'

// Simple GHN logo box — approximates the Figma brand mark
function GhnLogoBox() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 34,
          height: 32,
          background: GHN_ORANGE,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 11, letterSpacing: -0.5 }}>GHN</span>
      </div>
      <span style={{ color: GHN_ORANGE, fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>
        GHN SUPER ADMIN
      </span>
    </div>
  )
}

export default function SuperAdminLogin() {
  const navigate = useNavigate()

  const onFinish = () => {
    navigate('/super-admin/agencies')
  }

  return (
    <ConfigProvider theme={superAdminTheme}>
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #FFFFFF 0%, #FFF3EE 50%, #FFE0D0 100%)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with logo */}
        <div style={{ padding: '20px 24px' }}>
          <GhnLogoBox />
        </div>

        {/* Centered login card */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 720,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
              padding: '48px 160px',
            }}
          >
            <h2
              style={{
                textAlign: 'center',
                fontSize: 24,
                fontWeight: 700,
                color: '#1A1A1A',
                marginBottom: 32,
              }}
            >
              Đăng nhập vào{' '}
              <span style={{ color: GHN_ORANGE }}>SuperAdmin</span>
            </h2>

            <Form layout="vertical" onFinish={onFinish} initialValues={{ username: 'admin', password: '123456' }}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
              >
                <Input size="large" placeholder="Tên đăng nhập" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
              >
                <Input.Password size="large" placeholder="Mật khẩu" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  style={{ background: GHN_ORANGE, borderColor: GHN_ORANGE, height: 44, fontWeight: 600 }}
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}
