export type Zone = 'HN' | 'HCM' | 'DN' | 'V1' | 'V2' | 'V3'

export interface District {
  name: string
}

export interface Province {
  name: string
  zone: Zone
  districts: District[]
}

// Zone definitions:
// HN  = Hà Nội (Đặc biệt)
// HCM = TP. Hồ Chí Minh (Đặc biệt)
// DN  = Đà Nẵng (Đặc biệt)
// V1  = Miền Nam: Bình Định trở vào (excl. HCM)
// V2  = Miền Trung: Quảng Ngãi → Quảng Bình
// V3  = Miền Bắc: Hà Tĩnh trở ra (excl. HN)

export const VIETNAM_PROVINCES: Province[] = [
  // ─── Đặc biệt ────────────────────────────────────────
  {
    name: 'Hà Nội',
    zone: 'HN',
    districts: [
      { name: 'Quận Ba Đình' }, { name: 'Quận Hoàn Kiếm' }, { name: 'Quận Tây Hồ' },
      { name: 'Quận Long Biên' }, { name: 'Quận Cầu Giấy' }, { name: 'Quận Đống Đa' },
      { name: 'Quận Hai Bà Trưng' }, { name: 'Quận Hoàng Mai' }, { name: 'Quận Thanh Xuân' },
      { name: 'Quận Nam Từ Liêm' }, { name: 'Quận Bắc Từ Liêm' }, { name: 'Quận Hà Đông' },
      { name: 'Thị xã Sơn Tây' }, { name: 'Huyện Ba Vì' }, { name: 'Huyện Chương Mỹ' },
      { name: 'Huyện Đan Phượng' }, { name: 'Huyện Đông Anh' }, { name: 'Huyện Gia Lâm' },
      { name: 'Huyện Hoài Đức' }, { name: 'Huyện Mê Linh' }, { name: 'Huyện Mỹ Đức' },
      { name: 'Huyện Phú Xuyên' }, { name: 'Huyện Phúc Thọ' }, { name: 'Huyện Quốc Oai' },
      { name: 'Huyện Sóc Sơn' }, { name: 'Huyện Thạch Thất' }, { name: 'Huyện Thanh Oai' },
      { name: 'Huyện Thanh Trì' }, { name: 'Huyện Thường Tín' }, { name: 'Huyện Ứng Hòa' },
    ],
  },
  {
    name: 'TP. Hồ Chí Minh',
    zone: 'HCM',
    districts: [
      { name: 'Quận 1' }, { name: 'Quận 3' }, { name: 'Quận 4' }, { name: 'Quận 5' },
      { name: 'Quận 6' }, { name: 'Quận 7' }, { name: 'Quận 8' }, { name: 'Quận 10' },
      { name: 'Quận 11' }, { name: 'Quận 12' }, { name: 'Quận Bình Thạnh' },
      { name: 'Quận Gò Vấp' }, { name: 'Quận Phú Nhuận' }, { name: 'Quận Tân Bình' },
      { name: 'Quận Tân Phú' }, { name: 'Quận Bình Tân' }, { name: 'TP. Thủ Đức' },
      { name: 'Huyện Bình Chánh' }, { name: 'Huyện Cần Giờ' }, { name: 'Huyện Củ Chi' },
      { name: 'Huyện Hóc Môn' }, { name: 'Huyện Nhà Bè' },
    ],
  },
  {
    name: 'Đà Nẵng',
    zone: 'DN',
    districts: [
      { name: 'Quận Hải Châu' }, { name: 'Quận Thanh Khê' }, { name: 'Quận Sơn Trà' },
      { name: 'Quận Ngũ Hành Sơn' }, { name: 'Quận Liên Chiểu' }, { name: 'Quận Cẩm Lệ' },
      { name: 'Huyện Hòa Vang' }, { name: 'Huyện Hoàng Sa' },
    ],
  },

  // ─── Vùng 3 — Miền Bắc (Hà Tĩnh trở ra, excl. Hà Nội) ──
  {
    name: 'Hà Tĩnh',
    zone: 'V3',
    districts: [
      { name: 'TP. Hà Tĩnh' }, { name: 'TX. Hồng Lĩnh' }, { name: 'TX. Kỳ Anh' },
      { name: 'Huyện Nghi Xuân' }, { name: 'Huyện Đức Thọ' }, { name: 'Huyện Hương Sơn' },
      { name: 'Huyện Hương Khê' }, { name: 'Huyện Thạch Hà' }, { name: 'Huyện Cẩm Xuyên' },
      { name: 'Huyện Kỳ Anh' }, { name: 'Huyện Vũ Quang' }, { name: 'Huyện Lộc Hà' },
      { name: 'Huyện Can Lộc' },
    ],
  },
  {
    name: 'Nghệ An',
    zone: 'V3',
    districts: [
      { name: 'TP. Vinh' }, { name: 'TX. Cửa Lò' }, { name: 'TX. Thái Hòa' },
      { name: 'TX. Hoàng Mai' }, { name: 'Huyện Anh Sơn' }, { name: 'Huyện Con Cuông' },
      { name: 'Huyện Diễn Châu' }, { name: 'Huyện Đô Lương' }, { name: 'Huyện Hưng Nguyên' },
      { name: 'Huyện Kỳ Sơn' }, { name: 'Huyện Nam Đàn' }, { name: 'Huyện Nghi Lộc' },
      { name: 'Huyện Nghĩa Đàn' }, { name: 'Huyện Quế Phong' }, { name: 'Huyện Quỳ Châu' },
      { name: 'Huyện Quỳ Hợp' }, { name: 'Huyện Quỳnh Lưu' }, { name: 'Huyện Tân Kỳ' },
      { name: 'Huyện Thanh Chương' }, { name: 'Huyện Tương Dương' }, { name: 'Huyện Yên Thành' },
    ],
  },
  {
    name: 'Thanh Hóa',
    zone: 'V3',
    districts: [
      { name: 'TP. Thanh Hóa' }, { name: 'TX. Bỉm Sơn' }, { name: 'TX. Sầm Sơn' },
      { name: 'Huyện Bá Thước' }, { name: 'Huyện Cẩm Thủy' }, { name: 'Huyện Đông Sơn' },
      { name: 'Huyện Hà Trung' }, { name: 'Huyện Hậu Lộc' }, { name: 'Huyện Hoằng Hóa' },
      { name: 'Huyện Lang Chánh' }, { name: 'Huyện Mường Lát' }, { name: 'Huyện Nga Sơn' },
      { name: 'Huyện Ngọc Lặc' }, { name: 'Huyện Như Thanh' }, { name: 'Huyện Như Xuân' },
      { name: 'Huyện Nông Cống' }, { name: 'Huyện Quan Hóa' }, { name: 'Huyện Quan Sơn' },
      { name: 'Huyện Quảng Xương' }, { name: 'Huyện Thạch Thành' }, { name: 'Huyện Thiệu Hóa' },
      { name: 'Huyện Thọ Xuân' }, { name: 'Huyện Thường Xuân' }, { name: 'Huyện Tĩnh Gia' },
      { name: 'Huyện Triệu Sơn' }, { name: 'Huyện Vĩnh Lộc' }, { name: 'Huyện Yên Định' },
    ],
  },
  {
    name: 'Sơn La',
    zone: 'V3',
    districts: [
      { name: 'TP. Sơn La' }, { name: 'Huyện Bắc Yên' }, { name: 'Huyện Mai Sơn' },
      { name: 'Huyện Mộc Châu' }, { name: 'Huyện Mường La' }, { name: 'Huyện Phù Yên' },
      { name: 'Huyện Quỳnh Nhai' }, { name: 'Huyện Sông Mã' }, { name: 'Huyện Sốp Cộp' },
      { name: 'Huyện Thuận Châu' }, { name: 'Huyện Vân Hồ' }, { name: 'Huyện Yên Châu' },
    ],
  },
  {
    name: 'Điện Biên',
    zone: 'V3',
    districts: [
      { name: 'TP. Điện Biên Phủ' }, { name: 'TX. Mường Lay' }, { name: 'Huyện Điện Biên' },
      { name: 'Huyện Điện Biên Đông' }, { name: 'Huyện Mường Ảng' }, { name: 'Huyện Mường Chà' },
      { name: 'Huyện Mường Nhé' }, { name: 'Huyện Nậm Pồ' }, { name: 'Huyện Tủa Chùa' },
      { name: 'Huyện Tuần Giáo' },
    ],
  },
  {
    name: 'Lai Châu',
    zone: 'V3',
    districts: [
      { name: 'TP. Lai Châu' }, { name: 'Huyện Mường Tè' }, { name: 'Huyện Nậm Nhùn' },
      { name: 'Huyện Phong Thổ' }, { name: 'Huyện Sìn Hồ' }, { name: 'Huyện Tam Đường' },
      { name: 'Huyện Tân Uyên' }, { name: 'Huyện Than Uyên' },
    ],
  },
  {
    name: 'Lào Cai',
    zone: 'V3',
    districts: [
      { name: 'TP. Lào Cai' }, { name: 'Huyện Bắc Hà' }, { name: 'Huyện Bảo Thắng' },
      { name: 'Huyện Bảo Yên' }, { name: 'Huyện Mường Khương' }, { name: 'Huyện Sa Pa' },
      { name: 'Huyện Si Ma Cai' }, { name: 'Huyện Văn Bàn' },
    ],
  },
  {
    name: 'Hà Giang',
    zone: 'V3',
    districts: [
      { name: 'TP. Hà Giang' }, { name: 'Huyện Bắc Mê' }, { name: 'Huyện Bắc Quang' },
      { name: 'Huyện Đồng Văn' }, { name: 'Huyện Hoàng Su Phì' }, { name: 'Huyện Mèo Vạc' },
      { name: 'Huyện Quản Bạ' }, { name: 'Huyện Quang Bình' }, { name: 'Huyện Vị Xuyên' },
      { name: 'Huyện Xín Mần' }, { name: 'Huyện Yên Minh' },
    ],
  },
  {
    name: 'Cao Bằng',
    zone: 'V3',
    districts: [
      { name: 'TP. Cao Bằng' }, { name: 'Huyện Bảo Lạc' }, { name: 'Huyện Bảo Lâm' },
      { name: 'Huyện Hạ Lang' }, { name: 'Huyện Hà Quảng' }, { name: 'Huyện Hòa An' },
      { name: 'Huyện Nguyên Bình' }, { name: 'Huyện Phục Hòa' }, { name: 'Huyện Quảng Hòa' },
      { name: 'Huyện Thạch An' }, { name: 'Huyện Trùng Khánh' },
    ],
  },
  {
    name: 'Bắc Kạn',
    zone: 'V3',
    districts: [
      { name: 'TP. Bắc Kạn' }, { name: 'Huyện Ba Bể' }, { name: 'Huyện Bạch Thông' },
      { name: 'Huyện Chợ Đồn' }, { name: 'Huyện Chợ Mới' }, { name: 'Huyện Na Rì' },
      { name: 'Huyện Ngân Sơn' }, { name: 'Huyện Pắc Nặm' },
    ],
  },
  {
    name: 'Tuyên Quang',
    zone: 'V3',
    districts: [
      { name: 'TP. Tuyên Quang' }, { name: 'Huyện Chiêm Hóa' }, { name: 'Huyện Hàm Yên' },
      { name: 'Huyện Lâm Bình' }, { name: 'Huyện Na Hang' }, { name: 'Huyện Sơn Dương' },
      { name: 'Huyện Yên Sơn' },
    ],
  },
  {
    name: 'Yên Bái',
    zone: 'V3',
    districts: [
      { name: 'TP. Yên Bái' }, { name: 'TX. Nghĩa Lộ' }, { name: 'Huyện Lục Yên' },
      { name: 'Huyện Mù Cang Chải' }, { name: 'Huyện Trấn Yên' }, { name: 'Huyện Trạm Tấu' },
      { name: 'Huyện Văn Chấn' }, { name: 'Huyện Văn Yên' }, { name: 'Huyện Yên Bình' },
    ],
  },
  {
    name: 'Phú Thọ',
    zone: 'V3',
    districts: [
      { name: 'TP. Việt Trì' }, { name: 'TX. Phú Thọ' }, { name: 'Huyện Cẩm Khê' },
      { name: 'Huyện Đoan Hùng' }, { name: 'Huyện Hạ Hòa' }, { name: 'Huyện Lâm Thao' },
      { name: 'Huyện Phù Ninh' }, { name: 'Huyện Tam Nông' }, { name: 'Huyện Tân Sơn' },
      { name: 'Huyện Thanh Ba' }, { name: 'Huyện Thanh Sơn' }, { name: 'Huyện Thanh Thủy' },
      { name: 'Huyện Yên Lập' },
    ],
  },
  {
    name: 'Vĩnh Phúc',
    zone: 'V3',
    districts: [
      { name: 'TP. Vĩnh Yên' }, { name: 'TP. Phúc Yên' }, { name: 'Huyện Bình Xuyên' },
      { name: 'Huyện Lập Thạch' }, { name: 'Huyện Sông Lô' }, { name: 'Huyện Tam Dương' },
      { name: 'Huyện Tam Đảo' }, { name: 'Huyện Vĩnh Tường' }, { name: 'Huyện Yên Lạc' },
    ],
  },
  {
    name: 'Hòa Bình',
    zone: 'V3',
    districts: [
      { name: 'TP. Hòa Bình' }, { name: 'Huyện Cao Phong' }, { name: 'Huyện Đà Bắc' },
      { name: 'Huyện Kim Bôi' }, { name: 'Huyện Kỳ Sơn' }, { name: 'Huyện Lạc Sơn' },
      { name: 'Huyện Lạc Thủy' }, { name: 'Huyện Lương Sơn' }, { name: 'Huyện Mai Châu' },
      { name: 'Huyện Tân Lạc' }, { name: 'Huyện Yên Thủy' },
    ],
  },
  {
    name: 'Hà Nam',
    zone: 'V3',
    districts: [
      { name: 'TP. Phủ Lý' }, { name: 'TX. Duy Tiên' }, { name: 'Huyện Bình Lục' },
      { name: 'Huyện Kim Bảng' }, { name: 'Huyện Lý Nhân' }, { name: 'Huyện Thanh Liêm' },
    ],
  },
  {
    name: 'Nam Định',
    zone: 'V3',
    districts: [
      { name: 'TP. Nam Định' }, { name: 'Huyện Giao Thủy' }, { name: 'Huyện Hải Hậu' },
      { name: 'Huyện Mỹ Lộc' }, { name: 'Huyện Nam Trực' }, { name: 'Huyện Nghĩa Hưng' },
      { name: 'Huyện Trực Ninh' }, { name: 'Huyện Vụ Bản' }, { name: 'Huyện Xuân Trường' },
      { name: 'Huyện Ý Yên' },
    ],
  },
  {
    name: 'Ninh Bình',
    zone: 'V3',
    districts: [
      { name: 'TP. Ninh Bình' }, { name: 'TP. Tam Điệp' }, { name: 'Huyện Gia Viễn' },
      { name: 'Huyện Hoa Lư' }, { name: 'Huyện Kim Sơn' }, { name: 'Huyện Nho Quan' },
      { name: 'Huyện Yên Khánh' }, { name: 'Huyện Yên Mô' },
    ],
  },
  {
    name: 'Thái Bình',
    zone: 'V3',
    districts: [
      { name: 'TP. Thái Bình' }, { name: 'Huyện Đông Hưng' }, { name: 'Huyện Hưng Hà' },
      { name: 'Huyện Kiến Xương' }, { name: 'Huyện Quỳnh Phụ' }, { name: 'Huyện Thái Thụy' },
      { name: 'Huyện Tiền Hải' }, { name: 'Huyện Vũ Thư' },
    ],
  },
  {
    name: 'Hải Phòng',
    zone: 'V3',
    districts: [
      { name: 'Quận Hồng Bàng' }, { name: 'Quận Lê Chân' }, { name: 'Quận Ngô Quyền' },
      { name: 'Quận Kiến An' }, { name: 'Quận Hải An' }, { name: 'Quận Đồ Sơn' },
      { name: 'Quận Dương Kinh' }, { name: 'Huyện An Dương' }, { name: 'Huyện An Lão' },
      { name: 'Huyện Bạch Long Vĩ' }, { name: 'Huyện Cát Hải' }, { name: 'Huyện Kiến Thụy' },
      { name: 'Huyện Thủy Nguyên' }, { name: 'Huyện Tiên Lãng' }, { name: 'Huyện Vĩnh Bảo' },
    ],
  },
  {
    name: 'Hải Dương',
    zone: 'V3',
    districts: [
      { name: 'TP. Hải Dương' }, { name: 'TX. Chí Linh' }, { name: 'TX. Kinh Môn' },
      { name: 'Huyện Bình Giang' }, { name: 'Huyện Cẩm Giàng' }, { name: 'Huyện Gia Lộc' },
      { name: 'Huyện Kim Thành' }, { name: 'Huyện Nam Sách' }, { name: 'Huyện Ninh Giang' },
      { name: 'Huyện Thanh Hà' }, { name: 'Huyện Thanh Miện' }, { name: 'Huyện Tứ Kỳ' },
    ],
  },
  {
    name: 'Hưng Yên',
    zone: 'V3',
    districts: [
      { name: 'TP. Hưng Yên' }, { name: 'Huyện Ân Thi' }, { name: 'Huyện Khoái Châu' },
      { name: 'Huyện Kim Động' }, { name: 'Huyện Mỹ Hào' }, { name: 'Huyện Phù Cừ' },
      { name: 'Huyện Tiên Lữ' }, { name: 'Huyện Văn Giang' }, { name: 'Huyện Văn Lâm' },
      { name: 'Huyện Yên Mỹ' },
    ],
  },
  {
    name: 'Bắc Giang',
    zone: 'V3',
    districts: [
      { name: 'TP. Bắc Giang' }, { name: 'Huyện Hiệp Hòa' }, { name: 'Huyện Lạng Giang' },
      { name: 'Huyện Lục Nam' }, { name: 'Huyện Lục Ngạn' }, { name: 'Huyện Sơn Động' },
      { name: 'Huyện Tân Yên' }, { name: 'Huyện Việt Yên' }, { name: 'Huyện Yên Dũng' },
      { name: 'Huyện Yên Thế' },
    ],
  },
  {
    name: 'Bắc Ninh',
    zone: 'V3',
    districts: [
      { name: 'TP. Bắc Ninh' }, { name: 'TX. Từ Sơn' }, { name: 'Huyện Gia Bình' },
      { name: 'Huyện Lương Tài' }, { name: 'Huyện Quế Võ' }, { name: 'Huyện Thuận Thành' },
      { name: 'Huyện Tiên Du' }, { name: 'Huyện Yên Phong' },
    ],
  },
  {
    name: 'Thái Nguyên',
    zone: 'V3',
    districts: [
      { name: 'TP. Thái Nguyên' }, { name: 'TP. Sông Công' }, { name: 'TX. Phổ Yên' },
      { name: 'Huyện Định Hóa' }, { name: 'Huyện Đại Từ' }, { name: 'Huyện Đồng Hỷ' },
      { name: 'Huyện Phú Bình' }, { name: 'Huyện Phú Lương' }, { name: 'Huyện Võ Nhai' },
    ],
  },
  {
    name: 'Lạng Sơn',
    zone: 'V3',
    districts: [
      { name: 'TP. Lạng Sơn' }, { name: 'Huyện Bắc Sơn' }, { name: 'Huyện Bình Gia' },
      { name: 'Huyện Cao Lộc' }, { name: 'Huyện Chi Lăng' }, { name: 'Huyện Đình Lập' },
      { name: 'Huyện Hữu Lũng' }, { name: 'Huyện Lộc Bình' }, { name: 'Huyện Tràng Định' },
      { name: 'Huyện Văn Lãng' }, { name: 'Huyện Văn Quan' },
    ],
  },
  {
    name: 'Quảng Ninh',
    zone: 'V3',
    districts: [
      { name: 'TP. Hạ Long' }, { name: 'TP. Cẩm Phả' }, { name: 'TP. Uông Bí' },
      { name: 'TX. Đông Triều' }, { name: 'TX. Quảng Yên' }, { name: 'Huyện Ba Chẽ' },
      { name: 'Huyện Bình Liêu' }, { name: 'Huyện Cô Tô' }, { name: 'Huyện Đầm Hà' },
      { name: 'Huyện Hải Hà' }, { name: 'Huyện Hoành Bồ' }, { name: 'Huyện Móng Cái' },
      { name: 'Huyện Tiên Yên' }, { name: 'Huyện Vân Đồn' },
    ],
  },

  // ─── Vùng 2 — Miền Trung (Quảng Bình → Quảng Ngãi) ─
  {
    name: 'Quảng Bình',
    zone: 'V2',
    districts: [
      { name: 'TP. Đồng Hới' }, { name: 'TX. Ba Đồn' }, { name: 'Huyện Bố Trạch' },
      { name: 'Huyện Lệ Thủy' }, { name: 'Huyện Minh Hóa' }, { name: 'Huyện Quảng Ninh' },
      { name: 'Huyện Quảng Trạch' }, { name: 'Huyện Tuyên Hóa' },
    ],
  },
  {
    name: 'Quảng Trị',
    zone: 'V2',
    districts: [
      { name: 'TP. Đông Hà' }, { name: 'TX. Quảng Trị' }, { name: 'Huyện Cam Lộ' },
      { name: 'Huyện Cồn Cỏ' }, { name: 'Huyện Đa Krông' }, { name: 'Huyện Gio Linh' },
      { name: 'Huyện Hải Lăng' }, { name: 'Huyện Hướng Hóa' }, { name: 'Huyện Triệu Phong' },
      { name: 'Huyện Vĩnh Linh' },
    ],
  },
  {
    name: 'Thừa Thiên Huế',
    zone: 'V2',
    districts: [
      { name: 'TP. Huế' }, { name: 'TX. Hương Thủy' }, { name: 'TX. Hương Trà' },
      { name: 'Huyện A Lưới' }, { name: 'Huyện Nam Đông' }, { name: 'Huyện Phong Điền' },
      { name: 'Huyện Phú Lộc' }, { name: 'Huyện Phú Vang' }, { name: 'Huyện Quảng Điền' },
    ],
  },
  {
    name: 'Quảng Nam',
    zone: 'V2',
    districts: [
      { name: 'TP. Tam Kỳ' }, { name: 'TP. Hội An' }, { name: 'TX. Điện Bàn' },
      { name: 'Huyện Bắc Trà My' }, { name: 'Huyện Đại Lộc' }, { name: 'Huyện Đông Giang' },
      { name: 'Huyện Duy Xuyên' }, { name: 'Huyện Hiệp Đức' }, { name: 'Huyện Nam Giang' },
      { name: 'Huyện Nam Trà My' }, { name: 'Huyện Nông Sơn' }, { name: 'Huyện Núi Thành' },
      { name: 'Huyện Phước Sơn' }, { name: 'Huyện Quế Sơn' }, { name: 'Huyện Tây Giang' },
      { name: 'Huyện Thăng Bình' }, { name: 'Huyện Tiên Phước' },
    ],
  },
  {
    name: 'Quảng Ngãi',
    zone: 'V1',
    districts: [
      { name: 'TP. Quảng Ngãi' }, { name: 'TX. Đức Phổ' }, { name: 'Huyện Ba Tơ' },
      { name: 'Huyện Bình Sơn' }, { name: 'Huyện Đức Phổ' }, { name: 'Huyện Lý Sơn' },
      { name: 'Huyện Minh Long' }, { name: 'Huyện Mộ Đức' }, { name: 'Huyện Nghĩa Hành' },
      { name: 'Huyện Sơn Hà' }, { name: 'Huyện Sơn Tây' }, { name: 'Huyện Sơn Tịnh' },
      { name: 'Huyện Tây Trà' }, { name: 'Huyện Trà Bồng' }, { name: 'Huyện Tư Nghĩa' },
    ],
  },

  // ─── Vùng 1 — Miền Nam (Bình Định trở vào, excl. HCM) ──
  {
    name: 'Bình Định',
    zone: 'V1',
    districts: [
      { name: 'TP. Quy Nhơn' }, { name: 'TX. An Nhơn' }, { name: 'TX. Hoài Nhơn' },
      { name: 'Huyện An Lão' }, { name: 'Huyện Hoài Ân' }, { name: 'Huyện Phù Cát' },
      { name: 'Huyện Phù Mỹ' }, { name: 'Huyện Tây Sơn' }, { name: 'Huyện Tuy Phước' },
      { name: 'Huyện Vân Canh' }, { name: 'Huyện Vĩnh Thạnh' },
    ],
  },
  {
    name: 'Phú Yên',
    zone: 'V1',
    districts: [
      { name: 'TP. Tuy Hòa' }, { name: 'TX. Đông Hòa' }, { name: 'TX. Sông Cầu' },
      { name: 'Huyện Đồng Xuân' }, { name: 'Huyện Phú Hòa' }, { name: 'Huyện Sông Hinh' },
      { name: 'Huyện Sơn Hòa' }, { name: 'Huyện Tây Hòa' }, { name: 'Huyện Tuy An' },
    ],
  },
  {
    name: 'Khánh Hòa',
    zone: 'V1',
    districts: [
      { name: 'TP. Nha Trang' }, { name: 'TP. Cam Ranh' }, { name: 'TX. Ninh Hòa' },
      { name: 'Huyện Cam Lâm' }, { name: 'Huyện Diên Khánh' }, { name: 'Huyện Khánh Sơn' },
      { name: 'Huyện Khánh Vĩnh' }, { name: 'Huyện Trường Sa' }, { name: 'Huyện Vạn Ninh' },
    ],
  },
  {
    name: 'Ninh Thuận',
    zone: 'V1',
    districts: [
      { name: 'TP. Phan Rang - Tháp Chàm' }, { name: 'Huyện Bác Ái' }, { name: 'Huyện Ninh Hải' },
      { name: 'Huyện Ninh Phước' }, { name: 'Huyện Ninh Sơn' }, { name: 'Huyện Thuận Bắc' },
      { name: 'Huyện Thuận Nam' },
    ],
  },
  {
    name: 'Bình Thuận',
    zone: 'V1',
    districts: [
      { name: 'TP. Phan Thiết' }, { name: 'TX. La Gi' }, { name: 'Huyện Bắc Bình' },
      { name: 'Huyện Đức Linh' }, { name: 'Huyện Hàm Tân' }, { name: 'Huyện Hàm Thuận Bắc' },
      { name: 'Huyện Hàm Thuận Nam' }, { name: 'Huyện Phú Quý' }, { name: 'Huyện Tánh Linh' },
      { name: 'Huyện Tuy Phong' },
    ],
  },
  {
    name: 'Kon Tum',
    zone: 'V1',
    districts: [
      { name: 'TP. Kon Tum' }, { name: 'Huyện Đắk Glei' }, { name: 'Huyện Đắk Hà' },
      { name: 'Huyện Đắk Tô' }, { name: 'Huyện Ia H\'Drai' }, { name: 'Huyện Kon Plông' },
      { name: 'Huyện Kon Rẫy' }, { name: 'Huyện Ngọc Hồi' }, { name: 'Huyện Sa Thầy' },
      { name: 'Huyện Tu Mơ Rông' },
    ],
  },
  {
    name: 'Gia Lai',
    zone: 'V1',
    districts: [
      { name: 'TP. Pleiku' }, { name: 'TX. An Khê' }, { name: 'TX. Ayun Pa' },
      { name: 'Huyện Chư Păh' }, { name: 'Huyện Chư Prông' }, { name: 'Huyện Chư Pưh' },
      { name: 'Huyện Chư Sê' }, { name: 'Huyện Đắk Đoa' }, { name: 'Huyện Đắk Pơ' },
      { name: 'Huyện Đức Cơ' }, { name: 'Huyện Ia Grai' }, { name: 'Huyện Ia Pa' },
      { name: 'Huyện KBang' }, { name: 'Huyện Kông Chro' }, { name: 'Huyện Krông Pa' },
      { name: 'Huyện Mang Yang' }, { name: 'Huyện Phú Thiện' },
    ],
  },
  {
    name: 'Đắk Lắk',
    zone: 'V1',
    districts: [
      { name: 'TP. Buôn Ma Thuột' }, { name: 'TX. Buôn Hồ' }, { name: 'Huyện Buôn Đôn' },
      { name: 'Huyện Cư Kuin' }, { name: 'Huyện Cư M\'gar' }, { name: 'Huyện Ea H\'leo' },
      { name: 'Huyện Ea Kar' }, { name: 'Huyện Ea Súp' }, { name: 'Huyện Krông Ana' },
      { name: 'Huyện Krông Bông' }, { name: 'Huyện Krông Búk' }, { name: 'Huyện Krông Năng' },
      { name: 'Huyện Krông Pắc' }, { name: 'Huyện Lắk' }, { name: 'Huyện M\'Đrắk' },
    ],
  },
  {
    name: 'Đắk Nông',
    zone: 'V1',
    districts: [
      { name: 'TP. Gia Nghĩa' }, { name: 'Huyện Cư Jút' }, { name: 'Huyện Đắk Glong' },
      { name: 'Huyện Đắk Mil' }, { name: 'Huyện Đắk R\'Lấp' }, { name: 'Huyện Đắk Song' },
      { name: 'Huyện Krông Nô' }, { name: 'Huyện Tuy Đức' },
    ],
  },
  {
    name: 'Lâm Đồng',
    zone: 'V1',
    districts: [
      { name: 'TP. Đà Lạt' }, { name: 'TP. Bảo Lộc' }, { name: 'Huyện Bảo Lâm' },
      { name: 'Huyện Cát Tiên' }, { name: 'Huyện Đạ Huoai' }, { name: 'Huyện Đạ Tẻh' },
      { name: 'Huyện Đam Rông' }, { name: 'Huyện Di Linh' }, { name: 'Huyện Đơn Dương' },
      { name: 'Huyện Đức Trọng' }, { name: 'Huyện Lạc Dương' }, { name: 'Huyện Lâm Hà' },
    ],
  },
  {
    name: 'Bình Phước',
    zone: 'V1',
    districts: [
      { name: 'TP. Đồng Xoài' }, { name: 'TX. Bình Long' }, { name: 'TX. Phước Long' },
      { name: 'TX. Chơn Thành' }, { name: 'Huyện Bù Đăng' }, { name: 'Huyện Bù Đốp' },
      { name: 'Huyện Bù Gia Mập' }, { name: 'Huyện Đồng Phú' }, { name: 'Huyện Hớn Quản' },
      { name: 'Huyện Lộc Ninh' }, { name: 'Huyện Phú Riềng' },
    ],
  },
  {
    name: 'Tây Ninh',
    zone: 'V1',
    districts: [
      { name: 'TP. Tây Ninh' }, { name: 'Huyện Bến Cầu' }, { name: 'Huyện Châu Thành' },
      { name: 'Huyện Dương Minh Châu' }, { name: 'Huyện Gò Dầu' }, { name: 'Huyện Hòa Thành' },
      { name: 'Huyện Tân Biên' }, { name: 'Huyện Tân Châu' }, { name: 'Huyện Trảng Bàng' },
    ],
  },
  {
    name: 'Bình Dương',
    zone: 'V1',
    districts: [
      { name: 'TP. Thủ Dầu Một' }, { name: 'TP. Dĩ An' }, { name: 'TP. Thuận An' },
      { name: 'TX. Bến Cát' }, { name: 'TX. Tân Uyên' }, { name: 'Huyện Bàu Bàng' },
      { name: 'Huyện Bắc Tân Uyên' }, { name: 'Huyện Dầu Tiếng' }, { name: 'Huyện Phú Giáo' },
    ],
  },
  {
    name: 'Đồng Nai',
    zone: 'V1',
    districts: [
      { name: 'TP. Biên Hòa' }, { name: 'TP. Long Khánh' }, { name: 'Huyện Cẩm Mỹ' },
      { name: 'Huyện Định Quán' }, { name: 'Huyện Long Thành' }, { name: 'Huyện Nhơn Trạch' },
      { name: 'Huyện Tân Phú' }, { name: 'Huyện Thống Nhất' }, { name: 'Huyện Trảng Bom' },
      { name: 'Huyện Vĩnh Cửu' }, { name: 'Huyện Xuân Lộc' },
    ],
  },
  {
    name: 'Bà Rịa - Vũng Tàu',
    zone: 'V1',
    districts: [
      { name: 'TP. Vũng Tàu' }, { name: 'TP. Bà Rịa' }, { name: 'TX. Phú Mỹ' },
      { name: 'Huyện Châu Đức' }, { name: 'Huyện Côn Đảo' }, { name: 'Huyện Đất Đỏ' },
      { name: 'Huyện Long Điền' }, { name: 'Huyện Xuyên Mộc' },
    ],
  },
  {
    name: 'Long An',
    zone: 'V1',
    districts: [
      { name: 'TP. Tân An' }, { name: 'TX. Kiến Tường' }, { name: 'Huyện Bến Lức' },
      { name: 'Huyện Cần Đước' }, { name: 'Huyện Cần Giuộc' }, { name: 'Huyện Châu Thành' },
      { name: 'Huyện Đức Hòa' }, { name: 'Huyện Đức Huệ' }, { name: 'Huyện Mộc Hóa' },
      { name: 'Huyện Tân Hưng' }, { name: 'Huyện Tân Thạnh' }, { name: 'Huyện Tân Trụ' },
      { name: 'Huyện Thạnh Hóa' }, { name: 'Huyện Thủ Thừa' }, { name: 'Huyện Vĩnh Hưng' },
    ],
  },
  {
    name: 'Tiền Giang',
    zone: 'V1',
    districts: [
      { name: 'TP. Mỹ Tho' }, { name: 'TX. Cai Lậy' }, { name: 'TX. Gò Công' },
      { name: 'Huyện Cái Bè' }, { name: 'Huyện Cai Lậy' }, { name: 'Huyện Châu Thành' },
      { name: 'Huyện Chợ Gạo' }, { name: 'Huyện Gò Công Đông' }, { name: 'Huyện Gò Công Tây' },
      { name: 'Huyện Tân Phú Đông' }, { name: 'Huyện Tân Phước' },
    ],
  },
  {
    name: 'Bến Tre',
    zone: 'V1',
    districts: [
      { name: 'TP. Bến Tre' }, { name: 'Huyện Ba Tri' }, { name: 'Huyện Bình Đại' },
      { name: 'Huyện Châu Thành' }, { name: 'Huyện Chợ Lách' }, { name: 'Huyện Giồng Trôm' },
      { name: 'Huyện Mỏ Cày Bắc' }, { name: 'Huyện Mỏ Cày Nam' }, { name: 'Huyện Thạnh Phú' },
    ],
  },
  {
    name: 'Trà Vinh',
    zone: 'V1',
    districts: [
      { name: 'TP. Trà Vinh' }, { name: 'Huyện Càng Long' }, { name: 'Huyện Cầu Kè' },
      { name: 'Huyện Cầu Ngang' }, { name: 'Huyện Châu Thành' }, { name: 'Huyện Duyên Hải' },
      { name: 'Huyện Tiểu Cần' }, { name: 'Huyện Trà Cú' },
    ],
  },
  {
    name: 'Vĩnh Long',
    zone: 'V1',
    districts: [
      { name: 'TP. Vĩnh Long' }, { name: 'TX. Bình Minh' }, { name: 'Huyện Bình Tân' },
      { name: 'Huyện Long Hồ' }, { name: 'Huyện Mang Thít' }, { name: 'Huyện Tam Bình' },
      { name: 'Huyện Trà Ôn' }, { name: 'Huyện Vũng Liêm' },
    ],
  },
  {
    name: 'Đồng Tháp',
    zone: 'V1',
    districts: [
      { name: 'TP. Cao Lãnh' }, { name: 'TP. Sa Đéc' }, { name: 'TX. Hồng Ngự' },
      { name: 'Huyện Cao Lãnh' }, { name: 'Huyện Châu Thành' }, { name: 'Huyện Hồng Ngự' },
      { name: 'Huyện Lai Vung' }, { name: 'Huyện Lấp Vò' }, { name: 'Huyện Tam Nông' },
      { name: 'Huyện Tân Hồng' }, { name: 'Huyện Thanh Bình' }, { name: 'Huyện Tháp Mười' },
    ],
  },
  {
    name: 'An Giang',
    zone: 'V1',
    districts: [
      { name: 'TP. Long Xuyên' }, { name: 'TP. Châu Đốc' }, { name: 'TX. Tân Châu' },
      { name: 'Huyện An Phú' }, { name: 'Huyện Châu Phú' }, { name: 'Huyện Châu Thành' },
      { name: 'Huyện Chợ Mới' }, { name: 'Huyện Phú Tân' }, { name: 'Huyện Thoại Sơn' },
      { name: 'Huyện Tịnh Biên' }, { name: 'Huyện Tri Tôn' },
    ],
  },
  {
    name: 'Kiên Giang',
    zone: 'V1',
    districts: [
      { name: 'TP. Rạch Giá' }, { name: 'TP. Phú Quốc' }, { name: 'TX. Hà Tiên' },
      { name: 'Huyện An Biên' }, { name: 'Huyện An Minh' }, { name: 'Huyện Châu Thành' },
      { name: 'Huyện Giang Thành' }, { name: 'Huyện Giồng Riềng' }, { name: 'Huyện Gò Quao' },
      { name: 'Huyện Hòn Đất' }, { name: 'Huyện Kiên Hải' }, { name: 'Huyện Kiên Lương' },
      { name: 'Huyện Tân Hiệp' }, { name: 'Huyện U Minh Thượng' }, { name: 'Huyện Vĩnh Thuận' },
    ],
  },
  {
    name: 'Cần Thơ',
    zone: 'V1',
    districts: [
      { name: 'Quận Ninh Kiều' }, { name: 'Quận Bình Thủy' }, { name: 'Quận Cái Răng' },
      { name: 'Quận Ô Môn' }, { name: 'Quận Thốt Nốt' }, { name: 'Huyện Cờ Đỏ' },
      { name: 'Huyện Phong Điền' }, { name: 'Huyện Thới Lai' }, { name: 'Huyện Vĩnh Thạnh' },
    ],
  },
  {
    name: 'Hậu Giang',
    zone: 'V1',
    districts: [
      { name: 'TP. Vị Thanh' }, { name: 'TP. Ngã Bảy' }, { name: 'TX. Long Mỹ' },
      { name: 'Huyện Châu Thành' }, { name: 'Huyện Châu Thành A' }, { name: 'Huyện Long Mỹ' },
      { name: 'Huyện Phụng Hiệp' }, { name: 'Huyện Vị Thủy' },
    ],
  },
  {
    name: 'Sóc Trăng',
    zone: 'V1',
    districts: [
      { name: 'TP. Sóc Trăng' }, { name: 'TX. Ngã Năm' }, { name: 'TX. Vĩnh Châu' },
      { name: 'Huyện Châu Thành' }, { name: 'Huyện Cù Lao Dung' }, { name: 'Huyện Kế Sách' },
      { name: 'Huyện Long Phú' }, { name: 'Huyện Mỹ Tú' }, { name: 'Huyện Mỹ Xuyên' },
      { name: 'Huyện Thạnh Trị' }, { name: 'Huyện Trần Đề' },
    ],
  },
  {
    name: 'Bạc Liêu',
    zone: 'V1',
    districts: [
      { name: 'TP. Bạc Liêu' }, { name: 'Huyện Đông Hải' }, { name: 'Huyện Giá Rai' },
      { name: 'Huyện Hòa Bình' }, { name: 'Huyện Hồng Dân' }, { name: 'Huyện Phước Long' },
      { name: 'Huyện Vĩnh Lợi' },
    ],
  },
  {
    name: 'Cà Mau',
    zone: 'V1',
    districts: [
      { name: 'TP. Cà Mau' }, { name: 'Huyện Cái Nước' }, { name: 'Huyện Đầm Dơi' },
      { name: 'Huyện Năm Căn' }, { name: 'Huyện Ngọc Hiển' }, { name: 'Huyện Phú Tân' },
      { name: 'Huyện Thới Bình' }, { name: 'Huyện Trần Văn Thời' }, { name: 'Huyện U Minh' },
    ],
  },
]

export function getZone(provinceName: string): Zone | null {
  const p = VIETNAM_PROVINCES.find((x) => x.name === provinceName)
  return p ? p.zone : null
}

export type RouteType =
  | 'Nội Tỉnh'
  | 'Nội Vùng'
  | 'Nội Vùng Tỉnh'
  | 'Liên Vùng Đặc Biệt'
  | 'Liên Vùng'
  | 'Liên Vùng Tỉnh'

export interface RouteResult {
  route: RouteType
  description: string
  color: string
  bgColor: string
  fromZone: Zone
  toZone: Zone
}

// Priority: Nội Tỉnh → Liên Vùng Đặc Biệt → Nội Vùng → Liên Vùng → Nội Vùng Tỉnh → Liên Vùng Tỉnh
export function determineRoute(fromProvince: string, toProvince: string): RouteResult | null {
  const fromZone = getZone(fromProvince)
  const toZone = getZone(toProvince)
  if (!fromZone || !toZone) return null

  const specials: Zone[] = ['HN', 'DN', 'HCM']

  // 1. Nội Tỉnh
  if (fromProvince === toProvince) {
    return {
      route: 'Nội Tỉnh',
      description: `Giao hàng trong cùng tỉnh/thành phố — ${fromProvince}`,
      color: '#059669',
      bgColor: '#ECFDF5',
      fromZone,
      toZone,
    }
  }

  // 2. Liên Vùng Đặc Biệt: giữa 3 TP lớn (HN↔ĐN / ĐN↔HCM / HCM↔HN)
  if (specials.includes(fromZone) && specials.includes(toZone)) {
    return {
      route: 'Liên Vùng Đặc Biệt',
      description: 'Giao hàng giữa 3 thành phố lớn — Hà Nội, Đà Nẵng, TP. Hồ Chí Minh',
      color: '#D97706',
      bgColor: '#FFFBEB',
      fromZone,
      toZone,
    }
  }

  // 3. Nội Vùng: HN↔V3 / ĐN↔V2 / HCM↔V1
  const noiVungPairs: [Zone, Zone][] = [['HN', 'V3'], ['DN', 'V2'], ['HCM', 'V1']]
  for (const [a, b] of noiVungPairs) {
    if ((fromZone === a && toZone === b) || (fromZone === b && toZone === a)) {
      const cityName = fromZone === 'HN' || toZone === 'HN' ? 'Hà Nội' : fromZone === 'DN' || toZone === 'DN' ? 'Đà Nẵng' : 'TP. Hồ Chí Minh'
      const vungName = a === 'V3' || b === 'V3' ? 'Vùng 3' : a === 'V2' || b === 'V2' ? 'Vùng 2' : 'Vùng 1'
      return {
        route: 'Nội Vùng',
        description: `Giao hàng nội vùng — ${cityName} và các tỉnh ${vungName} lân cận`,
        color: '#2563EB',
        bgColor: '#EFF6FF',
        fromZone,
        toZone,
      }
    }
  }

  // 4. Liên Vùng: HN↔V1/V2 / ĐN↔V1/V3 / HCM↔V2/V3
  const lienVungPairs: [Zone, Zone][] = [
    ['HN', 'V1'], ['HN', 'V2'],
    ['DN', 'V1'], ['DN', 'V3'],
    ['HCM', 'V2'], ['HCM', 'V3'],
  ]
  for (const [a, b] of lienVungPairs) {
    if ((fromZone === a && toZone === b) || (fromZone === b && toZone === a)) {
      return {
        route: 'Liên Vùng',
        description: 'Giao hàng liên vùng — TP lớn đến tỉnh vùng xa',
        color: '#7C3AED',
        bgColor: '#F5F3FF',
        fromZone,
        toZone,
      }
    }
  }

  // 5. Nội Vùng Tỉnh: khác tỉnh, cùng vùng, không phải 3 TP lớn
  if (fromZone === toZone && !specials.includes(fromZone)) {
    const vungName = fromZone === 'V1' ? 'Vùng 1' : fromZone === 'V2' ? 'Vùng 2' : 'Vùng 3'
    return {
      route: 'Nội Vùng Tỉnh',
      description: `Giao hàng nội vùng tỉnh — khác tỉnh trong cùng ${vungName}`,
      color: '#0891B2',
      bgColor: '#ECFEFF',
      fromZone,
      toZone,
    }
  }

  // 6. Liên Vùng Tỉnh: 2 tỉnh thuộc 2 vùng khác nhau
  return {
    route: 'Liên Vùng Tỉnh',
    description: 'Giao hàng liên vùng tỉnh — giữa các tỉnh thuộc 2 vùng khác nhau',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    fromZone,
    toZone,
  }
}

export const ZONE_LABELS: Record<Zone, string> = {
  HN: 'Hà Nội (Đặc biệt)',
  DN: 'Đà Nẵng (Đặc biệt)',
  HCM: 'TP. HCM (Đặc biệt)',
  V1: 'Vùng 1',
  V2: 'Vùng 2',
  V3: 'Vùng 3',
}

export const ZONE_COLORS: Record<Zone, { bg: string; color: string }> = {
  HN: { bg: '#FFF4ED', color: '#FF5200' },
  DN: { bg: '#FFF4ED', color: '#FF5200' },
  HCM: { bg: '#FFF4ED', color: '#FF5200' },
  V1: { bg: '#ECFDF5', color: '#059669' },
  V2: { bg: '#ECFEFF', color: '#0891B2' },
  V3: { bg: '#EFF6FF', color: '#2563EB' },
}
