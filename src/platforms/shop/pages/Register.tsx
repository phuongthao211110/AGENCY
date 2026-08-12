import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, ConfigProvider } from 'antd'
import { shopTheme } from '../../../theme/platforms'
import { GHN_ORANGE } from '../../../theme/tokens'
import agencies from '../../../mock-data/agencies.json'
import { isValidVNPhone, PHONE_INVALID_MESSAGE } from '../../../mock-data/phoneValidation'
import { addShop, loadShops } from '../../../mock-data/shopStore'

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
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>
        WEB SHOP
      </span>
    </div>
  )
}

// Không hiện danh sách tên đại lý công khai — shop phải có mã đại lý do đại lý tự gửi riêng
// (giống mã mời), tránh lộ thông tin đối tác/quy mô đại lý cho người ngoài xem trang đăng ký.
const activeAgencies = agencies.filter(a => a.status === 'active')
const findAgencyByCode = (code: string) =>
  activeAgencies.find(a => a.code.toLowerCase() === code.trim().toLowerCase())
const AGENCY_CODE_INVALID_MESSAGE = 'Mã đại lý không hợp lệ'

export default function ShopRegister() {
  const navigate = useNavigate()

  const onFinish = (values: {
    shopName: string; ownerName: string; phone: string; address: string
    agencyCode: string; username: string
  }) => {
    const agency = findAgencyByCode(values.agencyCode)
    if (!agency) return
    addShop({
      id: `SHOP${Date.now().toString().slice(-6)}`,
      agencyId: agency.id,
      name: values.shopName,
      ownerName: values.ownerName,
      phone: values.phone,
      address: values.address,
      status: 'active',
      username: values.username,
      createdAt: new Date().toISOString().slice(0, 10),
      totalOrders: 0,
      codSchedule: '',
      configuredServices: [],
    })
    navigate('/shop/orders')
  }

  return (
    <ConfigProvider theme={shopTheme}>
      <div
        style={{
          minHeight: '100vh',
          background: '#0D0D18',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with logo */}
        <div style={{ padding: '20px 24px' }}>
          <GhnLogoBox />
        </div>

        {/* Centered register card */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 0',
          }}
        >
          <div
            style={{
              width: 640,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 8px 40px rgba(0,0,0,0.40)',
              padding: '48px 80px',
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
              Đăng ký shop
            </h2>

            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                name="shopName"
                label="Tên shop"
                rules={[{ required: true, message: 'Vui lòng nhập tên shop' }]}
              >
                <Input size="large" placeholder="Tên shop" />
              </Form.Item>

              <Form.Item
                name="ownerName"
                label="Họ tên chủ shop"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên chủ shop' }]}
              >
                <Input size="large" placeholder="Họ tên chủ shop" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  {
                    validator: (_, value) =>
                      !value || isValidVNPhone(value) ? Promise.resolve() : Promise.reject(new Error(PHONE_INVALID_MESSAGE)),
                  },
                ]}
              >
                <Input size="large" placeholder="Số điện thoại" />
              </Form.Item>

              <Form.Item
                name="address"
                label="Địa chỉ"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
              >
                <Input size="large" placeholder="Số nhà, đường, tỉnh/thành" />
              </Form.Item>

              <Form.Item
                name="agencyCode"
                label="Mã đại lý"
                extra="Mã do đại lý bạn muốn hợp tác cung cấp riêng — liên hệ đại lý nếu chưa có mã."
                rules={[
                  { required: true, message: 'Vui lòng nhập mã đại lý' },
                  {
                    validator: (_, value) =>
                      !value || findAgencyByCode(value) ? Promise.resolve() : Promise.reject(new Error(AGENCY_CODE_INVALID_MESSAGE)),
                  },
                ]}
              >
                <Input size="large" placeholder="Mã đại lý" />
              </Form.Item>

              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                  {
                    validator: (_, value) =>
                      !value || !loadShops().some(s => s.username === value)
                        ? Promise.resolve()
                        : Promise.reject(new Error('Tên đăng nhập đã được sử dụng, vui lòng chọn tên khác')),
                  },
                ]}
              >
                <Input size="large" placeholder="Tên đăng nhập" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                ]}
                hasFeedback
              >
                <Input.Password size="large" placeholder="Mật khẩu" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                dependencies={['password']}
                hasFeedback
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve()
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp'))
                    },
                  }),
                ]}
              >
                <Input.Password size="large" placeholder="Nhập lại mật khẩu" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  style={{ background: GHN_ORANGE, borderColor: GHN_ORANGE, height: 44, fontWeight: 600 }}
                >
                  Đăng ký
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6B7280' }}>
              Đã có tài khoản?{' '}
              <span
                onClick={() => navigate('/shop/login')}
                style={{ color: GHN_ORANGE, fontWeight: 600, cursor: 'pointer' }}
              >
                Đăng nhập
              </span>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}
