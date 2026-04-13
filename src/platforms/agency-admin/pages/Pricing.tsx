import { useState } from 'react'
import { Card, Table, Tag, Button, Typography, Modal, Form, Input, Select, Descriptions } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import allPricing from '../../../mock-data/pricing.json'

import { AGENCY_BRAND as BRAND_COLOR } from '../../../theme/tokens'

const { Title, Text } = Typography

type PricingTable = typeof allPricing[0]

// Agency AGN001's pricing
const myPricing = allPricing.filter((p) => p.agencyId === 'AGN001')

export default function Pricing() {
  const [selectedPricing, setSelectedPricing] = useState<PricingTable | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createDone, setCreateDone] = useState(false)

  const columns = [
    { title: 'Tên bảng giá', dataIndex: 'name', key: 'name', render: (n: string) => <Text strong>{n}</Text> },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? 'Đang áp dụng' : 'Không áp dụng'}</Tag>,
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: 'Xem chi tiết',
      key: 'action',
      render: (_: unknown, record: PricingTable) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setSelectedPricing(record)}>
          Xem bảng giá
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: BRAND_COLOR }}>Bảng giá cước</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}

          onClick={() => { setCreateOpen(true); setCreateDone(false) }}
        >
          Tạo bảng giá mới
        </Button>
      </div>

      <Card>
        <Table dataSource={myPricing} columns={columns} rowKey="id" pagination={false} />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={selectedPricing?.name}
        open={!!selectedPricing}
        onCancel={() => setSelectedPricing(null)}
        footer={<Button onClick={() => setSelectedPricing(null)}>Đóng</Button>}
        width={800}
      >
        {selectedPricing && (
          <>
            <Descriptions bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Mô tả">{selectedPricing.description}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={selectedPricing.status === 'active' ? 'green' : 'default'}>
                  {selectedPricing.status === 'active' ? 'Đang áp dụng' : 'Không áp dụng'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Text strong>Bảng giá chi tiết (đơn vị: đồng):</Text>
            <div style={{ overflowX: 'auto', marginTop: 8 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ border: '1px solid #d9d9d9', padding: '8px 12px', textAlign: 'left' }}>
                      Khối lượng / Tuyến
                    </th>
                    {selectedPricing.zones.map((z) => (
                      <th key={z.label} style={{ border: '1px solid #d9d9d9', padding: '8px 12px', textAlign: 'center' }}>
                        {z.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedPricing.weights.map((w, wi) => (
                    <tr key={w.label} style={{ background: wi % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ border: '1px solid #d9d9d9', padding: '8px 12px', fontWeight: 500 }}>
                        {w.label}
                      </td>
                      {selectedPricing.prices[wi].map((price, zi) => (
                        <td
                          key={zi}
                          style={{ border: '1px solid #d9d9d9', padding: '8px 12px', textAlign: 'center' }}
                        >
                          {price.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        title="Tạo bảng giá mới"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
      >
        {createDone ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Tag color="green" style={{ fontSize: 16, padding: '8px 16px' }}>Tạo bảng giá thành công!</Tag>
            <br /><br />
            <Button type="primary" style={{ background: BRAND_COLOR }} onClick={() => setCreateOpen(false)}>
              Đóng
            </Button>
          </div>
        ) : (
          <Form layout="vertical" onFinish={() => setCreateDone(true)}>
            <Form.Item name="name" label="Tên bảng giá" rules={[{ required: true }]}>
              <Input placeholder="VD: Bảng giá Q3/2024" />
            </Form.Item>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={2} placeholder="Mô tả bảng giá" />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" initialValue="inactive">
              <Select options={[{ value: 'active', label: 'Đang áp dụng' }, { value: 'inactive', label: 'Không áp dụng' }]} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block style={{ background: BRAND_COLOR }}>
                Tạo bảng giá
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}
