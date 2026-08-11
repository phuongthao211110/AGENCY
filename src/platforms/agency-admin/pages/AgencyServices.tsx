import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { shopConnections as storeConns } from '../../super-admin/agencyStore'
import { servicesList, toggleServiceEnabled, type AgencyService } from '../serviceStore'

const CURRENT_AGENCY_ID = 'AGN001'

const C_ACTION         = '#FF5200'
const C_LINK           = '#3B82F6'
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// Số gói cước đang áp dụng — chỉ tính trên các shopConnectionIds thuộc carrier GHN
// (dịch vụ 247Express hiện chưa có gói cước riêng, trả về 0 → hiển thị "Chưa áp dụng").
function goiCuocCount(shopConnectionIds: string[]): number {
  const types = new Set<string>()
  shopConnectionIds.forEach(cid => {
    const conn = storeConns.find(s => s.id === cid)
    if (!conn || conn.carrier !== 'GHN') return
    conn.goiCuoc.forEach(gc => types.add(gc.loai))
  })
  return types.size
}

// ─── Loại đơn tag — phân biệt dịch vụ Hàng hoá vs Thư, bưu phẩm cùng tên ──────
// Dữ liệu cũ trong services.json chưa có field sendKind — suy theo carrier
// (GHN → Hàng hoá, 247Express → Thư) để không hiển thị trống/lỗi.
function SendKindTag({ sendKind, carrier }: { sendKind?: string; carrier: string }) {
  const kind = sendKind ?? (carrier === '247Express' ? 'letter' : 'goods')
  const isLetter = kind === 'letter'
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color: isLetter ? '#7C3AED' : '#4B5563',
      background: isLetter ? '#F5F3FF' : '#F3F4F6', border: `1px solid ${isLetter ? '#DDD6FE' : '#E5E7EB'}`,
      borderRadius: 4, padding: '1px 6px', lineHeight: '16px', flexShrink: 0,
    }}>
      {isLetter ? 'Thư' : 'Hàng hoá'}
    </span>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{
      width: 36, height: 20, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
      background: on ? C_ACTION : '#D1D5DB',
      position: 'relative', transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

// ─── Service row ──────────────────────────────────────────────────────────────

function ServiceRow({ svc, onToggle, onOpen }: { svc: AgencyService; onToggle: () => void; onOpen: () => void }) {
  const count = goiCuocCount(svc.shopConnectionIds)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '13px 16px',
      borderBottom: `1px solid ${C_BORDER}`,
      background: '#fff',
      opacity: svc.enabled ? 1 : 0.55,
      transition: 'opacity 0.2s',
    }}>
      {/* Dịch vụ đại lý */}
      <div style={{ flex: '2 0 0', minWidth: 200, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span onClick={onOpen} style={{ fontSize: 14, fontWeight: 700, color: C_LINK, cursor: 'pointer' }}>{svc.name}</span>
          <SendKindTag sendKind={svc.sendKind} carrier={svc.carrier} />
        </div>
        <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>{svc.code}</div>
      </div>

      {/* Gói kết nối — goiCuoc cho GHN, blank cho 247Express */}
      <div style={{ flex: '2 0 0', minWidth: 200, fontSize: 14, color: C_TEXT_PRIMARY }}>
        {svc.carrier === 'GHN'
          ? (count > 0 ? `Đang áp dụng ${count} dịch vụ` : 'Chưa áp dụng')
          : <span style={{ color: '#9CA3AF' }}>—</span>
        }
      </div>

      {/* Shop — 247Express/Thư áp dụng toàn bộ shop của đại lý, không gắn theo Shop ID */}
      <div style={{ flex: '1 0 0', minWidth: 160 }}>
        {svc.carrier === '247Express' ? (
          <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>Toàn bộ shop của đại lý</span>
        ) : (
          <span style={{ fontSize: 14, color: C_LINK, textDecoration: 'underline', fontWeight: 500 }}>
            {svc.shopConnectionIds.length} shop đang áp dụng dịch vụ
          </span>
        )}
      </div>

      {/* Bật/Tắt */}
      <div style={{ flex: '0 0 60px', display: 'flex', justifyContent: 'flex-end' }}>
        <Toggle on={svc.enabled} onToggle={onToggle} />
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AgencyServices() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [, forceRender] = useState(0)

  const toggle = (id: string) => { toggleServiceEnabled(id); forceRender(n => n + 1) }
  const open   = (id: string) => navigate(`/agency-admin/carrier-setup/services/${id}`)

  // Show ALL services for this agency regardless of carrier — carrier badge per row distinguishes them
  const filtered = servicesList.filter(
    s => s.agencyId === CURRENT_AGENCY_ID &&
      (s.name.toLowerCase().includes(search.toLowerCase()) || s.code.includes(search))
  )

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, flex: '0 1 400px' }}>
          <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm"
            style={{ border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px', width: '100%' }} />
        </div>

        {/* "Tạo dịch vụ mới" — vào thẳng form, chọn carrier ngay trong trang (CarrierPicker) thay vì hỏi trước qua dropdown */}
        <button
          onClick={() => navigate('/agency-admin/carrier-setup/services/new')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: C_ACTION, border: 'none', borderRadius: 6, cursor: 'pointer', flexShrink: 0 }}>
          <PlusOutlined style={{ color: '#fff', fontSize: 14 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>Tạo dịch vụ mới</span>
        </button>
      </div>

      {/* Table */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: C_BG_HEADER }}>
          <div style={{ flex: '2 0 0', minWidth: 200, padding: '8px 8px', fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>Dịch vụ đại lý</div>
          <div style={{ flex: '2 0 0', minWidth: 200, padding: '8px 8px', fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>Gói kết nối</div>
          <div style={{ flex: '1 0 0', minWidth: 160, padding: '8px 8px', fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>Shop</div>
          <div style={{ flex: '0 0 60px', padding: '8px 8px', fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL, textAlign: 'right' }}>Bật/Tắt</div>
        </div>
        <div style={{ height: 1, background: C_BORDER }} />

        {filtered.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>Không tìm thấy kết quả</div>
        ) : filtered.map(svc => (
          <ServiceRow key={svc.id} svc={svc} onToggle={() => toggle(svc.id)} onOpen={() => open(svc.id)} />
        ))}
      </div>
    </>
  )
}
