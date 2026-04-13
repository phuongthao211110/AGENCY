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
}

// Mutable list — starts with JSON data, new agencies prepended here at runtime
export const agenciesList: Agency[] = [...rawData]

export function addAgency(a: Agency) {
  agenciesList.unshift(a)
}
