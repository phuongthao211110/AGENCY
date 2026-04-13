# GHN Agency Prototype — Claude Code Guide

Dự án prototype cho hệ thống quản lý đại lý GHN (Giao Hàng Nhanh), gồm 3 platform trên cùng codebase React + TypeScript.

## Dev Server

```bash
npm run dev   # http://localhost:4002/
```

## 3 Platforms

| Platform | Entry | Login |
|----------|-------|-------|
| Super Admin | `/super-admin/agencies` | `/super-admin/login` |
| Agency Admin | `/agency-admin/shops` | `/agency-admin/login` |
| Web Shop | `/shop/orders` | `/shop/login` |

## Quy tắc kỹ thuật (KHÔNG được vi phạm)

1. **Inline styles only** — KHÔNG dùng Tailwind, KHÔNG dùng CSS modules
2. **Custom flex table** — KHÔNG dùng Ant Design Table component
3. **Sidebar width = 240px** — KHÔNG phải 160px hay 200px
4. **Entity names = `#3B82F6` bold** — Tên đại lý, shop, mã đơn LUÔN màu xanh
5. **Action buttons = `#FF5200`** — KHÔNG phải `#F05521`
6. **Page background = `#fff`** — KHÔNG phải `#f5f5f5`
7. **Header height = 40px** — KHÔNG phải 56px

## Team Workflow — Dùng Skill Agent Đúng Role

Khi nhận yêu cầu mới, **luôn bắt đầu bằng `/project-lead`** để xác định workflow phối hợp.

### Các skill agents có sẵn

```
/project-lead      → Orchestrator: phân tích yêu cầu, điều phối team
/product-manager   → BRD, user stories, acceptance criteria, sprint plan
/ui-designer       → Figma-to-code, design system, component patterns
/frontend-dev      → Routing, pages, mock data, TypeScript
/qa-tester         → Test checklist, business rules, UI validation
/backend-architect → API design, data models, authentication
/data-analyst      → Dashboard, KPIs, charts, reconciliation
```

### Workflow theo loại yêu cầu

```
Tính năng mới + Figma URL:
  product-manager → ui-designer → frontend-dev → qa-tester

Tính năng mới không có Figma:
  product-manager → frontend-dev → qa-tester

Bug / UI sai design:
  qa-tester → [ui-designer nếu cần] → frontend-dev → qa-tester

Dashboard / Báo cáo:
  data-analyst → ui-designer → frontend-dev → qa-tester

API / Backend planning:
  product-manager → backend-architect → frontend-dev

Sprint planning:
  product-manager → qa-tester → project-lead (tổng hợp)
```

## File Structure

```
src/
  App.tsx                         ← Toàn bộ routing
  theme/tokens.ts                 ← Color/spacing constants
  theme/platforms.ts              ← ThemeConfig per platform
  platforms/
    super-admin/layout/ pages/
    agency-admin/layout/ pages/
    shop/layout/ pages/
  components/PlatformSwitcher.tsx
  mock-data/
    agencies.json   (10 records)
    shops.json      (15 records)
    orders.json     (30 records)
    pricing.json
    reconciliation.json (10 records)
.claude/agents/
    project-lead.md
    product-manager.md
    ui-designer.md
    frontend-dev.md
    qa-tester.md
    backend-architect.md
    data-analyst.md
```

## Figma Files

| Platform | File Key |
|----------|----------|
| Super Admin | `G33IlXebyXXGxZbbYbKECr` |
| Agency Admin | `264Gc7s2XLHjBZsr2HnBEe` |
| Web Shop | `MchY3tv6zpA65VTnt5OEhW` |

## Design Tokens (Quick Reference)

```
C_ACTION         = '#FF5200'   // buttons, active states
C_LINK           = '#3B82F6'   // entity names — LUÔN xanh bold
C_TEXT_PRIMARY   = '#111827'
C_TEXT_SECONDARY = '#6B7280'
C_BORDER         = '#E5E7EB'
C_BG_HEADER      = '#F3F4F6'   // table header
C_BG_ACTIVE      = '#FFF4ED'   // sidebar active
```

## Business Rules

```
COD (demo)    = totalOrders × 35,000 VND
Revenue       = COD × 2.8%
Net (đối soát) = totalCOD - totalFee
```
