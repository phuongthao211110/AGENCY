import { Card, Row, Col, Table, Tag, Typography, Statistic } from 'antd'
import {
  BankOutlined,
  ShopOutlined,
  InboxOutlined,
  DollarOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import agencies from '../../../mock-data/agencies.json'
import orders from '../../../mock-data/orders.json'
import shops from '../../../mock-data/shops.json'

import { SUPER_ADMIN_BRAND as BRAND_COLOR } from '../../../theme/tokens'

const { Title, Text } = Typography

const topAgencies = [...agencies]
  .sort((a, b) => b.totalOrders - a.totalOrders)
  .slice(0, 5)

const trendData = [
  { month: 'T10/23', orders: 8200 },
  { month: 'T11/23', orders: 9500 },
  { month: 'T12/23', orders: 12800 },
  { month: 'T1/24', orders: 10200 },
  { month: 'T2/24', orders: 11400 },
  { month: 'T3/24', orders: 13600 },
  { month: 'T4/24', orders: 15100 },
]

const maxOrders = Math.max(...trendData.map((d) => d.orders))

const columns = [
  { title: 'Tên đại lý', dataIndex: 'name', key: 'name' },
  { title: 'Mã', dataIndex: 'code', key: 'code' },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (s: string) => (
      <Tag color={s === 'active' ? 'green' : s === 'inactive' ? 'red' : 'orange'}>
        {s === 'active' ? 'Hoạt động' : s === 'inactive' ? 'Tạm dừng' : 'Chờ duyệt'}
      </Tag>
    ),
  },
  { title: 'Số shop', dataIndex: 'totalShops', key: 'totalShops' },
  {
    title: 'Tổng đơn',
    dataIndex: 'totalOrders',
    key: 'totalOrders',
    render: (v: number) => v.toLocaleString(),
  },
]

export default function SuperAdminDashboard() {
  const totalRevenue = orders.reduce((sum, o) => sum + o.fee, 0)

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: BRAND_COLOR }}>
        Tổng quan hệ thống
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng đại lý"
              value={agencies.length}
              prefix={<BankOutlined style={{ color: BRAND_COLOR }} />}
              valueStyle={{ color: BRAND_COLOR }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng shop"
              value={shops.length}
              prefix={<ShopOutlined style={{ color: '#1890FF' }} />}
              valueStyle={{ color: '#1890FF' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={orders.length}
              prefix={<InboxOutlined style={{ color: '#52C41A' }} />}
              valueStyle={{ color: '#52C41A' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu phí (tháng)"
              value={totalRevenue}
              prefix={<DollarOutlined style={{ color: '#FA8C16' }} />}
              valueStyle={{ color: '#FA8C16' }}
              suffix="đ"
              formatter={(v) => Number(v).toLocaleString()}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span>
                <RiseOutlined style={{ marginRight: 8, color: BRAND_COLOR }} />
                Xu hướng đơn hàng (7 tháng gần nhất)
              </span>
            }
          >
            <div style={{ padding: '8px 0' }}>
              {trendData.map((d) => (
                <div
                  key={d.month}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 12,
                    gap: 12,
                  }}
                >
                  <Text style={{ width: 56, fontSize: 12, color: '#666' }}>{d.month}</Text>
                  <div
                    style={{
                      flex: 1,
                      background: '#f5f5f5',
                      borderRadius: 4,
                      height: 24,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: `${(d.orders / maxOrders) * 100}%`,
                        background: `linear-gradient(90deg, ${BRAND_COLOR}, #ff6b6b)`,
                        height: '100%',
                        borderRadius: 4,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <Text style={{ width: 60, fontSize: 12, textAlign: 'right' }}>
                    {d.orders.toLocaleString()}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Phân bổ trạng thái đại lý" style={{ height: '100%' }}>
            {[
              { label: 'Hoạt động', color: '#52C41A', count: agencies.filter((a) => a.status === 'active').length },
              { label: 'Tạm dừng', color: '#FF4D4F', count: agencies.filter((a) => a.status === 'inactive').length },
              { label: 'Chờ duyệt', color: '#FAAD14', count: agencies.filter((a) => a.status === 'pending').length },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: item.color,
                    }}
                  />
                  <Text>{item.label}</Text>
                </div>
                <Tag color={item.color === '#52C41A' ? 'green' : item.color === '#FF4D4F' ? 'red' : 'orange'}>
                  {item.count}
                </Tag>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Card title="Top 5 đại lý theo đơn hàng">
        <Table
          dataSource={topAgencies}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}
