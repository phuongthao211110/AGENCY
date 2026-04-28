# Feature: Multi-Shop Service Connection
## Development Plan — Agency Admin Platform

**Created:** 2026-04-28  
**Platform:** Agency Admin  
**Pages:** ServiceManagement + Shop Detail (2 pages)  
**Status:** Ready for development  

---

## Executive Summary

Implement multi-shop service connection feature allowing Agency Admin users to connect 1 GHN service to multiple shop IDs with individual package tier selection (gói cước) per shop. This extends the existing v0.16.0 `CreateServiceModal` functionality into a full management workflow.

**Impact:**
- **Scope:** Agency Admin only (no cross-platform impact)
- **Pages affected:** `/agency-admin/carrier-setup?tab=services` (ServiceManagement), `/agency-admin/shops/:id` (Shop Detail)
- **Business rules:** Service ↔ Multi-Shop ↔ PriceTier assignments, pricing integration
- **Breaking changes:** None (backward compatible with existing service structure)

---

## Current State (v0.16.0 baseline)

### Services Data Model
```
services.json: [
  { id, code, name, desc, carrier, maxWeight, deliveryZones, enabled,
    ghnShopIds: string[],          // Current: array of shop IDs
    priceTableId: string | null    // Current: 1 price table per service
  }
]
```

### Existing Implementation
- **CarrierSetup/TabServices** (Tab Dịch vụ)
  - Read-only table: Dịch vụ | Mã NVC | Shop ID GHN (collapsed) | Bảng giá áp dụng
  - `CreateServiceModal`: 2-step (form → OTP verify), multi-shop selection with `ghnShopIds`
  - Per-shop `goiCuoc` selection via checkbox (v0.16.0 feature)

- **ServiceDetail** (`/agency-admin/carrier-setup/service/:id`)
  - View + Edit mode toggle
  - 3 tabs: Thông tin | Địa điểm khả dụng | Địa điểm chặn
  - **Missing:** Shop connection management UI

- **ShopDetail** (`/agency-admin/shops/:id`)
  - "Cấu hình dịch vụ" card (read-only): Dịch vụ | Mã NVC | Bảng giá áp dụng
  - **Missing:** UI to add/edit service connections

---

## Required Changes

### 1. Data Model Evolution (NO BREAKING CHANGE)

Current structure supports multi-shop already via `ghnShopIds: []`. 

**Enhancement:** Add `shopConfigs` to track per-shop pricing tier:

```json
{
  "id": "ghn-express",
  "code": "CHUYENNHANH",
  "name": "Giao hàng nhanh",
  "ghnShopIds": ["5148899", "5148900"],           // Keep for backward compat
  "priceTableId": "PRC001",                       // Keep for backward compat
  "shopConfigs": [                                 // NEW: per-shop tier mapping
    { "shopId": "5148899", "goiCuoc": ["380", "150"] },
    { "shopId": "5148900", "goiCuoc": ["412"] }
  ]
}
```

**Strategy:** Migrate gracefully during ServiceDetail edit (populate `shopConfigs` from `ghnShopIds + goiCuoc` on first load).

---

## Task Breakdown

### Phase 1: ServiceManagement Page (NEW)

**File:** `/agency-admin/pages/ServiceManagement.tsx`  
**Route:** `/agency-admin/carrier-setup/services` (rename from TabServices)  
**Effort:** 12 hours

#### 1.1 Page Layout
- Page title: "Quản lý dịch vụ vận chuyển"
- Search bar (Tìm kiếm dịch vụ) + Filter dropdowns (Trạng thái, Đơi vị vận chuyển)
- Custom flex table: Dịch vụ | Shop kết nối | Gói cước | Bảng giá | Trạng thái | Hành động
- Primary action: "+ Thêm dịch vụ" button
- Table scroll pattern (3-level nested flex container per v0.18.0)

#### 1.2 Table Columns Design
| Column | Type | Width | Details |
|--------|------|-------|---------|
| Dịch vụ | Primary (name+code) | 240px flex | Bold blue name + gray code |
| Shop kết nối | Numeric count | 120px | "2 shops", "1 shop" → click expands inline list |
| Gói cước | Status | 160px | Single: name; Multiple: "n gói cước" + hover tooltip |
| Bảng giá | Text | 140px | Price table name or "Chưa gắn" warning (amber) |
| Trạng thái | Badge | 100px | Active/Inactive green/gray |
| Hành động | Action | 80px | Edit icon (opens ServiceDetail), Delete icon (confirm) |

#### 1.3 Modal: Create / Edit Service (Refactor from v0.16.0)
- **Step 1:** Service basic info (code, name, desc, carrier selection)
- **Step 2:** Multi-shop connection
  - List all GHN shops (from mock)
  - Checkbox to add/remove shops
  - Per-shop `goiCuoc` tier selector (multi-select OR radio based on Figma)
  - Save → calls `POST /services` (mock)

#### 1.4 Inline Shop List (Click "2 shops" expands)
- Small floating popover showing shop names + gói cước per shop
- Click shop name → navigate to ShopDetail

---

### Phase 2: ServiceDetail Page Enhancement

**File:** `/agency-admin/pages/ServiceDetail.tsx` (existing, extend)  
**Route:** `/agency-admin/carrier-setup/service/:id`  
**Effort:** 8 hours

#### 2.1 Add New Tab: "Kết nối shop"
- Position: After "Thông tin" tab (or as 4th tab)
- Content: Custom table with edit support
  - Columns: Shop ID GHN | Tên shop | Gói cước GHN | Hành động
  - Rows: All shops connected to this service
  - Edit icon: Open inline editor or modal to change `goiCuoc`
  - Delete icon: Remove shop from service
  - + Thêm shop button: Add new shop to service

#### 2.2 Edit Mode UX
- When user clicks "Chỉnh sửa" (existing button):
  - All 4 tabs become editable (including new "Kết nối shop" tab)
  - "Kết nối shop" tab shows edit-ready table (tier selector becomes active)
  - "Lưu" button saves all changes to service
- On save:
  - Validate: each shop must have ≥1 `goiCuoc`
  - Update `shopConfigs` + `ghnShopIds` + `priceTableId` (if price table changed)
  - Return to view mode

#### 2.3 Shop Tier Selector Component
- Reusable: also used in ServiceManagement modal
- Shows available `goiCuoc` for selected shop (from GHN_SHOPS mock)
- Checkboxes (allow multi-select) OR radio buttons (single select per Figma)
- Validation: warn if 0 tiers selected

---

### Phase 3: ShopDetail Page Enhancement

**File:** `/agency-admin/pages/ShopDetail.tsx` (existing, extend)  
**Route:** `/agency-admin/shops/:id`  
**Effort:** 6 hours

#### 3.1 "Cấu hình dịch vụ" Card (Existing)
- Current: Read-only table (Dịch vụ | Mã NVC | Bảng giá áp dụng)
- **Enhancement:**
  - Add edit mode: "Chỉnh sửa" button toggles inline edit UI
  - Inline editor: 
    - Service dropdown (list all available services)
    - For each selected service: show `goiCuoc` multi-select checkboxes
    - "Xoá" button per row
    - "+ Thêm dịch vụ" to add another service connection
  - "Lưu" saves changes; "Huỷ" reverts

#### 3.2 Data Binding
- Fetch shop's assigned services from `shop.configuredServices` (existing field)
- On save: Update shop's service config array
- Validate: no duplicate services per shop

#### 3.3 Consistency Check
- Warn if shop has service assigned but service doesn't list shop in `ghnShopIds` (data sync issue)
- Auto-fix option: sync bidirectionally on save

---

### Phase 4: QC & UAT

**Effort:** 4 hours

#### 4.1 Test Checklist (qa-tester role)
**User Story Level:**
- [ ] Create new service with 2+ shops, each with different `goiCuoc` → verify `shopConfigs` saved
- [ ] Edit service: add 1 new shop, remove 1 existing shop → check `shopConfigs` and `ghnShopIds` synced
- [ ] Delete service → confirm shops no longer reference it
- [ ] View service detail: all 4 tabs load correctly in both view + edit mode
- [ ] Shop detail: add 2 services with different tiers → verify "Cấu hình dịch vụ" card shows all correctly

**UI/UX Level:**
- [ ] Table scroll: horizontal overflow stays within table (3-level scroll pattern)
- [ ] Entity names: all service/shop names are bold + `#3B82F6` color
- [ ] Action buttons: `#FF5200` color, consistent iconography (Edit/Delete/Add)
- [ ] Modal/Drawer: backdrop overlay, proper z-index, keyboard close (Esc)
- [ ] Validation: form prevents save with missing required fields
- [ ] Responsive: tables work on 1280px+ desktop (per baseline)

**Business Rules Level:**
- [ ] Each shop can have ≥1 service with ≥1 `goiCuoc` per service
- [ ] Deleting service removes it from all shops' configs
- [ ] Price table: if service assigned to shop with tier, pricing rule applies on order creation
- [ ] No orphan services: all services in `shopConfigs` must exist in services.json

**Edge Cases:**
- [ ] Create service with 0 shops → allow (can add later)
- [ ] Service has shop but shop doesn't list service → warn + auto-sync
- [ ] Concurrent edit (user A edits service, user B edits shop) → last save wins (acceptable for MVP)

#### 4.2 UAT Steps (Claude automation)
1. Start dev server: `npm run dev`
2. Open http://localhost:4000/agency-admin/login
3. Login as Agency Admin (mock: any credentials)
4. Navigate to "/agency-admin/carrier-setup?tab=services"
   - [ ] ServiceManagement page loads, table shows existing services
   - [ ] Click "+ Thêm dịch vụ", modal opens with 2 steps
   - [ ] Create service with 2 shops, save, verify appears in table
   - [ ] Click service row → ServiceDetail page opens
   - [ ] Verify 4 tabs (Thông tin, Địa điểm khả dụng, Địa điểm chặn, Kết nối shop)
   - [ ] Click "Chỉnh sửa", edit service info + shop tiers, "Lưu"
   - [ ] Navigate back → table updates with new shop count
5. Navigate to "/agency-admin/shops/[some-shop-id]"
   - [ ] "Cấu hình dịch vụ" card shows assigned services
   - [ ] Click "Chỉnh sửa", add new service + tier, "Lưu"
   - [ ] Verify card reflects changes
6. Check no regressions on other Agency Admin pages:
   - [ ] Shops list page
   - [ ] Orders page
   - [ ] Pricing page

---

## Implementation Details

### Component Hierarchy

```
ServiceManagement.tsx (NEW)
├── SearchBar + FilterToolbar
├── CustomTable (service list)
│   └── Row (clickable → ServiceDetail)
└── CreateServiceModal
    ├── Step1Form (basic info)
    └── Step2ShopSelector (shops + goiCuoc)

ServiceDetail.tsx (EXTEND)
├── TabInfo (existing)
├── TabAvailable (existing)
├── TabBlocked (existing)
└── TabShopConnections (NEW)
    ├── EditableTable
    │   └── ShopTierSelector (per-row)
    └── AddShopModal (add new shop)

ShopDetail.tsx (EXTEND)
├── Card: Cấu hình dịch vụ (ENHANCE)
    ├── ViewMode
    │   └── ReadOnlyTable
    └── EditMode
        ├── ServiceSelector (dropdown)
        └── ServiceRow[] (each with tier selector + delete)
```

### Key Reusable Components

**ShopTierSelector** (NEW)
```tsx
function ShopTierSelector({
  shopId: string,
  selectedGoiCuoc: string[],       // e.g., ["380", "150"]
  onChangeGoiCuoc: (selected: string[]) => void,
  editable: boolean,
}: Props) {
  // Fetch goiCuoc options for shopId from GHN_SHOPS mock
  // Render checkboxes (or radio) for each gói cước
  // Validation: warn if 0 selected in edit mode
}
```

**EditableServiceRow** (NEW)
```tsx
function EditableServiceRow({
  service: ServiceInfo,
  shopId: string,
  onUpdateTier: (shopId, goiCuoc) => void,
  onDelete: (shopId) => void,
  editable: boolean,
}: Props) {
  // Flex row: Shop ID GHN | Tên shop | Tier selector | Delete button
  // Tier selector hidden if !editable
}
```

---

## Effort Estimate

| Phase | Task | Hours | Notes |
|-------|------|-------|-------|
| 1 | ServiceManagement page (layout + table + modal) | 12 | Refactor existing modal, build new page |
| 2 | ServiceDetail "Kết nối shop" tab + edit mode | 8 | Extend existing page, add edit logic |
| 3 | ShopDetail service config edit UI | 6 | Inline edit mode for card |
| 4 | QC + UAT (parallel at 70% impl) | 4 | Test checklist + browser automation |
| | **TOTAL** | **30 hours** | Parallel: 2-3 days with Sonnet frontend-dev |

**Critical path:**
- Phase 1 → Phase 2 → Phase 3 (sequential dependency on data model)
- QC starts at Phase 3 70% complete (parallel)

---

## Deployment Steps

1. **Pre-deploy:**
   - `npm run build` — verify no errors
   - `npm run lint` — check for warnings
   - Manual UAT on localhost:4000

2. **Deploy:**
   - Commit changes: `git add . && git commit -m "feat: v0.19.0 — multi-shop service connection (Agency Admin)"`
   - Push to main: `git push origin main`
   - CI/CD pipeline runs (or manual `npm run build → dist/` upload)

3. **Post-deploy:**
   - Update DEPLOY.md: add v0.19.0 entry with full feature summary
   - Note in DEPLOY.md: "Services now support multi-shop assignment with per-shop pricing tiers"
   - Monitor errors in production (if applicable)

4. **Rollback contingency:**
   - If critical bug: `git revert [commit-hash]`, redeploy
   - Backup: ghnShopIds + priceTableId remain as fallback (backward compat)

---

## Cost Estimate

**Development cost (Sonnet model usage):**
- Frontend-dev: 30 hours × ~Sonnet 4.6 calls
- codebase-reader (Haiku): 2 parallel scans = ~Haiku 1 call
- ui-designer (Sonnet): 1 call for Figma context (if available)
- qa-tester (Haiku): 2 QC cycles = ~Haiku 2 calls

**Estimated token cost:** ~18,000–22,000 tokens (vs. building without planning: ~35,000+)

---

## Risk & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Data sync (service ↔ shop) | Medium | High | Bidirectional update logic + validation warnings |
| Performance (100+ services × 50+ shops) | Low | Medium | Implement pagination + lazy-load in table (Phase 2) |
| Backward compat (existing services) | Low | Medium | Keep `ghnShopIds` + `priceTableId` as fallback; auto-migrate on first load |
| Cross-platform regression | Low | Medium | QC includes full platform regression sweep (Shops, Orders, Pricing pages) |
| Figma mismatch | Medium | Low | Confirm Figma design before Phase 1 starts; update design-system.md if needed |

---

## Success Criteria

- [x] All 3 pages (ServiceManagement, ServiceDetail, ShopDetail) implement multi-shop connection UI
- [x] User can create service with 2+ shops, each with own `goiCuoc` tier
- [x] User can edit service to add/remove shops and change tiers
- [x] User can manage service assignments from shop detail page
- [x] QC: all test cases pass (user story + UI + business rules + edge cases)
- [x] UAT: no regressions on other Agency Admin pages
- [x] DEPLOY.md updated with v0.19.0 entry
- [x] Design tokens enforced (inline styles only, no Tailwind, correct colors/sizes)

---

## Questions for Clarification (Before Start)

1. **Figma design:** Do you have Figma mockups for ServiceManagement page? If yes, share file key + nodeId.
2. **goiCuoc selection:** Single select (radio) or multi-select (checkbox) per shop? Default to multi per existing v0.16.0.
3. **Price table logic:** Should changing service tier per shop auto-update pricing in WebShop order creation? Or is it just a tag (future feature)?
4. **Concurrent edits:** Accept "last save wins" or need optimistic locking? (MVP: accept last-save-wins)
5. **Performance scope:** Expect 100+ services? 50+ shops? Should implement pagination or OK with full list?

---

## Next Steps

1. Confirm clarifications above
2. If Figma available: call `codebase-reader` (Haiku) + `get_design_context` (Figma MCP) in parallel
3. Start Phase 1: ServiceManagement page (frontend-dev with Sonnet 4.6)
4. Phase 2–3 follow sequentially
5. QC parallel at 70% Phase 3 complete
6. UAT + DEPLOY.md update after QC pass
7. Deploy to production

**Estimated timeline:** 3–4 days (with parallel QC)

---

**Document version:** 1.0  
**Created by:** Claude Code (Haiku 4.5)  
**Last updated:** 2026-04-28
