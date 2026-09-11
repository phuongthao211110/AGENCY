import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { ShopOutlined, DollarOutlined, InboxOutlined, BarChartOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'
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

const CURRENT_AGENCY_ID = 'AGN001'

// ── Helpers ──────────────────────────────────────────────────
const fmtNum = (n: number) => n.toLocaleString('vi-VN')
const fmtVND = (n: number) => {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace('.0', '') + ' tỷ'
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1).replace('.0', '') + ' tr'
  return n.toLocaleString('vi-VN') + ' ₫'
}

// Tất cả số liệu theo shop trong bảng bên dưới (COD, Tổng phí, Doanh thu) đều lấy từ dữ liệu
// đối soát THẬT của từng shop (reconciliationLedger.ts) — cùng nguồn với "Tổng COD (shop)" /
// "Tổng phí DV (shop)" ở AgencyReconciliation.tsx, không phải công thức demo cũ (totalOrders ×
// 35.000đ). Shop chưa có đơn nào được đối soát sẽ hiện 0 ở cả 3 cột.
function buildShopStats() {
  const raw = loadShops().filter((s) => s.agencyId === CURRENT_AGENCY_ID)
  return raw.map((s) => {
    const cod      = getShopCodTotal(s.id)
    const totalFee = getShopServiceFeeTotal(s.id)
    return { ...s, cod, totalFee }
  })
}

// ── Xu hướng TỔNG PHÍ SHIP theo Ngày/Tuần/Tháng, so với cùng kỳ liền trước ──
// Dùng phí ship (order.fee), KHÔNG dùng COD — vì không phải đơn nào cũng có COD (đơn khách đã
// trả trước/chuyển khoản thì COD = 0), nhưng đơn nào cũng phát sinh phí ship. Dữ liệu đơn hàng
// demo là ngày cố định trong quá khứ (không cập nhật theo ngày thật) — nên lấy NGÀY GẦN NHẤT có
// đơn của đại lý làm mốc "hiện tại", chứ không dùng ngày hệ thống thật (sẽ luôn rơi vào lúc
// chưa có dữ liệu). Đây là điểm cần biết khi đọc số liệu phần này.
type PeriodKey = 'day' | 'week' | 'month'
const PERIOD_DAYS: Record<PeriodKey, number> = { day: 1, week: 7, month: 30 }
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

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const endOfDay   = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }
const fmtDate    = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`

function computePeriodComparison(orders: { createdAt: string; fee: number }[], period: PeriodKey, anchor: Date) {
  const days     = PERIOD_DAYS[period]
  const curEnd   = endOfDay(anchor)
  const curStart = startOfDay(new Date(anchor.getTime() - (days - 1) * DAY_MS))
  const prevEnd   = endOfDay(new Date(curStart.getTime() - DAY_MS))
  const prevStart = startOfDay(new Date(prevEnd.getTime() - (days - 1) * DAY_MS))
  const current  = sumFeeInRange(orders, curStart, curEnd)
  const previous = sumFeeInRange(orders, prevStart, prevEnd)
  // previous = 0: không có mẫu số để tính % — coi là "mới" (null) thay vì báo tăng vô hạn.
  const deltaPct = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? null : 0)
  return { current, previous, deltaPct, curStart, curEnd, prevStart, prevEnd }
}

// 6 kỳ liên tiếp gần nhất (kể cả kỳ hiện tại), dùng để vẽ chart — kỳ cuối cùng luôn trùng với
// "Kỳ này" ở computePeriodComparison() phía trên.
const TREND_BAR_COUNT = 6

// Bảng màu categorical đã validate (references/palette.md của skill dataviz) — thứ tự CỐ ĐỊNH
// để đảm bảo phân biệt được dưới mù màu (CVD) khi các cột stack cạnh nhau. Không tự ý đổi thứ
// tự hay bịa thêm màu khi có > 8 shop — quá 8 thì gộp các shop còn lại vào "Khác".
const SHOP_CHART_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']

type ShopSlice = { shopId: string; shopName: string; value: number; color: string }
type ShopTrendPoint = { label: string; start: Date; end: Date; total: number; slices: ShopSlice[] }

function buildShopTrendSeries(
  orders: { createdAt: string; fee: number; shopId: string }[],
  shopList: { id: string; name: string }[],
  period: PeriodKey,
  anchor: Date,
  count: number,
): ShopTrendPoint[] {
  const days = PERIOD_DAYS[period]
  const points: ShopTrendPoint[] = []
  for (let i = count - 1; i >= 0; i--) {
    const end   = endOfDay(new Date(anchor.getTime() - i * days * DAY_MS))
    const start = startOfDay(new Date(end.getTime() - (days - 1) * DAY_MS))
    const startMs = start.getTime()
    const endMs   = end.getTime()
    const slices: ShopSlice[] = shopList.map((s, idx) => {
      const value = orders.reduce((sum, o) => {
        if (o.shopId !== s.id) return sum
        const t = new Date(o.createdAt).getTime()
        return t >= startMs && t <= endMs ? sum + o.fee : sum
      }, 0)
      return { shopId: s.id, shopName: s.name, value, color: SHOP_CHART_COLORS[idx % SHOP_CHART_COLORS.length] }
    })
    const total = slices.reduce((sum, s) => sum + s.value, 0)
    points.push({ label: fmtDate(end), start, end, total, slices })
  }
  return points
}

// ── Stacked bar chart theo shop — mỗi cột = 1 kỳ, mỗi lát màu = 1 shop (categorical, thứ tự cố
// định). Hover trên CẢ CỘT hiện tooltip liệt kê từng shop tại kỳ đó (không phải riêng lát đang
// trỏ vào) — đúng nguyên tắc "1 tooltip, đủ mọi chuỗi" để không bắt người xem rê chuột thật
// chính xác vào 1 lát mỏng. ─────────────────────────────────────────────────────────────────
function ShopTrendStackedChart({ points }: { points: ShopTrendPoint[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)
  const maxValue = Math.max(1, ...points.map((p) => p.total))
  const plotHeight = 140
  const gridSteps = [0, 0.5, 1]
  const shopLegend = points[0]?.slices ?? []

  return (
    <div>
      <div style={{ display: 'flex', gap: 4 }}>
        {/* Trục Y — gridline mờ + nhãn giá trị tròn */}
        <div style={{ position: 'relative', width: 44, flexShrink: 0, height: plotHeight }}>
          {gridSteps.map((s) => (
            <span key={s} style={{ position: 'absolute', right: 6, bottom: s * plotHeight - 6, fontSize: 11, color: C_TEXT_SECONDARY }}>
              {fmtVND(Math.round(maxValue * s))}
            </span>
          ))}
        </div>

        {/* Khu vực vẽ cột */}
        <div style={{ position: 'relative', flex: 1, height: plotHeight }}>
          {gridSteps.map((s) => (
            <div key={s} style={{ position: 'absolute', left: 0, right: 0, bottom: s * plotHeight, borderTop: `1px solid ${C_BORDER}` }} />
          ))}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end' }}>
            {points.map((p, i) => {
              const isCurrent = i === points.length - 1
              const isHovered = hoverIdx === i
              const nonZeroSlices = p.slices.filter((s) => s.value > 0)
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                  onFocus={() => setHoverIdx(i)}
                  onBlur={() => setHoverIdx(null)}
                  tabIndex={0}
                  style={{
                    flex: '1 0 0', height: plotHeight, display: 'flex', alignItems: 'flex-end',
                    justifyContent: 'center', position: 'relative', cursor: 'pointer', outline: 'none',
                  }}
                >
                  {/* Tooltip — liệt kê đủ các shop có phát sinh phí trong kỳ này */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute', bottom: Math.max(2, (p.total / maxValue) * plotHeight) + 8,
                      left: '50%', transform: 'translateX(-50%)',
                      background: '#111827', color: '#fff', borderRadius: 6, padding: '8px 10px',
                      fontSize: 12, whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
                      display: 'flex', flexDirection: 'column', gap: 3,
                    }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>{p.label} · {fmtVND(p.total)}</div>
                      {nonZeroSlices.length === 0 && <div style={{ color: '#9CA3AF' }}>Không có phát sinh</div>}
                      {nonZeroSlices.map((s) => (
                        <div key={s.shopId} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                          <span style={{ color: '#9CA3AF' }}>{s.shopName}</span>
                          <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{fmtVND(s.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cột stacked — lát dưới lên trên theo đúng thứ tự shop, cách nhau 2px */}
                  <div style={{ width: 24, maxWidth: '60%', display: 'flex', flexDirection: 'column-reverse', gap: 2, opacity: isHovered ? 0.85 : 1 }}>
                    {nonZeroSlices.map((s, si) => {
                      const h = Math.max(2, (s.value / maxValue) * plotHeight)
                      const isTop = si === nonZeroSlices.length - 1
                      return (
                        <div
                          key={s.shopId}
                          style={{
                            width: '100%', height: h, background: s.color,
                            borderRadius: isTop ? '4px 4px 0 0' : 0,
                          }}
                        />
                      )
                    })}
                  </div>

                  {/* Nhãn trực tiếp — chỉ tổng của cột hiện tại (kỳ đang xét), tránh rối mắt */}
                  {isCurrent && (
                    <span style={{
                      position: 'absolute', bottom: Math.max(2, (p.total / maxValue) * plotHeight) + 4,
                      fontSize: 11, fontWeight: 700, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap',
                    }}>
                      {fmtVND(p.total)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Trục X */}
      <div style={{ display: 'flex', marginLeft: 48 }}>
        {points.map((p, i) => (
          <span key={i} style={{ flex: '1 0 0', textAlign: 'center', fontSize: 11, color: C_TEXT_SECONDARY, marginTop: 6, fontWeight: i === points.length - 1 ? 700 : 400 }}>
            {p.label}
          </span>
        ))}
      </div>

      {/* Legend — bắt buộc vì có nhiều chuỗi (nhiều shop); rect làm key theo đúng loại mark (cột) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 12, marginLeft: 48 }}>
        {shopLegend.map((s) => (
          <div key={s.shopId} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C_TEXT_PRIMARY }}>{s.shopName}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowTable((v) => !v)}
        style={{ marginTop: 10, border: 'none', background: 'transparent', color: C_LINK, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}
      >
        {showTable ? 'Ẩn dạng bảng' : 'Xem dạng bảng'}
      </button>

      {showTable && (
        <div style={{ marginTop: 8, border: `1px solid ${C_BORDER}`, borderRadius: 6, overflow: 'auto' }}>
          <div style={{ display: 'flex', background: C_BG_HEADER, minWidth: 480 }}>
            <div style={{ flex: '1 0 0', minWidth: 90, padding: '6px 10px', fontSize: 12, fontWeight: 600, color: C_TEXT_SECONDARY }}>Kỳ</div>
            {shopLegend.map((s) => (
              <div key={s.shopId} style={{ flex: '1 0 0', minWidth: 90, padding: '6px 10px', fontSize: 12, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }}>
                {s.shopName}
              </div>
            ))}
            <div style={{ flex: '1 0 0', minWidth: 90, padding: '6px 10px', fontSize: 12, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }}>Tổng</div>
          </div>
          {points.map((p, i) => (
            <div key={i} style={{ display: 'flex', borderTop: `1px solid ${C_BORDER}`, minWidth: 480 }}>
              <div style={{ flex: '1 0 0', minWidth: 90, padding: '6px 10px', fontSize: 12, color: C_TEXT_PRIMARY }}>{p.label}</div>
              {p.slices.map((s) => (
                <div key={s.shopId} style={{ flex: '1 0 0', minWidth: 90, padding: '6px 10px', fontSize: 12, color: C_TEXT_PRIMARY, textAlign: 'right' }}>
                  {fmtVND(s.value)}
                </div>
              ))}
              <div style={{ flex: '1 0 0', minWidth: 90, padding: '6px 10px', fontSize: 12, color: C_TEXT_PRIMARY, textAlign: 'right', fontWeight: i === points.length - 1 ? 700 : 400 }}>
                {fmtVND(p.total)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── KPI card ─────────────────────────────────────────────────
function KpiCard({ icon, label, value, iconColor }: {
  icon: React.ReactNode; label: string; value: string; iconColor: string
}) {
  return (
    <div style={{
      flex: 1, background: '#fff', border: `1px solid ${C_BORDER}`,
      borderRadius: 12, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20, color: iconColor, lineHeight: 1 }}>{icon}</span>
        <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: C_TEXT_PRIMARY }}>{value}</div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function AgencyReport() {
  const navigate = useNavigate()
  const shops = buildShopStats()
  const [period, setPeriod] = useState<PeriodKey>('week')

  const totalShops   = shops.length
  const activeShops  = shops.filter((s) => s.status !== 'inactive').length
  const totalOrders  = shops.reduce((sum, s) => sum + s.totalOrders, 0)
  const totalCod     = shops.reduce((sum, s) => sum + s.cod, 0)
  const avgOrdersPerShop = totalShops > 0 ? Math.round(totalOrders / totalShops) : 0

  const totalFeeAll = shops.reduce((sum, s) => sum + s.totalFee, 0)
  const ranked = [...shops].sort((a, b) => b.totalFee - a.totalFee)

  const agencyOrders = getAgencyOrders()
  const anchorDate = agencyOrders.length > 0
    ? new Date(Math.max(...agencyOrders.map((o) => new Date(o.createdAt).getTime())))
    : new Date()
  const trend = computePeriodComparison(agencyOrders, period, anchorDate)
  const shopTrendSeries = buildShopTrendSeries(agencyOrders, shops, period, anchorDate, TREND_BAR_COUNT)

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff', overflowY: 'auto' }}>

        {/* Page header */}
        <div style={{ padding: '12px 16px', flexShrink: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
            Báo cáo
          </h1>
          <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
            Tổng quan số lượng shop, COD và sản lượng đơn của đại lý
          </p>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'flex', gap: 12, padding: '0 16px 12px', flexShrink: 0, flexWrap: 'wrap' }}>
          <KpiCard
            icon={<ShopOutlined />} iconColor={C_LINK}
            label="Số lượng shop"
            value={`${fmtNum(totalShops)} (${activeShops} hoạt động)`}
          />
          <KpiCard
            icon={<DollarOutlined />} iconColor="#16A34A"
            label="COD"
            value={fmtVND(totalCod)}
          />
          <KpiCard
            icon={<InboxOutlined />} iconColor={C_ACTION}
            label="Sản lượng đơn"
            value={fmtNum(totalOrders)}
          />
          <KpiCard
            icon={<BarChartOutlined />} iconColor="#7C3AED"
            label="Đơn TB / shop"
            value={fmtNum(avgOrdersPerShop)}
          />
        </div>

        {/* Xu hướng tổng phí ship theo Ngày/Tuần/Tháng, so với cùng kỳ liền trước */}
        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Xu hướng tổng phí ship theo shop</span>
                <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
                  So với cùng kỳ liền trước, chia theo từng shop — mốc "hiện tại" lấy theo ngày có đơn gần nhất ({fmtDate(anchorDate)}), vì dữ liệu demo là ngày cố định trong quá khứ.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
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
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px', border: `1px solid ${C_BORDER}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
                  Kỳ này ({fmtDate(trend.curStart)} – {fmtDate(trend.curEnd)})
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_PRIMARY, marginTop: 4 }}>{fmtVND(trend.current)}</div>
              </div>
              <div style={{ flex: '1 1 200px', border: `1px solid ${C_BORDER}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
                  Cùng kỳ trước ({fmtDate(trend.prevStart)} – {fmtDate(trend.prevEnd)})
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C_TEXT_SECONDARY, marginTop: 4 }}>{fmtVND(trend.previous)}</div>
              </div>
              <div style={{ flex: '1 1 200px', border: `1px solid ${C_BORDER}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>So với cùng kỳ</div>
                {trend.deltaPct === null ? (
                  <div style={{ fontSize: 22, fontWeight: 700, color: C_LINK, marginTop: 4 }}>Mới</div>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
                    fontSize: 22, fontWeight: 700,
                    color: trend.deltaPct > 0 ? '#16A34A' : trend.deltaPct < 0 ? '#DC2626' : C_TEXT_SECONDARY,
                  }}>
                    {trend.deltaPct > 0 ? <RiseOutlined style={{ fontSize: 18 }} /> : trend.deltaPct < 0 ? <FallOutlined style={{ fontSize: 18 }} /> : null}
                    {trend.deltaPct > 0 ? '+' : ''}{trend.deltaPct.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${C_BORDER}`, paddingTop: 16 }}>
              <ShopTrendStackedChart points={shopTrendSeries} />
            </div>
          </div>
        </div>

        {/* Bảng doanh thu theo shop */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C_BORDER}` }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>COD &amp; phí theo shop</span>
              <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
                Sắp xếp theo tổng phí giảm dần — bấm vào shop để xem chi tiết
              </div>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', background: C_BG_HEADER }}>
              <div style={{ flex: '1 0 0', minWidth: 200, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Shop</div>
              <div style={{ flex: '0 0 130px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Trạng thái</div>
              <div style={{ flex: '0 0 110px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }}>Số đơn</div>
              <div style={{ flex: '0 0 130px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }}>COD</div>
              <div style={{ flex: '0 0 130px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }}>Tổng phí</div>
              <div style={{ flex: '0 0 200px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>% đóng góp</div>
            </div>

            {ranked.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: C_TEXT_SECONDARY }}>
                Chưa có shop nào.
              </div>
            )}

            {ranked.map((s) => {
              const pct = totalFeeAll > 0 ? (s.totalFee / totalFeeAll) * 100 : 0
              const isInactive = s.status === 'inactive'
              return (
                <div
                  key={s.id}
                  onClick={() => navigate(`/agency-admin/shops/${s.id}`)}
                  style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${C_BORDER}`, cursor: 'pointer' }}
                >
                  <div style={{ flex: '1 0 0', minWidth: 200, padding: '10px 12px' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK }}>{s.name}</span>
                  </div>
                  <div style={{ flex: '0 0 130px', padding: '10px 12px' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: isInactive ? '#DC2626' : '#16A34A' }}>
                      {isInactive ? 'Ngừng hoạt động' : 'Đang hoạt động'}
                    </span>
                  </div>
                  <div style={{ flex: '0 0 110px', padding: '10px 12px', textAlign: 'right' }}>
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{fmtNum(s.totalOrders)}</span>
                  </div>
                  <div style={{ flex: '0 0 130px', padding: '10px 12px', textAlign: 'right' }}>
                    <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{fmtVND(s.cod)}</span>
                  </div>
                  <div style={{ flex: '0 0 130px', padding: '10px 12px', textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmtVND(s.totalFee)}</span>
                  </div>
                  <div style={{ flex: '0 0 200px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: C_BG_HEADER, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: C_ACTION }} />
                    </div>
                    <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, flexShrink: 0, width: 38, textAlign: 'right' }}>{pct.toFixed(1)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </ConfigProvider>
  )
}
