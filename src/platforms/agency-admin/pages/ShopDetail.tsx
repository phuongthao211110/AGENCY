import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Table, Typography, Row, Col, Statistic, Space } from 'antd'
import { ArrowLeftOutlined, InboxOutlined } from '@ant-design/icons'
import allShops from '../../../mock-data/shops.json'
import allOrders from '../../../mock-data/orders.json'

import { AGENCY_BRAND as BRAND_COLOR } from '../../../theme/tokens'

const { Title } = Typography

export default function ShopDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const shop = allShops.find((s) => s.id === id)
  const shopOrders = allOrders.filter((o) => o.shopId === id)

  if (!shop) {
    return (
      <Card>
        <Typography.Text type="danger">Không tìm thấy shop.</Typography.Text>
        <Button onClick={() => navigate('/agency-admin/shops')} style={{ marginLeft: 12 }}>Quay lại</Button>
      </Card>
    )
  }

  const orderColumns = [
    { title: 'Mã vận đơn', dataIndex: 'trackingCode', key: 'trackingCode' },
    { title: 'Người nhận', dataIndex: 'receiverName', key: 'receiverName' },
    { title: 'Địa chỉ', dataIndex: 'receiverAddress', key: 'receiverAddress', ellipsis: true },
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
    { title: 'COD', dataIndex: 'cod', key: 'cod', align: 'right' as const, render: (v: number) => `${v.toLocaleString()}đ` },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt' },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/agency-admin/shops')}>Quay lại</Button>
        <Title level={4} style={{ margin: 0, color: BRAND_COLOR }}>{shop.name}</Title>
      </Space>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Tổng đơn" value={shopOrders.length} prefix={<InboxOutlined style={{ color: BRAND_COLOR }} />} valueStyle={{ color: BRAND_COLOR }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đã giao thành công"
              value={shopOrders.filter((o) => o.status === 'delivered').length}
              valueStyle={{ color: '#52C41A' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng COD"
              value={shopOrders.reduce((s, o) => s + o.cod, 0)}
              suffix="đ"
              formatter={(v) => Number(v).toLocaleString()}
              valueStyle={{ color: '#FA8C16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Thông tin shop" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Tên shop">{shop.name}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{shop.phone}</Descriptions.Item>
          <Descriptions.Item label="Username">{shop.username}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{shop.createdAt}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={shop.status === 'active' ? 'green' : 'red'}>
              {shop.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">{shop.address}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={`Lịch sử đơn hàng (${shopOrders.length})`}>
        <Table
          dataSource={shopOrders}
          columns={orderColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 700 }}
        />
      </Card>
    </div>
  )
}
