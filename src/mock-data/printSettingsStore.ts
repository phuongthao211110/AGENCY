// ── Shared print settings store ──────────────────────────────────────────────
// Nguồn dữ liệu chung cho khổ giấy + checklist hiển thị trên phiếu in, dùng cả ở
// "Cài đặt đơn hàng" (nơi cấu hình mặc định) lẫn "In đơn hàng" (nơi áp dụng lên đơn thật).
// "Persistence" via localStorage — prototype only, giống pattern của orderStore.ts.

export interface PrintKindConfig {
  autoPrint: boolean
  paperSize: string
  showSender: boolean
  showProduct: boolean
  showWeight: boolean
  // Không có field tương ứng trên Order (orderStore.ts) — chỉ ảnh hưởng preview mẫu ở
  // "Cài đặt đơn hàng", KHÔNG áp dụng được lên phiếu in đơn thật vì không có dữ liệu.
  showSize: boolean
  showCOD: boolean
  showShipFee: boolean
  showNote: boolean
  showShopCode: boolean
  showShopLogo: boolean
}

export interface PrintSettingsState {
  goods: PrintKindConfig
  letter: PrintKindConfig
}

const STORAGE_KEY = 'ghn_print_settings_v1'

const DEFAULT_GOODS: PrintKindConfig = {
  autoPrint: true, paperSize: '80x80',
  showSender: true, showProduct: true, showWeight: true, showSize: true,
  showCOD: true, showShipFee: true, showNote: true, showShopCode: false, showShopLogo: false,
}

const DEFAULT_LETTER: PrintKindConfig = {
  autoPrint: true, paperSize: '80x80',
  showSender: true, showProduct: true, showWeight: false, showSize: false,
  showCOD: false, showShipFee: true, showNote: true, showShopCode: false, showShopLogo: false,
}

function load(): PrintSettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        goods: { ...DEFAULT_GOODS, ...parsed.goods },
        letter: { ...DEFAULT_LETTER, ...parsed.letter },
      }
    }
  } catch {
    // ignore — dùng default
  }
  return { goods: { ...DEFAULT_GOODS }, letter: { ...DEFAULT_LETTER } }
}

export const printSettings: PrintSettingsState = load()

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(printSettings))
  } catch {
    // ignore
  }
}

export function updatePrintSetting<K extends keyof PrintKindConfig>(
  kind: keyof PrintSettingsState,
  key: K,
  value: PrintKindConfig[K],
): void {
  printSettings[kind][key] = value
  persist()
}
