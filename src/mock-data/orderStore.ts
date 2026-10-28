// ── Shared order store ───────────────────────────────────────────────────────
// Single source of truth for order data across Web Shop and Agency Admin.
// "Persistence" via localStorage — prototype only, no real backend.
// Both platforms are SPA routes so localStorage gives cross-page consistency.

import baseOrders from './orders.json'
import { loadShops } from './shopStore'

export type DispatchStatus = 'pending_agency' | 'dispatched'
export type SendKind = 'goods' | 'letter'
export type CarrierCode = 'GHN' | '247EXPRESS'

// Explicit interface — avoids TypeScript typeof-inference conflicts across files.
export interface Order {
  id: string
  shopId: string
  trackingCode: string
  senderName: string
  senderPhone: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  weight: number
  cod: number
  fee: number
  // Breakdown của `fee` theo đúng các hạng mục phí GHN thật (xem CreateOrderDrawer — form tạo đơn
  // Hàng hoá đã tính riêng từng khoản này, nhưng trước đây chỉ cộng gộp vào `fee` rồi bỏ breakdown
  // đi khi lưu đơn). `feeShipping` là phí giao hàng gốc (theo bảng giá); 4 field còn lại là phụ phí
  // CHỈ phát sinh khi bật tuỳ chọn tương ứng lúc tạo đơn — undefined/0 nghĩa là không phát sinh.
  // feeShipping + feeInsurance + feePartial + feeDeliveryFail + feeCod LUÔN cộng đúng bằng `fee`.
  feeShipping?: number
  feeInsurance?: number
  feePartial?: number
  feeDeliveryFail?: number
  feeCod?: number
  // Phí hoàn hàng — KHÁC 4 field trên vì chỉ phát sinh SAU khi đơn thực sự bị hoàn (Shop bấm "Hoàn
  // hàng"), không phải lúc tạo đơn. Khi phát sinh, được CỘNG THÊM vào `fee` (xem confirmReturnOrder
  // trong Orders.tsx) để `fee` luôn phản ánh đúng tổng Shop phải trả, và lưu riêng ở đây để hiện
  // breakdown (xem CashFlowReport.tsx).
  feeReturn?: number
  // Phí đổi địa chỉ — CÙNG LOẠI với feeReturn (chỉ phát sinh SAU khi người nhận thực sự yêu cầu đổi
  // địa chỉ, xem confirmAddressChangeOrder trong Orders.tsx), KHÁC feeReturn ở chỗ có 3 mức tuỳ theo
  // khoảng cách đổi (Cùng Phường/Xã · Cùng Tỉnh/Thành · Khác Tỉnh/Thành — xem ShopPricingSurcharges.
  // addressChange). Khi phát sinh, CỘNG THÊM vào `fee`, lưu riêng ở đây để hiện breakdown.
  feeAddressChange?: number
  // Snapshot của `fee` NGAY TẠI THỜI ĐIỂM paymentApprovalStatus chuyển sang 'confirmed' (xem
  // approveOrderPayment, handlePaymentPaid*). Cần tách riêng vì `fee` có thể TĂNG THÊM SAU đó (phí
  // hoàn hàng/đổi địa chỉ phát sinh sau khi đã duyệt) — nếu không lưu lại con số ĐÃ DUYỆT, báo cáo
  // dòng tiền (CashFlowReport.tsx) sẽ ngộ nhận luôn cả phần phụ phí mới (chưa ai duyệt) là "Đã
  // thanh toán" chỉ vì đơn đang ở trạng thái confirmed. undefined (đơn cũ/chưa duyệt lần nào) được
  // coi tương đương `fee` hiện tại — không có phần phát sinh thêm nào cần tách ra.
  paymentApprovedAmount?: number
  // Lựa chọn THẬT của shop lúc tạo đơn — 'sender' = Shop trả ship, 'receiver' = Khách trả ship.
  // Khác với giá trị luôn cố định "Shop trả ship" khi đối soát với GHN (GHN chỉ biết thu cước
  // từ bên gửi/đại lý, không có khái niệm thu từ người nhận) — 2 giá trị này KHÁC NHAU có chủ đích.
  feePayer: 'sender' | 'receiver'
  // Phương thức thanh toán PHÍ SHIP khi feePayer === 'sender' (Shop trả ship) — chỉ có ý nghĩa
  // trong trường hợp đó, mặc định 'cash' (trừ vào kỳ đối soát như trước giờ). 'momo' = shop thanh
  // toán phí ship ngay lúc tạo/xác nhận đơn qua QR MoMo (mô phỏng UI, không có SDK/backend thật).
  // 'bank_transfer' = tương tự nhưng qua chuyển khoản ngân hàng (cũng mô phỏng UI thuần).
  paymentMethod?: 'cash' | 'momo' | 'bank_transfer'
  // Chỉ có ý nghĩa khi paymentMethod === 'momo' | 'bank_transfer'. 'not_required' = trả tiền mặt
  // (mặc định, không qua luồng thanh toán online). 'pending' = đã tạo mã/QR, chờ thanh toán.
  // 'paid' = Shop đã bấm "Tôi đã thanh toán" (TỰ KHAI — xem `paymentApprovalStatus` để biết Agency
  // Admin đã thực sự xác nhận nhận được tiền hay chưa).
  // 'failed' = QR hết hạn (15 phút) mà chưa thanh toán, HOẶC Agency Admin từ chối xác nhận — phải
  // tạo mã mới/thanh toán lại để thử lại.
  paymentStatus?: 'not_required' | 'pending' | 'paid' | 'failed'
  // ISO timestamp lúc bấm "Tôi đã thanh toán" — chỉ set khi paymentStatus chuyển sang 'paid'.
  paymentPaidAt?: string
  // Lớp DUYỆT của Agency Admin — ngăn Shop tự khai "đã thanh toán" (paymentStatus='paid')
  // nhưng thực tế chưa chuyển tiền. 'pending_review' = Shop đã khai đã thanh toán/đã thu tiền mặt.
  // 'confirmed' = Agency Admin đã xác nhận nhận được tiền (xem `approveOrderPayment`). 'rejected' =
  // Agency Admin xác nhận KHÔNG nhận được tiền — Shop phải thanh toán lại/khai lại từ đầu.
  paymentApprovalStatus?: 'pending_review' | 'confirmed' | 'rejected'
  // Lý do từ chối — bắt buộc nhập khi Agency Admin bấm "Từ chối".
  paymentApprovalRejectedReason?: string
  paymentApprovedAt?: string
  paymentApprovedBy?: string | null
  // Shop tự báo "đã chuyển tiền mặt cho Agency" qua nút "Thanh toán cho đại lý" (Báo cáo dòng tiền,
  // Web Shop) — CHỈ là lời khai của Shop, KHÔNG tự đổi paymentApprovalStatus thành 'confirmed'.
  // Agency Admin vẫn phải tự bấm "Duyệt shop này" (AGA-PAYMENT-2) sau khi đối chiếu thực nhận được
  // tiền mới thực sự xác nhận — field này chỉ là tín hiệu nhắc Agency ưu tiên kiểm tra sớm.
  cashRemittanceDeclaredAt?: string
  // Đơn huỷ SAU KHI đại lý đã xác nhận nhận tiền (`status: 'cancelled' && paymentApprovalStatus:
  // 'confirmed'`) thì đại lý đang nợ Shop đúng số `fee` đã thu — field này đánh dấu đại lý đã THỰC
  // SỰ hoàn lại khoản đó (ngoài hệ thống, prototype không có luồng chuyển tiền thật), set qua
  // confirmCancelRefund(). undefined = chưa hoàn, hiện nhãn "Chờ hoàn tiền" (xem rowStatus()).
  cancelRefundConfirmedAt?: string
  cancelRefundConfirmedBy?: string
  status: string
  createdAt: string
  // Optional fields present in some JSON entries
  actionHistory?: Array<{
    date: string
    time: string
    operator: string
    action: string
    oldContent: string
    newContent: string
  }>
  num_deliver?: number
  num_pick?: number
  num_return?: number
  log?: Array<{
    status: string
    status_name: string
    action: string
    updated_date: string
    note: string
    warehouse_id: number | null
    warehouse_name: string
    is_force_majeure: boolean
    force_majeure_msg: string
    is_regulation: boolean
    regulation_msg: string
  }>
  // New dispatch-tracking fields (required, with defaults for migrated orders)
  sendKind: SendKind
  dispatchStatus: DispatchStatus
  carrierCode: CarrierCode | null
  dispatchedAt: string | null
  dispatchedBy: string | null
  // Hub 247Express xuất phát — xác nhận lúc dispatch (Service không còn gắn cứng hub nữa),
  // null cho tới khi dispatch, không áp dụng với carrier GHN
  dispatchHubId?: string | null
  // Đơn Thư (sendKind: 'letter') do đại lý gửi hộ qua 247Express — khi hoàn hàng, hàng vật lý
  // về tay ĐẠI LÝ trước (không về thẳng shop như đơn GHN Hàng hoá tự gửi). Field này đánh dấu
  // thời điểm đại lý xác nhận đã giao lại hàng hoàn cho shop — null nghĩa là hàng đang ở đại lý,
  // CHƯA về tay shop, dù order.status đã là 'returning'/'cancelled'/'failed'.
  returnHandoverAt?: string | null
  // Các field mở rộng từ màn "Nhập đơn hàng" (import) — optional vì các luồng tạo đơn khác
  // (CreateOrderDrawer, CreateLetterDrawer...) chưa thu thập các field này.
  senderAddress?: string       // địa chỉ Bên gửi thật sự dùng cho đơn (có thể khác địa chỉ mặc định của shop)
  shopOrderCode?: string       // Mã đơn shop tự đặt — chỉ để đối chiếu, không phải mã vận đơn
  declaredValue?: number       // Giá trị hàng khai giá (0 = không khai giá)
  viewGoodsPolicy?: string     // Ghi chú xem hàng — VD "Không cho xem hàng", "Cho xem không thử"
  orderNote?: string           // Ghi chú đơn hàng
  pickupShift?: string         // Ca lấy hàng
  codFailureFee?: number       // Phí thu tiền khi giao thất bại
}

const STORAGE_KEY = 'ghn_orders_v1'

function migrateOrder(o: typeof baseOrders[number]): Order {
  // Giữ nguyên sendKind/dispatchStatus/carrierCode nếu seed data đã khai báo sẵn (đơn Thư/
  // 247Express) — chỉ áp mặc định "Hàng hoá qua GHN, đã dispatch" cho các đơn cũ chưa có field
  // này (toàn bộ seed gốc trước khi có luồng 247Express).
  const raw = o as any
  return {
    ...(o as unknown as Order),
    sendKind: raw.sendKind ?? 'goods',
    dispatchStatus: raw.dispatchStatus ?? 'dispatched',
    carrierCode: raw.carrierCode ?? 'GHN',
    dispatchedAt: raw.dispatchedAt ?? raw.createdAt ?? null,
    dispatchedBy: raw.dispatchedBy ?? null,
    feePayer: raw.feePayer ?? 'sender',
  }
}

export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw) as Order[]
      // Backfill: đơn mới thêm vào orders.json sau khi browser đã có localStorage cũ (VD:
      // ORD034 cho luồng hoàn hàng đơn Thư) không tự xuất hiện vì localStorage không rỗng nên
      // không reseed lại từ đầu. Bù thêm các đơn base còn thiếu theo id, KHÔNG đụng gì tới đơn
      // đã có (giữ nguyên mọi thay đổi/đơn tạo mới của người dùng trong session).
      const storedIds = new Set(stored.map(o => o.id))
      const missing = (baseOrders as unknown[])
        .map(o => migrateOrder(o as typeof baseOrders[number]))
        .filter(o => !storedIds.has(o.id))
      if (missing.length > 0) {
        const merged = [...stored, ...missing]
        saveOrders(merged)
        return merged
      }
      return stored
    }
  } catch {
    /* fall through to reseed */
  }
  const seeded = (baseOrders as unknown[]).map(o => migrateOrder(o as typeof baseOrders[number]))
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)) } catch { /* storage unavailable */ }
  return seeded
}

function saveOrders(orders: Order[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)) } catch { /* storage unavailable */ }
  // Báo cho các component KHÔNG trực tiếp gọi hàm này (VD: badge số đơn chờ duyệt trên sidebar
  // SuperAdminLayout) biết dữ liệu đơn hàng vừa đổi, để tự re-render mà không cần điều hướng trang —
  // mọi hàm ghi (addOrder, updateOrder, approveOrderPayment...) đều đi qua đây nên phát 1 chỗ là đủ.
  try { window.dispatchEvent(new Event('ghn-orders-changed')) } catch { /* no window (SSR/test) */ }
}

export function addOrder(order: Order): Order[] {
  const orders = loadOrders()
  orders.unshift(order)
  saveOrders(orders)
  return orders
}

export function dispatchOrderToCarrier(
  orderId: string,
  carrierCode: CarrierCode,
  dispatchedBy: string,
  dispatchHubId?: string,
): Order[] {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx !== -1) {
    orders[idx] = {
      ...orders[idx],
      status: 'pickup', // đại lý đã gửi NVC — đơn không còn là "Đơn nháp" (status: 'pending')
      dispatchStatus: 'dispatched',
      carrierCode,
      dispatchedAt: new Date().toISOString(),
      dispatchedBy,
      dispatchHubId: dispatchHubId ?? null,
    }
    saveOrders(orders)
  }
  return orders
}

export function cancelOrder(orderId: string): Order[] {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], status: 'cancelled' }
    saveOrders(orders)
  }
  return orders
}

export function updateOrder(orderId: string, patch: Partial<Order>): Order[] {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...patch }
    saveOrders(orders)
  }
  return orders
}

// ── Lịch sử các lần Shop khai "đã chuyển tiền mặt" ──────────────────────────
// Mỗi lần bấm "Xác nhận thanh toán" ở modal "Thanh toán hạn mức đã dùng" (Báo cáo dòng tiền, Web
// Shop) tạo 1 bản ghi ở đây — CHỈ là lịch sử lời khai của Shop, KHÔNG phải lịch sử Agency đã duyệt
// (muốn biết Agency đã duyệt hay chưa, đọc `paymentApprovalStatus` của từng đơn trong `orderIds`).
export interface CashRemittanceBatch {
  id: string
  shopId: string
  declaredAt: string
  declaredBy: string
  totalAmount: number
  orderIds: string[]
}

const REMITTANCE_BATCH_KEY = 'ghn_cash_remittance_batches_v1'

export function loadRemittanceBatches(shopId: string): CashRemittanceBatch[] {
  try {
    const raw = localStorage.getItem(REMITTANCE_BATCH_KEY)
    const all = raw ? (JSON.parse(raw) as CashRemittanceBatch[]) : []
    return all.filter(b => b.shopId === shopId).sort((a, b) => b.declaredAt.localeCompare(a.declaredAt))
  } catch {
    return []
  }
}

function saveRemittanceBatch(batch: CashRemittanceBatch): void {
  try {
    const raw = localStorage.getItem(REMITTANCE_BATCH_KEY)
    const all = raw ? (JSON.parse(raw) as CashRemittanceBatch[]) : []
    all.push(batch)
    localStorage.setItem(REMITTANCE_BATCH_KEY, JSON.stringify(all))
  } catch { /* storage unavailable */ }
}

// Mã thanh toán kiểu "2509243fvzl" (YYMMDD + 5 ký tự ngẫu nhiên) — chỉ để hiển thị/đối chiếu,
// không phải mã giao dịch ngân hàng thật (PROTOTYPE THUẦN).
function generateRemittanceCode(): string {
  const now = new Date()
  const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, '')
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${yymmdd}${suffix}`
}

// Shop tự báo "đã chuyển tiền mặt cho Agency" (nút "Thanh toán cho đại lý", Báo cáo dòng tiền —
// Web Shop) — đánh dấu `cashRemittanceDeclaredAt` trên MỌI đơn tiền mặt đang `pending_review`
// HOẶC `rejected` của shop đó (rejected = nợ tồn từ lần khai trước chưa được Agency xác nhận, vẫn
// cần khai lại). CHỈ là lời khai, KHÔNG tự đổi `paymentApprovalStatus` — Agency Admin vẫn phải tự
// đối chiếu rồi bấm "Duyệt shop này" (AGA-PAYMENT-2) mới thực sự xác nhận (xem AGA-PAYMENT-1/2).
// Trả về `CashRemittanceBatch` vừa tạo (hoặc `null` nếu không có gì để khai) để UI hiện ngay mã/tổng tiền.
export function declareCashRemittance(shopId: string, declaredBy: string): CashRemittanceBatch | null {
  const orders = loadOrders()
  const now = new Date().toISOString()
  const affected = orders.filter(
    o => o.shopId === shopId && o.paymentMethod === 'cash'
      && (o.paymentApprovalStatus === 'pending_review' || o.paymentApprovalStatus === 'rejected')
  )
  if (affected.length === 0) return null
  for (const o of affected) {
    o.cashRemittanceDeclaredAt = now
    // Đơn từng bị từ chối ("Nợ tồn") mà Shop khai đã trả lại → đưa về pending_review để Agency có
    // thể DUYỆT LẠI qua "Duyệt shop này" (approveOrderPayment chỉ nhận đơn đang pending_review) —
    // nếu không reset, đơn rejected sẽ kẹt vĩnh viễn, không bao giờ duyệt lại được.
    if (o.paymentApprovalStatus === 'rejected') {
      o.paymentApprovalStatus = 'pending_review'
      o.paymentApprovalRejectedReason = undefined
    }
  }
  saveOrders(orders)
  for (const o of affected) {
    appendActionHistory(o.id, declaredBy, 'Báo đã chuyển tiền mặt cho đại lý', '-', '-')
  }
  const batch: CashRemittanceBatch = {
    id: generateRemittanceCode(),
    shopId,
    declaredAt: now,
    declaredBy,
    totalAmount: affected.reduce((sum, o) => sum + o.fee, 0),
    orderIds: affected.map(o => o.id),
  }
  saveRemittanceBatch(batch)
  return batch
}

// Agency Admin xác nhận đã THỰC SỰ nhận được tiền từ Shop (phí ship thanh toán tiền mặt/MoMo/
// chuyển khoản) — chỉ hợp lệ khi đơn đang 'pending_review'. Đơn Shop trả ship giờ đi NGAY vào
// 'pickup' từ lúc tạo (xem buildOrder() ở Orders.tsx) nên nhánh `status === 'pending' ? 'pickup'
// : ...` dưới đây chỉ còn là fallback vô hại cho dữ liệu cũ — hành động này KHÔNG còn mở khoá vận
// hành gì nữa, chỉ là bước hậu kiểm/đối soát của Agency Admin (xem AGA-PAYMENT-1/2, SHOP-ORDER-43/45).
export function approveOrderPayment(orderId: string, approvedBy: string): Order[] {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx !== -1 && orders[idx].paymentApprovalStatus === 'pending_review') {
    orders[idx] = {
      ...orders[idx],
      paymentApprovalStatus: 'confirmed',
      paymentApprovedAt: new Date().toISOString(),
      paymentApprovedBy: approvedBy,
      paymentApprovedAmount: orders[idx].fee,
      status: orders[idx].status === 'pending' ? 'pickup' : orders[idx].status,
    }
    saveOrders(orders)
    appendActionHistory(orderId, approvedBy, 'Đại lý xác nhận đã nhận thanh toán', '-', 'Đã duyệt (hậu kiểm/đối soát)')
  }
  return orders
}

// Chiều NGƯỢC với phí hoàn hàng/đổi địa chỉ (fee TĂNG sau khi confirmed): đơn đã confirmed nhưng
// fee sau đó GIẢM xuống dưới paymentApprovedAmount (VD: phúc tra phát hiện phí thật thấp hơn lúc
// duyệt) — đại lý đã THỰC NHẬN nhiều hơn mức đúng, cần hoàn lại phần chênh lệch cho Shop. Hàm này
// chỉ đơn giản đồng bộ paymentApprovedAmount xuống đúng fee hiện tại (coi như đã hoàn xong) — không
// có luồng chuyển tiền thật nào trong prototype này.
export function confirmFeeRefund(orderId: string, confirmedBy: string): boolean {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx === -1) return false
  const o = orders[idx]
  const approvedAmount = o.paymentApprovedAmount ?? o.fee
  if (o.paymentApprovalStatus !== 'confirmed' || o.fee >= approvedAmount) return false
  const refundAmount = approvedAmount - o.fee
  orders[idx] = { ...o, paymentApprovedAmount: o.fee }
  saveOrders(orders)
  appendActionHistory(orderId, confirmedBy, 'Đại lý xác nhận đã hoàn tiền thừa cho Shop', `${approvedAmount.toLocaleString('vi-VN')}đ`, `Hoàn ${refundAmount.toLocaleString('vi-VN')}đ`)
  return true
}

// Đơn HUỶ sau khi đại lý đã xác nhận nhận tiền (status 'cancelled' + paymentApprovalStatus
// 'confirmed') — đại lý đang nợ Shop đúng số `fee` đã thu cho 1 đơn giờ không còn giao nữa. Hàm
// này chỉ đánh dấu đại lý đã THỰC SỰ hoàn lại khoản đó (ngoài hệ thống) — không có luồng chuyển
// tiền thật nào trong prototype, giống đúng tinh thần confirmFeeRefund().
export function confirmCancelRefund(orderId: string, confirmedBy: string): boolean {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx === -1) return false
  const o = orders[idx]
  if (o.status !== 'cancelled' || o.paymentApprovalStatus !== 'confirmed' || o.cancelRefundConfirmedAt) return false
  orders[idx] = { ...o, cancelRefundConfirmedAt: new Date().toISOString(), cancelRefundConfirmedBy: confirmedBy }
  saveOrders(orders)
  appendActionHistory(orderId, confirmedBy, 'Đại lý xác nhận đã hoàn tiền cho Shop (đơn huỷ)', '-', `Hoàn ${o.fee.toLocaleString('vi-VN')}đ`)
  return true
}

// Agency Admin xác nhận KHÔNG nhận được tiền — chỉ còn là 1 cảnh báo hậu kiểm (hiện badge/nhãn
// "Đại lý từ chối xác nhận" cho Shop thấy, xem SHOP-ORDER-44/48), KHÔNG chặn hay kéo lùi đơn về
// "Đơn nháp" nữa. Shop có thể tự nguyện thanh toán lại qua nút "Thanh toán lại" ở Chi tiết đơn
// (xem SHOP-ORDER-45) nếu muốn đối soát cho khớp, nhưng đơn vẫn tiếp tục vận hành bình thường.
export function rejectOrderPayment(orderId: string, rejectedBy: string, reason: string): Order[] {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx !== -1 && orders[idx].paymentApprovalStatus === 'pending_review') {
    orders[idx] = {
      ...orders[idx],
      paymentApprovalStatus: 'rejected',
      paymentApprovalRejectedReason: reason,
      paymentStatus: 'failed',
      paymentApprovedBy: rejectedBy,
      // Xoá lời khai cũ (nếu có) — đơn vừa bị từ chối cần Shop khai LẠI từ đầu qua "Thanh toán cho
      // đại lý" (RemittanceModal), không được coi là "đã khai" theo lời khai trước đó nữa.
      cashRemittanceDeclaredAt: undefined,
    }
    saveOrders(orders)
    appendActionHistory(orderId, rejectedBy, 'Đại lý từ chối xác nhận thanh toán', '-', reason)
  }
  return orders
}

// Ghi 1 dòng vào "Lịch sử thao tác" (tab action của OrderDetailDrawer) — trước đây actionHistory
// chỉ được seed 1 LẦN lúc tạo đơn rồi không bao giờ được thêm nữa (mọi cập nhật sau đó qua
// updateOrder() đều bỏ qua field này), khiến tab Lịch sử thao tác mãi trống/không phản ánh thao
// tác thật của shop (sửa thông tin, thanh toán, huỷ đơn...). Hàm này là điểm ghi DUY NHẤT dùng
// chung cho mọi thao tác xảy ra SAU khi đơn đã tồn tại trong store.
export function appendActionHistory(
  orderId: string,
  operator: string,
  action: string,
  oldContent = '-',
  newContent = '-',
): Order[] {
  const orders = loadOrders()
  const idx = orders.findIndex(o => o.id === orderId)
  if (idx !== -1) {
    const now = new Date()
    const entry = {
      date: now.toISOString().slice(0, 10),
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`,
      operator,
      action,
      oldContent,
      newContent,
    }
    orders[idx] = { ...orders[idx], actionHistory: [entry, ...(orders[idx].actionHistory ?? [])] }
    saveOrders(orders)
  }
  return orders
}

// ── Chặn tạo đơn theo công nợ tiền mặt với Agency (TỰ ĐỘNG, theo TỪNG shop) ──
// Mô hình nghiệp vụ: 1 Shop (bưu cục) thu hộ tiền mặt phí ship phải CHUYỂN LẠI cho Agency quản lý
// mình (tài khoản Agency cũng chính là tài khoản Agency dùng để thanh toán cước cho GHN) — Agency
// Admin là người duyệt đã nhận đủ tiền (xem AGA-PAYMENT-1/2, Agency Admin), KHÔNG còn là GHN Super
// Admin như thiết kế trước. Quá hạn CHUYỂN TIỀN (không phải quá hạn TẠO ĐƠN) tính từ paymentPaidAt
// của đơn tiền mặt CŨ NHẤT còn pending_review của shop đó — 1 ngày: chỉ cảnh báo lúc tạo đơn; 3
// ngày trở lên: tự động chặn hẳn tạo đơn mới của RIÊNG shop đó (shop khác không bị ảnh hưởng).
//
// Tính theo NGÀY LỊCH (so khác biệt ngày dương lịch), KHÔNG phải theo 24 giờ trôi qua kể từ đúng
// giờ phút tạo đơn — Shop gộp tất cả đơn phát sinh TRONG 1 NGÀY thành 1 đợt cần chuyển, nên 1 đơn
// tạo lúc 23h50 hôm nay đã coi là "trễ 1 ngày" ngay khi sang ngày mai 00h01, không cần đợi đủ 24h.
function daysSinceCalendar(iso: string): number {
  const now = new Date()
  const then = new Date(iso)
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const utcThen = Date.UTC(then.getFullYear(), then.getMonth(), then.getDate())
  return Math.floor((utcNow - utcThen) / (24 * 60 * 60 * 1000))
}

export function shopCashOverdueDays(shopId: string): number {
  const orders = loadOrders().filter(
    o => o.shopId === shopId && o.paymentMethod === 'cash' && o.paymentApprovalStatus === 'pending_review' && o.paymentPaidAt
  )
  if (orders.length === 0) return 0
  const oldestMs = Math.min(...orders.map(o => new Date(o.paymentPaidAt!).getTime()))
  return daysSinceCalendar(new Date(oldestMs).toISOString())
}

// Ngưỡng cảnh báo/khoá do Super Admin cấu hình (Cài đặt → Quy tắc thanh toán tiền mặt) — RIÊNG
// TỪNG ĐẠI LÝ (mỗi đại lý tự đặt mức tin tưởng/khắt khe khác nhau cho shop của mình), không còn
// 1 bộ dùng chung cho toàn hệ thống như trước. Mặc định giữ nguyên hành vi cũ (1 ngày cảnh báo, 3
// ngày khoá) cho đại lý nào Super Admin chưa từng lưu cấu hình riêng.
export interface CashRemittanceConfig {
  warningDays: number
  blockDays: number
}

// Lưu dạng 1 mảng DÙNG CHUNG (mỗi phần tử gắn `agencyId`) — cùng convention với PriceTable
// (pricingStore.ts, cũng gắn `agencyId` trong 1 mảng chung thay vì tách key riêng từng đại lý).
interface AgencyCashRemittanceConfig extends CashRemittanceConfig {
  agencyId: string
}

const REMITTANCE_CONFIG_KEY = 'ghn_cash_remittance_config_v2'
const DEFAULT_REMITTANCE_CONFIG: CashRemittanceConfig = { warningDays: 1, blockDays: 3 }

function loadAllRemittanceConfigs(): AgencyCashRemittanceConfig[] {
  try {
    const raw = localStorage.getItem(REMITTANCE_CONFIG_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveAllRemittanceConfigs(list: AgencyCashRemittanceConfig[]): void {
  try {
    localStorage.setItem(REMITTANCE_CONFIG_KEY, JSON.stringify(list))
  } catch { /* storage unavailable */ }
}

export function loadRemittanceConfig(agencyId: string): CashRemittanceConfig {
  const found = loadAllRemittanceConfigs().find(c => c.agencyId === agencyId)
  if (!found) return DEFAULT_REMITTANCE_CONFIG
  const warningDays = Number(found.warningDays)
  const blockDays = Number(found.blockDays)
  return {
    warningDays: Number.isFinite(warningDays) && warningDays > 0 ? warningDays : DEFAULT_REMITTANCE_CONFIG.warningDays,
    blockDays: Number.isFinite(blockDays) && blockDays > 0 ? blockDays : DEFAULT_REMITTANCE_CONFIG.blockDays,
  }
}

export function saveRemittanceConfig(agencyId: string, config: CashRemittanceConfig): void {
  const list = loadAllRemittanceConfigs()
  const idx = list.findIndex(c => c.agencyId === agencyId)
  const entry: AgencyCashRemittanceConfig = { agencyId, ...config }
  if (idx === -1) list.push(entry)
  else list[idx] = entry
  saveAllRemittanceConfigs(list)
}

// shopId → agencyId tra qua shopStore (loadShops) — giữ nguyên chữ ký cũ `isOrderCreationBlocked
// (shopId)` cho mọi call site hiện có (Orders.tsx) không phải sửa gì, chỉ tự đổi NGUỒN ngưỡng bên
// trong sang đúng đại lý quản lý shop đó.
export function isOrderCreationBlocked(shopId: string): boolean {
  const shop = loadShops().find(s => s.id === shopId)
  if (!shop) return false
  return shopCashOverdueDays(shopId) >= loadRemittanceConfig(shop.agencyId).blockDays
}
