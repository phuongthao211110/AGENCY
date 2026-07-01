import servicesRaw from '../../mock-data/services.json'

export type AgencyService = {
  id: string
  agencyId: string
  code: string
  carrier: string
  name: string
  desc: string
  maxWeightKg: number
  scope: string
  enabled: boolean
  category: string
  // Chỉ GHN dùng — GHN cấu hình bảng giá thủ công (zones × weight tiers)
  priceTableId?: string
  // Chỉ 247Express dùng — 247 không có bảng giá thủ công, tính phí trực tiếp qua
  // GetPriceForCustomerAPI theo ServiceTypeID + ClientHubID + tuyến + khối lượng
  serviceTypeId?: string
  // Chỉ 247Express dùng — 247 không có "Khu vực áp dụng" theo tỉnh/quận như GHN,
  // mà tính vùng dựa trên ClientHubID (điểm lấy hàng cố định của đại lý) + vùng giao hàng
  deliveryZones?: string[]
  shopConnectionIds: string[]
}

// Mutable list — starts with JSON data, new services pushed here at runtime
export const servicesList: AgencyService[] = servicesRaw as AgencyService[]

function nextCode(agencyId: string): string {
  const n = servicesList.filter(s => s.agencyId === agencyId).length + 1
  return String(n).padStart(3, '0')
}

export function addService(data: Omit<AgencyService, 'id' | 'code'>): AgencyService {
  const service: AgencyService = { ...data, id: `svc-${Date.now()}`, code: nextCode(data.agencyId) }
  servicesList.push(service)
  return service
}

export function updateService(id: string, patch: Partial<Omit<AgencyService, 'id'>>) {
  const service = servicesList.find(s => s.id === id)
  if (service) Object.assign(service, patch)
}

export function toggleServiceEnabled(id: string) {
  const service = servicesList.find(s => s.id === id)
  if (service) service.enabled = !service.enabled
}
