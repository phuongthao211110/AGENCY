// Đầu số di động hợp lệ theo config thực tế của GHN (valid_mobilephone_headers,
// đã quy đổi có số 0 đầu, chỉ giữ đầu số 10 số hiện hành — bỏ đầu số cũ 11 số
// đã ngừng cấp mới từ 2018, không áp dụng cho SĐT đăng ký/liên hệ mới).
const VALID_PREFIXES_3 = [
  '032', '033', '034', '035', '036', '037', '038', '039', // Viettel
  '070', '071', '072', '073', '076', '077', '078', '079', '080', // MobiFone
  '081', '082', '083', '084', '085', '086', '087', '088', '089', // Vinaphone/Itel/Viettel
  '090', '091', '092', '093', '094', '095', '096', '097', '098', '099', // Viettel/Vinaphone/MobiFone/Vietnamobile/Gmobile
  '051', '052', '053', '054', '055', '056', '057', '058', '059', // Vietnamobile/Gmobile
]
const VALID_PREFIXES_4 = ['0868'] // Viettel — dải số đặc biệt 4 chữ số đầu

export function isValidVNPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  if (digits.length !== 10 || !digits.startsWith('0')) return false
  if (VALID_PREFIXES_4.some(p => digits.startsWith(p))) return true
  return VALID_PREFIXES_3.includes(digits.slice(0, 3))
}

export const PHONE_INVALID_MESSAGE = 'Số điện thoại không hợp lệ (VD: 0901234567)'
