import { useState } from 'react'
import { clientHubs247 } from '../agencyStore'

// ── Design tokens ────────────────────────────────────────────
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_LINK           = '#3B82F6'
const C_BORDER         = '#E5E7EB'

// ── Reject reason input — bắt buộc nhập lý do, tối đa 500 ký tự ────────────────
export function RejectInput({ onConfirm, onCancel }: { onConfirm: (r: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  const trimmed = reason.trim()
  return (
    <div style={{ padding: '8px 12px', background: '#FFF9F9', borderTop: `1px solid #FCA5A5`, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={reason}
          onChange={e => setReason(e.target.value.slice(0, 500))}
          placeholder="Nhập lý do từ chối (bắt buộc)..."
          autoFocus
          style={{ flex: 1, border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '5px 10px', fontSize: 13, outline: 'none', color: C_TEXT_PRIMARY }}
        />
        <button
          onClick={() => trimmed && onConfirm(trimmed)}
          disabled={!trimmed}
          style={{ background: trimmed ? '#EF4444' : '#D1D5DB', border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: trimmed ? 'pointer' : 'not-allowed', flexShrink: 0 }}
        >
          Xác nhận
        </button>
        <button
          onClick={onCancel}
          style={{ background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '5px 10px', fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer', flexShrink: 0 }}
        >
          Huỷ
        </button>
      </div>
      <span style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>{reason.length}/500</span>
    </div>
  )
}

// ── Chọn hub để cấp cho đại lý ĐÃ được duyệt kết nối 247Express — đây thuần là bước
// chọn địa điểm gửi hàng cho đại lý, KHÔNG phải màn duyệt (không dùng màu tím/chữ
// "duyệt" của CarrierApprovalForm, không có nút Từ chối vì không còn gì để từ chối) ──
export function HubGrantList({ agencyName, excludeHubIds, defaultSelected, onGrant, onClose }: {
  agencyName: string
  excludeHubIds?: string[]
  defaultSelected?: string[]
  onGrant: (hubIds: string[]) => void
  onClose?: () => void
}) {
  const [selectedHubs, setSelectedHubs] = useState<string[]>(defaultSelected ?? [])
  const availableHubs = clientHubs247.filter(h => !(excludeHubIds ?? []).includes(h.id))

  const toggleHub = (id: string) =>
    setSelectedHubs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  return (
    <div style={{ padding: '12px 12px 10px', background: '#F9FAFB', borderTop: `1px solid ${C_BORDER}` }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY, marginBottom: 10 }}>
        Chọn địa điểm gửi hàng để cấp cho <span style={{ color: C_LINK }}>{agencyName}</span>
      </div>
      <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 8, overflow: 'hidden', background: '#fff', maxHeight: 220, overflowY: 'auto', marginBottom: 10 }}>
        {availableHubs.length === 0 ? (
          <div style={{ padding: '14px', textAlign: 'center', fontSize: 12, color: C_TEXT_SECONDARY }}>Đại lý đã được cấp toàn bộ Hub hiện có.</div>
        ) : availableHubs.map((hub, i) => {
          const checked = selectedHubs.includes(hub.id)
          return (
            <div
              key={hub.id}
              onClick={() => toggleHub(hub.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', cursor: 'pointer', background: checked ? '#EFF6FF' : '#fff', borderBottom: i < availableHubs.length - 1 ? '1px solid #F3F4F6' : 'none' }}
            >
              <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: checked ? 'none' : `1.5px solid #BFDBFE`, background: checked ? C_LINK : '#fff' }}>
                {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 3.5L3.8 6.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C_LINK, fontFamily: 'monospace' }}>{hub.id}</div>
                <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 1 }}>{hub.name} — 📍 {hub.location}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {onClose && (
          <button onClick={onClose} style={{ padding: '6px 14px', background: 'none', border: `1px solid ${C_BORDER}`, borderRadius: 6, fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer' }}>Đóng</button>
        )}
        <button
          onClick={() => selectedHubs.length > 0 && onGrant(selectedHubs)}
          disabled={selectedHubs.length === 0}
          style={{ padding: '6px 18px', background: selectedHubs.length > 0 ? C_LINK : '#D1D5DB', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#fff', cursor: selectedHubs.length > 0 ? 'pointer' : 'not-allowed' }}
        >
          Cấp ({selectedHubs.length} hub)
        </button>
      </div>
    </div>
  )
}

// ── Pagination ─────────────────────────────────────────────────
export function Pagination({ page, total, pageSize, onPageChange, onPageSizeChange }: {
  page: number; total: number; pageSize: number;
  onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void;
}) {
  const [goTo, setGoTo] = useState(String(page))
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1, 2, 3, '...', totalPages - 2, totalPages - 1, totalPages)
  }

  const PageBtn = ({ p }: { p: number | '...' }) => {
    if (p === '...') return <span style={{ fontSize: 14, color: C_TEXT_PRIMARY }}>...</span>
    const active = p === page
    return (
      <div
        onClick={() => onPageChange(p)}
        style={{
          width: 24, height: 24, borderRadius: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', background: active ? C_TEXT_PRIMARY : 'transparent',
          fontSize: 14, color: active ? '#fff' : C_TEXT_PRIMARY, lineHeight: '20px', flexShrink: 0,
        }}
      >
        {p}
      </div>
    )
  }

  const NavBtn = ({ dir }: { dir: 'first' | 'last' }) => (
    <div
      onClick={() => onPageChange(dir === 'first' ? 1 : totalPages)}
      style={{ width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563', flexShrink: 0 }}
    >
      {dir === 'first'
        ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M8 5l-5 5 5 5M4 10h12M13 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 5l5 5-5 5M16 10H4M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      }
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: '#fff', flexShrink: 0 }}>
      {/* Page size */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px',
          border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
        }}
        onClick={() => onPageSizeChange(pageSize === 50 ? 100 : 50)}
      >
        <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap' }}>Hiển thị {pageSize}</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7.5l5 5 5-5" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>

      {/* Page numbers */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <NavBtn dir="first" />
        {pages.map((p, i) => <PageBtn key={i} p={p} />)}
        <NavBtn dir="last" />
      </div>

      {/* Go to page */}
      <span style={{ fontSize: 14, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', flexShrink: 0 }}>Đến trang</span>
      <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, width: 48, padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <input
          value={goTo}
          onChange={(e) => setGoTo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const n = parseInt(goTo)
              if (!isNaN(n) && n >= 1 && n <= totalPages) onPageChange(n)
            }
          }}
          style={{ width: '100%', border: 'none', outline: 'none', textAlign: 'center', fontSize: 14, color: C_TEXT_PRIMARY, background: 'transparent' }}
        />
      </div>
    </div>
  )
}
