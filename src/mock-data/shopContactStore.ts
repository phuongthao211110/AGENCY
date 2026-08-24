// ── Danh sách liên hệ "Bên gửi" của từng shop ────────────────────────────────
// Mỗi shop có thể có NHIỀU liên hệ gửi hàng (khác địa chỉ lấy hàng chính) — dùng
// trong màn review import đơn hàng (chọn "Bên gửi" cho từng dòng). "Persistence"
// qua localStorage, cùng pattern với orderStore.ts (prototype, không có backend thật).

import allShops from './shops.json'

export interface ShopContact {
  id: string
  shopId: string
  name: string
  phone: string
  address: string
}

const STORAGE_KEY = 'ghn_shop_contacts_v1'

function seedContacts(): ShopContact[] {
  return allShops.map(s => ({
    id: `CT_${s.id}`,
    shopId: s.id,
    name: (s as any).ownerName ?? s.name,
    phone: (s as any).phone ?? '',
    address: (s as any).address ?? '',
  }))
}

export function loadContacts(): ShopContact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ShopContact[]
  } catch {
    /* fall through to reseed */
  }
  const seeded = seedContacts()
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)) } catch { /* storage unavailable */ }
  return seeded
}

function saveContacts(contacts: ShopContact[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts)) } catch { /* storage unavailable */ }
}

export function contactsForShop(shopId: string): ShopContact[] {
  return loadContacts().filter(c => c.shopId === shopId)
}

export function addContact(contact: ShopContact): ShopContact[] {
  const contacts = loadContacts()
  contacts.push(contact)
  saveContacts(contacts)
  return contacts
}

export function updateContact(id: string, updates: Partial<Omit<ShopContact, 'id' | 'shopId'>>): ShopContact[] {
  const contacts = loadContacts().map(c => (c.id === id ? { ...c, ...updates } : c))
  saveContacts(contacts)
  return contacts
}
