import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons'
import { agenciesList, clientHubs247, type ClientHub247 } from '../../super-admin/agencyStore'

const CURRENT_AGENCY_ID = 'AGN001'

const C_ACTION         = '#FF5200'
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

// ─── 247Express hiện chỉ còn 1 dịch vụ được hỗ trợ tạo bảng giá: Chuyển phát
// nhanh — theo hợp đồng số 1231/2026/HĐDV-247 ────────────────────────────────────
const SERVICE_LABEL = 'Chuyển phát nhanh'

// ─── Vùng 247Express — theo Hợp đồng cung cấp và sử dụng dịch vụ vận chuyển
// số 1231/2026/HĐDV-247, mục A.1 "Cước chính" (Dịch vụ chuyển phát nhanh),
// giá cước áp dụng cho bưu gửi từ Hồ Chí Minh đến toàn quốc ─────────────────────
type Zone247 = 'ntl1' | 'ntl2' | 'den300' | 'tren300' | 'ntl1_dn' | 'ntl1_hn'

const ZONES: Zone247[] = ['ntl1', 'ntl2', 'den300', 'tren300', 'ntl1_dn', 'ntl1_hn']

const ZONE_LABELS: Record<Zone247, string> = {
  ntl1:    'Nội tỉnh 1',
  ntl2:    'Nội tỉnh 2',
  den300:  'Đến 300 km',
  tren300: 'Trên 300 km',
  ntl1_dn: 'Nội tỉnh 1 (HCM↔ĐN, ĐN↔HN)',
  ntl1_hn: 'Nội tỉnh 1 (HCM↔HN)',
}

const ZONE_COLORS: Record<Zone247, string> = {
  ntl1:    '#16A34A',
  ntl2:    '#0D9488',
  den300:  '#2563EB',
  tren300: '#C2410C',
  ntl1_dn: '#7C3AED',
  ntl1_hn: '#DB2777',
}


// +500gr tiếp theo — áp dụng nấc trọng lượng trên 2kg đến 10kg
const DEFAULT_STEP_2_10KG: Record<Zone247, number> = {
  ntl1: 2100, ntl2: 4700, den300: 4700, tren300: 11200, ntl1_dn: 9900, ntl1_hn: 10500,
}
// +500gr tiếp theo — áp dụng nấc trọng lượng trên 10kg
const DEFAULT_STEP_OVER_10KG: Record<Zone247, number> = {
  ntl1: 2100, ntl2: 4700, den300: 4700, tren300: 10000, ntl1_dn: 8900, ntl1_hn: 9400,
}

// Tier vượt cân động cho dịch vụ Chuyển phát nhanh (toGram rỗng = không giới hạn)
type OverweightTier247 = { id: string; toGram: string; stepGram: string }


// ─── Dịch vụ gia tăng nhanh (mục 3.1, 3.2) — Phát trong ngày / Phát hẹn giờ, giờ
// nằm trong đúng 6 vùng của cước chính (mỗi vùng tự nhập giá riêng), không dùng
// bảng vùng riêng như trước ─────────────────────────────────────────────────────
const FAST_SERVICE_ROW_LABELS = ['Đến 2kg', '+500gr tiếp theo']

// ─── Mục 3.4 — Các dịch vụ gia tăng khác (đầy đủ theo hợp đồng) ────────────────
const EXTRA_SERVICES: { label: string; fee: string; note: string }[] = [
  { label: 'Báo phát',                            fee: '5.000đ/vận đơn',                    note: 'Miễn phí khi bưu gửi bị thất lạc' },
  { label: 'Chụp hình',                           fee: '2.000đ/hình ảnh',                   note: 'Tối thiểu 5.000đ/vận đơn · Tối đa 10 hình · Miễn phí khi thất lạc' },
  { label: 'Đồng kiểm',                           fee: '1.000đ/đơn vị kiểm đếm',             note: 'Tối thiểu 20.000đ/vận đơn' },
  { label: 'Hàng đông lạnh',                      fee: '15.000đ/kg',                        note: 'Không tính phí Express (nếu có)' },
  { label: 'Hàng Express',                        fee: '10.000đ/kg',                        note: 'Áp dụng cho vận đơn > 2kg' },
  { label: 'Hàng VUN',                            fee: '12.000đ/kg',                        note: 'Tối thiểu 200.000đ/vận đơn' },
  { label: 'Hồ sơ thầu',                          fee: '200.000đ/vận đơn',                  note: '+15.000đ/kg cho kg tiếp theo trên 2kg · Không tính phí Phát hẹn giờ, Phát trong ngày và phí Express' },
  { label: 'Khai giá hàng hóa',                   fee: '0.75% giá trị khai',                 note: 'Tối thiểu 20.000đ/vận đơn' },
  { label: 'Lấy ID cá nhân',                      fee: '10.000đ/vận đơn',                    note: 'Miễn phí khi thất lạc' },
  { label: 'Người nhận thanh toán',                fee: '20.000đ/vận đơn',                    note: '—' },
  { label: 'Ngoài giờ hành chánh',                 fee: '50.000đ/vận đơn',                    note: 'Miễn phí khi thất lạc' },
  { label: 'Phát hàng siêu thị',                  fee: '100.000đ + 1.000đ/đơn vị kiểm đếm', note: 'x = số lượng đơn vị kiểm đếm · Miễn phí khi thất lạc' },
  { label: 'Phát hàng tận tay',                   fee: '10.000đ/vận đơn',                    note: 'Miễn phí khi thất lạc' },
  { label: 'Phát ưu tiên',                        fee: '30.000đ/vận đơn',                    note: 'Chỉ áp dụng vận đơn có TL đến (≤) 2kg' },
  { label: 'Phí an ninh',                         fee: '12.000đ/kg',                         note: 'Tối thiểu 200.000đ/vận đơn' },
  { label: 'Thông tin đầy đủ',                    fee: '5.000đ/vận đơn',                     note: 'Miễn phí khi thất lạc' },
  { label: 'Thư ký khách hàng',                   fee: '50.000đ/vận đơn',                    note: 'Miễn phí khi thất lạc' },
  { label: 'Dịch vụ tin nhắn SMS',                fee: '1.000đ/tin nhắn',                    note: 'Tối đa 160 ký tự/tin (bao gồm ký tự bắt buộc)' },
  { label: 'Giao hàng lên/xuống tầng (đầu nhận)', fee: '250đ/kg',                            note: 'Chỉ áp dụng đơn hàng có TL từ 50kg trở lên' },
  { label: 'Nhận hàng lên/xuống tầng (đầu gửi)',  fee: '250đ/kg',                            note: 'Chỉ áp dụng đơn hàng có TL từ 50kg trở lên' },
  { label: 'Phát vận đơn ngoài vùng phủ 247',      fee: 'Liên hệ 247Express',                 note: 'Tra cứu tại 247express.vn' },
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

function SectionCard({ title, subtitle, children }: { title: React.ReactNode; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0px 1px 2px rgba(0,0,0,0.06)', marginBottom: 16 }}>
      <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C_BORDER}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

// ─── Dòng gộp có thể mở/thu gọn — thay cho tab "Phụ phí" cũ theo từng vùng,
// cùng kiểu tương tác với bảng giá GHN (1 dòng, bấm vào mở rộng nội dung) ──────
function ExpandableRow({ label, open, onToggle, children }: {
  label: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', cursor: 'pointer' }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: C_TEXT_SECONDARY, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: C_TEXT_PRIMARY, flex: 1 }}>{label}</span>
        <span style={{ fontSize: 12, color: C_ACTION, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          {open ? 'Thu gọn' : 'Xem chi tiết'}
          <span style={{ display: 'inline-block', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
        </span>
      </div>
      {open && <div style={{ padding: '0 0 12px' }}>{children}</div>}
    </div>
  )
}

// ─── Dịch vụ gia tăng nhanh (Phát trong ngày / Phát hẹn giờ) — đại lý tự nhập
// giá bán cho shop theo từng mốc × vùng ───────────────────────────────────────
// ─── Dịch vụ gia tăng nhanh cho 1 vùng cụ thể — Phát trong ngày / Phát hẹn giờ
// × 2 mốc trọng lượng, nằm trong tab riêng của từng ZoneBlock ──────────────────
function FastServiceZoneFields({ sameDay, scheduled, onChangeSameDay, onChangeScheduled }: {
  sameDay: [string, string]
  scheduled: [string, string]
  onChangeSameDay: (rowIndex: 0 | 1, v: string) => void
  onChangeScheduled: (rowIndex: 0 | 1, v: string) => void
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', minWidth: 420 }}>
        <div style={{ padding: '8px 16px', background: C_BG_HEADER, fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>Trọng lượng</div>
        <div style={{ padding: '8px 16px', background: C_BG_HEADER, fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>Phát trong ngày</div>
        <div style={{ padding: '8px 16px', background: C_BG_HEADER, fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>Phát hẹn giờ</div>
        {FAST_SERVICE_ROW_LABELS.map((label, ri) => (
          <Fragment key={label}>
            <div style={{ padding: '9px 16px', borderTop: `1px solid ${C_BORDER}`, fontSize: 13, color: C_TEXT_PRIMARY, fontWeight: 500 }}>{label}</div>
            <div style={{ padding: '6px 12px', borderTop: `1px solid ${C_BORDER}` }}>
              <input
                type="number"
                value={sameDay[ri] ?? ''}
                onChange={e => onChangeSameDay(ri as 0 | 1, e.target.value)}
                placeholder="Giá bán"
                style={{ border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '4px 7px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ padding: '6px 12px', borderTop: `1px solid ${C_BORDER}` }}>
              <input
                type="number"
                value={scheduled[ri] ?? ''}
                onChange={e => onChangeScheduled(ri as 0 | 1, e.target.value)}
                placeholder="Giá bán"
                style={{ border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '4px 7px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

// ─── Dịch vụ gia tăng khác — đại lý tự nhập "Giá bán cho shop" (text tự do vì
// đơn vị mỗi dịch vụ khác nhau: đ/vận đơn, đ/kg, %, hoặc "Liên hệ 247Express") ─
function ExtraServicesTable({ sell, onChangeSell }: {
  sell: string[]
  onChangeSell: (index: number, v: string) => void
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.4fr 2fr', minWidth: 720 }}>
        {['Tên dịch vụ', 'Giá bán cho shop', 'Lưu ý'].map(h => (
          <div key={h} style={{ padding: '8px 16px', background: C_BG_HEADER, fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>{h}</div>
        ))}
        {EXTRA_SERVICES.map((s, i) => (
          <Fragment key={s.label}>
            <div style={{ padding: '9px 16px', borderTop: `1px solid ${C_BORDER}`, fontSize: 13, color: C_TEXT_PRIMARY, fontWeight: 500 }}>{s.label}</div>
            <div style={{ padding: '6px 12px', borderTop: `1px solid ${C_BORDER}`, display: 'flex', alignItems: 'center' }}>
              <input
                value={sell[i] ?? ''}
                onChange={e => onChangeSell(i, e.target.value)}
                placeholder={s.fee}
                style={{ border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '5px 8px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ padding: '9px 16px', borderTop: `1px solid ${C_BORDER}`, fontSize: 12, color: C_TEXT_SECONDARY }}>{s.note}</div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

// ─── Khối cấu hình theo vùng — mỗi vùng là 1 block riêng, đúng phong cách
// RouteBlock của GHN: header cố định + 2 nút chuyển tab "Vượt cân" / "Phụ phí" ──
function ZoneBlock({
  color, label, body, sections,
}: {
  color: string
  label: string
  body: React.ReactNode
  sections: { key: string; label: string; count: number; content: React.ReactNode }[]
}) {
  const [active, setActive] = useState<string | null>(null)
  return (
    <div style={{ position: 'relative', border: `1px solid ${C_BORDER}`, borderLeft: `4px solid ${color}`, borderRadius: 8, padding: 16, background: '#fff', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>{label}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {sections.map(s => {
            const isActive = active === s.key
            return (
              <button key={s.key} onClick={() => setActive(v => v === s.key ? null : s.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  height: 32, padding: '0 12px', cursor: 'pointer', borderRadius: 6, fontSize: 13, fontWeight: 500,
                  border: isActive ? `1px solid ${C_ACTION}` : 'none',
                  background: isActive ? '#FFF4ED' : C_BG_HEADER,
                  color: isActive ? C_ACTION : C_TEXT_SECONDARY,
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {s.label}
                <span style={{
                  fontSize: 11, fontWeight: 600, lineHeight: '16px', padding: '0 5px', borderRadius: 8,
                  background: isActive ? C_ACTION : '#D1D5DB', color: isActive ? '#fff' : '#6B7280', minWidth: 18, textAlign: 'center',
                }}>{s.count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {body}

      {sections.map(s => active === s.key && (
        <div key={s.key} style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C_BORDER}` }}>
          {s.content}
        </div>
      ))}
    </div>
  )
}

// ─── "Chuyển phát nhanh" — nội dung 1 vùng: 1 giá bán cố định ≤1kg ─────────────
function NhanhZoneBody({
  zone, basePrice, setBasePrice, standardWeight, setStandardWeight,
}: {
  zone: Zone247
  basePrice: Record<Zone247, string>
  setBasePrice: (updater: (prev: Record<Zone247, string>) => Record<Zone247, string>) => void
  standardWeight: Record<Zone247, string>
  setStandardWeight: (updater: (prev: Record<Zone247, string>) => Record<Zone247, string>) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 12, color: C_TEXT_LABEL }}>Cân nặng chuẩn</span>
        <div style={{ position: 'relative', width: 110 }}>
          <input
            type="number"
            value={standardWeight[zone]}
            onChange={e => { const v = e.target.value; setStandardWeight(prev => ({ ...prev, [zone]: v })) }}
            placeholder="1000"
            style={{ border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '5px 22px 5px 8px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', width: '100%', boxSizing: 'border-box' }}
          />
          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C_TEXT_SECONDARY, pointerEvents: 'none' }}>g</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 12, color: C_TEXT_LABEL }}>Giá bán chuẩn</span>
        <input
          type="number"
          value={basePrice[zone]}
          onChange={e => { const v = e.target.value; setBasePrice(prev => ({ ...prev, [zone]: v })) }}
          placeholder="Giá bán"
          style={{ border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '5px 8px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', width: 160, boxSizing: 'border-box' }}
        />
      </div>
    </div>
  )
}

// ─── "Vượt cân" theo vùng — tier động, thêm/xoá được, giống GHN ─────────────────
function OverweightTierList247({
  zone, standardWeight, tiers, increaseByTier, onUpdateTier, onUpdateIncrease, onRemoveTier, onAddTier,
}: {
  zone: Zone247
  standardWeight: Record<Zone247, string>
  tiers: OverweightTier247[]
  increaseByTier: Record<string, Record<Zone247, number>>
  onUpdateTier: (id: string, field: 'toGram' | 'stepGram', v: string) => void
  onUpdateIncrease: (id: string, zone: Zone247, v: number) => void
  onRemoveTier: (id: string) => void
  onAddTier: () => void
}) {
  const inlineInput: React.CSSProperties = {
    border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '3px 6px', fontSize: 13, fontWeight: 600,
    color: C_TEXT_PRIMARY, outline: 'none', textAlign: 'center', width: 90,
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tiers.map((tier, idx) => {
        const isLast = idx === tiers.length - 1
        return (
          <div key={tier.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C_TEXT_SECONDARY, flexWrap: 'wrap' as const }}>
            <span>•</span>
            <span>Đến</span>
            {isLast && tier.toGram.trim() === '' ? (
              <span style={{ fontWeight: 600 }}>∞</span>
            ) : (
              <input type="number" value={tier.toGram} onChange={e => onUpdateTier(tier.id, 'toGram', e.target.value)} placeholder="∞" style={{ ...inlineInput, width: 70 }} />
            )}
            <span>g&nbsp;: Tăng</span>
            <input type="number" value={increaseByTier[tier.id]?.[zone] ?? 0} onChange={e => onUpdateIncrease(tier.id, zone, Number(e.target.value) || 0)} style={inlineInput} />
            <span>đ trên mỗi</span>
            <input type="number" value={tier.stepGram} onChange={e => onUpdateTier(tier.id, 'stepGram', e.target.value)} placeholder="500" style={{ ...inlineInput, width: 50 }} />
            <span>g</span>
            <button
              onClick={() => onRemoveTier(tier.id)}
              disabled={tiers.length <= 1}
              style={{ border: 'none', background: 'transparent', cursor: tiers.length <= 1 ? 'not-allowed' : 'pointer', color: tiers.length <= 1 ? '#D1D5DB' : '#9CA3AF', padding: '0 4px', marginLeft: 4 }}
              title="Xoá ngưỡng này"
            >
              ✕
            </button>
          </div>
        )
      })}
      <button
        onClick={onAddTier}
        style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', color: C_ACTION, fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '4px 0', marginTop: 2 }}
      >
        <PlusOutlined style={{ fontSize: 12 }} />
        Thêm ngưỡng vượt cân
      </button>
      <div style={{ fontSize: 11, color: '#9CA3AF' }}>Ô "Đến" để trống nghĩa là không giới hạn (trở lên). Từ mốc cân nặng chuẩn ({Number(standardWeight[zone]) || 0}g) trở lên, phần lẻ được làm tròn theo bước để tính cước.</div>
    </div>
  )
}

export default function PricingCreate247() {
  const navigate = useNavigate()
  const agency = agenciesList.find(a => a.id === CURRENT_AGENCY_ID)
  const hubs = (agency?.clientHubIds ?? []).map(id => clientHubs247.find(h => h.id === id)).filter((h): h is ClientHub247 => !!h)
  const hasHub = hubs.length > 0

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // ── Chuyển phát nhanh state ──────────────────────────────────────────────────
  const [nhanhBasePrice, setNhanhBasePrice] = useState<Record<Zone247, string>>(
    () => Object.fromEntries(ZONES.map(z => [z, ''])) as Record<Zone247, string>
  )
  // Cân nặng chuẩn theo từng vùng — giống GHN (mặc định 1000g, tự chỉnh được)
  const [nhanhStandardWeight, setNhanhStandardWeight] = useState<Record<Zone247, string>>(
    () => Object.fromEntries(ZONES.map(z => [z, '1000'])) as Record<Zone247, string>
  )

  const makeOverweightTiers247 = (): OverweightTier247[] => [
    { id: 'ow1', toGram: '10000', stepGram: '500' },
    { id: 'ow2', toGram: '', stepGram: '500' },
  ]
  const [overweightTiers247, setOverweightTiers247] = useState<OverweightTier247[]>(makeOverweightTiers247())
  const [overweightIncrease247, setOverweightIncrease247] = useState<Record<string, Record<Zone247, number>>>({
    ow1: { ...DEFAULT_STEP_2_10KG },
    ow2: { ...DEFAULT_STEP_OVER_10KG },
  })

  const updateOverweightTier247 = (id: string, field: 'toGram' | 'stepGram', v: string) =>
    setOverweightTiers247(prev => prev.map(t => t.id === id ? { ...t, [field]: v } : t))

  const updateOverweightIncrease247 = (tierId: string, zone: Zone247, v: number) =>
    setOverweightIncrease247(prev => ({ ...prev, [tierId]: { ...prev[tierId], [zone]: v } }))

  const addOverweightTier247 = () => {
    const id = `ow${Date.now()}`
    setOverweightTiers247(prev => [...prev, { id, toGram: '', stepGram: '500' }])
    setOverweightIncrease247(prev => ({ ...prev, [id]: Object.fromEntries(ZONES.map(z => [z, 0])) as Record<Zone247, number> }))
  }

  const removeOverweightTier247 = (id: string) => {
    if (overweightTiers247.length <= 1) return
    setOverweightTiers247(prev => prev.filter(t => t.id !== id))
    setOverweightIncrease247(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  // Giá bán cho shop — Dịch vụ gia tăng nhanh (Phát trong ngày / Phát hẹn giờ),
  // giờ theo đúng 6 vùng của cước chính thay vì bảng vùng riêng
  const makeEmptyFastSell = (): Record<Zone247, [string, string]> =>
    Object.fromEntries(ZONES.map(z => [z, ['', '']])) as Record<Zone247, [string, string]>
  const [sameDaySell, setSameDaySell] = useState<Record<Zone247, [string, string]>>(makeEmptyFastSell)
  const [scheduledSell, setScheduledSell] = useState<Record<Zone247, [string, string]>>(makeEmptyFastSell)

  const updateSameDaySell = (zone: Zone247, rowIndex: 0 | 1, v: string) =>
    setSameDaySell(prev => ({ ...prev, [zone]: prev[zone].map((c, i) => i === rowIndex ? v : c) as [string, string] }))
  const updateScheduledSell = (zone: Zone247, rowIndex: 0 | 1, v: string) =>
    setScheduledSell(prev => ({ ...prev, [zone]: prev[zone].map((c, i) => i === rowIndex ? v : c) as [string, string] }))

  // Giá bán cho shop — Dịch vụ gia tăng khác (text tự do, mỗi dịch vụ 1 đơn vị khác nhau)
  const [extraServiceSell, setExtraServiceSell] = useState<string[]>(() => EXTRA_SERVICES.map(() => ''))
  const updateExtraServiceSell = (index: number, v: string) =>
    setExtraServiceSell(prev => prev.map((x, i) => i === index ? v : x))

  // Phụ phí ngoại thành — giá bán cho shop (% trên cước chính), thay cho máy tính ước
  // tính theo từng vùng trước đây
  const [remoteSurchargeSell, setRemoteSurchargeSell] = useState('')

  // Phí hoàn hàng — theo hợp đồng, cước chuyển hoàn bằng cước chiều đi (mục 2.1)
  const [returnFeeSell, setReturnFeeSell] = useState('')

  const [openRows, setOpenRows] = useState<Set<'ngoaiThanh' | 'hoanHang' | 'dongGoiDVGT'>>(new Set())
  const toggleRow = (key: 'ngoaiThanh' | 'hoanHang' | 'dongGoiDVGT') =>
    setOpenRows(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next })

  const canSave = name.trim().length > 0 && hasHub

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#F9FAFB', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 960, padding: '24px 32px', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button onClick={() => navigate('/agency-admin/carrier-setup/pricing')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <ArrowLeftOutlined style={{ fontSize: 20, color: C_TEXT_PRIMARY }} />
          </button>
          <span style={{ fontSize: 22, fontWeight: 600, color: C_TEXT_PRIMARY }}>Tạo bảng giá 247Express</span>
        </div>
        <p style={{ fontSize: 13, color: C_TEXT_SECONDARY, margin: '0 0 16px 32px', lineHeight: 1.6 }}>
          Giá nhập ở đây là <strong>giá bán cho shop</strong>. Vùng tính theo khoảng cách đường bộ từ địa điểm gửi hàng của đại lý.
          Bảng giá áp dụng cho dịch vụ <strong>{SERVICE_LABEL}</strong> của 247Express.
        </p>

        {hasHub && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Điểm lấy hàng:</span>
            {hubs.map((hub, i) => (
              <span key={hub.id} style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
                {i > 0 && <span style={{ marginRight: 6 }}>·</span>}
                <span style={{ fontFamily: 'monospace' }}>{hub.id}</span> ({hub.name})
              </span>
            ))}
          </div>
        )}

        {/* Basic info — chỉ còn dịch vụ Chuyển phát nhanh, không cần chọn */}
        <SectionCard title="Thông tin bảng giá">
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
              <InputField label="Tên bảng giá" value={name} onChange={setName} placeholder="VD: Bảng giá tiêu chuẩn 247Express" />
              <InputField label="Mô tả" value={description} onChange={setDescription} placeholder="VD: Áp dụng cho tất cả shop" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>Dịch vụ</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                <span style={{
                  padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  border: `1.5px solid ${C_ACTION}`, background: '#FFF4ED', color: C_ACTION,
                }}>
                  {SERVICE_LABEL}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        <>
        {/* Mỗi vùng là 1 block — cân nặng chuẩn + giá bán chuẩn (giống GHN), vượt cân và phụ phí riêng */}
        {ZONES.map(z => (
          <ZoneBlock
            key={z}
            color={ZONE_COLORS[z]}
            label={ZONE_LABELS[z]}
            body={
              <NhanhZoneBody
                zone={z}
                basePrice={nhanhBasePrice} setBasePrice={setNhanhBasePrice}
                standardWeight={nhanhStandardWeight} setStandardWeight={setNhanhStandardWeight}
              />
            }
            sections={[
              {
                key: 'overweight',
                label: 'Vượt cân',
                count: overweightTiers247.length,
                content: (
                  <OverweightTierList247
                    zone={z}
                    standardWeight={nhanhStandardWeight}
                    tiers={overweightTiers247}
                    increaseByTier={overweightIncrease247}
                    onUpdateTier={updateOverweightTier247}
                    onUpdateIncrease={updateOverweightIncrease247}
                    onRemoveTier={removeOverweightTier247}
                    onAddTier={addOverweightTier247}
                  />
                ),
              },
              {
                key: 'fastService',
                label: 'Dịch vụ nhanh',
                count: 2,
                content: (
                  <FastServiceZoneFields
                    sameDay={sameDaySell[z]}
                    scheduled={scheduledSell[z]}
                    onChangeSameDay={(rowIndex, v) => updateSameDaySell(z, rowIndex, v)}
                    onChangeScheduled={(rowIndex, v) => updateScheduledSell(z, rowIndex, v)}
                  />
                ),
              },
            ]}
          />
        ))}

        {/* Phụ phí ngoại thành + Phí đóng gói & Dịch vụ gia tăng — mỗi mục 1 dòng,
            bấm vào mở rộng, thay cho tab "Phụ phí" theo từng vùng trước đây */}
        <SectionCard title="Phụ phí & dịch vụ gia tăng (247Express)">
          <ExpandableRow label="Phụ phí ngoại thành" open={openRows.has('ngoaiThanh')} onToggle={() => toggleRow('ngoaiThanh')}>
            <div style={{ padding: '0 20px' }}>
              <div style={{ width: 200 }}>
                <InputField label="Giá bán cho shop" type="number" value={remoteSurchargeSell} onChange={setRemoteSurchargeSell} suffix="% cước chính" placeholder="VD: 20" />
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>Áp dụng khi điểm giao thuộc khu vực ngoại thành, tính trên cước chính của tuyến.</div>
            </div>
          </ExpandableRow>

          <div style={{ height: 1, background: C_BORDER }} />

          <ExpandableRow label="Phí hoàn hàng" open={openRows.has('hoanHang')} onToggle={() => toggleRow('hoanHang')}>
            <div style={{ padding: '0 20px' }}>
              <div style={{ width: 200 }}>
                <InputField label="Giá bán cho shop" type="number" value={returnFeeSell} onChange={setReturnFeeSell} suffix="% cước chiều đi" placeholder="VD: 100" />
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
                Theo hợp đồng, cước chuyển hoàn = 100% cước chiều đi khi vận đơn bị hoàn về đơn vị gửi.
              </div>
            </div>
          </ExpandableRow>

          <div style={{ height: 1, background: C_BORDER }} />

          <ExpandableRow label="Dịch vụ gia tăng khác" open={openRows.has('dongGoiDVGT')} onToggle={() => toggleRow('dongGoiDVGT')}>
            <div style={{ padding: '0 0 10px' }}><ExtraServicesTable sell={extraServiceSell} onChangeSell={updateExtraServiceSell} /></div>
          </ExpandableRow>
        </SectionCard>
        </>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          {!canSave && (
            <span style={{ fontSize: 12, color: '#9CA3AF', alignSelf: 'center' }}>
              {!hasHub ? 'Đại lý chưa được phân địa điểm gửi hàng' : 'Nhập tên bảng giá'}
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
