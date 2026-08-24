import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftOutlined, DownloadOutlined, FileExcelOutlined, UploadOutlined, EditOutlined, CloseOutlined,
  EnvironmentOutlined, TruckOutlined, LeftOutlined, RightOutlined, CheckCircleFilled, SearchOutlined,
  PlusOutlined, DownOutlined, CheckOutlined,
} from '@ant-design/icons'
import * as XLSX from 'xlsx'
import { addOrder } from '../../../mock-data/orderStore'
import allShops from '../../../mock-data/shops.json'
import { contactsForShop, addContact, updateContact, type ShopContact } from '../../../mock-data/shopContactStore'

// ── Design tokens ────────────────────────────────────────────
const C_ACTION         = '#FF5200'
const C_LINK           = '#3B82F6'
const C_TEXT_PRIMARY   = '#111827'
const C_TEXT_SECONDARY = '#6B7280'
const C_BORDER         = '#E5E7EB'
const C_BG_HEADER      = '#F3F4F6'

const CURRENT_AGENCY_ID = 'AGN001'
const agencyShops = allShops.filter(s => s.agencyId === CURRENT_AGENCY_ID)

function fmtDateInput(d: Date) {
  return d.toISOString().slice(0, 10)
}

// ── Import đơn hàng — 1 file dùng chung cho cả Hàng hoá và Thư, phân biệt
// nhau qua cột "Loại đơn" trên từng dòng (thay vì phải chọn loại rồi tải 2
// template riêng) — mỗi dòng tự biết cần dispatch GHN ngay hay chờ đại lý
// chọn hub gửi 247Express — các cột không áp dụng cho Thư (VD: COD) được tự động
// bỏ qua khi import thay vì chặn thành lỗi, vì đó là do dùng chung file chứ không
// phải lỗi nhập liệu thật. ─────────────────────────────────────────────────
type OrderKind = 'goods' | 'letter'

const IMPORT_HEADERS = [
  'Mã shop', 'Loại đơn', 'Tên người nhận', 'Số điện thoại',
  'Địa chỉ (Số nhà/ngõ, Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành)',
  'Mã đơn shop', 'Sản phẩm', 'Khối lượng (Gram)', 'Dài (cm)', 'Rộng (cm)', 'Cao (cm)',
  'Tiền thu hộ COD (đ)', 'Giá trị hàng khai giá (đ)', 'Phí ship (giá bán shop, đ)', 'Trả ship',
  'Phí thu tiền khi giao thất bại (đ)', 'Ghi chú xem hàng', 'Ghi chú đơn hàng', 'Ca lấy hàng',
]

const IMPORT_SAMPLE_ROWS: (string | number)[][] = [
  [agencyShops[0]?.id ?? '', 'Hàng hoá', 'Huỳnh Huy Phong', '373336649', '7/28, Thành Thái, Phường 14, Quận 10, Hồ Chí Minh', '', 'Áo thun', 1000, 10, 10, 10, 5000000, 0, 25000, 'Shop trả', 0, 'Không cho xem hàng', '', ''],
  [agencyShops[0]?.id ?? '', 'Thư', 'Trịnh Mỹ Ngọc Tuyền', '981234521', '150/26 Nguyễn Trãi, Mỹ Long, Thành phố Long Xuyên, An Giang', 'DH-0021', 'Hợp đồng thuê nhà', 200, 10, 10, 10, 50000, 0, 15000, 'Khách trả', 50000, 'Không cho xem hàng', 'Giao giờ hành chính', 'Sáng (8h-12h)'],
]

function downloadImportTemplate() {
  const wsImport = XLSX.utils.aoa_to_sheet([IMPORT_HEADERS, ...IMPORT_SAMPLE_ROWS])
  wsImport['!cols'] = IMPORT_HEADERS.map((h) => ({ wch: Math.max(14, h.length + 2) }))

  const wsShops = XLSX.utils.aoa_to_sheet([
    ['Mã shop', 'Tên shop'],
    ...agencyShops.map(s => [s.id, s.name]),
  ])
  wsShops['!cols'] = [{ wch: 12 }, { wch: 32 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsImport, 'Nhập đơn hàng')
  XLSX.utils.book_append_sheet(wb, wsShops, 'Danh sách Shop')
  XLSX.writeFile(wb, 'mau-import-don-hang.xlsx')
}

type ImportRow = {
  rowIndex: number
  raw: Record<string, string>
  errors: string[]
}

const shopIds = new Set(agencyShops.map(s => s.id))

// Cột "Loại đơn" chấp nhận "Hàng hoá"/"Hàng hóa" hoặc "Thư" (không phân biệt hoa/thường,
// khoảng trắng đầu-cuối) — trả về null nếu người dùng điền giá trị khác để báo lỗi.
function deriveOrderKind(orderKindRaw: string): OrderKind | null {
  const v = orderKindRaw.trim().toLowerCase()
  if (v === 'hàng hoá' || v === 'hàng hóa') return 'goods'
  if (v === 'thư' || v === 'thư, tài liệu' || v === 'thư tài liệu') return 'letter'
  return null
}

function validateRawRow(raw: Record<string, string>): string[] {
  const errors: string[] = []
  const kind = deriveOrderKind(raw.orderKindRaw)
  if (!kind) errors.push('Loại đơn phải là "Hàng hoá" hoặc "Thư"')
  if (!raw.shopId) errors.push('Thiếu Mã shop')
  else if (!shopIds.has(raw.shopId)) errors.push(`Không tìm thấy shop "${raw.shopId}"`)
  if (!raw.receiverName) errors.push('Thiếu Tên người nhận')
  if (!raw.receiverPhone) errors.push('Thiếu Số điện thoại')
  if (!raw.receiverAddress) errors.push('Thiếu Địa chỉ')
  if (!raw.weight || isNaN(Number(raw.weight)) || Number(raw.weight) <= 0) errors.push('Khối lượng phải là số dương')
  else if (Number(raw.weight) > 20000) errors.push('Khối lượng tối đa 20.000 gram')
  for (const [field, label] of [['length', 'Dài'], ['width', 'Rộng'], ['height', 'Cao']] as const) {
    const v = raw[field]
    if (v && (isNaN(Number(v)) || Number(v) <= 0 || Number(v) > 200)) errors.push(`${label} phải từ 1-200 cm`)
  }
  // Thư không áp dụng COD — tự động bỏ qua giá trị nhập (nếu có) khi import thay vì chặn
  // thành lỗi, vì cột COD dùng chung file với Hàng hoá nên không phải lỗi nhập liệu thật.
  if (kind === 'goods' && raw.cod && isNaN(Number(raw.cod))) errors.push('COD phải là số')
  if (!raw.fee || isNaN(Number(raw.fee)) || Number(raw.fee) < 0) errors.push('Phí ship phải là số không âm')
  if (raw.declaredValue && (isNaN(Number(raw.declaredValue)) || Number(raw.declaredValue) < 0)) errors.push('Giá trị hàng khai giá phải là số không âm')
  if (raw.codFailureFee && (isNaN(Number(raw.codFailureFee)) || Number(raw.codFailureFee) < 0)) errors.push('Phí thu tiền khi giao thất bại phải là số không âm')
  return errors
}

function parseImportSheet(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Không đọc được file'))
    reader.onload = () => {
      try {
        const wb = XLSX.read(reader.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const grid = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][]
        const dataRows = grid.slice(1).filter(r => r.some(c => String(c ?? '').trim() !== ''))

        const parsed: ImportRow[] = dataRows.map((r, i) => {
          const get = (col: number) => String(r[col] ?? '').trim()
          // Cột số (khối lượng, kích thước, COD, phí ship) bỏ dấu chấm/phẩy phân cách hàng nghìn
          // trước khi parse — người dùng thường gõ tay kiểu VN "5.000.000" hoặc "25,000" vào
          // file Excel thật, nếu không strip thì Number("25.000") sẽ ra 25 (sai) thay vì 25000.
          const getNum = (col: number) => get(col).replace(/[.,\s]/g, '')
          // Dài/Rộng/Cao không bắt buộc trong file — để trống thì mặc định 10cm mỗi chiều.
          // senderContactId để trống lúc parse — resolve mặc định (liên hệ đầu tiên của shop)
          // ngay khi render dòng, cho phép người dùng đổi qua picker "Bên gửi".
          const raw = {
            shopId: get(0), orderKindRaw: get(1), receiverName: get(2), receiverPhone: get(3),
            receiverAddress: get(4), shopOrderCode: get(5), product: get(6), weight: getNum(7),
            length: getNum(8) || '10', width: getNum(9) || '10', height: getNum(10) || '10',
            cod: getNum(11), declaredValue: getNum(12), fee: getNum(13), feeType: get(14),
            codFailureFee: getNum(15), viewGoodsPolicy: get(16), orderNote: get(17), pickupShift: get(18),
            senderContactId: '',
          }
          return { rowIndex: i + 2, raw, errors: validateRawRow(raw) }
        })
        resolve(parsed)
      } catch {
        reject(new Error('File không đúng định dạng — vui lòng dùng đúng template'))
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

export default function AgencyOrdersImport() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<ImportRow[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [reviewTab, setReviewTab] = useState<'valid' | 'invalid'>('valid')
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const [editingProductRow, setEditingProductRow] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [importResult, setImportResult] = useState<{ total: number; goods: number; letter: number } | null>(null)

  // ── "Bên gửi" — picker chọn 1 trong nhiều liên hệ gửi hàng của shop, cho phép thêm/sửa
  // liên hệ ngay trong popover (xem shopContactStore.ts) ──────────────────────────────
  const [contactPickerRow, setContactPickerRow] = useState<number | null>(null)
  const [contactSearch, setContactSearch] = useState('')
  const [addingContact, setAddingContact] = useState(false)
  const [newContactForm, setNewContactForm] = useState({ name: '', phone: '', address: '' })
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [editContactForm, setEditContactForm] = useState({ name: '', phone: '', address: '' })
  const [contactsVersion, setContactsVersion] = useState(0) // bump để re-render sau khi add/update contact (localStorage không tự trigger render)

  const closeContactPicker = () => {
    setContactPickerRow(null)
    setContactSearch('')
    setAddingContact(false)
    setEditingContactId(null)
  }

  useEffect(() => {
    if (contactPickerRow === null) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-contact-picker]')) closeContactPicker()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [contactPickerRow])

  const cancelImport = () => navigate('/agency-admin/orders')

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setParseError('')
    setRows(null)
    setSelectedRows(new Set())
    setCurrentPage(1)
    setPageInput('1')
    try {
      const parsed = await parseImportSheet(file)
      setRows(parsed)
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Không đọc được file')
    }
  }

  // Sửa 1 field ngay trong bảng review (Loại đơn, COD, Phí ship, Trả ship, Khối lượng, Sản phẩm) —
  // re-validate lại đúng dòng đó ngay sau khi sửa, có thể chuyển dòng từ Lỗi -> Hợp lệ hoặc ngược lại.
  const updateRowField = (rowIndex: number, field: string, value: string) => {
    setRows(prev => (prev ?? []).map(r => {
      if (r.rowIndex !== rowIndex) return r
      const raw = { ...r.raw, [field]: value }
      return { ...r, raw, errors: validateRawRow(raw) }
    }))
  }

  const removeRows = (rowIndexes: Iterable<number>) => {
    const toRemove = new Set(rowIndexes)
    setRows(prev => (prev ?? []).filter(r => !toRemove.has(r.rowIndex)))
    setSelectedRows(prev => { const next = new Set(prev); toRemove.forEach(i => next.delete(i)); return next })
  }

  const toggleRowSelected = (rowIndex: number) => {
    setSelectedRows(prev => { const next = new Set(prev); next.has(rowIndex) ? next.delete(rowIndex) : next.add(rowIndex); return next })
  }

  const validRows = (rows ?? []).filter(r => r.errors.length === 0)
  const invalidRows = (rows ?? []).filter(r => r.errors.length > 0)
  const visibleRows = reviewTab === 'valid' ? validRows : invalidRows
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every(r => selectedRows.has(r.rowIndex))
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pagedRows = visibleRows.slice((safePage - 1) * pageSize, safePage * pageSize)

  const goToPage = (p: number) => { const next = Math.min(Math.max(1, p), totalPages); setCurrentPage(next); setPageInput(String(next)) }
  const switchReviewTab = (tab: 'valid' | 'invalid') => { setReviewTab(tab); setSelectedRows(new Set()); setCurrentPage(1); setPageInput('1') }

  const handleConfirm = () => {
    setImporting(true)
    const now = new Date()
    const createdAt = fmtDateInput(now)
    let goodsImported = 0
    let letterImported = 0
    validRows.forEach((r, i) => {
      const sendKind = deriveOrderKind(r.raw.orderKindRaw) ?? 'goods'
      const isGoods = sendKind === 'goods'
      if (isGoods) goodsImported++; else letterImported++
      const shop = agencyShops.find(s => s.id === r.raw.shopId)
      // "Bên gửi" — dùng đúng liên hệ đã chọn ở picker (senderContactId); nếu dòng chưa mở
      // picker lần nào (senderContactId rỗng) thì rơi về liên hệ đầu tiên của shop, rồi mới
      // tới field mặc định trên shop (ownerName/phone/address) nếu shop chưa có liên hệ nào.
      const shopContacts = contactsForShop(r.raw.shopId)
      const contact = shopContacts.find(c => c.id === r.raw.senderContactId) ?? shopContacts[0]
      addOrder({
        id: `ORD_IMPORT_${now.getTime()}_${i}`,
        shopId: r.raw.shopId,
        trackingCode: isGoods ? `GHN_IMP${now.getTime()}${i}` : `SHOP_IMP${now.getTime()}${i}`,
        senderName: contact?.name ?? shop?.ownerName ?? shop?.name ?? '',
        senderPhone: contact?.phone ?? shop?.phone ?? '',
        senderAddress: contact?.address ?? shop?.address ?? '',
        shopOrderCode: r.raw.shopOrderCode || undefined,
        receiverName: r.raw.receiverName,
        receiverPhone: r.raw.receiverPhone,
        receiverAddress: r.raw.receiverAddress,
        weight: Math.round(Number(r.raw.weight)) || 0,
        // Thư luôn cod=0 dù file có nhập gì ở cột COD — cột này chỉ áp dụng cho Hàng hoá.
        cod: isGoods ? (Number(r.raw.cod) || 0) : 0,
        declaredValue: Number(r.raw.declaredValue) || 0,
        fee: Number(r.raw.fee) || 0,
        feePayer: r.raw.feeType === 'Khách trả' ? 'receiver' : 'sender',
        codFailureFee: Number(r.raw.codFailureFee) || 0,
        viewGoodsPolicy: r.raw.viewGoodsPolicy || undefined,
        orderNote: r.raw.orderNote || undefined,
        pickupShift: r.raw.pickupShift || undefined,
        status: 'pending',
        createdAt,
        actionHistory: [],
        sendKind,
        dispatchStatus: isGoods ? 'dispatched' : 'pending_agency',
        carrierCode: isGoods ? 'GHN' : null,
        dispatchedAt: isGoods ? now.toISOString() : null,
        dispatchedBy: isGoods ? 'Agency Admin (import)' : null,
      })
    })
    setImporting(false)
    // Hiện toast xác nhận (cùng pattern Toast của AgencyDetail.tsx) trước khi chuyển trang,
    // để đại lý thấy rõ import đã thành công thay vì tự động chuyển trang trong im lặng.
    setImportResult({ total: goodsImported + letterImported, goods: goodsImported, letter: letterImported })
    setTimeout(() => navigate('/agency-admin/orders'), 1400)
  }

  const cardStyle: React.CSSProperties = { border: `1px solid ${C_BORDER}`, borderRadius: 8, padding: '12px 14px' }
  const isReview = !!rows
  const pageMaxWidth = isReview ? 1360 : 1024

  return (
    <div style={{ background: '#F9FAFB', minHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {importResult && <ImportSuccessToast result={importResult} />}
      {/* ── Page header — đổi thành tên file + nút Huỷ (đỏ) khi đã có file parse xong ── */}
      {isReview ? (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%', maxWidth: pageMaxWidth, padding: '24px 80px', boxSizing: 'border-box' }}>
          <FileExcelOutlined style={{ fontSize: 24, color: '#16A34A', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 20, fontWeight: 700, color: C_TEXT_PRIMARY, lineHeight: '28px' }}>{fileName}</span>
          <button
            onClick={cancelImport}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 6, background: '#DC2626', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          >
            <CloseOutlined style={{ fontSize: 12 }} />
            Huỷ
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%', maxWidth: pageMaxWidth, padding: '24px 80px', boxSizing: 'border-box' }}>
          <button
            onClick={() => navigate('/agency-admin/orders')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeftOutlined style={{ fontSize: 20, color: C_TEXT_PRIMARY }} />
          </button>
          <span style={{ flex: 1, fontSize: 24, fontWeight: 600, color: C_TEXT_PRIMARY, lineHeight: '28px' }}>
            Nhập đơn hàng
          </span>
        </div>
      )}

      <div style={{ width: '100%', maxWidth: pageMaxWidth, padding: '0 80px 80px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Bước 1: chọn/tải template + upload — ẩn hẳn khi đã vào bước review, giống màn tham khảo
            (chỉ còn header file + Huỷ + nội dung review, không còn dropzone/hướng dẫn phía dưới). */}
        {!isReview && (
        <div style={{ background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 12, padding: 20, boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '12px 14px', borderRadius: 8, background: '#F9FAFB', border: `1px solid ${C_BORDER}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <FileExcelOutlined style={{ fontSize: 20, color: '#16A34A', marginTop: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY }}>Bạn chưa có file mẫu import đơn hàng?</div>
                  <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>1 file dùng chung cho cả Hàng hoá và Thư — phân biệt qua cột "Loại đơn" trên từng dòng. Kèm sẵn danh sách mã shop để tra cứu.</div>
                </div>
              </div>
              <button
                onClick={() => downloadImportTemplate()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', flexShrink: 0,
                  background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                <DownloadOutlined style={{ fontSize: 14, color: C_TEXT_PRIMARY }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY }}>Tải xuống file mẫu</span>
              </button>
            </div>

            <label
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault()
                setDragOver(false)
                const f = e.dataTransfer.files?.[0]
                if (f) handleFile(f)
              }}
              style={{ display: 'block', cursor: 'pointer' }}
            >
              <input
                type="file" accept=".xlsx,.xls,.xlsm"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                style={{ display: 'none' }}
              />
              <div style={{
                border: `2px dashed ${dragOver || fileName ? C_ACTION : C_LINK}`, borderRadius: 8, padding: '36px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                background: dragOver || fileName ? '#FFF4ED' : '#F8FAFF',
              }}>
                <UploadOutlined style={{ fontSize: 28, color: dragOver || fileName ? C_ACTION : C_LINK }} />
                {fileName ? (
                  <span style={{ fontSize: 13, fontWeight: 600, color: C_ACTION }}>{fileName}</span>
                ) : (
                  <span style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>
                    Kéo thả file vào đây hoặc <span style={{ color: C_LINK, fontWeight: 600, textDecoration: 'underline' }}>chọn file từ máy tính</span>
                  </span>
                )}
                <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>*Chỉ hỗ trợ file có định dạng excel .xls, .xlsx, .xlsm</span>
              </div>
            </label>

            <div style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
              Thứ tự cột: <strong>{IMPORT_HEADERS.join(' · ')}</strong>.{' '}
              Cột "Loại đơn" nhận giá trị "Hàng hoá" hoặc "Thư" — dòng Hàng hoá tự động dispatch qua GHN ngay sau khi import, dòng Thư vào tab "Chờ xử lý" chờ đại lý chọn hub gửi qua 247Express. Cột Dài/Rộng/Cao không bắt buộc, để trống sẽ mặc định 10cm mỗi chiều.
            </div>

            {parseError && (
              <div style={{ ...cardStyle, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13 }}>{parseError}</div>
            )}
          </div>
        </div>
        )}

        {/* ── Bước 2: Review — bảng chỉnh sửa từng đơn trước khi import thật ── */}
        {isReview && (() => {
          const goodsCount = rows.filter(r => deriveOrderKind(r.raw.orderKindRaw) === 'goods').length
          const letterCount = rows.filter(r => deriveOrderKind(r.raw.orderKindRaw) === 'letter').length
          const fileShopIds = Array.from(new Set(rows.map(r => r.raw.shopId)))
          const singleShop = fileShopIds.length === 1 ? agencyShops.find(s => s.id === fileShopIds[0]) : null

          return (
          <>
            {/* Đặt tên/layout theo đúng màn hình tham khảo (icon ghim + icon xe tải) — nhưng nội dung
                phản ánh đúng mô hình dữ liệu thật: file có thể chứa NHIỀU shop khác nhau (qua cột
                "Mã shop"), không giả định 1 file = 1 địa chỉ lấy hàng như file mẫu tham khảo. */}
            <div style={{ background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 12, padding: '14px 16px', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C_TEXT_PRIMARY }}>Địa chỉ lấy hàng &amp; Nhà vận chuyển</div>
              <div style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginTop: 2 }}>
                Xác định theo từng dòng qua cột "Mã shop" và "Loại đơn" — file này có {fileShopIds.length} shop khác nhau, {rows.length} dòng ({goodsCount} Hàng hoá, {letterCount} Thư)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <EnvironmentOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>
                    <strong>Địa chỉ lấy hàng:</strong>{' '}
                    {singleShop
                      ? `${singleShop.name} - ${singleShop.phone} - ${singleShop.address}`
                      : `${fileShopIds.length} shop khác nhau — mỗi dòng lấy đúng địa chỉ của shop tương ứng theo "Mã shop"`}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <TruckOutlined style={{ color: C_TEXT_SECONDARY, fontSize: 16, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: C_TEXT_PRIMARY }}>
                    <strong>Nhà vận chuyển:</strong>{' '}
                    {goodsCount > 0 && letterCount > 0
                      ? `GHN cho ${goodsCount} đơn Hàng hoá (tự động dispatch ngay) · 247Express cho ${letterCount} đơn Thư (chờ đại lý chọn hub)`
                      : goodsCount > 0
                      ? `Giao Hàng Nhanh (GHN) — tự động dispatch ngay sau khi import`
                      : `247Express — vào tab "Chờ xử lý", chờ đại lý chọn hub gửi`}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)' }}>
              {/* Tabs Đơn hàng hợp lệ / Đơn hàng lỗi */}
              <div style={{ display: 'flex', gap: 8, padding: 14 }}>
                {([
                  { key: 'valid' as const, label: 'Đơn hàng hợp lệ', count: validRows.length },
                  { key: 'invalid' as const, label: 'Đơn hàng lỗi', count: invalidRows.length },
                ]).map(t => {
                  const selected = reviewTab === t.key
                  return (
                    <button
                      key={t.key}
                      onClick={() => switchReviewTab(t.key)}
                      style={{
                        padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                        background: selected ? '#111827' : '#F3F4F6',
                        color: selected ? '#fff' : C_TEXT_PRIMARY,
                        fontSize: 14, fontWeight: 600,
                      }}
                    >
                      {t.label} <span style={{ color: selected ? '#FCD34D' : C_ACTION }}>{t.count}</span>
                    </button>
                  )
                })}
                {selectedRows.size > 0 && (
                  <button
                    onClick={() => removeRows(selectedRows)}
                    style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 20, border: `1px solid ${C_BORDER}`, background: '#fff', color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Xoá {selectedRows.size} đơn đã chọn
                  </button>
                )}
              </div>

              {visibleRows.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: C_TEXT_SECONDARY, fontSize: 13 }}>
                  {reviewTab === 'valid' ? 'Không có đơn hợp lệ nào.' : 'Không có đơn nào bị lỗi.'}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <div style={{ minWidth: 2380 }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', background: C_BG_HEADER, padding: '8px 12px', gap: 12 }}>
                      <div style={{ width: 20, flexShrink: 0 }}>
                        <ReviewCheckbox checked={allVisibleSelected} onChange={() => {
                          setSelectedRows(prev => {
                            if (allVisibleSelected) { const next = new Set(prev); visibleRows.forEach(r => next.delete(r.rowIndex)); return next }
                            const next = new Set(prev); visibleRows.forEach(r => next.add(r.rowIndex)); return next
                          })
                        }} />
                      </div>
                      <div style={{ width: 60, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Dòng excel</div>
                      <div style={{ width: 130, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Mã shop</div>
                      <div style={{ width: 220, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Bên gửi</div>
                      <div style={{ flex: '2 0 0', minWidth: 170, fontSize: 12, color: C_TEXT_SECONDARY }}>Người nhận</div>
                      <div style={{ flex: '2 0 0', minWidth: 190, fontSize: 12, color: C_TEXT_SECONDARY }}>Địa chỉ người nhận</div>
                      <div style={{ width: 110, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Loại hàng hoá</div>
                      <div style={{ width: 110, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>COD (Tiền thu hộ)</div>
                      <div style={{ width: 150, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Ghi chú xem hàng</div>
                      <div style={{ width: 80, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Khối lượng</div>
                      <div style={{ width: 140, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Kích thước</div>
                      <div style={{ width: 140, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Khai giá trị hàng</div>
                      <div style={{ width: 160, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Phí ship</div>
                      <div style={{ width: 110, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Mã đơn shop</div>
                      <div style={{ width: 130, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Sản phẩm</div>
                      <div style={{ width: 150, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Ghi chú đơn hàng</div>
                      <div style={{ width: 150, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Ca lấy hàng</div>
                      <div style={{ width: 130, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Giao thất bại thu tiền</div>
                      <div style={{ width: 40, flexShrink: 0, fontSize: 12, color: C_TEXT_SECONDARY }}>Thao tác</div>
                      {reviewTab === 'invalid' && <div style={{ flex: '2 0 0', minWidth: 160, fontSize: 12, color: C_TEXT_SECONDARY }}>Lỗi</div>}
                    </div>
                    <div style={{ height: 1, background: C_BORDER }} />

                    {pagedRows.map((r, idx) => {
                      const rk = deriveOrderKind(r.raw.orderKindRaw)
                      return (
                      <div key={r.rowIndex}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '12px', gap: 12, background: '#fff' }}>
                          <div style={{ width: 20, flexShrink: 0, paddingTop: 2 }}>
                            <ReviewCheckbox checked={selectedRows.has(r.rowIndex)} onChange={() => toggleRowSelected(r.rowIndex)} />
                          </div>
                          <div style={{ width: 32, flexShrink: 0, fontSize: 13, color: C_TEXT_SECONDARY, paddingTop: 4 }}>{r.rowIndex}</div>

                          {/* Mã shop — select từ danh sách shop thật của đại lý, để sửa ngay nếu file ghi sai/thiếu mã shop
                              (trước đây field này không có input nào, dòng lỗi "Không tìm thấy shop" không thể sửa được). */}
                          <div style={{ width: 130, flexShrink: 0 }}>
                            <select
                              value={shopIds.has(r.raw.shopId) ? r.raw.shopId : ''}
                              onChange={e => updateRowField(r.rowIndex, 'shopId', e.target.value)}
                              style={{
                                border: `1px solid ${shopIds.has(r.raw.shopId) ? C_BORDER : '#FCA5A5'}`, borderRadius: 6, padding: '4px 6px', fontSize: 12,
                                color: C_TEXT_PRIMARY, background: shopIds.has(r.raw.shopId) ? '#fff' : '#FEF2F2', outline: 'none', cursor: 'pointer', width: '100%',
                              }}
                            >
                              <option value="" disabled>{r.raw.shopId || '— Chọn shop —'}</option>
                              {agencyShops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </div>

                          {/* Bên gửi — picker chọn 1 trong nhiều liên hệ gửi hàng của shop (xem shopContactStore.ts),
                              cho phép tìm kiếm, thêm liên hệ mới, sửa liên hệ có sẵn ngay trong popover. */}
                          <div style={{ width: 220, flexShrink: 0, position: 'relative' }} data-contact-picker data-contacts-version={contactsVersion}>
                            {(() => {
                              const shopContacts = contactsForShop(r.raw.shopId)
                              const selectedContact = shopContacts.find(c => c.id === r.raw.senderContactId) ?? shopContacts[0]
                              const isOpen = contactPickerRow === r.rowIndex
                              const filteredContacts = shopContacts.filter(c =>
                                !contactSearch.trim() ||
                                c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                                c.phone.includes(contactSearch)
                              )
                              return (
                                <>
                                  <div
                                    onClick={() => {
                                      if (isOpen) { closeContactPicker(); return }
                                      setContactPickerRow(r.rowIndex); setContactSearch(''); setAddingContact(false); setEditingContactId(null)
                                    }}
                                    style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, cursor: 'pointer', border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '4px 8px' }}
                                  >
                                    <div style={{ minWidth: 0 }}>
                                      {selectedContact ? (
                                        <>
                                          <div style={{ fontSize: 12, fontWeight: 600, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {selectedContact.name} - {selectedContact.phone}
                                          </div>
                                          <div style={{ fontSize: 11, color: C_TEXT_SECONDARY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {selectedContact.address}
                                          </div>
                                        </>
                                      ) : (
                                        <span style={{ fontSize: 12, color: '#9CA3AF' }}>Chưa có liên hệ</span>
                                      )}
                                    </div>
                                    <DownOutlined style={{ fontSize: 10, color: C_TEXT_SECONDARY, flexShrink: 0, marginTop: 3 }} />
                                  </div>

                                  {isOpen && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, width: 280, background: '#fff', border: `1px solid ${C_BORDER}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 30, padding: 8 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '4px 8px' }}>
                                          <SearchOutlined style={{ fontSize: 12, color: C_TEXT_SECONDARY }} />
                                          <input
                                            autoFocus value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                                            placeholder="Tìm kiếm"
                                            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 12, color: C_TEXT_PRIMARY }}
                                          />
                                        </div>
                                        <button
                                          onClick={() => { setAddingContact(true); setEditingContactId(null); setNewContactForm({ name: '', phone: '', address: '' }) }}
                                          style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 6, border: 'none', background: C_ACTION, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                          <PlusOutlined style={{ fontSize: 13 }} />
                                        </button>
                                      </div>

                                      {addingContact && (
                                        <div style={{ marginTop: 8, padding: 8, border: `1px dashed ${C_BORDER}`, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                          <input placeholder="Tên liên hệ" value={newContactForm.name} onChange={e => setNewContactForm({ ...newContactForm, name: e.target.value })} style={{ border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '4px 6px', fontSize: 12, outline: 'none' }} />
                                          <input placeholder="Số điện thoại" value={newContactForm.phone} onChange={e => setNewContactForm({ ...newContactForm, phone: e.target.value })} style={{ border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '4px 6px', fontSize: 12, outline: 'none' }} />
                                          <input placeholder="Địa chỉ" value={newContactForm.address} onChange={e => setNewContactForm({ ...newContactForm, address: e.target.value })} style={{ border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '4px 6px', fontSize: 12, outline: 'none' }} />
                                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                            <button onClick={() => setAddingContact(false)} style={{ padding: '4px 10px', borderRadius: 4, border: `1px solid ${C_BORDER}`, background: '#fff', fontSize: 12, cursor: 'pointer' }}>Huỷ</button>
                                            <button
                                              disabled={!newContactForm.name.trim() || !newContactForm.phone.trim()}
                                              onClick={() => {
                                                const newC: ShopContact = { id: `CT_${Date.now()}`, shopId: r.raw.shopId, name: newContactForm.name.trim(), phone: newContactForm.phone.trim(), address: newContactForm.address.trim() }
                                                addContact(newC)
                                                setContactsVersion(v => v + 1)
                                                updateRowField(r.rowIndex, 'senderContactId', newC.id)
                                                setAddingContact(false)
                                              }}
                                              style={{
                                                padding: '4px 10px', borderRadius: 4, border: 'none', color: '#fff', fontSize: 12,
                                                background: (!newContactForm.name.trim() || !newContactForm.phone.trim()) ? '#D1D5DB' : C_ACTION,
                                                cursor: (!newContactForm.name.trim() || !newContactForm.phone.trim()) ? 'not-allowed' : 'pointer',
                                              }}
                                            >
                                              Thêm
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      <div style={{ marginTop: 8, maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {filteredContacts.length === 0 && (
                                          <div style={{ padding: '8px 4px', fontSize: 12, color: C_TEXT_SECONDARY }}>Không tìm thấy liên hệ nào.</div>
                                        )}
                                        {filteredContacts.map(c => {
                                          const isSelected = (selectedContact?.id ?? shopContacts[0]?.id) === c.id
                                          if (editingContactId === c.id) {
                                            return (
                                              <div key={c.id} style={{ padding: 8, border: `1px dashed ${C_BORDER}`, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <input value={editContactForm.name} onChange={e => setEditContactForm({ ...editContactForm, name: e.target.value })} style={{ border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '4px 6px', fontSize: 12, outline: 'none' }} />
                                                <input value={editContactForm.phone} onChange={e => setEditContactForm({ ...editContactForm, phone: e.target.value })} style={{ border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '4px 6px', fontSize: 12, outline: 'none' }} />
                                                <input value={editContactForm.address} onChange={e => setEditContactForm({ ...editContactForm, address: e.target.value })} style={{ border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '4px 6px', fontSize: 12, outline: 'none' }} />
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                  <button onClick={() => setEditingContactId(null)} style={{ padding: '4px 10px', borderRadius: 4, border: `1px solid ${C_BORDER}`, background: '#fff', fontSize: 12, cursor: 'pointer' }}>Huỷ</button>
                                                  <button
                                                    onClick={() => {
                                                      updateContact(c.id, { name: editContactForm.name.trim(), phone: editContactForm.phone.trim(), address: editContactForm.address.trim() })
                                                      setContactsVersion(v => v + 1)
                                                      setEditingContactId(null)
                                                    }}
                                                    style={{ padding: '4px 10px', borderRadius: 4, border: 'none', background: C_ACTION, color: '#fff', fontSize: 12, cursor: 'pointer' }}
                                                  >
                                                    <CheckOutlined style={{ fontSize: 11 }} /> Lưu
                                                  </button>
                                                </div>
                                              </div>
                                            )
                                          }
                                          return (
                                            <div
                                              key={c.id}
                                              style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 6px', borderRadius: 6, background: isSelected ? '#FFF4ED' : 'transparent' }}
                                              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F9FAFB' }}
                                              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                                            >
                                              <div
                                                onClick={() => { updateRowField(r.rowIndex, 'senderContactId', c.id); closeContactPicker() }}
                                                style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 3, cursor: 'pointer', border: isSelected ? `4px solid ${C_ACTION}` : '1.5px solid #D1D5DB' }}
                                              />
                                              <div onClick={() => { updateRowField(r.rowIndex, 'senderContactId', c.id); closeContactPicker() }} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: C_TEXT_PRIMARY }}>{c.name} - {c.phone}</div>
                                                <div style={{ fontSize: 11, color: C_TEXT_SECONDARY }}>{c.address}</div>
                                              </div>
                                              <EditOutlined
                                                style={{ fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer', flexShrink: 0, marginTop: 2 }}
                                                onClick={(e) => { e.stopPropagation(); setEditingContactId(c.id); setEditContactForm({ name: c.name, phone: c.phone, address: c.address }) }}
                                              />
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>

                          {/* Khách hàng — SĐT/tên sửa được ngay tại chỗ, cùng cơ chế re-validate như các field khác
                              (trước đây 2 field này chỉ hiện text tĩnh, dòng lỗi "Thiếu SĐT/Tên" không sửa được). */}
                          <div style={{ flex: '2 0 0', minWidth: 170, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <input
                                value={r.raw.receiverPhone} onChange={e => updateRowField(r.rowIndex, 'receiverPhone', e.target.value)}
                                placeholder="Số điện thoại"
                                style={{ width: 100, border: `1px solid ${r.raw.receiverPhone ? C_BORDER : '#FCA5A5'}`, borderRadius: 4, padding: '3px 6px', fontSize: 13, fontWeight: 600, color: C_TEXT_PRIMARY, outline: 'none' }}
                              />
                              {/* TLHH (tỷ lệ hoàn hàng) — placeholder tĩnh, chưa có dữ liệu thật để tính */}
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>TLHH: 0%</span>
                            </div>
                            <input
                              value={r.raw.receiverName} onChange={e => updateRowField(r.rowIndex, 'receiverName', e.target.value)}
                              placeholder="Tên người nhận"
                              style={{ width: '100%', border: `1px solid ${r.raw.receiverName ? C_BORDER : '#FCA5A5'}`, borderRadius: 4, padding: '3px 6px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none' }}
                            />
                          </div>

                          {/* Địa chỉ — sửa được ngay tại chỗ */}
                          <div style={{ flex: '2 0 0', minWidth: 190 }}>
                            <input
                              value={r.raw.receiverAddress} onChange={e => updateRowField(r.rowIndex, 'receiverAddress', e.target.value)}
                              placeholder="Địa chỉ giao hàng"
                              style={{ width: '100%', border: `1px solid ${r.raw.receiverAddress ? C_BORDER : '#FCA5A5'}`, borderRadius: 4, padding: '3px 6px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none' }}
                            />
                          </div>

                          {/* Loại hàng hoá — select để có thể sửa ngay nếu người dùng điền sai/thiếu giá trị trong file */}
                          <div style={{ width: 110, flexShrink: 0 }}>
                            <select
                              value={rk ?? ''}
                              onChange={e => updateRowField(r.rowIndex, 'orderKindRaw', e.target.value === 'goods' ? 'Hàng hoá' : 'Thư')}
                              style={{
                                border: `1px solid ${rk ? C_BORDER : '#FCA5A5'}`, borderRadius: 6, padding: '4px 6px', fontSize: 12,
                                color: C_TEXT_PRIMARY, background: rk ? '#fff' : '#FEF2F2', outline: 'none', cursor: 'pointer', width: '100%',
                              }}
                            >
                              <option value="" disabled>{r.raw.orderKindRaw || '— Chọn —'}</option>
                              <option value="goods">Hàng hoá</option>
                              <option value="letter">Thư</option>
                            </select>
                          </div>

                          {/* COD — không áp dụng cho Thư (cột dùng chung file với Hàng hoá): tự động bỏ qua giá trị
                              nhập thay vì chặn thành lỗi, chỉ hiện badge để người dùng biết đã bị bỏ qua. */}
                          <div style={{ width: 110, flexShrink: 0 }}>
                            {rk === 'letter' ? (
                              <div
                                title={r.raw.cod && Number(r.raw.cod) !== 0 ? `Đã bỏ qua giá trị nhập: ${r.raw.cod}đ` : undefined}
                                style={{
                                  padding: '4px 8px', borderRadius: 6, background: '#F3F4F6', border: `1px dashed ${C_BORDER}`,
                                  fontSize: 11, color: C_TEXT_SECONDARY, textAlign: 'center',
                                }}
                              >
                                Không áp dụng{r.raw.cod && Number(r.raw.cod) !== 0 ? ' — đã bỏ qua' : ''}
                              </div>
                            ) : (
                              <ReviewNumberInput value={r.raw.cod} onChange={v => updateRowField(r.rowIndex, 'cod', v)} />
                            )}
                          </div>

                          {/* Ghi chú xem hàng */}
                          <div style={{ width: 150, flexShrink: 0 }}>
                            <select
                              value={r.raw.viewGoodsPolicy || 'Không cho xem hàng'}
                              onChange={e => updateRowField(r.rowIndex, 'viewGoodsPolicy', e.target.value)}
                              style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '4px 6px', fontSize: 12, color: C_TEXT_PRIMARY, background: '#fff', outline: 'none', cursor: 'pointer', width: '100%' }}
                            >
                              <option value="Không cho xem hàng">Không cho xem hàng</option>
                              <option value="Cho xem không thử">Cho xem không thử</option>
                              <option value="Cho xem và thử">Cho xem và thử</option>
                            </select>
                          </div>

                          {/* Khối lượng */}
                          <div style={{ width: 80, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                            <input
                              value={r.raw.weight} onChange={e => updateRowField(r.rowIndex, 'weight', e.target.value.replace(/[^\d]/g, ''))}
                              style={{ width: 50, border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '2px 4px', fontSize: 12, color: C_TEXT_PRIMARY, textAlign: 'right', outline: 'none' }}
                            />
                            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>g</span>
                          </div>

                          {/* Kích thước */}
                          <div style={{ width: 140, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                            <input
                              value={r.raw.length} onChange={e => updateRowField(r.rowIndex, 'length', e.target.value.replace(/[^\d]/g, ''))}
                              style={{ width: 30, border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '2px 3px', fontSize: 11, color: C_TEXT_SECONDARY, textAlign: 'right', outline: 'none' }}
                            />
                            <span style={{ fontSize: 11, color: C_TEXT_SECONDARY }}>x</span>
                            <input
                              value={r.raw.width} onChange={e => updateRowField(r.rowIndex, 'width', e.target.value.replace(/[^\d]/g, ''))}
                              style={{ width: 30, border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '2px 3px', fontSize: 11, color: C_TEXT_SECONDARY, textAlign: 'right', outline: 'none' }}
                            />
                            <span style={{ fontSize: 11, color: C_TEXT_SECONDARY }}>x</span>
                            <input
                              value={r.raw.height} onChange={e => updateRowField(r.rowIndex, 'height', e.target.value.replace(/[^\d]/g, ''))}
                              style={{ width: 30, border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '2px 3px', fontSize: 11, color: C_TEXT_SECONDARY, textAlign: 'right', outline: 'none' }}
                            />
                            <span style={{ fontSize: 11, color: C_TEXT_SECONDARY }}>cm</span>
                          </div>

                          {/* Khai giá trị hàng — checkbox bật/tắt + giá trị, tick khi giá trị > 0 */}
                          <div style={{ width: 140, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={Number(r.raw.declaredValue) > 0}
                                onChange={e => updateRowField(r.rowIndex, 'declaredValue', e.target.checked ? (r.raw.declaredValue && Number(r.raw.declaredValue) > 0 ? r.raw.declaredValue : '1000000') : '0')}
                                style={{ cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: 12, color: C_TEXT_PRIMARY, whiteSpace: 'nowrap' }}>Khai giá trị hàng</span>
                            </label>
                            <ReviewNumberInput value={r.raw.declaredValue} onChange={v => updateRowField(r.rowIndex, 'declaredValue', v)} />
                          </div>

                          {/* Phí ship */}
                          <div style={{ width: 160, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <select
                              value={r.raw.feeType || 'Shop trả'}
                              onChange={e => updateRowField(r.rowIndex, 'feeType', e.target.value)}
                              style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '4px 6px', fontSize: 12, color: C_TEXT_PRIMARY, background: '#fff', outline: 'none', cursor: 'pointer' }}
                            >
                              <option value="Shop trả">Shop trả</option>
                              <option value="Khách trả">Khách trả</option>
                            </select>
                            <span style={{ fontSize: 12, color: C_TEXT_SECONDARY }}>
                              Phí ship: <input
                                value={r.raw.fee} onChange={e => updateRowField(r.rowIndex, 'fee', e.target.value.replace(/[^\d]/g, ''))}
                                style={{ width: 60, border: 'none', borderBottom: `1px solid ${C_BORDER}`, outline: 'none', fontSize: 12, color: C_TEXT_PRIMARY, textAlign: 'right', background: 'transparent' }}
                              />đ
                            </span>
                          </div>

                          {/* Mã đơn shop — tự đặt để đối chiếu, không phải mã vận đơn */}
                          <div style={{ width: 110, flexShrink: 0 }}>
                            <input
                              value={r.raw.shopOrderCode} onChange={e => updateRowField(r.rowIndex, 'shopOrderCode', e.target.value)}
                              placeholder="Mã đơn shop"
                              style={{ width: '100%', border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '3px 6px', fontSize: 12, color: C_TEXT_PRIMARY, outline: 'none' }}
                            />
                          </div>

                          {/* Sản phẩm */}
                          <div style={{ width: 130, flexShrink: 0, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            {editingProductRow === r.rowIndex ? (
                              <input
                                autoFocus
                                value={r.raw.product}
                                onChange={e => updateRowField(r.rowIndex, 'product', e.target.value)}
                                onBlur={() => setEditingProductRow(null)}
                                onKeyDown={e => { if (e.key === 'Enter') setEditingProductRow(null) }}
                                style={{ flex: 1, minWidth: 0, border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '3px 6px', fontSize: 12, outline: 'none' }}
                              />
                            ) : (
                              <span
                                style={{ fontSize: 13, color: C_LINK, fontWeight: 600, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                title={r.raw.product.split(/[,;\n]/).map(p => p.trim()).filter(Boolean).join('\n')}
                              >
                                {r.raw.product}
                              </span>
                            )}
                            <EditOutlined style={{ fontSize: 12, color: C_TEXT_SECONDARY, cursor: 'pointer', flexShrink: 0 }} onClick={() => setEditingProductRow(r.rowIndex)} />
                          </div>

                          {/* Ghi chú đơn hàng */}
                          <div style={{ width: 150, flexShrink: 0 }}>
                            <input
                              value={r.raw.orderNote} onChange={e => updateRowField(r.rowIndex, 'orderNote', e.target.value)}
                              placeholder="Thêm ghi chú"
                              style={{ width: '100%', border: `1px solid ${C_BORDER}`, borderRadius: 4, padding: '3px 6px', fontSize: 12, color: C_TEXT_PRIMARY, outline: 'none' }}
                            />
                          </div>

                          {/* Ca lấy hàng */}
                          <div style={{ width: 150, flexShrink: 0 }}>
                            <select
                              value={r.raw.pickupShift || ''}
                              onChange={e => updateRowField(r.rowIndex, 'pickupShift', e.target.value)}
                              style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '4px 6px', fontSize: 12, color: r.raw.pickupShift ? C_TEXT_PRIMARY : C_TEXT_SECONDARY, background: '#fff', outline: 'none', cursor: 'pointer', width: '100%' }}
                            >
                              <option value="">Chọn ca lấy hàng</option>
                              <option value="Sáng (8h-12h)">Sáng (8h-12h)</option>
                              <option value="Chiều (13h-17h)">Chiều (13h-17h)</option>
                              <option value="Tối (17h-21h)">Tối (17h-21h)</option>
                            </select>
                          </div>

                          {/* Giao thất bại thu tiền */}
                          <div style={{ width: 130, flexShrink: 0 }}>
                            <ReviewNumberInput value={r.raw.codFailureFee} onChange={v => updateRowField(r.rowIndex, 'codFailureFee', v)} />
                          </div>

                          {/* Thao tác — xoá dòng này khỏi danh sách import */}
                          <div style={{ width: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
                            <CloseOutlined style={{ fontSize: 13, color: '#9CA3AF', cursor: 'pointer' }} onClick={() => removeRows([r.rowIndex])} title="Xoá dòng" />
                          </div>

                          {reviewTab === 'invalid' && (
                            <div style={{ flex: '2 0 0', minWidth: 160, fontSize: 12, color: '#DC2626' }}>{r.errors.join('; ')}</div>
                          )}
                        </div>
                        {idx < pagedRows.length - 1 && <div style={{ height: 1, background: C_BORDER }} />}
                      </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: `1px solid ${C_BORDER}`, fontSize: 13, color: C_TEXT_SECONDARY, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Hiển thị</span>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); goToPage(1) }}
                    style={{ border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '4px 8px', fontSize: 13, color: C_TEXT_PRIMARY, outline: 'none', cursor: 'pointer' }}
                  >
                    {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span>mỗi trang — {visibleRows.length} đơn</span>
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage <= 1}
                      style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#fff', cursor: safePage <= 1 ? 'not-allowed' : 'pointer', color: safePage <= 1 ? '#D1D5DB' : C_TEXT_PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <LeftOutlined style={{ fontSize: 11 }} />
                    </button>
                    <span style={{ width: 28, height: 28, borderRadius: 6, background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                      {safePage}
                    </span>
                    <button
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage >= totalPages}
                      style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C_BORDER}`, background: '#fff', cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', color: safePage >= totalPages ? '#D1D5DB' : C_TEXT_PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <RightOutlined style={{ fontSize: 11 }} />
                    </button>
                    <span style={{ marginLeft: 4 }}>Đi đến trang số</span>
                    <input
                      value={pageInput}
                      onChange={e => setPageInput(e.target.value.replace(/[^\d]/g, ''))}
                      onBlur={() => goToPage(Number(pageInput) || 1)}
                      onKeyDown={e => { if (e.key === 'Enter') goToPage(Number(pageInput) || 1) }}
                      style={{ width: 44, border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '4px 6px', fontSize: 13, textAlign: 'center', outline: 'none' }}
                    />
                    <span>/ {totalPages}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 0' }}>
              <button
                onClick={handleConfirm}
                disabled={validRows.length === 0 || importing}
                style={{
                  padding: '12px 24px', border: 'none', borderRadius: 8,
                  cursor: (validRows.length === 0 || importing) ? 'not-allowed' : 'pointer',
                  fontSize: 15, fontWeight: 700, color: '#fff',
                  background: (validRows.length === 0 || importing) ? '#9CA3AF' : C_ACTION,
                }}
              >
                Nhập {validRows.length} đơn hợp lệ
              </button>
            </div>
          </>
          )
        })()}
      </div>
    </div>
  )
}

function ReviewCheckbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 18, height: 18, borderRadius: 4, cursor: 'pointer',
        border: checked ? 'none' : `1.5px solid ${C_BORDER}`,
        background: checked ? C_ACTION : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {checked && (
        <svg width="11" height="8" viewBox="0 0 12 9" fill="none">
          <path d="M1 4L4.5 7.5L11 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

function ReviewNumberInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', border: `1px solid ${C_BORDER}`, borderRadius: 6, padding: '4px 8px', background: '#F9FAFB' }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^\d]/g, ''))}
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontSize: 13, color: C_TEXT_PRIMARY, textAlign: 'right', background: 'transparent' }}
      />
      <span style={{ fontSize: 12, color: C_TEXT_SECONDARY, marginLeft: 4 }}>đ</span>
    </div>
  )
}

// Cùng pattern Toast của AgencyDetail.tsx (super-admin) — dùng lại cho nhất quán thay vì
// tự nghĩ ra 1 kiểu thông báo thành công mới.
function ImportSuccessToast({ result }: { result: { total: number; goods: number; letter: number } }) {
  const parts: string[] = []
  if (result.goods > 0) parts.push(`${result.goods} Hàng hoá`)
  if (result.letter > 0) parts.push(`${result.letter} Thư`)
  return (
    <div
      style={{
        position: 'fixed',
        top: 60,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#4B5563',
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: '#fff',
        fontSize: 14,
        zIndex: 9999,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <CheckCircleFilled style={{ color: '#34D399', fontSize: 16 }} />
      Đã nhập thành công {result.total} đơn hàng{parts.length > 0 ? ` (${parts.join(' · ')})` : ''}
    </div>
  )
}
