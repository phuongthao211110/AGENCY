// ── Tem QR (Cài đặt → Tem QR, Web Shop) ─────────────────────────────────────
// Mỗi "tem" là 1 mã QR Shop tự tạo (dán ở quầy/khu vực vật lý), khách quét dẫn thẳng vào trang
// "Tạo đơn hàng" của Shop (xem Orders.tsx — đọc query param `?qr=<id>`, tự ghi nhận lượt quét rồi
// mở sẵn form tạo đơn với ghi chú nguồn gốc). PROTOTYPE THUẦN — lưu localStorage, không có backend.

export interface QrCode {
  id: string
  shopId: string
  name: string
  active: boolean
  scanCount: number
  // null = không giới hạn lượt quét / không có hạn
  scanLimit: number | null
  expiresAt: string | null
  note: string
  createdAt: string
}

const STORAGE_KEY = 'ghn_qr_codes_v1'

function loadAll(): QrCode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as QrCode[]) : []
  } catch {
    return []
  }
}

function saveAll(list: QrCode[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* storage unavailable */ }
}

// Mã ngắn, dễ in lên tem vật lý — chữ hoa + số, không có ký tự dễ nhầm (0/O, 1/I) để đọc tay cũng
// rõ ràng (dù mục đích chính vẫn là quét QR, không phải gõ tay).
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateQrCodeId(): string {
  let out = ''
  for (let i = 0; i < 12; i++) out += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  return out
}

export function loadQrCodes(shopId: string): QrCode[] {
  return loadAll()
    .filter(q => q.shopId === shopId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function findQrCode(id: string): QrCode | null {
  return loadAll().find(q => q.id === id) ?? null
}

export function addQrCode(shopId: string, input: { name: string; expiresAt: string | null; scanLimit: number | null; note: string }): QrCode {
  const all = loadAll()
  const qr: QrCode = {
    id: generateQrCodeId(),
    shopId,
    name: input.name.trim(),
    active: true,
    scanCount: 0,
    scanLimit: input.scanLimit,
    expiresAt: input.expiresAt,
    note: input.note.trim(),
    createdAt: new Date().toISOString(),
  }
  all.push(qr)
  saveAll(all)
  return qr
}

// Sửa tem đã tạo (Chỉnh sửa tem QR) — đổi được tên/hạn/giới hạn/ghi chú/trạng thái cùng lúc, qua
// ĐÚNG 1 lần lưu. Không đổi `id`/`shopId`/`scanCount`/`createdAt` — lượt quét đã ghi nhận giữ
// nguyên dù sửa lại giới hạn (nếu giới hạn mới < scanCount hiện có, tem lập tức coi là hết lượt ở
// lần quét kế tiếp, xem `isQrCodeUsable()` — không cần xử lý gì thêm, logic đã tự đúng).
export function updateQrCode(id: string, input: { name: string; expiresAt: string | null; scanLimit: number | null; note: string; active: boolean }): void {
  const all = loadAll()
  const idx = all.findIndex(q => q.id === id)
  if (idx !== -1) {
    all[idx] = { ...all[idx], name: input.name.trim(), expiresAt: input.expiresAt, scanLimit: input.scanLimit, note: input.note.trim(), active: input.active }
    saveAll(all)
  }
}

export function setQrCodeActive(id: string, active: boolean): void {
  const all = loadAll()
  const idx = all.findIndex(q => q.id === id)
  if (idx !== -1) {
    all[idx] = { ...all[idx], active }
    saveAll(all)
  }
}

export function deleteQrCode(id: string): void {
  saveAll(loadAll().filter(q => q.id !== id))
}

// Tem CÒN DÙNG ĐƯỢC = đang bật, chưa hết hạn, và chưa chạm giới hạn lượt quét.
export function isQrCodeUsable(qr: QrCode): boolean {
  if (!qr.active) return false
  if (qr.expiresAt && new Date(qr.expiresAt).getTime() < Date.now()) return false
  if (qr.scanLimit !== null && qr.scanCount >= qr.scanLimit) return false
  return true
}

// Gọi khi khách THỰC SỰ quét mã (mở trang tạo đơn qua link tem) — tăng `scanCount` lên 1. Hàm tự
// kiểm tra `isQrCodeUsable()` TRƯỚC khi cộng — không tăng lượt quét của tem đã hết hạn/vô hiệu/hết
// lượt, để số "Lượt quét" không vượt quá giới hạn đã đặt.
export function recordQrScan(id: string): QrCode | null {
  const all = loadAll()
  const idx = all.findIndex(q => q.id === id)
  if (idx === -1) return null
  const qr = all[idx]
  if (!isQrCodeUsable(qr)) return null
  all[idx] = { ...qr, scanCount: qr.scanCount + 1 }
  saveAll(all)
  return all[idx]
}

// Link đích khi quét — trỏ thẳng vào trang Đơn hàng kèm query param để Orders.tsx tự nhận diện,
// ghi nhận lượt quét, rồi mở sẵn form "Tạo đơn hàng" với ghi chú nguồn gốc (xem Orders.tsx).
export function qrTargetUrl(id: string): string {
  return `${window.location.origin}/shop/orders?qr=${id}`
}
