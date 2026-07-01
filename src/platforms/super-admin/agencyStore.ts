import rawData from '../../mock-data/agencies.json'

export interface Agency {
  id: string
  name: string
  code: string
  status: string
  ghnAccount: string
  adminUrl: string
  shopUrl: string
  createdAt: string
  totalShops: number
  totalOrders: number
  representative: string
  phone: string
  address: string
  email: string
  allowedCarriers: string[]
  clientHubId?: string
}

// Mutable list — starts with JSON data, new agencies prepended here at runtime
export const agenciesList: Agency[] = (rawData as any[]).map(a => ({
  ...a,
  allowedCarriers: a.allowedCarriers ?? ['GHN'],
}))

export function addAgency(a: Agency) {
  agenciesList.unshift(a)
}

export function setAllowedCarriers(agencyId: string, carriers: string[]) {
  const agency = agenciesList.find(a => a.id === agencyId)
  if (agency) agency.allowedCarriers = carriers
}

// ─── Shop connection requests ─────────────────────────────────────────────────
export type ShopConnectionStatus = 'active' | 'pending' | 'rejected'

export interface ShopConnection {
  id: string
  agencyId: string
  carrier: string
  shopId: string
  name: string
  phone: string
  clientId: string
  requestedAt: string
  status: ShopConnectionStatus
  rejectionReason?: string
  goiCuoc: { loai: string; id: string; ten: string }[]
  approvedServices?: { code: string; name: string }[]
}

export const shopConnections: ShopConnection[] = [
  // AGN001 — GHN — active
  { id: 'sc-001', agencyId: 'AGN001', carrier: 'GHN', shopId: '5148899', name: 'Shop Thời Trang ABC',    phone: '0901234567', clientId: 'cl-5148899', requestedAt: '2025-01-10', status: 'active',   goiCuoc: [{ loai: 'Hàng nhẹ', id: '380', ten: 'CAM KẾT TỪ 2,000 ĐƠN - 17,500Đ CHO ĐƠN TỪ 1KG' }, { loai: 'Hàng nặng', id: '150', ten: 'Bảng giá Hàng nặng XIAOMI for a Chính' }] },
  { id: 'sc-002', agencyId: 'AGN001', carrier: 'GHN', shopId: '5148900', name: 'Shop Điện Tử XYZ',       phone: '0912345678', clientId: 'cl-5148900', requestedAt: '2025-01-15', status: 'active',   goiCuoc: [{ loai: 'Hàng nhẹ', id: '412', ten: 'CAM KẾT TỪ 1,000 ĐƠN - 20,000Đ CHO ĐƠN TỪ 1KG' }, { loai: 'Hàng nặng', id: '162', ten: 'Bảng giá Hàng nặng Điện Tử Standard' }] },
  { id: 'sc-003', agencyId: 'AGN001', carrier: 'GHN', shopId: '5148901', name: 'Shop Mỹ Phẩm Hà Nội',   phone: '0923456789', clientId: 'cl-5148901', requestedAt: '2025-02-20', status: 'active',   goiCuoc: [{ loai: 'Hàng nặng', id: '201', ten: 'Bảng giá Hàng nặng Mỹ Phẩm Standard' }, { loai: 'Hàng nhẹ', id: '395', ten: 'CAM KẾT TỪ 500 ĐƠN - 22,000Đ CHO ĐƠN TỪ 1KG' }] },
  { id: 'sc-004', agencyId: 'AGN001', carrier: 'GHN', shopId: '5148902', name: 'Shop Giày Dép Fashion',  phone: '0934567890', clientId: 'cl-5148902', requestedAt: '2025-03-05', status: 'active',   goiCuoc: [{ loai: 'Hàng nhẹ', id: '367', ten: 'CAM KẾT TỪ 3,000 ĐƠN - 15,000Đ CHO ĐƠN TỪ 1KG' }, { loai: 'Hàng nặng', id: '178', ten: 'Bảng giá Hàng nặng Giày Dép Standard' }] },
  { id: 'sc-005', agencyId: 'AGN001', carrier: 'GHN', shopId: '5148903', name: 'Shop Đồ Gia Dụng 365',   phone: '0945678901', clientId: 'cl-5148903', requestedAt: '2025-03-12', status: 'active',   goiCuoc: [{ loai: 'Hàng nhẹ', id: '421', ten: 'CAM KẾT TỪ 500 ĐƠN - 19,500Đ CHO ĐƠN TỪ 1KG' }, { loai: 'Hàng nặng', id: '195', ten: 'Bảng giá Hàng nặng Gia Dụng Standard' }] },
  // AGN001 — GHN — pending
  { id: 'sc-006', agencyId: 'AGN001', carrier: 'GHN', shopId: '5148910', name: 'Shop Nội Thất Phòng Ngủ', phone: '0956789012', clientId: 'cl-5148910', requestedAt: '2025-05-20', status: 'pending',  goiCuoc: [] },
  { id: 'sc-007', agencyId: 'AGN001', carrier: 'GHN', shopId: '5148911', name: 'Shop Phụ Kiện Xe Máy',   phone: '0967890123', clientId: 'cl-5148911', requestedAt: '2025-05-22', status: 'pending',  goiCuoc: [] },
  // AGN001 — GHN — rejected
  { id: 'sc-008', agencyId: 'AGN001', carrier: 'GHN', shopId: '5148912', name: 'Shop Đồng Hồ Luxury',    phone: '0978901234', clientId: 'cl-5148912', requestedAt: '2025-05-15', status: 'rejected', rejectionReason: 'Thông tin tài khoản không khớp với hồ sơ đại lý', goiCuoc: [] },
  // AGN002 — GHN — pending
  { id: 'sc-009', agencyId: 'AGN002', carrier: 'GHN', shopId: '5249001', name: 'Shop Thực Phẩm Sạch',    phone: '0988123456', clientId: 'cl-5249001', requestedAt: '2025-06-10', status: 'pending',  goiCuoc: [] },
  { id: 'sc-010', agencyId: 'AGN003', carrier: 'GHN', shopId: '5349002', name: 'Shop Hoa Tươi Đà Nẵng',  phone: '0977654321', clientId: 'cl-5349002', requestedAt: '2025-06-12', status: 'pending',  goiCuoc: [] },
]

export function addShopRequest(data: { agencyId: string; carrier: string; shopId: string; name: string; phone: string; clientId: string }): ShopConnection {
  const conn: ShopConnection = { ...data, id: `sc-${Date.now()}`, requestedAt: new Date().toISOString().slice(0, 10), status: 'pending', goiCuoc: [] }
  shopConnections.push(conn)
  return conn
}

export function approveShopConnection(id: string, services?: { code: string; name: string }[]) {
  const conn = shopConnections.find(s => s.id === id)
  if (conn) {
    conn.status = 'active'
    if (services) conn.approvedServices = services
  }
}

export function rejectShopConnection(id: string, reason: string) {
  const conn = shopConnections.find(s => s.id === id)
  if (conn) { conn.status = 'rejected'; conn.rejectionReason = reason }
}

// ─── 247Express Client Hub list (Super Admin selects one to assign to agency) ─

// Field names theo đúng response của 247Express API CustomerGetClientHubs
// (https://apidoc.247express.vn/customer/danh-sach-dia-chi)
export interface ClientHub247 {
  id: string
  name: string
  location: string
  address: string
  wardName: string
  districtName: string
  provinceName: string
  contactName: string
  contactPhone: string
}

export const clientHubs247: ClientHub247[] = [
  { id: 'HUB-HAN-001', name: 'Hub Hà Nội Trung Tâm', location: '18 Lê Văn Lương, P. Nhân Chính, Q. Thanh Xuân, Hà Nội', address: '18 Lê Văn Lương', wardName: 'Nhân Chính', districtName: 'Thanh Xuân', provinceName: 'Hà Nội', contactName: 'Nguyễn Văn Hùng', contactPhone: '0981000001' },
  { id: 'HUB-HAN-002', name: 'Hub Hà Nội Bắc',        location: '45 Phạm Văn Đồng, P. Mai Dịch, Q. Cầu Giấy, Hà Nội', address: '45 Phạm Văn Đồng', wardName: 'Mai Dịch', districtName: 'Cầu Giấy', provinceName: 'Hà Nội', contactName: 'Trần Thị Lan', contactPhone: '0981000002' },
  { id: 'HUB-HAN-003', name: 'Hub Hà Nội Tây',        location: '29 Quang Trung, P. Quang Trung, Q. Hà Đông, Hà Nội', address: '29 Quang Trung', wardName: 'Quang Trung', districtName: 'Hà Đông', provinceName: 'Hà Nội', contactName: 'Lê Văn Nam', contactPhone: '0981000003' },
  { id: 'HUB-HAN-004', name: 'Hub Hà Nội Đông',       location: 'Lô B2, KCN Sài Đồng, P. Thạch Bàn, Q. Long Biên, Hà Nội', address: 'Lô B2, KCN Sài Đồng', wardName: 'Thạch Bàn', districtName: 'Long Biên', provinceName: 'Hà Nội', contactName: 'Phạm Thị Hoa', contactPhone: '0981000004' },
  { id: 'HUB-HPH-001', name: 'Hub Hải Phòng',         location: '120 Lê Lợi, P. Minh Khai, Q. Hồng Bàng, Hải Phòng', address: '120 Lê Lợi', wardName: 'Minh Khai', districtName: 'Hồng Bàng', provinceName: 'Hải Phòng', contactName: 'Vũ Đình Khoa', contactPhone: '0981000005' },
  { id: 'HUB-DAN-001', name: 'Hub Đà Nẵng',           location: '34 Trường Chinh, P. An Khê, Q. Thanh Khê, Đà Nẵng', address: '34 Trường Chinh', wardName: 'An Khê', districtName: 'Thanh Khê', provinceName: 'Đà Nẵng', contactName: 'Đặng Minh Tuấn', contactPhone: '0981000006' },
  { id: 'HUB-HUE-001', name: 'Hub Huế',               location: '58 Hùng Vương, P. Phú Nhuận, TP. Huế, Thừa Thiên Huế', address: '58 Hùng Vương', wardName: 'Phú Nhuận', districtName: 'TP. Huế', provinceName: 'Thừa Thiên Huế', contactName: 'Hoàng Thị Mai', contactPhone: '0981000007' },
  { id: 'HUB-SGN-001', name: 'Hub TP.HCM Trung Tâm', location: '22 Ký Con, P. Nguyễn Thái Bình, Q. 1, TP. HCM', address: '22 Ký Con', wardName: 'Nguyễn Thái Bình', districtName: 'Quận 1', provinceName: 'TP. Hồ Chí Minh', contactName: 'Ngô Văn Sơn', contactPhone: '0981000008' },
  { id: 'HUB-SGN-002', name: 'Hub TP.HCM Bắc',        location: '156 Quang Trung, P. 10, Q. Gò Vấp, TP. HCM', address: '156 Quang Trung', wardName: 'Phường 10', districtName: 'Gò Vấp', provinceName: 'TP. Hồ Chí Minh', contactName: 'Bùi Thị Thu', contactPhone: '0981000009' },
  { id: 'HUB-SGN-003', name: 'Hub TP.HCM Nam',        location: 'Lô C5, KCN Vĩnh Lộc, P. Vĩnh Lộc B, H. Bình Chánh, TP. HCM', address: 'Lô C5, KCN Vĩnh Lộc', wardName: 'Vĩnh Lộc B', districtName: 'Bình Chánh', provinceName: 'TP. Hồ Chí Minh', contactName: 'Đỗ Văn Phúc', contactPhone: '0981000010' },
  { id: 'HUB-SGN-004', name: 'Hub TP.HCM Đông',       location: '88 Võ Thị Sáu, P. Thống Nhất, TP. Biên Hòa, Đồng Nai', address: '88 Võ Thị Sáu', wardName: 'Thống Nhất', districtName: 'TP. Biên Hòa', provinceName: 'Đồng Nai', contactName: 'Lý Thị Ngọc', contactPhone: '0981000011' },
  { id: 'HUB-CTO-001', name: 'Hub Cần Thơ',           location: '86 Nguyễn Văn Cừ, P. An Hòa, Q. Ninh Kiều, Cần Thơ', address: '86 Nguyễn Văn Cừ', wardName: 'An Hòa', districtName: 'Ninh Kiều', provinceName: 'Cần Thơ', contactName: 'Trương Văn Đạt', contactPhone: '0981000012' },
]

// ─── Carrier activation requests ─────────────────────────────────────────────
export interface CarrierRequest {
  id: string
  agencyId: string
  carrier: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  note?: string
  rejectionReason?: string
  clientHubId?: string
}

export const carrierRequests: CarrierRequest[] = [
  { id: 'cr-001', agencyId: 'AGN001', carrier: '247Express', status: 'approved', requestedAt: '2025-06-01', note: 'Muốn mở rộng dịch vụ vận chuyển liên tỉnh', clientHubId: 'HUB-SGN-001' },
  { id: 'cr-002', agencyId: 'AGN002', carrier: '247Express', status: 'pending', requestedAt: '2025-06-08', note: 'Shop có nhu cầu giao hàng quốc tế' },
  { id: 'cr-003', agencyId: 'AGN004', carrier: '247Express', status: 'pending', requestedAt: '2025-06-15', note: '' },
]

export function addCarrierRequest(agencyId: string, carrier: string, note?: string): CarrierRequest {
  const req: CarrierRequest = {
    id: `cr-${Date.now()}`,
    agencyId, carrier, status: 'pending',
    requestedAt: new Date().toISOString().slice(0, 10),
    note,
  }
  carrierRequests.push(req)
  return req
}

export function approveCarrierRequest(id: string, clientHubId?: string) {
  const req = carrierRequests.find(r => r.id === id)
  if (!req) return
  req.status = 'approved'
  if (clientHubId) req.clientHubId = clientHubId
  const agency = agenciesList.find(a => a.id === req.agencyId)
  if (agency) {
    if (!agency.allowedCarriers.includes(req.carrier)) {
      agency.allowedCarriers = [...agency.allowedCarriers, req.carrier]
    }
    if (clientHubId) agency.clientHubId = clientHubId
  }
}

export function rejectCarrierRequest(id: string, reason: string) {
  const req = carrierRequests.find(r => r.id === id)
  if (req) { req.status = 'rejected'; req.rejectionReason = reason }
}
