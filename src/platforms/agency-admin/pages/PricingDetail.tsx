import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  SwapRightOutlined,
} from '@ant-design/icons'
import allPriceTables from '../../../mock-data/pricing.json'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'info' | 'history'
type EditHistoryItem = { id: string; date: string; time: string; operator: string; field: string; oldValue: string; newValue: string }

// ─── Mock history data ────────────────────────────────────────────────────────
const PRICING_HISTORY: EditHistoryItem[] = [
  { id: '1', date: '2024-03-10', time: '11:20', operator: 'Admin Đại lý', field: 'Tên bảng giá', oldValue: 'Bảng giá 2023', newValue: 'Bảng giá tiêu chuẩn 2024' },
  { id: '2', date: '2024-03-10', time: '11:15', operator: 'Admin Đại lý', field: 'Trạng thái', oldValue: 'Tắt', newValue: 'Đang hoạt động' },
  { id: '3', date: '2024-02-20', time: '14:30', operator: 'Super Admin', field: 'Tuyến vận chuyển', oldValue: '3 tuyến', newValue: '5 tuyến' },
  { id: '4', date: '2024-02-20', time: '09:00', operator: 'Super Admin', field: 'Phí COD', oldValue: '2.5%', newValue: '2.8%' },
  { id: '5', date: '2024-01-05', time: '10:00', operator: 'Super Admin', field: 'Mô tả', oldValue: '', newValue: 'Áp dụng cho tất cả shop trong đại lý' },
]

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'info',    label: 'Thông tin',         icon: <InfoCircleOutlined /> },
  { key: 'history', label: 'Lịch sử chỉnh sửa', icon: <HistoryOutlined /> },
]

// ─── LabelValue ───────────────────────────────────────────────────────────────
function LabelValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>{label}</span>
      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, fontWeight: 500, lineHeight: '20px' }}>{value}</span>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PricingDetail() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('info')

  const pt = allPriceTables.find((p) => p.id === id)
  if (!pt) return <div style={{ padding: 32, color: C_TEXT_PRIMARY }}>Không tìm thấy bảng giá</div>

  const centeredBox: React.CSSProperties = {
    width: '100%', maxWidth: 1024, boxSizing: 'border-box', alignSelf: 'center', margin: '0 auto',
  }

  const statusBadge = pt.status === 'active'
    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#D1FAE5', color: '#065F46' }}>Đang hoạt động</span>
    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#F3F4F6', color: '#6B7280' }}>Tắt</span>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#F9FAFB', alignItems: 'center' }}>

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ ...centeredBox, display: 'flex', alignItems: 'center', gap: 12, padding: '24px 80px', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/agency-admin/carrier-setup/pricing')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeftOutlined style={{ fontSize: 20, color: C_TEXT_PRIMARY }} />
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '28px' }}>
            {pt.name}
          </span>
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{pt.id}</span>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div style={{ ...centeredBox, padding: '0 80px', flexShrink: 0 }}>
        <div style={{ display: 'flex', borderBottom: `1px solid ${C_BORDER}` }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <div key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', fontSize: 14, fontWeight: 600,
                  color: isActive ? C_TEXT_PRIMARY : C_TEXT_SECONDARY,
                  cursor: 'pointer', userSelect: 'none',
                  background: isActive ? '#fff' : 'transparent',
                  border: isActive ? `1px solid ${C_BORDER}` : '1px solid transparent',
                  borderBottom: isActive ? '1px solid #fff' : '1px solid transparent',
                  borderRadius: '8px 8px 0 0',
                  marginBottom: -1,
                }}>
                <span style={{ fontSize: 14 }}>{tab.icon}</span>
                {tab.label}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────── */}
      <div style={{ flex: '1 0 0', overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* ── Tab: Thông tin ── */}
        {activeTab === 'info' && (
          <div style={{ ...centeredBox, padding: '16px 80px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Basic info card */}
            <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0px 1px 2px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>
                Thông tin cơ bản
              </div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                <LabelValue label="Tên bảng giá" value={pt.name} />
                <LabelValue label="Ngày tạo" value={pt.createdAt ? pt.createdAt.split('-').reverse().join('/') : '—'} />
                <LabelValue label="Mô tả" value={pt.description || <span style={{ color: C_TEXT_SECONDARY }}>—</span>} />
                <LabelValue label="Trạng thái" value={statusBadge} />
              </div>
            </div>

            {/* Zones card */}
            <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0px 1px 2px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>
                Tuyến vận chuyển
              </div>
              {/* Table header */}
              <div style={{ display: 'flex', background: C_BG_HEADER }}>
                <div style={{ flex: '1 0 0', padding: '8px 16px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Từ</div>
                <div style={{ flex: '1 0 0', padding: '8px 16px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Đến</div>
                <div style={{ flex: '2 0 0', padding: '8px 16px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Nhãn</div>
              </div>
              <div style={{ height: 1, background: C_BORDER }} />
              {pt.zones.map((zone, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: '1 0 0', padding: '10px 16px', fontSize: 14, color: C_TEXT_PRIMARY }}>{zone.from}</div>
                    <div style={{ flex: '1 0 0', padding: '10px 16px', fontSize: 14, color: C_TEXT_PRIMARY }}>{zone.to}</div>
                    <div style={{ flex: '2 0 0', padding: '10px 16px', fontSize: 14, color: C_TEXT_SECONDARY }}>{zone.label}</div>
                  </div>
                  {idx < pt.zones.length - 1 && <div style={{ height: 1, background: C_BORDER }} />}
                </div>
              ))}
            </div>

            {/* Pricing summary card */}
            <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0px 1px 2px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>
                Bảng giá cước
              </div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                <LabelValue label="Số tuyến" value={`${pt.zones.length} tuyến`} />
                <LabelValue label="Số bậc cân" value={`${(pt as any).weights?.length ?? 0} bậc`} />
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Lịch sử chỉnh sửa ── */}
        {activeTab === 'history' && (
          <div style={{ ...centeredBox, padding: '16px 80px 32px' }}>
            {(() => {
              const grouped: Record<string, EditHistoryItem[]> = {}
              PRICING_HISTORY.forEach(item => {
                if (!grouped[item.date]) grouped[item.date] = []
                grouped[item.date].push(item)
              })
              const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
              return (
                <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                  {/* Table header */}
                  <div style={{ display: 'flex', background: C_BG_HEADER }}>
                    <div style={{ width: 80, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, flexShrink: 0 }}>Thời gian</div>
                    <div style={{ flex: '1 0 0', minWidth: 140, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Người thực hiện</div>
                    <div style={{ flex: '1 0 0', minWidth: 140, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Trường thay đổi</div>
                    <div style={{ flex: '3 0 0', minWidth: 220, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Nội dung thay đổi</div>
                  </div>
                  <div style={{ height: 1, background: C_BORDER }} />
                  {sortedDates.map(date => {
                    const [y, m, d] = date.split('-')
                    const dateLabel = `${d}/${m}/${y}`
                    return (
                      <div key={date}>
                        {/* Date group header */}
                        <div style={{ background: '#F3F4F6', padding: '6px 12px', fontSize: 13, fontWeight: 700, color: C_TEXT_PRIMARY, borderBottom: `1px solid ${C_BORDER}` }}>
                          {dateLabel}
                        </div>
                        {grouped[date].map((item, idx) => (
                          <div key={item.id}>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#fff' }}>
                              <div style={{ width: 80, padding: '10px 12px', fontSize: 13, color: C_TEXT_SECONDARY, flexShrink: 0 }}>{item.time}</div>
                              <div style={{ flex: '1 0 0', minWidth: 140, padding: '10px 12px', fontSize: 13, color: C_TEXT_PRIMARY }}>{item.operator}</div>
                              <div style={{ flex: '1 0 0', minWidth: 140, padding: '10px 12px', fontSize: 13, color: C_TEXT_PRIMARY }}>{item.field}</div>
                              <div style={{ flex: '3 0 0', minWidth: 220, padding: '10px 12px', fontSize: 13, color: C_TEXT_PRIMARY, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                {item.oldValue === '' ? (
                                  <span style={{ color: C_TEXT_SECONDARY, fontStyle: 'italic' }}>(Chưa có)</span>
                                ) : (
                                  <span style={{ color: C_TEXT_SECONDARY }}>{item.oldValue}</span>
                                )}
                                <SwapRightOutlined style={{ fontSize: 12, color: C_TEXT_SECONDARY, flexShrink: 0 }} />
                                <span style={{ color: C_TEXT_PRIMARY, fontWeight: 500 }}>{item.newValue}</span>
                              </div>
                            </div>
                            {idx < grouped[date].length - 1 && <div style={{ height: 1, background: C_BORDER }} />}
                          </div>
                        ))}
                        <div style={{ height: 1, background: C_BORDER }} />
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
