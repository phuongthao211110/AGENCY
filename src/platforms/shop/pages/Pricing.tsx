import { useState } from 'react'
import { Modal } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import allPricing from '../../../mock-data/pricing.json'
import allShops from '../../../mock-data/shops.json'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_ACTION         = '#FF5200'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

type PricingTable = typeof allPricing[0]

const myShop    = allShops.find((s) => s.id === 'SHP001')!
const myPricing = allPricing.filter((p) => p.agencyId === myShop.agencyId)

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
  const cell = (label: string, flex: string, minWidth: number) => (
    <div style={{ display: 'flex', flex, alignItems: 'center', minWidth, padding: '6px 8px' }}>
      <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{label}</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
      {cell('Tên bảng giá', '1 0 0',     200)}
      {cell('Mô tả',        '2 0 0',     200)}
      {cell('Trạng thái',   '0 0 140px', 140)}
      {cell('Ngày tạo',     '0 0 120px', 120)}
      {cell('',             '0 0 100px', 100)}
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
          <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK }}>{pricing.name}</span>
        </div>
        <div style={{ flex: '2 0 0', minWidth: 200, padding: '6px 8px', overflow: 'hidden' }}>
          <span style={{ fontSize: 14, color: C_TEXT_SECONDARY, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pricing.description}
          </span>
        </div>
        <div style={{ flex: '0 0 140px', minWidth: 140, padding: '6px 8px' }}>
          <StatusBadge status={pricing.status} />
        </div>
        <div style={{ flex: '0 0 120px', minWidth: 120, padding: '6px 8px' }}>
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{pricing.createdAt}</span>
        </div>
        <div style={{ flex: '0 0 100px', minWidth: 100, padding: '6px 8px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onView}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: C_ACTION, fontSize: 13, fontWeight: 600 }}
          >
            <EyeOutlined style={{ fontSize: 14 }} />
            Xem chi tiết
          </button>
        </div>
      </div>
      <div style={{ height: 1, background: C_BORDER }} />
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function ShopPricing() {
  const [selected, setSelected] = useState<PricingTable | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
            Bảng giá cước
          </h1>
          <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
            Bảng giá đang áp dụng cho shop của bạn
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: '1 0 0', overflowY: 'auto', padding: '0 16px' }}>
        <div style={{ minWidth: 760 }}>
          <THead />
          <div style={{ height: 1, background: C_BORDER }} />
          {myPricing.map((p) => (
            <TRow key={p.id} pricing={p} onView={() => setSelected(p)} />
          ))}
        </div>
      </div>

      {/* Detail modal */}
      <Modal
        title={<span style={{ fontWeight: 700, color: C_LINK }}>{selected?.name}</span>}
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={
          <button onClick={() => setSelected(null)} style={{ padding: '7px 20px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14, color: C_TEXT_PRIMARY }}>
            Đóng
          </button>
        }
        width={800}
      >
        {selected && (
          <>
            <div style={{ display: 'flex', gap: 24, padding: '8px 0 16px', borderBottom: `1px solid ${C_BORDER}`, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Mô tả</span>
                <p style={{ fontSize: 14, color: C_TEXT_PRIMARY, margin: '4px 0 0' }}>{selected.description}</p>
              </div>
              <div>
                <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Trạng thái</span>
                <div style={{ marginTop: 4 }}><StatusBadge status={selected.status} /></div>
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
                    {selected.zones.map((z) => (
                      <th key={z.label} style={{ border: `1px solid ${C_BORDER}`, padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: C_TEXT_SECONDARY }}>
                        {z.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.weights.map((w, wi) => (
                    <tr key={w.label}>
                      <td style={{ border: `1px solid ${C_BORDER}`, padding: '8px 12px', fontWeight: 500, color: C_TEXT_PRIMARY }}>
                        {w.label}
                      </td>
                      {selected.prices[wi].map((price, zi) => (
                        <td key={zi} style={{ border: `1px solid ${C_BORDER}`, padding: '8px 12px', textAlign: 'center', color: selected.status === 'active' ? C_ACTION : C_TEXT_PRIMARY, fontWeight: selected.status === 'active' ? 600 : 400 }}>
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
