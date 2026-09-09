import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { ShopOutlined, DollarOutlined, InboxOutlined, BarChartOutlined } from '@ant-design/icons'
import { agencyAdminTheme } from '../../../theme/platforms'
import { loadShops } from '../../../mock-data/shopStore'

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

// Doanh thu đại lý (demo) — đúng công thức đã dùng ở Shops.tsx/ShopDetail.tsx:
// COD = tổng đơn × 35.000đ, Doanh thu = COD × 2.8% — không phát minh công thức mới ở đây.
function buildShopStats() {
  const raw = loadShops().filter((s) => s.agencyId === CURRENT_AGENCY_ID)
  return raw.map((s) => {
    const cod     = s.totalOrders * 35_000
    const revenue = Math.round(cod * 0.028)
    return { ...s, cod, revenue }
  })
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

  const totalShops   = shops.length
  const activeShops  = shops.filter((s) => s.status !== 'inactive').length
  const totalOrders  = shops.reduce((sum, s) => sum + s.totalOrders, 0)
  const totalRevenue = shops.reduce((sum, s) => sum + s.revenue, 0)
  const avgOrdersPerShop = totalShops > 0 ? Math.round(totalOrders / totalShops) : 0

  const ranked = [...shops].sort((a, b) => b.revenue - a.revenue)

  return (
    <ConfigProvider theme={agencyAdminTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff', overflowY: 'auto' }}>

        {/* Page header */}
        <div style={{ padding: '12px 16px', flexShrink: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
            Báo cáo
          </h1>
          <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
            Tổng quan số lượng shop, doanh thu và sản lượng đơn của đại lý
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
            label="Doanh thu"
            value={fmtVND(totalRevenue)}
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

        {/* Bảng doanh thu theo shop */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C_BORDER}` }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Doanh thu theo shop</span>
              <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
                Sắp xếp theo doanh thu giảm dần — bấm vào shop để xem chi tiết
              </div>
            </div>

            {/* Header */}
            <div style={{ display: 'flex', background: C_BG_HEADER }}>
              <div style={{ flex: '1 0 0', minWidth: 200, padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Shop</div>
              <div style={{ flex: '0 0 130px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>Trạng thái</div>
              <div style={{ flex: '0 0 110px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }}>Số đơn</div>
              <div style={{ flex: '0 0 130px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY, textAlign: 'right' }}>Doanh thu</div>
              <div style={{ flex: '0 0 200px', padding: '8px 12px', fontSize: 13, fontWeight: 600, color: C_TEXT_SECONDARY }}>% đóng góp</div>
            </div>

            {ranked.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: C_TEXT_SECONDARY }}>
                Chưa có shop nào.
              </div>
            )}

            {ranked.map((s) => {
              const pct = totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0
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
                    <span style={{ fontSize: 14, fontWeight: 700, color: C_TEXT_PRIMARY }}>{fmtVND(s.revenue)}</span>
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
