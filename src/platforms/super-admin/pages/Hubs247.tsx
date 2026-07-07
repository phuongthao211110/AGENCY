import { useState } from 'react'
import { ConfigProvider } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
import { clientHubs247, createClientHub, type ClientHub247 } from '../agencyStore'
import { VIETNAM_PROVINCES } from '../../../mock-data/vietnam-provinces'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_BORDER         = '#E5E7EB'
const C_ACTION         = '#FF5200'
const C_BG_HEADER      = '#F3F4F6'

// ── Modal: tạo 1 địa điểm gửi hàng mới vào catalog chung (clientHubs247) ──
function CreateHubModal({ onClose, onCreate }: { onClose: () => void; onCreate: (hub: ClientHub247) => void }) {
  const [address, setAddress]           = useState('')
  const [provinceName, setProvinceName] = useState(VIETNAM_PROVINCES[0].name)
  const [districtName, setDistrictName] = useState(VIETNAM_PROVINCES[0].districts[0]?.name ?? '')
  const [wardName, setWardName]         = useState('')
  const [contactName, setContactName]   = useState('')
  const [contactPhone, setContactPhone] = useState('')

  const districts = VIETNAM_PROVINCES.find(p => p.name === provinceName)?.districts ?? []
  const canSubmit = address.trim() && districtName && wardName.trim() && contactName.trim() && contactPhone.trim()

  const fieldStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: `1px solid ${C_BORDER}`, borderRadius: 8, fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }

  const handleProvinceChange = (value: string) => {
    setProvinceName(value)
    setDistrictName(VIETNAM_PROVINCES.find(p => p.name === value)?.districts[0]?.name ?? '')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 460, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C_BORDER}`, position: 'sticky', top: 0, background: '#fff' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C_TEXT_PRIMARY }}>Tạo địa chỉ lấy hàng mới</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C_TEXT_SECONDARY }}>✕</button>
        </div>
        <div style={{ padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Địa chỉ (Số nhà/đường) <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="VD: 45 Phạm Văn Đồng" style={fieldStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Tỉnh / Thành phố <span style={{ color: '#EF4444' }}>*</span></label>
              <select value={provinceName} onChange={e => handleProvinceChange(e.target.value)} style={{ ...fieldStyle, cursor: 'pointer', background: '#fff' }}>
                {VIETNAM_PROVINCES.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Quận / Huyện <span style={{ color: '#EF4444' }}>*</span></label>
              <select value={districtName} onChange={e => setDistrictName(e.target.value)} style={{ ...fieldStyle, cursor: 'pointer', background: '#fff' }}>
                {districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Phường / Xã <span style={{ color: '#EF4444' }}>*</span></label>
            <input value={wardName} onChange={e => setWardName(e.target.value)} placeholder="VD: Mai Dịch" style={fieldStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Tên liên hệ <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="VD: Nguyễn Văn A" style={fieldStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Số điện thoại liên hệ <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={contactPhone} onChange={e => setContactPhone(e.target.value.replace(/\D/g, ''))} placeholder="VD: 0981000001" style={fieldStyle} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: `1px solid ${C_BORDER}`, background: '#FAFAFA' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#fff', fontSize: 13, color: C_TEXT_SECONDARY, cursor: 'pointer', fontWeight: 500 }}>
            Huỷ
          </button>
          <button
            disabled={!canSubmit}
            onClick={() => canSubmit && onCreate(createClientHub({ address: address.trim(), wardName: wardName.trim(), districtName, provinceName, contactName: contactName.trim(), contactPhone: contactPhone.trim() }))}
            style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: canSubmit ? C_ACTION : '#D1D5DB', color: '#fff', fontSize: 13, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
            Tạo địa điểm
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Table ──────────────────────────────────────────────────────
function TableHeader() {
  const cell = (label: string, flex: string, minWidth: number) => (
    <div style={{ flex, minWidth, padding: '6px 8px' }}>
      <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>{label}</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
      {cell('Mã hub', '0 0 160px', 160)}
      {cell('Tên / Địa chỉ', '2 0 0', 280)}
      {cell('Tỉnh / Thành phố', '1 0 0', 140)}
      {cell('Liên hệ', '1 0 0', 200)}
    </div>
  )
}

function HubRow({ hub }: { hub: ClientHub247 }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', background: hover ? '#FAFAFA' : '#fff', transition: 'background 0.1s', borderBottom: `1px solid ${C_BORDER}` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ flex: '0 0 160px', minWidth: 160, padding: '8px' }}>
        <span style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: '#7C3AED' }}>{hub.id}</span>
      </div>
      <div style={{ flex: '2 0 0', minWidth: 280, padding: '8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{hub.name}</span>
        <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>{hub.location}</span>
      </div>
      <div style={{ flex: '1 0 0', minWidth: 140, padding: '8px' }}>
        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{hub.provinceName}</span>
      </div>
      <div style={{ flex: '1 0 0', minWidth: 200, padding: '8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{hub.contactName}</span>
        <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>{hub.contactPhone}</span>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
export default function Hubs247() {
  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [, tick]                    = useState(0)

  const filtered = clientHubs247.filter(h =>
    h.id.toLowerCase().includes(search.toLowerCase()) ||
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ConfigProvider theme={superAdminTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>
        {showCreate && (
          <CreateHubModal
            onClose={() => setShowCreate(false)}
            onCreate={() => { setShowCreate(false); tick(n => n + 1) }}
          />
        )}

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
              Địa chỉ lấy hàng 247Express
            </h1>
            <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
              Danh sách địa điểm gửi hàng (ClientHubID) dùng để phân cho đại lý
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}
          >
            <PlusOutlined style={{ color: '#fff', fontSize: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Tạo địa chỉ lấy hàng mới</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '8px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6 }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo mã hub, tên hoặc địa chỉ"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
          <TableHeader />
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>Không tìm thấy địa chỉ nào</div>
          ) : filtered.map(hub => <HubRow key={hub.id} hub={hub} />)}
        </div>
      </div>
    </ConfigProvider>
  )
}
