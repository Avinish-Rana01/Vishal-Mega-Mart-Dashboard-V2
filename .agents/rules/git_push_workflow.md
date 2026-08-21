---
description: Enforces strict component visibility in DashboardPage.jsx before pushing to production.
---

# Pre-Push Component Toggles

## Intent
To ensure that the production build (triggered by pushing to the `main` branch) only exposes finalized, production-ready sections of the dashboard, while explicitly hiding all sections that are currently being actively developed or tested.

## Rule
Whenever the user asks to "push to main" (or execute any git commit/push workflow to the main branch), you MUST perform the following checks and modifications in `src/pages/Dashboard/DashboardPage.jsx` BEFORE committing:

1. **Expose Completed Work:** Ensure the `<LiveStockSection />` and `<CycleCountSection />` blocks are UNCOMMENTED and active.
2. **Hide Everything Else:** Ensure ALL OTHER dashboard sections (e.g., `<StoreValidationSection />`, `<SaleDashboardSection />`, `<DcValidationSection />`, etc.) are explicitly COMMENTED OUT.
3. **Save and Push:** Once these exact toggles are applied and saved, you may proceed with the git commit and push operation.
