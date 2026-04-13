import type { ThemeConfig } from 'antd'
import {
  SUPER_ADMIN_BRAND, SUPER_ADMIN_BRAND_LIGHT,
  AGENCY_BRAND, AGENCY_BRAND_LIGHT,
  SHOP_BRAND, SHOP_BRAND_LIGHT,
  FONT_FAMILY, FONT_SIZE_BASE,
  RADIUS_MD, RADIUS_LG,
  COLOR_BG_PAGE,
} from './tokens'

const baseComponents: ThemeConfig['components'] = {
  Card: {
    borderRadiusLG: RADIUS_LG,
  },
  Table: {
    borderRadius: RADIUS_MD,
    borderRadiusLG: RADIUS_LG,
  },
  Modal: {
    borderRadiusLG: RADIUS_LG,
  },
  Input: {
    borderRadius: RADIUS_MD,
    borderRadiusLG: RADIUS_MD,
  },
  Select: {
    borderRadius: RADIUS_MD,
    borderRadiusLG: RADIUS_MD,
  },
  Button: {
    borderRadius: RADIUS_MD,
    borderRadiusLG: RADIUS_MD,
  },
  Layout: {
    headerBg: '#ffffff',
    siderBg: '#ffffff',
    bodyBg: COLOR_BG_PAGE,
    headerHeight: 56,
  },
}

export const superAdminTheme: ThemeConfig = {
  token: {
    colorPrimary: SUPER_ADMIN_BRAND,
    colorLink: SUPER_ADMIN_BRAND,
    colorLinkHover: '#a01f24',
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE_BASE,
    borderRadius: RADIUS_MD,
    borderRadiusLG: RADIUS_LG,
  },
  components: {
    ...baseComponents,
    Menu: {
      itemSelectedBg: SUPER_ADMIN_BRAND_LIGHT,
      itemSelectedColor: SUPER_ADMIN_BRAND,
      itemHoverColor: SUPER_ADMIN_BRAND,
      itemHoverBg: SUPER_ADMIN_BRAND_LIGHT,
      itemActiveBg: SUPER_ADMIN_BRAND_LIGHT,
      iconSize: 15,
    },
  },
}

export const agencyAdminTheme: ThemeConfig = {
  token: {
    colorPrimary: AGENCY_BRAND,
    colorLink: AGENCY_BRAND,
    colorLinkHover: '#096dd9',
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE_BASE,
    borderRadius: RADIUS_MD,
    borderRadiusLG: RADIUS_LG,
  },
  components: {
    ...baseComponents,
    Menu: {
      itemSelectedBg: AGENCY_BRAND_LIGHT,
      itemSelectedColor: AGENCY_BRAND,
      itemHoverColor: AGENCY_BRAND,
      itemHoverBg: AGENCY_BRAND_LIGHT,
      itemActiveBg: AGENCY_BRAND_LIGHT,
      iconSize: 15,
    },
  },
}

export const shopTheme: ThemeConfig = {
  token: {
    colorPrimary: SHOP_BRAND,
    colorLink: SHOP_BRAND,
    colorLinkHover: '#389e0d',
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE_BASE,
    borderRadius: RADIUS_MD,
    borderRadiusLG: RADIUS_LG,
  },
  components: {
    ...baseComponents,
    Menu: {
      itemSelectedBg: SHOP_BRAND_LIGHT,
      itemSelectedColor: SHOP_BRAND,
      itemHoverColor: SHOP_BRAND,
      itemHoverBg: SHOP_BRAND_LIGHT,
      itemActiveBg: SHOP_BRAND_LIGHT,
      iconSize: 15,
    },
  },
}
