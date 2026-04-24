# GHN Agency Prototype — Claude Code Guide

Dự án prototype cho hệ thống quản lý đại lý GHN (Giao Hàng Nhanh), gồm 3 platform trên cùng codebase React + TypeScript.

## Dev Server

```bash
npm run dev   # http://localhost:4000/
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

### Model Assignment (BẮT BUỘC tuân thủ)

| Role | Agent | Model |
|------|-------|-------|
| Users Story | story-writer | Sonnet 4.6 |
| BA / Product | product-manager | Sonnet 4.6 |
| R&D / Analysis | data-analyst | Sonnet 4.6 |
| Tech Spec / API | backend-architect | Sonnet 4.6 |
| Design UI/UX | ui-designer | Sonnet 4.6 |
| Coding | frontend-dev | **Sonnet 4.6** |
| Read-only (scan) | codebase-reader, qa-tester, agency-logistics-domain, platform-integrator | **Haiku 4.5** |

### Các skill agents có sẵn

```
/project-lead              → Orchestrator: phân tích yêu cầu, điều phối team [Sonnet]
/codebase-reader [Haiku]   → Scan codebase, trả về compact briefing trước khi implement
/agency-logistics-domain [Haiku] → Business rules: đại lý, vận chuyển, COD, đối soát, phí
/platform-integrator [Haiku] → Cross-platform guard: kết nối 3 platform, không feature mồ côi
/product-manager [Sonnet]  → BRD, user stories, acceptance criteria, sprint plan
/ui-designer [Sonnet]      → Figma-to-code, design system, component patterns
/frontend-dev [Sonnet 4.6] → Routing, pages, mock data, TypeScript — CODING
/qa-tester [Haiku]         → Test checklist, business rules, UI validation
/backend-architect [Sonnet 4.6] → Tech Spec, API design, data models, authentication
/data-analyst [Sonnet]     → Dashboard, KPIs, charts, reconciliation
/story-writer [Sonnet]     → Break feature thành user stories, tạo .md + update JSON
```

### Token Optimization — Scout → Build Pattern

**Luôn chạy codebase-reader (Haiku) SONG PARALLEL với product-manager trước khi implement.**  
Frontend-dev và ui-designer nhận compact briefing từ codebase-reader thay vì tự đọc files.

**story-writer chỉ chạy khi user explicitly yêu cầu** — không tự động sau mỗi feature.

**Bug rõ ràng (sai màu, typo, sai số)** → fix trực tiếp bằng Edit tool, không spawn agent.

### Quota Optimization Rules (BẮT BUỘC tuân thủ)

| Situation | ❌ Sai | ✅ Đúng | Tiết kiệm |
|-----------|--------|--------|----------|
| **Bug UI (sai màu, typo, số)** | Spawn agent | Edit tool trực tiếp | ~Opus 1 call |
| **Tính năng < 1 file** | codebase-reader + dev | Direct frontend-dev | ~Haiku 1 call |
| **Story edit** | story-writer 3-4 lần | story-writer 1 lần → Document UI review | ~Sonnet 2-3 calls |
| **UAT + Document** | Tuần tự (UAT → story-writer) | Song PARALLEL | ~30% thời gian |
| **QC loop fail** | qa-tester chạy lại từ đầu | 1-2 cycles max rồi frontend-dev fix | ~Haiku 2+ calls |
| **Story status update** | Chat Claude request | Document UI approve/reject (không re-spawn) | ~Sonnet 1 call |

**Anti-patterns (tuyệt đối TRÁNH):**
- Auto-spawn story-writer sau mỗi feature fix
- Run codebase-reader + product-manager + 1 agent khác tuần tự (nếu independent → PARALLEL)
- QC lặp lại > 2 cycles: chuyển fronted-dev fix trực tiếp
- Story-writer tạo draft → edit lại 3-4 lần (tạo 1 lần → Document UI approve)

### Workflow theo loại yêu cầu

```
Tính năng mới + Figma URL:
  [codebase-reader / Haiku] ← SONG SONG → product-manager → ui-designer → frontend-dev → qa-tester → UAT
  [agency-logistics-domain / Haiku] ← SONG SONG (nếu liên quan COD/đối soát)

Tính năng mới không có Figma:
  [codebase-reader / Haiku] ← SONG SONG → product-manager → frontend-dev → qa-tester → UAT

Bug / UI sai design:
  [codebase-reader / Haiku] → frontend-dev → qa-tester (bug rõ ràng: bỏ qua codebase-reader)

Dashboard / Báo cáo:
  data-analyst → ui-designer → frontend-dev → qa-tester → UAT

API / Backend planning:
  product-manager → backend-architect → frontend-dev

Sprint planning:
  product-manager → qa-tester → project-lead (tổng hợp)
```

### QC Process (BẮT BUỘC sau mỗi implementation)

1. **qa-tester [Haiku]** chạy test checklist: business rules, UI tokens, edge cases
2. qa-tester xuất danh sách issues → frontend-dev fix nếu có
3. Lặp lại đến khi qa-tester confirm PASS

### UAT Process (BẮT BUỘC trước khi báo hoàn thành)

Claude tự UAT theo các bước:
1. Start dev server (`npm run dev`)
2. Mở browser, duyệt golden path của tính năng
3. Kiểm tra 3 platform liên quan (Super Admin, Agency Admin, Web Shop)
4. Confirm không có regression ở các trang lân cận
5. Báo cáo kết quả UAT trước khi kết thúc task

### Story Lifecycle (Document system)

```
[story-writer tạo]  →  draft  →  approved  →  sent-to-tech
                        ↑           ↑              ↑
                   mới tạo     PM review OK    gửi cho dev
```

**Cách sử dụng:**
- Sau khi implement tính năng → chạy `/story-writer` với mô tả feature
- Story-writer tạo `.md` files trong `docs/` + cập nhật JSON với `status: "draft"`
- Review story trong Document UI (localhost only) → click "Duyệt" để approve
- Khi sẵn sàng gửi dev → click "Gửi cho Tech" hoặc yêu cầu Claude update status
- Để xuất danh sách stories cho dev: `/generate-tech-backlog`

**Files document:**
```
docs/
  README.md                    ← Index 3 platform
  {platform}/
    README.md                  ← Index sections + stories
    {section}/
      {story-title-kebab}.md   ← 1 story = 1 file
  TECH-BACKLOG.md              ← Generated: stories sent-to-tech
src/mock-data/documents/
  super-admin.json             ← Source data cho Document UI
  agency-admin.json
  shop.json
```

**Quy tắc đồng bộ (BẮT BUỘC):**
- `.md` file và JSON entry **LUÔN phải được cập nhật cùng lúc** — không được update một bên mà bỏ bên còn lại
- Mọi thay đổi về nội dung story (userStory, userFlow, acceptanceCriteria, notes) đều phải được phản ánh ở cả 2 nơi
- Khi thêm story mới: tạo `.md` file → cập nhật JSON
- Khi sửa story: sửa `.md` → sửa JSON tương ứng
- Khi xoá story: xoá `.md` → xoá entry trong JSON

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
    story-writer.md
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
