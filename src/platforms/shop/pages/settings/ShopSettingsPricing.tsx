import { ConfigProvider } from 'antd'
import { shopTheme } from '../../../../theme/platforms'
import { C_TEXT_PRIMARY, FONT_SIZE_2XL, FONT_WEIGHT_SEMIBOLD, SPACE_6 } from '../../../../theme/tokens'

export default function ShopSettingsPricing() {
  return (
    <ConfigProvider theme={shopTheme}>
      <div style={{ padding: `${SPACE_6}px 80px`, background: '#F9FAFB', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: FONT_SIZE_2XL, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY, margin: 0 }}>
          Cài đặt giá bán
        </h2>
        <p style={{ marginTop: 20, color: '#6B7280' }}>Tính năng đang được phát triển.</p>
      </div>
    </ConfigProvider>
  )
}
