import { useState } from 'react'
import { Modal, Form, Input, Select } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import allPricing from '../../../mock-data/pricing.json'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_ACTION         = '#FF5200'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

type PricingTable = typeof allPricing[0]

const myPricing = allPricing.filter((p) => p.agencyId === 'AGN001')

// ── Status badge ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const active = status === 'active'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 12,
      background: active ? '#F0FDF4' : '#F3F4F6',
      color: active ? '#16A34A' : '#6B7280',
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {active ? 'Đang áp dụng' : 'Không áp dụng'}
    </span>
  )
}

// ── Table header ─────────────────────────────────────────────
function THead() {
  const cell = (label: string, flex: string, minWidth: number, align: 'left' | 'right' = 'left') => (
    <div style={{ display: 'flex', flex, alignItems: 'center', minWidth, padding: '6px 8px' }}>
      <span style={{ flex: 1, fontSize: 14, color: C_TEXT_SECONDARY, textAlign: align, lineHeight: '20px' }}>{label}</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
      {cell('Tên bảng giá',  '1 0 0',     200)}
      {cell('Mô tả',         '2 0 0',     200)}
      {cell('Trạng thái',    '0 0 140px', 140)}
      {cell('Ngày tạo',      '0 0 120px', 120)}
      {cell('',              '0 0 120px', 120)}
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────
function TRow({ pricing, onView }: { pricing: PricingTable; onView: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <>
      <div
        style={{ display: 'flex', alignItems: 'center', background: hover ? '#FAFAFA' : '#fff', transition: 'background 0.1s' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div style={{ flex: '1 0 0', minWidth: 200, padding: '6px 8px' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px' }}>{pricing.name}</span>
        </div>
        <div style={{ flex: '2 0 0', minWidth: 200, padding: '6px 8px', overflow: 'hidden' }}>
          <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pricing.description}
          </span>
        </div>
        <div style={{ flex: '0 0 140px', minWidth: 140, padding: '6px 8px' }}>
          <StatusBadge status={pricing.status} />
        </div>
        <div style={{ flex: '0 0 120px', minWidth: 120, padding: '6px 8px' }}>
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{pricing.createdAt}</span>
        </div>
        <div style={{ flex: '0 0 120px', minWidth: 120, padding: '6px 8px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onView}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: C_ACTION, fontSize: 13, fontWeight: 600, padding: '2px 4px' }}
          >
            <EyeOutlined style={{ fontSize: 14 }} />
            Xem bảng giá
          </button>
        </div>
      </div>
      <div style={{ height: 1, background: C_BORDER }} />
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function Pricing() {
  const [selectedPricing, setSelectedPricing] = useState<PricingTable | null>(null)
  const [createOpen, setCreateOpen]           = useState(false)
  const [createDone, setCreateDone]           = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
            Bảng giá cước
          </h1>
          <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
            Quản lý các bảng giá áp dụng cho shop
          </p>
        </div>
        <button
          onClick={() => { setCreateOpen(true); setCreateDone(false) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <PlusOutlined style={{ color: '#fff', fontSize: 14 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Tạo bảng giá mới</span>
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: '1 0 0', overflowY: 'auto', padding: '0 16px' }}>
        <div style={{ minWidth: 780 }}>
          <THead />
          <div style={{ height: 1, background: C_BORDER }} />
          {myPricing.map((p) => (
            <TRow key={p.id} pricing={p} onView={() => setSelectedPricing(p)} />
          ))}
        </div>
      </div>

      {/* Detail modal */}
      <Modal
        title={<span style={{ fontWeight: 700, color: C_LINK }}>{selectedPricing?.name}</span>}
        open={!!selectedPricing}
        onCancel={() => setSelectedPricing(null)}
        footer={
          <button onClick={() => setSelectedPricing(null)} style={{ padding: '7px 20px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14, color: C_TEXT_PRIMARY }}>
            Đóng
          </button>
        }
        width={800}
      >
        {selectedPricing && (
          <>
            <div style={{ display: 'flex', gap: 24, padding: '8px 0 16px', borderBottom: `1px solid ${C_BORDER}`, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Mô tả</span>
                <p style={{ fontSize: 14, color: C_TEXT_PRIMARY, margin: '4px 0 0' }}>{selectedPricing.description}</p>
              </div>
              <div>
                <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Trạng thái</span>
                <div style={{ marginTop: 4 }}><StatusBadge status={selectedPricing.status} /></div>
              </div>
            </div>

            <p style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY, margin: '0 0 8px' }}>Bảng giá chi tiết (đơn vị: đồng):</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C_BG_HEADER }}>
                    <th style={{ border: `1px solid ${C_BORDER}`, padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: C_TEXT_SECONDARY }}>
                      Khối lượng / Tuyến
                    </th>
                    {selectedPricing.zones.map((z) => (
                      <th key={z.label} style={{ border: `1px solid ${C_BORDER}`, padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: C_TEXT_SECONDARY }}>
                        {z.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedPricing.weights.map((w, wi) => (
                    <tr key={w.label}>
                      <td style={{ border: `1px solid ${C_BORDER}`, padding: '8px 12px', fontWeight: 500, color: C_TEXT_PRIMARY }}>
                        {w.label}
                      </td>
                      {selectedPricing.prices[wi].map((price, zi) => (
                        <td key={zi} style={{ border: `1px solid ${C_BORDER}`, padding: '8px 12px', textAlign: 'center', color: C_TEXT_PRIMARY }}>
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

      {/* Create modal */}
      <Modal
        title="Tạo bảng giá mới"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
      >
        {createDone ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#F0FDF4', borderRadius: 8, color: '#16A34A', fontSize: 15, fontWeight: 600 }}>
              Tạo bảng giá thành công!
            </div>
            <div style={{ marginTop: 20 }}>
              <button onClick={() => setCreateOpen(false)} style={{ padding: '8px 24px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff' }}>
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <Form layout="vertical" onFinish={() => setCreateDone(true)} style={{ paddingTop: 4 }}>
            <Form.Item name="name" label="Tên bảng giá" rules={[{ required: true }]}>
              <Input placeholder="VD: Bảng giá Q3/2024" />
            </Form.Item>
            <Form.Item name="description" label="Mô tả">
              <Input.TextArea rows={2} placeholder="Mô tả bảng giá" />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" initialValue="inactive">
              <Select options={[
                { value: 'active',   label: 'Đang áp dụng' },
                { value: 'inactive', label: 'Không áp dụng' },
              ]} />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <button type="submit" style={{ width: '100%', padding: '9px 0', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#fff' }}>
                Tạo bảng giá
              </button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}
