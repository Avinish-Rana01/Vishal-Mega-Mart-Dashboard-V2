---
description: Prevents modifications to highly polished dashboard sections unless explicitly requested.
---

# Immutable Reference Sections

## Intent
To prevent accidental regressions or changes to highly polished dashboard sections that the user wishes to freeze, and to leverage them purely as design and architecture templates.

## Rules
1. **Locked Files:** Do NOT modify `LiveStockSection.jsx` or `CycleCountSection.jsx` under any circumstances unless explicitly and unambiguously requested by the user.
2. **Inspiration Only:** Use the code in these files as a reference architecture when building other dashboard sections. Pay special attention to their implementation of:
   - Nested dropdowns and dynamic toolbars (e.g. `vmm-toolbar-header`).
   - Advanced Recharts configurations (gradients, custom tooltips, shadows).
   - Memoized chart components.
   - Fixed-gap sizing logic for dynamic chart heights.
   - Clean empty states and error handling.
3. **Application:** When styling or structuring new sections (e.g., `StoreValidationSection.jsx`), look at the source code of the locked files for UI/UX inspiration and copy established patterns rather than inventing new ones.

## Fixed Section Height Constraint
All dashboard sections MUST occupy an identical, fixed amount of vertical space — no more, no less — so the dashboard grid remains predictable and clean.

**Rules:**
1. The root container (`cc-container`, `ls-root`, etc.) must have `height: 100%` to exactly fill its `vmm-grid-cell` slot.
2. Chart scroll areas (`.cc-chart-scroll`) must use `max-height` + `overflow-y: auto` so excess data scrolls internally rather than expanding the outer section.
3. Never use an unbounded `min-height` on a chart container that can grow indefinitely. All vertical growth must be contained to scrollable sub-regions.
4. When building new sections, compare the total visual height against `CycleCountSection` as the canonical reference.
