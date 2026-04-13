import { useState } from 'react'
import { Card, Table, Tag, Button, Typography, Modal, Descriptions, Statistic, Row, Col } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import allReconciliation from '../../../mock-data/reconciliation.json'
import allShops from '../../../mock-data/shops.json'

import { AGENCY_BRAND as BRAND_COLOR } from '../../../theme/tokens'

const { Title } = Typography

type RecSession = typeof allReconciliation[0]

const myRec = allReconciliation.filter((r) => r.agencyId === 'AGN001')

const statusMap: Record<string, { color: string; label: string }> = {
  completed: { color: 'green', label: 'Đã hoàn tất' },
  processing: { color: 'blue', label: 'Đang xử lý' },
  pending: { color: 'orange', label: 'Chờ xử lý' },
}

export default function Reconciliation() {
  const [selected, setSelected] = useState<RecSession | null>(null)

  const columns = [
    { title: 'Mã', dataIndex: 'id', key: 'id', width: 90 },
    {
      title: 'Shop',
      dataIndex: 'shopId',
      key: 'shopId',
      render: (id: string) => allShops.find((s) => s.id === id)?.name || id,
    },
    { title: 'Kỳ đối soát', dataIndex: 'period', key: 'period' },
    {
      title: 'Số đơn',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      align: 'right' as const,
    },
    {
      title: 'Tổng COD',
      dataIndex: 'totalCOD',
      key: 'totalCOD',
      align: 'right' as const,
      render: (v: number) => `${v.toLocaleString()}đ`,
    },
    {
      title: 'Số tiền CK',
      dataIndex: 'netAmount',
      key: 'netAmount',
      align: 'right' as const,
      render: (v: number) => <span style={{ color: '#52C41A', fontWeight: 600 }}>{v.toLocaleString()}đ</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.label || s}</Tag>,
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: 'Chi tiết',
      key: 'action',
      render: (_: unknown, record: RecSession) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setSelected(record)}>Xem</Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: BRAND_COLOR }}>
        Đối soát & Chuyển khoản
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng phiên đối soát"
              value={myRec.length}
              valueStyle={{ color: BRAND_COLOR }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Đã hoàn tất"
              value={myRec.filter((r) => r.status === 'completed').length}
              valueStyle={{ color: '#52C41A' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Chờ xử lý"
              value={myRec.filter((r) => r.status !== 'completed').length}
              valueStyle={{ color: '#FA8C16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          dataSource={myRec}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        title={`Chi tiết phiên đối soát: ${selected?.id}`}
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={<Button onClick={() => setSelected(null)}>Đóng</Button>}
        width={640}
      >
        {selected && (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Statistic title="Tổng COD" value={selected.totalCOD} suffix="đ" formatter={(v) => Number(v).toLocaleString()} />
              </Col>
              <Col span={12}>
                <Statistic title="Tổng phí ship" value={selected.totalFee} suffix="đ" formatter={(v) => Number(v).toLocaleString()} />
              </Col>
            </Row>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Shop">
                {allShops.find((s) => s.id === selected.shopId)?.name || selected.shopId}
              </Descriptions.Item>
              <Descriptions.Item label="Kỳ đối soát">{selected.period}</Descriptions.Item>
              <Descriptions.Item label="Số đơn">{selected.totalOrders}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusMap[selected.status]?.color}>{statusMap[selected.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Số tiền chuyển khoản" span={2}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#52C41A' }}>
                  {selected.netAmount.toLocaleString()}đ
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày chuyển khoản">
                {selected.transferDate || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo phiên">{selected.createdAt}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  )
}
