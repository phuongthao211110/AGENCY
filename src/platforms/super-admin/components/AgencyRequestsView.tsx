import { useState } from 'react'
import { CloseOutlined, CheckOutlined, StopOutlined } from '@ant-design/icons'
import {
  agenciesList, shopConnections, carrierRequests,
  approveShopConnection, rejectShopConnection,
  approveCarrierRequest, rejectCarrierRequest, grantAdditionalHub,
} from '../agencyStore'
import { RejectInput, HubGrantList, Pagination } from './ApprovalWidgets'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

type StatusKey = 'pending' | 'approved' | 'rejected'
const STATUS_LABEL: Record<StatusKey, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' }
const STATUS_COLOR: Record<StatusKey, string> = { pending: '#D97706', approved: '#16A34A', rejected: '#DC2626' }

function StatusBadge({ status }: { status: StatusKey }) {
  return <span style={{ fontSize: 13, fontWeight: 600, color: STATUS_COLOR[status] }}>{STATUS_LABEL[status]}</span>
}

function TabButton({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
        background: active ? C_TEXT_PRIMARY : '#F3F4F6',
        color: active ? '#fff' : C_TEXT_SECONDARY,
        fontSize: 14, fontWeight: 600,
      }}
    >
      {label}
      {count > 0 && (
        <span style={{
          background: '#EF4444', color: '#fff', borderRadius: 10,
          padding: '1px 7px', fontSize: 11, fontWeight: 700, lineHeight: '16px',
        }}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange() }}
      style={{
        width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
        border: checked ? 'none' : `1.5px solid ${C_BORDER}`,
        background: checked ? C_LINK : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 12 9" fill="none">
          <path d="M1 4L4.5 7.5L11 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

function IconActionButton({ variant, onClick }: { variant: 'approve' | 'reject'; onClick: () => void }) {
  const isApprove = variant === 'approve'
  return (
    <button
      onClick={onClick}
      title={isApprove ? 'Duyệt' : 'Từ chối'}
      style={{
        width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer',
        background: isApprove ? '#16A34A' : '#EF4444',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13,
      }}
    >
      {isApprove ? <CheckOutlined /> : <StopOutlined />}
    </button>
  )
}

export default function AgencyRequestsView({ agencyId, agencyName, onClose, onUpdate }: {
  agencyId: string; agencyName: string; onClose: () => void; onUpdate: () => void
}) {
  const agency = agenciesList.find(a => a.id === agencyId)
  const [activeTab, setActiveTab] = useState<'ghn' | '247'>('ghn')
  const [statusFilter, setStatusFilter] = useState<'all' | StatusKey>('all')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  // Từ chối hàng loạt dùng chung 1 lý do cho tất cả dòng đang chờ duyệt được chọn —
  // tách riêng khỏi rejectingId (dùng cho từ chối từng dòng lẻ) để 2 luồng không đụng nhau.
  const [bulkRejecting, setBulkRejecting] = useState(false)
  // Duyệt kết nối/yêu cầu 247Express xong thì mở tiếp form chọn hub ngay tại đây —
  // không gộp chọn hub vào bước duyệt, và không bắt Super Admin rời modal để tìm
  // nút "Cấp thêm Hub" ở trang chi tiết.
  const [grantingHubId, setGrantingHubId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const ghnConns = shopConnections.filter(s => s.agencyId === agencyId && s.carrier === 'GHN')
  const c247Reqs = carrierRequests.filter(r => r.agencyId === agencyId && r.carrier === '247Express')

  const ghnPendingCount = ghnConns.filter(s => s.status === 'pending').length
  const c247PendingCount = c247Reqs.filter(r => r.status === 'pending').length

  const toGhnStatus = (s: string): StatusKey => s === 'active' ? 'approved' : s === 'rejected' ? 'rejected' : 'pending'
  const to247Status = (s: string): StatusKey => s as StatusKey

  const rows = activeTab === 'ghn'
    ? ghnConns.map(s => ({ raw: s, status: toGhnStatus(s.status) }))
    : c247Reqs.map(r => ({ raw: r, status: to247Status(r.status) }))

  const statusCounts: Record<'all' | StatusKey, number> = {
    all: rows.length,
    pending: rows.filter(r => r.status === 'pending').length,
    approved: rows.filter(r => r.status === 'approved').length,
    rejected: rows.filter(r => r.status === 'rejected').length,
  }

  const filteredRows = rows.filter(r => statusFilter === 'all' ? true : r.status === statusFilter)
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize)

  const allChecked = pageRows.length > 0 && pageRows.every(r => selected.has(r.raw.id))
  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev)
      if (allChecked) pageRows.forEach(r => next.delete(r.raw.id))
      else pageRows.forEach(r => next.add(r.raw.id))
      return next
    })
  }
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const switchTab = (tab: 'ghn' | '247') => {
    setActiveTab(tab); setStatusFilter('all'); setPage(1); setRejectingId(null); setGrantingHubId(null)
    setSelected(new Set()); setBulkRejecting(false)
  }

  // Chỉ những dòng đang "Chờ duyệt" trong số đã chọn mới xử lý được hàng loạt —
  // dòng đã duyệt/từ chối trong lựa chọn sẽ bị bỏ qua.
  const selectedPendingIds = ghnConns.filter(s => selected.has(s.id) && s.status === 'pending').map(s => s.id)

  const bulkApprove = () => {
    selectedPendingIds.forEach(id => approveShopConnection(id))
    setSelected(new Set())
    onUpdate()
  }
  const bulkReject = (reason: string) => {
    selectedPendingIds.forEach(id => rejectShopConnection(id, reason))
    setSelected(new Set())
    setBulkRejecting(false)
    onUpdate()
  }

  const cell = (children: React.ReactNode, flex = '1 0 0', minWidth = 140) => (
    <div style={{ flex, minWidth, padding: '10px 8px', display: 'flex', alignItems: 'center' }}>{children}</div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>Yêu cầu</span>
        <CloseOutlined onClick={onClose} style={{ cursor: 'pointer', fontSize: 16, color: C_TEXT_SECONDARY }} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: request management */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px 24px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C_TEXT_PRIMARY, marginBottom: 16, flexShrink: 0 }}>Yêu cầu</div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexShrink: 0 }}>
            <TabButton active={activeTab === 'ghn'} label="Kết nối Shop ID GHN" count={ghnPendingCount} onClick={() => switchTab('ghn')} />
            <TabButton active={activeTab === '247'} label="Kết nối 247Express" count={c247PendingCount} onClick={() => switchTab('247')} />
          </div>

          {/* Status filter — chỉ áp dụng tab GHN (nhiều shop có thể pending cùng lúc).
              Tab 247Express không cần lọc vì mỗi đại lý chỉ có tối đa 1 yêu cầu tại 1 thời điểm. */}
          {activeTab === 'ghn' && (
            <div style={{ marginBottom: 12, flexShrink: 0 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                border: `1px solid ${C_BORDER}`, borderRadius: 6, background: '#fff',
              }}>
                <span style={{ fontSize: 14, color: C_TEXT_SECONDARY }}>Trạng thái:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }}
                  style={{ border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY, background: 'transparent', cursor: 'pointer' }}
                >
                  <option value="all">Tất cả ({statusCounts.all})</option>
                  <option value="pending">Chờ duyệt ({statusCounts.pending})</option>
                  <option value="approved">Đã duyệt ({statusCounts.approved})</option>
                  <option value="rejected">Từ chối ({statusCounts.rejected})</option>
                </select>
              </div>
            </div>
          )}

          {/* Table */}
          <div style={{ flex: 1, overflowY: 'auto', border: `1px solid ${C_BORDER}`, borderRadius: 8 }}>
            {activeTab === 'ghn' ? (
              <>
                <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
                  <div style={{ width: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                    <Checkbox checked={allChecked} onChange={toggleAll} />
                  </div>
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Cửa hàng GHN</span>, '1.6 0 0', 200)}
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Số điện thoại</span>, '1 0 0', 130)}
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Ngày yêu cầu</span>, '1 0 0', 110)}
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Trạng thái</span>, '0.8 0 0', 100)}
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Thao tác</span>, '0.9 0 0', 90)}
                  {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>Lý do</span>, '1.4 0 0', 160)}
                </div>
                {pageRows.length === 0 ? (
                  <div style={{ padding: '32px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>Không có yêu cầu nào</div>
                ) : pageRows.map(({ raw, status }) => {
                  const s = raw as typeof ghnConns[number]
                  const isRejecting = rejectingId === s.id
                  return (
                    <div key={s.id} style={{ borderTop: `1px solid ${C_BORDER}` }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                          <Checkbox checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} />
                        </div>
                        {cell(
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: C_LINK }}>{s.name}</span>
                            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>{s.shopId}</span>
                          </div>, '1.6 0 0', 200
                        )}
                        {cell(<span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{s.phone}</span>, '1 0 0', 130)}
                        {cell(<span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>{s.requestedAt.split('-').reverse().join('/')}</span>, '1 0 0', 110)}
                        {cell(<StatusBadge status={status} />, '0.8 0 0', 100)}
                        {cell(
                          status === 'pending' && !isRejecting ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <IconActionButton variant="approve" onClick={() => { approveShopConnection(s.id); onUpdate() }} />
                              <IconActionButton variant="reject" onClick={() => setRejectingId(s.id)} />
                            </div>
                          ) : null, '0.9 0 0', 90
                        )}
                        {cell(<span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>{s.rejectionReason ?? '—'}</span>, '1.4 0 0', 160)}
                      </div>
                      {isRejecting && (
                        <RejectInput
                          onConfirm={(reason) => { rejectShopConnection(s.id, reason); setRejectingId(null); onUpdate() }}
                          onCancel={() => setRejectingId(null)}
                        />
                      )}
                    </div>
                  )
                })}
              </>
            ) : (() => {
              // Mỗi đại lý chỉ có tối đa 1 yêu cầu 247Express tại 1 thời điểm — không phải
              // danh sách nhiều hàng, nên hiện 1 card duy nhất cho đúng yêu cầu đang xử lý,
              // không giữ log lịch sử các yêu cầu đã duyệt/từ chối trước đó.
              const pendingReq = c247Reqs.find(r => r.status === 'pending')
              const grantingReq = grantingHubId ? c247Reqs.find(r => r.id === grantingHubId) : undefined

              if (grantingReq) {
                // Kết nối lần đầu đã duyệt (chưa có hub) — bước riêng: chọn 1 hub có sẵn để cấp.
                return (
                  <div style={{ border: `1px solid #C4B5FD`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: '#F5F3FF' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>✓ Đã duyệt kết nối 247Express</span>
                    </div>
                    <HubGrantList
                      agencyName={agency?.name ?? agencyName}
                      excludeHubIds={agency?.clientHubIds}
                      defaultSelected={grantingReq.requestedHubIds}
                      onGrant={(hubIds) => {
                        hubIds.forEach(hubId => grantAdditionalHub(agency!.id, hubId))
                        setGrantingHubId(null)
                        onUpdate()
                      }}
                      onClose={() => setGrantingHubId(null)}
                    />
                  </div>
                )
              }

              if (!pendingReq) {
                return (
                  <div style={{ padding: '32px 0', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 14 }}>Không có yêu cầu nào đang chờ xử lý.</div>
                )
              }

              const isRejecting = rejectingId === pendingReq.id
              // Đại lý đã kích hoạt 247Express từ trước = đây là yêu cầu XIN THÊM HUB, không phải
              // kết nối lần đầu — không cần bước "Duyệt" riêng vì không có kết nối nào để duyệt,
              // chỉ có việc chọn hub. Chọn hub xong (bấm "Cấp") = duyệt luôn, gộp thành 1 hành động.
              const alreadyEnabled = (agency?.allowedCarriers ?? []).includes('247Express')

              return (
                <div style={{ border: '1px solid #FDE68A', borderRadius: 8, overflow: 'hidden', background: '#FFFBEB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C_TEXT_PRIMARY }}>
                        {alreadyEnabled ? 'Yêu cầu thêm địa điểm gửi hàng' : 'Yêu cầu kết nối 247Express'} đang chờ duyệt
                      </span>
                      <span style={{ fontSize: 13, color: C_TEXT_SECONDARY }}>
                        {pendingReq.requestedAt.split('-').reverse().join('/')}{pendingReq.requestedTime ? ` ${pendingReq.requestedTime}` : ''} · {agency?.representative ?? '—'}
                      </span>
                      {pendingReq.requestedAddress && (
                        <span style={{ fontSize: 13, color: '#92400E' }}>
                          Địa chỉ đại lý đề xuất: {pendingReq.requestedAddress.address}, {pendingReq.requestedAddress.wardName}, {pendingReq.requestedAddress.districtName}, {pendingReq.requestedAddress.provinceName}
                        </span>
                      )}
                    </div>
                    {!alreadyEnabled && !isRejecting && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <IconActionButton variant="approve" onClick={() => {
                          // Kết nối lần đầu — duyệt kết nối trước, KHÔNG chọn hub ở bước này —
                          // rồi mới mở form chọn hub riêng
                          approveCarrierRequest(pendingReq.id, [], ['DE'])
                          onUpdate()
                          setGrantingHubId(pendingReq.id)
                        }} />
                        <IconActionButton variant="reject" onClick={() => setRejectingId(pendingReq.id)} />
                      </div>
                    )}
                    {alreadyEnabled && !isRejecting && (
                      <button
                        onClick={() => setRejectingId(pendingReq.id)}
                        style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#fff', color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                      >
                        Từ chối
                      </button>
                    )}
                  </div>
                  {isRejecting && (
                    <RejectInput
                      onConfirm={(reason) => { rejectCarrierRequest(pendingReq.id, reason); setRejectingId(null); onUpdate() }}
                      onCancel={() => setRejectingId(null)}
                    />
                  )}
                  {/* Xin thêm hub — chọn 1 hub có sẵn, "Cấp" = duyệt luôn (gộp 1 bước) */}
                  {alreadyEnabled && !isRejecting && (
                    <HubGrantList
                      agencyName={agency?.name ?? agencyName}
                      excludeHubIds={agency?.clientHubIds}
                      defaultSelected={pendingReq.requestedHubIds}
                      onGrant={(hubIds) => {
                        approveCarrierRequest(pendingReq.id, hubIds, ['DE'])
                        onUpdate()
                      }}
                    />
                  )}
                </div>
              )
            })()}
          </div>

          {/* Pagination — chỉ áp dụng tab GHN, tab 247Express là 1 card đơn không phân trang */}
          {activeTab === 'ghn' && (
            <div style={{ flexShrink: 0, borderTop: `1px solid ${C_BORDER}` }}>
              <Pagination
                page={page}
                total={filteredRows.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
              />
            </div>
          )}
        </div>

        {/* Right: agency basic info */}
        <div style={{ width: 340, flexShrink: 0, borderLeft: `1px solid ${C_BORDER}`, padding: 20, overflowY: 'auto' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY, marginBottom: 16 }}>Thông tin cơ bản</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Tên đại lý</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{agency?.name ?? agencyName}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Mã đại lý</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{agency?.code ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Họ tên chủ đại lý</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{agency?.representative ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Số điện thoại</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{agency?.phone ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>Địa chỉ</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C_TEXT_PRIMARY }}>{agency?.address ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk action bar — cố định đáy màn hình (fixed, không phải absolute, để không phụ
          thuộc containing block của component cha), chỉ tab GHN, hiện khi có dòng được chọn */}
      {activeTab === 'ghn' && selected.size > 0 && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1001 }}>
          {bulkRejecting && (
            <RejectInput
              onConfirm={(reason) => bulkReject(reason)}
              onCancel={() => setBulkRejecting(false)}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 24px', background: C_TEXT_PRIMARY }}>
            <CloseOutlined
              onClick={() => { setSelected(new Set()); setBulkRejecting(false) }}
              style={{ color: '#fff', fontSize: 16, cursor: 'pointer' }}
            />
            <span style={{ color: '#fff', fontSize: 14 }}>Đã chọn {selected.size}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {selectedPendingIds.length > 0 ? (
                <>
                  <button
                    onClick={bulkApprove}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <CheckOutlined /> Duyệt
                  </button>
                  <button
                    onClick={() => setBulkRejecting(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 6, border: 'none', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  >
                    <StopOutlined /> Từ chối
                  </button>
                </>
              ) : (
                <span style={{ color: '#9CA3AF', fontSize: 13 }}>Không có dòng chờ duyệt trong lựa chọn</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
