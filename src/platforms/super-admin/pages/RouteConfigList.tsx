import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { CopyOutlined, SearchOutlined } from '@ant-design/icons'
import { superAdminTheme } from '../../../theme/platforms'
import {
  routeConfigVersions,
  getActiveRouteConfigVersion,
  setActiveRouteConfigVersion,
  duplicateRouteConfigVersion,
  deleteDraftVersion,
  type RouteConfigVersion,
} from '../../../mock-data/routeConfig'
import { loadPricing } from '../../../mock-data/pricingStore'
import { Pagination } from '../components/ApprovalWidgets'

const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_ACTION         = '#FF5200'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'
const C_PUB            = '#12784A'
const C_PUB_BG         = '#DCF3E7'
const C_DRAFT          = '#8A6100'
const C_DRAFT_BG       = '#FDF3D9'

function cell(children: React.ReactNode, flex = '1 0 0', minWidth = 160, align: 'left' | 'right' | 'center' = 'left') {
  return (
    <div style={{ flex, minWidth, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start' }}>
      {children}
    </div>
  )
}

function StatusBadge({ status }: { status: RouteConfigVersion['status'] }) {
  const pub = status === 'published'
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, flexShrink: 0,
      color: pub ? C_PUB : C_DRAFT, background: pub ? C_PUB_BG : C_DRAFT_BG,
    }}>
      {pub ? 'Hoạt động' : 'Nháp'}
    </span>
  )
}

// ── "Vùng & Tuyến" — trang riêng, tách khỏi trang chỉnh sửa (RouteConfig.tsx). Mỗi bộ có 2 trạng
// thái: Nháp (sửa thoải mái, chưa chọn được ở bảng giá) / Đã phát hành (khoá cứng Vùng miền/Tuyến,
// chọn được ở bảng giá) — KHÔNG có trạng thái "Đã huỷ". Cách DUY NHẤT tạo bộ mới là "Nhân bản" từ
// 1 bộ có sẵn — không có "tạo bộ trống từ đầu". ─────────────────────────────────────────────────
export default function RouteConfigList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  // Khác bản trước (seed 1 lần, không đổi) — giờ cần setter vì Nhân bản/Xoá thay đổi danh sách
  // ngay tại trang này, không điều hướng đi đâu cả.
  const [versions, setVersions] = useState(() => [...routeConfigVersions].reverse())
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null)
  const [pricingCountByBundle] = useState(() => {
    const counts = new Map<string, number>()
    for (const pt of loadPricing() as { routeBundleId?: string }[]) {
      if (!pt.routeBundleId) continue
      counts.set(pt.routeBundleId, (counts.get(pt.routeBundleId) ?? 0) + 1)
    }
    return counts
  })
  const [activeVersion, setActiveVersionState] = useState(() => getActiveRouteConfigVersion())

  const handleSetDefault = (version: RouteConfigVersion) => {
    if (version.status !== 'published') return // Nháp không bao giờ áp dụng được — double-guard, UI đã disable
    const ok = window.confirm(
      `Áp dụng "${version.label}" cho TOÀN HỆ THỐNG? Toàn bộ ứng dụng (bảng giá, tạo đơn, kiểm tra tuyến...) sẽ dùng ngay dữ liệu của bộ này thay cho bộ đang áp dụng hiện tại.`
    )
    if (!ok) return
    const applied = setActiveRouteConfigVersion(version.id)
    if (applied) setActiveVersionState(applied)
  }

  const handleDuplicate = (source: RouteConfigVersion) => {
    const label = window.prompt('Tên bộ nháp mới:', `${source.label} (bản sao)`)
    if (label === null) return // bấm Huỷ ở prompt
    const created = duplicateRouteConfigVersion(source.id, label)
    if (!created) return
    setVersions((prev) => [created, ...prev])
    navigate(`/super-admin/route-config/edit/${created.id}`)
  }

  const handleDelete = (version: RouteConfigVersion) => {
    const ok = window.confirm(`Xoá hẳn bộ Nháp "${version.label}"? Không thể khôi phục lại.`)
    if (!ok) return
    const deleted = deleteDraftVersion(version.id)
    if (!deleted) return
    setVersions((prev) => prev.filter((v) => v.id !== version.id))
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
            onClick={() => handleDuplicate(activeVersion)}
            title="Tạo 1 bộ Nháp mới bằng cách sao chép toàn bộ nội dung bộ đang áp dụng — cách duy nhất để tạo bộ mới"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', flexShrink: 0,
              background: C_ACTION, border: 'none', borderRadius: 6,
              cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff',
            }}
          >
            <CopyOutlined style={{ fontSize: 12 }} /> Nhân bản bộ đang áp dụng
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
            <div style={{ minWidth: 1120 }}>
              {/* Header */}
              <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
                {cell(<span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>Tên</span>, '0 0 240px', 240)}
                {cell(<span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>Vùng miền</span>, '1 0 0', 220)}
                {cell(<span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>Tuyến</span>, '1 0 0', 220)}
                {cell(<span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>Hiển thị mặc định</span>, '0 0 140px', 140, 'center')}
                {cell(<span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>Thao tác</span>, '0 0 220px', 220, 'right')}
              </div>
              <div style={{ height: 1, background: C_BORDER }} />

              {paginated.map((v) => {
                const isActive = v.id === activeVersion.id
                const isPublished = v.status === 'published'
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
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C_TEXT_SECONDARY, lineHeight: '16px' }}>
                            <StatusBadge status={v.status} />
                            {isActive && <span style={{ color: '#FF5200', fontWeight: 600 }}>Đang áp dụng</span>}
                            {(pricingCountByBundle.get(v.id) ?? 0) > 0 && <>· {pricingCountByBundle.get(v.id)} bảng giá</>}
                          </span>
                        </div>,
                        '0 0 240px', 240
                      )}
                      {cell(
                        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {regionNames.join(', ')}
                        </span>,
                        '1 0 0', 220
                      )}
                      {cell(
                        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {routeNames.join(', ')}
                        </span>,
                        '1 0 0', 220
                      )}
                      {cell(
                        <div
                          onClick={(e) => { e.stopPropagation(); if (!isActive && isPublished) handleSetDefault(v) }}
                          title={
                            isActive ? 'Bộ đang áp dụng — không thể tự tắt, muốn đổi thì bật mặc định cho 1 bộ khác'
                              : !isPublished ? 'Bộ Nháp chưa phát hành — không áp dụng được'
                              : 'Bật để áp dụng bộ này cho toàn hệ thống'
                          }
                          style={{
                            width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                            cursor: isActive || !isPublished ? 'not-allowed' : 'pointer',
                            background: isActive ? '#16A34A' : '#D1D5DB',
                            opacity: !isPublished && !isActive ? 0.4 : 1,
                            position: 'relative', transition: 'background 0.2s',
                          }}
                        >
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, transition: 'left 0.2s', left: isActive ? 18 : 2, boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                        </div>,
                        '0 0 140px', 140, 'center'
                      )}
                      {cell(
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/super-admin/route-config/edit/${v.id}`)}
                            style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#fff', fontSize: 12, fontWeight: 600, color: C_TEXT_PRIMARY, cursor: 'pointer' }}
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDuplicate(v)}
                            style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#fff', fontSize: 12, fontWeight: 600, color: C_TEXT_PRIMARY, cursor: 'pointer' }}
                          >
                            Nhân bản
                          </button>
                          {!isPublished && (
                            <button
                              onClick={() => handleDelete(v)}
                              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#fff', fontSize: 12, fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}
                            >
                              Xoá
                            </button>
                          )}
                        </div>,
                        '0 0 220px', 220, 'right'
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
