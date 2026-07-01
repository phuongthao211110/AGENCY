import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { agenciesList, clientHubs247 } from '../../super-admin/agencyStore'

const CURRENT_AGENCY_ID = 'AGN001'

const C_ACTION         = '#FF5200'
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'
const C_BG_FORM        = '#F9FAFB'

// ─── Vùng & mã dịch vụ 247Express ─────────────────────────────────────────────
// Vùng tính theo khoảng cách từ ClientHubID (điểm lấy hàng cố định của đại lý) —
// bản thân API GetPriceForCustomerAPI của 247Express nhận tỉnh/phường đến cụ thể,
// đây là cách đại lý gom nhóm tuyến thành các mức phí để dễ cấu hình bảng giá bán.
type Zone247 = 'noi-tinh' | 'lien-tinh-gan' | 'lien-tinh-xa' | 'quoc-te'

const ZONES: Zone247[] = ['noi-tinh', 'lien-tinh-gan', 'lien-tinh-xa', 'quoc-te']

const ZONE_LABELS: Record<Zone247, string> = {
  'noi-tinh':      'Nội tỉnh',
  'lien-tinh-gan': 'Liên tỉnh gần ≤300km',
  'lien-tinh-xa':  'Liên tỉnh xa >300km',
  'quoc-te':       'Quốc tế',
}

const ZONE_COLORS: Record<Zone247, string> = {
  'noi-tinh':      '#16A34A',
  'lien-tinh-gan': '#2563EB',
  'lien-tinh-xa':  '#C2410C',
  'quoc-te':       '#7C3AED',
}

const ZONE_GUIDE: { zone: Zone247; definition: string; example: string }[] = [
  { zone: 'noi-tinh',      definition: 'Hub và địa chỉ nhận hàng cùng trong một tỉnh/thành phố.', example: 'HCM Hub → Quận 1, HCM' },
  { zone: 'lien-tinh-gan', definition: 'Khoảng cách đường bộ từ Hub đến điểm giao ≤300km.',       example: 'HCM Hub → Phan Thiết' },
  { zone: 'lien-tinh-xa',  definition: 'Khoảng cách đường bộ từ Hub đến điểm giao >300km.',        example: 'HCM Hub → Hà Nội' },
  { zone: 'quoc-te',       definition: 'Giao hàng ra ngoài lãnh thổ Việt Nam.',                    example: 'Chỉ áp dụng ServiceType IE, IM' },
]

type WeightTier = { id: string; fromValue: string; toValue: string }

const makeWeightTiers = (): WeightTier[] => [
  { id: 'w1', fromValue: '0',    toValue: '500' },
  { id: 'w2', fromValue: '501',  toValue: '1000' },
  { id: 'w3', fromValue: '1001', toValue: '2000' },
  { id: 'w4', fromValue: '2001', toValue: '5000' },
  { id: 'w5', fromValue: '5001', toValue: '10000' },
]

// Mã dịch vụ chính 247Express (ServiceTypeID) — dùng để tham khảo giá vốn 247 báo cho đại lý
const SERVICE_TYPES = [
  { id: 'DE', label: 'DE — Chuyển phát nhanh', costPerKg: 26000 },
  { id: 'TF', label: 'TF — Vận chuyển tiết kiệm', costPerKg: 18000 },
  { id: 'TH', label: 'TH — Giao hàng 55 giờ', costPerKg: 20000 },
  { id: 'IE', label: 'IE — Quốc tế nhanh', costPerKg: 180000 },
  { id: 'IM', label: 'IM — Quốc tế tiết kiệm', costPerKg: 140000 },
]

// Giá vốn tham khảo mà 247Express báo cho đại lý (mô phỏng GetPriceForCustomerAPI theo
// ServiceTypeID + khối lượng — vùng ảnh hưởng thực tế tính theo tuyến chính xác nên chỉ
// mang tính tham khảo, đại lý cần đối chiếu API thật khi chốt giá bán)
function referenceCost(serviceTypeId: string, weightKg: number): number {
  const st = SERVICE_TYPES.find(s => s.id === serviceTypeId) ?? SERVICE_TYPES[0]
  return Math.round(Math.max(weightKg, 0.5) * st.costPerKg)
}

type SurchargeTier = { id: string; fromValue: string; toValue: string; fixedFee: string; percentFee: string }

const makeTiers = (): SurchargeTier[] => [
  { id: 't1', fromValue: '0', toValue: '1000000', fixedFee: '0', percentFee: '1' },
  { id: 't2', fromValue: '1000001', toValue: '10000000', fixedFee: '0', percentFee: '1.5' },
  { id: 't3', fromValue: '10000001', toValue: '999999999', fixedFee: '0', percentFee: '2' },
]

function InputField({ label, value, onChange, placeholder, type = 'text', suffix }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; suffix?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>{label}</span>
      <div style={{ background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px', width: '100%' }}
        />
        {suffix && <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, flexShrink: 0 }}>{suffix}</span>}
      </div>
    </div>
  )
}

export default function PricingCreate247() {
  const navigate = useNavigate()
  const agency = agenciesList.find(a => a.id === CURRENT_AGENCY_ID)
  const hub = agency?.clientHubId ? clientHubs247.find(h => h.id === agency.clientHubId) : null

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [refServiceType, setRefServiceType] = useState(SERVICE_TYPES[0].id)

  const [weightTiers, setWeightTiers] = useState<WeightTier[]>(makeWeightTiers())

  // Giá bán cho shop — key theo weightTier.id, mỗi giá trị là mảng giá theo từng vùng
  const [prices, setPrices] = useState<Record<string, string[]>>(
    () => Object.fromEntries(makeWeightTiers().map(t => [t.id, ZONES.map(() => '')]))
  )
  const setPrice = (tierId: string, zi: number, v: string) =>
    setPrices(prev => ({ ...prev, [tierId]: prev[tierId].map((c, j) => j === zi ? v : c) }))

  const updateWeightTier = (id: string, field: 'fromValue' | 'toValue', v: string) =>
    setWeightTiers(prev => prev.map(t => t.id === id ? { ...t, [field]: v } : t))

  const addWeightTier = () => {
    const id = `w${Date.now()}`
    setWeightTiers(prev => [...prev, { id, fromValue: '', toValue: '' }])
    setPrices(prev => ({ ...prev, [id]: ZONES.map(() => '') }))
  }

  const removeWeightTier = (id: string) => {
    setWeightTiers(prev => prev.filter(t => t.id !== id))
    setPrices(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const [partialDelivery, setPartialDelivery] = useState('4000')
  const [deliveryFailFee, setDeliveryFailFee] = useState('12000')
  const [insurance, setInsurance] = useState<SurchargeTier[]>(makeTiers())
  const [codFee, setCodFee] = useState<SurchargeTier[]>(makeTiers())

  const canSave = name.trim().length > 0 && !!hub

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#F9FAFB', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 900, padding: '24px 32px', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button onClick={() => navigate('/agency-admin/carrier-setup/pricing')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <ArrowLeftOutlined style={{ fontSize: 20, color: C_TEXT_PRIMARY }} />
          </button>
          <span style={{ fontSize: 22, fontWeight: 600, color: C_TEXT_PRIMARY }}>Tạo bảng giá 247Express</span>
        </div>
        <p style={{ fontSize: 13, color: C_TEXT_SECONDARY, margin: '0 0 16px 32px', lineHeight: 1.6 }}>
          Giá nhập ở đây là <strong>giá bán cho shop</strong> — đã gồm phần chênh lệch đại lý so với chi phí thực tế 247Express báo cho đại lý.
          Vùng tính theo khoảng cách đường bộ từ ClientHubID của đại lý (giống cách 247Express tính tuyến qua API <code>GetPriceForCustomerAPI</code>).
        </p>

        {/* Info banner: giá vốn tham khảo */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
          <InfoCircleOutlined style={{ color: '#0369A1', fontSize: 15, marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: '#0C4A6E', lineHeight: 1.6, flex: 1 }}>
            <strong>Giá vốn tham khảo từ 247Express:</strong> mỗi ô trong bảng giá hiển thị kèm mức chi phí 247Express dự kiến báo cho đại lý
            (theo <code>ServiceTypeID</code> đang chọn bên dưới + khối lượng) để bạn thấy phần chênh lệch trước khi chốt giá bán.
            Số liệu chỉ mang tính tham khảo — 247Express tính giá thật theo đúng tỉnh/phường nhận, không hoàn toàn khớp theo vùng.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: C_TEXT_LABEL, whiteSpace: 'nowrap' }}>Mã dịch vụ tham khảo giá vốn:</span>
          <select value={refServiceType} onChange={e => setRefServiceType(e.target.value)}
            style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '5px 10px', fontSize: 13, color: C_TEXT_PRIMARY, background: '#fff', outline: 'none', cursor: 'pointer' }}>
            {SERVICE_TYPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {hub && <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>· Điểm lấy hàng: <span style={{ fontFamily: 'monospace' }}>{hub.id}</span> ({hub.name})</span>}
        </div>

        {/* Basic info */}
        <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0px 1px 2px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>
            Thông tin bảng giá
          </div>
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
            <InputField label="Tên bảng giá" value={name} onChange={setName} placeholder="VD: Bảng giá tiêu chuẩn 247Express" />
            <InputField label="Mô tả" value={description} onChange={setDescription} placeholder="VD: Áp dụng cho tất cả shop" />
          </div>
        </div>

        {/* Zone guide */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 16 }}>
          {ZONE_GUIDE.map(g => (
            <div key={g.zone} title={`${g.definition} VD: ${g.example}`} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 20,
              fontSize: 12, fontWeight: 600, cursor: 'help',
              border: `1px solid ${ZONE_COLORS[g.zone]}40`, background: `${ZONE_COLORS[g.zone]}12`, color: ZONE_COLORS[g.zone],
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: ZONE_COLORS[g.zone] }} />
              {ZONE_LABELS[g.zone]}
            </div>
          ))}
        </div>

        {/* Price grid */}
        <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0px 1px 2px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>Giá bán theo vùng × khối lượng</span>
            <button onClick={addWeightTier} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff', color: C_ACTION, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + Thêm mức khối lượng
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `100px 100px repeat(${ZONES.length}, 1fr) 40px`, minWidth: 760 }}>
              <div style={{ padding: '8px 12px', background: C_BG_HEADER, fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>Từ (g)</div>
              <div style={{ padding: '8px 12px', background: C_BG_HEADER, fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>Đến (g)</div>
              {ZONES.map(z => (
                <div key={z} style={{ padding: '8px 12px', background: C_BG_HEADER, fontSize: 12, fontWeight: 600, color: ZONE_COLORS[z] }}>{ZONE_LABELS[z]}</div>
              ))}
              <div style={{ padding: '8px 12px', background: C_BG_HEADER }} />

              {weightTiers.map(wt => (
                <Fragment key={wt.id}>
                  <div style={{ padding: '8px 10px', borderTop: `1px solid ${C_BORDER}` }}>
                    <input
                      type="number"
                      value={wt.fromValue}
                      onChange={e => updateWeightTier(wt.id, 'fromValue', e.target.value)}
                      placeholder="0"
                      style={{ border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '5px 8px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ padding: '8px 10px', borderTop: `1px solid ${C_BORDER}` }}>
                    <input
                      type="number"
                      value={wt.toValue}
                      onChange={e => updateWeightTier(wt.id, 'toValue', e.target.value)}
                      placeholder="500"
                      style={{ border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '5px 8px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  {ZONES.map((z, zi) => {
                    const toGram = Number(wt.toValue) || 0
                    const cost = z === 'quoc-te' || toGram <= 0 ? null : referenceCost(refServiceType, toGram / 1000)
                    return (
                      <div key={`${wt.id}-${zi}`} style={{ padding: '8px 10px', borderTop: `1px solid ${C_BORDER}`, borderLeft: `1px solid ${C_BORDER}`, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <input
                          type="number"
                          value={prices[wt.id]?.[zi] ?? ''}
                          onChange={e => setPrice(wt.id, zi, e.target.value)}
                          placeholder="Giá bán"
                          style={{ border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '5px 8px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                        />
                        {cost != null && (
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>Giá vốn ~{cost.toLocaleString()}đ</span>
                        )}
                      </div>
                    )
                  })}
                  <div style={{ padding: '8px 10px', borderTop: `1px solid ${C_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button
                      onClick={() => removeWeightTier(wt.id)}
                      disabled={weightTiers.length <= 1}
                      title="Xoá mức khối lượng"
                      style={{ border: 'none', background: 'transparent', cursor: weightTiers.length > 1 ? 'pointer' : 'not-allowed', color: weightTiers.length > 1 ? '#EF4444' : '#D1D5DB', fontSize: 15 }}
                    >
                      ✕
                    </button>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Surcharges */}
        <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0px 1px 2px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C_BORDER}`, fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>
            Phụ phí
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
              <InputField label="Phí giao 1 phần" type="number" value={partialDelivery} onChange={setPartialDelivery} suffix="đ" />
              <InputField label="Phí giao thất bại" type="number" value={deliveryFailFee} onChange={setDeliveryFailFee} suffix="đ" />
            </div>

            {([
              { title: 'Phí bảo hiểm (theo giá trị khai giá)', tiers: insurance, setTiers: setInsurance },
              { title: 'Phí thu hộ COD (theo giá trị COD)', tiers: codFee, setTiers: setCodFee },
            ] as const).map(group => (
              <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_LABEL }}>{group.title}</span>
                <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', background: C_BG_FORM }}>
                    {['Từ giá trị', 'Đến giá trị', 'Phí cố định', 'Phí % '].map(h => (
                      <div key={h} style={{ padding: '6px 10px', fontSize: 12, color: C_TEXT_SECONDARY }}>{h}</div>
                    ))}
                  </div>
                  {group.tiers.map((tier, i) => (
                    <div key={tier.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderTop: `1px solid ${C_BORDER}` }}>
                      {(['fromValue', 'toValue', 'fixedFee', 'percentFee'] as const).map(field => (
                        <div key={field} style={{ padding: '4px 8px' }}>
                          <input
                            type="number"
                            value={tier[field]}
                            onChange={e => group.setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: e.target.value } : t))}
                            style={{ border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '5px 8px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          {!canSave && (
            <span style={{ fontSize: 12, color: '#9CA3AF', alignSelf: 'center' }}>
              {!hub ? 'Đại lý chưa được phân ClientHubID' : 'Nhập tên bảng giá'}
            </span>
          )}
          <button
            disabled={!canSave}
            onClick={() => canSave && navigate('/agency-admin/carrier-setup/pricing')}
            style={{ padding: '9px 20px', border: 'none', borderRadius: 6, background: canSave ? C_ACTION : '#D1D5DB', color: '#fff', fontSize: 14, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed' }}
          >
            Lưu bảng giá
          </button>
        </div>
      </div>
    </div>
  )
}
