# GHN Agency Prototype — Design System

> **Tài liệu này là nguồn sự thật duy nhất về design system.**
> `ui-designer` agent **BẮT BUỘC** đọc và tuân thủ toàn bộ file này trước khi implement bất kỳ tính năng nào.

---

## 1. Nguyên tắc cốt lõi (KHÔNG được vi phạm)

| # | Quy tắc | Đúng | Sai |
|---|---------|------|-----|
| 1 | Styling | `style={{}}` inline | Tailwind, CSS modules, styled-components |
| 2 | Table | Custom flex-based | `<Table>` của Ant Design |
| 3 | Sidebar width | `240px` | 160px, 200px, 220px |
| 4 | Header height | `40px` | 56px, 48px |
| 5 | Entity name color | `#3B82F6` bold | cam, đen, hoặc màu khác |
| 6 | Action button | `#FF5200` | `#F05521`, `#E04A00` |
| 7 | Page background | `#ffffff` | `#f5f5f5`, `#fafafa` |

---

## 2. Color Tokens

Import từ `src/theme/tokens.ts`.

### 2.1 Brand

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `GHN_ORANGE` | `#F05521` | Logo, Ant Design ConfigProvider `colorPrimary` |
| `GHN_ORANGE_DARK` | `#C73F10` | Hover state của brand elements |
| `GHN_ORANGE_LIGHT` | `#FFF3EE` | Sidebar active background |

### 2.2 Action & Links

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `C_ACTION` | `#FF5200` | **Mọi nút primary**, active states |
| `C_LINK` | `#3B82F6` | **Mọi tên entity** (agency, shop, mã đơn) — LUÔN bold + màu xanh này |

### 2.3 Text

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `C_TEXT_PRIMARY` | `#111827` | Body text chính, active page number |
| `C_TEXT_SECONDARY` | `#6B7280` | Label phụ, table header text, placeholder |
| `C_TEXT_LABEL` | `#4B5563` | Form labels |
| `C_TEXT_TERTIARY` | `#999999` | Sidebar section headers |
| `C_TEXT_DISABLED` | `#9CA3AF` | Disabled input text |

### 2.4 Background

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `C_BG_WHITE` | `#FFFFFF` | Page content background |
| `C_BG_PAGE` | `#F5F5F5` | Layout wrapper (bao ngoài content) |
| `C_BG_HEADER` | `#F3F4F6` | Table header, disabled input |
| `C_BG_ACTIVE` | `#FFF4ED` | Sidebar active item |

### 2.5 Border

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `C_BORDER` | `#E5E7EB` | Mọi border: input, card, divider, table row |
| `COLOR_BORDER` | `#F0F0F0` | Nhẹ hơn, dùng trong Ant Design override |
| `COLOR_BORDER_STRONG` | `#D9D9D9` | Border đậm hơn |

### 2.6 Status / Semantic

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `STATUS_SUCCESS` | `#00C853` | Badge text: TLHH, thành công |
| `STATUS_SUCCESS_BG` | `#D9F7E5` | Badge background: TLHH |
| `STATUS_WARNING` | `#F59E0B` | Tab count: đơn nháp |
| `STATUS_INFO` | `#3B82F6` | Tab count: đã huỷ |
| `COLOR_SUCCESS` | `#52C41A` | Ant Design success |
| `COLOR_WARNING` | `#FAAD14` | Ant Design warning |
| `COLOR_ERROR` | `#FF4D4F` | Ant Design error |
| `COLOR_INFO` | `#1890FF` | Ant Design info |
| `COLOR_ORANGE` | `#FA8C16` | Secondary orange |

### 2.7 Shadows

| Token | Value | Dùng cho |
|-------|-------|----------|
| `SHADOW_SM` | `0 1px 4px rgba(0,0,0,0.06)` | Card nhẹ |
| `SHADOW_MD` | `2px 0 8px rgba(0,0,0,0.06)` | Sidebar |
| `SHADOW_LG` | `0 8px 32px rgba(0,0,0,0.18)` | Modal |
| `SHADOW_FLOAT` | `0 2px 8px rgba(0,0,0,0.12)` | Button, floating elements |
| `CARD_SHADOW` | `0px 1px 2px 0px rgba(0,0,0,0.05)` | Form card |

---

## 3. Typography

**Font family**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`

### 3.1 Scale

| Name | Size | Weight | Line Height | Dùng cho |
|------|------|--------|-------------|----------|
| Heading XS | 24px | 600 | 28px | Page title |
| Body Default | 14px | 400 | 20px | Nội dung chính |
| Body 14 Norm | 14px | 400 | 22px | Web Shop rows |
| Body Medium | 14px | 500 | 20px | Emphasized text |
| Body Bold | 14px | 700 | 20px | Entity names (phải kèm `C_LINK`) |
| Button | 14px | 600 | 20px | Text trong button |
| Label | 12px | 400 | 16px | Form field label |
| Caption | 12px | 400 | 16px | Sub-info, mã đơn dưới tên |
| Section Header | 11px | 600 | — | Sidebar section "QUẢN LÝ", "CÀI ĐẶT" |

### 3.2 Quy tắc entity name (BẮT BUỘC)

Tên đại lý, tên shop, mã đơn hàng, và mọi ID entity **luôn** dùng:
```tsx
fontSize: 14, fontWeight: 700, color: '#3B82F6'
```

---

## 4. Spacing

Base unit = 4px.

| Token | Value | Dùng cho |
|-------|-------|----------|
| `SPACE_1` | 4px | Khoảng cách nhỏ nhất |
| `SPACE_2` | 8px | Gap nội bộ component |
| `SPACE_3` | 12px | Padding button |
| `SPACE_4` | 16px | Padding card, gap section |
| `SPACE_5` | 20px | |
| `SPACE_6` | 24px | Padding lớn, section spacing |
| `SPACE_8` | 32px | |
| `SPACE_10` | 40px | Header height |

**Padding patterns hay dùng:**
- Cell nhỏ: `padding: '6px 8px'`
- Input / Button: `padding: '8px 12px'`
- Section header: `padding: '12px 16px'`
- Card content: `padding: '16px'`

---

## 5. Border Radius

| Token | Value | Dùng cho |
|-------|-------|----------|
| `RADIUS_SM` | 4px | Checkbox, tag nhỏ |
| `RADIUS_BASE` | 6px | Button, input, card nhỏ (**thực tế dùng 6px, không phải 8px**) |
| `RADIUS_LG` | 12px | Form card lớn |
| `RADIUS_XL` | 16px | Modal, drawer |
| `RADIUS_FULL` | 500px | Active page number |

---

## 6. Layout Architecture

### 6.1 Shared Layout (3 platforms)

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (height 40px, fixed, zIndex 20)                 │
│  [≡] [Logo]                    [Switch] [🔔] [Avatar]  │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  SIDEBAR     │  CONTENT                                 │
│  (240px)     │  (marginLeft 240px, marginTop 40px)      │
│  fixed       │  background: #fff                        │
│  zIndex 10   │  height: calc(100vh - 40px)              │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

**Layout wrapper** (`#F5F5F5`) bao ngoài toàn bộ — content bên trong là `#fff`.

### 6.2 Header (40px)

```tsx
{
  position: 'fixed', top: 0, left: 0, right: 0,
  height: 40, zIndex: 20,
  display: 'flex', alignItems: 'center',
  borderBottom: '1px solid #E5E7EB',
  background: '#fff',
  padding: '0 16px',
}
```

Nội dung (trái → phải):
1. Hamburger: `<MenuOutlined />` — toggle sidebar
2. Logo: box `17×16px` màu `GHN_ORANGE` + brand name text `GHN_ORANGE`
3. Flex spacer `flex: 1`
4. `<PlatformSwitcher />`
5. Bell icon với `<Badge>`
6. Avatar `24×24px`, background `GHN_ORANGE`, text trắng

### 6.3 Sidebar (240px)

```tsx
{
  position: 'fixed', top: 40, bottom: 0, left: 0,
  width: collapsed ? 0 : 240, zIndex: 10,
  background: '#fff',
  boxShadow: '2px 0 8px rgba(0,0,0,0.06)',
  overflow: 'hidden',
  transition: 'width 0.2s, min-width 0.2s',
  display: 'flex', flexDirection: 'column',
}
```

**Nav item:**
```tsx
// Active
{ background: '#FFF4ED', color: '#FF5200', fontWeight: 600, borderRadius: 6 }

// Hover (inactive)
{ background: '#F9FAFB' }

// Default
{ color: '#111827', fontSize: 14 }

// Padding mỗi item
{ padding: '5px 8px', borderRadius: 6, margin: '1px 8px' }
```

**Section header (QUẢN LÝ, CÀI ĐẶT):**
```tsx
{ fontSize: 11, fontWeight: 600, color: '#999999', padding: '8px 16px 4px' }
```

**Cấu trúc:**
1. Section "QUẢN LÝ" + nav items
2. `<div style={{ height:1, background:'#E5E7EB' }}/>` divider
3. Section "CÀI ĐẶT" + `<RightOutlined />` chevron
4. `<div style={{ flex:1 }}/>` spacer
5. Document link (chỉ hiện trên localhost)
6. `<div style={{ height:1, background:'#E5E7EB' }}/>` divider
7. Logout item

### 6.4 Content Area

```tsx
{
  marginLeft: collapsed ? 0 : 240,
  marginTop: 40,
  background: '#fff',
  height: 'calc(100vh - 40px)',
  display: 'flex', flexDirection: 'column',
  transition: 'margin-left 0.2s',
  overflow: 'hidden',
}
```

---

## 7. Component Patterns

### 7.0 Import tokens — BẮT BUỘC

**KHÔNG được define local const cho design tokens.** Luôn import từ `src/theme/tokens.ts`:

```tsx
import {
  C_ACTION, C_LINK,
  C_TEXT_PRIMARY, C_TEXT_SECONDARY, C_TEXT_LABEL,
  C_BORDER, C_BG_HEADER, C_BG_ACTIVE, C_BG_WHITE,
  STATUS_SUCCESS, STATUS_SUCCESS_BG, STATUS_WARNING,
} from '../../../theme/tokens'
```

Mọi hex value như `'#3B82F6'`, `'#FF5200'`, `'#E5E7EB'`, `'#F3F4F6'` **phải được thay bằng token** tương ứng. Không được viết `const C_LINK = '#3B82F6'` trong file page.

---

### 7.1 Custom Table

**KHÔNG BAO GIỜ dùng `<Table>` của Ant Design.** Mọi list page phải dùng custom flex table.

#### Header row
```tsx
<div style={{ display:'flex', background:'#F3F4F6', alignItems:'center', flexShrink:0 }}>
  {/* Optional checkbox col */}
  <div style={{ width:32, flexShrink:0 }} />
  {columns.map(col => (
    <div key={col.key} style={{
      flex: col.flex ?? '1 0 0',
      minWidth: col.minWidth,
      padding: '6px 8px',
    }}>
      <span style={{ fontSize:14, color:'#6B7280', display:'block',
        textAlign: col.align ?? 'left' }}>
        {col.label}
      </span>
    </div>
  ))}
</div>
<div style={{ height:1, background:'#E5E7EB', flexShrink:0 }} />
```

#### Data row
```tsx
const [hover, setHover] = useState(false)
<div
  style={{
    display: 'flex', alignItems: 'stretch',
    background: hover ? '#FAFAFA' : '#fff',
    transition: 'background 0.1s',
    cursor: 'pointer',
  }}
  onMouseEnter={() => setHover(true)}
  onMouseLeave={() => setHover(false)}
  onClick={() => navigate(`/path/${id}`)}
>
  {/* cells */}
</div>
<div style={{ height:1, background:'#E5E7EB' }} />
```

#### Cell patterns

**Primary cell (name + code):**
```tsx
<div style={{ flex:'1 0 0', minWidth:240, padding:'8px', display:'flex',
  flexDirection:'column', gap:2, justifyContent:'center' }}>
  <span style={{ fontSize:14, fontWeight:700, color:'#3B82F6' }}>{name}</span>
  <span style={{ fontSize:12, color:'#6B7280' }}>{code}</span>
</div>
```

**Numeric cell (right-aligned):**
```tsx
<div style={{ minWidth:120, padding:'8px', display:'flex',
  alignItems:'center', justifyContent:'flex-end' }}>
  <span style={{ fontSize:14, color:'#111827' }}>{value}</span>
</div>
```

**Standard widths:**
| Column type | minWidth | notes |
|-------------|----------|-------|
| Checkbox | 32px | `flexShrink: 0`, `width: 32px` |
| Primary (name+code) | 240px | `flex: 1 0 0` |
| Owner / Customer | 160–300px | tuỳ nội dung |
| Numeric (số tiền, số lượng) | 120–160px | `textAlign: 'right'` |
| Status badge | 120px | center hoặc left |
| Action | 80–100px | center |

---

### 7.2 Custom Checkbox

```tsx
function Checkbox({ checked, onChange }: { checked: boolean; onChange?: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onChange?.() }}
      style={{
        width: 20, height: 20, borderRadius: 4,
        cursor: 'pointer', flexShrink: 0,
        border: checked ? 'none' : '1.5px solid #E5E7EB',
        background: checked ? '#FF5200' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {checked && (
        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
          <path d="M1 4L4.5 7.5L11 1"
            stroke="#fff" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}
```

---

### 7.3 Button Primary

```tsx
<button
  style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '8px 12px',
    background: '#FF5200', border: 'none', borderRadius: 6,
    cursor: 'pointer',
  }}
  onClick={handleClick}
>
  <PlusOutlined style={{ color: '#fff', fontSize: 16 }} />
  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Tạo mới</span>
</button>
```

**Variants:**
- **Secondary**: background `#fff`, border `1px solid #E5E7EB`, text `#111827`
- **Danger**: background `#FF4D4F`, text `#fff`
- **Ghost**: background `transparent`, border `1px solid #FF5200`, text `#FF5200`

---

### 7.4 Search Bar

```tsx
<div style={{
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '8px 12px',
  background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6,
  flex: 1,
}}>
  <SearchOutlined style={{ color: '#6B7280', fontSize: 16, flexShrink: 0 }} />
  <input
    placeholder="Tìm kiếm..."
    style={{
      flex: 1, border: 'none', outline: 'none',
      fontSize: 14, background: 'transparent', color: '#111827',
    }}
  />
</div>
```

---

### 7.5 Filter Toolbar

```tsx
// Toolbar row nằm giữa page title và table
<div style={{
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '12px 16px',
  borderBottom: '1px solid #E5E7EB',
  flexShrink: 0,
}}>
  {/* Search bar */}
  {/* Select dropdowns */}
  {/* Date pickers */}
  <div style={{ flex: 1 }} /> {/* spacer */}
  {/* Primary action button */}
</div>
```

---

### 7.6 Form Card

```tsx
<div style={{
  background: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  boxShadow: '0px 1px 2px 0px rgba(0,0,0,0.05)',
  padding: 16,
  display: 'flex', flexDirection: 'column', gap: 16,
}}>
  {/* Card title */}
  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: '20px' }}>
    Thông tin cơ bản
  </div>

  {/* Fields */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {/* ... */}
  </div>
</div>
```

**Form layout page:**
```tsx
<div style={{
  flex: 1, overflow: 'auto',
  padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
  background: '#F5F5F5',  // Form pages dùng #F5F5F5 làm nền để card nổi lên
}}>
  {cards}
</div>
```

---

### 7.7 Text Input Field

```tsx
// Field wrapper (label + input)
<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
  <label style={{ fontSize: 14, color: '#4B5563', lineHeight: '20px' }}>
    Tên trường
  </label>

  {/* Input container */}
  <div style={{
    background: disabled ? '#F3F4F6' : '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '6px 12px',
    display: 'flex', alignItems: 'center',
  }}>
    <input
      disabled={disabled}
      style={{
        flex: 1, border: 'none', outline: 'none',
        fontSize: 14, lineHeight: '20px',
        background: 'transparent',
        color: disabled ? '#9CA3AF' : '#111827',
        cursor: disabled ? 'not-allowed' : 'text',
      }}
    />
  </div>
</div>
```

---

### 7.8 Numeric Input with Unit Badge

```tsx
<div style={{
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 6,
  display: 'flex', alignItems: 'center',
  overflow: 'hidden',
}}>
  <input
    type="number"
    style={{
      flex: 1, border: 'none', outline: 'none',
      padding: '6px 8px',
      fontSize: 14, background: 'transparent',
      textAlign: 'right',
    }}
  />
  <div style={{
    width: 32, height: 32, flexShrink: 0,
    background: '#F3F4F6',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, color: '#111827',
  }}>
    %
  </div>
</div>
```

---

### 7.9 Radio Button

```tsx
function Radio({ checked, label, onChange }: RadioProps) {
  return (
    <div
      onClick={onChange}
      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${checked ? '#FF5200' : '#E5E7EB'}`,
        background: checked ? '#FF5200' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
      </div>
      <span style={{ fontSize: 14, color: '#111827' }}>{label}</span>
    </div>
  )
}
```

---

### 7.10 Status Badge

```tsx
// Success
<span style={{
  display: 'inline-flex', alignItems: 'center',
  padding: '2px 8px', borderRadius: 4,
  background: '#D9F7E5', color: '#00C853',
  fontSize: 12, fontWeight: 500,
}}>TLHH</span>

// Warning
<span style={{
  background: '#FFF7E6', color: '#F59E0B',
  /* ... */
}}>Đang xử lý</span>

// Error
<span style={{
  background: '#FFF1F0', color: '#FF4D4F',
  /* ... */
}}>Đã huỷ</span>
```

---

### 7.11 Pagination

```tsx
// Cấu trúc:
// [Hiển thị 50 ▾]  [|< < 1 2 3 ... 100 101 102 > >|]  [Đến trang] [input]

// Active page
<div style={{
  width: 24, height: 24, borderRadius: 500,
  background: '#111827', color: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 12,
}}>1</div>

// Inactive page
<button style={{
  background: 'transparent', border: 'none', cursor: 'pointer',
  fontSize: 12, color: '#111827',
  padding: '4px 6px', borderRadius: 4,
}}>2</button>

// Container
<div style={{
  display: 'flex', alignItems: 'center', gap: 4,
  padding: '8px 16px', background: '#fff', flexShrink: 0,
  borderTop: '1px solid #E5E7EB',
}}>
```

---

### 7.12 Tab Bar (Orders page)

```tsx
// Active tab
<button style={{
  background: '#111827', color: '#fff',
  border: 'none', borderRadius: '8px 8px 0 0',
  padding: '8px 16px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 8,
}}>
  <span>Tất cả đơn</span>
  <span style={{
    background: '#F59E0B', color: '#fff',
    borderRadius: 10, padding: '1px 6px', fontSize: 12,
  }}>12</span>
</button>

// Inactive tab
<button style={{
  background: 'transparent', color: '#111827',
  border: '1px solid #E5E7EB', borderBottom: 'none',
  borderRadius: '8px 8px 0 0',
  padding: '8px 16px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 8,
}}>
  <span>Đơn nháp</span>
  <span style={{
    background: '#3B82F6', color: '#fff',
    borderRadius: 10, padding: '1px 6px', fontSize: 12,
  }}>5</span>
</button>

// Bottom border (ngăn cách tab và content)
<div style={{ height: 1, background: '#E5E7EB', flexShrink: 0 }} />
```

---

### 7.13 Page Header (title row)

```tsx
<div style={{
  padding: '12px 16px',
  display: 'flex', alignItems: 'center', gap: 12,
  borderBottom: '1px solid #E5E7EB',
  flexShrink: 0, background: '#fff',
}}>
  <span style={{ fontSize: 16, fontWeight: 600, color: '#111827', flex: 1 }}>
    Tên trang
  </span>
  {/* Action button nếu có */}
</div>
```

---

### 7.14 Modal / Drawer

**Modal:**
```tsx
// Backdrop
{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200,
  display:'flex', alignItems:'center', justifyContent:'center' }

// Container
{ background:'#fff', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
  padding:24, minWidth:400, zIndex:201 }
```

**Drawer (right-side):**
```tsx
// Backdrop
{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200 }

// Panel
{ position:'fixed', top:0, right:0, bottom:0, width:980,
  background:'#fff', zIndex:201,
  transform: open ? 'translateX(0)' : 'translateX(100%)',
  transition:'transform 0.3s cubic-bezier(0.4,0,0.2,1)' }
```

---

## 8. Transitions & Animation

| Context | Value |
|---------|-------|
| Hover state | `transition: 'background 0.1s'` |
| Modal appear | `transition: 'opacity 0.25s'` |
| Drawer slide | `transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)'` |
| Sidebar collapse | `transition: 'width 0.2s, min-width 0.2s'` |
| Content reflow | `transition: 'margin-left 0.2s'` |

---

## 9. Flex Patterns hay dùng

```tsx
// Row với space-between
{ display:'flex', alignItems:'center', justifyContent:'space-between' }

// Column full-height
{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }

// Equal flex children
{ flex:'1 0 0', minWidth:0 }  // minWidth:0 để text truncation hoạt động

// Centered
{ display:'flex', alignItems:'center', justifyContent:'center' }

// Scrollable area
{ flex:1, overflow:'auto' }
```

---

## 10. Z-Index Stack

| Layer | Value |
|-------|-------|
| Sidebar | 10 |
| Header | 20 |
| Tooltip / Dropdown | 100 |
| Modal backdrop | 200 |
| Modal / Drawer content | 201 |

---

## 11. Ant Design Integration

Mỗi platform wrap toàn bộ content trong `<ConfigProvider theme={platformTheme}>`.

```tsx
import { ConfigProvider } from 'antd'
import { agencyAdminTheme } from '../../../theme/platforms'

export default function SomePage() {
  return (
    <ConfigProvider theme={agencyAdminTheme}>
      {/* content */}
    </ConfigProvider>
  )
}
```

**Theme values (3 platforms — identical hiện tại):**
```ts
colorPrimary: '#F05521'
Menu.itemSelectedBg: '#FFF3EE'
Menu.itemSelectedColor: '#F05521'
```

**Ant Design components được phép dùng:** Select, DatePicker, Modal (với custom styles), Badge, Tooltip, Dropdown, notification, message.

**KHÔNG dùng:** Table, Form (tự build), Button (dùng `<button>` native).

---

## 12. Platform Reference

| Platform | Route prefix | Layout component | Figma file key |
|----------|-------------|-----------------|----------------|
| Super Admin | `/super-admin` | `SuperAdminLayout` | `G33IlXebyXXGxZbbYbKECr` |
| Agency Admin | `/agency-admin` | `AgencyAdminLayout` | `264Gc7s2XLHjBZsr2HnBEe` |
| Web Shop | `/shop` | `ShopLayout` | `MchY3tv6zpA65VTnt5OEhW` |

---

## 13. Quy trình implement tính năng

### Khi có Figma URL (ưu tiên cao nhất)

Figma là nguồn sự thật về visual. File này là nguồn sự thật khi không có Figma.

```
1. Lấy design từ Figma MCP: mcp__figma__get_design_context(nodeId, fileKey)
   - URL figma.com/design/:fileKey/...?node-id=653-124002 → nodeId = "653:124002"
2. Phân tích screenshot + code output từ Figma
3. Nếu Figma có giá trị mới (màu, spacing, pattern chưa có trong file này):
   → Cập nhật .claude/design-system.md TRƯỚC khi implement
4. Implement theo Figma + design-system.md (đã được cập nhật)
5. Kiểm tra checklist (Section 14)
```

### Khi không có Figma URL

```
1. Đọc file này đầy đủ
2. Map component cần implement → pattern tương ứng (Section 7)
3. Map màu → tokens (Section 2)
4. Implement với inline styles
5. Kiểm tra checklist (Section 14)
```

### Nguyên tắc đồng bộ

- **Figma > design-system.md > code** — khi xung đột, Figma thắng
- Mọi thay đổi từ Figma phải được cập nhật vào file này để team biết
- KHÔNG hardcode hex/value mới mà không cập nhật file này

---

## 14. Checklist trước khi submit

- [ ] Inline styles only (không có className với CSS)
- [ ] Không dùng Ant Design `<Table>`
- [ ] Sidebar = 240px, header = 40px (nếu có layout)
- [ ] Entity names = `C_LINK` (`#3B82F6`) + `fontWeight: 700` — **không phải 600**
- [ ] Action buttons = `C_ACTION` (`#FF5200`)
- [ ] Page content background = `C_BG_WHITE` (`#fff`)
- [ ] Table header background = `C_BG_HEADER` (`#F3F4F6`)
- [ ] Wrap với `<ConfigProvider theme={platformTheme}>`
- [ ] **KHÔNG có `const C_*` local** — tất cả tokens được import từ `../../../theme/tokens`
- [ ] **KHÔNG hardcode hex value** như `'#3B82F6'`, `'#FF5200'`, `'#E5E7EB'` — dùng token name
- [ ] Hover row = `C_BG_WHITE` → `'#FAFAFA'` (không phải `#f5f5f5`)
