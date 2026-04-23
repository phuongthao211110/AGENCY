// ─── GHN Brand ───────────────────────────────────────────────────────────────

export const GHN_ORANGE = '#F05521'
export const GHN_ORANGE_DARK = '#C73F10'
export const GHN_ORANGE_LIGHT = '#FFF3EE'

// ─── Brand Colors ────────────────────────────────────────────────────────────

export const SUPER_ADMIN_BRAND = '#F05521'
export const SUPER_ADMIN_BRAND_DARK = '#C73F10'
export const SUPER_ADMIN_BRAND_LIGHT = '#FFF3EE'

export const AGENCY_BRAND = '#F05521'
export const AGENCY_BRAND_DARK = '#C73F10'
export const AGENCY_BRAND_LIGHT = '#FFF3EE'

export const SHOP_BRAND = '#F05521'
export const SHOP_BRAND_DARK = '#C73F10'
export const SHOP_BRAND_LIGHT = '#FFF3EE'

// ─── UI Canonical Tokens (dùng trong mọi page component) ─────────────────────
// Luôn import từ đây — KHÔNG define local const trong từng file

export const C_ACTION          = '#FF5200'  // primary buttons, active states
export const C_LINK            = '#3B82F6'  // entity names (agency, shop, order code) — always bold
export const C_TEXT_PRIMARY    = '#111827'  // body text, active page number
export const C_TEXT_SECONDARY  = '#6B7280'  // table header labels, sub-text
export const C_TEXT_LABEL      = '#4B5563'  // form field labels, nav buttons
export const C_TEXT_DISABLED   = '#9CA3AF'  // disabled input text
export const C_BORDER          = '#E5E7EB'  // all borders: input, card, divider, table rows
export const C_BG_HEADER       = '#F3F4F6'  // table header row background
export const C_BG_ACTIVE       = '#FFF4ED'  // sidebar active item, selected row
export const C_BG_WHITE        = '#FFFFFF'  // page content background

// ─── Semantic / Status Colors ────────────────────────────────────────────────

export const COLOR_SUCCESS = '#52C41A'
export const COLOR_WARNING = '#FAAD14'
export const COLOR_ERROR = '#FF4D4F'
export const COLOR_INFO = '#1890FF'
export const COLOR_ORANGE = '#FA8C16'

export const STATUS_SUCCESS    = '#00C853'  // badge text: TLHH, thành công
export const STATUS_SUCCESS_BG = '#D9F7E5'  // badge bg: TLHH
export const STATUS_WARNING    = '#F59E0B'  // tab count: đơn nháp
export const STATUS_INFO       = '#3B82F6'  // tab count: đã huỷ (same as C_LINK)

// ─── Neutral Colors (Ant Design overrides — dùng cho ConfigProvider) ─────────

export const COLOR_BG_PAGE = '#f5f5f5'
export const COLOR_BG_CARD = '#ffffff'
export const COLOR_BORDER = '#f0f0f0'
export const COLOR_BORDER_STRONG = '#d9d9d9'
export const COLOR_TEXT_SECONDARY = '#666666'
export const COLOR_TEXT_TERTIARY = '#999999'

// ─── Layout Constants ─────────────────────────────────────────────────────────

export const SIDER_WIDTH = 240   // sidebar width — fixed, không được đổi
export const HEADER_HEIGHT = 40  // header height — fixed, không được đổi
export const CONTENT_PADDING = 24
export const HEADER_PADDING_H = 24

// ─── Spacing Scale (4px base) ────────────────────────────────────────────────

export const SPACE_1 = 4
export const SPACE_2 = 8
export const SPACE_3 = 12
export const SPACE_4 = 16
export const SPACE_5 = 20
export const SPACE_6 = 24
export const SPACE_8 = 32
export const SPACE_10 = 40
export const SPACE_12 = 48

// ─── Shadow Scale ────────────────────────────────────────────────────────────

export const SHADOW_SM = '0 1px 4px rgba(0,0,0,0.06)'
export const SHADOW_MD = '2px 0 8px rgba(0,0,0,0.06)'
export const SHADOW_LG = '0 8px 32px rgba(0,0,0,0.18)'
export const SHADOW_FLOAT = '0 2px 8px rgba(0,0,0,0.12)'
export const CARD_SHADOW = '0px 1px 2px 0px rgba(0,0,0,0.05)'

// ─── Border Radius Scale ─────────────────────────────────────────────────────

export const RADIUS_SM   = 4    // checkbox, small tag
export const RADIUS_BASE = 6    // button, input, small card
export const RADIUS_MD   = 8    // (avoid — prefer 6 or 12)
export const RADIUS_LG   = 12   // form card, large container
export const RADIUS_XL   = 16   // modal, drawer
export const RADIUS_FULL = 500  // active page number circle

// ─── Typography ──────────────────────────────────────────────────────────────

export const FONT_FAMILY =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

export const FONT_SIZE_XS   = 11
export const FONT_SIZE_SM   = 12
export const FONT_SIZE_BASE = 14
export const FONT_SIZE_MD   = 15
export const FONT_SIZE_LG   = 16
export const FONT_SIZE_XL   = 18
export const FONT_SIZE_2XL  = 20

export const FONT_WEIGHT_NORMAL   = 400
export const FONT_WEIGHT_MEDIUM   = 500
export const FONT_WEIGHT_SEMIBOLD = 600
export const FONT_WEIGHT_BOLD     = 700
