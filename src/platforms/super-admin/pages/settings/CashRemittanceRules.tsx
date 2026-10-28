import { useState } from 'react'
import { ConfigProvider } from 'antd'
import { SearchOutlined, SettingOutlined, CloseOutlined } from '@ant-design/icons'
import { superAdminTheme } from '../../../../theme/platforms'
import { loadRemittanceConfig, saveRemittanceConfig } from '../../../../mock-data/orderStore'
import { agenciesList } from '../../agencyStore'
import { Pagination } from '../../components/ApprovalWidgets'
import {
  C_ACTION,
  C_LINK,
  C_BORDER,
  C_TEXT_PRIMARY,
  C_TEXT_LABEL,
  C_TEXT_SECONDARY,
  C_BG_HEADER,
  C_BG_WHITE,
  FONT_SIZE_BASE,
  FONT_SIZE_SM,
  FONT_SIZE_2XL,
  FONT_WEIGHT_SEMIBOLD,
  FONT_WEIGHT_MEDIUM,
  FONT_WEIGHT_BOLD,
  RADIUS_BASE,
  RADIUS_LG,
  SPACE_2,
  SPACE_3,
  SPACE_4,
  SPACE_6,
  CARD_SHADOW,
} from '../../../../theme/tokens'

// ── Checkbox (square, dùng chung visual với HubGrantList) ──────────────────
function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onChange() }}
      style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: checked ? 'none' : `1.5px solid ${C_BORDER}`, background: checked ? C_LINK : '#fff',
      }}
    >
      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 3.5L3.8 6.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </div>
  )
}

// ── Ô nhập số ngày + hậu tố "Ngày" (dùng trong modal Thiết lập) ─────────────
function NumberField({ label, helper, value, onChange }: { label: string; helper: string; value: number; onChange: (val: number) => void }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_2 }}>
      <label style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY }}>{label}</label>
      <span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY, lineHeight: '18px' }}>{helper}</span>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: SPACE_3,
          border: `1px solid ${focused ? '#FFA274' : C_BORDER}`, borderRadius: RADIUS_BASE,
          padding: `6px ${SPACE_3}px`, background: '#fff', transition: 'border-color 0.2s', maxWidth: 160,
        }}
      >
        <input
          type="number"
          min={1}
          value={value}
          onChange={e => onChange(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: FONT_SIZE_BASE, color: C_TEXT_PRIMARY, background: 'transparent', width: '100%' }}
        />
        <span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap', borderLeft: `1px solid ${C_BORDER}`, paddingLeft: SPACE_3 }}>Ngày</span>
      </div>
    </div>
  )
}

// ── Modal "Thiết lập ngưỡng theo số ngày trễ" cho 1 đại lý ──────────────────
function RulesModal({ agencyId, agencyName, onClose, onSaved }: {
  agencyId: string; agencyName: string; onClose: () => void; onSaved: () => void
}) {
  const initial = loadRemittanceConfig(agencyId)
  const [warningDays, setWarningDays] = useState(initial.warningDays)
  const [blockDays, setBlockDays] = useState(initial.blockDays)

  const error = blockDays <= warningDays ? 'Số ngày khoá tạo đơn phải LỚN HƠN số ngày hiện cảnh báo.' : null

  function handleSubmit() {
    if (error) return
    saveRemittanceConfig(agencyId, { warningDays, blockDays })
    onSaved()
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: 480, maxHeight: '85vh', overflowY: 'auto', background: '#fff', borderRadius: RADIUS_LG, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div style={{ padding: `${SPACE_4}px ${SPACE_6}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C_BORDER}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_BOLD, color: C_TEXT_PRIMARY }}>Thiết lập ngưỡng theo số ngày trễ</span>
            <span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY }}>
              <span style={{ color: C_LINK, fontWeight: FONT_WEIGHT_SEMIBOLD }}>{agencyName}</span>
            </span>
          </div>
          <CloseOutlined onClick={onClose} style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, fontSize: 16 }} />
        </div>

        {/* Body */}
        <div style={{ padding: `${SPACE_6}px`, display: 'flex', flexDirection: 'column', gap: SPACE_6 }}>
          <NumberField
            label="Số ngày hiện cảnh báo"
            helper="Shop trễ từ số ngày này trở lên sẽ thấy cảnh báo khi bấm 'Tạo đơn hàng', nhưng vẫn tạo đơn bình thường."
            value={warningDays}
            onChange={setWarningDays}
          />
          <NumberField
            label="Số ngày khoá tạo đơn"
            helper="Shop trễ từ số ngày này trở lên sẽ bị tự động khoá, không tạo được đơn mới cho đến khi đại lý duyệt bớt nợ."
            value={blockDays}
            onChange={setBlockDays}
          />
          {error && <div style={{ fontSize: FONT_SIZE_SM, color: '#DC2626' }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: `${SPACE_3}px ${SPACE_6}px ${SPACE_4}px`, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSubmit}
            disabled={!!error}
            style={{
              background: error ? '#D1D5DB' : C_ACTION, color: '#fff', border: 'none', borderRadius: RADIUS_BASE,
              padding: '8px 16px', fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_MEDIUM,
              cursor: error ? 'not-allowed' : 'pointer',
            }}
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Table header ─────────────────────────────────────────────
function THead({ allChecked, onToggleAll }: { allChecked: boolean; onToggleAll: () => void }) {
  const cell = (label: string, flex = '1 0 0', minWidth = 160) => (
    <div style={{ display: 'flex', flex, alignItems: 'center', minWidth, padding: '6px 8px' }}>
      <span style={{ fontSize: FONT_SIZE_BASE, color: C_TEXT_SECONDARY, lineHeight: '20px' }}>{label}</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', background: C_BG_HEADER, alignItems: 'center' }}>
      <div style={{ flex: '0 0 44px', minWidth: 44, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Checkbox checked={allChecked} onChange={onToggleAll} />
      </div>
      {cell('Đại lý', '1 0 0', 220)}
      {cell('Số ngày hiện cảnh báo', '1 0 0', 180)}
      {cell('Số ngày khoá tạo đơn', '1 0 0', 180)}
      {cell('Thao tác', '0 0 140px', 140)}
    </div>
  )
}

// ── Table row ─────────────────────────────────────────────────
function TRow({ agency, checked, onToggle, onSetup }: {
  agency: { id: string; name: string; code: string }
  checked: boolean
  onToggle: () => void
  onSetup: () => void
}) {
  const [hover, setHover] = useState(false)
  const config = loadRemittanceConfig(agency.id)

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', background: hover ? '#FAFAFA' : '#fff', transition: 'background 0.1s', borderBottom: `1px solid ${C_BORDER}` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ flex: '0 0 44px', minWidth: 44, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Checkbox checked={checked} onChange={onToggle} />
      </div>
      <div style={{ flex: '1 0 0', minWidth: 220, padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_BOLD, color: C_LINK, lineHeight: '20px' }}>{agency.name}</span>
        <span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY, lineHeight: '16px' }}>{agency.code}</span>
      </div>
      <div style={{ flex: '1 0 0', minWidth: 180, padding: '6px 8px' }}>
        <span style={{ fontSize: FONT_SIZE_BASE, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{config.warningDays}</span>
      </div>
      <div style={{ flex: '1 0 0', minWidth: 180, padding: '6px 8px' }}>
        <span style={{ fontSize: FONT_SIZE_BASE, color: C_TEXT_PRIMARY, lineHeight: '20px' }}>{config.blockDays}</span>
      </div>
      <div style={{ flex: '0 0 140px', minWidth: 140, padding: '6px 8px' }}>
        <button
          onClick={onSetup}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: RADIUS_BASE,
            padding: '6px 12px', fontSize: FONT_SIZE_SM, fontWeight: FONT_WEIGHT_MEDIUM, color: C_TEXT_LABEL, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <SettingOutlined style={{ fontSize: 14 }} />
          Thiết lập
        </button>
      </div>
    </div>
  )
}

// Cấu hình ngưỡng cảnh báo/khoá tạo đơn RIÊNG TỪNG ĐẠI LÝ — danh sách dạng bảng (giống UI tham
// khảo thật của GHN: checkbox + Đại lý + 2 cột ngưỡng + nút "Thiết lập" mở modal), thay cho bản
// dropdown-chọn-1-đại-lý trước đây. Đọc/ghi qua orderStore.ts (loadRemittanceConfig(agencyId)/
// saveRemittanceConfig(agencyId, config), localStorage key `ghn_cash_remittance_config_v2`) để Web
// Shop (chặn/cảnh báo tạo đơn) và Agency Admin (StatusCell, chip tổng) dùng CHUNG một nguồn — sửa
// ở đây ảnh hưởng ngay, không cần build lại hay restart gì. Đại lý chưa từng được cấu hình riêng
// rơi về mặc định 1/3 ngày (DEFAULT_REMITTANCE_CONFIG).
export default function CashRemittanceRules() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editingAgency, setEditingAgency] = useState<{ id: string; name: string } | null>(null)
  const [tick, setTick] = useState(0)

  const filtered = agenciesList.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) || a.code.toLowerCase().includes(search.toLowerCase())
  )
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allChecked = paginated.length > 0 && paginated.every(a => selected.has(a.id))

  function toggleRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev => {
      if (allChecked) {
        const next = new Set(prev)
        paginated.forEach(a => next.delete(a.id))
        return next
      }
      const next = new Set(prev)
      paginated.forEach(a => next.add(a.id))
      return next
    })
  }

  return (
    <ConfigProvider theme={superAdminTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_4, padding: `${SPACE_6}px ${SPACE_6}px 0` }}>
        <h2 style={{ fontSize: FONT_SIZE_2XL, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY, margin: 0 }}>
          Quy tắc thanh toán tiền mặt
        </h2>

        <div style={{ background: C_BG_WHITE, border: `1px solid ${C_BORDER}`, borderRadius: RADIUS_LG, boxShadow: CARD_SHADOW, overflow: 'hidden' }}>
          <div style={{ padding: `${SPACE_4}px ${SPACE_4}px 0` }}>
            <h3 style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY, margin: 0 }}>
              Ngưỡng theo số ngày trễ
            </h3>
          </div>

          <div style={{ padding: `${SPACE_3}px ${SPACE_4}px` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE_3, padding: `8px ${SPACE_3}px`, border: `1px solid ${C_BORDER}`, borderRadius: RADIUS_BASE }}>
              <SearchOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, flexShrink: 0 }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Tìm kiếm"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: FONT_SIZE_BASE, color: C_TEXT_PRIMARY, background: 'transparent' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 720 }}>
              <THead allChecked={allChecked} onToggleAll={toggleAll} />
              {paginated.length === 0 ? (
                <div style={{ padding: `${SPACE_6}px`, textAlign: 'center', fontSize: FONT_SIZE_BASE, color: C_TEXT_SECONDARY }}>
                  Không tìm thấy đại lý nào.
                </div>
              ) : paginated.map(agency => (
                <TRow
                  key={`${agency.id}-${tick}`}
                  agency={agency}
                  checked={selected.has(agency.id)}
                  onToggle={() => toggleRow(agency.id)}
                  onSetup={() => setEditingAgency({ id: agency.id, name: agency.name })}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ margin: `0 -${SPACE_6}px` }}>
          <Pagination
            page={page}
            total={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={s => { setPageSize(s); setPage(1) }}
          />
        </div>
      </div>

      {editingAgency && (
        <RulesModal
          agencyId={editingAgency.id}
          agencyName={editingAgency.name}
          onClose={() => setEditingAgency(null)}
          onSaved={() => setTick(t => t + 1)}
        />
      )}
    </ConfigProvider>
  )
}
