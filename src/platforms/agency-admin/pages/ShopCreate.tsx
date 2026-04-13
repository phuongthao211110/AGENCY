import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Result, Divider } from 'antd'
import { ShopOutlined, UserOutlined, LockOutlined } from '@ant-design/icons'

import { AGENCY_BRAND as BRAND_COLOR } from '../../../theme/tokens'

const { Title, Text } = Typography

export default function ShopCreate() {
  const navigate = useNavigate()
  const [done, setDone] = useState(false)
  const [form] = Form.useForm()

  const onFinish = () => {
    setDone(true)
  }

  if (done) {
    return (
      <Card>
        <Result
          status="success"
          title="Tạo shop thành công!"
          subTitle="Shop mới đã được tạo. Chủ shop có thể đăng nhập ngay."
          extra={[
            <Button
              key="list"
              type="primary"
    
              onClick={() => navigate('/agency-admin/shops')}
            >
              Về danh sách shop
            </Button>,
            <Button key="new" onClick={() => { setDone(false); form.resetFields() }}>
              Tạo shop khác
            </Button>,
          ]}
        />
      </Card>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button type="link" onClick={() => navigate('/agency-admin/shops')} style={{ padding: 0 }}>
          ← Danh sách shop
        </Button>
        <Title level={4} style={{ margin: '0 0 0 16px', color: BRAND_COLOR }}>
          Tạo shop mới
        </Title>
      </div>

      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ShopOutlined style={{ color: BRAND_COLOR, fontSize: 18 }} />
            <Title level={5} style={{ margin: 0 }}>Thông tin shop</Title>
          </div>

          <Form.Item name="name" label="Tên shop" rules={[{ required: true }]}>
            <Input placeholder="Tên shop" size="large" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}>
            <Input placeholder="0901234567" size="large" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
            <Input placeholder="shop@example.com" size="large" />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Địa chỉ lấy hàng mặc định" />
          </Form.Item>

          <Divider />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <UserOutlined style={{ color: BRAND_COLOR, fontSize: 18 }} />
            <Title level={5} style={{ margin: 0 }}>Tài khoản đăng nhập</Title>
          </div>

          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Chủ shop sẽ dùng thông tin này để đăng nhập vào Web/App Shop
          </Text>

          <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="username" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('Mật khẩu không khớp'))
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" size="large" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
    
            >
              Tạo shop
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
