import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { EditOutlined, SearchOutlined } from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
import { routeConfigVersions, getActiveRouteConfigVersion, setActiveRouteConfigVersion } from '../../../mock-data/routeConfig'
import { loadPricing } from '../../../mock-data/pricingStore'
import { Pagination } from '../components/ApprovalWidgets'

const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_ACTION         = '#FF5200'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

function cell(children: React.ReactNode, flex = '1 0 0', minWidth = 160, align: 'left' | 'right' | 'center' = 'left') {
  return (
    <div style={{ flex, minWidth, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
      {children}
    </div>
  )
}

// ── "Vùng & Tuyến" — trang riêng, tách khỏi trang chỉnh sửa (RouteConfig.tsx). Chỉ đọc
// `routeConfigVersions` (lịch sử BẤT BIẾN mọi bộ đã tạo qua commitNewRouteConfigVersion) — không
// sửa được gì ở đây, kể cả bộ "Đang áp dụng" (chỉ bật/tắt mặc định qua toggle). Muốn sửa nội dung
// (rồi tự sinh bộ mới khi lưu) → bấm nút sang trang /super-admin/route-config/edit. ─────────────
export default function RouteConfigList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  // Seed 1 lần lúc mount — mỗi lần điều hướng tới trang này (route đổi → component remount)
  // sẽ tự đọc lại đúng dữ liệu mới nhất từ store, không cần cơ chế subscribe riêng.
  const [versions] = useState(() => [...routeConfigVersions].reverse())
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null)
  // Đếm số bảng giá đang truy vết TỪNG bộ (PriceTable.routeBundleId) — THUẦN HIỂN THỊ, không phải
  // cảnh báo chặn khoá/xoá (bộ tuyến không có nút xoá, và khoá tuyến không đọc field này) — chỉ
  // giúp Super Admin biết bộ này từng được dùng để tạo bao nhiêu bảng giá trước khi đổi gì đó.
  const [pricingCountByBundle] = useState(() => {
    const counts = new Map<string, number>()
    for (const pt of loadPricing() as { routeBundleId?: string }[]) {
      if (!pt.routeBundleId) continue
      counts.set(pt.routeBundleId, (counts.get(pt.routeBundleId) ?? 0) + 1)
    }
    return counts
  })
  // "Bộ đang áp dụng" KHÔNG còn chắc là bộ cuối mảng — Super Admin có thể bấm bật mặc định cho 1
  // bộ cũ hơn, nên theo dõi riêng qua state, đổi ngay khi bấm (không cần điều hướng lại trang).
  const [activeVersion, setActiveVersionState] = useState(() => getActiveRouteConfigVersion())

  const handleSetDefault = (versionId: string, label: string) => {
    const ok = window.confirm(
      `Đặt "${label}" làm bộ vùng tuyến MẶC ĐỊNH? Toàn bộ ứng dụng (bảng giá, tạo đơn, kiểm tra tuyến...) sẽ dùng ngay dữ liệu của bộ này thay cho bộ đang áp dụng hiện tại.`
    )
    if (!ok) return
    const applied = setActiveRouteConfigVersion(versionId)
    if (applied) setActiveVersionState(applied)
  }

  const filtered = versions.filter((v) => v.label.toLowerCase().includes(search.trim().toLowerCase()))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <ConfigProvider theme={superAdminTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', background: '#fff' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0 }}>
          <div style={{ flex: '1 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, margin: 0, lineHeight: '28px' }}>
              Vùng &amp; Tuyến
            </h1>
            <p style={{ fontSize: 14, color: C_TEXT_SECONDARY, margin: 0, lineHeight: '20px' }}>
              Cấu hình vùng, miền và tuyến dùng chung cho tất cả các đại lý
            </p>
          </div>
          <button
            onClick={() => navigate('/super-admin/route-config/edit')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', flexShrink: 0,
              background: C_ACTION, border: 'none', borderRadius: 6,
              cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff',
            }}
          >
            <EditOutlined style={{ fontSize: 12 }} /> Chỉnh sửa vùng &amp; tuyến
          </button>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', flexShrink: 0 }}>
          <div style={{
            flex: 1, maxWidth: 360, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
            background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6,
          }}>
            <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Tìm kiếm"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent', lineHeight: '20px' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: '1 0 0', overflow: 'hidden', padding: '0 16px' }}>
          <div style={{ height: '100%', overflowY: 'auto', overflowX: 'auto' }}>
            <div style={{ minWidth: 960 }}>
              {/* Header */}
              <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
                {cell(<span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>Tên</span>, '0 0 220px', 220)}
                {cell(<span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>Vùng miền</span>, '1 0 0', 260)}
                {cell(<span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>Tuyến</span>, '1 0 0', 260)}
                {cell(<span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>Hiển thị mặc định</span>, '0 0 150px', 150, 'center')}
              </div>
              <div style={{ height: 1, background: C_BORDER }} />

              {paginated.map((v) => {
                const isActive = v.id === activeVersion.id
                const isExpanded = expandedVersionId === v.id
                const regionNames = v.regions.map((r) => r.name || '(chưa đặt tên)')
                const routeNames  = Array.from(new Set(Object.values(v.routeMatrix)))
                const routeNameCount = routeNames.length

                return (
                  <div key={v.id} style={{ borderBottom: `1px solid ${C_BORDER}` }}>
                    <div
                      onClick={() => setExpandedVersionId((prev) => (prev === v.id ? null : v.id))}
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: isActive ? '#FFF4ED' : '#fff' }}
                    >
                      {cell(
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK, lineHeight: '20px' }}>{v.label}</span>
                          <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, lineHeight: '16px' }}>
                            {isActive ? 'Đang áp dụng' : 'Lịch sử'}
                            {(pricingCountByBundle.get(v.id) ?? 0) > 0 && <> · {pricingCountByBundle.get(v.id)} bảng giá</>}
                          </span>
                        </div>,
                        '0 0 220px', 220
                      )}
                      {cell(
                        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {regionNames.join(', ')}
                        </span>,
                        '1 0 0', 260
                      )}
                      {cell(
                        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {routeNames.join(', ')}
                        </span>,
                        '1 0 0', 260
                      )}
                      {cell(
                        <div
                          onClick={(e) => { e.stopPropagation(); if (!isActive) handleSetDefault(v.id, v.label) }}
                          title={isActive ? 'Bộ đang áp dụng — không thể tự tắt, muốn đổi thì bật mặc định cho 1 bộ khác' : 'Bật để đặt bộ này làm mặc định'}
                          style={{
                            width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                            cursor: isActive ? 'not-allowed' : 'pointer',
                            background: isActive ? '#16A34A' : '#D1D5DB',
                            position: 'relative', transition: 'background 0.2s',
                          }}
                        >
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, transition: 'left 0.2s', left: isActive ? 18 : 2, boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                        </div>,
                        '0 0 150px', 150, 'center'
                      )}
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '4px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10, background: '#F9FAFB' }}>
                        <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
                          Tạo lúc {new Date(v.createdAt).toLocaleString('vi-VN')} · {v.urbanConfigs.length} tỉnh có Nội/Ngoại thành
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C_TEXT_PRIMARY, marginBottom: 4 }}>Vùng miền ({v.regions.length})</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {v.regions.map((r) => (
                              <span key={r.id} style={{ fontSize: 12, padding: '3px 8px', borderRadius: 12, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>
                                {r.name || '(chưa đặt tên)'} · {r.provinces.length} tỉnh
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C_TEXT_PRIMARY, marginBottom: 4 }}>Tuyến ({routeNameCount})</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {routeNames.map((name) => {
                              const pairCount = Object.values(v.routeMatrix).filter((n) => n === name).length
                              return (
                                <span key={name} style={{ fontSize: 12, padding: '3px 8px', borderRadius: 12, background: '#FFF4ED', border: '1px solid #FDBA74', color: '#FF5200' }}>
                                  {name} · {pairCount} cặp
                                </span>
                              )
                            })}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C_TEXT_PRIMARY, marginBottom: 4 }}>Nội/Ngoại thành ({v.urbanConfigs.length} tỉnh)</div>
                          {v.urbanConfigs.length === 0 ? (
                            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Chưa có tỉnh nào phân biệt Nội/Ngoại thành.</span>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {v.urbanConfigs.map((u) => {
                                const urbanCount = u.wards.filter((w) => w.isUrban).length
                                return (
                                  <span key={u.province} style={{ fontSize: 12, padding: '3px 8px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A' }}>
                                    {u.province} · {urbanCount}/{u.wards.length} nội thành
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {filtered.length === 0 && (
                <div style={{ padding: '48px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>
                  Không tìm thấy bộ vùng tuyến nào
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div style={{ borderTop: `1px solid ${C_BORDER}` }}>
          <Pagination
            page={page}
            total={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
          />
        </div>
      </div>
    </ConfigProvider>
  )
}
