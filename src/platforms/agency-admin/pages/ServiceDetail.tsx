import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
  StopOutlined,
  SaveOutlined,
  CloseOutlined,
  SwapOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import allServices from '../../../mock-data/services.json'
import allPriceTables from '../../../mock-data/pricing.json'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_LINK           = '#3B82F6'
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
type Tab = 'info' | 'available' | 'blocked'

type GoiCuoc = { loai: string; id: string; ten: string }
type ShopConnection = { shopId: string; selectedGoiCuoc: string[] }

const GHN_SHOPS: { shopId: string; name: string; goiCuoc: GoiCuoc[] }[] = [
  { shopId: '5148899', name: 'Shop Thời Trang ABC',   goiCuoc: [{ loai: 'Hàng nhẹ', id: '380', ten: 'CAM KẾT TỪ 2,000 ĐƠN - 17,500Đ CHO ĐƠN TỪ 1KG' }, { loai: 'Hàng nặng', id: '150', ten: 'Bảng giá Hàng nặng XIAOMI for a Chính' }] },
  { shopId: '5148900', name: 'Shop Điện Tử XYZ',      goiCuoc: [{ loai: 'Hàng nhẹ', id: '412', ten: 'CAM KẾT TỪ 1,000 ĐƠN - 20,000Đ CHO ĐƠN TỪ 1KG' }, { loai: 'Hàng nặng', id: '162', ten: 'Bảng giá Hàng nặng Điện Tử Standard' }] },
  { shopId: '5148901', name: 'Shop Mỹ Phẩm Hà Nội',  goiCuoc: [{ loai: 'Hàng nhẹ', id: '395', ten: 'CAM KẾT TỪ 500 ĐƠN - 22,000Đ CHO ĐƠN TỪ 1KG' }, { loai: 'Hàng nặng', id: '201', ten: 'Bảng giá Hàng nặng Mỹ Phẩm Standard' }] },
  { shopId: '5148902', name: 'Shop Giày Dép Fashion', goiCuoc: [{ loai: 'Hàng nhẹ', id: '367', ten: 'CAM KẾT TỪ 3,000 ĐƠN - 15,000Đ CHO ĐƠN TỪ 1KG' }, { loai: 'Hàng nặng', id: '178', ten: 'Bảng giá Hàng nặng Giày Dép Standard' }] },
  { shopId: '5148903', name: 'Shop Đồ Gia Dụng 365',  goiCuoc: [{ loai: 'Hàng nhẹ', id: '421', ten: 'CAM KẾT TỪ 500 ĐƠN - 19,500Đ CHO ĐƠN TỪ 1KG' }, { loai: 'Hàng nặng', id: '195', ten: 'Bảng giá Hàng nặng Gia Dụng Standard' }] },
]

type ServiceInfo = { code: string; name: string; desc: string; shopConnections: ShopConnection[]; priceTableId: string | null }

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'info',      label: 'Thông tin',          icon: <InfoCircleOutlined /> },
  { key: 'available', label: 'Địa điểm khả dụng',  icon: <EnvironmentOutlined /> },
  { key: 'blocked',   label: 'Địa điểm chặn',       icon: <StopOutlined /> },
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
function InputField({ label, value, onChange, placeholder, mono = false }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; mono?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>{label}</span>
      <div style={{ background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center' }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px', fontFamily: mono ? 'monospace' : 'inherit' }}
        />
      </div>
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
  title: string; accentColor: string; entries: LocationEntry[]
  onAdd: () => void; onRemove: (i: number) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div style={{ flex: 1, border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
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
      <div style={{ display: 'flex', background: C_BG_HEADER }}>
        <div style={{ flex: '1 0 0', padding: '6px 8px', fontSize: 13, color: C_TEXT_SECONDARY }}>Tỉnh / Thành phố</div>
        <div style={{ flex: '1 0 0', padding: '6px 8px', fontSize: 13, color: C_TEXT_SECONDARY }}>Quận / Huyện</div>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ height: 1, background: C_BORDER }} />
      {entries.length === 0 ? (
        <div style={{ padding: '20px 8px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 13 }}>Chưa có địa điểm nào</div>
      ) : (
        entries.map((e, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', background: hovered === i ? '#FAFAFA' : '#fff', transition: 'background 0.1s' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
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
    <>
      {modal === 'pickup' && (
        <AddLocationModal title="Thêm địa điểm lấy hàng" onClose={() => setModal(null)}
          onAdd={(e) => setPickupEntries((prev) => [...prev, e])} />
      )}
      {modal === 'delivery' && (
        <AddLocationModal title="Thêm địa điểm giao hàng" onClose={() => setModal(null)}
          onAdd={(e) => setDeliveryEntries((prev) => [...prev, e])} />
      )}
      <div style={{ display: 'flex', gap: 16, padding: '16px 0', alignItems: 'flex-start', width: '100%', maxWidth: 1024, boxSizing: 'border-box', alignSelf: 'center' }}>
        <LocationSection title="Lấy hàng" accentColor={pickupColor} entries={pickupEntries}
          onAdd={() => setModal('pickup')}
          onRemove={(i) => setPickupEntries((prev) => prev.filter((_, idx) => idx !== i))} />
        <LocationSection title="Giao hàng" accentColor={deliveryColor} entries={deliveryEntries}
          onAdd={() => setModal('delivery')}
          onRemove={(i) => setDeliveryEntries((prev) => prev.filter((_, idx) => idx !== i))} />
      </div>
    </>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ServiceDetail() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<Tab>('info')

  // ── Init service data from navigation state (new) or services.json (existing) ──
  const locState = location.state as ({ isNew?: boolean } & Partial<ServiceInfo> & { shopConnections?: ShopConnection[] }) | null
  const initData: ServiceInfo = locState?.isNew
    ? { code: (locState as any).code ?? '', name: (locState as any).name ?? '', desc: (locState as any).desc ?? '', shopConnections: locState.shopConnections ?? [{ shopId: GHN_SHOPS[0].shopId, selectedGoiCuoc: [] }], priceTableId: null }
    : (() => {
        const s = id ? allServices.find((svc) => svc.id === id) : undefined
        const ids = (s as any)?.ghnShopIds as string[] | undefined
        const defaultConn: ShopConnection[] = ids?.length ? ids.map(id => ({ shopId: id, selectedGoiCuoc: [] })) : [{ shopId: GHN_SHOPS[0].shopId, selectedGoiCuoc: [] }]
        return { code: s?.code ?? id ?? '', name: s?.name ?? id ?? '', desc: s?.desc ?? '', shopConnections: defaultConn, priceTableId: s?.priceTableId ?? null }
      })()

  const [serviceData, setServiceData] = useState<ServiceInfo>(initData)
  const [isEditing, setIsEditing]     = useState(!!locState?.isNew)
  const [editForm, setEditForm]       = useState<ServiceInfo>(initData)

  const setEdit = (key: 'code' | 'name' | 'desc') => (v: string) => setEditForm(f => ({ ...f, [key]: v }))

  const toggleShop = (shopId: string) =>
    setEditForm(f => {
      const exists = f.shopConnections.some(c => c.shopId === shopId)
      if (exists) return { ...f, shopConnections: f.shopConnections.filter(c => c.shopId !== shopId) }
      return { ...f, shopConnections: [...f.shopConnections, { shopId, selectedGoiCuoc: [] }] }
    })

  const toggleGoiCuocByShop = (shopId: string, gcId: string) => {
    setEditForm(f => {
      const conns = f.shopConnections.map(c => {
        if (c.shopId !== shopId) return c
        const has = c.selectedGoiCuoc.includes(gcId)
        const next = has
          ? c.selectedGoiCuoc.filter(id => id !== gcId)
          : [...c.selectedGoiCuoc, gcId]
        return { ...c, selectedGoiCuoc: next }
      })
      return { ...f, shopConnections: conns }
    })
  }

  const isNewService = id === 'new' || !!locState?.isNew

  const handleStartEdit = () => { setEditForm(serviceData); setIsEditing(true) }
  const handleSave      = () => { setServiceData(editForm); setIsEditing(false) }
  const handleCancel    = () => {
    if (isNewService) { navigate('/agency-admin/carrier-setup/services'); return }
    setEditForm(serviceData); setIsEditing(false)
  }

  const centeredBox: React.CSSProperties = {
    width: '100%', maxWidth: 1024, boxSizing: 'border-box', alignSelf: 'center', margin: '0 auto',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#F9FAFB', alignItems: 'center' }}>

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ ...centeredBox, display: 'flex', alignItems: 'center', gap: 12, padding: '24px 80px', flexShrink: 0 }}>
        <button
          onClick={() => navigate('/agency-admin/carrier-setup/services')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeftOutlined style={{ fontSize: 20, color: C_TEXT_PRIMARY }} />
        </button>
        {isNewService ? (
          <span style={{ flex: 1, fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '28px' }}>
            Dịch vụ mới
          </span>
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '28px' }}>
                {serviceData.name}
              </span>
              {serviceData.code && (
                <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, fontFamily: 'monospace' }}>{serviceData.code}</span>
              )}
            </div>
            {isEditing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCancel}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_TEXT_PRIMARY, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                >
                  <CloseOutlined style={{ fontSize: 13 }} />
                  Huỷ
                </button>
                <button
                  onClick={handleSave}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 6, background: C_ACTION, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  <SaveOutlined style={{ fontSize: 13 }} />
                  Lưu
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartEdit}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_TEXT_PRIMARY, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
              >
                <EditOutlined />
                Chỉnh sửa
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
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

              {isEditing ? (
                /* ── Edit mode ── */
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                    <InputField label="Mã gói" value={editForm.code} onChange={setEdit('code')} placeholder="VD: CHUYENNHANH" mono />
                    <InputField label="Tên gói" value={editForm.name} onChange={setEdit('name')} placeholder="VD: Giao hàng nhanh" />
                    <InputField label="Mô tả" value={editForm.desc} onChange={setEdit('desc')} placeholder="Mô tả ngắn về gói dịch vụ..." />
                  </div>

                  {/* Shop connections — card-based rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_LABEL }}>Kết nối Shop ID GHN</span>
                    <div style={{ borderRadius: 8, overflow: 'hidden' }}>
                      {/* Header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: C_BG_HEADER, borderRadius: '8px 8px 0 0' }}>
                        <div style={{ padding: '7px 14px', fontSize: 11, fontWeight: 700, color: C_TEXT_SECONDARY, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Cửa hàng GHN</div>
                        <div style={{ padding: '7px 14px', fontSize: 11, fontWeight: 700, color: C_TEXT_SECONDARY, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Dịch vụ từ GHN</div>
                      </div>
                      {GHN_SHOPS.map((shop, i) => {
                        const conn = editForm.shopConnections.find(c => c.shopId === shop.shopId)
                        const isSelected = !!conn
                        return (
                          <div key={shop.shopId}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              background: isSelected ? '#FFF9F7' : '#fff',
                              borderLeft: isSelected ? '3px solid #FF5200' : '3px solid transparent',
                              transition: 'background 0.15s',
                            }}>
                              {/* Left: custom checkbox + shop info */}
                              <div
                                style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                                onClick={() => toggleShop(shop.shopId)}
                              >
                                {/* Custom checkbox */}
                                <div style={{
                                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                                  border: isSelected ? 'none' : `1.5px solid #D1D5DB`,
                                  background: isSelected ? '#FF5200' : '#fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  boxShadow: isSelected ? '0 0 0 3px rgba(255,82,0,0.12)' : 'none',
                                  transition: 'background 0.15s, box-shadow 0.15s',
                                }}>
                                  {isSelected && (
                                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                      <path d="M1 3.5L3.8 6.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#111827' : '#374151' }}>{shop.name}</div>
                                  <div style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace', marginTop: 2, letterSpacing: '0.02em' }}>{shop.shopId}</div>
                                </div>
                              </div>
                              {/* Right: chip toggles */}
                              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                {shop.goiCuoc.map(gc => {
                                  const isChecked = conn?.selectedGoiCuoc.includes(gc.id) ?? false
                                  const isHangNhe = gc.loai === 'Hàng nhẹ'
                                  const checkedStyle = isHangNhe
                                    ? { color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE' }
                                    : { color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A' }
                                  const uncheckedStyle = isHangNhe
                                    ? { color: '#93C5FD', background: '#fff', border: '1px dashed #BFDBFE' }
                                    : { color: '#FCD34D', background: '#fff', border: '1px dashed #FDE68A' }
                                  return (
                                    <div
                                      key={gc.id}
                                      onClick={() => { if (isSelected) toggleGoiCuocByShop(shop.shopId, gc.id) }}
                                      title={isSelected ? (isChecked ? 'Bỏ chọn' : 'Chọn gói cước') : undefined}
                                      style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                        padding: '4px 10px', borderRadius: 20,
                                        fontSize: 12, fontWeight: isChecked ? 600 : 500,
                                        cursor: isSelected ? 'pointer' : 'default',
                                        pointerEvents: isSelected ? 'auto' : 'none',
                                        opacity: isSelected ? 1 : 0.35,
                                        transition: 'all 0.15s',
                                        userSelect: 'none',
                                        ...(isChecked ? checkedStyle : uncheckedStyle),
                                      }}
                                    >
                                      {isChecked ? (
                                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none" style={{ flexShrink: 0 }}>
                                          <path d="M1 3L3.2 5.5L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                      ) : (
                                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ flexShrink: 0 }}>
                                          <circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
                                        </svg>
                                      )}
                                      {gc.loai}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            {i < GHN_SHOPS.length - 1 && <div style={{ height: 1, background: '#F5F5F5' }} />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                    <LabelValue label="Mã gói" value={<span style={{ fontFamily: 'monospace' }}>{serviceData.code}</span>} />
                    <LabelValue label="Tên gói" value={serviceData.name} />
                    <LabelValue label="Mô tả" value={serviceData.desc || <span style={{ color: C_TEXT_SECONDARY }}>—</span>} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>Kết nối Shop ID GHN</span>
                    {serviceData.shopConnections.map((conn, idx) => {
                      const shop = GHN_SHOPS.find(s => s.shopId === conn.shopId)
                      const selectedGc = shop?.goiCuoc.filter(gc => conn.selectedGoiCuoc.includes(gc.id)) ?? []
                      return (
                        <div key={idx} style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: C_TEXT_PRIMARY }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{conn.shopId}</span>
                            <span style={{ color: C_TEXT_SECONDARY, fontWeight: 400 }}> — {shop?.name ?? '—'}</span>
                          </div>
                          {selectedGc.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {selectedGc.map(gc => (
                                <div key={gc.id}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY }}>{gc.loai}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Chưa chọn gói cước</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Price table card */}
            {(() => {
              const priceTable = serviceData.priceTableId
                ? allPriceTables.find((pt) => pt.id === serviceData.priceTableId)
                : null
              return (
                <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0px 1px 2px rgba(0,0,0,0.06)' }}>
                  <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>
                    Bảng giá mặc định
                  </div>
                  <div style={{ padding: 16 }}>
                    {priceTable ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: `1px solid ${C_BORDER}`, borderRadius: 8, background: '#FAFAFA' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK }}>{priceTable.name}</span>
                          <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
                            {priceTable.zones.length} tuyến · Cập nhật {priceTable.createdAt}
                          </span>
                        </div>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_TEXT_PRIMARY, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                          <SwapOutlined style={{ fontSize: 13 }} />
                          Thay đổi
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: `1px dashed #FDE68A`, borderRadius: 8, background: '#FFFBEB' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <WarningOutlined style={{ color: '#D97706', fontSize: 16 }} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: '#92400E' }}>Chưa có bảng giá</div>
                            <div style={{ fontSize: 12, color: '#B45309', marginTop: 2 }}>Shop được gắn dịch vụ này sẽ không thể sử dụng</div>
                          </div>
                        </div>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: 'none', borderRadius: 6, background: C_ACTION, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          <PlusOutlined style={{ fontSize: 12 }} />
                          Gắn bảng giá
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* ── Action buttons (new service only) ── */}
            {isNewService && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingBottom: 8 }}>
                <button
                  onClick={handleSave}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', border: 'none', borderRadius: 6, background: C_ACTION, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  <SaveOutlined style={{ fontSize: 13 }} />
                  Tạo dịch vụ
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Địa điểm khả dụng ── */}
        {activeTab === 'available' && (
          <div style={{ ...centeredBox, padding: '0 80px' }}>
            <LocationTab pickupColor="#10B981" deliveryColor="#3B82F6" />
          </div>
        )}

        {/* ── Tab: Địa điểm chặn ── */}
        {activeTab === 'blocked' && (
          <div style={{ ...centeredBox, padding: '0 80px' }}>
            <LocationTab pickupColor="#F59E0B" deliveryColor="#EF4444" />
          </div>
        )}
      </div>
    </div>
  )
}
