import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  EyeOutlined,
  SaveOutlined,
  CloseOutlined,
  SwapRightOutlined,
  HistoryOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import allPriceTables from '../../../mock-data/pricing.json'
import { shopConnections as storeConns, agenciesList, clientHubs247, type ClientHub247, SERVICE_TYPES_247 } from '../../super-admin/agencyStore'
import { servicesList, addService, updateService, toggleServiceEnabled } from '../serviceStore'

const CURRENT_AGENCY_ID = 'AGN001'

const CARRIERS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  GHN:        { color: '#FF5200', bg: '#FFF4ED', border: '#FDBA74', label: 'GHN' },
  '247Express': { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', label: '247' },
}

// 247Express không có "Lấy hàng" theo tỉnh/quận như GHN — điểm lấy hàng cố định
// theo ClientHubID của đại lý. "Khu vực giao hàng" thì dùng chung cơ chế tỉnh/quận
// (LocationEntry, thêm/xoá) giống hệt "Khu vực áp dụng" của GHN.


// ─── Design tokens ────────────────────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_BORDER         = '#E5E7EB'
const C_ACTION         = '#FF5200'
const C_BG_HEADER      = '#F3F4F6'

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
type Tab = 'detail' | 'history'
type EditHistoryItem = { id: string; date: string; time: string; operator: string; field: string; oldValue: string; newValue: string }

const SERVICE_HISTORY: EditHistoryItem[] = [
  { id: '1', date: '2024-03-15', time: '14:32', operator: 'Admin Đại lý', field: 'Tên dịch vụ', oldValue: 'Giao hàng nhanh cũ', newValue: 'Giao hàng nhanh' },
  { id: '2', date: '2024-03-15', time: '10:05', operator: 'Admin Đại lý', field: 'Mô tả', oldValue: '', newValue: 'Dịch vụ giao hàng nhanh trong ngày' },
  { id: '3', date: '2024-02-28', time: '16:45', operator: 'Super Admin', field: 'Bảng giá', oldValue: 'Chưa có', newValue: 'Bảng giá tiêu chuẩn 2024' },
  { id: '4', date: '2024-02-28', time: '09:20', operator: 'Admin Đại lý', field: 'Kết nối Shop GHN', oldValue: 'Shop Thời Trang ABC', newValue: 'Shop Thời Trang ABC, Shop Điện Tử XYZ' },
]

type GoiCuoc = { loai: string; id: string; ten: string }

type ServiceForm = {
  name: string
  code: string
  carrier: string
  desc: string
  scope: string
  maxWeightKg: number
  category: 'domestic' | 'international'
  priceTableId?: string
  serviceTypeId?: string
  deliveryZones: LocationEntry[]
  shopConnectionIds: string[]
  hubIds: string[]
}

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'detail',  label: 'Chi tiết',            icon: <FileTextOutlined /> },
  { key: 'history', label: 'Lịch sử chỉnh sửa',  icon: <HistoryOutlined /> },
]

// ─── LabelValue (view mode) ───────────────────────────────────────────────────
function LabelValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>{label}</span>
      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, fontWeight: 500, lineHeight: '20px' }}>{value}</span>
    </div>
  )
}

// ─── InputField (edit mode) ───────────────────────────────────────────────────
function InputField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>{label}</span>
      <div style={{ background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
        />
      </div>
    </div>
  )
}

// ─── Carrier badge ────────────────────────────────────────────────────────────
function CarrierBadge({ carrier }: { carrier: string }) {
  const c = CARRIERS[carrier] ?? CARRIERS.GHN
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, flexShrink: 0,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  )
}

// ─── goiCuoc pill (view-only) ─────────────────────────────────────────────────
function GoiCuocPill({ gc }: { gc: GoiCuoc }) {
  const isHangNhe = gc.loai === 'Hàng nhẹ'
  return (
    <span title={gc.ten} style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 20,
      fontSize: 12, fontWeight: 700, color: '#fff',
      background: isHangNhe ? '#FF5200' : '#1F2937',
    }}>
      {isHangNhe ? 'Hàng nhẹ <20kg' : 'Hàng nặng ≥20kg'}
    </span>
  )
}

// ─── Kết nối Shop ID {carrier} — dùng chung cho view & edit ──────────────────
function ShopIdTable({ carrier, shops, selectedIds, interactive, onToggle }: {
  carrier: string
  shops: { id: string; shopId: string; phone: string; goiCuoc: GoiCuoc[] }[]
  selectedIds: string[]
  interactive: boolean
  onToggle?: (connectionId: string) => void
}) {
  const rows = interactive ? shops : shops.filter(s => selectedIds.includes(s.id))

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${C_BORDER}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: C_BG_HEADER }}>
        <div style={{ padding: '7px 14px', fontSize: 13, color: C_TEXT_SECONDARY }}>Cửa hàng {carrier}</div>
        <div style={{ padding: '7px 14px', fontSize: 13, color: C_TEXT_SECONDARY }}>Dịch vụ từ {carrier}</div>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '16px', textAlign: 'center' as const, color: C_TEXT_SECONDARY, fontSize: 13, background: '#fff' }}>
          {interactive ? `Chưa có Shop ID ${carrier} nào được duyệt` : 'Chưa gán shop nào'}
        </div>
      ) : rows.map((shop, i) => {
        const isSelected = selectedIds.includes(shop.id)
        return (
          <div key={shop.id}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              background: interactive && isSelected ? '#FFF9F7' : '#fff',
              borderLeft: interactive && isSelected ? '3px solid #FF5200' : '3px solid transparent',
            }}>
              <div
                style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: interactive ? 'pointer' : 'default' }}
                onClick={() => interactive && onToggle?.(shop.id)}
              >
                {interactive && (
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    border: isSelected ? 'none' : '1.5px solid #D1D5DB',
                    background: isSelected ? '#FF5200' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isSelected ? '0 0 0 3px rgba(255,82,0,0.12)' : 'none',
                  }}>
                    {isSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 3.5L3.8 6.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 14, fontWeight: 500, color: C_TEXT_PRIMARY }}>{shop.shopId} - {shop.phone}</div>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                {shop.goiCuoc.length === 0
                  ? <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>
                  : shop.goiCuoc.map(gc => <GoiCuocPill key={gc.id} gc={gc} />)}
              </div>
            </div>
            {i < rows.length - 1 && <div style={{ height: 1, background: '#F5F5F5' }} />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Chọn ClientHubID (247Express) — dùng chung cho view & edit ──────────────
function HubIdTable({ hubs, selectedIds, interactive, onToggle }: {
  hubs: ClientHub247[]
  selectedIds: string[]
  interactive: boolean
  onToggle?: (hubId: string) => void
}) {
  const rows = interactive ? hubs : hubs.filter(h => selectedIds.includes(h.id))

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${C_BORDER}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', background: C_BG_HEADER }}>
        <div style={{ padding: '7px 14px', fontSize: 13, color: C_TEXT_SECONDARY }}>Địa điểm gửi hàng</div>
        <div style={{ padding: '7px 14px', fontSize: 13, color: C_TEXT_SECONDARY }}>Điểm lấy hàng</div>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '16px', textAlign: 'center' as const, color: C_TEXT_SECONDARY, fontSize: 13, background: '#fff' }}>
          {interactive ? 'Đại lý chưa được phân địa điểm gửi hàng nào — liên hệ Super Admin' : 'Chưa chọn hub nào'}
        </div>
      ) : rows.map((hub, i) => {
        const isSelected = selectedIds.includes(hub.id)
        return (
          <div key={hub.id}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 2fr',
              background: interactive && isSelected ? '#FFF9F7' : '#fff',
              borderLeft: interactive && isSelected ? '3px solid #FF5200' : '3px solid transparent',
            }}>
              <div
                style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: interactive ? 'pointer' : 'default' }}
                onClick={() => interactive && onToggle?.(hub.id)}
              >
                {interactive && (
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    border: isSelected ? 'none' : '1.5px solid #D1D5DB',
                    background: isSelected ? '#FF5200' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isSelected ? '0 0 0 3px rgba(255,82,0,0.12)' : 'none',
                  }}>
                    {isSelected && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 3.5L3.8 6.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 14, fontWeight: 700, color: '#7C3AED', fontFamily: 'monospace' }}>{hub.id}</div>
              </div>
              <div style={{ padding: '10px 14px', fontSize: 13, color: C_TEXT_SECONDARY }}>
                <span style={{ fontWeight: 500, color: C_TEXT_PRIMARY }}>{hub.name}</span> — {hub.location}
              </div>
            </div>
            {i < rows.length - 1 && <div style={{ height: 1, background: '#F5F5F5' }} />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Khu vực áp dụng modal ────────────────────────────────────────────────────
function AddLocationModal({ title, onClose, onAdd }: { title: string; onClose: () => void; onAdd: (entry: LocationEntry) => void }) {
  const [province, setProvince] = useState(PROVINCES[0])
  const [district, setDistrict] = useState('')
  const districts = DISTRICTS[province] ?? []

  const handleAdd = () => { onAdd({ province, district: district || 'Tất cả quận/huyện' }); onClose() }

  const selectStyle: React.CSSProperties = {
    border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 12px',
    fontSize: 14, color: C_TEXT_PRIMARY, outline: 'none', width: '100%',
    boxSizing: 'border-box', background: '#fff', cursor: 'pointer',
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

function LocationSection({ title, accentColor, entries, onAdd, onRemove, readOnly }: {
  title: string; accentColor: string; entries: LocationEntry[]
  onAdd: () => void; onRemove: (i: number) => void; readOnly?: boolean
}) {
  return (
    <div style={{ flex: 1, border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#FAFAFA', borderBottom: `1px solid ${C_BORDER}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 3, height: 14, background: accentColor, borderRadius: 2 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{title}</span>
          <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, background: C_BG_HEADER, padding: '1px 7px', borderRadius: 10 }}>{entries.length}</span>
        </div>
        {!readOnly && (
          <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_ACTION, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <PlusOutlined style={{ fontSize: 11 }} />
            Thêm
          </button>
        )}
      </div>
      <div style={{ display: 'flex', background: C_BG_HEADER }}>
        <div style={{ flex: '1 0 0', padding: '6px 8px', fontSize: 13, color: C_TEXT_SECONDARY }}>Tỉnh / Thành phố</div>
        <div style={{ flex: '1 0 0', padding: '6px 8px', fontSize: 13, color: C_TEXT_SECONDARY }}>Quận / Huyện</div>
        {!readOnly && <div style={{ width: 40 }} />}
      </div>
      <div style={{ height: 1, background: C_BORDER }} />
      {entries.length === 0 ? (
        <div style={{ padding: '20px 8px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 13 }}>Chưa có địa điểm nào</div>
      ) : entries.map((e, i) => (
        <div key={i}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff' }}>
            <div style={{ flex: '1 0 0', padding: '8px 8px', fontSize: 14, color: C_TEXT_PRIMARY, fontWeight: 500 }}>{e.province}</div>
            <div style={{ flex: '1 0 0', padding: '8px 8px', fontSize: 14, color: C_TEXT_SECONDARY }}>{e.district}</div>
            {!readOnly && (
              <div style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button onClick={() => onRemove(i)} title="Xoá"
                  style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: C_TEXT_SECONDARY, cursor: 'pointer', borderRadius: 4, fontSize: 13 }}>
                  <DeleteOutlined />
                </button>
              </div>
            )}
          </div>
          <div style={{ height: 1, background: C_BORDER }} />
        </div>
      ))}
    </div>
  )
}

// ─── Khu vực giao hàng modal — 247Express (chỉ 1 mục "Giao hàng", lấy hàng đã cố
// định theo ClientHubID nên không cần chọn tỉnh/quận riêng) ──────────────────
function DeliveryZoneModal({ entries, interactive, onAdd, onRemove, onClose }: {
  entries: LocationEntry[]
  interactive: boolean
  onAdd: (entry: LocationEntry) => void
  onRemove: (i: number) => void
  onClose: () => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {showAdd && (
        <AddLocationModal title="Thêm khu vực giao hàng" onClose={() => setShowAdd(false)}
          onAdd={(e) => onAdd(e)} />
      )}
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: 420, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY }}>Khu vực giao hàng</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: C_TEXT_SECONDARY }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>
          <LocationSection title="Giao hàng" accentColor="#3B82F6" entries={entries}
            onAdd={() => setShowAdd(true)} onRemove={onRemove} readOnly={!interactive} />
        </div>
      </div>
    </div>
  )
}

function ZoneModal({ onClose }: { onClose: () => void }) {
  const [pickupEntries, setPickupEntries]     = useState<LocationEntry[]>([
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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {modal === 'pickup' && (
        <AddLocationModal title="Thêm địa điểm lấy hàng" onClose={() => setModal(null)}
          onAdd={(e) => setPickupEntries((prev) => [...prev, e])} />
      )}
      {modal === 'delivery' && (
        <AddLocationModal title="Thêm địa điểm giao hàng" onClose={() => setModal(null)}
          onAdd={(e) => setDeliveryEntries((prev) => [...prev, e])} />
      )}
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', width: 720, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: C_TEXT_PRIMARY }}>Khu vực áp dụng</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: C_TEXT_SECONDARY }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 16, padding: 20, alignItems: 'flex-start' }}>
          <LocationSection title="Lấy hàng" accentColor="#10B981" entries={pickupEntries}
            onAdd={() => setModal('pickup')}
            onRemove={(i) => setPickupEntries((prev) => prev.filter((_, idx) => idx !== i))} />
          <LocationSection title="Giao hàng" accentColor="#3B82F6" entries={deliveryEntries}
            onAdd={() => setModal('delivery')}
            onRemove={(i) => setDeliveryEntries((prev) => prev.filter((_, idx) => idx !== i))} />
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ServiceDetail() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<Tab>('detail')
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [showDeliveryZoneModal, setShowDeliveryZoneModal] = useState(false)
  const [, forceRender] = useState(0)

  const isNewService = !id || id === 'new'
  const existing = !isNewService ? servicesList.find(s => s.id === id && s.agencyId === CURRENT_AGENCY_ID) : undefined
  const newCarrier = (location.state as { carrier?: string } | null)?.carrier ?? 'GHN'

  const initData: ServiceForm = existing
    ? {
        name: existing.name, code: existing.code, carrier: existing.carrier, desc: existing.desc, scope: existing.scope,
        maxWeightKg: existing.maxWeightKg, category: existing.category as 'domestic' | 'international',
        priceTableId: existing.priceTableId, serviceTypeId: existing.serviceTypeId,
        deliveryZones: (existing.deliveryZones ?? []) as LocationEntry[], shopConnectionIds: existing.shopConnectionIds,
        hubIds: existing.hubIds ?? [],
      }
    : { name: '', code: '', carrier: newCarrier, desc: '', scope: 'Toàn quốc', maxWeightKg: 20, category: 'domestic', priceTableId: '', serviceTypeId: '', deliveryZones: [], shopConnectionIds: [], hubIds: [] }

  const [serviceData, setServiceData] = useState<ServiceForm>(initData)
  const [isEditing, setIsEditing]     = useState(isNewService)
  const [editForm, setEditForm]       = useState<ServiceForm>(initData)

  const setField = (key: 'name' | 'desc') => (v: string) => setEditForm(f => ({ ...f, [key]: v }))

  const toggleShop = (connectionId: string) =>
    setEditForm(f => ({
      ...f,
      shopConnectionIds: f.shopConnectionIds.includes(connectionId)
        ? f.shopConnectionIds.filter(cid => cid !== connectionId)
        : [...f.shopConnectionIds, connectionId],
    }))

  const toggleHub = (hubId: string) =>
    setEditForm(f => ({
      ...f,
      hubIds: f.hubIds.includes(hubId)
        ? f.hubIds.filter(hid => hid !== hubId)
        : [...f.hubIds, hubId],
    }))

  const addDeliveryLocation = (entry: LocationEntry) =>
    setEditForm(f => ({ ...f, deliveryZones: [...f.deliveryZones, entry] }))

  const removeDeliveryLocation = (i: number) =>
    setEditForm(f => ({ ...f, deliveryZones: f.deliveryZones.filter((_, idx) => idx !== i) }))

  const handleStartEdit = () => { setEditForm(serviceData); setIsEditing(true) }

  const handleSave = () => {
    if (isNewService) {
      const created = addService({
        agencyId: CURRENT_AGENCY_ID,
        name: editForm.name.trim(), carrier: editForm.carrier, desc: editForm.desc, scope: editForm.scope,
        maxWeightKg: editForm.maxWeightKg, category: editForm.category, enabled: true,
        priceTableId: editForm.carrier === 'GHN' ? editForm.priceTableId : undefined,
        serviceTypeId: editForm.carrier === '247Express' ? 'DE' : undefined,
        deliveryZones: editForm.carrier === '247Express' ? editForm.deliveryZones : undefined,
        shopConnectionIds: editForm.carrier === 'GHN' ? editForm.shopConnectionIds : [],
        hubIds: editForm.carrier === '247Express' ? editForm.hubIds : undefined,
      })
      navigate(`/agency-admin/carrier-setup/services/${created.id}`)
      return
    }
    if (id) updateService(id, {
      name: editForm.name.trim(), desc: editForm.desc,
      priceTableId: editForm.carrier === 'GHN' ? editForm.priceTableId : undefined,
      serviceTypeId: editForm.carrier === '247Express' ? editForm.serviceTypeId : undefined,
      deliveryZones: editForm.carrier === '247Express' ? editForm.deliveryZones : undefined,
      shopConnectionIds: editForm.carrier === 'GHN' ? editForm.shopConnectionIds : [],
      hubIds: editForm.carrier === '247Express' ? editForm.hubIds : undefined,
    })
    setServiceData(editForm)
    setIsEditing(false)
  }

  const handleCancel = () => {
    if (isNewService) { navigate('/agency-admin/carrier-setup/services'); return }
    setEditForm(serviceData); setIsEditing(false)
  }

  const toggleDefault = () => {
    if (!id) return
    toggleServiceEnabled(id)
    forceRender(n => n + 1)
  }

  // 247Express dùng chung Shop ID với GHN (kích hoạt ở cấp đại lý qua ClientHub)
  const activeShops = storeConns.filter(
    s => s.agencyId === CURRENT_AGENCY_ID && s.status === 'active' && (serviceData.carrier === 'GHN' ? s.carrier === 'GHN' : true)
  )
  const editActiveShops = storeConns.filter(
    s => s.agencyId === CURRENT_AGENCY_ID && s.status === 'active' && (editForm.carrier === 'GHN' ? s.carrier === 'GHN' : true)
  )

  const priceTables = (allPriceTables as any[]).filter(pt => pt.nvc === editForm.carrier)

  const agency = agenciesList.find(a => a.id === CURRENT_AGENCY_ID)
  const agencyHubs = (agency?.clientHubIds ?? []).map(id => clientHubs247.find(h => h.id === id)).filter((h): h is ClientHub247 => !!h)

  const canCreate = !!editForm.name.trim() &&
    (editForm.carrier === '247Express' ? editForm.hubIds.length > 0 : editForm.shopConnectionIds.length > 0)

  const isDefaultOn = !isNewService && !!existing?.enabled

  const centeredBox: React.CSSProperties = {
    width: '100%', maxWidth: 1024, boxSizing: 'border-box', alignSelf: 'center', margin: '0 auto',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#F9FAFB', alignItems: 'center' }}>

      {showZoneModal && <ZoneModal onClose={() => setShowZoneModal(false)} />}
      {showDeliveryZoneModal && (
        <DeliveryZoneModal
          entries={isEditing ? editForm.deliveryZones : serviceData.deliveryZones}
          interactive={isEditing}
          onAdd={addDeliveryLocation}
          onRemove={removeDeliveryLocation}
          onClose={() => setShowDeliveryZoneModal(false)}
        />
      )}

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ ...centeredBox, display: 'flex', alignItems: 'center', gap: 12, padding: '24px 80px', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/agency-admin/carrier-setup/services')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeftOutlined style={{ fontSize: 20, color: C_TEXT_PRIMARY }} />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '28px' }}>
            {isNewService ? 'Dịch vụ mới' : 'Thông tin dịch vụ'}
          </span>
          <CarrierBadge carrier={serviceData.carrier} />
        </div>
        {!isNewService && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>Mặc định</span>
            <div onClick={toggleDefault} style={{
              width: 36, height: 20, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
              background: isDefaultOn ? '#16A34A' : '#D1D5DB',
              position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: isDefaultOn ? 18 : 2,
                width: 16, height: 16, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Tab bar (chỉ hiện khi sửa dịch vụ đã có — tạo mới thì không có lịch sử) ── */}
      {!isNewService && (
      <div style={{ ...centeredBox, padding: '16px 80px 0', flexShrink: 0 }}>
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
      )}

      {/* ── Tab content ──────────────────────────────────────── */}
      <div style={{ flex: '1 0 0', overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* ── Tab: Chi tiết ── */}
        {activeTab === 'detail' && (
          <div style={{ ...centeredBox, padding: '16px 80px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Card: Thông tin cơ bản */}
            <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0px 1px 2px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>
                Thông tin cơ bản
              </div>

              {isEditing ? (
                /* ── Edit mode ── */
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                    <InputField label="Tên dịch vụ (shop sẽ nhìn thấy tên này)" value={editForm.name} onChange={setField('name')} placeholder="VD: Giao nhanh" />
                    <InputField label="Mô tả" value={editForm.desc} onChange={setField('desc')} placeholder="Mô tả ngắn về dịch vụ..." />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_LABEL }}>
                      {editForm.carrier === '247Express' ? 'Chọn địa điểm gửi hàng' : `Kết nối Shop ID ${editForm.carrier}`} <span style={{ color: '#EF4444', fontSize: 12 }}>*</span>
                    </span>
                    {editForm.carrier === '247Express' ? (
                      <HubIdTable hubs={agencyHubs} selectedIds={editForm.hubIds} interactive onToggle={toggleHub} />
                    ) : (
                      <ShopIdTable carrier={editForm.carrier} shops={editActiveShops} selectedIds={editForm.shopConnectionIds} interactive onToggle={toggleShop} />
                    )}
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                    <LabelValue label="Tên dịch vụ" value={serviceData.name} />
                    <LabelValue label="Mã dịch vụ" value={serviceData.code} />
                  </div>

                  <LabelValue label="Mô tả" value={serviceData.desc || <span style={{ color: C_TEXT_SECONDARY }}>—</span>} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>{serviceData.carrier === '247Express' ? 'Địa điểm gửi hàng' : 'Shop'}</span>
                    <span style={{ fontSize: 14, color: '#3B82F6', textDecoration: 'underline', fontWeight: 500 }}>
                      {serviceData.carrier === '247Express'
                        ? `${serviceData.hubIds.length} địa điểm gửi hàng đang áp dụng dịch vụ`
                        : `${serviceData.shopConnectionIds.length} shop đang áp dụng dịch vụ`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>{serviceData.carrier === '247Express' ? 'Chọn địa điểm gửi hàng' : `Kết nối Shop ID ${serviceData.carrier}`}</span>
                      <InfoCircleOutlined style={{ fontSize: 13, color: C_TEXT_SECONDARY, cursor: 'help' }} title={serviceData.carrier === '247Express' ? 'Địa điểm gửi hàng được Super Admin cấp cho đại lý' : 'Shop ID được duyệt kết nối với đại lý qua nhà vận chuyển này'} />
                    </div>
                    {serviceData.carrier === '247Express' ? (
                      <HubIdTable hubs={agencyHubs} selectedIds={serviceData.hubIds} interactive={false} />
                    ) : (
                      <ShopIdTable carrier={serviceData.carrier} shops={activeShops} selectedIds={serviceData.shopConnectionIds} interactive={false} />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Card: Cấu hình */}
            <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0px 1px 2px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>
                Cấu hình
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {serviceData.carrier === '247Express' ? (
                  isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>Mã dịch vụ (ServiceTypeID)</span>
                          <span style={{ fontSize: 14, fontWeight: 500, color: C_TEXT_PRIMARY, padding: '7px 0' }}>
                            {SERVICE_TYPES_247.find(s => s.id === 'DE')?.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>Bảng giá bán cho shop (Mặc định)</span>
                          <select
                            value={editForm.priceTableId ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, priceTableId: e.target.value }))}
                            style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '7px 10px', fontSize: 14, color: C_TEXT_PRIMARY, background: '#fff', outline: 'none', cursor: 'pointer' }}
                          >
                            <option value="">— Chọn bảng giá —</option>
                            {priceTables.map((pt: any) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                        Bảng giá là giá bán cho shop (đã gồm chênh lệch đại lý) — đối chiếu với chi phí 247Express báo qua ServiceTypeID + tuyến + khối lượng thực tế.{' '}
                        <span onClick={() => navigate('/agency-admin/carrier-setup/pricing/create-247')} style={{ color: '#3B82F6', cursor: 'pointer', textDecoration: 'underline' }}>Tạo/xem bảng giá</span>
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>Mã dịch vụ (ServiceTypeID)</span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: C_TEXT_PRIMARY }}>
                          {SERVICE_TYPES_247.find(s => s.id === serviceData.serviceTypeId)?.label ?? 'Chưa chọn mã dịch vụ'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>Bảng giá bán cho shop (Mặc định)</span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: C_TEXT_PRIMARY }}>
                          {(allPriceTables as any[]).find(p => p.id === serviceData.priceTableId)?.name ?? 'Chưa chọn bảng giá'}
                        </span>
                      </div>
                    </div>
                  )
                ) : isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>Bảng giá (Mặc định)</span>
                    <select
                      value={editForm.priceTableId ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, priceTableId: e.target.value }))}
                      style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '7px 10px', fontSize: 14, color: C_TEXT_PRIMARY, background: '#fff', outline: 'none', cursor: 'pointer', width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="">— Chọn bảng giá —</option>
                      {priceTables.map((pt: any) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                    </select>
                    <span style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                      Phí thực tế tính theo tuyến + khối lượng từ bảng giá GHN — không dùng phí demo cố định.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>Bảng giá (Mặc định)</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: C_TEXT_PRIMARY }}>
                      {(allPriceTables as any[]).find(p => p.id === serviceData.priceTableId)?.name ?? 'Chưa chọn bảng giá'}
                    </span>
                  </div>
                )}

                {serviceData.carrier === '247Express' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>Khu vực giao hàng</span>
                    <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                        <EnvironmentOutlined style={{ color: '#16A34A' }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#16A34A' }}>Giao hàng</span>
                        <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>
                          {(isEditing ? editForm.deliveryZones : serviceData.deliveryZones).length === 0
                            ? 'Tất cả khu vực'
                            : `${(isEditing ? editForm.deliveryZones : serviceData.deliveryZones).length} khu vực`}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setShowDeliveryZoneModal(true)} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_TEXT_PRIMARY, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                      <EyeOutlined style={{ fontSize: 13 }} />
                      Xem khu vực
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>Khu vực áp dụng</span>
                    <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${C_BORDER}` }}>
                        <ShopOutlined style={{ color: '#3B82F6' }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#3B82F6' }}>Lấy hàng</span>
                        <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>Tất cả khu vực</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                        <EnvironmentOutlined style={{ color: '#16A34A' }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#16A34A' }}>Giao hàng</span>
                        <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>Tất cả khu vực</span>
                      </div>
                    </div>
                    <button onClick={() => setShowZoneModal(true)} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_TEXT_PRIMARY, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                      <EyeOutlined style={{ fontSize: 13 }} />
                      Xem khu vực
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
                  {isNewService ? (
                    <>
                      {!canCreate && (
                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                          {!editForm.name.trim() ? 'Nhập tên dịch vụ'
                            : editForm.carrier === '247Express' && editForm.hubIds.length === 0 ? 'Chọn ít nhất 1 địa điểm gửi hàng'
                            : editForm.carrier === 'GHN' && editForm.shopConnectionIds.length === 0 ? 'Chọn ít nhất 1 shop'
                            : ''}
                        </span>
                      )}
                      <button
                        onClick={canCreate ? handleSave : undefined}
                        disabled={!canCreate}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', border: 'none', borderRadius: 6, background: canCreate ? C_ACTION : '#D1D5DB', color: '#fff', fontSize: 14, fontWeight: 600, cursor: canCreate ? 'pointer' : 'not-allowed' }}
                      >
                        <SaveOutlined style={{ fontSize: 13 }} />
                        Tạo dịch vụ
                      </button>
                    </>
                  ) : isEditing ? (
                    <>
                      <button onClick={handleCancel}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_TEXT_PRIMARY, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                        <CloseOutlined style={{ fontSize: 13 }} />
                        Huỷ
                      </button>
                      <button onClick={handleSave}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 6, background: C_ACTION, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                        <SaveOutlined style={{ fontSize: 13 }} />
                        Lưu
                      </button>
                    </>
                  ) : (
                    <button onClick={handleStartEdit}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 6, background: C_ACTION, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                      Chỉnh sửa
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Lịch sử chỉnh sửa ── */}
        {activeTab === 'history' && (
          <div style={{ ...centeredBox, padding: '16px 80px 32px' }}>
            {isNewService ? (
              <div style={{ padding: '32px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                Chưa có lịch sử chỉnh sửa
              </div>
            ) : (() => {
              const grouped: Record<string, EditHistoryItem[]> = {}
              SERVICE_HISTORY.forEach(item => {
                if (!grouped[item.date]) grouped[item.date] = []
                grouped[item.date].push(item)
              })
              const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
              return (
                <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                  <div style={{ display: 'flex', background: C_BG_HEADER }}>
                    <div style={{ width: 80, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, flexShrink: 0 }}>Thời gian</div>
                    <div style={{ flex: '1 0 0', minWidth: 140, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Người thực hiện</div>
                    <div style={{ flex: '1 0 0', minWidth: 140, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Trường thay đổi</div>
                    <div style={{ flex: '3 0 0', minWidth: 220, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Nội dung thay đổi</div>
                  </div>
                  <div style={{ height: 1, background: C_BORDER }} />
                  {sortedDates.map(date => {
                    const [y, m, d] = date.split('-')
                    return (
                      <div key={date}>
                        <div style={{ background: '#F3F4F6', padding: '6px 12px', fontSize: 13, fontWeight: 700, color: C_TEXT_PRIMARY, borderBottom: `1px solid ${C_BORDER}` }}>
                          {`${d}/${m}/${y}`}
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
