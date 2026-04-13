import { Card, Row, Col, Statistic, Table, Tag, Typography } from 'antd'
import {
  ShopOutlined,
  InboxOutlined,
  DollarOutlined,
  ReconciliationOutlined,
} from '@ant-design/icons'
import shops from '../../../mock-data/shops.json'
import orders from '../../../mock-data/orders.json'
import reconciliation from '../../../mock-data/reconciliation.json'

import { AGENCY_BRAND as BRAND_COLOR } from '../../../theme/tokens'

const { Title } = Typography

// Simulate this agency's data (AGN001)
const myShops = shops.filter((s) => s.agencyId === 'AGN001')
const myOrders = orders.filter((o) => myShops.some((s) => s.id === o.shopId))
const pendingReconciliations = reconciliation.filter(
  (r) => r.agencyId === 'AGN001' && r.status === 'pending'
)
const todayOrders = myOrders.slice(0, 5)

const recentOrderColumns = [
  { title: 'Mã vận đơn', dataIndex: 'trackingCode', key: 'trackingCode' },
  { title: 'Shop', dataIndex: 'shopId', key: 'shopId' },
  { title: 'Người nhận', dataIndex: 'receiverName', key: 'receiverName' },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (s: string) => {
      const map: Record<string, { color: string; label: string }> = {
        delivered: { color: 'green', label: 'Đã giao' },
        in_transit: { color: 'blue', label: 'Đang giao' },
        pending: { color: 'orange', label: 'Chờ lấy' },
        failed: { color: 'red', label: 'Thất bại' },
      }
      return <Tag color={map[s]?.color}>{map[s]?.label || s}</Tag>
    },
  },
  {
    title: 'COD',
    dataIndex: 'cod',
    key: 'cod',
    align: 'right' as const,
    render: (v: number) => `${v.toLocaleString()}đ`,
  },
]

export default function AgencyAdminDashboard() {
  const totalCOD = myOrders.reduce((sum, o) => sum + o.cod, 0)

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: BRAND_COLOR }}>
        Dashboard Đại lý
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng shop"
              value={myShops.length}
              prefix={<ShopOutlined style={{ color: BRAND_COLOR }} />}
              valueStyle={{ color: BRAND_COLOR }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={myOrders.length}
              prefix={<InboxOutlined style={{ color: '#52C41A' }} />}
              valueStyle={{ color: '#52C41A' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng COD (tháng)"
              value={totalCOD}
              prefix={<DollarOutlined style={{ color: '#FA8C16' }} />}
              valueStyle={{ color: '#FA8C16' }}
              suffix="đ"
              formatter={(v) => Number(v).toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đối soát chờ xử lý"
              value={pendingReconciliations.length}
              prefix={<ReconciliationOutlined style={{ color: '#FF4D4F' }} />}
              valueStyle={{ color: '#FF4D4F' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Đơn hàng gần đây">
            <Table
              dataSource={todayOrders}
              columns={recentOrderColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Thống kê trạng thái đơn">
            {[
              { label: 'Đã giao', color: '#52C41A', status: 'delivered' },
              { label: 'Đang giao', color: '#1890FF', status: 'in_transit' },
              { label: 'Chờ lấy', color: '#FAAD14', status: 'pending' },
              { label: 'Thất bại', color: '#FF4D4F', status: 'failed' },
            ].map((item) => {
              const count = myOrders.filter((o) => o.status === item.status).length
              return (
                <div
                  key={item.status}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color }} />
                    <Typography.Text>{item.label}</Typography.Text>
                  </div>
                  <Tag>{count}</Tag>
                </div>
              )
            })}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
