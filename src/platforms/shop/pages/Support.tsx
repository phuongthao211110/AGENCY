import { useState } from 'react'
import { Card, Typography, Collapse, Form, Input, Select, Button, Tag, Table, Modal } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { Row, Col } from 'antd'

import { SHOP_BRAND as BRAND_COLOR } from '../../../theme/tokens'

const { Title, Text, Paragraph } = Typography

const { Panel } = Collapse

const faqs = [
  {
    key: '1',
    question: 'Làm thế nào để tạo đơn hàng mới?',
    answer:
      'Truy cập vào mục "Đơn hàng" trên menu bên trái, sau đó nhấn nút "Tạo đơn hàng". Điền đầy đủ thông tin người gửi, người nhận, khối lượng và chọn dịch vụ phù hợp.',
  },
  {
    key: '2',
    question: 'Tôi có thể hủy đơn hàng không?',
    answer:
      'Bạn có thể hủy đơn hàng khi đơn còn ở trạng thái "Chờ lấy hàng". Khi đơn đã được bàn giao cho GHN, bạn cần liên hệ hotline để được hỗ trợ.',
  },
  {
    key: '3',
    question: 'Tiền COD được chuyển khoản khi nào?',
    answer:
      'Tiền COD (thu hộ) sẽ được đối soát và chuyển khoản theo kỳ đối soát định kỳ. Bạn có thể xem lịch sử đối soát tại mục "Đối soát" trên menu.',
  },
  {
    key: '4',
    question: 'Đơn hàng bị hoàn, tôi phải làm gì?',
    answer:
      'Khi đơn bị hoàn, GHN sẽ trả hàng về địa chỉ lấy hàng ban đầu. Bạn sẽ nhận được thông báo và cần xác nhận nhận hàng hoàn. Phí hoàn hàng sẽ được trừ vào kỳ đối soát.',
  },
  {
    key: '5',
    question: 'Bảng giá của tôi được tính như thế nào?',
    answer:
      'Cước phí được tính dựa trên khối lượng thực tế hoặc khối lượng quy đổi (dài × rộng × cao / 5000), áp dụng mức cao hơn. Xem chi tiết tại mục "Bảng giá".',
  },
]

type TicketStatus = 'open' | 'processing' | 'resolved'

interface Ticket {
  id: string
  subject: string
  category: string
  status: TicketStatus
  createdAt: string
  content: string
}

const mockTickets: Ticket[] = [
  {
    id: 'TK001',
    subject: 'Đơn hàng GHN12345 chưa được giao',
    category: 'Tra cứu đơn hàng',
    status: 'processing',
    createdAt: '2024-06-01',
    content: 'Đơn hàng GHN12345 đã 3 ngày chưa được giao, nhờ kiểm tra giúp.',
  },
  {
    id: 'TK002',
    subject: 'Yêu cầu điều chỉnh bảng giá',
    category: 'Bảng giá',
    status: 'resolved',
    createdAt: '2024-05-20',
    content: 'Nhờ cập nhật bảng giá mới theo hợp đồng đã ký.',
  },
]

const statusMap: Record<TicketStatus, { color: string; label: string }> = {
  open: { color: 'orange', label: 'Mới tạo' },
  processing: { color: 'blue', label: 'Đang xử lý' },
  resolved: { color: 'green', label: 'Đã giải quyết' },
}

const categoryOptions = [
  { value: 'Tra cứu đơn hàng', label: 'Tra cứu đơn hàng' },
  { value: 'Bảng giá', label: 'Bảng giá' },
  { value: 'Đối soát / Thanh toán', label: 'Đối soát / Thanh toán' },
  { value: 'Hủy / Hoàn đơn', label: 'Hủy / Hoàn đơn' },
  { value: 'Khác', label: 'Khác' },
]

export default function Support() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets)
  const [createOpen, setCreateOpen] = useState(false)
  const [createDone, setCreateDone] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [form] = Form.useForm()

  const handleCreate = (values: { subject: string; category: string; content: string }) => {
    const newTicket: Ticket = {
      id: `TK${String(tickets.length + 1).padStart(3, '0')}`,
      subject: values.subject,
      category: values.category,
      status: 'open',
      createdAt: new Date().toISOString().slice(0, 10),
      content: values.content,
    }
    setTickets([newTicket, ...tickets])
    setCreateDone(true)
  }

  const columns = [
    { title: 'Mã yêu cầu', dataIndex: 'id', key: 'id', width: 100 },
    {
      title: 'Tiêu đề',
      dataIndex: 'subject',
      key: 'subject',
      render: (s: string) => <Text strong>{s}</Text>,
    },
    { title: 'Danh mục', dataIndex: 'category', key: 'category' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s: TicketStatus) => (
        <Tag color={statusMap[s]?.color}>{statusMap[s]?.label}</Tag>
      ),
    },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 110 },
    {
      title: '',
      key: 'action',
      render: (_: unknown, record: Ticket) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setSelectedTicket(record)}>
          Xem
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20, color: BRAND_COLOR }}>
        Hỗ trợ
      </Title>

      <Row gutter={[16, 16]}>
        {/* FAQ */}
        <Col xs={24} lg={12}>
          <Card title={<Text strong>Câu hỏi thường gặp</Text>} style={{ marginBottom: 0 }}>
            <Collapse bordered={false} style={{ background: 'transparent' }}>
              {faqs.map((faq) => (
                <Panel
                  header={<Text strong>{faq.question}</Text>}
                  key={faq.key}
                  style={{ borderBottom: '1px solid #f0f0f0' }}
                >
                  <Paragraph style={{ margin: 0, color: '#555' }}>{faq.answer}</Paragraph>
                </Panel>
              ))}
            </Collapse>
          </Card>
        </Col>

        {/* Hotline */}
        <Col xs={24} lg={12}>
          <Card title={<Text strong>Liên hệ hỗ trợ</Text>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '12px 16px', background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                <Text strong style={{ color: BRAND_COLOR }}>Hotline đại lý</Text>
                <br />
                <Text style={{ fontSize: 20, fontWeight: 700, color: '#333' }}>1900 636 677</Text>
                <br />
                <Text type="secondary">Thứ 2 - Thứ 7: 7:30 - 21:00 | CN: 7:30 - 17:00</Text>
              </div>
              <div style={{ padding: '12px 16px', background: '#e6f7ff', borderRadius: 8, border: '1px solid #91d5ff' }}>
                <Text strong style={{ color: '#1890FF' }}>Email hỗ trợ</Text>
                <br />
                <Text style={{ fontSize: 15, color: '#333' }}>support@ghn.vn</Text>
                <br />
                <Text type="secondary">Phản hồi trong vòng 24 giờ làm việc</Text>
              </div>
              <div style={{ padding: '12px 16px', background: '#fff7e6', borderRadius: 8, border: '1px solid #ffd591' }}>
                <Text strong style={{ color: '#FA8C16' }}>Tên đại lý của bạn</Text>
                <br />
                <Text style={{ fontSize: 15, color: '#333' }}>Hà Nội Central</Text>
                <br />
                <Text type="secondary">Mã đại lý: AGN001</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* Tickets */}
        <Col xs={24}>
          <Card
            title={<Text strong>Yêu cầu hỗ trợ của tôi</Text>}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
      
                onClick={() => { setCreateOpen(true); setCreateDone(false); form.resetFields() }}
              >
                Tạo yêu cầu mới
              </Button>
            }
          >
            <Table
              dataSource={tickets}
              columns={columns}
              rowKey="id"
              pagination={false}
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Create ticket modal */}
      <Modal
        title="Tạo yêu cầu hỗ trợ"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
      >
        {createDone ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Tag color="green" style={{ fontSize: 16, padding: '8px 16px' }}>
              Gửi yêu cầu thành công!
            </Tag>
            <br />
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.
            </Text>
            <br />
            <Button
              type="primary"
    
              onClick={() => setCreateOpen(false)}
            >
              Đóng
            </Button>
          </div>
        ) : (
          <Form layout="vertical" form={form} onFinish={handleCreate}>
            <Form.Item name="category" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}>
              <Select options={categoryOptions} placeholder="Chọn danh mục" />
            </Form.Item>
            <Form.Item name="subject" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
              <Input placeholder="Mô tả ngắn gọn vấn đề" />
            </Form.Item>
            <Form.Item name="content" label="Nội dung chi tiết" rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}>
              <Input.TextArea rows={4} placeholder="Mô tả chi tiết vấn đề của bạn..." />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
      
              >
                Gửi yêu cầu
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Ticket detail modal */}
      <Modal
        title={`Yêu cầu: ${selectedTicket?.id}`}
        open={!!selectedTicket}
        onCancel={() => setSelectedTicket(null)}
        footer={<Button onClick={() => setSelectedTicket(null)}>Đóng</Button>}
      >
        {selectedTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <Text type="secondary">Tiêu đề</Text>
              <br />
              <Text strong>{selectedTicket.subject}</Text>
            </div>
            <div>
              <Text type="secondary">Danh mục</Text>
              <br />
              <Text>{selectedTicket.category}</Text>
            </div>
            <div>
              <Text type="secondary">Trạng thái</Text>
              <br />
              <Tag color={statusMap[selectedTicket.status]?.color}>
                {statusMap[selectedTicket.status]?.label}
              </Tag>
            </div>
            <div>
              <Text type="secondary">Ngày tạo</Text>
              <br />
              <Text>{selectedTicket.createdAt}</Text>
            </div>
            <div>
              <Text type="secondary">Nội dung</Text>
              <br />
              <div style={{ background: '#f5f5f5', padding: '10px 14px', borderRadius: 6, marginTop: 4 }}>
                <Text>{selectedTicket.content}</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
