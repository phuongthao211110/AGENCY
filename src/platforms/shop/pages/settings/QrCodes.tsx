import { useState, useEffect, useRef } from 'react'
import { ConfigProvider } from 'antd'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { PlusOutlined, SearchOutlined, QrcodeOutlined, EditOutlined, DeleteOutlined, CloseOutlined, CopyOutlined, ArrowLeftOutlined, DownloadOutlined, PrinterOutlined, DownOutlined } from '@ant-design/icons'
import { shopTheme } from '../../../../theme/platforms'
import allShops from '../../../../mock-data/shops.json'
import { loadQrCodes, addQrCode, updateQrCode, setQrCodeActive, deleteQrCode, qrTargetUrl, type QrCode as QrCodeRecord } from '../../../../mock-data/qrStore'
import {
  C_ACTION,
  C_LINK,
  C_BORDER,
  C_TEXT_PRIMARY,
  C_TEXT_SECONDARY,
  C_TEXT_LABEL,
  C_BG_WHITE,
  C_BG_HEADER,
  FONT_SIZE_BASE,
  FONT_SIZE_SM,
  FONT_SIZE_2XL,
  FONT_WEIGHT_SEMIBOLD,
  FONT_WEIGHT_MEDIUM,
  FONT_WEIGHT_BOLD,
  RADIUS_BASE,
  RADIUS_LG,
  RADIUS_XL,
  SPACE_2,
  SPACE_3,
  SPACE_4,
} from '../../../../theme/tokens'

const MY_SHOP_ID = 'SHP001'

function fmtDateTime(iso?: string | null): string {
  if (!iso) return 'Không thời hạn'
  const d = new Date(iso)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

// ── Toggle (cùng pattern với BankAccounts.tsx) ──────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? C_ACTION : '#D1D5DB',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 2,
        left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_MEDIUM, color: C_TEXT_LABEL }}>{children}</label>
}

function fieldInputStyle(focused: boolean): React.CSSProperties {
  return {
    padding: '10px 14px',
    border: `1px solid ${focused ? '#FFA274' : C_BORDER}`,
    borderRadius: RADIUS_BASE,
    fontSize: FONT_SIZE_BASE, color: C_TEXT_PRIMARY,
    outline: 'none', background: C_BG_WHITE,
    transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box',
  }
}

// Chuyển ISO ↔ chuỗi "YYYY-MM-DDTHH:mm" cho input type="datetime-local" (input này không tự nhận
// ISO có "Z"/timezone, phải tự cắt theo giờ LOCAL của trình duyệt) — dùng khi mở modal Sửa để hiện
// đúng giờ hết hạn đã lưu trước đó.
function isoToLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export type QrFormInput = { name: string; expiresAt: string | null; scanLimit: number | null; note: string; active: boolean }

// ── Modal: Thêm / Chỉnh sửa tem QR — dùng chung 1 form, chỉ khác tiêu đề, nút lưu, và khối toggle
// "Đang hoạt động" (CHỈ hiện ở chế độ sửa — tem mới tạo luôn mặc định bật, không cần hỏi lại). ────
function QrFormModal({ mode, initial, onSave, onClose }: {
  mode: 'add' | 'edit'
  initial?: QrCodeRecord
  onSave: (input: QrFormInput) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [expiresAt, setExpiresAt] = useState(isoToLocalInput(initial?.expiresAt ?? null))
  const [scanLimit, setScanLimit] = useState(initial?.scanLimit != null ? String(initial.scanLimit) : '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [active, setActive] = useState(initial?.active ?? true)
  const [focus, setFocus] = useState<'name' | 'exp' | 'limit' | 'note' | null>(null)

  const canSubmit = name.trim().length > 0

  function handleSubmit() {
    if (!canSubmit) return
    onSave({
      name: name.trim(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      scanLimit: scanLimit.trim() ? Math.max(1, parseInt(scanLimit, 10) || 1) : null,
      note: note.trim(),
      active,
    })
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 480, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto', background: C_BG_WHITE, borderRadius: RADIUS_XL, boxShadow: '0 16px 48px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${C_BORDER}` }}>
          <h3 style={{ fontSize: FONT_SIZE_2XL, fontWeight: FONT_WEIGHT_BOLD, color: C_TEXT_PRIMARY, margin: 0 }}>{mode === 'add' ? 'Thêm tem QR' : 'Chỉnh sửa tem QR'}</h3>
          <CloseOutlined onClick={onClose} style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, fontSize: 16 }} />
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: SPACE_4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_2 }}>
            <FieldLabel>Tên tem</FieldLabel>
            <input
              value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Quầy 1"
              onFocus={() => setFocus('name')} onBlur={() => setFocus(null)}
              style={fieldInputStyle(focus === 'name')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_2 }}>
            <FieldLabel>Thời điểm hết hạn</FieldLabel>
            <input
              type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
              onFocus={() => setFocus('exp')} onBlur={() => setFocus(null)}
              style={fieldInputStyle(focus === 'exp')}
            />
            <span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY }}>Bỏ trống = tem không thời hạn</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_2 }}>
            <FieldLabel>Giới hạn lượt quét</FieldLabel>
            <input
              type="number" min={1} value={scanLimit} onChange={e => setScanLimit(e.target.value)}
              placeholder="Nhập số lượt quét tối đa"
              onFocus={() => setFocus('limit')} onBlur={() => setFocus(null)}
              style={fieldInputStyle(focus === 'limit')}
            />
            <span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY }}>Bỏ trống = không giới hạn</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_2 }}>
            <FieldLabel>Ghi chú</FieldLabel>
            <textarea
              value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú nội bộ" rows={3}
              onFocus={() => setFocus('note')} onBlur={() => setFocus(null)}
              style={{ ...fieldInputStyle(focus === 'note'), resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          {mode === 'edit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE_2, paddingTop: SPACE_2, borderTop: `1px solid ${C_BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACE_3 }}>
                <FieldLabel>Đang hoạt động:</FieldLabel>
                <Toggle checked={active} onChange={setActive} />
              </div>
              <span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY }}>
                Tắt để vô hiệu hoá tem — mọi phiên khách đang mở sẽ bị thu hồi ngay.
              </span>
            </div>
          )}
        </div>

        <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              padding: '9px 20px', background: canSubmit ? C_ACTION : '#D1D5DB', color: '#fff', border: 'none',
              borderRadius: RADIUS_BASE, fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_SEMIBOLD,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {mode === 'add' ? 'Thêm tem QR' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Full-screen: Xem tem QR — gộp mã QR thật + bản xem tem cách điệu + tải
// (PNG/PDF) + in + copy link, theo đúng 1 ảnh tham khảo mobile app thật. Che
// TOÀN BỘ viewport (kể cả sidebar) — không phải modal, không có overlay tối
// phía sau — khớp đúng cảm giác "màn hình riêng" của ảnh tham khảo, đóng lại
// bằng nút back thay vì X góc phải như các modal khác trong trang.
function QrStickerFullscreen({ qr, shopName, onClose }: { qr: QrCodeRecord; shopName: string; onClose: () => void }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const link = qrTargetUrl(qr.id)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(link, { width: 200, margin: 1, color: { dark: '#111827', light: '#FFFFFF' } })
      .then(url => { if (!cancelled) setDataUrl(url) })
      .catch(() => { if (!cancelled) setDataUrl(null) })
    return () => { cancelled = true }
  }, [link])

  // Chụp lại ĐÚNG khối thẻ tem cách điệu (nền cam + tên shop + QR + nút kêu gọi) thành ảnh —
  // dùng chung cho cả 3 nút Tải PNG/Tải PDF/In, để 3 nơi này luôn xuất ra cùng 1 thiết kế.
  async function renderCardCanvas(): Promise<HTMLCanvasElement | null> {
    if (!cardRef.current) return null
    return html2canvas(cardRef.current, { backgroundColor: null, scale: 2 })
  }

  async function handleDownload(format: 'png' | 'pdf') {
    setDownloadMenuOpen(false)
    const canvas = await renderCardCanvas()
    if (!canvas) return
    const fileName = `tem-qr-${qr.name.replace(/\s+/g, '-')}`
    if (format === 'png') {
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `${fileName}.png`
      a.click()
    } else {
      const pdf = new jsPDF({ unit: 'px', format: [canvas.width, canvas.height] })
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${fileName}.pdf`)
    }
  }

  // Mở tab mới chỉ chứa đúng ảnh tem rồi gọi window.print() của trình duyệt (chọn máy in/lưu PDF
  // qua hộp thoại in có sẵn) — tách khỏi tab hiện tại để không cần CSS @media print che hết
  // sidebar/topbar của trang Web Shop.
  async function handlePrint() {
    const canvas = await renderCardCanvas()
    if (!canvas) return
    const printUrl = canvas.toDataURL('image/png')
    const printWindow = window.open('', '_blank', 'width=480,height=640')
    if (!printWindow) return
    printWindow.document.write(`<html><head><title>${qr.name}</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;"><img src="${printUrl}" style="max-width:100%;" onload="window.print()" /></body></html>`)
    printWindow.document.close()
  }

  function handleCopyLink() {
    // navigator.clipboard.writeText() trả về Promise — lỗi (quyền clipboard bị từ chối) xảy ra
    // BẤT ĐỒNG BỘ, try/catch thường KHÔNG bắt được (bug đã phát hiện qua UAT: lỗi rơi thành
    // unhandled promise rejection, crash trang) — phải .catch() thẳng trên promise mới chặn được.
    navigator.clipboard.writeText(link).catch(() => { /* clipboard unavailable */ })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 2000, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: `1px solid ${C_BORDER}`, flexShrink: 0 }}>
        <ArrowLeftOutlined onClick={onClose} style={{ cursor: 'pointer', fontSize: 18, color: C_TEXT_PRIMARY }} />
        <span style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY }}>Xem tem QR</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 32px', maxWidth: 420, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <span style={{ fontSize: FONT_SIZE_2XL, fontWeight: FONT_WEIGHT_BOLD, color: C_TEXT_PRIMARY, marginBottom: 16 }}>{qr.name}</span>

        <div
          ref={cardRef}
          style={{
            width: '100%', borderRadius: RADIUS_XL, padding: '16px 16px 36px', position: 'relative', overflow: 'hidden',
            background: 'repeating-linear-gradient(135deg, #FF8A3D 0px, #FF8A3D 16px, #FF7A1A 16px, #FF7A1A 32px)',
          }}
        >
          <div style={{ background: '#fff', borderRadius: RADIUS_LG, padding: '10px 16px', textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: FONT_SIZE_SM, fontWeight: FONT_WEIGHT_SEMIBOLD, color: '#E64A19' }}>Bưu cục</div>
            <div style={{ fontSize: FONT_SIZE_2XL, fontWeight: FONT_WEIGHT_BOLD, color: '#E64A19', textTransform: 'uppercase' }}>{shopName}</div>
          </div>

          <div style={{ position: 'relative', background: '#fff', borderRadius: RADIUS_LG, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dataUrl ? <img src={dataUrl} alt={`Mã QR ${qr.name}`} style={{ width: 180, height: 180, display: 'block' }} /> : <div style={{ width: 180, height: 180 }} />}
            <div style={{
              position: 'absolute', left: '50%', bottom: -18, transform: 'translateX(-50%)',
              background: '#2563EB', color: '#fff', fontSize: FONT_SIZE_SM, fontWeight: FONT_WEIGHT_BOLD,
              padding: '8px 18px', borderRadius: 999, whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}>
              QUÉT MÃ TẠO ĐƠN NGAY
            </div>
          </div>
        </div>

        <span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY, marginTop: 20, textAlign: 'center', wordBreak: 'break-all' }}>{link}</span>

        <div style={{ position: 'relative', width: '100%', marginTop: 20 }}>
          <button
            onClick={() => setDownloadMenuOpen(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', border: `1px solid ${C_BORDER}`, borderRadius: RADIUS_BASE, background: '#fff', fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY, cursor: 'pointer' }}
          >
            <DownloadOutlined /> Tải xuống <DownOutlined style={{ fontSize: 10 }} />
          </button>
          {downloadMenuOpen && (
            <>
              <div onClick={() => setDownloadMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: RADIUS_BASE, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 11, overflow: 'hidden' }}>
                <div onClick={() => handleDownload('png')} style={{ padding: '10px 16px', fontSize: FONT_SIZE_BASE, color: C_TEXT_PRIMARY, cursor: 'pointer' }}>Tải PNG</div>
                <div onClick={() => handleDownload('pdf')} style={{ padding: '10px 16px', fontSize: FONT_SIZE_BASE, color: C_TEXT_PRIMARY, cursor: 'pointer', borderTop: `1px solid ${C_BORDER}` }}>Tải PDF</div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 10 }}>
          <button onClick={handlePrint} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', border: `1px solid ${C_BORDER}`, borderRadius: RADIUS_BASE, background: '#fff', fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY, cursor: 'pointer' }}>
            <PrinterOutlined /> In tem QR
          </button>
          <button onClick={handleCopyLink} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', border: `1px solid ${C_BORDER}`, borderRadius: RADIUS_BASE, background: '#fff', fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY, cursor: 'pointer' }}>
            <CopyOutlined /> Copy URL
          </button>
        </div>
      </div>
    </div>
  )
}

const TABS: { key: 'all' | 'active' | 'inactive'; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang hoạt động' },
  { key: 'inactive', label: 'Đã vô hiệu' },
]

export default function QrCodes() {
  const [, tick] = useState(0)
  const refresh = () => tick(n => n + 1)
  const [tab, setTab] = useState<'all' | 'active' | 'inactive'>('all')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editQr, setEditQr] = useState<QrCodeRecord | null>(null)
  const [stickerQr, setStickerQr] = useState<QrCodeRecord | null>(null)

  const shopName = allShops.find(s => s.id === MY_SHOP_ID)?.name ?? MY_SHOP_ID
  const all = loadQrCodes(MY_SHOP_ID)
  const q = search.trim().toLowerCase()
  const filtered = all
    .filter(item => tab === 'all' ? true : tab === 'active' ? item.active : !item.active)
    .filter(item => !q || item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q))

  function handleAdd(input: QrFormInput) {
    addQrCode(MY_SHOP_ID, input)
    setShowAddModal(false)
    refresh()
  }

  function handleEditSave(input: QrFormInput) {
    if (!editQr) return
    updateQrCode(editQr.id, input)
    setEditQr(null)
    refresh()
  }

  function handleToggle(id: string, next: boolean) {
    setQrCodeActive(id, next)
    refresh()
  }

  function handleDelete(qr: QrCodeRecord) {
    const ok = window.confirm(`Xoá tem QR "${qr.name}"? Mã QR sẽ ngừng hoạt động ngay — khách quét lại sẽ không vào được trang tạo đơn nữa. Không thể khôi phục.`)
    if (!ok) return
    deleteQrCode(qr.id)
    refresh()
  }

  const cell = (children: React.ReactNode, flex = '1 0 0', minWidth = 100, align: 'left' | 'right' = 'left') => (
    <div style={{ flex, minWidth, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {children}
    </div>
  )

  return (
    <ConfigProvider theme={shopTheme}>
      <div style={{ padding: '16px 24px 24px', background: '#fff', minHeight: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACE_4 }}>
          <h1 style={{ fontSize: 24, fontWeight: FONT_WEIGHT_SEMIBOLD, color: C_TEXT_PRIMARY, margin: 0 }}>Tem QR</h1>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: C_ACTION, color: '#fff', border: 'none', borderRadius: RADIUS_BASE, fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_SEMIBOLD, cursor: 'pointer' }}
          >
            <PlusOutlined /> Thêm tem QR
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: SPACE_3 }}>
          {TABS.map(t => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '8px 16px', borderRadius: RADIUS_BASE, fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_SEMIBOLD,
                  border: active ? `1px solid ${C_BORDER}` : '1px solid transparent',
                  background: active ? '#fff' : 'transparent',
                  color: active ? C_TEXT_PRIMARY : C_TEXT_SECONDARY,
                  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <div style={{ position: 'relative', marginBottom: SPACE_4 }}>
          <SearchOutlined style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C_TEXT_SECONDARY, fontSize: 14 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm"
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 36px', border: `1px solid ${C_BORDER}`, borderRadius: RADIUS_BASE, fontSize: FONT_SIZE_BASE, color: C_TEXT_PRIMARY, outline: 'none' }}
          />
        </div>

        <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: RADIUS_LG, overflow: 'hidden' }}>
          <div style={{ display: 'flex', background: C_BG_HEADER }}>
            {cell(<span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY, fontWeight: FONT_WEIGHT_SEMIBOLD }}>Tên tem</span>, '1.3 0 0', 180)}
            {cell(<span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY, fontWeight: FONT_WEIGHT_SEMIBOLD }}>Trạng thái</span>, '1 0 0', 150)}
            {cell(<span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY, fontWeight: FONT_WEIGHT_SEMIBOLD }}>Lượt quét</span>, '0.9 0 0', 130)}
            {cell(<span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY, fontWeight: FONT_WEIGHT_SEMIBOLD }}>Hết hạn</span>, '0.9 0 0', 130)}
            {cell(<span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY, fontWeight: FONT_WEIGHT_SEMIBOLD }}>Ghi chú</span>, '1.1 0 0', 150)}
            {cell(<span style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY, fontWeight: FONT_WEIGHT_SEMIBOLD }}>Thao tác</span>, '0.8 0 0', 120, 'right')}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', fontSize: FONT_SIZE_BASE, color: C_TEXT_SECONDARY, borderTop: `1px solid ${C_BORDER}` }}>
              {all.length === 0 ? 'Chưa có tem QR nào — bấm "Thêm tem QR" để tạo tem đầu tiên.' : 'Không tìm thấy tem phù hợp.'}
            </div>
          ) : filtered.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', borderTop: `1px solid ${C_BORDER}` }}>
              {cell(
                <div>
                  <div style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_BOLD, color: C_LINK }}>{item.name}</div>
                  <div style={{ fontSize: FONT_SIZE_SM, color: C_TEXT_SECONDARY, marginTop: 1 }}>{item.id}</div>
                </div>,
                '1.3 0 0', 180,
              )}
              {cell(
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Toggle checked={item.active} onChange={v => handleToggle(item.id, v)} />
                  <span style={{ fontSize: FONT_SIZE_BASE, fontWeight: FONT_WEIGHT_MEDIUM, color: item.active ? '#16A34A' : C_TEXT_SECONDARY }}>
                    {item.active ? 'Đang hoạt động' : 'Đã vô hiệu'}
                  </span>
                </div>,
                '1 0 0', 150,
              )}
              {cell(<span style={{ fontSize: FONT_SIZE_BASE, color: C_TEXT_PRIMARY }}>{item.scanCount}/{item.scanLimit ?? 'Không giới hạn'}</span>, '0.9 0 0', 130)}
              {cell(<span style={{ fontSize: FONT_SIZE_BASE, color: C_TEXT_PRIMARY }}>{fmtDateTime(item.expiresAt)}</span>, '0.9 0 0', 130)}
              {cell(<span style={{ fontSize: FONT_SIZE_BASE, color: C_TEXT_SECONDARY }}>{item.note || '—'}</span>, '1.1 0 0', 150)}
              {cell(
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <QrcodeOutlined onClick={() => setStickerQr(item)} title="Xem tem QR" style={{ cursor: 'pointer', color: C_LINK, fontSize: 16 }} />
                  <EditOutlined onClick={() => setEditQr(item)} title="Chỉnh sửa" style={{ cursor: 'pointer', color: C_TEXT_SECONDARY, fontSize: 16 }} />
                  <DeleteOutlined onClick={() => handleDelete(item)} title="Xoá" style={{ cursor: 'pointer', color: '#EF4444', fontSize: 16 }} />
                </div>,
                '0.8 0 0', 120, 'right',
              )}
            </div>
          ))}
        </div>
      </div>

      {showAddModal && <QrFormModal mode="add" onSave={handleAdd} onClose={() => setShowAddModal(false)} />}
      {editQr && <QrFormModal mode="edit" initial={editQr} onSave={handleEditSave} onClose={() => setEditQr(null)} />}
      {stickerQr && <QrStickerFullscreen qr={stickerQr} shopName={shopName} onClose={() => setStickerQr(null)} />}
    </ConfigProvider>
  )
}
