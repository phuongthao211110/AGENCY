import { useState } from 'react'
import { Table, Input, Select, Tag, Card, Typography, Modal, Descriptions, Row, Col, Button } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import allOrders from '../../../mock-data/orders.json'
import allShops from '../../../mock-data/shops.json'

import { AGENCY_BRAND as BRAND_COLOR } from '../../../theme/tokens'

const { Title } = Typography

type Order = typeof allOrders[0]

const myShopIds = allShops.filter((s) => s.agencyId === 'AGN001').map((s) => s.id)
const myOrders = allOrders.filter((o) => myShopIds.includes(o.shopId))

const statusMap: Record<string, { color: string; label: string }> = {
  delivered: { color: 'green', label: 'Đã giao' },
  in_transit: { color: 'blue', label: 'Đang giao' },
  pending: { color: 'orange', label: 'Chờ lấy' },
  failed: { color: 'red', label: 'Thất bại' },
}

export default function Orders() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const filtered = myOrders.filter((o) => {
    const matchSearch =
      o.trackingCode.toLowerCase().includes(search.toLowerCase()) ||
      o.receiverName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const columns = [
    { title: 'Mã vận đơn', dataIndex: 'trackingCode', key: 'trackingCode', width: 140 },
    { title: 'Shop', dataIndex: 'shopId', key: 'shopId', width: 90 },
    { title: 'Người nhận', dataIndex: 'receiverName', key: 'receiverName' },
    { title: 'Địa chỉ', dataIndex: 'receiverAddress', key: 'receiverAddress', ellipsis: true },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.label || s}</Tag>,
    },
    {
      title: 'COD',
      dataIndex: 'cod',
      key: 'cod',
      align: 'right' as const,
      render: (v: number) => `${v.toLocaleString()}đ`,
    },
    {
      title: 'Phí ship',
      dataIndex: 'fee',
      key: 'fee',
      align: 'right' as const,
      render: (v: number) => `${v.toLocaleString()}đ`,
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 110 },
    {
      title: 'Chi tiết',
      key: 'action',
      render: (_: unknown, record: Order) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setSelectedOrder(record)}>
          Xem
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: BRAND_COLOR }}>
        Danh sách đơn hàng
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm mã vận đơn, người nhận..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Lọc trạng thái"
              style={{ width: '100%' }}
              allowClear
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter(v || '')}
              options={[
                { value: 'delivered', label: 'Đã giao' },
                { value: 'in_transit', label: 'Đang giao' },
                { value: 'pending', label: 'Chờ lấy' },
                { value: 'failed', label: 'Thất bại' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        title={`Chi tiết đơn: ${selectedOrder?.trackingCode}`}
        open={!!selectedOrder}
        onCancel={() => setSelectedOrder(null)}
        footer={<Button onClick={() => setSelectedOrder(null)}>Đóng</Button>}
        width={640}
      >
        {selectedOrder && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã vận đơn" span={2}>{selectedOrder.trackingCode}</Descriptions.Item>
            <Descriptions.Item label="Người gửi">{selectedOrder.senderName}</Descriptions.Item>
            <Descriptions.Item label="SĐT gửi">{selectedOrder.senderPhone}</Descriptions.Item>
            <Descriptions.Item label="Người nhận">{selectedOrder.receiverName}</Descriptions.Item>
            <Descriptions.Item label="SĐT nhận">{selectedOrder.receiverPhone}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ nhận" span={2}>{selectedOrder.receiverAddress}</Descriptions.Item>
            <Descriptions.Item label="Khối lượng">{selectedOrder.weight}g</Descriptions.Item>
            <Descriptions.Item label="COD">{selectedOrder.cod.toLocaleString()}đ</Descriptions.Item>
            <Descriptions.Item label="Phí ship">{selectedOrder.fee.toLocaleString()}đ</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusMap[selectedOrder.status]?.color}>
                {statusMap[selectedOrder.status]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{selectedOrder.createdAt}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
