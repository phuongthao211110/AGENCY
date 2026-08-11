// ── Ledger đối soát COD theo orderCode, xuyên nhiều phiên ────────────────────
// Bối cảnh (xem đầy đủ ở docs/agency-admin/reconciliation/mapping-trang-thai-doi-soat-ghn.md,
// AGA-RECON-4): GHN trừ phí ship lúc "Lấy hàng thành công"/"Đang trung chuyển"... (đơn ở
// nhóm "trung gian" — COD=0, có phí), rồi trả COD lúc "Giao hàng thành công" (đơn ở nhóm
// "kết thúc" — phí=0 vì đã trừ trước đó, chỉ còn COD). 1 đơn có thể xuất hiện ở 2 PHIÊN khác
// nhau (2 file khác nhau, 2 thời điểm khác nhau) — nhìn riêng 1 dòng/1 phiên không đủ để biết
// tổng phí thật của đơn đó có đúng không.
//
// Module này cộng dồn ghnFee từ mọi item "trung gian" theo orderCode, rồi dùng tổng đó (+ phí
// riêng của item "kết thúc", nếu có) để so với systemFee của item "kết thúc" — thay cho việc so
// khớp period-riêng-lẻ như trước. Không thêm giá trị status mới: vẫn chỉ MATCH/MISMATCH/
// NOT_FOUND — đơn thiếu vế phí (chưa từng thấy ở phiên trung gian nào) coi như MATCH (không đủ
// dữ liệu để báo sai, không phải bằng chứng có lỗi).
import rawItems from './carrier-reconciliation-items.json'

export type ItemRecord = {
  id: string
  sessionId: string
  orderCode: string
  shopId: string
  shopName: string
  ghnCOD: number
  systemCOD: number
  ghnFee: number
  systemFee: number
  status: 'MATCH' | 'MISMATCH' | 'NOT_FOUND'
  customerOrderCode: string
  ghnStatus: string
  deliveryFee: number
  redeliveryFee: number
  insuranceFee: number
  returnFee: number
  failedDeliveryCOD: number
  prepaid: number
  discount: number
  serviceFee: number
  totalReconcileItem: number
  codFee: number
  partialDeliveryFee: number
  failedDeliveryCollect: number
}

// Nhóm "trung gian — đã trừ phí": phí đã tính, COD chưa có (đơn còn đang di chuyển).
const INTERMEDIATE_GHN_STATUSES = new Set([
  'Lấy hàng thành công', 'Đang trung chuyển', 'Nhập kho', 'Chờ lấy hàng',
  'Giao hàng không thành công', 'Chờ xác nhận giao lại', 'Chờ giao lại',
  'Chuyển hoàn', 'Đang hoàn hàng',
])
// Nhóm "kết thúc — chốt so khớp": COD đã có (hoặc đơn hoàn xong), phí đã trừ ở nhóm trung gian.
const ENDING_GHN_STATUSES = new Set(['Giao hàng thành công', 'Hoàn hàng thành công'])

function ghnStatusGroup(ghnStatus: string): 'intermediate' | 'ending' | 'unknown' {
  if (ENDING_GHN_STATUSES.has(ghnStatus)) return 'ending'
  if (INTERMEDIATE_GHN_STATUSES.has(ghnStatus)) return 'intermediate'
  return 'unknown'
}

// Trả về danh sách item với `status` được TÍNH LẠI theo ledger cộng dồn — dùng hàm này ở mọi
// nơi cần đọc trạng thái Đúng/Sai (thay cho đọc thẳng field `status` có sẵn trong JSON, vốn là
// giá trị tĩnh không phản ánh việc 1 đơn có thể trải qua nhiều phiên).
export function getReconciliationItems(): ItemRecord[] {
  const items = rawItems as ItemRecord[]

  // Cộng dồn phí từ mọi item "trung gian", theo orderCode — không tính item NOT_FOUND vào ledger
  // (đơn không tồn tại trong hệ thống thì không có gì để cộng dồn tài chính).
  const intermediateFeeByOrderCode = new Map<string, number>()
  items.forEach(item => {
    if (item.status === 'NOT_FOUND') return
    if (ghnStatusGroup(item.ghnStatus) !== 'intermediate') return
    intermediateFeeByOrderCode.set(
      item.orderCode,
      (intermediateFeeByOrderCode.get(item.orderCode) ?? 0) + item.ghnFee
    )
  })

  return items.map(item => {
    if (item.status === 'NOT_FOUND') return item // không phải vấn đề ledger — giữ nguyên

    const group = ghnStatusGroup(item.ghnStatus)

    if (group === 'intermediate') {
      // Phí đã biết ngay lúc này, kiểm được ngay — không cần đợi vế COD.
      const status = item.ghnFee === item.systemFee ? 'MATCH' : 'MISMATCH'
      return { ...item, status }
    }

    if (group === 'ending') {
      const feeFromIntermediate = intermediateFeeByOrderCode.get(item.orderCode) ?? 0
      const totalFee = feeFromIntermediate + item.ghnFee
      const feeMatches = totalFee === item.systemFee
      const codMatches = item.ghnCOD === item.systemCOD
      const status = feeMatches && codMatches ? 'MATCH' : 'MISMATCH'
      return { ...item, status }
    }

    // ghnStatus chưa phân loại được — giữ nguyên field status tĩnh làm fallback.
    return item
  })
}
