import { useState } from 'react'
import { Card, Table, Tag, Button, Typography, Modal, Descriptions, Statistic, Row, Col } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import allReconciliation from '../../../mock-data/reconciliation.json'

import { SHOP_BRAND as BRAND_COLOR } from '../../../theme/tokens'

const { Title } = Typography

type RecSession = typeof allReconciliation[0]

// Shop SHP001
const myRec = allReconciliation.filter((r) => r.shopId === 'SHP001')

const statusMap: Record<string, { color: string; label: string }> = {
  completed: { color: 'green', label: 'Đã thanh toán' },
  processing: { color: 'blue', label: 'Đang xử lý' },
  pending: { color: 'orange', label: 'Chờ xử lý' },
}

export default function ShopReconciliation() {
  const [selected, setSelected] = useState<RecSession | null>(null)

  const columns = [
    { title: 'Mã phiên', dataIndex: 'id', key: 'id' },
    { title: 'Kỳ đối soát', dataIndex: 'period', key: 'period' },
    { title: 'Số đơn', dataIndex: 'totalOrders', key: 'totalOrders', align: 'right' as const },
    {
      title: 'Tổng COD',
      dataIndex: 'totalCOD',
      key: 'totalCOD',
      align: 'right' as const,
      render: (v: number) => `${v.toLocaleString()}đ`,
    },
    {
      title: 'Phí ship',
      dataIndex: 'totalFee',
      key: 'totalFee',
      align: 'right' as const,
      render: (v: number) => `${v.toLocaleString()}đ`,
    },
    {
      title: 'Nhận về',
      dataIndex: 'netAmount',
      key: 'netAmount',
      align: 'right' as const,
      render: (v: number) => (
        <span style={{ color: BRAND_COLOR, fontWeight: 700 }}>{v.toLocaleString()}đ</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.label}</Tag>,
    },
    {
      title: '',
      key: 'action',
      render: (_: unknown, record: RecSession) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setSelected(record)}>Xem</Button>
      ),
    },
  ]

  const totalReceived = myRec
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.netAmount, 0)

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: BRAND_COLOR }}>
        Đối soát
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Tổng phiên" value={myRec.length} valueStyle={{ color: BRAND_COLOR }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đã nhận"
              value={totalReceived}
              suffix="đ"
              formatter={(v) => Number(v).toLocaleString()}
              valueStyle={{ color: BRAND_COLOR }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Chờ thanh toán"
              value={myRec.filter((r) => r.status !== 'completed').length}
              suffix="phiên"
              valueStyle={{ color: '#FA8C16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table dataSource={myRec} columns={columns} rowKey="id" pagination={false} scroll={{ x: 700 }} />
      </Card>

      <Modal
        title={`Phiên đối soát: ${selected?.id}`}
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={<Button onClick={() => setSelected(null)}>Đóng</Button>}
      >
        {selected && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Kỳ đối soát">{selected.period}</Descriptions.Item>
            <Descriptions.Item label="Số đơn hàng">{selected.totalOrders}</Descriptions.Item>
            <Descriptions.Item label="Tổng COD thu hộ">{selected.totalCOD.toLocaleString()}đ</Descriptions.Item>
            <Descriptions.Item label="Phí dịch vụ">{selected.totalFee.toLocaleString()}đ</Descriptions.Item>
            <Descriptions.Item label="Số tiền nhận về">
              <span style={{ fontSize: 18, fontWeight: 700, color: BRAND_COLOR }}>
                {selected.netAmount.toLocaleString()}đ
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusMap[selected.status]?.color}>{statusMap[selected.status]?.label}</Tag>
            </Descriptions.Item>
            {selected.transferDate && (
              <Descriptions.Item label="Ngày chuyển khoản">{selected.transferDate}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
