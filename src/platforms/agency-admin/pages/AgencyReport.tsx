import { useState, useRef, useEffect } from 'react'
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

type PeriodPreset = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'd30' | 'd60' | 'd90' | 'custom'
const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  today: 'Hôm nay', yesterday: 'Hôm qua', thisWeek: 'Tuần này', lastWeek: 'Tuần trước',
  thisMonth: 'Tháng này', lastMonth: 'Tháng trước', d30: '30 ngày trước', d60: '60 ngày trước',
  d90: '90 ngày trước', custom: 'Tuỳ chỉnh',
}
// Thứ tự hiện trong panel filter — ĐÚNG thứ tự tham khảo từ mockup người dùng cung cấp.
const PERIOD_PRESET_ORDER: PeriodPreset[] = ['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth', 'd30', 'd60', 'd90', 'custom']
const DAY_MS = 24 * 60 * 60 * 1000

function getAgencyOrders() {
  const shopIds = new Set(loadShops().filter((s) => s.agencyId === CURRENT_AGENCY_ID).map((s) => s.id))
  return loadOrders().filter((o) => shopIds.has(o.shopId))
}

// Đơn feePayer='sender' đã chọn thanh toán phí ship qua kênh online (MoMo / chuyển khoản ngân
// hàng) VÀ đã thanh toán xong (paymentStatus 'paid') — phí này shop đã trả thẳng ngay lúc tạo/xác
// nhận đơn, KHÔNG còn nằm trong dòng tiền COD của kỳ đối soát nữa. Nếu vẫn cộng order.fee của các
// đơn này vào doanh thu/tổng phí theo kỳ thì coi như tính phí 2 LẦN (1 lần qua online, 1 lần khi
// đối soát COD) — dùng hàm này ở MỌI nơi cộng dồn order.fee trong file này để loại trừ đúng.
function isPrepaidOnline(o: { paymentMethod?: string; paymentStatus?: string }): boolean {
  return (o.paymentMethod === 'momo' || o.paymentMethod === 'bank_transfer') && o.paymentStatus === 'paid'
}

function sumFeeInRange(orders: { createdAt: string; fee: number; paymentMethod?: string; paymentStatus?: string }[], start: Date, end: Date) {
  const startMs = start.getTime()
  const endMs = end.getTime()
  return orders.reduce((sum, o) => {
    const t = new Date(o.createdAt).getTime()
    if (t < startMs || t > endMs) return sum
    if (isPrepaidOnline(o)) return sum
    return sum + o.fee
  }, 0)
}

const startOfDay   = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const endOfDay     = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }
const startOfMonth = (d: Date) => { const x = new Date(d); x.setDate(1); x.setHours(0, 0, 0, 0); return x }
// Tuần bắt đầu Thứ 2 (quy ước VN) — getDay(): 0=CN...6=Thứ7, lùi về đúng Thứ 2 gần nhất.
const startOfWeek  = (d: Date) => { const x = startOfDay(d); const day = x.getDay(); const diff = day === 0 ? 6 : day - 1; x.setDate(x.getDate() - diff); return x }
const fmtDate       = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
const fmtDateTime    = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
const fmtDateInput   = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` // yyyy-mm-dd cho <input type="date">

type Range = { curStart: Date; curEnd: Date; prevStart: Date; prevEnd: Date; compareLabel: string }

// "N ngày gần nhất kết thúc tại anchor" so với "N ngày LIỀN TRƯỚC đó" — công thức dùng chung cho
// Hôm nay/Hôm qua/30-60-90 ngày trước/Tuỳ chỉnh (đều là 1 cửa sổ N ngày trượt, chỉ khác N và anchor).
function rollingRange(anchor: Date, days: number, compareLabel: string): Range {
  const curEnd   = endOfDay(anchor)
  const curStart = startOfDay(new Date(anchor.getTime() - (days - 1) * DAY_MS))
  const prevEnd   = endOfDay(new Date(curStart.getTime() - DAY_MS))
  const prevStart = startOfDay(new Date(prevEnd.getTime() - (days - 1) * DAY_MS))
  return { curStart, curEnd, prevStart, prevEnd, compareLabel }
}

// Khoảng "Kỳ này" / "Kỳ trước" theo preset đang chọn ở filter "Thời gian" — mỗi preset 1 định
// nghĩa "kỳ trước" riêng cho % tăng/giảm:
// - Hôm nay/Hôm qua/30-60-90 ngày trước/Tuỳ chỉnh: cửa sổ N-ngày trượt so với N-ngày liền trước
//   (xem rollingRange) — Hôm qua dùng anchor lùi 1 ngày nên N=1 vẫn đúng nghĩa "đúng 1 ngày đó".
// - Tuần này/Tháng này: TO-DATE (đầu tuần/tháng → đúng ngày mốc) so với CÙNG OFFSET NGÀY của
//   tuần/tháng liền trước — giữ đúng quy ước MTD/MTD-1 đã có từ trước khi mở rộng sang Tuần.
// - Tuần trước/Tháng trước: TRỌN VẸN tuần/tháng liền trước so với tuần/tháng liền trước NỮA.
function getComparisonRanges(preset: PeriodPreset, anchor: Date, custom: { from: Date; to: Date } | null = null): Range {
  switch (preset) {
    case 'today': return rollingRange(anchor, 1, 'Hôm qua')
    case 'yesterday': return rollingRange(new Date(anchor.getTime() - DAY_MS), 1, '2 ngày trước')
    case 'd30': return rollingRange(anchor, 30, '30 ngày liền trước')
    case 'd60': return rollingRange(anchor, 60, '60 ngày liền trước')
    case 'd90': return rollingRange(anchor, 90, '90 ngày liền trước')
    case 'custom': {
      const from = custom?.from ?? anchor
      const to   = custom?.to ?? anchor
      const days = Math.max(1, Math.round((endOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS) + 1)
      return rollingRange(anchor, days, `${fmtNum(days)} ngày liền trước`)
    }
    case 'thisWeek': {
      const curStart = startOfWeek(anchor)
      const curEnd   = endOfDay(anchor)
      const prevStart = new Date(curStart.getTime() - 7 * DAY_MS)
      const prevEnd   = new Date(curEnd.getTime() - 7 * DAY_MS)
      return { curStart, curEnd, prevStart, prevEnd, compareLabel: 'Cùng kỳ tuần trước' }
    }
    case 'lastWeek': {
      const curEnd    = endOfDay(new Date(startOfWeek(anchor).getTime() - DAY_MS))
      const curStart  = startOfWeek(curEnd)
      const prevEnd   = endOfDay(new Date(curStart.getTime() - DAY_MS))
      const prevStart = startOfWeek(prevEnd)
      return { curStart, curEnd, prevStart, prevEnd, compareLabel: 'Tuần trước nữa' }
    }
    case 'thisMonth': {
      const curStart = startOfMonth(anchor)
      const curEnd   = endOfDay(anchor)
      const dayOfMonth = anchor.getDate()
      const prevMonthFirst = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)
      const daysInPrevMonth = new Date(prevMonthFirst.getFullYear(), prevMonthFirst.getMonth() + 1, 0).getDate()
      const prevAnchor = new Date(prevMonthFirst.getFullYear(), prevMonthFirst.getMonth(), Math.min(dayOfMonth, daysInPrevMonth))
      return { curStart, curEnd, prevStart: startOfMonth(prevAnchor), prevEnd: endOfDay(prevAnchor), compareLabel: 'Cùng kỳ tháng trước' }
    }
    case 'lastMonth': {
      const curEnd    = endOfDay(new Date(startOfMonth(anchor).getTime() - DAY_MS))
      const curStart  = startOfMonth(curEnd)
      const prevEnd   = endOfDay(new Date(curStart.getTime() - DAY_MS))
      const prevStart = startOfMonth(prevEnd)
      return { curStart, curEnd, prevStart, prevEnd, compareLabel: 'Tháng trước nữa' }
    }
  }
}

function computePeriodComparison(orders: { createdAt: string; fee: number }[], preset: PeriodPreset, anchor: Date, custom: { from: Date; to: Date } | null = null) {
  const { curStart, curEnd, prevStart, prevEnd, compareLabel } = getComparisonRanges(preset, anchor, custom)
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
type OrderForStats = { createdAt: string; fee: number; weight: number; shopId: string; receiverPhone: string; paymentMethod?: string; paymentStatus?: string }
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
  const revenue = curShopOrders.reduce((sum, o) => isPrepaidOnline(o) ? sum : sum + o.fee, 0)
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
// ── Biểu đồ cột chồng theo shop — bảng màu định danh (categorical) của skill dataviz: 8 hue cố
// định thứ tự, CVD-safe cho cặp liền kề (đúng trường hợp cột chồng — mỗi segment chỉ "chạm" đúng
// 2 segment lân cận). Dự án chưa có bảng màu nhiều-chuỗi riêng (tokens.ts chỉ có 1 màu action + 1
// màu link) nên dùng thẳng bộ màu mặc định đã validate của skill, không tự bịa màu.
// 8 màu đầu = bộ categorical đã validate sẵn của skill (CVD-safe, thứ tự cố định). 2 màu cuối
// (cyan, nâu hổ phách) là THÊM NGOÀI chuẩn 8-slot của skill — người dùng yêu cầu rõ hiển thị đủ
// 10 màu riêng cho đúng "10 shop nhiều nhất" (không gộp sớm vào "Khác" như bản 8-slot trước).
// Đã chạy validate_palette.js cho cả 10 màu: PASS mọi check kể cả CVD cặp liền kề — nhưng đây vẫn
// là lựa chọn CHỦ ĐỘNG đánh đổi khỏi khuyến nghị "không tự sinh quá 8 hue" của skill, theo đúng
// yêu cầu khớp ảnh mockup của người dùng.
const SHOP_PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948', '#0891b2', '#a16207']
const C_OTHER = '#898781' // "Khác" — màu de-emphasis (muted ink), nằm ngoài 10 màu định danh ở trên
const OTHER_ID = '__other__'
// Giới hạn số shop được tô màu riêng = 10 — khớp đúng lựa chọn tối đa của dropdown ("10 shop
// nhiều nhất"). "Khác" chỉ xuất hiện khi SỐ SHOP THỰC TẾ CÓ DOANH THU vượt quá giới hạn đang chọn
// (kể cả khi chọn "Tất cả shop" mà đại lý có > 10 shop active) — không phải lúc nào cũng có "Khác".
const MAX_COLORED_SHOPS = 10

type TopLimitKey = 'top5' | 'top10' | 'all'
const TOP_LIMIT_LABELS: Record<TopLimitKey, string> = { top5: '5 shop nhiều nhất', top10: '10 shop nhiều nhất', all: 'Tất cả shop' }
const TOP_LIMIT_N: Record<TopLimitKey, number> = { top5: 5, top10: 10, all: Infinity }

type StackEntity = { id: string; name: string; color: string }
type ShopDayPoint = { date: Date; label: string; values: Record<string, { revenue: number; volume: number }> }

// Xếp hạng shop theo TỔNG doanh thu trong cả khoảng `days` ngày (không đổi theo toggle Doanh
// thu/Sản lượng) — để identity màu luôn ổn định khi đổi toggle hay khi đổi ngày hover (đúng quy
// tắc "màu đi theo thực thể, không đi theo thứ hạng tức thời" của dataviz skill).
function buildShopStackedSeries(
  orders: { createdAt: string; fee: number; shopId: string; paymentMethod?: string; paymentStatus?: string }[],
  shops: { id: string; name: string }[],
  endDate: Date,
  days: number,
  topLimitKey: TopLimitKey,
): { points: ShopDayPoint[]; entities: StackEntity[]; otherCount: number } {
  const windowStart = startOfDay(new Date(endDate.getTime() - (days - 1) * DAY_MS))
  const windowEnd = endOfDay(endDate)
  const windowOrders = orders.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= windowStart.getTime() && t <= windowEnd.getTime() })

  const totalByShop = new Map<string, number>()
  for (const o of windowOrders) {
    if (isPrepaidOnline(o)) continue
    totalByShop.set(o.shopId, (totalByShop.get(o.shopId) ?? 0) + o.fee)
  }
  const rankedIds = shops.map((s) => s.id).filter((id) => totalByShop.has(id)).sort((a, b) => totalByShop.get(b)! - totalByShop.get(a)!)

  const effectiveN = Math.min(TOP_LIMIT_N[topLimitKey], MAX_COLORED_SHOPS, rankedIds.length)
  const topIds = rankedIds.slice(0, effectiveN)
  const topSet = new Set(topIds)
  const otherCount = rankedIds.length - topIds.length
  const hasOther = otherCount > 0

  const entities: StackEntity[] = topIds.map((id, i) => ({ id, name: shops.find((s) => s.id === id)!.name, color: SHOP_PALETTE[i] }))
  if (hasOther) entities.push({ id: OTHER_ID, name: 'Khác', color: C_OTHER })

  const points: ShopDayPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(endDate.getTime() - i * DAY_MS)
    const dStart = startOfDay(day), dEnd = endOfDay(day)
    const values: Record<string, { revenue: number; volume: number }> = {}
    for (const ent of entities) values[ent.id] = { revenue: 0, volume: 0 }
    for (const o of windowOrders) {
      const t = new Date(o.createdAt).getTime()
      if (t < dStart.getTime() || t > dEnd.getTime()) continue
      const key = topSet.has(o.shopId) ? o.shopId : (hasOther ? OTHER_ID : null)
      if (!key) continue
      values[key].revenue += isPrepaidOnline(o) ? 0 : o.fee
      values[key].volume += 1
    }
    points.push({ date: day, label: fmtDate(day), values })
  }
  return { points, entities, otherCount }
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
function CompactKpiCard({ label, value, deltaPct, tooltip, flexBasis = '150px' }: { label: string; value: string; deltaPct: number | null; tooltip?: string; flexBasis?: string }) {
  return (
    <div style={{ flex: `1 1 ${flexBasis}`, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }} title={tooltip}>
      <span style={{ fontSize: 12.5, color: C_TEXT_SECONDARY }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 21, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: 1.15 }}>{value}</span>
        <DeltaBadge pct={deltaPct} />
      </div>
    </div>
  )
}

// ── Filter "Thời gian" — nút mở panel liệt kê preset (radio) + ô ngày "từ...đến" phản ánh đúng
// khoảng đang áp dụng (preset hay tuỳ chỉnh). Theo đúng pattern mockup người dùng cung cấp: click
// nút → panel; chọn preset → đổi filter + đóng panel; sửa trực tiếp 1 trong 2 ô ngày → tự chuyển
// sang "Tuỳ chỉnh" với đúng khoảng vừa nhập. ──────────────────────────────────────────────────────
function TimeRangeFilter({
  preset, curStart, curEnd, onChangePreset, onChangeCustomRange,
}: {
  preset: PeriodPreset
  curStart: Date
  curEnd: Date
  onChangePreset: (p: PeriodPreset) => void
  onChangeCustomRange: (from: Date, to: Date) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const handleDateInput = (which: 'from' | 'to', value: string) => {
    if (!value) return
    const [y, m, d] = value.split('-').map(Number)
    const picked = new Date(y, m - 1, d)
    const from = which === 'from' ? picked : curStart
    const to   = which === 'to'   ? picked : curEnd
    onChangeCustomRange(from, to)
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8,
          border: `1px solid ${C_BORDER}`, background: '#fff', cursor: 'pointer',
          fontSize: 13, color: C_TEXT_SECONDARY,
        }}
      >
        Thời gian <b style={{ color: C_TEXT_PRIMARY }}>{PERIOD_PRESET_LABELS[preset]}</b>
        <span style={{ fontSize: 10, color: C_TEXT_SECONDARY }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 20, width: 320,
          background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: 16,
        }}>
          <div style={{ fontSize: 13, color: C_TEXT_SECONDARY, marginBottom: 10 }}>Thời gian</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <input
              type="date" value={fmtDateInput(curStart)}
              onChange={(e) => handleDateInput('from', e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: '7px 8px', borderRadius: 8, border: 'none', background: C_BG_HEADER, fontSize: 13, color: C_TEXT_PRIMARY }}
            />
            <span style={{ fontSize: 13, color: C_TEXT_SECONDARY, flexShrink: 0 }}>đến</span>
            <input
              type="date" value={fmtDateInput(curEnd)}
              onChange={(e) => handleDateInput('to', e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: '7px 8px', borderRadius: 8, border: 'none', background: C_BG_HEADER, fontSize: 13, color: C_TEXT_PRIMARY }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {PERIOD_PRESET_ORDER.map((key) => {
              const selected = preset === key
              return (
                <button
                  key={key}
                  onClick={() => { onChangePreset(key); if (key !== 'custom') setOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 2px', border: 'none', borderTop: `1px solid ${C_BORDER}`,
                    background: 'none', cursor: 'pointer', fontSize: 14, color: C_TEXT_PRIMARY, textAlign: 'left',
                  }}
                >
                  {PERIOD_PRESET_LABELS[key]}
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `1.5px solid ${selected ? '#111827' : C_BORDER}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#111827' }} />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Path 1 rect với 2 góc TRÊN bo tròn, đáy vuông — dùng cho segment TRÊN CÙNG của mỗi cột chồng
// (xem dataviz skill marks-and-anatomy: "4px rounded data-end, square at the baseline").
function topRoundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, h / 2, w / 2))
  if (rr <= 0) return `M${x},${y + h} L${x},${y} L${x + w},${y} L${x + w},${y + h} Z`
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
}

// ── Biểu đồ cột chồng theo shop — mỗi cột = 1 ngày, mỗi segment màu = 1 shop (tối đa
// MAX_COLORED_SHOPS màu định danh riêng, phần còn lại gộp "Khác"). Hover 1 cột → bảng chi tiết
// dưới biểu đồ liệt kê ĐỦ mọi thực thể của đúng ngày đó (đúng quy tắc "1 tooltip, mọi chuỗi" thay
// vì phải trỏ đúng từng segment mỏng). Vẽ bằng SVG thuần, không thư viện — cùng cách tiếp cận với
// biểu đồ đường trước đây trong file này. ──────────────────────────────────────────────────────
function ShopStackedBarChart({ points, entities, metric }: { points: ShopDayPoint[]; entities: StackEntity[]; metric: 'revenue' | 'volume' }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [tableView, setTableView] = useState(false)
  const n = points.length
  const totals = points.map((p) => entities.reduce((sum, e) => sum + p.values[e.id][metric], 0))
  const maxValue = Math.max(1, ...totals)

  const W = 640, H = 240, padL = 56, padR = 16, padT = 16, padB = 28
  const plotW = W - padL - padR, plotH = H - padT - padB
  const barSlot = n > 0 ? plotW / n : plotW
  const barW = Math.min(24, barSlot * 0.6)
  const GAP = 2 // 2px surface gap giữa các segment chồng (dataviz skill: "surface gap")
  const xFor = (i: number) => padL + barSlot * i + barSlot / 2

  const gridSteps = [0, 0.25, 0.5, 0.75, 1]
  const fmtMetric = (v: number) => metric === 'revenue' ? fmtVND(v) : fmtNum(v)
  const xLabelEvery = Math.max(1, Math.ceil(n / 7))

  if (tableView) {
    return (
      <div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: `1px solid ${C_BORDER}`, color: C_TEXT_SECONDARY, fontWeight: 600, minWidth: 180 }}>Shop</th>
                {points.map((p, i) => (
                  <th key={i} style={{ textAlign: 'right', padding: '8px 12px', borderBottom: `1px solid ${C_BORDER}`, color: C_TEXT_SECONDARY, fontWeight: 600, whiteSpace: 'nowrap' }}>{p.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entities.map((e) => (
                <tr key={e.id}>
                  <td style={{ padding: '8px 12px', borderBottom: `1px solid ${C_BORDER}` }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: e.id === OTHER_ID ? C_TEXT_PRIMARY : C_LINK }}>{e.name}</span>
                    </span>
                    {e.id !== OTHER_ID && <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 1, marginLeft: 14 }}>{e.id}</div>}
                  </td>
                  {points.map((p, i) => (
                    <td key={i} style={{ textAlign: 'right', padding: '8px 12px', borderBottom: `1px solid ${C_BORDER}`, color: C_TEXT_PRIMARY, fontVariantNumeric: 'tabular-nums' }}>
                      {fmtMetric(p.values[e.id][metric])}
                    </td>
                  ))}
                </tr>
              ))}
              {entities.length === 0 && (
                <tr><td colSpan={points.length + 1} style={{ padding: '16px 12px', textAlign: 'center', color: C_TEXT_SECONDARY }}>Chưa có shop nào phát sinh doanh thu trong 14 ngày gần nhất.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <button
          onClick={() => setTableView(false)}
          style={{ marginTop: 10, background: 'none', border: 'none', padding: 0, fontSize: 12, fontWeight: 600, color: C_LINK, cursor: 'pointer' }}
        >
          ↑ Xem dạng biểu đồ
        </button>
      </div>
    )
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {gridSteps.map((s) => (
          <g key={s}>
            <line x1={padL} x2={W - padR} y1={padT + plotH * (1 - s)} y2={padT + plotH * (1 - s)} stroke={C_BORDER} strokeWidth={1} />
            <text x={padL - 8} y={padT + plotH * (1 - s) + 3} fontSize={10} fill={C_TEXT_SECONDARY} textAnchor="end">{fmtMetric(Math.round(maxValue * s))}</text>
          </g>
        ))}

        {points.map((p, i) => {
          const x = xFor(i) - barW / 2
          let yCursor = padT + plotH
          const segs = entities.map((e) => {
            const v = p.values[e.id][metric]
            const segH = (v / maxValue) * plotH
            const top = yCursor - segH
            yCursor = top
            return { ent: e, v, top, segH }
          })
          const lastVisible = [...segs].reverse().find((s) => s.segH > 0)
          return (
            <g key={i} opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.55}>
              {segs.map((seg) => {
                if (seg.segH <= 0) return null
                const h = Math.max(0.5, seg.segH - GAP)
                if (seg === lastVisible) {
                  return <path key={seg.ent.id} d={topRoundedRectPath(x, seg.top, barW, h, 4)} fill={seg.ent.color} />
                }
                return <rect key={seg.ent.id} x={x} y={seg.top} width={barW} height={h} fill={seg.ent.color} />
              })}
              <rect
                x={padL + barSlot * i} y={padT} width={barSlot} height={plotH} fill="transparent"
                onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}
              />
            </g>
          )
        })}

        {points.map((p, i) => (
          i % xLabelEvery === 0 || i === n - 1 ? (
            <text key={i} x={xFor(i)} y={H - 8} fontSize={10} fill={C_TEXT_SECONDARY} textAnchor="middle">{p.label}</text>
          ) : null
        ))}
      </svg>

      {hoverIdx !== null && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px 14px', fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 6, padding: '8px 10px', background: C_BG_HEADER, borderRadius: 8 }}>
          <span style={{ width: '100%', textAlign: 'center', fontWeight: 700, color: C_TEXT_PRIMARY, marginBottom: 2 }}>{points[hoverIdx].label}</span>
          {[...entities]
            .sort((a, b) => points[hoverIdx].values[b.id][metric] - points[hoverIdx].values[a.id][metric])
            .map((e) => (
              <span key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 2, background: e.color, borderRadius: 1, flexShrink: 0 }} />
                <b style={{ color: C_TEXT_PRIMARY }}>{fmtMetric(points[hoverIdx].values[e.id][metric])}</b> {e.name}
              </span>
            ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 16px', marginTop: 10 }}>
        {entities.map((e) => (
          <span key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C_TEXT_PRIMARY }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: e.color, flexShrink: 0 }} />
            {e.name}
          </span>
        ))}
        {entities.length === 0 && <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Chưa có shop nào phát sinh doanh thu trong 14 ngày gần nhất.</span>}
      </div>

      <button
        onClick={() => setTableView(true)}
        style={{ display: 'block', margin: '8px auto 0', background: 'none', border: 'none', padding: 0, fontSize: 12, fontWeight: 600, color: C_LINK, cursor: 'pointer' }}
      >
        ↓ Xem dạng bảng
      </button>
    </div>
  )
}

// ── Sparkline dạng đường cho khối "Khách hàng" — 1 chuỗi, không cần legend/trục (tiêu đề phía
// trên đã nói rõ đang vẽ gì). Line 2px + vùng tô mờ 10% + chấm tròn ở điểm cuối (hôm nay), đúng
// mark spec dataviz skill cho sparkline — thay cho bản cột cũ theo yêu cầu đổi sang biểu đồ đường.
function MiniLineSparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values)
  const n = values.length
  const W = 220, H = 40, pad = 4
  const xFor = (i: number) => n <= 1 ? 0 : (i / (n - 1)) * W
  const yFor = (v: number) => H - pad - (v / max) * (H - pad * 2)
  const linePath = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(v).toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L ${xFor(n - 1).toFixed(1)} ${H} L ${xFor(0).toFixed(1)} ${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <path d={areaPath} fill={color} opacity={0.1} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={xFor(n - 1)} cy={yFor(values[n - 1])} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
    </svg>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function AgencyReport() {
  const navigate = useNavigate()
  const shops = buildShopStats()
  const [period, setPeriod] = useState<PeriodPreset>('d30')
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null)
  const [search, setSearch] = useState('')
  const now = new Date()

  const agencyOrders = getAgencyOrders()
  // Dữ liệu đơn hàng demo là NGÀY CỐ ĐỊNH trong quá khứ (không cập nhật theo ngày hệ thống thật)
  // — lấy NGÀY GẦN NHẤT có đơn của đại lý làm mốc "hiện tại" cho MỌI phép tính trong trang, chứ
  // không dùng ngày hệ thống thật (sẽ luôn rơi vào lúc chưa có dữ liệu demo).
  const anchorDate = agencyOrders.length > 0
    ? new Date(Math.max(...agencyOrders.map((o) => new Date(o.createdAt).getTime())))
    : new Date()
  // Preset 'custom': anchor = ngày "đến" của khoảng tự chọn (người dùng chưa chọn gì thì tạm dùng
  // anchorDate làm cả from/to để field ngày có giá trị hợp lệ hiển thị).
  const periodAnchor = period === 'custom' ? (customRange?.to ?? anchorDate) : anchorDate

  const trend = computePeriodComparison(agencyOrders, period, periodAnchor, customRange)
  const prevCycle = getComparisonRanges(period, trend.prevEnd, customRange)

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

  // Biểu đồ cột chồng theo shop: luôn 14 ngày gần nhất kết thúc tại anchorDate — độc lập với tab
  // Ngày/Tuần/Tháng (tab chỉ đổi 6 KPI/bảng), giữ đúng quy ước đã có từ bản biểu đồ đường trước.
  const [chartMetric, setChartMetric] = useState<'revenue' | 'volume'>('revenue')
  const [topLimitKey, setTopLimitKey] = useState<TopLimitKey>('top10')
  const { points: shopStackPoints, entities: shopStackEntities, otherCount: shopStackOtherCount } =
    buildShopStackedSeries(agencyOrders, shops, anchorDate, 14, topLimitKey)

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
            <h1 style={{ fontSize: 26, fontWeight: 700, color: C_TEXT_PRIMARY, margin: '0 0 4px', lineHeight: '32px' }}>
              Báo cáo
            </h1>
            <p style={{ fontSize: 13.5, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
              Doanh thu, sản lượng và khách hàng theo từng shop.{' '}
              <span title={`Mốc "hiện tại" dùng ngày có đơn gần nhất của đại lý (${fmtDate(anchorDate)}) vì dữ liệu demo là ngày cố định trong quá khứ, không dùng ngày hệ thống thật.`}>
                Cập nhật lúc {fmtDateTime(now)}
              </span>
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            <TimeRangeFilter
              preset={period}
              curStart={trend.curStart}
              curEnd={trend.curEnd}
              onChangePreset={(p) => { setPeriod(p); if (p !== 'custom') setCustomRange(null) }}
              onChangeCustomRange={(from, to) => { setPeriod('custom'); setCustomRange({ from, to }) }}
            />
          </div>
        </div>

        {/* 6 KPI đầu trang — hàng 1: 4 ô chính; hàng 2: 2 ô AOV rộng hơn */}
        <div style={{ display: 'flex', gap: 12, padding: '12px 16px 0', flexShrink: 0, flexWrap: 'wrap' }}>
          <CompactKpiCard label="Doanh thu" value={fmtVND(trend.current)} deltaPct={pctDelta(trend.current, trend.previous)} />
          <CompactKpiCard label="Sản lượng" value={`${fmtNum(totalVolume)} đơn`} deltaPct={pctDelta(totalVolume, prevTotalVolume)} />
          <CompactKpiCard label="Khách hàng mới" tooltip="Khách đặt đơn lần đầu tiên trong kỳ này" value={`${fmtNum(totalNewCust)} KH`} deltaPct={pctDelta(totalNewCust, prevTotalNewCust)} />
          <CompactKpiCard label="Khách quay lại" tooltip="Từng mua, ngừng 1 kỳ, nay quay lại đặt đơn tiếp" value={`${fmtNum(totalReactive)} KH`} deltaPct={pctDelta(totalReactive, prevTotalReactive)} />
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '12px 16px', flexShrink: 0, flexWrap: 'wrap' }}>
          <CompactKpiCard flexBasis="300px" label="AOV theo cân" value={`${fmtVND(aovByWeight)}/kg`} deltaPct={pctDelta(aovByWeight, prevAovByWeight)} />
          <CompactKpiCard flexBasis="300px" label="AOV theo sản lượng" value={`${fmtVND(aovByVolume)}/đơn`} deltaPct={pctDelta(aovByVolume, prevAovByVolume)} />
        </div>

        {/* Xu hướng (trái) + Khách hàng (phải) */}
        <div style={{ display: 'flex', gap: 12, padding: '0 16px 12px', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 480px', border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Xu hướng doanh thu &amp; sản lượng</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Shop</span>
                <select
                  value={topLimitKey}
                  onChange={(e) => setTopLimitKey(e.target.value as TopLimitKey)}
                  style={{
                    padding: '6px 10px', borderRadius: 8, border: `1px solid ${C_BORDER}`, background: '#fff',
                    fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY, cursor: 'pointer', outline: 'none',
                  }}
                >
                  {(Object.keys(TOP_LIMIT_LABELS) as TopLimitKey[]).map((key) => (
                    <option key={key} value={key}>{TOP_LIMIT_LABELS[key]}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: 0, border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
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
              6 KPI &amp; Bảng chi tiết đang so với {trend.compareLabel.toLowerCase()}
              <br />
              Biểu đồ luôn hiện 14 ngày gần nhất, không đổi theo tab
              {shopStackOtherCount > 0 && <> — {shopStackOtherCount} shop còn lại gộp vào <strong style={{ color: C_TEXT_PRIMARY }}>"Khác"</strong> (tối đa {MAX_COLORED_SHOPS} shop được tô màu riêng)</>}
            </div>
            <ShopStackedBarChart points={shopStackPoints} entities={shopStackEntities} metric={chartMetric} />
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
              <MiniLineSparkline
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
              <MiniLineSparkline
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
