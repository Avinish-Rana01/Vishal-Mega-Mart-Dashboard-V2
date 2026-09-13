# Git Rules

- **DO NOT** commit or push code to git automatically or on your own.
- Only run `git` commands (add, commit, push) if the user explicitly instructs you to do so.
- The company prefers to avoid small frequent commits. Leave the committing to the user unless requested otherwise.



# UI Design System Rules (V2 Visual Dashboard)

## Layout Rules
- The dashboard uses a **Tab-based layout** defined in `DashboardPage.jsx`. Do NOT add new sections as vertical stacks below existing ones.
- There MUST be exactly 10 separate tabs, one for each individual report. Do NOT group them into broad categories.
- The 10 Tabs are: LiveStock, CycleCount, Sale Dashboard, Void Dashboard, Return Dashboard, Vendor Discrepancy, DC Validation, DC Encoding, Tag Location, and Tag Cycle Count.
- Each dashboard section MUST follow the **3-Row Pattern**:
  1. KPI Row (`ds-kpi-row`) — summary numbers at the top.
  2. Charts Row (`ds-charts-row`) — main visualizations.
  3. List Row — a compact `StoreRankList`, NOT a full table.
- Every section MUST start with the `SectionHeader` component for consistent titles and actions.

## Component Rules (V2 Chart Library)
ALL visual sections in the V2 Dashboard MUST use these reusable components from `src/components/charts/`:

| Component | File | Use Case |
|---|---|---|
| `SectionHeader` | `common/SectionHeader.jsx` | The main header at the top of every section |
| `CurvedCard` | `common/CurvedCard.jsx` | Primary (dark gradient) KPI metric card |
| `KpiCard` | `charts/KpiCard.jsx` | Secondary (white) KPI metric cards |
| `StoreRankList` | `charts/StoreRankList.jsx` | Ranked list of stores/vendors with colored badges |
| `GroupedBarChart` | `charts/GroupedBarChart.jsx` | Side-by-side comparisons (e.g. SAP vs RFID) |
| `SemiDonutChart` | `charts/SemiDonutChart.jsx` | Single-value accuracy/progress gauge |
| `DonutChart` | `charts/DonutChart.jsx` | Multi-segment breakdown |
| `TimelineChart` | `charts/TimelineChart.jsx` | Hourly/time-block single-series bar chart |

- **NEVER** hardcode inline Recharts JSX (`<BarChart>`, `<PieChart>`, etc.) directly inside a section file. Always use the components above.
- **NEVER** use `DataTableCard` or `BaseDataTable` inside any dashboard section. Tables are for Report pages ONLY.
- Import shared layout CSS: `import '../../components/charts/DashboardSection.css';`

## Styling Rules
- Color palette: Primary `#1d4ed8`, Hover `#1e3a8a`, Light `#eff6ff`, Text `#0f172a`, Muted `#64748b`, Border `#f1f5f9`.
- All layout structure MUST use CSS class names from `DashboardSection.css` (`.ds-section`, `.ds-card`, `.ds-kpi-row`, `.ds-charts-row`, etc.).
- Do NOT use inline `style={{}}` for layout structure. Inline styles are only allowed for dynamic values (colors, calculated widths).

## Data Rules
- Every section's data hook already exists in `useDashboardData.js`. Do NOT create new `useState`/`useEffect` fetch calls.
- Available hooks: `useLiveStock`, `useCycleCount`, `useVendorDiscrepancy`, `useStoreDashboard`, `useSaleDashboard`, `useVoidDashboard`, `useReturnDashboard`, `useDcValidation`, `useTagCharts`, `useWarehouseEncoding`.
- Always format numeric values with `.toLocaleString('en-IN')` for Indian number formatting.
- Always handle three states in every section: `isLoading`, `error`, and empty `data` (length === 0).

## Edge Case Rules
- **Empty data**: Show a styled empty-state div with descriptive text, NOT the browser's default "No records found".
- **Large datasets (50+ items)**: Slice bar chart data to top 10 with `.slice(0, 10)`. Add a `(Top 10 stores)` subtitle to the chart card.
- **Long names**: All list item titles MUST use `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` with `title={fullName}` on the element.
- **Loading state**: Use shimmer skeleton boxes shaped like the section content, NOT a spinner icon.

## UI Creation & Consistency Rules (Old UI → New UI Protocol)
Whenever you are tasked with creating, refactoring, or extending ANY User Interface (UI) screen, page, or modal in this project, you MUST strictly adhere to the following 5-phase protocol:

1. **Never Build From Scratch (Mandatory Dual-Source Audit)**:
   - **Audit Source 1 — Legacy / Original Data Contract**: First inspect the legacy ASPX web forms or tabular app (`POS_Web_Application React`) or backend stored procedures (`SP_NEW_REPORT`, `SP_NEW_DASHBOARD`). Identify all required input filters (date ranges, store/vendor dropdowns), data table columns, numeric formats, and summary metrics returned via SQL `OUTPUT` parameters.
   - **Audit Source 2 — Canonical V2 Design System**: Inspect the corresponding canonical V2 implementation:
     - **For Report Pages**: Inspect `src/pages/Report/GrcReportPage.jsx` and `GrcReport.css`.
     - **For Dashboard Analytics Tabs**: Inspect `src/pages/Dashboard/sections/LiveStockSection.jsx` and `DashboardSection.css`.

2. **Strict Layout Archetypes**:
   - **Report Page Archetype**:
     - **Row 1 (Header & Filter Toolbar)**: Page title, `CustomDatePicker`, `SearchableDropdown` / `CustomDropdown`, search, clear, and export actions.
     - **Row 2 (KPI Summary Row)**: Quick metric badges displaying totals (e.g., Total Invoices, Total Qty, Discrepancy Amount).
     - **Row 3 (Data Table)**: Wrapped in `ReportDataTableCard` or `BaseDataTable` with sticky headers, search filtering, column sorting, pagination, and Indian number formatting (`.toLocaleString('en-IN')`).
   - **Dashboard Section Archetype**:
     - Follow the strict **3-Row Pattern**: KPI Row (`ds-kpi-row`) using `CurvedCard` and `KpiCard` → Charts Row (`ds-charts-row`) using `GroupedBarChart`, `SemiDonutChart`, `DonutChart`, `TimelineChart` → List Row using `StoreRankList`.
     - Data tables (`ReportDataTableCard` or `BaseDataTable`) are **strictly prohibited** in dashboard sections.

3. **Mandatory Component Reuse**:
   - Always reuse existing components from `src/components/common/` and `src/components/charts/`.
   - **NEVER** re-invent a date picker — use `CustomDatePicker`.
   - **NEVER** build standard select dropdowns — use `SearchableDropdown` or `CustomDropdown`.
   - **NEVER** use inline Recharts elements directly in page files — wrap charts in the designated reusable chart components.
   - **NEVER** use generic spinning loader icons — use `DashboardShimmer` styled to match the layout shape.

4. **Strict Flexbox Chart Constraints**:
   - Every responsive chart container must use `display: flex; flex-direction: column`.
   - Any scrolling element must have `flex: 1; min-height: 0; overflow: auto;` to prevent Recharts 0px height collapse or infinite expansion.

5. **Plan-First Scaffolding Gate**:
   - Never write code for a new UI immediately. First produce an implementation plan with an audit comparison table (Legacy UI vs. V2 Design Components) and obtain explicit user approval before writing JSX or CSS files.



# Project Knowledge & Architecture Context (For New Developers & Agents)

## Current Architecture & API Patterns
- **Frontend Fallbacks**: The React UI heavily relies on the `summary` block in API responses. For example, if 0 rows are returned, the UI expects `summary.storeName` and `summary.date` to be populated so the info bar can render the selected store's name.
- **SQL Server Casing Bugs**: The backend C# ADO.NET mapping uses `StringComparer.OrdinalIgnoreCase` when converting `SqlDataReader` to `Dictionary<string, object?>`. This is CRITICAL because the legacy SQL stored procedures (like `SP_NEW_DASHBOARD`) often return mixed-case columns (e.g., `Store_Name` instead of `STORE_NAME`). 

## Planned Features: RBAC (Role-Based Access Control)
- **Current Auth State**: `AuthController.cs` (`POST /api/auth/login`) currently validates users against `SP_Master` but **DOES NOT** issue a JWT token. Additionally, it currently blocks any user with `User_Type` of `"Store"` or `"Warehouse"`.
- **The RBAC Plan**: We are migrating to JWT-based auth. Once JWT is implemented, the backend services (like `LiveStockService.cs` and `ModernReportController.cs`) will extract the `User_Type` and `StoreCode` directly from the token's claims via `IHttpContextAccessor`.
- **Data Filtering Strategy**: Instead of creating 9 different APIs for Admins, Managers, and Billers, we will use **Parameter Interception**. If a Biller makes a request, the backend will dynamically override `request.StoreCode` with the StoreCode from their JWT token, forcing the SQL query to only return data for their assigned store. Admins will bypass this override.

## Project Context (Tabular vs Graphical V2)
- **`POS_Web_Application React` (Tabular App)**: This is the strict 1:1 replication of the legacy tabular UI. It is built with React + JSON + caching to solve legacy speed issues, but the UI itself must remain entirely tabular for power users. No new visual charts or complex dashboard designs should be introduced here.
- **`POS_Web_Application React V2` (Graphical App)**: This is the modern, management-facing dashboard. This project replaces massive datatables with high-level charts, KPI cards, and visual analytics using Recharts. It requires iterative design work and is a separate initiative from the tabular replication.
- **Rule of Thumb**: If you are working in a folder WITHOUT "V2" in the name, your priority is high-performance, strictly tabular data binding. If the folder HAS "V2", focus on modern dashboard charts and polished UI/UX aesthetics.

## Strict Flexbox Chart Constraints
When rendering responsive charts (especially with Recharts) inside flex containers, you MUST strictly pass flex constraints down the DOM tree to prevent collapsing or infinite expansion:
1. **Flex Chain**: The parent card/wrapper must have `display: flex; flex-direction: column`.
2. **Scroll Containers**: Any scrollable wrapper inside the flex container MUST use `flex: 1; min-height: 0` (or `min-width: 0` for rows). 
3. **Avoid height: 100% alone**: Never rely solely on `height: 100%` for a chart wrapper inside a flex item, as it will often collapse. Always use `flex: 1; min-height: 0`.
4. **Recharts ResponsiveContainer**: Ensure the `ResponsiveContainer` is wrapped in a rigidly constrained `flex: 1; min-height: 0` container. If the chart needs to scroll, apply `overflow: auto` to that specific wrapper.

## Frontend Deployment Pre-requisite
When the user asks to "/deploy" the frontend codebase or push changes to production, you MUST ALWAYS uncomment the 
`return <UnderDevelopmentPage />;` line within the "DEPLOYMENT TOGGLE" block in `src/pages/Login/LoginPage.jsx` before pushing the code. This ensures that the "Under Development" splash screen is active in production instead of the broken login page.



# Custom Slash Commands

## /deploy
When the user types /deploy or asks to deploy the frontend codebase:
1. Open `src/pages/Login/LoginPage.jsx`.
2. Find the 'DEPLOYMENT TOGGLE' block (around line 122).
3. Uncomment the line `return <UnderDevelopmentPage />;`.
4. Stage and commit the changes if instructed to push.
5. Provide a summary of the action taken.

## /update-docs or /sync-docs
When the user types `/update-docs`, `/sync-docs`, or asks to update/refresh the documentation:
1. **Scan the entire codebase** for any new technologies, libraries, components, hooks, services, CSS patterns, or architectural changes that are NOT yet documented in the `md/` folder.
2. **Update ALL relevant markdown files** inside `md/` to reflect the current state of the project. The 8 files to review and update are:
   - `md/01_PROBLEMS_AND_SOLUTIONS.md` — Add any new bugs encountered, approaches tried, and solutions applied.
   - `md/02_CHALLENGES_AND_FAQ.md` — Add Q&A entries for any new technology choices, trade-offs, or architectural decisions.
   - `md/03_WEBSOCKETS_AND_SIGNALR_GUIDE.md` — Update if any new SignalR channels, hubs, or real-time features were added.
   - `md/04_FRONTEND_COMPONENTS_AND_SYNTAX.md` — Add any new reusable components, design system tokens, or CSS rules.
   - `md/05_REACT_HOOKS_MASTERCLASS.md` — Add any new custom hooks or new usage patterns of existing hooks.
   - `md/06_PROJECT_FILE_MAP.md` — Update the file tree if any new files, folders, pages, or services were created.
   - `md/07_CSS_ANIMATIONS_AND_MICROINTERACTIONS.md` — Add any new animations, transitions, or micro-interaction patterns.
   - `md/08_UI_CREATION_AND_CONSISTENCY_PLAYBOOK.md` — Update canonical templates, archetype patterns, and component catalog.
   - `md/README.md` — Update the master index table and architecture diagram if changed.
3. **Preserve existing content** — do NOT delete or overwrite existing documented problems/solutions. Only ADD new entries or UPDATE outdated information.
4. **Use Mermaid flowcharts** for any new architectural explanations or data flow diagrams.
5. **Write for beginners** — all syntax examples should include line-by-line comments so a basic HTML/CSS developer can understand them.
6. **Report a summary** — after updating, list which files were modified and what was added.

## /new-ui
When the user types `/new-ui [ScreenName]` or asks to create a new user interface:
1. **Discovery & Archetype Classification**:
   - Determine whether the screen is a **Report Page** (tabular data, date range filter, store dropdown, export) or a **Dashboard Section** (management analytics, 3-row pattern, KPI cards, Recharts).
2. **Dual-Source Audit**:
   - **Audit Source 1 (Legacy / Source)**: Locate corresponding legacy ASPX forms, Tabular app code, or backend stored procedures (`SP_NEW_REPORT` / `SP_NEW_DASHBOARD`). List all required input filters, table columns, data formats, and SQL OUTPUT totals.
   - **Audit Source 2 (V2 Design System)**: Compare against canonical V2 reference files (`src/pages/Report/GrcReportPage.jsx` for reports, `src/pages/Dashboard/sections/LiveStockSection.jsx` for dashboard tabs).
3. **Strict Plan-First Gate**:
   - Create an `implementation_plan.md` artifact containing:
     - Audit Comparison Table (Legacy Filters/Columns ➔ V2 Reusable Components).
     - Component Tree & Hook mapping (`stockService.js`, `useDashboardData.js`).
     - Scoped CSS plan reusing `DashboardSection.css` or scoped styling tokens.
     - Routes to update in `src/App.jsx` and navigation items.
   - **STOP** and await explicit user review and approval before generating any code.
4. **Scaffold & Wire (Post-Approval Only)**:
   - Generate the component JSX and CSS adhering 100% to design system rules and Indian number formatting (`.toLocaleString('en-IN')`).
   - Wire API service calls or hooks with shimmer loading skeletons and `ErrorBoundary`.
   - Add route in `App.jsx` and link in Navigation / Tab bar.
   - Verify layout responsiveness and flexbox constraints.
