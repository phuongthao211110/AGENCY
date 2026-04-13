import { useState } from 'react'
import { Card, Table, Tag, Button, Typography, Modal, Descriptions } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import allPricing from '../../../mock-data/pricing.json'
import allShops from '../../../mock-data/shops.json'

import { SHOP_BRAND as BRAND_COLOR } from '../../../theme/tokens'

const { Title, Text } = Typography

type PricingTable = typeof allPricing[0]

// Shop SHP001 belongs to AGN001
const myShop = allShops.find((s) => s.id === 'SHP001')!
const myPricing = allPricing.filter((p) => p.agencyId === myShop.agencyId)

export default function ShopPricing() {
  const [selected, setSelected] = useState<PricingTable | null>(null)

  const columns = [
    {
      title: 'Tên bảng giá',
      dataIndex: 'name',
      key: 'name',
      render: (n: string) => <Text strong>{n}</Text>,
    },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'active' ? 'green' : 'default'}>
          {s === 'active' ? 'Đang áp dụng' : 'Không áp dụng'}
        </Tag>
      ),
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '',
      key: 'action',
      render: (_: unknown, record: PricingTable) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setSelected(record)}>
          Xem chi tiết
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: BRAND_COLOR }}>
        Bảng giá cước
      </Title>

      <Card>
        <Table
          dataSource={myPricing}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={selected?.name}
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={<Button onClick={() => setSelected(null)}>Đóng</Button>}
        width={800}
      >
        {selected && (
          <>
            <Descriptions bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Mô tả" span={2}>
                {selected.description}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={selected.status === 'active' ? 'green' : 'default'}>
                  {selected.status === 'active' ? 'Đang áp dụng' : 'Không áp dụng'}
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
                    {selected.zones.map((z) => (
                      <th
                        key={z.label}
                        style={{ border: '1px solid #d9d9d9', padding: '8px 12px', textAlign: 'center' }}
                      >
                        {z.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.weights.map((w, wi) => (
                    <tr key={w.label} style={{ background: wi % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ border: '1px solid #d9d9d9', padding: '8px 12px', fontWeight: 500 }}>
                        {w.label}
                      </td>
                      {selected.prices[wi].map((price, zi) => (
                        <td
                          key={zi}
                          style={{
                            border: '1px solid #d9d9d9',
                            padding: '8px 12px',
                            textAlign: 'center',
                            color: selected.status === 'active' ? BRAND_COLOR : undefined,
                            fontWeight: selected.status === 'active' ? 600 : undefined,
                          }}
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
    </div>
  )
}
