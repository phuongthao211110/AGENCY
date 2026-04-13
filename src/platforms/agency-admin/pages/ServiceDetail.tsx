import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
  StopOutlined,
} from '@ant-design/icons'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_LINK           = '#3B82F6'
const C_BORDER         = '#E5E7EB'
const C_ACTION         = '#FF5200'
const C_BG_HEADER      = '#F3F4F6'

// ─── Mock data ────────────────────────────────────────────────────────────────
const SERVICE_MAP: Record<string, { code: string; name: string; desc: string; shopId: string; shopName: string }> = {
  'ghn-express':  { code: 'CHUYENNHANH', name: 'Giao hàng nhanh',      desc: 'Dịch vụ giao hàng nhanh trong ngày và hôm sau.', shopId: '5148899', shopName: 'Shop Thời Trang ABC' },
  'ghn-standard': { code: 'TIETKIEM',    name: 'Giao hàng tiêu chuẩn', desc: 'Dịch vụ giao hàng tiết kiệm, phù hợp hàng không gấp.', shopId: '5148900', shopName: 'Shop Điện Tử XYZ' },
  'ghn-bulky':    { code: 'HANGCANANG',  name: 'Hàng cồng kềnh',       desc: 'Chuyên xử lý hàng hóa lớn, nặng, cần thiết bị hỗ trợ.', shopId: '5148901', shopName: 'Shop Mỹ Phẩm Hà Nội' },
}

const LINKED_PRICE_TABLES = [
  { id: 'pt-1', name: 'Bảng giá nội tỉnh 2025',    route: 'Nội tỉnh',  configs: 4, updatedAt: '01/04/2025' },
  { id: 'pt-2', name: 'Bảng giá liên tỉnh Q1/2025', route: 'Liên tỉnh', configs: 6, updatedAt: '15/03/2025' },
]

const PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Bình Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu', 'Quảng Ninh', 'Nghệ An',
]

const DISTRICTS: Record<string, string[]> = {
  'Hà Nội':          ['Hoàn Kiếm', 'Ba Đình', 'Đống Đa', 'Hai Bà Trưng', 'Cầu Giấy'],
  'TP. Hồ Chí Minh': ['Quận 1', 'Quận 3', 'Bình Thạnh', 'Tân Bình', 'Gò Vấp'],
  'Đà Nẵng':         ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn'],
}

type LocationEntry = { province: string; district: string }

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = 'info' | 'available' | 'blocked'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'info',      label: 'Thông tin',            icon: <InfoCircleOutlined /> },
  { key: 'available', label: 'Địa điểm khả dụng',   icon: <EnvironmentOutlined /> },
  { key: 'blocked',   label: 'Địa điểm chặn',        icon: <StopOutlined /> },
]

// ─── Info Row helper ──────────────────────────────────────────────────────────
function LabelValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: C_TEXT_LABEL }}>{label}</span>
      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, fontWeight: 500, lineHeight: '20px' }}>{value}</span>
    </div>
  )
}

// ─── Add Location Modal ───────────────────────────────────────────────────────
function AddLocationModal({ title, onClose, onAdd }: { title: string; onClose: () => void; onAdd: (entry: LocationEntry) => void }) {
  const [province, setProvince] = useState(PROVINCES[0])
  const [district, setDistrict] = useState('')

  const districts = DISTRICTS[province] ?? []

  const handleAdd = () => {
    onAdd({ province, district: district || 'Tất cả quận/huyện' })
    onClose()
  }

  const selectStyle: React.CSSProperties = {
    border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 12px',
    fontSize: 14, color: C_TEXT_PRIMARY, outline: 'none', width: '100%',
    boxSizing: 'border-box', background: '#fff', cursor: 'pointer',
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: 400, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: C_TEXT_PRIMARY }}>{title}</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: C_TEXT_SECONDARY }}>✕</button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 14, color: C_TEXT_LABEL }}>Tỉnh / Thành phố</label>
            <select value={province} onChange={(e) => { setProvince(e.target.value); setDistrict('') }} style={selectStyle}>
              {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 14, color: C_TEXT_LABEL }}>Quận / Huyện <span style={{ color: C_TEXT_SECONDARY, fontSize: 12 }}>(để trống = áp dụng tất cả)</span></label>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} style={selectStyle}>
              <option value="">Tất cả quận/huyện</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: `1px solid ${C_BORDER}` }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_TEXT_PRIMARY, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Huỷ</button>
          <button onClick={handleAdd} style={{ padding: '8px 16px', border: 'none', borderRadius: 6, background: C_ACTION, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Thêm</button>
        </div>
      </div>
    </div>
  )
}

// ─── Location Section ─────────────────────────────────────────────────────────
function LocationSection({ title, accentColor, entries, onAdd, onRemove }: {
  title: string
  accentColor: string
  entries: LocationEntry[]
  onAdd: () => void
  onRemove: (i: number) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div style={{ flex: 1, border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#FAFAFA', borderBottom: `1px solid ${C_BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 3, height: 14, background: accentColor, borderRadius: 2 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{title}</span>
          <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, background: C_BG_HEADER, padding: '1px 7px', borderRadius: 10 }}>{entries.length}</span>
        </div>
        <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_ACTION, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <PlusOutlined style={{ fontSize: 11 }} />
          Thêm
        </button>
      </div>

      {/* Table header */}
      <div style={{ display: 'flex', background: C_BG_HEADER }}>
        <div style={{ flex: '1 0 0', padding: '6px 8px', fontSize: 13, color: C_TEXT_SECONDARY }}>Tỉnh / Thành phố</div>
        <div style={{ flex: '1 0 0', padding: '6px 8px', fontSize: 13, color: C_TEXT_SECONDARY }}>Quận / Huyện</div>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ height: 1, background: C_BORDER }} />

      {/* Rows */}
      {entries.length === 0 ? (
        <div style={{ padding: '20px 8px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 13 }}>Chưa có địa điểm nào</div>
      ) : (
        entries.map((e, i) => (
          <div key={i}>
            <div
              style={{ display: 'flex', alignItems: 'center', background: hovered === i ? '#FAFAFA' : '#fff', transition: 'background 0.1s' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ flex: '1 0 0', padding: '8px 8px', fontSize: 14, color: C_TEXT_PRIMARY, fontWeight: 500 }}>{e.province}</div>
              <div style={{ flex: '1 0 0', padding: '8px 8px', fontSize: 14, color: C_TEXT_SECONDARY }}>{e.district}</div>
              <div style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button onClick={() => onRemove(i)} title="Xoá"
                  style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: hovered === i ? '#EF4444' : C_TEXT_SECONDARY, cursor: 'pointer', borderRadius: 4, fontSize: 13 }}>
                  <DeleteOutlined />
                </button>
              </div>
            </div>
            <div style={{ height: 1, background: C_BORDER }} />
          </div>
        ))
      )}
    </div>
  )
}

// ─── Location Tab (shared by available + blocked) ─────────────────────────────
function LocationTab({ pickupColor, deliveryColor }: { pickupColor: string; deliveryColor: string }) {
  const [pickupEntries, setPickupEntries]   = useState<LocationEntry[]>([
    { province: 'Hà Nội', district: 'Tất cả quận/huyện' },
    { province: 'TP. Hồ Chí Minh', district: 'Quận 1' },
  ])
  const [deliveryEntries, setDeliveryEntries] = useState<LocationEntry[]>([
    { province: 'Hà Nội', district: 'Tất cả quận/huyện' },
    { province: 'TP. Hồ Chí Minh', district: 'Tất cả quận/huyện' },
    { province: 'Đà Nẵng', district: 'Tất cả quận/huyện' },
  ])

  const [modal, setModal] = useState<'pickup' | 'delivery' | null>(null)

  return (
    <>
      {modal === 'pickup' && (
        <AddLocationModal
          title="Thêm địa điểm lấy hàng"
          onClose={() => setModal(null)}
          onAdd={(e) => setPickupEntries((prev) => [...prev, e])}
        />
      )}
      {modal === 'delivery' && (
        <AddLocationModal
          title="Thêm địa điểm giao hàng"
          onClose={() => setModal(null)}
          onAdd={(e) => setDeliveryEntries((prev) => [...prev, e])}
        />
      )}

      <div style={{ display: 'flex', gap: 16, padding: 16, alignItems: 'flex-start' }}>
        <LocationSection
          title="Lấy hàng"
          accentColor={pickupColor}
          entries={pickupEntries}
          onAdd={() => setModal('pickup')}
          onRemove={(i) => setPickupEntries((prev) => prev.filter((_, idx) => idx !== i))}
        />
        <LocationSection
          title="Giao hàng"
          accentColor={deliveryColor}
          entries={deliveryEntries}
          onAdd={() => setModal('delivery')}
          onRemove={(i) => setDeliveryEntries((prev) => prev.filter((_, idx) => idx !== i))}
        />
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [hovered, setHovered] = useState<string | null>(null)

  const service = id ? SERVICE_MAP[id] : undefined
  const code    = service?.code  ?? id ?? ''
  const name    = service?.name  ?? id ?? ''
  const desc    = service?.desc  ?? ''
  const shopId  = service?.shopId  ?? '—'
  const shopName = service?.shopName ?? '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
        <ArrowLeftOutlined
          style={{ fontSize: 18, color: C_TEXT_PRIMARY, cursor: 'pointer' }}
          onClick={() => navigate('/agency-admin/carrier-setup')}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>{name}</h1>
          <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, fontFamily: 'monospace' }}>{code}</span>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_TEXT_PRIMARY, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          <EditOutlined />
          Chỉnh sửa
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C_BORDER}`, padding: '0 16px', flexShrink: 0 }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <div key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', fontSize: 14, fontWeight: 600, color: isActive ? C_ACTION : C_TEXT_SECONDARY, cursor: 'pointer', borderBottom: isActive ? `2px solid ${C_ACTION}` : '2px solid transparent', marginBottom: -1, userSelect: 'none', transition: 'color 0.15s' }}>
              <span style={{ fontSize: 15 }}>{tab.icon}</span>
              {tab.label}
            </div>
          )
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: '1 0 0', overflowY: 'auto' }}>

        {/* ── Tab: Thông tin ── */}
        {activeTab === 'info' && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Basic info card */}
            <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>
                Thông tin cơ bản
              </div>
              <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                <LabelValue label="Mã gói" value={<span style={{ fontFamily: 'monospace' }}>{code}</span>} />
                <LabelValue label="Tên gói" value={name} />
                <LabelValue label="Mô tả" value={desc || <span style={{ color: C_TEXT_SECONDARY }}>—</span>} />
                <LabelValue
                  label="Kết nối Shop ID"
                  value={
                    <span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{shopId}</span>
                      <span style={{ color: C_TEXT_SECONDARY, fontWeight: 400 }}> — {shopName}</span>
                    </span>
                  }
                />
              </div>
            </div>

            {/* Linked price tables */}
            <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${C_BORDER}` }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>
                  Bảng giá được gắn ({LINKED_PRICE_TABLES.length})
                </span>
              </div>

              {/* Table header */}
              <div style={{ display: 'flex', background: C_BG_HEADER }}>
                {[
                  { label: 'Tên bảng giá', flex: '2 0 0', minWidth: 200 },
                  { label: 'Tuyến',        flex: '1 0 0', minWidth: 120 },
                  { label: 'Số cấu hình', flex: '1 0 0', minWidth: 100 },
                  { label: 'Cập nhật',    flex: '1 0 0', minWidth: 120 },
                ].map((col, i) => (
                  <div key={i} style={{ flex: col.flex, minWidth: col.minWidth, padding: '6px 8px', fontSize: 14, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{col.label}</div>
                ))}
              </div>
              <div style={{ height: 1, background: C_BORDER }} />

              {LINKED_PRICE_TABLES.map((pt) => (
                <div key={pt.id}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', background: hovered === pt.id ? '#FAFAFA' : '#fff', transition: 'background 0.1s', cursor: 'pointer' }}
                    onMouseEnter={() => setHovered(pt.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div style={{ flex: '2 0 0', minWidth: 200, padding: '6px 8px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK }}>{pt.name}</span>
                    </div>
                    <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px' }}>
                      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{pt.route}</span>
                    </div>
                    <div style={{ flex: '1 0 0', minWidth: 100, padding: '6px 8px' }}>
                      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{pt.configs}</span>
                    </div>
                    <div style={{ flex: '1 0 0', minWidth: 120, padding: '6px 8px' }}>
                      <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>{pt.updatedAt}</span>
                    </div>
                  </div>
                  <div style={{ height: 1, background: C_BORDER }} />
                </div>
              ))}

              {LINKED_PRICE_TABLES.length === 0 && (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                  Chưa có bảng giá nào được gắn
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Địa điểm khả dụng ── */}
        {activeTab === 'available' && (
          <LocationTab pickupColor="#10B981" deliveryColor="#3B82F6" />
        )}

        {/* ── Tab: Địa điểm chặn ── */}
        {activeTab === 'blocked' && (
          <LocationTab pickupColor="#F59E0B" deliveryColor="#EF4444" />
        )}
      </div>
    </div>
  )
}
