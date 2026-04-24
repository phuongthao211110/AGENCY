import { ConfigProvider } from 'antd'
import { superAdminTheme } from '../../../../theme/platforms'
import {
  C_TEXT_PRIMARY,
  C_TEXT_SECONDARY,
  FONT_SIZE_2XL,
  FONT_SIZE_BASE,
  FONT_WEIGHT_SEMIBOLD,
  SPACE_6,
} from '../../../../theme/tokens'

export default function UserManagement() {
  return (
    <ConfigProvider theme={superAdminTheme}>
      <div style={{ padding: `${SPACE_6}px 80px`, maxWidth: 1024, background: '#F9FAFB', minHeight: '100%' }}>
        <h2 style={{ fontSize: FONT_SIZE_2XL, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY, margin: `0 0 ${SPACE_6}px` }}>
          Quản lý người dùng
        </h2>
        <p style={{ fontSize: FONT_SIZE_BASE, color: C_TEXT_SECONDARY }}>
          Tính năng đang được phát triển.
        </p>
      </div>
    </ConfigProvider>
  )
}
