import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { RiseOutlined, FallOutlined, SearchOutlined } from '@ant-design/icons'
import { agencyAdminTheme } from '../../../theme/platforms'
import { loadShops } from '../../../mock-data/shopStore'
import { loadOrders } from '../../../mock-data/orderStore'
import { getShopCodTotal, getShopServiceFeeTotal } from '../../../mock-data/reconciliationLedger'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_ACTION         = '#FF5200'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'
const C_GOOD           = '#16A34A'
const C_BAD            = '#DC2626'

const CURRENT_AGENCY_ID = 'AGN001'

// ── Helpers ──────────────────────────────────────────────────
const fmtNum = (n: number) => n.toLocaleString('vi-VN')
const fmtVND = (n: number) => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + ' tỷ'
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1).replace('.0', '') + ' tr'
  return n.toLocaleString('vi-VN') + ' ₫'
}

// Tất cả số liệu theo shop (COD, Tổng phí) trong bảng cũ đều lấy từ dữ liệu đối soát THẬT của
// từng shop (reconciliationLedger.ts) — vẫn giữ hàm này cho phần "Số shop" — các số liệu doanh
// thu/sản lượng THEO KỲ ở phần "Thống kê Shop trên Agency" bên dưới dùng order.fee trực tiếp
// (xem buildShopPeriodStats), không dùng buildShopStats().
function buildShopStats() {
  const raw = loadShops().filter((s) => s.agencyId === CURRENT_AGENCY_ID)
  return raw.map((s) => {
    const cod      = getShopCodTotal(s.id)
    const totalFee = getShopServiceFeeTotal(s.id)
    return { ...s, cod, totalFee }
  })
}

type PeriodKey = 'day' | 'week' | 'month'
const PERIOD_LABELS: Record<PeriodKey, string> = { day: 'Ngày', week: 'Tuần', month: 'Tháng' }
const DAY_MS = 24 * 60 * 60 * 1000

function getAgencyOrders() {
  const shopIds = new Set(loadShops().filter((s) => s.agencyId === CURRENT_AGENCY_ID).map((s) => s.id))
  return loadOrders().filter((o) => shopIds.has(o.shopId))
}

function sumFeeInRange(orders: { createdAt: string; fee: number }[], start: Date, end: Date) {
  const startMs = start.getTime()
  const endMs = end.getTime()
  return orders.reduce((sum, o) => {
    const t = new Date(o.createdAt).getTime()
    return t >= startMs && t <= endMs ? sum + o.fee : sum
  }, 0)
}

const startOfDay   = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const endOfDay     = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }
const startOfMonth = (d: Date) => { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x }
const fmtDate       = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
const fmtDateTime    = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`

// Khoảng "Kỳ này" / "Kỳ trước" theo ĐÚNG yêu cầu nghiệp vụ cho từng tab — 3 tab dùng 3 định nghĩa
// "kỳ trước" khác nhau:
// - Ngày: so với CÙNG KỲ D-7 (đúng ngày này 7 ngày trước — cùng thứ trong tuần), không phải hôm qua.
// - Tuần: 7 ngày gần nhất so với 7 ngày LIỀN TRƯỚC đó (để tính % tăng/giảm được).
// - Tháng: MTD (đầu tháng → đúng ngày mốc) so với MTD-1 (đầu tháng trước → đúng ngày tương ứng
//   tháng trước, có clamp nếu tháng trước ít ngày hơn) — KHÔNG so với trọn tháng trước.
function getComparisonRanges(period: PeriodKey, anchor: Date) {
  if (period === 'day') {
    const curStart = startOfDay(anchor)
    const curEnd   = endOfDay(anchor)
    const prevAnchor = new Date(anchor.getTime() - 7 * DAY_MS)
    return { curStart, curEnd, prevStart: startOfDay(prevAnchor), prevEnd: endOfDay(prevAnchor), compareLabel: 'Cùng kỳ 7 ngày trước (D-7)' }
  }
  if (period === 'week') {
    const curEnd   = endOfDay(anchor)
    const curStart = startOfDay(new Date(anchor.getTime() - 6 * DAY_MS))
    const prevEnd   = endOfDay(new Date(curStart.getTime() - DAY_MS))
    const prevStart = startOfDay(new Date(prevEnd.getTime() - 6 * DAY_MS))
    return { curStart, curEnd, prevStart, prevEnd, compareLabel: 'Tuần liền trước' }
  }
  const curStart = startOfMonth(anchor)
  const curEnd   = endOfDay(anchor)
  const dayOfMonth = anchor.getDate()
  const prevMonthFirst = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)
  const daysInPrevMonth = new Date(prevMonthFirst.getFullYear(), prevMonthFirst.getMonth() + 1, 0).getDate()
  const prevAnchor = new Date(prevMonthFirst.getFullYear(), prevMonthFirst.getMonth(), Math.min(dayOfMonth, daysInPrevMonth))
  return { curStart, curEnd, prevStart: startOfMonth(prevAnchor), prevEnd: endOfDay(prevAnchor), compareLabel: 'MTD-1 (cùng ngày tháng trước)' }
}

function computePeriodComparison(orders: { createdAt: string; fee: number }[], period: PeriodKey, anchor: Date) {
  const { curStart, curEnd, prevStart, prevEnd, compareLabel } = getComparisonRanges(period, anchor)
  const current  = sumFeeInRange(orders, curStart, curEnd)
  const previous = sumFeeInRange(orders, prevStart, prevEnd)
  return { current, previous, curStart, curEnd, prevStart, prevEnd, compareLabel }
}

// previous = 0: không có mẫu số để tính % — coi là "mới" (null) thay vì báo tăng vô hạn.
function pctDelta(cur: number, prev: number): number | null {
  if (prev > 0) return ((cur - prev) / prev) * 100
  return cur > 0 ? null : 0
}

// ── "KH" (khách hàng) = KHÁCH HÀNG CUỐI của shop — người MUA/nhận hàng, nhận diện qua SỐ ĐIỆN
// THOẠI NGƯỜI NHẬN (receiverPhone) trên đơn hàng — KHÔNG PHẢI bản thân shop (shop là đơn vị bán,
// không phải "khách hàng" của chính nó). Mỗi shop có tập khách hàng RIÊNG: 1 số điện thoại có thể
// là khách "mới" của shop A nhưng đã từng mua ở shop B — 2 quan hệ khách hàng độc lập, tính riêng
// theo TỪNG shop (truyền đúng danh sách đơn của 1 shop vào 2 hàm dưới để tính đúng phạm vi đó). ──
type CustomerOrder = { createdAt: string; receiverPhone: string }

function customersActiveInRange(orders: CustomerOrder[], start: Date, end: Date): Set<string> {
  const startMs = start.getTime(), endMs = end.getTime()
  const set = new Set<string>()
  for (const o of orders) {
    const t = new Date(o.createdAt).getTime()
    if (t >= startMs && t <= endMs) set.add(o.receiverPhone)
  }
  return set
}

// KH "Onboard mới": có đơn trong Kỳ này, KHÔNG có đơn nào TRƯỚC curStart trong toàn bộ lịch sử.
function countNewCustomers(orders: CustomerOrder[], curStart: Date, curEnd: Date): number {
  const curSet = customersActiveInRange(orders, curStart, curEnd)
  const curStartMs = curStart.getTime()
  let count = 0
  curSet.forEach((phone) => {
    const hasBefore = orders.some((o) => o.receiverPhone === phone && new Date(o.createdAt).getTime() < curStartMs)
    if (!hasBefore) count++
  })
  return count
}

// KH "Re-active": có đơn Kỳ này, KHÔNG có đơn Kỳ trước (đang coi là ngừng mua), NHƯNG từng có đơn
// TRƯỚC Kỳ trước đó (không phải khách hoàn toàn mới — khách mới đã tính vào "KH Onboard mới").
function countReactiveCustomers(orders: CustomerOrder[], curStart: Date, curEnd: Date, prevStart: Date, prevEnd: Date): number {
  const curSet = customersActiveInRange(orders, curStart, curEnd)
  const prevStartMs = prevStart.getTime(), prevEndMs = prevEnd.getTime()
  let count = 0
  curSet.forEach((phone) => {
    const custOrders = orders.filter((o) => o.receiverPhone === phone)
    const hasPrev = custOrders.some((o) => { const t = new Date(o.createdAt).getTime(); return t >= prevStartMs && t <= prevEndMs })
    if (hasPrev) return
    const hasBeforePrev = custOrders.some((o) => new Date(o.createdAt).getTime() < prevStartMs)
    if (hasBeforePrev) count++
  })
  return count
}

// ── Thống kê 1 shop trong 1 khoảng kỳ — Doanh thu/Sản lượng/AOV/KH OB/KH Re-active đều tính
// TRÊN ĐÚNG đơn hàng của shop đó (đã filter theo shopId trước khi truyền vào 2 hàm KH ở trên). ──
type OrderForStats = { createdAt: string; fee: number; weight: number; shopId: string; receiverPhone: string }
type ShopPeriodStat = {
  id: string; name: string; status: string
  revenue: number; volume: number; aov: number
  newCustomers: number; reactiveCustomers: number
}

function buildShopPeriodStats(
  shop: { id: string; name: string; status: string },
  allOrders: OrderForStats[],
  curStart: Date, curEnd: Date, prevStart: Date, prevEnd: Date,
): ShopPeriodStat {
  const shopOrders = allOrders.filter((o) => o.shopId === shop.id)
  const curShopOrders = shopOrders.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= curStart.getTime() && t <= curEnd.getTime() })
  const revenue = curShopOrders.reduce((sum, o) => sum + o.fee, 0)
  const volume  = curShopOrders.length
  return {
    id: shop.id, name: shop.name, status: shop.status,
    revenue, volume, aov: volume > 0 ? revenue / volume : 0,
    newCustomers: countNewCustomers(shopOrders, curStart, curEnd),
    reactiveCustomers: countReactiveCustomers(shopOrders, curStart, curEnd, prevStart, prevEnd),
  }
}

// ── Chuỗi theo NGÀY (độc lập với tab Ngày/Tuần/Tháng của KPI phía trên) — dùng riêng cho biểu đồ
// đường "Xu hướng doanh thu & sản lượng" để luôn có đủ điểm vẽ đường mượt, không phụ thuộc độ dài
// kỳ đang chọn. `days` điểm liên tiếp, điểm cuối luôn là `endDate`. ─────────────────────────────
type DailyPoint = { date: Date; label: string; revenue: number; volume: number }

function buildDailySeries(orders: { createdAt: string; fee: number }[], endDate: Date, days: number): DailyPoint[] {
  const points: DailyPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(endDate.getTime() - i * DAY_MS)
    const start = startOfDay(day), end = endOfDay(day)
    const dayOrders = orders.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= start.getTime() && t <= end.getTime() })
    points.push({
      date: day, label: fmtDate(day),
      revenue: dayOrders.reduce((sum, o) => sum + o.fee, 0),
      volume: dayOrders.length,
    })
  }
  return points
}

// ── UI: badge % tăng/giảm dùng chung cho mọi KPI ──────────────
function DeltaBadge({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span style={{ fontSize: 12, fontWeight: 700, color: C_LINK }}>Mới</span>
  }
  if (pct === 0) {
    return <span style={{ fontSize: 12, fontWeight: 600, color: C_TEXT_SECONDARY }}>0,0%</span>
  }
  const up = pct > 0
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: up ? C_GOOD : C_BAD }}>
      {up ? <RiseOutlined style={{ fontSize: 10 }} /> : <FallOutlined style={{ fontSize: 10 }} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  )
}

// ── KPI gọn (label + số lớn + badge %) — 6 ô xếp 1 hàng theo đúng mockup, không icon để giữ mật
// độ thông tin cao, không rối mắt như KpiCard cũ (icon + label + số lớn, tốn diện tích hơn). ────
function CompactKpiCard({ label, value, deltaPct, tooltip }: { label: string; value: string; deltaPct: number | null; tooltip?: string }) {
  return (
    <div style={{ flex: '1 1 150px', background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }} title={tooltip}>
      <span style={{ fontSize: 12.5, color: C_TEXT_SECONDARY }}>{label}</span>
      <span style={{ fontSize: 21, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: 1.15 }}>{value}</span>
      <DeltaBadge pct={deltaPct} />
    </div>
  )
}

// ── Biểu đồ đường + vùng tô — "Kỳ này" (nét liền, có tô nền) chồng "Kỳ trước" (nét đứt, cùng
// index ngày, lùi đúng 7 ngày) trên CHUNG 1 trục X, kèm toggle đổi chỉ số Doanh thu/Sản lượng.
// Vẽ bằng SVG thuần (không thư viện) — cùng cách tiếp cận với ShopTrendChart trước đây. ─────────
function TrendLineChart({ current, previous, metric }: { current: DailyPoint[]; previous: DailyPoint[]; metric: 'revenue' | 'volume' }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const curValues  = current.map((p) => p[metric])
  const prevValues = previous.map((p) => p[metric])
  const maxValue = Math.max(1, ...curValues, ...prevValues)
  const n = current.length

  const W = 640, H = 220, padL = 56, padR = 16, padT = 16, padB = 28
  const plotW = W - padL - padR, plotH = H - padT - padB
  const xFor = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * plotW)
  const yFor = (v: number) => padT + plotH - (v / maxValue) * plotH

  const curPath  = curValues.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`).join(' ')
  const prevPath = prevValues.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`).join(' ')
  const areaPath = `${curPath} L ${xFor(n - 1).toFixed(1)} ${(padT + plotH).toFixed(1)} L ${xFor(0).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`

  const gridSteps = [0, 0.25, 0.5, 0.75, 1]
  const fmtMetric = (v: number) => metric === 'revenue' ? fmtVND(v) : fmtNum(v)
  const xLabelEvery = Math.max(1, Math.ceil(n / 6))

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {gridSteps.map((s) => (
          <g key={s}>
            <line x1={padL} x2={W - padR} y1={padT + plotH * (1 - s)} y2={padT + plotH * (1 - s)} stroke={C_BORDER} strokeWidth={1} />
            <text x={padL - 8} y={padT + plotH * (1 - s) + 3} fontSize={10} fill={C_TEXT_SECONDARY} textAnchor="end">{fmtMetric(Math.round(maxValue * s))}</text>
          </g>
        ))}

        <path d={areaPath} fill={C_ACTION} opacity={0.08} stroke="none" />
        <path d={prevPath} fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4 4" />
        <path d={curPath} fill="none" stroke={C_ACTION} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />

        {current.map((_, i) => (
          <rect
            key={i}
            x={xFor(i) - (plotW / n) / 2} y={padT} width={plotW / n} height={plotH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          />
        ))}

        {hoverIdx !== null && (
          <line x1={xFor(hoverIdx)} x2={xFor(hoverIdx)} y1={padT} y2={padT + plotH} stroke={C_BORDER} strokeWidth={1} strokeDasharray="3 3" />
        )}
        <circle cx={xFor(n - 1)} cy={yFor(curValues[n - 1])} r={4} fill={C_ACTION} stroke="#fff" strokeWidth={1.5} />
        {hoverIdx !== null && (
          <circle cx={xFor(hoverIdx)} cy={yFor(curValues[hoverIdx])} r={4} fill={C_ACTION} stroke="#fff" strokeWidth={1.5} />
        )}

        {current.map((p, i) => (
          i % xLabelEvery === 0 || i === n - 1 ? (
            <text key={i} x={xFor(i)} y={H - 8} fontSize={10} fill={C_TEXT_SECONDARY} textAnchor="middle">{p.label}</text>
          ) : null
        ))}
      </svg>

      {hoverIdx !== null && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
          <span>{current[hoverIdx].label}</span>
          <span>Kỳ này: <b style={{ color: C_TEXT_PRIMARY }}>{fmtMetric(curValues[hoverIdx])}</b></span>
          <span>Kỳ trước (D-7): <b style={{ color: C_TEXT_PRIMARY }}>{fmtMetric(prevValues[hoverIdx])}</b></span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C_TEXT_PRIMARY }}>
          <span style={{ width: 14, height: 2, background: C_ACTION, borderRadius: 1 }} /> Kỳ này
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C_TEXT_PRIMARY }}>
          <span style={{ width: 14, height: 0, borderTop: '2px dashed #9CA3AF' }} /> Kỳ trước (D-7)
        </span>
      </div>
    </div>
  )
}

// ── Sparkline dạng cột nhỏ cho khối "Khách hàng" — cột cuối (hôm nay) tô đậm, các cột trước nhạt
// hơn để ánh mắt rơi ngay vào giá trị mới nhất, không cần đọc nhãn trục X (không gian quá hẹp). ──
function MiniBarSparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values)
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 32 }}>
      {values.map((v, i) => (
        <div
          key={i}
          title={fmtNum(v)}
          style={{
            flex: 1, borderRadius: 2,
            height: Math.max(3, (v / max) * 32),
            background: i === values.length - 1 ? color : `${color}55`,
          }}
        />
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function AgencyReport() {
  const navigate = useNavigate()
  const shops = buildShopStats()
  const [period, setPeriod] = useState<PeriodKey>('week')
  const [search, setSearch] = useState('')
  const now = new Date()

  const agencyOrders = getAgencyOrders()
  // Dữ liệu đơn hàng demo là NGÀY CỐ ĐỊNH trong quá khứ (không cập nhật theo ngày hệ thống thật)
  // — lấy NGÀY GẦN NHẤT có đơn của đại lý làm mốc "hiện tại" cho MỌI phép tính trong trang, chứ
  // không dùng ngày hệ thống thật (sẽ luôn rơi vào lúc chưa có dữ liệu demo).
  const anchorDate = agencyOrders.length > 0
    ? new Date(Math.max(...agencyOrders.map((o) => new Date(o.createdAt).getTime())))
    : new Date()

  const trend = computePeriodComparison(agencyOrders, period, anchorDate)
  const prevCycle = getComparisonRanges(period, trend.prevEnd)

  // ── 6 KPI đầu trang: Doanh thu/Sản lượng/AOV theo cân/AOV theo sản lượng/KH OB/KH Re-active —
  // TẤT CẢ đều = TỔNG CỘNG của bảng "Chi tiết theo shop" bên dưới (Σ từng shop), để 2 khối này
  // luôn khớp số nhau, không phải 2 nguồn tính riêng biệt dễ lệch. ─────────────────────────────
  const shopStatsCur  = shops.map((s) => buildShopPeriodStats(s, agencyOrders, trend.curStart, trend.curEnd, trend.prevStart, trend.prevEnd))
  const shopStatsPrev = shops.map((s) => buildShopPeriodStats(s, agencyOrders, trend.prevStart, trend.prevEnd, prevCycle.prevStart, prevCycle.prevEnd))

  const totalVolume     = shopStatsCur.reduce((sum, s) => sum + s.volume, 0)
  const totalNewCust    = shopStatsCur.reduce((sum, s) => sum + s.newCustomers, 0)
  const totalReactive   = shopStatsCur.reduce((sum, s) => sum + s.reactiveCustomers, 0)
  const prevTotalVolume   = shopStatsPrev.reduce((sum, s) => sum + s.volume, 0)
  const prevTotalNewCust  = shopStatsPrev.reduce((sum, s) => sum + s.newCustomers, 0)
  const prevTotalReactive = shopStatsPrev.reduce((sum, s) => sum + s.reactiveCustomers, 0)

  const curOrders  = agencyOrders.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= trend.curStart.getTime() && t <= trend.curEnd.getTime() })
  const prevOrders = agencyOrders.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= trend.prevStart.getTime() && t <= trend.prevEnd.getTime() })
  const curWeightKg  = curOrders.reduce((sum, o) => sum + o.weight, 0) / 1000
  const prevWeightKg = prevOrders.reduce((sum, o) => sum + o.weight, 0) / 1000
  const aovByVolume     = totalVolume > 0 ? trend.current / totalVolume : 0
  const prevAovByVolume = prevTotalVolume > 0 ? trend.previous / prevTotalVolume : 0
  const aovByWeight      = curWeightKg > 0 ? trend.current / curWeightKg : 0
  const prevAovByWeight  = prevWeightKg > 0 ? trend.previous / prevWeightKg : 0

  // Biểu đồ đường: luôn 14 ngày gần nhất kết thúc tại anchorDate ("Kỳ này"), và cùng 14 ngày đó
  // lùi lại đúng 7 ngày ("Kỳ trước") — độc lập với tab Ngày/Tuần/Tháng (tab chỉ đổi 6 KPI/bảng).
  const [chartMetric, setChartMetric] = useState<'revenue' | 'volume'>('revenue')
  const dailyCurrent  = buildDailySeries(agencyOrders, anchorDate, 14)
  const dailyPrevious = buildDailySeries(agencyOrders, new Date(anchorDate.getTime() - 7 * DAY_MS), 14)

  // Bảng chi tiết — sắp theo doanh thu giảm dần, lọc theo ô tìm kiếm (tên hoặc mã shop).
  const q = search.trim().toLowerCase()
  const rankedShopStats = [...shopStatsCur]
    .filter((s) => !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
    .sort((a, b) => b.revenue - a.revenue)

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff', overflowY: 'auto' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '16px 16px 12px' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: C_ACTION, textTransform: 'uppercase' }}>Đại lý · Vận hành shop</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: C_TEXT_PRIMARY, margin: '2px 0 4px', lineHeight: '32px' }}>
              Thống kê Shop trên Agency
            </h1>
            <p style={{ fontSize: 13.5, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
              Doanh thu, sản lượng và khách hàng theo từng shop
            </p>
          </div>
          <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, textAlign: 'right' }}>
            Cập nhật lúc {fmtDateTime(now)}
          </div>
        </div>

        <div style={{ padding: '0 16px 4px', fontSize: 12, color: C_TEXT_SECONDARY }}>
          Mốc "hiện tại" dùng ngày có đơn gần nhất của đại lý ({fmtDate(anchorDate)}) vì dữ liệu demo là ngày cố định trong quá khứ, không dùng ngày hệ thống thật.
        </div>

        {/* 6 KPI đầu trang */}
        <div style={{ display: 'flex', gap: 12, padding: '12px 16px', flexShrink: 0, flexWrap: 'wrap' }}>
          <CompactKpiCard label="Doanh thu" value={fmtVND(trend.current)} deltaPct={pctDelta(trend.current, trend.previous)} />
          <CompactKpiCard label="Sản lượng" value={`${fmtNum(totalVolume)} đơn`} deltaPct={pctDelta(totalVolume, prevTotalVolume)} />
          <CompactKpiCard label="AOV theo cân" value={`${fmtVND(aovByWeight)}/kg`} deltaPct={pctDelta(aovByWeight, prevAovByWeight)} />
          <CompactKpiCard label="AOV theo sản lượng" value={`${fmtVND(aovByVolume)}/đơn`} deltaPct={pctDelta(aovByVolume, prevAovByVolume)} />
          <CompactKpiCard label="Khách hàng mới" tooltip="Khách đặt đơn lần đầu tiên trong kỳ này" value={`${fmtNum(totalNewCust)} KH`} deltaPct={pctDelta(totalNewCust, prevTotalNewCust)} />
          <CompactKpiCard label="Khách quay lại" tooltip="Từng mua, ngừng 1 kỳ, nay quay lại đặt đơn tiếp" value={`${fmtNum(totalReactive)} KH`} deltaPct={pctDelta(totalReactive, prevTotalReactive)} />
        </div>

        {/* Xu hướng (trái) + Khách hàng (phải) */}
        <div style={{ display: 'flex', gap: 12, padding: '0 16px 12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 480px', border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Xu hướng doanh thu &amp; sản lượng</span>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => {
                    const isSelected = period === key
                    return (
                      <button
                        key={key}
                        onClick={() => setPeriod(key)}
                        style={{
                          padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          background: isSelected ? '#111827' : '#fff',
                          border: `1px solid ${isSelected ? '#111827' : C_BORDER}`,
                          color: isSelected ? '#fff' : C_TEXT_PRIMARY,
                        }}
                      >
                        {PERIOD_LABELS[key]}
                      </button>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 0, border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
                  {(['revenue', 'volume'] as const).map((m) => {
                    const isSelected = chartMetric === m
                    return (
                      <button
                        key={m}
                        onClick={() => setChartMetric(m)}
                        style={{
                          padding: '6px 14px', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          background: isSelected ? '#111827' : '#fff',
                          color: isSelected ? '#fff' : C_TEXT_PRIMARY,
                        }}
                      >
                        {m === 'revenue' ? 'Doanh thu' : 'Sản lượng'}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 12 }}>
              6 KPI &amp; bảng chi tiết đang so với {trend.compareLabel.toLowerCase()} — biểu đồ dưới luôn hiện 14 ngày gần nhất, không đổi theo tab.
            </div>
            <TrendLineChart current={dailyCurrent} previous={dailyPrevious} metric={chartMetric} />
          </div>

          <div style={{ flex: '1 1 260px', border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Khách hàng</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C_TEXT_PRIMARY, fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: '#0D9488' }} /> Khách hàng mới
                </span>
                <DeltaBadge pct={pctDelta(totalNewCust, prevTotalNewCust)} />
              </div>
              <span style={{ fontSize: 11.5, color: C_TEXT_SECONDARY, lineHeight: 1.4 }}>
                Khách đặt đơn lần đầu tiên trong kỳ này
              </span>
              <span style={{ fontSize: 24, fontWeight: 700, color: C_TEXT_PRIMARY, marginTop: 4 }}>{fmtNum(totalNewCust)} KH</span>
              <MiniBarSparkline
                color="#0D9488"
                values={Array.from({ length: 7 }, (_, i) => {
                  const day = new Date(anchorDate.getTime() - (6 - i) * DAY_MS)
                  return countNewCustomers(agencyOrders, startOfDay(day), endOfDay(day))
                })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C_TEXT_PRIMARY, fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: '#7C3AED' }} /> Khách quay lại
                </span>
                <DeltaBadge pct={pctDelta(totalReactive, prevTotalReactive)} />
              </div>
              <span style={{ fontSize: 11.5, color: C_TEXT_SECONDARY, lineHeight: 1.4 }}>
                Từng mua, ngừng 1 kỳ, nay quay lại đặt đơn tiếp
              </span>
              <span style={{ fontSize: 24, fontWeight: 700, color: C_TEXT_PRIMARY, marginTop: 4 }}>{fmtNum(totalReactive)} KH</span>
              <MiniBarSparkline
                color="#7C3AED"
                values={Array.from({ length: 7 }, (_, i) => {
                  const day = new Date(anchorDate.getTime() - (6 - i) * DAY_MS)
                  const dStart = startOfDay(day), dEnd = endOfDay(day)
                  const pStart = startOfDay(new Date(dStart.getTime() - DAY_MS))
                  const pEnd   = endOfDay(new Date(dStart.getTime() - DAY_MS))
                  return countReactiveCustomers(agencyOrders, dStart, dEnd, pStart, pEnd)
                })}
              />
            </div>
          </div>
        </div>

        {/* Chi tiết theo shop */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${C_BORDER}` }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Chi tiết theo shop</span>
                <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
                  Sắp xếp theo doanh thu giảm dần — bấm vào shop để xem chi tiết
                </div>
              </div>
              <div style={{ position: 'relative', width: 220 }}>
                <SearchOutlined style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C_TEXT_SECONDARY }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm shop..."
                  style={{ width: '100%', height: 34, padding: '0 10px 0 30px', boxSizing: 'border-box', border: `1px solid ${C_BORDER}`, borderRadius: 8, fontSize: 13, outline: 'none', color: C_TEXT_PRIMARY }}
                />
              </div>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', background: C_BG_HEADER }}>
              <div style={{ flex: '1 0 0', minWidth: 200, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Shop</div>
              <div style={{ flex: '0 0 130px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }}>Doanh thu</div>
              <div style={{ flex: '0 0 110px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }}>Sản lượng</div>
              <div style={{ flex: '0 0 120px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }}>AOV/đơn</div>
              <div style={{ flex: '0 0 90px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }} title="Khách đặt đơn lần đầu tiên trong kỳ này">Khách mới</div>
              <div style={{ flex: '0 0 110px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }} title="Từng mua, ngừng 1 kỳ, nay quay lại đặt đơn tiếp">Khách quay lại</div>
            </div>

            {rankedShopStats.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: C_TEXT_SECONDARY }}>
                {q ? 'Không tìm thấy shop phù hợp.' : 'Chưa có shop nào.'}
              </div>
            )}

            {rankedShopStats.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/agency-admin/shops/${s.id}`)}
                style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${C_BORDER}`, cursor: 'pointer' }}
              >
                <div style={{ flex: '1 0 0', minWidth: 200, padding: '10px 12px' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK }}>{s.name}</span>
                  <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 1 }}>{s.id}</div>
                </div>
                <div style={{ flex: '0 0 130px', padding: '10px 12px', textAlign: 'right' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmtVND(s.revenue)}</span>
                </div>
                <div style={{ flex: '0 0 110px', padding: '10px 12px', textAlign: 'right' }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{fmtNum(s.volume)}</span>
                </div>
                <div style={{ flex: '0 0 120px', padding: '10px 12px', textAlign: 'right' }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{fmtVND(s.aov)}</span>
                </div>
                <div style={{ flex: '0 0 90px', padding: '10px 12px', textAlign: 'right' }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{fmtNum(s.newCustomers)}</span>
                </div>
                <div style={{ flex: '0 0 110px', padding: '10px 12px', textAlign: 'right' }}>
                  <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{fmtNum(s.reactiveCustomers)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </ConfigProvider>
  )
}
