import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined, InfoCircleOutlined, CalculatorOutlined, PlusOutlined } from '@ant-design/icons'
import { agenciesList, clientHubs247, type ClientHub247 } from '../../super-admin/agencyStore'

const CURRENT_AGENCY_ID = 'AGN001'

const C_ACTION         = '#FF5200'
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_TEXT_LABEL     = '#4B5563'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'
const C_BG_FORM        = '#F9FAFB'

// ─── 3 dịch vụ 247Express — mỗi dịch vụ có vùng tính giá riêng theo hợp đồng
// số 1231/2026/HĐDV-247 ─────────────────────────────────────────────────────────
type ServiceKey = 'nhanh' | 'tietkiem' | 'duongbo'

const SERVICE_LABELS: Record<ServiceKey, string> = {
  nhanh:    'Chuyển phát nhanh',
  tietkiem: 'Chuyển phát nhanh tiết kiệm',
  duongbo:  'Chuyển phát đường bộ',
}

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

// Cước chính — giá cố định cho ≤ cân nặng chuẩn (tự cấu hình theo từng vùng,
// giống GHN), sau đó áp dụng tier vượt cân cho phần còn lại
function mainFreightCost(
  zone: Zone247,
  gram: number,
  basePrice: Record<Zone247, string>,
  standardWeight: Record<Zone247, string>,
  tiers: OverweightTier247[],
  increaseByTier: Record<string, Record<Zone247, number>>,
): number {
  if (gram <= 0) return 0
  const base = Number(basePrice[zone]) || 0
  const boundary0 = Number(standardWeight[zone]) || 0
  if (gram <= boundary0) return base
  let cost = base
  let boundary = boundary0
  for (const tier of tiers) {
    if (gram <= boundary) break
    const stepGram = Number(tier.stepGram) || 500
    const increase = increaseByTier[tier.id]?.[zone] ?? 0
    const tierEnd = tier.toGram.trim() === '' ? Infinity : Number(tier.toGram)
    const effectiveEnd = Math.min(gram, tierEnd)
    const steps = Math.ceil((effectiveEnd - boundary) / stepGram)
    cost += steps * increase
    boundary = tierEnd
  }
  return cost
}

// "Nấc cước phí tương ứng TL" dùng cho phụ phí HNK/HQK
function tierStepRate(
  zone: Zone247,
  weightKg: number,
  tiers: OverweightTier247[],
  increaseByTier: Record<string, Record<Zone247, number>>,
): number {
  const gram = weightKg * 1000
  for (const tier of tiers) {
    const tierEnd = tier.toGram.trim() === '' ? Infinity : Number(tier.toGram)
    if (gram <= tierEnd) return increaseByTier[tier.id]?.[zone] ?? 0
  }
  return increaseByTier[tiers[tiers.length - 1]?.id]?.[zone] ?? 0
}

const REMOTE_SURCHARGE_PERCENT = 20   // Phụ phí ngoại thành
const FUEL_SURCHARGE_PERCENT   = 24   // Phụ phí nhiên liệu, hiệu lực 01/05/2026-31/07/2026
const HNK_PERCENT              = 10   // Cước hàng nguyên khối
const HQK_PERCENT              = 10   // Cước hàng quá khổ
const FORKLIFT_FEE             = 625000 // đ/lần thuê xe nâng/phương tiện chuyên dụng

function hnkFee(zone: Zone247, weightKg: number, tiers: OverweightTier247[], increaseByTier: Record<string, Record<Zone247, number>>): number {
  return weightKg * (HNK_PERCENT / 100) * tierStepRate(zone, weightKg, tiers, increaseByTier)
}

function hqkFee(zone: Zone247, weightKg: number, tiers: OverweightTier247[], increaseByTier: Record<string, Record<Zone247, number>>): number {
  if (weightKg < 15) return (15 - weightKg) * tierStepRate(zone, weightKg, tiers, increaseByTier)
  return weightKg * (HQK_PERCENT / 100) * tierStepRate(zone, weightKg, tiers, increaseByTier)
}

// ─── Vùng dùng cho "Chuyển phát nhanh tiết kiệm" và "Chuyển phát đường bộ" — 5
// vùng, giá theo "đến 5kg" + cộng thêm mỗi 1kg tiếp theo (khác cấu trúc "Chuyển
// phát nhanh" ở trên, theo đúng hợp đồng) ───────────────────────────────────────
type Zone5 = 'ntl1' | 'ntl2' | 'den300' | 'den1000' | 'tren1000'

const ZONES5: Zone5[] = ['ntl1', 'ntl2', 'den300', 'den1000', 'tren1000']

const ZONE5_LABELS: Record<Zone5, string> = {
  ntl1:     'Nội tỉnh 1',
  ntl2:     'Nội tỉnh 2',
  den300:   'Đến 300 km',
  den1000:  'Đến 1000 km',
  tren1000: 'Trên 1000 km',
}

const ZONE5_COLORS: Record<Zone5, string> = {
  ntl1: '#16A34A', ntl2: '#0D9488', den300: '#2563EB', den1000: '#C2410C', tren1000: '#7C3AED',
}

type WeightBand5 = { label: string; toKg: number; rates: Record<Zone5, number> }

// Chuyển phát nhanh tiết kiệm — mục "Cước chính"
const TIETKIEM_BANDS: WeightBand5[] = [
  { label: 'Đến 50kg',   toKg: 50,       rates: { ntl1: 3800, ntl2: 6000, den300: 6000, den1000: 9000, tren1000: 14100 } },
  { label: 'Đến 200kg',  toKg: 200,      rates: { ntl1: 3200, ntl2: 5100, den300: 5100, den1000: 7700, tren1000: 12000 } },
  { label: 'Đến 500kg',  toKg: 500,      rates: { ntl1: 2600, ntl2: 4400, den300: 4400, den1000: 6500, tren1000: 10200 } },
  { label: 'Trên 500kg', toKg: Infinity, rates: { ntl1: 2500, ntl2: 3500, den300: 3500, den1000: 5200, tren1000: 8100 } },
]
const TIETKIEM_TRANSIT: Record<Zone5, string> = {
  ntl1: '1 - 1.5 ngày', ntl2: '1 - 2 ngày', den300: '1 - 2 ngày', den1000: '1 - 3 ngày', tren1000: '3 - 4 ngày',
}

// Chuyển phát đường bộ — mục "Cước chính"
const DUONGBO_BANDS: WeightBand5[] = [
  { label: 'Đến 50kg',   toKg: 50,       rates: { ntl1: 3200, ntl2: 3800, den300: 3800, den1000: 4800, tren1000: 6400 } },
  { label: 'Đến 200kg',  toKg: 200,      rates: { ntl1: 2500, ntl2: 2900, den300: 2900, den1000: 3700, tren1000: 5200 } },
  { label: 'Đến 500kg',  toKg: 500,      rates: { ntl1: 2200, ntl2: 2600, den300: 2600, den1000: 3300, tren1000: 4600 } },
  { label: 'Trên 500kg', toKg: Infinity, rates: { ntl1: 2000, ntl2: 2400, den300: 2400, den1000: 3100, tren1000: 4400 } },
]
const DUONGBO_TRANSIT: Record<Zone5, string> = {
  ntl1: '1 - 2 ngày', ntl2: '2 - 3 ngày', den300: '2 - 3 ngày', den1000: '2 - 4 ngày', tren1000: '4 - 5 ngày',
}

// Tier vượt cân động cho dịch vụ Tiết kiệm / Đường bộ (toKg rỗng = không giới hạn)
type OverweightBandConfig = { id: string; toKg: string; stepKg: string }

const makeBandConfig = (bands: WeightBand5[], prefix: string): OverweightBandConfig[] =>
  bands.map((b, i) => ({
    id: `${prefix}${i + 1}`,
    toKg: b.toKg === Infinity ? '' : String(b.toKg),
    stepKg: '1',
  }))

// ─── Dịch vụ gia tăng nhanh (mục 3.1, 3.2) — vùng tính riêng, không dùng 6 vùng
// của cước chính ────────────────────────────────────────────────────────────────
const FAST_SERVICE_ZONES = ['Nội tỉnh 1', 'Nội tỉnh 2', 'Đến 100km', 'Đến 300km', 'Trên 300km']

const SAME_DAY_ROWS: { label: string; values: number[] }[] = [
  { label: 'Đến 2kg',            values: [30000, 70000, 70000, 100000, 250000] },
  { label: '+500gr tiếp theo',   values: [3000, 5000, 5000, 7000, 9000] },
]

const SCHEDULED_ROWS: { label: string; values: number[] }[] = [
  { label: 'Đến 2kg',            values: [30000, 50000, 50000, 70000, 90000] },
  { label: '+500gr tiếp theo',   values: [3000, 5000, 5000, 7000, 9000] },
]

type PackagingMaterial = { label: string; upTo1kg?: number; per5kg?: number; flatPerUnit?: number }

const PACKAGING_MATERIALS: PackagingMaterial[] = [
  { label: 'Đóng gỗ',         upTo1kg: 30000, per5kg: 10000 },
  { label: 'Đóng gỗ xốp',     upTo1kg: 40000, per5kg: 15000 },
  { label: 'Đóng carton',     upTo1kg: 10000, per5kg: 10000 },
  { label: 'Đóng carton xốp', upTo1kg: 20000, per5kg: 15000 },
  { label: 'Đóng ống nhựa',   upTo1kg: 30000, per5kg: 10000 },
  { label: 'Đóng pallet',     flatPerUnit: 170000 },
  { label: 'Đóng khác',       upTo1kg: 30000, per5kg: 10000 },
]

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

// ─── Dịch vụ gia tăng nhanh (Phát trong ngày / Phát hẹn giờ) — đại lý tự nhập
// giá bán cho shop theo từng mốc × vùng ───────────────────────────────────────
function FastServiceTable({ rows, sell, onChangeSell }: {
  rows: { label: string; values: number[] }[]
  sell: string[][]
  onChangeSell: (rowIndex: number, zoneIndex: number, v: string) => void
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `1.2fr repeat(${FAST_SERVICE_ZONES.length}, 1fr)`, minWidth: 760 }}>
        <div style={{ padding: '8px 16px', background: C_BG_HEADER, fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>Trọng lượng</div>
        {FAST_SERVICE_ZONES.map(z => (
          <div key={z} style={{ padding: '8px 16px', background: C_BG_HEADER, fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>{z}</div>
        ))}
        {rows.map((r, ri) => (
          <Fragment key={r.label}>
            <div style={{ padding: '9px 16px', borderTop: `1px solid ${C_BORDER}`, fontSize: 13, color: C_TEXT_PRIMARY, fontWeight: 500 }}>{r.label}</div>
            {r.values.map((_, zi) => (
              <div key={zi} style={{ padding: '6px 12px', borderTop: `1px solid ${C_BORDER}`, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <input
                  type="number"
                  value={sell[ri]?.[zi] ?? ''}
                  onChange={e => onChangeSell(ri, zi, e.target.value)}
                  placeholder="Giá bán"
                  style={{ border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '4px 7px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

// ─── Bảng tĩnh: Phí đóng gói ───────────────────────────────────────────────────
function PackagingTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', minWidth: 520 }}>
        {['Loại vật liệu', 'Đến 1kg', 'Mỗi 5kg tiếp theo'].map(h => (
          <div key={h} style={{ padding: '8px 16px', background: C_BG_HEADER, fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL }}>{h}</div>
        ))}
        {PACKAGING_MATERIALS.map((m) => (
          <Fragment key={m.label}>
            <div style={{ padding: '9px 16px', borderTop: `1px solid ${C_BORDER}`, fontSize: 13, color: C_TEXT_PRIMARY, fontWeight: 500 }}>{m.label}</div>
            <div style={{ padding: '9px 16px', borderTop: `1px solid ${C_BORDER}`, fontSize: 13, color: C_TEXT_PRIMARY }}>
              {m.flatPerUnit ? `${m.flatPerUnit.toLocaleString()}đ/cái` : `${m.upTo1kg!.toLocaleString()}đ`}
            </div>
            <div style={{ padding: '9px 16px', borderTop: `1px solid ${C_BORDER}`, fontSize: 13, color: C_TEXT_SECONDARY }}>
              {m.flatPerUnit ? '—' : `${m.per5kg!.toLocaleString()}đ`}
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

// ─── "Phụ phí" theo vùng — ngoại thành, nhiên liệu, HNK/HQK, xe nâng (theo hợp
// đồng, tính cho đúng vùng đang mở) ─────────────────────────────────────────────
function ZoneFreightCalculator({
  zone, basePrice, standardWeight, overweightTiers, increaseByTier,
}: {
  zone: Zone247
  basePrice: Record<Zone247, string>
  standardWeight: Record<Zone247, string>
  overweightTiers: OverweightTier247[]
  increaseByTier: Record<string, Record<Zone247, number>>
}) {
  const [weight, setWeight] = useState('10')
  const [cargoType, setCargoType] = useState<'thuong' | 'hnk' | 'hqk'>('thuong')
  const [includeReturn, setIncludeReturn] = useState(false)
  const [applyRemote, setApplyRemote] = useState(true)
  const [forkliftCount, setForkliftCount] = useState('0')

  const weightKg = Math.max(Number(weight) || 0, 0)
  const base = mainFreightCost(zone, weightKg * 1000, basePrice, standardWeight, overweightTiers, increaseByTier)
  const returnFee = includeReturn ? base : 0
  const remote = applyRemote ? (base + returnFee) * (REMOTE_SURCHARGE_PERCENT / 100) : 0
  const fuel = (base + returnFee + remote) * (FUEL_SURCHARGE_PERCENT / 100)
  const hnk = cargoType === 'hnk' ? hnkFee(zone, weightKg, overweightTiers, increaseByTier) : 0
  const hqk = cargoType === 'hqk' ? hqkFee(zone, weightKg, overweightTiers, increaseByTier) : 0
  const forklift = (Number(forkliftCount) || 0) * FORKLIFT_FEE
  const total = base + returnFee + remote + fuel + hnk + hqk + forklift

  const row = (label: string, value: number, dim = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
      <span style={{ color: dim ? C_TEXT_SECONDARY : C_TEXT_PRIMARY }}>{label}</span>
      <span style={{ color: dim ? C_TEXT_SECONDARY : C_TEXT_PRIMARY, fontWeight: dim ? 400 : 600 }}>{value.toLocaleString()}đ</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' as const }}>
      <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: C_TEXT_LABEL }}>
          <CalculatorOutlined /> Ước tính phí phát sinh
        </div>
        <div style={{ width: 160 }}>
          <InputField label="Khối lượng" type="number" value={weight} onChange={setWeight} suffix="kg" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 13, color: C_TEXT_LABEL }}>Loại hàng</span>
          <div style={{ display: 'inline-flex', gap: 1, background: '#F3F4F6', borderRadius: 6, padding: 2, width: 'fit-content' }}>
            {([
              { key: 'thuong' as const, label: 'Hàng thường' },
              { key: 'hnk' as const,    label: 'Nguyên khối' },
              { key: 'hqk' as const,    label: 'Quá khổ' },
            ]).map(opt => {
              const active = cargoType === opt.key
              return (
                <button key={opt.key} onClick={() => setCargoType(opt.key)}
                  style={{
                    fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 5, border: 'none', cursor: 'pointer',
                    background: active ? '#fff' : 'transparent', color: active ? C_TEXT_PRIMARY : C_TEXT_SECONDARY,
                    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C_TEXT_PRIMARY, cursor: 'pointer' }}>
          <input type="checkbox" checked={includeReturn} onChange={e => setIncludeReturn(e.target.checked)} />
          Có cước chuyển hoàn (= 100% cước chiều đi)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C_TEXT_PRIMARY, cursor: 'pointer' }}>
          <input type="checkbox" checked={applyRemote} onChange={e => setApplyRemote(e.target.checked)} />
          Điểm giao thuộc khu vực ngoại thành (áp phụ phí ngoại thành)
        </label>

        <InputField label="Số lần thuê xe nâng / phương tiện chuyên dụng" type="number" value={forkliftCount} onChange={setForkliftCount} suffix="lần" />
      </div>

      <div style={{ flex: '1 1 260px', background: C_BG_FORM, border: `1px solid ${C_BORDER}`, borderRadius: 8, padding: '12px 16px', alignSelf: 'flex-start' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C_TEXT_LABEL, marginBottom: 4 }}>Chi tiết cước ({weightKg}kg)</div>
        {row('Cước chính', base)}
        {includeReturn && row('Cước chuyển hoàn', returnFee)}
        {applyRemote && row(`Phụ phí ngoại thành (${REMOTE_SURCHARGE_PERCENT}%)`, remote, true)}
        {row(`Phụ phí nhiên liệu (${FUEL_SURCHARGE_PERCENT}%, đến 31/07/2026)`, fuel, true)}
        {cargoType === 'hnk' && row(`Cước hàng nguyên khối (${HNK_PERCENT}%)`, hnk, true)}
        {cargoType === 'hqk' && row('Cước hàng quá khổ', hqk, true)}
        {forklift > 0 && row('Phụ phí thuê xe nâng', forklift, true)}
        <div style={{ height: 1, background: C_BORDER, margin: '6px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>Tổng cước</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: C_ACTION }}>{Math.round(total).toLocaleString()}đ</span>
        </div>
      </div>
    </div>
  )
}

// ─── "Chuyển phát nhanh tiết kiệm" / "Chuyển phát đường bộ" — nội dung 1 vùng ──
function FiveZoneBody({
  zone, sellBase, setSellBase, standardWeight, setStandardWeight,
}: {
  zone: Zone5
  sellBase: Record<Zone5, string>
  setSellBase: (updater: (prev: Record<Zone5, string>) => Record<Zone5, string>) => void
  standardWeight: Record<Zone5, string>
  setStandardWeight: (updater: (prev: Record<Zone5, string>) => Record<Zone5, string>) => void
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
            placeholder="5000"
            style={{ border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '5px 22px 5px 8px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', width: '100%', boxSizing: 'border-box' }}
          />
          <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C_TEXT_SECONDARY, pointerEvents: 'none' }}>g</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 12, color: C_TEXT_LABEL }}>Giá bán chuẩn</span>
        <input
          type="number"
          value={sellBase[zone]}
          onChange={e => { const v = e.target.value; setSellBase(prev => ({ ...prev, [zone]: v })) }}
          placeholder="Giá bán"
          style={{ border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '5px 8px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', width: 160, boxSizing: 'border-box' }}
        />
      </div>
    </div>
  )
}

// ─── "Vượt cân" cho 5 vùng — tier động, thêm/xoá được, tất cả đều chỉnh sửa
// được tự do (không khoá mốc mặc định nào) ──────────────────────────────────
function FiveZoneOverweightRows({
  zone, standardWeight, bands, sellBands, onUpdateBand, onUpdateSell, onRemoveBand, onAddBand,
}: {
  zone: Zone5
  standardWeight: Record<Zone5, string>
  bands: OverweightBandConfig[]
  sellBands: Record<string, Record<Zone5, string>>
  onUpdateBand: (id: string, field: 'toKg' | 'stepKg', v: string) => void
  onUpdateSell: (id: string, zone: Zone5, v: string) => void
  onRemoveBand: (id: string) => void
  onAddBand: () => void
}) {
  const inlineInput: React.CSSProperties = {
    border: `1px solid ${C_BORDER}`, borderRadius: 5, padding: '3px 6px', fontSize: 13, fontWeight: 600,
    color: C_TEXT_PRIMARY, outline: 'none', textAlign: 'center', width: 90,
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {bands.map((band, idx) => {
        const isLast = idx === bands.length - 1
        return (
          <div key={band.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C_TEXT_SECONDARY, flexWrap: 'wrap' as const }}>
            <span>•</span>
            <span>Đến</span>
            {isLast && band.toKg.trim() === '' ? (
              <span style={{ fontWeight: 600 }}>∞</span>
            ) : (
              <input type="number" value={band.toKg} onChange={e => onUpdateBand(band.id, 'toKg', e.target.value)} placeholder="∞" style={{ ...inlineInput, width: 70 }} />
            )}
            <span>kg&nbsp;: Tăng</span>
            <input type="number" value={sellBands[band.id]?.[zone] ?? ''} onChange={e => onUpdateSell(band.id, zone, e.target.value)} style={inlineInput} />
            <span>đ trên mỗi</span>
            <input type="number" value={band.stepKg} onChange={e => onUpdateBand(band.id, 'stepKg', e.target.value)} placeholder="1" style={{ ...inlineInput, width: 50 }} />
            <span>kg</span>
            <button
              onClick={() => onRemoveBand(band.id)}
              disabled={bands.length <= 1}
              style={{ border: 'none', background: 'transparent', cursor: bands.length <= 1 ? 'not-allowed' : 'pointer', color: bands.length <= 1 ? '#D1D5DB' : '#9CA3AF', padding: '0 4px', marginLeft: 4 }}
              title="Xoá mốc này"
            >
              ✕
            </button>
          </div>
        )
      })}
      <button
        onClick={onAddBand}
        style={{ display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: 'transparent', color: C_ACTION, fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: '4px 0', marginTop: 2 }}
      >
        <PlusOutlined style={{ fontSize: 12 }} />
        Thêm mốc vượt cân
      </button>
      <div style={{ fontSize: 11, color: '#9CA3AF' }}>Ô "Đến" để trống nghĩa là không giới hạn (trở lên). Từ mốc cân nặng chuẩn ({(Number(standardWeight[zone]) || 0) / 1000}kg) trở lên, phần lẻ được làm tròn 1kg để tính cước.</div>
    </div>
  )
}

// ─── Danh sách block theo vùng cho dịch vụ 5 vùng (tiết kiệm / đường bộ) ──────
function FiveZoneServiceBlocks({
  service, bands, transit,
  sellBase, setSellBase, sellBands,
  standardWeight, setStandardWeight,
  onUpdateBand, onUpdateSell, onRemoveBand, onAddBand,
}: {
  service: ServiceKey
  bands: OverweightBandConfig[]
  transit: Record<Zone5, string>
  sellBase: Record<Zone5, string>
  setSellBase: (updater: (prev: Record<Zone5, string>) => Record<Zone5, string>) => void
  sellBands: Record<string, Record<Zone5, string>>
  standardWeight: Record<Zone5, string>
  setStandardWeight: (updater: (prev: Record<Zone5, string>) => Record<Zone5, string>) => void
  onUpdateBand: (id: string, field: 'toKg' | 'stepKg', v: string) => void
  onUpdateSell: (id: string, zone: Zone5, v: string) => void
  onRemoveBand: (id: string) => void
  onAddBand: () => void
}) {
  return (
    <>
      {ZONES5.map(z => (
        <ZoneBlock
          key={z}
          color={ZONE5_COLORS[z]}
          label={ZONE5_LABELS[z]}
          body={<FiveZoneBody zone={z} sellBase={sellBase} setSellBase={setSellBase} standardWeight={standardWeight} setStandardWeight={setStandardWeight} />}
          sections={[
            {
              key: 'overweight',
              label: 'Vượt cân',
              count: bands.length,
              content: (
                <FiveZoneOverweightRows
                  zone={z} standardWeight={standardWeight} bands={bands} sellBands={sellBands}
                  onUpdateBand={onUpdateBand} onUpdateSell={onUpdateSell}
                  onRemoveBand={onRemoveBand} onAddBand={onAddBand}
                />
              ),
            },
            { key: 'transit', label: 'Thời gian giao', count: 1, content: <span style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>{transit[z]}</span> },
          ]}
        />
      ))}

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
        <InfoCircleOutlined style={{ color: '#D97706', fontSize: 15, marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6 }}>
          Phụ phí (ngoại thành, nhiên liệu, hàng nguyên khối/quá khổ...), dịch vụ gia tăng và phí đóng gói cho dịch vụ <strong>{SERVICE_LABELS[service]}</strong> chưa có trong tài liệu hợp đồng đã cung cấp — sẽ bổ sung khi có dữ liệu.
        </div>
      </div>
    </>
  )
}

export default function PricingCreate247() {
  const navigate = useNavigate()
  const agency = agenciesList.find(a => a.id === CURRENT_AGENCY_ID)
  const hubs = (agency?.clientHubIds ?? []).map(id => clientHubs247.find(h => h.id === id)).filter((h): h is ClientHub247 => !!h)
  const hasHub = hubs.length > 0

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const [activeService, setActiveService] = useState<ServiceKey>('nhanh')

  const makeEmptySell5 = (): Record<Zone5, string> => Object.fromEntries(ZONES5.map(z => [z, ''])) as Record<Zone5, string>

  const makeStandardWeight5 = (): Record<Zone5, string> => Object.fromEntries(ZONES5.map(z => [z, '5000'])) as Record<Zone5, string>

  // ── Tiết kiệm state ──────────────────────────────────────────────────────────
  const [tietkiemSellBase, setTietkiemSellBase] = useState<Record<Zone5, string>>(makeEmptySell5)
  const [tietkiemStandardWeight, setTietkiemStandardWeight] = useState<Record<Zone5, string>>(makeStandardWeight5)
  const [tietkiemBands, setTietkiemBands] = useState<OverweightBandConfig[]>(() => makeBandConfig(TIETKIEM_BANDS, 'tb'))
  const [tietkiemSellBands, setTietkiemSellBands] = useState<Record<string, Record<Zone5, string>>>(
    () => Object.fromEntries(makeBandConfig(TIETKIEM_BANDS, 'tb').map(b => [b.id, makeEmptySell5()]))
  )

  const addTietkiemBand = () => {
    const id = `tb${Date.now()}`
    setTietkiemBands(prev => [...prev, { id, toKg: '', stepKg: '1' }])
    setTietkiemSellBands(prev => ({ ...prev, [id]: makeEmptySell5() }))
  }
  const removeTietkiemBand = (id: string) => {
    if (tietkiemBands.length <= 1) return
    setTietkiemBands(prev => prev.filter(b => b.id !== id))
    setTietkiemSellBands(prev => { const next = { ...prev }; delete next[id]; return next })
  }
  const updateTietkiemBand = (id: string, field: 'toKg' | 'stepKg', v: string) =>
    setTietkiemBands(prev => prev.map(b => b.id === id ? { ...b, [field]: v } : b))
  const updateTietkiemSell = (id: string, zone: Zone5, v: string) =>
    setTietkiemSellBands(prev => ({ ...prev, [id]: { ...prev[id], [zone]: v } }))

  // ── Đường bộ state ───────────────────────────────────────────────────────────
  const [duongboSellBase, setDuongboSellBase] = useState<Record<Zone5, string>>(makeEmptySell5)
  const [duongboStandardWeight, setDuongboStandardWeight] = useState<Record<Zone5, string>>(makeStandardWeight5)
  const [duongboBands, setDuongboBands] = useState<OverweightBandConfig[]>(() => makeBandConfig(DUONGBO_BANDS, 'db'))
  const [duongboSellBands, setDuongboSellBands] = useState<Record<string, Record<Zone5, string>>>(
    () => Object.fromEntries(makeBandConfig(DUONGBO_BANDS, 'db').map(b => [b.id, makeEmptySell5()]))
  )

  const addDuongboBand = () => {
    const id = `db${Date.now()}`
    setDuongboBands(prev => [...prev, { id, toKg: '', stepKg: '1' }])
    setDuongboSellBands(prev => ({ ...prev, [id]: makeEmptySell5() }))
  }
  const removeDuongboBand = (id: string) => {
    if (duongboBands.length <= 1) return
    setDuongboBands(prev => prev.filter(b => b.id !== id))
    setDuongboSellBands(prev => { const next = { ...prev }; delete next[id]; return next })
  }
  const updateDuongboBand = (id: string, field: 'toKg' | 'stepKg', v: string) =>
    setDuongboBands(prev => prev.map(b => b.id === id ? { ...b, [field]: v } : b))
  const updateDuongboSell = (id: string, zone: Zone5, v: string) =>
    setDuongboSellBands(prev => ({ ...prev, [id]: { ...prev[id], [zone]: v } }))

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

  // Giá bán cho shop — Dịch vụ gia tăng nhanh (Phát trong ngày / Phát hẹn giờ)
  const [sameDaySell, setSameDaySell] = useState<string[][]>(() => SAME_DAY_ROWS.map(() => FAST_SERVICE_ZONES.map(() => '')))
  const [scheduledSell, setScheduledSell] = useState<string[][]>(() => SCHEDULED_ROWS.map(() => FAST_SERVICE_ZONES.map(() => '')))

  const updateSameDaySell = (rowIndex: number, zoneIndex: number, v: string) =>
    setSameDaySell(prev => prev.map((row, i) => i === rowIndex ? row.map((c, j) => j === zoneIndex ? v : c) : row))
  const updateScheduledSell = (rowIndex: number, zoneIndex: number, v: string) =>
    setScheduledSell(prev => prev.map((row, i) => i === rowIndex ? row.map((c, j) => j === zoneIndex ? v : c) : row))

  // Giá bán cho shop — Dịch vụ gia tăng khác (text tự do, mỗi dịch vụ 1 đơn vị khác nhau)
  const [extraServiceSell, setExtraServiceSell] = useState<string[]>(() => EXTRA_SERVICES.map(() => ''))
  const updateExtraServiceSell = (index: number, v: string) =>
    setExtraServiceSell(prev => prev.map((x, i) => i === index ? v : x))

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
          Giá nhập ở đây là <strong>giá bán cho shop</strong>. Vùng tính theo khoảng cách đường bộ từ ClientHubID của đại lý.
          247Express có <strong>3 dịch vụ</strong> với vùng tính giá riêng — mỗi bảng giá chỉ ứng với 1 dịch vụ, chọn ở mục "Thông tin bảng giá" bên dưới.
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

        {/* Basic info — mỗi bảng giá chỉ ứng với ĐÚNG 1 dịch vụ 247Express */}
        <SectionCard title="Thông tin bảng giá">
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
              <InputField label="Tên bảng giá" value={name} onChange={setName} placeholder="VD: Bảng giá tiêu chuẩn 247Express" />
              <InputField label="Mô tả" value={description} onChange={setDescription} placeholder="VD: Áp dụng cho tất cả shop" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 14, color: C_TEXT_LABEL }}>
                Dịch vụ <span style={{ color: '#EF4444' }}>*</span>
                <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, fontWeight: 400 }}> — mỗi bảng giá chỉ áp dụng cho 1 dịch vụ</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                {(Object.keys(SERVICE_LABELS) as ServiceKey[]).map(key => {
                  const active = activeService === key
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveService(key)}
                      style={{
                        padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        border: active ? `1.5px solid ${C_ACTION}` : `1.5px solid ${C_BORDER}`,
                        background: active ? '#FFF4ED' : '#fff',
                        color: active ? C_ACTION : C_TEXT_SECONDARY,
                      }}
                    >
                      {SERVICE_LABELS[key]}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </SectionCard>

        {activeService === 'tietkiem' && (
          <FiveZoneServiceBlocks
            service="tietkiem"
            bands={tietkiemBands} transit={TIETKIEM_TRANSIT}
            sellBase={tietkiemSellBase} setSellBase={setTietkiemSellBase}
            sellBands={tietkiemSellBands}
            standardWeight={tietkiemStandardWeight} setStandardWeight={setTietkiemStandardWeight}
            onUpdateBand={updateTietkiemBand} onUpdateSell={updateTietkiemSell}
            onRemoveBand={removeTietkiemBand} onAddBand={addTietkiemBand}
          />
        )}
        {activeService === 'duongbo' && (
          <FiveZoneServiceBlocks
            service="duongbo"
            bands={duongboBands} transit={DUONGBO_TRANSIT}
            sellBase={duongboSellBase} setSellBase={setDuongboSellBase}
            standardWeight={duongboStandardWeight} setStandardWeight={setDuongboStandardWeight}
            sellBands={duongboSellBands}
            onUpdateBand={updateDuongboBand} onUpdateSell={updateDuongboSell}
            onRemoveBand={removeDuongboBand} onAddBand={addDuongboBand}
          />
        )}

        {activeService === 'nhanh' && (
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
                key: 'surcharge',
                label: 'Phụ phí',
                count: 5,
                content: (
                  <ZoneFreightCalculator
                    zone={z}
                    basePrice={nhanhBasePrice}
                    standardWeight={nhanhStandardWeight}
                    overweightTiers={overweightTiers247}
                    increaseByTier={overweightIncrease247}
                  />
                ),
              },
            ]}
          />
        ))}

        {/* Dịch vụ gia tăng & phụ phí khác — gộp chung 1 chỗ */}
        <SectionCard title="Dịch vụ gia tăng & phụ phí khác (247Express)">
          <div style={{ padding: '12px 20px 4px', fontSize: 13, fontWeight: 700, color: C_TEXT_PRIMARY }}>Dịch vụ gia tăng nhanh</div>
          <div style={{ padding: '0 20px 4px', fontSize: 12, color: C_TEXT_SECONDARY }}>Phát trong ngày · Phát hẹn giờ (đã bao gồm phí Express)</div>
          <div style={{ padding: '4px 20px 4px', fontSize: 13, fontWeight: 600, color: C_TEXT_LABEL }}>Phát trong ngày</div>
          <div style={{ padding: '0 0 12px' }}><FastServiceTable rows={SAME_DAY_ROWS} sell={sameDaySell} onChangeSell={updateSameDaySell} /></div>
          <div style={{ padding: '4px 20px 4px', fontSize: 13, fontWeight: 600, color: C_TEXT_LABEL }}>Phát hẹn giờ</div>
          <div style={{ padding: '0 0 10px' }}><FastServiceTable rows={SCHEDULED_ROWS} sell={scheduledSell} onChangeSell={updateScheduledSell} /></div>

          <div style={{ height: 1, background: C_BORDER, margin: '4px 0' }} />

          <div style={{ padding: '12px 20px 4px', fontSize: 13, fontWeight: 700, color: C_TEXT_PRIMARY }}>Phí đóng gói</div>
          <div style={{ padding: '0 0 10px' }}><PackagingTable /></div>

          <div style={{ height: 1, background: C_BORDER, margin: '4px 0' }} />

          <div style={{ padding: '12px 20px 4px', fontSize: 13, fontWeight: 700, color: C_TEXT_PRIMARY }}>Dịch vụ gia tăng khác</div>
          <div style={{ padding: '0 0 10px' }}><ExtraServicesTable sell={extraServiceSell} onChangeSell={updateExtraServiceSell} /></div>
        </SectionCard>
        </>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          {!canSave && (
            <span style={{ fontSize: 12, color: '#9CA3AF', alignSelf: 'center' }}>
              {!hasHub ? 'Đại lý chưa được phân ClientHubID' : 'Nhập tên bảng giá'}
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
