import { useState } from 'react'
import { ConfigProvider } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import { superAdminTheme } from '../../../../theme/platforms'
import { loadRemittanceConfig, saveRemittanceConfig } from '../../../../mock-data/orderStore'
import { agenciesList } from '../../agencyStore'
import {
  C_ACTION,
  C_BORDER,
  C_TEXT_PRIMARY,
  C_TEXT_LABEL,
  C_TEXT_SECONDARY,
  C_BG_WHITE,
  FONT_SIZE_BASE,
  FONT_SIZE_SM,
  FONT_SIZE_2XL,
  FONT_WEIGHT_SEMIBOLD,
  FONT_WEIGHT_MEDIUM,
  RADIUS_BASE,
  RADIUS_LG,
  SPACE_2,
  SPACE_3,
  SPACE_4,
  SPACE_6,
  CARD_SHADOW,
} from '../../../../theme/tokens'

interface NumberFieldProps {
  label: string
  helper: string
  value: number
  onChange: (val: number) => void
}

function NumberField({ label, helper, value, onChange }: NumberFieldProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_2 }}>
      <label style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_MEDIUM, color: C_TEXT_LABEL }}>
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACE_3,
          border: `1px solid ${focused ? '#FFA274' : C_BORDER}`,
          borderRadius: RADIUS_BASE,
          padding: `6px ${SPACE_3}px`,
          background: C_BG_WHITE,
          transition: 'border-color 0.2s',
          maxWidth: 160,
        }}
      >
        <input
          type="number"
          min={1}
          value={value}
          onChange={e => onChange(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: FONT_SIZE_BASE,
            color: C_TEXT_PRIMARY,
            background: 'transparent',
            width: '100%',
          }}
        />
        <span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>ngày</span>
      </div>
      <span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY, lineHeight: '18px' }}>{helper}</span>
    </div>
  )
}

// Form 2 ngưỡng của ĐÚNG 1 đại lý — key={agencyId} ở nơi gọi làm component này tự remount (tự
// nạp lại local state warningDays/blockDays) mỗi khi Super Admin đổi đại lý đang chọn, không cần
// useEffect đồng bộ thủ công.
function AgencyRulesForm({ agencyId }: { agencyId: string }) {
  const initial = loadRemittanceConfig(agencyId)
  const [warningDays, setWarningDays] = useState(initial.warningDays)
  const [blockDays, setBlockDays] = useState(initial.blockDays)
  const [saved, setSaved] = useState(false)

  const error = blockDays <= warningDays
    ? 'Số ngày khoá tạo đơn phải LỚN HƠN số ngày cảnh báo.'
    : null

  function handleSubmit() {
    if (error) return
    saveRemittanceConfig(agencyId, { warningDays, blockDays })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div
      style={{
        background: C_BG_WHITE,
        border: `1px solid ${C_BORDER}`,
        borderRadius: RADIUS_LG,
        padding: `${SPACE_4}px`,
        boxShadow: CARD_SHADOW,
        maxWidth: 560,
        width: '100%',
      }}
    >
      <h3 style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY, margin: `0 0 ${SPACE_4}px` }}>
        Ngưỡng theo số ngày trễ
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_4 }}>
        <NumberField
          label="Số ngày hiện cảnh báo"
          helper="Shop trễ từ số ngày này trở lên sẽ thấy cảnh báo khi bấm 'Tạo đơn hàng', nhưng vẫn tạo đơn bình thường."
          value={warningDays}
          onChange={setWarningDays}
        />
        <NumberField
          label="Số ngày khoá tạo đơn"
          helper="Shop trễ từ số ngày này trở lên sẽ bị tự động khoá, không tạo được đơn mới cho đến khi Agency duyệt bớt nợ."
          value={blockDays}
          onChange={setBlockDays}
        />
      </div>

      {error && (
        <div style={{ marginTop: SPACE_4, fontSize: FONT_SIZE_SM, color: '#DC2626' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: SPACE_6, display: 'flex', alignItems: 'center', gap: SPACE_3 }}>
        <button
          onClick={handleSubmit}
          disabled={!!error}
          style={{
            background: error ? '#D1D5DB' : C_ACTION,
            color: '#fff',
            border: 'none',
            borderRadius: RADIUS_BASE,
            padding: '6px 12px',
            fontSize: FONT_SIZE_BASE,
            fontWeight: FONT_WEIGHT_MEDIUM,
            cursor: error ? 'not-allowed' : 'pointer',
          }}
        >
          Lưu thay đổi
        </button>
        {saved && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: FONT_SIZE_SM, color: '#16A34A', fontWeight: FONT_WEIGHT_MEDIUM }}>
            <CheckCircleFilled /> Đã lưu — áp dụng ngay cho Web Shop &amp; Agency Admin của đại lý này
          </span>
        )}
      </div>
    </div>
  )
}

// Cấu hình ngưỡng cảnh báo/khoá tạo đơn RIÊNG TỪNG ĐẠI LÝ (không còn 1 bộ dùng chung cho toàn hệ
// thống) — mỗi đại lý có thể đặt mức khác nhau tuỳ mức độ tin tưởng với các shop của mình. Đọc/ghi
// qua orderStore.ts (loadRemittanceConfig(agencyId)/saveRemittanceConfig(agencyId, config),
// localStorage key `ghn_cash_remittance_config_v2`, lưu dạng mảng 1 dòng/đại lý — cùng convention
// với pricingStore.ts, nơi PriceTable cũng gắn agencyId trong 1 mảng dùng chung thay vì 1 key riêng
// mỗi đại lý) để Web Shop (chặn/cảnh báo tạo đơn, tra theo agencyId của shop) và Agency Admin
// (StatusCell, chip tổng, tra theo agency đang đăng nhập) dùng CHUNG một nguồn — sửa ở đây ảnh
// hưởng ngay, không cần build lại hay restart gì (đọc lại mỗi lần render, không cache). Đại lý
// chưa từng được cấu hình riêng rơi về mặc định 1/3 ngày (DEFAULT_REMITTANCE_CONFIG).
export default function CashRemittanceRules() {
  const [selectedAgencyId, setSelectedAgencyId] = useState(agenciesList[0]?.id ?? '')
  const selectedAgency = agenciesList.find(a => a.id === selectedAgencyId)

  return (
    <ConfigProvider theme={superAdminTheme}>
      <div style={{ padding: `${SPACE_6}px 80px`, background: '#F9FAFB', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: FONT_SIZE_2XL, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY, margin: `0 0 ${SPACE_2}px`, width: '100%', maxWidth: 560 }}>
          Quy tắc thanh toán tiền mặt
        </h2>
        <p style={{ fontSize: FONT_SIZE_BASE, color: C_TEXT_SECONDARY, margin: `0 0 ${SPACE_4}px`, width: '100%', maxWidth: 560, lineHeight: '20px' }}>
          Shop (bưu cục) thu hộ tiền mặt phí ship phải chuyển lại cho Agency quản lý mình. 2 ngưỡng
          dưới đây quyết định khi nào Web Shop hiện cảnh báo và khi nào tự động khoá tạo đơn, tính từ
          đơn tiền mặt chưa được Agency duyệt cũ nhất của shop (theo ngày lịch) — cấu hình RIÊNG cho
          từng đại lý, chọn đại lý cần sửa bên dưới.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE_3, padding: `8px ${SPACE_3}px`, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: RADIUS_BASE, width: '100%', maxWidth: 560, marginBottom: SPACE_6 }}>
          <span style={{ fontSize: FONT_SIZE_BASE, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap' }}>Đại lý:</span>
          <select
            value={selectedAgencyId}
            onChange={e => setSelectedAgencyId(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_MEDIUM, color: C_TEXT_PRIMARY, background: 'transparent', cursor: 'pointer' }}
          >
            {agenciesList.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
            ))}
          </select>
        </div>

        {selectedAgency && <AgencyRulesForm key={selectedAgency.id} agencyId={selectedAgency.id} />}
      </div>
    </ConfigProvider>
  )
}
