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
type CustomerOrder = { createdAt: string; receiverPhone: string; status: string }

// Đơn HUỶ (`status === 'cancelled'`) KHÔNG tính là "đã mua" ở bất kỳ chỗ nào trong 3 hàm dưới đây —
// áp dụng ĐỒNG NHẤT cho cả việc xác định "có hoạt động trong kỳ" lẫn "đã từng mua trước đó", để
// Khách hàng mới/Khách quay lại luôn chia đúng 2 nhóm KHÔNG CHỒNG LẤN của `curSet` (xem 2 hàm dưới).
function customersActiveInRange(orders: CustomerOrder[], start: Date, end: Date): Set<string> {
  const startMs = start.getTime(), endMs = end.getTime()
  const set = new Set<string>()
  for (const o of orders) {
    if (o.status === 'cancelled') continue
    const t = new Date(o.createdAt).getTime()
    if (t >= startMs && t <= endMs) set.add(o.receiverPhone)
  }
  return set
}

// KH "Mới": có đơn HỢP LỆ (không huỷ) trong Kỳ này, và KHÔNG có đơn HỢP LỆ nào TRƯỚC curStart
// trong toàn bộ lịch sử — tức đơn trong kỳ này là lần mua hợp lệ ĐẦU TIÊN của khách.
function countNewCustomers(orders: CustomerOrder[], curStart: Date, curEnd: Date): number {
  const curSet = customersActiveInRange(orders, curStart, curEnd)
  const curStartMs = curStart.getTime()
  let count = 0
  curSet.forEach((phone) => {
    const hasValidBefore = orders.some((o) => o.receiverPhone === phone && o.status !== 'cancelled' && new Date(o.createdAt).getTime() < curStartMs)
    if (!hasValidBefore) count++
  })
  return count
}

// KH "Quay lại": có đơn HỢP LỆ (không huỷ) trong Kỳ này, VÀ đã từng có ÍT NHẤT 1 đơn HỢP LỆ khác
// TRƯỚC curStart — tức đơn trong kỳ này là lần mua hợp lệ THỨ 2 TRỞ LÊN trong toàn bộ lịch sử của
// khách. Nếu lần mua trước đó của khách đã bị HUỶ, nó không tính — khách vẫn được coi là "Mới" ở
// lần mua hợp lệ kế tiếp, không phải "Quay lại". Định nghĩa MỚI này thay thế hoàn toàn cách tính cũ
// ("từng mua, nghỉ đúng 1 kỳ, nay quay lại") — không còn khái niệm "nghỉ 1 kỳ" nào nữa.
function countReactiveCustomers(orders: CustomerOrder[], curStart: Date, curEnd: Date): number {
  const curSet = customersActiveInRange(orders, curStart, curEnd)
  const curStartMs = curStart.getTime()
  let count = 0
  curSet.forEach((phone) => {
    const hasValidBefore = orders.some((o) => o.receiverPhone === phone && o.status !== 'cancelled' && new Date(o.createdAt).getTime() < curStartMs)
    if (hasValidBefore) count++
  })
  return count
}

// ── Thống kê 1 shop trong 1 khoảng kỳ — Doanh thu/Sản lượng/AOV/KH Mới/KH Quay lại đều tính
// TRÊN ĐÚNG đơn hàng của shop đó (đã filter theo shopId trước khi truyền vào 2 hàm KH ở trên). ──
type OrderForStats = { createdAt: string; fee: number; weight: number; shopId: string; receiverPhone: string; status: string; paymentMethod?: string; paymentStatus?: string }
type ShopPeriodStat = {
  id: string; name: string; status: string
  revenue: number; volume: number; aov: number
  newCustomers: number; reactiveCustomers: number
}

function buildShopPeriodStats(
  shop: { id: string; name: string; status: string },
  allOrders: OrderForStats[],
  curStart: Date, curEnd: Date,
): ShopPeriodStat {
  const shopOrders = allOrders.filter((o) => o.shopId === shop.id)
  const curShopOrders = shopOrders.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= curStart.getTime() && t <= curEnd.getTime() })
  const revenue = curShopOrders.reduce((sum, o) => isPrepaidOnline(o) ? sum : sum + o.fee, 0)
  const volume  = curShopOrders.length
  return {
    id: shop.id, name: shop.name, status: shop.status,
    revenue, volume, aov: volume > 0 ? revenue / volume : 0,
    newCustomers: countNewCustomers(shopOrders, curStart, curEnd),
    reactiveCustomers: countReactiveCustomers(shopOrders, curStart, curEnd),
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
// OTHER_ID giữ lại cho table view (dòng "Shop"/"code" styling) dù biểu đồ miền giờ không còn tự
// gộp shop dư vào "Khác" nữa (người dùng chọn đúng danh sách shop cụ thể, không có khái niệm dư).
const OTHER_ID = '__other__'
// Giới hạn số shop được tô màu riêng = 10 — khớp đúng lựa chọn tối đa của dropdown ("10 shop
// nhiều nhất"). "Khác" chỉ xuất hiện khi SỐ SHOP THỰC TẾ CÓ DOANH THU vượt quá giới hạn đang chọn
// (kể cả khi chọn "Tất cả shop" mà đại lý có > 10 shop active) — không phải lúc nào cũng có "Khác".
const MAX_COLORED_SHOPS = 10

type StackEntity = { id: string; name: string; color: string }
type ShopDayPoint = { date: Date; label: string; values: Record<string, { revenue: number; volume: number }> }

// Xếp hạng TOÀN BỘ shop của đại lý theo tổng doanh thu trong khoảng `days` ngày kết thúc tại
// `endDate` — dùng để (1) chọn sẵn mặc định top 10 shop lúc mới vào trang, (2) sắp thứ tự trong
// picker "Chọn shop" (shop doanh thu cao hiện trước, dễ tìm). KHÔNG lọc theo ai có/không có doanh
// thu — trả về đủ mọi shop (shop 0đ xếp cuối) để picker luôn liệt kê được hết.
function rankShopIdsByRevenue(
  orders: { createdAt: string; fee: number; shopId: string; paymentMethod?: string; paymentStatus?: string }[],
  shops: { id: string; name: string }[],
  endDate: Date,
  days: number,
): string[] {
  const windowStart = startOfDay(new Date(endDate.getTime() - (days - 1) * DAY_MS))
  const windowEnd = endOfDay(endDate)
  const totalByShop = new Map<string, number>()
  for (const o of orders) {
    const t = new Date(o.createdAt).getTime()
    if (t < windowStart.getTime() || t > windowEnd.getTime()) continue
    if (isPrepaidOnline(o)) continue
    totalByShop.set(o.shopId, (totalByShop.get(o.shopId) ?? 0) + o.fee)
  }
  return shops.map((s) => s.id).sort((a, b) => (totalByShop.get(b) ?? 0) - (totalByShop.get(a) ?? 0))
}

// Dựng chuỗi theo ngày CHỈ cho các shop người dùng đã chọn cụ thể (không còn tự xếp hạng lấy top
// N + gộp phần dư vào "Khác" — người dùng tự quyết định đủ danh sách, nên không có khái niệm dư ra
// nữa). `selectedShopIds` giữ ĐÚNG thứ tự người dùng chọn (xem toggleShopSelected) để identity màu
// ổn định khi tick/untick thêm shop khác (đúng quy tắc "màu đi theo thực thể" của dataviz skill).
function buildShopStackedSeries(
  orders: { createdAt: string; fee: number; shopId: string; paymentMethod?: string; paymentStatus?: string }[],
  shops: { id: string; name: string }[],
  endDate: Date,
  days: number,
  selectedShopIds: string[],
): { points: ShopDayPoint[]; entities: StackEntity[] } {
  const windowStart = startOfDay(new Date(endDate.getTime() - (days - 1) * DAY_MS))
  const windowEnd = endOfDay(endDate)
  const windowOrders = orders.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= windowStart.getTime() && t <= windowEnd.getTime() })

  // Cap cứng ở MAX_COLORED_SHOPS — UI picker đã disable checkbox khi chạm mốc này, đây chỉ là lớp
  // phòng vệ thứ 2 (vd nếu selectedShopIds đến từ nguồn khác trong tương lai).
  const entities: StackEntity[] = selectedShopIds
    .filter((id) => shops.some((s) => s.id === id))
    .slice(0, MAX_COLORED_SHOPS)
    .map((id, i) => ({ id, name: shops.find((s) => s.id === id)!.name, color: SHOP_PALETTE[i] }))
  const entityIds = new Set(entities.map((e) => e.id))

  const points: ShopDayPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(endDate.getTime() - i * DAY_MS)
    const dStart = startOfDay(day), dEnd = endOfDay(day)
    const values: Record<string, { revenue: number; volume: number }> = {}
    for (const ent of entities) values[ent.id] = { revenue: 0, volume: 0 }
    for (const o of windowOrders) {
      const t = new Date(o.createdAt).getTime()
      if (t < dStart.getTime() || t > dEnd.getTime()) continue
      if (!entityIds.has(o.shopId)) continue
      values[o.shopId].revenue += isPrepaidOnline(o) ? 0 : o.fee
      values[o.shopId].volume += 1
    }
    points.push({ date: day, label: fmtDate(day), values })
  }
  return { points, entities }
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
// `tooltip` trước đây CHỈ hiện qua `title` gốc của trình duyệt (phải rê chuột đúng vào card mới
// thấy) — không hiện được trên màn hình cảm ứng, và không hiện trong ảnh chụp/export báo cáo.
// Giờ hiện LUÔN thành 1 dòng chú thích nhỏ dưới số liệu khi có `tooltip`, vẫn giữ `title` làm lớp
// dự phòng — chỉ 2 KPI "Khách hàng mới"/"Khách quay lại" hiện đang truyền `tooltip` nên chỉ 2 card
// đó có thêm dòng chú thích, các KPI khác (Doanh thu/Sản lượng/AOV...) không đổi gì.
function CompactKpiCard({ label, value, deltaPct, tooltip, flexBasis = '150px' }: { label: string; value: string; deltaPct: number | null; tooltip?: string; flexBasis?: string }) {
  return (
    <div style={{ flex: `1 1 ${flexBasis}`, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }} title={tooltip}>
      <span style={{ fontSize: 12.5, color: C_TEXT_SECONDARY }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 21, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: 1.15 }}>{value}</span>
        <DeltaBadge pct={deltaPct} />
      </div>
      {tooltip && <span style={{ fontSize: 11, color: C_TEXT_SECONDARY, lineHeight: 1.35 }}>{tooltip}</span>}
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

// ── Biểu đồ miền chồng (doanh thu theo shop) + đường tổng sản lượng (trục phải) — gộp 2 chỉ số
// vào 1 biểu đồ theo yêu cầu người dùng. 2 lựa chọn đã xác nhận rõ với người dùng trước khi làm:
// (1) VẪN giữ breakdown THEO SHOP, nhưng chỉ cho doanh thu — sản lượng gộp thành 1 đường TỔNG
// (không tách shop), vì tách cả 2 chỉ số theo shop sẽ ra 10 shop × 2 = 20 chuỗi chồng nhau, không
// đọc được; (2) dùng 2 trục Y riêng (trái = doanh thu, phải = sản lượng) — đây là lựa chọn CHỦ
// ĐỘNG đánh đổi khỏi khuyến nghị "không dùng dual-axis" của dataviz skill (rule "One axis", xếp
// hạng #1 trong anti-patterns), chấp nhận vì là cách duy nhất giữ được cả 2 đơn vị thật (đ và đơn)
// trên cùng 1 biểu đồ mà vẫn giữ breakdown theo shop cho doanh thu như yêu cầu.
function ShopRevenueVolumeChart({ points, entities }: { points: ShopDayPoint[]; entities: StackEntity[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [tableView, setTableView] = useState(false)
  const n = points.length
  const revenueTotals = points.map((p) => entities.reduce((sum, e) => sum + p.values[e.id].revenue, 0))
  const volumeTotals = points.map((p) => entities.reduce((sum, e) => sum + p.values[e.id].volume, 0))
  const maxRevenue = Math.max(1, ...revenueTotals)
  const maxVolume = Math.max(1, ...volumeTotals)
  // Màu đường sản lượng dùng C_ACTION (cam, token "action" sẵn có của dự án) — cố ý KHÔNG trùng
  // bất kỳ màu nào trong SHOP_PALETTE để không bị nhầm là "1 shop nữa".
  const VOLUME_COLOR = C_ACTION

  const W = 640, H = 240, padL = 56, padR = 52, padT = 16, padB = 28
  const plotW = W - padL - padR, plotH = H - padT - padB
  const xFor = (i: number) => (n <= 1 ? padL : padL + (i / (n - 1)) * plotW)
  const yForRevenue = (v: number) => padT + plotH - (v / maxRevenue) * plotH
  const yForVolume = (v: number) => padT + plotH - (v / maxVolume) * plotH

  // Giảm từ 5 xuống 3 mốc (0% / 50% / 100%) — 5 mốc cũ ra toàn số lẻ không tròn (vd 151.000 /
  // 113.250 / 75.500 / 37.750 đ) vì chỉ là chia đều tuyến tính theo maxRevenue/maxVolume thực tế,
  // không làm tròn — càng nhiều mốc càng rối mắt khi trục đã dày đặc dữ liệu (filter 30/60/90 ngày).
  const gridSteps = [0, 0.5, 1]
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
                      {fmtVND(p.values[e.id].revenue)}
                    </td>
                  ))}
                </tr>
              ))}
              {entities.length === 0 && (
                <tr><td colSpan={points.length + 1} style={{ padding: '16px 12px', textAlign: 'center', color: C_TEXT_SECONDARY }}>Chưa có shop nào phát sinh doanh thu trong {n} ngày gần nhất.</td></tr>
              )}
              {/* Tổng sản lượng — KHÔNG tách theo shop (xem comment đầu component), gộp 1 dòng tổng cuối bảng */}
              <tr>
                <td style={{ padding: '8px 12px', borderTop: `2px solid ${C_BORDER}` }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 10, height: 2, background: VOLUME_COLOR, borderRadius: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>Tổng sản lượng</span>
                  </span>
                </td>
                {volumeTotals.map((v, i) => (
                  <td key={i} style={{ textAlign: 'right', padding: '8px 12px', borderTop: `2px solid ${C_BORDER}`, color: C_TEXT_PRIMARY, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtNum(v)} đơn
                  </td>
                ))}
              </tr>
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

  // Band miền chồng cho doanh thu theo shop — tích luỹ đáy→đỉnh theo đúng thứ tự entities, mỗi
  // band là 1 path khép kín (viền trên = tích luỹ tới entity này, viền dưới = tích luỹ entity
  // trước / baseline 0 cho entity đầu). topPts được giữ lại riêng để vẽ seam trắng phân tách band.
  let cumulative = points.map(() => 0)
  const bands = entities.map((e) => {
    const nextCumulative = points.map((p, i) => cumulative[i] + p.values[e.id].revenue)
    const topPts = nextCumulative.map((v, i) => [xFor(i), yForRevenue(v)] as const)
    const bottomPts = cumulative.map((v, i) => [xFor(i), yForRevenue(v)] as const)
    const path =
      topPts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') +
      ' ' + [...bottomPts].reverse().map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ' Z'
    const topLine = topPts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
    const result = { ent: e, path, topLine }
    cumulative = nextCumulative
    return result
  })

  const volumeLinePath = volumeTotals
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yForVolume(v).toFixed(1)}`)
    .join(' ')
  const slotW = n > 0 ? plotW / n : plotW

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {gridSteps.map((s) => (
          <g key={s}>
            <line x1={padL} x2={W - padR} y1={padT + plotH * (1 - s)} y2={padT + plotH * (1 - s)} stroke={C_BORDER} strokeWidth={1} />
            <text x={padL - 8} y={padT + plotH * (1 - s) + 3} fontSize={10} fill={C_TEXT_SECONDARY} textAnchor="end">{fmtVND(Math.round(maxRevenue * s))}</text>
            <text x={W - padR + 8} y={padT + plotH * (1 - s) + 3} fontSize={10} fill={VOLUME_COLOR} textAnchor="start">{fmtNum(Math.round(maxVolume * s))}</text>
          </g>
        ))}

        {/* Miền chồng — doanh thu theo shop */}
        {bands.map(({ ent, path }) => <path key={ent.id} d={path} fill={ent.color} />)}
        {/* Seam trắng mảnh phân tách từng band — thay cho "surface gap" của biểu đồ cột rời rạc */}
        {bands.map(({ ent, topLine }) => <path key={`${ent.id}-seam`} d={topLine} fill="none" stroke="#fff" strokeWidth={1.5} />)}

        {/* Đường tổng sản lượng — trục phải, KHÔNG tách theo shop */}
        <path d={volumeLinePath} fill="none" stroke={VOLUME_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {volumeTotals.map((v, i) => (
          <circle key={i} cx={xFor(i)} cy={yForVolume(v)} r={hoverIdx === i ? 4 : 2.5} fill={VOLUME_COLOR} stroke="#fff" strokeWidth={1} />
        ))}

        {hoverIdx !== null && (
          <line x1={xFor(hoverIdx)} x2={xFor(hoverIdx)} y1={padT} y2={padT + plotH} stroke={C_TEXT_SECONDARY} strokeWidth={1} strokeDasharray="3 3" />
        )}

        {/* Hover hit-area theo từng ngày — crosshair + tooltip dùng chung cho cả 2 chỉ số */}
        {points.map((_, i) => (
          <rect
            key={i}
            x={padL + slotW * i} y={padT} width={slotW} height={plotH} fill="transparent"
            onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}
          />
        ))}

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
            .sort((a, b) => points[hoverIdx].values[b.id].revenue - points[hoverIdx].values[a.id].revenue)
            .map((e) => (
              <span key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 2, background: e.color, borderRadius: 1, flexShrink: 0 }} />
                <b style={{ color: C_TEXT_PRIMARY }}>{fmtVND(points[hoverIdx].values[e.id].revenue)}</b> {e.name}
              </span>
            ))}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 2, background: VOLUME_COLOR, borderRadius: 1, flexShrink: 0 }} />
            <b style={{ color: C_TEXT_PRIMARY }}>{fmtNum(volumeTotals[hoverIdx])} đơn</b> Tổng sản lượng
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 16px', marginTop: 10 }}>
        {entities.map((e) => (
          <span key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C_TEXT_PRIMARY }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: e.color, flexShrink: 0 }} />
            {e.name}
          </span>
        ))}
        {entities.length === 0 && <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Chưa có shop nào phát sinh doanh thu trong {n} ngày gần nhất.</span>}
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C_TEXT_PRIMARY }}>
          <span style={{ width: 10, height: 2, background: VOLUME_COLOR, borderRadius: 1, flexShrink: 0 }} />
          Tổng sản lượng (trục phải)
        </span>
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

// Ngưỡng gộp tuần cho 2 biểu đồ "Khách hàng" — CHỈ áp dụng ở đây, KHÔNG áp dụng cho
// ShopRevenueVolumeChart (biểu đồ "Xu hướng" vẫn giữ nguyên theo ngày dù filter dài, vì nó rộng
// hơn nhiều nên vẫn đọc được). Card "Khách hàng" hẹp hơn, 60-90 cột/ngày dồn vào cùng bề rộng vẫn
// quá dày — nên khi trendDays > 30 (đúng mốc filter "60 ngày trước"/"90 ngày trước"), gộp theo
// TUẦN (7 ngày/cột) thay vì theo ngày, giảm còn ~9-13 cột thay vì 60-90 cột.
const WEEKLY_BUCKET_THRESHOLD = 30

// `calc(start, end)` tính giá trị cho 1 khoảng [start,end] — gọi đúng 1 lần/ngày khi trendDays nhỏ,
// hoặc đúng 1 lần/tuần (gộp 7 ngày) khi trendDays > ngưỡng. Nhãn luôn là ngày CUỐI của mỗi cột.
function buildCustomerPoints(trendDays: number, curEnd: Date, calc: (start: Date, end: Date) => number): { label: string; value: number }[] {
  if (trendDays <= WEEKLY_BUCKET_THRESHOLD) {
    return Array.from({ length: trendDays }, (_, i) => {
      const day = new Date(curEnd.getTime() - (trendDays - 1 - i) * DAY_MS)
      return { label: fmtDate(day), value: calc(startOfDay(day), endOfDay(day)) }
    })
  }
  const windowStart = startOfDay(new Date(curEnd.getTime() - (trendDays - 1) * DAY_MS))
  const bucketCount = Math.ceil(trendDays / 7)
  return Array.from({ length: bucketCount }, (_, b) => {
    const isLast = b === bucketCount - 1
    const bucketStart = startOfDay(new Date(windowStart.getTime() + b * 7 * DAY_MS))
    const bucketEnd = isLast ? endOfDay(curEnd) : endOfDay(new Date(windowStart.getTime() + ((b + 1) * 7 - 1) * DAY_MS))
    return { label: fmtDate(bucketEnd), value: calc(bucketStart, bucketEnd) }
  })
}

// ── Biểu đồ CỘT cho khối "Khách hàng" — cùng LOGIC HIỂN THỊ với ShopRevenueVolumeChart (biểu đồ
// "Xu hướng doanh thu & sản lượng") thay vì sparkline trơn không nhãn: có nhãn ngày trục X (cùng
// công thức xLabelEvery = ẩn bớt nhãn tránh chồng chữ, luôn ép hiện nhãn điểm CUỐI), có hit-zone
// hover từng cột hiện tooltip giá trị đúng ngày/tuần đó (thay cho việc chỉ tô đậm cột cuối). Mỗi
// cột = 1 ngày (filter ≤30 ngày) hoặc 1 tuần (filter >30 ngày) — xem buildCustomerPoints ở trên.
function CustomerTrendChart({ points, color, unit }: { points: { label: string; value: number }[]; color: string; unit: string }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const n = points.length
  const max = Math.max(1, ...points.map((p) => p.value))
  const W = 460, H = 110, padL = 2, padR = 2, padT = 8, padB = 16
  const plotW = W - padL - padR, plotH = H - padT - padB
  const slotW = plotW / n
  const gap = n > 40 ? 0.5 : n > 15 ? 1 : 2
  const barW = Math.max(0.6, slotW - gap)
  const xLabelEvery = Math.max(1, Math.ceil(n / 7)) // cùng công thức ~7 nhãn với ShopRevenueVolumeChart

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke={C_BORDER} strokeWidth={1} />
        {points.map((p, i) => {
          const x = padL + i * slotW + gap / 2
          const h = Math.max(1, (p.value / max) * plotH)
          const y = padT + plotH - h
          const isLast = i === n - 1
          const isHover = hoverIdx === i
          return (
            <rect
              key={i} x={x} y={y} width={barW} height={h}
              rx={Math.min(2, barW / 2)} fill={color} opacity={isHover || isLast ? 1 : 0.5}
            />
          )
        })}
        {points.map((_, i) => (
          <rect
            key={`hit-${i}`} x={padL + i * slotW} y={padT} width={slotW} height={plotH} fill="transparent"
            onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}
          />
        ))}
        {points.map((p, i) => (
          i % xLabelEvery === 0 || i === n - 1 ? (
            <text key={`lbl-${i}`} x={padL + i * slotW + slotW / 2} y={H - 4} fontSize={8} fill={C_TEXT_SECONDARY} textAnchor="middle">
              {p.label}
            </text>
          ) : null
        ))}
      </svg>
      <div style={{ height: 16, fontSize: 11, color: C_TEXT_SECONDARY, textAlign: 'center' }}>
        {hoverIdx !== null
          ? <><b style={{ color: C_TEXT_PRIMARY }}>{points[hoverIdx].label}</b>: {points[hoverIdx].value} {unit}</>
          : ' '}
      </div>
    </div>
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

  // ── 6 KPI đầu trang: Doanh thu/Sản lượng/AOV theo cân/AOV theo sản lượng/KH Mới/KH Quay lại —
  // TẤT CẢ đều = TỔNG CỘNG của bảng "Chi tiết theo shop" bên dưới (Σ từng shop), để 2 khối này
  // luôn khớp số nhau, không phải 2 nguồn tính riêng biệt dễ lệch. ─────────────────────────────
  const shopStatsCur  = shops.map((s) => buildShopPeriodStats(s, agencyOrders, trend.curStart, trend.curEnd))
  const shopStatsPrev = shops.map((s) => buildShopPeriodStats(s, agencyOrders, trend.prevStart, trend.prevEnd))

  const totalVolume     = shopStatsCur.reduce((sum, s) => sum + s.volume, 0)
  const totalNewCust    = shopStatsCur.reduce((sum, s) => sum + s.newCustomers, 0)
  const totalReactive   = shopStatsCur.reduce((sum, s) => sum + s.reactiveCustomers, 0)
  const prevTotalVolume   = shopStatsPrev.reduce((sum, s) => sum + s.volume, 0)
  const prevTotalNewCust  = shopStatsPrev.reduce((sum, s) => sum + s.newCustomers, 0)
  const prevTotalReactive = shopStatsPrev.reduce((sum, s) => sum + s.reactiveCustomers, 0)

  // TẤT CẢ biểu đồ trên trang (2 sparkline "Khách hàng" + biểu đồ miền "Xu hướng doanh thu & sản
  // lượng") đều BÁM THEO ĐÚNG curStart→curEnd của filter "Thời gian" đang chọn — KHÔNG độn thêm
  // ngày nào ngoài kỳ đang xem (trước đây có sàn tối thiểu 7 ngày cho filter "Hôm nay"/"Hôm qua",
  // nhưng gây hiểu nhầm vì biểu đồ hiện ra những ngày không thuộc kỳ đang chọn trong khi KPI vẫn chỉ
  // tính đúng 1 ngày — bỏ hẳn để trung thực tuyệt đối với filter: "Hôm nay" chỉ còn đúng 1 điểm/chấm,
  // không ra đường). startOfDay(curEnd) TRƯỚC khi trừ — curEnd là endOfDay (23:59:59.999), nếu trừ
  // trực tiếp cho curStart (00:00:00.000) rồi Math.round sẽ tự làm tròn LÊN 1 do phần dư .999ms,
  // cộng thêm +1 ở sau nữa thành đếm dư nguyên 1 ngày (vd "30 ngày trước" ra 31 thay vì đúng 30).
  const trendDays = Math.round((startOfDay(trend.curEnd).getTime() - trend.curStart.getTime()) / DAY_MS) + 1

  const curOrders  = agencyOrders.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= trend.curStart.getTime() && t <= trend.curEnd.getTime() })
  const prevOrders = agencyOrders.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= trend.prevStart.getTime() && t <= trend.prevEnd.getTime() })
  const curWeightKg  = curOrders.reduce((sum, o) => sum + o.weight, 0) / 1000
  const prevWeightKg = prevOrders.reduce((sum, o) => sum + o.weight, 0) / 1000
  const aovByVolume     = totalVolume > 0 ? trend.current / totalVolume : 0
  const prevAovByVolume = prevTotalVolume > 0 ? trend.previous / prevTotalVolume : 0
  const aovByWeight      = curWeightKg > 0 ? trend.current / curWeightKg : 0
  const prevAovByWeight  = prevWeightKg > 0 ? trend.previous / prevWeightKg : 0

  // Biểu đồ miền theo shop: trendDays ngày kết thúc tại trend.curEnd — bám đúng filter "Thời gian"
  // đang chọn (xem trendDays ở trên). shopRankedIds dùng để (1) chọn sẵn mặc định top 10 shop khi
  // mount, (2) sắp thứ tự trong picker "Chọn shop" — tính 1 lần, không đổi theo thao tác chọn/bỏ
  // chọn sau đó (đổi filter sau khi đã chọn tay thì thứ tự/mặc định không tính lại, chỉ dữ liệu
  // trong biểu đồ mới cập nhật — tránh xáo trộn lựa chọn người dùng đã tự chọn).
  const shopRankedIds = rankShopIdsByRevenue(agencyOrders, shops, trend.curEnd, trendDays)
  const [selectedShopIds, setSelectedShopIds] = useState<Set<string>>(() => new Set(shopRankedIds.slice(0, MAX_COLORED_SHOPS)))
  const [shopPickerOpen, setShopPickerOpen] = useState(false)
  const [shopPickerSearch, setShopPickerSearch] = useState('')
  const shopPickerRef = useRef<HTMLDivElement>(null)
  const toggleShopSelected = (id: string) => {
    setSelectedShopIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id); return next }
      if (next.size >= MAX_COLORED_SHOPS) return prev // picker đã disable checkbox ở mốc này, double-guard
      next.add(id)
      return next
    })
  }
  useEffect(() => {
    if (!shopPickerOpen) return
    const handler = (e: MouseEvent) => {
      if (shopPickerRef.current && !shopPickerRef.current.contains(e.target as Node)) setShopPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [shopPickerOpen])
  const { points: shopStackPoints, entities: shopStackEntities } =
    buildShopStackedSeries(agencyOrders, shops, trend.curEnd, trendDays, shopRankedIds.filter((id) => selectedShopIds.has(id)))

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
          <CompactKpiCard label="Khách hàng mới" tooltip="Đơn hợp lệ đầu tiên trong kỳ này (không tính đơn đã huỷ)" value={`${fmtNum(totalNewCust)} KH`} deltaPct={pctDelta(totalNewCust, prevTotalNewCust)} />
          <CompactKpiCard label="Khách quay lại" tooltip="Đã mua lần thứ 2 trở lên (không tính đơn đã huỷ)" value={`${fmtNum(totalReactive)} KH`} deltaPct={pctDelta(totalReactive, prevTotalReactive)} />
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '12px 16px', flexShrink: 0, flexWrap: 'wrap' }}>
          <CompactKpiCard flexBasis="300px" label="AOV theo cân" value={`${fmtVND(aovByWeight)}/kg`} deltaPct={pctDelta(aovByWeight, prevAovByWeight)} />
          <CompactKpiCard flexBasis="300px" label="AOV theo sản lượng" value={`${fmtVND(aovByVolume)}/đơn`} deltaPct={pctDelta(aovByVolume, prevAovByVolume)} />
        </div>

        {/* Xu hướng doanh thu & sản lượng — FULL WIDTH riêng 1 hàng (trước đây chung hàng với
            "Khách hàng" theo tỉ lệ 2:1, ép card "Khách hàng" quá hẹp nên 60-90 cột/ngày bị dồn
            mảnh dính nhìn rối — tách riêng để "Khách hàng" bên dưới cũng được rộng ngang y hệt,
            cùng mật độ cột/pixel với biểu đồ này dù cùng vẽ tới 90 điểm). */}
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Xu hướng doanh thu &amp; sản lượng</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative' }} ref={shopPickerRef}>
                <button
                  onClick={() => setShopPickerOpen((v) => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8,
                    border: `1px solid ${C_BORDER}`, background: '#fff', fontSize: 13, fontWeight: 600,
                    color: C_TEXT_PRIMARY, cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  Chọn shop ({selectedShopIds.size}/{MAX_COLORED_SHOPS})
                  <span style={{ fontSize: 10, color: C_TEXT_SECONDARY }}>▼</span>
                </button>
                {shopPickerOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 280, maxHeight: 360,
                    background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 30, display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{ padding: 8, borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '4px 8px' }}>
                        <SearchOutlined style={{ fontSize: 12, color: C_TEXT_SECONDARY }} />
                        <input
                          autoFocus value={shopPickerSearch} onChange={(e) => setShopPickerSearch(e.target.value)}
                          placeholder="Tìm shop"
                          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 12, color: C_TEXT_PRIMARY }}
                        />
                      </div>
                      {selectedShopIds.size >= MAX_COLORED_SHOPS && (
                        <div style={{ fontSize: 11, color: C_BAD, marginTop: 6 }}>Đã chọn tối đa {MAX_COLORED_SHOPS} shop — bỏ chọn bớt để thêm shop khác.</div>
                      )}
                    </div>
                    <div style={{ overflowY: 'auto', padding: 4 }}>
                      {shopRankedIds
                        .map((id) => shops.find((s) => s.id === id))
                        .filter((s): s is NonNullable<typeof s> => {
                          if (!s) return false
                          const q = shopPickerSearch.trim().toLowerCase()
                          return !q || s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
                        })
                        .map((s) => {
                          const checked = selectedShopIds.has(s.id)
                          const disabled = !checked && selectedShopIds.size >= MAX_COLORED_SHOPS
                          return (
                            <label
                              key={s.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                                cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
                              }}
                              onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = '#F9FAFB' }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                            >
                              <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleShopSelected(s.id)} />
                              <span style={{ fontSize: 13, color: C_TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.name}</span>
                            </label>
                          )
                        })}
                      {shopRankedIds.length === 0 && (
                        <div style={{ padding: 12, fontSize: 12, color: C_TEXT_SECONDARY, textAlign: 'center' }}>Không tìm thấy shop</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginBottom: 12 }}>
              6 KPI &amp; Bảng chi tiết đang so với {trend.compareLabel.toLowerCase()}
              <br />
              Biểu đồ hiện đúng {fmtNum(trendDays)} ngày của kỳ đang chọn ở filter "Thời gian" — miền theo shop = doanh thu (trục trái), đường cam = tổng sản lượng (trục phải)
            </div>
            <ShopRevenueVolumeChart points={shopStackPoints} entities={shopStackEntities} />
          </div>
        </div>

        {/* Khách hàng — FULL WIDTH riêng 1 hàng, 2 chart con (Khách hàng mới / Khách quay lại) nằm
            NGANG nhau thay vì xếp dọc trong 1 cột hẹp — mỗi chart con giờ rộng ngang bằng khoảng
            nửa trang, cùng mật độ cột/pixel với ShopRevenueVolumeChart dù cùng vẽ tới 90 điểm. */}
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Khách hàng</span>
              <div style={{ fontSize: 11.5, color: C_TEXT_SECONDARY, marginTop: 2 }}>
                2 biểu đồ bên dưới vẽ đúng {fmtNum(trendDays)} ngày của kỳ đang chọn, kết thúc tại {fmtDate(trend.curEnd)}
                {trendDays > WEEKLY_BUCKET_THRESHOLD ? ' — mỗi cột gộp theo TUẦN (>30 ngày) để tránh quá nhiều cột' : ''}.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C_TEXT_PRIMARY, fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: '#0D9488' }} /> Khách hàng mới
                  </span>
                  <DeltaBadge pct={pctDelta(totalNewCust, prevTotalNewCust)} />
                </div>
                <span style={{ fontSize: 11.5, color: C_TEXT_SECONDARY, lineHeight: 1.4 }}>
                  Đơn hợp lệ đầu tiên trong kỳ này (không tính đơn đã huỷ)
                </span>
                <span style={{ fontSize: 24, fontWeight: 700, color: C_TEXT_PRIMARY, marginTop: 4 }}>{fmtNum(totalNewCust)} KH</span>
                <CustomerTrendChart
                  color="#0D9488"
                  unit="KH"
                  points={buildCustomerPoints(trendDays, trend.curEnd, (start, end) => countNewCustomers(agencyOrders, start, end))}
                />
              </div>

              <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C_TEXT_PRIMARY, fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: '#7C3AED' }} /> Khách quay lại
                  </span>
                  <DeltaBadge pct={pctDelta(totalReactive, prevTotalReactive)} />
                </div>
                <span style={{ fontSize: 11.5, color: C_TEXT_SECONDARY, lineHeight: 1.4 }}>
                  Đã mua lần thứ 2 trở lên (không tính đơn đã huỷ)
                </span>
                <span style={{ fontSize: 24, fontWeight: 700, color: C_TEXT_PRIMARY, marginTop: 4 }}>{fmtNum(totalReactive)} KH</span>
                {/* Mỗi cột = khách có đơn hợp lệ thứ 2 trở lên trong ĐÚNG ngày (hoặc tuần, nếu gộp)
                    đó — cùng 1 định nghĩa "mua lần thứ 2, không tính đơn huỷ" với số lớn phía trên,
                    không còn khái niệm "kỳ trước"/"nghỉ 1 kỳ" nào nữa (xem countReactiveCustomers). */}
                <CustomerTrendChart
                  color="#7C3AED"
                  unit="KH"
                  points={buildCustomerPoints(trendDays, trend.curEnd, (start, end) => countReactiveCustomers(agencyOrders, start, end))}
                />
              </div>
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
              <div style={{ flex: '0 0 90px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }} title="Đơn hợp lệ đầu tiên trong kỳ này (không tính đơn đã huỷ)">Khách mới</div>
              <div style={{ flex: '0 0 110px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }} title="Đã mua lần thứ 2 trở lên (không tính đơn đã huỷ)">Khách quay lại</div>
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
